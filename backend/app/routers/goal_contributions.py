from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime
from decimal import Decimal

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.schemas.goal_contribution import (
    GoalContributionCreate,
    GoalContributionUpdate,
    GoalContributionResponse,
    GoalProgressResponse
)
from app.services.goal_contribution_service import (
    calculate_goal_progress,
    get_planned_contributions,
    get_six_month_trend
)

# Note: Prefix is /api/goals for smooth route resolution
router = APIRouter(prefix="/api/goals", tags=["Goal Savings & Contributions"])

@router.get("/progress", response_model=List[GoalProgressResponse])
def get_all_goals_progress(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exposes progress, variances, and status labels for all user goals.
    Registered before the {goal_id} path to prevent route resolution clashes.
    """
    today = datetime.date.today()
    m = month or today.month
    y = year or today.year

    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.id).all()
    planned_map = get_planned_contributions(db, current_user)

    results = []
    for g in goals:
        planned_val = planned_map.get(g.id, Decimal("0.00"))
        progress_info = calculate_goal_progress(db, g, planned_val, m, y)
        results.append(progress_info)

    return results

@router.get("/summary")
def get_goals_summary(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Aggregates goals counts, completion states, and target vs saved totals.
    """
    today = datetime.date.today()
    m = month or today.month
    y = year or today.year

    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.id).all()
    planned_map = get_planned_contributions(db, current_user)

    total_goals = len(goals)
    completed_goals = 0
    on_track_goals = 0
    behind_goals = 0
    overdue_goals = 0

    total_target = Decimal("0.00")
    total_saved = Decimal("0.00")
    total_remaining = Decimal("0.00")

    for g in goals:
        planned_val = planned_map.get(g.id, Decimal("0.00"))
        progress = calculate_goal_progress(db, g, planned_val, m, y)
        
        # Aggregations
        status_tag = progress["actual_status"]
        if status_tag == "Completed":
            completed_goals += 1
        elif status_tag == "Overdue":
            overdue_goals += 1
        elif status_tag == "On Track":
            on_track_goals += 1
        elif status_tag == "Behind":
            behind_goals += 1

        total_target += Decimal(str(progress["target_amount"]))
        total_saved += Decimal(str(progress["current_saved"]))
        total_remaining += Decimal(str(progress["remaining_amount"]))

    return {
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "on_track_goals": on_track_goals,
        "behind_goals": behind_goals,
        "overdue_goals": overdue_goals,
        "total_target": float(total_target),
        "total_saved": float(total_saved),
        "total_remaining": float(total_remaining)
    }

@router.get("/trend")
def get_goal_contributions_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a 6-month trend representation of all goal savings contributions.
    """
    return get_six_month_trend(db, current_user.id)

@router.get("/{goal_id}/progress", response_model=GoalProgressResponse)
def get_single_goal_progress(
    goal_id: int,
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exposes progress for a single goal ID. Verifies ownership.
    """
    today = datetime.date.today()
    m = month or today.month
    y = year or today.year

    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    planned_map = get_planned_contributions(db, current_user)
    planned_val = planned_map.get(goal.id, Decimal("0.00"))
    return calculate_goal_progress(db, goal, planned_val, m, y)

@router.post("/{goal_id}/contributions", response_model=GoalContributionResponse, status_code=status.HTTP_201_CREATED)
def create_goal_contribution(
    goal_id: int,
    payload: GoalContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a savings contribution toward a goal. Verifies completion and ownership.
    """
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    # 1. Double check completion status blocks contribution
    total_contributions = db.query(func.sum(GoalContribution.amount)).filter(
        GoalContribution.goal_id == goal.id
    ).scalar() or Decimal("0.00")
    initial_saved = Decimal(str(goal.current_amount or 0.0))
    current_saved = initial_saved + total_contributions
    target_amount = Decimal(str(goal.target_amount or 0.0))

    if current_saved >= target_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Goal has already been completed."
        )

    # 2. Persist contribution
    contribution = GoalContribution(
        goal_id=goal.id,
        user_id=current_user.id,
        amount=payload.amount,
        contribution_date=payload.contribution_date,
        description=payload.description,
        source=payload.source
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution

@router.get("/{goal_id}/contributions", response_model=List[GoalContributionResponse])
def get_goal_contributions(
    goal_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves contributions history for a single goal.
    """
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    offset = (page - 1) * page_size
    return db.query(GoalContribution).filter(
        GoalContribution.goal_id == goal.id
    ).order_by(
        GoalContribution.contribution_date.desc(),
        GoalContribution.id.desc()
    ).offset(offset).limit(page_size).all()

@router.put("/{goal_id}/contributions/{contribution_id}", response_model=GoalContributionResponse)
def update_goal_contribution(
    goal_id: int,
    contribution_id: int,
    payload: GoalContributionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates details of an existing contribution.
    """
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    contribution = db.query(GoalContribution).filter(
        GoalContribution.id == contribution_id,
        GoalContribution.goal_id == goal.id
    ).first()

    if not contribution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution record not found"
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contribution, field, value)

    db.commit()
    db.refresh(contribution)
    return contribution

@router.delete("/{goal_id}/contributions/{contribution_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal_contribution(
    goal_id: int,
    contribution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes an existing contribution.
    """
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

    contribution = db.query(GoalContribution).filter(
        GoalContribution.id == contribution_id,
        GoalContribution.goal_id == goal.id
    ).first()

    if not contribution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution record not found"
        )

    db.delete(contribution)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
