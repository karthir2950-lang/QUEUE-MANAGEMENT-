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
