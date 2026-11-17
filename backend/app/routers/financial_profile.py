from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.schemas.financial_profile import FinancialProfileCreate, FinancialProfileUpdate, FinancialProfileResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Financial Profile"])

@router.get("", response_model=FinancialProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial profile not found"
        )
    return profile

@router.post("", response_model=FinancialProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(profile_in: FinancialProfileCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Financial profile already exists. Use PUT to update."
        )
    
    profile = FinancialProfile(
        user_id=current_user.id,
        **profile_in.model_dump()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.put("", response_model=FinancialProfileResponse)
def update_profile(profile_in: FinancialProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial profile not found"
        )
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    return profile
