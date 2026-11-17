from decimal import Decimal
from datetime import datetime
from typing import List, Dict, Any
from app.models.financial_goal import FinancialGoal

def calculate_months_remaining(target_date_str: str, ref_date: datetime = None) -> int:
    """
    Computes months remaining between ref_date and target_date (YYYY-MM).
    If target_date is in the past, returns <= 0.
    """
    if not ref_date:
        ref_date = datetime.now()
        
    try:
        target_year, target_month = map(int, target_date_str.split('-')[:2])
    except Exception:
        # Fallback if invalid format
        return 0
        
    ref_year = ref_date.year
    ref_month = ref_date.month
    
    return (target_year - ref_year) * 12 + (target_month - ref_month)

def process_and_allocate_goals(
    goals_list: List[FinancialGoal],
    available_surplus: Decimal,
    ref_date: datetime = None
) -> tuple[List[Dict[str, Any]], Decimal]:
    """
    Sorts goals by deadline, allocates contributions from available surplus, 
    and classifies feasibility.
    """
    if not ref_date:
        ref_date = datetime.now()
        
    # Sort goals: overdue goals (past/current month) first, then by earliest deadline
    # completed goals go last
    sorted_goals = []
    for g in goals_list:
        rem_amt = Decimal(str(g.target_amount or 0.0)) - Decimal(str(g.current_amount or 0.0))
        rem_amt = max(rem_amt, Decimal("0.0"))
        
        months_left = calculate_months_remaining(g.target_date, ref_date)
        is_completed = rem_amt <= 0
        
        sorted_goals.append({
            "model": g,
            "remaining_amount": rem_amt,
            "months_remaining": months_left,
            "is_completed": is_completed,
            "deadline": g.target_date
        })
        
    # Sort key: Completed last. Otherwise, sort by months_remaining ascending
    sorted_goals.sort(key=lambda x: (x["is_completed"], x["months_remaining"], x["deadline"]))
    
    remaining_surplus = available_surplus
    allocated_goals = []
    total_allocated = Decimal("0.0")
    
    for item in sorted_goals:
        g = item["model"]
        rem_amt = item["remaining_amount"]
        months_left = item["months_remaining"]
        is_completed = item["is_completed"]
        
        target_amt = Decimal(str(g.target_amount or 0.0))
        current_amt = Decimal(str(g.current_amount or 0.0))
        
        progress_pct = 100.0
        if target_amt > 0:
            progress_pct = float(round((current_amt / target_amt) * 100, 2))
            
        if is_completed:
            allocated_goals.append({
                "id": g.id,
                "goal_name": g.goal_name,
                "target_amount": float(target_amt),
                "current_amount": float(current_amt),
                "remaining_amount": 0.0,
                "target_date": g.target_date,
                "months_remaining": max(0, months_left),
                "required_monthly_contribution": 0.0,
                "allocated_contribution": 0.0,
                "status": "Completed",
                "progress_percent": progress_pct
            })
            continue
            
        # Determine required monthly contribution
        if months_left <= 0:
            # Overdue or due immediately
            required_contribution = rem_amt
            status_tag = "Overdue"
        else:
            required_contribution = rem_amt / Decimal(str(months_left))
            status_tag = "On Track"
            
        # Allocate from surplus
        if remaining_surplus <= 0:
            allocated_contribution = Decimal("0.0")
        else:
            allocated_contribution = min(remaining_surplus, required_contribution)
            
        remaining_surplus -= allocated_contribution
        total_allocated += allocated_contribution
        
        # Refine status based on allocation
        if months_left <= 0:
            status = "Overdue"
        elif allocated_contribution >= required_contribution:
            status = "On Track"
        elif allocated_contribution > 0:
            status = "Challenging"
        else:
            status = "Not Currently Feasible"
            
        allocated_goals.append({
            "id": g.id,
            "goal_name": g.goal_name,
            "target_amount": float(target_amt),
            "current_amount": float(current_amt),
            "remaining_amount": float(rem_amt),
            "target_date": g.target_date,
            "months_remaining": max(0, months_left),
            "required_monthly_contribution": float(round(required_contribution, 2)),
            "allocated_contribution": float(round(allocated_contribution, 2)),
            "status": status,
            "progress_percent": progress_pct
        })
        
    return allocated_goals, total_allocated
