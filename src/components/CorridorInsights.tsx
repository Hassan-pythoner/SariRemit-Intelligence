import React, { useState } from 'react';
import { TranslationDict, Corridor } from '../types';
import { CORRIDORS, PROVIDERS, getRemittanceRates } from '../services/ratesService';
import { getAuthSession } from '../services/supabaseService';
import { 
  TrendingUp, Compass, Calendar, AlertCircle, Info, Landmark, 
  HelpCircle, Sparkles, CheckCircle2, Award, Zap, ArrowRight, ArrowLeft 
} from 'lucide-react';

interface CorridorInsightsProps {
  language: 'en' | 'ar';
  t: TranslationDict;
}

export default function CorridorInsights({
  language,
  t,
}: CorridorInsightsProps) {
  const isRtl = language === 'ar';
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(() => {
    const session = getAuthSession();
    return session.user?.preferredCorridorId || 'sa-pk';
  });

  const activeCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS[0];

  // Mock Trend data for past 7 days based on the corridor's base exchange rate
  const getTrendData = (base: number) => {
    return [
      { day: 'Wed', rate: parseFloat((base * 0.992).toFixed(2)) },
      { day: 'Thu', rate: parseFloat((base * 0.995).toFixed(2)) },
      { day: 'Fri', rate: parseFloat((base * 0.991).toFixed(2)) },
      { day: 'Sat', rate: parseFloat((base * 1.002).toFixed(2)) },
      { day: 'Sun', rate: parseFloat((base * 1.006).toFixed(2)) },
      { day: 'Mon', rate: parseFloat((base * 1.004).toFixed(2)) },
      { day: 'Today', rate: parseFloat((base * 1.011).toFixed(2)) },
    ];
  };

  const trendData = getTrendData(activeCorridor.baseExchangeRate);
  
  // Calculate analytics
  const rates = getRemittanceRates(selectedCorridorId, 1000);
  const lowestFee = Math.min(...rates.map(r => r.transferFee));
  const highestRate = Math.max(...rates.map(r => r.exchangeRate));
  
  const bestFeeProvider = rates.find(r => r.transferFee === lowestFee)?.providerName || 'Mobily Pay';
  const bestRateProvider = rates.find(r => r.exchangeRate === highestRate)?.providerName || 'STC Pay';

  // SVG coordinate calculations for sparkline
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 30;

  const minRate = Math.min(...trendData.map(d => d.rate));
  const maxRate = Math.max(...trendData.map(d => d.rate));
  const rateRange = maxRate - minRate || 1;

  // Generate SVG path string
  const points = trendData.map((d, index) => {
    const x = padding + (index * (svgWidth - padding * 2)) / (trendData.length - 1);
    // Invert Y coordinate so higher rate is at the top of the SVG canvas
    const y = svgHeight - padding - ((d.rate - minRate) / rateRange) * (svgHeight - padding * 2);
    return { x, y, day: d.day, rate: d.rate };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Fill area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  // Specific tips depending on corridor
  const getCorridorTips = (id: string) => {
    switch (id) {
      case 'sa-pk':
        return {
          bestDay: 'Sunday / Monday',
          bestDayAr: 'الأحد / الاثنين',
          limitTips: 'Sending above 1,500 SAR waives cash pickup fees at Western Union.',
          limitTipsAr: 'إرسال أكثر من ١,٥٠٠ ريال يلغي رسوم الاستلام النقدي في ويسترن يونيون.',
          channelTip: 'Urpay wallet has a direct cash promotion with Pakistan post offices.'
        };
      case 'sa-in':
        return {
          bestDay: 'Saturday / Sunday',
          bestDayAr: 'السبت / الأحد',
          limitTips: 'QuickPay offers zero fee for amounts over 2,000 SAR.',
          limitTipsAr: 'كويك باي يتيح الرسوم مجاناً للمبالغ التي تزيد عن ٢,٠٠٠ ريال.',
          channelTip: 'STC Pay has direct instant transfers to SBI bank accounts.'
        };
      case 'sa-ph':
        return {
          bestDay: 'Tuesday',
          bestDayAr: 'الثلاثاء',
          limitTips: 'GCash transfers are instant and carry 0 fees via Mobily Pay.',
          limitTipsAr: 'تحويلات GCash فورية وبدون رسوم عبر موبايلي باي.',
          channelTip: 'Urpay matches BDO Bank rates best on weekdays.'
        };
      default:
        return {
          bestDay: 'Wednesday',
          bestDayAr: 'الأربعاء',
          limitTips: 'Compare mobile wallets (STC Pay/Urpay) vs cash pick up before sending.',
          limitTipsAr: 'قارن المحافظ الرقمية مقابل الاستلام النقدي قبل التحويل.',
          channelTip: 'Direct bank transfers are processed instantly within business hours.'
        };
    }
  };

  const tips = getCorridorTips(selectedCorridorId);

  return (
    <div className="space-y-8 pb-24">
      
      {/* Page Header */}
      <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Compass className="w-7 h-7 text-emerald-600 shrink-0" />
          {t.corridorInsights}
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Unlock community data to optimize when, how, and which providers save you the most money.
        </p>
      </div>

      {/* Corridor Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest">Analyze Corridor</span>
          <h3 className="text-base font-bold text-slate-800 mt-1">
            Saudi Arabia (SAR) to {activeCorridor.flag} {language === 'en' ? activeCorridor.toCountry : activeCorridor.toCountryAr} ({activeCorridor.currencyCode})
          </h3>
        </div>

        <select
          value={selectedCorridorId}
          onChange={(e) => setSelectedCorridorId(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-w-[200px] cursor-pointer transition-colors"
        >
          {CORRIDORS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr}
            </option>
          ))}
        </select>
      </div>

      {/* Corridor Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Best Rate Provider</span>
          <span className="text-sm font-black text-slate-800 block truncate">{bestRateProvider}</span>
          <span className="text-xs text-emerald-600 font-bold font-mono">1 SAR = {highestRate}</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Cheapest Fees</span>
          <span className="text-sm font-black text-slate-800 block truncate">{bestFeeProvider}</span>
          <span className="text-xs text-emerald-600 font-bold font-mono">{lowestFee === 0 ? '0 SAR Fee' : `${lowestFee} SAR Fee`}</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Best Day to Send</span>
          <span className="text-sm font-black text-indigo-700 block">{language === 'en' ? tips.bestDay : tips.bestDayAr}</span>
          <span className="text-xs text-slate-400 font-semibold">Historically higher rates</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 text-left">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Trend Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-black text-emerald-600 uppercase tracking-tight">STABLE / RISING</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Weekly increase of 1.1%</span>
        </div>

      </div>

      {/* Main Graph Panel & Tips Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Custom Rates Trend Chart (Col span 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 ${isRtl ? 'sm:flex-row-reverse text-right' : 'text-left'}`}>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Exchange Rate Trend (Past 7 Days)</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Reflects averages from Saudi Arabia to {activeCorridor.currencyCode}</p>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold font-mono">
              High: {maxRate} • Low: {minRate}
            </div>
          </div>

          {/* SVG Sparkline Graph */}
          <div className="relative w-full overflow-x-auto py-2">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full min-w-[400px] h-40 overflow-visible"
            >
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#e2e8f0" strokeWidth="1" />

              {/* Gradient definition */}
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path d={areaD} fill="url(#chart-grad)" />

              {/* Sparkline Path */}
              <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Node points and hover rate values */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#ffffff" 
                    stroke="#059669" 
                    strokeWidth="2.5" 
                    className="hover:r-6 hover:fill-emerald-600 transition-all"
                  />
                  {/* Tooltip rate */}
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    textAnchor="middle" 
                    fontSize="9" 
                    fontWeight="bold" 
                    fill="#334155"
                    className="font-mono bg-white"
                  >
                    {p.rate}
                  </text>
                  {/* Day labels on X Axis */}
                  <text 
                    x={p.x} 
                    y={svgHeight - 10} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fontWeight="600" 
                    fill="#94a3b8"
                  >
                    {p.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className={`p-3.5 bg-indigo-50 border border-indigo-100/50 rounded-xl flex items-start gap-2.5 text-xs text-indigo-800 ${
            isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'
          }`}>
            <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-bold">
              {t.trendUp} Use <strong>{bestRateProvider}</strong> inside your digital app today for the maximum savings.
            </p>
          </div>

        </div>

        {/* Optimizations & Advice checklist (Col span 5) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 justify-start">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>SariRemit Optimization Tips</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Simple advice verified by the community to avoid fee traps.</p>
          </div>

          <div className="space-y-4 my-6">
            
            {/* Tip 1 */}
            <div className={`flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Timing optimization</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Avoid weekends if possible. Digital wallets and physical banks have slightly larger margins on Fridays and Saturdays. Weekdays yield 0.4% better rates.
                </p>
              </div>
            </div>

            {/* Tip 2 */}
            <div className={`flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Threshold waiver</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'en' ? tips.limitTips : tips.limitTipsAr}
                </p>
              </div>
            </div>

            {/* Tip 3 */}
            <div className={`flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Direct Partner tip</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tips.channelTip}
                </p>
              </div>
            </div>

          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-405 font-bold block uppercase tracking-wider">
              Updated just minutes ago
            </span>
          </div>

        </div>

      </div>

      {/* Corridor FAQ Section */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className={`text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Community Corridor FAQs</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
          <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <h4 className="font-bold text-slate-800">Q: Does STC Pay charge cash pickup fees?</h4>
            <p className="text-slate-400 leading-relaxed">
              Yes, if you select cash pickup, the fee is usually higher (around 15-18 SAR) compared to sending to a bank account or mobile wallet (which is often around 5-10 SAR).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <h4 className="font-bold text-slate-800">Q: How fast does Mobily Pay process to wallets?</h4>
            <p className="text-slate-400 leading-relaxed">
              GCash and bKash wallet transfers are virtually instant (under 2 minutes). Traditional bank transfers take up to 24 hours depending on recipient bank holidays.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
