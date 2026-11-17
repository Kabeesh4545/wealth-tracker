from typing import List, Dict, Any
from decimal import Decimal

def generate_allocation_explanations(
    stability_status: str,
    risk_tolerance: str,
    horizon: str,
    experience: str,
    preference: str,
    debt_status: str,
    allocations: List[Dict[str, Any]]
) -> List[str]:
    """
    Generates high-level explanations explaining the key parameters driving the allocation decisions.
    """
    expls = []

    # 1. Stability Check
    if stability_status == "Paused":
        expls.append(
            "Your investment allocation is paused. High debt, a cash flow deficit, or a low emergency reserve "
            "requires stabilizing your core financial security before allocating surplus to volatile categories."
        )
        return expls

    # 2. Add core suitability rationale
    expls.append(
        f"Your baseline allocation is driven by your {risk_tolerance} risk tolerance and "
        f"investment horizon of {horizon}."
    )

    # 3. Add beginner constraint rationale
    if experience in ["No Experience", "Beginner"]:
        expls.append(
            f"Because you declared '{experience}' experience, a conservative growth cap of 30% was applied "
            "to mitigate potential exposure to heavy market fluctuations."
        )

    # 4. Add preference rationale
    if preference == "Capital Preservation":
        expls.append(
            "An extra shift toward Capital Preservation and Stable categories was applied to honor your "
            "expressed preference for capital preservation."
        )
    elif preference == "Long-Term Growth":
        if horizon == "5+ years" and risk_tolerance in ["Medium", "High"]:
            expls.append(
                "A growth-oriented adjustment of 10% was applied because your long-term horizon (5+ years) "
                "and risk profile allow higher volatility headroom."
            )

    # 5. Add debt constraints rationale
    if debt_status == "High":
        expls.append(
            "Your growth exposure was reduced by 20% absolute due to your High debt status, prioritizing "
            "lower-volatility buffer zones."
        )

    return expls

def get_category_reason(
    category: str,
    percentage: float,
    risk_tolerance: str,
    horizon: str,
    experience: str,
    preference: str,
    debt_status: str
) -> str:
    """
    Returns category-specific justifications.
    """
    if percentage <= 0:
        return "Not recommended under current suitability constraints and risk guidelines."

    if category == "Capital Preservation":
        if preference == "Capital Preservation":
            return "Reinforced by your preference for capital preservation to protect your savings from market drops."
        if risk_tolerance == "Low":
            return "Primary allocation due to low risk tolerance, targeting capital safety and high liquidity."
        return "Provides a low-risk safety foundation for your portfolio to balance growth fluctuations."

    if category == "Stable / Fixed-Income-Oriented":
        if debt_status == "High":
            return "Increased to provide predictable, low-risk returns while you manage high debt obligations."
        return "Offers steady income and stability, buffering against fluctuations in growth categories."

    if category == "Growth-Oriented":
        if horizon in ["Less than 1 year", "1–3 years"]:
            return f"Capped or restricted to protect capital due to your short investment horizon ({horizon})."
        if experience in ["No Experience", "Beginner"]:
            return "Capped at 30% to align growth exposures with your initial experience level."
        if preference == "Long-Term Growth":
            return "Enhanced to optimize long-term compound growth potential over your 5+ year planning timeline."
        return "Provides long-term capital appreciation potential aligned with your risk tolerance."

    return "Provides balanced asset distribution."
