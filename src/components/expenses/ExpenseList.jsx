import React from 'react';
import { Trash2, Edit3, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ExpenseList({
  expenses,
  page,
  hasMore,
  onPrevPage,
  onNextPage,
  onEdit,
  onDelete
}) {
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCategoryColor = (cat) => {
    if (cat === 'Essential') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (cat === 'Lifestyle') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (cat === 'Housing') return 'bg-teal-50 text-teal-700 border-teal-100';
    return 'bg-purple-50 text-purple-700 border-purple-100';
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-extrabold text-slate-800 text-sm">Recent Transactions Ledger</h4>
        <div className="flex gap-2 items-center text-xs font-bold text-slate-500">
          <button
            onClick={onPrevPage}
            disabled={page === 1}
            className="p-1.5 border border-slate-200 hover:border-slate-350 disabled:opacity-40 disabled:hover:border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
          </button>
          <span>Page {page}</span>
          <button
            onClick={onNextPage}
            disabled={!hasMore}
            className="p-1.5 border border-slate-200 hover:border-slate-350 disabled:opacity-40 disabled:hover:border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {expenses.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Subcategory</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium text-xs">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/20">
                  <td className="p-3 font-semibold">{formatDate(exp.expense_date)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getCategoryColor(exp.category)}`}>
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800">{exp.subcategory}</td>
                  <td className="p-3 text-slate-400 font-semibold max-w-[150px] truncate" title={exp.description}>
                    {exp.description || '—'}
                  </td>
                  <td className="p-3 text-right font-black text-slate-700">{formatINR(exp.amount)}</td>
                  <td className="p-3 font-bold text-slate-500">{exp.payment_method || '—'}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => onEdit(exp)}
                        className="text-slate-450 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="text-slate-455 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-slate-450 font-semibold py-12 text-xs">
            No expenses recorded for this period.
          </div>
        )}
      </div>
    </div>
  );
}
