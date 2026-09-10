from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import Token, LoginRequest, UserOut, UserCreate, UserUpdate, PasswordResetRequest
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.permissions import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")
        
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.get("/users", response_model=List[UserOut])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Any authenticated user can view users for assignments, etc.
    users = db.query(User).filter(User.is_active == True).order_by(User.name).all()
    return [UserOut.model_validate(u) for u in users]

@router.post("/users", response_model=UserOut)
def create_new_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles("ADMIN", "LEAD")),
    db: Session = Depends(get_db)
):
    """Admin and Lead can add new users / employees."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active,
        external_user_id=user_in.external_user_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.put("/users/{user_id}", response_model=UserOut)
def update_user_info(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles("ADMIN", "LEAD")),
    db: Session = Depends(get_db)
):
    """Admin and Lead can edit roles and user details."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.name is not None:
        target_user.name = user_in.name
    if user_in.email is not None:
        target_user.email = user_in.email
    if user_in.role is not None:
        target_user.role = user_in.role
    if user_in.is_active is not None:
        target_user.is_active = user_in.is_active
    if user_in.password:
        target_user.password_hash = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(target_user)
    return UserOut.model_validate(target_user)

@router.post("/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(req.email.strip())).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password reset successfully. You can now log in with your new password."}

