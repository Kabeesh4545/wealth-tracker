from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None

class FinancialValue(BaseModel):
    label: str
    value: str
    change: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    intent: str
    key_points: List[str]
    financial_values: List[FinancialValue]
    disclaimer: str
