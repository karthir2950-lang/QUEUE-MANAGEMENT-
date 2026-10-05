from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.organization import Organization, OrgStatus, OrgSector
from app.schemas.organization import OrganizationResponse

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/sectors", response_model=List[str])
def get_sectors():
    return [s.value for s in OrgSector]

@router.get("", response_model=List[OrganizationResponse])
def get_organizations(sector: Optional[OrgSector] = None, db: Session = Depends(get_db)):
    query = db.query(Organization).filter(Organization.status == OrgStatus.ACTIVE)
    if sector:
        query = query.filter(Organization.sector == sector)
    return query.all()

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: int, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

from app.models.branch import Branch, BranchStatus
from app.schemas.branch import BranchResponse

@router.get("/{org_id}/branches", response_model=List[BranchResponse])
def get_organization_branches(org_id: int, db: Session = Depends(get_db)):
    branches = db.query(Branch).filter(
        Branch.organization_id == org_id,
        Branch.status == BranchStatus.ACTIVE
    ).all()
    return branches
