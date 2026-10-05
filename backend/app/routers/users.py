from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.models.user import User
from app.auth.dependencies import require_user
from app.auth.security import get_password_hash, verify_password

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(require_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    if user_in.name is not None:
        current_user.name = user_in.name
    if user_in.phone is not None:
        current_user.phone = user_in.phone
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(
    pwd_in: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user)
):
    if not verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
        
    current_user.password_hash = get_password_hash(pwd_in.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
