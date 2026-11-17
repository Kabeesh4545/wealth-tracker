from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

# Data Types
DATA_TYPE_ACTUAL = "ACTUAL"
DATA_TYPE_BENCHMARK = "BENCHMARK"
DATA_TYPE_VERIFIED = "VERIFIED"
DATA_TYPE_HISTORICAL = "HISTORICAL"
DATA_TYPE_DERIVED = "DERIVED"
DATA_TYPE_ESTIMATED = "ESTIMATED"
DATA_TYPE_STALE = "STALE"
DATA_TYPE_UNAVAILABLE = "UNAVAILABLE"

# Freshness Statuses
FRESHNESS_CURRENT = "CURRENT"
FRESHNESS_RECENT = "RECENT"
FRESHNESS_STALE = "STALE"
FRESHNESS_UNAVAILABLE = "UNAVAILABLE"

class DataProvenanceSchema(BaseModel):
    id: Optional[int] = None
    value: Optional[float] = None
    currency: str = "INR"
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    data_type: str = Field(default=DATA_TYPE_BENCHMARK, description="ACTUAL | BENCHMARK | VERIFIED | HISTORICAL | DERIVED | ESTIMATED | STALE | UNAVAILABLE")
    source: str
    source_url: Optional[str] = None
    reference_date: Optional[str] = None # YYYY-MM-DD
    reference_month: Optional[str] = None # YYYY-MM
    retrieved_at: Optional[str] = None # ISO Timestamp
    confidence: str = Field(default="MEDIUM", description="HIGH | MEDIUM | LOW | UNAVAILABLE")
    is_verified: bool = True
    freshness_status: str = Field(default=FRESHNESS_RECENT, description="CURRENT | RECENT | STALE | UNAVAILABLE")
    estimation_method: Optional[str] = None
    estimation_inputs: Optional[dict] = None

    class Config:
        from_attributes = True
