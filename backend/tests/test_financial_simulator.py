import pytest
from decimal import Decimal
from datetime import datetime, timedelta

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution

def test_simulator_unauthenticated(client):
    res = client.post("/api/simulator/what-if", json={
        "scenario_type": "salary_change",
        "scenario_data": {"new_salary": "60000.00"}
    })
    assert res.status_code == 401

def test_salary_change_scenario(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert test_user is not None

    # Setup baseline data
    profile = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    if profile:
        profile.monthly_salary = 50000.00
        profile.other_income = 0.0
        profile.variable_income = 0.0
    else:
        profile = FinancialProfile(
            user_id=test_user.id, age=30, city="Mumbai", employment_type="Employee",
            monthly_salary=50000.00, housing_type="Rent", rent_amount=10000.00
        )
        db_session.add(profile)
    db_session.commit()

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "salary_change",
            "scenario_data": {"new_salary": "60000.00"}
        },
        headers=token_headers
    )
    print("STATUS CODE:", res.status_code)
    assert res.status_code == 200
    data = res.json()
    assert float(data["current"]["income"]["planning_income"]) == 50000.0
    assert float(data["scenario"]["income"]["planning_income"]) == 60000.0
    assert float(data["impact"]["income_change"]) == 10000.0
    assert float(data["impact"]["surplus_change"]) == 10000.0
    assert data["scenario_status"] == "Improved"

def test_expense_change_scenario(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Add planned expense
    profile = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=test_user.id, age=30, city="Mumbai", employment_type="Employee", monthly_salary=50000.00, housing_type="Other")
        db_session.add(profile)
    
    # Delete existing planned expenses for user
    db_session.query(PlannedExpense).filter(PlannedExpense.user_id == test_user.id).delete()
    
    pe = PlannedExpense(user_id=test_user.id, category="Food & Groceries", expense_type="essential", monthly_amount=6000.00)
    db_session.add(pe)
    db_session.commit()

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "expense_change",
            "scenario_data": {
                "category": "Essential",
                "subcategory": "Food & Groceries",
                "new_monthly_amount": "9000.00"
            }
        },
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert float(data["impact"]["expense_change"]) == 3000.0
    assert float(data["impact"]["surplus_change"]) == -3000.0
    assert data["scenario_status"] == "Worsened"

def test_loan_change_scenario(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Add loan
    db_session.query(Loan).filter(Loan.user_id == test_user.id).delete()
    loan = Loan(user_id=test_user.id, loan_type="Car Loan", outstanding_amount=500000.00, monthly_emi=8000.00, interest_rate=9.5, remaining_tenure_months=60)
    db_session.add(loan)
    db_session.commit()

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "loan_change",
            "scenario_data": {
                "loan_id": loan.id,
                "new_emi": "12000.00"
            }
        },
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert float(data["impact"]["emi_change"]) == 4000.0
    assert float(data["impact"]["surplus_change"]) == -4000.0
    assert data["scenario_status"] == "Worsened"

def test_loan_isolation(client, other_token_headers, db_session):
    # Load User 1 (test_user)
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        # Create test_user if not exists
        test_user = User(email="test@example.com", password_hash="testpassword123", full_name="Test User")
        db_session.add(test_user)
        db_session.commit()

    # Add loan belonging to test_user (User 1)
    loan = Loan(user_id=test_user.id, loan_type="Personal Loan", outstanding_amount=100000.00, monthly_emi=5000.00, interest_rate=12.0, remaining_tenure_months=24)
    db_session.add(loan)
    db_session.commit()

    # User 2 (authenticated by other_token_headers) tries to simulate with User 1's loan id -> 404
    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "loan_change",
            "scenario_data": {
                "loan_id": loan.id,
                "new_emi": "8000.00"
            }
        },
        headers=other_token_headers
    )
    assert res.status_code == 404

def test_savings_change_scenario(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()

    # Ensure profile exists with positive salary
    profile = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    if not profile:
        profile = FinancialProfile(
            user_id=test_user.id, age=30, city="Mumbai", employment_type="Employee",
            monthly_salary=50000.00, housing_type="Other"
        )
        db_session.add(profile)
    else:
        profile.monthly_salary = 50000.00
    db_session.commit()

    # Clear goals and add a single goal
    db_session.query(FinancialGoal).filter(FinancialGoal.user_id == test_user.id).delete()
    goal = FinancialGoal(
        user_id=test_user.id, goal_name="House Purchase",
        target_amount=Decimal("500000.00"), current_amount=Decimal("10000.00"),
        target_date="2030-12"
    )
    db_session.add(goal)
    db_session.commit()

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "savings_change",
            "scenario_data": {
                "new_monthly_savings": "8000.00"
            }
        },
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert float(data["scenario"]["budget"]["emergency_fund"]) + float(data["scenario"]["budget"]["goals"]) == 8000.0

def test_new_goal_scenario(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Clear existing goals
    db_session.query(FinancialGoal).filter(FinancialGoal.user_id == test_user.id).delete()
    db_session.commit()

    future_date = (datetime.now() + timedelta(days=400)).strftime("%Y-%m-%d")

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "new_goal",
            "scenario_data": {
                "name": "Retirement Fund",
                "target_amount": "500000.00",
                "current_saved": "50000.00",
                "target_date": future_date
            }
        },
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    
    # Assert goal exists in scenario list
    scen_goals = data["scenario"]["goals"]
    assert len(scen_goals) == 1
    assert scen_goals[0]["goal_name"] == "Retirement Fund"
    
    # Check that database does not contain this goal
    db_goal = db_session.query(FinancialGoal).filter(FinancialGoal.goal_name == "Retirement Fund", FinancialGoal.user_id == test_user.id).first()
    assert db_goal is None

def test_validation_errors(client, token_headers, db_session):
    # Past target date
    past_date = "2020-01-01"
    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "new_goal",
            "scenario_data": {
                "name": "Phone", "target_amount": "50000.00", "current_saved": "0.00", "target_date": past_date
            }
        },
        headers=token_headers
    )
    assert res.status_code == 422

    # Negative salary
    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "salary_change",
            "scenario_data": {"new_salary": "-10.00"}
        },
        headers=token_headers
    )
    assert res.status_code == 422

    # Invalid subcategory
    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "expense_change",
            "scenario_data": {
                "category": "Essential", "subcategory": "Ferrari Maintenance", "new_monthly_amount": "100.00"
            }
        },
        headers=token_headers
    )
    assert res.status_code == 422

def test_read_only_guarantee(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Capture database baseline counts
    profile_before = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    salary_before = profile_before.monthly_salary if profile_before else 0.0
    
    goals_count = db_session.query(FinancialGoal).filter(FinancialGoal.user_id == test_user.id).count()
    loans_count = db_session.query(Loan).filter(Loan.user_id == test_user.id).count()
    expenses_count = db_session.query(PlannedExpense).filter(PlannedExpense.user_id == test_user.id).count()
    savings_count = db_session.query(Saving).filter(Saving.user_id == test_user.id).count()
    contributions_count = db_session.query(GoalContribution).count()

    # Run simulator salary change
    client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "salary_change",
            "scenario_data": {"new_salary": "99999.00"}
        },
        headers=token_headers
    )

    # Run simulator new goal
    client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "new_goal",
            "scenario_data": {
                "name": "Trip to Spain", "target_amount": "100000.00", "current_saved": "0.00",
                "target_date": (datetime.now() + timedelta(days=200)).strftime("%Y-%m-%d")
            }
        },
        headers=token_headers
    )

    # Refresh DB session
    db_session.expire_all()

    # Assert all identical
    profile_after = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    salary_after = profile_after.monthly_salary if profile_after else 0.0
    
    assert salary_before == salary_after
    assert goals_count == db_session.query(FinancialGoal).filter(FinancialGoal.user_id == test_user.id).count()
    assert loans_count == db_session.query(Loan).filter(Loan.user_id == test_user.id).count()
    assert expenses_count == db_session.query(PlannedExpense).filter(PlannedExpense.user_id == test_user.id).count()
    assert savings_count == db_session.query(Saving).filter(Saving.user_id == test_user.id).count()
    assert contributions_count == db_session.query(GoalContribution).count()

def test_decimal_precision(client, token_headers, db_session):
    test_user = db_session.query(User).filter(User.email == "test@example.com").first()
    
    # Setup test precision profile
    profile = db_session.query(FinancialProfile).filter(FinancialProfile.user_id == test_user.id).first()
    if profile:
        profile.monthly_salary = 10000.25
        profile.other_income = 2500.75
        profile.variable_income = 0.0
    else:
        profile = FinancialProfile(
            user_id=test_user.id, age=30, city="Mumbai", employment_type="Employee",
            monthly_salary=10000.25, other_income=2500.75, housing_type="Rent"
        )
        db_session.add(profile)
    db_session.commit()

    res = client.post(
        "/api/simulator/what-if",
        json={
            "scenario_type": "salary_change",
            "scenario_data": {"new_salary": "10000.25"}
        },
        headers=token_headers
    )
    assert res.status_code == 200
    data = res.json()
    
    # 10000.25 + 2500.75 = 12501.00
    assert float(data["current"]["income"]["planning_income"]) == 12501.00
