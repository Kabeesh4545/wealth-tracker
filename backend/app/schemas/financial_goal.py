from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, model_validator
import re
from typing import Optional

class FinancialGoalBase(BaseModel):
    goal_name: str = Field(..., min_length=1)
    target_amount: Decimal = Field(..., gt=Decimal("0.00"))
    current_amount: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    target_date: str = Field(..., description="Target date in format YYYY-MM or YYYY-MM-DD")

    @model_validator(mode='after')
    def validate_amounts_and_date(self) -> 'FinancialGoalBase':
        if self.current_amount > self.target_amount:
            raise ValueError("Current saved amount cannot exceed target amount")
        
        # Validate date format (YYYY-MM or YYYY-MM-DD)
        if not re.match(r'^\d{4}-\d{2}(-\d{2})?$', self.target_date):
            raise ValueError("Target date must be in YYYY-MM or YYYY-MM-DD format")
        
        return self

class FinancialGoalCreate(FinancialGoalBase):
    pass

class FinancialGoalUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    current_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    target_date: Optional[str] = None

    @model_validator(mode='after')
    def validate_amounts_and_date_update(self) -> 'FinancialGoalUpdate':
        if self.current_amount is not None and self.target_amount is not None:
            if self.current_amount > self.target_amount:
                raise ValueError("Current saved amount cannot exceed target amount")
        if self.target_date is not None:
            if not re.match(r'^\d{4}-\d{2}(-\d{2})?$', self.target_date):
                raise ValueError("Target date must be in YYYY-MM or YYYY-MM-DD format")
        return self

class FinancialGoalResponse(BaseModel):
    id: int
    user_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
