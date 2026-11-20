import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ArrowRight,
  TrendingDown,
  Activity,
  Heart,
  Target,
  Play,
  Sparkles,
  Sliders,
  Compass,
  BookOpen,
  Calculator,
  ShieldCheck,
  Zap,
  Home,
  ShoppingCart,
  Car,
  CreditCard,
  Coffee,
  HeartPulse,
  GraduationCap,
  Layers
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import FinancialLimitsTuner from './FinancialLimitsTuner';
import InvestmentIdeasHub from './InvestmentIdeasHub';
import FinancialPlanningGuide from './FinancialPlanningGuide';

export default function FinancialDashboard({ onEditProfile, onNavigate }) {
  const [plan, setPlan] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [budget, setBudget] = useState(null);
  const [goalsProgress, setGoalsProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDashboardTab, setActiveDashboardTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [planRes, allocRes, goalsRes, budgetRes] = await Promise.all([
        api.get('/api/planning/monthly-plan').catch(err => {
          console.error("monthly-plan error:", err);
          return { data: null };
        }),
        api.get('/api/planning/investment-allocation').catch(err => {
          console.error("investment-allocation error:", err);
          return { data: null };
        }),
        api.get('/api/goals/progress').catch(() => ({ data: [] })),
        api.get('/api/planning/monthly-budget').catch(() => ({ data: null }))
      ]);

      if (!planRes.data) {
        throw new Error("Unable to load financial plan metrics. Please complete or refresh your profile.");
      }

      setPlan(planRes.data);
      setAllocation(allocRes.data || {
        investment_capacity: 0,
        allocation_status: 'paused',
        allocations: [],
        warnings: [],
        profile: { risk_tolerance: 'Moderate', horizon: '5+ years', preference: 'Balanced Growth' },
        disclaimer: 'Investment suggestions are for educational guidance.'
      });
      setGoalsProgress(goalsRes.data || []);
      setBudget(budgetRes?.data || null);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(
        err.response?.data?.detail || 
        err.message ||
        'Unable to load your financial dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-card bg-white p-8 text-center shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center min-h-[300px]">
        <Activity className="animate-pulse text-teal-600 mb-4" size={40} />
        <h3 className="font-bold text-slate-800 text-lg mb-1">Preparing your financial dashboard...</h3>
        <p className="text-slate-400 text-xs font-semibold">Consuming planning engine profiles and suitability constraints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card bg-white p-6 md:p-8 shadow-xl shadow-slate-100/50 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">Error Loading Dashboard</h3>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors cursor-pointer shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!plan) return null;

  // Format helper for Indian Rupee
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // User-friendly date formatter: 2026-12-31 -> 31 Dec 2026
  const formatDateString = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 2) {
        // YYYY-MM
        const d = new Date(parts[0], parts[1] - 1, 1);
        return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Savings rate calculation
  const planningIncome = plan.income.planning_income;
  const surplus = plan.cash_flow.monthly_surplus;
  const savingsRate = planningIncome > 0 ? (surplus / planningIncome) * 100 : 0;

  // Sum categories for Monthly Expenses Summary (Essential + Lifestyle + Loan EMIs)
  const monthlyExpenses = plan.expenses.essential + plan.expenses.lifestyle + plan.debt.total_emi;

  // Verify budget reconciliation
  const budgetSum = 
    plan.budget.essential + 
    plan.budget.loan_payments + 
    plan.budget.lifestyle + 
    plan.budget.emergency_fund + 
    plan.budget.goals + 
    plan.budget.investments + 
    plan.budget.buffer;

  // Check budget balanced invariant (floating-point tolerance check)
  const budgetReconciled = Math.abs(budgetSum - planningIncome) < 0.1;

  // Chart setup
  const allocationColors = {
    "Capital Preservation": "#0ea5e9", // sky-500
    "Stable / Fixed-Income-Oriented": "#3b82f6", // blue-500
    "Growth-Oriented": "#14b8a6" // teal-500
  };

  const chartData = (allocation?.allocations || []).map(item => ({
    name: item.category || item.label || 'Asset',
    value: item.percentage || 0,
    color: allocationColors[item.category] || "#94a3b8"
  }));

  const getHealthTagColor = (status) => {
    if (status === 'Healthy' || status === 'Adequately Funded' || status === 'Completed' || status === 'On Track') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (status === 'Needs Attention' || status === 'Partially Funded' || status === 'Challenging') {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getGoalStatusColor = (status) => {
    if (status === 'Completed' || status === 'On Track') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (status === 'Challenging') {
      return 'bg-amber-50 text-amber-700 border-amber-100';
    }
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getComparisonLabel = (bench) => {
    if (!bench.benchmark_available) return "Local benchmark unavailable";
    const diff = bench.difference_from_typical;
    if (diff > 0) return "Above local typical estimate";
    if (diff < 0) return "Below local typical estimate";
    return "Within local reference range";
  };

  // Financial Health Score Calculation (0 - 100)
  const healthScore = (() => {
    let score = 0;
    // 1. Savings Rate (up to 25 pts)
    if (savingsRate >= 25) score += 25;
    else if (savingsRate >= 15) score += 20;
    else if (savingsRate >= 5) score += 12;
    else if (savingsRate > 0) score += 6;

    // 2. Debt to Income (up to 25 pts)
    const dti = (plan.debt?.debt_to_income_ratio || 0) * 100;
    if (dti === 0) score += 25;
    else if (dti < 20) score += 22;
    else if (dti < 35) score += 18;
    else if (dti < 50) score += 10;
    else score += 5;

    // 3. Emergency Fund Ratio (up to 25 pts)
    const efActual = plan.emergency_fund?.current || 0;
    const efTarget = plan.emergency_fund?.recommended_target || 1;
    const efRatio = efActual / efTarget;
    if (efRatio >= 1.0) score += 25;
    else if (efRatio >= 0.5) score += 18;
    else if (efRatio >= 0.2) score += 12;
    else score += 6;

    // 4. Cash Flow & Budget Stability (up to 25 pts)
    if (surplus > 0) score += 18;
    if (plan.health_status === 'Healthy') score += 7;
    else if (plan.health_status === 'Needs Attention') score += 3;

    return Math.min(100, Math.max(15, score));
  })();

  // 50 / 30 / 20 Proportions
  const needsPct = planningIncome > 0 ? Math.round(((plan.expenses.essential + plan.debt.total_emi) / planningIncome) * 100) : 50;
  const wantsPct = planningIncome > 0 ? Math.round((plan.expenses.lifestyle / planningIncome) * 100) : 30;
  const savingsPct = planningIncome > 0 ? Math.max(0, 100 - needsPct - wantsPct) : 20;

  // Category Limits Mapping for "How Much Limit for Everything"
  const categoryLimitsList = useMemo(() => {
    if (budget && budget.categories && budget.categories.length > 0) {
      return budget.categories.map(c => {
        const name = c.category_name || '';
        let icon = Coffee;
        let color = 'text-teal-600';
        if (name.includes('Rent') || name.includes('Housing')) { icon = Home; color = 'text-indigo-600'; }
        else if (name.includes('Food') || name.includes('Grocer')) { icon = ShoppingCart; color = 'text-emerald-600'; }
        else if (name.includes('Electric') || name.includes('Water') || name.includes('Internet') || name.includes('Mobile')) { icon = Zap; color = 'text-amber-600'; }
        else if (name.includes('Transport') || name.includes('Fuel')) { icon = Car; color = 'text-blue-600'; }
        else if (name.includes('Loan') || name.includes('EMI') || name.includes('Debt')) { icon = CreditCard; color = 'text-rose-600'; }
        else if (name.includes('Health') || name.includes('Insurance')) { icon = HeartPulse; color = 'text-rose-500'; }
        else if (name.includes('Education')) { icon = GraduationCap; color = 'text-purple-600'; }

        return {
          name: c.category_name,
          group: c.category_group === 'Mandatory Essentials' ? 'Essential' : 'Flexible',
          icon,
          color,
          recommended: Number(c.recommended_limit || c.current_actual || 0),
          safe: Number(c.safe_limit || c.recommended_limit || 0),
          hard: Number(c.hard_limit || Math.round((c.safe_limit || 0) * 1.15))
        };
      });
    }

    const ess = plan?.expenses?.essential || 11300;
    const life = plan?.expenses?.lifestyle || 2500;
    const emi = plan?.debt?.total_emi || 0;

    return [
      { name: 'Housing & Rent', group: 'Essential', icon: Home, color: 'text-indigo-600', recommended: Math.round(ess * 0.45), safe: Math.round(ess * 0.45), hard: Math.round(ess * 0.50) },
      { name: 'Food & Groceries', group: 'Essential', icon: ShoppingCart, color: 'text-emerald-600', recommended: Math.round(ess * 0.30), safe: Math.round(ess * 0.32), hard: Math.round(ess * 0.36) },
      { name: 'Utilities & Wi-Fi', group: 'Essential', icon: Zap, color: 'text-amber-600', recommended: Math.round(ess * 0.15), safe: Math.round(ess * 0.16), hard: Math.round(ess * 0.18) },
      { name: 'Transportation', group: 'Essential', icon: Car, color: 'text-blue-600', recommended: Math.round(ess * 0.10), safe: Math.round(ess * 0.11), hard: Math.round(ess * 0.13) },
      { name: 'Loan EMIs / Debt', group: 'Obligation', icon: CreditCard, color: 'text-rose-600', recommended: emi, safe: emi, hard: emi },
      { name: 'Lifestyle & Dining Out', group: 'Flexible', icon: Coffee, color: 'text-amber-600', recommended: Math.round(life * 0.60), safe: Math.round(life * 0.65), hard: Math.round(life * 0.75) },
      { name: 'Shopping & Leisure', group: 'Flexible', icon: Coffee, color: 'text-teal-600', recommended: Math.round(life * 0.40), safe: Math.round(life * 0.45), hard: Math.round(life * 0.50) }
    ];
  }, [budget, plan]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header with navigation option */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md shadow-slate-100/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Financial Command Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Aggregated report of your onboarding intelligence, budgets, and savings plan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('expenses')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-teal-600/10"
            >
              <PlusCircleIcon />
              Add Expense
            </button>
          )}
          <button
            onClick={() => onNavigate && onNavigate('simulator')}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors bg-white text-slate-600 shadow-xs"
          >
            <Play size={12} className="text-teal-600" />
            What-If Simulator
          </button>
          <button
            onClick={() => onNavigate && onNavigate('assistant')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100 px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles size={13} className="text-teal-600" />
            AI Financial Assistant
          </button>
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors bg-white text-slate-600 shadow-xs"
          >
            <Edit2Icon />
            Modify Financial Profile
          </button>
        </div>
      </div>

      {/* Interactive Feature Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 text-xs font-bold no-scrollbar sm:flex-wrap">
        <button
          onClick={() => setActiveDashboardTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeDashboardTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Activity size={14} className={activeDashboardTab === 'overview' ? 'text-teal-400' : 'text-slate-400'} />
          Command Overview
        </button>

        <button
          onClick={() => setActiveDashboardTab('limits')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeDashboardTab === 'limits'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
              : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Sliders size={14} className={activeDashboardTab === 'limits' ? 'text-white' : 'text-teal-600'} />
          Set Financial Limits & Safe-to-Spend
        </button>

        <button
          onClick={() => setActiveDashboardTab('investments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeDashboardTab === 'investments'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
              : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <Compass size={14} className={activeDashboardTab === 'investments' ? 'text-white' : 'text-teal-600'} />
          Investment Ideas & SIP Calculator
        </button>

        <button
          onClick={() => setActiveDashboardTab('playbook')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeDashboardTab === 'playbook'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
              : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          <BookOpen size={14} className={activeDashboardTab === 'playbook' ? 'text-white' : 'text-teal-600'} />
          Planning Playbook & Rules
        </button>
      </div>

      {activeDashboardTab === 'limits' && (
        <FinancialLimitsTuner plan={plan} onNavigate={onNavigate} />
      )}

      {activeDashboardTab === 'investments' && (
        <InvestmentIdeasHub allocation={allocation} onNavigate={onNavigate} />
      )}

      {activeDashboardTab === 'playbook' && (
        <FinancialPlanningGuide onNavigate={onNavigate} />
      )}

      {activeDashboardTab === 'overview' && (
        <>
          {/* FINANCIAL HEALTH SCORE & 50/30/20 BENCHMARK */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Health Score Gauge Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
                      Financial Health Index
                    </span>
                    <span className="text-xs text-slate-400">• Comprehensive Audit</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    healthScore >= 75
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : healthScore >= 50
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {healthScore >= 75 ? 'Strong Financial Health' : healthScore >= 50 ? 'Moderate Health' : 'Needs Immediate Attention'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Circular Dial */}
                  <div className="relative w-32 h-32 mx-auto sm:mx-0 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#334155"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={healthScore >= 75 ? '#14b8a6' : healthScore >= 50 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="8"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-white">{healthScore}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">out of 100</span>
                    </div>
                  </div>

                  {/* 4 Health Pillars */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Savings Rate</div>
                      <div className="text-base font-extrabold text-teal-300 mt-0.5">{savingsRate.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-400 font-medium">Target: ≥ 20%</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Debt-to-Income</div>
                      <div className="text-base font-extrabold text-slate-200 mt-0.5">{((plan.debt?.debt_to_income_ratio || 0) * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-400 font-medium">Target: &lt; 35%</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Emergency Fund</div>
                      <div className="text-base font-extrabold text-emerald-300 mt-0.5">{plan.emergency_fund?.status || 'Active'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Target: 3–6 Months</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Cash Flow</div>
                      <div className="text-base font-extrabold text-sky-300 mt-0.5">{surplus >= 0 ? '+ Surplus' : '- Deficit'}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Target: Positive</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions to Reach 90+ */}
              <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                  <Sparkles size={12} />
                  Actions to hit 90+ Score:
                </span>
                <span className="text-[11px] text-slate-400">
                  Automate ₹500 SIP on 1st • Keep lifestyle within daily spend • Clear high-interest EMIs
                </span>
              </div>
            </div>

            {/* 50 / 30 / 20 Indian Benchmark Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers size={16} className="text-teal-600" />
                    50 / 30 / 20 Indian Rule
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Benchmark</span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                  Standard rule recommends 50% Needs, 30% Wants, and 20% Savings/Investments.
                </p>

                {/* Benchmark Bar */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Standard Guideline</span>
                      <span>50% • 30% • 20%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="w-1/2 bg-indigo-500" title="Needs 50%"></div>
                      <div className="w-[30%] bg-amber-500" title="Wants 30%"></div>
                      <div className="w-[20%] bg-teal-500" title="Savings 20%"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Your Plan</span>
                      <span className="text-teal-700 font-black">{needsPct}% • {wantsPct}% • {savingsPct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${needsPct}%` }} className="bg-indigo-500" title={`Needs: ${needsPct}%`}></div>
                      <div style={{ width: `${wantsPct}%` }} className="bg-amber-500" title={`Wants: ${wantsPct}%`}></div>
                      <div style={{ width: `${savingsPct}%` }} className="bg-teal-500" title={`Savings: ${savingsPct}%`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Needs: {needsPct}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Wants: {wantsPct}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> Save: {savingsPct}%
                </span>
              </div>
            </div>
          </div>

          {/* HOW MUCH LIMIT FOR EVERYTHING - COMPREHENSIVE LIMITS HUB */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full">
                    Category Limits Control
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• Exact Spend Caps</span>
                </div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  How Much Limit for Everything (Monthly & Daily Guidelines)
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Clear spending thresholds so you never exceed your income or dip into debt.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveDashboardTab('limits')}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-3.5 py-2 rounded-xl cursor-pointer transition-all shadow-2xs"
                >
                  <Sliders size={13} />
                  Adjust Limits
                </button>
              </div>
            </div>

            {/* Quick Hero Limits Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Safe Daily Spend</span>
                <div className="text-xl font-black text-amber-900 mt-1">
                  ₹{(budget?.safe_to_spend_daily || Math.round((plan?.expenses?.lifestyle || 2500) / 30)).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-amber-700 ml-1">/ day</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium block mt-1">Lifestyle & casual spending</span>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Total Monthly Spend</span>
                <div className="text-xl font-black text-indigo-900 mt-1">
                  ₹{monthlyExpenses.toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-indigo-700 ml-1">/ mo</span>
                </div>
                <span className="text-[10px] text-indigo-700 font-medium block mt-1">Essentials + Life + EMIs</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Safe Savings Limit</span>
                <div className="text-xl font-black text-emerald-900 mt-1">
                  ₹{(budget?.emergency_contribution || plan?.budget?.emergency_fund || 0).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-emerald-700 ml-1">/ mo</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium block mt-1">Emergency fund cushion</span>
              </div>

              <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Monthly Investment</span>
                <div className="text-xl font-black text-teal-900 mt-1">
                  ₹{(budget?.investment_capacity || plan?.budget?.investments || 0).toLocaleString('en-IN')}
                  <span className="text-[10px] font-semibold text-teal-700 ml-1">/ mo</span>
                </div>
                <span className="text-[10px] text-teal-700 font-medium block mt-1">Index SIP / PPF / RD</span>
              </div>
            </div>

            {/* Category-by-Category Limits Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {categoryLimitsList.map((cat, idx) => {
                const IconComponent = cat.icon || Coffee;
                return (
                  <div key={idx} className="bg-slate-50/60 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <IconComponent size={15} className={cat.color} />
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {cat.group}
                        </span>
                      </div>

                    <div className="text-lg font-black text-slate-900 mt-1">
                      ₹{cat.recommended.toLocaleString('en-IN')}
                      <span className="text-[10px] font-semibold text-slate-400 ml-1">/ month</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-[10px]">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase">Safe Limit</span>
                        <span className="font-bold text-teal-700">₹{cat.safe.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase">Hard Cap</span>
                        <span className="font-bold text-rose-600">₹{cat.hard.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Interactive Feature Quick Spotlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveDashboardTab('limits')}
              className="bg-gradient-to-br from-teal-50/60 to-white border border-teal-100 hover:border-teal-300 p-4.5 rounded-2xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Sliders size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full">
                    Interactive
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-teal-700 transition-colors">
                  Set Financial Limits
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  Adjust 50/30/20 sliders to calculate your authoritative daily and weekly safe-to-spend allowance.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Launch Tuner &rarr;
              </div>
            </div>

            <div
              onClick={() => setActiveDashboardTab('investments')}
              className="bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100 hover:border-emerald-300 p-4.5 rounded-2xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Calculator size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                    SIP Simulator
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                  Investment Ideas & SIP
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  Browse Indian asset classes (PPF, Index Funds, FDs, SGB) and simulate multi-year compound wealth.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Calculate Growth &rarr;
              </div>
            </div>

            <div
              onClick={() => setActiveDashboardTab('playbook')}
              className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 hover:border-blue-300 p-4.5 rounded-2xl shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                    Playbook
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                  Planning Framework
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  Follow the 4-step financial limit blueprint and track your readiness milestones interactively.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Read Blueprint &rarr;
              </div>
            </div>
          </div>

      {/* 2. Financial Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider text-[10px]">Planning Income</span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {formatINR(planningIncome)}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Coded fixed + 50% variable</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider text-[10px]">Monthly Expenses</span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {formatINR(monthlyExpenses)}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Essentials + Life + Debt EMIs</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider text-[10px]">Monthly Surplus</span>
          <span className={`text-xl font-black block mt-1 ${surplus >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
            {formatINR(surplus)}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Leftover net cash flow</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider text-[10px]">Savings Rate</span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {savingsRate.toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Surplus/Income proportion</span>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-400 text-xs font-bold block uppercase tracking-wider text-[10px]">Investment Capacity</span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {formatINR(allocation.investment_capacity)}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold block mt-1">Available for suitability</span>
        </div>
      </div>

      {/* 3. Financial Health Matrix */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Financial Health Matrix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Cash Flow */}
          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Cash Flow Readiness</span>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-bold text-slate-800 text-sm">Status:</span>
              <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${plan.cash_flow.status === 'positive' ? getHealthTagColor('Healthy') : getHealthTagColor('At Risk')}`}>
                {plan.cash_flow.status === 'positive' ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-2 font-medium">Monthly cash flow balances remain positive.</p>
          </div>

          {/* Debt Burden */}
          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Debt Burden</span>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-bold text-slate-800 text-sm">Burden Level:</span>
              <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getHealthTagColor(plan.debt.status)}`}>
                {plan.debt.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-2 font-medium">Debt to Income ratio is {(plan.debt.debt_to_income_ratio * 100).toFixed(1)}%.</p>
          </div>

          {/* Emergency Reserve */}
          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Emergency Reserve</span>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-bold text-slate-800 text-sm">Fund State:</span>
              <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getHealthTagColor(plan.emergency_fund.status)}`}>
                {plan.emergency_fund.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-2 font-medium">Covers {plan.emergency_fund.months_coverage.toFixed(1)} / {plan.emergency_fund.target_months} target months.</p>
          </div>

          {/* Goal Readiness */}
          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/20">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Overall Financial Rating</span>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-bold text-slate-800 text-sm">Health Rating:</span>
              <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getHealthTagColor(plan.health_status)}`}>
                {plan.health_status}
              </span>
            </div>
            <p className="text-[10px] text-slate-450 mt-2 font-medium">Summary rating indicator derived from planning logic.</p>
          </div>
        </div>
      </div>

      {/* 4. Budget & Allocation Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Expenses vs Allocation details */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Monthly Allocation & Expenses</h3>
              <div className={`px-3 py-1 border rounded-lg text-xs font-bold ${budgetReconciled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                {budgetReconciled ? 'Budget Balanced ✓' : 'Budget reconciliation requires attention'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-medium">
              
              {/* Left Column: Expenses */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1">Monthly Outflow Expenses</h4>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Essential Expenses</span>
                  <span className="font-bold text-slate-800">{formatINR(plan.expenses.essential)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Lifestyle Expenses</span>
                  <span className="font-bold text-slate-800">{formatINR(plan.expenses.lifestyle)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Loan Payments</span>
                  <span className="font-bold text-slate-800">{formatINR(plan.debt.total_emi)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-150 font-extrabold text-slate-800">
                  <span>Total Expenses</span>
                  <span>{formatINR(monthlyExpenses)}</span>
                </div>
              </div>

              {/* Right Column: Reconciled Allocation */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-100 pb-1">Monthly Plan Allocation</h4>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Essential Expenses</span>
                  <span>{formatINR(plan.budget.essential)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Lifestyle Expenses</span>
                  <span>{formatINR(plan.budget.lifestyle)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Loan Payments</span>
                  <span>{formatINR(plan.budget.loan_payments)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Emergency Fund</span>
                  <span>{formatINR(plan.budget.emergency_fund)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Goal Savings</span>
                  <span>{formatINR(plan.budget.goals)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Investment capacity</span>
                  <span>{formatINR(plan.budget.investments)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span>Flexible Buffer</span>
                  <span>{formatINR(plan.budget.buffer)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-150 font-extrabold text-slate-800">
                  <span>Total Allocation</span>
                  <span>{formatINR(budgetSum)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Actions (Separate Step 5 & 6 Warnings) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">Your Priority Actions</h3>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              
              {/* Step 5 Recommendations */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recommended Actions</span>
                {plan.recommendations.length > 0 ? (
                  plan.recommendations.map((rec, i) => (
                    <div key={i} className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50 flex gap-2">
                      <CheckCircle2 size={13} className="text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-[11px]">{rec.title}</h4>
                        <p className="text-[9px] text-slate-450 font-semibold mt-0.5">Planning engine suggestion</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium">No planning actions recommended.</p>
                )}
              </div>

              {/* Step 6 Warnings */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Investment Suitability Alerts</span>
                {allocation.warnings.length > 0 ? (
                  allocation.warnings.map((warn, i) => (
                    <div key={i} className="border border-amber-100 p-2.5 rounded-xl bg-amber-50/30 flex gap-2">
                      <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-800 text-[11px]">{warn.title}</h4>
                        <p className="text-[9px] text-amber-600 font-semibold mt-0.5">{warn.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium">No suitability warnings triggered.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Investment Allocation */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Savings & Investment Allocation</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">High-level distribution based on suitability engine constraints</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
            <span className="px-2 py-0.5 border rounded-lg bg-slate-50">Risk: {allocation?.profile?.risk_tolerance || 'Moderate'}</span>
            <span className="px-2 py-0.5 border rounded-lg bg-slate-50">Horizon: {allocation?.profile?.horizon || '5+ years'}</span>
            <span className="px-2 py-0.5 border rounded-lg bg-slate-50">Pref: {allocation?.profile?.preference || 'Balanced'}</span>
          </div>
        </div>

        {allocation.allocation_status === "paused" ? (
          <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-xl text-center text-xs">
            <AlertTriangle className="text-slate-400 mx-auto mb-2" size={24} />
            <h4 className="font-bold text-slate-700">Investment Allocation Paused</h4>
            <p className="text-slate-450 font-medium mt-1">
              Your investment allocation has been fully paused to protect your financial security. Re-build emergency reserves or clear deficit balances first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Visual allocation chart */}
            <div className="flex flex-col items-center justify-center border border-slate-100 p-4 rounded-xl">
              <div className="h-36 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center text-[10px] font-bold text-slate-500 mt-2">
                {(allocation?.allocations || []).map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: allocationColors[item.category] || '#14b8a6' }}></span>
                    {(item.category || item.label || 'Asset').split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* List entries */}
            <div className="md:col-span-2 space-y-3.5">
              {(allocation?.allocations || []).map((item, idx) => (
                <div key={idx} className="border border-slate-50 p-3.5 rounded-xl bg-slate-50/20 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: allocationColors[item.category] || '#14b8a6' }}></span>
                      {item.category || item.label || 'Asset'}
                    </span>
                    <span>
                      {item.percentage}% ({formatINR(item.monthly_amount)} / mo)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                    <strong>Suitability reason:</strong> {item.reason}
                  </p>
                </div>
              ))}
          </div>
          </div>
        )}
      </div>

      {/* 6. Financial Goals Progress */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
          <h3 className="font-bold text-slate-800 text-sm">Savings Goals Progress</h3>
          {onNavigate && goalsProgress.length > 0 && (
            <button
              onClick={() => onNavigate('goals')}
              className="text-teal-600 hover:text-teal-700 font-extrabold text-[11px] hover:underline cursor-pointer"
            >
              Manage All &rarr;
            </button>
          )}
        </div>
        {goalsProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalsProgress.map((g) => {
              return (
                <div key={g.goal_id} className="border border-slate-100 p-4 rounded-xl shadow-xs bg-slate-50/20 relative flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-slate-800 font-bold text-sm block">{g.goal_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 flex items-center gap-1">
                        <Calendar size={11} />
                        Timeline: {g.target_date} ({g.months_remaining} months left)
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getGoalStatusColor(g.actual_status)}`}>
                      {g.actual_status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-450 uppercase">
                    <div>
                      <span className="block text-[9px]">Target</span>
                      <span className="text-slate-700 font-bold">{formatINR(g.target_amount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px]">Saved</span>
                      <span className="text-teal-600 font-bold">{formatINR(g.current_saved)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px]">Required</span>
                      <span className="text-slate-700 font-bold">{formatINR(g.required_monthly_contribution)} / mo</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>Goal progress</span>
                      <span>{g.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${g.progress_percentage}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Monthly Contribution:</span>
                    <button
                      onClick={() => onNavigate && onNavigate('goals', g.goal_id)}
                      className="text-teal-600 hover:text-teal-700 font-extrabold text-[10px] hover:underline cursor-pointer"
                    >
                      {g.actual_month_contribution > 0 ? `₹${g.actual_month_contribution.toLocaleString('en-IN')}` : 'Log Contribution'} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-455 text-xs py-8">No configured savings goals detected.</div>
        )}
      </div>

      {/* 6.5. What-If Simulator CTA Card */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-600/10">
        <div>
          <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-300" />
            Test Hypothetical Scenarios with the What-If Simulator
          </h3>
          <p className="text-xs text-teal-100/90 mt-1 max-w-xl font-semibold">
            Want to see how prepaying a loan, changing jobs for a higher salary, or adding a new savings goal affects your monthly budget allocations and emergency fund targets? Run an in-memory test instantly!
          </p>
        </div>
        <div>
          <button
            onClick={() => onNavigate && onNavigate('simulator')}
            className="bg-white hover:bg-slate-50 text-teal-700 text-xs font-extrabold px-5 py-3 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            Launch Simulator
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 7. Local Cost Insights Table */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">Local Cost Reference Comparison</h3>
        <p className="text-[10px] text-slate-400 font-semibold mb-4 leading-relaxed">
          Comparing your declared expenses against local reference estimates. These values serve as informational benchmarks, not hard spending limits or prices.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Expense Category</th>
                <th className="p-3 text-right">Your Spending</th>
                <th className="p-3 text-right">Local Typical Estimate</th>
                <th className="p-3 text-right">Reference Range</th>
                <th className="p-3">Comparison Status</th>
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
                      <td className="p-3 text-right text-slate-400">
                        {formatINR(bench.local_min)} – {formatINR(bench.local_max)}
                      </td>
                      <td className={`p-3 font-bold ${bench.difference_from_typical > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {getComparisonLabel(bench)}
                      </td>
                      <td className="p-3 text-slate-400 flex flex-col">
                        <span>Source: {bench.source || '—'}</span>
                        <span className="text-[9px]">Ref Date: {formatDateString(bench.reference_month)}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-center text-slate-350 font-bold bg-slate-50/20" colSpan="4">
                        Local benchmark unavailable
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Disclaimer */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 font-semibold leading-relaxed">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <span>{allocation.disclaimer}</span>
      </div>
        </>
      )}
    </div>
  );
}

// Inline Icon component
function Edit2Icon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
