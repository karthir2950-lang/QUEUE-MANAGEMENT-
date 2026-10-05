from sqlalchemy.orm import Session
import pandas as pd
from app.models.queue import QueueEntry, QueueStatus
from datetime import datetime

def load_queue_history(db: Session) -> pd.DataFrame:
    """
    Loads historical queue data from the database.
    Only includes COMPLETED entries that have both joined_at and started_at timestamps.
    """
    entries = db.query(QueueEntry).filter(
        QueueEntry.queue_status == QueueStatus.COMPLETED,
        QueueEntry.joined_at.isnot(None),
        QueueEntry.started_at.isnot(None)
    ).all()
    
    data = []
    for entry in entries:
        wait_time = (entry.started_at - entry.joined_at).total_seconds() / 60.0
        if wait_time < 0:
            continue
            
        data.append({
            'id': entry.id,
            'branch_id': entry.appointment.branch_id,
            'service_id': entry.appointment.service_id,
            'joined_at': entry.joined_at,
            'started_at': entry.started_at,
            'appointment_time': entry.appointment.appointment_time,
            'waiting_time_minutes': wait_time
        })
        
    df = pd.DataFrame(data)
    return df
