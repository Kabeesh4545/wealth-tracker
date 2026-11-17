from decimal import Decimal
from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.services.financial_planning import PLANNING_CONFIG

def calculate_emergency_fund_targets(
    essential_expenses: Decimal,
    housing_obligations: Decimal,
    total_emi: Decimal,
    profile: FinancialProfile
) -> tuple[Decimal, Decimal, int]:
    """
    Calculates monthly essential obligations, minimum targets, recommended targets, and target months.
    """
    monthly_obligations = essential_expenses + housing_obligations + total_emi
    
    # 1. Determine target months
    cfg = PLANNING_CONFIG["emergency_fund"]
    target_months = cfg["base_target_months"]
    
    # Scale based on self-employment
    emp_type = (profile.employment_type or "").lower()
    if emp_type in ["self-employed", "freelancer", "business owner"]:
        target_months += cfg["self_employed_extra_months"]
        
    # Scale based on dependents
    dependents = profile.dependents if profile and profile.dependents is not None else 0
    if dependents > 2:
        target_months += cfg["dependents_over_2_extra_months"]
        
    # Scale based on debt status (calculated outside, will pass or calculate in coordinator)
    # To keep this function clean, we will let the coordinator adjust target months or we can pass debt status.
    # Let's adjust target months by accepting debt_status string.
    
    return monthly_obligations, target_months

def get_adjusted_target_months(base_months: int, debt_status: str) -> int:
    cfg = PLANNING_CONFIG["emergency_fund"]
    target_months = base_months
    if debt_status == "High":
        target_months += cfg["high_debt_extra_months"]
        
    return min(target_months, cfg["maximum_months"])

def calculate_emergency_fund_status(
    current: Decimal,
    monthly_obligations: Decimal,
    target_months: int
) -> tuple[Decimal, Decimal, Decimal, str]:
    """
    Returns minimum target, recommended target, gap, and funding status.
    """
    min_target = monthly_obligations * Decimal(str(PLANNING_CONFIG["emergency_fund"]["base_min_months"]))
    recommended_target = monthly_obligations * Decimal(str(target_months))
    
    gap = max(recommended_target - current, Decimal("0.0"))
    
    if current < min_target:
        status = "Needs Building"
    elif current < recommended_target:
        status = "Partially Funded"
    else:
        status = "Adequately Funded"
        
    return min_target, recommended_target, gap, status

def calculate_emergency_contribution(
    surplus: Decimal,
    gap: Decimal
) -> Decimal:
    """
    Determines emergency contribution: min(surplus * 0.30, gap).
    If surplus is negative or zero, returns 0.
    """
    if surplus <= 0 or gap <= 0:
        return Decimal("0.0")
        
    allocation_pct = PLANNING_CONFIG["emergency_fund"]["surplus_allocation_percentage"]
    candidate = surplus * allocation_pct
    return min(candidate, gap)
