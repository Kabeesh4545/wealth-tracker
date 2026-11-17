# Antigravity Money - FastAPI Backend

This is the production-quality backend server for the Personalized Money Management Application, built with FastAPI, SQLAlchemy 2.x, Alembic, and PostgreSQL.

## Requirements

* Python 3.10+
* PostgreSQL database server
* pip (Python package installer)

## PostgreSQL Database Setup

1. Connect to your PostgreSQL instance (e.g., using pgAdmin or psql command line tool):
   ```sql
   CREATE DATABASE money_management;
   ```

2. Confirm PostgreSQL is running on your localhost (port `5432`).

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` with your PostgreSQL username, password, and port if they differ from the defaults:
   ```env
   DATABASE_URL=postgresql+psycopg://YOUR_POSTGRES_USER:YOUR_POSTGRES_PASSWORD@localhost:5432/money_management
   SECRET_KEY=generate_a_long_random_hex_string_using_openssl_or_similar
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   CORS_ORIGINS=http://localhost:5173
   ```

## Installation

Install all required packages via pip:
```bash
pip install -r requirements.txt
```

## Database Migrations

Apply Alembic migrations to construct the database schema:
```bash
alembic upgrade head
```

## Running the Application

Start the development server using uvicorn:
```bash
uvicorn app.main:app --reload
```

The API server will run on `http://localhost:8000`.

## Swagger API Documentation

Once the server is running, open the interactive Swagger UI to explore and test the endpoints:
* **Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Database Structure & Schema Design

```
   ┌─────────────────────────────────────────────────────────┐
   │                          User                           │
   └──────────────────────────┬──────────────────────────────┘
         ┌────────────────────┼───────────────────┐
        1:1                  1:1                 1:1
         ▼                    ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│ FinancialProfile │ │     Savings     │ │InvestmentProfile │
└──────────────────┘ └─────────────────┘ └──────────────────┘
         │
         ├────────────────────┬───────────────────┐
        1:N                  1:N                 1:N
         ▼                    ▼                   ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│      Loans       │ │    Expenses     │ │   Investments    │
└──────────────────┘ └─────────────────┘ └──────────────────┘
         │
        1:N
         ▼
┌──────────────────┐
│  FinancialGoals  │
└──────────────────┘
```

The database models are designed to fully support the frontend state data structure collected in Step 1:

1. **`users`**: Manages basic user credentials.
   * `id` (PK, Integer)
   * `full_name` (String)
   * `email` (String, unique, index)
   * `password_hash` (String)
   * `is_active` (Boolean)
   * Timestamps (`created_at`, `updated_at`)

2. **`financial_profiles`** (1:1 with User): Holds age, employment type, city, dependents, and income figures.
   * `id` (PK, Integer)
   * `user_id` (FK, unique, cascades)
   * `age` (15-100), `city`, `employment_type`
   * `family_members`, `dependents` (must be <= family members)
   * `monthly_salary`, `other_income`, `variable_income`
   * Housing type ('Rent', 'Own House', 'Living With Family', 'Other') and conditional fields (rent amount, maintenance, home loan emi, contribution).

3. **`savings`** (1:1 with User): Stores liquid assets.
   * `id` (PK, Integer)
   * `user_id` (FK, unique, cascades)
   * `bank_savings`, `emergency_fund`

4. **`investment_profiles`** (1:1 with User): Captures risk levels and time horizons.
   * `id` (PK, Integer)
   * `user_id` (FK, unique, cascades)
   * `experience`, `time_horizon`, `risk_tolerance`, `primary_preference`

5. **`loans`** (1:N with User): Stores outstanding debt objects.
   * `id` (PK, Integer)
   * `user_id` (FK, cascades)
   * `loan_type`, `outstanding_amount`, `monthly_emi`, `interest_rate`, `remaining_tenure_months`

6. **`expenses`** (1:N with User): Stores individual monthly categories.
   * `id` (PK, Integer)
   * `user_id` (FK, cascades)
   * `category` (e.g. foodGroceries, transportation), `expense_type` ('essential' | 'lifestyle'), `monthly_amount`

7. **`investments`** (1:N with User): Stores asset holdings.
   * `id` (PK, Integer)
   * `user_id` (FK, cascades)
   * `investment_type`, `amount`

8. **`financial_goals`** (1:N with User): Captures timeline savings goals.
   * `id` (PK, Integer)
   * `user_id` (FK, cascades)
   * `goal_name`, `target_amount`, `current_amount` (<= target), `target_date`

9. **`local_costs`**: Holds regional cost-of-living estimated ranges.
   * `id` (PK, Integer)
   * `city`, `state`, `country` (String)
   * `category` (Housing, Food, etc.), `subcategory` (Rent, Maintenance, etc.)
   * `min_cost`, `typical_cost`, `max_cost` (Float)
   * `currency` (String), `unit` (String)
   * `household_size_min`, `household_size_max` (Integer)
   * `housing_type` (String, nullable, e.g. '1 BHK', '2 BHK')
   * `source`, `source_url` (String)
   * `reference_month` (String `YYYY-MM`), `last_updated` (String), `data_confidence` (String)

---

# Local Cost Data Methodology

This database stores parameterized cost-of-living estimates. Because actual market prices fluctuate continuously, these estimates are designed to establish sensible reference guidelines rather than guarantee transaction pricing.

### 1. Data Retrieval and Sources
* **City-Level Averages:** Absolute cost figures for cities like Chennai, Coimbatore, Bengaluru, Hyderabad, Mumbai, Delhi, and Pune are retrieved from city-level cost data aggregates (e.g. Numbeo). These details provide absolute baselines for rent, food, and basic services.
* **Derived Estimates:** If direct city-specific data is unavailable for Tier-3 cities (like Salem, Erode, Tiruppur), estimates are derived by scaling baseline figures from neighboring Tier-2 hubs (e.g., Coimbatore) using district-level listings. These records are marked with `source = "Derived estimate"`.

### 2. Price Trends & Official Statistics (MoSPI / CPI)
Official statistics from the Ministry of Statistics and Programme Implementation (MoSPI) and CPI (Consumer Price Index) reports for India are used to:
1. Validate trends across categories.
2. Confirm the alignment of relative price differences between Tier-1 metro regions and Tier-2/3 municipalities.
3. Establish inflation coefficients to normalize historical data inputs.

### 3. Cost Ranges & Reference Periods
Each cost item comprises a range:
* **Minimum Cost:** Typically reflects frugal, single-member consumption patterns or baseline cost choices.
* **Typical Cost:** Standard median cost experienced by a middle-class household.
* **Maximum Cost:** Represents high-usage, premium, or high-market inflation choices.

Reference period differences are documented:
* `reference_month` (e.g. `2026-08`) specifies the exact period of the source data or baseline collection.
* `last_updated` represents the timestamp when the record was written or updated in this database instance.

### 4. Data Confidence Indicators
Every record is rated with a `data_confidence` value:
* **`high`:** Directly sourced from official tariffs (e.g. state electricity board tariff cards) or official municipal listings.
* **`medium`:** Sourced from multiple verified datasets and supported by city-level index benchmarks.
* **`low`:** Sourced from limited samples or calculated entirely via interpolation/districting adjustments.

### 5. Household Size & Category Scaling
* **Housing (Rent & Maintenance):** Scales primarily by `housing_type` (e.g. `1 BHK`, `2 BHK`, `3 BHK`) and the city's housing market index, rather than household size alone.
* **Food & Groceries:** Strongly correlated with household size. Records are segmented by household ranges (`1`, `2`, `3-4`, `5+`).
* **Utilities (Internet, Electricity):** Internet is mapped as a single household connection (1-99), whereas Electricity scales with household size to reflect increased utility loads.

### 6. Limitations & Disclaimer
* Estimated prices vary by local neighborhood (e.g. suburban vs. central business district).
* Personal lifestyle choices, household consumption preferences, and short-term commodity price spikes heavily alter real monthly costs.
* Values are estimates and do not constitute guaranteed market rates.

