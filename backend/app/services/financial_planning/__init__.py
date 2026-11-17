from decimal import Decimal

PLANNING_CONFIG = {
    "variable_income_factor": Decimal("0.50"),

    "debt_thresholds": {
        "low": Decimal("0.20"),
        "moderate": Decimal("0.40")
    },

    "emergency_fund": {
        "base_min_months": 3,
        "base_target_months": 6,
        "self_employed_extra_months": 2,
        "dependents_over_2_extra_months": 1,
        "high_debt_extra_months": 1,
        "maximum_months": 9,
        "surplus_allocation_percentage": Decimal("0.30")
    }
}
