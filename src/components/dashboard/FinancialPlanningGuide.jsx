import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Target,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Award,
  Zap,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

const DEFAULT_MILESTONES = [
  {
    id: 'm1',
    title: '1-Month Essential Runway Starter',
    desc: 'Keep at least 1 full month of living expenses (Rent + Food + Bills) liquid in your savings account.',
    category: 'Emergency Safety',
    completed: false
  },
  {
    id: 'm2',
    title: 'Eliminate High-Interest Debt (>12%)',
    desc: 'Pay off credit card balances or personal loans with interest rates above 12% before speculative investing.',
    category: 'Debt Defense',
    completed: false
  },
  {
    id: 'm3',
    title: 'Establish Authoritative Daily Spending Cap',
    desc: 'Calculate your safe-to-spend discretionary limit and check it before dining out or shopping.',
    category: 'Cash Flow',
    completed: true
  },
  {
    id: 'm4',
    title: 'Automate Recurring Monthly Goal Contribution',
    desc: 'Set up an auto-debit or systematic transfer on salary day for your primary savings goal.',
    category: 'Goal Building',
    completed: false
  },
  {
    id: 'm5',
    title: 'Health & Life Risk Protection Check',
    desc: 'Ensure you have adequate personal health insurance and term coverage if you have financial dependents.',
    category: 'Risk Shield',
    completed: false
  },
  {
    id: 'm6',
    title: 'Monthly Plan vs Actual Spending Review',
    desc: 'Compare declared expense envelopes against actual bank/UPI outflows at the end of each calendar month.',
    category: 'Habit Mastery',
    completed: false
  }
];

export default function FinancialPlanningGuide({ onNavigate }) {
  const [milestones, setMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem('user_financial_milestones');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_MILESTONES;
  });

  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem('user_financial_milestones', JSON.stringify(milestones));
    } catch (e) {
      console.error(e);
    }
  }, [milestones]);

  const toggleMilestone = (id) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progressPct = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <BookOpen size={13} />
            Financial Playbook & Framework
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            The 4-Step Blueprint: Setting Bulletproof Financial Limits
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-2 leading-relaxed font-medium">
            Learn the exact sequence used by financial planners to eliminate money stress, establish safe spending ceilings, and compound long-term wealth without feeling deprived.
          </p>
        </div>
      </div>

      {/* 2. Interactive 4-Step Walkthrough */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="font-extrabold text-slate-800 text-base">Step-by-Step Blueprint</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Click any phase below to inspect the mathematical logic and guidelines</p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
          {[
            { step: 1, title: 'Step 1: Planning Income', badge: 'The Foundation' },
            { step: 2, title: 'Step 2: Living Floor', badge: 'Needs <= 50%' },
            { step: 3, title: 'Step 3: Daily Cap', badge: 'Safe-to-Spend' },
            { step: 4, title: 'Step 4: Wealth Engine', badge: 'Goals & Growth' }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'bg-teal-50 border-teal-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`text-[10px] font-bold block ${activeStep === s.step ? 'text-teal-700' : 'text-slate-400'}`}>
                {s.badge}
              </span>
              <span className={`text-xs font-black block mt-0.5 ${activeStep === s.step ? 'text-teal-900' : 'text-slate-700'}`}>
                {s.title}
              </span>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center">1</span>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Calculate Your True "Planning Income"</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Never budget around your gross offer letter or optimistic bonuses. The Antigravity engine calculates your 
                <strong> Planning Income</strong> as:
              </p>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl font-mono text-xs text-teal-800 font-bold">
                Planning Income = Net In-Hand Monthly Salary + 50% of Variable/Freelance Income
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Discounting variable income by 50% guarantees you never commit to fixed rent or EMIs based on erratic windfall income that might not materialize.
              </p>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">2</span>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Cap Essential Living Expenses Under 50%</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Your <strong>Essential Living Floor</strong> represents bills you cannot skip without eviction or disconnection: Rent/Home maintenance, basic groceries, electricity, water, internet, and transit.
              </p>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl font-mono text-xs text-blue-900 font-bold">
                Essential Floor = Housing + Utilities + Basic Groceries + Mandatory Commute &le; 50% Income
              </div>
              <p className="text-xs text-slate-500 font-medium">
                If your essential costs exceed 50% (common in tier-1 cities like Bengaluru or Mumbai), use our <strong>Local Benchmark</strong> tool on the dashboard to evaluate whether roommate sharing or moving suburbs can unlock monthly surplus.
              </p>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center">3</span>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Establish Authoritative "Safe-to-Spend" Limits</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Instead of micro-managing every coffee or movie ticket, financial freedom comes from calculating your single 
                <strong> Safe-to-Spend Discretionary Ceiling</strong>:
              </p>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl font-mono text-xs text-amber-900 font-bold">
                Daily Safe Limit = (Planning Income - Essentials - Debt EMIs - Goal Savings) &divide; Days Left
              </div>
              <p className="text-xs text-slate-500 font-medium">
                If your daily allowance is ₹600, you can spend ₹600 today completely guilt-free because all fixed liabilities and retirement savings were already set aside!
              </p>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">4</span>
                <h4 className="font-bold text-slate-800 text-sm md:text-base">Activate the Wealth Engine (Emergency &rarr; Goals &rarr; Wealth)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Allocate your savings in a strict 3-tier priority sequence:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white border border-slate-200 p-3 rounded-xl">
                  <span className="font-bold text-slate-800 block text-[11px]">1. Emergency Cushion</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">3–6 months essential runway in High-Yield FD / Liquid Funds.</span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl">
                  <span className="font-bold text-slate-800 block text-[11px]">2. Named Financial Goals</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">Sip into Short/Medium-term targets (e.g. Higher studies, Laptop, Down payment).</span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-xl">
                  <span className="font-bold text-slate-800 block text-[11px]">3. Compounding Wealth</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">Nifty 50 Index Funds / PPF / Diversified Mutual Funds for 10+ year wealth.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Milestone Checklist */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Award size={18} className="text-teal-600" />
              Your Financial Health Milestones
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Check off milestones as you achieve them — saved automatically to your device
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block">{completedCount} of {milestones.length} Done</span>
              <span className="text-[10px] text-teal-600 font-extrabold">{progressPct}% Readiness</span>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-teal-500/20 border-t-teal-600 flex items-center justify-center font-black text-xs text-teal-700">
              {progressPct}%
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {milestones.map(m => (
            <div
              key={m.id}
              onClick={() => toggleMilestone(m.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                m.completed
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {m.completed ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <Circle size={18} className="text-slate-300 hover:text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-bold ${m.completed ? 'text-emerald-900 line-through opacity-80' : 'text-slate-800'}`}>
                    {m.title}
                  </h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {m.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
