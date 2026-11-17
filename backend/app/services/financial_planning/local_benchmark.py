from decimal import Decimal
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.models.financial_profile import FinancialProfile
from app.models.expense import Expense
from app.services import local_cost_service

# Map frontend/actual categories to database lookup fields
# Format: (display_label, category, subcategory)
COMPARISON_MAPPING = {
    "rent": ("Housing Rent", "Housing", "Rent"),
    "foodGroceries": ("Food & Groceries", "Food", "Food & Groceries"),
    "eatingOutside": ("Eating Outside", "Food", "Eating Outside"),
    "electricity": ("Electricity Utilities", "Utilities", "Electricity"),
    "water": ("Water Utilities", "Utilities", "Water"),
    "internet": ("Internet Utilities", "Utilities", "Internet"),
    "mobile": ("Mobile Utilities", "Utilities", "Mobile"),
    "healthcare": ("Healthcare Costs", "Healthcare", "Healthcare"),
    "education": ("Education Costs", "Education", "Education")
}

def compare_user_costs(
    db: Session,
    profile: FinancialProfile,
    expenses_list: List[Expense]
) -> List[Dict[str, Any]]:
    """
    Compares actual user expenses against local cost estimations for available categories.
    """
    if not profile or not profile.city:
        return []
        
    city = profile.city
    # Household size
    family_members = profile.family_members if profile.family_members is not None else 1
    
    # Standard housing BHK
    if family_members == 1:
        housing_type = "1 BHK"
    elif family_members in [2, 3]:
        housing_type = "2 BHK"
    else:
        housing_type = "3 BHK"

    benchmarks = []
    
    # 1. Map expenses list for easy lookups
    exp_dict = {exp.category: Decimal(str(exp.monthly_amount or 0.0)) for exp in expenses_list}
    
    for key, (label, cat, subcat) in COMPARISON_MAPPING.items():
        # Get actual value
        if key == "rent":
            actual_val = Decimal(str(profile.rent_amount or 0.0))
        else:
            actual_val = exp_dict.get(key, Decimal("0.0"))
            
        # Call Step 4 Cost Service
        try:
            est_res = local_cost_service.estimate_cost(
                db=db,
                city=city,
                category=cat,
                household_size=family_members,
                housing_type=housing_type,
                subcategory=subcat
            )
            
            typical = Decimal(str(est_res.estimate.typical))
            min_c = Decimal(str(est_res.estimate.min))
            max_c = Decimal(str(est_res.estimate.max))
            
            diff = actual_val - typical
            pct_diff = 0.0
            if typical > 0:
                pct_diff = float(round((diff / typical) * 100, 2))
                
            benchmarks.append({
                "category_label": label,
                "actual_cost": float(actual_val),
                "local_min": float(min_c),
                "local_typical": float(typical),
                "local_max": float(max_c),
                "difference_from_typical": float(round(diff, 2)),
                "percentage_difference": pct_diff,
                "benchmark_available": True,
                "source": est_res.source,
                "reference_month": est_res.reference_month
            })
        except Exception:
            # If cost service raises 404, we continue with benchmark_available = False
            benchmarks.append({
                "category_label": label,
                "actual_cost": float(actual_val),
                "local_min": 0.0,
                "local_typical": 0.0,
                "local_max": 0.0,
                "difference_from_typical": 0.0,
                "percentage_difference": 0.0,
                "benchmark_available": False,
                "source": "",
                "reference_month": ""
            })
            
    return benchmarks
