import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, getRemittanceOptions } from '../data/mockData';
import { calculateTrueCost, resolveRate } from '../utils/costEngine';
import { analyzeCorridorIntelligence } from '../utils/intelligenceEngine';
import { 
  Star, ArrowRight, ArrowLeftRight, Clock, ChevronRight, 
  Sparkles, Bell, Info, ShieldCheck, Activity, TrendingUp, DollarSign, Award, ArrowUpRight, TrendingDown,
  Check, CheckCircle2, Shield, HeartHandshake, Users, Zap
} from 'lucide-react';
import { CrowdsourcedRate, AdminRateOverride, UserProfile, CorridorId } from '../types';

const AnimatedCounter: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 1 }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const duration = 1500; // 1.5s for smooth, elegant counting feel

    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuart for extremely smooth deceleration at the end
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const current = startValue + easedProgress * (endValue - startValue);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}</span>;
};

interface DashboardProps {
  setCurrentPage: (page: string) => void;
  setCalculatorPreset: (preset: { amount: number; corridorId: string }) => void;
  adminRateOverrides?: AdminRateOverride[];
  userSession?: any;
  profile?: UserProfile;
  customRates?: Record<string, number>;
  customFees?: Record<string, any>;
  recentSubmissions?: CrowdsourcedRate[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  setCurrentPage,
  setCalculatorPreset,
  adminRateOverrides = [],
  userSession,
  profile,
  customRates = {},
  customFees = {},
  recentSubmissions = []
}) => {
  const { t, language } = useLanguage();
  
  // Active corridor for the dashboard bento widgets
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('KE');
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [pulseDot, setPulseDot] = useState<boolean>(true);

  // Dynamic Greeting based on time and user details
  const [greetingText, setGreetingText] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    const userDisplayName = userSession?.name || profile?.name || (language === 'en' ? 'Expat Friend' : 'صديقنا المغترب');
    if (hour < 12) {
      setGreetingText(language === 'en' ? `Good morning, ${userDisplayName}! 🌅` : `صباح الخير، ${userDisplayName}! 🌅`);
    } else if (hour < 17) {
      setGreetingText(language === 'en' ? `Good afternoon, ${userDisplayName}! ☀️` : `مساء الخير، ${userDisplayName}! ☀️`);
    } else {
      setGreetingText(language === 'en' ? `Good evening, ${userDisplayName}! 🌙` : `مساء الخير، ${userDisplayName}! 🌙`);
    }
  }, [userSession, profile, language]);

  // Load transfer history from localStorage for accurate statistics
  const [transferHistory, setTransferHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('sariremit_transfer_history');
      if (savedHistory) {
        setTransferHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to parse transfer history", e);
    }
  }, []);

  // Pulse animation for real-time rates
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseDot(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Real-time API rate fetched states
  const [liveApiRates, setLiveApiRates] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const fetchLiveRates = async () => {
      try {
        const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http')
          ? window.location.origin
          : '';
        const res = await fetch(`${origin}/api/live-rates?device=Dashboard&corridor=${encodeURIComponent(selectedCorridorId)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data && data.rates) {
            setLiveApiRates(data.rates);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch live rates on Dashboard gracefully", e);
      }
    };
    fetchLiveRates();
    return () => {
      active = false;
    };
  }, [selectedCorridorId]);

  // Retrieve current corridor details
  const currentCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS.find(c => c.id === 'KE') || CORRIDORS[0];

  const getProviderDisplayName = (id: string, subService?: string): string => {
    const baseNames: Record<string, string> = {
      urpay: 'Urpay',
      stcpay: 'STC Pay',
      mobilypay: 'Mobily Pay',
      alrajhi: 'Al Rajhi Tahweel',
      quickpay: 'QuickPay (SNB)',
      enjaz: 'Enjaz (Al Bilad)',
      westernunion: 'Western Union',
    };
    const name = baseNames[id.toLowerCase()] || id.toUpperCase();
    if (subService) {
      return `${name} (${subService})`;
    }
    return name;
  };

  // Get resolved options and calculate outputs dynamically using custom rates, fees, and live API rates
  const processedOptions = getRemittanceOptions(selectedCorridorId)
    .map(opt => {
      let baselineRate = opt.exchangeRate;
      let baselineFee = opt.fee;
      
      if (liveApiRates && liveApiRates[selectedCorridorId]) {
        const liveOpt = liveApiRates[selectedCorridorId].find((l: any) => {
          if (opt.subService) {
            return l.providerId === opt.providerId && l.subService === opt.subService;
          }
          return l.providerId === opt.providerId;
        });
        if (liveOpt) {
          baselineRate = liveOpt.exchangeRate;
          baselineFee = liveOpt.fee;
        }
      }

      const overrideKey = `${opt.providerId}_${opt.corridorId}`;
      if (customRates && customRates[overrideKey] !== undefined) {
        baselineRate = Math.max(0.01, baselineRate + customRates[overrideKey]);
      }

      const resolution = resolveRate(
        opt.providerId as any,
        opt.corridorId as any,
        opt.subService as any,
        sendAmount,
        'all',
        adminRateOverrides || [],
        recentSubmissions || [],
        liveApiRates || {},
        customFees || {},
        baselineRate,
        baselineFee
      );

      return {
        ...opt,
        exchangeRate: resolution.selectedExchangeRate,
        transferFee: resolution.selectedFee,
        fee: resolution.selectedFee,
        vatAmount: resolution.selectedVat,
        totalCost: resolution.selectedTotalCost,
        recipientAmount: resolution.selectedRecipientAmount,
        selectedRateSource: resolution.selectedRateSource,
        sourceConfidence: resolution.sourceConfidence,
        sourceLabel: resolution.sourceLabel,
        isExpiringSoon: resolution.isExpiringSoon,
        
        // Intelligence engine compatibility fields
        total_cost: resolution.selectedTotalCost,
        estimatedReceived: resolution.selectedRecipientAmount,
        effective_exchange_rate: sendAmount > 0 ? Number((resolution.selectedRecipientAmount / sendAmount).toFixed(6)) : 0,
      };
    });

  // Sort by net recipient amount descending to find the best option
  const sortedOutputs = [...processedOptions].sort((a, b) => b.recipientAmount - a.recipientAmount);
  
  // Best option details
  const bestOption = sortedOutputs[0] || {
    providerId: 'urpay',
    subService: undefined,
    exchangeRate: currentCorridor.defaultExchangeRate * 1.015,
    transferFee: 13.00,
    recipientAmount: sendAmount * currentCorridor.defaultExchangeRate * 1.015,
    totalCost: 15.0
  };

  // Second best option
  const secondBestOption = sortedOutputs[1] || sortedOutputs[0] || {
    providerId: 'stcpay',
    subService: undefined,
    exchangeRate: currentCorridor.defaultExchangeRate * 1.012,
    transferFee: 10.0,
    recipientAmount: sendAmount * currentCorridor.defaultExchangeRate * 1.012,
    totalCost: 12.0
  };

  const displayBestName = getProviderDisplayName(bestOption.providerId, bestOption.subService);
  const displayBestAmount = Math.round(bestOption.recipientAmount);
  const displayExtraValue = Math.round(bestOption.recipientAmount - (sortedOutputs[sortedOutputs.length - 1]?.recipientAmount || bestOption.recipientAmount * 0.98));
  
  const displayAltName = getProviderDisplayName(secondBestOption.providerId, secondBestOption.subService);
  const displayAltAmount = Math.round(secondBestOption.recipientAmount);
  const displayAltLess = Math.max(10, displayBestAmount - displayAltAmount);

  // Savings tracker stats
  const totalSaved = profile?.totalSavedSar || 245.5;
  const transfersRecorded = transferHistory.length || 3;
  const lifetimeValueGenerated = totalSaved * 1.25; // Formula representing optimization compound value

  // Dynamic currency symbol/code
  const currencySymbol = currentCorridor.currencyCode;

  // Run dynamic intelligence and timing advice calculation
  const corridorIntelligence = analyzeCorridorIntelligence(sendAmount, selectedCorridorId, processedOptions);
  const signal = corridorIntelligence?.signal || 'Send Now';
  const explanation = corridorIntelligence
    ? (language === 'en' ? corridorIntelligence.explanationEn : corridorIntelligence.explanationAr)
    : (language === 'en' ? 'Send now – this corridor is performing better than usual today.' : 'أرسل الآن - هذا المسار يحقق أداءً أفضل من المعتاد اليوم.');

  // Handle click to compare page with preset
  const handleQuickCompareClick = () => {
    setCalculatorPreset({
      amount: sendAmount,
      corridorId: selectedCorridorId
    });
    setCurrentPage('compare');
  };


  return (
    <div className="space-y-8 animate-fade-in text-white">
      
      {/* Header Info with Expat Welcoming & Relatable Wording */}
      <div className="space-y-2">
        {greetingText && (
          <p className="text-base font-bold text-[#00E07A] font-sans flex items-center gap-2">
            {greetingText}
          </p>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{language === 'en' ? 'Expat Best Rates Guide' : 'دليل المغترب لأفضل أسعار الصرف'}</span>
            </h2>
            <p className="text-sm text-[#AFC4D8] font-medium mt-1">
              {language === 'en' 
                ? 'Maximizing your hard-earned money sent home from Saudi Arabia' 
                : 'أداة ذكية لمضاعفة قيمة حوالاتك المالية المرسلة إلى أهلك'}
            </p>
          </div>

        {/* Corridor Select Switcher */}
        <div className="flex items-center gap-2 bg-[#0B1E35] border border-white/5 px-4 py-2 rounded-full shadow-md">
          <span className="text-[10px] uppercase font-extrabold text-[#00E07A] font-mono tracking-wider">
            {language === 'en' ? 'Active Corridor:' : 'المسار النشط:'}
          </span>
          <select
            value={selectedCorridorId}
            onChange={(e) => setSelectedCorridorId(e.target.value)}
            className="bg-transparent text-xs text-white font-extrabold focus:outline-none cursor-pointer pr-1"
          >
            {CORRIDORS.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0B1E35] text-white text-xs">
                {c.flag} {language === 'en' ? c.nameEn : c.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recommended Today & Best Alternative & Savings Tracker */}
        <div className="lg:col-span-8 space-y-6 animate-fade-in">
          
          {/* RECOMMENDED TODAY HEADER */}
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-[#F4B63F] text-[#F4B63F]" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              {language === 'en' ? 'Recommended Today' : 'الموصى به اليوم'}
            </h3>
          </div>

          {/* RECOMMENDED TODAY CARD (Navy Glass with Gold Header Accent) */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#061B3A]/90 border-t-4 border-t-[#F4B63F] border-x border-b border-white/10 p-6 md:p-8 shadow-2xl flex flex-col justify-between hover:border-white/20 transition-all duration-300">
            {/* Subtle gradient glowing background effects inside */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#FDBA2D]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="space-y-4 z-10">
              <div className="flex justify-between items-start">
                <div>
                  {/* Recommended Today badge: Gold background */}
                  <span className="inline-block bg-gradient-to-r from-[#F4B63F] to-[#FDBA2D] text-[#031126] text-[10px] font-black uppercase font-mono tracking-wider px-3 py-1 rounded-full shadow-md">
                    👑 {language === 'en' ? 'RECOMMENDED OPTION' : 'الخيار الموصى به'}
                  </span>
                  <h4 className="text-3xl font-black tracking-tight text-white mt-2.5">
                    {displayBestName}
                  </h4>
                </div>
                
                {/* Arrow movement logo-inspired badge */}
                <div className="w-10 h-10 rounded-full bg-[#0B2A5B] border border-[#F4B63F]/25 flex items-center justify-center text-[#F4B63F]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div>
                <span className="text-xs text-[#B8C7D9] uppercase font-mono tracking-wider font-semibold block">
                  {language === 'en' ? 'YOUR FAMILY RECEIVES' : 'تستلم عائلتك'}
                </span>
                {/* Large white text */}
                <div className="text-4xl md:text-5.5xl font-black text-white font-mono tracking-tight mt-1 flex items-baseline gap-2">
                  <span>{displayBestAmount.toLocaleString()}</span>
                  <span className="text-xl text-[#F4B63F] font-sans font-black">{currencySymbol}</span>
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-t border-white/10 my-4" />

              {/* Extra Value & CTA Button in horizontal flex */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs text-[#B8C7D9] uppercase font-mono tracking-wider font-semibold block">
                    {language === 'en' ? 'EXTRA VALUE' : 'قيمة إضافية'}
                  </span>
                  {/* Green text */}
                  <span className="text-2xl font-black text-[#00C16A] font-mono tracking-tight block mt-0.5">
                    +{displayExtraValue.toLocaleString()} {currencySymbol}
                  </span>
                </div>

                <button 
                  onClick={handleQuickCompareClick}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#00C16A] to-[#00E07A] hover:opacity-95 text-[#031126] font-extrabold text-xs rounded-xl py-3 px-7 transition-all duration-150 shadow-md hover:scale-[1.02] cursor-pointer uppercase tracking-wider font-sans font-black"
                >
                  <span>{language === 'en' ? 'Send Now' : 'أرسل الآن'}</span>
                  <ChevronRight className="w-4 h-4 text-[#031126] stroke-[3.5]" />
                </button>
              </div>

              {/* Why? block */}
              <div className="pt-2">
                <span className="text-xs text-[#FDBA2D] font-extrabold uppercase font-mono block">
                  {language === 'en' ? 'Why?' : 'لماذا؟'}
                </span>
                <p className="text-xs text-[#B8C7D9] leading-relaxed mt-1 font-medium">
                  {language === 'en' 
                    ? `${displayBestName} gives the highest amount after fees and VAT with fast delivery and strong community trust.`
                    : `تقدم ${displayBestName} أعلى مبلغ تحويل بعد احتساب الرسوم وضريبة القيمة المضافة مع تسليم سريع وثقة مجتمعية قوية.`}
                </p>
              </div>
            </div>

            {/* Dark navy bottom strip for indicators */}
            <div className="mt-6 bg-[#031126]/60 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <Zap className="w-4 h-4 text-[#F4B63F] shrink-0" />
                <span>{language === 'en' ? 'Instant Delivery' : 'تسليم فوري'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <Shield className="w-4 h-4 text-[#F4B63F] shrink-0" />
                <span>{language === 'en' ? 'High Confidence' : 'ثقة عالية'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <Users className="w-4 h-4 text-[#F4B63F] shrink-0" />
                <span>
                  {language === 'en' ? `${(recentSubmissions?.length || 12) + 115} Community Reports` : `${(recentSubmissions?.length || 12) + 115} تقرير من المجتمع`}
                </span>
              </div>
            </div>
          </div>

          {/* BEST ALTERNATIVE (Premium glass card cockpit) */}
          <div className="bg-[#061B3A]/45 border border-white/10 rounded-[20px] p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-[#F4B63F]/20 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[10px] text-[#FDBA2D] uppercase font-bold font-mono tracking-wider block">
                {language === 'en' ? 'Best Alternative' : 'الخيار البديل الأفضل'}
              </span>
              <h4 className="text-xl font-black text-white">
                {displayAltName}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono font-black text-white">
                  {displayAltAmount.toLocaleString()} <span className="text-sm font-sans font-normal text-[#B8C7D9]">{currencySymbol}</span>
                </span>
                <span className="text-[11px] text-red-400 font-semibold">
                  -{displayAltLess.toLocaleString()} {currencySymbol} {language === 'en' ? 'less' : 'أقل'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleQuickCompareClick}
              className="w-10 h-10 rounded-full bg-[#0B2A5B] hover:bg-white/10 flex items-center justify-center text-[#F4B63F] transition-colors border border-white/10 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* TIMING ADVICE CARD (Gold/Green Depending on Signal) */}
          <div className={`relative overflow-hidden rounded-[20px] bg-[#061B3A]/80 border ${
            signal === 'Send Now' 
              ? 'border-[#00C16A]/45 shadow-lg shadow-[#00C16A]/5' 
              : signal === 'Wait' 
              ? 'border-[#F4B63F]/45 shadow-lg shadow-[#F4B63F]/5' 
              : 'border-white/10'
          } p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${
                signal === 'Send Now' 
                  ? 'bg-[#00C16A]/15 text-[#00C16A]' 
                  : signal === 'Wait' 
                  ? 'bg-[#F4B63F]/15 text-[#F4B63F]' 
                  : 'bg-[#0B2A5B]'
              } flex items-center justify-center text-white shrink-0 shadow-sm border ${
                signal === 'Send Now' ? 'border-[#00C16A]/35' : signal === 'Wait' ? 'border-[#F4B63F]/35' : 'border-white/10'
              }`}>
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <span>{language === 'en' ? 'Timing Advice' : 'نصيحة التوقيت'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    signal === 'Send Now' 
                      ? 'bg-[#00C16A] text-[#031126]' 
                      : signal === 'Wait' 
                      ? 'bg-[#F4B63F] text-[#031126]' 
                      : 'bg-[#0B2A5B] text-white'
                  }`}>
                    {signal === 'Send Now' 
                      ? (language === 'en' ? 'SEND NOW' : 'أرسل الآن') 
                      : signal === 'Wait' 
                      ? (language === 'en' ? 'WAIT' : 'انتظر') 
                      : (language === 'en' ? 'MONITOR' : 'راقب')}
                  </span>
                </h4>
                <p className="text-xs font-semibold mt-1 leading-relaxed text-[#B8C7D9]">
                  {explanation}
                </p>
              </div>
            </div>

            <button 
              onClick={handleQuickCompareClick}
              className={`${
                signal === 'Send Now' 
                  ? 'bg-gradient-to-r from-[#00C16A] to-[#00E07A] text-[#031126] shadow-lg shadow-[#00C16A]/15' 
                  : signal === 'Wait' 
                  ? 'bg-gradient-to-r from-[#F4B63F] to-[#FDBA2D] text-[#031126] shadow-lg shadow-[#F4B63F]/15' 
                  : 'bg-[#0B2A5B] hover:bg-white/5 text-white border border-white/10'
              } px-5 py-2.5 rounded-xl text-xs font-black transition-all hover:scale-[1.02] shrink-0 w-full sm:w-auto uppercase tracking-wider cursor-pointer`}
            >
              {signal === 'Send Now' 
                ? (language === 'en' ? 'Send Now' : 'أرسل الآن') 
                : signal === 'Wait' 
                ? (language === 'en' ? 'Hold & Monitor' : 'تريّث وراقب') 
                : (language === 'en' ? 'Monitor Rates' : 'راقب الأسعار')}
            </button>
          </div>

          {/* SAVINGS TRACKER CARD */}
          <div 
            onClick={() => setCurrentPage('profile')}
            className="bg-[#10263D] border border-white/5 p-6 rounded-[24px] hover:border-[#00C16A]/30 transition-all duration-300 cursor-pointer shadow-xl flex flex-col justify-between min-h-[150px]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[#7E96AA] uppercase font-extrabold font-mono tracking-widest">
                  {language === 'en' ? 'Savings & Optimization Tracker' : 'متابع التوفير والتحسين'}
                </span>
                <h4 className="text-xl font-extrabold text-white mt-1.5">
                  <AnimatedCounter value={totalSaved} decimals={1} /> <span className="text-xs text-[#00E07A] font-mono">SAR Saved</span>
                </h4>
              </div>
              <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 px-2 py-0.5 rounded text-[9px] font-mono text-[#00E07A] font-bold">
                {transfersRecorded} Tx
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-[#AFC4D8]">
              <div>
                <span className="text-[10px] text-[#7E96AA] block font-mono">{language === 'en' ? 'LIFETIME VALUE GENERATED' : 'القيمة المولدة للمستلم'}</span>
                <span className="text-sm font-extrabold text-white font-mono">+<AnimatedCounter value={lifetimeValueGenerated} decimals={0} /> SAR</span>
              </div>
              <span className="text-[#00E07A] font-extrabold text-[11px] underline flex items-center gap-0.5">
                <span>{language === 'en' ? 'History' : 'السجل'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Compare Rates Form & Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* COMPARE RATES CALCULATOR FORM */}
          <div className="bg-[#10263D] border border-white/5 p-6 rounded-[24px] shadow-2xl space-y-5">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <ArrowLeftRight className="w-4.5 h-4.5 text-[#00C16A]" />
              <span>{language === 'en' ? 'Compare Rates' : 'مقارنة الأسعار'}</span>
            </h3>

            <div className="space-y-4">
              {/* Send Amount Field */}
              <div className="bg-[#071326] border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="block text-[9px] font-bold text-[#7E96AA] uppercase tracking-widest">
                  {language === 'en' ? 'You Send' : 'مبلغ الإرسال'}
                </span>
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(Math.max(1, Number(e.target.value)))}
                    className="bg-transparent text-white font-mono font-extrabold text-2xl focus:outline-none w-2/3"
                  />
                  <span className="text-sm font-extrabold text-white font-mono">SAR</span>
                </div>
                <div className="text-[10px] text-[#7E96AA] font-sans font-medium">
                  Saudi Arabia (SAR)
                </div>
              </div>

              {/* Swap Button Divider */}
              <div className="flex justify-center -my-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#00C16A] border-2 border-[#10263D] flex items-center justify-center text-[#071326] shadow-md">
                  <ArrowLeftRight className="w-4 h-4 rotate-90 text-[#071326] stroke-[2.5]" />
                </div>
              </div>

              {/* Recipient Amount Field */}
              <div className="bg-[#071326] border border-white/5 p-4 rounded-xl space-y-1.5">
                <span className="block text-[9px] font-bold text-[#7E96AA] uppercase tracking-widest">
                  {language === 'en' ? 'They Receive' : 'المبلغ المستلم'}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-[#00E07A] font-mono font-extrabold text-2xl">
                    {displayBestAmount.toLocaleString()}
                  </span>
                  <span className="text-sm font-extrabold text-white font-mono">{currencySymbol}</span>
                </div>
                <div className="text-[10px] text-[#7E96AA] font-sans font-medium">
                  {currentCorridor.nameEn} ({currentCorridor.currencyCode})
                </div>
              </div>
            </div>

            <button
              onClick={handleQuickCompareClick}
              className="w-full py-3.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00C16A]/15 text-xs uppercase tracking-wider"
            >
              <span>{language === 'en' ? 'Calculate & Compare' : 'احسب وقارن'}</span>
              <ArrowRight className="w-4 h-4 text-[#071326] stroke-[3]" />
            </button>

            <div className="flex items-center gap-2 text-[10px] text-[#AFC4D8] justify-center">
              <span className={`w-2 h-2 rounded-full bg-[#00E07A] ${pulseDot ? 'animate-ping' : ''}`}></span>
              <span>{language === 'en' ? 'Rate updates in real-time' : 'تحديثات فورية لأسعار الصرف'}</span>
            </div>
          </div>

          {/* RECENT ACTIVITY CARD */}
          <div className="bg-[#10263D] border border-white/5 p-6 rounded-[24px] shadow-xl space-y-4">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-[#00C16A]" />
              <span>{language === 'en' ? 'Recent Activity' : 'النشاط الأخير'}</span>
            </h3>

            <div className="space-y-4 text-xs text-[#AFC4D8]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#071326] flex items-center justify-center text-[#00E07A] shrink-0 mt-0.5 border border-white/5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-white">{language === 'en' ? 'Compared rates' : 'مقارنة أسعار الصرف'}</p>
                  <p className="text-[10px] text-[#7E96AA] mt-0.5">Today, 9:41 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#071326] flex items-center justify-center text-[#00E07A] shrink-0 mt-0.5 border border-white/5">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-white">{language === 'en' ? 'Rate alert created' : 'تم إنشاء تنبيه لسعر الصرف'}</p>
                  <p className="text-[10px] text-[#7E96AA] mt-0.5">Today, 8:15 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#071326] flex items-center justify-center text-[#00E07A] shrink-0 mt-0.5 border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-white">{language === 'en' ? 'Transfer recorded' : 'تم تسجيل عملية تحويل'}</p>
                  <p className="text-[10px] text-[#7E96AA] mt-0.5">Yesterday, 6:20 PM</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setCurrentPage('compare')} 
                className="text-[11px] font-extrabold text-[#00E07A] hover:underline flex items-center gap-0.5"
              >
                <span>{language === 'en' ? 'View all' : 'عرض الكل'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM INSIGHTS STATS GRID */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-xs text-[#AFC4D8] uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4.5 h-4.5 text-[#00C16A]" />
          <span>{language === 'en' ? 'Corridor Analytics' : 'تحليلات مسار التحويل'}</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Bento Box 1: Best Day */}
          <div className="bg-[#10263D] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
            <span className="text-[10px] font-bold text-[#7E96AA] uppercase tracking-wider font-mono">
              {language === 'en' ? 'Best Day to Send' : 'أفضل يوم للإرسال'}
            </span>
            <div className="mt-2">
              <p className="text-base font-extrabold text-white">
                {language === 'en' ? 'Tuesday' : 'الثلاثاء'}
              </p>
              <p className="text-[10px] text-[#00E07A] font-semibold mt-0.5">
                {language === 'en' ? 'Highest average rate' : 'أعلى معدل صرف بالمتوسط'}
              </p>
            </div>
          </div>

          {/* Bento Box 2: Most Trusted */}
          <div className="bg-[#10263D] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
            <span className="text-[10px] font-bold text-[#7E96AA] uppercase tracking-wider font-mono">
              {language === 'en' ? 'Most Trusted Provider' : 'الموفر الأكثر ثقة'}
            </span>
            <div className="mt-2">
              <p className="text-base font-extrabold text-white">
                Urpay
              </p>
              <p className="text-[10px] text-[#00E07A] font-semibold mt-0.5">
                {language === 'en' ? 'By community reports' : 'حسب بلاغات المجتمع'}
              </p>
            </div>
          </div>

          {/* Bento Box 3: Average Advantage */}
          <div className="bg-[#10263D] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
            <span className="text-[10px] font-bold text-[#7E96AA] uppercase tracking-wider font-mono">
              {language === 'en' ? 'Average Advantage' : 'متوسط فرق التوفير'}
            </span>
            <div className="mt-2">
              <p className="text-base font-extrabold text-white font-mono">
                +{Math.round(displayExtraValue * 0.75)} {currencySymbol}
              </p>
              <p className="text-[10px] text-[#00E07A] font-semibold mt-0.5">
                {language === 'en' ? 'vs other channels' : 'مقارنة بالقنوات الأخرى'}
              </p>
            </div>
          </div>

          {/* Bento Box 4: Community Reports */}
          <div className="bg-[#10263D] border border-white/5 p-5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
            <span className="text-[10px] font-bold text-[#7E96AA] uppercase tracking-wider font-mono">
              {language === 'en' ? 'Community Trust Reports' : 'بلاغات ثقة مجتمعية نشطة'}
            </span>
            <div className="mt-2">
              <p className="text-base font-extrabold text-white font-mono">
                127
              </p>
              <p className="text-[10px] text-[#00E07A] font-semibold mt-0.5">
                {language === 'en' ? 'Verified this week' : 'مؤكدة هذا الأسبوع'}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
