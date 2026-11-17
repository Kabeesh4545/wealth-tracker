import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, TrendingUp, HelpCircle } from 'lucide-react';

export default function MonthlyReview({ budgetData, selectedMonth }) {
  if (!budgetData) return null;

  const categories = budgetData.categories || [];
  
  // Detect if there is any transaction history logged for this month
  const hasHistory = useMemo(() => {
    return categories.some(cat => cat.current_spending !== null);
  }, [categories]);

  // Extract month formatting
  const formattedMonth = useMemo(() => {
    const parts = (selectedMonth || "").split('-');
    if (parts.length === 2) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    return selectedMonth;
  }, [selectedMonth]);

  if (!hasHistory) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Monthly Review — {formattedMonth}</h3>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <HelpCircle size={32} className="text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-500">Monthly transaction history is not available.</p>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium">
            Start logging expenses in the Expense Tracker tab to view live budget utilization reviews here.
          </p>
        </div>
      </div>
    );
  }

  // Calculate actual spending metrics
  const totalLimit = categories.reduce((sum, c) => sum + (c.recommended_limit || 0), 0);
  const totalSpent = categories.reduce((sum, c) => sum + (c.current_spending || 0), 0);
  
  const overspentCategories = categories.filter(c => c.status === "OVER LIMIT");
  const onTrackCategories = categories.filter(c => c.status === "ON TRACK" || c.status === "UNDER BUDGET");

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-4">Monthly Review — {formattedMonth}</h3>
      
      {/* Review Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Recommended Limit</span>
          <span className="text-base font-extrabold text-slate-700">₹{totalLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Recorded Spend</span>
          <span className="text-base font-extrabold text-slate-700">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Budget Adherence Status</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
            overspentCategories.length > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            {overspentCategories.length > 0 ? `${overspentCategories.length} Overlimit` : "On Track"}
          </span>
        </div>
      </div>

      {/* Categories Review list */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Category Adherence</h4>
        
        {categories.map((cat, idx) => {
          if (cat.current_spending === null) return null; // Only show if record exists

          return (
            <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex justify-between items-center text-xs font-semibold text-slate-600">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">{cat.category}</span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Limit: ₹{cat.recommended_limit.toLocaleString('en-IN')} | Spent: ₹{cat.current_spending.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  cat.status === "OVER LIMIT" ? "bg-rose-50 text-rose-600" : 
                  cat.status === "NEAR LIMIT" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {cat.status}
                </span>
                {cat.difference && cat.difference > 0 && (
                  <span className="text-rose-600 font-bold text-[10px]">
                    +₹{cat.difference.toLocaleString('en-IN')} Over
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
