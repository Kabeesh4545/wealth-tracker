import pytest
from datetime import date, datetime
from decimal import Decimal
from fastapi import status

from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution
from app.models.financial_profile import FinancialProfile

@pytest.fixture
def seed_goals_and_profiles(db_session):
    # Set up user 1 details
    profile_1 = FinancialProfile(
        user_id=1, age=28, city="Coimbatore", employment_type="Employee",
        family_members=1, dependents=0, monthly_salary=50000.0, other_income=0.0,
        variable_income=0.0, housing_type="Own House"
    )
    # Goal A (Laptop) owned by User 1. Initial saved ₹30,000, target ₹80,000, deadline Dec next year.
    goal_a = FinancialGoal(
        id=101, user_id=1, goal_name="Laptop", 
        target_amount=Decimal("80000.00"), current_amount=Decimal("30000.00"), 
        target_date=f"{date.today().year + 1}-12"
    )
    
    # User 2 details
    profile_2 = FinancialProfile(
        user_id=2, age=30, city="Chennai", employment_type="Employee",
        family_members=1, dependents=0, monthly_salary=60000.0, other_income=0.0,
        variable_income=0.0, housing_type="Own House"
    )
    # Goal B owned by User 2.
    goal_b = FinancialGoal(
        id=102, user_id=2, goal_name="Car", 
        target_amount=Decimal("500000.00"), current_amount=Decimal("100000.00"), 
        target_date="2028-12"
    )

    db_session.add(profile_1)
    db_session.add(profile_2)
    db_session.add(goal_a)
    db_session.add(goal_b)
    db_session.commit()

# --- 1. AUTHENTICATION TESTS ---
def test_contributions_unauthenticated_requests(client):
    assert client.get("/api/goals/progress").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.post("/api/goals/101/contributions", json={"amount": 1000}).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get("/api/goals/101/contributions").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get("/api/goals/101/progress").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.put("/api/goals/101/contributions/1", json={"amount": 1000}).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.delete("/api/goals/101/contributions/1").status_code == status.HTTP_401_UNAUTHORIZED

# --- 2. SECURITY OWNERSHIP & ISOLATION TESTS ---
def test_ownership_and_user_isolation(client, token_headers, db_session, seed_goals_and_profiles):
    # User 1 (authenticated by token_headers) tries to access User 2's Goal B (id=102) -> 404
    assert client.get("/api/goals/102/progress", headers=token_headers).status_code == status.HTTP_404_NOT_FOUND
    assert client.get("/api/goals/102/contributions", headers=token_headers).status_code == status.HTTP_404_NOT_FOUND
    
    # User 1 tries to add contribution to Goal B -> 404
    payload = {
        "amount": 5000.00,
        "contribution_date": str(date.today()),
        "description": "Attempt to add contribution",
        "source": "Bank Savings"
    }
    assert client.post("/api/goals/102/contributions", json=payload, headers=token_headers).status_code == status.HTTP_404_NOT_FOUND

    # Add a contribution belonging to User 2's Goal B directly to the database
    contrib_b = GoalContribution(
        id=202, goal_id=102, user_id=2, amount=Decimal("10000.00"), 
        contribution_date=date.today(), source="Bank Savings"
    )
    db_session.add(contrib_b)
    db_session.commit()

    # User 1 tries to modify or delete User 2's contribution -> 404
    assert client.put("/api/goals/102/contributions/202", json={"amount": 8000.00}, headers=token_headers).status_code == status.HTTP_404_NOT_FOUND
    assert client.delete("/api/goals/102/contributions/202", headers=token_headers).status_code == status.HTTP_404_NOT_FOUND

# --- 3. INPUT VALIDATION TESTS ---
def test_contribution_input_validation(client, token_headers, seed_goals_and_profiles):
    # Negative amount -> 422
    payload_neg = {
        "amount": -500.00,
        "contribution_date": str(date.today()),
        "source": "Salary"
    }
    assert client.post("/api/goals/101/contributions", json=payload_neg, headers=token_headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Zero amount -> 422
    payload_zero = {
        "amount": 0.00,
        "contribution_date": str(date.today()),
        "source": "Salary"
    }
    assert client.post("/api/goals/101/contributions", json=payload_zero, headers=token_headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Future date -> 422
    payload_future = {
        "amount": 1000.00,
        "contribution_date": "2030-01-01",
        "source": "Salary"
    }
    res = client.post("/api/goals/101/contributions", json=payload_future, headers=token_headers)
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Actual goal contributions cannot be recorded for a future date." in res.json()["detail"][0]["msg"]

    # Invalid source option -> 422
    payload_source = {
        "amount": 1000.00,
        "contribution_date": str(date.today()),
        "source": "Gold Coins"
    }
    assert client.post("/api/goals/101/contributions", json=payload_source, headers=token_headers).status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

# --- 4. PROGRESS MATH, COMPLETION & DECIMAL PRECISION ---
def test_progress_math_and_decimal_precision(client, token_headers, db_session, seed_goals_and_profiles):
    # Log two contributions with precise decimals
    payload_1 = {
        "amount": 10000.25,
        "contribution_date": str(date.today()),
        "source": "Bank Savings",
        "description": "Savings chunk 1"
    }
    payload_2 = {
        "amount": 2500.75,
        "contribution_date": str(date.today()),
        "source": "Salary",
        "description": "Savings chunk 2"
    }
    
    # 1. Post contributions
    assert client.post("/api/goals/101/contributions", json=payload_1, headers=token_headers).status_code == status.HTTP_201_CREATED
    assert client.post("/api/goals/101/contributions", json=payload_2, headers=token_headers).status_code == status.HTTP_201_CREATED

    # 2. Get progress
    # Target: 80,000. Original: 30,000. Contributions: 10,000.25 + 2,500.75 = 12,501.00.
    # Current Saved: 42,501.00. Remaining: 37,499.00.
    # Progress: 42,501 / 80,000 * 100 = 53.13%
    res = client.get("/api/goals/101/progress", headers=token_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["current_saved"] == 42501.00
    assert data["remaining_amount"] == 37499.00
    assert data["progress_percentage"] == 53.13
    assert data["actual_status"] == "On Track"

    # 3. Test completion block
    # Add a large contribution to complete the goal
    payload_complete = {
        "amount": 40000.00,
        "contribution_date": str(date.today()),
        "source": "Bank Savings"
    }
    assert client.post("/api/goals/101/contributions", json=payload_complete, headers=token_headers).status_code == status.HTTP_201_CREATED

    # Verify status is Completed, remaining is 0, progress is 100%
    res_comp = client.get("/api/goals/101/progress", headers=token_headers)
    assert res_comp.json()["actual_status"] == "Completed"
    assert res_comp.json()["remaining_amount"] == 0.0
    assert res_comp.json()["progress_percentage"] == 100.0

    # Try to add another contribution to Completed goal -> 422
    res_block = client.post("/api/goals/101/contributions", json={"amount": 500.00, "contribution_date": str(date.today())}, headers=token_headers)
    assert res_block.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Goal has already been completed." in res_block.json()["detail"]

# --- 5. OVERDUE GOALS TESTS ---
def test_overdue_goal_detection(client, token_headers, db_session, seed_goals_and_profiles):
    # Goal due in the past (e.g. 2026-06)
    goal_past = FinancialGoal(
        id=103, user_id=1, goal_name="Past Due Goal", 
        target_amount=Decimal("5000.00"), current_amount=Decimal("2000.00"), 
        target_date="2026-06"
    )
    db_session.add(goal_past)
    db_session.commit()

    res = client.get("/api/goals/103/progress", headers=token_headers)
    assert res.status_code == 200
    assert res.json()["actual_status"] == "Overdue"
    assert res.json()["months_remaining"] == 0

# --- 6. PLANNED VS ACTUAL METRIC COMPARISON ---
def test_planned_vs_actual_contribution(client, token_headers, db_session, seed_goals_and_profiles):
    # In seed_goals_and_profiles, user has 50k income, no loans/expenses -> surplus = 50k.
    # EF contribution is 0 (since they have no expenses/debt, or let's assume it gets calculated).
    # Step 5 allocated monthly contribution will be calculated.
    # Let's post an actual contribution for the current month
    today = date.today()
    payload = {
        "amount": 3000.00,
        "contribution_date": str(today),
        "source": "Salary"
    }
    client.post("/api/goals/101/contributions", json=payload, headers=token_headers)

    res = client.get(f"/api/goals/101/progress?month={today.month}&year={today.year}", headers=token_headers)
    assert res.status_code == 200
    data = res.json()
    
    # Verify planning_status and actual_status are populated separately
    assert "planning_status" in data
    assert "actual_status" in data
    assert data["actual_month_contribution"] == 3000.00
    assert data["difference"] == round(data["actual_month_contribution"] - data["planned_monthly_contribution"], 2)

# --- 7. CONTRIBUTION HISTORY AND TRENDS ---
def test_contribution_history_and_trends(client, token_headers, db_session, seed_goals_and_profiles):
    today = date.today()
    # Add multiple contributions across different months (May, June, July, August)
    db_session.add_all([
        GoalContribution(goal_id=101, user_id=1, amount=Decimal("5000.00"), contribution_date=date(2026, 5, 10), source="Salary"),
        GoalContribution(goal_id=101, user_id=1, amount=Decimal("4000.00"), contribution_date=date(2026, 6, 12), source="Salary"),
        GoalContribution(goal_id=101, user_id=1, amount=Decimal("3000.00"), contribution_date=date(2026, 7, 15), source="Salary"),
        GoalContribution(goal_id=101, user_id=1, amount=Decimal("5000.00"), contribution_date=date(2026, 8, 18), source="Salary")
    ])
    db_session.commit()

    # 1. Verify history list retrieval
    res_hist = client.get("/api/goals/101/contributions?page=1&page_size=2", headers=token_headers)
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert len(data_hist) == 2 # paginated to 2
    # Sorted newest first (August, then July)
    assert data_hist[0]["contribution_date"] == "2026-08-18"
    assert data_hist[1]["contribution_date"] == "2026-07-15"

    # 2. Verify 6-month contributions trend
    res_trend = client.get("/api/goals/trend", headers=token_headers)
    assert res_trend.status_code == 200
    data_trend = res_trend.json()
    assert len(data_trend) == 6 # last 6 months

    aug_item = next((t for t in data_trend if t["month_key"] == "2026-08"), None)
    if aug_item:
        assert aug_item["amount"] == 5000.00
