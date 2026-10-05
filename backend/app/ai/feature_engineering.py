import pandas as pd
import numpy as np

def generate_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates ML features from raw historical data dataframe.
    This simulates computing features at the moment the queue was joined.
    """
    if df.empty:
        return df
        
    df = df.copy()
    df['joined_at'] = pd.to_datetime(df['joined_at'])
    df['hour'] = df['joined_at'].dt.hour
    df['day_of_week'] = df['joined_at'].dt.dayofweek
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
    
    # Define peak hours (e.g., 9-11 AM and 1-3 PM)
    df['is_peak_hour'] = df['hour'].isin([9, 10, 11, 13, 14, 15]).astype(int)
    
    # Note: Accurately reconstructing 'people_ahead' and 'staff_count' historically 
    # without a snapshot table is complex. We will approximate or use fixed values 
    # if historical snapshots aren't available in this demo.
    # For a real system, you'd want snapshot tables or window functions.
    # Here we will sort by branch, service and time, and calculate expanding means.
    
    df = df.sort_values(by=['branch_id', 'service_id', 'joined_at'])
    
    # Approximate historical people_ahead (this is simplified)
    df['people_ahead'] = np.random.randint(0, 10, size=len(df)) # Placeholder logic for historical reconstruction
    
    df['queue_size'] = df['people_ahead'] + np.random.randint(1, 5, size=len(df))
    df['average_service_time'] = 15.0 # default fallback
    df['staff_count'] = 2 # default fallback
    
    df['previous_average_wait'] = df.groupby(['branch_id', 'service_id'])['waiting_time_minutes'].transform(lambda x: x.shift().expanding().mean().fillna(15.0))
    df['completed_count_today'] = np.random.randint(0, 50, size=len(df))
    df['no_show_count_today'] = np.random.randint(0, 5, size=len(df))
    
    return df

def get_current_features(queue_id: int, db) -> dict:
    """
    Computes current features for real-time prediction.
    """
    from app.models.queue import QueueEntry, QueueStatus
    from sqlalchemy import func
    from datetime import datetime
    
    # Calculate real values
    entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not entry:
        return {}
        
    branch_id = entry.appointment.branch_id
    service_id = entry.appointment.service_id
    joined_at = entry.joined_at or datetime.utcnow()
    
    # People ahead
    people_ahead = db.query(QueueEntry).join(QueueEntry.appointment).filter(
        QueueEntry.queue_status == QueueStatus.WAITING,
        QueueEntry.joined_at < joined_at,
        QueueEntry.appointment.has(branch_id=branch_id, service_id=service_id)
    ).count()
    
    # Queue size (all waiting or called for this service)
    queue_size = db.query(QueueEntry).join(QueueEntry.appointment).filter(
        QueueEntry.queue_status.in_([QueueStatus.WAITING, QueueStatus.CALLED]),
        QueueEntry.appointment.has(branch_id=branch_id, service_id=service_id)
    ).count()
    
    # Staff count (dummy for now)
    staff_count = 2
    
    # Average service time (from service)
    avg_service_time = entry.appointment.service.average_service_time or 15.0
    
    hour = joined_at.hour
    day_of_week = joined_at.weekday()
    is_weekend = int(day_of_week in [5, 6])
    is_peak_hour = int(hour in [9, 10, 11, 13, 14, 15])
    
    features = {
        'people_ahead': people_ahead,
        'queue_size': queue_size,
        'average_service_time': float(avg_service_time),
        'staff_count': staff_count,
        'hour': hour,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'is_peak_hour': is_peak_hour,
        'service_id': service_id,
        'branch_id': branch_id,
        'previous_average_wait': float(avg_service_time),
        'completed_count_today': 0,
        'no_show_count_today': 0
    }
    
    # Sector specific variables
    sector_val = "HEALTHCARE"
    org = entry.appointment.branch.organization
    if org:
        sector_val = org.sector.value
        
    if sector_val == "HEALTHCARE":
        features['doctor_count'] = staff_count
        features['consultation_duration'] = float(avg_service_time)
    elif sector_val == "BANK":
        features['active_counters'] = staff_count
        features['counter_workload'] = queue_size * float(avg_service_time)
    elif sector_val == "SALON":
        features['stylist_count'] = staff_count
        features['service_duration'] = float(avg_service_time)
    elif sector_val == "SERVICE_CENTER":
        features['technician_count'] = staff_count
        features['repair_complexity'] = 2.0  # Placeholder for demo
    elif sector_val == "GOVERNMENT":
        features['department_workload'] = queue_size
        features['application_volume'] = queue_size + 10
    elif sector_val == "CLINIC":
        features['doctor_workload'] = queue_size
        features['consultation_duration'] = float(avg_service_time)

    return features
