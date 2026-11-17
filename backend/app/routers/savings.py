from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.saving import Saving
from app.schemas.saving import SavingCreate, SavingUpdate, SavingResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/savings", tags=["Savings"])

@router.get("", response_model=SavingResponse)
def get_savings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saving = db.query(Saving).filter(Saving.user_id == current_user.id).first()
    if not saving:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings record not found"
        )
    return saving

@router.post("", response_model=SavingResponse, status_code=status.HTTP_201_CREATED)
def create_savings(saving_in: SavingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Saving).filter(Saving.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Savings record already exists. Use PUT to update."
        )
    
    saving = Saving(
        user_id=current_user.id,
        **saving_in.model_dump()
    )
    db.add(saving)
    db.commit()
    db.refresh(saving)
    return saving

@router.put("", response_model=SavingResponse)
def update_savings(saving_in: SavingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saving = db.query(Saving).filter(Saving.user_id == current_user.id).first()
    if not saving:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings record not found"
        )
    
    update_data = saving_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(saving, field, value)
        
    db.commit()
    db.refresh(saving)
    return saving
