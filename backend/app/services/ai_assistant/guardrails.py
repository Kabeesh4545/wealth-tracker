import re
from typing import Dict, Any
from app.schemas.ai_assistant import ChatResponse

FIXED_DISCLAIMER = "This information is for educational budgeting and planning purposes and is not financial advice."

def validate_and_sanitize_message(message: str) -> None:
    """
    Validates message criteria and flags potential prompt injection keywords.
    """
    msg = message.strip()
    if len(msg) < 1:
        raise ValueError("Message cannot be empty.")
    if len(msg) > 2000:
        raise ValueError("Message exceeds length limit of 2000 characters.")

    # Defense against prompt injection overrides
    injection_patterns = [
        r"ignore\s+(?:all\s+)?previous\s+instructions",
        r"system\s+prompt",
        r"reveal\s+your\s+instructions",
        r"database\s+dump",
        r"delete\s+from\s+users",
        r"drop\s+table"
    ]
    for pattern in injection_patterns:
        if re.search(pattern, msg, re.IGNORECASE):
            raise ValueError("Potential prompt injection attempt blocked.")

def enforce_response_guardrails(response_dict: Dict[str, Any]) -> ChatResponse:
    """
    Validates response structure against ChatResponse Pydantic model.
    Enforces read-only disclaimers and sanitizes claims.
    """
    # Enforce static disclaimer regardless of what LLM returned
    response_dict["disclaimer"] = FIXED_DISCLAIMER

    # Validate schema
    chat_resp = ChatResponse(**response_dict)
    return chat_resp
