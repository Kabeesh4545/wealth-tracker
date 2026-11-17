from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.local_cost import LocalCost
from app.schemas.local_cost import LocalCostResponse, CostEstimate, LocalCostSummaryResponse, CategorySummary
from typing import List, Optional

def get_cities(db: Session) -> List[str]:
    # Query unique cities in the database
    cities = db.query(LocalCost.city).distinct().order_by(LocalCost.city).all()
    return [c[0] for c in cities]

def estimate_cost(
    db: Session,
    city: str,
    category: str,
    household_size: int,
    housing_type: Optional[str] = None,
    subcategory: Optional[str] = None
) -> LocalCostResponse:
    # 1. Validate that the city actually exists in our costs table
    city_exists = db.query(LocalCost.id).filter(LocalCost.city.ilike(city)).first()
    if not city_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Local cost data is not available for this city: '{city}'."
        )

    # 2. Query candidates
    query = db.query(LocalCost).filter(
        LocalCost.city.ilike(city),
        LocalCost.category.ilike(category)
    )

    if subcategory:
        query = query.filter(LocalCost.subcategory.ilike(subcategory))

    # Match household size
    query = query.filter(
        LocalCost.household_size_min <= household_size,
        LocalCost.household_size_max >= household_size
    )

    candidates = query.all()
    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local cost data is not available for this city and category combination."
        )

    # 3. Filter housing rent BHK size specifically if category is Housing
    filtered_candidates = []
    for cand in candidates:
        if cand.category.lower() == "housing" and cand.subcategory.lower() == "rent":
            # If the user specified a BHK size, filter exactly
            if housing_type:
                if cand.housing_type and cand.housing_type.lower() == housing_type.lower():
                    filtered_candidates.append(cand)
            else:
                # Dynamically choose standard housing BHK sizes based on family size
                if household_size == 1:
                    expected_bhk = "1 BHK"
                elif household_size in [2, 3]:
                    expected_bhk = "2 BHK"
                else:
                    expected_bhk = "3 BHK"
                
                if cand.housing_type and cand.housing_type.lower() == expected_bhk.lower():
                    filtered_candidates.append(cand)
        else:
            filtered_candidates.append(cand)

    if not filtered_candidates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local cost data is not available for this housing configuration."
        )

    # 4. Sum up cost estimates for matching subcategories (e.g. Rent + Maintenance under Housing)
    total_min = 0.0
    total_typical = 0.0
    total_max = 0.0
    
    # Take metadata from first item
    ref_item = filtered_candidates[0]
    confidence_levels = [item.data_confidence.lower() for item in filtered_candidates]

    # Resolve confidence: lowest confidence in matching subcategories determines overall confidence
    if "low" in confidence_levels:
        final_confidence = "low"
    elif "medium" in confidence_levels:
        final_confidence = "medium"
    else:
        final_confidence = "high"

    for item in filtered_candidates:
        total_min += item.min_cost
        total_typical += item.typical_cost
        total_max += item.max_cost

    return LocalCostResponse(
        city=ref_item.city,
        household_size=household_size,
        category=category,
        subcategory=subcategory if subcategory else None,
        estimate=CostEstimate(min=total_min, typical=total_typical, max=total_max),
        currency=ref_item.currency,
        unit=ref_item.unit,
        source=ref_item.source,
        reference_month=ref_item.reference_month,
        last_updated=ref_item.last_updated,
        data_confidence=final_confidence
    )

def get_summary(
    db: Session,
    city: str,
    household_size: int,
    housing_type: Optional[str] = None
) -> LocalCostSummaryResponse:
    # Get distinct categories for the city
    city_exists = db.query(LocalCost.id).filter(LocalCost.city.ilike(city)).first()
    if not city_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Local cost data is not available for this city: '{city}'."
        )

    categories = db.query(LocalCost.category).filter(
        LocalCost.city.ilike(city)
    ).distinct().all()

    cat_summaries = []
    resolved_housing_type = housing_type

    # Determine default BHK for summary mapping
    if not resolved_housing_type:
        if household_size == 1:
            resolved_housing_type = "1 BHK"
        elif household_size in [2, 3]:
            resolved_housing_type = "2 BHK"
        else:
            resolved_housing_type = "3 BHK"

    for (cat_name,) in categories:
        try:
            est = estimate_cost(
                db=db,
                city=city,
                category=cat_name,
                household_size=household_size,
                housing_type=resolved_housing_type
            )
            cat_summaries.append(
                CategorySummary(
                    category=cat_name,
                    estimate=est.estimate,
                    currency=est.currency,
                    unit=est.unit,
                    data_confidence=est.data_confidence
                )
            )
        except HTTPException as e:
            # Skip if specific category lookup fails constraints
            if e.status_code == status.HTTP_404_NOT_FOUND:
                continue
            raise e

    return LocalCostSummaryResponse(
        city=city,
        household_size=household_size,
        housing_type=resolved_housing_type,
        categories=cat_summaries
    )
