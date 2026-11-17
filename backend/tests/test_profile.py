import pytest

def test_create_and_get_profile(client, token_headers):
    payload = {
        "age": 28,
        "city": "Bengaluru",
        "employment_type": "Employee",
        "family_members": 3,
        "dependents": 1,
        "monthly_salary": 60000.0,
        "other_income": 5000.0,
        "variable_income": 0.0,
        "housing_type": "Rent",
        "rent_amount": 15000.0,
        "maintenance": 2000.0,
        "has_home_loan": "No",
        "home_loan_emi": 0.0,
        "household_contribution": 0.0,
        "other_housing_expenses": 0.0
    }
    
    # Create profile
    response = client.post("/api/profile", json=payload, headers=token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["city"] == "Bengaluru"
    assert data["age"] == 28
    
    # Get profile
    response = client.get("/api/profile", headers=token_headers)
    assert response.status_code == 200
    assert response.json()["city"] == "Bengaluru"

def test_create_profile_validation_errors(client, token_headers):
    # Underage (age < 15)
    payload_underage = {
        "age": 14,
        "city": "Chennai",
        "employment_type": "Student",
        "housing_type": "Other"
    }
    response = client.post("/api/profile", json=payload_underage, headers=token_headers)
    assert response.status_code == 422 # Pydantic Validation Error

    # Dependents > Family Members
    payload_deps = {
        "age": 30,
        "city": "Chennai",
        "employment_type": "Employee",
        "family_members": 2,
        "dependents": 3,
        "housing_type": "Other"
    }
    response = client.post("/api/profile", json=payload_deps, headers=token_headers)
    assert response.status_code == 422

def test_update_profile(client, token_headers):
    # Ensure profile exists first
    payload = {
        "age": 30,
        "city": "Coimbatore",
        "employment_type": "Self-employed",
        "housing_type": "Own House",
        "has_home_loan": "No"
    }
    client.post("/api/profile", json=payload, headers=token_headers)
    
    # Update profile
    update_payload = {
        "city": "Mumbai",
        "monthly_salary": 95000.0
    }
    response = client.put("/api/profile", json=update_payload, headers=token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Mumbai"
    assert data["monthly_salary"] == 95000.0
    assert data["age"] == 30 # Preserved original value

def test_profile_unauthorized(client):
    response = client.get("/api/profile")
    assert response.status_code == 401
