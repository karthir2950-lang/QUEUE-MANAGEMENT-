from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class TokenStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    USED = "USED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class CheckInToken(Base):
    __tablename__ = "check_in_tokens"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, unique=True)
    token_hash = Column(String(255), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(TokenStatus), default=TokenStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointment = relationship("Appointment", backref="check_in_token")
