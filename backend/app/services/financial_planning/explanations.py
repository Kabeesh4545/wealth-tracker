from decimal import Decimal
from typing import List, Dict, Any

def generate_recommendations(
    cash_flow_status: str,
    monthly_surplus: Decimal,
    surplus_pct: float,
    debt_status: str,
    debt_ratio: Decimal,
    ef_status: str,
    ef_months: float,
    ef_target: int,
    goals_list: List[Dict[str, Any]],
    lifestyle_pct: float
) -> tuple[List[Dict[str, Any]], List[str]]:
    """
    Dynamically generates recommendations and explanations based on user financial metrics.
    """
    recs = []
    expls = []

    # 1. Cash Flow explanations
    if cash_flow_status == "deficit":
        expls.append(
            f"Your cash flow is in deficit. Your monthly outflows exceed planning income by ₹{abs(float(monthly_surplus)):,.2f}."
        )
        recs.append({
            "type": "cash_flow",
            "priority": "high",
            "title": "Stabilize negative cash flow",
            "reason": f"Discretionary spending and debt obligations are eating up all income, leaving a deficit of ₹{abs(float(monthly_surplus)):,.2f}.",
            "impact": "Prevents debt accumulation and financial instability."
        })
    elif cash_flow_status == "balanced":
        expls.append(
            "Your cash flow is balanced with exactly zero surplus. Any unexpected expense will push you into deficit."
        )
        recs.append({
            "type": "cash_flow",
            "priority": "medium",
            "title": "Build a financial buffer",
            "reason": "You have zero surplus, meaning you cannot save or invest. Reduce lifestyle spending to create room.",
            "impact": "Enables goal saving and emergency coverage."
        })
    else:
        expls.append(
            f"Your cash flow is positive with a monthly surplus of ₹{float(monthly_surplus):,.2f} ({surplus_pct:.1f}% of planning income)."
        )

    # 2. Debt explanations
    debt_pct = float(debt_ratio * 100)
    if debt_status == "High":
        expls.append(
            f"Your debt-to-income ratio is {debt_pct:.1f}%, which is very high and poses a risk to your cash flow."
        )
        recs.append({
            "type": "debt",
            "priority": "high",
            "title": "Prioritize debt reduction",
            "reason": f"Debt payments consume {debt_pct:.1f}% of your planning income, well above the recommended 40% maximum threshold.",
            "impact": "Frees up cash flow and reduces interest expenses."
        })
    elif debt_status == "Moderate":
        expls.append(
            f"Your debt-to-income ratio is {debt_pct:.1f}%, which is moderate. Avoid taking on new debt."
        )
    else:
        expls.append(
            f"Your debt-to-income ratio is {debt_pct:.1f}%, which is low and well within safe limits."
        )

    # 3. Emergency fund explanations
    if ef_status == "Needs Building":
        expls.append(
            f"Your current emergency fund covers {ef_months:.1f} months of essential obligations, which is below the minimum recommended 3 months."
        )
        recs.append({
            "type": "emergency_fund",
            "priority": "high" if cash_flow_status != "deficit" else "medium",
            "title": "Build your emergency fund",
            "reason": f"Emergency fund of {ef_months:.1f} months leaves you vulnerable to job loss or sudden expenses. The target is {ef_target} months.",
            "impact": "Provides a safety net and avoids high-interest emergency borrowing."
        })
    elif ef_status == "Partially Funded":
        expls.append(
            f"Your emergency fund is partially funded at {ef_months:.1f} months, covering the 3-month minimum, but below the target of {ef_target} months."
        )
        recs.append({
            "type": "emergency_fund",
            "priority": "medium",
            "title": "Increase emergency savings to target",
            "reason": f"Your safety net of {ef_months:.1f} months is a good start, but should be built up to the recommended {ef_target}-month target.",
            "impact": "Strengthens long-term financial resilience."
        })
    else:
        expls.append(
            f"Your emergency savings are adequately funded at {ef_months:.1f} months, exceeding your recommended target of {ef_target} months."
        )

    # 4. Lifestyle expenses analysis
    if lifestyle_pct > 20 and cash_flow_status != "positive":
        recs.append({
            "type": "lifestyle",
            "priority": "medium",
            "title": "Reduce discretionary spending",
            "reason": f"Lifestyle expenses consume {lifestyle_pct:.1f}% of your planning income. Reducing this can help cover cash flow deficits.",
            "impact": "Immediately increases monthly savings capacity."
        })

    # 5. Financial goals explanations
    challenging_goals = [g for g in goals_list if g["status"] == "Challenging"]
    unfeasible_goals = [g for g in goals_list if g["status"] == "Not Currently Feasible"]
    overdue_goals = [g for g in goals_list if g["status"] == "Overdue"]

    if overdue_goals:
        expls.append(
            f"You have {len(overdue_goals)} overdue goal(s) whose target dates have already passed."
        )
        recs.append({
            "type": "goals",
            "priority": "high",
            "title": "Review overdue financial goals",
            "reason": f"Target deadlines have passed for goals: {', '.join([g['goal_name'] for g in overdue_goals])}.",
            "impact": "Adjusts planning timelines to match realistic cash flows."
        })

    if unfeasible_goals:
        expls.append(
            f"There is insufficient surplus to allocate to goals: {', '.join([g['goal_name'] for g in unfeasible_goals])}."
        )
        recs.append({
            "type": "goals",
            "priority": "medium",
            "title": "Reschedule unfeasible goals",
            "reason": "Current monthly cash surplus is fully consumed by higher priority goals or expenses.",
            "impact": "Aligns savings plan with current financial limits."
        })

    return recs, expls
