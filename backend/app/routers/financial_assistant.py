from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_assistant import ChatRequest, ChatResponse
from app.services.ai_assistant.engine import run_chat_assistant
from app.core.rate_limit import ai_limiter

router = APIRouter(prefix="/api/assistant", tags=["AI Financial Assistant"])

@router.post("/chat", response_model=ChatResponse)
def assistant_chat(
    request: Request,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated chat endpoint for the AI Financial Assistant.
    Identifies user via JWT, gathers relevant structured context, and routes to OpenAI.
    """
    # Enforce rate limit check
    force = request.headers.get("X-Test-Rate-Limit") == "true"
    ai_limiter.check(request.client.host, force=force)
    
    try:
        response = run_chat_assistant(db, current_user, payload.message)
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        )
    except Exception as exc:
        print(f"Assistant route error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process chat message."
        )
