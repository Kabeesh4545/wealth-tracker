from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class CostEstimate(BaseModel):
    min: float = Field(..., description="Minimum estimated monthly cost")
    typical: float = Field(..., description="Typical estimated monthly cost")
    max: float = Field(..., description="Maximum estimated monthly cost")

class LocalCostResponse(BaseModel):
    city: str
    household_size: int
    category: str
    subcategory: Optional[str] = None
    estimate: CostEstimate
    currency: str
    unit: str
    source: str
    reference_month: str
    last_updated: str
    data_confidence: str

    class Config:
        from_attributes = True

class CategorySummary(BaseModel):
    category: str
    estimate: CostEstimate
    currency: str
    unit: str
    data_confidence: str

class LocalCostSummaryResponse(BaseModel):
    city: str
    household_size: int
    housing_type: Optional[str] = None
    categories: List[CategorySummary]
