# Project Presentation Slide Outline
## AI-Powered Personalized Money Management Application

This document outlines an 18-slide structure for the project presentation and defense.

---

### Slide 1: Title Slide
- **Title**: AI-Powered Personalized Money Management Application
- **Subtitle**: A Unified Framework for Budgeting, Investment Suitability, Stateless Simulations, and Explanatory conversational AI
- **Details**: Student Name, College, Roll Number, Guide Name

### Slide 2: Problem Statement
- **Fragmented Tools**: Users manage salary, debts, expenses, and investment goals in isolation.
- **Generic Rules**: The 50/30/20 rule does not scale for varying debt-to-income loads or household sizes.
- **Context Gap**: Existing solutions ignore regional cost-of-living differences.
- **Advice Hallucinations**: Standard AI bots often hallucinate financial figures.

### Slide 3: Motivation
- **Financial Literacy**: Providing clear, math-driven budgeting guidance.
- **High-Precision Calculations**: Eliminating binary floating-point representation errors in money math.
- **Privacy & Security**: Preventing third-party aggregators from scraping personal banking credentials.

### Slide 4: Objectives
- Centralize user financial variables via structured onboarding.
- Build a deterministic monthly budgeting engine.
- Establish an asset allocator matching horizon and risk preferences.
- Implement an in-memory, write-protected What-If simulator.
- Provide secure conversational explanations of calculation results.
- Implement security controls to protect against injections and unauthorized access.

### Slide 5: Proposed Solution
- **Decoupled System**: A React 19 web app communicating with a FastAPI backend server.
- **Seeded Regional Cost Database**: Compares living expenses to local averages.
- **Stateless Sandbox**: Evaluates financial scenarios without mutating user data.
- **Explanatory AI Layer**: OpenAI API integrated safely via system prompt restrictions.

### Slide 6: System Architecture
- **Web App Interface**: React 19 with Tailwind CSS.
- **API Core**: FastAPI using Uvicorn/Gunicorn.
- **Database Engine**: PostgreSQL for persistence.
- **Explanatory Channel**: Safe background API proxy to OpenAI.
- **Data Flow**: Stateless logic paths for simulator calculations.

### Slide 7: Technology Stack
- **Frontend**: React 19, Vite 8.2, Tailwind CSS 4, Recharts, Lucide React
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic
- **Database**: PostgreSQL (Production), SQLite (Testing)
- **Testing**: pytest 9.1

### Slide 8: Financial Onboarding
- **Comprehensive Profiles**: Income, location, employment type, dependents, housing, and debts.
- **Constraint Enforcement**: Checks valid age ranges (15-100) and ensures dependents are fewer than family members.
- **Secure Storage**: Directly linked to JWT user sessions.

### Slide 9: Local Cost Intelligence
- **Seeded Datasets**: Min, typical, and max estimates for Rent, Food, Utilities, and Transportation.
- **Confidence Matrix**: Rated as high (tariffs), medium (indices), or low (interpolations).
- **Categorical Scaling**: Rent scales by BHK preference; groceries scale by family size.

### Slide 10: Personalized Financial Planning
- **Planning Income**: `fixed_salary` + `other_income` + configured variable allocation.
- **DTI Ratio**: Determines overall debt burden.
- **Emergency target**: Adjusts target months (3-6 months) based on job type, dependents, and debts.
- **Surplus Capacity**: Formulates investable capacity after covering essentials, lifestyle, and debt.

### Slide 11: Investment Allocation
- **Normalized Splits**: Capital Preservation, Stable, and Growth.
- **Horizon & Experience Constraints**: Growth is capped at 0% for horizons under 1 year, and 30% for beginners.
- **Math Precision**: Fractional allocations are rounded to two decimal places, with rounding differences routed to Capital Preservation.

### Slide 12: Financial Dashboard
- **Consolidated Summary**: Renders DTI alerts, cash flow ratios, and emergency adequacy gauges.
- **Recharts Visualizations**: Interactive graphs displaying budget breakdowns and asset allocation splits.
- **Actionable Advice**: Dynamically highlights anomalies.

### Slide 13: Goal Tracking
- **Savings Milestones**: Compiles target dates, target amounts, and actual savings.
- **Contribution Tracking**: Records individual contributions and updates balances.
- **Status Classification**: Dynamically flags goals as "On Track" or "Behind."

### Slide 14: What-If Simulator
- **Sandbox Environment**: Models scenarios (salary shifts, new loans, new expenses) without changing database records.
- **In-Memory Calculations**: Temporarily overrides profile variables, recalculates budgets, and returns delta reports.
- **Safety**: Verified by automated test suites to ensure zero database mutations.

### Slide 15: AI Financial Assistant
- **Explanatory Role**: Conversationally explains calculations; does not perform money math.
- **Guardrails**: Block prompt injections and validate responses against output schemas.
- **Local formatting**: Outputs formatted using Indian Rupee (`₹`) notation.

### Slide 16: Security & Isolation
- **Authentication**: Stateful JWT bearer validation.
- **IDOR Protection**: All resource queries verify user ownership (`user_id == current_user.id`).
- **Middleware**: Injected security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`).
- **Rate Limiting**: Rolling window limiter to prevent brute-force attacks.

### Slide 17: Testing & Verification
- **Automated Tests**: 100 backend tests executed via pytest, resulting in 100% pass rates.
- **Static Analysis**: Verified clean Oxlint checks.
- **Vite Compilation**: Verified clean production builds.
- **API Health Probes**: `/health` and `/ready` endpoints monitor service status.

### Slide 18: Conclusion & Future Scope
- **Conclusion**: A secure, high-precision personal finance app combining deterministic calculations with regional cost data and AI.
- **Future Scope**: Direct banking connections, automatic receipt scanning, and native mobile apps.
- **Status**: Production configuration ready; hosting deployment pending.
