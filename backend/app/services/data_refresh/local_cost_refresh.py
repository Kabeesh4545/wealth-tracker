from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.local_cost import LocalCost
from app.services.data_refresh.refresh_manager import RefreshManager
from app.services.data_sources.validators import validate_benchmark_payload, DataValidationError
from app.services.data_sources.freshness import evaluate_freshness

def refresh_local_cost_data(db: Session, update_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Refreshes local cost benchmarks for specified city entries.
    Validates items before storing. On error, rejects item without overwriting database truths.
    """
    manager = RefreshManager(db)
    log_entry = manager.start_refresh_job("numbeo_cost_of_living")

    fetched = len(update_items)
    updated = 0
    rejected = 0
    errors = []

    for item in update_items:
        try:
            validate_benchmark_payload(item)
            
            existing = db.query(LocalCost).filter(
                LocalCost.city == item["city"],
                LocalCost.category == item["category"],
                LocalCost.subcategory == item["subcategory"]
            ).first()

            if existing:
                existing.min_cost = float(item.get("min_cost", existing.min_cost))
                existing.typical_cost = float(item["typical_cost"])
                existing.max_cost = float(item.get("max_cost", existing.max_cost))
                existing.data_type = item.get("data_type", "BENCHMARK")
                existing.is_verified = bool(item.get("is_verified", True))
                existing.freshness_status = evaluate_freshness(item.get("reference_month"), None)
                updated += 1
            else:
                rejected += 1
                errors.append(f"City record '{item['city']}' - '{item['category']}' not pre-indexed.")

        except DataValidationError as ve:
            rejected += 1
            errors.append(f"Validation error for item {item.get('category')}: {ve}")
        except Exception as e:
            rejected += 1
            errors.append(f"Unexpected error: {e}")

    db.commit()
    status = "SUCCESS" if rejected == 0 else ("PARTIAL" if updated > 0 else "FAILED")
    error_summary = "; ".join(errors[:3]) if errors else None

    manager.complete_refresh_job(
        log_entry,
        status=status,
        fetched=fetched,
        updated=updated,
        rejected=rejected,
        error_msg=error_summary
    )

    return {
        "status": status,
        "records_fetched": fetched,
        "records_updated": updated,
        "records_rejected": rejected,
        "error_summary": error_summary
    }
