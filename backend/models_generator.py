import os
import textwrap

backend_dir = r"c:\QUEUE MANAGEMENT\backend"
app_dir = os.path.join(backend_dir, "app")
models_dir = os.path.join(app_dir, "models")

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(textwrap.dedent(content).strip() + "\n")

# __init__.py for models must import all models so Alembic can see them
write_file(os.path.join(models_dir, "__init__.py"), """
from app.database.base import Base
from app.models.user import User
from app.models.organization import Organization
from app.models.branch import Branch
from app.models.service import Service
from app.models.staff import Staff
from app.models.appointment import Appointment
from app.models.queue import QueueEntry
from app.models.notification import Notification
""")

write_file(os.path.join(models_dir, "user.py"), """
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
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    staff_profile = relationship("Staff", back_populates="user", uselist=False, cascade="all, delete-orphan")
""")

write_file(os.path.join(models_dir, "organization.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class OrgStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50))
    description = Column(Text)
    address = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    status = Column(Enum(OrgStatus), default=OrgStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    branches = relationship("Branch", back_populates="organization", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="organization", cascade="all, delete-orphan")
""")

write_file(os.path.join(models_dir, "branch.py"), """
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
""")

write_file(os.path.join(models_dir, "service.py"), """
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
""")

write_file(os.path.join(models_dir, "staff.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class StaffStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(Enum(StaffStatus), default=StaffStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="staff_profile")
    branch = relationship("Branch", back_populates="staff")
    service = relationship("Service", back_populates="staff")
""")

write_file(os.path.join(models_dir, "appointment.py"), """
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
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
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
""")

write_file(os.path.join(models_dir, "queue.py"), """
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

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    token_number = Column(String(20), nullable=False, index=True)
    queue_status = Column(Enum(QueueStatus), default=QueueStatus.WAITING, index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    called_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    appointment = relationship("Appointment", back_populates="queue_entry")
""")

write_file(os.path.join(models_dir, "notification.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
import enum

class NotificationType(str, enum.Enum):
    APPOINTMENT = "APPOINTMENT"
    QUEUE = "QUEUE"
    SYSTEM = "SYSTEM"
    REMINDER = "REMINDER"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
""")

print("Models rewritten successfully!")
