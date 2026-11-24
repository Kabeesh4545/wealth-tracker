import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Shield,
  Zap,
  Globe,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  ArrowRight,
  Sparkles,
  BarChart2,
  Layers
} from 'lucide-react';

export default function MarketTrendsView({ onNavigate }) {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'gainers' | 'losers' | 'indices' | 'stocks' | 'commodities'
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  // 24/7 Auto-refresh polling every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchMarketData = async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get('/api/market/trends');
      setMarketData(res.data);
    } catch (err) {
      console.error('Error fetching market trends:', err);
      setError('Unable to load live market trends. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatINR = (val) => {
    if (val === undefined || val === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const filteredAssets = useMemo(() => {
    if (!marketData || !marketData.all_assets) return [];
    let list = marketData.all_assets;

    // Filter category
    if (selectedCategory === 'indices') {
      list = list.filter(a => a.category.includes('Index'));
    } else if (selectedCategory === 'stocks') {
      list = list.filter(a => a.category === 'Stock');
    } else if (selectedCategory === 'commodities') {
      list = list.filter(a => a.category === 'Commodity');
    } else if (selectedCategory === 'gainers') {
      list = list.filter(a => a.change_percent > 0).sort((a, b) => b.change_percent - a.change_percent);
    } else if (selectedCategory === 'losers') {
      list = list.filter(a => a.change_percent < 0).sort((a, b) => a.change_percent - b.change_percent);
    }

    // Search query filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.symbol.toLowerCase().includes(query) ||
        (a.sector && a.sector.toLowerCase().includes(query))
      );
    }

    return list;
  }, [marketData, selectedCategory, searchTerm]);

  if (loading && !marketData) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
        <Activity className="animate-spin text-teal-600 mx-auto mb-4" size={40} />
        <h3 className="font-bold text-slate-800 text-lg mb-1">Scanning 24/7 Market Trends...</h3>
        <p className="text-slate-400 text-xs font-semibold">Connecting to live NSE/BSE and global market data feeds...</p>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="bg-white border border-rose-100 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg mb-2">Market Feed Unavailable</h3>
        <p className="text-slate-500 text-xs mb-6 font-semibold">{error}</p>
        <button
          onClick={() => fetchMarketData()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
        >
          Retry Feed
        </button>
      </div>
    );
  }

  const status = marketData?.market_status;
  const sentiment = marketData?.market_sentiment;

  return (
    <div className="space-y-6">
      
      {/* 1. Market Header & Live Status Bar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full">
              24/7 Live Intelligence
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${status?.is_open ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{status?.status_label || '24/7 MARKET FEED'}</span>
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Live Market Trends & Stock Intelligence
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <Clock size={12} />
            {status?.session_text} • {status?.ist_time}
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-teal-600 rounded cursor-pointer"
            />
            Auto-refresh (30s)
          </label>

          <button
            onClick={() => fetchMarketData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-teal-600/10 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* 2. Market Sentiment & Breadth Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sentiment Hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full">
                Market Pulse & Outlook
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                sentiment?.score >= 60 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : sentiment?.score >= 45
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {sentiment?.overall || 'Consolidating'}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-teal-400" />
                {sentiment?.overall} Mode
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {sentiment?.summary}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-2xl p-2.5">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">Advances</span>
              <span className="text-base font-black text-white">{sentiment?.advances || 0}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-2.5">
              <span className="text-[10px] font-bold text-rose-400 block uppercase">Declines</span>
              <span className="text-base font-black text-white">{sentiment?.declines || 0}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-2.5">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">India VIX</span>
              <span className="text-base font-black text-white">{sentiment?.india_vix_indicative || 14.2}</span>
            </div>
          </div>
        </div>

        {/* 24/7 Smart SIP Guidance Banner */}
        <div className="bg-gradient-to-br from-teal-50/60 to-white border border-teal-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                Tactical Guidance
              </span>
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-1">
              What Should You Do Today?
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {sentiment?.score < 45 
                ? 'Market corrections are historically the highest returning windows for long-term monthly SIP buyers. Keep automated SIPs active.' 
                : 'Market in active momentum. Continue systematic investing without attempting to time tops or bottoms.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-700">
            <span>Current Asset Stance:</span>
            <span className="bg-teal-600 text-white px-2.5 py-1 rounded-lg text-[11px]">
              Systematic SIP
            </span>
          </div>
        </div>
      </div>

      {/* 3. Major Indices Cards (Nifty 50, Sensex, Bank Nifty, S&P 500) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 size={16} className="text-teal-600" />
            Benchmark Indices & Commodities
          </h2>
          <span className="text-[10px] font-bold text-slate-400">Live / Closing Quotes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(marketData?.indices || []).concat(marketData?.commodities || []).map((asset, idx) => {
            const isPositive = asset.change_percent >= 0;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-800">{asset.name}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
                      {asset.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 block">{asset.symbol}</span>

                  <div className="mt-2.5 flex items-baseline justify-between">
                    <div className="text-lg font-black text-slate-900">
                      {asset.category === 'Global Index' ? `$${asset.price?.toLocaleString('en-US')}` : formatINR(asset.price)}
                    </div>
                    <span className={`text-xs font-black flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                      isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPositive ? '+' : ''}{asset.change_percent}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Day Range:</span>
                  <span className="font-semibold text-slate-700">
                    {asset.day_low?.toLocaleString('en-IN')} – {asset.day_high?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Bluechip Equities & Trending Stocks */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-teal-600" />
              Indian Stock Trends & Recommendations
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live market trends, 24h performance, and suitability suggestions for top companies
            </p>
          </div>

          {/* Search bar & filter tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock or sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto text-xs font-bold no-scrollbar">
              {[
                { id: 'all', label: 'All' },
                { id: 'gainers', label: 'Top Gainers' },
                { id: 'losers', label: 'Top Dips' },
                { id: 'stocks', label: 'Equities' },
                { id: 'indices', label: 'Indices' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all whitespace-nowrap text-[11px] ${
                    selectedCategory === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stock List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {filteredAssets.map((asset, idx) => {
            const isPositive = asset.change_percent >= 0;
            return (
              <div
                key={idx}
                className="border border-slate-100 hover:border-slate-200 bg-slate-50/40 rounded-2xl p-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{asset.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">{asset.symbol}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] font-semibold text-slate-500">{asset.sector}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-slate-900">
                        {formatINR(asset.price)}
                      </div>
                      <span className={`text-[11px] font-black inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                        isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPositive ? '+' : ''}{asset.change_percent}%
                      </span>
                    </div>
                  </div>

                  {/* Day range and metrics */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase">Day Low</span>
                      <span className="font-bold text-slate-700">{formatINR(asset.day_low)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase">Day High</span>
                      <span className="font-bold text-slate-700">{formatINR(asset.day_high)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase">P/E Ratio</span>
                      <span className="font-bold text-slate-700">{asset.pe_ratio ? asset.pe_ratio : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Actionable recommendation chip */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Wealth Stance:</span>
                  <span className="font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-lg text-[10px]">
                    {asset.action}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Wealth Smart Recommendations */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-teal-400" />
            <h3 className="font-black text-sm tracking-wide">
              Smart Market Allocation Strategy
            </h3>
          </div>
          <span className="text-[10px] font-bold text-teal-300 bg-teal-400/20 px-2.5 py-0.5 rounded-full border border-teal-400/30">
            24/7 Wealth Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(marketData?.smart_recommendations || []).map((rec, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">{rec.category}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">
                    {rec.badge}
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs mb-1">{rec.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {rec.suggestion}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-teal-300 font-semibold">
                Impact: {rec.impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Informational Disclaimer */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 font-semibold leading-relaxed">
        <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <span>
          Market data is aggregated for educational investment tracking. Quotes update during trading sessions (NSE/BSE Mon–Fri 9:15 AM to 3:30 PM IST) and reflect official closing prices outside market hours. Not formal investment advice.
        </span>
      </div>
    </div>
  );
}
