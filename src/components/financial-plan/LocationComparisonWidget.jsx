import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MapPin, ArrowRightLeft, TrendingUp, TrendingDown, Info, AlertCircle, Loader2 } from 'lucide-react';

const SUPPORTED_CITIES = [
  'Coimbatore', 'Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai',
  'Delhi', 'Pune', 'Kochi', 'Madurai', 'Salem', 'Tiruppur', 'Erode'
];

export default function LocationComparisonWidget({ currentCity, onCityChanged }) {
  const [targetCity, setTargetCity] = useState(currentCity === 'Bengaluru' ? 'Coimbatore' : 'Bengaluru');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetCity || targetCity === currentCity) return;
    async function fetchComparison() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/planning/location-comparison', {
          params: { target_city: targetCity }
        });
        setComparison(res.data);
      } catch (err) {
        console.error("Failed to load location comparison", err);
        setError("Location benchmark comparison unavailable for selected city.");
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, [targetCity, currentCity]);

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <MapPin size={14} /> Location Cost Intelligence
          </div>
          <h3 className="text-slate-800 font-bold text-base">City Relocation Cost Simulator</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-500">Compare with:</div>
          <select
            value={targetCity}
            onChange={(e) => setTargetCity(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl px-3 py-2 outline-none focus:border-teal-500"
          >
            {SUPPORTED_CITIES.map(c => (
              <option key={c} value={c} disabled={c.toLowerCase() === currentCity.toLowerCase()}>
                {c} {c.toLowerCase() === currentCity.toLowerCase() ? "(Current)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8 text-slate-500 text-xs font-semibold">
          <Loader2 className="animate-spin text-teal-600 mr-2" size={18} /> Calculating city cost comparison...
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {comparison && !loading && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">Current ({comparison.previous_city}) Essentials</div>
              <div className="text-slate-800 font-bold text-base">₹{comparison.previous_total_essentials.toLocaleString()}</div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold mb-1">Target ({comparison.current_city}) Essentials</div>
              <div className="text-slate-800 font-bold text-base">₹{comparison.current_total_essentials.toLocaleString()}</div>
            </div>

            <div className={`border rounded-2xl p-4 ${comparison.total_essential_delta > 0 ? 'bg-rose-50/50 border-rose-200 text-rose-800' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'}`}>
              <div className="text-xs font-semibold mb-1">Essential Cost Delta</div>
              <div className="font-bold text-base flex items-center gap-1">
                {comparison.total_essential_delta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {comparison.total_essential_delta > 0 ? '+' : ''}₹{comparison.total_essential_delta.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">{comparison.previous_city} Benchmark</th>
                  <th className="pb-3 px-2">{comparison.current_city} Benchmark</th>
                  <th className="pb-3 px-2">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {comparison.comparison_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-2 font-bold text-slate-800">{item.category}</td>
                    <td className="py-3 px-2">{item.previous_city_benchmark !== null ? `₹${item.previous_city_benchmark.toLocaleString()}` : "Unavailable"}</td>
                    <td className="py-3 px-2">{item.current_city_benchmark !== null ? `₹${item.current_city_benchmark.toLocaleString()}` : "Unavailable"}</td>
                    <td className="py-3 px-2">
                      {item.delta_amount !== null ? (
                        <span className={`font-semibold ${item.delta_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.delta_amount > 0 ? '+' : ''}₹{item.delta_amount.toLocaleString()} ({item.percentage_change}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-medium flex items-center gap-2">
            <Info size={14} className="text-teal-600 shrink-0" />
            {comparison.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
