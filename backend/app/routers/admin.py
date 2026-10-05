from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io
import csv
from typing import Optional
from datetime import date

from app.database.connection import get_db
from app.routers.auth import get_current_user
from app.models.user import User, UserRole, UserStatus
from app.models.staff import Staff
from app.models.organization import Organization
from app.models.service import Service
from app.models.appointment import Appointment
from app.models.queue import QueueEntry

router = APIRouter(prefix="/admin", tags=["Admin Management"])

def check_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.get("/staff")
def get_staff(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    staff_list = db.query(Staff).all()
    return [
        {
            "id": s.id,
            "employee_code": s.employee_code,
            "user": s.user.name if s.user else None,
            "branch": s.branch.name if s.branch else None,
            "service": s.service.name if s.service else None,
            "status": s.status
        }
        for s in staff_list
    ]

@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    orgs = db.query(Organization).all()
    return [
        {
            "id": o.id,
            "name": o.name,
            "created_at": o.created_at
        }
        for o in orgs
    ]

@router.get("/services")
def get_services(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    services = db.query(Service).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "organization": s.organization.name if s.organization else None,
            "average_service_time": s.average_service_time,
            "created_at": s.created_at
        }
        for s in services
    ]

@router.get("/appointments")
def get_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    appts = db.query(Appointment).order_by(Appointment.created_at.desc()).limit(100).all()
    return [
        {
            "id": a.id,
            "booking_id": a.booking_id,
            "user": a.user.name if a.user else None,
            "organization": a.service.organization.name if (a.service and a.service.organization) else None,
            "branch": a.branch.name if a.branch else None,
            "service": a.service.name if a.service else None,
            "date": str(a.appointment_date),
            "time": str(a.appointment_time),
            "token": a.token_number,
            "status": a.status,
            "queue_status": a.queue_entry.queue_status if a.queue_entry else None
        }
        for a in appts
    ]

@router.get("/queues")
def get_queues(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_admin(current_user)
    queues = db.query(QueueEntry).order_by(QueueEntry.joined_at.desc()).limit(100).all()
    return [
        {
            "id": q.id,
            "token": q.token_number,
            "status": q.queue_status,
            "joined_at": q.joined_at,
            "called_at": q.called_at,
            "started_at": q.started_at,
            "completed_at": q.completed_at
        }
        for q in queues
    ]

@router.get("/reports/appointments.csv")
def export_appointments_csv(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    query = db.query(Appointment).order_by(Appointment.appointment_date.desc())
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
        
    appts = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Booking ID", "User", "Organization", "Branch", "Service", "Date", "Time", "Token", "Status"])
    
    for a in appts:
        writer.writerow([
            a.booking_id,
            a.user.name if a.user else "",
            a.service.organization.name if (a.service and a.service.organization) else "",
            a.branch.name if a.branch else "",
            a.service.name if a.service else "",
            a.appointment_date,
            a.appointment_time,
            a.token_number,
            a.status.value
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=appointments_report.csv"}
    )
