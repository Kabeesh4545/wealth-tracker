from typing import Dict, Any
from decimal import Decimal

def calculate_simulation_impact(
    current_plan: Dict[str, Any],
    scenario_plan: Dict[str, Any],
    current_budget: Dict[str, Any],
    scenario_budget: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes delta impacts (Scenario - Current) for financial parameters.
    """
    # 1. Parse current planning values
    cur_income = Decimal(str(current_plan["income"]["planning_income"]))
    cur_expenses = Decimal(str(current_plan["expenses"]["total"]))
    cur_emi = Decimal(str(current_plan["debt"]["total_emi"]))
    cur_surplus = Decimal(str(current_plan["cash_flow"]["monthly_surplus"]))
    cur_ef_contrib = Decimal(str(current_plan["budget"]["emergency_fund"]))
    cur_goal_contrib = Decimal(str(current_plan["budget"]["goals"]))
    cur_inv_capacity = Decimal(str(current_plan["budget"]["investments"]))
    
    cur_safe_to_spend = Decimal(str(current_budget["safe_to_spend_monthly"]))
    cur_spending_limit = Decimal(str(current_budget["mandatory_expenses"])) + cur_safe_to_spend

    # 2. Parse scenario planning values
    scen_income = Decimal(str(scenario_plan["income"]["planning_income"]))
    scen_expenses = Decimal(str(scenario_plan["expenses"]["total"]))
    scen_emi = Decimal(str(scenario_plan["debt"]["total_emi"]))
    scen_surplus = Decimal(str(scenario_plan["cash_flow"]["monthly_surplus"]))
    scen_ef_contrib = Decimal(str(scenario_plan["budget"]["emergency_fund"]))
    scen_goal_contrib = Decimal(str(scenario_plan["budget"]["goals"]))
    scen_inv_capacity = Decimal(str(scenario_plan["budget"]["investments"]))
    
    scen_safe_to_spend = Decimal(str(scenario_budget["safe_to_spend_monthly"]))
    scen_spending_limit = Decimal(str(scenario_budget["mandatory_expenses"])) + scen_safe_to_spend

    # 3. Calculate deltas (Scenario - Current)
    income_diff = scen_income - cur_income
    expenses_diff = scen_expenses - cur_expenses
    emi_diff = scen_emi - cur_emi
    surplus_diff = scen_surplus - cur_surplus
    ef_diff = scen_ef_contrib - cur_ef_contrib
    goal_diff = scen_goal_contrib - cur_goal_contrib
    inv_diff = scen_inv_capacity - cur_inv_capacity
    
    safe_to_spend_diff = scen_safe_to_spend - cur_safe_to_spend
    spending_limit_diff = scen_spending_limit - cur_spending_limit

    return {
        "income_change": float(income_diff),
        "expense_change": float(expenses_diff),
        "emi_change": float(emi_diff),
        "surplus_change": float(surplus_diff),
        "emergency_fund_change": float(ef_diff),
        "goal_capacity_change": float(goal_diff),
        "investment_capacity_change": float(inv_diff),
        
        "current_spending_limit": float(cur_spending_limit),
        "scenario_spending_limit": float(scen_spending_limit),
        "spending_limit_change": float(spending_limit_diff),
        
        "current_safe_to_spend": float(cur_safe_to_spend),
        "scenario_safe_to_spend": float(scen_safe_to_spend),
        "safe_to_spend_change": float(safe_to_spend_diff)
    }

def get_scenario_status(impact: Dict[str, Any]) -> str:
    """
    Evaluates simulation status based on surplus changes.
    """
    surplus_change = Decimal(str(impact["surplus_change"]))
    if surplus_change > 0:
        return "Improved"
    elif surplus_change < 0:
        return "Worsened"
    else:
        return "Unchanged"
