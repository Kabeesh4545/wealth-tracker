import pytest
from decimal import Decimal
from datetime import datetime
from fastapi import status
from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.models.financial_goal import FinancialGoal
from app.models.investment_profile import InvestmentProfile

# Import engine calculations for testing
from app.services.financial_planning.calculations import (
    calculate_planning_income,
    calculate_loans_obligations,
    calculate_debt_ratio
)
from app.services.financial_planning.emergency_fund import (
    calculate_emergency_fund_targets,
    get_adjusted_target_months,
    calculate_emergency_fund_status,
    calculate_emergency_contribution
)
from app.services.financial_planning.goals import process_and_allocate_goals
from app.services.financial_planning.budget import reconcile_budget

def test_planning_income_and_loans():
    # Test planning income variables (variable income factor = 0.50)
    income = calculate_planning_income(salary=50000.0, other=2000.0, variable=10000.0)
    assert income == Decimal("57000.0")

    # Test loans EMI calculations
    profile = FinancialProfile(housing_type="Own House", has_home_loan="Yes", home_loan_emi=5000.0)
    loans = [
        Loan(monthly_emi=2500.0, outstanding_amount=50000.0),
        Loan(monthly_emi=1500.0, outstanding_amount=30000.0)
    ]
    total_emi, total_outstanding = calculate_loans_obligations(loans, profile)
    assert total_emi == Decimal("9000.0") # 2500 + 1500 + 5000 (home loan emi)
    assert total_outstanding == Decimal("80000.0")

def test_debt_status_classification():
    # Low Debt (ratio <= 0.20)
    ratio, status_tag = calculate_debt_ratio(Decimal("2000.0"), Decimal("10000.0"))
    assert status_tag == "Low"
    
    # Moderate Debt (0.20 < ratio <= 0.40)
    ratio, status_tag = calculate_debt_ratio(Decimal("3000.0"), Decimal("10000.0"))
    assert status_tag == "Moderate"
    
    # High Debt (ratio > 0.40)
    ratio, status_tag = calculate_debt_ratio(Decimal("4500.0"), Decimal("10000.0"))
    assert status_tag == "High"

def test_emergency_fund_scaling():
    # Case 1: Employee, 2 dependents, Low debt
    # Base: 6 months
    profile_1 = FinancialProfile(employment_type="Employee", dependents=2)
    monthly_obs, base_months = calculate_emergency_fund_targets(Decimal("10000.0"), Decimal("2000.0"), Decimal("3000.0"), profile_1)
    adjusted_1 = get_adjusted_target_months(base_months, "Low")
    assert adjusted_1 == 6

    # Case 2: Self-employed, 2 dependents, Low debt
    # Base: 6 months + 2 self-employed = 8 months
    profile_2 = FinancialProfile(employment_type="Self-employed", dependents=2)
    _, base_months = calculate_emergency_fund_targets(Decimal("10000.0"), Decimal("2000.0"), Decimal("3000.0"), profile_2)
    adjusted_2 = get_adjusted_target_months(base_months, "Low")
    assert adjusted_2 == 8

    # Case 3: Employee, 3 dependents, High debt
    # Base: 6 months + 1 (dependents > 2) = 7 months + 1 (High Debt) = 8 months
    profile_3 = FinancialProfile(employment_type="Employee", dependents=3)
    _, base_months = calculate_emergency_fund_targets(Decimal("10000.0"), Decimal("2000.0"), Decimal("3000.0"), profile_3)
    adjusted_3 = get_adjusted_target_months(base_months, "High")
    assert adjusted_3 == 8

    # Case 4: Self-employed, 4 dependents, High debt
    # Base: 6 months + 2 (self-employed) + 1 (dependents > 2) = 9 months + 1 (High Debt) = 10 months -> capped at 9 months max
    profile_4 = FinancialProfile(employment_type="Self-employed", dependents=4)
    _, base_months = calculate_emergency_fund_targets(Decimal("10000.0"), Decimal("2000.0"), Decimal("3000.0"), profile_4)
    adjusted_4 = get_adjusted_target_months(base_months, "High")
    assert adjusted_4 == 9

def test_emergency_contribution_caps():
    # Gap = 5000, surplus = 20000, 30% of surplus = 6000. Cap = min(6000, 5000) = 5000
    contrib = calculate_emergency_contribution(surplus=Decimal("20000.0"), gap=Decimal("5000.0"))
    assert contrib == Decimal("5000.0")

    # Gap = 0, surplus = 20000 -> 0 contribution
    contrib_zero = calculate_emergency_contribution(surplus=Decimal("20000.0"), gap=Decimal("0.0"))
    assert contrib_zero == Decimal("0.0")

def test_goal_prioritization_and_allocation():
    # Setup test goals
    ref_date = datetime(2026, 8, 1)
    goals = [
        # Overdue goal (due immediately)
        FinancialGoal(id=1, goal_name="Overdue Debt", target_amount=10000.0, current_amount=5000.0, target_date="2026-06"),
        # Near goal (due in 2 months)
        FinancialGoal(id=2, goal_name="Vehicle Deposit", target_amount=20000.0, current_amount=10000.0, target_date="2026-10"),
        # Far goal (due in 10 months)
        FinancialGoal(id=3, goal_name="House Downpayment", target_amount=100000.0, current_amount=50000.0, target_date="2027-06")
    ]
    
    # Available surplus = 8000
    # Prioritization matches: Overdue first, then vehicle (2 months left), then house (10 months left).
    # Overdue: remaining = 5000. Outflows = 5000. Surplus left = 3000.
    # Vehicle: remaining = 10000, months = 2. Required = 5000. Allocated = 3000. Surplus left = 0.
    # House: remaining = 50000, months = 10. Required = 5000. Allocated = 0. Surplus left = 0.
    processed, total_goal_contrib = process_and_allocate_goals(goals, available_surplus=Decimal("8000.0"), ref_date=ref_date)
    
    assert total_goal_contrib == Decimal("8000.0")
    assert len(processed) == 3
    
    # Match items
    goals_by_id = {g["id"]: g for g in processed}
    assert goals_by_id[1]["allocated_contribution"] == 5000.0
    assert goals_by_id[1]["status"] == "Overdue"

    assert goals_by_id[2]["allocated_contribution"] == 3000.0
    assert goals_by_id[2]["required_monthly_contribution"] == 5000.0
    assert goals_by_id[2]["status"] == "Challenging"

    assert goals_by_id[3]["allocated_contribution"] == 0.0
    assert goals_by_id[3]["required_monthly_contribution"] == 5000.0
    assert goals_by_id[3]["status"] == "Not Currently Feasible"

def test_budget_reconciliation_invariant():
    # Reconciles essential + lifestyle + loans + emergency + goals + investments + buffer == planning_income
    income = Decimal("50000.0")
    essential = Decimal("18000.0")
    lifestyle = Decimal("7000.0")
    loans = Decimal("5000.0")
    emergency = Decimal("2000.0")
    goals = Decimal("4000.0")
    investments = Decimal("10000.0") # remaining surplus = 50000 - 18000 - 7000 - 5000 - 2000 - 4000 = 14000
    
    budget = reconcile_budget(
        planning_income=income,
        essential_total=essential,
        lifestyle_total=lifestyle,
        loan_payments_total=loans,
        emergency_contribution=emergency,
        goal_contribution=goals,
        investment_capacity=investments
    )
    
    # Total sum must equal planning_income exactly
    total_alloc = sum(budget.values())
    assert total_alloc == float(income)
    assert budget["buffer"] == 4000.0 # leftovers

@pytest.fixture
def seed_planning_database(db_session, setup_test_db):
    # Setup test user profile details
    profile = FinancialProfile(
        user_id=1, age=28, city="Coimbatore", employment_type="Employee",
        family_members=4, dependents=2, monthly_salary=50000.0, other_income=2000.0,
        variable_income=10000.0, housing_type="Rent", rent_amount=10000.0, maintenance=1000.0
    )
    savings = Saving(user_id=1, bank_savings=30000.0, emergency_fund=10000.0)
    loans = [
        Loan(user_id=1, loan_type="Vehicle Loan", outstanding_amount=150000.0, monthly_emi=4000.0, interest_rate=9.0, remaining_tenure_months=36)
    ]
    expenses = [
        PlannedExpense(user_id=1, category="foodGroceries", expense_type="essential", monthly_amount=8000.0),
        PlannedExpense(user_id=1, category="eatingOutside", expense_type="lifestyle", monthly_amount=3000.0)
    ]
    goals = [
        FinancialGoal(user_id=1, goal_name="Vehicle Deposit", target_amount=150000.0, current_amount=30000.0, target_date="2027-12")
    ]
    ip = InvestmentProfile(user_id=1, experience="Beginner", time_horizon="3-5 years", risk_tolerance="Medium", primary_preference="Balanced Growth")
    
    db_session.add(profile)
    db_session.add(savings)
    db_session.add_all(loans)
    db_session.add_all(expenses)
    db_session.add_all(goals)
    db_session.add(ip)
    db_session.commit()

def test_api_planning_unauthorized(client):
    response = client.get("/api/planning/monthly-plan")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_api_planning_authorized(client, token_headers, seed_planning_database):
    response = client.get("/api/planning/monthly-plan", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["user_id"] == 1
    assert data["health_status"] in ["Healthy", "Needs Attention", "At Risk"]
    
    assert "income" in data
    # planning_income = 50000 + 2000 + (10000 * 0.5) = 57000.0
    assert data["income"]["planning_income"] == 57000.0

    assert "expenses" in data
    assert "debt" in data
    assert "cash_flow" in data
    assert "emergency_fund" in data
    assert "goals" in data
    assert "investment" in data
    assert "budget" in data
    assert "local_benchmarks" in data
    assert "recommendations" in data
    assert "explanations" in data
    assert "disclaimer" in data
