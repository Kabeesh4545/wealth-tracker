from decimal import Decimal
from app.models.investment_profile import InvestmentProfile

def calculate_investment_capacity(
    available_surplus: Decimal,
    emergency_contribution: Decimal,
    goal_contribution: Decimal,
    inv_profile: InvestmentProfile
) -> tuple[Decimal, str]:
    """
    Calculates remaining investment capacity and identifies risk category.
    """
    remaining = available_surplus - emergency_contribution - goal_contribution
    capacity = max(remaining, Decimal("0.0"))
    
    # Identify risk profile based on database profile
    risk_tolerance = (inv_profile.risk_tolerance if inv_profile else "Medium") or "Medium"
    
    return capacity, risk_tolerance
