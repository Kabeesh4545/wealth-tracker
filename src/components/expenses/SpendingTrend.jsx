import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SpendingTrend({ trends }) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
      <div>
        <h4 className="font-extrabold text-slate-800 text-sm">6-Month Spending Trend</h4>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
          Historical overview of actual monthly expenditures. No predictions or ML models are applied.
        </p>
      </div>

      <div className="h-56 w-full">
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_label" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
              <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip formatter={(value) => formatINR(value)} labelStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="total_expenses" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-slate-450 font-semibold py-12 text-xs">
            No historical trend data available.
          </div>
        )}
      </div>
    </div>
  );
}
