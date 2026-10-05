import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

from app.database.connection import SessionLocal
from app.ai.data_preparation import load_queue_history
from app.ai.feature_engineering import generate_features

def train():
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_dir, 'data', 'processed', 'smartqueue_ai_training.csv')
    
    if os.path.exists(csv_path):
        print(f"Loading training data from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # Ensure we don't have NaNs in essential target
        df = df[df['actual_wait_minutes'].notnull()]
        
        # Fill missing features logically
        df['people_ahead'] = df['people_ahead'].fillna(pd.Series(np.random.randint(0, 10, size=len(df)), index=df.index))
        df['queue_size'] = df['queue_size'].fillna(df['people_ahead'] + pd.Series(np.random.randint(1, 5, size=len(df)), index=df.index))
        df['average_service_time'] = df['average_service_time'].fillna(15.0)
        df['staff_count'] = df['active_staff_count'].fillna(2.0)
        
        df['hour'] = df['appointment_hour'].fillna(12).astype(int)
        df['day_of_week'] = df['day_of_week'].fillna(0).apply(lambda x: 0 if isinstance(x, str) else int(x))
        df['is_weekend'] = df['is_weekend'].fillna(0).astype(int)
        df['is_peak_hour'] = df['hour'].isin([9, 10, 11, 13, 14, 15]).astype(int)
        
        df['service_id'] = df['service_id'].fillna(1).astype(int)
        df['branch_id'] = df['branch_id'].fillna(1).astype(int)
        df['previous_average_wait'] = df['historical_average_wait'].fillna(df['average_service_time'])
        
        df['completed_count_today'] = np.random.randint(0, 50, size=len(df))
        df['no_show_count_today'] = df['no_show'].apply(lambda x: 1 if x == 'Yes' else 0)
        
        df_features = df.copy()
        df_features['waiting_time_minutes'] = df['actual_wait_minutes']
        
    else:
        print("CSV not found, falling back to DB historical data...")
        db = SessionLocal()
        df = load_queue_history(db)
        db.close()
        
        if len(df) < 50:
            print("Insufficient historical data for ML prediction.")
            print(f"Only {len(df)} records found. Need at least 50 valid completed queue records.")
            return
            
        print(f"Loaded {len(df)} historical queue records.")
        print("Generating features...")
        df_features = generate_features(df)
    
    features = [
        'people_ahead', 'queue_size', 'average_service_time', 'staff_count', 
        'hour', 'day_of_week', 'is_weekend', 'is_peak_hour', 
        'service_id', 'branch_id', 'previous_average_wait',
        'completed_count_today', 'no_show_count_today'
    ]
    target = 'waiting_time_minutes'
    
    X = df_features[features]
    y = df_features[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    
    print(f"Training size: {len(X_train)}")
    print(f"Testing size: {len(X_test)}")
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    # Baseline comparison
    baseline_pred = X_test['people_ahead'] * X_test['average_service_time']
    baseline_mae = mean_absolute_error(y_test, baseline_pred)
    
    print("\n================ E V A L U A T I O N ================")
    print(f"MAE:  {mae:.2f} minutes")
    print(f"RMSE: {rmse:.2f} minutes")
    print(f"R²:   {r2:.2f}")
    print(f"Baseline MAE: {baseline_mae:.2f} minutes")
    print("=====================================================")
    
    os.makedirs(os.path.join(os.path.dirname(__file__), 'models'), exist_ok=True)
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'waiting_time_model.pkl')
    
    metadata = {
        'version': 'v1',
        'features': features,
        'metrics': {
            'mae': float(mae),
            'rmse': float(rmse),
            'r2': float(r2),
            'baseline_mae': float(baseline_mae)
        },
        'training_records': len(df)
    }
    
    joblib.dump({'model': model, 'metadata': metadata}, model_path)
    print(f"Model saved successfully to {model_path}.")

if __name__ == "__main__":
    train()
