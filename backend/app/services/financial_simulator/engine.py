from sqlalchemy.orm import Session
from typing import Dict, Any

from app.models.user import User
from app.services.financial_planning.engine import generate_financial_plan
from app.services.investment_allocation.engine import calculate_investment_allocation
from app.services.financial_simulator.state import build_database_scenario_state
from app.services.financial_simulator.scenarios import apply_scenario_override
from app.services.financial_simulator.comparison import calculate_simulation_impact, get_scenario_status
from app.services.financial_simulator.explanations import generate_simulation_explanation
from app.services.monthly_budget.calculator import calculate_monthly_budget

DISCLAIMER_TEXT = (
    "This simulation is hypothetical and does not modify your financial records. "
    "It is intended for educational budgeting and planning purposes and is not financial advice."
)

def run_simulation(
    db: Session,
    user: User,
    scenario_type: str,
    scenario_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Coordinates stateless what-if simulation using temporary state.
    """
    # 1. Run baseline calculations
    cur_plan = generate_financial_plan(db, user)
    cur_alloc = calculate_investment_allocation(db, user, override_plan=cur_plan)
    cur_plan["investment_allocation"] = cur_alloc
    cur_budget = calculate_monthly_budget(db, user)

    # 2. Build plain DTO scenario state
    scenario_state = build_database_scenario_state(db, user.id)

    # 3. Apply scenario overrides
    apply_scenario_override(scenario_state, scenario_type, scenario_data)

    # 4. Run scenario plan calculations
    scen_plan = generate_financial_plan(db, user, scenario_state=scenario_state)
    scen_alloc = calculate_investment_allocation(db, user, override_plan=scen_plan, scenario_state=scenario_state)
    scen_plan["investment_allocation"] = scen_alloc
    scen_budget = calculate_monthly_budget(db, user, scenario_state=scenario_state)

    # 5. Compute deltas
    impact = calculate_simulation_impact(cur_plan, scen_plan, cur_budget, scen_budget)

    # 6. Evaluate overall simulation status
    status = get_scenario_status(impact)

    # 7. Generate explanation
    explanation = generate_simulation_explanation(scenario_type, scenario_data, impact, scen_plan)

    return {
        "current": cur_plan,
        "scenario": scen_plan,
        "impact": impact,
        "scenario_status": status,
        "recommendations": [
            {
                "type": "explanation",
                "title": "Simulation Explanation",
                "message": explanation
            }
        ],
        "disclaimer": DISCLAIMER_TEXT
    }
