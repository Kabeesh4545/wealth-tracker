from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional

EXPERIENCE_OPTIONS = ['No Experience', 'Beginner', 'Intermediate', 'Experienced']
HORIZON_OPTIONS = ['Less than 1 year', '1–3 years', '3–5 years', '5+ years']
RISK_OPTIONS = ['Low', 'Medium', 'High']
PREFERENCE_OPTIONS = ['Capital Preservation', 'Balanced Growth', 'Long-Term Growth']

class InvestmentProfileBase(BaseModel):
    experience: str = Field(..., description="No Experience, Beginner, Intermediate, or Experienced")
    time_horizon: str = Field(..., description="Less than 1 year, 1–3 years, 3–5 years, or 5+ years")
    risk_tolerance: str = Field(..., description="Low, Medium, or High")
    primary_preference: str = Field(..., description="Capital Preservation, Balanced Growth, or Long-Term Growth")

    @field_validator('experience')
    @classmethod
    def validate_experience(cls, v):
        if v not in EXPERIENCE_OPTIONS:
            raise ValueError(f"Experience must be one of: {EXPERIENCE_OPTIONS}")
        return v

    @field_validator('time_horizon')
    @classmethod
    def validate_horizon(cls, v):
        # Normalize en-dash and hyphen to ensure compatibility
        normalized = v.replace('–', '-').strip()
        cleaned_options = [opt.replace('–', '-').strip() for opt in HORIZON_OPTIONS]
        if normalized not in cleaned_options:
            raise ValueError(f"Time horizon must be one of: {HORIZON_OPTIONS}")
        return v

    @field_validator('risk_tolerance')
    @classmethod
    def validate_risk(cls, v):
        if v not in RISK_OPTIONS:
            raise ValueError(f"Risk tolerance must be one of: {RISK_OPTIONS}")
        return v

    @field_validator('primary_preference')
    @classmethod
    def validate_preference(cls, v):
        if v not in PREFERENCE_OPTIONS:
            raise ValueError(f"Primary preference must be one of: {PREFERENCE_OPTIONS}")
        return v

class InvestmentProfileCreate(InvestmentProfileBase):
    pass

class InvestmentProfileUpdate(BaseModel):
    experience: Optional[str] = None
    time_horizon: Optional[str] = None
    risk_tolerance: Optional[str] = None
    primary_preference: Optional[str] = None

    @field_validator('experience')
    @classmethod
    def validate_experience_opt(cls, v):
        if v is not None and v not in EXPERIENCE_OPTIONS:
            raise ValueError(f"Experience must be one of: {EXPERIENCE_OPTIONS}")
        return v

    @field_validator('time_horizon')
    @classmethod
    def validate_horizon_opt(cls, v):
        if v is not None:
            normalized = v.replace('–', '-').strip()
            cleaned_options = [opt.replace('–', '-').strip() for opt in HORIZON_OPTIONS]
            if normalized not in cleaned_options:
                raise ValueError(f"Time horizon must be one of: {HORIZON_OPTIONS}")
        return v

    @field_validator('risk_tolerance')
    @classmethod
    def validate_risk_opt(cls, v):
        if v is not None and v not in RISK_OPTIONS:
            raise ValueError(f"Risk tolerance must be one of: {RISK_OPTIONS}")
        return v

    @field_validator('primary_preference')
    @classmethod
    def validate_preference_opt(cls, v):
        if v is not None and v not in PREFERENCE_OPTIONS:
            raise ValueError(f"Primary preference must be one of: {PREFERENCE_OPTIONS}")
        return v

class InvestmentProfileResponse(InvestmentProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
