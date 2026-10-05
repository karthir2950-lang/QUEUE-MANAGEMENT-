from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type
from app.database.connection import get_db
from app.auth.dependencies import get_current_user, require_user, require_staff, require_admin
from app.models.user import User, UserRole
from app.models.queue import QueueEntry, QueueStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.staff import Staff
from app.schemas.queue import QueueResponse, QueueListResponse
from sqlalchemy import and_, or_, asc
from app.websocket.connection_manager import manager
from sqlalchemy.sql import func
from app.ai.predictor import predict_waiting_time
import asyncio
from app.database.connection import SessionLocal
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

router = APIRouter(prefix="/queue", tags=["Queue"])

def get_people_ahead(db: Session, queue_entry: QueueEntry) -> int:
    return db.query(QueueEntry).join(Appointment).filter(
        Appointment.branch_id == queue_entry.appointment.branch_id,
        Appointment.service_id == queue_entry.appointment.service_id,
        Appointment.appointment_date == queue_entry.appointment.appointment_date,
        QueueEntry.queue_status == QueueStatus.WAITING,
        or_(
            Appointment.appointment_time < queue_entry.appointment.appointment_time,
            and_(
                Appointment.appointment_time == queue_entry.appointment.appointment_time,
                QueueEntry.joined_at < queue_entry.joined_at
            ),
            and_(
                Appointment.appointment_time == queue_entry.appointment.appointment_time,
                QueueEntry.joined_at == queue_entry.joined_at,
                QueueEntry.id < queue_entry.id
            )
        )
    ).count()

async def trigger_broadcast(event_type: str, queue_id: int, branch_id: int, current_token: str, people_waiting: int, user_id: Optional[int] = None, token_number: Optional[str] = None):
    # Base event
    base_event = {
        "type": event_type,
        "queue_id": queue_id,
        "current_token": current_token,
        "people_waiting": people_waiting
    }
    update_event = {
        "type": "QUEUE_UPDATED",
        "queue_id": queue_id,
        "current_token": current_token,
        "people_waiting": people_waiting
    }
    
    # Broadcast general updates
    await manager.broadcast_to_branch(branch_id, base_event)
    await manager.broadcast_to_branch(branch_id, update_event)
    await manager.broadcast_to_admin(base_event)
    await manager.broadcast_to_admin(update_event)
    
    # Also broadcast to the specific queue room so the user's page refreshes
    await manager.broadcast_to_queue(queue_id, update_event)

        # If it's a call event and we know the user
    if event_type == "TOKEN_CALLED" and user_id and token_number:
        your_turn_event = {
            "type": "YOUR_TURN",
            "queue_id": queue_id,
            "token_number": token_number
        }
        await manager.send_personal_message(user_id, your_turn_event)
        
async def process_queue_notifications(event_type: str, queue_id: int, user_id: Optional[int], token_number: Optional[str], branch_id: int, service_id: int, appt_date: date_type):
    db = SessionLocal()
    try:
        from app.models.branch import Branch
        from app.models.organization import Organization
        branch = db.query(Branch).filter(Branch.id == branch_id).first()
        sector_val = "HEALTHCARE"
        if branch:
            org = db.query(Organization).filter(Organization.id == branch.organization_id).first()
            if org:
                sector_val = org.sector.value
                
        def get_call_message(sector: str, token: str):
            if sector == "HEALTHCARE": return f"Your doctor is ready for token {token}. Please proceed to the doctor's room."
            if sector == "BANK": return f"The counter is ready for your token {token}."
            if sector == "GOVERNMENT": return f"Please proceed to document verification for token {token}."
            if sector == "SALON": return f"Your stylist is ready for token {token}."
            if sector == "SERVICE_CENTER": return f"Your device is ready for service for token {token}."
            if sector == "CLINIC": return f"Your doctor is ready for token {token}."
            return f"Your token {token} has been called. Please proceed."
            
        def get_approaching_message(sector: str):
            if sector in ["HEALTHCARE", "CLINIC"]: return "Your doctor consultation is approaching."
            if sector == "BANK": return "Your turn at the bank is approaching."
            if sector == "GOVERNMENT": return "Your document verification is approaching."
            if sector == "SALON": return "Your stylist appointment is approaching."
            if sector == "SERVICE_CENTER": return "Your service turn is approaching."
            return "Your turn is approaching."

        if event_type == "TOKEN_CALLED" and user_id:
            await NotificationService.create_notification(
                db,
                user_id=user_id,
                title="Your Turn",
                message=get_call_message(sector_val, token_number),
                type=NotificationType.QUEUE,
                queue_id=queue_id
            )
            
        # Check approaching users (e.g. people_ahead <= 2)
        if event_type in ["TOKEN_CALLED", "SERVICE_COMPLETED", "TOKEN_CANCELLED", "TOKEN_NO_SHOW"]:
            waiting_entries = db.query(QueueEntry).join(Appointment).filter(
                Appointment.branch_id == branch_id,
                Appointment.service_id == service_id,
                Appointment.appointment_date == appt_date,
                QueueEntry.queue_status == QueueStatus.WAITING
            ).order_by(Appointment.appointment_time.asc(), QueueEntry.joined_at.asc(), QueueEntry.id.asc()).all()
            
            for idx, entry in enumerate(waiting_entries):
                if idx <= 2: # people_ahead is idx
                    await NotificationService.create_notification(
                        db,
                        user_id=entry.appointment.user_id,
                        title="Approaching Turn",
                        message=get_approaching_message(sector_val),
                        type=NotificationType.QUEUE,
                        queue_id=entry.id
                    )
    finally:
        db.close()


def helper_get_queue_stats(db: Session, branch_id: int, service_id: int, date: date_type):
    # current token
    current_serving = db.query(QueueEntry).join(Appointment).filter(
        Appointment.branch_id == branch_id,
        Appointment.service_id == service_id,
        Appointment.appointment_date == date,
        QueueEntry.queue_status == QueueStatus.SERVING
    ).order_by(QueueEntry.started_at.desc()).first()
    
    current_token = current_serving.token_number if current_serving else "---"
    
    # people waiting
    people_waiting = db.query(QueueEntry).join(Appointment).filter(
        Appointment.branch_id == branch_id,
        Appointment.service_id == service_id,
        Appointment.appointment_date == date,
        QueueEntry.queue_status == QueueStatus.WAITING
    ).count()
    
    return current_token, people_waiting

@router.get("/{queue_id}", response_model=QueueResponse)
def get_queue(queue_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    if current_user.role == UserRole.USER:
        if queue_entry.appointment.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    people_ahead = 0
    estimated_wait_time = 0
    prediction_source = None
    
    if queue_entry.queue_status == QueueStatus.WAITING:
        people_ahead = get_people_ahead(db, queue_entry)
        prediction = predict_waiting_time(queue_entry.id, db)
        estimated_wait_time = prediction['estimated_wait_minutes']
        prediction_source = prediction['prediction_source']

    current_token, _ = helper_get_queue_stats(db, queue_entry.appointment.branch_id, queue_entry.appointment.service_id, queue_entry.appointment.appointment_date)
    
    # Fallback to last called if no one serving
    if current_token == "---":
        last_called = db.query(QueueEntry).join(Appointment).filter(
            Appointment.branch_id == queue_entry.appointment.branch_id,
            Appointment.service_id == queue_entry.appointment.service_id,
            Appointment.appointment_date == queue_entry.appointment.appointment_date,
            QueueEntry.queue_status == QueueStatus.CALLED
        ).order_by(QueueEntry.called_at.desc()).first()
        if last_called:
            current_token = last_called.token_number
        else:
            current_token = None

    return {
        "queue_id": queue_entry.id,
        "service": queue_entry.appointment.service.name,
        "organization": queue_entry.appointment.branch.organization.name,
        "branch": queue_entry.appointment.branch.name,
        "current_token": current_token,
        "your_token": queue_entry.token_number,
        "queue_status": queue_entry.queue_status,
        "people_ahead": people_ahead,
        "estimated_wait_time": estimated_wait_time,
        "prediction_source": prediction_source,
        "appointment": queue_entry.appointment,
        "joined_at": queue_entry.joined_at,
        "called_at": queue_entry.called_at,
        "started_at": queue_entry.started_at,
        "completed_at": queue_entry.completed_at
    }

@router.get("", response_model=List[QueueListResponse])
def get_queue_list(
    branch_id: Optional[int] = None,
    service_id: Optional[int] = None,
    date: Optional[date_type] = None,
    queue_status: Optional[QueueStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QueueEntry).join(Appointment)

    if current_user.role == UserRole.USER:
        query = query.filter(Appointment.user_id == current_user.id)
    elif current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile:
            return []
        query = query.filter(Appointment.branch_id == staff_profile.branch_id)
        if staff_profile.service_id:
            query = query.filter(Appointment.service_id == staff_profile.service_id)
    
    if branch_id and current_user.role == UserRole.ADMIN:
        query = query.filter(Appointment.branch_id == branch_id)
    if service_id and current_user.role == UserRole.ADMIN:
        query = query.filter(Appointment.service_id == service_id)
    if date:
        query = query.filter(Appointment.appointment_date == date)
    if queue_status:
        query = query.filter(QueueEntry.queue_status == queue_status)

    entries = query.order_by(
        Appointment.appointment_date.asc(),
        Appointment.appointment_time.asc(),
        QueueEntry.joined_at.asc(),
        QueueEntry.id.asc()
    ).all()
    
    return [
        {
            "id": entry.id,
            "token_number": entry.token_number,
            "customer_name": entry.appointment.user.name,
            "service_name": entry.appointment.service.name,
            "appointment_time": entry.appointment.appointment_time,
            "queue_status": entry.queue_status,
            "joined_at": entry.joined_at,
            "called_at": entry.called_at,
            "started_at": entry.started_at,
            "completed_at": entry.completed_at
        } for entry in entries
    ]

@router.post("/{queue_id}/next")
def call_next(queue_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).with_for_update().first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    staff_profile = None
    if current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id or staff_profile.service_id != queue_entry.appointment.service_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    next_entry = db.query(QueueEntry).join(Appointment).filter(
        Appointment.branch_id == queue_entry.appointment.branch_id,
        Appointment.service_id == queue_entry.appointment.service_id,
        Appointment.appointment_date == queue_entry.appointment.appointment_date,
        QueueEntry.queue_status == QueueStatus.WAITING
    ).order_by(
        Appointment.appointment_time.asc(),
        QueueEntry.joined_at.asc(),
        QueueEntry.id.asc()
    ).with_for_update().first()

    if not next_entry:
        raise HTTPException(status_code=404, detail="No waiting customers")

    next_entry.queue_status = QueueStatus.CALLED
    next_entry.called_at = func.now()
    
    branch_id = next_entry.appointment.branch_id
    service_id = next_entry.appointment.service_id
    appt_date = next_entry.appointment.appointment_date
    uid = next_entry.appointment.user_id
    tok = next_entry.token_number
    nxt_id = next_entry.id
    
    db.commit()
    db.refresh(next_entry)

    # Get updated stats for broadcast
    ct, pw = helper_get_queue_stats(db, branch_id, service_id, appt_date)
    background_tasks.add_task(trigger_broadcast, "TOKEN_CALLED", nxt_id, branch_id, tok, pw, uid, tok)
    background_tasks.add_task(process_queue_notifications, "TOKEN_CALLED", nxt_id, uid, tok, branch_id, service_id, appt_date)

    return {
        "token_number": next_entry.token_number,
        "queue_status": next_entry.queue_status,
        "customer_name": next_entry.appointment.user.name,
        "service_name": next_entry.appointment.service.name
    }

@router.put("/{queue_id}/start")
def start_service(queue_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    if current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id or staff_profile.service_id != queue_entry.appointment.service_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    if queue_entry.queue_status != QueueStatus.CALLED:
        raise HTTPException(status_code=400, detail="Invalid transition: Must be CALLED to start")

    queue_entry.queue_status = QueueStatus.SERVING
    queue_entry.started_at = func.now()
    
    branch_id = queue_entry.appointment.branch_id
    service_id = queue_entry.appointment.service_id
    appt_date = queue_entry.appointment.appointment_date
    tok = queue_entry.token_number
    q_id = queue_entry.id
    
    db.commit()
    db.refresh(queue_entry)
    
    from app.models.prediction_log import PredictionLog
    logs = db.query(PredictionLog).filter(PredictionLog.queue_entry_id == q_id, PredictionLog.actual_wait_minutes.is_(None)).all()
    if logs and queue_entry.joined_at and queue_entry.started_at:
        wait_time = (queue_entry.started_at - queue_entry.joined_at).total_seconds() / 60.0
        for log in logs:
            log.actual_wait_minutes = wait_time
        db.commit()
        
    ct, pw = helper_get_queue_stats(db, branch_id, service_id, appt_date)
    background_tasks.add_task(trigger_broadcast, "SERVICE_STARTED", q_id, branch_id, tok, pw)
    background_tasks.add_task(process_queue_notifications, "SERVICE_STARTED", q_id, queue_entry.appointment.user_id, tok, branch_id, service_id, appt_date)

    return {"message": "Service started", "queue_status": queue_entry.queue_status}

@router.put("/{queue_id}/complete")
def complete_service(queue_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    if current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id or staff_profile.service_id != queue_entry.appointment.service_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    if queue_entry.queue_status != QueueStatus.SERVING:
        raise HTTPException(status_code=400, detail="Invalid transition: Must be SERVING to complete")

    queue_entry.queue_status = QueueStatus.COMPLETED
    queue_entry.completed_at = func.now()
    queue_entry.appointment.status = AppointmentStatus.COMPLETED
    
    branch_id = queue_entry.appointment.branch_id
    service_id = queue_entry.appointment.service_id
    appt_date = queue_entry.appointment.appointment_date
    tok = queue_entry.token_number
    q_id = queue_entry.id
    
    db.commit()
    db.refresh(queue_entry)
    
    ct, pw = helper_get_queue_stats(db, branch_id, service_id, appt_date)
    background_tasks.add_task(trigger_broadcast, "SERVICE_COMPLETED", q_id, branch_id, ct, pw)
    background_tasks.add_task(process_queue_notifications, "SERVICE_COMPLETED", q_id, queue_entry.appointment.user_id, tok, branch_id, service_id, appt_date)

    return {"message": "Service completed", "queue_status": queue_entry.queue_status}

@router.put("/{queue_id}/no-show")
def no_show_service(queue_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    if current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id or staff_profile.service_id != queue_entry.appointment.service_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    if queue_entry.queue_status not in [QueueStatus.WAITING, QueueStatus.CALLED]:
        raise HTTPException(status_code=400, detail="Invalid transition: Must be WAITING or CALLED")

    queue_entry.queue_status = QueueStatus.NO_SHOW
    queue_entry.appointment.status = AppointmentStatus.NO_SHOW
    
    branch_id = queue_entry.appointment.branch_id
    service_id = queue_entry.appointment.service_id
    appt_date = queue_entry.appointment.appointment_date
    q_id = queue_entry.id
    
    db.commit()
    db.refresh(queue_entry)
    
    ct, pw = helper_get_queue_stats(db, branch_id, service_id, appt_date)
    background_tasks.add_task(trigger_broadcast, "TOKEN_NO_SHOW", q_id, branch_id, ct, pw)
    background_tasks.add_task(process_queue_notifications, "TOKEN_NO_SHOW", q_id, queue_entry.appointment.user_id, queue_entry.token_number, branch_id, service_id, appt_date)
    
    return {"message": "Marked as no-show", "queue_status": queue_entry.queue_status}

@router.put("/{queue_id}/cancel")
def cancel_queue(queue_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
    if not queue_entry:
        raise HTTPException(status_code=404, detail="Queue not found")

    if current_user.role == UserRole.USER:
        if queue_entry.appointment.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == UserRole.STAFF:
        staff_profile = db.query(Staff).filter(Staff.user_id == current_user.id).first()
        if not staff_profile or staff_profile.branch_id != queue_entry.appointment.branch_id or staff_profile.service_id != queue_entry.appointment.service_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    if queue_entry.queue_status != QueueStatus.WAITING:
        raise HTTPException(status_code=400, detail="Invalid transition: Must be WAITING to cancel")

    queue_entry.queue_status = QueueStatus.CANCELLED
    queue_entry.appointment.status = AppointmentStatus.CANCELLED
    
    branch_id = queue_entry.appointment.branch_id
    service_id = queue_entry.appointment.service_id
    appt_date = queue_entry.appointment.appointment_date
    q_id = queue_entry.id
    
    db.commit()
    db.refresh(queue_entry)
    
    ct, pw = helper_get_queue_stats(db, branch_id, service_id, appt_date)
    background_tasks.add_task(trigger_broadcast, "TOKEN_CANCELLED", q_id, branch_id, ct, pw)
    background_tasks.add_task(process_queue_notifications, "TOKEN_CANCELLED", q_id, queue_entry.appointment.user_id, queue_entry.token_number, branch_id, service_id, appt_date)
    
    return {"message": "Queue cancelled", "queue_status": queue_entry.queue_status}
