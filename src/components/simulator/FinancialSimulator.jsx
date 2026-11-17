import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  IndianRupee,
  Play,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp as TrendUpIcon,
  HelpCircle,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

const CATEGORIES_MAP = {
  "Essential": [
    "Food & Groceries",
    "Transportation",
    "Electricity",
    "Water",
    "Internet",
    "Mobile",
    "Healthcare",
    "Education",
    "Insurance"
  ],
  "Lifestyle": [
    "Shopping",
    "Entertainment",
    "Eating Outside",
    "Travel",
    "Subscriptions",
    "Hobbies",
    "Other"
  ],
  "Housing": [
    "Rent",
    "Maintenance",
    "Other Housing"
  ]
};

export default function FinancialSimulator() {
  // Scenario state selectors
  const [scenarioType, setScenarioType] = useState('salary_change');
  const [formData, setFormData] = useState({
    new_salary: '',
    category: 'Essential',
    subcategory: 'Food & Groceries',
    new_monthly_amount: '',
    loan_id: '',
    new_emi: '',
    new_monthly_savings: '',
    name: '',
    target_amount: '',
    current_saved: '',
    target_date: ''
  });

  // Data states
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Fetch loans on mount for the dropdown list
  useEffect(() => {
    async function fetchLoans() {
      setLoadingLoans(true);
      try {
        const res = await api.get('/api/loans');
        setLoans(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, loan_id: res.data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load user loans", err);
      } finally {
        setLoadingLoans(false);
      }
    }
    fetchLoans();
  }, []);

  // Update subcategories when category selection changes
  useEffect(() => {
    if (scenarioType === 'expense_change') {
      const subcats = CATEGORIES_MAP[formData.category] || [];
      if (subcats.length > 0) {
        setFormData(prev => ({ ...prev, subcategory: subcats[0] }));
      }
    }
  }, [formData.category, scenarioType]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleReset = () => {
    setFormData({
      new_salary: '',
      category: 'Essential',
      subcategory: 'Food & Groceries',
      new_monthly_amount: '',
      loan_id: loans.length > 0 ? loans[0].id : '',
      new_emi: '',
      new_monthly_savings: '',
      name: '',
      target_amount: '',
      current_saved: '',
      target_date: ''
    });
    setResult(null);
    setError(null);
    setFormError(null);
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    setSimulating(true);
    setError(null);
    setFormError(null);

    // Validate inputs locally
    let payload = {};
    try {
      if (scenarioType === 'salary_change') {
        if (!formData.new_salary) throw new Error("Salary amount is required.");
        payload = { new_salary: formData.new_salary };
      } else if (scenarioType === 'expense_change') {
        if (!formData.new_monthly_amount) throw new Error("Expense amount is required.");
        payload = {
          category: formData.category,
          subcategory: formData.subcategory,
          new_monthly_amount: formData.new_monthly_amount
        };
      } else if (scenarioType === 'loan_change') {
        if (!formData.loan_id) throw new Error("Select a loan to modify.");
        if (!formData.new_emi) throw new Error("New EMI amount is required.");
        payload = {
          loan_id: parseInt(formData.loan_id),
          new_emi: formData.new_emi
        };
      } else if (scenarioType === 'savings_change') {
        if (!formData.new_monthly_savings) throw new Error("Savings amount is required.");
        payload = { new_monthly_savings: formData.new_monthly_savings };
      } else if (scenarioType === 'new_goal') {
        if (!formData.name) throw new Error("Goal name is required.");
        if (!formData.target_amount) throw new Error("Target amount is required.");
        if (!formData.current_saved) throw new Error("Current saved amount is required.");
        if (!formData.target_date) throw new Error("Target date is required.");
        payload = {
          name: formData.name,
          target_amount: formData.target_amount,
          current_saved: formData.current_saved,
          target_date: formData.target_date
        };
      }

      const response = await api.post('/api/simulator/what-if', {
        scenario_type: scenarioType,
        scenario_data: payload
      });

      setResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || "Failed to run simulation.");
      }
    } finally {
      setSimulating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Improved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Worsened': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDeltaColor = (val) => {
    const num = Number(val || 0);
    if (num > 0) return 'text-emerald-600 font-bold';
    if (num < 0) return 'text-rose-600 font-bold';
    return 'text-slate-500 font-medium';
  };

  const formatDelta = (val) => {
    const num = Number(val || 0);
    const sign = num > 0 ? '+' : '';
    return `${sign}₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft className="text-teal-600 shrink-0" size={28} />
            What-If Financial Simulator
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
            Statelessly evaluate hypothetical changes in income, expenses, debts, or goals to see their impact on your surplus and monthly budget.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Setup overrides */}
        <div className="lg:col-span-5 premium-card bg-white p-5 rounded-2xl border border-slate-100 shadow-md">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers size={18} className="text-teal-500" />
            Configure Hypothetical Scenario
          </h2>

          <form onSubmit={handleRunSimulation} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scenario Type</label>
              <select
                value={scenarioType}
                onChange={(e) => {
                  setScenarioType(e.target.value);
                  setError(null);
                  setFormError(null);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500 transition-colors"
              >
                <option value="salary_change">Hypothetical Salary Change</option>
                <option value="expense_change">Hypothetical Expense Adjustment</option>
                <option value="loan_change">Hypothetical Loan/EMI Modification</option>
                <option value="savings_change">Hypothetical Savings Rate Change</option>
                <option value="new_goal">Hypothetical New Goal Addition</option>
              </select>
            </div>

            {/* Dynamic input renderers */}
            {scenarioType === 'salary_change' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">New Monthly Salary</label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.new_salary}
                    onChange={(e) => handleInputChange('new_salary', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Test what happens if your monthly base salary changes.</p>
              </div>
            )}

            {scenarioType === 'expense_change' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="Essential">Essential</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Housing">Housing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                  >
                    {(CATEGORIES_MAP[formData.category] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Monthly Amount</label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.new_monthly_amount}
                      onChange={(e) => handleInputChange('new_monthly_amount', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {scenarioType === 'loan_change' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Loan to Modify</label>
                  {loadingLoans ? (
                    <div className="text-xs text-slate-400 py-2">Loading active loans...</div>
                  ) : loans.length === 0 ? (
                    <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-xl font-medium">
                      You have no active loans declared. Go to profile questionnaire to add one!
                    </div>
                  ) : (
                    <select
                      value={formData.loan_id}
                      onChange={(e) => handleInputChange('loan_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                    >
                      {loans.map(loan => (
                        <option key={loan.id} value={loan.id}>
                          {loan.loan_type} (O/S: ₹{Number(loan.outstanding_amount).toLocaleString('en-IN')}, EMI: ₹{Number(loan.monthly_emi).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {loans.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Monthly EMI</label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                        ₹
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.new_emi}
                        onChange={(e) => handleInputChange('new_emi', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Simulate refinance or prepayment impact on cashflow.</p>
                  </div>
                )}
              </div>
            )}

            {scenarioType === 'savings_change' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">New Monthly Savings Pool</label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.new_monthly_savings}
                    onChange={(e) => handleInputChange('new_monthly_savings', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Overrides the default savings pool (surplus minus investments) to test allocations.</p>
              </div>
            )}

            {scenarioType === 'new_goal' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Goal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dream Car, Postgrad Studies"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="50000"
                      value={formData.target_amount}
                      onChange={(e) => handleInputChange('target_amount', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Saved</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={formData.current_saved}
                      onChange={(e) => handleInputChange('current_saved', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Date</label>
                  <input
                    type="month"
                    value={formData.target_date}
                    onChange={(e) => handleInputChange('target_date', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-teal-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error notifications */}
            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-3 rounded-xl flex items-start gap-1.5 font-medium leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {formError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-3 rounded-xl flex items-start gap-1.5 font-medium leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={15} />
                Reset Baseline
              </button>
              <button
                type="submit"
                disabled={simulating || (scenarioType === 'loan_change' && loans.length === 0)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-teal-600/10 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {simulating ? 'Calculating...' : 'Run Simulation'}
                <Play size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Results outputs */}
        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-white flex flex-col items-center justify-center shadow-xs">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">No Simulation Running</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm font-medium">
                Choose a hypothetical parameters change on the left, click "Run Simulation", and we will calculate all budgeting outputs side-by-side.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {/* Status banner */}
              <div className={`border p-4 rounded-2xl flex items-center justify-between shadow-xs ${getStatusColor(result.scenario_status)}`}>
                <div className="flex items-center gap-2">
                  {result.scenario_status === 'Improved' ? (
                    <TrendingUp size={22} className="text-emerald-600" />
                  ) : result.scenario_status === 'Worsened' ? (
                    <TrendingDown size={22} className="text-rose-600" />
                  ) : (
                    <Info size={22} className="text-slate-500" />
                  )}
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-65">Simulation Output</span>
                    <span className="text-sm font-extrabold">Scenario Status: {result.scenario_status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider opacity-65">Surplus Change</span>
                  <span className={`text-base font-extrabold ${getDeltaColor(result.impact.surplus_change)}`}>
                    {formatDelta(result.impact.surplus_change)}/mo
                  </span>
                </div>
              </div>

              {/* Numerical changes grid */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Immediate Changes Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center uppercase tracking-wider font-bold">
                  <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400">Income</span>
                    <span className={`block text-xs mt-1 ${getDeltaColor(result.impact.income_change)}`}>
                      {formatDelta(result.impact.income_change)}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400">Expenses</span>
                    <span className={`block text-xs mt-1 ${getDeltaColor(-result.impact.expense_change)}`}>
                      {formatDelta(-result.impact.expense_change)}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400">EMI Payments</span>
                    <span className={`block text-xs mt-1 ${getDeltaColor(-result.impact.emi_change)}`}>
                      {formatDelta(-result.impact.emi_change)}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400">Investments</span>
                    <span className={`block text-xs mt-1 ${getDeltaColor(result.impact.investment_capacity_change)}`}>
                      {formatDelta(result.impact.investment_capacity_change)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side by side comparison table */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs overflow-hidden">
                <h3 className="text-sm font-bold text-slate-800 mb-3.5">Current Plan vs Simulated Scenario</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5">Parameter</th>
                        <th className="py-2.5 text-right pr-4">Current Plan</th>
                        <th className="py-2.5 text-right pr-4">Scenario Plan</th>
                        <th className="py-2.5 text-right">Delta Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-600">
                      <tr>
                        <td className="py-3 font-bold text-slate-700">Monthly Surplus</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.cash_flow.monthly_surplus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.cash_flow.monthly_surplus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.surplus_change)}`}>
                          {formatDelta(result.impact.surplus_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-slate-700">Planning Income</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.income.planning_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.income.planning_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.income_change)}`}>
                          {formatDelta(result.impact.income_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-slate-700">Total Expenses</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.expenses.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.expenses.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(-result.impact.expense_change)}`}>
                          {formatDelta(-result.impact.expense_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-slate-700">EMI Payments</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.debt.total_emi).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.debt.total_emi).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(-result.impact.emi_change)}`}>
                          {formatDelta(-result.impact.emi_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-slate-700">Debt Ratio (DTI)</td>
                        <td className="py-3 text-right pr-4">{(Number(result.current.debt.debt_to_income_ratio) * 100).toFixed(1)}%</td>
                        <td className="py-3 text-right pr-4">{(Number(result.scenario.debt.debt_to_income_ratio) * 100).toFixed(1)}%</td>
                        <td className={`py-3 text-right ${(Number(result.scenario.debt.debt_to_income_ratio) - Number(result.current.debt.debt_to_income_ratio)) > 0 ? 'text-rose-600' : (Number(result.scenario.debt.debt_to_income_ratio) - Number(result.current.debt.debt_to_income_ratio)) < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {((Number(result.scenario.debt.debt_to_income_ratio) - Number(result.current.debt.debt_to_income_ratio)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-slate-700">Emergency Fund Target</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.emergency_fund.recommended_target).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.emergency_fund.recommended_target).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.scenario.emergency_fund.recommended_target - result.current.emergency_fund.recommended_target)}`}>
                          {formatDelta(result.scenario.emergency_fund.recommended_target - result.current.emergency_fund.recommended_target)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider" colSpan="4">Budget Allocations</td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3 font-bold text-slate-700">Emergency Fund Alloc.</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.budget.emergency_fund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.budget.emergency_fund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.emergency_fund_change)}`}>
                          {formatDelta(result.impact.emergency_fund_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3 font-bold text-slate-700">Goal Capacities Alloc.</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.budget.goals).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.budget.goals).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.goal_capacity_change)}`}>
                          {formatDelta(result.impact.goal_capacity_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3 font-bold text-slate-700">Investment Capacity</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.current.budget.investments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.scenario.budget.investments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.investment_capacity_change)}`}>
                          {formatDelta(result.impact.investment_capacity_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3 font-bold text-slate-700">Monthly Spending Limit</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.impact.current_spending_limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.impact.scenario_spending_limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.spending_limit_change)}`}>
                          {formatDelta(result.impact.spending_limit_change)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3 font-bold text-slate-700">Safe Discretionary Limit</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.impact.current_safe_to_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right pr-4">₹{Number(result.impact.scenario_safe_to_spend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 text-right ${getDeltaColor(result.impact.safe_to_spend_change)}`}>
                          {formatDelta(result.impact.safe_to_spend_change)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Explanations & Strategic recommendations */}
              {result.explanations && result.explanations.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-teal-600" />
                    Simulation Insights & Impact Analysis
                  </h3>
                  <div className="space-y-2.5">
                    {result.explanations.map((exp, idx) => (
                      <div key={idx} className="bg-white border border-slate-100/70 p-3.5 rounded-xl text-xs text-slate-500 font-medium leading-relaxed flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5"></span>
                        <p>{exp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[10px] text-slate-400 font-medium flex items-start gap-1.5 px-1">
                <Info size={12} className="shrink-0 mt-0.5 opacity-70" />
                <p>
                  <strong>Notice:</strong> This simulation is entirely hypothetical and is executed in-memory. It will NOT alter your real budget, saved loans, or financial goals in the PostgreSQL database.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
