import React, { useState, useEffect } from 'react';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { TranslationDict, UserProfile, RecordedTransfer } from '../types';
import { CountryFlag, ProviderLogo } from './SdsBamComponents';
import { getUserSavingsLedger } from '../services/supabaseService';
import { 
  PiggyBank, History, Wallet, Sparkles, ChevronRight, Award, TrendingUp 
} from 'lucide-react';

interface SavingsProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfile;
}

export default function Savings({
  language,
  t,
  profile,
}: SavingsProps) {
  const isRtl = language === 'ar';
  const [transfers, setTransfers] = useState<RecordedTransfer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stats
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lifetimeVolume, setLifetimeVolume] = useState<number>(0);

  // Load history using the formal SEPS module shared service
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { transfers: activeTransfers, summary } = await getUserSavingsLedger(profile.id);
      setTransfers(activeTransfers);
      setLifetimeSavings(summary.lifetimeSavingsSAR);
      setLifetimeVolume(summary.lifetimeSendAmountSAR);
      setMonthlySavings(summary.monthlySavingsSAR);
    } catch (err) {
      console.error('Failed to load user savings ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [profile]);

  const getCorridorFlag = (cid: string) => {
    return CORRIDORS.find(c => c.id === cid)?.flag || '🇸🇦';
  };

  const getCorridorName = (cid: string) => {
    const c = CORRIDORS.find(c => c.id === cid);
    return c ? `${c.toCountry} (${c.currencyCode})` : cid;
  };

  const getProviderName = (pid: string) => {
    return PROVIDERS.find(p => p.id === pid)?.name || pid;
  };

  // Determine current savings achievement tier
  const getSavingsTier = (totalSaved: number) => {
    if (totalSaved >= 1500) return { name: 'Platinum Master', color: 'text-indigo-400', next: 'Max Level', progress: 100, threshold: 1500 };
    if (totalSaved >= 750) return { name: 'Gold Optimist', color: 'text-[#F59E0B]', next: 'Platinum Master (1500 SAR)', progress: Math.min(100, (totalSaved / 1500) * 100), threshold: 1500 };
    if (totalSaved >= 250) return { name: 'Silver Saver', color: 'text-slate-300', next: 'Gold Optimist (750 SAR)', progress: Math.min(100, (totalSaved / 750) * 100), threshold: 750 };
    return { name: 'Bronze Contributor', color: 'text-amber-600', next: 'Silver Saver (250 SAR)', progress: Math.min(100, (totalSaved / 250) * 100), threshold: 250 };
  };

  const tier = getSavingsTier(lifetimeSavings);

  // Generate responsive SVG chart points safely from transfer log (real recorded transfers)
  const generateChartPoints = () => {
    const validTransfersForSavings = transfers.filter(t => {
      const s = t.status ? t.status.toLowerCase() : 'recorded';
      return s === 'recorded' || s === 'completed' || s === 'corrected';
    });

    if (validTransfersForSavings.length === 0) return '';
    const chartHeight = 120;
    const chartWidth = 500;
    const sorted = [...validTransfersForSavings].sort((a, b) => {
      const dateA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
      const dateB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
      return dateA - dateB;
    });

    let runningSum = 0;
    const sums = sorted.map((t) => {
      runningSum += (t.estimatedSavingsSAR || 0);
      return runningSum;
    });

    const max = Math.max(...sums, 100);
    const min = 0;
    const range = max - min;

    const points = sums.map((val, idx) => {
      const x = sums.length === 1 ? 250 : (idx / (sums.length - 1 || 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - ((val - min) / range) * (chartHeight - 30) - 10;
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  const chartPoints = generateChartPoints();

  return (
    <div className={`space-y-6 pb-24 text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn`}>
      
      {/* 1. Header with dynamic Record trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="w-7 h-7 text-[#10B981]" />
            <span>Savings & Ledger</span>
          </h1>
          <p className="text-xs text-sds-text-sec max-w-xl">
            Monitor your overall savings history and trace optimization trends compiled directly from your remittance logs.
          </p>
        </div>
      </div>

      {/* 2. DYNAMIC ANALYTICS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Monthly Savings */}
        <div className="bg-sds-card rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sds-success/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-sds-bg-sec border border-sds-border text-sds-text rounded-xl w-fit">
            <Wallet className="w-4 h-4 text-sds-gold" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Optimized This Month
          </span>
          <span className="text-2xl sm:text-3xl font-black text-sds-text font-mono block mt-1.5 leading-none">
            {monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs font-sans font-bold text-sds-text-sec">SAR</span>
          </span>
          <p className="text-[10px] text-sds-text-sec font-semibold mt-2 leading-tight">
            Based on current corridor indices.
          </p>
        </div>

        {/* KPI 2: Lifetime Savings */}
        <div className="bg-sds-card rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sds-success/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-sds-bg-sec border border-sds-border text-sds-success rounded-xl w-fit">
            <PiggyBank className="w-4 h-4 text-sds-success" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Lifetime Optimization
          </span>
          <span className="text-2xl sm:text-3xl font-black text-sds-success font-mono block mt-1.5 leading-none">
            {lifetimeSavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs font-sans font-bold text-sds-success">SAR</span>
          </span>
          <p className="text-[10px] text-sds-text-sec font-semibold mt-2 leading-tight">
            Total funds saved compared to standard rates.
          </p>
        </div>

        {/* KPI 3: Achievement Tier Card */}
        <div className="bg-sds-card rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sds-success/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-sds-bg-sec border border-sds-border text-sds-gold rounded-xl w-fit">
            <Award className="w-4 h-4 text-sds-gold" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Contributor Status
          </span>
          <span className={`text-xl font-black ${tier.color} block mt-1.5 leading-tight`}>
            {tier.name}
          </span>
          
          {/* Progress Mini Bar */}
          <div className="w-full h-1 bg-sds-bg-sec rounded-full mt-2.5 overflow-hidden border border-sds-border/50">
            <div className="h-full bg-sds-success" style={{ width: `${tier.progress}%` }} />
          </div>
          <p className="text-[8px] text-sds-text-sec font-black uppercase mt-1">
            Next Level: {tier.next}
          </p>
        </div>

      </div>

      {/* 3. CHART & ANALYTICS INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dynamic SVG Area Chart Dashboard */}
        <div className="lg:col-span-8 bg-sds-card border border-sds-border rounded-3xl p-5 sm:p-6 shadow-sds-md space-y-4">
          <div className="flex justify-between items-center border-b border-sds-border pb-3">
            <div className="text-left">
              <h3 className="text-xs font-black uppercase text-sds-text tracking-widest flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-4 h-4 text-sds-success" />
                Cumulative Savings Curve
              </h3>
              <p className="text-[9px] text-sds-text-sec font-medium">Visualizing capital retention over your logged transfer history</p>
            </div>
            <div className="px-2.5 py-1 bg-sds-success/10 border border-sds-success/25 text-sds-success rounded-lg text-[9px] font-mono font-black uppercase tracking-widest">
              RRE Audited
            </div>
          </div>

          {transfers.length === 0 ? (
            <div className="py-12 text-center text-sds-text-sec text-xs">
              No transfers recorded yet. Record a transfer to start tracking your savings.
            </div>
          ) : (
            <div className="relative w-full pt-2">
              <svg viewBox="0 0 500 120" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                <line x1="20" y1="55" x2="480" y2="55" stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />
                <line x1="20" y1="90" x2="480" y2="90" stroke="rgba(148,163,184,0.15)" strokeDasharray="3 3" />

                {/* Filled Area */}
                {chartPoints && (
                  <path
                    d={transfers.length === 1 
                      ? `M 20,110 L 250,55 L 480,110 Z`
                      : `M 20,110 L ${chartPoints} L 480,110 Z`}
                    fill="url(#chartGrad)"
                  />
                )}

                {/* Line Path */}
                {chartPoints && (
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={chartPoints}
                  />
                )}

                {/* Data points dots */}
                {chartPoints.split(' ').map((pt, idx) => {
                  const [cx, cy] = pt.split(',');
                  return cx && cy ? (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r="3.5"
                      className="fill-sds-card"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  ) : null;
                })}
              </svg>
              <div className="flex justify-between text-[9px] text-sds-text-sec font-mono uppercase mt-1 px-4">
                <span>Start Ledger</span>
                <span>Latest optimization</span>
              </div>
              {transfers.length === 1 && (
                <div className="mt-3 text-center text-sds-gold text-[10px] font-semibold font-mono">
                  ℹ️ Only 1 transfer recorded. Add more transfers to trace a cumulative trendline.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic tips card (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-sds-card text-sds-text border border-sds-border rounded-3xl p-5 shadow-sds-md relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sds-success/5 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-sds-success/10 border border-sds-success/20 text-sds-success text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3" /> Community Impact
            </div>
            <h4 className="text-xs font-black text-sds-text">
              Expats Savings Standard
            </h4>
            <p className="text-xs text-sds-text-sec mt-2 leading-relaxed">
              Expats who compare remittance options using SariRemit save an average of <strong>4.5% of their total sent amount</strong>. Over a year, this can amount to more than <strong>1,800 SAR</strong>!
            </p>
          </div>

          <div className="bg-sds-card border border-sds-border rounded-3xl p-5 shadow-sds-md text-left">
            <h4 className="text-xs font-extrabold text-sds-text uppercase tracking-widest mb-3 font-mono">
              💡 Smart Tips
            </h4>
            <ul className="space-y-3 text-xs text-sds-text-sec leading-relaxed">
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>Avoid weekend cash pickups when traditional counters have high margins.</span>
              </li>
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>STC Pay and UrPay offer competitive digital rates with instant processing.</span>
              </li>
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>Double-check transfer fees; sometimes a worse rate with zero fee is cheaper for smaller transfers.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* 4. TRANSACTION LOG LIST */}
      <div className="bg-sds-card border border-sds-border rounded-3xl p-5 sm:p-6 shadow-sds-md text-left">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xs font-extrabold text-sds-text uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <History className="w-4 h-4 text-sds-success" />
            Transfer Ledger Log
          </h3>
          <span className="text-[10px] font-mono text-sds-text-sec font-bold uppercase">{transfers.length} records active</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sds-text-sec text-xs font-mono">Loading savings ledger...</div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-sds-text-sec border border-dashed border-sds-border rounded-2xl max-w-md mx-auto">
            <PiggyBank className="w-12 h-12 text-sds-text-sec opacity-40 mx-auto mb-3" />
            <p className="font-extrabold text-sm text-sds-text uppercase">No recorded transfers</p>
            <p className="text-xs text-sds-text-sec mt-1 max-w-xs mx-auto text-center">
              Your savings history will appear here after you record a transfer from a provider card.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sds-border text-sds-text-sec uppercase text-[10px] font-black font-mono">
                  <th className="pb-3 text-left">Date</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Sent Amount</th>
                  <th className="pb-3">Recipient Received</th>
                  <th className="pb-3 text-right">Computed Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sds-border/40 font-sans">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-sds-bg-sec/50 transition-colors">
                    <td className="py-3.5 font-mono text-sds-text-sec font-bold">
                      {t.recordedAt ? new Date(t.recordedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 font-bold text-sds-text flex items-center gap-1.5">
                      <CountryFlag country="" currency={t.corridorId.split('-')[1]} size="xs" />
                      <span>{getCorridorName(t.corridorId)}</span>
                    </td>
                    <td className="py-3.5 text-sds-text-sec font-semibold">
                      <div className="flex items-center gap-1.5">
                        <ProviderLogo channel={{ providerCode: t.channelId, displayName: getProviderName(t.channelId) }} size="xs" shape="circle" />
                        <span>{getProviderName(t.channelId)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono font-extrabold text-sds-text">
                      {t.sendAmountSAR.toLocaleString()} SAR
                    </td>
                    <td className="py-3.5 font-mono font-bold text-sds-text-sec">
                      {t.estimatedRecipientAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 font-mono font-black text-sds-success text-right">
                      +{t.estimatedSavingsSAR ? t.estimatedSavingsSAR.toLocaleString() : '0'} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
