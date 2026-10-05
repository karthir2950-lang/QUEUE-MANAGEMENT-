from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
from app.models.queue import QueueStatus

class AppointmentDetail(BaseModel):
    id: int
    booking_id: str
    appointment_date: date
    appointment_time: time
    status: str
    user_id: int

    class Config:
        from_attributes = True

class QueueResponse(BaseModel):
    queue_id: int
    service: str
    organization: str
    branch: str
    current_token: Optional[str] = None
    your_token: str
    queue_status: QueueStatus
    people_ahead: int
    estimated_wait_time: int
    appointment: AppointmentDetail
    joined_at: datetime
    called_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QueueListResponse(BaseModel):
    id: int
    token_number: str
    customer_name: str
    service_name: str
    appointment_time: time
    queue_status: QueueStatus
    joined_at: datetime
    called_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
