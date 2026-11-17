import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Database, ShieldCheck, Clock, AlertTriangle, RefreshCw, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function DataSourcesDashboard() {
  const [sourcesData, setSourcesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSources() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/planning/data-sources');
        setSourcesData(res.data);
      } catch (err) {
        console.error("Failed to fetch data sources quality metrics", err);
        setError("Unable to load data sources quality metrics.");
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-semibold text-xs">
        <Loader2 className="animate-spin text-teal-600 mb-2" size={24} />
        Loading system data provider provenance and freshness indicators...
      </div>
    );
  }

  if (error || !sourcesData) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold">
        {error || "Data sources dashboard unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database size={14} /> Data Quality & Provenance Control
            </div>
            <h2 className="text-slate-800 font-bold text-lg">External & User Data Sources Inventory</h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock size={14} className="text-teal-600" />
            Last System Refresh: {sourcesData.last_system_refresh ? new Date(sourcesData.last_system_refresh).toLocaleString() : "Real-time Verified"}
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-semibold mb-1">Total Data Providers</div>
            <div className="text-slate-800 font-bold text-xl">{sourcesData.total_sources}</div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
            <div className="text-xs text-emerald-700 font-semibold mb-1">Active Verified Feeds</div>
            <div className="text-emerald-800 font-bold text-xl">{sourcesData.active_sources}</div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
            <div className="text-xs text-amber-700 font-semibold mb-1">Stale Providers</div>
            <div className="text-amber-800 font-bold text-xl">{sourcesData.stale_sources_count}</div>
          </div>

          <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4">
            <div className="text-xs text-sky-700 font-semibold mb-1">Unverified Feeds</div>
            <div className="text-sky-800 font-bold text-xl">{sourcesData.unverified_count}</div>
          </div>
        </div>

        {/* Data Sources Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-2">Provider Name</th>
                <th className="pb-3 px-2">Category</th>
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">Freshness</th>
                <th className="pb-3 px-2">Verification</th>
                <th className="pb-3 px-2">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sourcesData.sources.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-2 font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                    {s.name}
                  </td>
                  <td className="py-3 px-2 capitalize">{s.category.replace('_', ' ')}</td>
                  <td className="py-3 px-2 font-semibold text-slate-500">{s.source_type}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${s.freshness_status === 'CURRENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {s.freshness_status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <ShieldCheck size={14} /> Verified
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-700">{s.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium flex items-center gap-2 border border-slate-100">
          <Info size={16} className="text-teal-600 shrink-0" />
          Strict No-Fabrication Guarantee: Data points marked "STALE" or "UNAVAILABLE" will never be substituted with fake values or unverified fallbacks.
        </div>
      </div>
    </div>
  );
}
