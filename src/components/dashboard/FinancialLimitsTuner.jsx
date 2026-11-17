import React, { useState, useMemo } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';

export default function FinancialLimitsTuner({ plan, onNavigate }) {
  const planningIncome = plan?.income?.planning_income || 25000;
  const currentEssentials = plan?.expenses?.essential || 12000;
  const currentLifestyle = plan?.expenses?.lifestyle || 5000;
  const currentEMI = plan?.debt?.total_emi || 0;
  const currentSavings = plan?.budget?.emergency_fund + plan?.budget?.goals + plan?.budget?.investments || 5000;

  // Calculate days remaining in current calendar month for daily budget
  const daysInCurrentMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remaining = lastDay - now.getDate() + 1;
    return Math.max(remaining, 1);
  }, []);

  // Percentages state
  const [essentialPct, setEssentialPct] = useState(
    Math.min(Math.max(Math.round((currentEssentials / planningIncome) * 100), 30), 70)
  );
  const [lifestylePct, setLifestylePct] = useState(
    Math.min(Math.max(Math.round((currentLifestyle / planningIncome) * 100), 10), 40)
  );
  const [savingsPct, setSavingsPct] = useState(
    Math.min(Math.max(Math.round((currentSavings / planningIncome) * 100), 10), 40)
  );

  // Active preset tracking
  const [activePreset, setActivePreset] = useState('custom');

  // Computed values
  const essentialAmount = Math.round((planningIncome * essentialPct) / 100);
  const lifestyleAmount = Math.round((planningIncome * lifestylePct) / 100);
  const savingsAmount = Math.round((planningIncome * savingsPct) / 100);
  const allocatedSum = essentialAmount + lifestyleAmount + savingsAmount + currentEMI;
  const bufferAmount = planningIncome - allocatedSum;

  // Safe-to-spend calculation:
  // Planning Income - Essentials - Debt EMIs - Savings target = Discretionary Safe to Spend
  const safeToSpendMonthly = Math.max(planningIncome - essentialAmount - currentEMI - savingsAmount, 0);
  const safeToSpendWeekly = Math.round(safeToSpendMonthly / 4.33);
  const safeToSpendDaily = Math.round(safeToSpendMonthly / daysInCurrentMonth);

  // Preset handlers
  const applyPreset = (presetName, essentials, lifestyle, savings) => {
    setActivePreset(presetName);
    setEssentialPct(essentials);
    setLifestylePct(lifestyle);
    setSavingsPct(savings);
  };

  const resetToBaseline = () => {
    setActivePreset('baseline');
    setEssentialPct(Math.min(Math.max(Math.round((currentEssentials / planningIncome) * 100), 30), 70));
    setLifestylePct(Math.min(Math.max(Math.round((currentLifestyle / planningIncome) * 100), 10), 40));
    setSavingsPct(Math.min(Math.max(Math.round((currentSavings / planningIncome) * 100), 10), 40));
  };

  // Helper currency format
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Sliders size={13} />
            Interactive Financial Tuner
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Design Your Authoritative Spending Limits
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-2 leading-relaxed font-medium">
            Take control of your monthly cash flow. Adjust the sliders below or select a proven financial rule to discover your exact safe-to-spend allowances for everyday life.
          </p>
        </div>
      </div>

      {/* Preset Rule Selectors */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Select a Proven Budgeting Framework</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Click any rule to auto-populate recommended limit ratios</p>
          </div>
          <button
            onClick={resetToBaseline}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={13} />
            Reset to Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('50-30-20', 50, 30, 20)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === '50-30-20'
                ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-xs block">50 / 30 / 20 Classic Rule</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">50% Needs • 30% Wants • 20% Savings</span>
            <span className="text-[9px] text-teal-700 font-bold block mt-2">Best for: Balanced financial life</span>
          </button>

          <button
            onClick={() => applyPreset('60-20-20', 60, 20, 20)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === '60-20-20'
                ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-xs block">60 / 20 / 20 Needs-Focused</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">60% Needs • 20% Wants • 20% Savings</span>
            <span className="text-[9px] text-teal-700 font-bold block mt-2">Best for: Higher city rent or EMIs</span>
          </button>

          <button
            onClick={() => applyPreset('40-20-40', 40, 20, 40)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === '40-20-40'
                ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-xs block">40 / 20 / 40 Wealth Builder</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">40% Needs • 20% Wants • 40% Savings</span>
            <span className="text-[9px] text-teal-700 font-bold block mt-2">Best for: Rapid goal / home savings</span>
          </button>

          <button
            onClick={() => applyPreset('70-10-20', 70, 10, 20)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePreset === '70-10-20'
                ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span className="font-extrabold text-xs block">70 / 10 / 20 Debt Snowball</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">70% Essentials+Debt • 10% Wants • 20% Save</span>
            <span className="text-[9px] text-teal-700 font-bold block mt-2">Best for: High loan liabilities</span>
          </button>
        </div>
      </div>

      {/* Main Limit Adjuster & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sliders size={16} className="text-teal-600" />
              Adjust Envelope Caps
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Income Base: <strong className="text-slate-700">{formatINR(planningIncome)}</strong>
            </span>
          </div>

          {/* Slider 1: Essentials */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                Essential Needs Limit (Housing, Food, Utilities)
              </span>
              <span className="font-extrabold text-slate-800">
                {essentialPct}% ({formatINR(essentialAmount)})
              </span>
            </div>
            <input
              type="range"
              min="25"
              max="75"
              value={essentialPct}
              onChange={(e) => {
                setActivePreset('custom');
                setEssentialPct(parseInt(e.target.value));
              }}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Frugal: 30%</span>
              <span>Baseline: {Math.round((currentEssentials / planningIncome) * 100)}%</span>
              <span>High Cost: 70%</span>
            </div>
          </div>

          {/* Slider 2: Lifestyle / Discretionary */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                Lifestyle & Discretionary (Dining, Shopping, Hobbies)
              </span>
              <span className="font-extrabold text-slate-800">
                {lifestylePct}% ({formatINR(lifestyleAmount)})
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              value={lifestylePct}
              onChange={(e) => {
                setActivePreset('custom');
                setLifestylePct(parseInt(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Minimalist: 10%</span>
              <span>Recommended: 20-30%</span>
              <span>Comfortable: 40%</span>
            </div>
          </div>

          {/* Slider 3: Savings & Investment Target */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                Savings, Emergency & Investment Allocation
              </span>
              <span className="font-extrabold text-slate-800">
                {savingsPct}% ({formatINR(savingsAmount)})
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={savingsPct}
              onChange={(e) => {
                setActivePreset('custom');
                setSavingsPct(parseInt(e.target.value));
              }}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Minimum: 10%</span>
              <span>Target: 20%</span>
              <span>Aggressive: 40%+</span>
            </div>
          </div>

          {/* Fixed Debt EMIs Info */}
          {currentEMI > 0 && (
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Committed Loan EMIs (Inflexible liability):</span>
              <span className="font-bold text-slate-800">{formatINR(currentEMI)} ({((currentEMI / planningIncome) * 100).toFixed(1)}%)</span>
            </div>
          )}

          {/* Allocation Breakdown Progress Bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Total Envelope Allocated:</span>
              <span className={`font-bold ${bufferAmount >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                {((allocatedSum / planningIncome) * 100).toFixed(0)}% ({formatINR(allocatedSum)})
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div style={{ width: `${Math.min(essentialPct, 100)}%` }} className="bg-blue-500 h-full" title="Essentials"></div>
              <div style={{ width: `${Math.min(lifestylePct, 100)}%` }} className="bg-amber-500 h-full" title="Lifestyle"></div>
              <div style={{ width: `${Math.min(savingsPct, 100)}%` }} className="bg-teal-500 h-full" title="Savings"></div>
              {currentEMI > 0 && (
                <div style={{ width: `${Math.min((currentEMI / planningIncome) * 100, 100)}%` }} className="bg-rose-400 h-full" title="Debt EMIs"></div>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
              <span>{bufferAmount >= 0 ? `Unallocated Buffer: ${formatINR(bufferAmount)}` : `Overallocated Deficit: ${formatINR(Math.abs(bufferAmount))}`}</span>
              <span className={bufferAmount >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {bufferAmount >= 0 ? '✓ Balanced within income' : '⚠ Exceeds monthly income'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Output Panel: Safe to Spend Meter (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-teal-50/40 via-white to-white border border-teal-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Safe-to-Spend Allowances</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Your dynamic guilt-free spending caps</p>
              </div>
            </div>

            {/* Daily & Weekly Cards */}
            <div className="space-y-3.5 mt-4">
              <div className="bg-white border border-teal-100 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Spending Limit</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-teal-700">
                    {formatINR(safeToSpendDaily)}
                  </span>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {daysInCurrentMonth} days left this month
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                  Stay under this daily limit to automatically hit your savings goals.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Limit</span>
                  <span className="text-base font-black text-slate-800 block mt-1">{formatINR(safeToSpendWeekly)}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Per 7 days</span>
                </div>
                <div className="bg-white border border-slate-100 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Limit</span>
                  <span className="text-base font-black text-slate-800 block mt-1">{formatINR(safeToSpendMonthly)}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Total wants cap</span>
                </div>
              </div>
            </div>

            {/* Smart Coaching Advice */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                <Zap size={13} className="text-teal-600" />
                Rule of Thumb Guidance
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                {savingsPct >= 20 ? (
                  <span className="text-emerald-700">
                    🌟 <strong>Strong savings velocity:</strong> You're allocating {savingsPct}% of your income. This creates a solid emergency reserve and accelerates goal targets.
                  </span>
                ) : (
                  <span className="text-amber-700">
                    💡 <strong>Pro tip:</strong> Aim to gradually lift savings towards 20% by cutting small subscription or lifestyle leaks.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Simulator CTA */}
          <button
            onClick={() => onNavigate && onNavigate('simulator')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Simulate What-If With These Limits</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
