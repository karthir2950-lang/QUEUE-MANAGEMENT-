import os
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.queue import QueueEntry, QueueStatus
from app.models.appointment import Appointment
from app.models.user import User, UserRole, UserStatus
from app.models.service import Service
from app.models.organization import Organization
from app.models.branch import Branch

def generate_demo_data():
    print("Generating DEVELOPMENT ONLY synthetic data...")
    db = SessionLocal()
    
    # Get or create necessary entities
    user = db.query(User).first()
    if not user:
        user = User(name="AI Demo User", email="aidemo@example.com", role=UserRole.USER, status=UserStatus.ACTIVE)
        db.add(user)
        db.commit()
        db.refresh(user)

    service = db.query(Service).first()
    if not service:
        print("No service found to attach queue entries. Please seed database first.")
        return
        
    branch = db.query(Branch).filter(Branch.id == service.branch_id).first()
    
    # Generate 200 completed queue entries
    entries_to_add = []
    base_time = datetime.utcnow() - timedelta(days=30)
    
    for i in range(300):
        joined = base_time + timedelta(days=random.randint(0, 29), hours=random.randint(8, 17), minutes=random.randint(0, 59))
        
        # Artificial logic: people_ahead determines waiting time
        people_ahead = random.randint(0, 10)
        avg_service_time = 15
        
        # wait time is people_ahead * avg_service_time + noise
        noise = random.randint(-5, 15)
        wait_time_minutes = max(1, (people_ahead * avg_service_time) + noise)
        
        started = joined + timedelta(minutes=wait_time_minutes)
        
        import uuid
        appt = Appointment(
            booking_id=str(uuid.uuid4())[:8].upper(),
            user_id=user.id,
            service_id=service.id,
            branch_id=branch.id,
            appointment_date=joined.date(),
            appointment_time=joined.time(),
            status="CONFIRMED"
        )
        db.add(appt)
        db.flush()
        
        entry = QueueEntry(
            appointment_id=appt.id,
            token_number=f"DEMO-{i:03d}",
            queue_status=QueueStatus.COMPLETED,
            joined_at=joined,
            started_at=started
        )
        entries_to_add.append(entry)

    db.bulk_save_objects(entries_to_add)
    db.commit()
    db.close()
    print("Successfully generated 300 SYNTHETIC COMPLETED queue entries for ML training.")

if __name__ == "__main__":
    generate_demo_data()
