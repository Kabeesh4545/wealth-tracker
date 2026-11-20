import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Calendar, Trash2, Edit3, PlusCircle, Loader2, AlertCircle, Target, CheckCircle2, ChevronRight, ListFilter, Clock, Sparkles, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const SOURCES = ["Bank Savings", "Salary", "Cash", "Other"];

export default function GoalDetailsView({ initialSelectedGoalId }) {
  const [goals, setGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [filterType, setFilterType] = useState('All'); // 'All' | 'On Track' | 'Behind' | 'Completed' | 'Overdue'

  // Pagination for logs
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 5;

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [editingContrib, setEditingContrib] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState(new Date().toISOString().split('T')[0]);
  const [contribDesc, setContribDesc] = useState('');
  const [contribSource, setContribSource] = useState('Bank Savings');

  const [loading, setLoading] = useState(true);
  const [contribLoading, setContribLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [boostAmount, setBoostAmount] = useState(500);

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

  const loadGoalsProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/goals/progress');
      setGoals(res.data);

      const sumRes = await api.get('/api/goals/summary');
      setSummary(sumRes.data);

      // Handle initial goal selection
      if (res.data.length > 0) {
        const found = res.data.find(g => g.goal_id === initialSelectedGoalId) || res.data[0];
        setSelectedGoal(found);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load goal progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadContributions = async (goalId) => {
    if (!goalId) return;
    try {
      const res = await api.get(`/api/goals/${goalId}/contributions`, {
        params: { page, page_size: PAGE_SIZE }
      });
      setContributions(res.data);
      setHasMore(res.data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSingleGoalProgress = async (goalId) => {
    if (!goalId) return;
    try {
      const res = await api.get(`/api/goals/${goalId}/progress`);
      // Update selected goal in state
      setSelectedGoal(res.data);
      setGoals(prev => prev.map(g => g.goal_id === goalId ? res.data : g));

      // Reload summary
      const sumRes = await api.get('/api/goals/summary');
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTrendData = async () => {
    try {
      const res = await api.get('/api/goals/trend');
      setTrend(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGoalsProgress();
    loadTrendData();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      loadContributions(selectedGoal.goal_id);
    }
  }, [selectedGoal, page]);

  const handleOpenAddModal = () => {
    setEditingContrib(null);
    setContribAmount('');
    setContribDate(new Date().toISOString().split('T')[0]);
    setContribDesc('');
    setContribSource('Bank Savings');
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (contrib) => {
    setEditingContrib(contrib);
    setContribAmount(contrib.amount);
    setContribDate(contrib.contribution_date);
    setContribDesc(contrib.description || '');
    setContribSource(contrib.source || 'Bank Savings');
    setModalError('');
    setShowModal(true);
  };

  const handleSaveContribution = async (e) => {
    e.preventDefault();
    if (!contribAmount || !contribDate || !contribSource) {
      setModalError("Please fill in all required fields.");
      return;
    }

    if (Number(contribAmount) <= 0) {
      setModalError("Amount must be greater than 0.");
      return;
    }

    if (new Date(contribDate) > new Date()) {
      setModalError("Actual goal contributions cannot be recorded for a future date.");
      return;
    }

    setContribLoading(true);
    setModalError('');

    try {
      const payload = {
        amount: Number(contribAmount),
        contribution_date: contribDate,
        description: contribDesc || null,
        source: contribSource
      };

      if (editingContrib) {
        await api.put(`/api/goals/${selectedGoal.goal_id}/contributions/${editingContrib.id}`, payload);
      } else {
        await api.post(`/api/goals/${selectedGoal.goal_id}/contributions`, payload);
      }

      setShowModal(false);
      // Reload details after DB confirmation
      await loadContributions(selectedGoal.goal_id);
      await loadSingleGoalProgress(selectedGoal.goal_id);
      await loadTrendData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.detail || "Unable to save contribution.");
    } finally {
      setContribLoading(false);
    }
  };

  const handleDeleteContribution = async (id) => {
    if (!window.confirm("Delete this contribution?")) return;
    try {
      await api.delete(`/api/goals/${selectedGoal.goal_id}/contributions/${id}`);
      await loadContributions(selectedGoal.goal_id);
      await loadSingleGoalProgress(selectedGoal.goal_id);
      await loadTrendData();
    } catch (err) {
      console.error(err);
      alert("Unable to delete contribution.");
    }
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Overdue') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (status === 'On Track') return 'bg-teal-50 text-teal-700 border-teal-100';
    return 'bg-amber-50 text-amber-700 border-amber-100'; // Behind / Challenging
  };

  const filteredGoals = goals.filter(g => {
    if (filterType === 'All') return true;
    return g.actual_status === filterType;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-6 py-6">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Savings Goals Command Center</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Compare planned allocations against actual historical contributions to track real goal progress.
          </p>
        </div>
      </div>

      {/* 1. Summary Metrics Panel */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Total Targets</span>
            <span className="text-lg font-black text-slate-800 block mt-1">{formatINR(summary.total_target)}</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">{summary.total_goals} goal objectives</span>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Total Saved</span>
            <span className="text-lg font-black text-teal-600 block mt-1">{formatINR(summary.total_saved)}</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Initial + contributions</span>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Remaining Gap</span>
            <span className="text-lg font-black text-slate-800 block mt-1">{formatINR(summary.total_remaining)}</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Net outstanding balance</span>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Completed Goals</span>
            <span className="text-lg font-black text-emerald-600 block mt-1">{summary.completed_goals}</span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Objectives fully funded</span>
          </div>
          <div className="hidden lg:block bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">On Track vs Behind</span>
            <span className="text-lg font-black text-amber-600 block mt-1">
              {summary.on_track_goals} / {summary.behind_goals}
            </span>
            <span className="text-[9px] text-slate-400 font-semibold block mt-1">Status index breakdown</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24 text-teal-600 gap-2">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-bold">Synchronizing goal progress files...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-2.5 text-rose-600 max-w-md mx-auto text-xs font-bold">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* 2. Left side: Goals selectors list with status filters */}
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h4 className="font-extrabold text-slate-800 text-sm">Financial Objectives</h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <ListFilter size={13} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-0 font-bold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="On Track">On Track</option>
                  <option value="Behind">Behind</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredGoals.map((g) => (
                <button
                  key={g.goal_id}
                  onClick={() => { setSelectedGoal(g); setPage(1); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedGoal?.goal_id === g.goal_id
                      ? 'border-teal-500 bg-teal-50/10 shadow-xs'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <span className="font-extrabold text-xs text-slate-800 block truncate">{g.goal_name}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <span className="font-black text-slate-700">{formatINR(g.current_saved)}</span>
                      <span>/</span>
                      <span>{formatINR(g.target_amount)}</span>
                    </div>
                    {/* Visual Progress Line */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${g.progress_percentage}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 border rounded-full font-bold text-[8px] uppercase tracking-wider ${getStatusBadgeColor(g.actual_status)}`}>
                      {g.actual_status}
                    </span>
                    <ChevronRight size={14} className="text-slate-350" />
                  </div>
                </button>
              ))}
              {filteredGoals.length === 0 && (
                <div className="text-center py-12 text-xs font-semibold text-slate-400">
                  No matching goals found.
                </div>
              )}
            </div>
          </div>

          {/* 3. Right side: Detailed Selected Goal Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedGoal ? (
              <div className="space-y-6">
                
                {/* Detailed card status details */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-slate-800 text-base">{selectedGoal.goal_name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                        Timeline Target: {formatDate(selectedGoal.target_date)} ({selectedGoal.months_remaining} months remaining)
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`px-2.5 py-0.5 border rounded-full font-bold text-[9px] uppercase tracking-wider ${getStatusBadgeColor(selectedGoal.actual_status)}`}>
                        Actual Status: {selectedGoal.actual_status}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        Planning Status: {selectedGoal.planning_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-semibold text-slate-400 border-t border-slate-50 pt-4">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider">Target Amount</span>
                      <span className="text-slate-800 font-black text-sm">{formatINR(selectedGoal.target_amount)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider">Initial Saved</span>
                      <span className="text-slate-500 font-bold text-sm">{formatINR(selectedGoal.original_saved)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider">Current Saved</span>
                      <span className="text-teal-600 font-black text-sm">{formatINR(selectedGoal.current_saved)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider">Outstanding Gap</span>
                      <span className="text-slate-800 font-black text-sm">{formatINR(selectedGoal.remaining_amount)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-650">
                      <span>Funding Progress</span>
                      <span>{selectedGoal.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${selectedGoal.progress_percentage}%` }}></div>
                    </div>
                  </div>

                  {/* Target Completion Countdown & Boost Calculator */}
                  {selectedGoal.actual_status !== 'Completed' && (() => {
                    const monthlyContrib = Number(selectedGoal.required_monthly_contribution || selectedGoal.planned_monthly_contribution || 1000);
                    const remainingGap = Math.max(0, Number(selectedGoal.remaining_amount || (selectedGoal.target_amount - selectedGoal.current_saved)));
                    const currentMonthsNeeded = monthlyContrib > 0 ? Math.ceil(remainingGap / monthlyContrib) : 12;
                    const boostedContrib = monthlyContrib + boostAmount;
                    const boostedMonthsNeeded = Math.ceil(remainingGap / boostedContrib);
                    const monthsSaved = Math.max(0, currentMonthsNeeded - boostedMonthsNeeded);
                    const targetDateObj = new Date();
                    targetDateObj.setMonth(targetDateObj.getMonth() + currentMonthsNeeded);
                    const projectedDateStr = targetDateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

                    return (
                      <div className="bg-gradient-to-r from-teal-50/70 via-white to-teal-50/40 border border-teal-100 rounded-2xl p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-teal-600" />
                            <span className="text-xs font-black text-slate-800">Target Completion Countdown</span>
                          </div>
                          <span className="text-xs font-extrabold text-teal-800 bg-teal-100/70 px-3 py-1 rounded-xl">
                            Estimated: {projectedDateStr} ({currentMonthsNeeded} mos left)
                          </span>
                        </div>

                        {/* Boost Calculator */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Sparkles size={14} className="text-amber-500" />
                              Boost My Goal Simulator:
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Adding <strong className="text-teal-700">+₹{boostAmount.toLocaleString('en-IN')}/mo</strong> reaches this goal{' '}
                              <strong className="text-emerald-700 font-extrabold">{monthsSaved} month{monthsSaved === 1 ? '' : 's'} earlier!</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {[250, 500, 1000, 2000].map(amt => (
                              <button
                                key={amt}
                                onClick={() => setBoostAmount(amt)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  boostAmount === amt
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                +₹{amt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Planned vs Actual contributions breakdown */}
                  <div className="bg-slate-50/50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-450 block text-[9px] font-bold uppercase">Required Monthly Contribution</span>
                      <span className="font-extrabold text-slate-850 block mt-0.5">{formatINR(selectedGoal.required_monthly_contribution)}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-[9px] font-bold uppercase">Planned Contribution (Step 5)</span>
                      <span className="font-extrabold text-slate-850 block mt-0.5">{formatINR(selectedGoal.planned_monthly_contribution)}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block text-[9px] font-bold uppercase">Actual Contribution (Selected Month)</span>
                      <span className={`font-black block mt-0.5 ${selectedGoal.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatINR(selectedGoal.actual_month_contribution)} ({selectedGoal.difference >= 0 ? '+' : ''}{formatINR(selectedGoal.difference)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logs ledger history table */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <h4 className="font-extrabold text-slate-800 text-sm">Contributions Log History</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={handleOpenAddModal}
                        disabled={selectedGoal.actual_status === 'Completed'}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <PlusCircle size={13} />
                        Add Contribution
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {contributions.length > 0 ? (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                            <th className="p-3">Date</th>
                            <th className="p-3">Source</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          {contributions.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/20">
                              <td className="p-3 font-semibold">{formatDate(c.contribution_date)}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 border rounded-full font-bold text-[8px] bg-slate-100 text-slate-600 border-slate-200">
                                  {c.source || 'Other'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 font-semibold max-w-[150px] truncate">{c.description || '—'}</td>
                              <td className="p-3 text-right font-black text-slate-700">{formatINR(c.amount)}</td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditModal(c)}
                                    className="text-slate-450 hover:text-teal-600 hover:bg-teal-50 p-1 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteContribution(c.id)}
                                    className="text-slate-455 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-slate-450 font-semibold">
                        No actual contributions logged for this goal yet.
                      </div>
                    )}
                  </div>

                  {/* Pagination control */}
                  {contributions.length > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 disabled:opacity-40 rounded-lg cursor-pointer"
                      >
                        Prev Page
                      </button>
                      <span>Page {page}</span>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore}
                        className="px-3 py-1.5 border border-slate-200 hover:border-slate-350 disabled:opacity-40 rounded-lg cursor-pointer"
                      >
                        Next Page
                      </button>
                    </div>
                  )}
                </div>

                {/* Recharts Bar trend chart for user savings summary */}
                <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-sm">Aggregate Contributions Trend (All Goals)</h4>
                  <div className="h-44 w-full">
                    {trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month_label" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickFormatter={(v) => `₹${v/1000}k`} />
                          <Tooltip formatter={(value) => formatINR(value)} labelStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="amount" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-slate-450 font-semibold">No trend metrics found.</div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-100 p-12 rounded-2xl shadow-xs text-center text-slate-450 font-semibold text-xs">
                Select a goal to view detailed logs and contribution summaries.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Goal Contribution Add/Edit MODAL Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 max-w-sm w-full relative">
            <h3 className="font-extrabold text-slate-800 text-base mb-4">
              {editingContrib ? 'Modify Contribution Record' : `Save Contribution towards ${selectedGoal?.goal_name}`}
            </h3>

            <form onSubmit={handleSaveContribution} className="space-y-4">
              {modalError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3 py-2 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Contribution Date *
                </label>
                <input
                  type="date"
                  value={contribDate}
                  onChange={(e) => setContribDate(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2 outline-hidden cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Source Funding *
                </label>
                <select
                  value={contribSource}
                  onChange={(e) => setContribSource(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2 outline-hidden cursor-pointer"
                  required
                >
                  {SOURCES.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="E.g. Invested surplus from bonus salary"
                  value={contribDesc}
                  onChange={(e) => setContribDesc(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-350 focus:border-teal-500 rounded-xl px-3 py-2 outline-hidden"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contribLoading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {contribLoading && <Loader2 className="animate-spin" size={13} />}
                  Save Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
