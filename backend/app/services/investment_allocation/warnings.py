from typing import List, Dict, Any
from decimal import Decimal

def generate_warnings(
    cash_flow_status: str,
    emergency_fund_status: str,
    debt_status: str,
    horizon: str,
    experience: str,
    capacity_multiplier: Decimal
) -> List[Dict[str, Any]]:
    """
    Assembles suitability warnings based on stability indicators and profile constraints.
    """
    warnings = []

    # 1. Negative Cash Flow (High Severity)
    if cash_flow_status == "deficit":
        warnings.append({
            "type": "negative_cash_flow",
            "severity": "high",
            "title": "Investment allocation paused: deficit",
            "message": "Your monthly cash flow is negative. We recommend stabilizing your expenses before investing."
        })

    # 2. Emergency Fund Needs Building (High Severity)
    if emergency_fund_status == "Needs Building":
        warnings.append({
            "type": "emergency_fund",
            "severity": "high",
            "title": "Emergency reserve needs building",
            "message": "Your emergency fund is below the minimum recommended 3-month baseline. Investments are paused."
        })

    # 3. Emergency Fund Partially Funded (Medium Severity)
    elif emergency_fund_status == "Partially Funded":
        warnings.append({
            "type": "emergency_fund",
            "severity": "medium",
            "title": "Investment allocation reduced",
            "message": "Your emergency fund is partially funded. Investment capacity has been reduced by 50% to build security first."
        })

    # 4. High Debt Burden (Medium Severity)
    if debt_status == "High":
        warnings.append({
            "type": "debt_burden",
            "severity": "medium",
            "title": "High debt burden warning",
            "message": "Your investment allocation has been moderated because your debt status is currently High."
        })

    # 5. Short Horizon (Medium Severity)
    if horizon == "Less than 1 year":
        warnings.append({
            "type": "horizon",
            "severity": "medium",
            "title": "Short investment horizon",
            "message": "Your investment horizon is less than 1 year. Growth exposures have been capped at 0% for security."
        })
    elif horizon == "1–3 years":
        warnings.append({
            "type": "horizon",
            "severity": "medium",
            "title": "Short-to-medium horizon",
            "message": "Your investment horizon is 1–3 years. Growth-oriented allocation has been capped at 20%."
        })

    # 6. Low Experience (Medium Severity)
    if experience in ["No Experience", "Beginner"]:
        warnings.append({
            "type": "experience",
            "severity": "medium",
            "title": "Low investment experience",
            "message": f"As a {experience}, your growth exposure has been capped at 30% to align with entry-level volatility."
        })

    return warnings
