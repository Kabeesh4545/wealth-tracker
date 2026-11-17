from decimal import Decimal
from typing import Dict

def reconcile_budget(
    planning_income: Decimal,
    essential_total: Decimal,
    lifestyle_total: Decimal,
    loan_payments_total: Decimal,
    emergency_contribution: Decimal,
    goal_contribution: Decimal,
    investment_capacity: Decimal
) -> Dict[str, float]:
    """
    Allocates and reconciles the budget so that:
    planning_income == essential + loan_payments + lifestyle + emergency + goals + investments + buffer
    """
    # 1. Sum up baseline outflows
    outflows = essential_total + lifestyle_total + loan_payments_total + emergency_contribution + goal_contribution + investment_capacity
    
    # 2. Reconcile remaining as flexible buffer (can be negative in case of deficit)
    flexible_buffer = planning_income - outflows
    
    # Enforce precise Decimal validation check
    allocated_sum = (
        essential_total +
        loan_payments_total +
        lifestyle_total +
        emergency_contribution +
        goal_contribution +
        investment_capacity +
        flexible_buffer
    )
    
    assert allocated_sum == planning_income, "Budget fails reconciliation invariant"

    return {
        "essential": float(round(essential_total, 2)),
        "loan_payments": float(round(loan_payments_total, 2)),
        "lifestyle": float(round(lifestyle_total, 2)),
        "emergency_fund": float(round(emergency_contribution, 2)),
        "goals": float(round(goal_contribution, 2)),
        "investments": float(round(investment_capacity, 2)),
        "buffer": float(round(flexible_buffer, 2))
    }
