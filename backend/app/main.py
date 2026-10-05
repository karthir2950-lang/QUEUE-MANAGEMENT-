from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.routers import auth, users, organizations, services, appointments, queue, staff, admin, admin_analytics, ai_router, check_in, notifications
from app.websocket import queue_websocket

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Universal Smart Queue, Appointment & Waiting Management Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
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
app.include_router(admin_analytics.router, prefix="/api")
app.include_router(check_in.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(queue_websocket.router, prefix="/api")
app.include_router(ai_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "SmartQueue API is running"}

@app.get("/health")
def read_health():
    return {"status": "healthy"}
