from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User, UserRole, UserStatus
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if len(user_in.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.USER,
        status=UserStatus.ACTIVE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Registration successful",
        "user": UserResponse.model_validate(new_user)
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Your account is inactive")
        
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.config import settings
from app.schemas.auth import GoogleAuthRequest

@router.post("/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google JWT token
        idinfo = id_token.verify_oauth2_token(
            req.token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')
        
        if not email:
            raise ValueError("No email in token")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(status_code=403, detail="Your account is inactive")
        
        # Link account if not linked
        if not user.google_id:
            user.google_id = google_id
            user.auth_provider = "BOTH"
            db.commit()
            db.refresh(user)
    else:
        # Create new user
        fallback_name = email.split('@')[0] if email else "User"
        user = User(
            name=name or fallback_name,
            email=email,
            password_hash=None,
            role=UserRole.USER,
            status=UserStatus.ACTIVE,
            auth_provider="GOOGLE",
            google_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
