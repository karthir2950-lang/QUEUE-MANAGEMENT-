from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from typing import Optional
from datetime import datetime, date

from app.database.connection import get_db
from app.routers.auth import get_current_user
from app.models.user import User, UserRole
from app.models.organization import Organization, OrgSector
from app.models.service import Service
from app.models.branch import Branch
from app.models.appointment import Appointment, AppointmentStatus
from app.models.queue import QueueEntry, QueueStatus

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

def check_admin(current_user: User):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

@router.get("/overview")
def get_overview(
    sector: Optional[OrgSector] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    total_users = db.query(func.count(User.id)).filter(User.role == UserRole.USER).scalar() or 0
    total_staff = db.query(func.count(User.id)).filter(User.role == UserRole.STAFF).scalar() or 0
    
    org_query = db.query(Organization)
    if sector:
        org_query = org_query.filter(Organization.sector == sector)
    total_organizations = org_query.count()
    
    svc_query = db.query(Service).join(Organization)
    if sector:
        svc_query = svc_query.filter(Organization.sector == sector)
    total_services = svc_query.count()
    
    appt_query = db.query(Appointment).join(Branch).join(Organization)
    if sector:
        appt_query = appt_query.filter(Organization.sector == sector)
    if date_from:
        appt_query = appt_query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        appt_query = appt_query.filter(Appointment.appointment_date <= date_to)
        
    total_appointments = appt_query.count()
    completed_appointments = appt_query.filter(Appointment.status == AppointmentStatus.COMPLETED).count()
    cancelled_appointments = appt_query.filter(Appointment.status == AppointmentStatus.CANCELLED).count()
    no_show_appointments = appt_query.filter(Appointment.status == AppointmentStatus.NO_SHOW).count()
    
    # By sector breakdown
    sector_breakdown = db.query(
        Organization.sector,
        func.count(Appointment.id).label("total_appointments")
    ).join(Branch, Branch.organization_id == Organization.id)\
     .join(Appointment, Appointment.branch_id == Branch.id)\
     .group_by(Organization.sector).all()
     
    by_sector = {str(s[0].value if hasattr(s[0], 'value') else s[0]): s[1] for s in sector_breakdown}
    
    return {
        "total_users": total_users,
        "total_staff": total_staff,
        "total_organizations": total_organizations,
        "total_services": total_services,
        "total_appointments": total_appointments,
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "no_show_appointments": no_show_appointments,
        "appointments_by_sector": by_sector
    }

@router.get("/appointments")
def get_appointment_trends(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    period: str = "daily",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    query = db.query(
        Appointment.appointment_date.label("date"),
        func.count(Appointment.id).label("total"),
        func.sum(case((Appointment.status == AppointmentStatus.COMPLETED, 1), else_=0)).label("completed"),
        func.sum(case((Appointment.status == AppointmentStatus.CANCELLED, 1), else_=0)).label("cancelled"),
        func.sum(case((Appointment.status == AppointmentStatus.NO_SHOW, 1), else_=0)).label("no_show")
    )
    
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
        
    # Grouping by day. Note: for weekly/monthly, SQLite date formatting might differ
    # Using simple daily group for simplicity, but could format string for others.
    # To keep it generic and safe across DBs, we group by appointment_date.
    query = query.group_by(Appointment.appointment_date).order_by(Appointment.appointment_date)
    
    results = query.all()
    
    return [
        {
            "date": row.date.strftime("%Y-%m-%d") if row.date else "",
            "total": row.total,
            "completed": row.completed or 0,
            "cancelled": row.cancelled or 0,
            "no_show": row.no_show or 0
        }
        for row in results
    ]

@router.get("/queue-performance")
def get_queue_performance(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    query = db.query(QueueEntry).join(Appointment)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
        
    entries = query.all()
    
    completed_count = 0
    cancelled_count = 0
    no_show_count = 0
    total_waiting_seconds = 0
    waiting_records = 0
    total_service_seconds = 0
    service_records = 0
    
    for q in entries:
        if q.queue_status == QueueStatus.COMPLETED:
            completed_count += 1
        elif q.queue_status == QueueStatus.CANCELLED:
            cancelled_count += 1
        elif q.queue_status == QueueStatus.NO_SHOW:
            no_show_count += 1
            
        if q.started_at and q.joined_at:
            total_waiting_seconds += (q.started_at - q.joined_at).total_seconds()
            waiting_records += 1
            
        if q.completed_at and q.started_at:
            total_service_seconds += (q.completed_at - q.started_at).total_seconds()
            service_records += 1
            
    avg_waiting_time = (total_waiting_seconds / 60) / waiting_records if waiting_records > 0 else 0
    avg_service_time = (total_service_seconds / 60) / service_records if service_records > 0 else 0
    avg_queue_size = len(entries) / 7.0 if len(entries) > 0 else 0 # Approximation if needed, or just return total waiting
    
    return {
        "average_waiting_time": round(avg_waiting_time, 2),
        "average_service_time": round(avg_service_time, 2),
        "average_queue_size": round(avg_queue_size, 2),
        "completed_count": completed_count,
        "cancelled_count": cancelled_count,
        "no_show_count": no_show_count
    }

@router.get("/peak-hours")
def get_peak_hours(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    query = db.query(Appointment)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
        
    appts = query.all()
    hour_counts = {f"{h:02d}:00": 0 for h in range(8, 20)} # Initialize 8 AM to 7 PM
    
    for a in appts:
        h = a.appointment_time.hour
        hour_str = f"{h:02d}:00"
        if hour_str in hour_counts:
            hour_counts[hour_str] += 1
        else:
            hour_counts[hour_str] = 1
            
    # Sort and format
    sorted_hours = [{"hour": k, "count": v} for k, v in sorted(hour_counts.items()) if v > 0]
    
    return sorted_hours

@router.get("/services")
def get_services_performance(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    services = db.query(Service).all()
    results = []
    
    for srv in services:
        query = db.query(Appointment).filter(Appointment.service_id == srv.id)
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)
            
        appts = query.all()
        
        completed = sum(1 for a in appts if a.status == AppointmentStatus.COMPLETED)
        cancelled = sum(1 for a in appts if a.status == AppointmentStatus.CANCELLED)
        no_show = sum(1 for a in appts if a.status == AppointmentStatus.NO_SHOW)
        
        # Calculate avg wait from QueueEntry
        # Not fully optimized, but works.
        appts_ids = [a.id for a in appts]
        q_entries = db.query(QueueEntry).filter(QueueEntry.appointment_id.in_(appts_ids)).all() if appts_ids else []
        
        total_wait = sum((q.started_at - q.joined_at).total_seconds() for q in q_entries if q.started_at and q.joined_at)
        wait_count = sum(1 for q in q_entries if q.started_at and q.joined_at)
        
        total_serv = sum((q.completed_at - q.started_at).total_seconds() for q in q_entries if q.completed_at and q.started_at)
        serv_count = sum(1 for q in q_entries if q.completed_at and q.started_at)
        
        results.append({
            "service_name": srv.name,
            "total_appointments": len(appts),
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "average_waiting_time": round((total_wait / 60) / wait_count, 2) if wait_count > 0 else 0,
            "average_service_time": round((total_serv / 60) / serv_count, 2) if serv_count > 0 else 0,
        })
        
    return results

@router.get("/organizations")
def get_organizations_performance(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    orgs = db.query(Organization).all()
    results = []
    
    for org in orgs:
        query = db.query(Appointment).join(Branch).filter(Branch.organization_id == org.id)
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)
            
        appts = query.all()
        completed = sum(1 for a in appts if a.status == AppointmentStatus.COMPLETED)
        cancelled = sum(1 for a in appts if a.status == AppointmentStatus.CANCELLED)
        no_show = sum(1 for a in appts if a.status == AppointmentStatus.NO_SHOW)
        
        results.append({
            "organization_name": org.name,
            "appointments": len(appts),
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "average_waiting_time": 0 # simplified
        })
        
    return results

@router.get("/ai-performance")
def get_ai_performance(
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    return {
        "available": False,
        "message": "Insufficient prediction history."
    }

@router.get("/branches")
def get_branch_performance(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    
    branches = db.query(Branch).all()
    results = []
    
    for branch in branches:
        query = db.query(Appointment).filter(Appointment.branch_id == branch.id)
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)
            
        appts = query.all()
        
        completed = sum(1 for a in appts if a.status == AppointmentStatus.COMPLETED)
        
        appts_ids = [a.id for a in appts]
        q_entries = db.query(QueueEntry).filter(QueueEntry.appointment_id.in_(appts_ids)).all() if appts_ids else []
        
        total_wait = sum((q.started_at - q.joined_at).total_seconds() for q in q_entries if q.started_at and q.joined_at)
        wait_count = sum(1 for q in q_entries if q.started_at and q.joined_at)
        
        total_serv = sum((q.completed_at - q.started_at).total_seconds() for q in q_entries if q.completed_at and q.started_at)
        serv_count = sum(1 for q in q_entries if q.completed_at and q.started_at)
        
        results.append({
            "branch_name": branch.name,
            "organization_name": branch.organization.name if branch.organization else "",
            "appointments": len(appts),
            "completed": completed,
            "average_waiting_time": round((total_wait / 60) / wait_count, 2) if wait_count > 0 else 0,
            "average_service_time": round((total_serv / 60) / serv_count, 2) if serv_count > 0 else 0,
        })
        
    return results
