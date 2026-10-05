from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class CounterType(str, enum.Enum):
    FEE_PAYMENT = "FEE_PAYMENT"
    SCHOLARSHIP = "SCHOLARSHIP"
    RECEIPT = "RECEIPT"
    PAYMENT_VERIFICATION = "PAYMENT_VERIFICATION"
    GENERAL_ENQUIRY = "GENERAL_ENQUIRY"

class CounterStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    BREAK = "BREAK"
    OFFLINE = "OFFLINE"

class EducationCounter(Base):
    __tablename__ = "education_counters"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    counter_number = Column(String(50), nullable=False)
    counter_name = Column(String(100), nullable=False)
    counter_type = Column(Enum(CounterType), nullable=False, default=CounterType.FEE_PAYMENT)
    status = Column(Enum(CounterStatus), nullable=False, default=CounterStatus.OFFLINE)
    current_token = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    branch = relationship("Branch", backref="education_counters")
    service = relationship("Service", backref="education_counters")
    staff = relationship("Staff", backref="education_counters")
