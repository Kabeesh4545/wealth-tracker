from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.local_cost import LocalCostResponse, LocalCostSummaryResponse
from app.services import local_cost_service
from typing import List, Optional

router = APIRouter(
    prefix="/api/local-costs",
    tags=["Local Cost Intelligence"]
)

@router.get("/cities", response_model=List[str])
def read_cities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all unique cities supported by the local cost database.
    Requires authentication.
    """
    return local_cost_service.get_cities(db)

@router.get("", response_model=LocalCostResponse)
def read_cost_estimate(
    city: str = Query(..., description="Name of the city"),
    category: str = Query(..., description="Main cost category"),
    household_size: int = Query(..., ge=1, description="Number of household members"),
    housing_type: Optional[str] = Query(None, description="BHK size preference for rent (e.g. '1 BHK', '2 BHK', '3 BHK')"),
    subcategory: Optional[str] = Query(None, description="Specific subcategory filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Look up estimated cost ranges based on city, category, household size, and housing type.
    Requires authentication.
    """
    return local_cost_service.estimate_cost(
        db=db,
        city=city,
        category=category,
        household_size=household_size,
        housing_type=housing_type,
        subcategory=subcategory
    )

@router.get("/summary", response_model=LocalCostSummaryResponse)
def read_cost_summary(
    city: str = Query(..., description="Name of the city"),
    household_size: int = Query(..., ge=1, description="Number of household members"),
    housing_type: Optional[str] = Query(None, description="BHK size preference for rent (e.g. '1 BHK', '2 BHK', '3 BHK')"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve summarized cost estimates for all categories based on city and household size.
    Requires authentication.
    """
    return local_cost_service.get_summary(
        db=db,
        city=city,
        household_size=household_size,
        housing_type=housing_type
    )
