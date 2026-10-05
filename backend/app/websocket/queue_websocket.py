from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.websocket.connection_manager import manager
from jose import jwt, JWTError
from app.config import settings
from app.models.user import User, UserRole
from app.models.queue import QueueEntry, QueueStatus
from app.models.staff import Staff
from app.models.appointment import Appointment
from sqlalchemy import or_, and_
import json

router = APIRouter(prefix="/ws", tags=["WebSocket"])

def get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    return db.query(User).filter(User.id == int(user_id)).first()

@router.websocket("/queue/{queue_id_str}")
async def queue_websocket(websocket: WebSocket, queue_id_str: str, token: str, db: Session = Depends(get_db)):
    user = get_user_from_token(token, db)
    if not user or user.status != "ACTIVE":
        await websocket.close(code=1008)
        return

    room_name = ""
    queue_entry = None
    
    # Determine room and access based on queue_id_str and role
    if queue_id_str == "admin":
        if user.role != UserRole.ADMIN:
            await websocket.close(code=1008)
            return
        room_name = "admin:all"
        
    elif queue_id_str == "staff":
        if user.role not in [UserRole.STAFF, UserRole.ADMIN]:
            await websocket.close(code=1008)
            return
        staff_profile = db.query(Staff).filter(Staff.user_id == user.id).first()
        if not staff_profile:
            await websocket.close(code=1008)
            return
        room_name = f"branch:{staff_profile.branch_id}"
        
    elif queue_id_str == "general":
        # General connection for receiving personal notifications globally
        room_name = f"user_general:{user.id}"
        
    else:
        # Specific queue entry
        try:
            queue_id = int(queue_id_str)
        except ValueError:
            await websocket.close(code=1008)
            return
            
        queue_entry = db.query(QueueEntry).filter(QueueEntry.id == queue_id).first()
        if not queue_entry:
            await websocket.close(code=1008)
            return
            
        if user.role == UserRole.USER and queue_entry.appointment.user_id != user.id:
            await websocket.close(code=1008)
            return
            
        room_name = f"queue:{queue_id}"
        
    # Connect to room
    await manager.connect(websocket, room_name, user.id)
    
    try:
        # Initial State Push
        if queue_id_str == "admin":
            # For admin, we could just send a general welcome or full state
            await websocket.send_json({"type": "CONNECTED", "role": "admin"})
        elif queue_id_str == "staff":
            await websocket.send_json({"type": "CONNECTED", "role": "staff"})
        elif queue_id_str == "general":
            await websocket.send_json({"type": "CONNECTED", "role": "user"})
        else:
            # Send initial queue state for this specific queue
            from app.routers.queue import get_people_ahead # Ensure not circular importing problems, better to write simple query here
            people_ahead = 0
            if queue_entry.queue_status == QueueStatus.WAITING:
                people_ahead = db.query(QueueEntry).join(Appointment).filter(
                    Appointment.branch_id == queue_entry.appointment.branch_id,
                    Appointment.service_id == queue_entry.appointment.service_id,
                    Appointment.appointment_date == queue_entry.appointment.appointment_date,
                    QueueEntry.queue_status == QueueStatus.WAITING,
                    or_(
                        Appointment.appointment_time < queue_entry.appointment.appointment_time,
                        and_(
                            Appointment.appointment_time == queue_entry.appointment.appointment_time,
                            QueueEntry.joined_at < queue_entry.joined_at
                        ),
                        and_(
                            Appointment.appointment_time == queue_entry.appointment.appointment_time,
                            QueueEntry.joined_at == queue_entry.joined_at,
                            QueueEntry.id < queue_entry.id
                        )
                    )
                ).count()
                
            service = queue_entry.appointment.service
            avg_time = service.average_service_time if service else 15
            est_wait = people_ahead * avg_time
            
            # Find current serving
            current_serving = db.query(QueueEntry).join(Appointment).filter(
                Appointment.branch_id == queue_entry.appointment.branch_id,
                Appointment.service_id == queue_entry.appointment.service_id,
                Appointment.appointment_date == queue_entry.appointment.appointment_date,
                QueueEntry.queue_status == QueueStatus.SERVING
            ).order_by(QueueEntry.started_at.desc()).first()
            
            current_token = None
            if current_serving:
                current_token = current_serving.token_number
            else:
                last_called = db.query(QueueEntry).join(Appointment).filter(
                    Appointment.branch_id == queue_entry.appointment.branch_id,
                    Appointment.service_id == queue_entry.appointment.service_id,
                    Appointment.appointment_date == queue_entry.appointment.appointment_date,
                    QueueEntry.queue_status == QueueStatus.CALLED
                ).order_by(QueueEntry.called_at.desc()).first()
                if last_called:
                    current_token = last_called.token_number

            await websocket.send_json({
                "type": "queue_state",
                "queue_id": queue_entry.id,
                "current_token": current_token,
                "your_token": queue_entry.token_number,
                "people_ahead": people_ahead,
                "estimated_wait_time": est_wait,
                "queue_status": queue_entry.queue_status
            })

        # Keep connection open and handle incoming generic ping-pongs if needed
        while True:
            data = await websocket.receive_text()
            # Can handle incoming client messages here if necessary
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_name, user.id)
