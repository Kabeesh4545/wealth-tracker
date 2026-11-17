import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Shield,
  Layers,
  Calculator,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  HelpCircle,
  Award,
  CheckCircle2,
  Calendar,
  Percent,
  Compass
} from 'lucide-react';

const ASSET_CLASSES = [
  {
    id: 'ppf',
    name: 'Public Provident Fund (PPF)',
    category: 'Capital Preservation',
    riskTier: 'Low Risk',
    riskColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expectedReturn: '7.1% p.a.',
    recommendedTenure: '15 Years (Long-term)',
    taxStatus: 'Exempt-Exempt-Exempt (EEE)',
    minInvestment: '₹500 / year',
    description: 'Government-backed small savings scheme with guaranteed sovereign returns and 100% tax exemption under Section 80C.',
    idealFor: 'Safe long-term foundation, retirement cushion, zero-risk goal building.'
  },
  {
    id: 'fd',
    name: 'Bank & Post Office Fixed Deposits (FD)',
    category: 'Capital Preservation',
    riskTier: 'Low Risk',
    riskColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expectedReturn: '6.8% – 7.5% p.a.',
    recommendedTenure: '1 – 5 Years',
    taxStatus: 'Taxable as per slab',
    minInvestment: '₹1,000',
    description: 'High-certainty fixed income vehicle offering guaranteed tenure returns. DICGC covers deposits up to ₹5 Lakh per bank.',
    idealFor: 'Parking 3–6 months emergency reserves, near-term fixed milestones.'
  },
  {
    id: 'liquid_mf',
    name: 'Liquid & Overnight Mutual Funds',
    category: 'Capital Preservation',
    riskTier: 'Very Low Risk',
    riskColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expectedReturn: '6.5% – 7.0% p.a.',
    recommendedTenure: '1 – 90 Days',
    taxStatus: 'Taxable as per income slab',
    minInvestment: '₹500',
    description: 'Invests in very short-term government debt securities and treasury bills with high liquidity and next-day redemption.',
    idealFor: 'Short-term cash buffer, better yield alternative to regular savings accounts.'
  },
  {
    id: 'sgb',
    name: 'Sovereign Gold Bonds (SGB)',
    category: 'Stable / Fixed-Income',
    riskTier: 'Low to Moderate',
    riskColor: 'bg-blue-50 text-blue-700 border-blue-200',
    expectedReturn: '2.5% fixed + Gold appreciation',
    recommendedTenure: '8 Years (5-yr exit)',
    taxStatus: 'Capital gains tax-free at maturity',
    minInvestment: '1 Gram Gold',
    description: 'RBI-issued gold bonds that pay 2.50% annual interest credited semi-annually plus the market value of gold upon maturity.',
    idealFor: 'Inflation hedge, portfolio diversification, zero storage or making charges.'
  },
  {
    id: 'baf',
    name: 'Balanced Advantage / Dynamic Asset Allocation',
    category: 'Stable / Fixed-Income',
    riskTier: 'Moderate Risk',
    riskColor: 'bg-blue-50 text-blue-700 border-blue-200',
    expectedReturn: '10% – 12% p.a.',
    recommendedTenure: '3 – 5 Years',
    taxStatus: 'Equity taxation (12.5% LTCG > ₹1.25L)',
    minInvestment: '₹500 / month SIP',
    description: 'Dynamically balances between equity and debt based on market valuations to capture growth while protecting downside during market drops.',
    idealFor: 'First-time investors seeking better returns than FDs without stomach-churning volatility.'
  },
  {
    id: 'nifty_index',
    name: 'Nifty 50 / Sensex Index Funds',
    category: 'Growth-Oriented',
    riskTier: 'Moderate to High',
    riskColor: 'bg-teal-50 text-teal-700 border-teal-200',
    expectedReturn: '12% – 14% p.a. (Historical)',
    recommendedTenure: '5+ Years',
    taxStatus: '12.5% LTCG (> ₹1.25 Lakh/yr)',
    minInvestment: '₹500 / month SIP',
    description: 'Passively replicates India’s top 50 blue-chip companies with ultra-low expense ratios (0.1–0.3%) and no fund manager bias.',
    idealFor: 'Core long-term wealth compounding, beating inflation across 5-10 year horizons.'
  },
  {
    id: 'flexicap',
    name: 'Flexi-Cap & Large & Mid-Cap Funds',
    category: 'Growth-Oriented',
    riskTier: 'High Risk',
    riskColor: 'bg-purple-50 text-purple-700 border-purple-200',
    expectedReturn: '13% – 16% p.a.',
    recommendedTenure: '7+ Years',
    taxStatus: '12.5% LTCG (> ₹1.25 Lakh/yr)',
    minInvestment: '₹1,000 / month SIP',
    description: 'Active mutual funds dynamically investing across Large, Mid, and Small-cap companies to capture fast-growing sectors of the Indian economy.',
    idealFor: 'Long-term goals (10+ years), retirement accumulation, young investors with high risk tolerance.'
  }
];

export default function InvestmentIdeasHub({ allocation, onNavigate }) {
  const [filterTier, setFilterTier] = useState('ALL');
  
  // SIP Calculator State
  const [sipAmount, setSipAmount] = useState(2500);
  const [expectedReturnRate, setExpectedReturnRate] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);

  // Filtered asset classes
  const filteredAssets = useMemo(() => {
    if (filterTier === 'ALL') return ASSET_CLASSES;
    if (filterTier === 'LOW') return ASSET_CLASSES.filter(a => a.riskTier.includes('Low'));
    if (filterTier === 'MODERATE') return ASSET_CLASSES.filter(a => a.riskTier.includes('Moderate') || a.category.includes('Stable'));
    if (filterTier === 'GROWTH') return ASSET_CLASSES.filter(a => a.category.includes('Growth'));
    return ASSET_CLASSES;
  }, [filterTier]);

  // SIP Compound Interest Calculation:
  // M = P * ((1 + i)^n - 1) / i * (1 + i)
  const sipResult = useMemo(() => {
    const P = sipAmount;
    const i = expectedReturnRate / (12 * 100);
    const n = tenureYears * 12;

    const futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const investedAmount = P * n;
    const wealthGain = futureValue - investedAmount;
    const multiplier = (futureValue / investedAmount).toFixed(1);

    return {
      futureValue: Math.round(futureValue),
      investedAmount: Math.round(investedAmount),
      wealthGain: Math.round(wealthGain),
      multiplier
    };
  }, [sipAmount, expectedReturnRate, tenureYears]);

  // Helper currency format
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Compass size={13} />
            Investment Suitability & Ideas
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Asset Class Ideas & Wealth Growth Simulator
          </h2>
          <p className="text-emerald-100/90 text-xs md:text-sm mt-2 leading-relaxed font-medium">
            Explore diverse financial vehicles designed for the Indian market and interactively test how monthly SIPs compound over time to build your wealth foundation.
          </p>
        </div>
      </div>

      {/* 2. Interactive SIP Compound Interest Wealth Calculator */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Calculator size={18} className="text-teal-600" />
              Interactive SIP Wealth Compounder
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Simulate the power of disciplined monthly compounding
            </p>
          </div>
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-xl text-teal-800 text-xs font-bold">
            <Sparkles size={14} className="text-teal-600" />
            <span>Wealth Multiplier: {sipResult.multiplier}x</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Slider 1: Monthly Investment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Monthly SIP Amount:</span>
                <span className="font-black text-teal-700 text-base">{formatINR(sipAmount)} / mo</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={sipAmount}
                onChange={(e) => setSipAmount(parseInt(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[1000, 2500, 5000, 10000, 25000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setSipAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      sipAmount === amt
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Expected Return Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Expected Annual Return (CAGR):</span>
                <span className="font-black text-slate-800 text-base">{expectedReturnRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                step="0.5"
                value={expectedReturnRate}
                onChange={(e) => setExpectedReturnRate(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>7% (FD / Debt)</span>
                <span>10% (Hybrid / BAF)</span>
                <span>12% (Nifty 50 Index)</span>
                <span>15%+ (Equity Mid-Cap)</span>
              </div>
            </div>

            {/* Slider 3: Time Horizon */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Investment Horizon (Tenure):</span>
                <span className="font-black text-slate-800 text-base">{tenureYears} Years ({tenureYears * 12} Months)</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={tenureYears}
                onChange={(e) => setTenureYears(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[3, 5, 10, 15, 20].map(yr => (
                  <button
                    key={yr}
                    onClick={() => setTenureYears(yr)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      tenureYears === yr
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {yr} Yrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Column (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Projected Maturity Value ({tenureYears} Years)
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-1 tracking-tight">
                {formatINR(sipResult.futureValue)}
              </span>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Invested</span>
                  <span className="text-sm font-extrabold text-slate-700 block mt-1">
                    {formatINR(sipResult.investedAmount)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Your monthly savings</span>
                </div>

                <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Estimated Wealth Gain</span>
                  <span className="text-sm font-extrabold text-emerald-700 block mt-1">
                    +{formatINR(sipResult.wealthGain)}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">Pure compound growth</span>
                </div>
              </div>

              {/* Visual Proportion Bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-600">Invested: {((sipResult.investedAmount / sipResult.futureValue) * 100).toFixed(0)}%</span>
                  <span className="text-emerald-700">Wealth Gain: {((sipResult.wealthGain / sipResult.futureValue) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(sipResult.investedAmount / sipResult.futureValue) * 100}%` }}
                    className="bg-slate-500 h-full"
                    title="Invested Principal"
                  ></div>
                  <div
                    style={{ width: `${(sipResult.wealthGain / sipResult.futureValue) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title="Wealth Gain"
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 border border-teal-100/60 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed font-semibold">
              💡 <strong>Compound Rule of 72:</strong> At {expectedReturnRate}% annual returns, your money doubles approximately every{' '}
              <strong className="text-teal-700">{(72 / expectedReturnRate).toFixed(1)} years</strong>!
            </div>
          </div>
        </div>
      </div>

      {/* 3. Asset Class Filter Chips & Educational Catalog */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Educational Asset Class Catalog</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Review suitability ranges, expected returns, and tax treatment
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Vehicles' },
              { id: 'LOW', label: '🛡️ Low Risk' },
              { id: 'MODERATE', label: '⚖️ Moderate / Balanced' },
              { id: 'GROWTH', label: '🚀 Growth / Equity' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTier(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterTier === tab.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="border border-slate-100 rounded-2xl p-4.5 bg-slate-50/20 hover:bg-slate-50/60 transition-all flex flex-col justify-between space-y-3.5 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{asset.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider shrink-0 ${asset.riskColor}`}>
                    {asset.riskTier}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">{asset.category}</span>
                <p className="text-xs text-slate-500 font-semibold mt-2.5 leading-relaxed">
                  {asset.description}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px] font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Yield:</span>
                  <span className="font-bold text-teal-700">{asset.expectedReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Horizon:</span>
                  <span className="text-slate-700">{asset.recommendedTenure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax Treatment:</span>
                  <span className="text-slate-700">{asset.taxStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Start:</span>
                  <span className="text-slate-700">{asset.minInvestment}</span>
                </div>

                <div className="mt-2 bg-white border border-slate-100 p-2.5 rounded-xl text-[10px] text-slate-600 leading-normal">
                  <strong>💡 Best For:</strong> {asset.idealFor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
