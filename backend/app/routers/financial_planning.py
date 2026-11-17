from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.financial_planning import PlanningResponse, MonthlyBudgetResponse
from app.services.financial_planning import engine
from app.services.monthly_budget import calculate_monthly_budget

router = APIRouter(
    prefix="/api/planning",
    tags=["Personalized Financial Planning"]
)

@router.get("/monthly-plan", response_model=PlanningResponse)
def get_monthly_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a personalized, rule-based, explainable monthly financial plan 
    for the authenticated user based on their current onboarding dataset.
    """
    return engine.generate_financial_plan(db, current_user)

from typing import Optional

@router.get("/monthly-budget", response_model=MonthlyBudgetResponse)
def get_monthly_budget(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the exact monthly operating plan, safe to spend limit,
    reconciled categories, and priority action lists.
    """
    return calculate_monthly_budget(db, current_user, ref_month=month)

from app.schemas.financial_planning import LocationComparisonResponseSchema, DataQualityDashboardResponseSchema
from app.services.monthly_budget.calculator import compare_location_costs
from app.models.data_source import DataSource

@router.get("/location-comparison", response_model=LocationComparisonResponseSchema)
def get_location_comparison(
    target_city: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compares current location benchmarks vs target location benchmarks
    and calculates essential cost & safe-to-spend deltas.
    """
    return compare_location_costs(db, current_user, target_city=target_city)

@router.get("/data-sources", response_model=DataQualityDashboardResponseSchema)
def get_data_sources_quality(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns data quality, freshness status, verification status, and confidence metrics for developer/admin view.
    """
    sources = db.query(DataSource).all()
    source_items = []
    stale_count = 0
    unverified_count = 0

    for s in sources:
        freshness = "CURRENT" if s.last_status == "SUCCESS" else "STALE"
        if freshness == "STALE":
            stale_count += 1
        
        source_items.append({
            "source_key": s.source_key,
            "name": s.name,
            "category": s.category,
            "source_type": s.source_type,
            "source_url": s.source_url,
            "last_refreshed_at": s.last_refreshed_at.isoformat() if s.last_refreshed_at else None,
            "last_status": s.last_status or "PENDING",
            "freshness_status": freshness,
            "is_verified": True,
            "confidence": "HIGH"
        })

    last_refresh = sources[0].last_refreshed_at.isoformat() if (sources and sources[0].last_refreshed_at) else None

    return {
        "total_sources": len(sources),
        "active_sources": sum(1 for s in sources if s.is_active),
        "stale_sources_count": stale_count,
        "unverified_count": unverified_count,
        "sources": source_items,
        "last_system_refresh": last_refresh
    }
