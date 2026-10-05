from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.service import ServiceStatus

class ServiceResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    average_service_time: int
    status: ServiceStatus
    created_at: datetime

    class Config:
        from_attributes = True
