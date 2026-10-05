import os
import textwrap

backend_dir = r"c:\QUEUE MANAGEMENT\backend"
app_dir = os.path.join(backend_dir, "app")

dirs = [
    backend_dir,
    app_dir,
    os.path.join(app_dir, "database"),
    os.path.join(app_dir, "models"),
    os.path.join(app_dir, "schemas"),
    os.path.join(app_dir, "routers"),
    os.path.join(app_dir, "services"),
    os.path.join(app_dir, "auth"),
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(textwrap.dedent(content).strip() + "\n")

# ROOT FILES
write_file(os.path.join(backend_dir, ".env"), """
APP_NAME=SmartQueue
DEBUG=True
SECRET_KEY=super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=mysql+pymysql://root:password@localhost/smartqueue
""")

write_file(os.path.join(backend_dir, ".env.example"), """
APP_NAME=SmartQueue
DEBUG=True
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=mysql+pymysql://username:password@localhost/smartqueue
""")

write_file(os.path.join(backend_dir, ".gitignore"), """
venv/
__pycache__/
.env
*.pyc
.pytest_cache/
""")

write_file(os.path.join(backend_dir, "requirements.txt"), """
fastapi==0.110.0
uvicorn==0.27.1
pydantic==2.6.3
pydantic-settings==2.2.1
sqlalchemy==2.0.28
pymysql==1.1.0
alembic==1.13.1
python-dotenv==1.0.1
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.1.2
python-multipart==0.0.9
""")

# APP / CONFIG
write_file(os.path.join(app_dir, "__init__.py"), "")
write_file(os.path.join(app_dir, "config.py"), """
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "SmartQueue"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
""")

# DATABASE
write_file(os.path.join(app_dir, "database", "__init__.py"), "")
write_file(os.path.join(app_dir, "database", "base.py"), """
from sqlalchemy.orm import declarative_base

Base = declarative_base()
""")

write_file(os.path.join(app_dir, "database", "connection.py"), """
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""")

# MODELS
write_file(os.path.join(app_dir, "models", "__init__.py"), "")
write_file(os.path.join(app_dir, "models", "user.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from app.database.base import Base
import enum

class UserRole(str, enum.Enum):
    USER = "USER"
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

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
""")

write_file(os.path.join(app_dir, "models", "organization.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, Text
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
""")

write_file(os.path.join(app_dir, "models", "service.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Text
from app.database.base import Base
import enum

class ServiceStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String(150), nullable=False)
    description = Column(Text)
    average_service_time = Column(Integer, default=15)
    status = Column(Enum(ServiceStatus), default=ServiceStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
""")

write_file(os.path.join(app_dir, "models", "appointment.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey, Date, Time
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
    booking_id = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    token_number = Column(String(20))
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
""")

write_file(os.path.join(app_dir, "models", "queue.py"), """
from sqlalchemy import Column, Integer, String, Enum, DateTime, func, ForeignKey
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
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    token_number = Column(String(20), nullable=False)
    queue_status = Column(Enum(QueueStatus), default=QueueStatus.WAITING)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    called_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
""")

# SCHEMAS
write_file(os.path.join(app_dir, "schemas", "__init__.py"), "")
write_file(os.path.join(app_dir, "schemas", "auth.py"), """
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
""")

write_file(os.path.join(app_dir, "schemas", "user.py"), """
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, UserStatus

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    role: UserRole
    status: UserStatus
    created_at: datetime

    class Config:
        from_attributes = True
""")

write_file(os.path.join(app_dir, "schemas", "organization.py"), """
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.organization import OrgStatus

class OrganizationResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    status: OrgStatus
    created_at: datetime

    class Config:
        from_attributes = True
""")

write_file(os.path.join(app_dir, "schemas", "service.py"), """
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.service import ServiceStatus

class ServiceResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    average_service_time: int
    status: ServiceStatus
    created_at: datetime

    class Config:
        from_attributes = True
""")

write_file(os.path.join(app_dir, "schemas", "appointment.py"), """
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.models.appointment import AppointmentStatus

class AppointmentCreate(BaseModel):
    service_id: int
    appointment_date: date
    appointment_time: time

class AppointmentResponse(BaseModel):
    id: int
    booking_id: str
    user_id: int
    service_id: int
    appointment_date: date
    appointment_time: time
    token_number: Optional[str]
    status: AppointmentStatus
    created_at: datetime

    class Config:
        from_attributes = True
""")

write_file(os.path.join(app_dir, "schemas", "queue.py"), """
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.queue import QueueStatus

class QueueJoinRequest(BaseModel):
    appointment_id: int

class QueueResponse(BaseModel):
    id: int
    appointment_id: int
    token_number: str
    queue_status: QueueStatus
    joined_at: datetime
    called_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
""")

# AUTH
write_file(os.path.join(app_dir, "auth", "__init__.py"), "")
write_file(os.path.join(app_dir, "auth", "security.py"), """
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
""")

write_file(os.path.join(app_dir, "auth", "dependencies.py"), """
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.config import settings
from app.database.connection import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def require_user(current_user: User = Depends(get_current_user)):
    if current_user.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Inactive user")
    return current_user

def require_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.STAFF, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user
""")

# SERVICES
write_file(os.path.join(app_dir, "services", "__init__.py"), "")
write_file(os.path.join(app_dir, "services", "auth_service.py"), "")
write_file(os.path.join(app_dir, "services", "appointment_service.py"), "")
write_file(os.path.join(app_dir, "services", "queue_service.py"), "")

# ROUTERS
write_file(os.path.join(app_dir, "routers", "__init__.py"), "")
write_file(os.path.join(app_dir, "routers", "auth.py"), """
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate):
    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    return {"access_token": "mock-token", "token_type": "bearer"}

@router.get("/me")
def get_me():
    return {"message": "Current user data"}
""")

write_file(os.path.join(app_dir, "routers", "users.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/users", tags=["Users"])
""")

write_file(os.path.join(app_dir, "routers", "organizations.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("")
def list_organizations():
    return []

@router.get("/{organization_id}")
def get_organization(organization_id: int):
    return {"id": organization_id}
""")

write_file(os.path.join(app_dir, "routers", "services.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/services", tags=["Services"])

@router.get("")
def list_services():
    return []

@router.get("/{service_id}")
def get_service(service_id: int):
    return {"id": service_id}
""")

write_file(os.path.join(app_dir, "routers", "appointments.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("")
def create_appointment():
    return {"message": "Appointment created"}

@router.get("/my")
def get_my_appointments():
    return []

@router.get("/{appointment_id}")
def get_appointment(appointment_id: int):
    return {"id": appointment_id}

@router.put("/{appointment_id}/cancel")
def cancel_appointment(appointment_id: int):
    return {"message": "Cancelled"}
""")

write_file(os.path.join(app_dir, "routers", "queue.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/queue", tags=["Queue"])

@router.post("/join")
def join_queue():
    return {"message": "Joined"}

@router.get("/{queue_id}")
def get_queue(queue_id: int):
    return {"id": queue_id}

@router.post("/{queue_id}/next")
def next_queue(queue_id: int):
    return {"message": "Next"}

@router.put("/{queue_id}/start")
def start_queue(queue_id: int):
    return {"message": "Started"}

@router.put("/{queue_id}/complete")
def complete_queue(queue_id: int):
    return {"message": "Completed"}

@router.put("/{queue_id}/no-show")
def no_show_queue(queue_id: int):
    return {"message": "No show"}
""")

write_file(os.path.join(app_dir, "routers", "staff.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/staff", tags=["Staff"])

@router.get("/dashboard")
def get_dashboard():
    return {"message": "Staff dashboard"}

@router.get("/appointments")
def get_appointments():
    return []

@router.get("/queue")
def get_queue():
    return []
""")

write_file(os.path.join(app_dir, "routers", "admin.py"), """
from fastapi import APIRouter
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
def get_dashboard():
    return {"message": "Admin dashboard"}

@router.get("/users")
def get_users():
    return []

@router.get("/staff")
def get_staff():
    return []

@router.get("/organizations")
def get_organizations():
    return []

@router.get("/services")
def get_services():
    return []

@router.get("/appointments")
def get_appointments():
    return []

@router.get("/queues")
def get_queues():
    return []
""")

# MAIN
write_file(os.path.join(app_dir, "main.py"), """
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers import auth, users, organizations, services, appointments, queue, staff, admin

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Universal Smart Queue, Appointment & Waiting Management Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(organizations.router, prefix="/api")
app.include_router(services.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(queue.router, prefix="/api")
app.include_router(staff.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "SmartQueue API is running"}

@app.get("/health")
def read_health():
    return {"status": "healthy"}
""")

print("Backend generated successfully!")
