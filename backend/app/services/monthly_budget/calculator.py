from decimal import Decimal
import calendar
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.planned_expense import PlannedExpense
from app.models.expense import Expense
from app.models.saving import Saving
from app.models.loan import Loan
from app.models.financial_goal import FinancialGoal
from app.models.goal_contribution import GoalContribution

from app.services.financial_planning.engine import generate_financial_plan
from app.services.data_sources.local_cost_provider import LocalCostProvider
from app.services.expense_service import get_expense_history_summary
from app.services.monthly_budget.config import CATEGORY_PRIORITIES, CATEGORY_EXPLANATIONS, DEFAULT_LIFESTYLE_SPLITS
from app.services.data_sources.provenance import (
    DataProvenanceSchema,
    DATA_TYPE_ACTUAL,
    DATA_TYPE_BENCHMARK,
    DATA_TYPE_HISTORICAL,
    DATA_TYPE_DERIVED,
    DATA_TYPE_UNAVAILABLE,
    FRESHNESS_RECENT
)

DISCLAIMER_TEXT = (
    "This monthly financial plan is based on real user inputs, historical expenditure, "
    "and verified location benchmarks. Values represent maximum recommended guidelines rather than legal mandates."
)

LOCAL_COST_MAPPING = {
    "Food & Groceries": ("Food", "Food & Groceries"),
    "Transportation": ("Transportation", "Transportation"),
    "Electricity": ("Utilities", "Electricity"),
    "Water": ("Utilities", "Water"),
    "Internet": ("Utilities", "Internet"),
    "Mobile": ("Utilities", "Mobile"),
    "Healthcare": ("Healthcare", "Healthcare"),
    "Education": ("Education", "Education"),
    "Insurance": ("Insurance", "Insurance"),
    "Housing Rent": ("Housing", "Rent"),
    "Housing Maintenance": ("Housing", "Maintenance"),
    "Loan EMI": ("Debt", "Loan EMI"),
    "Shopping": ("Lifestyle", "Shopping"),
    "Entertainment": ("Lifestyle", "Entertainment"),
    "Eating Outside": ("Food", "Eating Outside"),
    "Travel": ("Lifestyle", "Travel"),
    "Subscriptions": ("Lifestyle", "Subscriptions"),
    "Hobbies": ("Lifestyle", "Hobbies"),
    "Other Discretionary": ("Lifestyle", "Other")
}

local_provider = LocalCostProvider()

def calculate_monthly_budget(
    db: Session,
    user: User,
    ref_month: Optional[str] = None,
    scenario_state: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes a mathematically reconciled monthly financial operating plan,
    spending limits log (Recommended, Safe, Hard), Safe-to-Spend breakdown,
    data provenance metadata, and calculation explanation objects.
    """
    # 1. Parse reference month
    if ref_month:
        try:
            parts = ref_month.split("-")
            year = int(parts[0])
            month = int(parts[1])
            ref_date = date(year, month, 1)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid month format. Must be YYYY-MM")
    else:
        ref_date = date.today()
        year = ref_date.year
        month = ref_date.month

    # 2. Baseline calculations from Step 5
    dt_ref = datetime(year, month, ref_date.day)
    plan = generate_financial_plan(db, user, ref_date=dt_ref, scenario_state=scenario_state)
    
    planning_income = Decimal(str(plan["income"]["planning_income"]))
    
    # Step 5 allocations
    emergency_fund_contrib = Decimal(str(plan["budget"]["emergency_fund"]))
    goal_contrib = Decimal(str(plan["budget"]["goals"]))
    investment_capacity = Decimal(str(plan["budget"]["investments"]))
    
    # Profile & planned list
    if scenario_state:
        profile = scenario_state.get("profile")
        planned_list = scenario_state.get("expenses", [])
    else:
        profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        planned_list = db.query(PlannedExpense).filter(PlannedExpense.user_id == user.id).all()
        
    family_members = profile.family_members if profile and profile.family_members else 1
    city = profile.city if profile and profile.city else ""
    housing_type = profile.housing_type if profile else ""
    housing_type_bhk = "1 BHK" if family_members == 1 else ("2 BHK" if family_members in [2, 3] else "3 BHK")
    
    # Query actual transactions for the selected YYYY-MM
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
        
    actual_spent_map = {}
    total_tx_count = 0
    if not scenario_state:
        total_tx_count = db.query(func.count(Expense.id)).filter(
            Expense.user_id == user.id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar() or 0
        
        if total_tx_count > 0:
            actuals = db.query(
                Expense.subcategory,
                func.sum(Expense.amount).label("total")
            ).filter(
                Expense.user_id == user.id,
                Expense.expense_date >= start_date,
                Expense.expense_date < end_date
            ).group_by(Expense.subcategory).all()
            actual_spent_map = {sub: Decimal(str(tot or 0.0)) for sub, tot in actuals}

    planned_map = {exp.category: Decimal(str(exp.monthly_amount or 0.0)) for exp in planned_list}
    
    # 3. Category allocations
    rent_val = Decimal(str(profile.rent_amount or 0.0)) if profile and housing_type == "Rent" else Decimal("0.00")
    maint_val = Decimal(str(profile.maintenance or 0.0)) if profile else Decimal("0.00")
    loan_emi_limit = Decimal(str(plan["debt"]["total_emi"]))

    essential_items = [
        ("Food & Groceries", "foodGroceries"),
        ("Transportation", "transportation"),
        ("Electricity", "electricity"),
        ("Water", "water"),
        ("Internet", "internet"),
        ("Mobile", "mobile"),
        ("Healthcare", "healthcare"),
        ("Education", "education"),
        ("Insurance", "insurance")
    ]
    
    mandatory_categories = [
        ("Housing Rent", rent_val),
        ("Housing Maintenance", maint_val),
        ("Loan EMI", loan_emi_limit)
    ]
    for label, plan_key in essential_items:
        mandatory_categories.append((label, planned_map.get(plan_key, Decimal("0.00"))))
        
    total_mandatory = sum(val for _, val in mandatory_categories)
    
    # Safe to Spend Discretionary Capacity
    total_deductions = total_mandatory + emergency_fund_contrib + goal_contrib + investment_capacity
    safe_to_spend = planning_income - total_deductions
    
    is_deficit = False
    if safe_to_spend < 0:
        is_deficit = True
        safe_to_spend = Decimal("0.00")
        
    lifestyle_categories = [
        ("Shopping", "shopping"),
        ("Entertainment", "entertainment"),
        ("Eating Outside", "eatingOutside"),
        ("Travel", "travel"),
        ("Subscriptions", "subscriptions"),
        ("Hobbies", "hobbies"),
        ("Other Discretionary", "other")
    ]
    
    lifestyle_planned_total = sum(planned_map.get(k, Decimal("0.00")) for _, k in lifestyle_categories)
    
    allocated_lifestyle_sum = Decimal("0.00")
    lifestyle_limits_map = {}
    
    for i, (label, plan_key) in enumerate(lifestyle_categories):
        if is_deficit:
            rec_limit = Decimal("0.00")
        else:
            if lifestyle_planned_total > 0:
                ratio = planned_map.get(plan_key, Decimal("0.00")) / lifestyle_planned_total
                rec_limit = ratio * safe_to_spend
            else:
                ratio = DEFAULT_LIFESTYLE_SPLITS.get(plan_key, Decimal("0.10"))
                rec_limit = ratio * safe_to_spend
                
            rec_limit = Decimal(str(round(rec_limit, 2)))
            
        if i == len(lifestyle_categories) - 1:
            leftover = safe_to_spend - allocated_lifestyle_sum
            if leftover > 0 and safe_to_spend > 0:
                rec_limit = max(leftover, Decimal("0.00"))
        else:
            allocated_lifestyle_sum += rec_limit
            
        lifestyle_limits_map[label] = rec_limit

    flexible_buffer = planning_income - (total_mandatory + safe_to_spend + emergency_fund_contrib + goal_contrib + investment_capacity)
    
    # 4. Construct category limits and provenance metadata
    all_categories = mandatory_categories + [(label, lifestyle_limits_map[label]) for label, _ in lifestyle_categories]
    
    categories_limits = []
    has_benchmark_city = False
    
    for label, rec_limit in all_categories:
        # Priority 1: Current Actual (from transactions)
        spent = actual_spent_map.get(label, None) if total_tx_count > 0 else None
        
        # Priority 2: Historical Average
        hist_summary = get_expense_history_summary(db, user.id, label) if not scenario_state else {"has_history": False}
        hist_avg = hist_summary["three_month_avg"] if hist_summary.get("has_history") else None

        # Priority 3: Verified Local Benchmark (STRICT ISOLATION: No cross-city fallback!)
        local_min = None
        local_typical = None
        local_max = None
        prov_obj = None
        data_class = DATA_TYPE_BENCHMARK
        
        if city:
            db_cat, db_subcat = LOCAL_COST_MAPPING.get(label, (None, None))
            if db_cat:
                res = local_provider.fetch_data(
                    db=db,
                    city=city,
                    category=db_cat,
                    household_size=family_members,
                    housing_type=housing_type_bhk,
                    subcategory=db_subcat
                )
                if res["status"] == "SUCCESS" and res["data"]:
                    local_min = Decimal(str(res["data"]["min_cost"]))
                    local_typical = Decimal(str(res["data"]["typical_cost"]))
                    local_max = Decimal(str(res["data"]["max_cost"]))
                    prov_obj = res["provenance"]
                    has_benchmark_city = True
                    
        # Determine Data Classification based on Priority Hierarchy:
        # CURRENT ACTUAL > HISTORICAL ACTUAL > VERIFIED BENCHMARK > DERIVED > UNAVAILABLE
        if spent is not None:
            data_class = DATA_TYPE_ACTUAL
        elif hist_avg is not None:
            data_class = DATA_TYPE_HISTORICAL
        elif local_typical is not None:
            data_class = DATA_TYPE_BENCHMARK
        else:
            data_class = DATA_TYPE_UNAVAILABLE

        # Calculate Three Limits: Recommended, Safe, Hard
        # Recommended: Base target
        # Safe Limit: Allowable buffer before impacting savings goals (+15%)
        # Hard Limit: Critical upper threshold (+30%)
        rec_lim_num = float(round(rec_limit, 2))
        safe_lim_num = float(round(rec_limit * Decimal("1.15"), 2)) if rec_limit > 0 else 0.0
        hard_lim_num = float(round(rec_limit * Decimal("1.30"), 2)) if rec_limit > 0 else 0.0

        ideal_target = float(round(local_typical, 2)) if local_typical is not None else float(round(rec_limit * Decimal("0.9"), 2))
        min_required = float(round(local_min, 2)) if local_min is not None else (float(round(rec_limit * Decimal("0.7"), 2)) if label in ["Housing Rent", "Housing Maintenance", "Loan EMI"] else 0.0)

        # Variances
        remaining = float(round(max(rec_limit - spent, Decimal("0.00")), 2)) if spent is not None else None
        util_pct = float(round((spent / rec_limit) * 100, 2)) if (spent is not None and rec_limit > 0) else (100.0 if (spent is not None and spent > 0) else 0.0)
        difference = float(round(spent - rec_limit, 2)) if spent is not None else None
        
        var_benchmark = float(round(spent - local_typical, 2)) if (spent is not None and local_typical is not None) else None
        var_pct_benchmark = float(round(((spent - local_typical) / local_typical) * 100, 2)) if (spent is not None and local_typical is not None and local_typical > 0) else None

        # Status
        priority = CATEGORY_PRIORITIES.get(label, "TIER 3")
        explanation_base = CATEGORY_EXPLANATIONS.get(label, "")

        status_str = "ON TRACK"
        if spent is None:
            status_str = "NOT RECORDED"
        elif rec_limit == 0 and spent > 0:
            status_str = "OVER LIMIT"
        elif rec_limit > 0:
            if spent >= rec_limit:
                status_str = "OVER LIMIT"
            elif spent >= rec_limit * Decimal("0.90"):
                status_str = "NEAR LIMIT"
            elif spent == 0:
                status_str = "UNDER BUDGET"

        if status_str == "OVER LIMIT" and difference and difference > 0:
            explanation = f"{explanation_base} Exceeded recommended limit by ₹{difference:,.2f}. Reduce discretionary spending immediately."
        elif status_str == "NEAR LIMIT" and remaining is not None:
            explanation = f"{explanation_base} Warning: only ₹{remaining:,.2f} remains in this budget category."
        else:
            explanation = f"{explanation_base} Keep spending within safe limit of ₹{safe_lim_num:,.2f}."

        # Construct Calculation Explanation Object (Machine readable reasoning)
        basis_list = []
        if spent is not None:
            basis_list.append("user_actual_transactions")
        if hist_avg is not None:
            basis_list.append("user_historical_average")
        if local_typical is not None:
            basis_list.append("verified_city_benchmark")
        basis_list.append("planning_income_surplus")

        inputs_dict = {
            "actual_current": float(spent) if spent is not None else None,
            "historical_3mo_avg": hist_avg,
            "city_benchmark": float(local_typical) if local_typical is not None else None,
            "planning_income": float(planning_income)
        }

        expl_object = {
            "metric": f"{label.lower().replace(' ', '_')}_recommended_limit",
            "value": rec_lim_num,
            "currency": "INR",
            "basis": basis_list,
            "inputs": inputs_dict,
            "explanation": f"Recommended limit of ₹{rec_lim_num:,.2f} is calculated based on {', '.join(basis_list).replace('_', ' ')}.",
            "provenance": prov_obj.model_dump() if prov_obj else None
        }

        categories_limits.append({
            "category": label,
            "current_spending": float(round(spent, 2)) if spent is not None else None,
            "actual_current": float(round(spent, 2)) if spent is not None else None,
            "historical_average": hist_avg,
            "local_benchmark": float(round(local_typical, 2)) if local_typical is not None else None,
            "recommended_limit": rec_lim_num,
            "safe_limit": safe_lim_num,
            "hard_limit": hard_lim_num,
            "ideal_target": ideal_target,
            "minimum_required": min_required,
            "remaining_limit": remaining,
            "utilization_percentage": util_pct,
            "difference": difference,
            "variance_from_benchmark": var_benchmark,
            "variance_percentage": var_pct_benchmark,
            "data_classification": data_class,
            "status": status_str,
            "priority": priority,
            "explanation": explanation,
            "provenance": prov_obj.model_dump() if prov_obj else None,
            "explanation_object": expl_object
        })

    # 5. Safe-to-Spend Breakdown
    if is_deficit:
        safe_to_spend_monthly = Decimal("0.00")
        safe_to_spend_weekly = Decimal("0.00")
        safe_to_spend_daily = Decimal("0.00")
    else:
        safe_to_spend_monthly = safe_to_spend
        today = date.today()
        if today.year == year and today.month == month:
            remaining_days = max(calendar.monthrange(year, month)[1] - today.day + 1, 1)
        else:
            remaining_days = calendar.monthrange(year, month)[1]
            
        safe_to_spend_daily = safe_to_spend_monthly / Decimal(str(remaining_days))
        safe_to_spend_weekly = safe_to_spend_daily * Decimal("7")

    safe_breakdown = {
        "safe_to_spend_monthly": float(round(safe_to_spend_monthly, 2)),
        "safe_to_spend_weekly": float(round(safe_to_spend_weekly, 2)),
        "safe_to_spend_daily": float(round(safe_to_spend_daily, 2)),
        "planning_income": float(round(planning_income, 2)),
        "fixed_obligations": float(round(rent_val + maint_val + loan_emi_limit, 2)),
        "essential_expenses": float(round(total_mandatory - (rent_val + maint_val + loan_emi_limit), 2)),
        "goal_contribution": float(round(goal_contrib, 2)),
        "emergency_fund": float(round(emergency_fund_contrib, 2)),
        "investment": float(round(investment_capacity, 2)),
        "remaining_flexible_amount": float(round(safe_to_spend_monthly, 2)),
        "explanation_object": {
            "metric": "safe_to_spend",
            "value": float(round(safe_to_spend_monthly, 2)),
            "currency": "INR",
            "basis": ["income", "fixed_obligations", "essential_expenses", "goal_contributions", "emergency_fund", "investments"],
            "inputs": {
                "planning_income": float(planning_income),
                "total_deductions": float(total_deductions)
            },
            "explanation": f"Safe to spend monthly discretionary amount is ₹{float(round(safe_to_spend_monthly, 2)):,.2f} after deducting all fixed, essential, savings, and investment protections.",
            "provenance": None
        }
    }

    # 6. Action checklist lists
    actions = []
    if loan_emi_limit > 0:
        actions.append({
            "priority": "HIGH",
            "text": f"Pay EMI liabilities of ₹{float(round(loan_emi_limit, 2)):,.2f}",
            "amount": float(round(loan_emi_limit, 2)),
            "done": bool(actual_spent_map.get("Loan EMI", Decimal("0.00")) >= loan_emi_limit) if total_tx_count > 0 else False
        })
    if emergency_fund_contrib > 0:
        actions.append({
            "priority": "HIGH",
            "text": f"Set aside emergency fund allocation of ₹{float(round(emergency_fund_contrib, 2)):,.2f}",
            "amount": float(round(emergency_fund_contrib, 2)),
            "done": False
        })
    if goal_contrib > 0:
        actions.append({
            "priority": "HIGH",
            "text": f"Save goal contribution of ₹{float(round(goal_contrib, 2)):,.2f} toward targets",
            "amount": float(round(goal_contrib, 2)),
            "done": False
        })
    if investment_capacity > 0:
        actions.append({
            "priority": "HIGH",
            "text": f"Allocate required investment capacity of ₹{float(round(investment_capacity, 2)):,.2f}",
            "amount": float(round(investment_capacity, 2)),
            "done": False
        })

    # Warnings
    warnings = []
    if is_deficit:
        deficit_amt = abs(planning_income - total_deductions)
        warnings.append(
            f"Your current expenses exceed planning income by ₹{float(round(deficit_amt, 2)):,.2f}. "
            f"Avoid increasing discretionary spending until cash flow is stabilized."
        )
    if plan["debt"]["status"] == "High":
        warnings.append("High Debt-to-Income (DTI) ratio detected. Prioritize debt reduction immediately.")

    status_text = f"Local benchmarks matched from {city} database" if (city and has_benchmark_city) else "Local benchmark unavailable"

    return {
        "month": f"{year}-{month:02d}",
        "planning_income": float(round(planning_income, 2)),
        "mandatory_expenses": float(round(total_mandatory, 2)),
        "lifestyle_limit": float(round(safe_to_spend_monthly, 2)),
        "safe_to_spend_monthly": float(round(safe_to_spend_monthly, 2)),
        "safe_to_spend_weekly": float(round(safe_to_spend_weekly, 2)),
        "safe_to_spend_daily": float(round(safe_to_spend_daily, 2)),
        "safe_to_spend_breakdown": safe_breakdown,
        "savings_target": float(round(emergency_fund_contrib + goal_contrib + investment_capacity, 2)),
        "emergency_contribution": float(round(emergency_fund_contrib, 2)),
        "goal_contribution": float(round(goal_contrib, 2)),
        "investment_capacity": float(round(investment_capacity, 2)),
        "categories": categories_limits,
        "actions": actions,
        "warnings": warnings,
        "benchmark_status": status_text,
        "disclaimer": DISCLAIMER_TEXT
    }

def compare_location_costs(db: Session, user: User, target_city: str) -> Dict[str, Any]:
    """
    Compares essential costs and safe-to-spend changes when switching from current city to target_city.
    IMPORTANT: User-entered actual expenses (e.g. rent ₹12,000) remain UNCHANGED by location change.
    Only benchmark-dependent portions recalculate.
    """
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    current_city = profile.city if profile and profile.city else "Coimbatore"
    family_members = profile.family_members if profile and profile.family_members else 1
    housing_type_bhk = "1 BHK" if family_members == 1 else ("2 BHK" if family_members in [2, 3] else "3 BHK")

    categories = ["Food", "Transportation", "Utilities", "Housing"]
    comparison_items = []
    
    prev_total = Decimal("0.00")
    curr_total = Decimal("0.00")

    for cat in categories:
        # Fetch previous city benchmark
        res_prev = local_provider.fetch_data(db=db, city=current_city, category=cat, household_size=family_members, housing_type=housing_type_bhk)
        prev_typ = Decimal(str(res_prev["data"]["typical_cost"])) if (res_prev["status"] == "SUCCESS" and res_prev["data"]) else None

        # Fetch current target city benchmark
        res_curr = local_provider.fetch_data(db=db, city=target_city, category=cat, household_size=family_members, housing_type=housing_type_bhk)
        curr_typ = Decimal(str(res_curr["data"]["typical_cost"])) if (res_curr["status"] == "SUCCESS" and res_curr["data"]) else None

        delta = None
        pct_change = None
        status_item = "Benchmark Available"

        if prev_typ is not None and curr_typ is not None:
            delta = curr_typ - prev_typ
            pct_change = float(round((delta / prev_typ) * 100, 2)) if prev_typ > 0 else 0.0
            prev_total += prev_typ
            curr_total += curr_typ
        else:
            status_item = "Local benchmark unavailable"

        comparison_items.append({
            "category": cat,
            "previous_city_benchmark": float(round(prev_typ, 2)) if prev_typ is not None else None,
            "current_city_benchmark": float(round(curr_typ, 2)) if curr_typ is not None else None,
            "delta_amount": float(round(delta, 2)) if delta is not None else None,
            "percentage_change": pct_change,
            "status": status_item
        })

    tot_delta = curr_total - prev_total
    safe_delta = -tot_delta # Essential cost increase reduces safe to spend by same amount

    return {
        "previous_city": current_city,
        "current_city": target_city,
        "previous_total_essentials": float(round(prev_total, 2)),
        "current_total_essentials": float(round(curr_total, 2)),
        "total_essential_delta": float(round(tot_delta, 2)),
        "safe_to_spend_delta": float(round(safe_delta, 2)),
        "comparison_items": comparison_items,
        "explanation": f"Switching location from {current_city} to {target_city} changes estimated essential costs by ₹{float(round(tot_delta, 2)):,.2f}. User actual expense records remain unchanged."
    }
