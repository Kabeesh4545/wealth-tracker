from sqlalchemy.orm import Session
from app.services.data_refresh.economic_refresh import refresh_economic_data
from app.services.data_refresh.local_cost_refresh import refresh_local_cost_data
from app.services.data_refresh.investment_refresh import refresh_investment_rates

def run_all_data_refreshes(db: Session):
    """
    Executes background refresh workflow across local cost, economic, and investment providers.
    """
    results = {
        "economic": refresh_economic_data(db),
        "local_cost": refresh_local_cost_data(db, []),
        "investment": refresh_investment_rates(db, [])
    }
    return results
