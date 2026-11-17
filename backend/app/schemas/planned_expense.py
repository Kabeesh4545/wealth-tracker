from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class PlannedExpenseBase(BaseModel):
    category: str = Field(..., min_length=1)
    expense_type: str = Field(..., description="'essential' or 'lifestyle'")
    monthly_amount: Decimal = Field(..., ge=Decimal("0.00"))

class PlannedExpenseCreate(PlannedExpenseBase):
    pass

class PlannedExpenseUpdate(BaseModel):
    category: Optional[str] = None
    expense_type: Optional[str] = None
    monthly_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

class PlannedExpenseResponse(BaseModel):
    id: int
    user_id: int
    category: str
    expense_type: str
    monthly_amount: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
