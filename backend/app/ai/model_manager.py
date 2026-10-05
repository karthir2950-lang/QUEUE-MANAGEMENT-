import os
import joblib

_model = None
_metadata = None

def load_model():
    global _model, _metadata
    if _model is not None:
        return True
        
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'waiting_time_model.pkl')
    if not os.path.exists(model_path):
        return False
        
    try:
        data = joblib.load(model_path)
        _model = data['model']
        _metadata = data['metadata']
        return True
    except Exception as e:
        print(f"Failed to load model: {e}")
        return False

def is_model_available():
    if _model is None:
        load_model()
    return _model is not None

def get_model():
    if not is_model_available():
        return None
    return _model

def get_model_metadata():
    if not is_model_available():
        return None
    return _metadata
