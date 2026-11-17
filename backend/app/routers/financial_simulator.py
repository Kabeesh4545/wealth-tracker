from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.loan import Loan
from app.dependencies import get_current_user
from app.schemas.financial_simulator import ScenarioRequest, SimulationResponse, ScenarioTypeEnum
from app.services.financial_simulator.engine import run_simulation

router = APIRouter(prefix="/api/simulator", tags=["What-If Simulator"])

@router.post("/what-if", response_model=SimulationResponse)
def simulate_scenario(
    request: ScenarioRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Runs an in-memory stateless simulation of a hypothetical financial scenario.
    """
    # Verify loan ownership for loan_change scenario
    if request.scenario_type == ScenarioTypeEnum.loan_change:
        loan_id = request.scenario_data.get("loan_id")
        # Check loan database record
        loan = db.query(Loan).filter(Loan.id == loan_id).first()
        if not loan or loan.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Loan not found."
            )

    try:
        result = run_simulation(
            db=db,
            user=current_user,
            scenario_type=request.scenario_type.value,
            scenario_data=request.scenario_data
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except KeyError as key_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(key_err)
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to run the simulation."
        )
