import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Edit2,
  DollarSign,
  TrendingDown,
  Info,
  Calendar,
  Lock,
  Plus,
  Loader2
} from 'lucide-react';

export default function FinancialPlan({ onEditProfile }) {
  const [plan, setPlan] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlanData();
  }, []);

  const fetchPlanData = async () => {
    setLoading(true);
    setError('');
    try {
      const [planRes, allocRes] = await Promise.all([
        api.get('/api/planning/monthly-plan'),
        api.get('/api/planning/investment-allocation')
      ]);
      setPlan(planRes.data);
      setAllocation(allocRes.data);
    } catch (err) {
      console.error("Error loading financial planning data:", err);
      setError(
        err.response?.data?.detail || 
        'Unable to generate your financial plan. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-card bg-white p-8 text-center shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <h3 className="font-bold text-slate-800 text-lg mb-1">Analyzing your financial profile...</h3>
        <p className="text-slate-400 text-xs font-semibold">Correlating income, expenses, debts, goals, and regional costs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card bg-white p-6 md:p-8 shadow-xl shadow-slate-100/50 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">Error Generating Plan</h3>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button
          onClick={fetchPlanData}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-teal-600/10"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!plan || !allocation) return null;

  // Formatting helpers
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getHealthColor = (status) => {
    if (status === 'Healthy') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Needs Attention') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getGoalStatusColor = (status) => {
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'On Track') return 'bg-teal-50 text-teal-700 border-teal-100';
    if (status === 'Challenging') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getCategoryColor = (cat) => {
    if (cat.includes("Preservation")) return "bg-emerald-500";
    if (cat.includes("Stable")) return "bg-blue-500";
    return "bg-teal-500";
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & General Health summary */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md shadow-slate-100/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Your Personalized Monthly Financial Plan</h1>
          <p className="text-xs text-slate-400 mt-0.5">Deterministic rule-based budgeting and investment suitability analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 border rounded-xl font-bold text-xs uppercase tracking-wider ${getHealthColor(plan.health_status)}`}>
            Status: {plan.health_status}
          </div>
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1 text-xs font-semibold border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl cursor-pointer transition-colors bg-white text-slate-600"
          >
            <Edit2 size={13} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* 2. Top-level status indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Income Card */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider">Planning Income</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {formatINR(plan.income.planning_income)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">
            Salary: {formatINR(plan.income.salary)} + Other: {formatINR(plan.income.other_income)} + Variable (50%): {formatINR(plan.income.variable_income * 0.5)}
          </span>
        </div>

        {/* Debt Burden Card */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider">Debt Burden</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {formatINR(plan.debt.total_emi)} <span className="text-xs text-slate-400 font-semibold">/ Mo</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block flex justify-between">
            <span>DTI Ratio: {(plan.debt.debt_to_income_ratio * 100).toFixed(1)}%</span>
            <span className="font-bold uppercase text-[9px]">{plan.debt.status}</span>
          </span>
        </div>

        {/* Emergency Fund Card */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider">Emergency Fund</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-1">
            {formatINR(plan.emergency_fund.current)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block flex justify-between">
            <span>Coverage: {plan.emergency_fund.months_coverage.toFixed(1)} / {plan.emergency_fund.target_months} mo</span>
            <span className="font-bold uppercase text-[9px]">{plan.emergency_fund.status}</span>
          </span>
        </div>

        {/* Surplus / Cash Flow Card */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider">Monthly Surplus</span>
          <span className={`text-2xl font-extrabold block mt-1 ${plan.cash_flow.monthly_surplus >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            {formatINR(plan.cash_flow.monthly_surplus)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block flex justify-between">
            <span>Surplus Ratio: {plan.cash_flow.surplus_percentage.toFixed(1)}%</span>
            <span className="font-bold uppercase text-[9px]">{plan.cash_flow.status}</span>
          </span>
        </div>
      </div>

      {/* 3. Budget Allocation Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Reconciled Monthly Budget Allocation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Budget Category</th>
                <th className="p-3 text-right">Allocation Amount</th>
                <th className="p-3 text-right">% of Income</th>
                <th className="p-3">Planning Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Essential Expenses</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.essential)}</td>
                <td className="p-3 text-right">{((plan.budget.essential / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Fixed expenses, rent/maintenance, utilities, food groceries</td>
              </tr>
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Mandatory Debt Payments</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.loan_payments)}</td>
                <td className="p-3 text-right">{((plan.budget.loan_payments / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">All debt obligations, credit cards, education & vehicle EMIs</td>
              </tr>
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Lifestyle Expenses</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.lifestyle)}</td>
                <td className="p-3 text-right">{((plan.budget.lifestyle / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Discretionary spending, entertainment, shopping, dining out</td>
              </tr>
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Emergency Fund Building</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.emergency_fund)}</td>
                <td className="p-3 text-right">{((plan.budget.emergency_fund / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Saves toward liquid safety buffer (allocated at 30% of cash flow)</td>
              </tr>
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Financial Goal Savings</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.goals)}</td>
                <td className="p-3 text-right">{((plan.budget.goals / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Required monthly contributions toward timelines (prioritized by deadline)</td>
              </tr>
              <tr className="hover:bg-slate-50/30">
                <td className="p-3 font-semibold text-slate-800">Investment Capacity</td>
                <td className="p-3 text-right text-teal-600">{formatINR(plan.budget.investments)}</td>
                <td className="p-3 text-right text-teal-600">{((plan.budget.investments / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Leftover financial capacity available for wealth creation</td>
              </tr>
              <tr className="hover:bg-slate-50/30 bg-slate-50/20">
                <td className="p-3 font-semibold text-slate-800">Flexible Buffer</td>
                <td className="p-3 text-right text-slate-700">{formatINR(plan.budget.buffer)}</td>
                <td className="p-3 text-right">{((plan.budget.buffer / plan.income.planning_income) * 100).toFixed(1)}%</td>
                <td className="p-3 text-slate-400">Residual surplus mapping (deficit representation if negative)</td>
              </tr>
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td className="p-3 text-slate-800 uppercase tracking-wider text-[10px]">Total Planning Budget</td>
                <td className="p-3 text-right text-slate-900">
                  {formatINR(
                    plan.budget.essential + 
                    plan.budget.loan_payments + 
                    plan.budget.lifestyle + 
                    plan.budget.emergency_fund + 
                    plan.budget.goals + 
                    plan.budget.investments + 
                    plan.budget.buffer
                  )}
                </td>
                <td className="p-3 text-right">100.0%</td>
                <td className="p-3 text-slate-500 uppercase tracking-wider text-[10px]">Reconciles perfectly with Planning Income</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* STEP 6: Savings & Investment Allocation */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Personalized Savings & Investment Allocation</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">High-level distribution based on stability rules and risk suitability</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-0.5 border border-slate-200 rounded-full font-bold text-[10px] text-slate-600 bg-slate-50 uppercase tracking-wider">
              Horizon: {allocation.profile.horizon || '—'}
            </span>
            <span className="px-2.5 py-0.5 border border-slate-200 rounded-full font-bold text-[10px] text-slate-600 bg-slate-50 uppercase tracking-wider">
              Experience: {allocation.profile.experience || '—'}
            </span>
          </div>
        </div>

        {/* Warnings for suitability */}
        {allocation.warnings.length > 0 && (
          <div className="space-y-2 mb-4">
            {allocation.warnings.map((warn, i) => (
              <div key={i} className="flex items-start gap-2.5 border border-amber-100 bg-amber-50/40 p-3 rounded-xl text-xs">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-bold text-amber-800">{warn.title}</h4>
                  <p className="text-amber-600 font-medium mt-0.5">{warn.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status representation */}
        {allocation.allocation_status === "paused" ? (
          <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-xl text-center text-xs">
            <AlertTriangle className="text-slate-400 mx-auto mb-2" size={24} />
            <h4 className="font-bold text-slate-700">Investment Allocation Paused</h4>
            <p className="text-slate-400 font-medium mt-1">
              Your investment allocation has been fully paused to protect your financial security. Re-build emergency reserves or clear deficit balances first.
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between mb-6">
              <div>
                <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider">Effective Investment Capacity</span>
                <span className="text-xl font-black text-slate-800 block mt-0.5">{formatINR(allocation.investment_capacity)} / Month</span>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold rounded-lg text-xs uppercase tracking-wider">
                Active Ready
              </span>
            </div>

            {/* Visual allocation progress bars */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-xs">Target Allocation Breakdown:</h4>
              <div className="space-y-3">
                {allocation.allocations.map((item, idx) => (
                  <div key={idx} className="border border-slate-100 p-4 rounded-xl hover:bg-slate-50/30 transition-colors">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(item.category)}`}></span>
                        {item.category}
                      </span>
                      <span>
                        {item.percentage}% ({formatINR(item.monthly_amount)} / mo)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${getCategoryColor(item.category)}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      <strong>Suitability:</strong> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Allocation explanations */}
        {allocation.explanations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-700 text-xs">Allocation Explanations:</h4>
            {allocation.explanations.map((exp, i) => (
              <p key={i} className="text-[11px] text-slate-500 font-medium leading-relaxed flex gap-2">
                <span className="text-teal-600">•</span>
                <span>{exp}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recommendations & Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recommendations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Prioritized Recommendations</h3>
            {plan.recommendations.length > 0 ? (
              <div className="space-y-3.5">
                {plan.recommendations.map((rec, i) => (
                  <div key={i} className="border border-slate-100 p-3.5 rounded-xl bg-slate-50/30 relative flex gap-3">
                    <div className="mt-0.5">
                      {rec.priority === 'high' ? (
                        <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center text-[10px] font-bold">!</div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center text-[10px] font-bold">i</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{rec.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1"><strong>Reason:</strong> {rec.reason}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5"><strong>Impact:</strong> {rec.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-8">
                Your finances are aligned! No high-priority recommendations are currently required.
              </div>
            )}
          </div>
        </div>

        {/* Explanations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Why This Plan?</h3>
          <div className="space-y-3">
            {plan.explanations.map((expl, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/40 p-2.5 rounded-lg border border-slate-50">
                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{expl}</span>
              </div>
            ))}
            <div className="flex gap-2 text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/40 p-2.5 rounded-lg border border-slate-50">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span>Investment room is determined dynamically as the remainder of your surplus after securing emergency targets and savings goals. High-level profile preference: <strong>{plan.investment.risk_profile}</strong>.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Financial Goals Progress & Feasibility */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Financial Goals Timeline Analysis</h3>
        {plan.goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.goals.map((g) => {
              const remaining = g.target_amount - g.current_amount;
              return (
                <div key={g.id} className="border border-slate-100 p-4 rounded-xl shadow-xs bg-slate-50/20 relative flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-slate-800 font-bold text-sm block">{g.goal_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 flex items-center gap-1">
                        <Calendar size={11} />
                        Deadline: {g.target_date} ({g.months_remaining} months remaining)
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getGoalStatusColor(g.status)}`}>
                      {g.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-400 uppercase">
                    <div>
                      <span className="block text-[9px]">Target</span>
                      <span className="text-slate-700 font-bold">{formatINR(g.target_amount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px]">Saved</span>
                      <span className="text-teal-600 font-bold">{formatINR(g.current_amount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px]">Monthly Req.</span>
                      <span className="text-slate-700 font-bold">{formatINR(g.required_monthly_contribution)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>Goal progress</span>
                      <span>{g.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${g.progress_percent}%` }}></div>
                    </div>
                  </div>

                  {g.status !== 'Completed' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-400">Allocated this Month:</span>
                      <span className={g.allocated_contribution > 0 ? 'text-teal-600' : 'text-slate-400'}>
                        {formatINR(g.allocated_contribution)} / mo
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-400 text-xs py-8">
            No savings goals have been configured yet.
          </div>
        )}
      </div>

      {/* 6. Local Cost Benchmarks Comparison */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">Local Cost Benchmarks Comparison</h3>
        <p className="text-[10px] text-slate-400 font-semibold mb-4 leading-relaxed">
          Comparing your declared expenses against typical local estimates for family size. Benchmarks represent local references (Numbeo, CPI validation) and are not guaranteed prices.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Expense Category</th>
                <th className="p-3 text-right">Your Spending</th>
                <th className="p-3 text-right">Local Typical</th>
                <th className="p-3 text-right">Difference</th>
                <th className="p-3">Reference Source / Month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {plan.local_benchmarks.map((bench, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30">
                  <td className="p-3 font-semibold text-slate-800">{bench.category_label}</td>
                  <td className="p-3 text-right text-slate-700">{formatINR(bench.actual_cost)}</td>
                  {bench.benchmark_available ? (
                    <>
                      <td className="p-3 text-right text-slate-500">{formatINR(bench.local_typical)}</td>
                      <td className={`p-3 text-right font-bold ${bench.difference_from_typical > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {bench.difference_from_typical > 0 ? '+' : ''}{formatINR(bench.difference_from_typical)} ({bench.percentage_difference > 0 ? '+' : ''}{bench.percentage_difference.toFixed(1)}%)
                      </td>
                      <td className="p-3 text-slate-400">
                        {bench.source} ({bench.reference_month})
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-center text-slate-300 font-medium" colSpan="3">
                        Benchmark Not Available for City
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Disclaimer */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 font-semibold leading-relaxed">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <span>{allocation.disclaimer}</span>
      </div>
    </div>
  );
}
