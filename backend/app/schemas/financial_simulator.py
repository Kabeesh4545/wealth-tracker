from pydantic import BaseModel, Field, model_validator, ConfigDict
from enum import Enum
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime

class ScenarioTypeEnum(str, Enum):
    salary_change = "salary_change"
    expense_change = "expense_change"
    loan_change = "loan_change"
    savings_change = "savings_change"
    new_goal = "new_goal"

class ScenarioRequest(BaseModel):
    scenario_type: ScenarioTypeEnum
    scenario_data: Dict[str, Any]

    @model_validator(mode="after")
    def validate_scenario_data(self) -> "ScenarioRequest":
        st = self.scenario_type
        sd = self.scenario_data

        MAX_MONETARY_VALUE = Decimal("9999999999.99")

        if st == ScenarioTypeEnum.salary_change:
            if "new_salary" not in sd:
                raise ValueError("new_salary is required.")
            try:
                new_salary = Decimal(str(sd["new_salary"]))
            except Exception:
                raise ValueError("new_salary must be a valid numeric value.")
            if new_salary < 0:
                raise ValueError("new_salary must be greater than or equal to zero.")
            if new_salary > MAX_MONETARY_VALUE:
                raise ValueError("new_salary exceeds maximum allowed value.")

        elif st == ScenarioTypeEnum.expense_change:
            if "category" not in sd or "subcategory" not in sd or "new_monthly_amount" not in sd:
                raise ValueError("category, subcategory, and new_monthly_amount are required.")
            try:
                new_amount = Decimal(str(sd["new_monthly_amount"]))
            except Exception:
                raise ValueError("new_monthly_amount must be a valid numeric value.")
            if new_amount < 0:
                raise ValueError("new_monthly_amount must be greater than or equal to zero.")
            if new_amount > MAX_MONETARY_VALUE:
                raise ValueError("new_monthly_amount exceeds maximum allowed value.")
            if not isinstance(sd["category"], str) or not isinstance(sd["subcategory"], str):
                raise ValueError("category and subcategory must be strings.")

        elif st == ScenarioTypeEnum.loan_change:
            if "loan_id" not in sd or "new_emi" not in sd:
                raise ValueError("loan_id and new_emi are required.")
            try:
                loan_id = int(sd["loan_id"])
            except Exception:
                raise ValueError("loan_id must be an integer.")
            try:
                new_emi = Decimal(str(sd["new_emi"]))
            except Exception:
                raise ValueError("new_emi must be a valid numeric value.")
            if new_emi < 0:
                raise ValueError("new_emi must be greater than or equal to zero.")
            if new_emi > MAX_MONETARY_VALUE:
                raise ValueError("new_emi exceeds maximum allowed value.")

        elif st == ScenarioTypeEnum.savings_change:
            if "new_monthly_savings" not in sd:
                raise ValueError("new_monthly_savings is required.")
            try:
                new_savings = Decimal(str(sd["new_monthly_savings"]))
            except Exception:
                raise ValueError("new_monthly_savings must be a valid numeric value.")
            if new_savings < 0:
                raise ValueError("new_monthly_savings must be greater than or equal to zero.")
            if new_savings > MAX_MONETARY_VALUE:
                raise ValueError("new_monthly_savings exceeds maximum allowed value.")

        elif st == ScenarioTypeEnum.new_goal:
            if "name" not in sd or "target_amount" not in sd or "current_saved" not in sd or "target_date" not in sd:
                raise ValueError("name, target_amount, current_saved, and target_date are required.")
            
            name = sd["name"]
            if not isinstance(name, str) or len(name.strip()) == 0:
                raise ValueError("name must be a non-empty string.")
            
            try:
                target_amount = Decimal(str(sd["target_amount"]))
            except Exception:
                raise ValueError("target_amount must be a valid numeric value.")
            if target_amount <= 0:
                raise ValueError("target_amount must be greater than zero.")
            if target_amount > MAX_MONETARY_VALUE:
                raise ValueError("target_amount exceeds maximum allowed value.")

            try:
                current_saved = Decimal(str(sd["current_saved"]))
            except Exception:
                raise ValueError("current_saved must be a valid numeric value.")
            if current_saved < 0:
                raise ValueError("current_saved must be greater than or equal to zero.")
            if current_saved > target_amount:
                raise ValueError("current_saved cannot exceed target_amount.")

            target_date = sd["target_date"]
            if not isinstance(target_date, str):
                raise ValueError("target_date must be a string.")
            
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

        return self

class SimulationImpact(BaseModel):
    income_change: Decimal
    expense_change: Decimal
    emi_change: Decimal
    surplus_change: Decimal
    emergency_fund_change: Decimal
    goal_capacity_change: Decimal
    investment_capacity_change: Decimal
    
    current_spending_limit: Optional[float] = 0.0
    scenario_spending_limit: Optional[float] = 0.0
    spending_limit_change: Optional[float] = 0.0
    current_safe_to_spend: Optional[float] = 0.0
    scenario_safe_to_spend: Optional[float] = 0.0
    safe_to_spend_change: Optional[float] = 0.0

class SimulationResponse(BaseModel):
    current: Dict[str, Any]
    scenario: Dict[str, Any]
    impact: SimulationImpact
    scenario_status: str
    recommendations: List[Dict[str, Any]]
    disclaimer: str

    model_config = ConfigDict(from_attributes=True)
