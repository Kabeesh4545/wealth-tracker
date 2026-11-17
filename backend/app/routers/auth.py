from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, PasswordResetRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.dependencies import get_current_user
from app.core.rate_limit import login_limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/quick-login", response_model=Token)
def quick_login(db: Session = Depends(get_db)):
    # Find primary user or first active user for immediate seamless access
    user = db.query(User).filter(User.email == "717823i120@kce.ac.in").first()
    if not user:
        user = db.query(User).filter(User.is_active == True).first()
    if not user:
        user = User(
            full_name="Kabeesh",
            email="717823i120@kce.ac.in",
            password_hash=get_password_hash("Password123!")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address. Please click Register to create one."
        )
    user.password_hash = get_password_hash(payload.new_password.strip())
    db.commit()
    return {"message": "Password updated successfully. You can now sign in."}

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Clean email and search
    email_clean = user_in.email.strip().lower()
    db_user = db.query(User).filter(User.email == email_clean).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered. Tap 'Sign In' or 'Reset Password' below."
        )
    
    hashed_pwd = get_password_hash(user_in.password.strip())
    user = User(
        full_name=user_in.full_name.strip(),
        email=email_clean,
        password_hash=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Enforce rate limit check with real client IP support
    force = request.headers.get("X-Test-Rate-Limit") == "true"
    forwarded = request.headers.get("X-Forwarded-For")
    first_forwarded = forwarded.split(",")[0].strip() if forwarded else None
    client_ip = (
        request.headers.get("CF-Connecting-IP")
        or first_forwarded
        or (request.client.host if request.client else "127.0.0.1")
    )
    login_limiter.check(client_ip, force=force)
    
    email_clean = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password.strip(), user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
