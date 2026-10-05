from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, time, datetime, timedelta
import uuid

from app.database.connection import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.models.queue import QueueEntry, QueueStatus
from app.models.service import Service, ServiceStatus
from app.models.branch import Branch, BranchStatus
from app.models.organization import Organization
from app.schemas.appointment import (
    AppointmentCreate, 
    AppointmentResponse, 
    AvailabilityResponse, 
    SlotAvailability
)
from app.models.check_in_token import CheckInToken
from app.models.notification import NotificationType
from app.services.notification_service import NotificationService
from app.schemas.check_in import QRCodeResponse
import secrets

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def generate_slots():
    slots = []
    # 09:00 to 17:00 every 30 mins
    curr = datetime.strptime("09:00", "%H:%M")
    end = datetime.strptime("17:00", "%H:%M")
    while curr <= end:
        slots.append(curr.time())
        curr += timedelta(minutes=30)
    return slots

def build_booking_id(db: Session) -> str:
    year = datetime.now().year
    count = db.query(func.count(Appointment.id)).filter(
        func.extract('year', Appointment.created_at) == year
    ).scalar() or 0
    return f"SQ-{year}-{(count + 1):05d}"

def build_token_number(db: Session, branch_id: int, service_id: int, appt_date: date) -> str:
    count = db.query(func.count(Appointment.id)).filter(
        Appointment.branch_id == branch_id,
        Appointment.service_id == service_id,
        Appointment.appointment_date == appt_date
    ).scalar() or 0
    
    # Determine sector prefix
    prefix = "T"
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if branch:
        org = db.query(Organization).filter(Organization.id == branch.organization_id).first()
        if org:
            if org.sector.value == "HEALTHCARE":
                prefix = "H"
            elif org.sector.value == "BANK":
                prefix = "B"
            elif org.sector.value == "GOVERNMENT":
                prefix = "G"
            elif org.sector.value == "SALON":
                prefix = "S"
            elif org.sector.value == "SERVICE_CENTER":
                prefix = "SC"
            elif org.sector.value == "CLINIC":
                prefix = "C"
            elif org.sector.value == "EDUCATION":
                prefix = "E"
                
    return f"{prefix}{(count + 1):03d}"

def map_appointment_response(appt: Appointment, db: Session) -> AppointmentResponse:
    # We do simple manual lookups to hydrate the schema since relationships aren't eagerly loaded in simple queries
    service = db.query(Service).filter(Service.id == appt.service_id).first()
    branch = db.query(Branch).filter(Branch.id == appt.branch_id).first()
    org_name = None
    if service:
        org = db.query(Organization).filter(Organization.id == service.organization_id).first()
        if org:
            org_name = org.name
            
    queue_status = None
    queue_entry = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    if queue_entry:
        queue_status = queue_entry.queue_status.value

    return AppointmentResponse(
        id=appt.id,
        booking_id=appt.booking_id,
        user_id=appt.user_id,
        service_id=appt.service_id,
        branch_id=appt.branch_id,
        appointment_date=appt.appointment_date,
        appointment_time=appt.appointment_time,
        token_number=appt.token_number,
        status=appt.status,
        created_at=appt.created_at,
        service_name=service.name if service else None,
        organization_name=org_name,
        branch_name=branch.name if branch else None,
        queue_status=queue_status
    )

@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(
    service_id: int,
    branch_id: int,
    date: date,
    db: Session = Depends(get_db)
):
    if date < datetime.now().date():
        raise HTTPException(status_code=400, detail="Cannot check availability for past dates.")
        
    all_times = generate_slots()
    
    # Get taken slots
    taken_appts = db.query(Appointment.appointment_time).filter(
        Appointment.service_id == service_id,
        Appointment.branch_id == branch_id,
        Appointment.appointment_date == date,
        Appointment.status != AppointmentStatus.CANCELLED,
        Appointment.status != AppointmentStatus.NO_SHOW
    ).all()
    
    taken_times = {t[0] for t in taken_appts}
    
    # Current time check for today
    is_today = (date == datetime.now().date())
    current_time = datetime.now().time()
    
    slots = []
    for t in all_times:
        if is_today and t < current_time:
            slots.append(SlotAvailability(time=t, available=False))
        else:
            slots.append(SlotAvailability(time=t, available=(t not in taken_times)))
            
    return AvailabilityResponse(
        date=date,
        service_id=service_id,
        branch_id=branch_id,
        slots=slots
    )

@router.post("", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.appointment_date < datetime.now().date():
        raise HTTPException(status_code=400, detail="Appointment date cannot be in the past.")

    # Validate Service
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service or service.status != ServiceStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Service is not available.")
        
    # Validate Branch
    branch = db.query(Branch).filter(Branch.id == data.branch_id).first()
    if not branch or branch.status != BranchStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Branch is not available.")
        
    # Prevent Duplicate / Conflict for User
    existing_user_appt = db.query(Appointment).filter(
        Appointment.user_id == current_user.id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.appointment_time == data.appointment_time,
        Appointment.status != AppointmentStatus.CANCELLED
    ).first()
    if existing_user_appt:
        raise HTTPException(status_code=409, detail="You already have an appointment at this time.")

    # Prevent Slot overbooking
    slot_taken = db.query(Appointment).filter(
        Appointment.service_id == data.service_id,
        Appointment.branch_id == data.branch_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.appointment_time == data.appointment_time,
        Appointment.status != AppointmentStatus.CANCELLED
    ).first()
    if slot_taken:
        raise HTTPException(status_code=409, detail="This slot was just booked by another user. Please select another slot.")
        
    try:
        booking_id = build_booking_id(db)
        token_number = build_token_number(db, data.branch_id, data.service_id, data.appointment_date)
        
        new_appt = Appointment(
            booking_id=booking_id,
            user_id=current_user.id,
            service_id=data.service_id,
            branch_id=data.branch_id,
            appointment_date=data.appointment_date,
            appointment_time=data.appointment_time,
            token_number=token_number,
            status=AppointmentStatus.CONFIRMED
        )
        db.add(new_appt)
        db.flush()
        
        queue_entry = QueueEntry(
            appointment_id=new_appt.id,
            token_number=token_number,
            queue_status=QueueStatus.WAITING
        )
        db.add(queue_entry)
        
        # Create check-in token
        qr_secret = secrets.token_urlsafe(32)
        checkin_token = CheckInToken(
            appointment_id=new_appt.id,
            token_hash=qr_secret,
            expires_at=datetime.combine(data.appointment_date, data.appointment_time) + timedelta(hours=24)
        )
        db.add(checkin_token)
        
        db.commit()
        db.refresh(new_appt)
        
        org_name = db.query(Organization.name).join(Service).filter(Service.id == data.service_id).scalar() or "our facility"
        formatted_time = data.appointment_time.strftime("%I:%M %p")
        
        await NotificationService.create_notification(
            db,
            user_id=current_user.id,
            title="Appointment Confirmed",
            message=f"Your appointment at {org_name} is confirmed for {formatted_time}.",
            type=NotificationType.APPOINTMENT,
            appointment_id=new_appt.id
        )
        
        return map_appointment_response(new_appt, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create appointment.")

@router.get("/{appointment_id}/qr", response_model=QRCodeResponse)
def get_appointment_qr(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    if appt.user_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to view this QR.")
        
    token = db.query(CheckInToken).filter(CheckInToken.appointment_id == appt.id).first()
    if not token or token.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="No active QR token available for this appointment.")
        
    return QRCodeResponse(
        token=token.token_hash,
        qr_data=token.token_hash,
        expires_at=token.expires_at
    )


@router.get("", response_model=List[AppointmentResponse])
def get_all_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized.")
        
    query = db.query(Appointment).order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
    
    # In a real app, staff might only see their branch's appointments.
    # For now, we'll just return all for simplicity or branch mapping logic.
    appts = query.all()
    return [map_appointment_response(a, db) for a in appts]

@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).filter(Appointment.user_id == current_user.id)
    if status:
        query = query.filter(Appointment.status == status)
        
    appts = query.order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc()).all()
    return [map_appointment_response(a, db) for a in appts]

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    if appt.user_id != current_user.id and current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment.")
        
    return map_appointment_response(appt, db)

@router.put("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    if appt.user_id != current_user.id and current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment.")
        
    if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed or no-show appointment.")
        
    if appt.status == AppointmentStatus.CANCELLED:
        return {"message": "Appointment is already cancelled."}
        
    appt.status = AppointmentStatus.CANCELLED
    
    # Also cancel queue entry
    qe = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    if qe:
        qe.queue_status = QueueStatus.CANCELLED
        
    # Also cancel checkin token
    token = db.query(CheckInToken).filter(CheckInToken.appointment_id == appt.id).first()
    if token:
        token.status = "CANCELLED"
        
    db.commit()
    
    await NotificationService.create_notification(
        db,
        user_id=appt.user_id,
        title="Appointment Cancelled",
        message=f"Your appointment {appt.booking_id} has been cancelled.",
        type=NotificationType.APPOINTMENT,
        appointment_id=appt.id
    )
    
    return {"message": "Appointment cancelled successfully."}

from fastapi.responses import Response
from app.services.token_pdf_service import TokenPDFService
from app.ai.predictor import predict_waiting_time
from app.routers.queue import get_people_ahead

@router.get("/{appointment_id}/token-pdf")
def get_token_pdf(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    if appt.user_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to download this token.")

    # Gather data for PDF
    queue_entry = db.query(QueueEntry).filter(QueueEntry.appointment_id == appt.id).first()
    checkin_token = db.query(CheckInToken).filter(CheckInToken.appointment_id == appt.id).first()
    
    queue_status = queue_entry.queue_status.value if queue_entry else appt.status.value
    people_ahead = 0
    estimated_wait_time = 0
    
    if queue_entry and queue_entry.queue_status == QueueStatus.WAITING:
        people_ahead = get_people_ahead(db, queue_entry)
        prediction = predict_waiting_time(queue_entry.id, db)
        estimated_wait_time = prediction.get('estimated_wait_minutes', 0)
        
    service = db.query(Service).filter(Service.id == appt.service_id).first()
    branch = db.query(Branch).filter(Branch.id == appt.branch_id).first()
    org_name = db.query(Organization.name).filter(Organization.id == service.organization_id).scalar() if service else "---"

    appt_data = {
        'token_number': appt.token_number,
        'booking_id': appt.booking_id,
        'user_name': appt.user.name,
        'organization': org_name,
        'branch': branch.name if branch else "---",
        'service': service.name if service else "---",
        'appointment_date': appt.appointment_date,
        'appointment_time': appt.appointment_time,
        'queue_status': queue_status,
        'people_ahead': people_ahead,
        'estimated_wait_time': estimated_wait_time
    }
    
    qr_data = checkin_token.token_hash if (checkin_token and checkin_token.status == "ACTIVE") else "INVALID"
    
    pdf_bytes = TokenPDFService.generate_token_pdf(appt_data, qr_data)
    
    filename = f"SmartQueue_Token_{appt.token_number}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
