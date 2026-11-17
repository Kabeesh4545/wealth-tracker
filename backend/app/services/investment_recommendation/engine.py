from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import date

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.investment_profile import InvestmentProfile
from app.services.investment_allocation.engine import calculate_investment_allocation
from app.services.financial_planning.engine import generate_financial_plan
from app.services.investment_recommendation.suitability import calculate_suitability_scores
from app.services.data_sources.investment_data_provider import InvestmentDataProvider

inv_provider = InvestmentDataProvider()

def get_investment_recommendations(db: Session, user: User) -> Dict[str, Any]:
    """
    Ranks suitable educational investment types and maps allocation amounts
    harmoniously based on Step 6 allocation tiers and verified institutional rate data.
    """
    # 1. Fetch user profile
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    if not profile:
        return {
            "investment_capacity": 0.0,
            "profile": {},
            "best_match": None,
            "alternatives": [],
            "investment_options": [],
            "suitability_methodology": "No profile found",
            "warnings": ["Please complete onboarding profile registration."],
            "disclaimer": "..."
        }

    # Fetch investment questionnaire profile parameters
    inv_profile = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == user.id).first()
    risk_val = inv_profile.risk_tolerance if inv_profile else "Medium"
    horizon_val = inv_profile.time_horizon if inv_profile else "5+ years"
    exp_val = inv_profile.experience if inv_profile else "Beginner"
    pref_val = inv_profile.primary_preference if inv_profile else ""

    # Retrieve Step 5/6 capacity & allocations
    ref_date = date.today()
    plan = generate_financial_plan(db, user, ref_date=ref_date)
    alloc = calculate_investment_allocation(db, user)
    
    investment_capacity = Decimal(str(plan["budget"]["investments"]))
    
    # Check Step 6 allocations matching Growth, Stable, Capital Preservation
    allocations_list = alloc.get("allocations", [])
    growth_capacity = Decimal("0.00")
    stable_capacity = Decimal("0.00")
    preservation_capacity = Decimal("0.00")
    
    for item in allocations_list:
        lbl = item.get("label", "")
        amt = Decimal(str(item.get("amount", 0.0)))
        if "growth" in lbl.lower():
            growth_capacity = amt
        elif "stable" in lbl.lower() or "fixed-income" in lbl.lower():
            stable_capacity = amt
        elif "capital preservation" in lbl.lower() or "preservation" in lbl.lower():
            preservation_capacity = amt

    # Emergency fund status
    ef_target = Decimal(str(plan["emergency_fund"]["recommended_target"]))
    ef_actual = Decimal(str(plan["emergency_fund"]["current"]))
    ef_ratio = float(ef_actual / ef_target) if ef_target > 0 else 1.5
    
    # DTI Ratio
    dti_ratio = float(plan["debt"]["debt_to_income_ratio"])
    
    # 2. Score options
    scored_products = calculate_suitability_scores(
        risk_tolerance=risk_val,
        horizon=horizon_val,
        experience=exp_val,
        emergency_fund_ratio=ef_ratio,
        dti_ratio=dti_ratio,
        preference=pref_val
    )

    # 3. Map investment capacity & rates
    final_ranked_list = []
    
    for prod in scored_products:
        name = prod["investment_type"]
        risk_level = prod["risk_level"]
        
        if risk_level.lower() in ["high", "medium-high"]:
            rec_amt = growth_capacity
            asset_class = "Growth-Oriented"
        elif risk_level.lower() in ["medium", "low-medium"]:
            rec_amt = stable_capacity
            asset_class = "Stable / Fixed-Income"
        else:
            rec_amt = preservation_capacity
            asset_class = "Capital Preservation"
            
        allocation_pct = float(round((rec_amt / investment_capacity) * 100, 2)) if investment_capacity > 0 else 0.0
        is_allowed = bool(investment_capacity > 0 and rec_amt > 0)
        
        # Query rate provider context
        rate_matches = inv_provider.fetch_rates(db, product_name=name)
        rate_data = rate_matches[0]["data"] if rate_matches else None
        rate_prov = rate_matches[0]["provenance"] if rate_matches else None

        why_it_matches = (
            f"Best match based on your current profile ({risk_val} risk, {horizon_val} horizon, {exp_val} experience). "
            f"It aligns with the {asset_class} allocation tier in your financial plan."
        )
        
        final_ranked_list.append({
            "investment_type": name,
            "recommended_amount": float(round(rec_amt, 2)),
            "allocation_percentage": allocation_pct,
            "suitability_score": prod["suitability_score"],
            "risk_level": risk_level,
            "time_horizon": prod["time_horizon"],
            "liquidity": prod["liquidity"],
            "benefits": prod["benefits"],
            "risks": prod["risks"],
            "why_it_matches": why_it_matches,
            "taxation": prod["taxation"],
            "is_allowed": is_allowed,
            "rate_info": rate_data,
            "provenance": rate_prov.model_dump() if rate_prov else None
        })

    # Pick best match and alternatives
    best_match = None
    alternatives = []
    
    if final_ranked_list:
        allowed_options = [x for x in final_ranked_list if x["is_allowed"]]
        if allowed_options:
            best_match = allowed_options[0]
            alternatives = [x for x in allowed_options[1:4]]
        else:
            best_match = final_ranked_list[0]
            alternatives = final_ranked_list[1:4]

    disclaimer = (
        "Investment values can go up or down. Past performance and historical CAGR are not guaranteed future returns. "
        "This represents educational suitability guidance based on modern portfolio theory rules."
    )

    warnings = []
    if dti_ratio > 0.40:
        warnings.append("High DTI ratio detected. Prioritize repaying outstanding loan debt before aggressive investing.")
    if ef_ratio < 1.0:
        warnings.append("Inadequate emergency fund detected. Prioritize building highly-liquid sweep deposits or cash reserves.")

    return {
        "investment_capacity": float(round(investment_capacity, 2)),
        "profile": {
            "risk_profile": risk_val,
            "horizon": horizon_val,
            "experience": exp_val
        },
        "best_match": best_match,
        "alternatives": alternatives,
        "investment_options": final_ranked_list,
        "suitability_methodology": "Rule-based score ranking based on risk tolerance, timeline, and current emergency fund adequacy.",
        "warnings": warnings,
        "disclaimer": disclaimer
    }
