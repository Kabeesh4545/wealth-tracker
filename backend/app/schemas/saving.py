from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class SavingBase(BaseModel):
    bank_savings: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    emergency_fund: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))

class SavingCreate(SavingBase):
    pass

class SavingUpdate(BaseModel):
    bank_savings: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    emergency_fund: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

class SavingResponse(BaseModel):
    id: int
    user_id: int
    bank_savings: float
    emergency_fund: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
