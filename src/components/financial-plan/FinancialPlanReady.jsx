import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import MonthlyFinancialPlan from '../financial-calendar/MonthlyFinancialPlan';
import MonthlyReview from '../financial-calendar/MonthlyReview';
import LocationComparisonWidget from './LocationComparisonWidget';
import {
  IndianRupee,
  CheckSquare,
  AlertTriangle,
  Info,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Percent,
  HelpCircle,
  X,
  MapPin,
  FileText
} from 'lucide-react';

export default function FinancialPlanReady({ onNavigate, onEditProfile }) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [budget, setBudget] = useState(null);
  const [investments, setInvestments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExplanation, setSelectedExplanation] = useState(null);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = -2; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  useEffect(() => {
    const today = new Date();
    const curVal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(curVal);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [budgetRes, investRes] = await Promise.all([
          api.get(`/api/planning/monthly-budget`, { params: { month: selectedMonth } }),
          api.get(`/api/investments/recommendations`)
        ]);
        setBudget(budgetRes.data);
        setInvestments(investRes.data);
      } catch (err) {
        console.error("Failed to load operating plan", err);
        setError("Unable to load monthly plan metrics. Please verify your onboarding profile is registered.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 font-semibold">
        <Activity className="animate-spin text-teal-600 mb-4" size={32} />
        <p className="text-sm">Loading your monthly financial operating plan...</p>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm">
        <AlertTriangle className="text-rose-600 mx-auto mb-4" size={36} />
        <h3 className="font-bold text-slate-800 text-lg mb-2">Operating Plan Unavailable</h3>
        <p className="text-slate-500 text-xs mb-6 font-semibold leading-relaxed">
          {error || "Complete your profile onboarding to generate an actionable monthly financial plan."}
        </p>
        <button
          onClick={onEditProfile}
          className="bg-teal-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer hover:bg-teal-700 transition-colors"
        >
          Complete Onboarding Profile
        </button>
      </div>
    );
  }

  const isDeficit = budget.safe_to_spend_monthly <= 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">My Monthly Money Plan</h2>
          <p className="text-slate-400 text-xs font-semibold">Real-data salary split, three category limits, and safe-to-spend breakdown.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLocationDrawer(!showLocationDrawer)}
            className="flex items-center gap-1.5 bg-teal-50 border border-teal-200/60 text-teal-700 text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-teal-100/60 transition-colors"
          >
            <MapPin size={14} /> Relocation Cost Simulator
          </button>

          <div className="relative inline-block text-left">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-56 appearance-none bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold font-semibold pr-8 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Relocation Drawer */}
      {showLocationDrawer && (
        <LocationComparisonWidget currentCity={budget.benchmark_status.includes("Coimbatore") ? "Coimbatore" : "Bengaluru"} />
      )}

      {/* Warnings & Alerts */}
      {budget.warnings && budget.warnings.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle size={16} />
            High Priority Financial Warnings
          </h3>
          <div className="space-y-2">
            {budget.warnings.map((w, idx) => (
              <p key={idx} className="text-xs font-semibold text-rose-600 leading-relaxed">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Salary Split Flow */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dynamic Salary Split Breakdown</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Income</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.planning_income.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Mandatory</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.mandatory_expenses.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Emergency</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.emergency_contribution.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Goals</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.goal_contribution.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Investments</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.investment_capacity.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 font-semibold block">Flexible</span>
            <span className="text-xs font-extrabold text-slate-800">₹{budget.safe_to_spend_monthly.toLocaleString()}</span>
          </div>
          <div className="bg-teal-50 border border-teal-100 p-3 rounded-2xl">
            <span className="text-[10px] text-teal-600 font-semibold block">Safe Daily</span>
            <span className="text-xs font-extrabold text-teal-800">₹{budget.safe_to_spend_daily.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Category Spending Limits Table */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Category Spending Limits Log</h3>
            <p className="text-slate-400 text-xs font-medium">Comparing User Actual Spend vs 6-Mo History vs City Benchmark with Recommended, Safe, and Hard limits.</p>
          </div>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
            {budget.benchmark_status}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2">Classification</th>
                <th className="pb-3 px-2">Your Spending</th>
                <th className="pb-3 px-2">Local Benchmark</th>
                <th className="pb-3 px-2">Recommended</th>
                <th className="pb-3 px-2">Safe Limit</th>
                <th className="pb-3 px-2">Hard Limit</th>
                <th className="pb-3 px-2">Variance</th>
                <th className="pb-3 px-2 text-center">Why?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {budget.categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">{cat.category}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      cat.data_classification === 'ACTUAL' ? 'bg-emerald-100 text-emerald-800' :
                      cat.data_classification === 'HISTORICAL' ? 'bg-sky-100 text-sky-800' :
                      cat.data_classification === 'BENCHMARK' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cat.data_classification}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-700">
                    {cat.current_spending !== null ? `₹${cat.current_spending.toLocaleString()}` : <span className="text-slate-400 italic">Not Recorded</span>}
                  </td>
                  <td className="py-3 px-2">
                    {cat.local_benchmark !== null ? `₹${cat.local_benchmark.toLocaleString()}` : <span className="text-slate-400 italic">Unavailable</span>}
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-800">₹{cat.recommended_limit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-teal-700 font-semibold">₹{cat.safe_limit.toLocaleString()}</td>
                  <td className="py-3 px-2 text-rose-700 font-semibold">₹{cat.hard_limit.toLocaleString()}</td>
                  <td className="py-3 px-2">
                    {cat.variance_from_benchmark !== null ? (
                      <span className={`font-semibold ${cat.variance_from_benchmark > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {cat.variance_from_benchmark > 0 ? '+' : ''}₹{cat.variance_from_benchmark.toLocaleString()} ({cat.variance_percentage}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => setSelectedExplanation(cat.explanation_object)}
                      className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      title="Explain calculation"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popover Explanation Modal */}
      {selectedExplanation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <FileText size={18} /> Calculation Provenance & Reasoning
              </div>
              <button
                onClick={() => setSelectedExplanation(null)}
                className="p-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Metric</div>
              <div className="text-base font-extrabold text-slate-800">{selectedExplanation.metric}</div>
              <div className="text-xl font-black text-teal-600">₹{selectedExplanation.value.toLocaleString()}</div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
              <span className="font-bold text-slate-800 block">Calculation Basis:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedExplanation.basis.map((b, idx) => (
                  <span key={idx} className="bg-teal-50 text-teal-700 font-semibold px-2.5 py-1 rounded-lg text-[10px]">
                    {b.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 font-medium">
              {selectedExplanation.explanation}
            </div>

            {selectedExplanation.provenance && (
              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 font-medium space-y-1">
                <div>Source: <span className="text-slate-600 font-semibold">{selectedExplanation.provenance.source}</span></div>
                <div>Freshness Status: <span className="text-emerald-600 font-semibold">{selectedExplanation.provenance.freshness_status}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
