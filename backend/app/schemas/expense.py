from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import datetime
from decimal import Decimal

class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    subcategory: str = Field(..., min_length=1)
    expense_date: datetime.date
    description: Optional[str] = Field(None, max_length=200)
    payment_method: Optional[str] = Field(None, max_length=50)

class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    category: Optional[str] = None
    subcategory: Optional[str] = None
    expense_date: Optional[datetime.date] = None
    description: Optional[str] = Field(None, max_length=200)
    payment_method: Optional[str] = Field(None, max_length=50)

class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    subcategory: str
    expense_date: datetime.date
    description: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ExpenseCategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float

class ExpenseSummaryResponse(BaseModel):
    month: str
    total_expenses: float
    expense_count: int
    categories: List[ExpenseCategoryBreakdown]

class PlannedVsActualCategory(BaseModel):
    category: str
    planned: float
    actual: float
    difference: float
    status: str

class PlannedVsActualResponse(BaseModel):
    month: str
    categories: List[PlannedVsActualCategory]
