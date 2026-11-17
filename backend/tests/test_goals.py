import pytest

def test_goals_crud(client, token_headers):
    payload = {
        "goal_name": "Buy Vehicle",
        "target_amount": 150000.0,
        "current_amount": 30000.0,
        "target_date": "2027-12"
    }
    
    # Create goal
    response = client.post("/api/goals", json=payload, headers=token_headers)
    assert response.status_code == 201
    goal_id = response.json()["id"]
    assert response.json()["goal_name"] == "Buy Vehicle"
    
    # Get list
    response = client.get("/api/goals", headers=token_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # Update
    response = client.put(f"/api/goals/{goal_id}", json={"current_amount": 50000.0}, headers=token_headers)
    assert response.status_code == 200
    assert response.json()["current_amount"] == 50000.0

    # Delete
    response = client.delete(f"/api/goals/{goal_id}", headers=token_headers)
    assert response.status_code == 204

def test_goal_validation_errors(client, token_headers):
    # Target amount <= 0
    payload_bad_target = {
        "goal_name": "Education",
        "target_amount": 0.0,
        "current_amount": 0.0,
        "target_date": "2028-06"
    }
    response = client.post("/api/goals", json=payload_bad_target, headers=token_headers)
    assert response.status_code == 422

    # Saved > Target
    payload_bad_saved = {
        "goal_name": "Travel",
        "target_amount": 10000.0,
        "current_amount": 12000.0,
        "target_date": "2027-01"
    }
    response = client.post("/api/goals", json=payload_bad_saved, headers=token_headers)
    assert response.status_code == 422

    # Invalid date format
    payload_bad_date = {
        "goal_name": "Retirement",
        "target_amount": 500000.0,
        "current_amount": 0.0,
        "target_date": "12-2035"
    }
    response = client.post("/api/goals", json=payload_bad_date, headers=token_headers)
    assert response.status_code == 422
