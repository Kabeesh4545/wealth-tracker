from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.data_source import InvestmentRate
from app.services.data_refresh.refresh_manager import RefreshManager
from app.services.data_sources.validators import validate_rate_payload, DataValidationError

def refresh_investment_rates(db: Session, rate_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Refreshes verified investment rate entries in database.
    Ensures classification distinction (CURRENT_RATE, HISTORICAL_PERFORMANCE, EDUCATIONAL_INFO).
    """
    manager = RefreshManager(db)
    log_entry = manager.start_refresh_job("sbi_interest_rates")

    fetched = len(rate_items)
    updated = 0
    rejected = 0
    errors = []

    for item in rate_items:
        try:
            validate_rate_payload(item)

            existing = db.query(InvestmentRate).filter(
                InvestmentRate.institution == item["institution"],
                InvestmentRate.product_name == item["product_name"],
                InvestmentRate.customer_category == item.get("customer_category", "Regular")
            ).first()

            rate_val = Decimal(str(item["rate_value"]))

            if existing:
                existing.rate_value = rate_val
                existing.rate_classification = item.get("rate_classification", "CURRENT_RATE")
                existing.source_url = item.get("source_url", existing.source_url)
                existing.retrieved_at = datetime.now()
                existing.is_verified = bool(item.get("is_verified", True))
                existing.freshness_status = "CURRENT"
                updated += 1
            else:
                new_rate = InvestmentRate(
                    institution=item["institution"],
                    product_name=item["product_name"],
                    tenure=item.get("tenure"),
                    customer_category=item.get("customer_category", "Regular"),
                    rate_value=rate_val,
                    rate_classification=item.get("rate_classification", "CURRENT_RATE"),
                    source_url=item.get("source_url"),
                    retrieved_at=datetime.now(),
                    is_verified=bool(item.get("is_verified", True)),
                    freshness_status="CURRENT"
                )
                db.add(new_rate)
                updated += 1

        except DataValidationError as ve:
            rejected += 1
            errors.append(f"Validation error for product {item.get('product_name')}: {ve}")
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
