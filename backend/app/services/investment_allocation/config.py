from decimal import Decimal

# Configurable educational financial-planning assumptions.
# These thresholds, percentages, and multipliers are project planning assumptions only
# and must NOT be presented as universal financial advice.
INVESTMENT_CONFIG = {
    "allocation_profiles": {
        "low": {
            "capital_preservation": Decimal("0.70"),
            "stable": Decimal("0.20"),
            "growth": Decimal("0.10")
        },
        "medium": {
            "capital_preservation": Decimal("0.40"),
            "stable": Decimal("0.20"),
            "growth": Decimal("0.40")
        },
        "high": {
            "capital_preservation": Decimal("0.20"),
            "stable": Decimal("0.10"),
            "growth": Decimal("0.70")
        }
    },
    
    # Investment horizon maximum growth limit constraints
    "horizon_limits": {
        "Less than 1 year": Decimal("0.00"),
        "1–3 years": Decimal("0.20"),
        "3–5 years": Decimal("0.45"),
        "5+ years": Decimal("1.00")
    },

    # Experience experience limits for growth-oriented exposures
    "beginner_growth_limit": Decimal("0.30"),

    # High debt growth reduction constraint
    "high_debt_growth_reduction": Decimal("0.20"),

    # Emergency fund capacity multipliers
    "emergency_fund_reduction": {
        "Needs Building": Decimal("0.00"),
        "Partially Funded": Decimal("0.50"),
        "Adequately Funded": Decimal("1.00")
    }
}
