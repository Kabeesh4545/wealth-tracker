import json
import re
from typing import Dict, Any, Optional

def classify_intent_deterministically(message: str) -> str:
    """
    Performs first-layer deterministic rule routing for financial queries.
    If ambiguous, defaults to 'general_financial_question'.
    """
    msg = message.lower().strip()

    # 1. Unsupported requests check
    unsupported_keywords = [
        "cricket", "football", "sports", "match", "weather", "recipe", "cook",
        "movie", "song", "joke", "game", "politics", "election", "president",
        "hack", "bypass", "malware", "steal", "fraud", "illegal"
    ]
    if any(kw in msg for kw in unsupported_keywords):
        return "unsupported_request"

    # 2. What-If check
    what_if_keywords = [
        "what happens if", "what-if", "simulate", "hypothetical", "if my salary",
        "if i earn", "if my expenses", "if my emi", "if i save", "reduce eating",
        "reduce lifestyle", "increase salary", "reduce expense"
    ]
    if any(kw in msg for kw in what_if_keywords):
        return "what_if"

    # 3. Emergency fund
    ef_keywords = [
        "emergency fund", "emergency reserve", "rainy day", "reserve fund", "how much emergency"
    ]
    if any(kw in msg for kw in ef_keywords):
        return "emergency_fund"

    # 4. Debt
    debt_keywords = [
        "debt", "loan", "emi", "outstanding", "interest rate", "tenure", "debt ratio", "debt status"
    ]
    if any(kw in msg for kw in debt_keywords):
        return "debt_explanation"

    # 5. Investment
    inv_keywords = [
        "invest", "stock", "mutual fund", "fixed deposit", "risk tolerance", "suitability", "portfolio", "growth allocation"
    ]
    if any(kw in msg for kw in inv_keywords):
        return "investment_allocation"

    # 6. Local Cost
    local_keywords = [
        "rent high", "compare", "coimbatore", "mumbai", "chennai", "local cost", "benchmark", "typical cost", "cost in"
    ]
    if any(kw in msg for kw in local_keywords):
        return "local_cost"

    # 7. Goals
    goal_keywords = [
        "goal", "laptop", "save for", "target date", "months remaining", "required monthly contribution",
        "behind on my goal", "progressing toward"
    ]
    if any(kw in msg for kw in goal_keywords):
        return "goal_progress"

    # 8. Expense Analysis
    expense_keywords = [
        "expense", "lifestyle", "spending", "essential", "groceries", "eating outside", "shopping", "entertainment"
    ]
    if any(kw in msg for kw in expense_keywords):
        return "expense_analysis"

    # 9. Cash Flow
    cash_flow_keywords = [
        "cash flow", "surplus", "deficit", "save every month", "save each month", "planning income", "why is my cash flow"
    ]
    if any(kw in msg for kw in cash_flow_keywords):
        return "cash_flow"

    # 10. Budget / Financial Plan
    plan_keywords = [
        "financial plan", "explain my plan", "budget allocation", "reconciliation"
    ]
    if any(kw in msg for kw in plan_keywords):
        return "budget_explanation"

    return "general_financial_question"

def extract_scenario_parameters_with_llm(message: str, client, model: str) -> Optional[Dict[str, Any]]:
    """
    Calls OpenAI to parse scenario overrides from the user's natural language question.
    Delegates validation to the Step 10 ScenarioRequest parser.
    """
    system_prompt = (
        "You are an AI utility designed to extract What-If scenario overrides from a user question. "
        "Return ONLY a JSON block. Do not write explanations. "
        "Supported scenario types:\n"
        "1. 'salary_change': requires 'new_salary' (Decimal string)\n"
        "2. 'expense_change': requires 'category' ('Essential', 'Lifestyle', or 'Housing'), "
        "'subcategory' (e.g. 'Eating Outside', 'Food & Groceries', 'Rent', 'Maintenance'), and 'new_monthly_amount' (Decimal string)\n"
        "3. 'loan_change': requires 'loan_type' (e.g., 'Home Loan', 'Personal Loan', 'Education Loan') and 'new_emi' (Decimal string)\n"
        "4. 'savings_change': requires 'new_monthly_savings' (Decimal string)\n"
        "5. 'new_goal': requires 'name', 'target_amount' (Decimal string), 'current_saved' (Decimal string), 'target_date' (formatted as YYYY-MM)\n\n"
        "Examples:\n"
        "- 'What happens if my salary increases to 60000?' -> {\"scenario_type\": \"salary_change\", \"scenario_data\": {\"new_salary\": \"60000.00\"}}\n"
        "- 'What if I reduce eating outside to 2000?' -> {\"scenario_type\": \"expense_change\", \"scenario_data\": {\"category\": \"Lifestyle\", \"subcategory\": \"Eating Outside\", \"new_monthly_amount\": \"2000.00\"}}\n\n"
        "If the input is ambiguous or missing parameters, return an empty JSON block {}."
    )

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        data = json.loads(completion.choices[0].message.content)
        if not data.get("scenario_type") or not data.get("scenario_data"):
            return None
        return data
    except Exception as e:
        print(f"Error extracting parameters: {e}")
        return None
