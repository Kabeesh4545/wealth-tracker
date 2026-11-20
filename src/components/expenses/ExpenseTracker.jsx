import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, AlertCircle, Zap, Coffee, ShoppingBag, Car, Utensils, Clock, Flame } from 'lucide-react';
import api from '../../services/api';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseSummary from './ExpenseSummary';
import MonthlyComparison from './MonthlyComparison';
import SpendingTrend from './SpendingTrend';

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [trends, setTrends] = useState([]);
  
  // Date selection states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 10;

  // Modals / forms triggers
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const years = [];
  const currentYr = new Date().getFullYear();
  for (let y = currentYr; y >= currentYr - 2; y--) {
    years.push(y);
  }

  // Load everything
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch expenses list
      const expRes = await api.get(`/api/expenses`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
          page,
          page_size: PAGE_SIZE
        }
      });
      setExpenses(expRes.data);
      setHasMore(expRes.data.length === PAGE_SIZE);

      // 2. Fetch monthly summary totals
      const sumRes = await api.get(`/api/expenses/summary`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setSummary(sumRes.data);

      // 3. Fetch planned vs actual comparison
      const compRes = await api.get(`/api/expenses/planned-vs-actual`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setComparisons(compRes.data.categories);

      // 4. Fetch 6-month historical trend
      const trendRes = await api.get(`/api/expenses/trend`);
      setTrends(trendRes.data);

    } catch (err) {
      console.error("Error loading tracker data:", err);
      setError("Failed to retrieve expense records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear, page]);

  const handleSave = async (payload) => {
    try {
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post(`/api/expenses`, payload);
      }
      setShowForm(false);
      setEditingExpense(null);
      // Reload on save
      loadData();
    } catch (err) {
      throw err; // rethrow to form for display
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      loadData();
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense record.");
    }
  };

  const triggerEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleQuickAdd = (preset) => {
    setEditingExpense({
      amount: preset.amount,
      category: preset.category,
      subcategory: preset.subcategory,
      expense_date: new Date().toISOString().split('T')[0],
      description: preset.description,
      payment_method: 'UPI'
    });
    setShowForm(true);
  };

  // Safe pace calculations
  const today = new Date();
  const isCurrentMonth = selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysRemaining = isCurrentMonth ? Math.max(1, totalDaysInMonth - today.getDate()) : totalDaysInMonth;
  const plannedBudget = summary?.planned_budget || 0;
  const totalSpent = summary?.total_expenses || 0;
  const budgetRemaining = Math.max(0, plannedBudget - totalSpent);
  const safePacePerDay = Math.round(budgetRemaining / daysRemaining);
  const budgetUsedPct = plannedBudget > 0 ? Math.min(100, Math.round((totalSpent / plannedBudget) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-6 py-6">
      
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Actual Expenses Tracking</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Log and reconcile your actual expenditures against your planned budget.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(Number(e.target.value)); setPage(1); }}
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2 cursor-pointer outline-hidden shrink-0"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setPage(1); }}
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2 cursor-pointer outline-hidden shrink-0"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Quick add button */}
          <button
            onClick={() => { setEditingExpense(null); setShowForm(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors w-full md:w-auto justify-center"
          >
            <PlusCircle size={14} />
            Add Expense
          </button>
        </div>
      </div>

      {/* 1-TAP QUICK ADD PRESETS BAR */}
      <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-700">1-Tap Quick Log:</span>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Tap to log frequent transactions instantly</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => handleQuickAdd({ amount: 50, category: 'Lifestyle', subcategory: 'Eating Outside', description: 'Chai & Snacks' })}
            className="flex items-center gap-1 text-xs font-bold bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-all whitespace-nowrap"
          >
            <Coffee size={13} className="text-amber-600" />
            + ₹50 Chai
          </button>

          <button
            onClick={() => handleQuickAdd({ amount: 150, category: 'Lifestyle', subcategory: 'Eating Outside', description: 'Lunch / Food' })}
            className="flex items-center gap-1 text-xs font-bold bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-all whitespace-nowrap"
          >
            <Utensils size={13} className="text-amber-600" />
            + ₹150 Lunch
          </button>

          <button
            onClick={() => handleQuickAdd({ amount: 200, category: 'Essential', subcategory: 'Transportation', description: 'Fuel / Auto Commute' })}
            className="flex items-center gap-1 text-xs font-bold bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-all whitespace-nowrap"
          >
            <Car size={13} className="text-blue-600" />
            + ₹200 Fuel
          </button>

          <button
            onClick={() => handleQuickAdd({ amount: 500, category: 'Essential', subcategory: 'Food & Groceries', description: 'Supermarket Groceries' })}
            className="flex items-center gap-1 text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-all whitespace-nowrap"
          >
            <ShoppingBag size={13} className="text-emerald-600" />
            + ₹500 Groceries
          </button>
        </div>
      </div>

      {/* LIVE CATEGORY BURN METER & SAFE DAILY PACE */}
      {plannedBudget > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4.5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Flame size={16} className={budgetUsedPct > 90 ? 'text-rose-400' : 'text-amber-400'} />
              <span className="font-extrabold text-white">Monthly Budget Burn Meter</span>
              <span className="text-[10px] text-slate-400">({selectedMonth}/{selectedYear})</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-300">Spent: <strong className="text-white">₹{totalSpent.toLocaleString('en-IN')}</strong> of ₹{plannedBudget.toLocaleString('en-IN')}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${budgetUsedPct > 90 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                {budgetUsedPct}% Used
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${budgetUsedPct > 90 ? 'bg-rose-500' : budgetUsedPct > 70 ? 'bg-amber-400' : 'bg-teal-400'}`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10 gap-1">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-teal-400" />
              <span><strong>{daysRemaining} days remaining</strong> in this month</span>
            </div>
            <div className="text-right">
              <span>Safe Spending Pace: </span>
              <strong className="text-teal-300 text-xs">₹{safePacePerDay.toLocaleString('en-IN')} / day</strong>
              <span className="text-slate-400 ml-1">remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      {loading && !summary ? (
        <div className="flex justify-center items-center py-24 text-teal-600 gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-bold">Synchronizing expense logs...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-2.5 text-rose-600 max-w-md mx-auto text-xs font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Panel */}
          {summary && <ExpenseSummary summary={summary} />}

          {/* Side-by-Side: Comparisons & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyComparison comparisons={comparisons} />
            <SpendingTrend trends={trends} />
          </div>

          {/* Ledger Table */}
          <ExpenseList
            expenses={expenses}
            page={page}
            hasMore={hasMore}
            onPrevPage={() => setPage(p => Math.max(p - 1, 1))}
            onNextPage={() => setPage(p => p + 1)}
            onEdit={triggerEdit}
            onDelete={handleDelete}
          />

        </div>
      )}

      {/* Expense Form Modal popup */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <ExpenseForm
            expense={editingExpense}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingExpense(null); }}
          />
        </div>
      )}

    </div>
  );
}
