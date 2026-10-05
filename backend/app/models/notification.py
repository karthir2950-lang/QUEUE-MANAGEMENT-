from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class NotificationType(str, enum.Enum):
    APPOINTMENT = "APPOINTMENT"
    QUEUE = "QUEUE"
    SYSTEM = "SYSTEM"
    REMINDER = "REMINDER"
    CHECK_IN = "CHECK_IN"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    queue_id = Column(Integer, ForeignKey("queue_entries.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    appointment = relationship("Appointment")
    queue_entry = relationship("QueueEntry")
