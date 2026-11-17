from decimal import Decimal
from typing import Dict
from app.services.investment_allocation.config import INVESTMENT_CONFIG

def calculate_suitability_allocations(
    risk_tolerance: str,
    horizon: str,
    experience: str,
    preference: str,
    debt_status: str,
    stability_status: str
) -> Dict[str, Decimal]:
    """
    Selects base profile and applies horizon caps, experience limits, 
    preference overrides, and high-debt adjustments sequentially.
    """
    # 1. Base selection
    risk_key = (risk_tolerance or "").lower()
    if risk_key not in INVESTMENT_CONFIG["allocation_profiles"]:
        raise ValueError("Invalid or missing risk tolerance")
        
    base = INVESTMENT_CONFIG["allocation_profiles"][risk_key]
    growth = base["growth"]
    stable = base["stable"]
    capital_preservation = base["capital_preservation"]

    # 2. Horizon growth cap
    if horizon not in INVESTMENT_CONFIG["horizon_limits"]:
        raise ValueError("Invalid or missing investment horizon")
        
    horizon_cap = INVESTMENT_CONFIG["horizon_limits"][horizon]
    if growth > horizon_cap:
        removed = growth - horizon_cap
        growth = horizon_cap
        capital_preservation += removed * Decimal("0.50")
        stable += removed * Decimal("0.50")

    # 3. Beginner growth cap
    if experience in ["No Experience", "Beginner"]:
        beginner_limit = INVESTMENT_CONFIG["beginner_growth_limit"]
        if growth > beginner_limit:
            removed = growth - beginner_limit
            growth = beginner_limit
            capital_preservation += removed * Decimal("0.50")
            stable += removed * Decimal("0.50")

    # 4. Preference adjustment
    if preference == "Capital Preservation":
        # Shift 20 percentage points away from growth
        growth_new = max(growth - Decimal("0.20"), Decimal("0.00"))
        actual_reduction = growth - growth_new
        growth = growth_new
        
        # 15% to Capital Preservation (which is 15/20 = 75%), 5% to Stable (which is 5/20 = 25%)
        capital_preservation += actual_reduction * Decimal("0.75")
        stable += actual_reduction * Decimal("0.25")
        
    elif preference == "Long-Term Growth":
        # Only apply when horizon is "5+ years", stability is not Paused, and risk is Medium or High
        if (
            horizon == "5+ years" and 
            stability_status != "Paused" and 
            risk_tolerance in ["Medium", "High"]
        ):
            # Shift 10 percentage points from Capital Preservation to Growth
            shift_amt = min(capital_preservation, Decimal("0.10"))
            capital_preservation -= shift_amt
            growth += shift_amt

    # 5. High-debt growth reduction
    if debt_status == "High":
        growth_new = max(growth - Decimal("0.20"), Decimal("0.00"))
        actual_reduction = growth - growth_new
        growth = growth_new
        
        # Redistribute 50% to Capital Preservation and 50% to Stable
        capital_preservation += actual_reduction * Decimal("0.50")
        stable += actual_reduction * Decimal("0.50")

    return {
        "capital_preservation": capital_preservation,
        "stable": stable,
        "growth": growth
    }
