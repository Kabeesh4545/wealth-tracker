import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight, 
  Edit3, 
  Activity, 
  Compass, 
  HelpCircle,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const FinancialPlanReady = ({ onNavigate, onEditProfile }) => {
  const [budget, setBudget] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date formatting helpers
  const getDaysInMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  };
  
  const getRemainingDays = () => {
    const d = new Date();
    const total = getDaysInMonth();
    return total - d.getDate() + 1;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [budgetRes, recsRes] = await Promise.all([
          api.get('/api/planning/monthly-budget'),
          api.get('/api/investments/recommendations')
        ]);
        setBudget(budgetRes.data);
        setRecommendations(recsRes.data);
      } catch (err) {
        console.error('Error fetching operating plan data:', err);
        setError('Unable to load your financial operating plan details. Please check your network connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 py-12">
        <Clock className="w-12 h-12 text-teal-600 animate-spin mb-4" />
        <p className="text-sm font-semibold">Generating your Personalized Operating Plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur border border-red-200/80 rounded-2xl p-6 text-red-700 max-w-2xl mx-auto my-12 shadow-sm">
        <div className="flex gap-3 items-start">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Failed to Load Plan</h3>
            <p className="text-sm text-red-600/90 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹0';
    try {
      const num = parseFloat(val);
      const parts = num.toFixed(2).split('.');
      let integer = parts[0];
      if (integer.length > 3) {
        const lastThree = integer.substring(integer.length - 3);
        let remaining = integer.substring(0, integer.length - 3);
        const out = [];
        while (remaining.length > 2) {
          out.unshift(remaining.substring(remaining.length - 2));
          remaining = remaining.substring(0, remaining.length - 2);
        }
        if (remaining.length > 0) {
          out.unshift(remaining);
        }
        integer = out.join(',') + ',' + lastThree;
      }
      return parts[1] === '00' ? `₹${integer}` : `₹${integer}.${parts[1]}`;
    } catch {
      return `₹${val}`;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-teal-50 text-teal-700 border-teal-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 animate-fade-in">
      
      {/* Header Landing Section */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-teal-950/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
        
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Actionable Plan Ready
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            Your Monthly Financial Operating Plan
          </h1>
          <p className="text-lg text-teal-100/80 mb-8 font-light">
            We have processed your financial data against localized Coimbatore cost benchmarks. 
            Here is your exact, text-driven roadmap for maximum efficiency, saving capacity, and security.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm cursor-pointer"
            >
              View Analytics Dashboard <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={onEditProfile}
              className="px-5 py-3.5 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-2xl font-semibold transition-all hover:text-white flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {budget?.warnings && budget.warnings.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
          <div className="flex gap-2.5 items-start text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">Financial Health Warnings ({budget.warnings.length})</h4>
              <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                {budget.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Spending Limits & Investment Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Safe spending card (7 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" /> Spending Limits Shield
                </h3>
                <p className="text-xs text-slate-500">Maximum recommended lifestyle allocations after saving protections.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold uppercase">Remaining Days</span>
                <span className="text-lg font-extrabold text-slate-800 flex items-center gap-1 justify-end">
                  <Clock className="w-4 h-4 text-teal-600" /> {getRemainingDays()} days
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Monthly Safe Limit</span>
                <span className="text-lg font-black text-slate-900">{formatINR(budget?.safe_to_spend)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Safe Limit</span>
                <span className="text-lg font-black text-teal-700">{formatINR(budget?.safe_weekly_limit)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Daily Safe Limit</span>
                <span className="text-lg font-black text-teal-700">{formatINR(budget?.safe_daily_limit)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category spending limits log</h4>
              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 text-sm">
                {budget?.categories?.filter(c => c.recommended_limit > 0).map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 px-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition">
                    <div className="flex gap-2.5 items-center">
                      <span className={`w-2 h-2 rounded-full ${c.priority === 'TIER 1' ? 'bg-amber-400' : 'bg-teal-500'}`}></span>
                      <div>
                        <span className="font-semibold text-slate-800">{c.category}</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">{c.explanation}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 text-xs block">{formatINR(c.current_spending)} / {formatINR(c.recommended_limit)}</span>
                      <span className={`text-[10px] font-bold ${c.status === 'OVER LIMIT' ? 'text-rose-600' : (c.status === 'NEAR LIMIT' ? 'text-amber-600' : 'text-teal-600')}`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Investment recommendation card (5 columns) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-teal-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between border border-teal-950/80">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-teal-400" /> Investment Recommendations
                </h3>
                <p className="text-xs text-teal-200/60">Algorithm-matched asset allocation based on your risk tolerance.</p>
              </div>
            </div>
            
            {recommendations?.best_profile_match ? (
              <div className="mb-6">
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-5 mb-4">
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">Top Suitable Product</span>
                  <span className="text-xl font-black text-white block mb-2">{recommendations.best_profile_match.name}</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300">Suitability: {recommendations.best_profile_match.suitability_score}/100</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300">{recommendations.best_profile_match.horizon}</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300">Risk: {recommendations.best_profile_match.risk_level}</span>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                  <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block mb-1">Recommended Monthly Amount</span>
                  <span className="text-2xl font-black text-white">{formatINR(recommendations.best_profile_match.recommended_amount)}</span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">Why this is recommended:</span>
                  <ul className="text-xs text-teal-100/80 space-y-1.5 list-disc list-inside">
                    {recommendations.best_profile_match.reasons?.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-teal-200/50 text-sm">
                Complete your Investment Profile to unlock suited products.
              </div>
            )}
          </div>
          
          <div className="border-t border-teal-950 pt-4 text-[10px] text-teal-200/40 italic mt-6 leading-relaxed">
            {recommendations?.disclaimer}
          </div>
        </div>

      </div>

      {/* Checklist Action Plan & Calendar (Full Width) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
          <CheckSquare className="w-5 h-5 text-teal-600" /> Action Checklist & Calendar Roadmap
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Priority Checklist (7 columns) */}
          <div className="md:col-span-7">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Plan Implementation Tasks</h4>
            <div className="space-y-3.5">
              {budget?.actions?.map((act, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="mt-0.5">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${act.done ? 'bg-teal-500 border-teal-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {act.done && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${act.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{act.text}</p>
                    <span className={`inline-block border px-2 py-0.5 rounded text-[9px] font-extrabold mt-1.5 tracking-wide ${getPriorityBadgeClass(act.priority)}`}>
                      {act.priority} PRIORITY
                    </span>
                  </div>
                  {act.amount > 0 && (
                    <span className="font-extrabold text-slate-800 text-sm tracking-tight">{formatINR(act.amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Month Calendar overview (5 columns) */}
          <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between items-center">
              <span>{budget?.month} Operating Calendar</span>
              <Calendar className="w-4 h-4 text-teal-600" />
            </h4>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <span className="font-bold text-slate-800 block">Day 1-5: Salary Clearing & Protection</span>
                  <p className="text-slate-500 mt-0.5">Protect Tier 1 mandatory costs: transfer Rent and pay EMI obligations immediately.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <span className="font-bold text-slate-800 block">Day 6-10: Emergency & Goals Transfer</span>
                  <p className="text-slate-500 mt-0.5">Move emergency contribution and goal allocations into savings/target accounts.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div>
                  <span className="font-bold text-slate-800 block">Day 11-20: Discretionary Spend Monitoring</span>
                  <p className="text-slate-500 mt-0.5">Log actual lifestyle expenses and monitor limits. Stay within the daily limits.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                <div>
                  <span className="font-bold text-slate-800 block">Day 25-30: Surplus Invest Allocation</span>
                  <p className="text-slate-500 mt-0.5">Reconcile leftover buffers. Transfer final investment capacity to matched options.</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  );
};

export default FinancialPlanReady;
