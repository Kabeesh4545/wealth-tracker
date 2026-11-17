import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MonthlyComparison({ comparisons }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStatusBadge = (status) => {
    if (status === 'Within Plan') {
      return (
        <span className="px-2.5 py-0.5 border border-emerald-100 rounded-full font-bold text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 flex items-center gap-1.5 w-fit">
          <CheckCircle2 size={10} />
          Within Plan
        </span>
      );
    }
    if (status === 'Near Limit') {
      return (
        <span className="px-2.5 py-0.5 border border-amber-100 rounded-full font-bold text-[9px] uppercase tracking-wider bg-amber-50 text-amber-700 flex items-center gap-1.5 w-fit">
          <AlertTriangle size={10} />
          Near Limit
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 border border-rose-100 rounded-full font-bold text-[9px] uppercase tracking-wider bg-rose-50 text-rose-700 flex items-center gap-1.5 w-fit">
        <AlertCircle size={10} />
        Above Plan
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm">Planned vs Actual Budget Performance</h4>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
          Comparing actual monthly expenditures against planned onboarding targets.
        </p>
      </div>

      <div className="overflow-x-auto">
        {comparisons.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Budget Category</th>
                <th className="p-3 text-right">Step 5 Planned</th>
                <th className="p-3 text-right">Step 8 Actual</th>
                <th className="p-3 text-right">Variance / Difference</th>
                <th className="p-3">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium text-xs">
              {comparisons.map((item, idx) => {
                const diff = item.difference;
                const isOver = diff > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/20">
                    <td className="p-3 font-extrabold text-slate-800">{item.category}</td>
                    <td className="p-3 text-right font-semibold text-slate-500">{formatINR(item.planned)}</td>
                    <td className="p-3 text-right font-extrabold text-slate-700">{formatINR(item.actual)}</td>
                    <td className={`p-3 text-right font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isOver ? '+' : ''}{formatINR(diff)}
                    </td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-slate-450 font-semibold py-12 text-xs">
            No active budget categories logged for comparison.
          </div>
        )}
      </div>
    </div>
  );
}
