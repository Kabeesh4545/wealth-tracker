from typing import Dict, Any, List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.models.financial_goal import FinancialGoal
from app.models.investment_profile import InvestmentProfile

class SimulationProfile:
    def __init__(self, **kwargs):
        self.age = int(kwargs.get("age") or 30)
        self.city = str(kwargs.get("city") or "")
        self.employment_type = str(kwargs.get("employment_type") or "Employee")
        
        family = kwargs.get("family_members")
        self.family_members = int(family) if family is not None else None
        
        dep = kwargs.get("dependents")
        self.dependents = int(dep) if dep is not None else None
        
        self.monthly_salary = float(kwargs.get("monthly_salary") or 0.0)
        self.other_income = float(kwargs.get("other_income") or 0.0)
        self.variable_income = float(kwargs.get("variable_income") or 0.0)
        self.housing_type = str(kwargs.get("housing_type") or "Other")
        self.rent_amount = float(kwargs.get("rent_amount") or 0.0)
        self.maintenance = float(kwargs.get("maintenance") or 0.0)
        self.has_home_loan = kwargs.get("has_home_loan") or "No"
        self.home_loan_emi = float(kwargs.get("home_loan_emi") or 0.0)
        self.household_contribution = float(kwargs.get("household_contribution") or 0.0)
        self.other_housing_expenses = float(kwargs.get("other_housing_expenses") or 0.0)

class SimulationExpense:
    def __init__(self, **kwargs):
        self.category = str(kwargs.get("category") or "")
        self.expense_type = str(kwargs.get("expense_type") or "")
        self.monthly_amount = float(kwargs.get("monthly_amount") or 0.0)

class SimulationLoan:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.loan_type = str(kwargs.get("loan_type") or "")
        self.outstanding_amount = float(kwargs.get("outstanding_amount") or 0.0)
        self.monthly_emi = float(kwargs.get("monthly_emi") or 0.0)
        self.interest_rate = float(kwargs.get("interest_rate") or 0.0)
        self.remaining_tenure_months = int(kwargs.get("remaining_tenure_months") or 12)

class SimulationSaving:
    def __init__(self, **kwargs):
        self.bank_savings = float(kwargs.get("bank_savings") or 0.0)
        self.emergency_fund = float(kwargs.get("emergency_fund") or 0.0)

class SimulationGoal:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id")
        self.goal_name = str(kwargs.get("goal_name") or "")
        self.target_amount = float(kwargs.get("target_amount") or 0.0)
        self.current_amount = float(kwargs.get("current_amount") or 0.0)
        self.target_date = str(kwargs.get("target_date") or "")

class SimulationInvestmentProfile:
    def __init__(self, **kwargs):
        self.risk_tolerance = kwargs.get("risk_tolerance") or "Medium"
        self.time_horizon = kwargs.get("time_horizon") or "3-5 years"
        self.experience = kwargs.get("experience") or "Intermediate"
        self.primary_preference = kwargs.get("primary_preference") or "Balanced Growth"

def build_database_scenario_state(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Creates a plain in-memory FinancialScenarioState from database queries.
    """
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user_id).first()
    if not profile:
        profile = FinancialProfile(
            user_id=user_id, age=30, city="", employment_type="Employee",
            family_members=1, dependents=0, monthly_salary=0.0, other_income=0.0,
            variable_income=0.0, housing_type="Other"
        )
    
    savings = db.query(Saving).filter(Saving.user_id == user_id).first()
    if not savings:
        savings = Saving(user_id=user_id, bank_savings=0.0, emergency_fund=0.0)
    
    loans = db.query(Loan).filter(Loan.user_id == user_id).all()
    expenses = db.query(PlannedExpense).filter(PlannedExpense.user_id == user_id).all()
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
    inv_profile = db.query(InvestmentProfile).filter(InvestmentProfile.user_id == user_id).first()

    sim_profile = SimulationProfile(
        age=profile.age,
        city=profile.city,
        employment_type=profile.employment_type,
        family_members=profile.family_members,
        dependents=profile.dependents,
        monthly_salary=profile.monthly_salary,
        other_income=profile.other_income,
        variable_income=profile.variable_income,
        housing_type=profile.housing_type,
        rent_amount=profile.rent_amount,
        maintenance=profile.maintenance,
        has_home_loan=profile.has_home_loan,
        home_loan_emi=profile.home_loan_emi,
        household_contribution=profile.household_contribution,
        other_housing_expenses=profile.other_housing_expenses
    )

    sim_savings = SimulationSaving(
        bank_savings=savings.bank_savings,
        emergency_fund=savings.emergency_fund
    )

    sim_loans = [
        SimulationLoan(
            id=l.id,
            loan_type=l.loan_type,
            outstanding_amount=l.outstanding_amount,
            monthly_emi=l.monthly_emi,
            interest_rate=l.interest_rate,
            remaining_tenure_months=l.remaining_tenure_months
        )
        for l in loans
    ]

    sim_expenses = [
        SimulationExpense(
            category=e.category,
            expense_type=e.expense_type,
            monthly_amount=e.monthly_amount
        )
        for e in expenses
    ]

    sim_goals = [
        SimulationGoal(
            id=g.id,
            goal_name=g.goal_name,
            target_amount=g.target_amount,
            current_amount=g.current_amount,
            target_date=g.target_date
        )
        for g in goals
    ]

    if inv_profile:
        sim_inv_profile = SimulationInvestmentProfile(
            risk_tolerance=inv_profile.risk_tolerance,
            time_horizon=inv_profile.horizon,
            experience=inv_profile.experience,
            primary_preference=inv_profile.primary_preference
        )
    else:
        sim_inv_profile = SimulationInvestmentProfile()

    return {
        "profile": sim_profile,
        "savings": sim_savings,
        "loans": sim_loans,
        "expenses": sim_expenses,
        "goals": sim_goals,
        "investment_profile": sim_inv_profile
    }
