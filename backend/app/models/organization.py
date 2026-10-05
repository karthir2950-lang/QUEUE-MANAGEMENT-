from sqlalchemy import Column, Integer, String, Enum, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class OrgSector(str, enum.Enum):
    HEALTHCARE = "HEALTHCARE"
    BANK = "BANK"
    GOVERNMENT = "GOVERNMENT"
    SALON = "SALON"
    SERVICE_CENTER = "SERVICE_CENTER"
    CLINIC = "CLINIC"
    EDUCATION = "EDUCATION"

class OrgStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sector = Column(Enum(OrgSector), nullable=False, default=OrgSector.HEALTHCARE)
    description = Column(Text)
    address = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    status = Column(Enum(OrgStatus), default=OrgStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    branches = relationship("Branch", back_populates="organization", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="organization", cascade="all, delete-orphan")
