from typing import Dict, Any
from decimal import Decimal

def format_inr(val: Decimal) -> str:
    """Formats Decimal value to Indian Rupee format standard text representation."""
    abs_val = abs(val)
    return f"₹{abs_val:,.2f}"

def generate_simulation_explanation(
    scenario_type: str,
    scenario_data: Dict[str, Any],
    impact: Dict[str, Decimal],
    scenario_plan: Dict[str, Any]
) -> str:
    """
    Generates deterministic explanation text matching user's scenario type.
    """
    if scenario_type == "salary_change":
        diff = impact["income_change"]
        direction = "increases" if diff >= 0 else "decreases"
        val_str = format_inr(diff)
        return (
            f"Your hypothetical salary change of {val_str} {direction} your monthly planning "
            f"income by {val_str} and available surplus by {val_str}, assuming other financial values "
            f"remain unchanged."
        )

    elif scenario_type == "expense_change":
        diff = impact["expense_change"]
        subcategory = scenario_data.get("subcategory")
        direction = "increases" if diff >= 0 else "decreases"
        opp_direction = "reduces" if diff >= 0 else "improves"
        val_str = format_inr(diff)
        return (
            f"Your hypothetical change in {subcategory} spending of {val_str} {direction} your "
            f"total monthly expenses and therefore {opp_direction} available surplus by {val_str}, "
            f"assuming other inputs remain unchanged."
        )

    elif scenario_type == "loan_change":
        diff = impact["emi_change"]
        direction = "increases" if diff >= 0 else "decreases"
        opp_direction = "reduces" if diff >= 0 else "improves"
        val_str = format_inr(diff)
        return (
            f"Your hypothetical EMI change of {val_str} {direction} your total monthly debt "
            f"obligations and therefore {opp_direction} available surplus by {val_str}."
        )

    elif scenario_type == "savings_change":
        diff = impact["emergency_fund_change"] + impact["goal_capacity_change"]
        direction = "increases" if diff >= 0 else "decreases"
        val_str = format_inr(diff)
        return (
            f"Your hypothetical savings change of {val_str} {direction} your monthly savings "
            f"allocation pool, which alters emergency reserve and goals funding priorities."
        )

    elif scenario_type == "new_goal":
        # Find the added mock goal in scenario plan
        name = scenario_data.get("name")
        target_amount = Decimal(str(scenario_data.get("target_amount")))
        target_date = scenario_data.get("target_date")
        
        # Search the scenario goals list for this name
        req_contrib = Decimal("0.0")
        for g in scenario_plan.get("goals", []):
            if g.get("goal_name") == name:
                req_contrib = Decimal(str(g.get("required_monthly_contribution", 0.0)))
                break
        
        req_str = format_inr(req_contrib)
        target_str = format_inr(target_amount)
        return (
            f"Creating a new hypothetical goal '{name}' with a target of {target_str} requires "
            f"approximately {req_str} per month to be completed by {target_date}."
        )

    return "No explanation available for this scenario."
