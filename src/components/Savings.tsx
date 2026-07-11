import React, { useState, useEffect } from 'react';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { TranslationDict, UserProfile } from '../types';
import { fetchUserTransfers, saveUserTransfer, getRecommendations, UserTransferSavings } from '../services/supabaseService';
import { 
  PiggyBank, Plus, Check, Landmark, History, Wallet, Calendar, 
  Sparkles, X, ChevronRight, Award, TrendingUp, HelpCircle, Info, ArrowUpRight
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';

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
  const [transfers, setTransfers] = useState<UserTransferSavings[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Stats
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lifetimeVolume, setLifetimeVolume] = useState<number>(0);

  // New transfer form state
  const [corridorId, setCorridorId] = useState<string>(profile.preferredCorridorId || 'sa-pk');
  const [providerId, setProviderId] = useState<string>('stc-pay');
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load history
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await fetchUserTransfers(profile.email);
      setTransfers(history);
      
      // Calculate Stats
      if (history.length > 0) {
        const totalSaved = history.reduce((acc, t) => acc + t.computed_savings, 0);
        const totalVolume = history.reduce((acc, t) => acc + t.send_amount, 0);
        setLifetimeSavings(totalSaved);
        setLifetimeVolume(totalVolume);

        const now = new Date();
        const currentMonthSavings = history
          .filter((t) => {
            if (!t.recorded_at) return false;
            const date = new Date(t.recorded_at);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          })
          .reduce((acc, t) => acc + t.computed_savings, 0);
        setMonthlySavings(currentMonthSavings);
      } else {
        setLifetimeSavings(0);
        setLifetimeVolume(0);
        setMonthlySavings(0);
      }
    } catch (err) {
      console.error('Failed to load user transfers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [profile]);

  const handleAddTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Fetch current best RRE rate to compute actual recipient and savings
      const res = await getRecommendations(corridorId, sendAmount);
      const activeCorridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
      const activeProvider = PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];
      
      // Attempt to find specific provider rate, fallback to best option
      const providerOption = res.allOptions.find(o => o.resolved.provider_id === providerId) || res.allOptions[0];
      
      const rate = providerOption?.resolved?.resolved_rate || activeCorridor.baseExchangeRate;
      const fee = providerOption?.resolved?.transfer_fee || activeCorridor.typicalFee;
      const savings = res.bestOption?.estimated_savings || (sendAmount * 0.045);
      const recipient = providerOption?.netAmount || ((sendAmount * rate) - fee);

      const transferData: UserTransferSavings = {
        user_id: profile.email,
        corridor_id: corridorId,
        send_amount: sendAmount,
        exchange_rate: rate,
        transfer_fee: fee,
        computed_savings: parseFloat(savings.toFixed(2)),
        recipient_amount: parseFloat(recipient.toFixed(2)),
        transfer_status: 'completed'
      };

      await saveUserTransfer(transferData);
      setIsAdding(false);
      await loadHistory();
    } catch (err) {
      console.error('Failed to save user transfer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Generate responsive SVG chart points safely from transfer log
  const generateChartPoints = () => {
    if (transfers.length === 0) return '';
    const chartHeight = 120;
    const chartWidth = 500;
    const sorted = [...transfers].sort((a, b) => {
      const dateA = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const dateB = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return dateA - dateB;
    });

    let runningSum = 0;
    const sums = sorted.map((t) => {
      runningSum += t.computed_savings;
      return runningSum;
    });

    const max = Math.max(...sums, 100);
    const min = 0;
    const range = max - min;

    const points = sums.map((val, idx) => {
      const x = (idx / (sums.length - 1 || 1)) * (chartWidth - 40) + 20;
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
            Log your remittance transfers, monitor your overall savings, and audit channels head-to-head.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="py-2.5 px-4 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record Transfer</span>
        </button>
      </div>

      {/* 2. DYNAMIC ANALYTICS KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1: Monthly Savings */}
        <div className="bg-[#0C2547] rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-[#071A35] border border-sds-border text-white rounded-xl w-fit">
            <Wallet className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Optimized This Month
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono block mt-1.5 leading-none">
            {monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs font-sans font-bold text-sds-text-sec">SAR</span>
          </span>
          <p className="text-[10px] text-sds-text-sec font-semibold mt-2 leading-tight">
            Based on current corridor indices.
          </p>
        </div>

        {/* KPI 2: Lifetime Savings */}
        <div className="bg-[#0C2547] rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-[#071A35] border border-sds-border text-[#10B981] rounded-xl w-fit">
            <PiggyBank className="w-4 h-4 text-[#10B981]" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Lifetime Optimization
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#10B981] font-mono block mt-1.5 leading-none">
            {lifetimeSavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-xs font-sans font-bold text-[#10B981]">SAR</span>
          </span>
          <p className="text-[10px] text-sds-text-sec font-semibold mt-2 leading-tight">
            Total funds saved compared to standard rates.
          </p>
        </div>

        {/* KPI 3: Achievement Tier Card */}
        <div className="bg-[#0C2547] rounded-3xl border border-sds-border p-5 shadow-sds-md relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-2.5 bg-[#071A35] border border-sds-border text-[#F59E0B] rounded-xl w-fit">
            <Award className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-widest block mt-4 font-mono">
            Contributor Status
          </span>
          <span className={`text-xl font-black ${tier.color} block mt-1.5 leading-tight`}>
            {tier.name}
          </span>
          
          {/* Progress Mini Bar */}
          <div className="w-full h-1 bg-[#071A35] rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-[#10B981]" style={{ width: `${tier.progress}%` }} />
          </div>
          <p className="text-[8px] text-sds-text-sec font-black uppercase mt-1">
            Next Level: {tier.next}
          </p>
        </div>

      </div>

      {/* 3. CHART & ANALYTICS INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Dynamic SVG Area Chart Dashboard */}
        <div className="lg:col-span-8 bg-[#0C2547] border border-sds-border rounded-3xl p-5 sm:p-6 shadow-sds-md space-y-4">
          <div className="flex justify-between items-center border-b border-sds-border/60 pb-3">
            <div className="text-left">
              <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                Cumulative Savings Curve
              </h3>
              <p className="text-[9px] text-sds-text-sec font-medium">Visualizing capital retention over your logged transfer history</p>
            </div>
            <div className="px-2.5 py-1 bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] rounded-lg text-[9px] font-mono font-black uppercase tracking-widest">
              RRE Audited
            </div>
          </div>

          {transfers.length === 0 ? (
            <div className="py-12 text-center text-sds-text-sec text-xs">
              Record multiple transfers to compile a visual trendline.
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
                <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
                <line x1="20" y1="55" x2="480" y2="55" stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
                <line x1="20" y1="90" x2="480" y2="90" stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />

                {/* Filled Area */}
                {chartPoints && (
                  <path
                    d={`M 20,110 L ${chartPoints} L 480,110 Z`}
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
                      fill="#0C2547"
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
            </div>
          )}
        </div>

        {/* Dynamic tips card (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#0C2547] to-[#071A35] text-white border border-sds-border rounded-3xl p-5 shadow-sds-md relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3" /> Community Impact
            </div>
            <h4 className="text-xs font-black text-white">
              Expats Savings Standard
            </h4>
            <p className="text-xs text-sds-text-sec mt-2 leading-relaxed">
              Expats who compare remittance options using SariRemit save an average of <strong>4.5% of their total sent amount</strong>. Over a year, this can amount to more than <strong>1,800 SAR</strong>!
            </p>
          </div>

          <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-5 shadow-sds-md text-left">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest mb-3 font-mono text-sds-secondary">
              💡 Smart Tips
            </h4>
            <ul className="space-y-3 text-xs text-sds-text-sec leading-relaxed">
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Avoid weekend cash pickups when traditional counters have high margins.</span>
              </li>
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>STC Pay and UrPay offer competitive digital rates with instant processing.</span>
              </li>
              <li className="flex gap-2 items-start">
                <ChevronRight className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Double-check transfer fees; sometimes a worse rate with zero fee is cheaper for smaller transfers.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* 4. TRANSACTION LOG LIST */}
      <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-5 sm:p-6 shadow-sds-lg text-left">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <History className="w-4 h-4 text-[#10B981]" />
            Transfer Ledger Log
          </h3>
          <span className="text-[10px] font-mono text-sds-text-sec font-bold uppercase">{transfers.length} records active</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sds-text-sec text-xs font-mono">Loading savings ledger...</div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center text-sds-text-sec border border-dashed border-sds-border rounded-2xl max-w-md mx-auto">
            <PiggyBank className="w-12 h-12 text-sds-text-sec opacity-40 mx-auto mb-3" />
            <p className="font-extrabold text-sm text-white uppercase">No recorded transfers</p>
            <p className="text-xs text-sds-text-sec mt-1 max-w-xs mx-auto text-center">
              Record your remittance transfers using the button above to start compiling your cumulative analytics.
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
                  <tr key={t.id} className="hover:bg-[#071A35]/40 transition-colors">
                    <td className="py-3.5 font-mono text-sds-text-sec font-bold">
                      {t.recorded_at ? new Date(t.recorded_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 font-bold text-white flex items-center gap-1.5">
                      <span className="text-sm">{getCorridorFlag(t.corridor_id)}</span>
                      <span>{getCorridorName(t.corridor_id)}</span>
                    </td>
                    <td className="py-3.5 text-slate-300 font-semibold">
                      {getProviderName(t.provider_id)}
                    </td>
                    <td className="py-3.5 font-mono font-extrabold text-white">
                      {t.send_amount.toLocaleString()} SAR
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-400">
                      {t.recipient_amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 font-mono font-black text-[#10B981] text-right">
                      +{t.computed_savings.toLocaleString()} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD TRANSFER MODAL (SDS COMPLIANT) */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 text-sds-text">
          <div className="bg-[#0C2547] rounded-3xl border border-sds-border shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-[#071A35] px-5 py-4 flex items-center justify-between border-b border-sds-border">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-white font-mono">
                <PiggyBank className="w-5 h-5 text-[#10B981]" />
                Record Remittance Transfer
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-sds-text-sec hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddTransfer} className="p-6 space-y-4 text-left">
              
              {/* Corridor selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                  Destination Corridor
                </label>
                <select
                  value={corridorId}
                  onChange={(e) => setCorridorId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                >
                  {CORRIDORS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#071A35] text-slate-850 font-semibold">
                      {c.flag} {c.toCountry} ({c.currencyCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                  Provider Used
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#071A35] text-slate-850 font-semibold">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Send amount input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                  Sending Amount (SAR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-sds-border">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 bg-[#071A35] hover:bg-[#091f3e] text-slate-350 border border-sds-border font-black text-xs uppercase rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black text-xs uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save Ledger</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
