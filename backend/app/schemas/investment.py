from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class InvestmentBase(BaseModel):
    investment_type: str = Field(..., min_length=1)
    amount: Decimal = Field(..., gt=Decimal("0.00"))

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    investment_type: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=Decimal("0.00"))

class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    investment_type: str
    amount: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RecommendationProfileSchema(BaseModel):
    risk_profile: Optional[str] = None
    horizon: Optional[str] = None
    experience: Optional[str] = None

class MatchedInvestmentSchema(BaseModel):
    investment_type: str
    recommended_amount: float
    allocation_percentage: float
    suitability_score: int
    risk_level: str
    time_horizon: str
    liquidity: str
    benefits: str
    risks: str
    why_it_matches: str
    taxation: str
    is_allowed: bool

class InvestmentRecommendationsResponse(BaseModel):
    investment_capacity: float
    profile: RecommendationProfileSchema
    best_match: Optional[MatchedInvestmentSchema] = None
    alternatives: List[MatchedInvestmentSchema]
    investment_options: List[MatchedInvestmentSchema]
    suitability_methodology: str
    warnings: List[str]
    disclaimer: str
