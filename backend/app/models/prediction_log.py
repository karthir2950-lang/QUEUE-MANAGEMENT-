from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from app.database.base import Base

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    queue_entry_id = Column(Integer, ForeignKey("queue_entries.id", ondelete="CASCADE"), index=True)
    predicted_wait_minutes = Column(Float, nullable=False)
    actual_wait_minutes = Column(Float, nullable=True)
    prediction_source = Column(String(50), nullable=False)
    model_version = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
