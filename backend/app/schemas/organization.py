from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.organization import OrgStatus, OrgSector

class OrganizationResponse(BaseModel):
    id: int
    name: str
    sector: OrgSector
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    status: OrgStatus
    created_at: datetime

    class Config:
        from_attributes = True
