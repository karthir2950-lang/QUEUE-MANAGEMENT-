from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.notification import Notification, NotificationType
from datetime import datetime
import json
from app.websocket.connection_manager import manager
from app.schemas.notification import NotificationResponse
import asyncio

class NotificationService:
    @staticmethod
    async def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: NotificationType,
        appointment_id: int = None,
        queue_id: int = None,
    ):
        # Deduplication check
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.type == type,
            Notification.title == title
        )
        if appointment_id:
            query = query.filter(Notification.appointment_id == appointment_id)
        if queue_id:
            query = query.filter(Notification.queue_id == queue_id)
            
        existing = query.first()
        if existing:
            return None # Skip duplicate
            
        new_notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            appointment_id=appointment_id,
            queue_id=queue_id
        )
        db.add(new_notif)
        db.commit()
        db.refresh(new_notif)
        
        # Notify user via websocket
        await NotificationService.notify_user(new_notif)
        
        return new_notif
        
    @staticmethod
    async def notify_user(notification: Notification):
        event = {
            "type": "NOTIFICATION",
            "notification": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "type": notification.type.value,
                "created_at": notification.created_at.isoformat()
            }
        }
        await manager.send_personal_message(notification.user_id, event)

    @staticmethod
    def mark_notification_read(db: Session, notif_id: int, user_id: int):
        notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            return True
        return False
        
    @staticmethod
    def mark_all_notifications_read(db: Session, user_id: int):
        db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
        db.commit()
