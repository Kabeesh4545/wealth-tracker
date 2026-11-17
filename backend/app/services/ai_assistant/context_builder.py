import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.planned_expense import PlannedExpense
from app.models.loan import Loan
from app.models.saving import Saving
from app.models.financial_goal import FinancialGoal
from app.models.investment_profile import InvestmentProfile

from app.services.financial_planning.engine import generate_financial_plan
from app.services.investment_allocation.engine import calculate_investment_allocation
from app.services.goal_contribution_service import calculate_goal_progress, get_planned_contributions

def format_inr(val) -> str:
    """
    Formats a numeric value in Indian Rupees format (e.g. ₹50,000, ₹1,25,000, ₹8,500).
    """
    if val is None:
        return "₹0"
    try:
        val_float = float(val)
        s = f"{val_float:.2f}"
        parts = s.split('.')
        integer = parts[0]
        
        # Indian numbering grouping format
        if len(integer) > 3:
            last_three = integer[-3:]
            remaining = integer[:-3]
            out = []
            while len(remaining) > 2:
                out.insert(0, remaining[-2:])
                remaining = remaining[:-2]
            if remaining:
                out.insert(0, remaining)
            formatted_integer = ",".join(out) + "," + last_three
        else:
            formatted_integer = integer
        
        decimal = parts[1]
        if decimal == "00":
            return f"₹{formatted_integer}"
        else:
            return f"₹{formatted_integer}.{decimal}"
    except Exception:
        return f"₹{val}"

def build_user_financial_context(
    db: Session,
    user: User,
    intent: str,
    simulation_result: Optional[Dict[str, Any]] = None,
    scenario_type: Optional[str] = None
) -> str:
    """
    Gathers structured context relative to the intent from existing backend services.
    Enforces privacy by omitting irrelevant data blocks.
    """
    # Reject sending context for unsupported requests
    if intent == "unsupported_request":
        return "The user asked a query completely unrelated to financial planning or budgeting."

    # Return general educational instructions for general questions without user data context
    if intent == "general_financial_question":
        return (
            "Context: The user is asking a general, educational financial planning question. "
            "Explain the concepts (e.g., emergency fund, debt ratio, budget methods) educationally. "
            "Do NOT include user-specific profile numbers or invent individual data values."
        )

    # Load baseline plans using Step 5 and Step 6 engines
    try:
        plan = generate_financial_plan(db, user)
        allocation = calculate_investment_allocation(db, user, override_plan=plan)
    except Exception as e:
        print(f"Error loading plan context: {e}")
        return "Error: Unable to load financial planning data context."

    ctx_parts = []

    # 1. Base User info
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    if profile:
        ctx_parts.append(
            f"USER PROFILE: Age {profile.age}, City {profile.city or 'Not Specified'}, "
            f"Employment Type {profile.employment_type or 'Employee'}"
        )

    # 2. Add context segments selectively based on intent
    if intent in ["cash_flow", "budget_explanation", "expense_analysis"]:
        # Income details
        ctx_parts.append(
            f"INCOME: Salary {format_inr(plan['income']['salary'])}, "
            f"Other Income {format_inr(plan['income']['other_income'])}, "
            f"Variable {format_inr(plan['income']['variable_income'])}, "
            f"Planning Income {format_inr(plan['income']['planning_income'])}"
        )
        # Cash Flow surplus
        ctx_parts.append(
            f"CASH FLOW: Monthly Surplus {format_inr(plan['cash_flow']['monthly_surplus'])}, "
            f"Status {plan['cash_flow']['status'].upper()}"
        )
        # Expenses
        ctx_parts.append(
            f"EXPENSES: Essential Total {format_inr(plan['expenses']['essential'])}, "
            f"Lifestyle Total {format_inr(plan['expenses']['lifestyle'])}, "
            f"Expenses Total {format_inr(plan['expenses']['total'])}"
        )
        if intent in ["cash_flow", "budget_explanation", "expense_analysis"]:
            # Income details
            ctx_parts.append(
                f"INCOME: Salary {format_inr(plan['income']['salary'])}, "
                f"Other Income {format_inr(plan['income']['other_income'])}, "
                f"Variable {format_inr(plan['income']['variable_income'])}, "
                f"Planning Income {format_inr(plan['income']['planning_income'])}"
            )
            # Cash Flow surplus
            ctx_parts.append(
                f"CASH FLOW: Monthly Surplus {format_inr(plan['cash_flow']['monthly_surplus'])}, "
                f"Status {plan['cash_flow']['status'].upper()}"
            )
            # Expenses
            ctx_parts.append(
                f"EXPENSES: Essential Total {format_inr(plan['expenses']['essential'])}, "
                f"Lifestyle Total {format_inr(plan['expenses']['lifestyle'])}, "
                f"Expenses Total {format_inr(plan['expenses']['total'])}"
            )
            if intent == "budget_explanation":
                # Fetch detailed monthly budget limits and safe-to-spend components
                from app.services.monthly_budget.calculator import calculate_monthly_budget
                mb = calculate_monthly_budget(db, user)
                
                sb = mb["safe_to_spend_breakdown"]
                ctx_parts.append(
                    f"AUTHORITATIVE SAFE-TO-SPEND BREAKDOWN:\n"
                    f"- Monthly Safe to Spend: {format_inr(sb['safe_to_spend_monthly'])}\n"
                    f"- Weekly Safe to Spend: {format_inr(sb['safe_to_spend_weekly'])}\n"
                    f"- Daily Safe to Spend: {format_inr(sb['safe_to_spend_daily'])}\n"
                    f"- Deductions: Fixed {format_inr(sb['fixed_obligations'])}, Essentials {format_inr(sb['essential_expenses'])}, "
                    f"Goals {format_inr(sb['goal_contribution'])}, Emergency {format_inr(sb['emergency_fund'])}, Investments {format_inr(sb['investment'])}"
                )

                ctx_parts.append("CATEGORY SPENDING LIMITS (Recommended, Safe, Hard Limits):")
                for cat in mb["categories"]:
                    actual_str = format_inr(cat['actual_current']) if cat.get('actual_current') is not None else "Not Recorded"
                    bench_str = format_inr(cat['local_benchmark']) if cat.get('local_benchmark') is not None else "Unavailable"
                    ctx_parts.append(
                        f"  - {cat['category']} [{cat['data_classification']}]: Actual {actual_str}, Benchmark {bench_str}, "
                        f"Recommended Limit {format_inr(cat['recommended_limit'])}, Safe Limit {format_inr(cat['safe_limit'])}, Hard Limit {format_inr(cat['hard_limit'])}"
                    )

    elif intent == "emergency_fund":
        ef = plan["emergency_fund"]
        ctx_parts.append(
            f"EMERGENCY FUND STATUS:\n"
            f"- Current Savings: {format_inr(ef['current'])}\n"
            f"- Recommended Minimum Target: {format_inr(ef['recommended_min'])}\n"
            f"- Recommended Target: {format_inr(ef['recommended_target'])}\n"
            f"- Gap to target: {format_inr(ef['gap'])}\n"
            f"- Months Coverage: {ef['months_coverage']:.1f} months\n"
            f"- Target Months Required: {ef['target_months']} months\n"
            f"- Status: {ef['status']}"
        )

    elif intent == "debt_explanation":
        debt = plan["debt"]
        ctx_parts.append(
            f"DEBT SUMMARY: Total EMI {format_inr(debt['total_emi'])}, "
            f"Total Outstanding Loan Debt {format_inr(debt['total_outstanding'])}, "
            f"Debt-to-Income (DTI) Ratio {debt['debt_to_income_ratio'] * 100:.1f}%, "
            f"Debt Status {debt['status']}"
        )
        # Include individual loans
        loans = db.query(Loan).filter(Loan.user_id == user.id).all()
        if loans:
            ctx_parts.append("ACTIVE LOANS LIST:")
            for idx, l in enumerate(loans, 1):
                ctx_parts.append(
                    f"  {idx}. Type: {l.loan_type}, Outstanding: {format_inr(l.outstanding_amount)}, "
                    f"EMI: {format_inr(l.monthly_emi)}, Rate: {l.interest_rate}%, "
                    f"Remaining Tenure: {l.remaining_tenure_months} months"
                )

    elif intent in ["goal_progress", "goal_strategy"]:
        today = datetime.date.today()
        goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user.id).all()
        planned_map = get_planned_contributions(db, user)
        if goals:
            ctx_parts.append("USER FINANCIAL GOALS MONITORING DETAILS:")
            for idx, g in enumerate(goals, 1):
                planned_val = planned_map.get(g.id, 0.0)
                prog = calculate_goal_progress(db, g, planned_val, today.month, today.year)
                ctx_parts.append(
                    f"  {idx}. Goal: {prog['goal_name']}\n"
                    f"     - Target Amount: {format_inr(prog['target_amount'])}\n"
                    f"     - Current Saved (incl. contributions): {format_inr(prog['current_saved'])}\n"
                    f"     - Remaining Gap: {format_inr(prog['remaining_amount'])}\n"
                    f"     - Progress: {prog['progress_percentage']}%\n"
                    f"     - Target Date: {prog['target_date']}\n"
                    f"     - Months Remaining: {prog['months_remaining']}\n"
                    f"     - Required Monthly Contribution: {format_inr(prog['required_monthly_contribution'])}\n"
                    f"     - Planned Budget Allocation: {format_inr(prog['planned_monthly_contribution'])}\n"
                    f"     - Actual Contribution This Month: {format_inr(prog['actual_month_contribution'])}\n"
                    f"     - Planning Status: {prog['planning_status']}\n"
                    f"     - Actual Status: {prog['actual_status']}"
                )
        else:
            ctx_parts.append("GOALS: User has no active goals configured.")

    elif intent == "investment_allocation":
        ctx_parts.append(
            f"INVESTMENT PROFILE:\n"
            f"- Experience: {allocation['suitability']['experience']}\n"
            f"- Horizon: {allocation['suitability']['horizon']}\n"
            f"- Risk Tolerance: {allocation['suitability']['risk_tolerance']}\n"
            f"- Preferred Category Preference: {allocation['suitability']['primary_preference']}\n"
            f"- Investment Capacity: {format_inr(allocation['investment_capacity'])}"
        )
        ctx_parts.append("SUITABILITY ALLOCATIONS:")
        for item in allocation["allocations"]:
            ctx_parts.append(
                f"  - Category: {item['category']}, Percentage: {item['percentage']}%, "
                f"Amount: {format_inr(item['amount'])}"
            )
        if allocation.get("suitability_warnings"):
            ctx_parts.append("SUITABILITY WARNINGS:")
            for w in allocation["suitability_warnings"]:
                ctx_parts.append(f"  - {w}")

    elif intent == "local_cost":
        ctx_parts.append(f"LOCAL COST INTELLIGENCE: City {profile.city if profile else 'Coimbatore'}")
        for b in plan.get("local_benchmarks", []):
            ctx_parts.append(
                f"  - Category: {b['category_label']}\n"
                f"    - Your Cost: {format_inr(b['actual_cost'])}\n"
                f"    - Local Typical Estimate: {format_inr(b['local_typical']) if b['benchmark_available'] else 'N/A'}\n"
                f"    - Local Range: {format_inr(b['local_min'])} - {format_inr(b['local_max']) if b['benchmark_available'] else 'N/A'}\n"
                f"    - Source: {b['source'] or 'N/A'} (Reference Month: {b['reference_month'] or 'N/A'})"
            )

    elif intent == "what_if" and simulation_result:
        # Include simulated overrides and comparison side-by-side
        ctx_parts.append("HYPOTHETICAL SIMULATION RESULT (STEP 10 SIMULATOR):")
        ctx_parts.append(f"- Scenario Type: {scenario_type or 'what_if'}")
        
        cur = simulation_result["current"]
        scen = simulation_result["scenario"]
        imp = simulation_result["impact"]
        
        ctx_parts.append(
            f"COMPARISON OUTCOMES:\n"
            f"- Monthly Surplus: Current {format_inr(cur['cash_flow']['monthly_surplus'])}, "
            f"Simulated {format_inr(scen['cash_flow']['monthly_surplus'])} "
            f"(Change: {format_inr(imp['surplus_change'])})\n"
            
            f"- Planning Income: Current {format_inr(cur['income']['planning_income'])}, "
            f"Simulated {format_inr(scen['income']['planning_income'])} "
            f"(Change: {format_inr(imp['income_change'])})\n"
            
            f"- Total Expenses: Current {format_inr(cur['expenses']['total'])}, "
            f"Simulated {format_inr(scen['expenses']['total'])} "
            f"(Change: {format_inr(imp['expense_change'])})\n"
            
            f"- Debt EMI: Current {format_inr(cur['debt']['total_emi'])}, "
            f"Simulated {format_inr(scen['debt']['total_emi'])} "
            f"(Change: {format_inr(imp['emi_change'])})\n"
            
            f"- Emergency Fund Alloc: Current {format_inr(cur['budget']['emergency_fund'])}, "
            f"Simulated {format_inr(scen['budget']['emergency_fund'])}\n"
            
            f"- Goals Capacity: Current {format_inr(cur['budget']['goals'])}, "
            f"Simulated {format_inr(scen['budget']['goals'])}\n"
            
            f"- Investment Capacity: Current {format_inr(cur['budget']['investments'])}, "
            f"Simulated {format_inr(scen['budget']['investments'])}\n"
            
            f"- Outcome Status: {simulation_result['scenario_status']}"
        )
        if simulation_result.get("explanations"):
            ctx_parts.append("SIMULATOR INSIGHTS:")
            for exp in simulation_result["explanations"]:
                ctx_parts.append(f"  - {exp}")

    # Fetch and add Monthly Budget (limits, safe to spend) context if intent is budget or cash flow related
    if intent in ["cash_flow", "budget_explanation", "expense_analysis"]:
        from app.services.monthly_budget.calculator import calculate_monthly_budget
        try:
            budget = calculate_monthly_budget(db, user)
            ctx_parts.append(
                f"\nEXACT MONTHLY SPENDING LIMITS & OPERATING PLAN:\n"
                f"- Safe Discretionary Spend: {format_inr(budget['safe_to_spend_monthly'])}\n"
                f"- Daily Safe limit: {format_inr(budget['safe_to_spend_daily'])}\n"
                f"- Weekly Safe limit: {format_inr(budget['safe_to_spend_weekly'])}\n"
                f"- Total Mandatory Expenses: {format_inr(budget['mandatory_expenses'])}\n"
            )
            ctx_parts.append("EXACT CATEGORY LIMITS:")
            for item in budget["categories"]:
                ctx_parts.append(
                    f"  * {item['category']}: Limit {format_inr(item['recommended_limit'])}, "
                    f"Spent {format_inr(item['current_spending'])}, Remaining {format_inr(item['remaining_limit'])}, "
                    f"Status {item['status']}"
                )
        except Exception:
            pass

    # Fetch and add Investment Recommendations context if intent is investment related
    if intent in ["investment_allocation", "investment_recommendations", "recommendation"]:
        from app.services.investment_recommendation.engine import get_investment_recommendations
        try:
            recs = get_investment_recommendations(db, user)
            best = recs["best_match"]
            ctx_parts.append(
                f"\nPERSONALIZED INVESTMENT RECOMMENDATIONS:\n"
                f"- Best Product Match: {best['investment_type']}\n"
                f"- Suitability Score: {best['suitability_score']}/100\n"
                f"- Recommended Monthly Amount: {format_inr(best['recommended_amount'])}\n"
                f"- Horizon: {best['time_horizon']}, Risk: {best['risk_level']}, Liquidity: {best['liquidity']}\n"
                f"- Match Reason: {best['why_it_matches']}\n"
            )
            if recs["alternatives"]:
                alt = recs["alternatives"][0]
                ctx_parts.append(
                    f"- Alternative Product Match: {alt['investment_type']} (Score: {alt['suitability_score']}/100, Recommended: {format_inr(alt['recommended_amount'])})"
                )
        except Exception:
            pass

    return "\n".join(ctx_parts)
