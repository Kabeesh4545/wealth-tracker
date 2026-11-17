from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User
from app.models.investment import Investment
from app.schemas.investment import (
    InvestmentCreate, InvestmentUpdate, InvestmentResponse,
    InvestmentRecommendationsResponse
)
from app.dependencies import get_current_user
from app.services.investment_recommendation import get_investment_recommendations

router = APIRouter(prefix="/api/investments", tags=["Investments"])

@router.get("/recommendations", response_model=InvestmentRecommendationsResponse)
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates profile suitability scores across investment vehicles
    and suggests educational target allocations.
    """
    return get_investment_recommendations(db, current_user)

@router.get("", response_model=List[InvestmentResponse])
def get_investments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Investment).filter(Investment.user_id == current_user.id).all()

@router.post("", response_model=InvestmentResponse, status_code=status.HTTP_201_CREATED)
def create_investment(investment_in: InvestmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    investment = Investment(
        user_id=current_user.id,
        **investment_in.model_dump()
    )
    db.add(investment)
    db.commit()
    db.refresh(investment)
    return investment

@router.put("/{investment_id}", response_model=InvestmentResponse)
def update_investment(investment_id: int, investment_in: InvestmentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    investment = db.query(Investment).filter(Investment.id == investment_id, Investment.user_id == current_user.id).first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    update_data = investment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(investment, field, value)
        
    db.commit()
    db.refresh(investment)
    return investment

@router.delete("/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(investment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    investment = db.query(Investment).filter(Investment.id == investment_id, Investment.user_id == current_user.id).first()
    if not investment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found"
        )
    
    db.delete(investment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
