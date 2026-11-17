import pytest

def test_register_success(client):
    payload = {
        "full_name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "john@example.com"
    assert data["full_name"] == "John Doe"
    assert "id" in data
    assert "password_hash" not in data

def test_register_duplicate_email(client):
    payload = {
        "full_name": "User One",
        "email": "dup@example.com",
        "password": "password"
    }
    # First registration
    response1 = client.post("/api/auth/register", json=payload)
    assert response1.status_code == 201
    
    # Duplicate registration
    response2 = client.post("/api/auth/register", json=payload)
    assert response2.status_code == 409
    assert response2.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register first
    register_payload = {
        "full_name": "Login User",
        "email": "login@example.com",
        "password": "loginpassword123"
    }
    client.post("/api/auth/register", json=register_payload)

    # Login
    login_payload = {
        "username": "login@example.com",
        "password": "loginpassword123"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    # Register first
    register_payload = {
        "full_name": "Wrong Pass User",
        "email": "wrongpass@example.com",
        "password": "goodpassword"
    }
    client.post("/api/auth/register", json=register_payload)

    # Login with wrong password
    login_payload = {
        "username": "wrongpass@example.com",
        "password": "badpassword"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
