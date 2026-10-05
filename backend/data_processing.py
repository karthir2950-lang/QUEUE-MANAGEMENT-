import pandas as pd
import numpy as np
import os

os.makedirs('backend/data/processed/apollo', exist_ok=True)

# 1. Load Apollo Data
df_apollo = pd.read_csv('backend/data/raw/apollo/data/apollo_appointments_fact.csv')

# 2. Validation & Processing
# Map to apollo_processed.csv
df_apollo_processed = df_apollo[[
    'appointment_hour', 'appointment_day_of_week', 'specialty', 'appointment_type',
    'booking_channel', 'wait_time_minutes', 'consultation_duration_min',
    'doctor_utilization_pct', 'appointment_status', 'no_show', 'hospital_name'
]].copy()

# Add standard fields
df_apollo_processed['day_of_week'] = df_apollo_processed['appointment_day_of_week']
df_apollo_processed['is_weekend'] = df_apollo_processed['day_of_week'].isin(['Saturday', 'Sunday', 6, 7]).astype(int)

df_apollo_processed.to_csv('backend/data/processed/apollo/apollo_processed.csv', index=False)

# 3. Create unified schema smartqueue_ai_training.csv
df_unified = pd.DataFrame({
    'sector': 'HEALTHCARE',
    'source_dataset': 'APOLLO',
    'service_type': df_apollo_processed['specialty'],
    'branch_id': None,
    'service_id': None,
    'appointment_hour': df_apollo_processed['appointment_hour'],
    'day_of_week': df_apollo_processed['day_of_week'],
    'is_weekend': df_apollo_processed['is_weekend'],
    'peak_hour': None,
    'people_ahead': None,
    'queue_size': None,
    'active_staff_count': None,
    'active_counter_count': None,
    'average_service_time': df_apollo_processed['consultation_duration_min'],
    'historical_average_wait': None,
    'service_duration': df_apollo_processed['consultation_duration_min'],
    'no_show': df_apollo_processed['no_show'],
    'actual_wait_minutes': df_apollo_processed['wait_time_minutes'],
    'target_available': df_apollo_processed['wait_time_minutes'].notnull()
})

# Filter out rows where wait_time is null for training wait_time predictor
df_unified = df_unified[df_unified['target_available'] == True]

df_unified.to_csv('backend/data/processed/smartqueue_ai_training.csv', index=False)

print(f"Apollo processed rows: {len(df_apollo_processed)}")
print(f"Unified rows: {len(df_unified)}")
