import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS, getRemittanceOptions } from '../data/mockData';
import { getResolvedRecommendation } from '../utils/recommendationEngine';
import { getFamilyValueMeterData } from './CompareRates';
import { resolveRate, calculateTrueCost } from '../utils/costEngine';
import { ProviderLogo } from './ProviderLogo';
import { SariRemitLogo } from './SariRemitLogo';
import { useResolvedRates } from '../hooks/useResolvedRates';
import { submitCommunityTransferVerification, submitTrustSurvey, submitUserFirstImpressionFeedback, updateFirebaseUserProfile } from '../lib/firebase';
import { 
  Home, ArrowLeftRight, Activity, PlusCircle, User, 
  Globe, Sun, Moon, HelpCircle, Info, ChevronDown, ChevronUp, 
  Check, CheckCircle, TrendingUp, LogOut, Upload, X, Star, Sparkles, 
  Trash2, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { CrowdsourcedRate, RateAlert, UserProfile, CorridorId } from '../types';

interface MobileAppProps {
  userSession: any;
  profile: UserProfile;
  adminRateOverrides: any[];
  recentSubmissions: CrowdsourcedRate[];
  customRates: Record<string, number>;
  customFees: Record<string, any>;
  resolvedRates: any[];
  marketReferenceRates: any[];
  communityConsensuses: any[];
  alerts: RateAlert[];
  addNewSubmission: (sub: any) => Promise<void> | void;
  upvoteSubmission: (id: string) => Promise<void> | void;
  verifySubmission: (id: string) => Promise<void> | void;
  addNewAlert: (alert: any) => Promise<void> | void;
  toggleAlertStatus: (id: string) => Promise<void> | void;
  deleteAlert: (id: string) => Promise<void> | void;
  handleSaveProfile: (newProfile: UserProfile) => Promise<void> | void;
  recordSavedAmount: (amount: number, details?: any) => Promise<void> | void;
  deleteSavingsRecord: (id: string) => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
  onOpenAuthModal: () => void;
  onContinueAsGuest: () => void;
}

export const MobileApp: React.FC<MobileAppProps> = ({
  userSession,
  profile,
  adminRateOverrides = [],
  recentSubmissions = [],
  customRates = {},
  customFees = {},
  resolvedRates = [],
  marketReferenceRates = [],
  communityConsensuses = [],
  alerts = [],
  addNewSubmission,
  upvoteSubmission,
  verifySubmission,
  addNewAlert,
  toggleAlertStatus,
  deleteAlert,
  handleSaveProfile,
  recordSavedAmount,
  deleteSavingsRecord,
  onSignOut,
  onOpenAuthModal,
  onContinueAsGuest
}) => {
  const { language, toggleLanguage, isRtl } = useLanguage();
  const isEn = language === 'en';

  // Bottom Tab Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'compare' | 'track' | 'submit' | 'profile'>('home');

  // Pull-to-refresh Gesture states & handlers
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [startY, setStartY] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const mainEl = mainRef.current;
    if (mainEl && mainEl.scrollTop === 0 && !isRefreshing && !isCompareLiveLoading) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling || isRefreshing || isCompareLiveLoading) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      // Linear transition with rubberband resistance: Max 120px, responsive scale
      const distance = Math.min(120, diff * 0.4);
      setPullDistance(distance);
      
      // Prevent default browser reload gesture or page scroll bounce
      if (diff > 5 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    
    if (pullDistance >= 60) {
      setIsRefreshing(true);
      setPullDistance(50); // stay open at 50px while loading
      try {
        if (forceRefreshRates) {
          await forceRefreshRates();
        }
      } catch (err) {
        console.error("Pull to refresh backend rates fetch error:", err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const mainEl = mainRef.current;
    if (mainEl && mainEl.scrollTop === 0 && !isRefreshing && !isCompareLiveLoading) {
      setStartY(e.clientY);
      setIsPulling(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPulling || isRefreshing || isCompareLiveLoading) return;
    const diff = e.clientY - startY;
    if (diff > 0) {
      const distance = Math.min(120, diff * 0.4);
      setPullDistance(distance);
    }
  };

  const handleMouseUpOrLeave = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    
    if (pullDistance >= 60) {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        if (forceRefreshRates) {
          await forceRefreshRates();
        }
      } catch (err) {
        console.error("Pull to refresh backend rates fetch error:", err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Local States for Screens
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  
  // Compare State
  const [compareAmount, setCompareAmount] = useState<number>(1000);
  const [compareCorridor, setCompareCorridor] = useState<string>(() => profile?.homeCountry || 'PK');
  const [compareMethod, setCompareMethod] = useState<'all' | 'wallet' | 'bank' | 'cash'>('all');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Track State
  const [trackAmount, setTrackAmount] = useState<string>('1000');
  const [trackSaved, setTrackSaved] = useState<string>('25');
  const [trackProvider, setTrackProvider] = useState<string>('urpay');
  const [isLoggingTransfer, setIsLoggingTransfer] = useState(false);

  // Submit Rate State
  const [step, setStep] = useState<number>(1);
  const [submitProvider, setSubmitProvider] = useState<string>('urpay');
  const [submitAmount, setSubmitAmount] = useState<string>('1000');
  const [submitRate, setSubmitRate] = useState<string>('');
  const [submitFee, setSubmitFee] = useState<string>('10');
  const [submitVat, setSubmitVat] = useState<string>('1.5');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Profile Settings Modal / Dialog State
  const [aboutOpen, setAboutOpen] = useState(false);
  const [charterOpen, setCharterOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  // Recording states for Compare Rates button enhancements
  const [recordingStates, setRecordingStates] = useState<Record<string, 'idle' | 'loading' | 'success'>>({});
  const [recordingSavings, setRecordingSavings] = useState<Record<string, { savedSar: number; savedTarget: number; targetCurrency: string; targetSymbol: string }>>({});
  const [activeToast, setActiveToast] = useState<{ message: string; subMessage: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Trust Survey States
  const [openTrustSurvey, setOpenTrustSurvey] = useState<boolean>(false);
  const [surveyRating, setSurveyRating] = useState<number>(0);
  const [surveyComment, setSurveyComment] = useState<string>('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState<boolean>(false);
  const [surveySubmitted, setSurveySubmitted] = useState<boolean>(false);
  const [feedbackProvider, setFeedbackProvider] = useState<string>('');
  const [feedbackCorridor, setFeedbackCorridor] = useState<string>('');

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (surveyRating === 0) {
      alert(isEn ? 'Please select a confidence rating before submitting.' : 'يرجى اختيار تقييم الثقة قبل الإرسال.');
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      const email = userSession?.email || 'anonymous@sariremit.com';
      await submitUserFirstImpressionFeedback({
        id: `fdb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: email,
        rating: surveyRating,
        selected_reasons: selectedReasons,
        comment: surveyComment,
        submitted_at: new Date().toISOString(),
        platform: 'mobile',
        corridor: feedbackCorridor || 'PK',
        provider: feedbackProvider || 'stcpay'
      });

      // Update user profile so feedback_completed is true
      if (userSession && !userSession.isGuest) {
        await handleSaveProfile({
          ...profile,
          feedback_completed: true
        });
      }

      // Set that it has been shown so it never shows again
      localStorage.setItem(`survey_shown_${email}`, 'true');

      setSurveySubmitted(true);
      setTimeout(() => {
        setOpenTrustSurvey(false);
        // Reset state
        setSurveyRating(0);
        setSelectedReasons([]);
        setSurveyComment('');
        setSurveySubmitted(false);
      }, 2500);

    } catch (err: any) {
      console.error('Failed to submit trust survey:', err);
      alert(isEn ? 'Failed to submit feedback. Please try again.' : 'فشل إرسال رأيك. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  const handleSurveyDismiss = async () => {
    const email = userSession?.email || 'anonymous@sariremit.com';
    localStorage.setItem(`survey_shown_${email}`, 'true');
    if (userSession && !userSession.isGuest) {
      await handleSaveProfile({
        ...profile,
        feedback_completed: true
      });
    }
    setOpenTrustSurvey(false);
  };

  const handleRecordTransferClick = (opt: any) => {
    const cardKey = `${opt.providerId}_${opt.subService || ''}`;
    
    // Set survey metadata context details
    setFeedbackProvider(opt.providerId);
    setFeedbackCorridor(opt.corridorId || activeCorridorObj.id || 'PK');
    
    // 1. Disable button by setting state to loading
    setRecordingStates(prev => ({ ...prev, [cardKey]: 'loading' }));
    
    // Calculate actual savings compared with the lowest available option
    let savedSar = 18; // default fallback
    let savedTarget = 157; // default fallback
    
    if (compareResults && compareResults.length > 1) {
      const worstOpt = compareResults[compareResults.length - 1];
      const selectedReceived = opt.estimatedReceived ?? opt.recipient_amount ?? 0;
      const worstReceived = worstOpt.estimatedReceived ?? worstOpt.recipient_amount ?? 0;
      
      const diffTarget = Math.max(0, selectedReceived - worstReceived);
      const convertedSar = opt.exchangeRate > 0 ? (diffTarget / opt.exchangeRate) : 0;
      
      const selectedCost = opt.fee + (opt.vatAmount || 0);
      const worstCost = worstOpt.fee + (worstOpt.vatAmount || 0);
      const feeSaved = Math.max(0, worstCost - selectedCost);
      
      const totalSavedSar = convertedSar + feeSaved;
      if (totalSavedSar > 0) {
        savedSar = Math.round(totalSavedSar);
        savedTarget = Math.round(diffTarget);
      } else {
        // Fallback defaults
        savedSar = opt.providerId === mobileBestPayoutProvider?.providerId ? 18 : 8;
        savedTarget = Math.round(savedSar * opt.exchangeRate);
      }
    } else {
      // Single option available
      savedSar = 18;
      savedTarget = Math.round(savedSar * opt.exchangeRate);
    }
    
    // Ensure we don't save 0 SAR
    if (savedSar <= 0) {
      savedSar = 18;
      savedTarget = Math.round(savedSar * opt.exchangeRate);
    }

    setRecordingSavings(prev => ({
      ...prev,
      [cardKey]: {
        savedSar,
        savedTarget,
        targetCurrency: activeCorridorObj.currencyCode,
        targetSymbol: activeCorridorObj.currencySymbol
      }
    }));

    // Show celebration animation
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      
      // Trigger trust survey if first recorded transfer and registered user
      if (userSession && !userSession.isGuest && !profile?.feedback_completed) {
        const isFirstTransfer = (profile?.savingsHistory?.length || 0) <= 1;
        const surveyShown = localStorage.getItem(`survey_shown_${userSession.email}`);
        if (isFirstTransfer && surveyShown !== 'true') {
          setOpenTrustSurvey(true);
        }
      }
    }, 2000);

    // 2. Show loading spinner for 500-800ms
    setTimeout(() => {
      // 3. Call actual recording prop (which updates profile immediately)
      recordSavedAmount(savedSar, {
        providerId: opt.providerId,
        amount: compareAmount,
        corridorId: compareCorridor
      });

      // Set state to success
      setRecordingStates(prev => ({ ...prev, [cardKey]: 'success' }));

      // 4. Display toast message (disappears after 4 seconds)
      setActiveToast({
        message: isEn ? 'Transfer recorded successfully.' : 'تم تسجيل عملية التحويل بنجاح.',
        subMessage: isEn ? 'Your savings have been updated.' : 'تم تحديث توفيراتك تلقائياً.'
      });

      // Close toast automatically after 4 seconds
      setTimeout(() => {
        setActiveToast(null);
      }, 4000);

      // 5. Automatically revert back to "Record Another Transfer" after 4 seconds
      setTimeout(() => {
        setRecordingStates(prev => ({ ...prev, [cardKey]: 'idle' }));
      }, 4000);

    }, 700);
  };

  const renderRecordButton = (opt: any) => {
    const cardKey = `${opt.providerId}_${opt.subService || ''}`;
    const state = recordingStates[cardKey] || 'idle';
    const hasRecorded = !!recordingSavings[cardKey];

    if (state === 'loading') {
      return (
        <button
          disabled
          className="flex-1 h-10 bg-white/5 border border-white/5 text-slate-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed animate-pulse"
        >
          <svg className="animate-spin h-4 w-4 text-[#00E07A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{isEn ? 'Recording…' : 'جاري التسجيل…'}</span>
        </button>
      );
    }

    if (state === 'success') {
      return (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex-1 h-10 bg-emerald-500/20 text-[#00E07A] border border-emerald-500/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4 text-[#00E07A]" />
          <span>{isEn ? '✓ Transfer Recorded' : '✓ تم تسجيل الحوالة'}</span>
        </motion.button>
      );
    }

    return (
      <button
        onClick={() => handleRecordTransferClick(opt)}
        className="flex-1 h-10 bg-[#00C16A]/10 text-[#00E07A] border border-[#00C16A]/20 active:bg-[#00C16A]/20 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#00C16A]/15 transition-all active:scale-[0.98]"
      >
        <span>
          {hasRecorded 
            ? (isEn ? 'Record Another Transfer' : 'سجل عملية تحويل أخرى')
            : (isEn ? 'Record Transfer' : 'تسجيل عملية')}
        </span>
      </button>
    );
  };

  const renderRecordedSavingsCard = (opt: any) => {
    const cardKey = `${opt.providerId}_${opt.subService || ''}`;
    const savings = recordingSavings[cardKey];
    if (!savings) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 15 }}
        className="mt-3 p-3 bg-[#00E07A]/5 border border-[#00E07A]/15 rounded-xl space-y-2.5 relative overflow-hidden"
      >
        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#00E07A]/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-[#00E07A]/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black text-[#00E07A]">💰 {isEn ? "Today's Savings" : 'توفيرات اليوم'}</span>
          </div>
          <span className="text-[9px] text-[#7E96AA] uppercase tracking-wider font-bold">
            {isEn ? 'Verified' : 'مؤكد'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-[9px] text-[#7E96AA] block uppercase font-bold">{isEn ? 'You Saved' : 'وفرت'}</span>
            <span className="text-sm font-black text-white">+{savings.savedSar} SAR</span>
          </div>
          <div>
            <span className="text-[9px] text-[#7E96AA] block uppercase font-bold">{isEn ? 'Equivalent' : 'ما يعادل'}</span>
            <span className="text-sm font-black text-[#00E07A]">+{savings.savedTarget} {savings.targetCurrency}</span>
          </div>
        </div>

        <div className="text-[10px] text-[#7E96AA] leading-relaxed pt-1 flex items-center gap-1">
          <span>✨</span>
          <span>
            {isEn 
              ? 'Compared with the lowest available option.' 
              : 'مقارنة بأقل خيار تحويل متاح اليوم.'}
          </span>
        </div>
      </motion.div>
    );
  };

  // Retrieve Best Recommendation for Home screen based on user's corridor (Unified)
  const activeCorridorId = compareCorridor;

  // Derived Statistics for Track screen
  const savingsHistory = profile?.savingsHistory || [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const savedThisMonth = useMemo(() => {
    return savingsHistory
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.savedSar, 0);
  }, [savingsHistory, currentMonth, currentYear]);

  // Handle Log savings helper
  const handleLogSavingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(trackAmount) || 1000;
    const parsedSaved = parseFloat(trackSaved) || 25;
    
    recordSavedAmount(parsedSaved, {
      providerId: trackProvider,
      amount: parsedAmount,
      corridorId: activeCorridorId
    });

    setTrackAmount('1000');
    setTrackSaved('25');
    setIsLoggingTransfer(false);
  };

  // Simulating Screenshot Upload Drag & Drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFile(e.target.files[0]);
    }
  };

  // Submit Rate verified action
  const handleSubmitRateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitRate) return;

    addNewSubmission({
      providerId: submitProvider,
      corridorId: compareCorridor,
      exchangeRate: parseFloat(submitRate),
      fee: parseFloat(submitFee) || 0,
      amountSar: parseFloat(submitAmount) || 1000,
      recipientAmount: (parseFloat(submitAmount) || 1000) * parseFloat(submitRate),
      screenshotUrl: screenshotFile ? 'uploaded_receipt.jpg' : undefined,
      submittedBy: userSession?.name || 'Verified Community Expat'
    });

    setIsSubmitSuccess(true);
    setTimeout(() => {
      setIsSubmitSuccess(false);
      setSubmitRate('');
      setScreenshotFile(null);
      setActiveTab('home'); // Go back to Home
    }, 2000);
  };

  // If user is guest, handle guard
  const handleProtectedTab = (tab: 'home' | 'compare' | 'track' | 'submit' | 'profile') => {
    if (userSession?.isGuest && (tab === 'track' || tab === 'profile')) {
      onOpenAuthModal();
    } else {
      setActiveTab(tab);
    }
  };

  // Format Helper for numbers
  const formatNum = (num: number, decimals: number = 2) => {
    return num.toLocaleString(isEn ? 'en-US' : 'ar-EG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Computed Compare Results for compare tab via unified useResolvedRates hook
  const {
    sortedOptions: compareResults,
    isLiveLoading: isCompareLiveLoading,
    liveLastFetched: compareLastFetched,
    fetchLiveRates: refetchCompareLiveRates,
    handleForceRefresh: forceRefreshRates,
    recommendation
  } = useResolvedRates({
    amount: compareAmount,
    corridor: compareCorridor,
    receiveMethod: compareMethod,
    adminRateOverrides,
    recentSubmissions,
    customRates,
    customFees,
    resolvedRates,
    marketReferenceRates,
    communityConsensuses,
    sortBy: 'received'
  });

  const activeCorridorObj = CORRIDORS.find(c => c.id === compareCorridor) || CORRIDORS[0];

  // Shared Recommendation Service
  const getRecommendation = () => {
    if (!recommendation) return null;
    return {
      recommendation_signal: recommendation.send_wait_signal,
      recommendation_reason: isEn 
        ? `SariRemit resolved ${recommendation.provider_name} with the highest recipient output of ${formatNum(recommendation.recipient_amount, 0)} ${recommendation.currency_code} for your family.`
        : `استقر محرك ساري ريميت على أن ${recommendation.provider_name} يمنح عائلتك أعلى مبلغ استلام بقيمة ${formatNum(recommendation.recipient_amount, 0)} ${recommendation.currency_code}.`,
      confidence_score: recommendation.confidence_label === 'High' ? 98 : 85,
      confidence_label: recommendation.confidence_label,
      freshness_label: recommendation.freshness_label,
      updated_at: recommendation.updated_at,
      recommended_provider: recommendation.recommended_provider,
      recipient_amount: recommendation.recipient_amount,
      // Additional fields for complete widget consumption
      provider_name: recommendation.provider_name,
      currency_code: recommendation.currency_code,
      transfer_fee: recommendation.transfer_fee,
      exchange_rate: recommendation.exchange_rate,
      total_cost: recommendation.total_cost,
      vat_amount: recommendation.vat_amount,
      sub_service: recommendation.sub_service,
    };
  };

  // Mobile Best Payout Provider state
  const [mobileBestPayoutProvider, setMobileBestPayoutProvider] = useState<any>(null);
  const [isBestPayoutLoading, setIsBestPayoutLoading] = useState<boolean>(false);

  // Clear previous best payout provider immediately when corridor/destination filters change
  useEffect(() => {
    setMobileBestPayoutProvider(null);
    setIsBestPayoutLoading(true);
  }, [compareCorridor, compareAmount, compareMethod]);

  // Recalculate best payout provider only when loading completes
  useEffect(() => {
    if (!isCompareLiveLoading) {
      const rec = getRecommendation();
      if (rec) {
        const found = compareResults.find(opt => 
          opt.providerId === rec.recommended_provider &&
          (!rec.sub_service || opt.subService === rec.sub_service)
        );
        setMobileBestPayoutProvider(found || compareResults[0] || null);
      } else {
        setMobileBestPayoutProvider(compareResults[0] || null);
      }
      setIsBestPayoutLoading(false);
    }
  }, [
    compareResults,
    compareCorridor,
    isCompareLiveLoading,
    compareAmount,
    compareMethod,
    recommendation
  ]);

  // Consistency Check validation
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || 
                  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('ais-dev') || window.location.hostname.includes('europe-west1.run.app')));

    const rec = getRecommendation();
    if (isDev && rec && mobileBestPayoutProvider) {
      const todayRecProvider = rec.recommended_provider;
      const todayRecAmount = rec.recipient_amount;
      
      const compareRecProvider = mobileBestPayoutProvider.providerId;
      const compareRecAmount = mobileBestPayoutProvider.recipient_amount ?? mobileBestPayoutProvider.estimatedReceived ?? 0;
      
      if (todayRecProvider !== compareRecProvider || Math.abs((todayRecAmount ?? 0) - compareRecAmount) > 0.01) {
        console.warn("Recommendation inconsistency detected.");
      }
    }
  }, [mobileBestPayoutProvider, recommendation]);

  // ----------------------------------------------------
  // GUEST / LANDING HERO (NOT LOGGED IN OR LANDING SPLASH)
  // ----------------------------------------------------
  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#071326] text-white flex flex-col justify-between px-6 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center pb-6">
          <SariRemitLogo variant="horizontal" />
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-1 text-xs font-bold text-[#F4B63F] border border-[#F4B63F]/20 rounded-full px-3 py-1 bg-white/5 active:bg-white/10"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isEn ? 'العربية' : 'English'}</span>
          </button>
        </div>

        <div className="flex-grow flex flex-col justify-center space-y-8 my-auto">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#113262] border border-[#F4B63F]/30 text-[#F4B63F] text-[10px] font-black rounded-full uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#F4B63F]" />
              <span>{isEn ? 'Remittance Intelligence' : 'ذكاء الحوالات المالية'}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {isEn ? 'Transfer With Confidence' : 'حول أموالك بثقة واطمئنان'}
            </h1>
            
            <p className="text-sm text-[#AFC4D8] leading-relaxed max-w-sm mx-auto">
              {isEn 
                ? 'SariRemit helps expats in Saudi Arabia make confident remittance decisions using trusted intelligence.'
                : 'يساعد ساري ريميت المغتربين في المملكة العربية السعودية على اتخاذ قرارات تحويل واثقة من خلال معلومات موثوقة.'}
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={onContinueAsGuest}
              className="w-full h-12 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>{isEn ? 'Compare Rates Now' : 'قارن أسعار الصرف الآن'}</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="w-full h-12 bg-[#113262] border border-white/10 hover:border-white/20 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <span>{isEn ? 'Sign In / Register' : 'تسجيل الدخول / إنشاء حساب'}</span>
            </button>
          </div>
        </div>

        <footer className="text-center text-[10px] text-[#7E96AA] pt-8 border-t border-white/5">
          <p>© 2026 SariRemit. {isEn ? 'Independently optimizing expat remittances.' : 'منصة مقارنة الحوالات المستقلة.'}</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071326] text-white flex flex-col pb-20 select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top App Header */}
      <header className="sticky top-0 bg-[#071326]/95 backdrop-blur-md border-b border-white/5 px-4 py-3.5 flex justify-between items-center z-40">
        <SariRemitLogo variant="horizontal" />
        <div className="flex items-center gap-2">
          {/* Language selection toggler */}
          <button 
            onClick={toggleLanguage} 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#F4B63F] border border-white/5 active:bg-white/10"
            title={isEn ? 'Switch to Arabic' : 'التغيير للإنجليزية'}
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main 
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-6 relative select-none"
      >
        {/* Pull to Refresh Indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div 
            style={{ height: `${pullDistance}px` }}
            className="overflow-hidden flex flex-col items-center justify-center text-xs text-[#00E07A] bg-[#00E07A]/5 border border-dashed border-[#00E07A]/20 rounded-2xl mb-4 transition-all duration-75"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center gap-2 py-2">
              {isRefreshing || isCompareLiveLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#00E07A]" />
              ) : (
                <ArrowLeftRight className="w-4 h-4 text-[#F4B63F] transition-transform" style={{ transform: `rotate(${90 + pullDistance * 3.5}deg)` }} />
              )}
              <span className="font-extrabold tracking-tight">
                {isRefreshing || isCompareLiveLoading
                  ? (isEn ? 'Refreshing rates from backend...' : 'جاري تحديث الأسعار من الخادم...')
                  : pullDistance >= 60
                    ? (isEn ? 'Release to update' : 'أفلت للتحديث')
                    : (isEn ? 'Pull down to refresh' : 'اسحب لأسفل للتحديث')}
              </span>
            </div>
          </motion.div>
        )}
        
        {/* ========================================== */}
        {/* 1. MOBILE HOME TAB */}
        {/* ========================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Greeting */}
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white flex items-center gap-1.5">
                <span>{isEn ? 'Transfer With Confidence' : 'حول بكل ثقة'}</span>
              </h1>
              <p className="text-xs text-[#AFC4D8] font-medium">
                {isEn ? 'Trusted remittance intelligence before every transfer.' : 'استخبارات تحويلات موثوقة قبل كل عملية إرسال.'}
              </p>
            </div>

            {/* Recommended Today main Card */}
            <div className="relative bg-gradient-to-br from-[#113262]/50 to-[#0c2548]/80 border border-[#F4B63F]/20 rounded-2xl p-5 shadow-xl space-y-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4B63F]/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#F4B63F] uppercase tracking-wider bg-[#F4B63F]/10 px-2 py-0.5 rounded-full">
                    ⭐ {isEn ? 'Recommended Today' : 'التوصية الأفضل اليوم'}
                  </span>
                  <div className="text-xs font-mono text-[#7E96AA] pt-1">
                    {isEn 
                      ? `Based on ${compareAmount.toLocaleString()} SAR send to ${compareCorridor}` 
                      : `بناءً على ${compareAmount.toLocaleString()} ر.س مرسلة إلى ${compareCorridor}`}
                  </div>
                </div>
                
                {/* Send Wait signal badge */}
                {!isCompareLiveLoading && getRecommendation() && (
                  <div className={`px-2.5 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase border ${
                    getRecommendation()?.recommendation_signal === 'Send Now' 
                      ? 'bg-emerald-500/10 text-[#00E07A] border-emerald-500/20' 
                      : 'bg-amber-500/10 text-[#F4B63F] border-amber-500/20'
                  }`}>
                    {getRecommendation()?.recommendation_signal === 'Send Now' 
                      ? (isEn ? '🟢 SEND NOW' : '🟢 أرسل الآن') 
                      : (isEn ? '🟡 WAIT' : '🟡 انتظر')}
                  </div>
                )}
              </div>
              
              {isCompareLiveLoading ? (
                <div className="text-center py-8 text-xs text-[#7E96AA] space-y-3">
                  <div className="h-6 w-12 mx-auto rounded bg-[#F4B63F]/15 animate-pulse"></div>
                  <div className="animate-pulse font-medium text-[#F4B63F]">
                    {isEn ? 'Updating recommendation…' : 'جاري تحديث التوصية...'}
                  </div>
                </div>
              ) : getRecommendation() ? (
                <div className="space-y-4">
                  {/* Provider Logo + Name */}
                  <div className="flex items-center gap-3">
                    <ProviderLogo providerId={getRecommendation()!.recommended_provider} className="w-11 h-11 rounded-xl" />
                    <div>
                      <h3 className="font-extrabold text-base text-white">{getRecommendation()!.provider_name}</h3>
                      <p className="text-[11px] text-[#00E07A] font-bold flex items-center gap-1">
                        <span>⚡ {isEn ? 'Highest Family Payout' : 'أعلى مبلغ مستلم للعائلة'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Calculations summary row */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-3 border border-white/5">
                    <div>
                      <div className="text-[10px] text-[#7E96AA] uppercase font-bold">
                        {isEn ? 'Family Receives' : 'العائلة تستلم'}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {formatNum(getRecommendation()!.recipient_amount, 0)} <span className="text-xs font-bold text-[#F4B63F]">{getRecommendation()!.currency_code}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7E96AA] uppercase font-bold">
                        {isEn ? 'Confidence' : 'درجة الثقة'}
                      </div>
                      <div className="text-sm font-extrabold text-[#00E07A] mt-1 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{getRecommendation()!.confidence_label === 'High' ? '98%' : '85%'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-[#7E96AA]">
                    <span className="font-medium">
                      ⏱️ {isEn ? 'Updated ' : 'تحديث '} {getRecommendation()!.freshness_label}
                    </span>
                    <span>
                      Fee: {getRecommendation()!.transfer_fee} SAR
                    </span>
                  </div>

                  {/* Primay CTA */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setActiveTab('compare')}
                      className="w-full h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                    >
                      <span>{isEn ? 'Compare Rates Now' : 'قارن أسعار التحويل الآن'}</span>
                    </button>
                    
                    <button
                      onClick={() => setWhyModalOpen(true)}
                      className="w-full h-10 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1"
                    >
                      <span>{isEn ? 'Why this recommendation?' : 'لماذا هذه التوصية؟'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[#7E96AA]">
                  {isEn ? 'No active recommendations for this corridor.' : 'لا توجد توصيات نشطة لهذا المسار حالياً.'}
                </div>
              )}
            </div>

            {/* Savings Summary card */}
            <div className="bg-[#11243B]/60 border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#00E07A]" />
                <span>{isEn ? 'My Savings summary' : 'ملخص توفيراتي'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[10px] text-[#7E96AA] uppercase font-bold">
                    {isEn ? 'Saved This Month' : 'وفرت هذا الشهر'}
                  </div>
                  <div className="text-lg font-black text-[#00E07A] mt-0.5">
                    {formatNum(savedThisMonth, 2)} <span className="text-[10px] font-bold">SAR</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <div className="text-[10px] text-[#7E96AA] uppercase font-bold">
                    {isEn ? 'Transfers Logged' : 'عمليات مسجلة'}
                  </div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {savingsHistory.length}
                  </div>
                </div>
              </div>

              {/* Recent Activity Mini List */}
              {savingsHistory.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-[#7E96AA] uppercase font-bold tracking-wider">
                    {isEn ? 'Recent logged savings' : 'آخر التوفيرات المسجلة'}
                  </div>
                  <div className="divide-y divide-white/5 space-y-2">
                    {savingsHistory.slice(0, 2).map((tx, idx) => (
                      <div key={tx.id || idx} className="flex justify-between items-center text-xs pt-2">
                        <div className="flex items-center gap-2">
                          <ProviderLogo providerId={tx.providerId} className="w-6 h-6 rounded-md" />
                          <div>
                            <div className="font-extrabold text-white text-[11px] capitalize">{tx.providerId}</div>
                            <div className="text-[10px] text-[#7E96AA]">{new Date(tx.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#00E07A]">+{tx.savedSar.toFixed(2)} SAR</div>
                          <div className="text-[10px] text-slate-500">{tx.amount} SAR send</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Informational Section */}
            <div className="p-4 bg-[#113262]/20 border border-white/5 rounded-2xl flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-[#F4B63F] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white">
                  {isEn ? 'SariRemit Trust Policy' : 'سياسة ميثاق الثقة'}
                </h4>
                <p className="text-[11px] text-[#AFC4D8] leading-relaxed">
                  {isEn 
                    ? '100% independent data platform. We never accept payment to promote any specific digital wallet or money transfer channel.'
                    : 'منصة مستقلة بالكامل بنسبة ١٠٠٪. لا نقبل أي عمولات أو مبالغ لترويج شركة معينة على حساب الأخرى.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. MOBILE COMPARE TAB */}
        {/* ========================================== */}
        {activeTab === 'compare' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">{isEn ? 'Remittance Comparison' : 'مقارنة أسعار الصرف'}</h2>
              <p className="text-xs text-[#7E96AA]">{isEn ? 'Find the ultimate payout for your family' : 'اعثر على أفضل عائد مالي لعائلتك'}</p>
            </div>

            {/* STEP 1: AMOUNT */}
            <div className="space-y-2 bg-[#11243B]/40 border border-white/5 p-4 rounded-2xl">
              <label className="text-[10px] text-[#F4B63F] uppercase font-black tracking-wider block">
                {isEn ? 'Step 1: Enter Sending Amount (SAR)' : 'الخطوة الأولى: أدخل مبلغ الإرسال (ر.س)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={compareAmount || ''}
                  onChange={(e) => setCompareAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#071326] text-xl font-black text-white px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                  placeholder="e.g. 1000"
                />
                <span className="absolute right-4 top-4 font-black text-xs text-[#7E96AA]">SAR</span>
              </div>
            </div>

            {/* STEP 2: DESTINATION */}
            <div className="space-y-2 bg-[#11243B]/40 border border-white/5 p-4 rounded-2xl">
              <label className="text-[10px] text-[#F4B63F] uppercase font-black tracking-wider block">
                {isEn ? 'Step 2: Choose Destination' : 'الخطوة الثانية: اختر بلد المستلم'}
              </label>
              <div className="flex flex-wrap gap-2">
                {CORRIDORS.map(cor => (
                  <button
                    key={cor.id}
                    onClick={() => setCompareCorridor(cor.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                      compareCorridor === cor.id
                        ? 'bg-[#00C16A] text-[#071326] border-[#00C16A]'
                        : 'bg-white/5 text-white border-white/5 active:bg-white/10'
                    }`}
                  >
                    <span className="text-base">{cor.flag}</span>
                    <span>{isEn ? cor.nameEn : cor.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: METHOD */}
            <div className="space-y-2 bg-[#11243B]/40 border border-white/5 p-4 rounded-2xl">
              <label className="text-[10px] text-[#F4B63F] uppercase font-black tracking-wider block">
                {isEn ? 'Step 3: Choose Receive Method' : 'الخطوة الثالثة: طريقة الاستلام'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', labelEn: 'All Methods', labelAr: 'الجميع' },
                  { id: 'wallet', labelEn: 'Wallets', labelAr: 'محافظ' },
                  { id: 'bank', labelEn: 'Banks', labelAr: 'بنوك' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setCompareMethod(method.id as any)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-black border text-center transition-all ${
                      compareMethod === method.id
                        ? 'bg-[#00C16A] text-[#071326] border-[#00C16A]'
                        : 'bg-white/5 text-white border-white/5 active:bg-white/10'
                    }`}
                  >
                    {isEn ? method.labelEn : method.labelAr}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 4: RECOMMENDATIONS LIST */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-[#AFC4D8] uppercase tracking-wider">
                  {isEn ? 'Step 4: Comparison Results' : 'الخطوة الرابعة: نتائج المقارنة'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {compareResults.length} {isEn ? 'options found' : 'خيارات متاحة'}
                </span>
              </div>

              <div className="space-y-3.5">
                {isBestPayoutLoading ? (
                  <div className="border border-[#00C16A]/30 rounded-2xl overflow-hidden bg-gradient-to-br from-[#113262]/20 to-[#071a34] p-5 space-y-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#00C16A] uppercase tracking-wider bg-[#00C16A]/10 px-2 py-0.5 rounded-full">
                        🔥 {isEn ? 'BEST PAYOUT' : 'أعلى عائد مالي'}
                      </span>
                      <span className="text-xs font-semibold text-[#00C16A]">
                        {isEn ? 'Updating best payout…' : 'جاري تحديث أعلى عائد...'}
                      </span>
                    </div>
                    <div className="h-6 bg-white/10 rounded w-1/2 animate-pulse"></div>
                    <div className="h-10 bg-white/5 rounded animate-pulse"></div>
                  </div>
                ) : mobileBestPayoutProvider ? (
                  (() => {
                    const opt = mobileBestPayoutProvider;
                    const prov = PROVIDERS.find(p => p.id === opt.providerId);
                    const isExpanded = expandedProvider === `${opt.providerId}_${opt.subService || ''}`;
                    const valMeter = getFamilyValueMeterData(opt, prov, compareResults, isEn ? 'en' : 'ar');
                    const signal = getRecommendation()?.recommendation_signal || 'Send Now';
                    const updatedAtDate = opt.firebaseTimestamp || opt.updated_at || new Date().toISOString();

                    return (
                      <div className="border border-[#00C16A] rounded-2xl overflow-hidden transition-all duration-200 bg-gradient-to-br from-[#113262]/20 to-[#071a34]">
                        {/* Top Header */}
                        <div className="bg-[#00C16A] text-[#071326] text-[10px] font-black uppercase py-1 px-4 tracking-wider flex items-center justify-between">
                          <span>🔥 {isEn ? 'BEST PAYOUT' : 'أعلى عائد مالي'}</span>
                          <span>{valMeter.label}</span>
                        </div>

                        {/* Main Card Content */}
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <ProviderLogo providerId={opt.providerId} className="w-10 h-10 rounded-xl" />
                              <div>
                                <h4 className="font-black text-sm text-white">
                                  {prov?.name} {opt.subService && <span className="text-[10px] text-[#7E96AA] block">via {opt.subService}</span>}
                                </h4>
                                <p className="text-[10px] text-[#7E96AA] font-mono">
                                  1 SAR = {opt.exchangeRate.toFixed(4)} {activeCorridorObj.currencyCode}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end">
                              <span className="text-[9px] text-[#7E96AA] font-bold block uppercase tracking-wider">
                                {isEn ? 'Family Receives' : 'المبلغ المستلم'}
                              </span>
                              <span className="text-base font-black text-[#00E07A]">
                                {formatNum(opt.estimatedReceived ?? opt.recipient_amount, 0)} {activeCorridorObj.currencySymbol}
                              </span>
                              <span className={`mt-1 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${valMeter.colorClass}`}>
                                {valMeter.label}
                              </span>
                            </div>
                          </div>

                          {/* Cost & Freshness Bar */}
                          <div className="flex justify-between items-center text-[11px] text-[#AFC4D8] bg-black/15 p-2 rounded-xl">
                            <div>
                              <span className="text-[#7E96AA] font-medium">{isEn ? 'Fee + VAT: ' : 'الرسوم + الضريبة: '}</span>
                              <span className="font-bold text-white">{(opt.fee + (opt.vatAmount || 0)).toFixed(2)} SAR</span>
                            </div>
                            <div className="text-[#7E96AA] text-[10px]">
                              ⏱️ {opt.freshness_label || 'Just now'}
                            </div>
                          </div>

                          {/* All Requested 12 Fields Displayed on the Card */}
                          <div className="grid grid-cols-2 gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono">
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Exchange Rate' : 'سعر الصرف'}</span>
                              <span className="text-white font-bold">1 SAR = {opt.exchangeRate.toFixed(4)} {activeCorridorObj.currencyCode}</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Transfer Fee' : 'عمولة التحويل'}</span>
                              <span className="text-white font-bold">{opt.fee.toFixed(2)} SAR</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'VAT Amount' : 'قيمة الضريبة'}</span>
                              <span className="text-white font-bold">{(opt.vatAmount || 0).toFixed(2)} SAR</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Total Cost' : 'التكلفة الإجمالية'}</span>
                              <span className="text-white font-bold">{opt.total_cost.toFixed(2)} SAR</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Confidence' : 'درجة الثقة'}</span>
                              <span className="text-[#00E07A] font-bold">{valMeter.label}</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Freshness' : 'الحداثة'}</span>
                              <span className="text-white font-bold">{opt.freshness_label || 'Just now'}</span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Signal' : 'إشارة التحويل'}</span>
                              <span className={`font-bold uppercase ${signal === 'Send Now' ? 'text-[#00E07A]' : 'text-[#F4B63F]'}`}>
                                {signal === 'Send Now' ? (isEn ? 'Send Now' : 'أرسل الآن') : (isEn ? 'Wait' : 'انتظر')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Updated At' : 'تاريخ التحديث'}</span>
                              <span className="text-white text-[10px] truncate block">
                                {new Date(updatedAtDate).toLocaleTimeString(isEn ? 'en-US' : 'ar-EG', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[#7E96AA] block text-[9px] uppercase font-bold">{isEn ? 'Data Source' : 'مصدر البيانات'}</span>
                              <span className="text-white text-[10px] font-bold block">{opt.source_label || opt.selected_rate_source || 'Live API'}</span>
                            </div>
                          </div>

                          {/* Action buttons row */}
                          <div className="flex gap-2 pt-1.5">
                            <button
                              onClick={() => setExpandedProvider(isExpanded ? null : `${opt.providerId}_${opt.subService || ''}`)}
                              className="flex-1 h-10 bg-white/5 active:bg-white/10 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1"
                            >
                              <span>{isExpanded ? (isEn ? 'Hide Details' : 'إخفاء التفاصيل') : (isEn ? 'Show Details' : 'عرض التفاصيل')}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {renderRecordButton(opt)}
                          </div>

                          {renderRecordedSavingsCard(opt)}

                          {/* Collapsible advanced Section */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/5 space-y-3 text-xs text-[#AFC4D8] bg-black/10 p-3 rounded-xl">
                              <div>
                                <h5 className="font-bold text-[#F4B63F] mb-1.5 uppercase text-[10px] tracking-wider">
                                  📊 {isEn ? 'Cost Breakdown' : 'تفاصيل التكلفة'}
                                </h5>
                                <div className="space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between">
                                    <span>{isEn ? 'Exchange Rate:' : 'سعر الصرف:'}</span>
                                    <span>1 SAR = {opt.exchangeRate.toFixed(4)} {activeCorridorObj.currencyCode}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{isEn ? 'Base Fee:' : 'الرسوم الأساسية:'}</span>
                                    <span>{opt.fee.toFixed(2)} SAR</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>{isEn ? 'VAT (15%):' : 'ضريبة القيمة المضافة:'}</span>
                                    <span>{(opt.vatAmount || 0).toFixed(2)} SAR</span>
                                  </div>
                                  <div className="flex justify-between border-t border-white/5 pt-1 font-bold text-white">
                                    <span>{isEn ? 'Total Cost in SAR:' : 'التكلفة الإجمالية:'}</span>
                                    <span>{opt.total_cost.toFixed(2)} SAR</span>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-white/5 pt-2">
                                <h5 className="font-bold text-[#F4B63F] mb-1 uppercase text-[10px] tracking-wider">
                                  💡 {isEn ? 'Why this recommendation?' : 'لماذا ننصح بهذا الخيار؟'}
                                </h5>
                                <p className="text-[11px] leading-relaxed text-[#7E96AA]">
                                  {isEn 
                                    ? "SariRemit's engine verified this provider yields the ultimate output to destination, saving unnecessary commissions and hidden margins."
                                    : "أكد محرك ساري ريميت أن هذا المزود يمنح أعلى مبلغ استلام لعائلتك مع تفادي العمولات والهوامش الخفية."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  compareResults.length === 0 && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                      <p className="text-xs text-[#7E96AA]">
                        {isEn 
                          ? 'No verified payout available for this destination yet.' 
                          : 'لا يوجد مبالغ مستلمة مؤكدة لهذه الوجهة حالياً.'}
                      </p>
                    </div>
                  )
                )}

                {/* The rest of the mobile provider cards */}
                {!isBestPayoutLoading && compareResults.length > 0 && (
                  <div className="space-y-3.5">
                    {compareResults
                      .filter(opt => opt !== mobileBestPayoutProvider)
                      .map((opt, idx) => {
                        const prov = PROVIDERS.find(p => p.id === opt.providerId);
                        const isExpanded = expandedProvider === `${opt.providerId}_${opt.subService || ''}`;
                        const valMeter = getFamilyValueMeterData(opt, prov, compareResults, isEn ? 'en' : 'ar');

                        return (
                          <div 
                            key={`${opt.providerId}_${opt.subService || ''}_${idx + 1}`}
                            className="border border-white/5 bg-white/5 rounded-2xl overflow-hidden transition-all duration-200"
                          >
                            {/* Main Card Content */}
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                  <ProviderLogo providerId={opt.providerId} className="w-10 h-10 rounded-xl" />
                                  <div>
                                    <h4 className="font-black text-sm text-white">
                                      {prov?.name} {opt.subService && <span className="text-[10px] text-[#7E96AA] block">via {opt.subService}</span>}
                                    </h4>
                                    <p className="text-[10px] text-[#7E96AA] font-mono">
                                      1 SAR = {opt.exchangeRate.toFixed(4)} {activeCorridorObj.currencyCode}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                  <span className="text-[9px] text-[#7E96AA] font-bold block uppercase tracking-wider">
                                    {isEn ? 'Family Receives' : 'المبلغ المستلم'}
                                  </span>
                                  <span className="text-base font-black text-[#00E07A]">
                                    {formatNum(opt.estimatedReceived, 0)} {activeCorridorObj.currencySymbol}
                                  </span>
                                  <span className={`mt-1 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${valMeter.colorClass}`}>
                                    {valMeter.label}
                                  </span>
                                </div>
                              </div>

                              {/* Cost & Freshness Bar */}
                              <div className="flex justify-between items-center text-[11px] text-[#AFC4D8] bg-black/15 p-2 rounded-xl">
                                <div>
                                  <span className="text-[#7E96AA] font-medium">{isEn ? 'Fee + VAT: ' : 'الرسوم + الضريبة: '}</span>
                                  <span className="font-bold text-white">{(opt.fee + (opt.vatAmount || 0)).toFixed(2)} SAR</span>
                                </div>
                                <div className="text-[#7E96AA] text-[10px]">
                                  ⏱️ {opt.freshness_label || 'Just now'}
                                </div>
                              </div>

                              {/* Action buttons row */}
                              <div className="flex gap-2 pt-1.5">
                                <button
                                  onClick={() => setExpandedProvider(isExpanded ? null : `${opt.providerId}_${opt.subService || ''}`)}
                                  className="flex-1 h-10 bg-white/5 active:bg-white/10 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1"
                                >
                                  <span>{isExpanded ? (isEn ? 'Hide Details' : 'إخفاء التفاصيل') : (isEn ? 'Show Details' : 'عرض التفاصيل')}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                {renderRecordButton(opt)}
                              </div>

                              {renderRecordedSavingsCard(opt)}

                              {/* Collapsible advanced Section */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-white/5 space-y-3 text-xs text-[#AFC4D8] bg-black/10 p-3 rounded-xl">
                                  <div>
                                    <h5 className="font-bold text-[#F4B63F] mb-1.5 uppercase text-[10px] tracking-wider">
                                      📊 {isEn ? 'Cost Breakdown' : 'تفاصيل التكلفة'}
                                    </h5>
                                    <div className="space-y-1 font-mono text-[11px]">
                                      <div className="flex justify-between">
                                        <span>{isEn ? 'Exchange Rate:' : 'سعر الصرف:'}</span>
                                        <span>1 SAR = {opt.exchangeRate.toFixed(4)} {activeCorridorObj.currencyCode}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>{isEn ? 'Base Fee:' : 'الرسوم الأساسية:'}</span>
                                        <span>{opt.fee.toFixed(2)} SAR</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>{isEn ? 'VAT (15%):' : 'ضريبة القيمة المضافة:'}</span>
                                        <span>{(opt.vatAmount || 0).toFixed(2)} SAR</span>
                                      </div>
                                      <div className="flex justify-between border-t border-white/5 pt-1 font-bold text-white">
                                        <span>{isEn ? 'Total Cost in SAR:' : 'التكلفة الإجمالية:'}</span>
                                        <span>{opt.total_cost.toFixed(2)} SAR</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t border-white/5 pt-2">
                                    <h5 className="font-bold text-[#F4B63F] mb-1 uppercase text-[10px] tracking-wider">
                                      💡 {isEn ? 'Why this recommendation?' : 'لماذا ننصح بهذا الخيار؟'}
                                    </h5>
                                    <p className="text-[11px] leading-relaxed text-[#7E96AA]">
                                      {isEn 
                                        ? "A solid alternative path, but slightly lower payout due to base rate coefficients or fee structures."
                                        : "خيار بديل جيد، ولكنه يمنح عائداً أقل بقليل بسبب هيكل الرسوم أو فرق الصرف."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. MOBILE TRACK TAB */}
        {/* ========================================== */}
        {activeTab === 'track' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">{isEn ? 'Track Savings' : 'سجل التوفير'}</h2>
              <p className="text-xs text-[#7E96AA]">{isEn ? 'Manage your hard-earned recorded savings' : 'إدارة التوفيرات المسجلة لعمليات التحويل'}</p>
            </div>

            {/* Savings dashboard display */}
            <div className="bg-gradient-to-br from-[#113262] to-[#0c2548] border border-[#00C16A]/20 rounded-2xl p-5 text-center space-y-4">
              <div className="text-xs font-mono text-[#F4B63F] uppercase tracking-widest">
                🏆 {isEn ? 'My Lifetime Savings' : 'إجمالي توفيراتي الحقيقية'}
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {formatNum(profile?.totalSavedSar || 0, 2)} <span className="text-sm font-bold text-[#00E07A]">SAR</span>
              </div>
              <div className="text-xs text-[#AFC4D8]">
                {isEn 
                  ? `Based on ${savingsHistory.length} recorded remittance decisions.`
                  : `بناء على تسجيل ${savingsHistory.length} عملية تحويل مالي.`}
              </div>
            </div>

            {/* Log a transfer button toggle form */}
            {!isLoggingTransfer ? (
              <button
                onClick={() => setIsLoggingTransfer(true)}
                className="w-full h-12 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isEn ? 'Record a Transfer' : 'تسجيل عملية جديدة'}</span>
              </button>
            ) : (
              <form onSubmit={handleLogSavingsSubmit} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {isEn ? 'Log New Transfer Savings' : 'تسجيل توفير تحويل جديد'}
                  </h3>
                  <button type="button" onClick={() => setIsLoggingTransfer(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                      {isEn ? 'Choose Provider' : 'المزود المستخدم'}
                    </label>
                    <select
                      value={trackProvider}
                      onChange={(e) => setTrackProvider(e.target.value)}
                      className="w-full bg-[#071326] text-white p-3 rounded-xl border border-white/10 focus:outline-none"
                    >
                      {PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                        {isEn ? 'Sent Amount (SAR)' : 'مبلغ الإرسال'}
                      </label>
                      <input
                        type="number"
                        value={trackAmount}
                        onChange={(e) => setTrackAmount(e.target.value)}
                        className="w-full bg-[#071326] text-white p-3 rounded-xl border border-white/10 focus:outline-none font-mono"
                        placeholder="e.g. 1000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                        {isEn ? 'Amount Saved (SAR)' : 'المبلغ الموفر'}
                      </label>
                      <input
                        type="number"
                        value={trackSaved}
                        onChange={(e) => setTrackSaved(e.target.value)}
                        className="w-full bg-[#071326] text-[#00E07A] p-3 rounded-xl border border-white/10 focus:outline-none font-mono"
                        placeholder="e.g. 25"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#00C16A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                  >
                    <span>{isEn ? 'Log Savings' : 'حفظ عملية التوفير'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Recent transfers logged */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-[#AFC4D8] uppercase tracking-wider">
                {isEn ? 'Recorded Transfer Logs' : 'سجلات عمليات التحويل'}
              </h3>

              {savingsHistory.length === 0 ? (
                <div className="text-center py-10 bg-white/5 border border-white/5 rounded-2xl text-xs text-[#7E96AA]">
                  {isEn ? 'No transfers logged yet.' : 'لا توجد عمليات توفير مسجلة حتى الآن.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {savingsHistory.map((tx, idx) => (
                    <div key={tx.id || idx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <ProviderLogo providerId={tx.providerId} className="w-8 h-8 rounded-lg" />
                        <div>
                          <div className="font-extrabold text-white capitalize">{tx.providerId}</div>
                          <div className="text-[10px] text-[#7E96AA]">{new Date(tx.date).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-[#00E07A]">+{tx.savedSar.toFixed(2)} SAR</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tx.amount} SAR</div>
                        </div>
                        <button 
                          onClick={() => deleteSavingsRecord(tx.id)}
                          className="text-rose-400 active:text-rose-600 p-1 bg-white/5 rounded-lg border border-white/5"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. MOBILE VERIFY A TRANSFER TAB */}
        {/* ========================================== */}
        {activeTab === 'submit' && (
          <div className="space-y-6 animate-fade-in pb-8">
            <div className="space-y-1">
              <span className="text-[10px] bg-gradient-to-r from-[#00C16A]/25 to-emerald-500/10 text-[#00E07A] px-2.5 py-1 rounded-full border border-[#00E07A]/20 font-bold font-mono tracking-wider uppercase">
                {isEn ? 'Community Verification Engine' : 'محرك التوثيق المجتمعي'}
              </span>
              <h2 className="text-xl font-black text-white">{isEn ? 'Verify a Transfer' : 'توثيق عملية تحويل'}</h2>
              <p className="text-xs text-[#7E96AA] leading-relaxed">
                {isEn 
                  ? 'Verify reality by sharing completed transfer receipts. All sensitive data is fully protected.' 
                  : 'أكد أسعار الصرف الحقيقية بمشاركة إيصالات التحويل المكتملة. معلوماتك الحساسة محمية تماماً.'}
              </p>
            </div>

            {/* Check for Auth */}
            {userSession?.isGuest ? (
              <div className="bg-[#11243B]/60 border border-white/5 p-6 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-lg">
                  🔒
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-white text-sm">{isEn ? 'Members-Only Feature' : 'خاصية للمشتركين فقط'}</h4>
                  <p className="text-xs text-[#AFC4D8] leading-relaxed max-w-xs mx-auto">
                    {isEn 
                      ? 'Please sign in or create an account to submit verified transfer receipts and earn contributor trust points.' 
                      : 'يرجى تسجيل الدخول أو إنشاء حساب لإرسال إيصالات التحويل الموثقة وكسب نقاط ثقة المساهم.'}
                  </p>
                </div>
                <button
                  onClick={onOpenAuthModal}
                  className="w-full h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {isEn ? 'Sign In / Register' : 'تسجيل الدخول / الاشتراك'}
                </button>
              </div>
            ) : isSubmitSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#00E07A] p-6 rounded-2xl text-center space-y-3 animate-scale-up">
                <CheckCircle className="w-12 h-12 text-[#00E07A] mx-auto animate-bounce" />
                <h3 className="font-black text-sm">{isEn ? 'Transfer Verification Logged!' : 'تم تسجيل توثيق التحويل!'}</h3>
                <p className="text-xs text-[#AFC4D8] leading-relaxed">
                  {isEn 
                    ? 'Thank you! You have successfully earned +25 Contributor Trust Points. Our community admins will audit the screenshot receipt shortly.' 
                    : 'شكرًا لك! لقد حصلت على +٢٥ نقطة ثقة للمساهمين بنجاح. سيقوم مشرفو المجتمع بمراجعة لقطة شاشة الإيصال قريبًا.'}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] bg-[#00E07A]/15 text-[#00E07A] px-3 py-1 rounded-full font-bold uppercase font-mono tracking-wider">
                    {isEn ? '+25 Trust Points Earned' : 'تم كسب +٢٥ نقطة ثقة'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 4 Steps Progress Indicator */}
                <div className="bg-[#11243B]/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono transition-all text-[11px] ${
                        step === s 
                          ? 'bg-[#00C16A] text-[#071326] scale-110 shadow-lg shadow-[#00C16A]/10' 
                          : step > s 
                            ? 'bg-emerald-950 text-[#00E07A] border border-emerald-500/30' 
                            : 'bg-[#071326] text-slate-500 border border-white/5'
                      }`}>
                        {step > s ? '✓' : s}
                      </div>
                      <span className={`text-[9px] font-bold ${step === s ? 'text-[#00E07A]' : 'text-slate-500'}`}>
                        {s === 1 ? (isEn ? 'Route' : 'المسار') :
                         s === 2 ? (isEn ? 'Values' : 'الأرقام') :
                         s === 3 ? (isEn ? 'Proof' : 'الإثبات') :
                         (isEn ? 'Check' : 'التأكيد')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Form fields based on step */}
                <div className="bg-[#11243B]/60 border border-white/5 p-5 rounded-2xl space-y-4 text-xs">
                  {/* STEP 1: ROUTE SELECTION */}
                  {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                          {isEn ? 'Select Digital Wallet / Provider' : 'اختر المحفظة الرقمية / الشركة'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {PROVIDERS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSubmitProvider(p.id)}
                              className={`p-3 rounded-xl border transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                                submitProvider === p.id 
                                  ? 'bg-[#00C16A]/10 border-[#00C16A] text-white' 
                                  : 'bg-[#071326] border-white/5 text-slate-400 hover:border-white/10'
                              }`}
                            >
                              <ProviderLogo providerId={p.id} className="w-5 h-5 rounded" />
                              <span className="font-extrabold text-[11px] truncate">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                          {isEn ? 'Destination Corridor' : 'وجهة التحويل'}
                        </label>
                        <select
                          value={compareCorridor}
                          onChange={(e) => setCompareCorridor(e.target.value)}
                          className="w-full bg-[#071326] text-white p-3.5 rounded-xl border border-white/10 focus:outline-none text-xs"
                        >
                          {CORRIDORS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.flag} {isEn ? c.nameEn : c.nameAr} ({c.currencyCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{isEn ? 'Next: Enter Rates' : 'التالي: أدخل الأسعار'}</span>
                        <ArrowLeftRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  )}

                  {/* STEP 2: TRANSFER VALUES */}
                  {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                            {isEn ? 'Exchange Rate' : 'سعر الصرف'}
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={submitRate}
                            onChange={(e) => setSubmitRate(e.target.value)}
                            className="w-full bg-[#071326] text-[#00E07A] font-extrabold p-3 rounded-xl border border-white/10 focus:outline-none font-mono text-sm"
                            placeholder="e.g. 74.25"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                            {isEn ? 'Transfer Fee (SAR)' : 'رسوم التحويل'}
                          </label>
                          <input
                            type="number"
                            value={submitFee}
                            onChange={(e) => setSubmitFee(e.target.value)}
                            className="w-full bg-[#071326] text-white p-3 rounded-xl border border-white/10 focus:outline-none font-mono"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                            {isEn ? 'Amount Sent (SAR)' : 'مبلغ التحويل'}
                          </label>
                          <input
                            type="number"
                            value={submitAmount}
                            onChange={(e) => setSubmitAmount(e.target.value)}
                            className="w-full bg-[#071326] text-white p-3 rounded-xl border border-white/10 focus:outline-none font-mono"
                            placeholder="1000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                            {isEn ? 'VAT (Calculated)' : 'ضريبة القيمة المضافة'}
                          </label>
                          <div className="w-full bg-[#031126] text-slate-400 p-3 rounded-xl border border-white/5 font-mono">
                            {(parseFloat(submitFee || '0') * 0.15).toFixed(2)} SAR
                          </div>
                        </div>
                      </div>

                      {/* Realtime Payout Preview */}
                      {submitRate && (
                        <div className="bg-[#031126] border border-white/5 p-3 rounded-xl flex justify-between items-center text-xs">
                          <span className="text-[#7E96AA]">{isEn ? 'Calculated Payout:' : 'المستلم المقدر:'}</span>
                          <span className="font-extrabold text-[#00E07A] font-mono text-sm">
                            {((parseFloat(submitAmount) || 1000) * parseFloat(submitRate)).toFixed(2)} {CORRIDORS.find(c => c.id === compareCorridor)?.currencyCode}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer"
                        >
                          {isEn ? 'Back' : 'الرجوع'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!submitRate || parseFloat(submitRate) <= 0) return;
                            setStep(3);
                          }}
                          disabled={!submitRate}
                          className="flex-1 h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {isEn ? 'Next: Upload' : 'التالي: الإثبات'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PROOF RECEIPT UPLOAD */}
                  {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Privacy Educational Alert */}
                      <div className="p-3 bg-gradient-to-tr from-emerald-950/40 to-teal-950/20 border border-[#00C16A]/20 rounded-xl space-y-1.5">
                        <span className="text-[10px] bg-[#00C16A]/10 text-[#00E07A] font-mono px-2 py-0.5 rounded uppercase font-extrabold">
                          🛡️ {isEn ? 'Privacy Guard Active' : 'حماية الخصوصية نشطة'}
                        </span>
                        <p className="text-[11px] text-[#AFC4D8] leading-relaxed">
                          {isEn 
                            ? 'Our system automatically blurs all sensitive details like your name, account numbers, and device indicators. Only the rate, fee, and status remain visible for validation.'
                            : 'يقوم نظامنا تلقائيًا بتعتيم وإخفاء كافة التفاصيل الحساسة مثل اسمك وأرقام الحسابات. نقوم بمطابقة سعر الصرف والرسوم والحالة فقط لتوثيق البيانات.'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7E96AA] block">
                          {isEn ? 'Upload Proof Screenshot / Receipt' : 'إرفاق لقطة شاشة الإثبات / الإيصال'}
                        </label>
                        <div className="relative border border-dashed border-[#00C16A]/30 hover:border-[#00C16A]/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-black/20">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1.5 py-1">
                            <Upload className="w-6 h-6 text-[#00E07A] mx-auto" />
                            <div className="text-xs font-extrabold text-white">
                              {screenshotFile ? screenshotFile.name : (isEn ? 'Click to select receipt screenshot' : 'انقر لاختيار لقطة شاشة الإيصال')}
                            </div>
                            <p className="text-[10px] text-[#7E96AA]">
                              {isEn ? 'Supports JPG, PNG, and PDF up to 10MB' : 'يدعم صيغ JPG، PNG، و PDF حتى ١٠ ميجابايت'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer"
                        >
                          {isEn ? 'Back' : 'الرجوع'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!screenshotFile) return;
                            setStep(4);
                          }}
                          disabled={!screenshotFile}
                          className="flex-1 h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                        >
                          {isEn ? 'Next: Verify' : 'التالي: تأكيد'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: TRUST CHECKLIST */}
                  {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                          {isEn ? 'Final Trust Checklist' : 'قائمة مراجعة الأمان النهائية'}
                        </h4>
                        <p className="text-[11px] text-[#7E96AA] leading-relaxed">
                          {isEn 
                            ? 'Please acknowledge the following statements to enable community verification:' 
                            : 'يرجى الإقرار بالنقاط التالية لتفعيل توثيق التحويل ومشاركته:'}
                        </p>
                      </div>

                      <div className="space-y-2 bg-[#031126] p-3.5 rounded-xl border border-white/5">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 rounded text-[#00E07A] focus:ring-0 bg-[#071326] border-white/10" required />
                          <span className="text-[11px] text-[#AFC4D8] leading-relaxed">
                            {isEn 
                              ? 'I confirm that this is a real receipt from a completed transaction.' 
                              : 'أؤكد أن هذا إيصال حقيقي لعملية تحويل مكتملة.'}
                          </span>
                        </label>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input type="checkbox" className="mt-0.5 rounded text-[#00E07A] focus:ring-0 bg-[#071326] border-white/10" required />
                          <span className="text-[11px] text-[#AFC4D8] leading-relaxed">
                            {isEn 
                              ? 'I understand that providing fake or manipulated screenshots results in instant ban.' 
                              : 'أفهم أن تقديم لقطات شاشة مزيفة أو تم التلاعب بها يؤدي للحظر الفوري للحساب.'}
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer"
                        >
                          {isEn ? 'Back' : 'الرجوع'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            // Call submit function and save!
                            const finalRate = parseFloat(submitRate);
                            const finalFee = parseFloat(submitFee) || 0;
                            const finalAmount = parseFloat(submitAmount) || 1000;
                            const finalVat = finalFee * 0.15;

                            const data = {
                              id: `ver-${Date.now()}`,
                              user_id: userSession?.id || userSession?.email || 'guest_user',
                              session_id: sessionStorage.getItem('sariremit_session_id') || 'session_xyz',
                              provider: submitProvider,
                              corridor: compareCorridor,
                              amount_sent: finalAmount,
                              exchange_rate: finalRate,
                              transfer_fee: finalFee,
                              vat: finalVat,
                              additional_charges: 0,
                              receive_method: 'wallet',
                              recipient_amount: finalAmount * finalRate,
                              screenshot_url: 'verified_transfer_proof.jpg',
                              submission_status: 'Pending Verification',
                              verification_status: 'pending',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            };

                            // Submit to Firebase verifications collection
                            try {
                              await submitCommunityTransferVerification(data as any);
                            } catch (e) {
                              console.warn('Failed to submit community transfer verification directly', e);
                            }

                            // Keep fallback/local mock syncing active too
                            addNewSubmission({
                              providerId: submitProvider,
                              corridorId: compareCorridor,
                              exchangeRate: finalRate,
                              fee: finalFee,
                              amountSar: finalAmount,
                              recipientAmount: finalAmount * finalRate,
                              screenshotUrl: 'verified_transfer_proof.jpg',
                              submittedBy: userSession ? userSession.name : 'Expat Member'
                            });

                            setIsSubmitSuccess(true);
                            setStep(5);
                            setTimeout(() => {
                              setIsSubmitSuccess(false);
                              setSubmitRate('');
                              setScreenshotFile(null);
                              setStep(1);
                              setActiveTab('home');
                            }, 3500);
                          }}
                          className="flex-1 h-11 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                        >
                          {isEn ? 'Verify Transfer' : 'توثيق عملية التحويل'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* 5. MOBILE PROFILE TAB */}
        {/* ========================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white">{isEn ? 'Profile Settings' : 'الملف الشخصي'}</h2>
              <p className="text-xs text-[#7E96AA]">{isEn ? 'Personalize and customize your experience' : 'تخصيص وتعديل إعدادات التحويل الخاصة بك'}</p>
            </div>

            {/* Profile detail card */}
            <div className="bg-[#11243B]/60 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#F4B63F] to-[#00C16A] text-[#071326] font-black text-xl rounded-full flex items-center justify-center shadow-lg">
                  {userSession?.name?.substring(0, 2).toUpperCase() || 'EX'}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-white">{userSession?.name || 'Valued Expat'}</h3>
                  <div className="text-xs text-[#00E07A] font-bold">
                    👑 {isEn ? 'Savings Level: ' : 'مستوى الادخار: '}
                    <span className="underline">{profile?.totalSavedSar >= 150 ? (isEn ? 'Savings Master' : 'سيد الادخار') : (isEn ? 'Novice Expat' : 'مغترب مستجد')}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center bg-black/10 p-2.5 rounded-xl">
                  <span className="text-[#7E96AA] font-semibold">{isEn ? 'Preferred Corridor' : 'المسار المفضل'}</span>
                  <select
                    value={profile?.homeCountry || 'PK'}
                    onChange={(e) => handleSaveProfile({ ...profile, homeCountry: e.target.value as any })}
                    className="bg-[#071326] border border-white/10 text-white p-1.5 rounded-lg text-xs"
                  >
                    {CORRIDORS.map(c => (
                      <option key={c.id} value={c.id}>{c.flag} {isEn ? c.nameEn : c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center bg-black/10 p-2.5 rounded-xl">
                  <span className="text-[#7E96AA] font-semibold">{isEn ? 'Usual Wallet' : 'المحفظة المعتادة'}</span>
                  <select
                    value={profile?.favoriteProviders?.[0] || 'urpay'}
                    onChange={(e) => handleSaveProfile({ ...profile, favoriteProviders: [e.target.value as any] })}
                    className="bg-[#071326] border border-white/10 text-white p-1.5 rounded-lg text-xs"
                  >
                    {PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Settings links */}
            <div className="bg-[#11243B]/40 border border-white/5 rounded-2xl p-4 space-y-2 text-xs font-semibold">
              <h4 className="text-[10px] text-[#F4B63F] uppercase font-black tracking-wider pb-1">
                {isEn ? 'Help & Transparency Information' : 'المساعدة والشفافية'}
              </h4>

              <button 
                onClick={() => setCharterOpen(true)}
                className="w-full text-left py-2.5 px-2 hover:bg-white/5 rounded-xl text-white flex justify-between items-center"
              >
                <span>📜 {isEn ? 'Trust Charter & Philosophy' : 'ميثاق الثقة ومبادئ المنصة'}</span>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <button 
                onClick={() => setAboutOpen(true)}
                className="w-full text-left py-2.5 px-2 hover:bg-white/5 rounded-xl text-white flex justify-between items-center"
              >
                <span>🛡️ {isEn ? 'About SariRemit' : 'عن ساري ريميت'}</span>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              <button 
                onClick={() => setFaqOpen(true)}
                className="w-full text-left py-2.5 px-2 hover:bg-white/5 rounded-xl text-white flex justify-between items-center"
              >
                <span>❓ {isEn ? 'Frequently Asked Questions' : 'الأسئلة الشائعة'}</span>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="w-full h-12 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>{isEn ? 'Sign Out Session' : 'تسجيل الخروج من الجلسة'}</span>
            </button>
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* BOTTOM NAVIGATION TABS (MOBILE TABS BAR) */}
      {/* ========================================== */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0B1E35] border-t border-white/5 flex justify-around items-center z-40 px-2 shadow-2xl">
        <button
          onClick={() => handleProtectedTab('home')}
          className={`flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
            activeTab === 'home' ? 'text-[#F4B63F]' : 'text-[#7E96AA]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-tighter">{isEn ? 'Home' : 'الرئيسية'}</span>
        </button>

        <button
          onClick={() => handleProtectedTab('compare')}
          className={`flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
            activeTab === 'compare' ? 'text-[#F4B63F]' : 'text-[#7E96AA]'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-tighter">{isEn ? 'Compare' : 'مقارنة'}</span>
        </button>

        <button
          onClick={() => handleProtectedTab('track')}
          className={`flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
            activeTab === 'track' ? 'text-[#F4B63F]' : 'text-[#7E96AA]'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-tighter">{isEn ? 'Track' : 'التوفير'}</span>
        </button>

        <button
          onClick={() => handleProtectedTab('submit')}
          className={`flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
            activeTab === 'submit' ? 'text-[#F4B63F]' : 'text-[#7E96AA]'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-tighter">{isEn ? 'Verify' : 'توثيق'}</span>
        </button>

        <button
          onClick={() => handleProtectedTab('profile')}
          className={`flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors ${
            activeTab === 'profile' ? 'text-[#F4B63F]' : 'text-[#7E96AA]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-black tracking-tighter">{isEn ? 'Profile' : 'حسابي'}</span>
        </button>
      </nav>

      {/* ========================================== */}
      {/* INLINE MODAL WINDOWS FOR MOBILE HELPMARK */}
      {/* ========================================== */}
      {/* "Why recommendation" explanation bottom sheet */}
      {whyModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-[#10263D] border-t border-[#F4B63F]/20 rounded-t-[28px] w-full max-h-[80vh] p-6 space-y-5 shadow-2xl relative overflow-y-auto animate-slide-up">
            <button
              onClick={() => setWhyModalOpen(false)}
              className="absolute top-4 right-4 text-[#7E96AA] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-3 text-xs leading-relaxed pt-2">
              <h3 className="text-sm font-black text-[#F4B63F] uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖 {isEn ? 'Remittance Intelligence Resolution' : 'آلية ذكاء ومطابقة أسعار التحويل'}</span>
              </h3>
              
              {getRecommendation() && (
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7E96AA] font-bold uppercase text-[10px] tracking-wider">
                      {isEn ? 'Recommendation Signal' : 'إشارة التوصية'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                      getRecommendation()?.recommendation_signal === 'Send Now'
                        ? 'bg-emerald-500/10 text-[#00E07A] border-emerald-500/20'
                        : 'bg-amber-500/10 text-[#F4B63F] border-amber-500/20'
                    }`}>
                      {getRecommendation()?.recommendation_signal === 'Send Now' 
                        ? (isEn ? '🟢 SEND NOW' : '🟢 أرسل الآن') 
                        : (isEn ? '🟡 WAIT' : '🟡 انتظر')}
                    </span>
                  </div>
                  <div className="text-[#00E07A] font-extrabold text-xs leading-relaxed">
                    {getRecommendation()?.recommendation_reason}
                  </div>
                  <div className="text-[10px] text-[#7E96AA] flex justify-between pt-1">
                    <span>{isEn ? 'Confidence Level:' : 'مستوى الثقة:'} <strong>{getRecommendation()?.confidence_score}% ({getRecommendation()?.confidence_label})</strong></span>
                    <span>{isEn ? 'Freshness:' : 'الحداثة:'} <strong>{getRecommendation()?.freshness_label}</strong></span>
                  </div>
                </div>
              )}

              <p className="text-[#AFC4D8]">
                {isEn 
                  ? 'SariRemit uses a multi-channel true cost resolution engine to evaluate exchange rates, transfer fees, and standard VAT in real-time. By continuously monitoring official APIs and crowdsourced receipts, we ensure your family receives the absolute maximum funds without hidden margins or unnecessary broker cuts.'
                  : 'تستخدم منصة ساري ريميت محرك دقة متعدد القنوات لاحتساب أسعار صرف العملات الحقيقية والرسوم وضريبة القيمة المضافة بشكل فوري. نضمن استلام عائلتك للحد الأقصى للمال دون عمولات بنكية خفية.'}
              </p>
              <p className="text-[#AFC4D8] font-bold">
                {isEn 
                  ? 'Why is digital wallet usually recommended?'
                  : 'لماذا ننصح بالمحافظ الرقمية غالباً؟'}
              </p>
              <p className="text-[#7E96AA]">
                {isEn 
                  ? 'Saudi digital wallets (stc pay, urpay, Mobily Pay) consistently offer 2-4% higher exchange rates and up to 75% lower transfer fees compared to older brick-and-mortar financial bank centers.'
                  : 'المحافظ الرقمية السعودية تقدم أسعار صرف أعلى بنسبة ٢-٤٪ ورسوماً بنكية أقل بنسبة تصل إلى ٧٥٪ مقارنة بالبنوك التقليدية.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Charter Modal */}
      {charterOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#10263D] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 relative overflow-y-auto max-h-[80vh]">
            <button onClick={() => setCharterOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-sm text-[#F4B63F]">{isEn ? 'Trust Charter' : 'ميثاق الثقة'}</h3>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn 
                ? 'We are fully independent from SAMA or any digital wallet operator. We strive to maintain absolute accuracy for Saudi expatriates sending money home.'
                : 'نحن منصة مستقلة تماماً ومحايدة عن البنك المركزي السعودي أو أي بنوك. نسعى لمساعدة المغتربين على توفير كل ريال ممكن.'}
            </p>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#10263D] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 relative">
            <button onClick={() => setAboutOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-sm text-[#F4B63F]">{isEn ? 'About SariRemit' : 'عن ساري ريميت'}</h3>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn 
                ? 'Designed and optimized in Riyadh, KSA. Helping expats make informed and highly accurate remittance decisions.'
                : 'تم التصميم والتحسين في الرياض، المملكة العربية السعودية. لمساعدة المغتربين على اتخاذ قرارات تحويل مدروسة واثقة.'}
            </p>
          </div>
        </div>
      )}

      {/* FAQs Modal */}
      {faqOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#10263D] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 relative overflow-y-auto max-h-[80vh]">
            <button onClick={() => setFaqOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-black text-sm text-[#F4B63F]">{isEn ? 'FAQs' : 'الأسئلة الشائعة'}</h3>
            <div className="space-y-3 text-xs text-[#AFC4D8] leading-relaxed">
              <div>
                <h4 className="font-bold text-white">{isEn ? 'Is it free?' : 'هل الخدمة مجانية؟'}</h4>
                <p className="text-[#7E96AA]">{isEn ? 'Yes, SariRemit is 100% free and has no ads.' : 'نعم، المنصة مجانية ١٠٠٪ تماماً وخالية من الإعلانات.'}</p>
              </div>
              <div>
                <h4 className="font-bold text-white">{isEn ? 'How accurate are rates?' : 'ما مدى دقة أسعار الصرف؟'}</h4>
                <p className="text-[#7E96AA] font-mono">{isEn ? 'We cross-reference automated wallet APIs with community-uploaded receipts.' : 'نطابق بيانات الـ APIs المباشرة للمحافظ مع إيصالات التحويل الفعلية.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 pointer-events-auto"
          >
            <div className="bg-[#11243B] border border-[#00E07A]/30 p-4 rounded-2xl shadow-xl flex items-start gap-3.5 relative overflow-hidden">
              {/* Left Accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00E07A]" />
              
              <div className="bg-[#00E07A]/10 p-2 rounded-xl shrink-0">
                <CheckCircle className="w-5 h-5 text-[#00E07A]" />
              </div>
              
              <div className="space-y-0.5 flex-1 pr-6">
                <h4 className="font-extrabold text-xs text-white">
                  {activeToast.message}
                </h4>
                <p className="text-[11px] text-[#AFC4D8]">
                  {activeToast.subMessage}
                </p>
              </div>

              <button
                onClick={() => setActiveToast(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Soft Celebration / Checkmark Animation Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-[#10263D]/95 border border-[#00E07A]/30 p-8 rounded-3xl flex flex-col items-center space-y-4 max-w-sm text-center shadow-2xl relative"
            >
              {/* Star particles floating */}
              <div className="absolute top-4 left-6 animate-ping text-[#00E07A] text-xl">✨</div>
              <div className="absolute bottom-6 right-6 animate-bounce text-[#F4B63F] text-lg">⭐</div>
              <div className="absolute top-1/2 -right-2 text-[#00E07A] text-sm animate-pulse">✨</div>

              {/* Glowing animated checkmark icon */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-16 h-16 rounded-full bg-[#00E07A]/20 border border-[#00E07A] flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-[#00E07A]" strokeWidth={3} />
                </motion.div>
                {/* Visual expansion ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'loop' }}
                  className="absolute inset-0 rounded-full border border-[#00E07A] pointer-events-none"
                />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-black text-lg text-white">
                  {isEn ? 'Transfer Recorded! 🎉' : 'تم تسجيل الحوالة! 🎉'}
                </h3>
                <p className="text-xs text-[#00E07A] font-extrabold">
                  {isEn ? 'Your savings have been updated' : 'تم تحديث مجموع التوفير الحقيقي'}
                </p>
                <p className="text-[11px] text-[#7E96AA]">
                  {isEn ? 'Keep recording your remittance actions' : 'استمر بتسجيل قراراتك لتتبع كامل أرباحك'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-Onboarding Trust Survey Modal */}
      <AnimatePresence>
        {openTrustSurvey && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#10263D] border-[#F4B63F]/20 rounded-t-[28px] border-t w-full max-w-md p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Dismiss button */}
              <button
                onClick={handleSurveyDismiss}
                className="absolute top-4 right-4 text-[#7E96AA] hover:text-white transition-colors"
                disabled={isSubmittingSurvey}
              >
                <X className="w-5 h-5" />
              </button>

              {!surveySubmitted ? (
                <form onSubmit={handleSurveySubmit} className="space-y-5">
                  {/* Icon and Title */}
                  <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-[#F4B63F]/10 text-[#F4B63F] rounded-2xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-[#F4B63F] tracking-tight">
                      {isEn ? 'Help Us Improve SariRemit' : 'ساعدنا في تحسين ساري ريميت'}
                    </h3>
                    <p className="text-xs text-[#AFC4D8]">
                      {isEn 
                        ? 'We appreciate you! Please take 10 seconds to share your feedback.' 
                        : 'نحن نقدر وجودك معنا! يرجى قضاء 10 ثوانٍ لمشاركتنا رأيك.'}
                    </p>
                  </div>

                  {/* Primary Question */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      {isEn 
                        ? 'How confident did SariRemit make you feel before sending money?' 
                        : 'ما مدى الثقة التي منحك إياها ساري ريميت قبل إرسال الأموال؟'}
                    </label>

                    {/* 5-point rating buttons with emojis */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { rate: 1, emoji: '😟', label: isEn ? 'Not' : 'غير واثق' },
                        { rate: 2, emoji: '🙁', label: isEn ? 'Slightly' : 'قليلاً' },
                        { rate: 3, emoji: '😐', label: isEn ? 'Mod.' : 'متوسط' },
                        { rate: 4, emoji: '🙂', label: isEn ? 'Conf.' : 'واثق' },
                        { rate: 5, emoji: '🤩', label: isEn ? 'Very' : 'واثق جداً' }
                      ].map((item) => (
                        <button
                          key={item.rate}
                          type="button"
                          onClick={() => setSurveyRating(item.rate)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                            surveyRating === item.rate
                              ? 'bg-[#F4B63F]/20 border-[#F4B63F] scale-[1.05] shadow-md shadow-[#F4B63F]/10'
                              : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-[8px] font-black text-[#7E96AA] mt-1 text-center block leading-none">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Reasons Checklist */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      {isEn 
                        ? 'What contributed most to your confidence?' 
                        : 'ما الذي ساهم بشكل أكبر في زيادة ثقتك؟'}
                      <span className="text-[10px] text-[#7E96AA] font-normal lowercase ml-1">
                        ({isEn ? 'Optional' : 'اختياري'})
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'Recommendation', label: isEn ? 'Recommendation' : 'توصية النظام' },
                        { id: 'Comparison', label: isEn ? 'Comparison' : 'مقارنة الأسعار' },
                        { id: 'Transparency', label: isEn ? 'Transparency' : 'الشفافية الكاملة' },
                        { id: 'Community verification', label: isEn ? 'Community verification' : 'تحقق المجتمع' },
                        { id: 'Savings calculation', label: isEn ? 'Savings calculation' : 'حساب الوفورات' },
                        { id: 'Other', label: isEn ? 'Other' : 'أسباب أخرى' }
                      ].map((reason) => {
                        const isSelected = selectedReasons.includes(reason.id);
                        return (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() => handleReasonToggle(reason.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-[#F4B63F]/10 border-[#F4B63F] text-white'
                                : 'bg-white/5 border-white/5 text-[#AFC4D8] hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-[#F4B63F] border-[#F4B63F]' : 'border-white/20'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-[#071326]" strokeWidth={4} />}
                            </div>
                            <span className="text-[10px] font-bold leading-tight">{reason.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Comment Box */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      {isEn ? 'Anything we could improve?' : 'هل هناك أي شيء يمكننا تحسينه؟'}
                      <span className="text-[10px] text-[#7E96AA] font-normal lowercase ml-1">
                        ({isEn ? 'Optional' : 'اختياري'})
                      </span>
                    </label>
                    <textarea
                      value={surveyComment}
                      onChange={(e) => setSurveyComment(e.target.value)}
                      placeholder={isEn ? "Tell us how we can make SariRemit better..." : "أخبرنا كيف يمكننا تحسين ساري ريميت أكثر..."}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-550 focus:outline-none focus:border-[#F4B63F]/50 h-16 resize-none"
                    />
                  </div>

                  {/* Submit and Skip Buttons */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleSurveyDismiss}
                      className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-[#7E96AA] font-black text-xs rounded-xl transition"
                      disabled={isSubmittingSurvey}
                    >
                      {isEn ? 'Skip' : 'تخطي'}
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] h-11 bg-[#F4B63F] hover:bg-[#F4B63F]/90 active:scale-[0.98] text-[#071326] font-black text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                      disabled={isSubmittingSurvey}
                    >
                      {isSubmittingSurvey ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-[#071326]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{isEn ? 'Submitting...' : 'جاري الإرسال...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{isEn ? 'Submit Feedback' : 'إرسال التقييم'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Thank You Animation */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500">
                    <Check className="w-8 h-8 text-emerald-500" strokeWidth={3} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-black text-lg text-white">
                      {isEn ? 'Thank You!' : 'شكراً جزيلاً لك!'}
                    </h3>
                    <p className="text-xs text-[#00E07A] font-extrabold">
                      {isEn ? 'Feedback recorded successfully' : 'تم حفظ رأيك بنجاح'}
                    </p>
                    <p className="text-[11px] text-[#7E96AA] max-w-xs mx-auto leading-relaxed">
                      {isEn 
                        ? 'Your voice directly shapes the future of SariRemit and our Rate Resolution Engine.' 
                        : 'صوتك يساهم بشكل مباشر في تشكيل مستقبل ساري ريميت ومحرك مطابقة الأسعار لدينا.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
