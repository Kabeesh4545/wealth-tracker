from typing import Dict, Any, List, Optional
from decimal import Decimal

class DataValidationError(Exception):
    pass

def validate_benchmark_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates benchmark payloads before persisting or using in planning.
    Ensures non-fabrication: bounds must be non-negative and min <= typical <= max.
    """
    if "typical_cost" not in data or data["typical_cost"] is None:
        raise DataValidationError("Typical cost value is missing.")

    min_cost = float(data.get("min_cost", 0.0) or 0.0)
    typical_cost = float(data.get("typical_cost", 0.0) or 0.0)
    max_cost = float(data.get("max_cost", 0.0) or 0.0)

    if min_cost < 0 or typical_cost < 0 or max_cost < 0:
        raise DataValidationError("Cost values must be non-negative.")

    if min_cost > typical_cost or typical_cost > max_cost:
        raise DataValidationError("Invalid cost ordering: min <= typical <= max is required.")

    city = data.get("city", "")
    if not city or not city.strip():
        raise DataValidationError("City name must be specified.")

    return data

def validate_rate_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates rate payloads (e.g. PPF, FD rates).
    Rates must be between 0.0 and 1.0 (e.g. 0.071 for 7.1%).
    """
    if "rate_value" not in data or data["rate_value"] is None:
        raise DataValidationError("Rate value is missing.")

    rate = float(data["rate_value"])
    if rate < 0.0 or rate > 1.0:
        raise DataValidationError("Rate value must be between 0.0 and 1.0.")

    if not data.get("institution") or not data.get("product_name"):
        raise DataValidationError("Institution and product_name are required.")

    return data
