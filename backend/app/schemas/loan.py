from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class LoanBase(BaseModel):
    loan_type: str = Field(..., min_length=1)
    outstanding_amount: Decimal = Field(..., ge=Decimal("0.00"))
    monthly_emi: Decimal = Field(..., ge=Decimal("0.00"))
    interest_rate: float = Field(..., ge=0.0)
    remaining_tenure_months: int = Field(..., gt=0)

class LoanCreate(LoanBase):
    pass

class LoanUpdate(BaseModel):
    loan_type: Optional[str] = None
    outstanding_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    monthly_emi: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    interest_rate: Optional[float] = Field(None, ge=0.0)
    remaining_tenure_months: Optional[int] = Field(None, gt=0)

class LoanResponse(BaseModel):
    id: int
    user_id: int
    loan_type: str
    outstanding_amount: float
    monthly_emi: float
    interest_rate: float
    remaining_tenure_months: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
