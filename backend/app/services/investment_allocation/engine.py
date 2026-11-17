from decimal import Decimal
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.investment_profile import InvestmentProfile

# Import Step 5 engine to consume its planning output
from app.services.financial_planning.engine import generate_financial_plan

from app.services.investment_allocation.stability import evaluate_stability
from app.services.investment_allocation.suitability import calculate_suitability_allocations
from app.services.investment_allocation.normalization import normalize_and_reconcile
from app.services.investment_allocation.warnings import generate_warnings
from app.services.investment_allocation.explanations import (
    generate_allocation_explanations,
    get_category_reason
)

DISCLAIMER_TEXT = (
    "This allocation is an educational planning estimate based on the information provided "
    "and does not constitute personalized investment, financial, tax, or legal advice. "
    "Actual investment risk and returns may vary."
)

def calculate_investment_allocation(
    db: Session,
    user: User,
    override_plan: Optional[Dict[str, Any]] = None,
    scenario_state: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Coordinates evaluation of Step 5 parameters and user investment profile
    to determine high-level savings & investment allocations.
    """
    # 1. Fetch Step 5 Planning details (Source of Truth)
    if override_plan:
        plan = override_plan
    else:
        plan = generate_financial_plan(db, user, scenario_state=scenario_state)
    
    step5_capacity = Decimal(str(plan["budget"]["investments"]))
    cash_flow_status = plan["cash_flow"]["status"]
    emergency_fund_status = plan["emergency_fund"]["status"]
    debt_status = plan["debt"]["status"] # Low, Moderate, High

    # 2. Fetch User Investment Profile
    if scenario_state:
        ip = scenario_state["investment_profile"]
    else:
        ip = db.query(InvestmentProfile).filter(
            InvestmentProfile.user_id == user.id
        ).first()

    # Handle missing investment profile
    if not ip or not ip.risk_tolerance or not ip.time_horizon or not ip.experience:
        return {
            "investment_capacity": float(step5_capacity),
            "allocation_status": "needs_profile",
            "financial_stability": {
                "cash_flow": cash_flow_status,
                "emergency_fund": emergency_fund_status,
                "debt": debt_status
            },
            "profile": {
                "risk_tolerance": ip.risk_tolerance if ip else "",
                "experience": ip.experience if ip else "",
                "horizon": ip.time_horizon if ip else "",
                "preference": ip.primary_preference if ip else ""
            },
            "allocations": [],
            "warnings": [
                {
                    "type": "needs_profile",
                    "severity": "medium",
                    "title": "Investment profile incomplete",
                    "message": "Please configure your investment experience, risk tolerance, and horizon to get recommendations."
                }
            ],
            "explanations": ["Investment profile fields are incomplete or invalid."],
            "disclaimer": DISCLAIMER_TEXT
        }

    # Extract user attributes
    risk_tolerance = ip.risk_tolerance # Low, Medium, High
    horizon = ip.time_horizon          # Less than 1 year, 1–3 years, 3–5 years, 5+ years
    experience = ip.experience        # No Experience, Beginner, Intermediate, Experienced
    preference = ip.primary_preference # Capital Preservation, Balanced Growth, Long-Term Growth

    # 3. Evaluate Financial Stability
    stability_status, capacity_multiplier = evaluate_stability(
        cash_flow_status=cash_flow_status,
        emergency_fund_status=emergency_fund_status,
        debt_status=debt_status
    )

    # 4. Apply emergency-fund and cash-flow capacity constraints
    effective_capacity = step5_capacity * capacity_multiplier

    # Calculate status
    if stability_status == "Paused":
        allocation_status = "paused"
    else:
        allocation_status = "active"

    # 5. Run Suitability Allocations
    try:
        raw_pcts = calculate_suitability_allocations(
            risk_tolerance=risk_tolerance,
            horizon=horizon,
            experience=experience,
            preference=preference,
            debt_status=debt_status,
            stability_status=stability_status
        )
    except ValueError as err:
        # Gracefully handle profile mismatch errors
        return {
            "investment_capacity": float(step5_capacity),
            "allocation_status": "needs_profile",
            "financial_stability": {
                "cash_flow": cash_flow_status,
                "emergency_fund": emergency_fund_status,
                "debt": debt_status
            },
            "profile": {
                "risk_tolerance": risk_tolerance,
                "experience": experience,
                "horizon": horizon,
                "preference": preference
            },
            "allocations": [],
            "warnings": [
                {
                    "type": "needs_profile",
                    "severity": "medium",
                    "title": "Investment profile misconfigured",
                    "message": str(err)
                }
            ],
            "explanations": [str(err)],
            "disclaimer": DISCLAIMER_TEXT
        }

    # 6. Normalize and Reconcile
    normalized_pcts, amounts = normalize_and_reconcile(raw_pcts, effective_capacity)

    # Map allocations
    label_mapping = {
        "capital_preservation": "Capital Preservation",
        "stable": "Stable / Fixed-Income-Oriented",
        "growth": "Growth-Oriented"
    }

    allocs = []
    for key, label in label_mapping.items():
        pct = float(round(normalized_pcts[key] * 100, 2))
        amt = float(amounts[key])
        
        # Include only categories with active allocation
        if pct > 0:
            reason_text = get_category_reason(
                category=label,
                percentage=pct,
                risk_tolerance=risk_tolerance,
                horizon=horizon,
                experience=experience,
                preference=preference,
                debt_status=debt_status
            )
            allocs.append({
                "category": label,
                "percentage": pct,
                "monthly_amount": amt,
                "reason": reason_text
            })

    # 7. Generate Warnings
    warnings_list = generate_warnings(
        cash_flow_status=cash_flow_status,
        emergency_fund_status=emergency_fund_status,
        debt_status=debt_status,
        horizon=horizon,
        experience=experience,
        capacity_multiplier=capacity_multiplier
    )

    # 8. Generate Explanations
    explanations_list = generate_allocation_explanations(
        stability_status=stability_status,
        risk_tolerance=risk_tolerance,
        horizon=horizon,
        experience=experience,
        preference=preference,
        debt_status=debt_status,
        allocations=allocs
    )

    return {
        "investment_capacity": float(effective_capacity),
        "allocation_status": allocation_status,
        "financial_stability": {
            "cash_flow": cash_flow_status,
            "emergency_fund": emergency_fund_status,
            "debt": debt_status
        },
        "profile": {
            "risk_tolerance": risk_tolerance,
            "experience": experience,
            "horizon": horizon,
            "preference": preference
        },
        "allocations": allocs,
        "warnings": warnings_list,
        "explanations": explanations_list,
        "disclaimer": DISCLAIMER_TEXT
    }
