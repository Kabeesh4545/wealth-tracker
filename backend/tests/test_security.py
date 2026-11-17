import pytest
import datetime
from decimal import Decimal
from jose import jwt
from fastapi import status
from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.expense import Expense
from app.models.loan import Loan
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution

# Helper to generate headers
def get_auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

# 1. Missing Token -> 401 Unauthorized
def test_missing_token_returns_401(client):
    response = client.get("/api/expenses")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.headers["WWW-Authenticate"] == "Bearer"

# 2. Malformed Token -> 401 Unauthorized
def test_malformed_token_returns_401(client):
    headers = get_auth_headers("this-is-not-a-valid-jwt")
    response = client.get("/api/expenses", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# 3. Expired JWT -> 401 Unauthorized
def test_expired_token_returns_401(client):
    expire = datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    to_encode = {"exp": expire, "sub": "1"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    headers = get_auth_headers(encoded_jwt)
    response = client.get("/api/expenses", headers=headers)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

# 4. Cross-User IDOR Protection (User A cannot access User B's resource -> 404)
def test_cross_user_idor_isolation(client, db_session):
    # Register User A and User B
    client.post("/api/auth/register", json={
        "full_name": "User A", "email": "usera@example.com", "password": "password123"
    })
    client.post("/api/auth/register", json={
        "full_name": "User B", "email": "userb@example.com", "password": "password123"
    })
    
    # Login User A and User B
    resp_a = client.post("/api/auth/login", data={"username": "usera@example.com", "password": "password123"})
    token_a = resp_a.json()["access_token"]
    
    resp_b = client.post("/api/auth/login", data={"username": "userb@example.com", "password": "password123"})
    token_b = resp_b.json()["access_token"]
    
    # User B creates an actual expense
    expense_payload = {
        "amount": 500.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "User B lunch",
        "payment_method": "UPI"
    }
    create_resp = client.post("/api/expenses", json=expense_payload, headers=get_auth_headers(token_b))
    assert create_resp.status_code == 201
    expense_id = create_resp.json()["id"]
    
    # User A tries to GET User B's expense -> 404
    get_resp = client.get(f"/api/expenses/{expense_id}", headers=get_auth_headers(token_a))
    assert get_resp.status_code == 404
    
    # User A tries to UPDATE User B's expense -> 404
    update_resp = client.put(f"/api/expenses/{expense_id}", json={"amount": 999.00}, headers=get_auth_headers(token_a))
    assert update_resp.status_code == 404
    
    # User A tries to DELETE User B's expense -> 404
    delete_resp = client.delete(f"/api/expenses/{expense_id}", headers=get_auth_headers(token_a))
    assert delete_resp.status_code == 404

# 5. Mass Assignment Protection (Client-provided user_id cannot change ownership)
def test_mass_assignment_protection(client):
    # Register and login User A
    client.post("/api/auth/register", json={
        "full_name": "User A", "email": "usera2@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "usera2@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    
    # Attempt to create expense providing a different user_id
    payload = {
        "amount": 100.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "Mass assignment test",
        "payment_method": "UPI",
        "user_id": 99999  # Attempted payload injection
    }
    response = client.post("/api/expenses", json=payload, headers=get_auth_headers(token))
    assert response.status_code == 201
    # Check that owner_id remained the authenticated user, NOT 99999
    data = response.json()
    assert data["user_id"] != 99999

# 6. Input Validation Boundaries
def test_input_validation_limits(client):
    # Register & login
    client.post("/api/auth/register", json={
        "full_name": "Validation User", "email": "val@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "val@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    
    headers = get_auth_headers(token)
    
    # Negative amount -> 422
    payload = {
        "amount": -50.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "Negative amount",
        "payment_method": "UPI"
    }
    response = client.post("/api/expenses", json=payload, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Over-length string -> 422
    payload = {
        "amount": 50.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "a" * 201, # Max length is 200
        "payment_method": "UPI"
    }
    response = client.post("/api/expenses", json=payload, headers=headers)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

# 7. SQL Injection Protection
def test_sql_injection_is_treated_as_data(client):
    client.post("/api/auth/register", json={
        "full_name": "SQL Injection User", "email": "sqli@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "sqli@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    headers = get_auth_headers(token)

    # Malicious SQL input as expense description
    payload = {
        "amount": 120.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "' OR '1'='1; DROP TABLE expenses;--",
        "payment_method": "UPI"
    }
    response = client.post("/api/expenses", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["description"] == "' OR '1'='1; DROP TABLE expenses;--"

# 8. XSS script inputs rendered as literal text
def test_xss_inputs_stored_literally(client):
    client.post("/api/auth/register", json={
        "full_name": "XSS User", "email": "xss@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "xss@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    headers = get_auth_headers(token)

    payload = {
        "amount": 250.00,
        "category": "Essential",
        "subcategory": "Food & Groceries",
        "expense_date": str(datetime.date.today()),
        "description": "<script>alert('xss')</script>",
        "payment_method": "UPI"
    }
    response = client.post("/api/expenses", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["description"] == "<script>alert('xss')</script>"

# 9. Secret keys are not returned in responses
def test_secrets_omitted_from_responses(client):
    client.post("/api/auth/register", json={
        "full_name": "Secret User", "email": "sec@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "sec@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    headers = get_auth_headers(token)
    
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "password" not in data
    assert "password_hash" not in data
    assert "SECRET_KEY" not in data
    assert "OPENAI_API_KEY" not in data

# 10. In-memory Rate Limiting returns 429 Too Many Requests
def test_rate_limiting_login_endpoint(client):
    # Send login requests repeatedly to trigger 429 rate limits
    login_payload = {
        "username": "rate_limit@example.com",
        "password": "wrongpassword"
    }
    
    triggered_429 = False
    for _ in range(25):
        response = client.post("/api/auth/login", data=login_payload, headers={"X-Test-Rate-Limit": "true"})
        if response.status_code == 429:
            triggered_429 = True
            assert "Retry-After" in response.headers
            break
            
    assert triggered_429

# 11. Global unhandled error handler returns a generic 500 error with a correlation ID
def test_global_exception_handler_returns_request_id(client, token_headers, db_session, monkeypatch):
    # Mock database session query to raise a raw exception forcing 500
    def mock_query(*args, **kwargs):
        raise Exception("Mock database crash error!")
        
    monkeypatch.setattr(db_session, "query", mock_query)
    
    response = client.get("/api/expenses", headers=token_headers)
    assert response.status_code == 500
    data = response.json()
    assert data["detail"] == "Internal server error"
    assert "request_id" in data

# 12. Decimal exact arithmetic checking
def test_decimal_monetary_exact_arithmetic():
    val1 = Decimal("10000.25")
    val2 = Decimal("2500.75")
    total = val1 + val2
    assert total == Decimal("12501.00")
    # Verify that no float residue (e.g. 12501.000000000002) is present
    assert str(total) == "12501.00"

# 13. Simulator is stateless and read-only
def test_simulator_does_not_modify_db(client, db_session):
    # Register and login User A
    client.post("/api/auth/register", json={
        "full_name": "Simulator User", "email": "sim@example.com", "password": "password123"
    })
    resp = client.post("/api/auth/login", data={"username": "sim@example.com", "password": "password123"})
    token = resp.json()["access_token"]
    headers = get_auth_headers(token)
    
    # Seed a financial profile for the user to pass baseline calculation checks
    profile_payload = {
        "age": 30,
        "city": "Coimbatore",
        "employment_type": "Employee",
        "family_members": 2,
        "dependents": 1,
        "monthly_salary": 80000.0,
        "other_income": 0.0,
        "variable_income": 0.0,
        "housing_type": "Rent",
        "rent_amount": 12000.0,
        "maintenance": 1500.0,
        "has_home_loan": "No",
        "home_loan_emi": 0.0,
        "household_contribution": 5000.0,
        "other_housing_expenses": 2000.0
    }
    profile_resp = client.post("/api/profile", json=profile_payload, headers=headers)
    assert profile_resp.status_code == 201
    
    # Create an initial loan
    loan_payload = {
        "loan_type": "Home Loan",
        "outstanding_amount": 5000000.0,
        "monthly_emi": 45000.0,
        "interest_rate": 8.5,
        "remaining_tenure_months": 180
    }
    create_resp = client.post("/api/loans", json=loan_payload, headers=headers)
    assert create_resp.status_code == 201
    loan_id = create_resp.json()["id"]
    
    initial_loan_count = db_session.query(Loan).count()
    
    # Run a what-if simulation (simulated loan delete scenario)
    sim_payload = {
        "scenario_type": "loan_change",
        "scenario_data": {
            "loan_id": loan_id,
            "new_emi": 0.0
        }
    }
    sim_resp = client.post("/api/simulator/what-if", json=sim_payload, headers=headers)
    assert sim_resp.status_code == 200
    
    # Verify database count remains identical after simulation runs
    final_loan_count = db_session.query(Loan).count()
    assert initial_loan_count == final_loan_count
