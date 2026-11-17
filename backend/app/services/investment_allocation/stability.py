from decimal import Decimal
from typing import Dict, Any
from app.services.investment_allocation.config import INVESTMENT_CONFIG

def evaluate_stability(
    cash_flow_status: str,
    emergency_fund_status: str,
    debt_status: str
) -> tuple[str, Decimal]:
    """
    Evaluates stability and returns (status, multiplier).
    Statuses: Paused, Needs Stabilization, Ready.
    """
    # 1. Deficit check or severe emergency reserve deficiency leads to Paused
    if cash_flow_status == "deficit" or emergency_fund_status == "Needs Building":
        return "Paused", Decimal("0.00")
        
    # 2. Partially funded emergency reserve or high debt leads to Needs Stabilization
    if emergency_fund_status == "Partially Funded" or debt_status == "High":
        # Multiplier is 0.50 for partially funded, otherwise 1.00 (but warnings are triggered)
        mult = Decimal("1.00")
        if emergency_fund_status == "Partially Funded":
            mult = INVESTMENT_CONFIG["emergency_fund_reduction"]["Partially Funded"]
        return "Needs Stabilization", mult
        
    # 3. Default is Ready
    return "Ready", Decimal("1.00")
