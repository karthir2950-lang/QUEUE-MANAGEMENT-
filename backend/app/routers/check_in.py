from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.check_in_token import CheckInToken, TokenStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.queue import QueueEntry, QueueStatus
from app.models.notification import NotificationType
from app.schemas.check_in import CheckInRequest, CheckInResponse
from app.routers.auth import get_current_user
from app.services.notification_service import NotificationService
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/check-in", tags=["Check-In"])

@router.post("", response_model=CheckInResponse)
async def process_check_in(
    request: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to process check-ins.")

    # 1. Validate Token
    token = db.query(CheckInToken).filter(CheckInToken.token_hash == request.check_in_token).first()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid check-in QR.")
        
    if token.status == TokenStatus.USED:
        raise HTTPException(status_code=400, detail="This QR code has already been used.")
        
    if token.status == TokenStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="This check-in token is cancelled.")
        
    if token.expires_at and token.expires_at < datetime.now():
        token.status = TokenStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="QR code has expired.")
        
    # 2. Find Appointment
    appt = db.query(Appointment).filter(Appointment.id == token.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    if appt.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="This appointment has been cancelled.")
        
    if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]:
        raise HTTPException(status_code=400, detail="This appointment is not eligible for check-in.")
        
    # 3. Time Validation
    now = datetime.now()
    if appt.appointment_date != now.date():
        raise HTTPException(status_code=400, detail="You can only check in on the day of your appointment.")
        
    appt_datetime = datetime.combine(appt.appointment_date, appt.appointment_time)
    window_start = appt_datetime - timedelta(minutes=30)
    
    if now < window_start:
        raise HTTPException(status_code=400, detail="You can only check in up to 30 minutes before your appointment time.")

    try:
        # Mark used
        token.status = TokenStatus.USED
        token.used_at = datetime.now()
        
        # Ensure queue entry is WAITING
        qe = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
        if not qe:
            qe = QueueEntry(
                appointment_id=appt.id,
                token_number=appt.token_number,
                queue_status=QueueStatus.WAITING
            )
            db.add(qe)
        else:
            qe.queue_status = QueueStatus.WAITING
            
        db.commit()
        db.refresh(qe)
        
        # Broadcast queue update
        update_event = {
            "type": "QUEUE_UPDATED",
            "branch_id": appt.branch_id
        }
        await manager.broadcast_to_branch(appt.branch_id, update_event)
        
        # Notify user
        await NotificationService.create_notification(
            db,
            user_id=appt.user_id,
            title="Check-in Successful",
            message=f"You have successfully checked in. Your token is {appt.token_number}.",
            type=NotificationType.CHECK_IN,
            appointment_id=appt.id
        )

        return CheckInResponse(
            message="Check-in successful",
            appointment_id=appt.id,
            booking_id=appt.booking_id,
            token_number=appt.token_number,
            queue_status=qe.queue_status.value,
            checked_in_at=token.used_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Check-in failed due to server error.")
