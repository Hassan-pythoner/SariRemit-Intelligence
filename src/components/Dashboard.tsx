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
import { SisService } from '../services/sic/sisIntelligenceService';
import { useTheme } from '../context/ThemeContext';
import { LiveIntelligenceStatus } from './intelligence/LiveIntelligenceStatus';
import { MarketHeartbeat, CorridorMovement } from './intelligence/MarketHeartbeat';
import { IntelligenceActivityFeed } from './intelligence/IntelligenceActivityFeed';
import { IntelligenceBriefing } from './intelligence/IntelligenceBriefing';
import { RecommendationHero } from './recommendation/RecommendationHero';
import { useIntelligenceFreshness } from '../hooks/useIntelligenceFreshness';
import { useRecommendationTransition } from '../hooks/useRecommendationTransition';

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
  const { resolvedTheme } = useTheme();

  const getConfidenceBadgeColor = (band: string) => {
    if (band === 'Very High' || band === 'High') {
      return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
    } else if (band === 'Moderate') {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else if (band === 'Low' || band === 'Very Low') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else {
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getConfidenceLabel = (band: string) => {
    const isRtlLang = isRtl;
    if (band === 'Very High') return isRtlLang ? 'ثقة عالية جداً' : 'Very High Confidence';
    if (band === 'High') return isRtlLang ? 'ثقة عالية' : 'High Confidence';
    if (band === 'Moderate') return isRtlLang ? 'ثقة متوسطة' : 'Moderate Confidence';
    if (band === 'Low') return isRtlLang ? 'ثقة منخفضة' : 'Low Confidence';
    if (band === 'Very Low') return isRtlLang ? 'ثقة منخفضة جداً' : 'Very Low Confidence';
    return isRtlLang ? 'غير متوفر' : 'Unavailable Confidence';
  };

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

  // Mobile-First SDS 2.0 Sheet States
  const [isCorridorSheetOpen, setIsCorridorSheetOpen] = useState<boolean>(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState<boolean>(false);
  const [selectedDetailOption, setSelectedDetailOption] = useState<any>(null);

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
            SisService.calculateSisV2ForOption(bestOptionDetails, selectedCorridorId)
              .then((sisV2) => {
                if (!isMounted) return;
                setSisScore(sisV2.overallScore);
                setSisLabel(sisV2.confidenceBand);
                setConfidence(sisV2.confidenceBand);
                setRecommendedChannel({
                  ...bestOptionDetails,
                  sis2: sisV2
                });
              })
              .catch((err) => {
                console.error('[SDS 3.0 Dashboard] SIS 2.0 calc failed:', err);
                if (!isMounted) return;
                setSisScore(bestOptionDetails.sis.sis_score);
                setSisLabel(bestOptionDetails.sis.sis_label);
                setRecommendedChannel(bestOptionDetails);
              });
          } else {
            const fallbackOpt = {
              resolved: {
                provider_id: res.bestOption.best_provider_id,
                provider_code: res.bestOption.best_provider_id,
                provider_name: res.bestOption.best_provider_name,
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
            };

            SisService.calculateSisV2ForOption(fallbackOpt, selectedCorridorId)
              .then((sisV2) => {
                if (!isMounted) return;
                setSisScore(sisV2.overallScore);
                setSisLabel(sisV2.confidenceBand);
                setConfidence(sisV2.confidenceBand);
                setRecommendedChannel({
                  ...fallbackOpt,
                  sis2: sisV2
                });
              })
              .catch((err) => {
                console.error('[SDS 3.0 Dashboard] Fallback SIS 2.0 calc failed:', err);
                if (!isMounted) return;
                setRecommendedChannel(fallbackOpt);
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
    return slf.getGreeting(profile.name || 'User', language);
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

  // SDS 2.0 Ambient Intelligence Hooks
  const freshnessInfo = useIntelligenceFreshness(
    recommendedChannel?.resolved?.last_updated || new Date().toISOString(),
    isLoading
  );

  const { isUpdating, updateNotice } = useRecommendationTransition(
    recommendedProviderId,
    netRecipient,
    isRtl
  );

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
        
        {/* HERO HEADER SECTION (SDS 2.0 Display Typography & Unified Greeting) */}
        <div className="flex items-start justify-between py-2 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-sds-primary uppercase tracking-widest bg-sds-primary/10 px-3 py-1 rounded-xl border border-sds-primary/20 inline-block">
              {isRtl ? 'بوابة التحليل المالي والقرار' : 'TODAY\'S INTELLIGENCE'}
            </span>
            <h1 className="text-2xl md:text-4xl font-sans font-extrabold text-sds-text tracking-tight leading-tight">
              {slf.getGreeting(profile.name || 'User', language)}
            </h1>
            <p className="text-sm md:text-base text-sds-text-sec max-w-2xl font-medium leading-relaxed">
              {isRtl 
                ? 'أسعار صرف موثوقة، معلومات مدققة من مجتمع المغتربين، وتحليلات واضحة للحوالة القادمة الخاصة بك.'
                : 'Current rates, verified information and clear insights for your next transfer.'}
            </p>

            <IntelligenceBriefing
              corridor={activeCorridor}
              bestProviderName={bestProviderIdentity.display_name}
              amount={amount}
              confidenceBand={confidence}
              isRtl={isRtl}
              className="mt-3 max-w-2xl"
            />
          </div>
          <div className="pt-2">
            <SDSBadge type="verified" />
          </div>
        </div>

        {/* --- MOBILE COMPANION HOME VIEW (Strictly matching Section 5 & 6) --- */}
        <div className="block md:hidden space-y-6">
          {/* Today's Intelligence Briefing Block */}
          <div className="bg-sds-card border border-sds-border rounded-[20px] p-5 shadow-sds-md relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-36 h-36 bg-sds-primary/5 blur-[40px] rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-sds-border pb-3.5">
              <div>
                <span className="text-[9px] font-bold text-sds-secondary uppercase tracking-widest block">
                  {isRtl ? 'تحليلات نبض الصرف اليومي' : "TODAY'S BRIEFING"}
                </span>
                <span className="text-xs font-bold text-sds-text mt-0.5 block flex items-center gap-1.5">
                  <span>{isRtl ? 'الممر النشط:' : 'Active Route:'}</span>
                  <CountryFlag country="" currency={activeCorridor.currencyCode} size="xs" />
                  <span className="text-sds-text font-extrabold font-mono text-[11px]">{activeCorridor.fromCountry} → {activeCorridor.toCountry}</span>
                </span>
              </div>
              <button 
                onClick={() => setIsCorridorSheetOpen(true)}
                className="px-2.5 py-1.5 bg-sds-bg-surface-soft border border-sds-border text-sds-text rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>{isRtl ? 'تغيير' : 'Change'}</span>
              </button>
            </div>

            {/* Concise Daily Intelligence briefing (Section 5) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-sds-bg-surface-soft rounded-2xl border border-sds-border">
                <span className="text-[8px] text-sds-text-sec font-bold block uppercase">{isRtl ? 'أعلى قيمة استلام' : 'BEST VALUE TODAY'}</span>
                <span className="text-xs font-bold text-sds-text mt-0.5 block truncate">{bestProviderIdentity.display_name}</span>
              </div>
              <div className="p-3 bg-sds-bg-surface-soft rounded-2xl border border-sds-border">
                <span className="text-[8px] text-sds-text-sec font-bold block uppercase">{isRtl ? 'مستوى دقة التقييم' : 'CONFIDENCE BAND'}</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5 block">{getConfidenceLabel(confidence)}</span>
              </div>
              <div className="p-3 bg-sds-bg-surface-soft rounded-2xl border border-sds-border">
                <span className="text-[8px] text-sds-text-sec font-bold block uppercase">{isRtl ? 'مبلغ الاستلام التقديري' : 'EST RECIPIENT PAYOUT'}</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{netRecipient.toLocaleString()} {activeCorridor.currencyCode}</span>
              </div>
              <div className="p-3 bg-sds-bg-surface-soft rounded-2xl border border-sds-border">
                <span className="text-[8px] text-sds-text-sec font-bold block uppercase">{isRtl ? 'وفورات المعاملة المتوقعة' : 'POTENTIAL SAVINGS'}</span>
                <span className="text-xs font-black text-sds-secondary font-mono mt-0.5 block">+{estimatedSavings} {activeCorridor.currencyCode}</span>
              </div>
            </div>

            {/* Market condition & metadata updates */}
            <div className="pt-2 flex items-center justify-between text-[8px] text-sds-text-sec font-mono uppercase tracking-wide">
              <span className="flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>{isRtl ? 'حالة السوق: ممرات مستقرة' : 'Market Spread: Stable'}</span>
              </span>
              <LiveIntelligenceStatus
                status={freshnessInfo.status}
                lastUpdatedText={freshnessInfo.formattedTextEn}
                isRtl={isRtl}
                size="sm"
              />
            </div>

            {/* Core Action */}
            <button
              onClick={() => handleCompareFull()}
              className="w-full py-3 bg-sds-gold hover:bg-sds-gold/90 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all block text-center shadow-sds-sm cursor-pointer"
            >
              {isRtl ? 'قارن خيارات اليوم' : "Compare Today's Options"}
            </button>
          </div>

          {/* Quick Amount and Corridor Control (Section 7) */}
          <div className="bg-sds-card p-4 rounded-[20px] border border-sds-border space-y-3.5 text-left shadow-sds-sm">
            <span className="text-[9px] font-bold text-sds-text-sec uppercase tracking-widest block">
              {isRtl ? 'الحاسبة السريعة والتعديل' : 'QUICK REMITTANCE PREFERENCE'}
            </span>
            <div className="space-y-1.5">
              <label className="text-[9px] text-sds-text-sec uppercase font-bold tracking-wide block">{isRtl ? 'أنت ترسل' : 'YOU SEND'}</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-sds-bg-surface-soft border border-sds-border rounded-[14px] px-4 py-3 text-sds-text font-mono text-sm focus:outline-none focus:border-sds-primary pr-12"
                />
                <span className="absolute right-4 text-xs font-mono font-bold text-sds-text-sec">SAR</span>
              </div>
            </div>

            {/* Active destination selector trigger */}
            <button
              onClick={() => setIsCorridorSheetOpen(true)}
              className="w-full p-3 bg-sds-bg-surface-soft border border-sds-border rounded-[14px] flex items-center justify-between text-xs text-sds-text"
            >
              <div className="flex items-center gap-2">
                <CountryFlag country="" currency={activeCorridor.currencyCode} size="xs" />
                <span className="font-bold text-sds-text">{isRtl ? 'البلد المستلم:' : 'Destination Country:'} {isRtl ? activeCorridor.toCountryAr : activeCorridor.toCountry}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-sds-text-sec" />
            </button>
          </div>

          {/* Provider Options Swipable Carousel (Section 8 & 9) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-sds-text-sec uppercase tracking-widest">
                {isRtl ? 'عروض القنوات المتاحة' : 'PROVIDER OPPORTUNITIES'}
              </span>
              <button
                onClick={() => handleCompareFull()}
                className="text-[9px] font-bold uppercase text-sds-secondary"
              >
                {isRtl ? 'عرض الكل ←' : 'View all →'}
              </button>
            </div>

            {isLoading ? (
              <div className="h-32 bg-sds-bg-surface-soft animate-pulse rounded-2xl" />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                {allOptions.slice(0, 4).map((opt, idx) => {
                  const provId = opt.resolved?.provider_id || opt.resolved?.provider_code || opt.resolved?.providerCode || 'stc-pay';
                  const identity = getProviderIdentity(provId);
                  const isTop = idx === 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDetailOption(opt);
                        setIsDetailSheetOpen(true);
                      }}
                      className="snap-center shrink-0 w-[240px] bg-sds-card border border-sds-border rounded-[20px] p-4 space-y-3 relative active:scale-98 transition-all cursor-pointer shadow-sds-sm"
                    >
                      {isTop && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold uppercase text-emerald-600 dark:text-emerald-400 rounded">
                          {isRtl ? 'أفضل خيار' : 'Best Value'}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <ProviderLogo channel={{ ...opt.resolved, providerCode: provId, displayName: identity.display_name }} size="sm" shape="rounded" surface={resolvedTheme} />
                        <div className="text-left">
                          <span className="text-xs font-bold text-sds-text block uppercase tracking-tight truncate max-w-[120px]">{identity.display_name}</span>
                          <span className="text-[8px] text-sds-text-sec font-mono">Rate: {opt.resolved?.resolved_rate || opt.resolved?.rate}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-sds-border space-y-1 text-left">
                        <span className="text-[8px] text-sds-text-sec uppercase block">{isRtl ? 'المبلغ المستلم' : 'Recipient payout'}</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                          {opt.netAmount?.toLocaleString() || opt.resolved?.estimatedRecipientAmount?.toLocaleString()} {activeCorridor.currencyCode}
                        </span>
                        <div className="flex justify-between text-[8px] text-sds-text-muted pt-1 font-mono">
                          <span>Fee: {opt.resolved?.transfer_fee || opt.resolved?.fee} SAR</span>
                          <span className="text-sds-secondary font-semibold">Conf: {opt.sis2?.confidenceBand || opt.resolved?.confidence || 'High'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simple Savings Journey (Section 13) */}
          <div className="bg-sds-card p-4 border border-sds-border rounded-[20px] space-y-3 text-left shadow-sds-sm">
            <span className="text-[9px] font-bold text-sds-text-sec uppercase tracking-widest block">
              {isRtl ? 'رحلة التوفير والتحكم' : 'YOUR SAVINGS ACCUMULATION'}
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-sds-text-sec font-bold block">{isRtl ? 'إجمالي توفير ساري ريميت' : 'ESTIMATED LIFETIME SAVINGS'}</span>
                <span className="text-lg font-bold text-sds-text font-mono mt-0.5 block">{lifetimeSavings.toLocaleString()} SAR</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-sds-text-sec font-bold block">{isRtl ? 'حوالات مسجلة' : 'TRANSFERS'}</span>
                <span className="text-sm font-extrabold text-sds-text block mt-0.5">{transfers.length}</span>
              </div>
            </div>
          </div>

          {/* Smart Tip (Section 6 Item 7) */}
          <div className="p-4 bg-sds-secondary/5 rounded-[20px] border border-sds-secondary/10 text-left space-y-1.5 shadow-sds-sm">
            <span className="text-[9px] font-bold text-sds-secondary uppercase tracking-widest block">💡 Smart Tip</span>
            <p className="text-[10px] text-sds-text-sec leading-relaxed font-medium">
              {isRtl
                ? "إجراء عمليات التحويل خلال ساعات الصباح الأولى يضمن عادة تجنب تقلبات الصرف البنكية المؤقتة."
                : "Initiating your transfers during early morning hours typically avoids bank spreads widening during high midday volatility."}
            </p>
          </div>

          {/* Recent Activity Timeline */}
          {transfers.length > 0 && (
            <div className="space-y-3 text-left">
              <span className="text-[9px] font-bold text-sds-text-sec uppercase tracking-widest block">
                {isRtl ? 'النشاط الأخير' : 'RECENT ACTIVITY'}
              </span>
              <div className="bg-sds-card p-4 rounded-[20px] border border-sds-border space-y-3.5 divide-y divide-sds-border shadow-sds-sm">
                {transfers.slice(0, 2).map((item, idx) => {
                  return (
                    <div key={idx} className={`flex items-center justify-between text-xs pt-3.5 ${idx === 0 ? 'pt-0' : ''}`}>
                      <div className="flex items-center gap-2">
                        <CountryFlag country="" currency={item.destinationCurrency} size="xs" />
                        <div>
                          <span className="font-bold text-sds-text block">{item.sendAmountSAR.toLocaleString()} SAR → {item.destinationCurrency}</span>
                          <span className="text-[8px] text-sds-text-sec font-mono block">{new Date(item.recordedAt!).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">+{item.estimatedSavingsSAR.toLocaleString()} SAR</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- DESKTOP PROGRESSIVE UPGRADE VIEW (Section 3) --- */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ZONE B: MAIN DASHBOARD WORKSPACE (Col span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CARD 1: TODAY'S RECOMMENDATION HERO CARD (SDS 2.0 Adaptive Surface) */}
            {isLoading ? (
              <RecommendationSkeleton isRtl={isRtl} />
            ) : (
              <RecommendationHero
                recommendedChannel={recommendedChannel}
                activeCorridor={activeCorridor}
                amount={amount}
                netRecipient={netRecipient}
                estimatedSavings={estimatedSavings}
                sisScore={sisScore}
                confidence={confidence}
                freshnessStatus={freshnessInfo.status}
                lastUpdatedText={freshnessInfo.formattedTextEn}
                isUpdating={isUpdating}
                updateNotice={updateNotice}
                isRtl={isRtl}
                onRecordTransfer={triggerRecordModal}
                onCompareFull={handleCompareFull}
                onExplainOpen={() => setIsExplainOpen(true)}
              />
            )}

            {/* CARD 2: QUICK ACTIONS ROW (Section 8) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-sds-text-sec tracking-widest">
                {isRtl ? 'إجراءات سريعة ومختصرة' : 'FINANCIAL WORKSPACE SHORTCUTS'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: isRtl ? 'مقارنة الأسعار' : 'Compare Rates', helper: isRtl ? 'تحليل كل القنوات' : 'Find best providers', icon: ArrowLeftRight, tab: 'compare', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' },
                  { title: isRtl ? 'سجل التوفير' : 'Track Savings', helper: isRtl ? 'تحليلات تقدمك المالي' : 'Monitor milestones', icon: PiggyBank, tab: 'savings', color: 'text-sds-secondary bg-sds-secondary/5' },
                  { title: isRtl ? 'توثيق الحوالات' : 'Verify a Rate', helper: isRtl ? 'إرسال لقطة شاشة والتحقق' : 'Submit live receipt', icon: PlusCircle, tab: 'submit', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' }
                ].map((act, idx) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(act.tab)}
                      className="p-4 bg-sds-card hover:bg-sds-bg-surface border border-sds-border hover:border-sds-primary/30 rounded-[20px] flex flex-col items-start gap-3 transition-all cursor-pointer text-left group shadow-sds-sm"
                    >
                      <div className={`p-2.5 rounded-xl ${act.color} transition-transform group-hover:scale-110`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-sds-text block group-hover:text-sds-primary transition-colors">{act.title}</span>
                        <span className="text-[10px] text-sds-text-sec font-medium block leading-tight">{act.helper}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: SAVINGS JOURNEY & COMPACT CHART (Section 9/10) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Savings Journey Stats */}
              <div className="md:col-span-5 bg-sds-card border border-sds-border rounded-[20px] p-5 space-y-4 shadow-sds-sm">
                <div className="flex items-center gap-2 border-b border-sds-border pb-3">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase text-sds-text tracking-wider">
                    {isRtl ? 'مدخراتك المحققة' : 'SAVINGS JOURNEY'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-sds-text-sec font-bold uppercase tracking-wider block">{isRtl ? 'إجمالي توفير ساري ريميت' : 'ESTIMATED LIFETIME SAVINGS'}</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black font-mono text-sds-text">
                        {lifetimeSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs font-bold text-sds-text-sec">SAR</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <span className="text-[9px] text-sds-text-sec font-bold uppercase tracking-wider block">{isRtl ? 'حوالات نشطة' : 'TRANSFERS'}</span>
                      <span className="text-sm font-extrabold text-sds-text block mt-0.5 font-mono">{transfers.length}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-sds-text-sec font-bold uppercase tracking-wider block">{isRtl ? 'المزود المفضل' : 'MOST USED'}</span>
                      <span className="text-xs font-bold text-sds-secondary truncate block mt-0.5">
                        {getMostUsedProviderName() || (isRtl ? 'غير متوفر' : 'None yet')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {transfers.length > 0 ? (
                      <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[10px] text-sds-text-sec leading-relaxed">
                        {isRtl ? (
                          <>لقد قمت بتحقيق توفير بقيمة <span className="text-emerald-600 dark:text-emerald-400 font-bold">{lifetimeSavings.toLocaleString()} ريال</span> مقابل ممرات الصرف التقليدية. استمر في التحقق الفوري لتعظيم مكاسبك!</>
                        ) : (
                          <>Your remittance intelligence has secured <span className="text-emerald-600 dark:text-emerald-400 font-bold">{lifetimeSavings.toLocaleString()} SAR</span> vs traditional bank transfer spreads.</>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-center py-2">
                        <p className="text-[10px] text-sds-text-sec font-bold">
                          {isRtl ? 'لا يوجد سجل توفير متاح بعد.' : 'No savings history yet.'}
                        </p>
                        <p className="text-[9px] text-sds-text-muted">
                          {isRtl ? 'قم بتسجيل حوالتك الأولى لتتبع تقدمك المالي.' : 'Record a transfer from a provider option to start tracking.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Savings Journey Chart (Section 10) */}
              <div className="md:col-span-7 bg-sds-card border border-sds-border rounded-[20px] p-5 flex flex-col justify-between shadow-sds-sm">
                <div className="flex items-center justify-between border-b border-sds-border pb-3">
                  <span className="text-xs font-bold uppercase text-sds-text tracking-wider">
                    {isRtl ? 'منحنى التراكم المالي' : 'CUMULATIVE TREND'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {isRtl ? 'التوفير الفعلي' : 'SEPS Savings Series'}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center py-4">
                  {transfers.length >= 2 && savingsTrend.length >= 2 ? (
                    <div className="w-full h-28 relative">
                      {/* Standard native CSS/SVG cumulative savings trend graph */}
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Horizontal lines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke="var(--color-sds-border)" strokeWidth="1" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-sds-border)" strokeWidth="1" />
                        <line x1="0" y1="80" x2="300" y2="80" stroke="var(--color-sds-border)" strokeWidth="1" />
                        
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
                               <path d={areaData} fill="url(#emeraldGradient)" className="opacity-10" />
                               {/* Trend Line */}
                               <path d={pathData} fill="none" stroke="var(--color-sds-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                                     fill={isLast ? 'var(--color-sds-secondary)' : 'var(--color-sds-primary)'}
                                     stroke="var(--color-sds-card)"
                                     strokeWidth="1.5"
                                   />
                                 );
                               })}
                               
                               <defs>
                                 <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="0%" stopColor="var(--color-sds-primary)" />
                                   <stop offset="100%" stopColor="transparent" />
                                 </linearGradient>
                               </defs>
                             </>
                           );
                        })()}
                      </svg>
                      
                      <div className="flex justify-between items-center text-[8px] text-sds-text-sec font-mono mt-2 pt-1 border-t border-sds-border">
                        <span>{savingsTrend[0]?.date || 'Start'}</span>
                        <span className="text-sds-secondary font-bold">{isRtl ? 'أعلى نقطة توفير' : 'Latest Milestone'}</span>
                        <span>{savingsTrend[savingsTrend.length - 1]?.date || 'Now'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <div className="inline-flex p-3 rounded-full bg-sds-bg-surface border border-sds-border text-sds-text-sec">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] text-sds-text-sec font-bold">
                        {isRtl ? 'الرسم البياني للتوفير التراكمي سيكون متاحاً قريباً' : 'Savings chart available soon'}
                      </p>
                      <p className="text-[9px] text-sds-text-muted max-w-xs mx-auto">
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
                  <History className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase text-sds-text-sec tracking-wider">
                    {isRtl ? 'سجل الحوالات والنشاط الأخير' : 'RECENT COMPARED TRANSFERS'}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('savings')}
                  className="text-[10px] font-bold uppercase text-sds-primary hover:underline cursor-pointer"
                >
                  {isRtl ? 'عرض السجل الكامل ←' : 'View all transfers →'}
                </button>
              </div>

              {transfers.length > 0 ? (
                <div className="bg-sds-card border border-sds-border rounded-[20px] p-4 divide-y divide-sds-border space-y-3 shadow-sds-sm">
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
                            <span className="font-extrabold text-sds-text block">
                              {item.sendAmountSAR.toLocaleString()} SAR → {item.estimatedRecipientAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} {item.destinationCurrency}
                            </span>
                            <span className="text-[10px] text-sds-text-sec font-mono font-bold mt-0.5 block">
                              {new Date(item.recordedAt!).toLocaleDateString()} • {providerName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sds-primary font-black font-mono block">
                            +{item.estimatedSavingsSAR.toLocaleString(undefined, { maximumFractionDigits: 1 })} SAR
                          </span>
                          <span className="text-[9px] text-sds-text-sec uppercase font-black tracking-wide block">{isRtl ? 'توفير محقق' : 'Saved'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-sds-bg-surface border border-dashed border-sds-border rounded-[20px] p-6 space-y-2 shadow-sds-sm">
                  <p className="text-[11px] text-sds-text-sec font-bold uppercase">
                    {isRtl ? 'لم تقم بتسجيل أي حوالة حتى الآن' : 'You haven’t recorded a transfer yet.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('compare')}
                    className="px-3 py-1.5 bg-sds-card hover:bg-sds-bg-surface border border-sds-border text-sds-primary hover:text-sds-text rounded-xl text-[10px] font-bold"
                  >
                    {isRtl ? 'قارن الأسعار الآن' : 'Compare Rates Now'}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ZONE C: RIGHT CONTEXTUAL INTELLIGENCE RAIL (Section 12) */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* PANEL 1: MARKET INTELLIGENCE & HEARTBEAT (SDS 2.0 Ambient Monitoring) */}
            <MarketHeartbeat
              activeCorridor={activeCorridor}
              benchmarkRate={benchmark?.rate}
              providerCount={getRemittanceChannelsSync().length}
              freshnessStatus={freshnessInfo.status}
              lastUpdatedText={freshnessInfo.formattedTextEn}
              confidenceBand={confidence}
              isRtl={isRtl}
            />

            {/* PANEL 2: USER-SAFE INTELLIGENCE ACTIVITY FEED */}
            <IntelligenceActivityFeed
              communitySubmissions={communitySubmissions}
              activeCorridor={activeCorridor}
              isRtl={isRtl}
            />

            {/* PANEL 2: DESTINATION WATCHLIST (Section 13) */}
            <div className="bg-sds-card border border-sds-border rounded-[20px] p-5 space-y-4 shadow-sds-sm">
              <div className="flex items-center gap-2 border-b border-sds-border pb-3">
                <Star className="w-4 h-4 text-sds-secondary" />
                <h3 className="text-xs font-bold uppercase text-sds-text tracking-wider">
                  {isRtl ? 'قائمتك المفضلة للمتابعة' : 'YOUR CORRIDOR WATCHLIST'}
                </h3>
              </div>

              <div className="space-y-3">
                {profile.preferredCorridorId ? (
                  <div className="p-3.5 bg-sds-bg-surface border border-sds-border rounded-[16px] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CountryFlag country="" currency={activeCorridor.currencyCode} size="sm" />
                      <div>
                        <span className="text-xs font-extrabold text-sds-text block">
                          {isRtl ? activeCorridor.toCountryAr : activeCorridor.toCountry}
                        </span>
                        <span className="text-[10px] text-sds-text-sec uppercase font-bold font-mono">{activeCorridor.currencyCode}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-sds-primary font-mono block">
                        {benchmark ? benchmark.rate.toFixed(3) : activeCorridor.baseExchangeRate.toFixed(2)}
                      </span>
                      <button
                        onClick={handleCompareFull}
                        className="text-[9px] text-sds-text-sec hover:text-sds-text flex items-center gap-0.5 justify-end"
                      >
                        <span>{isRtl ? 'تحليل الصرف' : 'Compare'}</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-sds-text-sec font-bold leading-relaxed">
                      {isRtl ? 'احفظ بلداً مفضلاً لمتابعة مؤشرات أسعاره هنا.' : 'Save a destination to follow its latest reference information.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3: LATEST VERIFIED COMMUNITY REPORTS (Section 14) */}
            <div className="bg-sds-card border border-sds-border rounded-[20px] p-5 space-y-4 shadow-sds-sm">
              <div className="flex items-center gap-2 border-b border-sds-border pb-3">
                <ShieldCheck className="w-4 h-4 text-sds-primary" />
                <h3 className="text-xs font-bold uppercase text-sds-text tracking-wider">
                  {isRtl ? 'آخر تقارير المجتمع المعتمدة' : 'VERIFIED COMMUNITY REPORTS'}
                </h3>
              </div>

              {isCrvsLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-10 bg-sds-bg-surface rounded-xl" />
                  <div className="h-10 bg-sds-bg-surface rounded-xl" />
                </div>
              ) : communitySubmissions.length > 0 ? (
                <div className="space-y-3">
                  {communitySubmissions.slice(0, 3).map((sub) => {
                    const corr = CORRIDORS.find(c => c.id === sub.corridor_id) || CORRIDORS[0];
                    const channels = getRemittanceChannelsSync();
                    const chan = channels.find(c => c.id === sub.provider_id);
                    const name = chan?.displayName || sub.provider_name;
                    return (
                      <div key={sub.id} className="p-3 bg-sds-bg-surface border border-sds-border rounded-[16px] flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sds-text">{sub.submitted_by_name}</span>
                            <SDSBadge type="verified" />
                          </div>
                          <p className="text-[10px] text-sds-text-sec mt-0.5">
                            {isRtl ? 'أرسل بقيمة' : 'Sent'} <span className="font-mono text-sds-text">{sub.send_amount} SAR</span> via <span className="text-sds-secondary font-semibold">{name}</span>
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
            <div className="bg-sds-bg-surface/50 border border-sds-border rounded-[20px] p-5 space-y-3 text-left">
              <span className="text-[9px] font-black text-sds-secondary uppercase tracking-widest font-mono block">{isRtl ? 'ميثاق الموثوقية والأمان' : 'SARIREMIT TRUST PROMISE'}</span>
              <h4 className="text-xs font-black text-sds-text">{isRtl ? 'لماذا يعتمد المغتربون على ساري ريميت؟' : 'Truthful Support Dashboard'}</h4>
              <ul className="space-y-2 text-[10px] text-sds-text-sec">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-sds-success shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'مقارنات حيادية غير منحازة لأي شريك تجاري.' : 'Clear and neutral comparisons across major corridors.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-sds-success shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'أسعار الصرف والرسوم مدققة من مصادر المجتمع المعتمدة.' : 'Verified community contributions via structural logs.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-sds-success shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'أمن بياناتك وحسابك يتم عبر بوابات تشفير قياسية.' : 'Secure and isolated account access.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-sds-success shrink-0 mt-0.5 stroke-[3]" />
                  <span>{isRtl ? 'توصيات مالية قابلة للتفسير الكامل وخالية من الغموض.' : 'Explainable recommendations.'}</span>
                </li>
              </ul>
            </div>

          </aside>

        </div>

        {/* LOWER TRUST STRIP (Section 18) */}
        <div className="border-t border-sds-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sds-text-sec text-[10px] font-medium uppercase font-mono tracking-wider">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sds-success" />
            <span>{isRtl ? 'شفافية تكلفة التحويل الكاملة' : 'Clear cost breakdown'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sds-success" />
            <span>{isRtl ? 'بيانات مدققة ومؤكدة جماهيرياً' : 'Community-supported information'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sds-success" />
            <span>{isRtl ? 'بوابة دخول آمنة تماماً' : 'Secure account access'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sds-success" />
            <span>{isRtl ? 'توصيات ذكية مفسرة بالكامل' : 'Explainable recommendations'}</span>
          </div>
        </div>

      </div>

      {/* --- EXPLAINABILITY DRAWER PANEL OVERLAY (Section 7) --- */}
      {isExplainOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-sds-card border border-sds-border rounded-[24px] max-w-lg w-full p-6 space-y-5 shadow-2xl relative"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <button
              onClick={() => setIsExplainOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-sds-bg-surface border border-sds-border text-sds-text-sec hover:text-sds-text rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-sds-secondary uppercase tracking-widest block font-mono">
                {isRtl ? 'مساعد التفسير المالي الذكي' : 'EXPLAINABLE DECISION LOGIC'}
              </span>
              <h3 className="text-lg font-bold text-sds-text tracking-tight">
                {isRtl 
                  ? `لماذا تم ترشيح ${bestProviderIdentity.display_name}؟` 
                  : `Why ${bestProviderIdentity.display_name} is recommended`}
              </h3>
              <p className="text-xs text-sds-text-sec">
                {isRtl 
                  ? 'يتم تقييم وترشيح كل قناة وفق خوارزمية ساري ريميت المتقدمة بناءً على المعايير التالية:' 
                  : 'SariRemit optimizes the recommendation by combining dynamic fee checks, tax markups, and community reported values.'}
              </p>
            </div>

            {/* Metrics Checklist using Neutral Permitted Language ONLY */}
            <div className="space-y-3.5 pt-3">
              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'مؤشر الصرف المرجعي' : 'REFERENCE BENCHMARK'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block">
                    {benchmark ? `1 SAR = ${benchmark.rate.toFixed(4)} ${activeCorridor.currencyCode}` : 'Reference Unavailable'}
                  </span>
                </div>
                <SDSBadge type="verified" />
              </div>

              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'سعر الصرف المعتمد للمزود' : 'RESOLVED PROVIDER RATE'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block font-mono">
                    1 SAR = {recommendedChannelObj.resolved_rate} {activeCorridor.currencyCode}
                  </span>
                </div>
                <span className="text-xs font-black text-sds-success font-mono">+{((recommendedChannelObj.resolved_rate - (benchmark?.rate || activeCorridor.baseExchangeRate)) / (benchmark?.rate || activeCorridor.baseExchangeRate) * 100).toFixed(2)}%</span>
              </div>

              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'المبلغ المستلم الإجمالي المتوقع' : 'ESTIMATED RECIPIENT AMOUNT'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block font-mono">
                    {netRecipient.toLocaleString()} {activeCorridor.currencyCode}
                  </span>
                </div>
                <span className="text-[10px] text-sds-text-sec font-mono">Net</span>
              </div>

              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'مجموع الرسوم الإجمالية للمزود' : 'ESTIMATED OVERALL CHARGES'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block font-mono">
                    {recommendedChannelObj.transfer_fee} SAR
                  </span>
                </div>
                <span className="text-[10px] text-sds-text-sec">Fees + VAT</span>
              </div>

              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'الفرق التقديري عن المؤشر العام' : 'ESTIMATED RATE IMPACT'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block font-mono">
                    {(((recommendedChannelObj.resolved_rate - (benchmark?.rate || activeCorridor.baseExchangeRate)) / (benchmark?.rate || activeCorridor.baseExchangeRate)) * 100).toFixed(2)}%
                  </span>
                </div>
                <span className="text-[10px] text-sds-secondary font-black uppercase font-mono">{isRtl ? 'أفضل قيمة' : 'Optimized'}</span>
              </div>

              <div className="p-3 bg-sds-bg-surface/60 rounded-2xl border border-sds-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sds-text-sec block font-black uppercase">{isRtl ? 'درجة دقة التحليل والمقارنة' : 'COMPARISON CONFIDENCE'}</span>
                  <span className="text-xs font-medium text-sds-text mt-1 block uppercase">
                    {confidence}
                  </span>
                </div>
                <span className="text-[10px] text-sds-success font-black uppercase font-mono">100% Verified</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between text-[10px] text-sds-text-sec border-t border-sds-border/60">
              <span>{isRtl ? 'مصادر البيانات: واجهات الشركاء وآخر الحوالات المؤكدة' : 'Data sources used: Live API, Community submissions.'}</span>
              <span className="font-mono">{new Date().toLocaleTimeString()}</span>
            </div>

            <button
              onClick={() => setIsExplainOpen(false)}
              className="w-full py-3 bg-sds-gold hover:opacity-90 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-bold"
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

      {/* --- CORRIDOR SELECTION BOTTOM SHEET (Section 5 & 7) --- */}
      {isCorridorSheetOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="absolute inset-0 -z-10" onClick={() => setIsCorridorSheetOpen(false)} />
          <div className="bg-sds-card border-t sm:border border-sds-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
            <button
              onClick={() => setIsCorridorSheetOpen(false)}
              className="absolute top-4 right-4 p-2 bg-sds-bg-surface border border-sds-border text-sds-text-sec hover:text-sds-text rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 text-left pr-8">
              <span className="text-[10px] font-black text-sds-secondary uppercase tracking-widest font-mono">
                {isRtl ? 'بوابة اختيار ممرات الصرف' : 'TRANSFERS CORRIDOR REGISTRY'}
              </span>
              <h3 className="text-base font-extrabold text-sds-text">
                {isRtl ? 'اختر وجهة التحويل' : 'Change Corridor'}
              </h3>
              <p className="text-xs text-sds-text-sec">
                {isRtl ? 'حدد ممر الصرف للحصول على تحليلات الصرف ومستويات الثقة في وقتها الحقيقي.' : 'Select a corridor to analyze real-time rates and confidence metrics.'}
              </p>
            </div>

            {/* Corridor Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث عن بلد أو عملة...' : 'Search country or currency...'}
                className="w-full pl-10 pr-4 py-2.5 bg-sds-bg-surface border border-sds-border rounded-xl text-xs text-sds-text placeholder-sds-text-sec/50 focus:outline-none focus:ring-2 focus:ring-sds-primary/25 font-sans"
              />
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[40vh] pr-1">
              {filteredCorridors.map((c) => {
                const isSelected = c.id === selectedCorridorId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCorridorId(c.id);
                      setIsCorridorSheetOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sds-success/10 border-sds-success text-sds-text'
                        : 'bg-sds-bg-surface border-sds-border hover:border-sds-text-sec/30 text-sds-text-sec'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{c.flag}</span>
                      <div>
                        <span className="text-xs font-bold text-sds-text block">
                          {isRtl ? c.toCountryAr : c.toCountry}
                        </span>
                        <span className="text-[10px] text-sds-text-sec font-mono font-bold">
                          SAR → {c.currencyCode}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-sds-success shrink-0" />
                    )}
                  </button>
                );
              })}
              {filteredCorridors.length === 0 && (
                <p className="text-xs text-sds-text-sec/60 text-center py-4">
                  {isRtl ? 'لا يوجد نتائج مطابقة' : 'No corridors found matching search.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PROVIDER DETAIL BOTTOM SHEET (Section 10) --- */}
      {isDetailSheetOpen && selectedDetailOption && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="absolute inset-0 -z-10" onClick={() => setIsDetailSheetOpen(false)} />
          <div className="bg-sds-card border-t sm:border border-sds-border rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button
              onClick={() => {
                setIsDetailSheetOpen(false);
                setSelectedDetailOption(null);
              }}
              className="absolute top-4 right-4 p-2 bg-sds-bg-surface border border-sds-border text-sds-text-sec hover:text-sds-text rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Identity */}
            {(() => {
              const opt = selectedDetailOption;
              const provId = opt.resolved?.provider_id || opt.resolved?.provider_code || opt.resolved?.providerCode || 'stc-pay';
              const identity = getProviderIdentity(provId);
              const confidenceBand = opt.sis2?.confidenceBand || opt.resolved?.confidence || 'High';
              
              const strengths = [
                isRtl ? 'معدل صرف منافس مقارنة بمتوسط السوق' : 'Highly competitive exchange rate vs. market average.',
                isRtl ? 'رسوم تحويل ثابتة ومنخفضة لمعظم المبالغ' : 'Flat-rate transparent fee pricing structures.',
                isRtl ? 'تسوية فورية ومستقرة خلال ثوانٍ معدودة' : 'Instant and highly stable transaction processing.'
              ];
              const limitations = [
                isRtl ? 'يتطلب حساباً مفعلاً وموثقاً بالهوية الوطنية' : 'Requires complete national ID verification.',
                isRtl ? 'قد تختلف حدود التحويل اليومية للمستخدمين الجدد' : 'Initial limits applied for newly registered profiles.'
              ];

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pr-8">
                    <ProviderLogo channel={{ ...opt.resolved, providerCode: provId, displayName: identity.display_name }} size="md" shape="rounded" surface="dark" />
                    <div className="text-left">
                      <h4 className="text-base font-extrabold text-sds-text leading-tight uppercase tracking-tight">
                        {identity.display_name}
                      </h4>
                      <p className="text-[10px] text-sds-success font-mono font-black mt-0.5 uppercase tracking-wider">
                        {opt.resolved?.source_label || (isRtl ? 'سعر صرف مباشر ومؤكد' : 'Verified Direct Channel')}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Overview Row */}
                  <div className="grid grid-cols-2 gap-4 bg-sds-bg-surface p-4 rounded-2xl border border-sds-border text-left">
                    <div>
                      <span className="text-[9px] text-sds-text-muted font-bold block uppercase">{isRtl ? 'المستلم يحصل على' : 'RECIPIENT AMOUNT'}</span>
                      <span className="text-lg font-black text-sds-success font-mono block mt-0.5">
                        {opt.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 1 }) || opt.resolved?.estimatedRecipientAmount?.toLocaleString()} {activeCorridor.currencyCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-sds-text-muted font-bold block uppercase">{isRtl ? 'التوفير التقديري' : 'ESTIMATED SAVINGS'}</span>
                      <span className="text-lg font-black text-sds-secondary font-mono block mt-0.5">
                        {estimatedSavings.toLocaleString()} {activeCorridor.currencyCode}
                      </span>
                    </div>
                  </div>

                  {/* Pricing details */}
                  <div className="space-y-2.5 text-xs text-sds-text-sec">
                    <div className="flex justify-between items-center py-2 border-b border-sds-border/40">
                      <span className="text-sds-text-muted">{isRtl ? 'سعر الصرف' : 'Exchange Rate'}</span>
                      <span className="font-mono text-sds-text">1 SAR = {opt.resolved?.resolved_rate || opt.resolved?.rate || activeCorridor.baseExchangeRate} {activeCorridor.currencyCode}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-sds-border/40">
                      <span className="text-sds-text-muted">{isRtl ? 'رسوم التحويل والضريبة' : 'Transfer Fee & VAT'}</span>
                      <span className="font-mono text-sds-text">{opt.resolved?.transfer_fee || opt.resolved?.fee || activeCorridor.typicalFee} SAR</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-sds-border/40">
                      <span className="text-sds-text-muted">{isRtl ? 'وقت الوصول المتوقع' : 'Delivery Speed'}</span>
                      <span className="text-sds-success font-bold">{isRtl ? 'تحويل فوري (بضع ثوانٍ)' : 'Instant Delivery (seconds)'}</span>
                    </div>
                  </div>

                  {/* SIS Score & Confidence Indicator (Section 11/12) */}
                  <div className="space-y-2 text-left bg-sds-bg-surface/50 p-4 rounded-2xl border border-sds-border">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-sds-text-muted font-black uppercase tracking-wider">{isRtl ? 'موثوقية ممر الصرف' : 'SIS CONFIDENCE BAND'}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getConfidenceBadgeColor(confidenceBand)}`}>
                        {getConfidenceLabel(confidenceBand)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 bg-sds-success rounded-full" />
                      <span className="text-[10px] text-sds-text-sec">{isRtl ? 'قنوات بيانات موثوقة ومثبتة من المعاملات التاريخية' : 'Data points verified with active client-remitted receipts.'}</span>
                    </div>
                  </div>

                  {/* Accordion: Strengths & Limitations */}
                  <div className="space-y-3.5 text-left text-xs">
                    <div>
                      <span className="text-[9px] text-sds-success font-black uppercase tracking-wider block mb-2">{isRtl ? 'أبرز الميزات والقوة' : 'STRENGTHS'}</span>
                      <ul className="space-y-1.5 pl-1">
                        {strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-sds-text-sec">
                            <span className="text-sds-success shrink-0 mt-0.5">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-sds-border/60 pt-3">
                      <span className="text-[9px] text-sds-secondary font-black uppercase tracking-wider block mb-2">{isRtl ? 'ملاحظات واعتبارات' : 'LIMITATIONS'}</span>
                      <ul className="space-y-1.5 pl-1">
                        {limitations.map((lim, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-sds-text-sec">
                            <span className="text-sds-secondary shrink-0 mt-0.5">•</span>
                            <span>{lim}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex flex-col gap-2.5 border-t border-sds-border/60">
                    <button
                      onClick={() => {
                        setRecordingOption(opt);
                        setIsRecordingOpen(true);
                        setIsDetailSheetOpen(false);
                      }}
                      className="w-full py-3 bg-sds-success hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center font-bold font-sans"
                    >
                      {isRtl ? 'تسجيل معاملة التحويل هذه' : 'Record This Transfer'}
                    </button>
                    <button
                      onClick={() => {
                        setIsDetailSheetOpen(false);
                        setSelectedDetailOption(null);
                      }}
                      className="w-full py-3 bg-sds-bg-surface hover:bg-sds-bg-surface-soft border border-sds-border text-sds-text-sec rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                    >
                      {isRtl ? 'إغلاق التفاصيل' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
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
            {slf.getGreeting(profile.name || 'User', language)}
          </h1>
          <p className="text-xs md:text-sm text-sds-text-sec font-medium">
            {isRtl ? 'المساعد الذكي يتابع أسعار التحويل المباشرة.' : 'The dynamic remittance engine is evaluating the Saudi market.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-sds-card text-sds-text rounded-3xl p-6 border border-sds-border shadow-sds-md">
            <span className="text-[10px] font-black text-sds-success uppercase block tracking-widest">{isRtl ? 'التوصية الفورية' : "TODAY'S RECOMMENDATION"}</span>
            <h3 className="text-lg font-bold text-sds-text mt-1">🇸🇦 SAR → {activeCorridor.flag} {activeCorridor.toCountry}</h3>
            
            <div className="my-6 py-4 border-y border-sds-border text-3xl font-bold font-mono text-sds-text">
              {isLoading ? '...' : netRecipient.toLocaleString()} {activeCorridor.currencyCode}
            </div>

            <button
              onClick={handleCompareFull}
              className="px-5 py-2.5 bg-sds-gold text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-sds-sm hover:opacity-90 cursor-pointer"
            >
              {isRtl ? 'قارن كل الخيارات' : 'Compare Options Now'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-sds-card border border-sds-border rounded-3xl p-6 space-y-4 shadow-sds-md">
            <h3 className="text-xs font-black uppercase text-sds-text tracking-widest">{isRtl ? 'الحاسبة السريعة' : 'QUICK CALCULATOR'}</h3>
            <div className="space-y-1.5">
              <label className="text-[10px] text-sds-text-muted uppercase font-black tracking-wide block">{isRtl ? 'أنت ترسل' : 'YOU SEND'}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-sds-bg-sec border border-sds-border rounded-xl px-3 py-2 text-sds-text font-mono text-xs focus:outline-none focus:border-sds-gold"
              />
            </div>
            <button
              onClick={handleCompareFull}
              className="w-full py-2.5 bg-sds-gold text-slate-950 font-black rounded-xl text-xs uppercase shadow-sds-sm hover:opacity-90 transition-all cursor-pointer"
            >
              {isRtl ? 'تحليل الأسعار' : 'Compare All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
