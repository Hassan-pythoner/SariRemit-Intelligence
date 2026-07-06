import React, { useState, useEffect } from 'react';
import { SariRemitLogo } from './SariRemitLogo';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, getRemittanceOptions } from '../data/mockData';
import heroBgImage from '../assets/images/expat_hero_banner_1782686371491.jpg';
import { 
  ArrowRight, ShieldCheck, Users, TrendingUp, ArrowLeft, CheckCircle, 
  Zap, Sparkles, Info, HelpCircle, ChevronDown, ChevronUp, Star, Award, Landmark,
  Check, Activity, Clock, Globe, ArrowUpRight, Lock, Heart, MessageSquare, AlertCircle
} from 'lucide-react';
import { CrowdsourcedRate } from '../types';
import { trackEvent } from '../lib/firebase';
import { About } from './About';
import { Resources } from './Resources';
import { getOptionTimestamp, formatRelativeTime } from '../utils/timestampHelper';
import { getResolvedRecommendation } from '../utils/recommendationEngine';

interface LandingPageProps {
  setCurrentPage: (page: string) => void;
  setCalculatorPreset: (preset: { amount: number; corridorId: string }) => void;
  recentSubmissions: CrowdsourcedRate[];
  upvoteSubmission: (id: string) => void;
  onOpenAuthModal?: () => void;
  onContinueAsGuest?: () => void;
  onSelectResourceTab?: (tab: string) => void;
  resourcesSubTab?: string;
  resolvedRates?: any[];
  adminRateOverrides?: any[];
  marketReferenceRates?: any[];
  communityConsensuses?: any[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setCurrentPage,
  setCalculatorPreset,
  recentSubmissions,
  upvoteSubmission,
  onOpenAuthModal,
  onContinueAsGuest,
  onSelectResourceTab,
  resourcesSubTab = 'faq',
  resolvedRates = [],
  adminRateOverrides = [],
  marketReferenceRates = [],
  communityConsensuses = [],
}) => {
  const { t, language, isRtl } = useLanguage();
  const isEn = language === 'en';

  useEffect(() => {
    trackEvent('Landing Page View', { event_type: 'page_view' });
  }, []);
  
  // Hero State
  const [quickAmount, setQuickAmount] = useState<number>(2000);
  const [quickCorridor, setQuickCorridor] = useState<string>('PK');

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleQuickCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenAuthModal) {
      onOpenAuthModal();
      return;
    }
    setCalculatorPreset({
      amount: quickAmount,
      corridorId: quickCorridor,
    });
    setCurrentPage('compare');
  };

  const selectedCorridorObj = CORRIDORS.find(c => c.id === quickCorridor) || CORRIDORS[0];

  // Resolve recommendation using the Single Source of Truth
  const recommendation = getResolvedRecommendation({
    amount: quickAmount,
    corridor: quickCorridor,
    receiveMethod: 'all',
    adminRateOverrides,
    recentSubmissions,
    resolvedRates,
    marketReferenceRates,
    communityConsensuses
  });

  const previewReceivedAmount = recommendation ? Math.round(recommendation.recipient_amount) : 0;
  const previewExtraSavingsDest = recommendation ? Math.round(recommendation.extra_value) : 0;
  const bestOptionRelativeTime = recommendation 
    ? formatRelativeTime(recommendation.updated_at, isEn ? 'en' : 'ar')
    : '';

  const getConfidenceTranslation = (label: string) => {
    if (label === 'High') return isEn ? 'High' : 'مرتفع';
    if (label === 'Medium') return isEn ? 'Medium' : 'متوسط';
    return isEn ? 'Low' : 'منخفض';
  };

  const getSignalTranslation = (sig: string) => {
    if (sig === 'Send Now') return isEn ? 'SEND NOW' : 'أرسل الآن';
    if (sig === 'Wait') return isEn ? 'WAIT' : 'انتظر';
    return isEn ? 'MONITOR' : 'راقب';
  };

  // FAQs
  const faqs = [
    {
      qEn: 'What is SariRemit Remittance Intelligence?',
      qAr: 'ما هي استخبارات التحويلات المالية من ساري ريميت؟',
      aEn: 'SariRemit is an independent intelligence platform that maps and cross-references live digital wallets (urpay, stc pay, Mobily Pay), bank services, and real-time crowdsourced receipts. We do not transfer money ourselves—we ensure you choose the exact path that puts the absolute maximum funds into your family’s hands.',
      aAr: 'ساري ريميت هي منصة استخبارات مستقلة تقوم بمسح ومطابقة أسعار المحافظ الرقمية الحية (مثل يورباي، إس تي سي باي، وموبايلي باي)، والخدمات المصرفية، وإيصالات التحويل الفعلية المرفوعة من مجتمع المغتربين. نحن لا نقوم بتحويل الأموال بأنفسنا، بل نضمن لك اختيار الطريق الذي يضع أكبر مبلغ ممكن في أيدي عائلتك.',
    },
    {
      qEn: 'How are the rates and freshness calculated?',
      qAr: 'كيف يتم حساب أسعار الصرف وحداثة البيانات؟',
      aEn: 'We employ a multi-channel Rate Resolution Engine (RRE) that constantly crawls official partner channels, checks automated API parameters, and validates physical screenshot slips uploaded by our community. Each recommendation displays a "Confidence Score" and exact "Freshness minutes" so you never hit stale quotes.',
      aAr: 'نحن نستخدم محرك تسوية الأسعار (RRE) متعدد القنوات والذي يقوم بمراقبة أسعار الشركات باستمرار، وفحص معاملات الـ API المؤتمتة، والتحقق من لقطات شاشة إيصالات التحويل الفعلية المرفوعة من المغتربين. تظهر كل توصية وبجانبها "مؤشر الثقة" و "دقائق التحديث" لضمان عدم مواجهتك لأسعار قديمة.',
    },
    {
      qEn: 'Why are digital wallets generally recommended over branch transfers?',
      qAr: 'لماذا يُنصح بالمحافظ الرقمية غالباً بدلاً من فروع التحويل التقليدية؟',
      aEn: 'Our intelligence shows that Saudi digital wallets (stc pay, urpay, Mobily Pay) consistently offer 2-4% higher exchange rates and up to 75% lower transaction fees with zero hidden margins compared to physical banks. For a 2,000 SAR transfer, this choice alone can generate over 120 SAR in extra value home.',
      aAr: 'تظهر بياناتنا الاستخباراتية أن المحافظ الرقمية السعودية (إس تي سي باي، يورباي، وموبايلي باي) تقدم باستمرار أسعار صرف أعلى بنسبة ٢-٤٪ ورسوماً أقل بنسبة تصل إلى ٧٥٪ مع انعدام الهوامش الخفية مقارنة بالبنوك التقليدية. لعملية تحويل بقيمة ٢,٠٠٠ ريال، فإن هذا الاختيار وحده يمكن أن يوفر أكثر من ١٢٠ ريالاً كقيمة إضافية لعائلتك.',
    },
    {
      qEn: 'Does SariRemit charge any hidden commissions?',
      qAr: 'هل يتقاضى ساري ريميت أي عمولات خفية؟',
      aEn: 'Never. SariRemit is 100% free for the expatriate community. We do not accept sponsored placements to bias rankings, we do not take bank cuts, and we are entirely independent. Our sole mission is to ensure every hard-earned Riyal works as hard as you do.',
      aAr: 'أبداً. ساري ريميت مجاني بنسبة ١٠٠٪ لمجتمع المغتربين. نحن لا نقبل أي رعايات مدفوعة تؤثر على نزاهة الترتيب، ولا نأخذ عمولات بنكية، ونحن مستقلون بالكامل. مهمتنا الوحيدة هي ضمان أن يعمل كل ريال تكسبه بجهدك بأقصى كفاءة ممكنة لعائلتك.',
    }
  ];

  return (
    <div className="space-y-24 pb-24 text-white animate-fade-in relative bg-[#0a2346] overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. CINEMATIC PREMIUM HERO SECTION */}
      <section 
        className="relative min-h-[90vh] flex items-center pt-24 pb-20 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(10, 35, 70, 0.4) 0%, rgba(7, 26, 52, 0.95) 85%, #071a34 100%), url(${heroBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dynamic Abstract Remittance Flow Curves & Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <svg className="absolute w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
            {/* Curved flow line representing global remittance */}
            <path d="M-100 300 C 300 100, 800 600, 1500 200" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" strokeDasharray="10 15" className="animate-pulse" />
            <path d="M-50 450 C 400 300, 700 100, 1600 500" fill="none" stroke="#00C16A" strokeWidth="1" opacity="0.3" strokeDasharray="5 5" />
            
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F4B63F" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#F4B63F" stopOpacity="1" />
                <stop offset="100%" stopColor="#FDBA2D" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Subtle glowing halos representing Saudi major cities */}
          <div className="absolute top-[20%] left-[15%] w-96 h-96 bg-[#113262]/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
          <div className="absolute bottom-[25%] right-[10%] w-96 h-96 bg-[#00C16A]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '14s' }}></div>
        </div>

        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a34] via-[#071a34]/90 to-transparent rtl:bg-gradient-to-l z-0"></div>
        <div className="absolute inset-0 bg-[#071a34]/50 z-0"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Intelligence Platform Messaging */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left rtl:lg:text-right flex flex-col items-center lg:items-start">
              
              {/* Premium Pill Badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#113262]/85 border border-[#F4B63F]/30 text-[#F4B63F] text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-black/20 backdrop-blur-md cursor-help select-none transition-all hover:border-[#F4B63F]"
                title={isEn ? "Trusted decision support for expats sending money home." : "دعم موثوق لقرارات المغتربين عند إرسال الأموال."}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F4B63F] animate-pulse" />
                <span>{isEn ? 'REMITTANCE INTELLIGENCE PLATFORM' : 'منصة استخبارات التحويلات المالية'}</span>
              </div>

              {/* Cinematic Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-2xl">
                {isEn ? (
                  <>
                    Send <span className="text-[#F4B63F] relative inline-block">More<span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#F4B63F]/30 rounded-full"></span></span> Money Home,<br className="hidden sm:inline" />
                    Pay <span className="text-[#00E07A] relative inline-block">Fewer<span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#00E07A]/30 rounded-full"></span></span> Fees
                  </>
                ) : (
                  <>
                    أرسل أموالاً <span className="text-[#F4B63F] relative inline-block">أكثر<span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#F4B63F]/30 rounded-full"></span></span> لبلدك،<br className="hidden sm:inline" />
                    وادفع رسوماً <span className="text-[#00E07A] relative inline-block">أقل<span className="absolute bottom-1 left-0 w-full h-[3px] bg-[#00E07A]/30 rounded-full"></span></span>
                  </>
                )}
              </h1>

              {/* Subtitle description */}
              <p className="text-base sm:text-lg text-[#AFC4D8] font-semibold leading-relaxed max-w-xl">
                {isEn 
                  ? "SariRemit helps expats in Saudi Arabia make confident remittance decisions through trusted intelligence on where, when, and how to send money home."
                  : "يساعد ساري ريميت المغتربين في المملكة العربية السعودية على اتخاذ قرارات تحويل واثقة من خلال معلومات موثوقة حول مكان ووقت وكيفية إرسال الأموال إلى بلدانهم."}
              </p>

              {/* Supporting description */}
              <p className="text-xs sm:text-sm text-[#7E96AA] font-semibold leading-relaxed max-w-xl">
                {isEn
                  ? "We analyze exchange rates, transfer fees, VAT, delivery speed, provider reliability and verified community insights so you can transfer with confidence—not uncertainty."
                  : "نقوم بتحليل أسعار الصرف، ورسوم التحويل، وضريبة القيمة المضافة، وسرعة التسليم، وموثوقية المزود، ورؤى المجتمع الموثقة حتى تتمكن من التحويل بثقة — دون شكوك."}
              </p>

              {/* Trust badges rounded pills */}
              <div className="flex flex-wrap gap-2.5 w-full max-w-xl pt-2">
                {[
                  isEn ? '✓ Independent Recommendations' : '✓ توصيات مستقلة',
                  isEn ? '✓ Real Cost Comparison' : '✓ مقارنة التكلفة الحقيقية',
                  isEn ? '✓ Community Verified Intelligence' : '✓ معلومات مجتمعية مؤكدة',
                  isEn ? '✓ Confidence Before Every Transfer' : '✓ الثقة قبل كل عملية تحويل'
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#113262]/60 border border-white/10 rounded-full text-xs font-bold text-slate-200 shadow-sm backdrop-blur-sm">
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4">
                <button
                  onClick={() => setCurrentPage('compare')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#00C16A] text-[#071a34] font-black rounded-xl hover:bg-[#00E07A] transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-lg shadow-[#00C16A]/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>{isEn ? 'Compare Rates Now' : 'قارن أسعار التحويل الآن'}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4 text-[#071a34]" /> : <ArrowRight className="w-4 h-4 text-[#071a34]" />}
                </button>
                
                <button
                  onClick={() => {
                    const el = document.getElementById('how-it-works-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-[#113262]/80 hover:bg-[#113262] border border-white/10 text-white font-extrabold rounded-xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <span>{isEn ? 'How It Works' : 'كيفية عمل المنصة'}</span>
                </button>
              </div>

              {/* Emotional Message */}
              <div className="space-y-1 text-center lg:text-left rtl:lg:text-right">
                <p className="text-xs font-semibold text-slate-300">
                  {isEn 
                    ? "Every transfer supports someone you care about. Make every decision with confidence."
                    : "كل عملية تحويل تدعم شخصاً تهتم لأمره. اتخذ كل قرار بكل ثقة."}
                </p>
              </div>

              {/* Minimal subtext / guest access link */}
              <div className="text-center lg:text-left rtl:lg:text-right space-y-3">
                <div className="text-xs text-[#7E96AA] font-medium max-w-md">
                  <p className="font-extrabold text-[#AFC4D8] uppercase tracking-wider text-[11px] font-mono mb-1">
                    {isEn ? 'No account required to compare rates.' : 'لا يتطلب إنشاء حساب لمقارنة الأسعار.'}
                  </p>
                  <p className="text-[11px] text-[#7E96AA]">
                    {isEn 
                      ? "Create an account only if you want to:" 
                      : "أنشئ حساباً فقط إذا كنت ترغب في:"}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#7E96AA] mt-1 pl-1 rtl:pr-1">
                    <li>{isEn ? "Record savings" : "تسجيل المبالغ الموفرة"}</li>
                    <li>{isEn ? "Submit verified rates" : "رفع أسعار صرف مؤكدة"}</li>
                    <li>{isEn ? "Help improve community intelligence" : "المساعدة في تحسين المعلومات المجتمعية"}</li>
                  </ul>
                </div>

                {onContinueAsGuest && (
                  <button
                    onClick={onContinueAsGuest}
                    className="text-xs text-[#00E07A] hover:text-[#00C16A] hover:underline transition-all cursor-pointer font-bold uppercase tracking-wider inline-flex items-center gap-1"
                  >
                    <span>{isEn ? 'Continue as Guest' : 'المتابعة كزائر'}</span>
                    <span>➜</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: Premium Quick Rate Check Card & Live Recommended Preview */}
            <div className="lg:col-span-5 space-y-6 w-full max-w-md mx-auto relative z-10">
              
              {/* Card 1: Rate Check Widget */}
              <div className="bg-[#113262]/45 border border-white/15 p-6 rounded-[28px] shadow-2xl space-y-5 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-[4px] bg-gradient-to-r from-[#F4B63F] to-[#FDBA2D]"></div>
                
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Landmark className="w-4 h-4 text-[#F4B63F]" />
                    <span>{isEn ? 'Quick Rate Check' : 'تحقق سريع من السعر'}</span>
                  </h3>
                  <span className="text-[9px] font-mono font-bold bg-[#F4B63F]/10 text-[#F4B63F] px-2.5 py-0.5 rounded-full uppercase">
                    {isEn ? 'Live' : 'فوري'}
                  </span>
                </div>

                <form onSubmit={handleQuickCompare} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'SENDING AMOUNT' : 'مبلغ الإرسال'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickAmount}
                        onChange={(e) => setQuickAmount(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-[#071a34] text-white font-mono font-black text-xl px-4 py-3.5 rounded-xl border border-white/10 focus:border-[#F4B63F] focus:outline-none transition-all"
                      />
                      <span className="absolute right-4 top-4 text-xs text-[#7E96AA] font-bold font-mono">SAR</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#7E96AA] uppercase tracking-widest">
                      {isEn ? 'DESTINATION CORRIDOR' : 'بلد الوجهة المستلمة'}
                    </label>
                    <div className="relative">
                      <select
                        value={quickCorridor}
                        onChange={(e) => setQuickCorridor(e.target.value)}
                        className="w-full bg-[#071a34] text-white text-sm font-extrabold px-4 py-3.5 rounded-xl border border-white/10 focus:border-[#F4B63F] focus:outline-none cursor-pointer appearance-none"
                      >
                        {CORRIDORS.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#071a34]">
                            {c.flag} &nbsp; {isEn ? c.nameEn : c.nameAr} ({c.currencyCode})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-4.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#00C16A] text-[#071a34] font-black rounded-xl hover:bg-[#00E07A] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs uppercase tracking-wider"
                  >
                    <span>{isEn ? 'Compare Options' : 'قارن الخيارات الآن'}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4 text-[#071a34]" /> : <ArrowRight className="w-4 h-4 text-[#071a34]" />}
                  </button>
                </form>
              </div>

              {/* Card 2: Recommended Today Preview Card */}
              <div className="bg-[#071a34]/90 border border-[#00C16A]/30 p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-[#00E07A]/5 rounded-full blur-xl"></div>
                
                {recommendation ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-black text-[#00E07A] uppercase tracking-wider block">
                          {isEn ? 'RECOMMENDED TODAY PREVIEW' : 'معاينة التوصية الأفضل لليوم'}
                        </span>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-sm font-black text-white font-mono uppercase bg-emerald-600/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {recommendation.recommended_provider}
                          </span>
                          <span className="text-[10px] text-[#7E96AA] font-bold">
                            {recommendation.sub_service || 'Wallet Transfer'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Confidence Badge */}
                      <div className="text-right">
                        <span className="text-[9px] text-[#7E96AA] font-bold block">{isEn ? 'Confidence' : 'درجة الموثوقية'}</span>
                        <span className="text-xs font-black text-[#00E07A] font-mono">
                          {getConfidenceTranslation(recommendation.confidence_label)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[9px] text-[#7E96AA] font-bold uppercase block">{isEn ? 'Family Receives' : 'تستلم عائلتك'}</span>
                        <span className="text-base font-black text-white font-mono">
                          {previewReceivedAmount.toLocaleString()} {selectedCorridorObj.currencySymbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#F4B63F] font-bold uppercase block">{isEn ? 'Extra Value Generated' : 'قيمة إضافية مكتسبة'}</span>
                        <span className="text-base font-black text-[#F4B63F] font-mono">
                          +{previewExtraSavingsDest.toLocaleString()} {selectedCorridorObj.currencySymbol}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#7E96AA] font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#7E96AA]/70" />
                        <span>{bestOptionRelativeTime}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#00E07A] font-bold uppercase">
                        <span className="w-1.5 h-1.5 bg-[#00E07A] rounded-full animate-ping"></span>
                        {getSignalTranslation(recommendation.send_wait_signal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full space-y-2 py-6">
                    <span className="text-sm font-black text-amber-500 font-mono block">
                      {isEn ? 'Live intelligence is building for this corridor.' : 'يجري بناء الاستخبارات الفورية لهذا الممر.'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold block">
                      {isEn ? 'Not enough verified data yet.' : 'لا توجد بيانات كافية تم التحقق منها بعد.'}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. TODAY'S REMITTANCE INTELLIGENCE SECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="bg-gradient-to-br from-[#113262]/60 to-[#071a34] border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C16A]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F4B63F]/5 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00E07A] animate-ping shrink-0"></span>
                <span>{isEn ? "Today's Remittance Intelligence" : "استخبارات التحويلات المالية اليوم"}</span>
              </h2>
              <p className="text-sm text-[#AFC4D8]">
                {isEn 
                  ? "Real-time market analytics, optimized wallet routes, and verified community consensus benchmarks."
                  : "تحليلات السوق الفورية، ومسارات المحافظ الرقمية المثلى، ومقارنات معايير مجتمع المغتربين."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-3 py-1.5 bg-[#00E07A]/10 text-[#00E07A] border border-[#00E07A]/20 font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00E07A] rounded-full animate-pulse"></span>
                {isEn ? 'Live RRE Engine Active' : 'محرك تسوية الأسعار RRE نشط حالياً'}
              </span>
            </div>
          </div>

          {/* Metrics board grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Best Corridor Today */}
            <div className="bg-[#071a34]/65 p-5 rounded-2xl border border-white/5 space-y-2 hover:border-[#F4B63F]/20 transition-all duration-300">
              <span className="text-[10px] font-mono font-bold text-[#7E96AA] uppercase block">
                {isEn ? '1. Best Corridor Today' : '١. أفضل مسار تحويل اليوم'}
              </span>
              <p className="text-xl font-black text-white flex items-center gap-2">
                <span>🇸🇦 ➜ 🇵🇰</span>
                <span className="text-xs text-[#AFC4D8] font-bold">{isEn ? 'Saudi ➜ Pakistan' : 'السعودية ➜ باكستان'}</span>
              </p>
              <span className="text-[10px] text-[#7E96AA] font-mono block">
                {isEn ? 'Highest true relative exchange power' : 'أعلى قوة صرف نسبية حقيقية للريال'}
              </span>
            </div>

            {/* Card 2: Recommended Provider */}
            <div className="bg-[#071a34]/65 p-5 rounded-2xl border border-white/5 space-y-2 hover:border-[#F4B63F]/20 transition-all duration-300">
              <span className="text-[10px] font-mono font-bold text-[#7E96AA] uppercase block">
                {isEn ? '2. Recommended Provider' : '٢. أفضل شركة تحويل موصى بها'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black px-2.5 py-0.5 rounded bg-blue-600 text-white font-mono uppercase">urpay</span>
                <span className="text-xs text-[#AFC4D8] font-semibold">{isEn ? 'Digital Wallet' : 'محفظة رقمية'}</span>
              </div>
              <span className="text-[10px] text-[#00E07A] font-bold block">
                {isEn ? 'Zero transaction fee promotion' : 'توفير كامل في رسوم الحوالة'}
              </span>
            </div>

            {/* Card 3: Average Extra Value */}
            <div className="bg-[#071a34]/65 p-5 rounded-2xl border border-white/5 space-y-2 hover:border-[#F4B63F]/20 transition-all duration-300">
              <span className="text-[10px] font-mono font-bold text-[#7E96AA] uppercase block">
                {isEn ? '3. Average Extra Value' : '٣. متوسط القيمة الإضافية'}
              </span>
              <p className="text-xl font-black text-[#00E07A] font-mono">
                +180 SAR <span className="text-xs font-sans text-white/70 font-semibold">{isEn ? '/ Mo' : '/ شهرياً'}</span>
              </p>
              <span className="text-[10px] text-[#7E96AA] font-mono block">
                {isEn ? 'Saved compared to retail bank wire counters' : 'مبالغ موفرة مقارنة بكونترات البنوك التقليدية'}
              </span>
            </div>

            {/* Card 4: Confidence Level */}
            <div className="bg-[#071a34]/65 p-5 rounded-2xl border border-white/5 space-y-2 hover:border-[#F4B63F]/20 transition-all duration-300">
              <span className="text-[10px] font-mono font-bold text-[#7E96AA] uppercase block">
                {isEn ? '4. Confidence Level' : '٤. مؤشر الثقة العام'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#00E07A] font-mono">98%</span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-black font-mono uppercase">
                  {isEn ? 'HIGH CONFIDENCE' : 'ثقة مرتفعة جداً'}
                </span>
              </div>
              <span className="text-[10px] text-[#7E96AA] font-mono block">
                {isEn ? 'Audited by 12+ live screenshot reports' : 'مدعوم بلقطات شاشة إيصالات حديثة مفرزة'}
              </span>
            </div>

          </div>

          {/* Safe Community Notice */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7E96AA] font-medium">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#F4B63F] shrink-0" />
              <span>{isEn ? 'Data builds in real-time as users submit and compare rates.' : 'يتم بناء البيانات في الوقت الفعلي مع مقارنة المستخدمين ورفعهم للأسعار.'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#F4B63F] uppercase">
              {isEn ? 'No fake inflated numbers guarantee' : 'ضمان الشفافية ومطابقة الحقيقة'}
            </span>
          </div>

        </div>
      </section>

      {/* TRUSTED INTELLIGENCE SECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="relative bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-md overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-[#F4B63F]/5 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4 text-center lg:text-left rtl:lg:text-right">
              <span className="text-[10px] font-mono font-black text-[#F4B63F] uppercase tracking-widest block">
                {isEn ? 'TRUSTED INTELLIGENCE' : 'معلومات استخباراتية موثوقة'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                {isEn ? 'Trusted Intelligence. Not Guesswork.' : 'معلومات موثوقة. لا تخمين.'}
              </h2>
              <p className="text-sm text-[#AFC4D8] leading-relaxed">
                {isEn
                  ? "SariRemit operates as an independent audit layer. We do not guess or rely on outdated schedules. Every single recommendation is computed using an advanced multi-factor check so you can transfer with complete peace of mind."
                  : "يعمل ساري ريميت كطبقة تدقيق مستقلة. نحن لا نخمن ولا نعتمد على جداول قديمة. يتم حساب كل توصية باستخدام فحص متقدم متعدد العوامل بحيث يمكنك التحويل براحة بال تامة."}
              </p>
            </div>
            
            <div className="lg:col-span-7 bg-[#071a34]/60 border border-white/5 rounded-2xl p-6 md:p-8">
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold text-[#7E96AA] uppercase block tracking-wider">
                  {isEn ? 'Every recommendation considers:' : 'تأخذ كل توصية في الاعتبار:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { labelEn: 'Exchange Rate', labelAr: 'سعر الصرف', descEn: 'Real-time true rate delta monitoring.', descAr: 'مراقبة فوارق أسعار الصرف الحقيقية والفورية.' },
                    { labelEn: 'Fees', labelAr: 'الرسوم', descEn: 'Exact transfer costs mapped directly.', descAr: 'حساب دقيق لرسوم التحويل مباشرة.' },
                    { labelEn: 'VAT', labelAr: 'ضريبة القيمة المضافة', descEn: 'Saudi VAT additions included fully.', descAr: 'احتساب إضافات ضريبة القيمة المضافة السعودية بالكامل.' },
                    { labelEn: 'Final Amount Received', labelAr: 'المبلغ النهائي للمستلم', descEn: 'Calculated home country payouts.', descAr: 'احتساب المبالغ النهائية المستلمة في بلد المستلم.' },
                    { labelEn: 'Provider Reliability', labelAr: 'موثوقية المزود', descEn: 'Licensed operator trust indices.', descAr: 'مؤشرات ثقة المشغلين والشركات المرخصة.' },
                    { labelEn: 'Data Freshness', labelAr: 'حداثة البيانات', descEn: 'Recent minutes-based verification.', descAr: 'التحقق المبني على دقائق التحديث الأخيرة.' },
                    { labelEn: 'Community Verification', labelAr: 'التحقق من المجتمع', descEn: 'Receipt slips and consensus votes.', descAr: 'إيصالات التحويل الفعلية وتصويتات التأكيد مجتمعياً.' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#00E07A]/15 border border-[#00E07A]/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#00E07A]" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-white text-xs sm:text-sm">{isEn ? item.labelEn : item.labelAr}</h4>
                        <p className="text-[11px] text-[#7E96AA] font-medium leading-relaxed">{isEn ? item.descEn : item.descAr}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY SARIREMIT SECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Activity className="w-8 h-8 text-[#F4B63F]" />
            <span>{isEn ? 'Remittance Intelligence Built Differently' : 'استخبارات تحويلات مبنية بشكل مختلف'}</span>
          </h2>
          <p className="text-sm text-[#AFC4D8] leading-relaxed">
            {isEn 
              ? "We are not just another rate comparison tool. We analyze the complete transaction friction to make sure your family receives every single Riyal."
              : "نحن لسنا مجرد أداة مقارنة أسعار أخرى. نحن نحلل جميع العوامل والرسوم الاحتكاكية لضمان حصول عائلتك على كل ريال مستحق."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Compare Everything */}
          <div className="bg-[#113262]/35 border border-white/10 hover:border-[#F4B63F]/40 p-8 rounded-[28px] shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-[#113262]/55 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4B63F]/5 rounded-full blur-2xl"></div>
            <div className="space-y-6">
              <div className="p-3.5 bg-gradient-to-br from-[#F4B63F]/20 to-[#F4B63F]/5 text-[#F4B63F] rounded-2xl border border-[#F4B63F]/30 w-14 h-14 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Landmark className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white group-hover:text-[#F4B63F] transition-all">
                  {isEn ? '1. Compare Everything' : '١. مقارنة كل العوامل والرسوم'}
                </h3>
                <p className="text-xs text-[#B8C7D9] leading-relaxed">
                  {isEn 
                    ? "Not just raw exchange rates. We audit fees, Saudi VAT additions, receiver pickup surcharges, and secondary financial margins."
                    : "ليس فقط أسعار الصرف النظرية. نحن نحقق وندقق في الرسوم، وإضافات ضريبة القيمة المضافة السعودية، ورسوم استلام المستلم، والهوامش الثانوية."}
                </p>
                <div className="bg-[#071a34]/50 border border-white/5 p-3 rounded-xl space-y-1 text-[10px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>{isEn ? 'Exchange Rate Margin' : 'هامش سعر الصرف'}</span>
                    <span className="text-[#00E07A] font-bold">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isEn ? 'Transfer Fees & VAT' : 'الرسوم وضريبة القيمة المضافة'}</span>
                    <span className="text-[#00E07A] font-bold">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isEn ? 'Friction & Surcharges' : 'الرسوم الاحتكاكية'}</span>
                    <span className="text-[#00E07A] font-bold">Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Know When To Send */}
          <div className="bg-[#113262]/35 border border-white/10 hover:border-[#F4B63F]/40 p-8 rounded-[28px] shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-[#113262]/55 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E07A]/5 rounded-full blur-2xl"></div>
            <div className="space-y-6">
              <div className="p-3.5 bg-gradient-to-br from-[#00E07A]/20 to-[#00E07A]/5 text-[#00E07A] rounded-2xl border border-[#00E07A]/30 w-14 h-14 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white group-hover:text-[#00E07A] transition-all">
                  {isEn ? '2. Know When To Send' : '٢. معرفة التوقيت المثالي للإرسال'}
                </h3>
                <p className="text-xs text-[#B8C7D9] leading-relaxed">
                  {isEn 
                    ? "Exchange rates shift constantly. Get dynamic signal tags (Send / Wait) based on real-time data freshness and verified volatility scores."
                    : "تتغير أسعار الصرف باستمرار. احصل على إشارات توجيه ديناميكية (أرسل الآن / انتظر قليلاً) بناءً على حداثة البيانات ونقاط تقلب الأسعار."}
                </p>
                <div className="bg-[#071a34]/50 border border-white/5 p-3 rounded-xl flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">{isEn ? 'Current Timing Signal:' : 'إشارة التوقيت الحالية:'}</span>
                  <span className="px-2 py-0.5 bg-[#00E07A]/20 text-[#00E07A] border border-[#00E07A]/30 rounded text-[10px] font-black uppercase">
                    {isEn ? 'OPTIMAL' : 'مثالي'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Track Your Savings */}
          <div className="bg-[#113262]/35 border border-white/10 hover:border-[#F4B63F]/40 p-8 rounded-[28px] shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-[#113262]/55 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4B63F]/5 rounded-full blur-2xl"></div>
            <div className="space-y-6">
              <div className="p-3.5 bg-gradient-to-br from-[#F4B63F]/20 to-[#F4B63F]/5 text-[#F4B63F] rounded-2xl border border-[#F4B63F]/30 w-14 h-14 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white group-hover:text-[#F4B63F] transition-all">
                  {isEn ? '3. Track Your Savings' : '٣. تتبع مدخراتك بدقة ووضوح'}
                </h3>
                <p className="text-xs text-[#B8C7D9] leading-relaxed">
                  {isEn 
                    ? "See your hard work pay off. Log your actual transfers in our personal vault to visualize total savings generated for your family over time."
                    : "شاهد ثمار جهدك وتعبك. قم بتدوين حوالاتك الفعلية في خزنتك الشخصية لتشاهد إجمالي المبالغ الإضافية التي وفرتها لعائلتك."}
                </p>
                <div className="bg-[#071a34]/50 border border-white/5 p-3 rounded-xl space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>{isEn ? 'Total Saved Tracked' : 'إجمالي التوفير المسجل'}</span>
                    <span className="text-[#F4B63F] font-black">+420 SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works-section" className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'How SariRemit Works' : 'كيفية عمل ساري ريميت'}
          </h2>
          <p className="text-[#AFC4D8] text-sm">
            {isEn 
              ? 'Our four-step intelligence pipeline is designed to eliminate guesswork from your monthly transfers.'
              : 'نهجنا المكون من ٤ خطوات مصمم لإلغاء التخمين والشكوك تماماً من حوالاتك المالية الشهرية.'}
          </p>
        </div>

        {/* 4-Step horizontal pipeline (stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl relative space-y-3 hover:border-white/20 transition-all">
            <span className="text-2xl font-black font-mono text-[#F4B63F]">01</span>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Enter Amount & Destination' : '١. أدخل المبلغ والبلد'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Specify how much Saudi Riyals you want to send and select the receiving country.' : 'حدد كمية الريالات السعودية المرغوب في تحويلها واختر بلد الاستلام.'}
            </p>
            {/* Desktop Gold Connection Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-[#F4B63F]">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl relative space-y-3 hover:border-white/20 transition-all">
            <span className="text-2xl font-black font-mono text-[#F4B63F]">02</span>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Analyze Rates & Friction' : '٢. تحليل الأسعار والرسوم'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'We calculate the exchange rates, VAT, fees, and pickup structures of all providers.' : 'نحن نحسب أسعار الصرف الفورية، والضريبة، والرسوم، وعمولات الاستلام لجميع الشركات المتاحة.'}
            </p>
            {/* Desktop Gold Connection Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-[#F4B63F]">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl relative space-y-3 hover:border-white/20 transition-all">
            <span className="text-2xl font-black font-mono text-[#F4B63F]">03</span>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Get Best Recommendation' : '٣. الحصول على التوصية الفضلى'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Receive the highest value channel recommendations backed by live verified signals.' : 'استلم فوراً اسم القناة أو المحفظة التي تمنح عائلتك أكبر قدر مالي حقيقي.'}
            </p>
            {/* Desktop Gold Connection Arrow */}
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-[#F4B63F]">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl relative space-y-3 hover:border-white/20 transition-all">
            <span className="text-2xl font-black font-mono text-[#00E07A]">04</span>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Record & Track Savings' : '٤. تدوين وتتبع المدخرات'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Safely log your completed transfers to visualize and monitor your compound savings.' : 'احفظ حوالاتك بعد إتمامها في لوحة التحكم الشخصية لتراقب مقدار مدخراتك المتراكمة.'}
            </p>
          </div>

        </div>
      </section>

      {/* 5. LIVE PRODUCT PREVIEW MOCKUP SECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#113262] text-[#F4B63F] text-[10px] font-black rounded-md uppercase tracking-wider font-mono border border-white/5">
            <Globe className="w-3.5 h-3.5" />
            <span>{isEn ? 'Live Platform Mockup' : 'معاينة حية للمنصة'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isEn ? 'Designed for Remittance Intelligence' : 'واجهة مصممة خصيصاً لذكاء الحوالات'}
          </h2>
          <p className="text-sm text-[#AFC4D8]">
            {isEn 
              ? 'Get high-fidelity dashboard views containing everything you need to make the smartest decisions.'
              : 'احصل على لوحة تحكم رفيعة المستوى تحتوي على كل ما تحتاجه لاتخاذ أذكى القرارات المالية.'}
          </p>
        </div>

        {/* High fidelity App/Browser mockup container */}
        <div className="bg-[#071a34] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative">
          
          {/* Mockup browser header */}
          <div className="bg-[#113262]/70 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] font-mono font-bold text-slate-400 pl-4">app.sariremit.com</span>
            </div>
            
            {/* Mock live freshness badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 py-1 px-3 bg-[#00C16A]/15 text-[#00E07A] border border-[#00C16A]/30 text-[9px] font-mono font-black uppercase rounded-full">
                <span className="w-1.5 h-1.5 bg-[#00E07A] rounded-full animate-ping"></span>
                {isEn ? 'Verified Fresh Rates' : 'أسعار صرف مؤكدة وفورية'}
              </span>
            </div>
          </div>

          {/* Mockup content area */}
          <div className="p-6 md:p-8 bg-[#0a2346]/45 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Top recommendation view mock */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Mock Recommendation Card */}
              <div className="bg-[#113262]/80 border-2 border-[#00E07A]/30 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 bg-[#00E07A] text-[#071a34] text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  {isEn ? 'BEST OPTION' : 'الخيار الأفضل'}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0a2346] to-[#071a34] rounded-xl flex items-center justify-center border border-white/10 shadow">
                    <span className="text-white font-black text-sm font-sans">S</span>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>urpay</span>
                      <span className="text-[9px] font-mono font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase">
                        {isEn ? 'Digital Wallet' : 'محفظة رقمية'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-[#7E96AA] font-bold">{isEn ? 'Powered by Al Rajhi Bank' : 'مدعوم من مصرف الراجحي'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] text-[#7E96AA] font-bold uppercase block">{isEn ? 'Exchange Rate' : 'سعر الصرف'}</span>
                    <span className="text-sm font-black text-white font-mono">1 SAR = 74.25 PKR</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#7E96AA] font-bold uppercase block">{isEn ? 'Transfer Fees & VAT' : 'الرسوم والضريبة'}</span>
                    <span className="text-sm font-black text-white font-mono">0.00 SAR</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#00E07A] font-bold uppercase block">{isEn ? 'Family Receives' : 'تستلم عائلتك'}</span>
                    <span className="text-base font-black text-[#00E07A] font-mono">148,500 PKR</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#0a2346]/40 rounded-xl border border-white/5 flex justify-between items-center text-[10px] text-[#AFC4D8]">
                  <span>{isEn ? 'Extra value vs local branch transfer:' : 'قيمة إضافية مقارنة بالتحويل التقليدي:'}</span>
                  <span className="font-mono font-black text-[#F4B63F]">+184 SAR (13,660 PKR)</span>
                </div>
              </div>

              {/* Mock Compare Grid Items */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-mono font-black text-[#7E96AA] uppercase tracking-wider">{isEn ? 'Other Monitored Channels' : 'قنوات التحويل الأخرى المراقبة'}</h5>
                
                {/* Channel 1 */}
                <div className="bg-[#113262]/40 border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">stc pay</span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold">(stc Bank)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300">1 SAR = 73.90 PKR</span>
                  <span className="font-mono text-slate-300">Fee: 5 SAR</span>
                  <span className="font-mono font-extrabold text-[#00E07A]">147,450 PKR</span>
                </div>

                {/* Channel 2 */}
                <div className="bg-[#113262]/40 border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">Mobily Pay</span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold">(Mobily)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300">1 SAR = 73.85 PKR</span>
                  <span className="font-mono text-slate-300">Fee: 0 SAR</span>
                  <span className="font-mono font-extrabold text-[#00E07A]">147,700 PKR</span>
                </div>
              </div>

            </div>

            {/* Right Column: Savings tracker mock & Freshness metrics */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Mock Savings Tracker Card */}
              <div className="bg-[#113262]/80 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <TrendingUp className="w-4 h-4 text-[#F4B63F]" />
                    <span>{isEn ? 'Savings Vault Tracker' : 'مستودع تتبع المدخرات'}</span>
                  </h4>
                  <span className="text-[9px] font-mono font-bold bg-[#F4B63F]/15 text-[#F4B63F] px-2 py-0.5 rounded-full uppercase">
                    {isEn ? 'Vault Active' : 'نشط'}
                  </span>
                </div>

                <div className="text-center py-4 bg-[#0a2346]/50 rounded-xl border border-white/5 relative overflow-hidden">
                  <span className="text-[10px] text-[#7E96AA] font-bold block mb-1">{isEn ? 'TOTAL SAVINGS TO DATE' : 'إجمالي المبالغ الموفرة حتى الآن'}</span>
                  <span className="text-4xl font-black text-[#F4B63F] font-mono tracking-tight">+684 SAR</span>
                  <p className="text-[10px] text-[#AFC4D8] font-mono mt-1">≈ 50,780 PKR {isEn ? 'generated extra' : 'تم توليدها كقيمة إضافية'}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-black text-[#7E96AA] uppercase block">{isEn ? 'Recent Logged Runs' : 'عمليات التحويل الأخيرة المسجلة'}</span>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>June 24: 2,000 SAR ➜ urpay</span>
                      <span className="text-[#00E07A] font-bold">+184 SAR Saved</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>May 28: 3,000 SAR ➜ stc pay</span>
                      <span className="text-[#00E07A] font-bold">+210 SAR Saved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence & Speed Check widget */}
              <div className="bg-[#113262]/40 border border-white/5 rounded-2xl p-5 space-y-3.5 text-xs text-[#AFC4D8]">
                <h4 className="font-extrabold text-xs text-white uppercase font-mono tracking-wider">{isEn ? 'Confidence Resolution Score' : 'مؤشر تسوية الموثوقية'}</h4>
                <p className="leading-relaxed text-[11px]">
                  {isEn 
                    ? "Our index tracks the delta deviation between live rates. Deviances under 0.25% trigger full Green High status."
                    : "يتتبع مؤشرنا الانحراف المعياري بين أسعار الصرف الحية. يمنح الانحراف الأقل من ٠.٢٥٪ حالة الموثوقية العالية بلون أخضر."}
                </p>
                <div className="flex items-center gap-1.5 text-white font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#00E07A] animate-pulse"></span>
                  <span>98.6% {isEn ? 'Resolution Precision' : 'دقة التسوية المعتمدة'}</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 6. COMMUNITY TRUST SECTION */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#113262] text-[#F4B63F] text-[10px] font-black rounded-md uppercase tracking-wider font-mono border border-white/5">
            <Users className="w-3.5 h-3.5" />
            <span>{isEn ? 'SariRemit Community Intelligence' : 'ذكاء مجتمع ساري ريميت'}</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isEn ? 'Built With Community Intelligence' : 'منصة مبنية بذكاء مجتمع المغتربين'}
          </h2>
          <p className="text-sm text-[#AFC4D8]">
            {isEn 
              ? 'Our platform gets stronger as savvy expatriates upload receipts, confirm rates, and verify their digital experiences.'
              : 'تزداد منصتنا قوة وخبرة عندما يقوم المغتربون برفع إيصالات التحويل، وتأكيد الأسعار، وتوثيق تجاربهم الرقمية.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Item 1: Community verified rates */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E07A]/10 border border-[#00E07A]/20 flex items-center justify-center text-[#00E07A]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Community Verified Rates' : 'أسعار مؤكدة مجتمعياً'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Members vote, confirm, and verify screenshot slips to keep quotes accurate.' : 'يقوم الأعضاء بالتصويت وتأكيد الأسعار ومراجعة إيصالات التحويل لضمان الدقة الكاملة.'}
            </p>
          </div>

          {/* Item 2: Contributor reputation */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E07A]/10 border border-[#00E07A]/20 flex items-center justify-center text-[#00E07A]">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Contributor Reputation' : 'سمعة ونزاهة المساهمين'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Expats accumulate trusted points and badges by providing verified data.' : 'يكتسب المغتربون نقاطاً تفاعلية وأوسمة تقديرية لقاء تزويد المنصة بالبيانات الموثقة.'}
            </p>
          </div>

          {/* Item 3: Screenshot verification */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E07A]/10 border border-[#00E07A]/20 flex items-center justify-center text-[#00E07A]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Screenshot Slips' : 'إثباتات لقطات الشاشة'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Upload direct receipts to back rate submissions and earn community upvotes.' : 'قم برفع لقطة شاشة إيصالك لتدعم تقارير أسعار الصرف وتكسب أصوات وتأييد المجتمع.'}
            </p>
          </div>

          {/* Item 4: Feedback after transfers */}
          <div className="bg-[#113262]/20 border border-white/5 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E07A]/10 border border-[#00E07A]/20 flex items-center justify-center text-[#00E07A]">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">{isEn ? 'Transfer Feedback' : 'تغذية راجعة بعد الحوالات'}</h4>
            <p className="text-xs text-[#AFC4D8] leading-relaxed">
              {isEn ? 'Share actual wallet speeds and transfer hurdles so others can send smarter.' : 'شارك تفاصيل سرعة المحفظة وصعوبات الإرسال حتى يتجنبها الآخرون ويرسلون بذكاء.'}
            </p>
          </div>

        </div>

        {/* Community Call to Action */}
        <div className="text-center pt-4">
          <button
            onClick={() => setCurrentPage('community')}
            className="px-8 py-3.5 bg-[#113262]/80 hover:bg-[#113262] border border-white/10 text-white font-extrabold rounded-xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
          >
            {isEn ? 'Join the Community Hub' : 'انضم إلى مركز مجتمع المغتربين'}
          </button>
        </div>
      </section>

      {/* 7. WHY SARIREMIT EXISTS / MISSION SECTION */}
      <section className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative bg-[#113262]/25 border border-white/10 rounded-[36px] p-8 md:p-12 backdrop-blur-md overflow-hidden space-y-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#F4B63F]/5 rounded-full blur-3xl"></div>
          
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#F4B63F]/40 to-transparent"></div>
          
          <div className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-[#F4B63F] uppercase tracking-widest font-mono">
              {isEn ? 'Why SariRemit Exists' : 'لماذا تأسس ساري ريميت'}
            </h3>
            
            <p className="text-xl sm:text-2xl font-black text-white/95 leading-relaxed font-sans">
              {isEn 
                ? 'Millions of expatriates send money home every month.' 
                : 'يرسل ملايين المغتربين الأموال إلى بلدانهم وعائلاتهم كل شهر.'}
            </p>
            
            <p className="text-base sm:text-lg text-[#AFC4D8] max-w-2xl mx-auto leading-relaxed font-medium">
              {isEn 
                ? 'Choosing the wrong provider can mean paying unnecessary fees or sending less value to the people who matter most.'
                : 'اختيار المزود الخاطئ قد يعني دفع رسوم غير ضرورية أو إرسال قيمة مالية أقل للأشخاص الأكثر أهمية في حياتك.'}
            </p>

            <p className="text-base sm:text-lg text-[#00E07A] max-w-2xl mx-auto leading-relaxed font-black">
              {isEn
                ? 'SariRemit exists to replace uncertainty with trusted remittance intelligence, helping every expat make informed and confident transfer decisions.'
                : 'تأسس ساري ريميت ليستبدل الحيرة والشكوك بمعلومات استخباراتية موثوقة، ليساعد كل مغترب على اتخاذ قرارات تحويل مدروسة وواثقة.'}
            </p>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => {
                if (onSelectResourceTab) onSelectResourceTab('charter');
                setCurrentPage('resources');
              }}
              className="px-6 py-3 bg-[#071a34] border border-white/10 hover:border-[#F4B63F]/40 text-[#F4B63F] text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isEn ? 'Read Our Trust Charter' : 'اقرأ ميثاق الأمان والشفافية'}
            </button>
          </div>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#F4B63F]/40 to-transparent"></div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about-section" className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12 border-t border-white/5 pt-16">
        <About setCurrentPage={(page) => {
          if (page === 'landing') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setCurrentPage(page);
          }
        }} />
      </section>

      {/* RESOURCES SECTION */}
      <section id="resources-section" className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12 border-t border-white/5 pt-16">
        <Resources setCurrentPage={(page) => {
          if (page === 'landing') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setCurrentPage(page);
          }
        }} initialResource={resourcesSubTab} />
      </section>

      {/* 8. FINAL CALL TO ACTION SECTION */}
      <section className="max-w-5xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-[#113262] to-[#071a34] border-2 border-white/10 rounded-[40px] p-8 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E07A]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F4B63F]/10 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {isEn ? 'Make Every Riyal Count' : 'اجعل كل ريال ذي قيمة وتأثير'}
            </h2>
            
            <p className="text-sm sm:text-base text-[#AFC4D8] leading-relaxed">
              {isEn 
                ? 'Before you send money home this month, compare your options and secure the smartest route for your family.'
                : 'قبل إرسال أموالك لعائلتك هذا الشهر، قارن خياراتك المتاحة وحافظ على أفضل قيمة مستحقة لهم.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setCurrentPage('compare')}
                className="w-full sm:w-auto px-8 py-4 bg-[#00C16A] text-[#071a34] font-black rounded-xl hover:bg-[#00E07A] transition-all hover:scale-[1.03] cursor-pointer text-xs uppercase tracking-wider"
              >
                {isEn ? 'Compare Rates Now' : 'قارن أسعار التحويل الآن'}
              </button>
              
              {onContinueAsGuest && (
                <button
                  onClick={onContinueAsGuest}
                  className="w-full sm:w-auto px-8 py-4 bg-[#113262]/80 hover:bg-[#113262] border border-white/10 text-white font-extrabold rounded-xl transition-all hover:scale-[1.03] cursor-pointer text-xs uppercase tracking-wider"
                >
                  {isEn ? 'Continue as Guest' : 'المتابعة كمستخدم زائر'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
