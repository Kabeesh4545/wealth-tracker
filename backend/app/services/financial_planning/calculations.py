from decimal import Decimal
from typing import List
from app.models.financial_profile import FinancialProfile
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.services.financial_planning import PLANNING_CONFIG

def calculate_planning_income(salary: float, other: float, variable: float) -> Decimal:
    """
    Computes planning income: fixed_income + discounted_variable_income.
    """
    fixed_income = Decimal(str(salary or 0.0)) + Decimal(str(other or 0.0))
    discount = PLANNING_CONFIG["variable_income_factor"]
    discounted_variable = Decimal(str(variable or 0.0)) * discount
    return fixed_income + discounted_variable

def calculate_actual_expenses(expenses_list: List[PlannedExpense]) -> tuple[Decimal, Decimal, Decimal]:
    """
    Calculates essential, lifestyle, and total actual monthly expenses.
    Does not include housing costs or loan EMIs which are handled separately.
    """
    essential = Decimal("0.0")
    lifestyle = Decimal("0.0")
    
    for exp in expenses_list:
        amt = Decimal(str(exp.monthly_amount or 0.0))
        if exp.expense_type == "essential":
            essential += amt
        elif exp.expense_type == "lifestyle":
            lifestyle += amt
            
    return essential, lifestyle, essential + lifestyle

def calculate_housing_obligations(profile: FinancialProfile) -> Decimal:
    """
    Calculates non-debt housing obligations from profile.
    Home Loan EMI is excluded here and included under loan obligations to avoid double counting.
    """
    if not profile:
        return Decimal("0.0")
        
    h_type = (profile.housing_type or "").lower()
    maint = Decimal(str(profile.maintenance or 0.0))
    other = Decimal(str(profile.other_housing_expenses or 0.0))

    if h_type == "rent":
        rent = Decimal(str(profile.rent_amount or 0.0))
        return rent + maint + other
    elif h_type == "own house":
        return maint + other
    elif h_type == "living with family":
        contrib = Decimal(str(profile.household_contribution or 0.0))
        return contrib + other
    else:
        return other

def calculate_loans_obligations(loans_list: List[Loan], profile: FinancialProfile) -> tuple[Decimal, Decimal]:
    """
    Calculates total monthly loan EMIs and total outstanding debt.
    Includes home loan EMI if specified in housing profile.
    """
    total_emi = Decimal("0.0")
    total_outstanding = Decimal("0.0")
    
    # 1. Sum loans from database
    for loan in loans_list:
        total_emi += Decimal(str(loan.monthly_emi or 0.0))
        total_outstanding += Decimal(str(loan.outstanding_amount or 0.0))
        
    # 2. Add home loan if present in profile
    if profile and (profile.housing_type or "").lower() == "own house" and (profile.has_home_loan or "").lower() == "yes":
        total_emi += Decimal(str(profile.home_loan_emi or 0.0))
        # Home loan outstanding is not explicitly tracked in profile, so outstanding remains database loans list only.

    return total_emi, total_outstanding

def calculate_debt_ratio(total_emi: Decimal, planning_income: Decimal) -> tuple[Decimal, str]:
    """
    Calculates debt-to-income ratio and debt risk classification.
    """
    if planning_income <= 0:
        return Decimal("0.0") if total_emi <= 0 else Decimal("1.0"), "High"
        
    ratio = total_emi / planning_income
    
    thresholds = PLANNING_CONFIG["debt_thresholds"]
    if ratio <= thresholds["low"]:
        status = "Low"
    elif ratio <= thresholds["moderate"]:
        status = "Moderate"
    else:
        status = "High"
        
    return ratio, status
