from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, time, datetime
from app.models.appointment import AppointmentStatus

class AppointmentCreate(BaseModel):
    service_id: int
    branch_id: int
    appointment_date: date
    appointment_time: time

class AppointmentResponse(BaseModel):
    id: int
    booking_id: str
    user_id: int
    service_id: int
    branch_id: int
    appointment_date: date
    appointment_time: time
    token_number: Optional[str]
    status: AppointmentStatus
    created_at: datetime
    
    # We can include extra info mapped dynamically if needed.
    service_name: Optional[str] = None
    organization_name: Optional[str] = None
    branch_name: Optional[str] = None
    queue_status: Optional[str] = None

    class Config:
        from_attributes = True

class SlotAvailability(BaseModel):
    time: time
    available: bool

class AvailabilityResponse(BaseModel):
    date: date
    service_id: int
    branch_id: int
    slots: List[SlotAvailability]
