from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class QueueStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    SERVING = "SERVING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"
    BOOKED = "BOOKED"
    CHECKED_IN = "CHECKED_IN"
    INSPECTION = "INSPECTION"
    IN_SERVICE = "IN_SERVICE"
    READY = "READY"

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    token_number = Column(String(20), nullable=False, index=True)
    queue_status = Column(Enum(QueueStatus), default=QueueStatus.WAITING, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    called_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True), index=True)
    completed_at = Column(DateTime(timezone=True), index=True)

    appointment = relationship("Appointment", back_populates="queue_entry")
