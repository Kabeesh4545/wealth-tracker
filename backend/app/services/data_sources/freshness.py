from datetime import datetime, date
from typing import Optional
from app.services.data_sources.provenance import (
    FRESHNESS_CURRENT,
    FRESHNESS_RECENT,
    FRESHNESS_STALE,
    FRESHNESS_UNAVAILABLE
)

def evaluate_freshness(
    reference_month: Optional[str] = None,
    retrieved_at: Optional[datetime] = None
) -> str:
    """
    Evaluates freshness status independently from verification status.
    - CURRENT: Reference month matches current YYYY-MM
    - RECENT: Retrieved or referenced within last 90 days
    - STALE: Referenced older than 90 days
    - UNAVAILABLE: Missing reference metadata
    """
    today = date.today()
    current_month_str = today.strftime("%Y-%m")

    if not reference_month and not retrieved_at:
        return FRESHNESS_UNAVAILABLE

    if reference_month == current_month_str:
        return FRESHNESS_CURRENT

    if reference_month:
        try:
            parts = reference_month.split("-")
            ref_date = date(int(parts[0]), int(parts[1]), 1)
            days_diff = (today - ref_date).days
            if days_diff <= 90:
                return FRESHNESS_RECENT
            else:
                return FRESHNESS_STALE
        except Exception:
            pass

    if retrieved_at:
        days_diff = (today - retrieved_at.date()).days
        if days_diff <= 30:
            return FRESHNESS_CURRENT
        elif days_diff <= 90:
            return FRESHNESS_RECENT
        else:
            return FRESHNESS_STALE

    return FRESHNESS_STALE
