# PROJECT REPORT
## AI-Powered Personalized Money Management Application

---

## 1. Abstract
The AI-Powered Personalized Money Management Application is a comprehensive digital solution designed to help users manage their financial health. Traditional generic budgeting frameworks fail to incorporate individual constraints like localized living expenses, current debt burdens, specific savings goals, and risk profiles. This project addresses these shortcomings by integrating dynamic financial calculations with local cost databases to synthesize custom budgets. It features a rule-based financial planning engine, an investment suitability allocator, an in-memory stateless "what-if" scenario simulator, and an explanatory conversational AI layer powered by the OpenAI API. All calculations are executed deterministically on the backend to guarantee accuracy and transparency, while the AI model serves strictly as an educational interaction interface. 

---

## 2. Introduction
Managing personal finance is a complex task involving multiple facets: tracking income, budgeting expenses, managing loan liabilities, saving for milestones, and allocating investments. Most individuals rely on separate tools, leading to fragmented financial insights. This project combines onboarding variables (monthly income, housing status, debt EMIs, family members, location) and financial objectives (goals, risk profile, time horizon) into a single, cohesive, rule-based system.

---

## 3. Problem Statement
Standard personal finance advice, such as the general 50/30/20 budget rule, is not universally applicable. For example:
1. It does not adjust for high-debt situations where loan payments exceed standard allocations.
2. It fails to reflect regional cost differences between metro cities and smaller towns.
3. It does not scale emergency fund targets based on employment stability or dependent ratios.
4. It does not account for investment horizon constraints and risk appetites when dividing savings.

---

## 4. Existing Systems
Traditional money management applications fall into two categories:
- **Generic Spreadsheets & Calculators**: Require tedious manual configurations and lack automated intelligence or cost normalization.
- **Commercial Aggregators**: Focus heavily on automated bank scraping (which introduces security risks) and push generic stock recommendations or credit card offers rather than personalized budgeting guidance.

---

## 5. Proposed System
The proposed system implements a secure personal finance application utilizing a decoupled React frontend and FastAPI backend:
- **Deterministic Calculators**: Core financial rules are executed using high-precision Decimal math to prevent floating-point rounding errors.
- **Local Cost Integration**: Integrates regional cost-of-living data to establish contextual guidelines.
- **In-Memory Simulator**: Allows users to run hypothetical scenarios without altering actual stored records.
- **Explanatory AI Layer**: Uses OpenAI Completions with strict contextual boundaries to explain calculated financial profiles.

---

## 6. Objectives
- Design and implement a structured financial onboarding system.
- Standardize monthly budgeting using hierarchical rules that prioritize debt service and emergency funds.
- Align investment capacities using suitability scoring and stability adjustments.
- Implement a stateless simulator to model financial changes in-memory.
- Provide natural language explanations of calculations through a conversational AI assistant.
- Establish strict user data isolation to block cross-user access (IDOR protection).

---

## 7. Scope
The application is scoped as a personal planning and educational tool. It does not execute autonomous transactions, connect directly to commercial banking institutions, or provide specific security selections (e.g., buying specific stocks or mutual funds).

---

## 8. Requirements
- **Hardware**: Standard application server (x86_64 CPU, 2GB+ RAM).
- **Software**: Python 3.10+, PostgreSQL 15+, Node.js 18+.

---

## 9. Technology Stack
- **Frontend**: React 19, Vite 8.2, Tailwind CSS 4, Lucide React, Recharts.
- **Backend**: Python 3.10, FastAPI, SQLAlchemy 2.0 (ORM), Pydantic v2, Alembic.
- **Database**: PostgreSQL (Production), SQLite (Local Dev/Testing).
- **Testing**: pytest 9.1.
- **AI Integration**: OpenAI API (using `gpt-4o-mini`).

---

## 10. System Architecture

```
   ┌──────────────────────────────────────────┐
   │             React Frontend               │
   └───────────────────┬──────────────────────┘
                       │ HTTPS / JSON API
                       ▼
   ┌──────────────────────────────────────────┐
   │            FastAPI Backend               │
   └───────┬───────────────────────────┬──────┘
           │                           │
           ▼ [SQLAlchemy ORM]          ▼ [RESTful Client]
   ┌───────────────┐           ┌───────────────┐
   │  PostgreSQL   │           │  OpenAI API   │
   │   Database    │           │ (Explanations)│
   └───────────────┘           └───────────────┘
```

---

## 11. Module Description
- **Module 1: Onboarding**: Collects and validates demographic, income, debt, and risk variables.
- **Module 2: Planning Engine**: Calculates emergency fund metrics, debt-to-income ratios, and surplus capacity.
- **Module 3: Investment Allocator**: Maps surplus funds to capital preservation, stable, and growth categories.
- **Module 4: What-If Simulator**: Conducts hypothetical dry-runs of salary modifications, new loans, or expenses.
- **Module 5: Conversational Assistant**: Answers user questions using deterministic calculations as source context.
- **Module 6: Security & Hardening**: Implements JWT authorization, rate limits, correlation logs, and security headers.

---

## 12. Database Design
The schema uses the following relational tables:
- **`users`**: Auth credentials (email, hashed password, is_active).
- **`financial_profiles`**: Financial variables (salary, dependents, city, housing).
- **`savings`**: Current assets (bank savings, emergency funds).
- **`investment_profiles`**: Risk settings (risk tolerance, horizon, preference).
- **`loans`**: Debts (outstanding amount, emi, interest, tenure).
- **`expenses`**: Discretionary and essential costs.
- **`financial_goals`**: Milestones (target amount, current saved, target date).
- **`local_costs`**: Living cost estimates indexed by city and household size.

---

## 13. API Design
Key endpoints include:
- `POST /api/auth/register` & `/login`: Core authentication.
- `POST /api/profile` & `PUT /api/profile`: Manage user onboarding variables.
- `GET /api/planning/monthly-plan`: Retrieve budget breakdown.
- `GET /api/planning/investment-allocation`: Fetch asset suitability splits.
- `POST /api/simulator/what-if`: Execute stateless simulation calculations.
- `POST /api/assistant/chat`: Interact with the AI assistant.
- `GET /health` & `GET /ready`: Health check endpoints.

---

## 14. Financial Planning Methodology (Step 5)
Budgeting is processed sequentially using Decimal arithmetic:
1. **Planning Income**: `fixed_salary` + `other_income` + configured portion of `variable_income`.
2. **Debt Burden**: Compiles all loan payments to calculate the Debt-to-Income (DTI) ratio. High DTI triggers alerts.
3. **Emergency Fund Target**:
   - Base target is 3 months of essential expenses.
   - Scale factor adjustments: +1 month if freelance, +1 month if dependents > 2, +1 month if DTI > 30%, capped at a maximum of 6 months.
4. **Surplus Calculation**: Surplus is calculated after subtracting essential costs, lifestyle costs, and debt payments.

---

## 15. Investment Allocation Methodology (Step 6)
Surplus capacity is allocated into three portfolios:
- **Capital Preservation**: Cash and cash-equivalents.
- **Stable**: Fixed-income bonds.
- **Growth**: Equity and equity-like mutual funds.

Allocation percentages are normalized using suitability logic:
- Base allocations are shifted based on risk tolerance (Low, Medium, High).
- Growth is capped based on experience (Beginners capped at 30%) and horizon (capping growth at 0% for horizons < 1 year).
- Rounds all allocation amounts to two decimal places, routing any division rounding differences to Capital Preservation to ensure the total sums to exactly 100%.

---

## 16. Goal Tracking (Step 9)
Users set target dates and amounts. The engine calculates the required monthly savings:
\[\text{Monthly Required} = \frac{\text{Target Amount} - \text{Current Saved}}{\text{Months Remaining}}\]
If the actual monthly contribution falls below this threshold, goals are flagged as "Behind."

---

## 17. What-If Simulation (Step 10)
The simulator evaluates scenario inputs (e.g., a salary increase or taking a new loan) by creating a temporary, in-memory state. It executes the Step 5 and Step 6 calculation modules and compares the results against the user's baseline. **No database writes are executed during this transaction**, preserving database integrity.

---

## 18. AI Assistant (Step 11)
The assistant does not perform financial calculations. It operates as an explanation layer:
1. Gathers the user's profile and calculations as input context.
2. Injects system constraints: *"You are an AI financial planning assistant. You explain the user's existing calculations."*
3. Formats monetary outputs using Indian Rupee (`₹`) notation.
4. Leverages OpenAI to generate the conversational response.
5. Applies input validators to block prompt injections.

---

## 19. Security
- **Authentication**: Stateful JWT bearer validation.
- **Authorization**: User ownership checks on all records to prevent IDOR.
- **Middleware**: Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **Rate Limiting**: Local in-memory simple limiters (10 login req/min, 15 assistant req/min).
- **Inputs**: Sanitization and parameterized SQLAlchemy queries to prevent SQL injections.

---

## 20. Testing
The testing strategy comprises unit tests, integration validation, and build verification.
- **Command**: `cd backend; python -m pytest`
- **Output**: 106/106 tests passed successfully.
- **Build Command**: `npm run build`
- **Output**: Vite build compiled successfully.

---

## 21. Results
The application successfully reconciles monthly cash flows, recommends emergency allocations, divides surplus investments, maps exact envelope limits for 19 categories, tracks Safe-to-Spend allowances (monthly/weekly/daily), ranks 12 educational investment vehicles, models scenario changes, and answers financial queries conversationaly while ensuring strict data privacy and access security.

---

## 22. Limitations
- Cost data is static and relies on Numbeo/MoSPI references.
- Investment logic does not advise on individual stock purchases.
- Rate limiting is local to the instance, which is suitable for single-node setups but requires central stores (e.g., Redis) if scaled horizontally.

---

## 23. Future Scope
- Live API integration with national banking data.
- Automated OCR receipt scanning for expense tracking.
- Native mobile application versions.
- Collaborative/household budgeting features.

---

## 24. Conclusion
The AI-Powered Personalized Money Management Application provides a secure and reliable platform for personal financial planning. By combining deterministic calculations with local cost databases, it delivers customized, context-aware financial advice.

---

## 25. References
1. FastAPI Documentation: https://fastapi.tiangolo.com/
2. SQLAlchemy 2.0 Documentation: https://docs.sqlalchemy.org/
3. PostgreSQL Manual: https://www.postgresql.org/docs/
4. OpenAI API Reference: https://platform.openai.com/docs/
5. OWASP Top 10 Security Risks: https://owasp.org/www-project-top-ten/
