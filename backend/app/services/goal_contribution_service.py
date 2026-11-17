from decimal import Decimal
from datetime import date, datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.user import User
from app.services.financial_planning.goals import calculate_months_remaining

def determine_actual_status(
    current_saved: Decimal,
    target_amount: Decimal,
    months_remaining: int,
    actual_month_contribution: Decimal,
    required_monthly_contribution: Decimal,
    planned_monthly_contribution: Decimal
) -> str:
    """
    Evaluates goal progress actual status based on actual savings history.
    """
    if current_saved >= target_amount:
        return "Completed"
    if months_remaining <= 0:
        return "Overdue"
    if actual_month_contribution >= required_monthly_contribution:
        return "On Track"
    if planned_monthly_contribution > 0 and actual_month_contribution >= planned_monthly_contribution:
        return "On Track"
    return "Behind"

def get_planned_contributions(db: Session, user: User) -> Dict[int, Decimal]:
    """
    Invokes the Step 5 planning engine to retrieve authoritative monthly planned allocations.
    """
    from app.services.financial_planning.engine import generate_financial_plan
    try:
        plan = generate_financial_plan(db, user)
        planned_map = {}
        for pg in plan.get("goals", []):
            planned_map[pg["id"]] = Decimal(str(pg["allocated_contribution"]))
        return planned_map
    except Exception as e:
        print(f"Error fetching planned allocations: {e}")
        return {}

def calculate_goal_progress(
    db: Session,
    goal: FinancialGoal,
    planned_monthly_contribution: Decimal,
    month: int,
    year: int
) -> Dict[str, Any]:
    """
    Computes all progress, variance, and status fields for a single goal.
    """
    # 1. Sum up all contributions toward this goal
    total_contributions = db.query(func.sum(GoalContribution.amount)).filter(
        GoalContribution.goal_id == goal.id
    ).scalar() or Decimal("0.00")

    initial_saved = Decimal(str(goal.current_amount or 0.0))
    current_saved = initial_saved + total_contributions
    target_amount = Decimal(str(goal.target_amount or 0.0))

    # 2. Remaining and progress percentage
    remaining_amount = max(target_amount - current_saved, Decimal("0.00"))
    
    progress_percentage = 100.0
    if target_amount > 0:
        progress_percentage = float(round((current_saved / target_amount) * 100, 2))
        progress_percentage = min(max(progress_percentage, 0.0), 100.0)

    # 3. Time remaining and required contribution
    months_remaining = calculate_months_remaining(goal.target_date)

    if current_saved >= target_amount:
        required_monthly_contribution = Decimal("0.00")
    elif months_remaining <= 0:
        required_monthly_contribution = remaining_amount
    else:
        required_monthly_contribution = remaining_amount / Decimal(str(months_remaining))

    # 4. Actual contributions in the selected month/year
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    actual_month_contribution = db.query(func.sum(GoalContribution.amount)).filter(
        GoalContribution.goal_id == goal.id,
        GoalContribution.contribution_date >= start_date,
        GoalContribution.contribution_date < end_date
    ).scalar() or Decimal("0.00")

    difference = actual_month_contribution - planned_monthly_contribution

    # 5. Planning status (feasilibility) vs actual status
    if current_saved >= target_amount:
        planning_status = "Completed"
    elif months_remaining <= 0:
        planning_status = "Overdue"
    else:
        if planned_monthly_contribution >= required_monthly_contribution:
            planning_status = "On Track"
        elif planned_monthly_contribution > 0:
            planning_status = "Challenging"
        else:
            planning_status = "Not Currently Feasible"

    actual_status = determine_actual_status(
        current_saved=current_saved,
        target_amount=target_amount,
        months_remaining=months_remaining,
        actual_month_contribution=actual_month_contribution,
        required_monthly_contribution=required_monthly_contribution,
        planned_monthly_contribution=planned_monthly_contribution
    )

    return {
        "goal_id": goal.id,
        "goal_name": goal.goal_name,
        "target_amount": float(target_amount),
        "original_saved": float(initial_saved),
        "current_saved": float(current_saved),
        "remaining_amount": float(remaining_amount),
        "progress_percentage": progress_percentage,
        "target_date": goal.target_date,
        "months_remaining": max(0, months_remaining),
        "required_monthly_contribution": float(round(required_monthly_contribution, 2)),
        "planned_monthly_contribution": float(round(planned_monthly_contribution, 2)),
        "actual_month_contribution": float(round(actual_month_contribution, 2)),
        "difference": float(round(difference, 2)),
        "planning_status": planning_status,
        "actual_status": actual_status
    }

def get_six_month_trend(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """
    Gathers last 6 months historical totals for all goals contributions.
    """
    today = date.today()
    trend = []
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        
        start_date = date(y, m, 1)
        if m == 12:
            end_date = date(y + 1, 1, 1)
        else:
            end_date = date(y, m + 1, 1)

        sum_amount = db.query(func.sum(GoalContribution.amount)).filter(
            GoalContribution.user_id == user_id,
            GoalContribution.contribution_date >= start_date,
            GoalContribution.contribution_date < end_date
        ).scalar() or Decimal("0.00")

        trend.append({
            "month_key": f"{y}-{m:02d}",
            "month_label": start_date.strftime("%b %Y"),
            "amount": float(sum_amount)
        })
    return trend
