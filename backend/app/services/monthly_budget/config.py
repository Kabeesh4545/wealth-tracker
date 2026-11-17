from decimal import Decimal

# Priority tiers: Tier 1 (Mandatory), Tier 3 (Lifestyle/Discretionary)
CATEGORY_PRIORITIES = {
    # Essential (Tier 1)
    "Food & Groceries": "TIER 1",
    "Transportation": "TIER 1",
    "Electricity": "TIER 1",
    "Water": "TIER 1",
    "Internet": "TIER 1",
    "Mobile": "TIER 1",
    "Healthcare": "TIER 1",
    "Education": "TIER 1",
    "Insurance": "TIER 1",
    "Housing Rent": "TIER 1",
    "Housing Maintenance": "TIER 1",
    "Loan EMI": "TIER 1",
    
    # Lifestyle (Tier 3)
    "Shopping": "TIER 3",
    "Entertainment": "TIER 3",
    "Eating Outside": "TIER 3",
    "Travel": "TIER 3",
    "Subscriptions": "TIER 3",
    "Hobbies": "TIER 3",
    "Other Discretionary": "TIER 3"
}

# Explanations for each budget limit category
CATEGORY_EXPLANATIONS = {
    "Food & Groceries": "Essential groceries and food provisions.",
    "Transportation": "Required transit for work and daily life.",
    "Electricity": "Electricity utility bill.",
    "Water": "Water utility charges.",
    "Internet": "Broadband internet connection.",
    "Mobile": "Mobile cellular recharge plans.",
    "Healthcare": "Medicine and health checkups.",
    "Education": "School/college fees and educational supplies.",
    "Insurance": "Life and health insurance policy premiums.",
    "Housing Rent": "Mandatory housing rent shelter costs.",
    "Housing Maintenance": "Housing society maintenance charges.",
    "Loan EMI": "Active monthly loan installment liabilities.",
    "Shopping": "Discretionary retail spending.",
    "Entertainment": "Movies, events, and recreation.",
    "Eating Outside": "Restaurants and dining out.",
    "Travel": "Vacation and holiday travel trips.",
    "Subscriptions": "OTT, gym, and news subscriptions.",
    "Hobbies": "Hobbies and leisure activities.",
    "Other Discretionary": "Other miscellaneous spending."
}

# Splits of safe discretionary capacity if user has no planned lifestyle expenses
DEFAULT_LIFESTYLE_SPLITS = {
    "shopping": Decimal("0.25"),
    "eatingOutside": Decimal("0.20"),
    "entertainment": Decimal("0.15"),
    "travel": Decimal("0.15"),
    "subscriptions": Decimal("0.05"),
    "hobbies": Decimal("0.10"),
    "other": Decimal("0.10")
}
