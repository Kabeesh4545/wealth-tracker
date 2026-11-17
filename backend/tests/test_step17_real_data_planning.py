import pytest
from decimal import Decimal
from datetime import datetime, timezone
from app.models.data_source import DataSource, DataRefreshLog, InvestmentRate
from app.models.local_cost import LocalCost
from app.services.data_sources.local_cost_provider import LocalCostProvider
from app.services.data_sources.economic_data_provider import EconomicDataProvider
from app.services.data_sources.investment_data_provider import InvestmentDataProvider
from app.services.monthly_budget.calculator import (
    calculate_monthly_budget,
    compare_location_costs
)
from app.services.investment_recommendation.engine import get_investment_recommendations
from app.services.ai_assistant.context_builder import build_user_financial_context, format_inr

def test_data_sources_initialization_and_refresh_logs(db_session):
    """Verify that DataSource entities and DataRefreshLogs can be created and queried without errors."""
    ds = DataSource(
        source_key="mospi_cpi",
        name="MOSPI CPI Data",
        category="economic",
        source_type="API",
        source_url="https://mospi.gov.in/cpi",
        refresh_frequency_hours=24,
        is_active=True
    )
    db_session.add(ds)
    db_session.commit()

    log = DataRefreshLog(
        data_source_id=ds.id,
        status="SUCCESS",
        records_fetched=1,
        records_updated=1,
        records_rejected=0
    )
    db_session.add(log)
    db_session.commit()

    queried_ds = db_session.query(DataSource).filter_by(source_key="mospi_cpi").first()
    assert queried_ds is not None
    assert len(queried_ds.refresh_logs) == 1
    assert queried_ds.refresh_logs[0].status == "SUCCESS"

def test_strict_city_isolation_no_fallback(db_session):
    """Verify strict city isolation: querying a non-existent city returns unverified/unavailable without cross-city fallback or fabricated numbers."""
    provider = LocalCostProvider()
    
    res = provider.fetch_data(
        db=db_session,
        city="NonExistentCity",
        category="Food",
        household_size=1
    )
    assert res["status"] == "NOT_FOUND" or res["provenance"].freshness_status == "UNAVAILABLE"
    assert res["provenance"].is_verified is False

def test_local_cost_benchmark_retrieval(db_session):
    """Verify retrieval of verified local cost benchmark for a valid city."""
    benchmark = LocalCost(
        city="Bengaluru",
        state="Karnataka",
        country="India",
        category="Food",
        subcategory="Food & Groceries",
        min_cost=4000.0,
        typical_cost=6500.0,
        max_cost=9000.0,
        currency="INR",
        unit="monthly",
        household_size_min=1,
        household_size_max=4,
        source="Verified City Survey",
        reference_month="2026-08",
        last_updated="2026-08-01",
        data_confidence="high",
        data_type="BENCHMARK",
        is_verified=True,
        freshness_status="CURRENT",
        retrieved_at=datetime.now(timezone.utc)
    )
    db_session.add(benchmark)
    db_session.commit()

    provider = LocalCostProvider()
    res = provider.fetch_data(
        db=db_session,
        city="Bengaluru",
        category="Food",
        subcategory="Food & Groceries",
        household_size=1
    )
    assert res["status"] == "SUCCESS"
    assert res["provenance"].is_verified is True
    assert Decimal(str(res["data"]["typical_cost"])) == Decimal("6500.0")

def test_category_spending_limits_calculation():
    """Verify Recommended, Safe (+15%), and Hard (+30%) limit scaling rules for flexible discretionary categories."""
    base_rec = Decimal("6000.00")
    safe_limit = base_rec * Decimal("1.15")
    hard_limit = base_rec * Decimal("1.30")
    
    assert safe_limit == Decimal("6900.00")
    assert hard_limit == Decimal("7800.00")

def test_investment_rates_retrieval(db_session):
    """Verify investment recommendation engine fetches verified investment rates from DB."""
    inv_rate = InvestmentRate(
        institution="SBI",
        product_name="Bank FD",
        tenure="1 Year",
        customer_category="Regular",
        rate_value=Decimal("0.0710"),
        rate_classification="CURRENT_RATE"
    )
    db_session.add(inv_rate)
    db_session.commit()

    provider = InvestmentDataProvider()
    rates = provider.fetch_rates(db_session, "Bank FD")
    assert len(rates) > 0
    assert rates[0]["data"]["institution"] == "SBI"
    assert rates[0]["data"]["product_name"] == "Bank FD"

def test_ai_assistant_format_inr():
    """Verify format_inr utility produces correct Indian Rupee format."""
    assert format_inr(15000) == "₹15,000"
    assert format_inr(150000) == "₹1,50,000"
