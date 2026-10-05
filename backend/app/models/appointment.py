from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Date, Time, Index
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    token_number = Column(String(20))
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")
    branch = relationship("Branch", back_populates="appointments")
    queue_entry = relationship("QueueEntry", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
