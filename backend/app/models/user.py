from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class UserRole(str, enum.Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    auth_provider = Column(String(50), default="LOCAL")
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    staff_profile = relationship("Staff", back_populates="user", uselist=False, cascade="all, delete-orphan")
