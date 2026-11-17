import pytest

def test_planned_expenses_crud(client, token_headers):
    payload = {
        "category": "Food & Groceries",
        "expense_type": "essential",
        "monthly_amount": 8000.0
    }
    
    # Create expense
    response = client.post("/api/planned-expenses", json=payload, headers=token_headers)
    assert response.status_code == 201
    expense_id = response.json()["id"]
    assert response.json()["category"] == "Food & Groceries"
    
    # Get list
    response = client.get("/api/planned-expenses", headers=token_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Update
    response = client.put(f"/api/planned-expenses/{expense_id}", json={"monthly_amount": 0.0}, headers=token_headers)
    assert response.status_code == 200
    assert response.json()["monthly_amount"] == 0.0 # ₹0 is valid

    # Delete
    response = client.delete(f"/api/planned-expenses/{expense_id}", headers=token_headers)
    assert response.status_code == 204

def test_planned_expense_negative_amount_rejected(client, token_headers):
    payload = {
        "category": "Shopping",
        "expense_type": "lifestyle",
        "monthly_amount": -100.0
    }
    response = client.post("/api/planned-expenses", json=payload, headers=token_headers)
    assert response.status_code == 422
