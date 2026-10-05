from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.education_counter import CounterType, CounterStatus

class CounterBase(BaseModel):
    branch_id: int
    service_id: int
    staff_id: Optional[int] = None
    counter_number: str
    counter_name: str
    counter_type: CounterType
    status: CounterStatus

class CounterCreate(CounterBase):
    pass

class CounterUpdate(BaseModel):
    staff_id: Optional[int] = None
    counter_type: Optional[CounterType] = None
    status: Optional[CounterStatus] = None
    current_token: Optional[str] = None

class CounterResponse(CounterBase):
    id: int
    current_token: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Augmented info
    branch_name: Optional[str] = None
    service_name: Optional[str] = None
    staff_name: Optional[str] = None

    class Config:
        from_attributes = True
