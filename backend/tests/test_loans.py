import pytest

def test_loans_crud(client, token_headers):
    payload = {
        "loan_type": "Education Loan",
        "outstanding_amount": 350000.0,
        "monthly_emi": 8500.0,
        "interest_rate": 8.5,
        "remaining_tenure_months": 48
    }
    
    # Create loan
    response = client.post("/api/loans", json=payload, headers=token_headers)
    assert response.status_code == 201
    loan_id = response.json()["id"]
    assert response.json()["loan_type"] == "Education Loan"
    
    # Get loans list
    response = client.get("/api/loans", headers=token_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == loan_id
    
    # Update loan
    update_payload = {
        "outstanding_amount": 300000.0,
        "remaining_tenure_months": 42
    }
    response = client.put(f"/api/loans/{loan_id}", json=update_payload, headers=token_headers)
    assert response.status_code == 200
    assert response.json()["outstanding_amount"] == 300000.0
    
    # Delete loan
    response = client.delete(f"/api/loans/{loan_id}", headers=token_headers)
    assert response.status_code == 204
    
    # Confirm deleted
    response = client.get("/api/loans", headers=token_headers)
    assert len(response.json()) == 0

def test_loan_tenancy_segregation(client, token_headers, other_token_headers):
    # User A creates a loan
    payload = {
        "loan_type": "Personal Loan",
        "outstanding_amount": 50000.0,
        "monthly_emi": 5000.0,
        "interest_rate": 12.0,
        "remaining_tenure_months": 12
    }
    response = client.post("/api/loans", json=payload, headers=token_headers)
    loan_id = response.json()["id"]
    
    # User B tries to view User A's loan -> should return 404
    response = client.put(f"/api/loans/{loan_id}", json={"outstanding_amount": 40000.0}, headers={**other_token_headers})
    assert response.status_code == 404
    
    # User B tries to delete User A's loan -> should return 404
    response = client.delete(f"/api/loans/{loan_id}", headers={**other_token_headers})
    assert response.status_code == 404
