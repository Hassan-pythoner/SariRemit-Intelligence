import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS, getHistoricalTrends } from '../data/mockData';
import { CorridorId } from '../types';
import { 
  TrendingUp, Calendar, Clock, DollarSign, Wallet, ArrowRight, ArrowLeft,
  Info, ShieldCheck, Landmark, CheckCircle, Activity, ChevronRight
} from 'lucide-react';

export const CorridorInsights: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const [selectedCorridorId, setSelectedCorridorId] = useState<CorridorId>('PK');

  // Selected corridor details
  const selectedCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS[0];

  // Load historical trend points
  const history = getHistoricalTrends(selectedCorridorId);

  // Math helper to scale coordinates for beautiful responsive custom SVG Line Chart
  const minRate = Math.min(...history.map(h => h.rate));
  const maxRate = Math.max(...history.map(h => h.rate));
  const rateRange = maxRate - minRate || 1;

  // Let's create beautiful SVG points
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = 35;

  const points = history.map((pt, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2) / (history.length - 1));
    // Invert Y so higher rates are at the top
    const y = svgHeight - padding - ((pt.rate - minRate) * (svgHeight - padding * 2) / rateRange);
    return { ...pt, x, y };
  });

  // Create path strings
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  // Dynamic country-specific remittance advice/tips
  const getCorridorTips = (id: CorridorId) => {
    switch (id) {
      case 'PK':
        return [
          { title: 'Tax Incentives (PRI)', desc: 'Government of Pakistan exempts tax on personal home remittances sent through official banking channels like QuickPay or urpay.' },
          { title: 'Fast Cash Pickups', desc: 'Enjaz offers same-minute cash pick up at Allied Bank, National Bank of Pakistan, or MCB branches.' },
          { title: 'Mobile Wallet Speed', desc: 'Easypaisa and JazzCash receiving routes are instant but check limit caps before sending larger sums.' }
        ];
      case 'IN':
        return [
          { title: 'Same-day Bank Payouts', desc: 'Most direct bank deposits to SBI, ICICI, or HDFC take less than 2 hours using STC Pay or urpay routes.' },
          { title: 'Zero Fee Offers', desc: 'Many providers run zero fee transfer promos if sending more than 1500 SAR. Always compare.' },
          { title: 'Rupee Volatility', desc: 'INR rate fluctuates mid-day following Reserve Bank announcements. Tuesday morning usually yields the peak rates.' }
        ];
      case 'KE':
        return [
          { title: 'M-PESA Payout Dominance', desc: 'STC Pay and urpay are highly integrated with Safaricom M-PESA. Payouts arrive instantly 24/7.' },
          { title: 'Cash Out Limits', desc: 'Ensure your recipient has upgraded their M-PESA wallet limit if you are sending more than 2500 SAR.' },
          { title: 'Equity Bank alternative', desc: 'Direct bank deposit is also available but might take up to 24 hours depending on weekend schedules.' }
        ];
      case 'PH':
        return [
          { title: 'GCash & PayMaya Integration', desc: 'Sending to digital wallets in the Philippines is instant. Preferred providers are Mobily Pay and STC Pay.' },
          { title: 'Pawnshop Cash Pickups', desc: 'Western Union and Enjaz provide physical collection at Cebuana Lhuillier or M Lhuillier locations.' },
          { title: 'SSS and Pag-IBIG payouts', desc: 'Check if your chosen channel allows direct contributions to state saving funds.' }
        ];
      case 'BD':
        return [
          { title: '2.5% Cash Incentive', desc: 'The Bangladesh government provides a 2.5% instant cash incentive for remitting through formal channels like urpay or QuickPay.' },
          { title: 'bKash Instant Transfer', desc: 'Digital wallets to bKash wallets are executed instantly. Great for urgent pocket money support.' },
          { title: 'Sonali Bank direct routing', desc: 'Traditional bank direct routing can take up to 2 working days.' }
        ];
      case 'EG':
        return [
          { title: 'National Bank of Egypt (NBE) Cash pickup', desc: 'Enjaz and Al Rajhi Tahweel have direct bank cash arrangements with extremely high payout reliability.' },
          { title: 'InstaPay receiving capability', desc: 'Check for InstaPay-enabled digital wallets which transfer funds to Egyptian bank cards instantly.' },
          { title: 'Egyptian Pound rate gaps', desc: 'Compare official rates carefully as digital wallets might offer promotional bonuses.' }
        ];
      case 'UG':
        return [
          { title: 'MTN Mobile Money & Airtel Pay', desc: 'Remittances directly arrive at MTN or Airtel Money accounts in minutes when using STC Pay wallet.' },
          { title: 'Withdrawal Charge Awareness', desc: 'Keep in mind mobile cash withdrawal fees back home; consider sending slightly extra to cover the local fees.' },
          { title: 'Direct Bank Deposits', desc: 'Best for larger sums. It takes 1 business day for Centenary or Stanbic Bank routing.' }
        ];
      case 'ET':
        return [
          { title: 'CBE Birr & Telebirr Mobile wallet', desc: 'Digital wallets offer swift transfer direct to Commercial Bank of Ethiopia (CBE) mobile accounts.' },
          { title: 'Currency Regulation Checks', desc: 'Expat home remittances are highly encouraged and are exempt from standard import duties.' },
          { title: 'Cash Out Centers', desc: 'CBE branches are standard for cash pickup collection. Ensure recipients carry valid national IDs.' }
        ];
      default:
        return [
          { title: 'Digital Wallets First', desc: 'Digital wallet routes are usually 40% cheaper and 10x faster than traditional brick-and-mortar queues.' }
        ];
    }
  };

  const currentTips = getCorridorTips(selectedCorridorId);

  return (
    <div className="space-y-8 pb-16 text-white animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-[#00E07A]" />
          <span>{t('insightsTitle')}</span>
        </h1>
        <p className="text-[#AFC4D8] text-sm max-w-2xl leading-relaxed">
          {t('insightsSub')}
        </p>
      </div>

      {/* Selector & Quick Stats Row */}
      <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <label className="block text-[10px] font-bold text-[#B8C7D9]/60 uppercase tracking-widest mb-1.5 font-mono">
            {t('selectCorridor')}
          </label>
          <select
            id="insights-corridor-select"
            value={selectedCorridorId}
            onChange={(e) => setSelectedCorridorId(e.target.value as CorridorId)}
            className="bg-[#031126] text-white text-base font-bold px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A] cursor-pointer min-w-[220px]"
          >
            {CORRIDORS.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#031126] text-white">
                {c.flag} {language === 'en' ? c.nameEn : c.nameAr} ({c.currencyCode})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Corridor Stats Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full md:w-auto md:divide-x md:rtl:divide-x-reverse md:divide-white/10">
          
          <div className="md:px-4">
            <span className="text-[10px] text-[#B8C7D9]/60 block uppercase font-semibold font-sans">{t('averageFeeTitle')}</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">8.00 - 10.00 SAR</span>
            <span className="text-[10px] text-[#00E07A] block font-sans font-bold mt-0.5">
              {language === 'en' ? 'Digital Wallets' : 'المحافظ الرقمية'}
            </span>
          </div>

          <div className="md:px-4">
            <span className="text-[10px] text-[#B8C7D9]/60 block uppercase font-semibold font-sans">{t('rateVolatility')}</span>
            <span className="text-lg font-bold text-[#00E07A] font-mono mt-0.5 block">
              {selectedCorridorId === 'PK' || selectedCorridorId === 'EG' ? '0.84% (Med)' : '0.12% (Low)'}
            </span>
            <span className="text-[10px] text-[#B8C7D9]/60 block font-sans mt-0.5">
              {language === 'en' ? 'Last 15 days' : 'آخر ١٥ يوماً'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 md:px-4">
            <span className="text-[10px] text-[#B8C7D9]/60 block uppercase font-semibold font-sans">
              {language === 'en' ? 'Optimal Day' : 'اليوم الأمثل'}
            </span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">
              {language === 'en' ? 'Tuesday' : 'الثلاثاء'}
            </span>
            <span className="text-[10px] text-[#B8C7D9]/60 block font-sans mt-0.5">
              {language === 'en' ? 'Before weekend rush' : 'قبل زحمة نهاية الأسبوع'}
            </span>
          </div>

        </div>
      </div>

      {/* Main layout: Line chart on left, timing guidance/tips on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Historical Trend Chart */}
        <div className="lg:col-span-8 bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
          
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Activity className="w-5 h-5 text-[#00E07A]" />
              <span>{t('historicalRates')}</span>
            </h3>

            <div className="flex items-center gap-2 text-xs font-mono bg-[#031126] border border-white/10 px-2.5 py-1 rounded-lg text-[#00E07A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E07A]"></span>
              <span className="text-white font-bold">SAR to {selectedCorridor.currencyCode}</span>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div className="w-full overflow-x-auto pt-4">
            <div className="min-w-[500px] h-[240px] relative">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full text-white/5">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + ratio * (svgHeight - padding * 2);
                  const rateVal = maxRate - ratio * rateRange;
                  return (
                    <g key={i} className="opacity-40">
                      <line
                        x1={padding}
                        y1={y}
                        x2={svgWidth - padding}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding - 5}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-[#B8C7D9]/60 font-mono font-bold"
                      >
                        {rateVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Fill under line */}
                <path
                  d={areaPath}
                  fill="url(#chartGradient)"
                  className="opacity-15"
                />

                {/* Main line path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#00E07A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* SVG Color Gradients */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E07A" />
                    <stop offset="100%" stopColor="#00E07A" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Nodes & tooltip pointers */}
                {points.map((pt, idx) => {
                  const isLast = idx === points.length - 1;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isLast ? "6" : "4"}
                        fill={isLast ? "#00E07A" : "#031126"}
                        stroke="#00E07A"
                        strokeWidth="2.5"
                        className="transition-all duration-200 hover:r-8"
                      />
                      
                      {/* Label on Hover / Display */}
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1 py-0.5"
                      >
                        {pt.rate}
                      </text>

                      {/* X-Axis labels */}
                      {(idx % 2 === 0 || isLast) && (
                        <text
                          x={pt.x}
                          y={svgHeight - 10}
                          textAnchor="middle"
                          className="text-[10px] fill-[#B8C7D9]/60 font-mono"
                        >
                          {pt.date}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#B8C7D9]/60 border-t border-white/10 pt-3">
            <span>💡 {language === 'en' ? 'Hover on circles to view rate value' : 'مرر على الدوائر لمشاهدة قيمة السعر'}</span>
            <span className="font-mono">Min: {minRate.toFixed(3)} | Max: {maxRate.toFixed(3)}</span>
          </div>

        </div>

        {/* Right Side: Corridor specific advice & tips */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Timing Guide Card */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white pb-2 border-b border-white/10 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-[#00E07A]" />
              <span>{t('bestTimeToTransfer')}</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <h4 className="font-bold text-white">{t('bestDayTitle')}</h4>
                  <p className="text-[#B8C7D9] mt-1 leading-relaxed text-[11px]">{t('bestDayDesc')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <h4 className="font-bold text-white">{t('averageFeeTitle')}</h4>
                  <p className="text-[#B8C7D9] mt-1 leading-relaxed text-[11px]">{t('averageFeeDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Checklist Accordion */}
          <div className="bg-[#0B2A5B]/40 text-white p-6 rounded-[24px] space-y-4 border border-white/10 shadow-2xl">
            <h3 className="font-bold text-xs flex items-center gap-1.5 text-[#F4B63F] uppercase tracking-wider font-mono">
              <ShieldCheck className="w-5 h-5" />
              <span>{language === 'en' ? 'Smart Transfer Checklist' : 'قائمة التحويل الذكي'}</span>
            </h3>

            <div className="space-y-4">
              {currentTips.map((tip, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <CheckCircle className="w-4 h-4 text-[#00E07A] shrink-0" />
                    <span>{tip.title}</span>
                  </div>
                  <p className="text-[11px] text-[#B8C7D9] ps-5 leading-normal">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#061B3A] p-3 rounded-xl text-[10px] text-[#B8C7D9]/60 text-center font-mono border border-white/10">
              {language === 'en' ? 'Source: Central Bank Regulations & Expat Feeds' : 'المصدر: أنظمة البنوك المركزية ومساهمات المغتربين'}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
