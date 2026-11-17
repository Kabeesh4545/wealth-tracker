from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.investment_allocation import InvestmentAllocationResponse
from app.services.investment_allocation import engine

router = APIRouter(
    prefix="/api/planning",
    tags=["Personalized Savings & Investment Allocation"]
)

@router.get("/investment-allocation", response_model=InvestmentAllocationResponse)
def get_investment_allocation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate high-level personalized investment allocations (percentage and monthly amounts)
    and warnings for the authenticated user using suitability algorithms.
    """
    return engine.calculate_investment_allocation(db, current_user)
