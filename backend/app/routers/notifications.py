from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.services.notification_service import NotificationService
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).count()
    return {"count": count}

@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = NotificationService.mark_notification_read(db, notif_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    NotificationService.mark_all_notifications_read(db, current_user.id)
    return {"message": "All notifications marked as read"}
