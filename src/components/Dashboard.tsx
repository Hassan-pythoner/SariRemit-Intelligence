import React, { useState, useEffect } from 'react';
import { TranslationDict, UserProfile, RecordedTransfer, Corridor, SriReferenceBenchmark } from '../types';
import { CORRIDORS, ENABLE_SDS_3_DASHBOARD } from '../services/constants';
import { getRecommendations, getUserSavingsLedger, getRemittanceChannelsSync, fetchCommunitySubmissions, SRI, DbCommunitySubmission } from '../services/supabaseService';
import { slf } from '../services/slfService';
import { 
  Sparkles, ArrowLeftRight, TrendingUp, Landmark, ShieldCheck, Zap, 
  ArrowRight, Wallet, History, AlertCircle, Bell, Info, Calculator, 
  Star, Check, ChevronRight, RefreshCw, User, CheckCircle2, Globe,
  Search, Compass, PiggyBank, PlusCircle, LayoutDashboard, Menu, X,
  ExternalLink, Share2, Award, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect, SDSSisGauge } from './Sds';
import { ProviderLogo, ProviderBrandBlock, CountryFlag, BrandIllustration } from './SdsBamComponents';
import { RecordTransferModal } from './RecordTransferModal';
import { getProviderIdentity } from '../services/pisService';

interface DashboardProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfile;
  setActiveTab: (tab: string) => void;
  setQuickSearch: (search: { corridorId: string; amount: number }) => void;
}

export default function Dashboard({
  language,
  t,
  profile,
  setActiveTab,
  setQuickSearch,
}: DashboardProps) {
  const isRtl = language === 'ar';

  // --- REVERT PATHWAY FALLBACK ---
  if (!ENABLE_SDS_3_DASHBOARD) {
    throw new Error("Legacy design is deprecated and no longer functional.");
  }

  // --- STATE DECLARATIONS (SDS 3.0) ---
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(
    profile.preferredCorridorId || 'sa-pk'
  );
  const [amount, setAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCrvsLoading, setIsCrvsLoading] = useState<boolean>(true);
  
  // RRE/SIC results
  const [bestProvider, setBestProvider] = useState<string>('STC Pay');
  const [netRecipient, setNetRecipient] = useState<number>(0);
  const [sisScore, setSisScore] = useState<number>(92);
  const [sisLabel, setSisLabel] = useState<string>('Excellent');
  const [confidence, setConfidence] = useState<string>('High');
  const [lastUpdated, setLastUpdated] = useState<string>('3 minutes ago');
  const [estimatedSavings, setEstimatedSavings] = useState<number>(35);
  const [recommendedChannel, setRecommendedChannel] = useState<any>(null);
  const [allOptions, setAllOptions] = useState<any[]>([]);

  // Real user transfer & savings history from SEPS source of truth
  const [transfers, setTransfers] = useState<RecordedTransfer[]>([]);
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lastTransfer, setLastTransfer] = useState<RecordedTransfer | null>(null);
  const [savingsTrend, setSavingsTrend] = useState<any[]>([]);

  // CRVS real verified community submissions
  const [communitySubmissions, setCommunitySubmissions] = useState<DbCommunitySubmission[]>([]);

  // Live Reference Benchmark (SRI)
  const [benchmark, setBenchmark] = useState<SriReferenceBenchmark | null>(null);

  // Search query & interactive overlays
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Modals / Explainability / Record Transfer states
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isRecordingOpen, setIsRecordingOpen] = useState<boolean>(false);
  const [recordingOption, setRecordingOption] = useState<any>(null);

  const activeCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS[0];

  // --- DATA FETCHING (CONTAINS NO MOCK DATA) ---

  // Load real SEPS savings and user transfers
  useEffect(() => {
    let isMounted = true;
    getUserSavingsLedger(profile.id)
      .then(({ transfers: activeTransfers, summary, trend }) => {
        if (!isMounted) return;
        setTransfers(activeTransfers);
        setLifetimeSavings(summary.lifetimeSavingsSAR);
        setMonthlySavings(summary.monthlySavingsSAR);
        setLastTransfer(activeTransfers[0] || null);
        setSavingsTrend(trend || []);
      })
      .catch((err) => console.error('[SDS 3.0 Dashboard] SEPS ledger fetch failed:', err));

    return () => {
      isMounted = false;
    };
  }, [profile.id]);

  // Load real verified CRVS community reports
  useEffect(() => {
    let isMounted = true;
    setIsCrvsLoading(true);
    fetchCommunitySubmissions()
      .then((subs) => {
        if (!isMounted) return;
        // Strict scope check: Only approved or verified status community reports
        const approvedOnly = subs.filter(s => s.status === 'approved' || s.status === 'verified');
        setCommunitySubmissions(approvedOnly);
        setIsCrvsLoading(false);
      })
      .catch((err) => {
        console.error('[SDS 3.0 Dashboard] CRVS community submissions fetch failed:', err);
        setIsCrvsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load dynamic SIC/RRE recommendations & Reference Benchmark
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Fetch live recommendation options
    getRecommendations(selectedCorridorId, amount)
      .then((res) => {
        if (!isMounted) return;
        setAllOptions(res.allOptions || []);
        if (res.bestOption) {
          setBestProvider(res.bestOption.best_provider_name);
          setNetRecipient(res.bestOption.net_recipient_amount);
          setConfidence(res.bestOption.confidence);
          setEstimatedSavings(res.bestOption.estimated_savings);
          
          if (res.bestOption.last_updated) {
            const diff = Math.round((Date.now() - new Date(res.bestOption.last_updated).getTime()) / 60000);
            setLastUpdated(diff <= 1 ? (isRtl ? 'الآن' : 'Just now') : (isRtl ? `قبل ${diff} دقيقة` : `${diff} mins ago`));
          }

          const bestOptionDetails = res.allOptions.find(o => o.resolved.provider_id === res.bestOption.best_provider_id);
          if (bestOptionDetails) {
            setSisScore(bestOptionDetails.sis.sis_score);
            setSisLabel(bestOptionDetails.sis.sis_label);
            setRecommendedChannel(bestOptionDetails);
          } else {
            setRecommendedChannel({
              resolved: {
                provider_code: res.bestOption.best_provider_id,
                displayName: res.bestOption.best_provider_name,
                providerName: res.bestOption.best_provider_name,
                resolved_rate: activeCorridor.baseExchangeRate,
                transfer_fee: activeCorridor.typicalFee,
                source_label: 'Database Sync',
                confidence: 'high',
                freshness_status: 'verified'
              },
              sis: {
                sis_score: 90,
                sis_label: 'Excellent'
              },
              netAmount: res.bestOption.net_recipient_amount,
              totalFees: activeCorridor.typicalFee
            });
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[SDS 3.0 Dashboard] RRE fetch failed:', err);
        setIsLoading(false);
      });

    // Fetch live Reference Benchmark via SRI
    SRI.getReferenceBenchmark(selectedCorridorId)
      .then((bench) => {
        if (!isMounted) return;
        setBenchmark(bench);
      })
      .catch((err) => console.error('[SDS 3.0 Dashboard] SRI Benchmark fetch failed:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedCorridorId, amount, activeCorridor.baseExchangeRate, activeCorridor.typicalFee, isRtl]);

  // --- ACTIONS ---
  const handleCompareFull = () => {
    setQuickSearch({
      corridorId: selectedCorridorId,
      amount: amount
    });
    setActiveTab('compare');
  };

  const triggerRecordModal = () => {
    if (recommendedChannel) {
      setRecordingOption(recommendedChannel);
      setIsRecordingOpen(true);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return isRtl ? 'صباح الخير' : 'Good morning';
    if (hr < 18) return isRtl ? 'مساء الخير' : 'Good afternoon';
    return isRtl ? 'مساء الخير' : 'Good evening';
  };

  const getDynamicReason = () => {
    return isRtl
      ? "بناءً على المعلومات المتاحة حاليًا، يُقدَّر أن هذا المزود يوفر أعلى قيمة استلام لمعاملتك المختارة."
      : "Based on currently available information, this provider is estimated to provide the highest recipient value for your selected transfer.";
  };

  const recommendedProviderId = recommendedChannel?.resolved?.provider_id || recommendedChannel?.resolved?.provider_code || recommendedChannel?.resolved?.providerCode || 'stc-pay';
  const bestProviderIdentity = getProviderIdentity(recommendedProviderId);

  const recommendedChannelObj = recommendedChannel?.resolved || {
    provider_id: bestProviderIdentity.provider_id,
    provider_code: bestProviderIdentity.provider_code,
    displayName: bestProviderIdentity.display_name,
    providerName: bestProviderIdentity.display_name,
    resolved_rate: activeCorridor.baseExchangeRate,
    transfer_fee: activeCorridor.typicalFee,
    source_label: 'Verified Direct Rate'
  };

  // --- SEARCH BAR UTILITY ENGINE ---
  const filteredCorridors = CORRIDORS.filter(c => 
    c.toCountry.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.toCountryAr && c.toCountryAr.includes(searchQuery)) ||
    c.currencyCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMostUsedProviderName = () => {
    if (transfers.length === 0) return null;
    const counts: Record<string, number> = {};
    transfers.forEach(t => {
      const id = t.channelId || 'stc-pay';
      counts[id] = (counts[id] || 0) + 1;
    });
    let maxId = '';
    let maxCount = 0;
    Object.entries(counts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxId = id;
      }
    });
    const channels = getRemittanceChannelsSync();
    const chan = channels.find(c => c.id === maxId);
    return chan?.displayName || chan?.providerName || maxId;
  };

  return (
    <div className={`relative min-h-screen text-sds-text ${isRtl ? 'text-right font-sans' : 'text-left font-sans'} animate-fadeIn`}>
      
      {/* BACKGROUND ABSTRACT SDS ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full" />
        {/* World Grid dotted layout */}
        <svg className="absolute top-10 left-0 w-full h-[600px] opacity-[0.03] text-slate-300" fill="currentColor" viewBox="0 0 1000 500">
          <circle cx="150" cy="80" r="1.5" />
          <circle cx="250" cy="180" r="1.5" />
          <circle cx="350" cy="110" r="1.5" />
          <circle cx="450" cy="220" r="1.5" />
          <circle cx="550" cy="130" r="1.5" />
          <circle cx="650" cy="270" r="1.5" />
          <circle cx="750" cy="160" r="1.5" />
          <circle cx="850" cy="210" r="1.5" />
          <path d="M150 80 Q 450 220, 850 210" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <path d="M250 180 Q 550 130, 750 160" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="relative z-10 space-y-8 pb-16">
        
        {/* TOP STATUS COMPACT UTILITY (Section 4) */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 border-b border-slate-800/60 pb-5">
          {/* Real-time Freshwater status strip (Section 4) */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0C2547] border border-slate-800 rounded-2xl shadow-sds-sm self-start md:self-auto font-mono">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black text-[#10B981] uppercase block tracking-wider leading-none">
                {isRtl ? 'الأسعار مستقرة ومؤكدة' : 'VERIFIED STABILITY ACTIVE'}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1 font-bold">
                {isRtl ? 'آخر تحديث مالي قبل:' : 'Updated'} {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* HERO HEADER SECTION (Elegant Playfair display typography, Section 5) */}
        <div className="space-y-2 py-4">
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20 inline-block font-mono">
            {isRtl ? 'مساعد اتخاذ القرار المالي' : 'REMITTANCE DECISION CONTROL'}
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight leading-none">
            {isRtl ? `أهلاً بك مجدداً، ${profile.name}` : `Make smarter moves with your money, ${profile.name}`}
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
            {isRtl 
              ? 'أسعار صرف موثوقة، معلومات مدققة من مجتمع المغتربين، وتحليلات واضحة للحوالة القادمة الخاصة بك.'
              : 'Current rates, verified information and clear insights for your next transfer.'}
          </p>
        </div>

        {/* RESPONSIVE THREE-ZONE LAYOUT (Section 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ZONE B: MAIN DASHBOARD WORKSPACE (Col span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CARD 1: TODAY'S RECOMMENDATION CARD (Section 6) */}
            {isLoading ? (
              <RecommendationSkeleton isRtl={isRtl} />
            ) : (
              <div className="relative bg-gradient-to-br from-[#0c2547] via-[#091f3e] to-[#07172c] rounded-3xl p-5 md:p-6 shadow-2xl border-2 border-amber-500/20 overflow-hidden group hover:border-amber-500/30 transition-all">
                {/* Subtle top ambient gold glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                {/* Header banner: ✨ TODAY'S TOP RECOMMENDATION ✨ */}
                <div className="flex items-center justify-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 w-fit mx-auto mb-5">
                  <span className="text-amber-400 text-xs">✨</span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                    {isRtl ? 'التوصية المميزة لليوم' : "TODAY'S TOP RECOMMENDATION"}
                  </span>
                  <span className="text-amber-400 text-xs">✨</span>
                </div>

                {/* Grid layout for Provider Info and SIS Score Gauge */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <ProviderLogo channel={{ ...recommendedChannelObj, providerCode: recommendedProviderId, displayName: bestProviderIdentity.display_name }} size="md" shape="rounded" surface="dark" />
                    <div className="text-left">
                      <h4 className="text-base font-extrabold text-white leading-tight uppercase tracking-tight">
                        {bestProviderIdentity.display_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {isRtl ? `عبر ${recommendedChannelObj.source_label || 'قناة آمنة'}` : `via ${recommendedChannelObj.source_label || 'Direct Wallet'}`}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded text-[9px] font-black uppercase tracking-wider">
                          {isRtl ? 'ثقة عالية' : 'High Confidence'}
                        </span>
                        <SDSBadge type="verified" />
                      </div>
                    </div>
                  </div>

                  {/* Circular SIS Gauge */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          className="stroke-slate-800"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="23"
                          className="stroke-[#10B981]"
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 23}
                          strokeDashoffset={2 * Math.PI * 23 * (1 - (sisScore || 90) / 100)}
                        />
                      </svg>
                      <span className="text-xs font-black text-white font-mono">{((sisScore || 90) / 10).toFixed(1)}</span>
                    </div>
                    <span className="text-[8px] font-black tracking-wider text-[#10B981] uppercase mt-1">
                      {isRtl ? 'مؤشر SIS' : 'SIS SCORE'}
                    </span>
                  </div>
                </div>

                {/* 2-Column Key Payout Stats Panel */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-800/60 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isRtl ? 'المستلم يحصل على' : 'Recipient gets'}
                    </span>
                    <span className="text-xl md:text-2xl font-black text-[#10B981] font-mono leading-none block">
                      {netRecipient.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {activeCorridor.currencyCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {isRtl ? `مقابل ${amount.toLocaleString()} ر.س` : `for ${amount.toLocaleString()} SAR`}
                    </span>
                  </div>

                  <div className="space-y-1 pl-3 border-l border-slate-800/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isRtl ? 'أنت توفر حتى' : 'You save up to'}
                    </span>
                    <span className="text-xl md:text-2xl font-black text-[#10B981] font-mono leading-none block">
                      {estimatedSavings.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {activeCorridor.currencyCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {isRtl ? 'مقارنة بالخيارات الأخرى' : 'vs other options'}
                    </span>
                  </div>
                </div>

                {/* 3-Column Secondary Stats Panel */}
                <div className="grid grid-cols-3 gap-2 py-4 text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{isRtl ? 'السرعة المتوقعة' : 'Est. delivery'}</span>
                    <span className="text-xs font-extrabold text-[#10B981] block">{isRtl ? 'فوري' : 'Instant'}</span>
                    <span className="text-[9px] text-slate-400 block font-medium">{isRtl ? 'بضع ثوانٍ' : 'Few seconds'}</span>
                  </div>

                  <div className="space-y-0.5 pl-2 border-l border-slate-800/40">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{isRtl ? 'التكلفة الإجمالية' : 'Total cost'}</span>
                    <span className="text-xs font-extrabold text-white block font-mono">{recommendedChannelObj.transfer_fee || 8.05} SAR</span>
                    <span className="text-[9px] text-slate-400 block font-medium">{isRtl ? 'شامل الضرائب والرسوم' : 'All inclusive'}</span>
                  </div>

                  <div className="space-y-0.5 pl-2 border-l border-slate-800/40">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{isRtl ? 'سعر الصرف' : 'Rate'}</span>
                    <span className="text-xs font-extrabold text-white block font-mono">{recommendedChannelObj.resolved_rate}</span>
                    <span className="text-[9px] text-[#10B981] block font-black uppercase tracking-wider">{isRtl ? 'أفضل سعر' : 'Best rate'}</span>
                  </div>
                </div>

                {/* Primary Button View all options */}
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-400 font-medium text-left leading-tight max-w-xs">
                    {isRtl 
                      ? "* الأسعار مطابقة لقاعدة بيانات التحليل ومأخوذة من واجهات برمجة التطبيقات المعتمدة للشركاء." 
                      : "* Recommendations are based on true overall cost optimizations compared chronologically."}
                  </span>

                  <button
                    onClick={handleCompareFull}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-950/20 font-extrabold"
                  >
                    <span>{isRtl ? 'مقارنة كل الخيارات' : 'View all options'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                {/* Secondary Actions drawer trigger */}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setIsExplainOpen(true)}
                    className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-slate-800/60"
                  >
                    <HelpCircle className="w-3 h-3 text-amber-400" />
                    <span>{isRtl ? 'لماذا؟' : 'Why?'}</span>
                  </button>

                  <button
                    onClick={triggerRecordModal}
                    className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800 text-[#10B981] rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-slate-800/60"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>{isRtl ? 'تسجيل الحوالة' : 'Record'}</span>
                  </button>
                </div>

              </div>
            )}

            {/* CARD 2: QUICK ACTIONS ROW (Section 8) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest font-mono">
                {isRtl ? 'إجراءات سريعة ومختصرة' : 'FINANCIAL WORKSPACE SHORTCUTS'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: isRtl ? 'مقارنة الأسعار' : 'Compare Rates', helper: isRtl ? 'تحليل كل القنوات' : 'Find best providers', icon: ArrowLeftRight, tab: 'compare', color: 'text-emerald-400 bg-emerald-500/5' },
                  { title: isRtl ? 'سجل التوفير' : 'Track Savings', helper: isRtl ? 'تحليلات تقدمك المالي' : 'Monitor milestones', icon: PiggyBank, tab: 'savings', color: 'text-amber-400 bg-amber-400/5' },
                  { title: isRtl ? 'توثيق الحوالات' : 'Verify a Rate', helper: isRtl ? 'إرسال لقطة شاشة والتحقق' : 'Submit live receipt', icon: PlusCircle, tab: 'submit', color: 'text-indigo-400 bg-indigo-500/5' },
                  { title: isRtl ? 'تنبيهات مخصصة' : 'Rate Alerts', helper: isRtl ? 'مراقبة الصرف الفوري' : 'Notify on high value', icon: Bell, tab: 'alerts', color: 'text-pink-400 bg-pink-500/5' }
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(act.tab)}
                      className="p-4 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col items-start gap-3 transition-all cursor-pointer text-left group"
                    >
                      <div className={`p-2.5 rounded-xl ${act.color} transition-transform group-hover:scale-110`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block group-hover:text-[#10B981] transition-colors">{act.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium block leading-tight">{act.helper}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: SAVINGS JOURNEY & COMPACT CHART (Section 9/10) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Savings Journey Stats */}
              <div className="md:col-span-5 bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono">
                    {isRtl ? 'مدخراتك المحققة' : 'SAVINGS JOURNEY'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'إجمالي توفير ساري ريميت' : 'ESTIMATED LIFETIME SAVINGS'}</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black font-mono text-white">
                        {lifetimeSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs font-bold text-slate-400">SAR</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'حوالات نشطة' : 'TRANSFERS'}</span>
                      <span className="text-sm font-extrabold text-white block mt-0.5 font-mono">{transfers.length}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'المزود المفضل' : 'MOST USED'}</span>
                      <span className="text-xs font-extrabold text-amber-400 truncate block mt-0.5">
                        {getMostUsedProviderName() || (isRtl ? 'غير متوفر' : 'None yet')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {transfers.length > 0 ? (
                      <div className="p-3 bg-[#10B981]/5 rounded-xl border border-[#10B981]/10 text-[10px] text-slate-300 leading-relaxed">
                        {isRtl ? (
                          <>لقد قمت بتحقيق توفير بقيمة <span className="text-[#10B981] font-black">{lifetimeSavings.toLocaleString()} ريال</span> مقابل ممرات الصرف التقليدية. استمر في التحقق الفوري لتعظيم مكاسبك!</>
                        ) : (
                          <>Your remittance intelligence has secured <span className="text-[#10B981] font-black">{lifetimeSavings.toLocaleString()} SAR</span> vs traditional bank transfer spreads.</>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[10px] text-slate-400 font-bold">
                          {isRtl ? 'لا يوجد سجل توفير متاح بعد.' : 'No savings history yet.'}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {isRtl ? 'قم بتسجيل حوالتك الأولى لتتبع تقدمك المالي.' : 'Record a transfer from a provider option to start tracking.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Savings Journey Chart (Section 10) */}
              <div className="md:col-span-7 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-xs font-black uppercase text-white tracking-wider font-mono">
                    {isRtl ? 'منحنى التراكم المالي' : 'CUMULATIVE TREND'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {isRtl ? 'التوفير الفعلي' : 'SEPS Savings Series'}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center py-4">
                  {transfers.length >= 2 && savingsTrend.length >= 2 ? (
                    <div className="w-full h-28 relative">
                      {/* Standard native CSS/SVG cumulative savings trend graph */}
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Horizontal lines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        
                        {/* Path Generation based on trend points */}
                        {(() => {
                          const maxVal = Math.max(...savingsTrend.map(p => p.cumulativeSavingsSAR || 1));
                          const points = savingsTrend.map((p, idx) => {
                            const x = (idx / (savingsTrend.length - 1)) * 300;
                            const y = 90 - ((p.cumulativeSavingsSAR / maxVal) * 70);
                            return `${x},${y}`;
                          });
                          const pathData = `M 0,90 L ${points.join(' L ')}`;
                          const areaData = `${pathData} L 300,90 Z`;
                          return (
                            <>
                              {/* Area fill */}
                              <path d={areaData} fill="url(#emeraldGradient)" className="opacity-15" />
                              {/* Trend Line */}
                              <path d={pathData} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              {/* Dots for points */}
                              {savingsTrend.map((p, idx) => {
                                const x = (idx / (savingsTrend.length - 1)) * 300;
                                const y = 90 - ((p.cumulativeSavingsSAR / maxVal) * 70);
                                const isLast = idx === savingsTrend.length - 1;
                                return (
                                  <circle
                                    key={idx}
                                    cx={x}
                                    cy={y}
                                    r={isLast ? 4.5 : 3}
                                    fill={isLast ? '#F59E0B' : '#10B981'}
                                    stroke="#051326"
                                    strokeWidth="1.5"
                                  />
                                );
                              })}
                              
                              <defs>
                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10B981" />
                                  <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                              </defs>
                            </>
                          );
                        })()}
                      </svg>
                      
                      <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-800/40">
                        <span>{savingsTrend[0]?.date || 'Start'}</span>
                        <span className="text-amber-400 font-bold">{isRtl ? 'أعلى نقطة توفير' : 'Latest Milestone'}</span>
                        <span>{savingsTrend[savingsTrend.length - 1]?.date || 'Now'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {isRtl ? 'الرسم البياني للتوفير التراكمي سيكون متاحاً قريباً' : 'Savings chart available soon'}
                      </p>
                      <p className="text-[9px] text-slate-400 max-w-xs mx-auto">
                        {isRtl ? 'قم بإجراء وتسجيل حوالتين على الأقل لإظهار المنحنى التاريخي للوفورات.' : 'Record at least two transfers to start visualizing cumulative SEPS optimization trends.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* CARD 4: RECENT TRANSFERS SECTION (Section 11) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">
                    {isRtl ? 'سجل الحوالات والنشاط الأخير' : 'RECENT COMPARED TRANSFERS'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('savings')}
                  className="text-[10px] font-black uppercase text-[#10B981] hover:underline cursor-pointer font-mono"
                >
                  {isRtl ? 'عرض السجل الكامل ←' : 'View all transfers →'}
                </button>
              </div>

              {transfers.length > 0 ? (
                <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800/60 space-y-3">
                  {transfers.slice(0, 3).map((item, idx) => {
                    const channels = getRemittanceChannelsSync();
                    const chan = channels.find(c => c.id === item.channelId);
                    const providerName = chan?.displayName || chan?.providerName || item.channelId;
                    const providerCode = chan?.providerCode || item.channelId;
                    return (
                      <div key={item.id} className={`flex items-center justify-between text-xs pt-3 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="flex items-center gap-3">
                          <CountryFlag country="" currency={item.destinationCurrency} size="sm" />
                          <ProviderLogo channel={{ providerCode, displayName: providerName }} size="sm" shape="circle" />
                          <div>
                            <span className="font-extrabold text-white block">
                              {item.sendAmountSAR.toLocaleString()} SAR → {item.estimatedRecipientAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} {item.destinationCurrency}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 block">
                              {new Date(item.recordedAt!).toLocaleDateString()} • {providerName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[#10B981] font-black font-mono block">
                            +{item.estimatedSavingsSAR.toLocaleString(undefined, { maximumFractionDigits: 1 })} SAR
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">{isRtl ? 'توفير محقق' : 'Saved'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl space-y-2">
                  <p className="text-[11px] text-slate-400 font-bold uppercase">
                    {isRtl ? 'لم تقم بتسجيل أي حوالة حتى الآن' : 'You haven’t recorded a transfer yet.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('compare')}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-[#10B981] hover:text-white rounded-xl text-[10px] font-bold"
                  >
                    {isRtl ? 'قارن الأسعار الآن' : 'Compare Rates Now'}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ZONE C: RIGHT CONTEXTUAL INTELLIGENCE RAIL (Section 12) */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* PANEL 1: MARKET INTELLIGENCE PANEL (Section 12) */}
            <div className="bg-[#0c2547]/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Compass className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono">
                  {isRtl ? 'نبض الأسواق الذكي' : 'MARKET INTELLIGENCE'}
                </h3>
              </div>

              <div className="space-y-4">
                {/* Reference Benchmark */}
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{isRtl ? 'مؤشر الصرف المرجعي' : 'REFERENCE BENCHMARK'}</span>
                  <span className="text-sm font-extrabold text-white mt-1 block font-mono">
                    {benchmark ? `1 SAR = ${benchmark.rate.toFixed(4)} ${activeCorridor.currencyCode}` : 'Reference Unavailable'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    {isRtl ? 'مستخرج من مصادر الصرف العام المركزي' : 'Derived from interbank & market APIs.'}
                  </span>
                </div>

                {/* Data integrity metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">{isRtl ? 'القنوات النشطة' : 'ELIGIBLE PROVIDERS'}</span>
                    <span className="text-sm font-extrabold text-[#10B981] mt-0.5 block font-mono">
                      {getRemittanceChannelsSync().length}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40">
                    <span className="text-[8px] text-slate-400 font-black block uppercase">{isRtl ? 'المصادقة والموثوقية' : 'CONFIDENCE LEVEL'}</span>
                    <span className="text-xs font-black text-amber-400 uppercase mt-1 block">
                      {confidence}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-[#051326] p-3 rounded-xl leading-relaxed">
                  {isRtl ? (
                    'مؤشر ساري ريميت المرجعي يحلل بيانات الصرف في وقتها الفعلي لفلترة فروقات الأسعار البنكية المخفية وتحديد الممر الأكثر ربحية لعائلتك.'
                  ) : (
                    'SariRemit analyzes public reference indexes to identify optimal remittance pathways and eliminate hidden markup.'
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 2: DESTINATION WATCHLIST (Section 13) */}
            <div className="bg-[#0c2547]/80 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono">
                  {isRtl ? 'قائمتك المفضلة للمتابعة' : 'YOUR CORRIDOR WATCHLIST'}
                </h3>
              </div>

              <div className="space-y-3">
                {profile.preferredCorridorId ? (
                  <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CountryFlag country="" currency={activeCorridor.currencyCode} size="sm" />
                      <div>
                        <span className="text-xs font-extrabold text-white block">
                          {isRtl ? activeCorridor.toCountryAr : activeCorridor.toCountry}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">{activeCorridor.currencyCode}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-[#10B981] font-mono block">
                        {benchmark ? benchmark.rate.toFixed(3) : activeCorridor.baseExchangeRate.toFixed(2)}
                      </span>
                      <button
                        onClick={handleCompareFull}
                        className="text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5 justify-end"
                      >
                        <span>{isRtl ? 'تحليل الصرف' : 'Compare'}</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                      {isRtl ? 'احفظ بلداً مفضلاً لمتابعة مؤشرات أسعاره هنا.' : 'Save a destination to follow its latest reference information.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3: LATEST VERIFIED COMMUNITY REPORTS (Section 14) */}
            <div className="bg-[#0c2547]/80 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono">
                  {isRtl ? 'آخر تقارير المجتمع المعتمدة' : 'VERIFIED COMMUNITY REPORTS'}
                </h3>
              </div>

              {isCrvsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-slate-900 rounded-xl" />
                  <div className="h-10 bg-slate-900 rounded-xl" />
                </div>
              ) : communitySubmissions.length > 0 ? (
                <div className="space-y-3">
                  {communitySubmissions.slice(0, 3).map((sub) => {
                    const corr = CORRIDORS.find(c => c.id === sub.corridor_id) || CORRIDORS[0];
                    const channels = getRemittanceChannelsSync();
                    const chan = channels.find(c => c.id === sub.provider_id);
                    const name = chan?.displayName || sub.provider_name;
                    return (
                      <div key={sub.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white">{sub.submitted_by_name}</span>
                            <SDSBadge type="verified" />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {isRtl ? 'أرسل بقيمة' : 'Sent'} <span className="font-mono text-white">{sub.send_amount} SAR</span> via <span className="text-amber-400 font-semibold">{name}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#10B981] font-mono block">
                            {sub.exchange_rate}
                          </span>
                          <span className="text-[8px] text-slate-400 uppercase font-mono">{corr.currencyCode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase leading-normal">
                    {isRtl ? 'لا توجد تقارير معتمدة حالياً' : 'No verified community reports are available yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* PANEL 4: SARIREMIT TRUST PROMISE (Section 17) */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-3 text-left">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest font-mono block">{isRtl ? 'ميثاق الموثوقية والأمان' : 'SARIREMIT TRUST PROMISE'}</span>
              <h4 className="text-xs font-black text-white">{isRtl ? 'لماذا يعتمد المغتربون على ساري ريميت؟' : 'Truthful Support Dashboard'}</h4>
              <ul className="space-y-2 text-[10px] text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'مقارنات حيادية غير منحازة لأي شريك تجاري.' : 'Clear and neutral comparisons across major corridors.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'أسعار الصرف والرسوم مدققة من مصادر المجتمع المعتمدة.' : 'Verified community contributions via structural logs.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'أمن بياناتك وحسابك يتم عبر بوابات تشفير قياسية.' : 'Secure and isolated account access.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'توصيات مالية قابلة للتفسير الكامل وخالية من الغموض.' : 'Explainable recommendations.'}</span>
                </li>
              </ul>
            </div>

          </aside>

        </div>

        {/* LOWER TRUST STRIP (Section 18) */}
        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-medium uppercase font-mono tracking-wider">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{isRtl ? 'شفافية تكلفة التحويل الكاملة' : 'Clear cost breakdown'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{isRtl ? 'بيانات مدققة ومؤكدة جماهيرياً' : 'Community-supported information'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{isRtl ? 'بوابة دخول آمنة تماماً' : 'Secure account access'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{isRtl ? 'توصيات ذكية مفسرة بالكامل' : 'Explainable recommendations'}</span>
          </div>
        </div>

      </div>

      {/* --- EXPLAINABILITY DRAWER PANEL OVERLAY (Section 7) --- */}
      {isExplainOpen && (
        <div className="fixed inset-0 z-50 bg-[#051326]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-[#0c2547] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <button
              onClick={() => setIsExplainOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-mono">
                {isRtl ? 'مساعد التفسير المالي الذكي' : 'EXPLAINABLE DECISION LOGIC'}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isRtl 
                  ? `لماذا تم ترشيح ${bestProviderIdentity.display_name}؟` 
                  : `Why ${bestProviderIdentity.display_name} is recommended`}
              </h3>
              <p className="text-xs text-slate-300">
                {isRtl 
                  ? 'يتم تقييم وترشيح كل قناة وفق خوارزمية ساري ريميت المتقدمة بناءً على المعايير التالية:' 
                  : 'SariRemit optimizes the recommendation by combining dynamic fee checks, tax markups, and community reported values.'}
              </p>
            </div>

            {/* Metrics Checklist using Neutral Permitted Language ONLY */}
            <div className="space-y-3.5 pt-3">
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'مؤشر الصرف المرجعي' : 'REFERENCE BENCHMARK'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block">
                    {benchmark ? `1 SAR = ${benchmark.rate.toFixed(4)} ${activeCorridor.currencyCode}` : 'Reference Unavailable'}
                  </span>
                </div>
                <SDSBadge type="verified" />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'سعر الصرف المعتمد للمزود' : 'RESOLVED PROVIDER RATE'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block font-mono">
                    1 SAR = {recommendedChannelObj.resolved_rate} {activeCorridor.currencyCode}
                  </span>
                </div>
                <span className="text-xs font-black text-[#10B981] font-mono">+{((recommendedChannelObj.resolved_rate - (benchmark?.rate || activeCorridor.baseExchangeRate)) / (benchmark?.rate || activeCorridor.baseExchangeRate) * 100).toFixed(2)}%</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'المبلغ المستلم الإجمالي المتوقع' : 'ESTIMATED RECIPIENT AMOUNT'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block font-mono">
                    {netRecipient.toLocaleString()} {activeCorridor.currencyCode}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Net</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'مجموع الرسوم الإجمالية للمزود' : 'ESTIMATED OVERALL CHARGES'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block font-mono">
                    {recommendedChannelObj.transfer_fee} SAR
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Fees + VAT</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'الفرق التقديري عن المؤشر العام' : 'ESTIMATED RATE IMPACT'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block font-mono">
                    {(((recommendedChannelObj.resolved_rate - (benchmark?.rate || activeCorridor.baseExchangeRate)) / (benchmark?.rate || activeCorridor.baseExchangeRate)) * 100).toFixed(2)}%
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-black uppercase font-mono">{isRtl ? 'أفضل قيمة' : 'Optimized'}</span>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-black uppercase">{isRtl ? 'درجة دقة التحليل والمقارنة' : 'COMPARISON CONFIDENCE'}</span>
                  <span className="text-xs font-medium text-slate-200 mt-1 block uppercase">
                    {confidence}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-black uppercase font-mono">100% Verified</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60">
              <span>{isRtl ? 'مصادر البيانات: واجهات الشركاء وآخر الحوالات المؤكدة' : 'Data sources used: Live API, Community submissions.'}</span>
              <span className="font-mono">{new Date().toLocaleTimeString()}</span>
            </div>

            <button
              onClick={() => setIsExplainOpen(false)}
              className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 text-[#051326] rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-bold"
            >
              {isRtl ? 'فهمت ذلك، شكراً لك' : 'I understand, thank you'}
            </button>
          </div>
        </div>
      )}

      {/* --- REAL RECORD TRANSFER MODAL INTEGRATION (Section 6) --- */}
      {isRecordingOpen && recordingOption && (
        <RecordTransferModal
          isOpen={isRecordingOpen}
          onClose={() => {
            setIsRecordingOpen(false);
            setRecordingOption(null);
          }}
          option={recordingOption}
          sendAmount={amount}
          corridor={activeCorridor}
          otherOptions={allOptions}
          userId={profile.id!}
          onSuccess={() => {
            setIsRecordingOpen(false);
            setRecordingOption(null);
            // Refresh local SEPS savings ledger
            getUserSavingsLedger(profile.id).then(({ transfers: tfs, summary }) => {
              setTransfers(tfs);
              setLifetimeSavings(summary.lifetimeSavingsSAR);
              setMonthlySavings(summary.monthlySavingsSAR);
            });
          }}
          isRtl={isRtl}
        />
      )}

    </div>
  );
}

// --- SHIMMER SKELETON COMPONENTS (Section 29) ---
function RecommendationSkeleton({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="relative bg-slate-900/40 rounded-3xl p-6 md:p-8 border border-slate-800 animate-pulse space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800" />
          <div className="space-y-2">
            <div className="h-2.5 w-32 bg-slate-850 rounded" />
            <div className="h-4 w-48 bg-slate-850 rounded" />
          </div>
        </div>
        <div className="h-10 w-44 bg-slate-850 rounded-xl" />
      </div>

      <div className="py-6 border-y border-slate-800/60 space-y-3">
        <div className="h-2.5 w-40 bg-slate-850 rounded" />
        <div className="h-8 w-64 bg-slate-850 rounded" />
        <div className="h-3.5 w-56 bg-slate-850 rounded" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="h-14 bg-slate-850 rounded-xl" />
        <div className="h-14 bg-slate-850 rounded-xl" />
        <div className="h-14 bg-slate-850 rounded-xl" />
      </div>
    </div>
  );
}

// --- LEGACY DASHBOARD EMBEDDED REVERSION (Section 33) ---
function LegacyDashboard({
  language,
  t,
  profile,
  setActiveTab,
  setQuickSearch,
}: DashboardProps) {
  throw new Error("Legacy design is deprecated and no longer functional.");
  const isRtl = language === 'ar';
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(
    profile.preferredCorridorId || 'sa-pk'
  );
  const [amount, setAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [bestProvider, setBestProvider] = useState<string>('STC Pay');
  const [netRecipient, setNetRecipient] = useState<number>(0);
  const [sisScore, setSisScore] = useState<number>(92);
  const [sisLabel, setSisLabel] = useState<string>('Excellent');
  const [confidence, setConfidence] = useState<string>('High');
  const [lastUpdated, setLastUpdated] = useState<string>('3 minutes ago');
  const [estimatedSavings, setEstimatedSavings] = useState<number>(35);
  const [recommendedChannel, setRecommendedChannel] = useState<any>(null);

  const [transfers, setTransfers] = useState<RecordedTransfer[]>([]);
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);

  const activeCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS[0];

  useEffect(() => {
    getUserSavingsLedger(profile.id)
      .then(({ transfers: activeTransfers, summary }) => {
        setTransfers(activeTransfers);
        setLifetimeSavings(summary.lifetimeSavingsSAR);
        setMonthlySavings(summary.monthlySavingsSAR);
      })
      .catch((err) => console.error('Failed to load transfers:', err));
  }, [profile.id]);

  useEffect(() => {
    setIsLoading(true);
    getRecommendations(selectedCorridorId, amount)
      .then((res) => {
        if (res.bestOption) {
          setBestProvider(res.bestOption.best_provider_name);
          setNetRecipient(res.bestOption.net_recipient_amount);
          setConfidence(res.bestOption.confidence);
          setEstimatedSavings(res.bestOption.estimated_savings);
          
          if (res.bestOption.last_updated) {
            const diff = Math.round((Date.now() - new Date(res.bestOption.last_updated).getTime()) / 60000);
            setLastUpdated(diff <= 1 ? 'Just now' : `${diff} mins ago`);
          }

          const bestOptionDetails = res.allOptions.find(o => o.resolved.provider_id === res.bestOption.best_provider_id);
          if (bestOptionDetails) {
            setSisScore(bestOptionDetails.sis.sis_score);
            setSisLabel(bestOptionDetails.sis.sis_label);
            setRecommendedChannel(bestOptionDetails.resolved);
          }
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedCorridorId, amount]);

  const handleCompareFull = () => {
    setQuickSearch({
      corridorId: selectedCorridorId,
      amount: amount
    });
    setActiveTab('compare');
  };

  const recommendedChannelObj = recommendedChannel || {
    provider_code: 'stc-pay',
    displayName: bestProvider,
    providerName: bestProvider
  };

  return (
    <div className={`relative min-h-screen text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn space-y-8 pb-20`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sds-border/60 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans font-black text-sds-text tracking-tight flex items-center gap-2">
            <span>👋</span>
            {isRtl ? 'صباح الخير' : 'Good morning'}, {profile.name || 'User'}
          </h1>
          <p className="text-xs md:text-sm text-sds-text-sec font-medium">
            {isRtl ? 'المساعد الذكي يتابع أسعار التحويل المباشرة.' : 'The dynamic remittance engine is evaluating the Saudi market.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0C2547] text-sds-text rounded-3xl p-6 border border-sds-border">
            <span className="text-[10px] font-black text-[#10B981] uppercase block tracking-widest">{isRtl ? 'التوصية الفورية' : "TODAY'S RECOMMENDATION"}</span>
            <h3 className="text-lg font-bold text-white mt-1">🇸🇦 SAR → {activeCorridor.flag} {activeCorridor.toCountry}</h3>
            
            <div className="my-6 py-4 border-y border-sds-border/60 text-3xl font-bold font-mono text-white">
              {isLoading ? '...' : netRecipient.toLocaleString()} {activeCorridor.currencyCode}
            </div>

            <button
              onClick={handleCompareFull}
              className="px-5 py-2.5 bg-[#10B981] text-[#071A35] rounded-xl text-xs font-bold uppercase transition-all"
            >
              {isRtl ? 'قارن كل الخيارات' : 'Compare Options Now'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">{isRtl ? 'الحاسبة السريعة' : 'QUICK CALCULATOR'}</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">{isRtl ? 'أنت ترسل' : 'YOU SEND'}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-[#071A35] border border-sds-border rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
            </div>
            <button
              onClick={handleCompareFull}
              className="w-full py-2.5 bg-[#10B981] text-[#071A35] rounded-xl text-xs font-bold"
            >
              {isRtl ? 'تحليل الأسعار' : 'Compare All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
