# AI DATA PIPELINE

1. **Extraction**:
   - Downloads public datasets to `backend/data/raw/`.
   - If blocked (e.g. Kaggle), requests manual download.
2. **Transformation**:
   - Reads raw CSVs via Pandas.
   - Cleans missing values.
   - Computes derived features (`is_weekend`, `day_of_week`).
   - Maps dataset-specific columns to Unified Schema.
3. **Unified Schema Generation**:
   - Saves processed output to `backend/data/processed/smartqueue_ai_training.csv`.
4. **Model Training**:
   - Loads `smartqueue_ai_training.csv`.
   - Replaces missing feature data with safe defaults (e.g., `average_service_time=15.0`).
   - Prevents Data Leakage by explicitly separating Target (`actual_wait_minutes`) from future events.
   - Splits Train/Test (80/20).
   - Trains `RandomForestRegressor`.
   - Saves model to `backend/app/ai/models/waiting_time_model.pkl`.
