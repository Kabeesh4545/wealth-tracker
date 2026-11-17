from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional

class FinancialProfileBase(BaseModel):
    age: int = Field(..., ge=15, le=100, description="Age must be between 15 and 100")
    city: str = Field(..., min_length=1)
    employment_type: str = Field(..., min_length=1)
    family_members: Optional[int] = Field(None, ge=1)
    dependents: Optional[int] = Field(None, ge=0)

    monthly_salary: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    other_income: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    variable_income: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))

    housing_type: str = Field(..., description="Rent, Own House, Living With Family, or Other")
    rent_amount: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    maintenance: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    has_home_loan: Optional[str] = Field(None, description="Yes or No")
    home_loan_emi: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    household_contribution: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    other_housing_expenses: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))

    @model_validator(mode='after')
    def validate_dependents_and_family(self) -> 'FinancialProfileBase':
        family = self.family_members
        deps = self.dependents
        if family is not None and deps is not None:
            if deps > family:
                raise ValueError("Number of dependents cannot exceed family members")
        return self

class FinancialProfileCreate(FinancialProfileBase):
    pass

class FinancialProfileUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=15, le=100)
    city: Optional[str] = None
    employment_type: Optional[str] = None
    family_members: Optional[int] = Field(None, ge=1)
    dependents: Optional[int] = Field(None, ge=0)

    monthly_salary: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    other_income: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    variable_income: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

    housing_type: Optional[str] = None
    rent_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    maintenance: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    has_home_loan: Optional[str] = None
    home_loan_emi: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    household_contribution: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    other_housing_expenses: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

    @model_validator(mode='after')
    def validate_dependents_and_family_update(self) -> 'FinancialProfileUpdate':
        family = self.family_members
        deps = self.dependents
        if family is not None and deps is not None:
            if deps > family:
                raise ValueError("Number of dependents cannot exceed family members")
        return self

class FinancialProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    city: str
    employment_type: str
    family_members: Optional[int]
    dependents: Optional[int]

    monthly_salary: float
    other_income: float
    variable_income: float

    housing_type: str
    rent_amount: float
    maintenance: float
    has_home_loan: Optional[str]
    home_loan_emi: float
    household_contribution: float
    other_housing_expenses: float

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
