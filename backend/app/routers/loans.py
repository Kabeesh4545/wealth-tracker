from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User
from app.models.loan import Loan
from app.schemas.loan import LoanCreate, LoanUpdate, LoanResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/loans", tags=["Loans"])

@router.get("", response_model=List[LoanResponse])
def get_loans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Loan).filter(Loan.user_id == current_user.id).all()

@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(loan_in: LoanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = Loan(
        user_id=current_user.id,
        **loan_in.model_dump()
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan

@router.put("/{loan_id}", response_model=LoanResponse)
def update_loan(loan_id: int, loan_in: LoanUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    update_data = loan_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(loan, field, value)
        
    db.commit()
    db.refresh(loan)
    return loan

@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_loan(loan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id, Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    db.delete(loan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
