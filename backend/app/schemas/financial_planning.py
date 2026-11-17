from pydantic import BaseModel, Field
from typing import List, Optional

class PlanningIncomeSchema(BaseModel):
    salary: float
    other_income: float
    variable_income: float
    planning_income: float

class PlanningExpensesSchema(BaseModel):
    essential: float
    lifestyle: float
    total: float

class PlanningDebtSchema(BaseModel):
    total_emi: float
    total_outstanding: float
    debt_to_income_ratio: float
    status: str

class PlanningCashFlowSchema(BaseModel):
    monthly_surplus: float
    surplus_percentage: float
    status: str

class PlanningEmergencyFundSchema(BaseModel):
    current: float
    recommended_min: float
    recommended_target: float
    gap: float
    months_coverage: float
    target_months: int
    status: str

class PlanningGoalSchema(BaseModel):
    id: str | int
    goal_name: str
    target_amount: float
    current_amount: float
    remaining_amount: float
    target_date: str
    months_remaining: int
    required_monthly_contribution: float
    allocated_contribution: float
    status: str
    progress_percent: float

class PlanningInvestmentSchema(BaseModel):
    capacity: float
    risk_profile: str

class PlanningBudgetSchema(BaseModel):
    essential: float
    loan_payments: float
    lifestyle: float
    emergency_fund: float
    goals: float
    investments: float
    buffer: float

class PlanningBenchmarkSchema(BaseModel):
    category_label: str
    actual_cost: float
    local_min: float
    local_typical: float
    local_max: float
    difference_from_typical: float
    percentage_difference: float
    benchmark_available: bool
    source: str
    reference_month: str

class PlanningRecommendationSchema(BaseModel):
    type: str
    priority: str
    title: str
    reason: str
    impact: str

class PlanningResponse(BaseModel):
    user_id: int
    health_status: str
    income: PlanningIncomeSchema
    expenses: PlanningExpensesSchema
    debt: PlanningDebtSchema
    cash_flow: PlanningCashFlowSchema
    emergency_fund: PlanningEmergencyFundSchema
    goals: List[PlanningGoalSchema]
    investment: PlanningInvestmentSchema
    budget: PlanningBudgetSchema
    local_benchmarks: List[PlanningBenchmarkSchema]
    recommendations: List[PlanningRecommendationSchema]
    explanations: List[str]
    disclaimer: str

class DataProvenanceResponseSchema(BaseModel):
    id: Optional[int] = None
    value: Optional[float] = None
    currency: str = "INR"
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    data_type: str = "BENCHMARK"
    source: str
    source_url: Optional[str] = None
    reference_date: Optional[str] = None
    reference_month: Optional[str] = None
    retrieved_at: Optional[str] = None
    confidence: str = "MEDIUM"
    is_verified: bool = True
    freshness_status: str = "RECENT"
    estimation_method: Optional[str] = None

class CalculationExplanationSchema(BaseModel):
    metric: str
    value: float
    currency: str = "INR"
    basis: List[str]
    inputs: dict
    explanation: str
    provenance: Optional[DataProvenanceResponseSchema] = None

class BudgetCategoryLimitSchema(BaseModel):
    category: str
    current_spending: Optional[float] = None
    actual_current: Optional[float] = None
    historical_average: Optional[float] = None
    local_benchmark: Optional[float] = None
    recommended_limit: float
    safe_limit: float
    hard_limit: float
    ideal_target: float
    minimum_required: float
    remaining_limit: Optional[float] = None
    utilization_percentage: Optional[float] = None
    difference: Optional[float] = None
    variance_from_benchmark: Optional[float] = None
    variance_percentage: Optional[float] = None
    data_classification: str = "BENCHMARK" # ACTUAL | HISTORICAL | BENCHMARK | DERIVED | ESTIMATED | UNAVAILABLE
    status: str
    priority: str
    explanation: str
    provenance: Optional[DataProvenanceResponseSchema] = None
    explanation_object: Optional[CalculationExplanationSchema] = None

class BudgetActionSchema(BaseModel):
    priority: str
    text: str
    amount: float
    done: bool

class SafeToSpendBreakdownSchema(BaseModel):
    safe_to_spend_monthly: float
    safe_to_spend_weekly: float
    safe_to_spend_daily: float
    planning_income: float
    fixed_obligations: float
    essential_expenses: float
    goal_contribution: float
    emergency_fund: float
    investment: float
    remaining_flexible_amount: float
    explanation_object: Optional[CalculationExplanationSchema] = None

class LocationComparisonItemSchema(BaseModel):
    category: str
    previous_city_benchmark: Optional[float] = None
    current_city_benchmark: Optional[float] = None
    delta_amount: Optional[float] = None
    percentage_change: Optional[float] = None
    status: str

class LocationComparisonResponseSchema(BaseModel):
    previous_city: str
    current_city: str
    previous_total_essentials: float
    current_total_essentials: float
    total_essential_delta: float
    safe_to_spend_delta: float
    comparison_items: List[LocationComparisonItemSchema]
    explanation: str

class DataSourceItemSchema(BaseModel):
    source_key: str
    name: str
    category: str
    source_type: str
    source_url: Optional[str] = None
    last_refreshed_at: Optional[str] = None
    last_status: Optional[str] = None
    freshness_status: str
    is_verified: bool
    confidence: str

class DataQualityDashboardResponseSchema(BaseModel):
    total_sources: int
    active_sources: int
    stale_sources_count: int
    unverified_count: int
    sources: List[DataSourceItemSchema]
    last_system_refresh: Optional[str] = None

class MonthlyBudgetResponse(BaseModel):
    month: str
    planning_income: float
    mandatory_expenses: float
    lifestyle_limit: float
    safe_to_spend_monthly: float
    safe_to_spend_weekly: float
    safe_to_spend_daily: float
    safe_to_spend_breakdown: SafeToSpendBreakdownSchema
    categories: List[BudgetCategoryLimitSchema]
    savings_target: float
    emergency_contribution: float
    goal_contribution: float
    investment_capacity: float
    actions: List[BudgetActionSchema]
    warnings: List[str]
    benchmark_status: str
    disclaimer: str

