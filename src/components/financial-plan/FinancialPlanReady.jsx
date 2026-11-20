import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  IndianRupee,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Home,
  ShoppingCart,
  Car,
  Zap,
  Coffee,
  HeartPulse,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PiggyBank,
  Target,
  Sparkles,
  Edit2,
  HelpCircle,
  Clock,
  Award
} from 'lucide-react';

export default function FinancialPlanReady({ onNavigate, onEditProfile }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [budget, setBudget] = useState(null);
  const [investments, setInvestments] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const [budgetRes, investRes, goalsRes] = await Promise.all([
          api.get('/api/planning/monthly-budget', { params: { month: selectedMonth } }),
          api.get('/api/investments/recommendations').catch(() => ({ data: null })),
          api.get('/api/goals').catch(() => ({ data: [] }))
        ]);
        setBudget(budgetRes.data);
        setInvestments(investRes.data);
        setGoals(goalsRes.data || []);
      } catch (err) {
        console.error('Failed to load plan metrics:', err);
        setError('Unable to load your financial plan. Please complete your profile questionnaire.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
        <Activity className="animate-spin text-teal-600 mx-auto mb-4" size={36} />
        <h3 className="font-bold text-slate-800 text-lg mb-1">Building Your Financial Plan...</h3>
        <p className="text-slate-400 text-xs font-semibold">Calculating exact spend, save, and invest limits...</p>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm">
        <AlertTriangle className="text-amber-500 mx-auto mb-4" size={40} />
        <h3 className="font-bold text-slate-800 text-lg mb-2">Plan Needs Profile Data</h3>
        <p className="text-slate-500 text-xs mb-6 font-semibold leading-relaxed">
          {error || 'Complete your financial questionnaire to generate your personalized action plan.'}
        </p>
        <button
          onClick={onEditProfile}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all"
        >
          Complete Financial Profile
        </button>
      </div>
    );
  }

  // --- Calculations for Spend / Save / Invest ---
  const income = Number(budget.planning_income || 0);

  // 1. Total to Spend = Mandatory Expenses + Lifestyle Limit
  const mandatorySpend = Number(budget.mandatory_expenses || 0);
  const lifestyleSpend = Number(budget.safe_to_spend_monthly || budget.lifestyle_limit || 0);
  const totalSpend = mandatorySpend + lifestyleSpend;

  // 2. Total to Save = Emergency Contribution + Goal Contributions
  const emergencySave = Number(budget.emergency_contribution || 0);
  const goalSave = Number(budget.goal_contribution || 0);
  const totalSave = emergencySave + goalSave;

  // 3. Total to Invest = Investment Capacity
  const totalInvest = Number(budget.investment_capacity || 0);

  // Percentages of total income
  const spendPct = income > 0 ? Math.round((totalSpend / income) * 100) : 50;
  const savePct = income > 0 ? Math.round((totalSave / income) * 100) : 20;
  const investPct = income > 0 ? Math.max(0, 100 - spendPct - savePct) : 30;

  // Safe daily spend allowance
  const safeDaily = Number(budget.safe_to_spend_daily || Math.round(lifestyleSpend / 30));

  // Category Icon & Color Mapping
  const getCategoryMeta = (catName) => {
    const name = catName.toLowerCase();
    if (name.includes('rent') || name.includes('housing')) {
      return { icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' };
    }
    if (name.includes('food') || name.includes('grocer')) {
      return { icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
    }
    if (name.includes('transport') || name.includes('fuel') || name.includes('commute')) {
      return { icon: Car, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' };
    }
    if (name.includes('electric') || name.includes('water') || name.includes('internet') || name.includes('mobile')) {
      return { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' };
    }
    if (name.includes('loan') || name.includes('emi') || name.includes('debt')) {
      return { icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
    }
    if (name.includes('health') || name.includes('medic') || name.includes('insurance')) {
      return { icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' };
    }
    if (name.includes('education') || name.includes('course') || name.includes('tuition')) {
      return { icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' };
    }
    return { icon: Coffee, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' };
  };

  // Filter categories with limits > 0 for a clean display
  const activeCategories = (budget.categories || []).filter(
    (c) => Number(c.recommended_limit || c.safe_limit || 0) > 0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Monthly Blueprint
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
            Personal Money Allocation
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Your tailored monthly breakdown: exactly how much to Spend, Save, and Invest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold pr-8 focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-teal-600/10 cursor-pointer transition-all"
          >
            <Edit2 size={13} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 3 HERO PILLARS: SPEND, SAVE, INVEST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PILLAR 1: SPEND */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-white border border-amber-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={16} className="text-amber-600" />
                1. How Much to Spend
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                {spendPct}% of Income
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{totalSpend.toLocaleString('en-IN')}
              <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Covers fixed essentials (housing, bills, EMIs) plus your monthly lifestyle allowance.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-100/80 flex items-center justify-between bg-amber-50/60 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-xs text-amber-900 font-semibold">Safe Daily Spend:</span>
            <span className="text-sm font-black text-amber-800">
              ₹{safeDaily.toLocaleString('en-IN')} <span className="text-[10px] font-semibold text-amber-600">/ day</span>
            </span>
          </div>
        </div>

        {/* PILLAR 2: SAVE */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white border border-emerald-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                2. How Much to Save
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full">
                {savePct}% of Income
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{totalSave.toLocaleString('en-IN')}
              <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Builds your emergency fund reserve and funds short/medium-term milestones.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-100/80 flex items-center justify-between bg-emerald-50/60 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-xs text-emerald-900 font-semibold">Emergency Fund Deposit:</span>
            <span className="text-sm font-black text-emerald-800">
              ₹{emergencySave.toLocaleString('en-IN')} <span className="text-[10px] font-semibold text-emerald-600">/ month</span>
            </span>
          </div>
        </div>

        {/* PILLAR 3: INVEST */}
        <div className="bg-gradient-to-br from-teal-500/10 via-white to-white border border-teal-200 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={16} className="text-teal-600" />
                3. How Much to Invest
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-teal-100 text-teal-900 rounded-full">
                {investPct}% of Income
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{totalInvest.toLocaleString('en-IN')}
              <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Dedicated capital for long-term compound growth via SIPs, index funds, and FDs.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-teal-100/80 flex items-center justify-between bg-teal-50/60 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-xs text-teal-900 font-semibold">Suggested SIP Target:</span>
            <span className="text-sm font-black text-teal-800">
              ₹{totalInvest.toLocaleString('en-IN')} <span className="text-[10px] font-semibold text-teal-600">/ month</span>
            </span>
          </div>
        </div>
      </div>

      {/* Visual Income Distribution Ratio Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold text-slate-700 mb-2.5 gap-1">
          <span>Monthly Income Split: ₹{income.toLocaleString('en-IN')}</span>
          <span className="text-slate-400 font-medium text-[11px]">Recommended 50 / 20 / 30 Allocation</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div
            style={{ width: `${spendPct}%` }}
            className="bg-amber-500 transition-all"
            title={`Spend: ${spendPct}%`}
          />
          <div
            style={{ width: `${savePct}%` }}
            className="bg-emerald-500 transition-all"
            title={`Save: ${savePct}%`}
          />
          <div
            style={{ width: `${investPct}%` }}
            className="bg-teal-500 transition-all"
            title={`Invest: ${investPct}%`}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-50 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Spend: <strong>₹{totalSpend.toLocaleString('en-IN')}</strong> ({spendPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Save: <strong>₹{totalSave.toLocaleString('en-IN')}</strong> ({savePct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
            <span>Invest: <strong>₹{totalInvest.toLocaleString('en-IN')}</strong> ({investPct}%)</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: HOW MUCH TO SPEND (CATEGORY BREAKDOWN) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="text-amber-500" size={20} />
              Where to Spend: Particular Category Limits
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Authoritative spending targets so you never overspend in any category.
            </p>
          </div>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl shrink-0">
            Total Spend Limit: ₹{totalSpend.toLocaleString('en-IN')}/mo
          </span>
        </div>

        {activeCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCategories.map((cat, idx) => {
              const meta = getCategoryMeta(cat.category);
              const Icon = meta.icon;
              const limit = Number(cat.recommended_limit || cat.safe_limit || 0);
              const catPct = income > 0 ? Math.round((limit / income) * 100) : 0;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/60 hover:bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs">{cat.category}</h3>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {catPct > 0 ? `${catPct}% of income` : 'Target limit'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-800">₹{limit.toLocaleString('en-IN')}</div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Recommended
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No specific categories recorded. Tap 'Edit Profile' to enter your expenses.
          </p>
        )}
      </div>

      {/* SECTION 2: HOW MUCH TO SAVE (SAVINGS & EMERGENCY FUND) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={20} />
              How Much to Save: Reserves & Goals
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Keep your financial foundation solid before taking market risks.
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl shrink-0">
            Total Monthly Savings: ₹{totalSave.toLocaleString('en-IN')}/mo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Emergency Fund Card */}
          <div className="border border-emerald-100 bg-emerald-50/30 p-4.5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PiggyBank size={16} className="text-emerald-600" />
                  Emergency Fund Deposit
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  Priority #1
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{emergencySave.toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Deposit this amount monthly into a liquid savings account or sweep fixed deposit until you reach 3–6 months of essential living costs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
              <span>Target Reserve:</span>
              <span>₹{(mandatorySpend * 3).toLocaleString('en-IN')} (3 Months Cushion)</span>
            </div>
          </div>

          {/* Goal Savings or Buffer Card */}
          <div className="border border-teal-100 bg-teal-50/30 p-4.5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={16} className="text-teal-600" />
                  Milestone & Goal Savings
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                  {goals.length} Declared Goals
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{goalSave.toLocaleString('en-IN')}
                <span className="text-xs font-semibold text-slate-400 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                Allocated monthly towards your stated financial dreams (education, travel, gadgets, vehicle).
              </p>
            </div>

            {goals.length > 0 ? (
              <div className="mt-4 pt-3 border-t border-teal-100 space-y-1.5">
                {goals.slice(0, 2).map((g) => (
                  <div key={g.id} className="flex justify-between text-xs text-slate-700 font-semibold">
                    <span>{g.goal_name || g.name}</span>
                    <span className="text-teal-700 font-bold">Target: ₹{Number(g.target_amount || g.targetAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-teal-100 text-xs text-slate-400 font-medium">
                No custom goals declared yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: HOW MUCH TO INVEST (INVESTMENT RECOMMENDATIONS) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-teal-500" size={20} />
              How Much to Invest: Smart Asset Allocation
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Put your surplus money to work with systematic monthly wealth compounding.
            </p>
          </div>
          <span className="text-xs font-extrabold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-xl shrink-0">
            Total Investment Capacity: ₹{totalInvest.toLocaleString('en-IN')}/mo
          </span>
        </div>

        {totalInvest > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Asset 1: Equity / Index SIP */}
            <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md uppercase">
                    50% Allocation
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    High Growth
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Index Funds / Equity SIP
                </h3>
                <div className="text-xl font-black text-teal-700 mt-1.5">
                  ₹{Math.round(totalInvest * 0.5).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Start an automated monthly SIP in a broad Nifty 50 Index Fund or ELSS for inflation-beating wealth creation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                Horizon: 5+ Years • Compounding: ~12%
              </div>
            </div>

            {/* Asset 2: Fixed Income / PPF / Debt */}
            <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                    30% Allocation
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Low Risk
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  PPF / Fixed Deposit / Debt
                </h3>
                <div className="text-xl font-black text-blue-700 mt-1.5">
                  ₹{Math.round(totalInvest * 0.3).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Guaranteed capital protection via Public Provident Fund (PPF) or Bank Recurring Deposits with zero market volatility.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                Horizon: 3–5 Years • Safe Guaranteed Returns
              </div>
            </div>

            {/* Asset 3: Gold / SGB / Liquid Buffer */}
            <div className="border border-slate-100 bg-slate-50/50 p-4.5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase">
                    20% Allocation
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    Hedge
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Gold ETFs / SGB / Liquid
                </h3>
                <div className="text-xl font-black text-amber-700 mt-1.5">
                  ₹{Math.round(totalInvest * 0.2).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-slate-400 ml-1">/ month</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Sovereign Gold Bonds (SGB) or digital Gold ETFs to hedge your portfolio against currency inflation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                Horizon: Flexible • Market Inflation Hedge
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
            Currently your monthly expenses match your income. Build your savings buffer first to unlock monthly investment capacity!
          </div>
        )}
      </div>
    </div>
  );
}
