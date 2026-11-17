from decimal import Decimal
from typing import Dict

def normalize_and_reconcile(
    adjusted_pcts: Dict[str, Decimal],
    capacity: Decimal
) -> tuple[Dict[str, Decimal], Dict[str, Decimal]]:
    """
    Normalizes allocation percentages to sum to 1.00 (or 0.00 if paused/zero).
    Calculates monthly amounts and reconciles any rounding differences.
    """
    # 1. Clamp to non-negative and sum
    clamped = {k: max(v, Decimal("0.00")) for k, v in adjusted_pcts.items()}
    total = sum(clamped.values())
    
    # 2. Handle zero total (or division by zero protection)
    if total == Decimal("0.00") or capacity <= Decimal("0.00"):
        zero_pcts = {k: Decimal("0.00") for k in adjusted_pcts}
        zero_amounts = {k: Decimal("0.00") for k in adjusted_pcts}
        return zero_pcts, zero_amounts

    # 3. Normalize percentages
    normalized_pcts = {k: v / total for k, v in clamped.items()}
    
    # Assert normalized percentages sum exactly to 1.00
    assert sum(normalized_pcts.values()) == Decimal("1.00"), "Percentages must sum to 1.00"

    # 4. Calculate monthly amounts
    amounts = {k: (capacity * v).quantize(Decimal("0.01")) for k, v in normalized_pcts.items()}
    
    # 5. Rounding reconciliation
    total_amount = sum(amounts.values())
    difference = capacity - total_amount
    
    if difference != Decimal("0.00"):
        # Find the category with the largest amount
        largest_key = max(amounts, key=lambda k: (amounts[k], k))
        amounts[largest_key] += difference
        
    # Assert amounts sum exactly to capacity
    assert sum(amounts.values()) == capacity, "Reconciled amounts must sum exactly to capacity"
    
    return normalized_pcts, amounts
