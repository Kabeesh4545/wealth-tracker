from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.investment_profile import InvestmentProfile
from app.schemas.investment_profile import InvestmentProfileCreate, InvestmentProfileUpdate, InvestmentProfileResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/investment-profile", tags=["Investment Profile"])

@router.get("", response_model=InvestmentProfileResponse)
def get_investment_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment profile not found"
        )
    return profile

@router.post("", response_model=InvestmentProfileResponse, status_code=status.HTTP_201_CREATED)
def create_investment_profile(profile_in: InvestmentProfileCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Investment profile already exists. Use PUT to update."
        )
    
    profile = InvestmentProfile(
        user_id=current_user.id,
        **profile_in.model_dump()
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.put("", response_model=InvestmentProfileResponse)
def update_investment_profile(profile_in: InvestmentProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment profile not found"
        )
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    return profile
