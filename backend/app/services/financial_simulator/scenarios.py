from typing import Dict, Any
from decimal import Decimal
from datetime import datetime

from app.services.expense_service import CATEGORIES_MAP
from app.services.financial_simulator.state import (
    SimulationExpense,
    SimulationGoal
)

def apply_scenario_override(
    scenario_state: Dict[str, Any],
    scenario_type: str,
    scenario_data: Dict[str, Any]
) -> None:
    """
    Applies the specific scenario override to the plain temporary scenario state.
    Raises ValueError for any validation violations.
    """
    profile = scenario_state["profile"]

    if scenario_type == "salary_change":
        new_salary = Decimal(str(scenario_data.get("new_salary")))
        if new_salary < 0:
            raise ValueError("Salary must be greater than or equal to zero.")
        profile.monthly_salary = float(new_salary)

    elif scenario_type == "expense_change":
        category = scenario_data.get("category")
        subcategory = scenario_data.get("subcategory")
        new_amount = Decimal(str(scenario_data.get("new_monthly_amount")))

        if new_amount < 0:
            raise ValueError("Expense amount must be greater than or equal to zero.")

        # Validate category & subcategory combination
        if category not in CATEGORIES_MAP:
            raise ValueError(f"Invalid category: {category}")
        if subcategory not in CATEGORIES_MAP[category]:
            raise ValueError(f"Invalid subcategory '{subcategory}' for category '{category}'")

        if category == "Housing":
            # Override profile properties
            if subcategory == "Rent":
                profile.rent_amount = float(new_amount)
            elif subcategory == "Maintenance":
                profile.maintenance = float(new_amount)
            elif subcategory == "Other Housing":
                profile.other_housing_expenses = float(new_amount)
        else:
            # Modify or add PlannedExpense DTO
            found = False
            for exp in scenario_state["expenses"]:
                if exp.category == subcategory:
                    exp.monthly_amount = float(new_amount)
                    found = True
                    break
            if not found:
                scenario_state["expenses"].append(
                    SimulationExpense(
                        category=subcategory,
                        expense_type=category.lower(),
                        monthly_amount=float(new_amount)
                    )
                )

    elif scenario_type == "loan_change":
        loan_id = int(scenario_data.get("loan_id"))
        new_emi = Decimal(str(scenario_data.get("new_emi")))

        if new_emi < 0:
            raise ValueError("EMI must be greater than or equal to zero.")

        found_loan = None
        for loan in scenario_state["loans"]:
            if loan.id == loan_id:
                found_loan = loan
                break
        
        if not found_loan:
            raise KeyError("Loan not found") # Will be mapped to 404 in router
        
        found_loan.monthly_emi = float(new_emi)

    elif scenario_type == "savings_change":
        new_monthly_savings = Decimal(str(scenario_data.get("new_monthly_savings")))
        if new_monthly_savings < 0:
            raise ValueError("Savings must be greater than or equal to zero.")
        scenario_state["new_monthly_savings"] = new_monthly_savings

    elif scenario_type == "new_goal":
        name = scenario_data.get("name")
        target_amount = Decimal(str(scenario_data.get("target_amount")))
        current_saved = Decimal(str(scenario_data.get("current_saved")))
        target_date = scenario_data.get("target_date")

        if not name or len(name.strip()) == 0:
            raise ValueError("Goal name is required.")
        if target_amount <= 0:
            raise ValueError("Target amount must be greater than zero.")
        if current_saved < 0:
            raise ValueError("Current saved amount must be greater than or equal to zero.")
        if current_saved > target_amount:
            raise ValueError("Current saved amount cannot exceed target amount.")

        # Validate target date in the future
        try:
            parts = target_date.split('-')
            year = int(parts[0])
            month = int(parts[1])
            target_date_obj = datetime(year, month, 1).date()
        except Exception:
            raise ValueError("Invalid target date format. Must be YYYY-MM or YYYY-MM-DD.")
        
        today = datetime.now().date()
        ref_today = datetime(today.year, today.month, 1).date()
        if target_date_obj <= ref_today:
            raise ValueError("Target date must be in the future.")

        # Add mock goal DTO to state list
        target_date_str = f"{year:04d}-{month:02d}"
        scenario_state["goals"].append(
            SimulationGoal(
                id=9999, # Static hypothetical ID
                goal_name=name,
                target_amount=float(target_amount),
                current_amount=float(current_saved),
                target_date=target_date_str
            )
        )
    else:
        raise ValueError(f"Invalid scenario type: {scenario_type}")
