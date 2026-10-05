from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class ServiceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    average_service_time = Column(Integer, default=15)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="services")
    branch = relationship("Branch", back_populates="services")
    staff = relationship("Staff", back_populates="service", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="service", cascade="all, delete-orphan")
