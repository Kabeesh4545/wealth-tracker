from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.models.financial_goal import FinancialGoal
from app.models.investment_profile import InvestmentProfile

from app.services.financial_planning.calculations import (
    calculate_planning_income,
    calculate_actual_expenses,
    calculate_housing_obligations,
    calculate_loans_obligations,
    calculate_debt_ratio
)
from app.services.financial_planning.emergency_fund import (
    calculate_emergency_fund_targets,
    get_adjusted_target_months,
    calculate_emergency_fund_status,
    calculate_emergency_contribution
)
from app.services.financial_planning.goals import process_and_allocate_goals
from app.services.financial_planning.investment_capacity import calculate_investment_capacity
from app.services.financial_planning.budget import reconcile_budget
from app.services.financial_planning.local_benchmark import compare_user_costs
from app.services.financial_planning.explanations import generate_recommendations

DISCLAIMER_TEXT = (
    "This plan is an educational budgeting estimate based on the information provided and "
    "available local cost benchmarks. It is not financial, investment, tax, or legal advice. "
    "Actual costs and investment outcomes may vary."
)

def generate_financial_plan(
    db: Session,
    user: User,
    ref_date: datetime = None,
    scenario_state: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Core planning engine orchestrating calculations, allocations, and explanations.
    """
    if not ref_date:
        ref_date = datetime.now()

    # 1. Fetch user's financial objects from database or scenario state
    if scenario_state:
        profile = scenario_state["profile"]
        savings = scenario_state["savings"]
        loans_list = scenario_state["loans"]
        expenses_list = scenario_state["expenses"]
        goals_list = scenario_state["goals"]
        inv_profile = scenario_state["investment_profile"]
    else:
        profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        savings = db.query(Saving).filter(Saving.user_id == user.id).first()
        loans_list = db.query(Loan).filter(Loan.user_id == user.id).all()
        expenses_list = db.query(PlannedExpense).filter(PlannedExpense.user_id == user.id).all()
        goals_list = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).all()
        inv_profile = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == user.id).first()

    # Handle missing profile gracefully
    if not profile:
        profile = FinancialProfile(
            user_id=user.id, age=30, city="", employment_type="Employee",
            family_members=1, dependents=0, monthly_salary=0.0, other_income=0.0,
            variable_income=0.0, housing_type="Other"
        )

    # 2. Planning Income
    salary = profile.monthly_salary or 0.0
    other = profile.other_income or 0.0
    var = profile.variable_income or 0.0
    planning_income = calculate_planning_income(salary, other, var)

    # 3. Expenses
    essential_actual, lifestyle_actual, total_actual = calculate_actual_expenses(expenses_list)

    # 4. Housing Obligations (Rent / Maintenance / Contributions)
    housing_obligations = calculate_housing_obligations(profile)
    
    # Combined essential category includes baseline actuals + housing obligations
    essential_expenses_total = essential_actual + housing_obligations

    # 5. Loan Payments
    total_emi, total_outstanding = calculate_loans_obligations(loans_list, profile)

    # 6. Debt status
    debt_ratio, debt_status = calculate_debt_ratio(total_emi, planning_income)

    # 7. Cash Flow status
    monthly_surplus = planning_income - essential_expenses_total - lifestyle_actual - total_emi
    
    surplus_pct = 0.0
    if planning_income > 0:
        surplus_pct = float(round((monthly_surplus / planning_income) * 100, 2))
        
    if monthly_surplus > 0:
        cash_flow_status = "positive"
    elif monthly_surplus == 0:
        cash_flow_status = "balanced"
    else:
        cash_flow_status = "deficit"

    # 8. Emergency Fund
    monthly_obligations, base_ef_months = calculate_emergency_fund_targets(
        essential_expenses_total, Decimal("0.0"), total_emi, profile
    )
    ef_target_months = get_adjusted_target_months(base_ef_months, debt_status)
    
    current_ef = Decimal(str(savings.emergency_fund or 0.0)) if savings else Decimal("0.0")
    min_ef_target, rec_ef_target, ef_gap, ef_status = calculate_emergency_fund_status(
        current_ef, monthly_obligations, ef_target_months
    )
    
    ef_months_coverage = 0.0
    if monthly_obligations > 0:
        ef_months_coverage = float(round(current_ef / monthly_obligations, 2))

    # Calculate Emergency Fund Monthly Allocation
    new_savings_pool = None
    if scenario_state and scenario_state.get("new_monthly_savings") is not None:
        new_savings_pool = Decimal(str(scenario_state["new_monthly_savings"]))

    if new_savings_pool is not None:
        emergency_contribution = min(new_savings_pool, ef_gap)
        remaining_after_ef = max(new_savings_pool - emergency_contribution, Decimal("0.0"))
        processed_goals, total_goal_contribution = process_and_allocate_goals(
            goals_list, remaining_after_ef, ref_date
        )
    else:
        emergency_contribution = Decimal("0.0")
        if monthly_surplus > 0:
            emergency_contribution = calculate_emergency_contribution(monthly_surplus, ef_gap)

        # 9. Goals Allocation
        remaining_after_ef = max(monthly_surplus - emergency_contribution, Decimal("0.0"))
        processed_goals, total_goal_contribution = process_and_allocate_goals(
            goals_list, remaining_after_ef, ref_date
        )

    # 10. Investment Capacity
    inv_capacity, risk_profile = calculate_investment_capacity(
        monthly_surplus, emergency_contribution, total_goal_contribution, inv_profile
    )

    # 11. Budget Reconciliation
    budget_allocations = reconcile_budget(
        planning_income=planning_income,
        essential_total=essential_expenses_total,
        lifestyle_total=lifestyle_actual,
        loan_payments_total=total_emi,
        emergency_contribution=emergency_contribution,
        goal_contribution=total_goal_contribution,
        investment_capacity=inv_capacity
    )

    # 12. Compare actual expenses against local benchmarks
    local_comparisons = compare_user_costs(db, profile, expenses_list)

    # 13. Explanations & Recommendations
    lifestyle_pct = 0.0
    if planning_income > 0:
        lifestyle_pct = float(round((lifestyle_actual / planning_income) * 100, 2))
        
    recs, expls = generate_recommendations(
        cash_flow_status=cash_flow_status,
        monthly_surplus=monthly_surplus,
        surplus_pct=surplus_pct,
        debt_status=debt_status,
        debt_ratio=debt_ratio,
        ef_status=ef_status,
        ef_months=ef_months_coverage,
        ef_target=ef_target_months,
        goals_list=processed_goals,
        lifestyle_pct=lifestyle_pct
    )

    # 14. Financial health rating indicator
    if cash_flow_status == "deficit" or debt_status == "High" or ef_status == "Needs Building" and current_ef == 0:
        health_status = "At Risk"
    elif debt_status == "Moderate" or ef_status in ["Needs Building", "Partially Funded"]:
        health_status = "Needs Attention"
    else:
        health_status = "Healthy"

    return {
        "user_id": user.id,
        "health_status": health_status,
        "income": {
            "salary": float(salary),
            "other_income": float(other),
            "variable_income": float(var),
            "planning_income": float(planning_income)
        },
        "expenses": {
            "essential": float(essential_expenses_total),
            "lifestyle": float(lifestyle_actual),
            "total": float(essential_expenses_total + lifestyle_actual)
        },
        "debt": {
            "total_emi": float(total_emi),
            "total_outstanding": float(total_outstanding),
            "debt_to_income_ratio": float(round(debt_ratio, 4)),
            "status": debt_status
        },
        "cash_flow": {
            "monthly_surplus": float(round(monthly_surplus, 2)),
            "surplus_percentage": surplus_pct,
            "status": cash_flow_status
        },
        "emergency_fund": {
            "current": float(current_ef),
            "recommended_min": float(min_ef_target),
            "recommended_target": float(rec_ef_target),
            "gap": float(ef_gap),
            "months_coverage": ef_months_coverage,
            "target_months": ef_target_months,
            "status": ef_status
        },
        "goals": processed_goals,
        "investment": {
            "capacity": float(inv_capacity),
            "risk_profile": risk_profile
        },
        "budget": budget_allocations,
        "local_benchmarks": local_comparisons,
        "recommendations": recs,
        "explanations": expls,
        "disclaimer": DISCLAIMER_TEXT
    }
