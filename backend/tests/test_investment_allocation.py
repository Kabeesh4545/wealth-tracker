import pytest
from decimal import Decimal
from fastapi import status

from app.models.financial_profile import FinancialProfile
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.planned_expense import PlannedExpense
from app.models.investment_profile import InvestmentProfile

from app.services.investment_allocation.stability import evaluate_stability
from app.services.investment_allocation.suitability import calculate_suitability_allocations
from app.services.investment_allocation.normalization import normalize_and_reconcile

def test_stability_evaluation():
    # Deficit check -> Paused
    status_tag, mult = evaluate_stability(cash_flow_status="deficit", emergency_fund_status="Adequately Funded", debt_status="Low")
    assert status_tag == "Paused"
    assert mult == Decimal("0.00")

    # Needs Building -> Paused
    status_tag, mult = evaluate_stability(cash_flow_status="positive", emergency_fund_status="Needs Building", debt_status="Low")
    assert status_tag == "Paused"
    assert mult == Decimal("0.00")

    # Partially Funded -> Needs Stabilization (multiplier = 0.50)
    status_tag, mult = evaluate_stability(cash_flow_status="positive", emergency_fund_status="Partially Funded", debt_status="Low")
    assert status_tag == "Needs Stabilization"
    assert mult == Decimal("0.50")

    # High debt -> Needs Stabilization (multiplier = 1.00 but adjustments will trigger)
    status_tag, mult = evaluate_stability(cash_flow_status="positive", emergency_fund_status="Adequately Funded", debt_status="High")
    assert status_tag == "Needs Stabilization"
    assert mult == Decimal("1.00")

    # Positive + Adequate + Low/Moderate -> Ready
    status_tag, mult = evaluate_stability(cash_flow_status="positive", emergency_fund_status="Adequately Funded", debt_status="Low")
    assert status_tag == "Ready"
    assert mult == Decimal("1.00")

def test_suitability_and_debt_reduction():
    # Test High Risk profile base: growth = 70%, stable = 10%, cap = 20%
    # With debt_status = "High": growth reduced by 20% absolute (70% -> 50%).
    # Removed 20% redistributed: 10% to Cap Preservation (20% -> 30%) and 10% to Stable (10% -> 20%).
    alloc = calculate_suitability_allocations(
        risk_tolerance="High",
        horizon="5+ years",
        experience="Experienced",
        preference="Balanced Growth",
        debt_status="High",
        stability_status="Needs Stabilization"
    )
    assert alloc["growth"] == Decimal("0.50")
    assert alloc["stable"] == Decimal("0.20")
    assert alloc["capital_preservation"] == Decimal("0.30")

def test_horizon_constraints():
    # Horizon Less than 1 year -> Growth capped at 0%
    # Base High: growth = 70%, stable = 10%, cap = 20%.
    # Capped growth to 0. Removed 70% redistributed: 35% to Cap (20% -> 55%), 35% to Stable (10% -> 45%)
    alloc_1 = calculate_suitability_allocations(
        risk_tolerance="High",
        horizon="Less than 1 year",
        experience="Experienced",
        preference="Balanced Growth",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc_1["growth"] == Decimal("0.00")
    assert alloc_1["stable"] == Decimal("0.45")
    assert alloc_1["capital_preservation"] == Decimal("0.55")

    # Horizon 1-3 years -> Growth capped at 20%
    # Base High: growth = 70%, stable = 10%, cap = 20%.
    # Growth capped at 20%. Removed 50% redistributed: 25% to Cap (20% -> 45%), 25% to Stable (10% -> 35%)
    alloc_2 = calculate_suitability_allocations(
        risk_tolerance="High",
        horizon="1–3 years",
        experience="Experienced",
        preference="Balanced Growth",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc_2["growth"] == Decimal("0.20")
    assert alloc_2["stable"] == Decimal("0.35")
    assert alloc_2["capital_preservation"] == Decimal("0.45")

    # Horizon 3-5 years -> Growth capped at 45%
    # Base High: growth = 70%. Capped to 45%. Removed 25% redistributed: 12.5% to Cap (20% -> 32.5%), 12.5% to Stable (10% -> 22.5%)
    alloc_3 = calculate_suitability_allocations(
        risk_tolerance="High",
        horizon="3–5 years",
        experience="Experienced",
        preference="Balanced Growth",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc_3["growth"] == Decimal("0.45")

def test_beginner_growth_cap():
    # Beginner growth cap is 30%
    # Base High: growth = 70%. Capped to 30%. Removed 40% redistributed: 20% to Cap (20% -> 40%), 20% to Stable (10% -> 30%)
    alloc = calculate_suitability_allocations(
        risk_tolerance="High",
        horizon="5+ years",
        experience="Beginner",
        preference="Balanced Growth",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc["growth"] == Decimal("0.30")
    assert alloc["stable"] == Decimal("0.30")
    assert alloc["capital_preservation"] == Decimal("0.40")

def test_long_term_growth_preference():
    # Long-Term Growth shift (10% from Cap to Growth) applies if horizon="5+ years", stability != Paused, and risk is Medium/High.
    # Base Medium: growth = 40%, stable = 20%, cap = 40%.
    # Adjust: growth = 50%, stable = 20%, cap = 30%.
    alloc = calculate_suitability_allocations(
        risk_tolerance="Medium",
        horizon="5+ years",
        experience="Experienced",
        preference="Long-Term Growth",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc["growth"] == Decimal("0.50")
    assert alloc["stable"] == Decimal("0.20")
    assert alloc["capital_preservation"] == Decimal("0.30")

def test_capital_preservation_preference():
    # Shift 20% away from Growth.
    # Base Medium: growth = 40%, stable = 20%, cap = 40%.
    # Adjust: growth = 20%. Removed 20%: 15% to Cap (40% -> 55%), 5% to Stable (20% -> 25%).
    alloc = calculate_suitability_allocations(
        risk_tolerance="Medium",
        horizon="5+ years",
        experience="Experienced",
        preference="Capital Preservation",
        debt_status="Low",
        stability_status="Ready"
    )
    assert alloc["growth"] == Decimal("0.20")
    assert alloc["stable"] == Decimal("0.25")
    assert alloc["capital_preservation"] == Decimal("0.55")

def test_zero_division_protection():
    # Test zero total percentage clamps division by zero
    pcts = {"capital_preservation": Decimal("-0.10"), "stable": Decimal("-0.20"), "growth": Decimal("-0.30")}
    norm_pcts, amounts = normalize_and_reconcile(pcts, Decimal("5000.00"))
    assert sum(norm_pcts.values()) == 0
    assert sum(amounts.values()) == 0

    # Test zero capacity does not cause errors
    norm_pcts_2, amounts_2 = normalize_and_reconcile(
        {"capital_preservation": Decimal("0.40"), "stable": Decimal("0.20"), "growth": Decimal("0.40")},
        Decimal("0.00")
    )
    assert sum(norm_pcts_2.values()) == 0
    assert sum(amounts_2.values()) == 0

def test_normalization_and_rounding_reconciliation():
    # Verify exact reconciliation
    pcts = {
        "capital_preservation": Decimal("0.33"),
        "stable": Decimal("0.33"),
        "growth": Decimal("0.34")
    }
    norm_pcts, amounts = normalize_and_reconcile(pcts, Decimal("5000.00"))
    
    # Sum of percentages must equal exactly 1.00
    assert sum(norm_pcts.values()) == Decimal("1.00")
    
    # Sum of monthly amounts must equal capacity exactly
    assert sum(amounts.values()) == Decimal("5000.00")

@pytest.fixture
def seed_allocation_database(db_session, setup_test_db):
    # Setup test user profile details (Positive surplus, 10k emergency fund, low debt)
    profile = FinancialProfile(
        user_id=1, age=28, city="Coimbatore", employment_type="Employee",
        family_members=4, dependents=2, monthly_salary=50000.0, other_income=2000.0,
        variable_income=10000.0, housing_type="Rent", rent_amount=10000.0, maintenance=1000.0
    )
    savings = Saving(user_id=1, bank_savings=30000.0, emergency_fund=100000.0) # adequately funded
    loans = [
        Loan(user_id=1, loan_type="Vehicle Loan", outstanding_amount=50000.0, monthly_emi=2000.0, interest_rate=9.0, remaining_tenure_months=24) # low debt
    ]
    expenses = [
        PlannedExpense(user_id=1, category="foodGroceries", expense_type="essential", monthly_amount=8000.0),
        PlannedExpense(user_id=1, category="eatingOutside", expense_type="lifestyle", monthly_amount=3000.0)
    ]
    ip = InvestmentProfile(
        user_id=1, experience="Intermediate", time_horizon="5+ years",
        risk_tolerance="Medium", primary_preference="Balanced Growth"
    )
    
    db_session.add(profile)
    db_session.add(savings)
    db_session.add_all(loans)
    db_session.add_all(expenses)
    db_session.add(ip)
    db_session.commit()

def test_api_allocation_unauthorized(client):
    response = client.get("/api/planning/investment-allocation")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_api_allocation_authorized(client, token_headers, seed_allocation_database):
    response = client.get("/api/planning/investment-allocation", headers=token_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert data["allocation_status"] == "active"
    assert data["profile"]["risk_tolerance"] == "Medium"
    assert data["profile"]["horizon"] == "5+ years"
    assert data["financial_stability"]["debt"] == "Low"
    
    assert len(data["allocations"]) > 0
    assert "warnings" in data
    assert "explanations" in data
    assert "disclaimer" in data
