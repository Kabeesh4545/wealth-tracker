import pytest
from decimal import Decimal
from datetime import date
from fastapi import status

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense

from app.services.monthly_budget.calculator import calculate_monthly_budget
from app.services.investment_recommendation.engine import get_investment_recommendations
from app.services.investment_recommendation.suitability import calculate_suitability_scores

@pytest.fixture
def seed_budget_test_user(db_session, token_headers):
    # Retrieve the registered user created by token_headers
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Setup test user profile details (Positive surplus, emergency fund, low debt)
    profile = FinancialProfile(
        user_id=user.id, age=28, city="Coimbatore", employment_type="Employee",
        family_members=4, dependents=2, monthly_salary=50000.0, other_income=2000.0,
        variable_income=10000.0, housing_type="Rent", rent_amount=10000.0, maintenance=1000.0
    )
    savings = Saving(user_id=user.id, bank_savings=30000.0, emergency_fund=100000.0) # adequately funded
    loans = [
        Loan(user_id=user.id, loan_type="Vehicle Loan", outstanding_amount=50000.0, monthly_emi=2000.0, interest_rate=9.0, remaining_tenure_months=24) # low debt
    ]
    expenses = [
        PlannedExpense(user_id=user.id, category="foodGroceries", expense_type="essential", monthly_amount=8000.0),
        PlannedExpense(user_id=user.id, category="shopping", expense_type="lifestyle", monthly_amount=2000.0),
        PlannedExpense(user_id=user.id, category="eatingOutside", expense_type="lifestyle", monthly_amount=1000.0)
    ]

    db_session.add(profile)
    db_session.add(savings)
    for l in loans:
        db_session.add(l)
    for e in expenses:
        db_session.add(e)
    db_session.commit()
    
    return user

def test_monthly_spending_limit_engine(db_session, seed_budget_test_user):
    user = seed_budget_test_user
    budget = calculate_monthly_budget(db_session, user, ref_month="2026-09")
    
    assert budget["month"] == "2026-09"
    assert budget["planning_income"] == 50000.0 + 2000.0 + (10000.0 * 0.5) # 57000.00
    assert budget["lifestyle_limit"] > 0.0
    
    # Verify daily/weekly safe spending limit math matches remaining days
    import calendar
    today = date.today()
    if today.year == 2026 and today.month == 9:
        rem_days = max(30 - today.day + 1, 1)
    else:
        rem_days = 30
    assert budget["safe_to_spend_daily"] == float(round(Decimal(str(budget["safe_to_spend_monthly"])) / Decimal(str(rem_days)), 2))
    assert budget["safe_to_spend_weekly"] == float(round(Decimal(str(budget["safe_to_spend_monthly"])) / Decimal(str(rem_days)) * Decimal("7"), 2))

    # Verify reconciliation: categories limits
    food_limit = next(item for item in budget["categories"] if item["category"] == "Food & Groceries")
    assert food_limit["recommended_limit"] >= 8000.0

def test_deficit_user_budget_zero_discretionary(db_session, token_headers):
    # Retrieve the registered user created by token_headers
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Setup deficit user
    profile = FinancialProfile(
        user_id=user.id, age=30, city="Coimbatore", employment_type="Employee",
        family_members=1, dependents=0, monthly_salary=10000.0, housing_type="Rent", rent_amount=12000.0
    )
    db_session.add(profile)
    db_session.commit()
    
    budget = calculate_monthly_budget(db_session, user, ref_month="2026-09")
    
    # Deficit should lock safe to spend discretionary limits at 0
    assert budget["safe_to_spend_monthly"] == 0.0
    shopping_limit = next(item for item in budget["categories"] if item["category"] == "Shopping")
    assert shopping_limit["recommended_limit"] == 0.0

def test_investment_suitability_scoring_rules():
    # Low Risk, Short Horizon -> Sweep FD high, Equities low
    scored_products = calculate_suitability_scores(
        risk_tolerance="Low",
        horizon="Short-term",
        experience="Beginner",
        emergency_fund_ratio=0.5, # inadequate
        dti_ratio=0.1
    )
    
    savings_prod = next(p for p in scored_products if "Sweep" in p["investment_type"])
    equity_prod = next(p for p in scored_products if "Equity Mutual Funds" in p["investment_type"])
    
    assert savings_prod["suitability_score"] > equity_prod["suitability_score"]
    assert savings_prod["suitability_score"] >= 80
    assert equity_prod["suitability_score"] <= 40

def test_investment_recs_capacity_mapping(db_session, seed_budget_test_user):
    user = seed_budget_test_user
    recs = get_investment_recommendations(db_session, user)
    
    # Capacity must not exceed surplus
    assert recs["investment_capacity"] >= 0.0
    assert "best_match" in recs
    assert "investment_options" in recs
    
    # Score constraints
    if recs["best_match"]:
        best_score = recs["best_match"]["suitability_score"]
        assert 0 <= best_score <= 100

def test_unauthorized_endpoints(client):
    r1 = client.get("/api/planning/monthly-budget")
    assert r1.status_code == status.HTTP_401_UNAUTHORIZED
    
    r2 = client.get("/api/investments/recommendations")
    assert r2.status_code == status.HTTP_401_UNAUTHORIZED

def test_user_isolation(client, db_session):
    # Register user A and B
    client.post("/api/auth/register", json={"full_name": "User A", "email": "a_iso@example.com", "password": "password123"})
    client.post("/api/auth/register", json={"full_name": "User B", "email": "b_iso@example.com", "password": "password123"})
    
    # Seed user A and B profiles differently
    r_login_a = client.post("/api/auth/login", data={"username": "a_iso@example.com", "password": "password123"})
    token_a = r_login_a.json()["access_token"]
    
    r_login_b = client.post("/api/auth/login", data={"username": "b_iso@example.com", "password": "password123"})
    token_b = r_login_b.json()["access_token"]
    
    # Set salary A to 80k, salary B to 20k
    client.post("/api/profile", json={"age": 30, "city": "Coimbatore", "employment_type": "Employee", "monthly_salary": 80000.0, "housing_type": "Other"}, headers={"Authorization": f"Bearer {token_a}"})
    client.post("/api/profile", json={"age": 30, "city": "Coimbatore", "employment_type": "Employee", "monthly_salary": 20000.0, "housing_type": "Other"}, headers={"Authorization": f"Bearer {token_b}"})
    
    # Call budget endpoint of User A and check they don't see User B's details
    r_budget_a = client.get("/api/planning/monthly-budget", headers={"Authorization": f"Bearer {token_a}"})
    assert r_budget_a.status_code == 200
    assert r_budget_a.json()["planning_income"] == 80000.0
