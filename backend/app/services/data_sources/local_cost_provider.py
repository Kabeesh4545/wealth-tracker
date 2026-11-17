from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.local_cost import LocalCost
from app.services.data_sources.base import BaseDataProvider
from app.services.data_sources.provenance import (
    DataProvenanceSchema,
    DATA_TYPE_BENCHMARK,
    DATA_TYPE_UNAVAILABLE,
    FRESHNESS_UNAVAILABLE
)
from app.services.data_sources.freshness import evaluate_freshness
from app.services.data_sources.validators import validate_benchmark_payload

class LocalCostProvider(BaseDataProvider):
    def __init__(self):
        super().__init__(
            source_key="numbeo_cost_of_living",
            name="Numbeo City Living Cost Index",
            category="local_cost"
        )

    def fetch_data(
        self,
        db: Session,
        city: str,
        category: str,
        household_size: int = 1,
        housing_type: Optional[str] = None,
        subcategory: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Queries local living cost benchmark for a specific city.
        STRICT ISOLATION RULE: If data for the specific city is unavailable,
        DO NOT fall back to another city (e.g. Coimbatore or Chennai for Bengaluru).
        Returns status 'UNAVAILABLE' if missing.
        """
        if not city or not city.strip():
            return {
                "status": "UNAVAILABLE",
                "message": "City parameter is missing.",
                "provenance": None,
                "data": None
            }

        # Query exact city match (case-insensitive)
        query = db.query(LocalCost).filter(
            LocalCost.city.ilike(city.strip()),
            LocalCost.category.ilike(category.strip())
        )

        if subcategory:
            query = query.filter(LocalCost.subcategory.ilike(subcategory.strip()))

        query = query.filter(
            LocalCost.household_size_min <= household_size,
            LocalCost.household_size_max >= household_size
        )

        candidates = query.all()

        # Filtering housing BHK size if applicable
        if category.lower() == "housing" and candidates:
            expected_bhk = housing_type or ("1 BHK" if household_size == 1 else ("2 BHK" if household_size in [2, 3] else "3 BHK"))
            filtered = [c for c in candidates if c.housing_type and c.housing_type.lower() == expected_bhk.lower()]
            if filtered:
                candidates = filtered

        if not candidates:
            # STRICT ISOLATION: DO NOT FALL BACK TO OTHER CITIES!
            return {
                "status": "UNAVAILABLE",
                "message": f"Local benchmark unavailable for city '{city}' and category '{category}'.",
                "provenance": DataProvenanceSchema(
                    value=None,
                    city=city,
                    category=category,
                    subcategory=subcategory,
                    data_type=DATA_TYPE_UNAVAILABLE,
                    source=self.name,
                    confidence="UNAVAILABLE",
                    is_verified=False,
                    freshness_status=FRESHNESS_UNAVAILABLE
                ),
                "data": None
            }

        # Aggregate total min/typical/max for matching subcategories
        total_min = sum(c.min_cost for c in candidates)
        total_typical = sum(c.typical_cost for c in candidates)
        total_max = sum(c.max_cost for c in candidates)

        ref_item = candidates[0]
        freshness = evaluate_freshness(ref_item.reference_month, ref_item.retrieved_at)

        payload_data = {
            "city": ref_item.city,
            "state": ref_item.state,
            "country": ref_item.country,
            "category": ref_item.category,
            "subcategory": subcategory or ref_item.subcategory,
            "min_cost": total_min,
            "typical_cost": total_typical,
            "max_cost": total_max,
            "currency": ref_item.currency,
            "source": ref_item.source,
            "source_url": ref_item.source_url,
            "reference_month": ref_item.reference_month,
            "retrieved_at": ref_item.retrieved_at.isoformat() if ref_item.retrieved_at else None,
            "confidence": ref_item.data_confidence.upper(),
            "data_type": ref_item.data_type or DATA_TYPE_BENCHMARK,
            "is_verified": ref_item.is_verified,
            "freshness_status": freshness
        }

        provenance = self.get_provenance(payload_data)

        return {
            "status": "SUCCESS",
            "message": f"Local benchmark matched for city '{ref_item.city}'.",
            "provenance": provenance,
            "data": payload_data
        }

    def validate_data(self, payload: Dict[str, Any]) -> bool:
        try:
            validate_benchmark_payload(payload)
            return True
        except Exception:
            return False

    def get_provenance(self, payload: Dict[str, Any]) -> DataProvenanceSchema:
        return DataProvenanceSchema(
            id=None,
            value=payload.get("typical_cost"),
            currency=payload.get("currency", "INR"),
            city=payload.get("city"),
            state=payload.get("state"),
            country=payload.get("country"),
            category=payload.get("category"),
            subcategory=payload.get("subcategory"),
            data_type=payload.get("data_type", DATA_TYPE_BENCHMARK),
            source=payload.get("source", self.name),
            source_url=payload.get("source_url"),
            reference_month=payload.get("reference_month"),
            retrieved_at=payload.get("retrieved_at"),
            confidence=payload.get("confidence", "MEDIUM"),
            is_verified=payload.get("is_verified", True),
            freshness_status=payload.get("freshness_status", "RECENT")
        )
