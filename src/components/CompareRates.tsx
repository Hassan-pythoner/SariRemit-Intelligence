import React, { useState, useEffect } from 'react';
import { TranslationDict, Corridor, TrueCostResult, BrandAsset } from '../types';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { slf } from '../services/slfService';
import { 
  getRecommendations, DbResolvedRate, DbSisScore, DbRecommendationResult, getAuthSession,
  resolveProviderBranding, fetchBrandAssets
} from '../services/supabaseService';
import { 
  ArrowLeftRight, HelpCircle, ShieldAlert, Sparkles, TrendingUp, Info, 
  CheckCircle2, Clock, ThumbsUp, DollarSign, Wallet, MapPin, Landmark, ArrowUpDown, Award,
  ChevronDown, ChevronUp, Check, ShieldCheck, X, Zap
} from 'lucide-react';
import { RecordTransferModal } from './RecordTransferModal';
import { SEPSCelebration } from './SEPSCelebration';
import { FirstTransferFeedback } from './FirstTransferFeedback';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect, SDSSisGauge } from './Sds';
import { ProviderLogo, CountryFlag } from './SdsBamComponents';

interface CompareRatesProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  quickSearch: { corridorId: string; amount: number } | null;
  setQuickSearch: (search: null) => void;
  setActiveTab?: (tab: string) => void;
}

export default function CompareRates({
  language,
  t,
  quickSearch,
  setQuickSearch,
  setActiveTab,
}: CompareRatesProps) {
  const isRtl = language === 'ar';

  // Input states
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [corridorId, setCorridorId] = useState<string>(() => {
    const session = getAuthSession();
    return session.user?.preferredCorridorId || 'sa-pk';
  });
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'received' | 'rate' | 'fee' | 'trusted'>('value');
  const [optionsTab, setOptionsTab] = useState<'all' | 'recommended'>('all');
  const [deliverySpeed, setDeliverySpeed] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [providerType, setProviderType] = useState<string>('all');
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);

  useEffect(() => {
    fetchBrandAssets().then(data => setBrandAssets(data || []));
  }, []);

  // Interactive UI states
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [expandedSisId, setExpandedSisId] = useState<string | null>(null);
  const [comparisonTargetId, setComparisonTargetId] = useState<string | null>(null);

  // SEPS states
  const [recordTransferOption, setRecordTransferOption] = useState<any>(null);
  const [celebrationOpen, setCelebrationOpen] = useState<boolean>(false);
  const [newlyEarnedAchievements, setNewlyEarnedAchievements] = useState<any[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [feedbackTransferId, setFeedbackTransferId] = useState<string>('');

  const session = getAuthSession();
  const user = session.user;

  // Load user's preferred country when logged in and no quickSearch is active
  useEffect(() => {
    if (!quickSearch) {
      const session = getAuthSession();
      if (session.user?.preferredCorridorId) {
        setCorridorId(session.user.preferredCorridorId);
      }
    }
  }, [quickSearch]);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Engine state
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendation, setRecommendation] = useState<DbRecommendationResult | null>(null);
  const [options, setOptions] = useState<{ resolved: DbResolvedRate; sis: DbSisScore; netAmount: number; totalFees: number; trueCost?: TrueCostResult }[]>([]);

  // Load quick search parameters from landing page
  useEffect(() => {
    if (quickSearch) {
      setSendAmount(quickSearch.amount);
      setCorridorId(quickSearch.corridorId);
      setQuickSearch(null);
    }
  }, [quickSearch, setQuickSearch]);

  // Fetch recommendations and resolved rates
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getRecommendations(corridorId, sendAmount)
      .then((res) => {
        if (isMounted) {
          setRecommendation(res.bestOption);
          setOptions(res.allOptions);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching recommendations from engine:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [corridorId, sendAmount]);

  const activeCorridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];

  // Apply filters on option list returned by the engine
  const filteredOptions = options.filter(option => {
    const pid = option.resolved.provider_id;
    
    // 1. Transfer Method
    if (methodFilter !== 'all') {
      let method: 'wallet' | 'cash' | 'bank' = 'bank';
      if (pid === 'stc-pay' || pid === 'urpay' || pid === 'mobily-pay') {
        method = 'wallet';
      } else if (pid === 'enjaz' || pid === 'western-union') {
        method = 'cash';
      } else {
        method = 'bank';
      }
      if (methodFilter !== method) return false;
    }

    // 2. Provider Filter
    if (providerFilter !== 'all' && pid !== providerFilter) {
      return false;
    }

    // 3. Recommended Only option tab
    if (optionsTab === 'recommended') {
      const isBest = pid === recommendation?.best_provider_id;
      const isHighSis = option.sis.sis_score >= 80;
      if (!isBest && !isHighSis) return false;
    }

    // 4. Delivery Speed
    if (deliverySpeed === 'instant') {
      const isInstant = pid === 'stc-pay' || pid === 'urpay' || pid === 'mobily-pay';
      if (!isInstant) return false;
    }

    // 5. Provider Type
    if (providerType === 'wallet') {
      const isWallet = pid === 'stc-pay' || pid === 'urpay' || pid === 'mobily-pay';
      if (!isWallet) return false;
    } else if (providerType === 'bank') {
      const isBank = pid === 'al-rajhi' || pid === 'snb-quickpay' || pid === 'anb-telemoney';
      if (!isBank) return false;
    } else if (providerType === 'exchange') {
      const isExchange = pid === 'enjaz' || pid === 'western-union';
      if (!isExchange) return false;
    }

    return true;
  });

  // Sort filtered options based on selection
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (sortBy === 'value' || sortBy === 'received') {
      return b.netAmount - a.netAmount;
    } else if (sortBy === 'rate') {
      return b.resolved.resolved_rate - a.resolved.resolved_rate;
    } else if (sortBy === 'fee') {
      return a.resolved.transfer_fee - b.resolved.transfer_fee;
    } else if (sortBy === 'trusted') {
      return b.sis.sis_score - a.sis.sis_score;
    }
    return 0;
  });

  // For Mobile view: make sure recommended provider is always at the absolute top of the deck!
  const getMobileOrderedOptions = () => {
    const list = [...sortedOptions];
    if (sortBy !== 'value' && sortBy !== 'received') return list; // let deliberate custom sorting override
    if (!recommendation) return list;
    const bestIdx = list.findIndex(opt => opt.resolved.provider_id === recommendation.best_provider_id);
    if (bestIdx > 0) {
      const [bestItem] = list.splice(bestIdx, 1);
      list.unshift(bestItem);
    }
    return list;
  };

  const mobileOptions = getMobileOrderedOptions();

  const presets = [500, 1000, 1500, 2000, 5000];

  // Relativized time text
  const getRelativeTimeText = (isoString: string) => {
    if (!isoString) return language === 'en' ? 'Recently' : 'مؤخراً';
    const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (mins <= 1) return language === 'en' ? 'Just now' : 'الآن';
    if (mins < 60) return language === 'en' ? `${mins}m ago` : `منذ ${mins} د`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === 'en' ? `${hrs}h ago` : `منذ ${hrs} ساعة`;
    return language === 'en' ? 'Recently' : 'مؤخراً';
  };

  const getSourceBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'admin_override':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'community_verified':
        return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      case 'market_reference':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getTrueCostColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
      case 'good':
        return 'text-[#10B981]/80 bg-[#10B981]/5 border-[#10B981]/10';
      case 'fair':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      case 'poor':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getTrueCostLabel = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return isRtl ? 'تكلفة منخفضة جداً' : 'Low Cost';
      case 'good':
        return isRtl ? 'تكلفة عادلة' : 'Fair Cost';
      case 'fair':
        return isRtl ? 'تكلفة معتدلة' : 'Moderate';
      case 'poor':
        return isRtl ? 'تكلفة مرتفعة' : 'High Cost';
      default:
        return isRtl ? 'غير معروف' : 'Unknown';
    }
  };

  const getMethodIcon = (pid: string) => {
    if (pid === 'stc-pay' || pid === 'urpay' || pid === 'mobily-pay') {
      return <Wallet className="w-3.5 h-3.5 text-indigo-400" />;
    }
    if (pid === 'enjaz' || pid === 'western-union') {
      return <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />;
    }
    return <Landmark className="w-3.5 h-3.5 text-[#10B981]" />;
  };

  const getMethodLabel = (pid: string) => {
    if (pid === 'stc-pay' || pid === 'urpay' || pid === 'mobily-pay') {
      return t.mobileWallet;
    }
    if (pid === 'enjaz' || pid === 'western-union') {
      return t.cashPickup;
    }
    return t.bankTransfer;
  };

  // Compare Target Modal data resolver
  const renderComparisonDrawer = () => {
    if (!comparisonTargetId) return null;
    const targetOpt = options.find(o => o.resolved.provider_id === comparisonTargetId);
    const recOpt = recommendation ? options.find(o => o.resolved.provider_id === recommendation.best_provider_id) : null;
    
    if (!targetOpt) return null;

    const isTargetBest = recommendation?.best_provider_id === comparisonTargetId;

    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-sds-text">
        <div className="bg-[#0C2547] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-sds-border text-left">
          {/* Header */}
          <div className="bg-[#071A35] p-5 flex items-center justify-between border-b border-sds-border">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#10B981]">Decision Assistant COMPARISON</span>
              <h3 className="text-base font-black uppercase mt-0.5 text-white">Head-to-Head Matchup</h3>
            </div>
            <button 
              onClick={() => setComparisonTargetId(null)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-sds-text">
            {/* Direct head-to-head metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Selected Card */}
              <div className={`p-4 rounded-2xl border text-left ${isTargetBest ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'border-sds-border bg-[#091F3E]'}`}>
                <span className="text-[9px] font-black text-sds-text-sec uppercase tracking-widest block">Selected Option</span>
                <span className="text-base font-black text-white uppercase block mt-1">{targetOpt.resolved.provider_name}</span>
                <span className="text-xl font-black font-mono text-[#10B981] block mt-2">
                  {targetOpt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  <span className="text-xs font-bold text-sds-text-sec ml-1">{activeCorridor.currencyCode}</span>
                </span>
                <span className="text-[10px] text-sds-text-sec font-bold font-mono mt-1 block">{t.transferFee}: {targetOpt.resolved.transfer_fee} SAR</span>
                <span className="text-[10px] text-sds-text-sec font-bold block">{t.confidenceScore}: {targetOpt.sis.sis_score}%</span>
              </div>

              {/* Recommended Card */}
              {recOpt ? (
                <div className="p-4 rounded-2xl border border-[#F59E0B]/50 bg-[#F59E0B]/5 relative text-left">
                  <span className="absolute top-2 right-2 text-xs">⭐</span>
                  <span className="text-[9px] font-black text-[#F59E0B] uppercase tracking-widest block">{t.bestValue}</span>
                  <span className="text-base font-black text-white uppercase block mt-1">{recOpt.resolved.provider_name}</span>
                  <span className="text-xl font-black font-mono text-[#F59E0B] block mt-2">
                    {recOpt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    <span className="text-xs font-bold text-[#F59E0B] ml-1">{activeCorridor.currencyCode}</span>
                  </span>
                  <span className="text-[10px] text-sds-text-sec font-bold font-mono mt-1 block">{t.transferFee}: {recOpt.resolved.transfer_fee} SAR</span>
                  <span className="text-[10px] text-[#10B981] font-bold block">{t.confidenceScore}: {recOpt.sis.sis_score}%</span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-sds-border bg-[#091F3E] flex items-center justify-center text-center text-xs text-sds-text-sec">
                  {language === 'en' ? 'No recommended option loaded.' : 'لم يتم تحميل أي خيار موصى به.'}
                </div>
              )}
            </div>

            {/* Verdict and Smart Savings Analysis */}
            {recOpt && !isTargetBest && (
              <div className="p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-2xl flex items-start gap-3 text-left">
                <span className="text-xl">💡</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[#F59E0B] uppercase">{language === 'en' ? 'Smart Recommendation' : 'توصية ذكية'}</h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                    {slf.formatRecommendationReason({
                      recommendedProvider: recOpt.resolved.provider_name,
                      targetProvider: targetOpt.resolved.provider_name,
                      savingsAmount: recOpt.netAmount - targetOpt.netAmount,
                      currencyCode: activeCorridor.currencyCode,
                      sarEquivalent: (recOpt.netAmount - targetOpt.netAmount) / activeCorridor.baseExchangeRate,
                      lang: language
                    })}
                  </p>
                </div>
              </div>
            )}

            {isTargetBest && (
              <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl flex items-start gap-3 text-left">
                <span className="text-xl">✅</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-[#10B981] uppercase">{language === 'en' ? 'Optimal Choice Selected!' : 'تم اختيار الخيار الأمثل!'}</h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                    {language === 'en' 
                      ? `${targetOpt.resolved.provider_name} offers the highest net return and the lowest total cost today, backed by an Excellent Confidence Rating.`
                      : `يقدم ${targetOpt.resolved.provider_name} أعلى عائد صافي وأقل تكلفة إجمالية اليوم، مدعوماً بتقييم ثقة ممتاز.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#071A35] p-4 border-t border-sds-border flex justify-end gap-3">
            <button 
              onClick={() => setComparisonTargetId(null)}
              className="px-4 py-2 bg-[#091F3E] hover:bg-[#0c2547] text-slate-300 border border-sds-border font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
            >
              Dismiss
            </button>
            <button 
              onClick={() => {
                setComparisonTargetId(null);
                if (setActiveTab) setActiveTab('submit');
              }}
              className="px-4 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md"
            >
              Verify This Rate
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { label: isRtl ? 'ثقة عالية جداً' : 'Very High', color: 'text-emerald-400' };
    if (score >= 75) return { label: isRtl ? 'ثقة عالية' : 'High', color: 'text-emerald-500' };
    if (score >= 60) return { label: isRtl ? 'ثقة متوسطة' : 'Moderate', color: 'text-amber-500' };
    if (score >= 40) return { label: isRtl ? 'ثقة محدودة' : 'Limited', color: 'text-orange-500' };
    return { label: isRtl ? 'ثقة منخفضة' : 'Low', color: 'text-rose-500' };
  };

  const getWhyThisOption = (opt: any, isBestValue: boolean) => {
    const reasons: string[] = [];
    if (isBestValue) {
      reasons.push(isRtl ? 'أعلى عائد متوقع اليوم' : 'Highest estimated payout');
    }
    if (opt.resolved.transfer_fee <= 5) {
      reasons.push(isRtl ? 'رسوم تحويل منخفضة' : 'Low transfer fee');
    }
    const mins = Math.floor((Date.now() - new Date(opt.resolved.last_updated).getTime()) / 60000);
    if (mins < 60) {
      reasons.push(isRtl ? 'تحديث فوري' : 'Updated recently');
    } else if (opt.resolved.source_type === 'community_verified' || opt.resolved.source_type === 'admin_override') {
      reasons.push(isRtl ? 'سعر صرف مؤكد' : 'Verified rate');
    }
    if (opt.sis.sis_score >= 80) {
      reasons.push(isRtl ? 'ثقة سوقية قوية' : 'Strong market confidence');
    }
    if (reasons.length < 2) {
      reasons.push(isRtl ? 'قناة تحويل موثوقة' : 'Reliable channel');
    }
    return reasons.slice(0, 3);
  };

  const getValueLabel = (opt: any, bestAmount: number) => {
    if (opt.resolved.provider_id === recommendation?.best_provider_id) {
      return isRtl ? 'القيمة: الأفضل' : 'Value: Best';
    }
    const pct = opt.netAmount / bestAmount;
    if (pct >= 0.99) return isRtl ? 'القيمة: ممتازة' : 'Value: Strong';
    if (pct >= 0.96) return isRtl ? 'القيمة: جيدة' : 'Value: Good';
    if (pct >= 0.92) return isRtl ? 'القيمة: مقبولة' : 'Value: Fair';
    return isRtl ? 'القيمة: محدودة' : 'Value: Limited';
  };

  const getFreshnessLabel = (opt: any) => {
    const relativeTime = getRelativeTimeText(opt.resolved.last_updated);
    if (opt.resolved.source_type === 'community_verified' || opt.resolved.source_type === 'admin_override') {
      return isRtl ? `تم التأكيد ${relativeTime}` : `Verified ${relativeTime}`;
    }
    if (opt.resolved.source_type === 'market_reference') {
      return isRtl ? `تقدير السوق ${relativeTime}` : `Market estimate updated ${relativeTime}`;
    }
    return isRtl ? `تم التحديث ${relativeTime}` : `Updated ${relativeTime}`;
  };

  const getSourceLabelHuman = (sourceType: string) => {
    switch (sourceType) {
      case 'admin_override':
        return isRtl ? 'معتمد رسمياً' : 'Management Verified';
      case 'community_verified':
        return isRtl ? 'مؤكد مجتمعياً' : 'Community Verified';
      case 'market_reference':
        return isRtl ? 'تقدير السوق' : 'Market Estimate';
      case 'verified_channel_rate':
        return isRtl ? 'سعر صرف معتمد' : 'Verified Provider Rate';
      case 'last_known_valid':
        return isRtl ? 'آخر تقدير متوفر' : 'Latest Available Estimate';
      default:
        return isRtl ? 'تقدير ساري اليوم' : 'Sari Estimate';
    }
  };

  const renderSavingsInsight = () => {
    if (loading || !recommendation || !options.length) return null;
    
    // Find current best provider's name
    const bestProvName = recommendation.best_provider_name;
    const bestSavings = recommendation.estimated_savings;
    const currency = activeCorridor.currencyCode;
    
    // Annual projection calculation
    const annualProjection = bestSavings * 12;
    
    return (
      <div className="bg-gradient-to-r from-emerald-950/40 via-[#0C2547] to-emerald-950/40 border border-[#10B981]/25 p-4 rounded-2xl shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#10B981]/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">
              {isRtl ? 'رؤية التوفير اليوم' : "Today's Savings Insight"}
            </h4>
            <p className="text-xs text-white font-medium leading-relaxed">
              {isRtl ? (
                <>
                  يمكن لـ <span className="text-[#10B981] font-bold">{bestProvName}</span> أن يوفر لك حوالي <span className="text-[#10B981] font-extrabold">{bestSavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} {currency}</span> أكثر من متوسط السوق اليوم عند تحويل {sendAmount} ريال سعودي.
                </>
              ) : (
                <>
                  <span className="text-[#10B981] font-bold">{bestProvName}</span> could deliver about <span className="text-[#10B981] font-extrabold">{bestSavings.toLocaleString(undefined, { maximumFractionDigits: 1 })} {currency}</span> more than the current average for a {sendAmount} SAR transfer.
                </>
              )}
            </p>
            <p className="text-[10px] text-sds-text-sec font-semibold mt-1">
              {isRtl ? (
                <>
                  * بناءً على حجم التحويل المعتاد، يمكن أن يصل هذا التوفير إلى حوالي <span className="text-[#10B981] font-bold">{annualProjection.toLocaleString(undefined, { maximumFractionDigits: 1 })} {currency}</span> على مدار 12 شهراً القادمة (تقديري).
                </>
              ) : (
                <>
                  * At the same monthly frequency, this difference could add up to about <span className="text-[#10B981] font-bold">{annualProjection.toLocaleString(undefined, { maximumFractionDigits: 1 })} {currency}</span> over 12 months (Estimated).
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 pb-24 text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn`}>
      
      {/* SDS 3.0 BREADCRUMB & HEADER */}
      <div className="text-left space-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
          {isRtl ? 'مقارنة > النتائج الفورية' : 'Compare > Results'}
        </span>
        <h1 className="text-2xl md:text-3xl font-sans font-black text-white tracking-tight">
          {isRtl ? 'مقارنة خيارات التحويل المالي ✨' : 'Compare remittance options ✨'}
        </h1>
        <p className="text-xs text-sds-text-sec font-semibold">
          {isRtl 
            ? 'أسعار صرف حقيقية. شفافية تامة للرسوم. قرارات ذكية.' 
            : 'Real rates. Total transparency. Smarter decisions.'}
        </p>
      </div>

      {/* SDS 3.0 HORIZONTAL SEND WIDGET */}
      <div className="bg-[#0C2547] p-5 sm:p-6 rounded-3xl text-white shadow-sds-lg border border-sds-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          {/* Item 1: You send */}
          <div className="md:col-span-4 space-y-2 text-left">
            <label className={`block text-[10px] font-black text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? 'أنت ترسل' : 'You send'}
            </label>
            <div className="relative">
              <input
                type="number"
                id="compare-send-amount-input"
                value={sendAmount}
                onChange={(e) => setSendAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full pl-4 pr-16 py-3 bg-[#071A35] border border-sds-border rounded-xl font-black font-mono text-lg text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0C2547] px-2.5 py-1 rounded-lg border border-sds-border text-xs font-black font-mono text-white">
                <span>🇸🇦</span>
                <span>SAR</span>
              </div>
            </div>
          </div>

          {/* Item 2: They receive */}
          <div className="md:col-span-4 space-y-2 text-left">
            <label className={`block text-[10px] font-black text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? 'المستلم يحصل على (تقريبي)' : 'They receive'}
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={recommendation ? (sendAmount * recommendation.resolved_exchange_rate).toLocaleString(undefined, { maximumFractionDigits: 1 }) : (sendAmount * activeCorridor.baseExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                className="w-full pl-4 pr-16 py-3 bg-[#071A35]/60 border border-sds-border/60 rounded-xl font-black font-mono text-lg text-slate-400 select-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0C2547] px-2.5 py-1 rounded-lg border border-sds-border text-xs font-black font-mono text-white">
                <span>{activeCorridor.flag}</span>
                <span>{activeCorridor.currencyCode}</span>
              </div>
            </div>
          </div>

          {/* Item 3: Destination Corridor select */}
          <div className="md:col-span-4 space-y-2 text-left">
            <label className={`block text-[10px] font-black text-slate-400 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? 'وجهة التحويل' : 'Destination'}
            </label>
            <select
              id="compare-corridor-select"
              value={corridorId}
              onChange={(e) => setCorridorId(e.target.value)}
              className="w-full px-4 py-3 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer h-[48px]"
            >
              {CORRIDORS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#071A35] text-slate-850 font-bold">
                  {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr} ({c.currencyCode})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick Presets row & Checklist bullets underneath */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-3 border-t border-slate-800/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{isRtl ? 'المبالغ الشائعة:' : 'Quick Presets:'}</span>
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setSendAmount(p)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                  sendAmount === p
                    ? 'bg-[#10B981] border-[#10B981] text-[#071A35] shadow-xs'
                    : 'bg-[#071A35] border-sds-border text-slate-300 hover:bg-[#071A35]/80'
                }`}
              >
                {p} SAR
              </button>
            ))}
          </div>

          {/* Verification bullets */}
          <div className="flex flex-wrap items-center gap-3.5 text-[10px] sm:text-[11px] text-[#10B981] font-extrabold">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isRtl ? 'شامل كل الرسوم والضرائب' : 'All fees & taxes included'}</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isRtl ? 'تحديث فوري بالدقيقة' : 'Real-time rates'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isRtl ? 'موثق مجتمعياً' : 'Crowdsourced verifications'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Head-to-Head matchup overlay drawer */}
      {renderComparisonDrawer()}

      {/* 3. DUAL-COLUMN BENTO GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#0C2547] border-t-[#10B981] rounded-full animate-spin mx-auto"></div>
          <p className="text-sds-text-sec text-xs font-black uppercase tracking-wider font-mono">
            {language === 'en' ? "Running Rate Resolution Engine (RRE)..." : "جاري تشغيل محرك أسعار الصرف (RRE)..."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          
          {/* LEFT PANEL: RESULTS DECK (Col span 9) */}
          <div className="lg:col-span-9 space-y-5">
            
            {/* Top Options Tabs Selector */}
            <div className="flex bg-[#0C2547] p-1 rounded-2xl border border-sds-border w-fit">
              <button
                onClick={() => setOptionsTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  optionsTab === 'all'
                    ? 'bg-[#10B981] text-[#071A35] font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{isRtl ? 'كل الخيارات' : 'All Options'}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${optionsTab === 'all' ? 'bg-[#071A35]/20 text-[#071A35]' : 'bg-slate-850 text-slate-400'}`}>
                  {options.length}
                </span>
              </button>
              <button
                onClick={() => setOptionsTab('recommended')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  optionsTab === 'recommended'
                    ? 'bg-[#10B981] text-[#071A35] font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>⭐ {isRtl ? 'الموصى بها فقط' : 'Recommended Only'}</span>
              </button>
            </div>

            {/* Results Sort header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-b border-sds-border/45 pb-3 text-left">
              <div>
                <span className="text-sm font-black text-white uppercase tracking-wide">
                  {filteredOptions.length} {language === 'en' ? 'verified remittance channels active' : 'قنوات تحويل مؤكدة ونشطة'}
                </span>
                <p className="text-xs text-sds-text-sec font-medium">
                  {language === 'en' ? "RRE resolved with live wallet indices and crowdsourced expat validations." : "تم تحديث المقارنة بالأسعار الفورية وتقارير المغتربين الموثقة."}
                </p>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-sds-text-sec font-black uppercase tracking-wider flex items-center gap-1 shrink-0 font-mono">
                  <ArrowUpDown className="w-3 h-3 text-[#10B981]" /> {isRtl ? 'ترتيب حسب:' : 'Sort by:'}
                </span>
                <div className="flex bg-[#0C2547] p-0.5 rounded-xl border border-sds-border text-[10px] font-black uppercase">
                  <button
                    onClick={() => setSortBy('value')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black ${
                      sortBy === 'value' ? 'bg-[#10B981] text-[#071A35] shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Best Value
                  </button>
                  <button
                    onClick={() => setSortBy('received')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black ${
                      sortBy === 'received' ? 'bg-[#10B981] text-[#071A35] shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Highest Payout
                  </button>
                  <button
                    onClick={() => setSortBy('rate')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black ${
                      sortBy === 'rate' ? 'bg-[#10B981] text-[#071A35] shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Best Rate
                  </button>
                  <button
                    onClick={() => setSortBy('fee')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black ${
                      sortBy === 'fee' ? 'bg-[#10B981] text-[#071A35] shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lowest Fee
                  </button>
                </div>
              </div>
            </div>

          {/* DUAL SCREEN RESPONSIVE CARD DECK */}
          {isMobile ? (
            // MOBILE COMPACT VIEW
            <div className="space-y-4">
              {mobileOptions.length === 0 ? (
                <div className="bg-[#0C2547] p-10 text-center rounded-3xl border border-dashed border-sds-border">
                  <ShieldAlert className="w-10 h-10 text-sds-text-sec mx-auto" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest mt-3">No matching providers found</h3>
                  <p className="text-[11px] text-sds-text-sec mt-1 font-semibold">Try relaxing your filters or selecting another target corridor.</p>
                </div>
              ) : (
                (() => {
                  const bestOpt = options.find(o => o.resolved.provider_id === recommendation?.best_provider_id);
                  const bestNetAmount = bestOpt ? bestOpt.netAmount : (recommendation?.net_recipient_amount || 0);

                  return mobileOptions.map((opt) => {
                    const isBestValue = opt.resolved.provider_id === recommendation?.best_provider_id;
                    const isExpanded = expandedSisId === opt.resolved.id;
                    const diff = bestNetAmount - opt.netAmount;

                    return (
                      <div 
                        key={opt.resolved.provider_id}
                        className={`bg-[#0C2547] rounded-3xl border transition-all ${
                          isBestValue 
                            ? 'border-amber-500/60 ring-4 ring-amber-500/10 shadow-lg bg-gradient-to-b from-[#0e2c53] to-[#0C2547]' 
                            : 'border-sds-border hover:border-sds-border/80 shadow-xs'
                        } overflow-hidden`}
                      >
                        {/* Optimal Recommended badge banner */}
                        {isBestValue && (
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-[#071A35] text-[10px] font-black px-4 py-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <span>⭐</span>
                            <span>{isRtl ? 'الخيار الأفضل اليوم' : "TODAY'S BEST RECOMMENDED OPTION"}</span>
                          </div>
                        )}

                        <div className="p-4 space-y-4">
                          {/* Header section: Provider identity & Value Badge */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2.5">
                              <ProviderLogo channel={{ ...opt.resolved, providerCode: opt.resolved.provider_id, displayName: opt.resolved.provider_name }} size="md" shape="circle" surface="dark" />
                              <div className="text-left">
                                <h4 className="font-black text-white text-sm uppercase leading-none tracking-tight">
                                  {opt.resolved.provider_name}
                                </h4>
                                <div className="flex items-center gap-1 mt-1">
                                  {getMethodIcon(opt.resolved.provider_id)}
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                    {getMethodLabel(opt.resolved.provider_id)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Labelled Value Badge */}
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-black border rounded-lg uppercase tracking-wider bg-[#071A35] ${isBestValue ? 'border-amber-500/30 text-amber-400' : 'border-sds-border text-[#10B981]'}`}>
                              {getValueLabel(opt, bestNetAmount)}
                            </span>
                          </div>

                          {/* 2. Visual Recipient Payout Area */}
                          <div className="bg-[#071A35] rounded-2xl p-4 border border-sds-border/50 text-left space-y-1">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none">
                              {isRtl ? 'المبلغ المستلم للمستفيد' : 'They Receive'}
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="font-mono text-3xl font-black text-[#10B981] tracking-tight">
                                {opt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              </span>
                              <span className="text-sm font-black text-white font-mono uppercase">
                                {activeCorridor.currencyCode}
                              </span>
                            </div>
                            
                            {/* Estimated savings story difference line */}
                            <div className="text-[10px] font-bold text-slate-300 pt-1 flex items-center gap-1.5">
                              <span className={isBestValue ? 'text-amber-400' : 'text-slate-400'}>●</span>
                              <span>
                                {isBestValue ? (
                                  isRtl ? (
                                    `حوالي ${recommendation?.estimated_savings.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode} أكثر من متوسط السوق اليوم`
                                  ) : (
                                    `About ${recommendation?.estimated_savings.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode} more than current average`
                                  )
                                ) : (
                                  isRtl ? (
                                    `حوالي ${diff.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode} أقل من خيار الأفضل اليوم`
                                  ) : (
                                    `About ${diff.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode} less than today's best option`
                                  )
                                )}
                              </span>
                            </div>
                          </div>

                          {/* 3. Rate & Fee Row */}
                          <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="p-2.5 bg-[#071A35]/40 border border-sds-border/40 rounded-xl">
                              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">
                                {isRtl ? 'سعر الصرف' : "Today's Rate"}
                              </span>
                              <span className="font-mono text-sm font-black text-white block mt-0.5">
                                {opt.resolved.resolved_rate} <span className="text-[9px] text-slate-400">{activeCorridor.currencyCode}</span>
                              </span>
                            </div>
                            <div className="p-2.5 bg-[#071A35]/40 border border-sds-border/40 rounded-xl">
                              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">
                                {isRtl ? 'رسوم التحويل' : 'Transfer Fee'}
                              </span>
                              <span className="font-mono text-sm font-black text-white block mt-0.5">
                                {opt.resolved.transfer_fee === 0 ? (isRtl ? 'مجاناً' : 'FREE') : `${opt.resolved.transfer_fee} SAR`}
                              </span>
                            </div>
                          </div>

                          {/* 4. Confidence Badge & Helper */}
                          <div className="p-3 bg-[#071A35]/60 rounded-xl border border-sds-border/40 space-y-1 text-left">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              <ShieldAlert className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>{isRtl ? 'مستوى الثقة:' : 'Confidence Level:'}</span>
                              <span className={getConfidenceLevel(opt.sis.sis_score).color}>
                                {getConfidenceLevel(opt.sis.sis_score).label} ({opt.sis.sis_score}%)
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400/80 font-medium leading-tight">
                              {isRtl ? 'يوضح مدى موثوقية وحداثة هذه البيانات المستخرجة.' : 'This shows how reliable and recent the extracted data is.'}
                            </p>
                          </div>

                          {/* 5. Freshness & Source */}
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span>{getFreshnessLabel(opt)}</span>
                            <span className="px-1.5 py-0.5 bg-[#071A35] border border-sds-border/50 rounded-md text-[8px] font-black uppercase">
                              {getSourceLabelHuman(opt.resolved.source_type)}
                            </span>
                          </div>

                          {/* 6. Why This Option? row of bullets */}
                          <div className="bg-emerald-950/15 border border-[#10B981]/10 px-3 py-2 rounded-xl text-left flex items-center gap-2">
                            <span className="text-xs">✨</span>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">
                              {getWhyThisOption(opt, isBestValue).join('  ·  ')}
                            </span>
                          </div>

                          {/* 7. Action Buttons */}
                          <div className="pt-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2.5">
                              <button
                                type="button"
                                onClick={() => setComparisonTargetId(opt.resolved.provider_id)}
                                className="flex-1 py-3 bg-[#071A35] hover:bg-[#091f3e] border border-sds-border text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center h-[44px]"
                              >
                                {isRtl ? 'تحليل ومقارنة' : 'Compare'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setExpandedSisId(isExpanded ? null : opt.resolved.id)}
                                className="flex-1 py-3 bg-[#071A35] border border-sds-border text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1 h-[44px]"
                              >
                                <span>{isExpanded ? (isRtl ? 'إخفاء التفاصيل' : 'Hide Details') : (isRtl ? 'تفاصيل أكثر' : 'More Details')}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {user && (
                              <button
                                type="button"
                                onClick={() => setRecordTransferOption(opt)}
                                className="w-full py-3.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black text-[11px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm h-[44px]"
                              >
                                <Award className="w-4 h-4" />
                                <span>{isRtl ? 'تسجيل هذا التحويل المالي' : 'Record Transfer'}</span>
                              </button>
                            )}
                          </div>

                          {/* Expanded detail accordion panel */}
                          {isExpanded && (
                            <div className="pt-4 border-t border-sds-border/60 space-y-4 animate-fadeIn text-slate-400 text-xs text-left">
                              <div className="bg-[#071A35] rounded-2xl p-3 border border-sds-border space-y-3">
                                <h5 className="font-black text-[9px] text-[#F59E0B] uppercase tracking-widest leading-none">
                                  {isRtl ? 'تفاصيل التكلفة ومؤشرات ساري' : 'Cost Breakdown & Indicators'}
                                </h5>
                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                  <div className="space-y-0.5">
                                    <span className="text-slate-400 block">{isRtl ? "سعر صرف اليوم:" : "Today's Rate:"}</span>
                                    <span className="font-mono text-white font-bold">{opt.resolved.resolved_rate} {activeCorridor.currencyCode}</span>
                                  </div>
                                  <div className="space-y-0.5 text-right">
                                    <span className="text-slate-400 block">{isRtl ? "رسوم التحويل:" : "Transfer Fee:"}</span>
                                    <span className="font-mono text-white font-bold">{opt.resolved.transfer_fee} SAR</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-slate-400 block">{isRtl ? "ضريبة القيمة المضافة والمصاريف:" : "VAT & Other Charges:"}</span>
                                    <span className="font-mono text-white font-bold">{opt.trueCost?.vatAmount || 0} SAR</span>
                                  </div>
                                  <div className="space-y-0.5 text-right">
                                    <span className="text-slate-400 block">{isRtl ? "التكلفة الإجمالية:" : "Total Cost:"}</span>
                                    <span className="font-mono text-[#10B981] font-bold">{(opt.resolved.transfer_fee + (opt.trueCost?.vatAmount || 0))} SAR</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-slate-400 block">{isRtl ? "العائد المتوقع للمستلم:" : "Expected Recipient Amount:"}</span>
                                    <span className="font-mono text-[#10B981] font-bold">{opt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} {activeCorridor.currencyCode}</span>
                                  </div>
                                  <div className="space-y-0.5 text-right">
                                    <span className="text-slate-400 block">{isRtl ? "التوفير المتوقع:" : "Estimated Savings:"}</span>
                                    <span className="font-mono text-[#10B981] font-bold">
                                      {isBestValue 
                                        ? `+${recommendation?.estimated_savings.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode}`
                                        : `-${(bestNetAmount - opt.netAmount).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeCorridor.currencyCode}`
                                      }
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-slate-400 block">{isRtl ? "مصدر السعر والتحقق:" : "Rate Source:"}</span>
                                    <span className="text-white font-bold">{getSourceLabelHuman(opt.resolved.source_type)}</span>
                                  </div>
                                  <div className="space-y-0.5 text-right">
                                    <span className="text-slate-400 block">{isRtl ? "آخر تحديث:" : "Last Updated:"}</span>
                                    <span className="text-white font-bold">{getRelativeTimeText(opt.resolved.last_updated)}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-sds-border/40 space-y-2">
                                  <span className="font-black text-[9px] text-[#F59E0B] uppercase tracking-widest leading-none block">
                                    {isRtl ? 'مؤشرات الأداء الثنائية (SIS)' : 'Sari Intelligence Indicators (SIS)'}
                                  </span>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Rate Advantage</span>
                                        <span className="font-mono text-white">{opt.sis.rate_advantage_score}/100</span>
                                      </div>
                                      <div className="w-full h-1 bg-[#071A35] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#10B981]" style={{ width: `${opt.sis.rate_advantage_score}%` }}></div>
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Fee Advantage</span>
                                        <span className="font-mono text-white">{opt.sis.fee_advantage_score}/100</span>
                                      </div>
                                      <div className="w-full h-1 bg-[#071A35] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#10B981]" style={{ width: `${opt.sis.fee_advantage_score}%` }}></div>
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Comparison Confidence</span>
                                        <span className="font-mono text-white">{opt.sis.true_cost_score ?? 80}/100</span>
                                      </div>
                                      <div className="w-full h-1 bg-[#071A35] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#F59E0B]" style={{ width: `${opt.sis.true_cost_score ?? 80}%` }}></div>
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Freshness Indicator</span>
                                        <span className="font-mono text-white">{opt.sis.freshness_score}/100</span>
                                      </div>
                                      <div className="w-full h-1 bg-[#071A35] rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${opt.sis.freshness_score}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          ) : (
            // DESKTOP: BENTO DECK & TABLE LAYOUT
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Provider cards (Col span 8) */}
              <div className="lg:col-span-8 space-y-4">
                {sortedOptions.length === 0 ? (
                  <div className="bg-[#0C2547] p-12 text-center rounded-3xl border border-dashed border-sds-border">
                    <ShieldAlert className="w-10 h-10 text-sds-text-sec mx-auto" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mt-3">No matching providers found</h3>
                    <p className="text-xs text-sds-text-sec mt-1">Try relaxing your filters or selecting another destination.</p>
                  </div>
                ) : (
                  sortedOptions.map((opt) => {
                    const isBestValue = opt.resolved.provider_id === recommendation?.best_provider_id;
                    const isExpanded = expandedSisId === opt.resolved.id;

                    return (
                      <div 
                        key={opt.resolved.provider_id}
                        className={`bg-[#0C2547] rounded-3xl border transition-all ${
                          isBestValue 
                            ? 'border-amber-500/60 ring-2 ring-amber-500/10 shadow-lg bg-gradient-to-b from-[#0e2c53] to-[#0C2547]' 
                            : 'border-sds-border hover:border-sds-border/80 shadow-xs'
                        }`}
                      >
                        {/* Best Value Header */}
                        {isBestValue && (
                          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-[#071A35] text-[10px] font-black px-4 py-1.5 rounded-t-xl uppercase tracking-widest flex items-center gap-1.5">
                            <span>⭐</span>
                            <span>{isRtl ? 'خيار موصى به اليوم (أفضل قيمة)' : 'OPTIMAL RECOMMENDED OPTION TODAY (BEST VALUE)'}</span>
                          </div>
                        )}

                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                            
                            {/* Logo and details */}
                            <div className="lg:col-span-4 flex items-center gap-3.5 text-left">
                              <ProviderLogo channel={{ ...opt.resolved, providerCode: opt.resolved.provider_id, displayName: opt.resolved.provider_name }} size="md" shape="rounded" surface="dark" />
                              <div>
                                <h4 className="font-extrabold text-white text-base leading-tight uppercase tracking-tight">
                                  {opt.resolved.provider_name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {getMethodIcon(opt.resolved.provider_id)}
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    {getMethodLabel(opt.resolved.provider_id)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Rates, Payouts, Fees */}
                            <div className="lg:col-span-5 grid grid-cols-2 gap-4 text-left">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest">Exchange Rate</span>
                                <div className="flex items-baseline gap-0.5 mt-1 font-mono text-white">
                                  <span className="text-base font-black">{opt.resolved.resolved_rate}</span>
                                  <span className="text-[10px] text-slate-400 ml-1">{activeCorridor.currencyCode}</span>
                                </div>
                                <span className={`text-[9px] font-semibold mt-1 block ${opt.resolved.transfer_fee === 0 ? 'text-[#10B981]' : 'text-slate-400'}`}>
                                  {opt.resolved.transfer_fee === 0 ? 'FREE TRANSFER' : `Fee: ${opt.resolved.transfer_fee} SAR`}
                                </span>
                              </div>

                              <div className="text-right pr-2">
                                <span className="text-[9px] font-black text-[#10B981] block uppercase tracking-widest">Net Recipient</span>
                                <div className="flex justify-end items-baseline gap-0.5 mt-1 font-mono text-white">
                                  <span className="text-lg font-black">{opt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                  <span className="text-xs text-[#10B981] font-bold ml-1">{activeCorridor.currencyCode}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="lg:col-span-3 flex flex-col gap-1.5 shrink-0">
                              <button
                                onClick={() => setComparisonTargetId(opt.resolved.provider_id)}
                                className="w-full py-2 bg-[#071A35] hover:bg-[#091f3e] border border-sds-border text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                              >
                                Head-to-Head Compare
                              </button>

                              <button
                                onClick={() => setExpandedSisId(isExpanded ? null : opt.resolved.id)}
                                className="w-full py-2 bg-[#071A35] hover:bg-[#091f3e] border border-sds-border text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {user && (
                                <button
                                  type="button"
                                  onClick={() => setRecordTransferOption(opt)}
                                  className="w-full py-2 bg-[#10B981] hover:bg-[#0ea271] text-[#071A35] font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>{isRtl ? 'تسجيل التحويل' : 'Record Transfer'}</span>
                                </button>
                              )}
                            </div>

                          </div>

                          {/* Expanded detail accordion panel */}
                          {isExpanded && (
                            <div className="pt-4 border-t border-sds-border/60 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                              {/* Confidence indicators */}
                              <div className="lg:col-span-7 space-y-4">
                                <h5 className="font-extrabold text-[#F59E0B] text-[10px] uppercase tracking-widest">
                                  {language === 'en' ? 'Confidence Metrics (0-100)' : 'مقاييس الثقة (٠-١٠٠)'}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1 text-left">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Rate Advantage</span>
                                      <span className="font-mono text-white">{opt.sis.rate_advantage_score}/100</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#071A35] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#10B981]" style={{ width: `${opt.sis.rate_advantage_score}%` }}></div>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Fee Advantage</span>
                                      <span className="font-mono text-white">{opt.sis.fee_advantage_score}/100</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#071A35] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#10B981]" style={{ width: `${opt.sis.fee_advantage_score}%` }}></div>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Comparison Confidence</span>
                                      <span className="font-mono text-white">{opt.sis.true_cost_score ?? 85}/100</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#071A35] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#F59E0B]" style={{ width: `${opt.sis.true_cost_score ?? 85}%` }}></div>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span>Freshness Score</span>
                                      <span className="font-mono text-white">{opt.sis.freshness_score}/100</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#071A35] rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${opt.sis.freshness_score}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* True Cost Explanation */}
                              <div className="lg:col-span-5 bg-[#071A35] p-4 rounded-2xl border border-sds-border text-[11px] font-mono space-y-2">
                                <h6 className="font-black font-sans text-white uppercase text-[9px] tracking-wider border-b border-sds-border/60 pb-1.5">
                                  What You'll Really Pay
                                </h6>
                                {opt.trueCost ? (
                                  <div className="space-y-1.5 text-slate-300">
                                    <div className="flex justify-between">
                                      <span>Transfer Fee & VAT:</span>
                                      <span className="text-white font-bold">{opt.trueCost.visibleFees.toFixed(2)} SAR</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Exchange Rate Difference:</span>
                                      <span className="text-rose-400 font-bold">{opt.trueCost.exchangeRateLoss?.toFixed(1) ?? '0.0'} {activeCorridor.currencyCode}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-sds-border/40 pt-1 text-[#10B981] font-black">
                                      <span>Total Cost:</span>
                                      <span>{opt.trueCost.trueCost ? `${opt.trueCost.trueCost.toFixed(1)} ${activeCorridor.currencyCode}` : `${(opt.trueCost.visibleFees * opt.resolved.resolved_rate).toFixed(1)} ${activeCorridor.currencyCode}`}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-400 italic text-[10px]">No dynamic cost breakdown compiled today.</p>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar contribution / verify rates widget (Col span 3) */}
              <div className="lg:col-span-3 space-y-6 text-left">
                
                {/* Active Expat Reports mini widget */}
                <div className="bg-[#0C2547] p-5 rounded-3xl border border-sds-border space-y-4">
                  <div className="flex items-center gap-2 border-b border-sds-border/60 pb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">
                      {isRtl ? 'حالة التوثيق المباشرة' : 'ACTIVE EXPAT VERIFICATIONS'}
                    </h3>
                  </div>
                  <p className="text-xs text-sds-text-sec leading-relaxed">
                    Our rates are actively validated by expatriates. Spot an error or a better rate? Contribute and verify!
                  </p>
                  
                  {setActiveTab && (
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Contribute & Verify Rate' : 'وثّق سعر صرف جديد'}</span>
                    </button>
                  )}
                </div>

                {/* Corridor Insights Mini Widget */}
                <div className="bg-[#0C2547] p-5 rounded-3xl border border-sds-border space-y-4">
                  <div className="flex items-center gap-2 border-b border-sds-border/60 pb-2.5">
                    <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">
                      {isRtl ? 'رؤى سريعة' : 'CORRIDOR INSIGHTS'}
                    </h3>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center text-sds-text-sec">
                      <span>Forex Market Index:</span>
                      <span className="text-[#10B981] font-bold font-mono">+0.4% Upward</span>
                    </div>
                    <div className="flex justify-between items-center text-sds-text-sec">
                      <span>Primary Mode today:</span>
                      <span className="text-white font-bold">Mobile Wallets</span>
                    </div>
                    <div className="flex justify-between items-center text-sds-text-sec">
                      <span>Expat Validation Count:</span>
                      <span className="text-[#F59E0B] font-bold font-mono">148 validations</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
          </div>
        </div>

          {/* 4. COMPARISON MATRIX (Tabular Head-to-Head Table) */}
          {!isMobile && sortedOptions.length > 0 && (
            <div className="pt-6 text-left">
              <SDSCard padding="md" variant="shadow" className="border border-sds-border space-y-4">
                <div className="flex items-center gap-2 border-b border-sds-border/60 pb-3">
                  <ArrowLeftRight className="w-4 h-4 text-[#F59E0B]" />
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">
                      {isRtl ? 'مصفوفة المقارنة الشاملة' : 'SARIREMIT COMPARISON MATRIX'}
                    </h3>
                    <p className="text-[10px] text-sds-text-sec">Quick head-to-head parameters overview</p>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-sds-border/60 text-sds-text-sec uppercase text-[10px] font-black font-mono">
                        <th className="py-2.5 pr-4">Provider</th>
                        <th className="py-2.5">Channel Type</th>
                        <th className="py-2.5">Exchange Rate</th>
                        <th className="py-2.5">Transfer Fee</th>
                        <th className="py-2.5 text-right">Expected Payout</th>
                        <th className="py-2.5 text-right">Confidence Score</th>
                        <th className="py-2.5 text-right pl-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sds-border/40">
                      {sortedOptions.map((opt) => {
                        const isBestValue = opt.resolved.provider_id === recommendation?.best_provider_id;
                        return (
                          <tr 
                            key={opt.resolved.provider_id} 
                            className={`hover:bg-[#071A35]/40 transition-colors ${isBestValue ? 'bg-[#10B981]/5 text-white font-semibold' : ''}`}
                          >
                            <td className="py-3 pr-4 font-bold text-white flex items-center gap-2">
                              {isBestValue && <span className="text-xs">⭐</span>}
                              {opt.resolved.provider_name}
                            </td>
                            <td className="py-3 uppercase text-[10px] font-bold text-sds-text-sec">
                              {getMethodLabel(opt.resolved.provider_id)}
                            </td>
                            <td className="py-3 font-mono text-white font-bold">
                              {opt.resolved.resolved_rate} {activeCorridor.currencyCode}
                            </td>
                            <td className="py-3 font-mono text-sds-text-sec">
                              {opt.resolved.transfer_fee === 0 ? <span className="text-[#10B981] font-black uppercase text-[10px]">Free</span> : `${opt.resolved.transfer_fee} SAR`}
                            </td>
                            <td className="py-3 text-right font-mono text-[#10B981] font-black">
                              {opt.netAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} {activeCorridor.currencyCode}
                            </td>
                            <td className="py-3 text-right">
                              <span className="font-bold text-white font-mono">{opt.sis.sis_score}%</span>
                            </td>
                            <td className="py-3 text-right pl-4">
                              <button
                                onClick={() => setComparisonTargetId(opt.resolved.provider_id)}
                                className="px-3 py-1 bg-[#071A35] hover:bg-[#091f3e] border border-sds-border text-slate-300 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer"
                              >
                                Matchup
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SDSCard>
            </div>
          )}
        </>
      )}

      {/* Disclaimers */}
      <div className={`p-4 bg-[#0C2547]/60 border border-sds-border rounded-2xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
        <Info className="w-4 h-4 text-sds-text-sec shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-sds-text-sec leading-relaxed font-medium">
          SariRemit is not an exchange service. We help expats compare and optimize rates. The numbers listed are approximate averages resolved by our Rate Resolution Engine and may fluctuate slightly based on real-time forex updates. Always confirm rates inside your provider's wallet before executing money transfers.
        </p>
      </div>

      {/* SEPS Core Modals integration */}
      {recordTransferOption && user && (
        <RecordTransferModal
          isOpen={recordTransferOption !== null}
          onClose={() => setRecordTransferOption(null)}
          option={recordTransferOption}
          sendAmount={sendAmount}
          corridor={activeCorridor}
          otherOptions={options}
          userId={user.id}
          comparisonTargetId={comparisonTargetId}
          onSuccess={(newAch, isFirst) => {
            if (newAch && newAch.length > 0) {
              setNewlyEarnedAchievements(newAch);
              setCelebrationOpen(true);
              if (isFirst) {
                setFeedbackTransferId(`rec-trans-feedback-${Date.now()}`);
              }
            } else if (isFirst) {
              setFeedbackTransferId(`rec-trans-feedback-${Date.now()}`);
              setFeedbackOpen(true);
            }
          }}
          isRtl={isRtl}
        />
      )}

      {celebrationOpen && (
        <SEPSCelebration
          isOpen={celebrationOpen}
          onClose={() => {
            setCelebrationOpen(false);
            if (feedbackTransferId) {
              setFeedbackOpen(true);
            }
          }}
          newAchievements={newlyEarnedAchievements}
          isRtl={isRtl}
        />
      )}

      {feedbackOpen && user && (
        <FirstTransferFeedback
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          userId={user.id}
          relatedTransferId={feedbackTransferId}
          onCompleted={() => {
            setFeedbackTransferId('');
          }}
          isRtl={isRtl}
        />
      )}

    </div>
  );
}
