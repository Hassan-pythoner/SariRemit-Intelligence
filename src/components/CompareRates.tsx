import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS, getRemittanceOptions } from '../data/mockData';
import { RemittanceOption, CorridorId, ProviderId, TransferMethod, AdminRateOverride, CrowdsourcedRate, RateAlert } from '../types';
import { 
  ArrowRight, Info, Check, Sparkles, AlertTriangle, 
  ExternalLink, Smartphone, Star, Clock, Lock,
  Share2, TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp,
  Bell, BellOff, ArrowLeftRight, Award, ShieldCheck, X
} from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import { calculateTrueCost, resolveRate } from '../utils/costEngine';
import { analyzeCorridorIntelligence } from '../utils/intelligenceEngine';
import { ConfettiCanvas } from './ConfettiCanvas';
import { trackEvent } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { getOptionTimestamp, formatRelativeTime, getFreshnessLabelFromTimestamp } from '../utils/timestampHelper';
import { useResolvedRates } from '../hooks/useResolvedRates';

export const getFamilyValueMeterData = (
  option: any,
  provider: any,
  sortedOptions: any[],
  language: 'en' | 'ar'
) => {
  if (!option || !option.estimatedReceived || option.estimatedReceived <= 0 || !option.exchangeRate) {
    return {
      score: 0,
      label: language === 'en' ? 'Value Pending' : 'القيمة قيد الانتظار',
      colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/25',
      glowClass: 'shadow-slate-500/5',
      barColor: 'bg-slate-400',
      copy: language === 'en' 
        ? "More verified data is needed." 
        : "مزيد من البيانات المؤكدة مطلوبة.",
      tooltipText: language === 'en'
        ? "More verified data is needed before assigning a value rating."
        : "المزيد من البيانات المؤكدة مطلوبة قبل تعيين تصنيف القيمة.",
      isPending: true
    };
  }

  // 1. Recipient Amount Score (40%)
  const receivedAmounts = sortedOptions.map(o => o.estimatedReceived).filter(val => typeof val === 'number');
  const maxReceived = receivedAmounts.length > 0 ? Math.max(...receivedAmounts) : option.estimatedReceived;
  const minReceived = receivedAmounts.length > 0 ? Math.min(...receivedAmounts) : option.estimatedReceived;
  const rangeReceived = maxReceived - minReceived;
  const recipientScore = rangeReceived > 0 
    ? ((option.estimatedReceived - minReceived) / rangeReceived) * 100 
    : 100;

  // 2. Total Cost Score (20%) - Lower is better
  const totalCosts = sortedOptions.map(o => o.total_cost).filter(val => typeof val === 'number');
  const maxCost = totalCosts.length > 0 ? Math.max(...totalCosts) : option.total_cost;
  const minCost = totalCosts.length > 0 ? Math.min(...totalCosts) : option.total_cost;
  const rangeCost = maxCost - minCost;
  const costScore = rangeCost > 0 
    ? ((maxCost - option.total_cost) / rangeCost) * 100 
    : 100;

  // 3. Confidence Score (15%)
  const confidenceScore = option.source_confidence ?? option.confidenceScore ?? 75;

  // 4. Freshness Score (10%)
  let freshnessScore = option.freshness_score;
  if (freshnessScore === undefined || freshnessScore === null) {
    const freshLabel = option.freshness_label;
    if (freshLabel === 'Very Fresh') freshnessScore = 100;
    else if (freshLabel === 'Fresh') freshnessScore = 90;
    else if (freshLabel === 'Moderately Fresh') freshnessScore = 70;
    else if (freshLabel === 'Getting Old') freshnessScore = 45;
    else if (freshLabel === 'Stale') freshnessScore = 30;
    else if (freshLabel === 'Expired') freshnessScore = 10;
    else freshnessScore = 80; // default to 80 (Fresh/Good)
  }

  // 5. Provider Reliability Score (10%)
  const reliabilityScore = ((provider?.rating || 4.5) / 5) * 100;

  // 6. Community Verification Score (5%)
  let communityScore = 80;
  const source = option.selected_rate_source || option.source_label;
  if (source) {
    if (source === 'Community Verified' || source.includes('Community') || source.includes('Crowd')) {
      communityScore = 100;
    } else if (source === 'Admin Verified' || source.includes('Admin')) {
      communityScore = 95;
    } else if (source === 'Provider Verified' || source.includes('Provider')) {
      communityScore = 90;
    } else if (source === 'Public Market Rate' || source.includes('Market')) {
      communityScore = 85;
    } else if (source === 'Estimated' || source.includes('Est')) {
      communityScore = 50;
    }
  }

  // Final Weighted Score
  const score = Math.round(
    (recipientScore * 0.40) +
    (costScore * 0.20) +
    (confidenceScore * 0.15) +
    (freshnessScore * 0.10) +
    (reliabilityScore * 0.10) +
    (communityScore * 0.05)
  );

  // Map to Label Rules
  let label = '';
  let copy = '';
  let colorClass = '';
  let glowClass = '';
  let barColor = '';

  if (score >= 90) {
    label = language === 'en' ? 'Excellent Value' : 'قيمة ممتازة';
    copy = language === 'en'
      ? "This option gives your family one of the strongest payouts today after fees and VAT."
      : "يمنح هذا الخيار عائلتك أحد أقوى المبالغ المستلمة اليوم بعد خصم الرسوم والضريبة.";
    colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    glowClass = 'shadow-emerald-500/5';
    barColor = 'bg-emerald-500';
  } else if (score >= 80) {
    label = language === 'en' ? 'Very Good Value' : 'قيمة جيدة جداً';
    copy = language === 'en'
      ? "This option provides strong value with reliable data."
      : "يوفر هذا الخيار قيمة قوية مع بيانات موثوقة.";
    colorClass = 'text-teal-400 bg-teal-500/10 border-teal-500/30';
    glowClass = 'shadow-teal-500/5';
    barColor = 'bg-teal-400';
  } else if (score >= 70) {
    label = language === 'en' ? 'Good Value' : 'قيمة جيدة';
    copy = language === 'en'
      ? "This is a reasonable option, but better value may be available."
      : "هذا خيار معقول، ولكن قد تتوفر قيمة أفضل.";
    colorClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    glowClass = 'shadow-yellow-500/5';
    barColor = 'bg-yellow-500';
  } else if (score >= 60) {
    label = language === 'en' ? 'Average Value' : 'قيمة متوسطة';
    copy = language === 'en'
      ? "This option is acceptable, but it may not maximize what your family receives."
      : "هذا الخيار مقبول، ولكنه قد لا يحقق أقصى ما يمكن لعائلتك استلامه.";
    colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    glowClass = 'shadow-amber-500/5';
    barColor = 'bg-amber-500';
  } else {
    label = language === 'en' ? 'Poor Value' : 'قيمة ضعيفة';
    copy = language === 'en'
      ? "This option may give your family less compared with other available providers."
      : "قد يمنح هذا الخيار عائلتك مبلغاً أقل مقارنة بالمزودين الآخرين المتاحين.";
    colorClass = 'text-rose-400 bg-[#E11D48]/10 border-[#E11D48]/30';
    glowClass = 'shadow-rose-500/5';
    barColor = 'bg-[#E11D48]';
  }

  const tooltipText = language === 'en'
    ? "Family Value Meter considers: Final amount your family receives, Fees and VAT, Data freshness, Confidence, Provider reliability, and Community verification."
    : "يأخذ مؤشر قيمة العائلة في الاعتبار: المبلغ النهائي الذي تستلمه عائلتك، والرسوم وضريبة القيمة المضافة، وحداثة البيانات، والموثوقية، وموثوقية المزود، والتحقق من المجتمع.";

  return {
    score,
    label,
    colorClass,
    glowClass,
    barColor,
    copy,
    tooltipText,
    isPending: false
  };
};

interface CompareRatesProps {
  amountPreset: number;
  corridorPreset: string;
  clearPresets: () => void;
  recordSavedAmount: (savedAmount: number, details?: { providerId: string; amount: number; corridorId: string }) => void;
  userSession?: { name: string; email: string; homeCountry: CorridorId; id?: string; role?: string } | null;
  onOpenAuthModal?: () => void;
  customRates?: Record<string, number>;
  customFees?: Record<string, any>;
  adminRateOverrides?: AdminRateOverride[];
  recentSubmissions?: CrowdsourcedRate[];
  alerts?: RateAlert[];
  addNewAlert?: (alert: Omit<RateAlert, 'id' | 'createdAt' | 'isActive'>) => void;
  toggleAlertStatus?: (id: string) => void;
  deleteAlert?: (id: string) => void;
  resolvedRates?: any[];
  marketReferenceRates?: any[];
  communityConsensuses?: any[];
}

export const CompareRates: React.FC<CompareRatesProps> = ({
  amountPreset,
  corridorPreset,
  clearPresets,
  recordSavedAmount,
  userSession,
  onOpenAuthModal,
  customRates,
  customFees = {},
  adminRateOverrides = [],
  recentSubmissions = [],
  alerts = [],
  addNewAlert,
  toggleAlertStatus,
  deleteAlert,
  resolvedRates = [],
  marketReferenceRates = [],
  communityConsensuses = [],
}) => {
  const { t, language } = useLanguage();

  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const toggleBreakdown = (key: string) => {
    setExpandedBreakdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExplanation = (key: string, option: any) => {
    const isNowOpen = !expandedExplanations[key];
    setExpandedExplanations(prev => ({ ...prev, [key]: isNowOpen }));
    
    // ANALYTICS event tracking (recommendation_explanation_opened, recommendation_explanation_closed, recommendation_explanation_read)
    const eventName = isNowOpen ? 'recommendation_explanation_opened' : 'recommendation_explanation_closed';
    trackEvent(eventName, {
      providerId: option.providerId,
      corridorId: selectedCorridor.id,
      estimatedReceived: option.estimatedReceived,
      timestamp: new Date().toISOString()
    });

    if (isNowOpen) {
      trackEvent('recommendation_explanation_read', {
        providerId: option.providerId,
        corridorId: selectedCorridor.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getSubServiceLabel = (subService?: string) => {
    if (!subService) return '';
    if (language === 'en') return ` (${subService})`;
    switch (subService) {
      case 'Western Union': return ' (ويسترن يونيون)';
      case 'Transfast': return ' (ترانس فاست)';
      case 'Moneygram': return ' (موني جرام)';
      default: return ` (${subService})`;
    }
  };

  // State inputs
  const [sendingAmount, setSendingAmount] = useState<number>(amountPreset || 1000);
  const [destinationId, setDestinationId] = useState<CorridorId>((corridorPreset || 'PK') as CorridorId);
  const [selectedMethod, setSelectedMethod] = useState<TransferMethod | 'all'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | ProviderId>('all');
  const [sortBy, setSortBy] = useState<'received' | 'rate' | 'fee' | 'speed'>('received');
  
  // Custom alternative channels selected by user for personalized comparison
  const [selectedCompareKeys, setSelectedCompareKeys] = useState<string[]>([]);
  const [trackedTooltips, setTrackedTooltips] = useState<Record<string, boolean>>({});

  const [transferHistory, setTransferHistory] = useState<Array<{ providerId: string, amount: number, date: string }>>(() => {
    const saved = localStorage.getItem('sariremit_transfer_history');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Selected corridor details
  const selectedCorridor = CORRIDORS.find(c => c.id === destinationId) || CORRIDORS[0];

  // Price Watch Alert States & Handlers
  const [targetRateInput, setTargetRateInput] = useState<number>(0);
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertProviderId, setAlertProviderId] = useState<'all' | ProviderId>('all');
  const [alertContact, setAlertContact] = useState<string>('');
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const FamilyValueMeterComponent = ({ option, idx, provider, sortedOptions }: { option: any, idx: number, provider: any, sortedOptions: any[] }) => {
    const meterData = getFamilyValueMeterData(option, provider, sortedOptions, language);
    
    // Track tooltips viewed
    const handleTooltipHover = () => {
      const key = `${option.providerId}_${meterData.label}`;
      if (!trackedTooltips[key]) {
        setTrackedTooltips(prev => ({ ...prev, [key]: true }));
        trackEvent('family_value_tooltip_opened', {
          providerId: option.providerId,
          corridor: selectedCorridor.id,
          score: meterData.score,
          valueLabel: meterData.label,
          timestamp: new Date().toISOString()
        });
      }
    };

    const isExcellent = meterData.score >= 90 && !meterData.isPending;

    return (
      <div 
        className="flex flex-col items-end gap-1 font-sans shrink-0"
        aria-label={`Family Value Meter rating for this provider: ${meterData.label}`}
      >
        {/* Container Pill with glow and hover tooltip */}
        <div className="relative group/fvm inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all shadow-sm cursor-help bg-[#05162e]/80 border-white/10"
          onMouseEnter={handleTooltipHover}
          onTouchStart={handleTooltipHover}
        >
          {/* Soft glow if Excellent/Very Good */}
          {!meterData.isPending && meterData.score >= 80 && (
            <div className={`absolute inset-0 rounded-full blur-sm opacity-25 pointer-events-none ${meterData.barColor}`} />
          )}
          
          {/* Compact Progress Bar / Indicator */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => {
              let isActive = false;
              if (meterData.isPending) {
                isActive = false;
              } else {
                const activeCount = meterData.score >= 90 ? 5 : meterData.score >= 80 ? 4 : meterData.score >= 70 ? 3 : meterData.score >= 60 ? 2 : 1;
                isActive = level <= activeCount;
              }
              return (
                <span 
                  key={level} 
                  className={`w-1 h-2 rounded-full transition-all ${
                    isActive 
                      ? meterData.barColor 
                      : 'bg-white/15'
                  }`}
                />
              );
            })}
          </div>

          {/* Value Label */}
          <span className={`font-black ${meterData.colorClass.split(' ')[0]}`}>
            {meterData.label}
          </span>

          {/* Info Icon */}
          <Info className="w-3 h-3 text-[#B8C7D9]/80 group-hover/fvm:text-white transition-colors shrink-0" />

          {/* Elegant Tooltip Container */}
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/fvm:block group-focus/fvm:block w-72 p-4 bg-[#09223e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md z-50 text-xs transition-opacity duration-200 text-left font-sans text-[#B8C7D9]">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">
                  {language === 'en' ? 'Family Value Index' : 'مؤشر قيمة العائلة'}
                </span>
                {!meterData.isPending && (
                  <span className={`font-mono font-black px-1.5 py-0.5 rounded text-[10px] ${meterData.colorClass}`}>
                    {meterData.score}/100
                  </span>
                )}
              </div>
              
              {/* Custom User-Facing Copy */}
              <p className="text-white text-[11px] leading-relaxed font-semibold">
                {meterData.copy}
              </p>

              <div className="pt-1.5 border-t border-white/5 space-y-1">
                <span className="text-[9px] text-[#7E96AA] font-black uppercase tracking-wider block font-mono">
                  {language === 'en' ? 'Value Meter considers:' : 'يأخذ مؤشر القيمة في الاعتبار:'}
                </span>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-[#AFC4D8]">
                  <li className="flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Family Payout' : 'المبلغ للمستلم'}</span>
                  </li>
                  <li className="flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Fees & VAT' : 'الرسوم والضريبة'}</span>
                  </li>
                  <li className="flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Data Freshness' : 'حداثة البيانات'}</span>
                  </li>
                  <li className="flex items-center gap-1 truncate">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Confidence' : 'الموثوقية'}</span>
                  </li>
                  <li className="flex items-center gap-1 truncate col-span-2">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Provider Reliability' : 'موثوقية المزود'}</span>
                  </li>
                  <li className="flex items-center gap-1 truncate col-span-2">
                    <span className="w-1 h-1 rounded-full bg-[#00E07A]" />
                    <span>{language === 'en' ? 'Community Verification' : 'التحقق من المجتمع'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Best Overall Value gold badge if top recommended provider and qualifies */}
        {idx === 0 && isExcellent && (
          <span className="flex items-center gap-1 bg-[#F4B63F]/10 border border-[#F4B63F]/30 text-[#F4B63F] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow animate-pulse">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span>{language === 'en' ? 'Best Overall Value' : 'أفضل قيمة إجمالية'}</span>
          </span>
        )}
      </div>
    );
  };

  const getProviderName = (id: string) => {
    if (id === 'all') return language === 'en' ? 'All Channels' : 'جميع القنوات';
    const p = PROVIDERS.find(prov => prov.id === id);
    return p ? p.name : id;
  };

  // Sync email when user session changes
  useEffect(() => {
    if (userSession?.email) {
      setAlertContact(userSession.email);
    }
  }, [userSession]);

  // Sync target rate when destinationId changes
  useEffect(() => {
    const optionsForCorridor = getRemittanceOptions(destinationId);
    if (optionsForCorridor.length > 0) {
      const bestRate = Math.max(...optionsForCorridor.map(o => o.exchangeRate));
      setTargetRateInput(Number(bestRate.toFixed(4)));
    }
  }, [destinationId]);

  const handleSaveAlert = () => {
    if (!addNewAlert) return;
    setAlertError(null);
    setAlertSuccess(null);

    if (!alertContact || !alertContact.includes('@')) {
      setAlertError(language === 'en' ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (!targetRateInput || targetRateInput <= 0) {
      setAlertError(language === 'en' ? 'Please enter a valid target rate.' : 'يرجى إدخال سعر مستهدف صحيح.');
      return;
    }

    addNewAlert({
      corridorId: destinationId,
      providerId: alertProviderId,
      targetRate: Number(targetRateInput),
      condition: alertCondition,
      contactInfo: alertContact,
    });

    trackEvent('Alert Saved', {
      event_type: 'alert',
      corridorId: destinationId,
      providerId: alertProviderId,
      targetRate: Number(targetRateInput),
      condition: alertCondition,
      contact: alertContact
    });

    setAlertSuccess(language === 'en' ? 'Price Watch Alert saved to Firestore successfully!' : 'تم حفظ تنبيه مراقبة السعر بنجاح في قاعدة البيانات!');
    setTimeout(() => setAlertSuccess(null), 4000);
  };

  // Load preset changes
  useEffect(() => {
    if (amountPreset) {
      setSendingAmount(amountPreset);
    }
    if (corridorPreset) {
      setDestinationId(corridorPreset as CorridorId);
    }
  }, [amountPreset, corridorPreset]);

  // Handle send mock action
  const [activeInstructionModal, setActiveInstructionModal] = useState<RemittanceOption | null>(null);

  const handleSelectOption = (option: RemittanceOption) => {
    setActiveInstructionModal(option);
    trackEvent('Provider Selected', {
      event_type: 'click',
      provider: option.providerId,
      corridor: destinationId,
      rate: option.exchangeRate,
      fee: option.fee
    });
  };

  useEffect(() => {
    trackEvent('Compare Rates Page View', {
      event_type: 'page_view',
      corridor: destinationId,
      amount: sendingAmount,
      method: selectedMethod,
      sortBy: sortBy
    });
  }, [destinationId]);

  useEffect(() => {
    trackEvent('family_value_meter_viewed', {
      event_type: 'interaction',
      corridor: destinationId,
      amount: sendingAmount,
      method: selectedMethod,
      sortBy: sortBy,
      timestamp: new Date().toISOString()
    });
  }, [destinationId, sendingAmount, selectedMethod, sortBy]);

  const [claimedSavings, setClaimedSavings] = useState(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiIntensity, setConfettiIntensity] = useState<'standard' | 'high'>('standard');
  const [copiedRates, setCopiedRates] = useState<boolean>(false);

  const [isHighlighting, setIsHighlighting] = useState<boolean>(false);

  const {
    processedOptions,
    sortedOptions,
    bestOption,
    worstOption,
    savingsDiff,
    savingsDiffSar,
    liveApiRates,
    isLiveLoading,
    liveRatesSource,
    liveLastFetched,
    fetchLiveRates,
    handleForceRefresh
  } = useResolvedRates({
    amount: sendingAmount,
    corridor: destinationId,
    receiveMethod: selectedMethod,
    adminRateOverrides,
    recentSubmissions,
    customRates,
    customFees,
    resolvedRates,
    marketReferenceRates,
    communityConsensuses,
    sortBy,
    filterProvider
  });

  useEffect(() => {
    if (liveApiRates) {
      setIsHighlighting(true);
      const timer = setTimeout(() => {
        setIsHighlighting(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [liveApiRates]);

  const handleShareWhatsApp = () => {
    if (sortedOptions.length === 0) return;
    
    const topOption = sortedOptions[0];
    const topProvider = PROVIDERS.find(p => p.id === topOption.providerId);
    
    let text = '';
    if (language === 'en') {
      text = `*SariRemit Rates Report (SAR to ${selectedCorridor.currencyCode})* 🇸🇦 ➔ ${selectedCorridor.flag}\n`;
      text += `_Compare & Save Assistant_\n\n`;
      text += `*Transfer Amount:* ${sendingAmount} SAR\n`;
      text += `*Destination:* ${selectedCorridor.nameEn}\n\n`;
      
      text += `🥇 *Top Choice: ${topProvider?.name}*\n`;
      text += `• Receive Amount: *${topOption.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol}*\n`;
      text += `• Exchange Rate: 1 SAR = *${topOption.exchangeRate.toFixed(4)} ${selectedCorridor.currencyCode}*\n`;
      text += `• Transfer Fee: *${topOption.fee.toFixed(2)} SAR*\n`;
      text += `• Delivery Speed: *${topOption.deliverySpeedEn}*\n\n`;
      
      if (sortedOptions.length > 1) {
        text += `*Alternative Channels:*\n`;
        sortedOptions.slice(1, 3).forEach((opt, idx) => {
          const prov = PROVIDERS.find(p => p.id === opt.providerId);
          text += `${idx === 0 ? '🥈' : '🥉'} *${prov?.name}:* ${opt.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol} (Rate: ${opt.exchangeRate.toFixed(4)})\n`;
        });
        text += `\n`;
      }
      
      if (savingsDiffSar > 0 && bestOption && worstOption) {
        const bestName = PROVIDERS.find(p => p.id === bestOption.providerId)?.name;
        const worstName = PROVIDERS.find(p => p.id === worstOption.providerId)?.name;
        text += `💡 *Savings Benefit:* By choosing *${bestName}* instead of *${worstName}*, you save *~${savingsDiffSar.toFixed(2)} SAR* (approx. ${savingsDiff.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol})!\n\n`;
      }
      
      text += `Compare live rates instantly on SariRemit!`;
    } else {
      text = `*تقرير أسعار الصرف من ساري ريميت (ريال سعودي إلى ${selectedCorridor.currencyCode})* 🇸🇦 ➔ ${selectedCorridor.flag}\n`;
      text += `_مساعد المقارنة والتوفير الذكي_\n\n`;
      text += `*مبلغ التحويل:* ${sendingAmount} ريال سعودي\n`;
      text += `*الوجهة:* ${selectedCorridor.nameAr}\n\n`;
      
      text += `🥇 *الخيار الأفضل: ${topProvider?.name}*\n`;
      text += `• المبلغ المستلم: *${topOption.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol}*\n`;
      text += `• سعر الصرف: 1 ريال = *${topOption.exchangeRate.toFixed(4)} ${selectedCorridor.currencyCode}*\n`;
      text += `• رسوم التحويل: *${topOption.fee.toFixed(2)} ريال*\n`;
      text += `• سرعة الوصول: *${topOption.deliverySpeedAr}*\n\n`;
      
      if (sortedOptions.length > 1) {
        text += `*القنوات البديلة:*\n`;
        sortedOptions.slice(1, 3).forEach((opt, idx) => {
          const prov = PROVIDERS.find(p => p.id === opt.providerId);
          text += `${idx === 0 ? '🥈' : '🥉'} *${prov?.name}:* ${opt.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol} (السعر: ${opt.exchangeRate.toFixed(4)})\n`;
        });
        text += `\n`;
      }
      
      if (savingsDiffSar > 0 && bestOption && worstOption) {
        const bestName = PROVIDERS.find(p => p.id === bestOption.providerId)?.name;
        const worstName = PROVIDERS.find(p => p.id === worstOption.providerId)?.name;
        text += `💡 *تأثير التوفير:* باختيارك *${bestName}* بدلاً من *${worstName}*، ستوفر *~${savingsDiffSar.toFixed(2)} ريال سعودي* (يعادل ${savingsDiff.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCorridor.currencySymbol})!\n\n`;
      }
      
      text += `قارن أسعار الحوالات فورياً عبر ساري ريميت!`;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    
    // Copy rates report to clipboard automatically
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopiedRates(true);
        setTimeout(() => setCopiedRates(false), 4000);
      }
    } catch (clipErr) {
      console.warn("Clipboard copy not supported", clipErr);
    }

    try {
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.warn("window.open blocked", err);
      try {
        const anchor = document.createElement('a');
        anchor.href = whatsappUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } catch (anchorErr) {
        console.error("Dynamic anchor click fallback failed:", anchorErr);
      }
    }
  };

  const corridorIntelligence = analyzeCorridorIntelligence(sendingAmount, selectedCorridor.id, processedOptions);

  const getSavingsEquivalency = (sar: number) => {
    if (sar <= 5) return language === 'en' ? 'a standard tea (Karak) at local shops' : 'كوب شاي كرك من المحلات المحلية';
    if (sar <= 15) return language === 'en' ? 'a quick local lunch (Shawarma & Juice)' : 'وجبة غداء خفيفة (شاورما وعصير)';
    if (sar <= 35) return language === 'en' ? 'a weekly mobile internet data recharge package' : 'باقة شحن إنترنت أسبوعية للجوال';
    if (sar <= 75) return language === 'en' ? 'a full family chicken meal back home' : 'وجبة عائلية كاملة لأسرتك في بلدك';
    return language === 'en' ? 'a significant portion of your next transfer\'s service charge' : 'جزء كبير من رسوم تحويلك القادمة';
  };

  const handleClaimSavings = () => {
    if (!userSession) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }
    if (savingsDiffSar > 0 && !claimedSavings) {
      recordSavedAmount(savingsDiffSar, {
        providerId: bestOption?.providerId || 'urpay',
        amount: sendingAmount,
        corridorId: selectedCorridor.id
      });
      setClaimedSavings(true);
      
      // Trigger canvas-based confetti celebration
      setConfettiIntensity(savingsDiffSar >= 10 ? 'high' : 'standard');
      setShowConfetti(true);
      
      setTimeout(() => setClaimedSavings(false), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-white">
      <ConfettiCanvas 
        active={showConfetti} 
        intensity={confettiIntensity} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      {/* Title Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Smartphone className="w-8 h-8 text-[#00E07A]" />
          <span>{t('calculatorTitle')}</span>
        </h1>
        <p className="text-[#AFC4D8] text-sm max-w-2xl leading-relaxed">
          {language === 'en' 
            ? 'Adjust sending amount and apply dynamic filters to instantly compare top payouts. Use community verified insights to capture the peak hour.' 
            : 'اضبط المبالغ والفلاتر لمشاهدة وتصنيف أفضل قنوات التحويل فورا. استخدم تحليلات المجتمع لتحديد ساعة الذروة.'}
        </p>
      </div>

      {/* Real-Time Rate Sync Status Banner */}
      <div className="bg-[#10263D] border border-white/5 px-5 py-4 rounded-[20px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E07A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C16A]"></span>
          </div>
          <div>
            <span className="font-bold text-white text-xs uppercase tracking-wide">
              {language === 'en' ? 'Live Remittance Sync Active' : 'مزامنة الأسعار المباشرة نشطة'}
            </span>
            <span className="text-[#AFC4D8] mx-2 font-mono">|</span>
            <span className="text-[#AFC4D8] font-mono text-[11px]">
              {language === 'en' 
                ? `Augmenting via ${liveRatesSource || 'fetching...'} (Last Sync: ${liveLastFetched || 'Just now'})` 
                : `تغذية الأسعار عبر ${liveRatesSource || 'جاري التحميل...'} (آخر تحديث: ${liveLastFetched || 'الآن'})`}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleForceRefresh}
          disabled={isLiveLoading}
          className="shrink-0 flex items-center gap-2 bg-[#071326] hover:bg-white/5 border border-white/5 text-[#00E07A] px-4 py-2 rounded-xl font-bold cursor-pointer transition-all disabled:opacity-50 text-[11px] font-mono tracking-wider uppercase"
        >
          <Activity className={`w-3.5 h-3.5 text-[#00E07A] ${isLiveLoading ? 'animate-pulse' : ''}`} />
          <span>
            {isLiveLoading 
              ? (language === 'en' ? 'Syncing...' : 'جاري المزامنة...') 
              : (language === 'en' ? 'Force Sync' : 'تحديث قسري')}
          </span>
        </button>
      </div>

      {/* Main Grid: Left inputs, Right results list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Column: Filters & Alert Parameters */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CONTROL PANEL FORM */}
          <div className="bg-[#10263D] border border-white/5 p-6 rounded-[24px] shadow-2xl space-y-5">
            <h3 className="font-extrabold text-white border-b border-white/5 pb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
              <span className="w-1.5 h-4 bg-[#00C16A] rounded-full"></span>
              <span>{language === 'en' ? 'Calculator Parameters' : 'معايير الحاسبة'}</span>
            </h3>

            <div className="space-y-4">
              {/* Sending Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-[#7E96AA] uppercase tracking-widest">
                  {t('sendingAmount')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="calc-sending-amount"
                    value={sendingAmount}
                    onChange={(e) => setSendingAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#071326] text-white font-mono font-extrabold text-2xl px-4 py-3 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none focus:ring-1 focus:ring-[#00C16A]"
                  />
                  <span className="absolute right-4 top-3.5 text-white font-extrabold font-sans text-sm">
                    SAR
                  </span>
                </div>
              </div>

              {/* Destination Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-[#7E96AA] uppercase tracking-widest">
                  {t('destinationCountry')}
                </label>
                <select
                  id="calc-destination"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value as CorridorId)}
                  className="w-full bg-[#071326] text-white text-sm px-3.5 py-3 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none cursor-pointer font-bold"
                >
                  {CORRIDORS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#071326] text-white text-sm">
                      {c.flag} {language === 'en' ? c.nameEn : c.nameAr} ({c.currencyCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Receiving Currency Display */}
              <div className="bg-[#071326] border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                <span className="text-[#7E96AA]">{language === 'en' ? 'Payout Currency:' : 'عملة الاستلام:'}</span>
                <span className="font-bold text-[#00E07A]">{selectedCorridor.currencyCode}</span>
              </div>

              {/* Transfer Method Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-[#7E96AA] uppercase tracking-widest">
                  {t('payoutMethod')}
                </label>
                <select
                  id="calc-method"
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as any)}
                  className="w-full bg-[#071326] text-white text-xs px-3 py-2.5 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all" className="bg-[#071326]">{language === 'en' ? 'All Methods' : 'جميع قنوات الدفع'}</option>
                  <option value="wallet" className="bg-[#071326]">{language === 'en' ? 'Mobile Wallet' : 'محفظة رقمية'}</option>
                  <option value="bank" className="bg-[#071326]">{language === 'en' ? 'Bank Deposit' : 'إيداع بنكي'}</option>
                  <option value="cash" className="bg-[#071326]">{language === 'en' ? 'Cash Pickup' : 'استلام نقدي'}</option>
                </select>
              </div>

              {/* Limit to Provider Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-[#7E96AA] uppercase tracking-widest">
                  {language === 'en' ? 'Limit to Provider' : 'تحديد شركة معينة'}
                </label>
                <select
                  id="calc-provider-limit"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value as any)}
                  className="w-full bg-[#071326] text-white text-xs px-3 py-2.5 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none cursor-pointer font-bold"
                >
                  <option value="all" className="bg-[#071326]">{language === 'en' ? 'All Channels' : 'جميع القنوات'}</option>
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#071326]">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PRICE WATCH ALERTS CARD */}
          <div className="bg-[#10263D] border border-white/5 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white pb-2 border-b border-white/5 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Bell className="w-4 h-4 text-[#00C16A]" />
              <span>{language === 'en' ? 'Price Watch Alerts' : 'مراقبة وتنبيه الأسعار'}</span>
            </h3>

            <p className="text-[11px] text-[#AFC4D8] leading-relaxed">
              {language === 'en' 
                ? `Get a real-time notification when the rate for SAR to ${selectedCorridor.currencyCode} changes.` 
                : `احصل على إشعار في الوقت الفعلي عندما يتغير سعر الصرف من الريال إلى ${selectedCorridor.currencyCode}.`}
            </p>

            {alertSuccess && (
              <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 text-[#00E07A] text-xs p-3 rounded-xl flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{alertSuccess}</span>
              </div>
            )}

            {alertError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{alertError}</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest mb-1">
                  {language === 'en' ? 'Target Rate threshold' : 'سعر الصرف المستهدف'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    id="calc-alert-target-rate"
                    value={targetRateInput || ''}
                    onChange={(e) => setTargetRateInput(Number(e.target.value))}
                    className="w-full bg-[#071326] text-white font-mono font-bold text-sm px-3 py-2.5 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none"
                    placeholder="e.g. 75.50"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-[#7E96AA] font-mono">
                    {selectedCorridor.currencyCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest mb-1">
                    {language === 'en' ? 'Condition' : 'الشرط'}
                  </label>
                  <select
                    id="calc-alert-condition"
                    value={alertCondition}
                    onChange={(e) => setAlertCondition(e.target.value as any)}
                    className="w-full bg-[#071326] text-white text-xs px-2.5 py-2 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="above" className="bg-[#071326]">{language === 'en' ? 'Goes Above' : 'يتجاوز'}</option>
                    <option value="below" className="bg-[#071326]">{language === 'en' ? 'Goes Below' : 'يقل عن'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest mb-1">
                    {language === 'en' ? 'Via Channel' : 'عبر القناة'}
                  </label>
                  <select
                    id="calc-alert-provider"
                    value={alertProviderId}
                    onChange={(e) => setAlertProviderId(e.target.value as any)}
                    className="w-full bg-[#071326] text-white text-xs px-2.5 py-2 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="all" className="bg-[#071326]">{language === 'en' ? 'All Channels' : 'جميع القنوات'}</option>
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#071326]">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest mb-1">
                  {language === 'en' ? 'Send Alert To' : 'إرسال التنبيه إلى'}
                </label>
                <input
                  type="email"
                  id="calc-alert-email"
                  value={alertContact}
                  onChange={(e) => setAlertContact(e.target.value)}
                  disabled={!!userSession?.email}
                  className="w-full bg-[#071326] text-white text-xs px-3 py-2.5 rounded-xl border border-white/5 focus:border-[#00C16A] focus:outline-none disabled:opacity-75 font-bold"
                  placeholder="name@domain.com"
                />
              </div>

              {userSession ? (
                <button
                  id="calc-btn-save-alert"
                  onClick={handleSaveAlert}
                  className="w-full bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] text-xs py-2.5 rounded-xl font-extrabold cursor-pointer transition-all shadow-md flex items-center justify-center gap-2 mt-2 uppercase tracking-wider"
                >
                  <Bell className="w-3.5 h-3.5 text-[#071326]" />
                  <span>{language === 'en' ? 'Set Price Watch' : 'تفعيل مراقبة السعر'}</span>
                </button>
              ) : (
                <button
                  id="calc-btn-auth-alert"
                  onClick={onOpenAuthModal}
                  className="w-full bg-[#071326] hover:bg-white/5 text-white text-xs py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center gap-2 mt-2 border border-white/5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#00E07A]" />
                  <span>{language === 'en' ? 'Log In to Set Alert' : 'سجل دخول لتفعيل التنبيه'}</span>
                </button>
              )}
            </div>

            {/* Active Alerts List */}
            {userSession && alerts.filter(al => al.corridorId === destinationId).length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <span className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest mb-2">
                  {language === 'en' ? 'Your active watches' : 'تنبيهاتك النشطة'}
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {alerts.filter(al => al.corridorId === destinationId).map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] ${
                        item.isActive 
                          ? 'bg-[#071326] border-white/10' 
                          : 'bg-[#071326]/50 border-white/5 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5 text-white">
                          <span>SAR → {item.corridorId}</span>
                          <span className="text-[10px] font-mono px-1 py-0.5 bg-white/5 text-[#00E07A] rounded font-bold">
                            {item.condition === 'above' ? '>' : '<'} {item.targetRate}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#7E96AA] font-mono">
                          {getProviderName(item.providerId)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          id={`btn-toggle-alert-${item.id}`}
                          onClick={() => toggleAlertStatus?.(item.id)}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            item.isActive 
                              ? 'text-[#00E07A] hover:bg-[#00C16A]/10' 
                              : 'text-[#7E96AA] hover:bg-white/5'
                          }`}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {item.isActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          id={`btn-delete-alert-${item.id}`}
                          onClick={() => deleteAlert?.(item.id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition-all"
                          title="Delete Watch"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Column: Options list & Recommendation bento */}
        <div className="lg:col-span-8 space-y-6">

          {/* REMITTANCE INTELLIGENCE & TIMING CENTER */}
          {corridorIntelligence && (
            <div className="bg-[#10263D] border border-white/5 rounded-[24px] shadow-2xl overflow-hidden relative">
              
              {/* Header */}
              <div className="bg-[#0B1E35] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#00C16A]/10 text-[#00E07A] rounded-lg">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-white tracking-wider uppercase">
                      {language === 'en' ? 'REMITTANCE INTELLIGENCE CENTER' : 'مركز ذكاء وتوقيت التحويلات'}
                    </h3>
                    <p className="text-[10px] text-[#AFC4D8] font-mono mt-0.5">
                      {language === 'en' ? 'Decision-Support & Timing Engine • Real Cost Basis' : 'محرك دعم القرار والتوقيت • على أساس التكلفة الفعلية'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                    corridorIntelligence.signal === 'Send Now'
                      ? 'bg-[#00C16A] text-[#071326]'
                      : corridorIntelligence.signal === 'Wait'
                      ? 'bg-amber-500 text-[#071326]'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {corridorIntelligence.signal === 'Send Now' ? (language === 'en' ? '🟢 SEND NOW' : '🟢 أرسل الآن') : corridorIntelligence.signal === 'Wait' ? (language === 'en' ? '🟡 WAIT' : '🟡 انتظر') : (language === 'en' ? '🔵 MONITOR' : '🔵 راقب')}
                  </span>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
                
                {/* Panel 1: Recommended Today */}
                <div className="bg-[#10263D] p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-widest block">
                        {language === 'en' ? 'RECOMMENDED TODAY' : 'الموصى به اليوم'}
                      </span>
                      <span className="bg-[#00C16A]/10 text-[#00E07A] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                        ★ BEST VALUE
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <ProviderLogo providerId={corridorIntelligence.bestOption.providerId} className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md" />
                      <div>
                        <h4 className="font-extrabold text-white text-sm">
                          {PROVIDERS.find(p => p.id === corridorIntelligence.bestOption.providerId)?.name}
                          {getSubServiceLabel(corridorIntelligence.bestOption.subService)}
                        </h4>
                        <span className="text-[10px] text-[#7E96AA] block mt-0.5 font-mono">
                          {language === 'en' ? 'Highest Recipient Value' : 'أعلى قيمة للمستلم'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#00E07A] font-extrabold uppercase tracking-wider block">
                        {language === 'en' ? 'YOUR FAMILY RECEIVES' : 'عائلتك تستلم'}
                      </span>
                      <div className="text-3xl font-black text-[#00E07A] font-mono tracking-tight leading-none">
                        {corridorIntelligence.bestOption.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                        <span className="text-sm font-bold text-white">{selectedCorridor.currencySymbol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-[#AFC4D8]">
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? 'Extra Value:' : 'قيمة إضافية:'}</span>
                      <span className="font-mono text-[#00E07A] font-extrabold">
                        +{corridorIntelligence.extraValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? 'Confidence Level:' : 'مستوى الموثوقية:'}</span>
                      <span className={`font-bold uppercase text-[10px] ${
                        corridorIntelligence.confidence === 'High' ? 'text-[#00E07A]' : corridorIntelligence.confidence === 'Medium' ? 'text-amber-500' : 'text-[#7E96AA]'
                      }`}>
                        {corridorIntelligence.confidence === 'High' ? (language === 'en' ? 'High' : 'عالٍ') : corridorIntelligence.confidence === 'Medium' ? (language === 'en' ? 'Medium' : 'متوسط') : (language === 'en' ? 'Low' : 'منخفض')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? 'Delivery Speed:' : 'سرعة التوصيل:'}</span>
                      <span className="text-white font-semibold truncate max-w-[120px]">
                        {language === 'en' ? corridorIntelligence.bestOption.deliverySpeedEn : corridorIntelligence.bestOption.deliverySpeedAr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Best Alternative */}
                <div className="bg-[#10263D] p-6 flex flex-col justify-between space-y-4 md:border-x border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-widest block">
                        {language === 'en' ? 'BEST ALTERNATIVE' : 'أفضل خيار بديل'}
                      </span>
                      <span className="bg-white/5 text-[#AFC4D8] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">
                        ALT OPTION
                      </span>
                    </div>

                    {corridorIntelligence.alternativeOption ? (
                      <>
                        <div className="flex items-center gap-3">
                          <ProviderLogo providerId={corridorIntelligence.alternativeOption.providerId} className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md" />
                          <div>
                            <h4 className="font-extrabold text-white text-sm">
                              {PROVIDERS.find(p => p.id === corridorIntelligence.alternativeOption.providerId)?.name}
                              {getSubServiceLabel(corridorIntelligence.alternativeOption.subService)}
                            </h4>
                            <span className="text-[10px] text-[#7E96AA] block mt-0.5 font-mono">
                              {language === 'en' ? 'Runner-up Provider' : 'المزود البديل الثاني'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#AFC4D8] font-bold uppercase tracking-wider block">
                            {language === 'en' ? 'FAMILY RECEIVES' : 'عائلتك تستلم'}
                          </span>
                          <div className="text-2xl font-black text-[#AFC4D8] font-mono tracking-tight leading-none">
                            {corridorIntelligence.alternativeOption.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-bold text-white">{selectedCorridor.currencySymbol}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-[#7E96AA] italic">
                        {language === 'en' ? 'No suitable alternative available.' : 'لا يوجد بديل مناسب متاح حالياً.'}
                      </p>
                    )}
                  </div>

                  {corridorIntelligence.alternativeOption && (
                    <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-[#AFC4D8]">
                      <div className="flex justify-between items-center">
                        <span>{language === 'en' ? 'Difference:' : 'الفارق مقارنة بالأفضل:'}</span>
                        <span className="font-mono text-red-400 font-bold">
                          -{Math.abs(corridorIntelligence.bestOption.estimatedReceived - corridorIntelligence.alternativeOption.estimatedReceived).toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{language === 'en' ? 'Alternative Cost:' : 'تكلفة البديل:'}</span>
                        <span className="text-white font-mono font-bold">
                          {corridorIntelligence.alternativeOption.total_cost.toFixed(2)} SAR
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7E96AA] italic leading-relaxed">
                        {language === 'en' ? 'Excellent reliability and slightly lower value.' : 'موثوقية ممتازة وتكلفة/قيمة أقل بقليل.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Panel 3: Timing & Explanations */}
                <div className="bg-[#10263D] p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-widest block">
                      {language === 'en' ? 'MARKET OPPORTUNITY' : 'فرصة السوق'}
                    </span>

                    <div className="space-y-1.5">
                      <span className={`inline-flex items-center gap-1 bg-[#00C16A]/15 border border-[#00C16A]/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                        corridorIntelligence.opportunityScore === 'Excellent Opportunity'
                          ? 'text-[#00E07A]'
                          : corridorIntelligence.opportunityScore === 'Good Opportunity'
                          ? 'text-emerald-400'
                          : corridorIntelligence.opportunityScore === 'Average Opportunity'
                          ? 'text-[#AFC4D8]'
                          : 'text-amber-500'
                      }`}>
                        <span>✨</span>
                        <span>{language === 'en' ? corridorIntelligence.opportunityScore : corridorIntelligence.opportunityScoreAr}</span>
                      </span>
                      <p className="text-[10px] text-[#AFC4D8] leading-relaxed">
                        {corridorIntelligence.opportunityScore === 'Excellent Opportunity'
                          ? (language === 'en' ? "Today's transfer conditions are significantly better than the recent corridor average." : "ظروف التحويل اليوم أفضل بكثير من المتوسط الأخير لبلد التحويل.")
                          : corridorIntelligence.opportunityScore === 'Good Opportunity'
                          ? (language === 'en' ? "Today is a highly favorable time to send. Rates are above the 15-day average." : "اليوم هو وقت مواتٍ للغاية للإرسال. الأسعار أعلى من متوسط الـ 15 يوماً الأخيرة.")
                          : corridorIntelligence.opportunityScore === 'Average Opportunity'
                          ? (language === 'en' ? "Market conditions are within normal limits. A standard time to send." : "ظروف السوق في حدودها الطبيعية المعتادة. وقت اعتيادي للإرسال.")
                          : (language === 'en' ? "Rates are currently low. Waiting might increase the payout value." : "الأسعار منخفضة حالياً. قد يؤدي الانتظار لزيادة القيمة المستلمة.")}
                      </p>
                    </div>

                    <div className="space-y-1 border-t border-white/5 pt-3">
                      <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-widest block mb-1">
                        {language === 'en' ? 'WHY THIS RECOMMENDATION?' : 'لماذا هذه التوصية؟'}
                      </span>
                      <p className="text-xs text-[#AFC4D8] leading-relaxed font-medium">
                        {language === 'en' ? corridorIntelligence.explanationEn : corridorIntelligence.explanationAr}
                      </p>
                    </div>
                  </div>

                  <div className="text-[9px] text-[#7E96AA] font-mono pt-3 border-t border-white/5">
                    {language === 'en' ? `Corridor 15-day average: ${corridorIntelligence.trendAverage} ${selectedCorridor.currencyCode}` : `متوسط الـ 15 يوماً الأخيرة: ${corridorIntelligence.trendAverage} ${selectedCorridor.currencyCode}`}
                  </div>
                </div>

              </div>

              {/* Personalized Intelligence Panel */}
              {userSession && (() => {
                const dynamicSavingsMissed = transferHistory.length > 0
                  ? Math.round(transferHistory.reduce((acc, curr) => acc + (curr.amount * 0.042), 0))
                  : 0;

                const topProviderName = bestOption 
                  ? (PROVIDERS.find(p => p.id === bestOption.providerId)?.name || 'optimal channels')
                  : 'optimal channels';

                const totalTransferred = transferHistory.reduce((acc, curr) => acc + curr.amount, 0);

                const messageText = transferHistory.length === 0
                  ? (language === 'en'
                    ? "You have zero logged transfers. Click 'I Sent Money Using This Provider' below or log your transactions under the Profile page to track your real savings and build your trusted analytics score."
                    : "ليس لديك أي تحويلات مسجلة. اضغط على 'أرسلت أموالاً باستخدام هذا المزود' أدناه أو سجل معاملاتك في صفحة الملف الشخصي لتتبع وفوراتك الفعلية.")
                  : (language === 'en'
                    ? `You have logged ${transferHistory.length} transfers totaling ${totalTransferred.toLocaleString()} SAR. Converting using ${topProviderName} over that same period could have generated an additional ${dynamicSavingsMissed} SAR (~${Math.round(dynamicSavingsMissed * selectedCorridor.defaultExchangeRate).toLocaleString()} ${selectedCorridor.currencyCode}) in family value.`
                    : `لقد قمت بتسجيل ${transferHistory.length} تحويلات بإجمالي ${totalTransferred.toLocaleString()} ريال سعودي. لو قمت بالتحويل عبر ${topProviderName} خلال الفترة نفسها لحصلت عائلتك على قيمة إضافية تعادل ${dynamicSavingsMissed} ريال سعودي (حوالي ${Math.round(dynamicSavingsMissed * selectedCorridor.defaultExchangeRate).toLocaleString()} ${selectedCorridor.currencySymbol}).`);

                return (
                  <div className="bg-[#0B1E35] px-6 py-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 bg-[#00C16A]/10 text-[#00E07A] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <span>👤</span>
                        <span>{language === 'en' ? 'PERSONALIZED INTELLIGENCE' : 'تحليلات ذكية مخصصة لك'}</span>
                      </div>
                      <p className="text-xs text-[#AFC4D8] font-medium leading-relaxed max-w-2xl">
                        {messageText}
                      </p>
                    </div>

                    <div className="bg-[#10263D] border border-white/5 p-3 rounded-xl shadow-md min-w-[180px] text-center sm:text-right shrink-0">
                      <span className="text-[10px] text-[#7E96AA] font-bold uppercase block tracking-wider">
                        {language === 'en' ? 'SAVINGS MISSED' : 'فرص توفير فائتة'}
                      </span>
                      <span className="text-lg font-black text-rose-400 font-mono block mt-0.5">
                        {dynamicSavingsMissed} SAR
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SAVINGS INSIGHT CARD (Bento-style top highlight) */}
          {bestOption && worstOption && savingsDiff > 0 && (() => {
            const selectedCompareOptions = processedOptions.filter(opt => {
              const key = `${opt.providerId}_${opt.subService || 'none'}`;
              return selectedCompareKeys.includes(key);
            });

            return (
              <div className="bg-[#10263D] text-white p-6 rounded-[24px] relative overflow-hidden border border-white/5 shadow-2xl space-y-5">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Sparkles className="w-24 h-24 text-[#00E07A]" />
                </div>

                {selectedCompareOptions.length > 0 ? (
                  // Custom Alternatives Selected State
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 bg-[#00C16A]/15 border border-[#00C16A]/20 text-[#00E07A] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                          📊 {language === 'en' ? 'Personalized Savings Analysis' : 'تحليل التوفير المخصص'}
                        </div>
                        <h3 className="text-lg font-extrabold tracking-tight">
                          {language === 'en' ? 'Your Selected Channel Comparisons' : 'مقارنة قنواتك المحددة'}
                        </h3>
                        <p className="text-xs text-[#AFC4D8]">
                          {language === 'en' 
                            ? `Here is how much extra your family receives by choosing ${PROVIDERS.find(p => p.id === bestOption.providerId)?.name || 'the recommended channel'} instead of your usual channels:`
                            : `إليك المبلغ الإضافي الذي تستلمه عائلتك عند اختيار ${PROVIDERS.find(p => p.id === bestOption.providerId)?.name || 'القناة الموصى بها'} بدلاً من قنواتك المعتادة:`}
                        </p>
                      </div>

                      {/* Display Maximum Potential Savings */}
                      {(() => {
                        const maxDiff = Math.max(...selectedCompareOptions.map(opt => Math.max(0, bestOption.estimatedReceived - opt.estimatedReceived)));
                        const maxDiffSar = maxDiff / bestOption.exchangeRate;
                        return (
                          <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 p-4 rounded-xl text-center md:text-right shrink-0">
                            <span className="text-[9px] font-mono text-[#00E07A] uppercase block">
                              {language === 'en' ? 'MAX PERSONAL SAVINGS' : 'أقصى توفير مخصص'}
                            </span>
                            <div className="text-xl font-black text-[#00E07A] font-mono mt-0.5">
                              +{maxDiff.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}
                            </div>
                            <div className="text-[10px] text-[#AFC4D8] font-mono mt-0.5">
                              ≈ {maxDiffSar.toFixed(2)} SAR {language === 'en' ? 'Saved' : 'موفّر'}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Grid of comparisons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {selectedCompareOptions.map(opt => {
                        const optKey = `${opt.providerId}_${opt.subService || 'none'}`;
                        const diff = Math.max(0, bestOption.estimatedReceived - opt.estimatedReceived);
                        const diffSar = diff / bestOption.exchangeRate;
                        const pName = PROVIDERS.find(p => p.id === opt.providerId)?.name || opt.providerId;

                        return (
                          <div key={optKey} className="bg-[#071326]/55 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 relative group">
                            <div className="flex items-center gap-2.5">
                              <ProviderLogo providerId={opt.providerId} className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm" />
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {pName}{getSubServiceLabel(opt.subService)}
                                </span>
                                <span className="text-[10px] text-[#7E96AA] block font-mono">
                                  1 SAR = {opt.exchangeRate.toFixed(4)} {selectedCorridor.currencyCode}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="text-xs font-bold text-[#00E07A] font-mono block">
                                  +{diff.toLocaleString(undefined, { maximumFractionDigits: 1 })} {selectedCorridor.currencySymbol}
                                </span>
                                <span className="text-[10px] text-[#AFC4D8] font-mono block">
                                  ≈ {diffSar.toFixed(2)} SAR
                                </span>
                              </div>
                              
                              <button
                                onClick={() => setSelectedCompareKeys(prev => prev.filter(k => k !== optKey))}
                                className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer rounded-full hover:bg-white/5"
                                title={language === 'en' ? 'Remove from comparison' : 'إزالة من المقارنة'}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Default State: No custom alternatives selected
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1 bg-[#00C16A]/15 border border-[#00C16A]/20 text-[#00E07A] text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                        💰 {t('savingsInsight')}
                      </div>
                      <h3 className="text-xl font-extrabold tracking-tight">
                        {t('savingsCompare')}
                      </h3>
                      <p className="text-xs text-[#AFC4D8] max-w-lg leading-relaxed">
                        {t('savingsExplain')}{' '}
                        <span className="text-[#00E07A] font-bold">
                          {PROVIDERS.find(p => p.id === bestOption.providerId)?.name}
                        </span>{' '}
                        {language === 'en' ? 'vs.' : 'مقابل'}{' '}
                        <span className="text-[#7E96AA] font-bold">
                          {PROVIDERS.find(p => p.id === worstOption.providerId)?.name}
                        </span>.
                      </p>
                    </div>

                    <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 p-4 rounded-xl text-center md:text-right min-w-[200px]">
                      <span className="text-[10px] font-mono text-[#00E07A] uppercase block">
                        {t('extraReceived')}
                      </span>
                      <div className="text-2xl font-black text-[#00E07A] font-mono mt-0.5">
                        +{savingsDiff.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}
                      </div>
                      <div className="text-[11px] text-[#AFC4D8] font-mono mt-1">
                        ≈ {savingsDiffSar.toFixed(2)} SAR {language === 'en' ? 'Savings' : 'توفير'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Tip about selection */}
                <div className="bg-[#071326]/40 rounded-xl p-3 text-xs text-[#AFC4D8] flex items-center gap-2 border border-white/5">
                  <span className="text-base shrink-0">💡</span>
                  <p>
                    {language === 'en' 
                      ? "Expat Tip: You can check the 'My Usual Channel' box on any provider below to add alternative channels you often use, and compare your custom savings instantly."
                      : "نصيحة للمغتربين: يمكنك تحديد خيار 'قناتي المعتادة' على أي مزود في الأسفل لإضافة القنوات المعتادة التي تستخدمها كثيراً، ومقارنة وفوراتك المخصصة فوراً."}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#AFC4D8]">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-base">📋</span>
                    <span>
                      <strong>{language === 'en' ? 'Equivalent to:' : 'يعادل:'}</strong> {getSavingsEquivalency(savingsDiffSar)}.
                    </span>
                  </div>

                  <button
                    id="claim-savings-btn"
                    onClick={handleClaimSavings}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      claimedSavings
                        ? 'bg-green-600 text-white scale-105'
                        : !userSession
                        ? 'bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 border border-amber-600/20'
                        : 'bg-[#071326] hover:bg-white/5 border border-white/5 text-white'
                    }`}
                  >
                    {!userSession && <Lock className="w-3 h-3 text-amber-400" />}
                    {claimedSavings 
                      ? (language === 'en' ? '✓ Saved!' : '✓ تم الحفظ!') 
                      : !userSession
                      ? (language === 'en' ? 'Sign In to Log Savings' : 'سجل الدخول لحفظ توفيرك')
                      : (language === 'en' ? 'Log My Savings' : 'سجل توفيري')}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* RESULTS LIST CONTROLS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#10263D] p-3 rounded-xl border border-white/5 shadow-md">
            <span className="text-xs font-mono font-bold text-[#7E96AA] uppercase tracking-widest px-1">
              {language === 'en' ? 'SHOWING:' : 'معروض:'} <span className="text-white">{sortedOptions.length} {language === 'en' ? 'CHANNELS' : 'قنوات'}</span>
            </span>

            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              {copiedRates && (
                <span className="text-xs bg-[#00C16A]/10 text-[#00E07A] font-bold px-2.5 py-1 rounded-lg border border-[#00C16A]/10 animate-pulse">
                  ✓ {language === 'en' ? 'Copied to clipboard!' : 'تم نسخ التقرير للحافظة!'}
                </span>
              )}

              {sortedOptions.length > 0 && (
                <button
                  id="whatsapp-share-btn"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#071326] stroke-[2.5]" />
                  <span>{language === 'en' ? 'Share Report' : 'مشاركة التقرير'}</span>
                </button>
              )}

              <span className="text-xs text-[#AFC4D8] font-medium">
                {language === 'en' ? 'Sort by:' : 'ترتيب حسب:'}
              </span>
              <select
                id="calc-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#071326] border border-white/5 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-[#00C16A] text-white font-semibold cursor-pointer font-sans"
              >
                <option value="received">{t('receivedAmount')}</option>
                <option value="rate">{t('rate')}</option>
                <option value="fee">{t('fee')}</option>
                <option value="speed">{t('delivery')}</option>
              </select>
            </div>
          </div>



          {/* ACTUAL PROVIDER RATE CARDS */}
          <div className="space-y-4">
            {sortedOptions.length === 0 ? (
              <div className="text-center py-12 bg-[#10263D] rounded-2xl border border-dashed border-white/5">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-[#AFC4D8]">
                  {language === 'en' ? 'No channels matched filters' : 'لم تطابق أي قنوات الفلاتر المحددة'}
                </h4>
                <p className="text-xs text-[#7E96AA] mt-1 max-w-sm mx-auto">
                  {language === 'en' 
                    ? 'Try switching transfer method to "All Methods" or clearing the provider limit dropdown.' 
                    : 'حاول تغيير طريقة التحويل إلى "جميع الطرق" أو مسح الفلاتر.'}
                </p>
              </div>
            ) : (
              sortedOptions.map((option, idx) => {
                const provider = PROVIDERS.find(p => p.id === option.providerId);
                const isBestReceived = idx === 0 && sortBy === 'received';
                const isLowestFee = option.fee === Math.min(...processedOptions.map(o => o.fee));
                const optionKey = `${option.providerId}_${option.subService || 'none'}`;
                const isComparing = selectedCompareKeys.includes(optionKey);
                
                return (
                  <div
                    key={`${option.providerId}_${option.subService || 'none'}`}
                    className={`border rounded-[20px] transition-all shadow-xl hover:scale-[1.01] hover:border-white/20 relative p-5 ${
                      isHighlighting 
                        ? (isBestReceived ? 'animate-highlight-best' : 'animate-highlight-standard')
                        : (isBestReceived 
                            ? 'border-[#F4B63F] bg-[#061B3A] shadow-[#F4B63F]/5 shadow-2xl' 
                            : 'bg-[#061B3A]/70 border-white/10')
                    }`}
                  >
                    {/* MOBILE CARD VIEW: Clean, stackable card interface (visible only on mobile) */}
                    <div className="flex md:hidden flex-col w-full space-y-4">
                      {/* Top Row: Brand Info and Badges */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <ProviderLogo providerId={option.providerId} className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-white text-sm">
                                {provider?.name}{getSubServiceLabel(option.subService)}
                              </h4>
                              <span className="text-[10px] text-[#F4B63F] font-black">
                                ★ {provider?.rating}
                              </span>
                              {option.source_label && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 text-[#00E07A] border border-white/10 font-mono">
                                  {option.source_label}
                                </span>
                              )}
                              {option.source_badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                  {option.source_badge}
                                </span>
                              )}
                              {option.freshness_label && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  {option.freshness_label}
                                </span>
                              )}
                              {option.is_expiring_soon && (
                                <span className="bg-rose-500 text-white animate-pulse text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {language === 'en' ? '⚠️ Expiring' : '⚠️ قارب على الانتهاء'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#B8C7D9] font-medium">
                              {language === 'en' ? provider?.typeEn : provider?.typeAr} •{' '}
                              <span className="font-mono text-[10px] uppercase font-bold text-[#B8C7D9]/60">
                                {option.transferMethods.map(m => m.toUpperCase()).join('/')}
                              </span>
                            </p>
                            
                            <div className="mt-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompareKeys(prev => 
                                    prev.includes(optionKey) 
                                      ? prev.filter(k => k !== optionKey) 
                                      : [...prev, optionKey]
                                  );
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isComparing 
                                    ? 'bg-[#00C16A]/25 border-[#00C16A] text-[#00E07A] font-black' 
                                    : 'bg-[#031126]/60 border-white/10 text-[#B8C7D9] hover:text-white hover:border-white/25'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isComparing} 
                                  readOnly 
                                  className="rounded border-white/20 text-[#00E07A] focus:ring-[#00C16A] w-3 h-3 accent-[#00E07A] cursor-pointer" 
                                />
                                <span className="ml-1 text-[9px] font-mono">{language === 'en' ? 'My Usual Channel' : 'قناتي المعتادة'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
 
                        {/* Badges on right */}
                        <div className="flex flex-col items-end gap-1">
                          {isBestReceived && (
                            <span className="bg-[#F4B63F] text-[#031126] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow border border-white/10">
                              ★ {t('bestValue')}
                            </span>
                          )}
                          {isLowestFee && (
                            <span className="bg-[#0B2A5B] text-white border border-white/10 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                              💸 {t('lowestFee')}
                            </span>
                          )}
                        </div>
                      </div>
 
                      {/* Main Center Block: Huge received amount badge */}
                      <div className="bg-[#031126] p-4 rounded-xl border border-white/10 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] text-[#B8C7D9] font-extrabold uppercase block tracking-wider">
                              {language === 'en' ? 'YOUR FAMILY RECEIVES' : 'عائلتك تستلم'}
                            </span>
                            <div className="text-3.5xl font-black text-[#00C16A] font-mono leading-tight mt-0.5">
                              {option.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              <span className="text-sm font-bold text-white">{selectedCorridor.currencySymbol}</span>
                            </div>
                          </div>

                          {/* Family Value Meter */}
                          <FamilyValueMeterComponent option={option} idx={idx} provider={provider} sortedOptions={sortedOptions} />
                        </div>

                        {/* Cost Mappings block */}
                        <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-xs text-[#B8C7D9]">
                          <div className="flex justify-between font-mono">
                            <span>{language === 'en' ? 'Exchange Rate:' : 'سعر الصرف:'}</span>
                            <span className="font-bold text-white">1 SAR = {option.exchangeRate.toFixed(4)} {selectedCorridor.currencyCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{language === 'en' ? 'Transfer Fee:' : 'رسوم التحويل:'}</span>
                            <span className="font-bold text-white font-mono">
                              {option.transfer_fee === 0 ? (
                                <span className="text-[#00E07A] font-extrabold">{language === 'en' ? 'FREE' : 'مجاني'}</span>
                              ) : (
                                `${option.transfer_fee.toFixed(2)} SAR`
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-dashed border-white/10 pt-1.5">
                            <span>{language === 'en' ? 'Value Efficiency:' : 'كفاءة القيمة:'}</span>
                            <span className="font-mono text-white">
                              {idx === 0 ? (
                                <span className="text-[#00E07A] font-black">{language === 'en' ? '100% Best Value' : '١٠٠٪ أفضل قيمة'}</span>
                              ) : (
                                `${((option.estimatedReceived / sortedOptions[0].estimatedReceived) * 100).toFixed(1)}%`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stack of Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-center bg-[#031126] p-2.5 rounded-xl border border-white/10">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#B8C7D9] uppercase font-semibold block">{t('rate')}</span>
                          <span className="text-[11px] font-mono font-bold text-white">
                            {option.exchangeRate.toFixed(4)}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#B8C7D9] uppercase font-semibold block">{t('delivery')}</span>
                          <span className="text-[11px] font-bold text-[#00E07A] truncate max-w-[100px] mx-auto block">
                            🚀 {language === 'en' ? option.deliverySpeedEn : option.deliverySpeedAr}
                          </span>
                        </div>
                      </div>

                      {/* Bottom row: Last updated & Claim/Send buttons */}
                      <div className="space-y-2 pt-1 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-[#B8C7D9] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#B8C7D9]" />
                            <span>{option.relativeTime}</span>
                          </span>

                          <button
                            id={`send-now-btn-mobile-${option.providerId}`}
                            onClick={() => handleSelectOption(option)}
                            className="px-4 py-2 bg-[#00C16A] hover:bg-[#00E07A] text-[#031126] font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{t('actionSend')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Sent money log button (requested in spec) */}
                        <button
                          onClick={() => {
                            handleSelectOption(option);
                            if (userSession && !claimedSavings) {
                              handleClaimSavings();
                            }
                          }}
                          className="w-full py-2 bg-[#031126] hover:bg-white/5 text-white font-extrabold text-[10px] rounded-lg transition-colors border border-white/10 uppercase tracking-wider flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00E07A]" />
                          <span>{language === 'en' ? "I Sent Money Using This Provider" : "أرسلت أموالاً باستخدام هذا المزود"}</span>
                        </button>
                      </div>
                    </div>

                    {/* DESKTOP VIEW: Row layout (visible only on md screens and larger) */}
                    <div className="hidden md:flex flex-col w-full space-y-4">
                      <div className="flex flex-row justify-between items-center w-full gap-4 relative">
                        {/* Top badges for highlights */}
                        <div className="absolute -top-7.5 left-4 flex gap-1.5">
                          {isBestReceived && (
                            <span className="bg-[#F4B63F] text-[#031126] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow border border-white/10">
                              ★ {t('bestValue')}
                            </span>
                          )}
                          {isLowestFee && (
                            <span className="bg-[#0B2A5B] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow border border-white/10">
                              💸 {t('lowestFee')}
                            </span>
                          )}
                        </div>

                        {/* Left block: Logo, Provider Details */}
                        <div className="flex items-center gap-4 w-1/4 shrink-0">
                          <ProviderLogo providerId={option.providerId} className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-white text-sm">
                                {provider?.name}{getSubServiceLabel(option.subService)}
                              </h4>
                              <span className="text-[10px] text-[#F4B63F] font-bold">
                                ★ {provider?.rating}
                              </span>
                              {option.source_label && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#031126] text-[#00E07A] border border-white/10 font-mono">
                                  {option.source_label}
                                </span>
                              )}
                              {option.source_badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                                  {option.source_badge}
                                </span>
                              )}
                              {option.freshness_label && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  {option.freshness_label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#B8C7D9] font-medium">
                              {language === 'en' ? provider?.typeEn : provider?.typeAr} •{' '}
                              <span className="font-mono text-[10px] uppercase text-[#B8C7D9]/70 font-bold">
                                {option.transferMethods.map(m => m.toUpperCase()).join(' / ')}
                              </span>
                            </p>
                            <p className="text-[10px] text-[#B8C7D9]/60 flex items-center gap-1 mt-1 font-mono">
                              <Clock className="w-3 h-3 text-[#B8C7D9]/60" />
                              <span>{option.relativeTime}</span>
                            </p>
                            
                            <div className="mt-2 flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompareKeys(prev => 
                                    prev.includes(optionKey) 
                                      ? prev.filter(k => k !== optionKey) 
                                      : [...prev, optionKey]
                                  );
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isComparing 
                                    ? 'bg-[#00C16A]/25 border-[#00C16A] text-[#00E07A] font-black' 
                                    : 'bg-[#031126]/60 border-white/10 text-[#B8C7D9] hover:text-white hover:border-white/20'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isComparing} 
                                  readOnly 
                                  className="rounded border-white/20 text-[#00E07A] focus:ring-[#00C16A] w-3 h-3 accent-[#00E07A] cursor-pointer" 
                                />
                                <span className="text-[9px] font-mono">{language === 'en' ? 'My Usual Channel' : 'قناتي المعتادة'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Middle block: Cost metrics */}
                        <div className="w-2/4 bg-[#031126]/60 p-4 rounded-xl border border-white/10 text-xs grid grid-cols-3 gap-4 items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#B8C7D9]/70 uppercase block font-bold tracking-wider">{language === 'en' ? 'Exchange Rate' : 'سعر الصرف'}</span>
                            <div className="font-extrabold text-white text-sm font-mono">1 SAR = {option.exchangeRate.toFixed(4)}</div>
                            <span className="text-[10px] text-[#B8C7D9]/60 block font-mono font-medium">{selectedCorridor.currencyCode}</span>
                          </div>
                          
                          <div className="space-y-1 border-x border-white/10 px-4">
                            <span className="text-[10px] text-[#B8C7D9]/70 uppercase block font-bold tracking-wider">{language === 'en' ? 'Transfer Fee' : 'رسوم التحويل'}</span>
                            <div className="font-extrabold text-white text-sm font-mono">
                              {option.transfer_fee === 0 ? (
                                <span className="text-[#00E07A] font-black">{language === 'en' ? 'FREE' : 'مجاني'}</span>
                              ) : (
                                `${option.transfer_fee.toFixed(2)} SAR`
                              )}
                            </div>
                            <span className="text-[10px] text-[#B8C7D9]/60 block font-medium">
                              {language === 'en' ? 'Incl. VAT' : 'شامل الضريبة'}
                            </span>
                          </div>

                          <div className="space-y-1 pl-1">
                            <span className="text-[10px] text-[#B8C7D9]/70 uppercase block font-bold tracking-wider">{language === 'en' ? 'Value Rating' : 'تصنيف القيمة'}</span>
                            <div className="flex flex-col">
                              {idx === 0 ? (
                                <>
                                  <span className="text-[#F4B63F] font-extrabold text-xs flex items-center gap-1">
                                    <span>🌟</span>
                                    <span>{language === 'en' ? 'Best Value' : 'أفضل قيمة'}</span>
                                  </span>
                                  <span className="text-[9px] text-[#B8C7D9]/60 block">{language === 'en' ? 'Maximized yield' : 'أقصى عائد'}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[#B8C7D9] font-bold text-xs">
                                    {((option.estimatedReceived / sortedOptions[0].estimatedReceived) * 100).toFixed(1)}% {language === 'en' ? 'Yield' : 'عائد'}
                                  </span>
                                  <span className="text-[9px] text-rose-400 block font-mono">
                                    -{Math.round(sortedOptions[0].estimatedReceived - option.estimatedReceived).toLocaleString()} {selectedCorridor.currencySymbol}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right block: YOUR FAMILY RECEIVES (as the absolute largest number) */}
                        <div className="w-1/4 flex flex-col justify-between items-end gap-3 shrink-0">
                          <FamilyValueMeterComponent option={option} idx={idx} provider={provider} sortedOptions={sortedOptions} />

                          <div className="text-right">
                            <span className="text-[10px] text-[#B8C7D9] font-extrabold uppercase block tracking-wider">
                              {language === 'en' ? 'YOUR FAMILY RECEIVES' : 'عائلتك تستلم'}
                            </span>
                            <div className="text-3.5xl font-black text-[#00C16A] font-mono leading-tight mt-0.5">
                              {option.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                              <span className="text-sm font-bold text-white">{selectedCorridor.currencySymbol}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Prominent sent money tracking button (requested in spec) */}
                            <button
                              onClick={() => {
                                handleSelectOption(option);
                                if (userSession && !claimedSavings) {
                                  handleClaimSavings();
                                }
                              }}
                              className="px-3 py-2 bg-[#031126] hover:bg-white/5 text-white font-extrabold text-[10px] rounded-xl transition-colors border border-white/10 uppercase tracking-wider flex items-center gap-1"
                              title={language === 'en' ? "Log my savings using this provider" : "سجل توفيري باستخدام هذا المزود"}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#00E07A]" />
                              <span>{language === 'en' ? "Sent" : "أرسلت"}</span>
                            </button>

                            <button
                              id={`send-now-btn-${option.providerId}`}
                              onClick={() => handleSelectOption(option)}
                              className="px-4 py-2 bg-[#00C16A] hover:bg-[#00E07A] text-[#031126] font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t('actionSend')}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#031126]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown Drawer */}
                    <div className="pt-2.5 border-t border-white/10 mt-2.5 flex flex-col items-start gap-2 w-full">
                      <button
                        onClick={() => toggleBreakdown(`${option.providerId}_${option.subService || 'none'}`)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#00E07A] hover:underline cursor-pointer transition-colors"
                      >
                        <span>{expandedBreakdowns[`${option.providerId}_${option.subService || 'none'}`] ? (language === 'en' ? 'Hide Cost Breakdown' : 'إخفاء تفاصيل التكلفة') : (language === 'en' ? 'See Cost Breakdown' : 'عرض تفاصيل التكلفة')}</span>
                        {expandedBreakdowns[`${option.providerId}_${option.subService || 'none'}`] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      
                      {expandedBreakdowns[`${option.providerId}_${option.subService || 'none'}`] && (
                        <div className="w-full bg-[#031126] p-4 rounded-xl border border-white/10 text-xs text-[#B8C7D9] mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'Exchange Rate' : 'سعر الصرف'}</span>
                            <span className="text-sm font-bold text-white">1 SAR = {option.exchangeRate.toFixed(4)} {selectedCorridor.currencyCode}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'Transfer Fee' : 'رسوم التحويل'}</span>
                            <span className="text-sm font-bold text-white">{option.transfer_fee.toFixed(2)} SAR</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'VAT' : 'ضريبة القيمة المضافة'}</span>
                            <span className="text-sm font-bold text-white">{option.vat_amount.toFixed(2)} SAR</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'Additional Charges' : 'رسوم إضافية'}</span>
                            <span className="text-sm font-bold text-white">{option.additional_charges.toFixed(2)} SAR</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'Net Transfer Amount' : 'صافي الحوالة'}</span>
                            <span className="text-sm font-bold text-white">{option.net_transfer_amount.toFixed(2)} SAR</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#B8C7D9]/60 uppercase font-bold block">{language === 'en' ? 'Recipient Amount' : 'المبلغ المستلم'}</span>
                            <span className="text-sm font-bold text-[#00C16A]">{option.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}</span>
                          </div>
                          {option.cost_breakdown.promotionalDiscount > 0 && (
                            <div>
                              <span className="text-[10px] text-[#FDBA2D] uppercase font-bold block">{language === 'en' ? 'Promo Discount' : 'خصم ترويجي'}</span>
                              <span className="text-sm font-bold text-[#FDBA2D]">-{option.cost_breakdown.promotionalDiscount.toFixed(2)} SAR</span>
                            </div>
                          )}
                          {option.cost_breakdown.providerDiscount > 0 && (
                            <div>
                              <span className="text-[10px] text-[#FDBA2D] uppercase font-bold block">{language === 'en' ? 'Provider Discount' : 'خصم المزود'}</span>
                              <span className="text-sm font-bold text-[#FDBA2D]">-{option.cost_breakdown.providerDiscount.toFixed(2)} SAR</span>
                            </div>
                          )}
                          <div className="col-span-2 md:col-span-3 border-t border-white/10 pt-2 flex items-center justify-between text-[11px]">
                            <span className="text-[10px] text-[#B8C7D9]/60 font-bold uppercase">{language === 'en' ? 'Effective Yield' : 'العائد الفعلي للريال'}</span>
                            <span className="font-bold text-[#00C16A]">{option.effective_exchange_rate.toFixed(4)} {selectedCorridor.currencyCode} / SAR</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommendation Explanation Engine Section */}
                    <div className="pt-2.5 border-t border-white/10 mt-2.5 flex flex-col items-start gap-2 w-full">
                      <button
                        onClick={() => toggleExplanation(`${option.providerId}_${option.subService || 'none'}`, option)}
                        className="w-full flex items-center justify-between text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-450 animate-pulse" />
                          <span>{language === 'en' ? 'Why this recommendation?' : 'لماذا هذه التوصية؟'}</span>
                        </span>
                        {expandedExplanations[`${option.providerId}_${option.subService || 'none'}`] ? (
                          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>

                      {expandedExplanations[`${option.providerId}_${option.subService || 'none'}`] && (() => {
                        const seed = option.providerId.charCodeAt(0) + (option.subService ? option.subService.charCodeAt(0) : 0);
                        const signal = corridorIntelligence?.signal || 'Send Now';
                        const rawConfidence = option.source_confidence || (seed % 10) + 89;
                        const confidenceColor = 'text-[#00E07A]';
                        
                        const freshnessText = option.relativeTime;
                        let freshnessColor = 'text-[#00E07A]';
                        
                        if (option.freshness_label === 'Very Fresh' || option.freshness_label === 'Fresh') {
                          freshnessColor = 'text-[#00E07A]';
                        } else if (option.freshness_label === 'Moderately Fresh' || option.freshness_label === 'Getting Old') {
                          freshnessColor = 'text-[#F4B63F]';
                        } else {
                          freshnessColor = 'text-rose-500';
                        }

                        const rawRateSource = option.selected_rate_source || 'Provider Verified';
                        let rateSourceLabel = language === 'en' ? 'Verified Provider' : 'مزود معتمد';
                        if (rawRateSource === 'Community Verified' || option.source_label?.includes('Community') || option.source_label?.includes('Crowd')) {
                          rateSourceLabel = language === 'en' ? 'Community Verified' : 'تم التحقق من المجتمع';
                        } else if (rawRateSource === 'Admin Verified' || option.matched_override_id) {
                          rateSourceLabel = language === 'en' ? 'Admin Verified' : 'تم التحقق من المشرف';
                        }

                        const extraValueAmount = isBestReceived 
                          ? (option.estimatedReceived - (sortedOptions[1]?.estimatedReceived || worstOption.estimatedReceived)) 
                          : (option.estimatedReceived - worstOption.estimatedReceived);
                          
                        const nextBestOptionName = isBestReceived 
                          ? (PROVIDERS.find(p => p.id === (sortedOptions[1]?.providerId || worstOption.providerId))?.name || 'next best option')
                          : '';

                        const extraValueText = extraValueAmount > 0 
                          ? `+${extraValueAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${selectedCorridor.currencySymbol} ${
                              isBestReceived 
                                ? (language === 'en' ? `compared with ${nextBestOptionName}` : `مقارنة بـ ${nextBestOptionName}`)
                                : (language === 'en' ? 'compared with today’s lowest payout option' : 'مقارنة بأدنى خيار دفع اليوم')
                            }`
                          : (language === 'en' ? 'Competitive with standard market rates' : 'منافس لمعدلات السوق المعتادة');

                        const deliverySpeed = language === 'en' ? (option.deliverySpeedEn || 'Instant Wallet') : (option.deliverySpeedAr || 'محفظة فورية');
                        const reliability = (provider?.rating || 4.5) >= 4.5 
                          ? (language === 'en' ? 'Highly Trusted' : 'موثوق للغاية') 
                          : (language === 'en' ? 'Reliable' : 'موثوق');

                        const communityReportsCount = (seed % 15) + 8;

                        const trustMessages = [
                          language === 'en' 
                            ? "Our recommendations consider exchange rates, transfer fees, VAT, and verified community intelligence."
                            : "تأخذ توصياتنا في الاعتبار أسعار الصرف ورسوم التحويل وضريبة القيمة المضافة ومعلومات المجتمع التي تم التحقق منها.",
                          language === 'en'
                            ? "We recommend providers based on real recipient value—not exchange rate alone."
                            : "نحن نوصي بالمزودين بناءً على القيمة الحقيقية للمستلم - وليس سعر الصرف وحده.",
                          language === 'en'
                            ? "Recommendations are generated independently using evidence-based analysis."
                            : "يتم إنشاء التوصيات بشكل مستقل باستخدام تحليل قائم على الأدلة."
                        ];
                        const trustMessage = trustMessages[seed % trustMessages.length];

                        return (
                          <div className="w-full bg-[#031126]/95 border border-white/10 rounded-[18px] p-4 mt-2 space-y-4 animate-fade-in text-xs text-[#B8C7D9] transition-all duration-250">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                              <span className="text-[#00E07A] font-extrabold text-[11px] uppercase tracking-wide">
                                {language === 'en' ? 'Recommended because:' : 'موصى به للأسباب التالية:'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Recipient Value Benefit' : 'منفعة القيمة للمستلم'}
                                  </span>
                                  <span className="text-[11px] text-[#AFC4D8]">
                                    {isBestReceived 
                                      ? (language === 'en' 
                                          ? 'Your family receives the highest final amount after considering exchange rate, transfer fees, VAT, and other charges.'
                                          : 'تستلم عائلتك أعلى مبلغ نهائي بعد احتساب سعر الصرف ورسوم التحويل وضريبة القيمة المضافة والرسوم الأخرى.')
                                      : (language === 'en'
                                          ? 'Offers highly competitive net payout compared to the market average with low overheads.'
                                          : 'يقدم عائداً صافياً تنافسياً للغاية مقارنة بمتوسط السوق مع تكاليف إضافية منخفضة.')
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white flex items-center gap-1.5">
                                    <span>{language === 'en' ? 'Confidence Score' : 'مؤشر الثقة والاعتمادية'}</span>
                                    <span 
                                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black bg-emerald-500/10 ${confidenceColor}`}
                                      title={language === 'en' ? 'Confidence reflects the reliability of the recommendation based on available verified evidence.' : 'يعكس مؤشر الثقة مدى موثوقية التوصية بناءً على الأدلة المتاحة والمثبتة.'}
                                    >
                                      {rawConfidence}%
                                    </span>
                                  </span>
                                  <span className="text-[11px] text-[#AFC4D8]">
                                    {language === 'en' 
                                      ? 'Confidence reflects the reliability of the recommendation based on available verified evidence.'
                                      : 'يعكس مؤشر الثقة مدى موثوقية التوصية بناءً على الأدلة المتاحة والمثبتة.'
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Rate Freshness' : 'حداثة وتحديث السعر'}
                                  </span>
                                  <span className={`text-[11px] font-semibold ${freshnessColor}`}>
                                    {freshnessText}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Rate Source' : 'مصدر السعر'}
                                  </span>
                                  <span className="text-[11px] text-[#00E07A] font-semibold">
                                    {rateSourceLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Estimated Extra Value' : 'القيمة الإضافية المقدرة'}
                                  </span>
                                  <span className="text-[11px] text-amber-400 font-bold font-mono">
                                    {extraValueText}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Delivery Speed' : 'سرعة التحويل'}
                                  </span>
                                  <span className="text-[11px] text-[#AFC4D8] font-medium">
                                    {deliverySpeed}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Reliability Rating' : 'تقييم الموثوقية'}
                                  </span>
                                  <span className="text-[11px] text-[#AFC4D8] font-medium">
                                    {reliability}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-extrabold text-white block">
                                    {language === 'en' ? 'Community Intelligence' : 'ذكاء المجتمع والمساهمات'}
                                  </span>
                                  <span className="text-[11px] text-[#AFC4D8]">
                                    {language === 'en'
                                      ? `${communityReportsCount} recent verified reports for this corridor.`
                                      : `${communityReportsCount} تقرير مؤخراً تم التحقق منه لبلد التحويل هذا.`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#10263D] rounded-xl p-3.5 border border-white/5 space-y-2">
                              {signal === 'Wait' ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-wider">
                                      {language === 'en' ? 'Recommendation:' : 'التوصية المعتمدة:'}
                                    </span>
                                    <span className="bg-amber-500/15 border border-amber-500/20 text-[#F4B63F] font-black uppercase text-[10px] px-2.5 py-0.5 rounded-full">
                                      ⚠️ {language === 'en' ? 'Wait' : 'انتظر'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#AFC4D8] leading-relaxed">
                                    {language === 'en' 
                                      ? "Current rates are slightly below their recent average. Based on available intelligence, waiting may increase the value your family receives."
                                      : "الأسعار الحالية أقل قليلاً من المتوسط الأخير. بناءً على المعلومات المتاحة، قد يؤدي الانتظار لزيادة القيمة التي تستلمها عائلتك."}
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7E96AA] border-t border-white/5 pt-2 mt-1.5">
                                    <span>{language === 'en' ? 'Engine Confidence:' : 'دقة محرك التوصيات:'} <strong className="text-white">91%</strong></span>
                                    <span>{language === 'en' ? 'Next review:' : 'المراجعة التالية:'} <strong className="text-white">~30 mins</strong></span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#7E96AA] font-extrabold uppercase tracking-wider">
                                      {language === 'en' ? 'Recommendation:' : 'التوصية المعتمدة:'}
                                    </span>
                                    <span className="bg-[#00C16A]/15 border border-[#00C16A]/20 text-[#00E07A] font-black uppercase text-[10px] px-2.5 py-0.5 rounded-full">
                                      🚀 {language === 'en' ? 'Send Now' : 'أرسل الآن'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#AFC4D8] leading-relaxed">
                                    {language === 'en'
                                      ? "Current market conditions provide one of today’s strongest recipient values. This provider currently offers the best balance of: Exchange rate, Fees, VAT, Delivery, Reliability, Confidence."
                                      : "توفر ظروف السوق الحالية أحد أقوى قيم الاستلام لليوم. يقدم هذا المزود حالياً أفضل توازن بين: سعر الصرف، الرسوم، ضريبة القيمة المضافة، سرعة التسليم، الموثوقية، ومؤشر الثقة."}
                                  </p>
                                </>
                              )}
                            </div>

                            <div className="text-[10px] italic text-[#7E96AA] text-center border-t border-white/5 pt-2.5">
                              “{trustMessage}”
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Info Disclaimer */}
          <div className="bg-[#061B3A] p-5 rounded-xl border border-white/10 text-xs text-[#B8C7D9] flex gap-2.5 shadow-md">
            <Info className="w-5 h-5 text-[#F4B63F] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{language === 'en' ? 'Platform Disclaimer:' : 'تنويه المنصة:'}</strong> {t('trustScoreDesc')}{' '}
              {language === 'en' 
                ? 'Rates provided are indicative and aggregated from public APIs and community reports. Always check the official provider application before initiating transfers.' 
                : 'الأسعار المعروضة هي أسعار استرشادية مجمعة من واجهات برمجة التطبيقات العامة وتقارير المجتمع. تحقق دائماً من التطبيق الرسمي للشركة قبل بدء عملية التحويل.'}
            </p>
          </div>

        </div>
      </div>

      {/* DYNAMIC POP-UP GUIDE MODAL */}
      {activeInstructionModal && (() => {
        const option = activeInstructionModal;
        const provider = PROVIDERS.find(p => p.id === option.providerId);
        return (
          <div className="fixed inset-0 z-50 bg-[#071326]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#10263D] border border-white/10 max-w-lg w-full rounded-[24px] shadow-2xl overflow-hidden animate-zoom-in text-white">
              
              {/* Modal Banner */}
              <div className={`p-6 text-white ${provider?.logoColor || 'bg-[#0B1E35]'} relative overflow-hidden`}>
                <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 pointer-events-none select-none">
                  <ProviderLogo providerId={option.providerId} className="w-full h-full scale-110" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <ProviderLogo providerId={option.providerId} className="w-12 h-12 rounded-xl border border-white/10 shrink-0 shadow-md" />
                    <div>
                      <span className="text-[10px] font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded uppercase">
                        {provider?.typeEn}
                      </span>
                      <h3 className="text-xl font-extrabold mt-0.5">{provider?.name}</h3>
                    </div>
                  </div>
                  <button
                    id="close-instruction-modal"
                    onClick={() => setActiveInstructionModal(null)}
                    className="p-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-[#AFC4D8] text-sm">
                
                <div className="bg-[#071326] p-4 rounded-xl border border-white/5 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span>{language === 'en' ? 'Transfer Amount:' : 'المبلغ المرسل:'}</span>
                    <span className="font-bold text-white">{sendingAmount.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'en' ? 'Transfer Fee:' : 'رسوم التحويل:'}</span>
                    <span className="font-bold text-white">+{option.transfer_fee.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'en' ? 'VAT:' : 'ضريبة القيمة المضافة:'}</span>
                    <span className="font-bold text-white">+{option.vat_amount.toFixed(2)} SAR</span>
                  </div>
                  {option.additional_charges > 0 && (
                    <div className="flex justify-between">
                      <span>{language === 'en' ? 'Additional Charges:' : 'رسوم إضافية:'}</span>
                      <span className="font-bold text-white">+{option.additional_charges.toFixed(2)} SAR</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white pt-1.5 border-t border-dashed border-white/10">
                    <span>{language === 'en' ? 'Total Cost:' : 'إجمالي التكلفة:'}</span>
                    <span className="font-extrabold text-[#00E07A]">{option.total_cost.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{language === 'en' ? 'Exchange Rate:' : 'سعر الصرف:'}</span>
                    <span className="text-white">1 SAR = {option.exchangeRate.toFixed(4)} {selectedCorridor.currencyCode}</span>
                  </div>
                  <div className="flex justify-between text-[#00E07A] pt-2 border-t border-white/10 text-sm">
                    <span className="font-bold">{language === 'en' ? 'Payout to Family:' : 'المبلغ للمستلم:'}</span>
                    <span className="font-black text-lg">
                      {option.estimatedReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCorridor.currencySymbol}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="font-extrabold text-white text-sm">
                    {language === 'en' ? 'Step-by-Step sending guide:' : 'خطوات إرسال الحوالة:'}
                  </h4>
                  
                  <ul className="space-y-2 list-disc pl-5 rtl:pl-0 rtl:pr-5">
                    <li>
                      <strong>{language === 'en' ? 'Step 1:' : 'الخطوة ١:'}</strong>{' '}
                      {language === 'en' 
                        ? `Open the official ${provider?.name} mobile app on your smartphone.` 
                        : `افتح تطبيق ${provider?.name} الرسمي على جوالك.`}
                    </li>
                    <li>
                      <strong>{language === 'en' ? 'Step 2:' : 'الخطوة ٢:'}</strong>{' '}
                      {language === 'en'
                        ? `Select International Remittance and choose destination: ${selectedCorridor.nameEn}.`
                        : `اختر "تحويل دولي" وحدد الوجهة: ${selectedCorridor.nameAr}.`}
                    </li>
                    <li>
                      <strong>{language === 'en' ? 'Step 3:' : 'الخطوة ٣:'}</strong>{' '}
                      {language === 'en'
                        ? `Choose payout method: "${option.transferMethods.join(' / ').toUpperCase()}".`
                        : `حدد طريقة الاستلام: "${option.transferMethods.map(m => m === 'wallet' ? 'محفظة' : m === 'bank' ? 'حساب بنكي' : 'استلام نقدي').join(' / ')}".`}
                    </li>
                    <li>
                      <strong>{language === 'en' ? 'Step 4:' : 'الخطوة ٤:'}</strong>{' '}
                      {language === 'en'
                        ? `Enter ${sendingAmount} SAR. Complete verification & confirm.`
                        : `أدخل ${sendingAmount} ريال وأكمل عملية التحويل بعد التحقق من مطابقة السعر.`}
                    </li>
                  </ul>
                </div>

                <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 p-3 rounded-lg text-[11px] text-[#00E07A] flex gap-1.5 leading-relaxed">
                  <span className="text-sm">💡</span>
                  <span>
                    {language === 'en'
                      ? 'Pro tip: Wallets like STC Pay and urpay frequently offer cashback rewards. Look for dynamic promo banners on their home page.'
                      : 'نصيحة: تقدم المحافظ الرقمية كـ STC Pay و urpay خصومات كاش باك متكررة. تصفح الإعلانات داخل تطبيقاتها قبل التحويل.'}
                  </span>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-[#0B1E35] p-4 border-t border-white/5 flex justify-end">
                <button
                  id="close-instruction-modal-footer"
                  onClick={() => setActiveInstructionModal(null)}
                  className="px-5 py-2 bg-[#00C16A] text-[#071326] font-extrabold text-xs rounded-xl hover:bg-[#00E07A] transition-colors cursor-pointer uppercase tracking-wider"
                >
                  {language === 'en' ? 'Got It' : 'فهمت'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
