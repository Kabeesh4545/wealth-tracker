import os
import sys
import csv
import re
from datetime import datetime

# Adjust Python path to load backend app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models.local_cost import LocalCost

REFERENCE_MONTH_REGEX = re.compile(r"^\d{4}-\d{2}$")

def validate_row(row, line_num):
    errors = []

    # Required fields
    required = ['city', 'state', 'country', 'category', 'subcategory', 'min_cost', 'typical_cost', 'max_cost', 
                'currency', 'household_size_min', 'household_size_max', 'source', 'reference_month', 'last_updated', 'data_confidence']
    
    for field in required:
        if not row.get(field) or row[field].strip() == "":
            errors.append(f"Missing required field: '{field}'")

    if errors:
        return errors

    # Check numeric bounds
    try:
        min_cost = float(row['min_cost'])
        typical_cost = float(row['typical_cost'])
        max_cost = float(row['max_cost'])
        
        if min_cost < 0:
            errors.append("min_cost must be >= 0")
        if typical_cost < min_cost:
            errors.append("typical_cost must be >= min_cost")
        if max_cost < typical_cost:
            errors.append("max_cost must be >= typical_cost")
    except ValueError:
        errors.append("Costs must be valid numbers")

    # Check household size ranges
    try:
        h_min = int(row['household_size_min'])
        h_max = int(row['household_size_max'])
        
        if h_min <= 0:
            errors.append("household_size_min must be > 0")
        if h_max < h_min:
            errors.append("household_size_max must be >= household_size_min")
    except ValueError:
        errors.append("Household sizes must be valid integers")

    # Check format and allowed values
    if not REFERENCE_MONTH_REGEX.match(row['reference_month'].strip()):
        errors.append("reference_month must follow YYYY-MM format")
        
    confidence = row['data_confidence'].strip().lower()
    if confidence not in ['high', 'medium', 'low']:
        errors.append("data_confidence must be 'high', 'medium', or 'low'")

    return errors

from app.models.data_source import DataSource

# Initial Provider Configurations (Metadata ONLY — NO hardcoded production financial rates)
INITIAL_DATA_SOURCES = [
    {
        "source_key": "numbeo_cost_of_living",
        "name": "Numbeo City Living Cost Index",
        "category": "local_cost",
        "source_type": "API",
        "source_url": "https://www.numbeo.com/api/",
        "refresh_frequency_hours": 24,
        "is_active": True
    },
    {
        "source_key": "mospi_cpi_inflation",
        "name": "MoSPI Consumer Price Index (India)",
        "category": "economic",
        "source_type": "GOVT_FEED",
        "source_url": "https://mospi.gov.in/",
        "refresh_frequency_hours": 168,
        "is_active": True
    },
    {
        "source_key": "rbi_economic_indicators",
        "name": "Reserve Bank of India Macroeconomic Indicators",
        "category": "economic",
        "source_type": "GOVT_FEED",
        "source_url": "https://www.rbi.org.in/",
        "refresh_frequency_hours": 24,
        "is_active": True
    },
    {
        "source_key": "india_post_savings",
        "name": "India Post Small Savings Schemes",
        "category": "investment",
        "source_type": "GOVT_FEED",
        "source_url": "https://www.indiapost.gov.in/",
        "refresh_frequency_hours": 720,
        "is_active": True
    },
    {
        "source_key": "sbi_interest_rates",
        "name": "State Bank of India Fixed Deposit Interest Rates",
        "category": "investment",
        "source_type": "SCRAPER",
        "source_url": "https://sbi.co.in/web/interest-rates/",
        "refresh_frequency_hours": 168,
        "is_active": True
    }
]

def seed_database():
    csv_path = os.path.join(os.path.dirname(__file__), 'local_costs.csv')
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    print("Starting database seeding...")
    db = SessionLocal()

    try:
        # Seed Provider Metadata Configurations
        print("Seeding Data Sources Provider configurations...")
        for ds_cfg in INITIAL_DATA_SOURCES:
            existing_ds = db.query(DataSource).filter(DataSource.source_key == ds_cfg["source_key"]).first()
            if not existing_ds:
                db.add(DataSource(**ds_cfg))
        db.commit()

        processed_count = 0
        inserted_count = 0
        updated_count = 0
        rejected_count = 0

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader, start=2):
                processed_count += 1
                row_errors = validate_row(row, idx)

                if row_errors:
                    print(f"Row {idx} rejected due to errors: {', '.join(row_errors)}")
                    rejected_count += 1
                    continue

                # Parse cleaned fields
                city = row['city'].strip()
                state = row['state'].strip()
                country = row['country'].strip()
                category = row['category'].strip()
                subcategory = row['subcategory'].strip()
                min_cost = float(row['min_cost'])
                typical_cost = float(row['typical_cost'])
                max_cost = float(row['max_cost'])
                currency = row['currency'].strip()
                unit = row['unit'].strip() or 'monthly'
                h_min = int(row['household_size_min'])
                h_max = int(row['household_size_max'])
                housing_type = row['housing_type'].strip() if row.get('housing_type') and row['housing_type'].strip() != "" else None
                source = row['source'].strip()
                source_url = row['source_url'].strip() if row.get('source_url') and row['source_url'].strip() != "" else None
                ref_month = row['reference_month'].strip()
                last_updated = row['last_updated'].strip()
                confidence = row['data_confidence'].strip().lower()

                # Search if record already exists based on UNIQUE constraint elements
                existing = db.query(LocalCost).filter(
                    LocalCost.city == city,
                    LocalCost.category == category,
                    LocalCost.subcategory == subcategory,
                    LocalCost.household_size_min == h_min,
                    LocalCost.household_size_max == h_max,
                    LocalCost.housing_type == housing_type
                ).first()

                if existing:
                    changed = False
                    if (existing.min_cost != min_cost or
                        existing.typical_cost != typical_cost or
                        existing.max_cost != max_cost or
                        existing.currency != currency or
                        existing.unit != unit or
                        existing.source != source or
                        existing.source_url != source_url or
                        existing.reference_month != ref_month or
                        existing.data_confidence != confidence):
                        
                        existing.min_cost = min_cost
                        existing.typical_cost = typical_cost
                        existing.max_cost = max_cost
                        existing.currency = currency
                        existing.unit = unit
                        existing.source = source
                        existing.source_url = source_url
                        existing.reference_month = ref_month
                        existing.last_updated = last_updated
                        existing.data_confidence = confidence
                        existing.data_type = "BENCHMARK"
                        existing.is_verified = True
                        existing.freshness_status = "RECENT"
                        changed = True

                    if changed:
                        updated_count += 1
                else:
                    new_cost = LocalCost(
                        city=city,
                        state=state,
                        country=country,
                        category=category,
                        subcategory=subcategory,
                        min_cost=min_cost,
                        typical_cost=typical_cost,
                        max_cost=max_cost,
                        currency=currency,
                        unit=unit,
                        household_size_min=h_min,
                        household_size_max=h_max,
                        housing_type=housing_type,
                        source=source,
                        source_url=source_url,
                        reference_month=ref_month,
                        last_updated=last_updated,
                        data_confidence=confidence,
                        data_type="BENCHMARK",
                        is_verified=True,
                        freshness_status="RECENT"
                    )
                    db.add(new_cost)
                    inserted_count += 1

            db.commit()

        print("\nSeeding Execution completed.")
        print(f"Records processed: {processed_count}")
        print(f"Inserted:          {inserted_count}")
        print(f"Updated:           {updated_count}")
        print(f"Rejected:          {rejected_count}")

        if rejected_count > 0:
            print("Warning: Some records were rejected. Check output logs above.")
            sys.exit(1)

    except Exception as e:
        db.rollback()
        print(f"Error during seeding execution: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
