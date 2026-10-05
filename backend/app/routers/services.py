from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.service import Service, ServiceStatus
from app.models.organization import Organization, OrgSector
from app.schemas.service import ServiceResponse

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("", response_model=List[ServiceResponse])
def get_services(sector: Optional[OrgSector] = None, db: Session = Depends(get_db)):
    query = db.query(Service).filter(Service.status == ServiceStatus.ACTIVE)
    if sector:
        query = query.join(Organization).filter(Organization.sector == sector)
    return query.all()

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service
