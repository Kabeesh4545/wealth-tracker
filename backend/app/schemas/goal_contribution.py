from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
import datetime
from decimal import Decimal

class GoalContributionCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    contribution_date: datetime.date
    description: Optional[str] = Field(None, max_length=200)
    source: Optional[str] = Field(None, max_length=100)

    @field_validator('contribution_date')
    @classmethod
    def validate_date_not_future(cls, v: datetime.date) -> datetime.date:
        if v > datetime.date.today():
            raise ValueError("Actual goal contributions cannot be recorded for a future date.")
        return v

    @field_validator('source')
    @classmethod
    def validate_source_enum(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["Bank Savings", "Salary", "Cash", "Other"]
            if v not in allowed:
                raise ValueError(f"Invalid source. Allowed values: {allowed}")
        return v

class GoalContributionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    contribution_date: Optional[datetime.date] = None
    description: Optional[str] = Field(None, max_length=200)
    source: Optional[str] = Field(None, max_length=100)

    @field_validator('contribution_date')
    @classmethod
    def validate_date_not_future(cls, v: Optional[datetime.date]) -> Optional[datetime.date]:
        if v is not None and v > datetime.date.today():
            raise ValueError("Actual goal contributions cannot be recorded for a future date.")
        return v

    @field_validator('source')
    @classmethod
    def validate_source_enum(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = ["Bank Savings", "Salary", "Cash", "Other"]
            if v not in allowed:
                raise ValueError(f"Invalid source. Allowed values: {allowed}")
        return v

class GoalContributionResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    amount: float
    contribution_date: datetime.date
    description: Optional[str] = None
    source: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class GoalProgressResponse(BaseModel):
    goal_id: int
    goal_name: str
    target_amount: float
    original_saved: float
    current_saved: float
    remaining_amount: float
    progress_percentage: float
    target_date: str
    months_remaining: int
    required_monthly_contribution: float
    planned_monthly_contribution: float
    actual_month_contribution: float
    difference: float
    planning_status: str
    actual_status: str

    model_config = ConfigDict(from_attributes=True)
