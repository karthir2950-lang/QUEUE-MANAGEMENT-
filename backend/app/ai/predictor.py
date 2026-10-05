import pandas as pd
from app.ai.model_manager import get_model, get_model_metadata, is_model_available
from app.ai.feature_engineering import get_current_features

def predict_waiting_time(queue_id: int, db) -> dict:
    features = get_current_features(queue_id, db)
    if not features:
        return {
            "estimated_wait_minutes": 15,
            "prediction_source": "FALLBACK"
        }
        
    fallback_wait = max(1, int(features['people_ahead'] * features['average_service_time']))
    
    if not is_model_available():
        return {
            "estimated_wait_minutes": fallback_wait,
            "prediction_source": "FALLBACK"
        }
        
    try:
        model = get_model()
        metadata = get_model_metadata()
        
        # Prepare input df matching feature columns exactly
        feature_cols = metadata['features']
        input_data = {col: [features.get(col, 0)] for col in feature_cols}
        X_input = pd.DataFrame(input_data)
        
        pred = model.predict(X_input)[0]
        
        # Sanity limit: prediction should be non-negative and somewhat reasonable
        pred = max(1, int(round(pred)))
        if pred > 300: # Max 5 hours sanity limit
            pred = 300
            
        return {
            "estimated_wait_minutes": pred,
            "prediction_source": "ML",
            "model_version": metadata.get('version', 'v1')
        }
    except Exception as e:
        print(f"Prediction failed: {e}")
        return {
            "estimated_wait_minutes": fallback_wait,
            "prediction_source": "FALLBACK"
        }
