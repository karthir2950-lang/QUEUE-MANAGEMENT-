import datetime
import logging
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.models.organization import Organization, OrgStatus, OrgSector
from app.models.branch import Branch, BranchStatus
from app.models.service import Service, ServiceStatus
from app.models.staff import Staff, StaffStatus
from app.auth.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database(db: Session):
    logger.info("Starting database seeding with DEMO DATA for Universal Smart Queue...")

    # Users
    admin_user = db.query(User).filter(User.email == "admin@smartqueue.com").first()
    if not admin_user:
        admin_user = User(name="System Admin", email="admin@smartqueue.com", password_hash=get_password_hash("admin123"), role=UserRole.ADMIN, status=UserStatus.ACTIVE)
        db.add(admin_user)

    staff_user = db.query(User).filter(User.email == "staff@smartqueue.com").first()
    if not staff_user:
        staff_user = User(name="Frontdesk Staff", email="staff@smartqueue.com", password_hash=get_password_hash("staff123"), role=UserRole.STAFF, status=UserStatus.ACTIVE)
        db.add(staff_user)

    for i in range(1, 4):
        email = f"user{i}@example.com"
        if not db.query(User).filter(User.email == email).first():
            db.add(User(name=f"Demo User {i}", email=email, password_hash=get_password_hash("user123"), role=UserRole.USER, status=UserStatus.ACTIVE))

    db.commit()

    # Sector Data Config
    sector_data = [
        {
            "sector": OrgSector.HEALTHCARE, "org_name": "ABC Hospital (DEMO)",
            "branch_name": "Main Hospital",
            "services": ["General Consultation", "Specialist Consultation", "Blood Test"],
            "staff_prefix": "Doctor", "staff_count": 2
        },
        {
            "sector": OrgSector.BANK, "org_name": "Global Trust Bank (DEMO)",
            "branch_name": "Downtown Branch",
            "services": ["Cash Deposit", "Account Opening", "KYC Update", "Loan Enquiry"],
            "staff_prefix": "Counter", "staff_count": 4
        },
        {
            "sector": OrgSector.GOVERNMENT, "org_name": "City Municipality (DEMO)",
            "branch_name": "Central Office",
            "services": ["Birth Certificate", "Income Certificate", "License Services", "Document Verification"],
            "staff_prefix": "Officer", "staff_count": 2
        },
        {
            "sector": OrgSector.SALON, "org_name": "StyleX Salon (DEMO)",
            "branch_name": "Uptown Studio",
            "services": ["Haircut", "Hair Coloring", "Facial", "Spa"],
            "staff_prefix": "Stylist", "staff_count": 3
        },
        {
            "sector": OrgSector.SERVICE_CENTER, "org_name": "TechFix Service Center (DEMO)",
            "branch_name": "Mall Service Point",
            "services": ["Laptop Repair", "Mobile Repair", "Inspection", "Battery Replacement"],
            "staff_prefix": "Technician", "staff_count": 2
        },
        {
            "sector": OrgSector.CLINIC, "org_name": "Family Health Clinic (DEMO)",
            "branch_name": "Community Clinic",
            "services": ["General Checkup", "Dental Consultation", "Eye Check-up", "Vaccination"],
            "staff_prefix": "Doctor", "staff_count": 2
        }
    ]

    for data in sector_data:
        # Organization
        org = db.query(Organization).filter(Organization.name == data["org_name"]).first()
        if not org:
            org = Organization(name=data["org_name"], sector=data["sector"], status=OrgStatus.ACTIVE)
            db.add(org)
            db.commit()
            db.refresh(org)
        
        # Branch
        branch = db.query(Branch).filter(Branch.organization_id == org.id, Branch.name == data["branch_name"]).first()
        if not branch:
            branch = Branch(organization_id=org.id, name=data["branch_name"], address="Demo Address", city="Demo City", status=BranchStatus.ACTIVE)
            db.add(branch)
            db.commit()
            db.refresh(branch)

        # Services
        created_services = []
        for srv_name in data["services"]:
            srv = db.query(Service).filter(Service.organization_id == org.id, Service.name == srv_name).first()
            if not srv:
                srv = Service(organization_id=org.id, branch_id=branch.id, name=srv_name, average_service_time=15, status=ServiceStatus.ACTIVE)
                db.add(srv)
                db.commit()
                db.refresh(srv)
            created_services.append(srv)

        # Staff
        for i in range(1, data["staff_count"] + 1):
            email = f"staff.{data['sector'].value.lower()}{i}@smartqueue.com"
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(name=f"{data['staff_prefix']} {i}", email=email, password_hash=get_password_hash("staff123"), role=UserRole.STAFF, status=UserStatus.ACTIVE)
                db.add(user)
                db.commit()
                db.refresh(user)

            staff = db.query(Staff).filter(Staff.user_id == user.id).first()
            if not staff:
                # Assign to the first service for simplicity
                staff = Staff(user_id=user.id, branch_id=branch.id, service_id=created_services[0].id, employee_code=f"EMP-{data['sector'].value}-{i}")
                db.add(staff)
                db.commit()

    logger.info("Seeding completed successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()
