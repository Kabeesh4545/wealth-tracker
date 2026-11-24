import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrendingUp, TrendingDown, Activity, Sparkles, ChevronRight } from 'lucide-react';

export default function MarketTickerBar({ onNavigate }) {
  const [tickerItems, setTickerItems] = useState([
    { name: 'NIFTY 50', price: 25349.65, change_percent: -0.18 },
    { name: 'SENSEX', price: 82435.99, change_percent: -0.17 },
    { name: 'BANK NIFTY', price: 62585.35, change_percent: -0.29 },
    { name: 'GOLD BEES', price: 103.05, change_percent: 0.44 },
    { name: 'TCS', price: 2460.00, change_percent: 1.88 },
    { name: 'RELIANCE', price: 1351.00, change_percent: -0.91 }
  ]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTicker() {
      try {
        const res = await api.get('/api/market/trends');
        if (isMounted && res.data && res.data.all_assets) {
          setTickerItems(res.data.all_assets.slice(0, 8));
          setIsOpen(res.data.market_status?.is_open || false);
        }
      } catch (err) {
        // Safe fallback maintains default baseline ticker
      }
    }
    loadTicker();
    const interval = setInterval(loadTicker, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-900 text-white text-xs border-b border-slate-800 py-1.5 px-4 flex items-center justify-between overflow-x-auto no-scrollbar shadow-inner">
      <div className="flex items-center gap-3 shrink-0 mr-4">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] bg-white/10 px-2 py-0.5 rounded-md">
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{isOpen ? 'Live Market' : 'Market Closed'}</span>
        </div>
      </div>

      {/* Scrolling / Flex badges */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5">
        {tickerItems.map((item, idx) => {
          const isPos = (item.change_percent || 0) >= 0;
          return (
            <div
              key={idx}
              onClick={() => onNavigate && onNavigate('market-trends')}
              className="flex items-center gap-1.5 shrink-0 hover:bg-white/10 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
            >
              <span className="font-semibold text-slate-300 text-[11px]">{item.name}</span>
              <span className="font-bold text-white text-[11px]">
                ₹{Number(item.price || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
              <span className={`text-[10px] font-bold flex items-center ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPos ? '+' : ''}{item.change_percent}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Button to open full market trends hub */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('market-trends')}
          className="ml-3 shrink-0 hidden sm:flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 cursor-pointer whitespace-nowrap"
        >
          <span>Market Trends</span>
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
