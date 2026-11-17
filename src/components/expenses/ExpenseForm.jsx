import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

const CATEGORIES_MAP = {
  "Essential": [
    "Food & Groceries", "Transportation", "Electricity", "Water", 
    "Internet", "Mobile", "Healthcare", "Education", "Insurance"
  ],
  "Lifestyle": [
    "Shopping", "Entertainment", "Eating Outside", "Travel", 
    "Subscriptions", "Hobbies", "Other"
  ],
  "Housing": [
    "Rent", "Maintenance", "Other Housing"
  ],
  "Debt": [
    "Loan EMI", "Other Debt"
  ]
};

const PAYMENT_METHODS = ["Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer", "Other"];

export default function ExpenseForm({ expense, onSave, onCancel }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCategory(expense.category);
      setSubcategory(expense.subcategory);
      setDateVal(expense.expense_date);
      setDescription(expense.description || '');
      setPaymentMethod(expense.payment_method || '');
    }
  }, [expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category || !subcategory || !dateVal) {
      setError('Please fill in all required fields');
      return;
    }

    if (Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Future date validation
    if (new Date(dateVal) > new Date()) {
      setError('Actual expenses cannot be recorded for a future date.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const payload = {
        amount: Number(amount),
        category,
        subcategory,
        expense_date: dateVal,
        description: description || null,
        payment_method: paymentMethod || null
      };
      await onSave(payload);
    } catch (err) {
      console.error("Error submitting expense:", err);
      setError(err.response?.data?.detail || 'Unable to save this expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 max-w-md w-full relative">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg cursor-pointer hover:bg-slate-50"
      >
        <X size={18} />
      </button>

      <h3 className="font-extrabold text-slate-800 text-lg mb-4">
        {expense ? 'Modify Expense Transaction' : 'Record New Expenditure'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
            Amount (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="250.50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3 py-2.5 outline-hidden"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className="w-full text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2.5 outline-hidden cursor-pointer"
              required
            >
              <option value="">Select</option>
              {Object.keys(CATEGORIES_MAP).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
              Subcategory *
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2.5 outline-hidden cursor-pointer"
              disabled={!category}
              required
            >
              <option value="">Select</option>
              {category && CATEGORIES_MAP[category].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
            Transaction Date *
          </label>
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2.5 outline-hidden cursor-pointer"
            required
          />
        </div>

        <div>
          <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="E.g. Weekly groceries at DMart"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2.5 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2.5 outline-hidden cursor-pointer"
          >
            <option value="">Select Method</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 className="animate-spin" size={14} />}
            {expense ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
