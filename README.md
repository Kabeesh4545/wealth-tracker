# Wealth Tracker — AI-Powered Personal Finance & 24/7 Market Trends

A full-stack personal wealth tracking and financial intelligence platform that combines deterministic budgeting algorithms, regional cost-of-living intelligence, 24/7 live stock & market trend analysis, savings & investment suitability engines, an interactive what-if simulator, and an explanatory AI layer.

---

## 1. Project Overview
The Personalized Money Management Application collects a user's financial profile—such as salary, savings, investments, loan liabilities, planned expenses, goals, risk tolerance, and city of residence—and applies deterministic rule-based algorithms combined with regional cost data to synthesize optimized budgets, calculate savings needs, evaluate emergency fund adequacy, allocate assets, simulate what-if scenarios, and explain financial recommendations using a secure AI model.

## 2. Problem Statement
Generic financial planning strategies (like the 50/30/20 rule) fail to account for personal variables, local cost-of-living variations, specific debt burdens, and varying time horizons. This application solves this isolation problem by integrating diverse inputs (regional cost benchmarks, personal debts, financial goals, risk profile, and employment status) into a single, unified, deterministic financial planning engine.

## 3. Objectives
- **Centralized Profiles**: Collect comprehensive financial details (salary, housing, loans, expenses, goals, and risk profiles).
- **Localized Baselines**: Adjust financial models using regional cost databases.
- **Rule-Based Budgeting**: Reconcile monthly cash flows into essential, lifestyle, and savings buffers.
- **Suitability Allocation**: Split investment capacities based on risk levels, horizons, and stability adjustments.
- **Stateless Simulations**: Run zero-mutation "what-if" simulations.
- **Secure AI Assistance**: Provide conversational, natural language explanations of backend calculations with strict data isolation.
- **Security & isolation**: Maintain least-privilege database profiles and protect API resources against IDOR, injection, and parameter tampering.

## 4. Key Highlights & Features
- **24/7 Live Market Trends Feed**: Real-time market data across 17 benchmark Indian indices (NIFTY 50, SENSEX, BANK NIFTY), global indices (S&P 500), commodities (Gold & Silver BeES), and top bluechips. Automatically detects active trading hours vs. after-market LTP with 60s in-memory caching and 0-downtime fallback.
- **Personalized Financial Action Plan**: Explainable monthly budgeting with emergency fund scoring, local benchmark cost comparisons, and debt-to-income analysis.
- **Analytics & Expense Tracker**: Multi-category expense tracking, historical analytics, and automated Safe-to-Spend limits.
- **Interactive What-If Simulator**: Stateless zero-mutation scenario modeling for salary hikes, rent changes, new loans, or investment shifts.
- **AI Financial Coach**: Context-aware natural language assistant explaining calculations and budget tradeoffs.
- **Multi-Stage Docker & Cloud Ready**: Production-ready container serving Vite React frontend and FastAPI backend in a single unified service.

## 5. Technology Stack

### Frontend
- **Framework**: React 19 (JavaScript)
- **Tooling**: Vite 8.2
- **Styling**: Tailwind CSS 4, Vanilla CSS
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Framework**: Python 3.10+, FastAPI
- **Validation**: Pydantic v2
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL (Production), SQLite (Local Dev/Tests)
- **Migrations**: Alembic

### Testing
- **Framework**: pytest 9.1

---

## 5. System Architecture

```
User (Browser)
    │
    ▼ [HTTPS / JSON]
React Frontend (Production Bundle)
    │
    ▼ [CORS, JWT Headers, Rate-Limited Requests]
FastAPI Backend App (Production Server)
    ├──────────► [SQLAlchemy / SQL] ──► PostgreSQL Database (CRUD)
    └──────────► [HTTPS / JWT API]  ──► OpenAI API (Explanatory Assistant)
```

- **Stateless Simulator Flow**: Takes user scenarios, overrides profile settings in-memory, executes budget/allocation calculators, returns delta reports, and issues **no database writes** (ensures immutability).
- **AI Assistant Flow**: Queries deterministic calculations for the authenticated user, formats the variables in secure prompts using Indian Rupee (`₹`) notation, queries OpenAI, validates responses against output schemas, and outputs explanations to the user.

---

## 6. Project Setup & Execution

### Backend Configuration

1. **Clone project and navigate to backend**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure environment variables** (create `backend/.env` using `backend/.env.example` as a template):
   ```env
   ENVIRONMENT=development
   DATABASE_URL=sqlite:///./money_management.db
   JWT_SECRET_KEY=development-secret-key-at-least-32-chars-long
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   OPENAI_API_KEY=your-openai-api-key
   AI_ASSISTANT_MODEL=gpt-4o-mini
   ```
4. **Run migrations**:
   ```bash
   alembic upgrade head
   ```
5. **Seed local cost benchmark data**:
   ```bash
   python seed/seed_database.py
   ```
6. **Start the backend development server**:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Configuration

1. **Navigate to the workspace root**:
   ```bash
   npm install
   ```
2. **Configure environment variables** (create `.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
3. **Start the Vite server**:
   ```bash
   npm run dev
   ```

---

## 7. Testing & Verification

Execute the backend automated test suite:
```bash
cd backend
python -m pytest
```

Execute frontend asset compilation:
```bash
npm run build
```

### Verified Test Results

The suite contains tests covering onboarding boundaries, financial plan calculations, investment allocation steps, local cost API behavior, goal contributions, simulator immutability, prompt injection blocks, monthly envelope caps, and security middleware.

- **Total Backend Tests**: 106
- **Passed**: 106
- **Failed**: 0
- **Skipped**: 0
- **Vite production build**: Completed successfully (compiled assets outputted to `dist/`).

---

## 8. Current Deployment Status

**"Production configuration prepared and deployment-ready; actual hosting deployment remains pending."**

---

## 9. Step 16 Product Upgrade Features

### Exact spending Limits Log
* Category caps are determined utilizing python `Decimal` arithmetic.
* Limits encompass housing, mandatory EMIs, utilities, groceries, and discretionary lifestyle segments (shopping, entertainment, eating outside, travel, subscriptions, hobbies).

### Authoritative Safe-to-Spend Limit
* Calculated as: `planning_income - mandatory_expenses - loan_payments - emergency_fund_contrib - goal_contrib - investment_capacity = discretionary_spend`.
* Exposes monthly, weekly, and daily thresholds. Daily thresholds adapt dynamically based on remaining calendar days in the selected month (YYYY-MM).
* Clamped to 0 for deficit users, triggering high-priority financial warnings.

### Investment Suitability Engine
* Evaluates suitability scores out of 100 for 12 educational asset classes based on profile variables (risk tolerance, horizon, experience, emergency fund status, debt level).
* Maps monthly investment amounts to Step 6 allocation tier capacities (Growth, Stable, Capital Preservation).

---

## 10. Key Limitations & Future Scope

### Limitations
- **Static Cost Indexes**: Local cost estimates reflect Numbeo/MoSPI datasets and require scheduled batch scripts to update.
- **Rule-Based Allocation**: Investments use suitability ranges and do not provide dynamic market suggestions or security-specific choices.
- **Conversation Limitations**: The AI operates exclusively as a read-only explanation layer for backend calculations and cannot execute account actions.

### Future Scope
- **Direct Banking Integration**: Automating transaction imports through secure API connectors.
- **Automatic Expense Categorization**: Using classification algorithms to sort card statements.
- **Advanced Forecasting**: Utilizing regression models for multi-year cash flow projections.
- **Mobile Deployments**: Building native apps via React Native.
