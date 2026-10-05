from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.queue import QueueEntry
from app.ai.predictor import predict_waiting_time

router = APIRouter(prefix="/ai", tags=["AI"])

@router.get("/waiting-time/{queue_id}")
def get_waiting_time(
    queue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
        
    # Check permissions - user can see own, staff/admin can see any
    if current_user.role.value == "USER" and entry.appointment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this queue")
        
    prediction = predict_waiting_time(queue_id, db)
    
    # Optional: Log the prediction
    from app.models.prediction_log import PredictionLog
    log = PredictionLog(
        queue_entry_id=queue_id,
        predicted_wait_minutes=prediction['estimated_wait_minutes'],
        prediction_source=prediction['prediction_source'],
        model_version=prediction.get('model_version')
    )
    db.add(log)
    db.commit()
    
    return {
        "data": {
            "queue_id": queue_id,
            "token_number": entry.token_number,
            "people_ahead": db.query(QueueEntry).filter(
                QueueEntry.queue_status == "WAITING",
                QueueEntry.joined_at < entry.joined_at,
                QueueEntry.appointment.has(branch_id=entry.appointment.branch_id, service_id=entry.appointment.service_id)
            ).count() if entry.joined_at else 0,
            "estimated_wait_minutes": prediction['estimated_wait_minutes'],
            "prediction_source": prediction['prediction_source'],
            "model_version": prediction.get('model_version')
        }
    }

@router.get("/analytics")
def get_ai_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin only")
        
    from app.models.prediction_log import PredictionLog
    from sqlalchemy.sql import func
    
    # Calculate stats
    stats = db.query(
        func.avg(PredictionLog.predicted_wait_minutes).label("avg_predicted"),
        func.avg(PredictionLog.actual_wait_minutes).label("avg_actual"),
        func.count(PredictionLog.id).label("total_predictions")
    ).filter(PredictionLog.actual_wait_minutes.isnot(None)).first()
    
    if not stats or not stats.total_predictions or stats.total_predictions < 10:
        return {"data": {"status": "insufficient_data"}}
        
    # Calculate MAE in Python for simplicity
    logs = db.query(PredictionLog).filter(PredictionLog.actual_wait_minutes.isnot(None)).all()
    mae = sum(abs(l.predicted_wait_minutes - l.actual_wait_minutes) for l in logs) / len(logs)
    
    return {
        "data": {
            "status": "available",
            "avg_predicted_wait": float(stats.avg_predicted or 0),
            "avg_actual_wait": float(stats.avg_actual or 0),
            "mae": float(mae),
            "total_predictions": stats.total_predictions
        }
    }
