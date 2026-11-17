from decimal import Decimal
from typing import Dict, Any, List

def calculate_suitability_scores(
    risk_tolerance: str,       # "Low", "Medium", "High"
    horizon: str,              # "Short-term" (<3 years), "Medium-term" (3-5 years), "Long-term" (5+ years)
    experience: str,           # "Beginner", "Intermediate", "Advanced"
    emergency_fund_ratio: float, # Actual / Recommended Target
    dti_ratio: float,          # Debt-to-income ratio (float)
    preference: str = ""       # Optional preferred types
) -> List[Dict[str, Any]]:
    """
    Ranks 12 instruments based on user-specific suitability rules, returning a score out of 100.
    """
    from app.services.investment_recommendation.config import INVESTMENT_PRODUCTS

    scored_products = []
    
    for prod in INVESTMENT_PRODUCTS:
        name = prod["investment_type"]
        risk_level = prod["risk_level"]
        time_horizon = prod["time_horizon"]
        liquidity = prod["liquidity"]
        
        # Start base score at 60
        score = 60
        
        # Rule 1: Risk Tolerance Matching
        if risk_tolerance.lower() == "high":
            if risk_level.lower() in ["high", "medium-high"]:
                score += 25
            elif risk_level.lower() in ["low"]:
                score -= 10
        elif risk_tolerance.lower() == "low":
            if risk_level.lower() in ["high", "medium-high"]:
                score -= 60
            elif risk_level.lower() in ["low"]:
                score += 30
        else:  # Medium
            if risk_level.lower() in ["medium", "low-medium"]:
                score += 20
            elif risk_level.lower() in ["high"]:
                score -= 15

        # Rule 2: Horizon Alignment
        if horizon.lower() in ["short-term", "1-3 years"]:
            if "lock-in" in time_horizon.lower() or "8 years" in time_horizon.lower() or "15 years" in time_horizon.lower():
                score -= 30
            if liquidity.lower() in ["high"] and risk_level.lower() not in ["high", "medium-high"]:
                score += 20
        elif horizon.lower() in ["long-term", "5+ years"]:
            if "5+ years" in time_horizon.lower() or "15 years" in time_horizon.lower():
                score += 20
            if liquidity.lower() == "high" and risk_level.lower() == "high":
                score += 10

        # Rule 3: Emergency Fund Status (Priority to liquidity if inadequate)
        if emergency_fund_ratio < 1.0:
            if liquidity.lower() == "high" and risk_level.lower() not in ["high", "medium-high"]:
                score += 25
            if "lock-in" in time_horizon.lower():
                score -= 20
        else:
            # Adequately funded can afford long lock-ins
            if "lock-in" in time_horizon.lower():
                score += 15

        # Rule 4: Debt Burden (High DTI penalizes high risk, rewards low risk stability)
        if dti_ratio > 0.40:
            if risk_level.lower() in ["high", "medium-high"]:
                score -= 25
            elif risk_level.lower() in ["low"]:
                score += 15

        # Rule 5: Investment Experience
        if experience.lower() == "beginner":
            if "trusts" in name.lower() or risk_level.lower() == "high":
                score -= 15
            if "index" in name.lower() or "sweep" in name.lower() or "fixed deposit" in name.lower():
                score += 15

        # Rule 6: User preferences
        if preference and preference.lower() in name.lower():
            score += 10

        # Clamp score between 0 and 100
        score = max(0, min(100, score))
        
        # Build matches
        scored_products.append({
            **prod,
            "suitability_score": score
        })

    # Sort descending by suitability score
    scored_products.sort(key=lambda x: x["suitability_score"], reverse=True)
    return scored_products
