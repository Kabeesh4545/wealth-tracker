# API Endpoints Reference Dictionary

This document details the HTTP routes, request models, response models, and authentication requirements for the Money Management Application.

---

## 1. Interactive Swagger Docs
FastAPI automatically compiles schema definitions into interactive documentation pages:
- **Swagger UI**: `/docs` (Allows testing endpoints directly via browser)
- **ReDoc UI**: `/redoc` (Alternative structured API layout)

---

## 2. Authentication Router (`/api/auth`)

### Register User
- **Method / Path**: `POST /api/auth/register`
- **Auth Required**: No
- **Request Body**: `full_name` (string), `email` (string), `password` (string).
- **Response**: `id` (int), `email` (string), `full_name` (string), `is_active` (bool).
- **Status Codes**: `201 Created` (Success), `400 Bad Request` (Email already registered).

### Log In / Token Exchange
- **Method / Path**: `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**: Form URL-encoded containing `username` (email) and `password`.
- **Response**: JWT token package: `access_token` (string), `token_type` ("bearer").
- **Status Codes**: `200 OK` (Success), `401 Unauthorized` (Invalid credentials).

---

## 3. Financial Onboarding & Profiles (`/api/profile`)

### Create / Update Profile
- **Method / Path**: `POST /api/profile` (Create) / `PUT /api/profile` (Update)
- **Auth Required**: Yes (Bearer JWT token)
- **Request Body**:
  - `age` (int: 15–100)
  - `city` (string)
  - `employment_type` (string: "Employee", "Self-Employed", "Student", "Retired")
  - `family_members` (int)
  - `dependents` (int)
  - `monthly_salary` (float)
  - `housing_type` (string: "Rent", "Own House", "Living With Family", "Other")
  - `rent_amount` (float, optional)
- **Response**: Full validated profile object.
- **Status Codes**: `201 Created`/`200 OK`, `422 Unprocessable Entity` (Age boundary errors, dependents > family members).

---

## 4. Local Cost Queries (`/api/local-costs`)

### Supported Cities
- **Method / Path**: `GET /api/local-costs/cities`
- **Auth Required**: Yes
- **Response**: Array of unique city strings (e.g., `["Chennai", "Coimbatore", "Bengaluru"]`).

### Estimated Cost Summary
- **Method / Path**: `GET /api/local-costs/summary`
- **Auth Required**: Yes
- **Query Params**: `city` (string, required), `household_size` (int, required), `housing_type` (string, optional).
- **Response**: Categorized cost metrics (`housing`, `food`, `utilities`, `transportation`), each specifying `min`, `typical`, and `max` values.
- **Status Codes**: `200 OK`, `404 Not Found` (City not indexed).

---

## 5. Planning & Suitability Allocations (`/api/planning` & `/api/investments`)

### Monthly Budget Plan
- **Method / Path**: `GET /api/planning/monthly-plan`
- **Auth Required**: Yes
- **Response**: Calculated budget allocations: `essential_budget`, `lifestyle_budget`, `debt_emi_payments`, `emergency_reserve_contribution`, `goal_savings_contribution`, `surplus_investment_capacity`, `buffer`.
- **Status Codes**: `200 OK` (Calculations sum to the user's planning income).

### Suitability Asset Split
- **Method / Path**: `GET /api/planning/investment-allocation`
- **Auth Required**: Yes
- **Response**: Allocation percentages and amounts: `capital_preservation_pct`, `stable_pct`, `growth_pct`, `capital_preservation_amount`, `stable_amount`, `growth_amount`.
- **Status Codes**: `200 OK` (Total amounts sum to `surplus_investment_capacity` exactly).

### Exact Monthly Operating Budget (Step 16)
- **Method / Path**: `GET /api/planning/monthly-budget`
- **Auth Required**: Yes
- **Query Params**: `month` (string, optional, format `YYYY-MM`).
- **Response**: Reconciled envelope limits for 19 categories, Safe-to-Spend limits (monthly/weekly/daily), priority action lists, active warnings.
- **Status Codes**: `200 OK` (Calculations reconciled via high-precision Decimal).

### Investment Recommendations Matching (Step 16)
- **Method / Path**: `GET /api/investments/recommendations`
- **Auth Required**: Yes
- **Response**: Suitability scores out of 100 for 12 asset classes, best matching option, matched allocation targets based on Step 6.
- **Status Codes**: `200 OK`.

---

## 6. Goal Tracker (`/api/goals`)

### Add Goal
- **Method / Path**: `POST /api/goals`
- **Auth Required**: Yes
- **Request Body**: `goal_name` (string), `target_amount` (float), `current_amount` (float), `target_date` (string `YYYY-MM-DD`).
- **Response**: Created goal object with generated ID and status indicator (`"On Track"` or `"Behind"`).

### Add Goal Contribution
- **Method / Path**: `POST /api/goals/{goal_id}/contributions`
- **Auth Required**: Yes
- **Request Body**: `amount` (float), `contribution_date` (string `YYYY-MM-DD`).
- **Response**: Updated balance and progress indicators.
- **Status Codes**: `200 OK`, `404 Not Found` (Goal ID mismatch).

---

## 7. What-If Simulator (`/api/simulator`)

### Simulate Financial Scenario
- **Method / Path**: `POST /api/simulator/what-if`
- **Auth Required**: Yes
- **Request Body**:
  - `scenario_type` (string: "salary_change", "new_loan", "expense_change")
  - `scenario_data` (object: e.g. `{"new_salary": 90000.0}`)
- **Response**: In-memory comparison report comparing baseline calculations to the hypothetical scenario, outlining surplus changes, debt-to-income adjustments, and budget updates.
- **Status Codes**: `200 OK` (No database writes are executed).

---

## 8. AI Conversational Assistant (`/api/assistant`)

### Chat Completion
- **Method / Path**: `POST /api/assistant/chat`
- **Auth Required**: Yes
- **Request Body**: `message` (string)
- **Response**: `answer` (string explanation), `disclaimer` (static educational notice).
- **Status Codes**: `200 OK`, `422 Unprocessable Entity` (Prompt injection blocked, query length validation errors).
