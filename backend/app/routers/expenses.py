from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from decimal import Decimal

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseSummaryResponse,
    PlannedVsActualResponse
)
from app.services.expense_service import (
    validate_category_subcategory,
    validate_payment_method,
    validate_expense_date,
    calculate_monthly_summary,
    calculate_historical_trend,
    compare_planned_vs_actual
)

router = APIRouter(prefix="/api/expenses", tags=["Actual Expenses Tracking"])

@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List actual expenses logged by the user with flexible search filters and pagination.
    """
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    # 1. Apply Filters
    if month and year:
        start = datetime.date(year, month, 1)
        if month == 12:
            end = datetime.date(year + 1, 1, 1)
        else:
            end = datetime.date(year, month + 1, 1)
        query = query.filter(Expense.expense_date >= start, Expense.expense_date < end)
    elif year:
        query = query.filter(extract('year', Expense.expense_date) == year)

    if category:
        query = query.filter(Expense.category == category)
    if subcategory:
        query = query.filter(Expense.subcategory == subcategory)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    # 2. Sorting (Newest first)
    query = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())

    # 3. Pagination
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size).all()

@router.get("/summary", response_model=ExpenseSummaryResponse)
def get_expenses_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve monthly totals and category breakdowns for the user.
    """
    today = datetime.date.today()
    m = month or today.month
    y = year or today.year
    return calculate_monthly_summary(db, current_user.id, m, y)

@router.get("/planned-vs-actual", response_model=PlannedVsActualResponse)
def get_planned_vs_actual(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare actual expenses against Step 5 budget limits.
    """
    today = datetime.date.today()
    m = month or today.month
    y = year or today.year
    return compare_planned_vs_actual(db, current_user, m, y)

@router.get("/trend")
def get_expenses_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the last 6 months spending totals.
    """
    return calculate_historical_trend(db, current_user.id)

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a new actual expenditure.
    """
    # 1. Validation checks
    validate_category_subcategory(payload.category, payload.subcategory)
    validate_payment_method(payload.payment_method)
    validate_expense_date(payload.expense_date)

    # 2. Database instantiation
    expense = Expense(
        user_id=current_user.id,
        amount=payload.amount,
        category=payload.category,
        subcategory=payload.subcategory,
        expense_date=payload.expense_date,
        description=payload.description,
        payment_method=payload.payment_method
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a single expense by ID. Returns 404 if unauthorized or missing.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing logged expense.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    # Apply revalidations on updated inputs
    update_data = payload.model_dump(exclude_unset=True)
    
    amount_to_validate = update_data.get("amount", expense.amount)
    category_to_validate = update_data.get("category", expense.category)
    subcategory_to_validate = update_data.get("subcategory", expense.subcategory)
    date_to_validate = update_data.get("expense_date", expense.expense_date)
    method_to_validate = update_data.get("payment_method", expense.payment_method)

    validate_category_subcategory(category_to_validate, subcategory_to_validate)
    validate_payment_method(method_to_validate)
    validate_expense_date(date_to_validate)

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a logged expense transaction.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
