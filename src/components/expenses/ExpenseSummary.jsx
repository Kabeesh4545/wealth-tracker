import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DollarSign, Landmark, CalendarDays, BarChart2 } from 'lucide-react';

export default function ExpenseSummary({ summary }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const colors = {
    "Essential": "#2563eb", // blue-600
    "Lifestyle": "#d97706", // amber-600
    "Housing": "#0d9488", // teal-600
    "Debt": "#7c3aed"  // purple-600
  };

  const chartData = summary.categories.map(c => ({
    name: c.category,
    value: c.amount,
    color: colors[c.category] || "#64748b"
  }));

  // Find top spending category
  const topCat = summary.categories.length > 0
    ? [...summary.categories].sort((a, b) => b.amount - a.amount)[0]
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      
      {/* Aggregated totals */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
        <h4 className="font-extrabold text-slate-800 text-sm">Monthly Expenditure Stats</h4>
        
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
              <Landmark size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Spent</span>
              <span className="text-lg font-black text-slate-800">{formatINR(summary.total_expenses)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logged Transactions</span>
              <span className="text-lg font-black text-slate-800">{summary.expense_count} entries</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Largest Category</span>
              <span className="text-lg font-black text-slate-800">
                {topCat ? `${topCat.category} (${formatINR(topCat.amount)})` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
        <h4 className="font-extrabold text-slate-800 text-sm">Category Allocation Summary</h4>
        <div className="h-36 flex items-center justify-center">
          {summary.total_expenses > 0 ? (
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
                <Tooltip formatter={(value) => formatINR(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-slate-350 text-xs font-semibold">No data logged</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5 justify-center text-[9px] font-bold text-slate-500 mt-2">
          {Object.keys(colors).map(cat => (
            <span key={cat} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[cat] }}></span>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Breakdown list */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
        <h4 className="font-extrabold text-slate-800 text-sm mb-3">Allocated Splits</h4>
        <div className="space-y-3.5 overflow-y-auto max-h-[140px] pr-1">
          {summary.categories.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[c.category] }}></span>
                <span className="font-bold text-slate-700">{c.category}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-800 block">{formatINR(c.amount)}</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{c.percentage}% of total</span>
              </div>
            </div>
          ))}
          {summary.categories.length === 0 && (
            <span className="text-slate-400 text-xs font-semibold block text-center py-6">No splits recorded</span>
          )}
        </div>
      </div>

    </div>
  );
}
