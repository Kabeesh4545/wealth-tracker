from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from fastapi import HTTPException, status
from typing import Dict, Any, List, Optional

from app.models.expense import Expense
from app.models.planned_expense import PlannedExpense
from app.models.financial_profile import FinancialProfile
from app.models.loan import Loan
from app.models.user import User

# Step 8 category mapping configuration
CATEGORIES_MAP = {
    "Essential": [
        "Food & Groceries",
        "Transportation",
        "Electricity",
        "Water",
        "Internet",
        "Mobile",
        "Healthcare",
        "Education",
        "Insurance"
    ],
    "Lifestyle": [
        "Shopping",
        "Entertainment",
        "Eating Outside",
        "Travel",
        "Subscriptions",
        "Hobbies",
        "Other"
    ],
    "Housing": [
        "Rent",
        "Maintenance",
        "Other Housing"
    ],
    "Debt": [
        "Loan EMI",
        "Other Debt"
    ]
}

PAYMENT_METHODS = ["Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer", "Other"]

# Planned budget threshold settings
BUDGET_THRESHOLD_NEAR = Decimal("0.90")  # 90%

# Map Actual subcategory strings to Planned key values
SUBCAT_TO_PLANNED_KEY = {
    "Food & Groceries": "foodGroceries",
    "Transportation": "transportation",
    "Electricity": "electricity",
    "Water": "water",
    "Internet": "internet",
    "Mobile": "mobile",
    "Healthcare": "healthcare",
    "Education": "education",
    "Insurance": "insurance",
    "Shopping": "shopping",
    "Entertainment": "entertainment",
    "Eating Outside": "eatingOutside",
    "Travel": "travel",
    "Subscriptions": "subscriptions",
    "Hobbies": "hobbies",
    "Other": "other"
}

def validate_category_subcategory(category: str, subcategory: str):
    """
    Validates category and subcategory pairing and raises HTTP 422 if invalid.
    """
    if category not in CATEGORIES_MAP:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid category: '{category}'. Supported: {list(CATEGORIES_MAP.keys())}"
        )
    if subcategory not in CATEGORIES_MAP[category]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid subcategory '{subcategory}' for category '{category}'"
        )

def validate_payment_method(method: Optional[str]):
    """
    Validates payment method matches supported enums.
    """
    if method and method not in PAYMENT_METHODS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid payment method: '{method}'. Supported: {PAYMENT_METHODS}"
        )

def validate_expense_date(expense_date: date):
    """
    Ensures actual tracked expenses do not contain future dates.
    """
    if expense_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Actual expenses cannot be recorded for a future date."
        )

def calculate_monthly_summary(
    db: Session,
    user_id: int,
    month: int,
    year: int
) -> Dict[str, Any]:
    """
    Aggregates user's total expenses and category distributions using SQL aggregations.
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # 1. Total expenses sum and transaction count
    summary_query = db.query(
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count")
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).first()

    total_expenses = summary_query.total or Decimal("0.0")
    expense_count = summary_query.count or 0

    # 2. Sum grouped by Category
    cat_query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("sum")
    ).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(Expense.category).all()

    categories_list = []
    for cat, amt_sum in cat_query:
        amt = amt_sum or Decimal("0.0")
        pct = float((amt / total_expenses) * 100) if total_expenses > 0 else 0.0
        categories_list.append({
            "category": cat,
            "amount": float(amt),
            "percentage": round(pct, 1)
        })

    return {
        "month": f"{year}-{month:02d}",
        "total_expenses": float(total_expenses),
        "expense_count": expense_count,
        "categories": categories_list
    }

def calculate_historical_trend(
    db: Session,
    user_id: int,
    months_limit: int = 6
) -> List[Dict[str, Any]]:
    """
    Computes historical monthly expenditure sums for the last N months.
    """
    today = date.today()
    trend_list = []

    for i in range(months_limit - 1, -1, -1):
        # Calculate target month/year step
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        
        start_date = date(y, m, 1)
        if m == 12:
            end_date = date(y + 1, 1, 1)
        else:
            end_date = date(y, m + 1, 1)

        total_sum = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar() or Decimal("0.0")

        month_label = start_date.strftime("%B %Y")
        trend_list.append({
            "month_key": f"{y}-{m:02d}",
            "month_label": month_label,
            "total_expenses": float(total_sum)
        })

    return trend_list

def compare_planned_vs_actual(
    db: Session,
    user: User,
    month: int,
    year: int
) -> Dict[str, Any]:
    """
    Maps and aggregates actual logged expenses to compare against planned budget profiles.
    """
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    # 1. Fetch Planned Baselines
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    planned_expenses = db.query(PlannedExpense).filter(PlannedExpense.user_id == user.id).all()
    loans = db.query(Loan).filter(Loan.user_id == user.id).all()

    # Budget dictionary mapped by subcategory keys
    planned_budget: Dict[str, Decimal] = {}

    # Map onboarding planned expenses
    for pe in planned_expenses:
        planned_budget[pe.category] = Decimal(str(pe.monthly_amount or 0.0))

    # Map housing
    rent_amt = Decimal("0.0")
    maintenance_amt = Decimal("0.0")
    other_housing_amt = Decimal("0.0")
    if profile:
        rent_amt = Decimal(str(profile.rent_amount or 0.0)) if (profile.housing_type or "").lower() == "rent" else Decimal("0.0")
        maintenance_amt = Decimal(str(profile.maintenance or 0.0))
        other_housing_amt = Decimal(str(profile.household_contribution or 0.0)) + Decimal(str(profile.other_housing_expenses or 0.0))

    planned_budget["Rent"] = rent_amt
    planned_budget["Maintenance"] = maintenance_amt
    planned_budget["Other Housing"] = other_housing_amt

    # Map loan debt
    total_emi = Decimal("0.0")
    for l in loans:
        total_emi += Decimal(str(l.monthly_emi or 0.0))
    if profile and profile.has_home_loan == "Yes":
        total_emi += Decimal(str(profile.home_loan_emi or 0.0))

    planned_budget["Loan EMI"] = total_emi
    planned_budget["Other Debt"] = Decimal("0.0")

    # 2. Get Actual logged sums grouped by subcategory
    actual_query = db.query(
        Expense.subcategory,
        func.sum(Expense.amount).label("sum")
    ).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).group_by(Expense.subcategory).all()

    actual_totals = {subcat: (amt or Decimal("0.0")) for subcat, amt in actual_query}

    # 3. Create Comparison Category Aggregations
    comparisons = []
    
    # We define subcategory aggregates for comparison:
    comparison_map = {
        "Food & Groceries": "Food & Groceries",
        "Transportation": "Transportation",
        "Electricity Utilities": "Electricity",
        "Water Utilities": "Water",
        "Internet Utilities": "Internet",
        "Mobile Utilities": "Mobile",
        "Healthcare": "Healthcare",
        "Education": "Education",
        "Insurance": "Insurance",
        "Shopping": "Shopping",
        "Entertainment": "Entertainment",
        "Eating Outside": "Eating Outside",
        "Travel": "Travel",
        "Subscriptions": "Subscriptions",
        "Hobbies": "Hobbies",
        "Rent": "Rent",
        "Maintenance": "Maintenance",
        "Other Housing": "Other Housing",
        "Loan EMI": "Loan EMI",
        "Other Debt": "Other Debt"
    }

    for label, subcat in comparison_map.items():
        # Get planned
        planned_key = SUBCAT_TO_PLANNED_KEY.get(subcat, subcat)
        planned_val = planned_budget.get(planned_key, Decimal("0.0"))
        
        # Get actual
        actual_val = actual_totals.get(subcat, Decimal("0.0"))
        
        # Skip if both are zero (keep report clean)
        if planned_val == 0 and actual_val == 0:
            continue

        diff = actual_val - planned_val
        
        # Calculate status
        if planned_val == 0:
            status_str = "Above Plan" if actual_val > 0 else "Within Plan"
        else:
            ratio = actual_val / planned_val
            if ratio <= BUDGET_THRESHOLD_NEAR:
                status_str = "Within Plan"
            elif ratio <= Decimal("1.00"):
                status_str = "Near Limit"
            else:
                status_str = "Above Plan"

        comparisons.append({
            "category": label,
            "planned": float(planned_val),
            "actual": float(actual_val),
            "difference": float(diff),
            "status": status_str
        })

    return {
        "month": f"{year}-{month:02d}",
        "categories": comparisons
    }

def get_expense_history_summary(db: Session, user_id: int, subcategory: str) -> Dict[str, Any]:
    """
    Aggregates historical user expenditure for a category across available history:
    - 1-month actual
    - 3-month average
    - 6-month average
    - 12-month average
    - Trend analysis (INCREASING | STABLE | DECREASING)
    - Returns data availability notice if insufficient data exists (NO fabrication).
    """
    today = date.today()
    
    # Query monthly sums for this subcategory for the past 12 months
    monthly_sums = db.query(
        extract('year', Expense.expense_date).label('year'),
        extract('month', Expense.expense_date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == user_id,
        Expense.subcategory.ilike(subcategory.strip())
    ).group_by(
        extract('year', Expense.expense_date),
        extract('month', Expense.expense_date)
    ).order_by(
        extract('year', Expense.expense_date).desc(),
        extract('month', Expense.expense_date).desc()
    ).all()

    if not monthly_sums:
        return {
            "has_history": False,
            "month_count": 0,
            "one_month_actual": None,
            "three_month_avg": None,
            "six_month_avg": None,
            "twelve_month_avg": None,
            "trend": "NEUTRAL",
            "message": "Historical spending data unavailable"
        }

    totals = [Decimal(str(row.total or 0.0)) for row in monthly_sums]
    m_count = len(totals)

    one_mo = float(totals[0]) if m_count >= 1 else None
    three_mo = float(round(sum(totals[:3]) / Decimal(str(min(m_count, 3))), 2)) if m_count >= 1 else None
    six_mo = float(round(sum(totals[:6]) / Decimal(str(min(m_count, 6))), 2)) if m_count >= 1 else None
    twelve_mo = float(round(sum(totals[:12]) / Decimal(str(m_count)), 2)) if m_count >= 1 else None

    # Determine trend
    if m_count >= 2:
        recent = totals[0]
        previous = totals[1]
        if recent > previous * Decimal("1.05"):
            trend = "INCREASING"
        elif recent < previous * Decimal("0.95"):
            trend = "DECREASING"
        else:
            trend = "STABLE"
    else:
        trend = "STABLE"

    msg = f"Based on {m_count} month{'s' if m_count > 1 else ''} of actual data"

    return {
        "has_history": True,
        "month_count": m_count,
        "one_month_actual": one_mo,
        "three_month_avg": three_mo,
        "six_month_avg": six_mo,
        "twelve_month_avg": twelve_mo,
        "trend": trend,
        "message": msg
    }
