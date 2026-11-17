from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User
from app.models.planned_expense import PlannedExpense
from app.schemas.planned_expense import PlannedExpenseCreate, PlannedExpenseUpdate, PlannedExpenseResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/planned-expenses", tags=["Planned Onboarding Expenses"])

@router.get("", response_model=List[PlannedExpenseResponse])
def get_planned_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PlannedExpense).filter(PlannedExpense.user_id == current_user.id).all()

@router.post("", response_model=PlannedExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_planned_expense(expense_in: PlannedExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = PlannedExpense(
        user_id=current_user.id,
        **expense_in.model_dump()
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.put("/{expense_id}", response_model=PlannedExpenseResponse)
def update_planned_expense(expense_id: int, expense_in: PlannedExpenseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(PlannedExpense).filter(PlannedExpense.id == expense_id, PlannedExpense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned expense not found"
        )
    
    update_data = expense_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
        
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(PlannedExpense).filter(PlannedExpense.id == expense_id, PlannedExpense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned expense not found"
        )
    
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
