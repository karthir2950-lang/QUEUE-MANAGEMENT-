from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class BranchStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(String(255))
    city = Column(String(100))
    phone = Column(String(20))
    status = Column(Enum(BranchStatus), default=BranchStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="branches")
    services = relationship("Service", back_populates="branch", cascade="all, delete-orphan")
    staff = relationship("Staff", back_populates="branch", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="branch", cascade="all, delete-orphan")
