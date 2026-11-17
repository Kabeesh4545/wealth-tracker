# Project Viva Preparation Guide
## AI-Powered Personalized Money Management Application

This guide contains likely viva questions and concise technical answers matching the actual implementation of this application.

---

### Q1: Why did you choose this project?
**Answer**: I chose this project to address the fragmentation in personal finance management. Most tools either offer generic calculators without personalization or capture data without context (like regional cost differences and debt burdens). This project bridges the gap by combining deterministic budgeting rules with regional cost-of-living data and a conversational explanation layer.

### Q2: What problem does it solve?
**Answer**: It solves the mismatch between generalized financial rules (e.g., 50/30/20) and individual realities. The application dynamically adjusts emergency targets based on career risk and dependent ratios, reshapes investment categories based on horizon limits and debt levels, and validates budgeting choices against local cost baselines.

### Q3: Why React?
**Answer**: React provides a component-driven, responsive user interface. It makes complex components (like interactive simulators, dynamic charts, and chat interfaces) easy to build and update in real-time through virtual DOM diffs and state hooks.

### Q4: Why FastAPI?
**Answer**: FastAPI is an asynchronous, high-performance web framework for Python. It automatically handles type declarations and schema validation via Pydantic, generates interactive Swagger API documentation out-of-the-box, and runs fast, making it ideal for API-centric applications.

### Q5: Why PostgreSQL?
**Answer**: PostgreSQL is a robust, open-source relational database. It offers ACID compliance, supports complex foreign keys and constraints, handles numeric precision exactly, and is highly scalable for production deployments.

### Q6: Why deterministic financial calculations?
**Answer**: Financial recommendations must be transparent, mathematical, and predictable. If we used machine learning or LLMs to calculate budgets, they could hallucinate, resulting in varying numbers for the same input. A deterministic backend engine guarantees mathematical consistency, while the AI is used solely to explain the results.

### Q7: Why use Decimal instead of Float?
**Answer**: Floating-point numbers (`Float`) use binary representation, which introduces rounding errors in decimal arithmetic (e.g., `0.1 + 0.2` becomes `0.30000000000000004`). In financial calculations, rounding errors are unacceptable. We use the `Decimal` type to ensure exact precision to two decimal places.

### Q8: How is debt ratio calculated?
**Answer**: The Debt-to-Income (DTI) ratio is calculated as:
\[\text{DTI} = \frac{\text{Total Monthly Loan EMIs}}{\text{Planning Income}} \times 100\]
If the DTI exceeds 30%, it is flagged as "High," which triggers stability adjustments and alert prompts on the dashboard.

### Q9: How is emergency fund calculated?
**Answer**: The base target is 3 months of essential expenses. We apply scale factors:
- Freelance/Self-Employed: +1 month
- Dependents > 2: +1 month
- High Debt (DTI > 30%): +1 month
- Capped at a maximum of 6 months.

### Q10: How is investment allocation determined?
**Answer**: The surplus income is divided into Capital Preservation, Stable, and Growth. The baseline split depends on risk tolerance (Low: 40/40/20, Medium: 30/30/40, High: 20/10/70). This baseline is adjusted for experience (beginners capped at 30% Growth) and horizon (horizon < 1 year caps Growth at 0%). Rounding discrepancies are routed to Capital Preservation to ensure allocations sum to exactly 100%.

### Q11: How does local cost intelligence work?
**Answer**: The system loads seeded cost datasets containing min, typical, and max estimates for categories (Housing, Utilities, Food, Transportation) across major cities (e.g., Chennai, Coimbatore, Bengaluru). Users select their city during onboarding, and the backend returns cost comparisons and flags deviations.

### Q12: Why does the simulator not modify the database?
**Answer**: The "what-if" simulator is stateless and read-only. It allows users to test hypothetical scenarios (e.g., "What if I get a 10% raise?") without corrupting their actual financial records. The backend receives the overrides, runs the calculations in-memory, returns the results, and discards the state.

### Q13: How does AI use financial data?
**Answer**: The AI is a read-only explanatory interface. The backend fetches the user's deterministic financial plan, formats it into a structured context object with Indian Rupee (`₹`) formatting, and forwards it to the OpenAI API along with a strict system prompt instructing it not to perform calculations and to focus on budgeting guidance.

### Q14: How do you prevent cross-user access?
**Answer**: We enforce user ownership checks at the database query level. Every API route uses a dependency to fetch the authenticated user from the JWT token and appends `user_id == current_user.id` to database queries. This blocks Insecure Direct Object Reference (IDOR) attacks.

### Q15: How do you prevent SQL injection?
**Answer**: We use the SQLAlchemy ORM, which translates queries into parameterized SQL statements. This ensures that user inputs are handled as query values rather than raw SQL code, preventing SQL injection attacks.

### Q16: How do you prevent XSS?
**Answer**: React automatically escapes text content and variables before rendering them in the DOM. This protects the frontend from Cross-Site Scripting (XSS) attacks.

### Q17: How do you protect the OpenAI API key?
**Answer**: The API key is stored exclusively as a server-side environment variable. The frontend never accesses or makes direct requests to the OpenAI API; it communicates solely with the FastAPI backend, which acts as a secure intermediary.

### Q18: How does JWT authentication work?
**Answer**: Upon successful login, the server issues a JSON Web Token signed with a secure server secret. The client stores this token and sends it in the `Authorization: Bearer <token>` header of subsequent API requests. The server validates the signature and decodes the payload to identify the user.

### Q19: How does rate limiting work?
**Answer**: We use a `SimpleLimiter` implemented in backend memory. It tracks the number of requests per IP address within a rolling window (e.g., 10 logins/min, 15 AI chats/min) and blocks requests that exceed these limits, returning a `429 Too Many Requests` status.

### Q20: What are the limitations?
**Answer**: The regional cost benchmarks are static and require scheduled updates. The investment allocator recommends asset splits but does not suggest specific stocks. Additionally, the assistant cannot execute financial transactions.

### Q21: What would you improve in the future?
**Answer**: In the future, I would implement:
1. Automated bank synchronization APIs.
2. OCR-based receipt scanning for expense tracking.
3. Native mobile apps using React Native.
4. A distributed rate-limiting backend (e.g., Redis) to support horizontal scaling.

### Q22: How would you deploy at scale?
**Answer**: For horizontal scalability, I would containerize the app using Docker, set up a PostgreSQL cluster with connection pooling (e.g., PgBouncer), run the backend behind a load balancer, and replace the in-memory rate limiter with a Redis-backed rate limiter.

### Q23: How do the Step 16 budget and investment recommendation engines work?
**Answer**: 
- **Monthly Budget Engine**: Reconciles cash flows against onboarding planning income using high-precision Decimal arithmetic. It deducts mandatory costs (Tiers 1 & 2) to calculate Safe-to-Spend limits (monthly/weekly/daily), splitting remaining discretionary income among 19 categories.
- **Investment Recommendation Engine**: Sorts 12 products using rule-based scoring (0–100) based on risk tolerance, horizon, experience, emergency fund status, and debt level. Matched target amounts are mapped directly using Step 6 portfolio capacities (Growth, Stable, Capital Preservation).
