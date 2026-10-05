from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.education_counter import EducationCounter, CounterStatus
from app.models.branch import Branch
from app.models.service import Service
from app.models.staff import Staff
from app.models.queue import QueueEntry, QueueStatus
from app.models.appointment import Appointment
from app.schemas.education_counter import CounterCreate, CounterUpdate, CounterResponse

router = APIRouter(prefix="/education", tags=["Education"])

def map_counter_response(c: EducationCounter, db: Session) -> CounterResponse:
    branch_name = db.query(Branch.name).filter(Branch.id == c.branch_id).scalar()
    service_name = db.query(Service.name).filter(Service.id == c.service_id).scalar()
    staff_name = None
    if c.staff_id:
        staff_name = db.query(User.name).join(Staff).filter(Staff.id == c.staff_id).scalar()
        
    return CounterResponse(
        id=c.id,
        branch_id=c.branch_id,
        service_id=c.service_id,
        staff_id=c.staff_id,
        counter_number=c.counter_number,
        counter_name=c.counter_name,
        counter_type=c.counter_type,
        status=c.status,
        current_token=c.current_token,
        created_at=c.created_at,
        updated_at=c.updated_at,
        branch_name=branch_name,
        service_name=service_name,
        staff_name=staff_name
    )

@router.get("/counters", response_model=List[CounterResponse])
def get_counters(
    branch_id: Optional[int] = None,
    service_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EducationCounter)
    if branch_id:
        query = query.filter(EducationCounter.branch_id == branch_id)
    if service_id:
        query = query.filter(EducationCounter.service_id == service_id)
        
    counters = query.all()
    return [map_counter_response(c, db) for c in counters]

@router.post("/counters", response_model=CounterResponse)
def create_counter(
    data: CounterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    # Check duplicate counter_number in branch
    exists = db.query(EducationCounter).filter(
        EducationCounter.branch_id == data.branch_id,
        EducationCounter.counter_number == data.counter_number
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Counter number already exists in this branch.")
        
    c = EducationCounter(**data.dict())
    db.add(c)
    db.commit()
    db.refresh(c)
    return map_counter_response(c, db)

@router.put("/counters/{id}", response_model=CounterResponse)
def update_counter(
    id: int,
    data: CounterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    c = db.query(EducationCounter).filter(EducationCounter.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Counter not found")
        
    if data.staff_id is not None:
        c.staff_id = data.staff_id
    if data.counter_type is not None:
        c.counter_type = data.counter_type
    if data.status is not None:
        c.status = data.status
    if data.current_token is not None:
        c.current_token = data.current_token
        
    db.commit()
    db.refresh(c)
    return map_counter_response(c, db)

@router.delete("/counters/{id}")
def delete_counter(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    c = db.query(EducationCounter).filter(EducationCounter.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Counter not found")
        
    db.delete(c)
    db.commit()
    return {"message": "Counter deleted successfully"}

@router.post("/counters/{id}/assign")
async def assign_counter(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # This endpoint gets the next waiting token for the counter's service and branch and assigns it.
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    c = db.query(EducationCounter).filter(EducationCounter.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Counter not found")
        
    if c.status != CounterStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Counter is not available to assign.")
        
    # Find next WAITING token for this branch and service
    next_qe = db.query(QueueEntry).join(Appointment).filter(
        Appointment.branch_id == c.branch_id,
        Appointment.service_id == c.service_id,
        QueueEntry.queue_status == QueueStatus.WAITING
    ).order_by(QueueEntry.joined_at.asc()).first()
    
    if not next_qe:
        return {"message": "No token is currently waiting.", "assigned": False}
        
    # Assign token
    c.current_token = next_qe.token_number
    next_qe.queue_status = QueueStatus.CALLED
    next_qe.called_at = func.now()
    
    db.commit()
    
    # WebSocket and Notification logic here...
    from app.websocket.queue_websocket import manager
    await manager.broadcast_to_branch(c.branch_id, {
        "event": "TOKEN_CALLED",
        "token_number": next_qe.token_number,
        "counter_number": c.counter_number,
        "counter_id": c.id
    })
    
    from app.services.notification_service import NotificationService
    from app.models.notification import NotificationType
    appt = db.query(Appointment).filter(Appointment.id == next_qe.appointment_id).first()
    if appt:
        await NotificationService.create_notification(
            db,
            user_id=appt.user_id,
            title="Your Turn!",
            message=f"Your token {appt.token_number} is now being served at Counter {c.counter_number}.",
            type=NotificationType.QUEUE,
            appointment_id=appt.id
        )

    return {"message": f"Token {next_qe.token_number} assigned to Counter {c.counter_number}", "assigned": True, "token_number": next_qe.token_number}

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    from app.models.organization import Organization, OrgSector
    
    total_counters = db.query(func.count(EducationCounter.id)).scalar() or 0
    total_tokens = db.query(func.count(Appointment.id)).join(Service).join(Organization).filter(
        Organization.sector == OrgSector.EDUCATION
    ).scalar() or 0
    
    # Just basic for now
    return {
        "total_counters": total_counters,
        "total_education_tokens": total_tokens
    }
