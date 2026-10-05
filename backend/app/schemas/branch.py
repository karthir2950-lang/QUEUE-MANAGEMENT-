from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.branch import BranchStatus

class BranchResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    address: Optional[str]
    city: Optional[str]
    phone: Optional[str]
    status: BranchStatus
    created_at: datetime

    class Config:
        from_attributes = True
