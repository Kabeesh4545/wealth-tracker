import pytest
from fastapi import status
from sqlalchemy.exc import IntegrityError
from app.models.local_cost import LocalCost

@pytest.fixture
def seed_test_costs(db_session):
    # Add dummy records for testing lookup logic
    costs = [
        LocalCost(
            city="Coimbatore", state="Tamil Nadu", country="India",
            category="Housing", subcategory="Rent",
            min_cost=9000.0, typical_cost=12000.0, max_cost=15000.0,
            currency="INR", unit="monthly",
            household_size_min=1, household_size_max=99,
            housing_type="2 BHK", source="Numbeo", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        ),
        LocalCost(
            city="Coimbatore", state="Tamil Nadu", country="India",
            category="Housing", subcategory="Rent",
            min_cost=15000.0, typical_cost=18000.0, max_cost=22000.0,
            currency="INR", unit="monthly",
            household_size_min=1, household_size_max=99,
            housing_type="3 BHK", source="Numbeo", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        ),
        LocalCost(
            city="Coimbatore", state="Tamil Nadu", country="India",
            category="Housing", subcategory="Maintenance",
            min_cost=1000.0, typical_cost=1500.0, max_cost=2500.0,
            currency="INR", unit="monthly",
            household_size_min=1, household_size_max=99,
            housing_type=None, source="Derived estimate", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        ),
        LocalCost(
            city="Coimbatore", state="Tamil Nadu", country="India",
            category="Food", subcategory="Food & Groceries",
            min_cost=6000.0, typical_cost=8000.0, max_cost=10000.0,
            currency="INR", unit="monthly",
            household_size_min=3, household_size_max=4,
            housing_type=None, source="Numbeo", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        ),
        LocalCost(
            city="Coimbatore", state="Tamil Nadu", country="India",
            category="Food", subcategory="Eating Outside",
            min_cost=2500.0, typical_cost=4500.0, max_cost=7500.0,
            currency="INR", unit="monthly",
            household_size_min=3, household_size_max=4,
            housing_type=None, source="Numbeo", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        ),
        LocalCost(
            city="Mumbai", state="Maharashtra", country="India",
            category="Housing", subcategory="Rent",
            min_cost=18000.0, typical_cost=25000.0, max_cost=35000.0,
            currency="INR", unit="monthly",
            household_size_min=1, household_size_max=99,
            housing_type="1 BHK", source="Numbeo", reference_month="2026-08",
            last_updated="2026-08-18", data_confidence="medium"
        )
    ]
    db_session.add_all(costs)
    db_session.commit()

def test_get_cities(client, token_headers, seed_test_costs):
    response = client.get("/api/local-costs/cities", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "Coimbatore" in data
    assert "Mumbai" in data
    assert len(data) == 2

def test_get_cities_unauthorized(client, seed_test_costs):
    response = client.get("/api/local-costs/cities")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_estimate_cost_valid(client, token_headers, seed_test_costs):
    # Query Food for HH=4 in Coimbatore
    response = client.get(
        "/api/local-costs?city=Coimbatore&category=Food&household_size=4",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["city"] == "Coimbatore"
    assert data["category"] == "Food"
    assert data["household_size"] == 4
    # Food has Groceries (min=6k, typical=8k, max=10k) and Eating Outside (min=2.5k, typ=4.5k, max=7.5k)
    # Sum: min=8500, typ=12500, max=17500
    assert data["estimate"]["min"] == 8500.0
    assert data["estimate"]["typical"] == 12500.0
    assert data["estimate"]["max"] == 17500.0
    assert data["currency"] == "INR"
    assert data["data_confidence"] == "medium"
    assert data["reference_month"] == "2026-08"

def test_estimate_cost_housing_bhk_default(client, token_headers, seed_test_costs):
    # For HH=4 in Coimbatore, housing Rent should default to 3 BHK (min=15000)
    # Maintenance is general (min=1000)
    # Total Housing estimate: min=16000, typ=19500, max=24500
    response = client.get(
        "/api/local-costs?city=Coimbatore&category=Housing&household_size=4",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["estimate"]["min"] == 16000.0
    assert data["estimate"]["typical"] == 19500.0
    assert data["estimate"]["max"] == 24500.0

def test_estimate_cost_housing_bhk_specific(client, token_headers, seed_test_costs):
    # For HH=4, but overriding to 2 BHK
    # 2 BHK Rent (min=9000) + Maintenance (min=1000) = 10000
    response = client.get(
        "/api/local-costs?city=Coimbatore&category=Housing&household_size=4&housing_type=2 BHK",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["estimate"]["min"] == 10000.0
    assert data["estimate"]["typical"] == 13500.0
    assert data["estimate"]["max"] == 17500.0

def test_estimate_cost_missing_data(client, token_headers, seed_test_costs):
    # Unknown city
    response = client.get(
        "/api/local-costs?city=Chennai&category=Food&household_size=4",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not available for this city" in response.json()["detail"]

    # Unknown category
    response = client.get(
        "/api/local-costs?city=Coimbatore&category=Education&household_size=4",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_summary_valid(client, token_headers, seed_test_costs):
    response = client.get(
        "/api/local-costs/summary?city=Coimbatore&household_size=4",
        headers=token_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["city"] == "Coimbatore"
    assert data["household_size"] == 4
    
    categories = {cat["category"]: cat for cat in data["categories"]}
    assert "Housing" in categories
    assert "Food" in categories
    assert len(categories) == 2

def test_database_constraints(db_session):
    # Test Min Cost Positive Constraint
    invalid_cost = LocalCost(
        city="Coimbatore", state="Tamil Nadu", country="India",
        category="Food", subcategory="Groceries",
        min_cost=-10.0, typical_cost=20.0, max_cost=30.0,
        currency="INR", unit="monthly",
        household_size_min=1, household_size_max=1,
        source="Numbeo", reference_month="2026-08",
        last_updated="2026-08-18", data_confidence="medium"
    )
    db_session.add(invalid_cost)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Test Cost Order Constraint (min > typical)
    invalid_order = LocalCost(
        city="Coimbatore", state="Tamil Nadu", country="India",
        category="Food", subcategory="Groceries",
        min_cost=50.0, typical_cost=20.0, max_cost=80.0,
        currency="INR", unit="monthly",
        household_size_min=1, household_size_max=1,
        source="Numbeo", reference_month="2026-08",
        last_updated="2026-08-18", data_confidence="medium"
    )
    db_session.add(invalid_order)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_read_cost_write_methods_405(client, token_headers):
    # Verify write methods are not allowed on cost data lookup path
    response = client.post("/api/local-costs", json={}, headers=token_headers)
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
