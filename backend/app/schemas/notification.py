from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime
    appointment_id: Optional[int] = None
    queue_id: Optional[int] = None

    class Config:
        from_attributes = True

class UnreadCountResponse(BaseModel):
    count: int
