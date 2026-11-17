from pydantic import BaseModel
from typing import List, Optional

class AllocationStabilitySchema(BaseModel):
    cash_flow: str
    emergency_fund: str
    debt: str

class AllocationProfileSchema(BaseModel):
    risk_tolerance: Optional[str] = None
    experience: Optional[str] = None
    horizon: Optional[str] = None
    preference: Optional[str] = None

class AllocationItemSchema(BaseModel):
    category: str
    percentage: float
    monthly_amount: float
    reason: str

class AllocationWarningSchema(BaseModel):
    type: str
    severity: str
    title: str
    message: str

class InvestmentAllocationResponse(BaseModel):
    investment_capacity: float
    allocation_status: str
    financial_stability: AllocationStabilitySchema
    profile: AllocationProfileSchema
    allocations: List[AllocationItemSchema]
    warnings: List[AllocationWarningSchema]
    explanations: List[str]
    disclaimer: str
