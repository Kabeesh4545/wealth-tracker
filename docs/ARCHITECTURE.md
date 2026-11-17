# System Architecture & Technical Specifications

This document describes the structural components, data flows, and relational schemas of the Personalized Money Management Application.

---

## 1. System Structure

The application is built on a decoupled, three-tier architecture:

```
┌──────────────────────────────────────────────┐
│                Presentation                  │
│       React 19 Frontend Web Application      │
└──────────────────────┬───────────────────────┘
                       │ HTTPS / JSON REST API
                       ▼
┌──────────────────────────────────────────────┐
│                 Service API                  │
│             FastAPI Backend App              │
└───────┬──────────────────────────────┬───────┘
        │                              │
        ▼ [SQLAlchemy ORM]             ▼ [RESTful HTTPS Client]
┌──────────────────────────────┐ ┌─────────────────────────────┐
│          Persistence         │ │          AI Model           │
│      PostgreSQL Database     │ │         OpenAI API          │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Core Functional Data Flows

### A. Financial Onboarding Workflow
1. User submits the onboarding form containing age, location, employment type, housing details, income components, active loans, and planned expenses.
2. The React client validates input bounds before sending a request to the server.
3. The FastAPI router validates schemas via Pydantic models.
4. The router inserts records into the database, associating them with the user's ID to enforce ownership.
5. The backend recalculates the user's monthly plan and investment suitability, storing results in memory to serve the dashboard.

### B. Simulator Stateless Execution Path
1. The user inputs scenario overrides (e.g. modifying salary or adding a loan) in the simulator UI.
2. The client transmits the overrides to `POST /api/simulator/what-if` with a JWT auth header.
3. The backend fetches the user's actual baseline data from database tables (`financial_profiles`, `savings`, `loans`, etc.).
4. The backend merges the baseline data with the scenario overrides in-memory.
5. The backend runs the Step 5 (budgeting) and Step 6 (investment allocation) calculation modules on the merged state.
6. The backend computes the difference (deltas) between the baseline and simulated results.
7. The server returns the delta results to the client, **without writing any records to the database** (preserving baseline database state).

### C. AI Request & Context Isolation Path
1. The user enters a question in the AI Chat box.
2. The client transmits the query to `POST /api/assistant/chat` with JWT authentication.
3. The server retrieves the user's actual baseline profile and calculation summaries.
4. The assistant service checks the user's message against prompt injection regex patterns (rejecting keywords like `system prompt`, `ignore previous instructions`).
5. The server builds a secure prompt enclosing the user's actual calculated financial values, formatted in Indian Rupee (`₹`) notation.
6. The server posts the prompt to the OpenAI completions endpoint.
7. The server receives the response, appends a standard read-only financial disclaimer, and returns the response to the client.

---

## 3. Database Schema Design

The following relational mapping shows table structures and foreign key references:

```
                  ┌──────────────┐
                  │    users     │
                  └──────┬───────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
       1:1              1:1              1:1              1:1
        ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  financial_  │ │   savings    │ │ investment_  │ │  investment_ │
│   profiles   │ └──────────────┘ │   profiles   │ │  allocations │
└──────┬───────┘                  └──────────────┘ └──────────────┘
       │
      1:N
       ├────────────────┬────────────────┐
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    loans     │ │   expenses   │ │  financial_  │
└──────────────┘ └──────────────┘ │    goals     │
                                  └──────┬───────┘
                                        1:N
                                         ▼
                                  ┌──────────────┐
                                  │    goal_     │
                                  │contributions │
                                  └──────────────┘
```

- **Cascade Deletions**: Deleting a user account triggers a cascading delete across all associated tables, removing all user data from the database.
- **Precision**: All financial fields use PostgreSQL `Numeric(12, 2)` or SQLAlchemy `Numeric(precision=12, scale=2)` to prevent floating-point rounding errors.

---

## 4. Step 16 Budget & Investment Recommendations Engines

### A. Monthly Spending Limits Engine
1. **Mathematical Invariant**: Ensures that `planning_income == mandatory_expenses + safe_to_spend_monthly + emergency_fund_contrib + goal_contrib + investment_capacity + flexible_buffer`.
2. **Deficit Handling**: If discretionary cash flow is negative, discretionary category limits and Safe-to-Spend limits are clamped to `0.00` with high-priority warnings generated in the payload.

### B. Investment Suitability Engine
1. **Static vs. Personal Information**: Separates static educational product profiles (benefits, risks, lock-ins, tax structure) from dynamic user-profile suitability scoring.
2. **Authoritative Alignment**: Ranks products by scoring them out of 100 based on risk tolerance, timeline, and emergency funding status, then matches target amounts directly using Step 6 allocation tier capacities (Growth, Stable, Capital Preservation).
