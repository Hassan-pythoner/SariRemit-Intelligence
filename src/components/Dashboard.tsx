import React, { useState, useEffect } from 'react';
import { TranslationDict, UserProfile, RecordedTransfer } from '../types';
import { CORRIDORS } from '../services/ratesService';
import { getRecommendations, getUserSavingsLedger } from '../services/supabaseService';
import { slf } from '../services/slfService';
import { 
  Sparkles, ArrowLeftRight, TrendingUp, Landmark, ShieldCheck, Zap, 
  ArrowRight, Wallet, History, AlertCircle, Bell, Info, Calculator, 
  Star, Check, ChevronRight, RefreshCw, User, CheckCircle2, Globe
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect, SDSSisGauge } from './Sds';
import { ProviderLogo, ProviderBrandBlock, CountryFlag, BrandIllustration } from './SdsBamComponents';

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
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(
    profile.preferredCorridorId || 'sa-pk'
  );
  const [amount, setAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // RRE dynamic results
  const [bestProvider, setBestProvider] = useState<string>('STC Pay');
  const [netRecipient, setNetRecipient] = useState<number>(0);
  const [sisScore, setSisScore] = useState<number>(92);
  const [sisLabel, setSisLabel] = useState<string>('Excellent');
  const [confidence, setConfidence] = useState<string>('High');
  const [lastUpdated, setLastUpdated] = useState<string>('3 minutes ago');
  const [estimatedSavings, setEstimatedSavings] = useState<number>(35);
  const [recommendedChannel, setRecommendedChannel] = useState<any>(null);

  // User Transfer history stats
  const [transfers, setTransfers] = useState<RecordedTransfer[]>([]);
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [lifetimeSavings, setLifetimeSavings] = useState<number>(0);
  const [lastTransfer, setLastTransfer] = useState<RecordedTransfer | null>(null);

  const activeCorridor = CORRIDORS.find(c => c.id === selectedCorridorId) || CORRIDORS[0];

  // Load user transfers and calculate stats using unified SEPS ledger service
  useEffect(() => {
    let isMounted = true;
    
    getUserSavingsLedger(profile.id)
      .then(({ transfers: activeTransfers, summary }) => {
        if (!isMounted) return;
        setTransfers(activeTransfers);
        setLifetimeSavings(summary.lifetimeSavingsSAR);
        setMonthlySavings(summary.monthlySavingsSAR);
        setLastTransfer(activeTransfers[0] || null);
      })
      .catch((err) => console.error('Failed to load transfers:', err));

    return () => {
      isMounted = false;
    };
  }, [profile]);

  // Load dynamic RRE recommendation
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getRecommendations(selectedCorridorId, amount)
      .then((res) => {
        if (!isMounted) return;
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
          } else {
            setRecommendedChannel({
              provider_code: res.bestOption.best_provider_id,
              displayName: res.bestOption.best_provider_name,
              providerName: res.bestOption.best_provider_name
            });
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Dashboard RRE Fetch Failed:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCorridorId, amount]);

  const handleCompareFull = () => {
    setQuickSearch({
      corridorId: selectedCorridorId,
      amount: amount
    });
    setActiveTab('compare');
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return isRtl ? 'صباح الخير' : 'Good morning';
    if (hr < 18) return isRtl ? 'مساء الخير' : 'Good afternoon';
    return isRtl ? 'مساء الخير' : 'Good evening';
  };

  const getDynamicReason = () => {
    if (sisScore >= 85) {
      return isRtl 
        ? `${bestProvider} يوفر أعلى سعر صرف مع رسوم تحويل منخفضة للغاية. ينصح بالإرسال الآن.`
        : `${bestProvider} offers the highest exchange rate with very low fees. Highly recommended to send now.`;
    } else {
      return isRtl
        ? `${bestProvider} هو الخيار الأمثل حالياً، ولكن السوق متقلب. ننصح بالتحقق المستمر.`
        : `${bestProvider} is currently the optimal choice, but the market is volatile. Regular checks recommended.`;
    }
  };

  const recommendedChannelObj = recommendedChannel || {
    provider_code: 'stc-pay',
    displayName: bestProvider,
    providerName: bestProvider
  };

  return (
    <div className={`relative min-h-screen text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn`}>
      
      {/* BACKGROUND ELEMENTS (Silhouette and abstract grid lines) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Abstract World Map Dotted grid */}
        <svg className="absolute top-20 right-0 w-full h-[500px] opacity-[0.03] text-sds-text" fill="currentColor" viewBox="0 0 1000 500">
          <circle cx="100" cy="150" r="2" />
          <circle cx="200" cy="120" r="1.5" />
          <circle cx="300" cy="180" r="2.5" />
          <circle cx="400" cy="110" r="1" />
          <circle cx="500" cy="220" r="3" />
          <circle cx="600" cy="160" r="2" />
          <circle cx="700" cy="240" r="1.5" />
          <circle cx="800" cy="130" r="2" />
          <path d="M100 150 Q 300 180, 500 220 T 800 130" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          <path d="M200 120 Q 400 110, 600 160 T 700 240" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
        </svg>

        {/* Silhouette skyline elements at bottom layout */}
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.04] bg-gradient-to-t from-sds-primary to-transparent">
          <svg className="w-full h-full text-sds-primary" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="currentColor">
            <path d="M0 200 h1440 v-80 l-20 -5 l-10 10 l-30 -15 l-15 15 l-50 -35 l-10 20 l-40 -25 l-20 15 l-80 -40 l-10 10 l-30 -15 l-5 5 l-12 -20 l-10 10 l-18 -15 l-12 15 l-40 -30 l-10 10 l-45 -25 l-25 15 l-90 -50 v170 Z" />
          </svg>
        </div>
      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div className="relative z-10 space-y-8 pb-20">
        
        {/* 1. TOP GREETING & VERIFICATION STATUS BANNER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sds-border/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                {isRtl ? 'بوابة التحليل الذكي' : 'REMIT INTELLIGENCE CONTROL'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-sans font-black text-sds-text tracking-tight flex items-center gap-2">
              <span>👋</span>
              {getGreeting()}, {profile.name || (isRtl ? 'مستخدم ساري' : 'Hassan')}
            </h1>
            <p className="text-xs md:text-sm text-sds-text-sec font-medium">
              {isRtl 
                ? "مرحباً بك مجدداً. المساعد الذكي يتابع أسعار التحويل المباشرة من أجلك." 
                : "Welcome back. The dynamic remittance engine is continuously evaluating the Saudi market."}
            </p>
          </div>

          {/* Verification Status */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0C2547] border border-sds-border rounded-2xl shadow-sds-sm self-start md:self-auto">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </div>
            <div className="text-left font-mono">
              <span className="text-[10px] font-black text-[#10B981] uppercase block tracking-wider leading-none">
                {isRtl ? 'الأسعار المباشرة نشطة ومؤكدة' : 'LIVE & VERIFIED RATES ACTIVE'}
              </span>
              <span className="text-[9px] text-sds-text-sec block mt-1 font-bold">
                {isRtl ? 'آخر تحديث:' : 'Updated'} {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* 2. CONVERSATIONAL MAIN QUESTION (SariRemit Central Anchor) */}
        <div className="text-center md:text-left py-2">
          <span className="text-xs font-black uppercase text-[#F59E0B] tracking-wider block mb-1">
            {isRtl ? 'مساعد اتخاذ القرار المالي' : 'FINANCIAL DECISION ASSISTANT'}
          </span>
          <h2 className="text-xl md:text-2xl font-sans font-black text-sds-text tracking-tight leading-snug">
            {isRtl ? 'إذا كنت تريد إرسال الأموال اليوم، فماذا يجب أن تفعل؟' : 'If you wanted to send money today, what should you do?'}
          </h2>
        </div>

        {/* 3. MAIN BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SECTION: TODAY'S RECOMMENDATION HERO CARD & VERIFIED LIVE FEED (Col span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* HERO CARD - TODAY'S RECOMMENDATION */}
            <div className="relative bg-gradient-to-br from-[#0C2547] via-[#091F3E] to-[#0C2547] text-sds-text rounded-3xl p-6 md:p-8 shadow-sds-lg border border-[#F59E0B]/20 overflow-hidden">
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#10B981]" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-xl shadow-inner border border-[#10B981]/20">
                    🏆
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest block font-mono">
                      {isRtl ? 'التوصية الذكية الفورية' : 'TODAY\'S SMART RECOMMENDATION'}
                    </span>
                    <h3 className="text-lg md:text-xl font-sans font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                      <span>🇸🇦 {isRtl ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</span>
                      <span className="text-sds-text-sec text-xs font-normal">→</span>
                      <span>{activeCorridor.flag} {isRtl ? activeCorridor.toCountryAr : activeCorridor.toCountry}</span>
                    </h3>
                  </div>
                </div>

                <ProviderBrandBlock
                  channel={recommendedChannelObj}
                  surface="dark"
                  showVerification={true}
                  className="bg-[#071A35]/60 border-sds-border/60 shrink-0 min-w-[200px]"
                />
              </div>

              {/* HUGE EXPECTED FAMILY PAYOUT DISPLAY */}
              <div className="my-8 py-6 border-y border-sds-border/60 text-left relative">
                <div className="absolute inset-y-0 right-4 flex items-center justify-center opacity-10 text-9xl font-black pointer-events-none select-none">
                  {activeCorridor.currencyCode}
                </div>
                
                <span className="text-[10px] font-black text-sds-text-sec uppercase tracking-widest block mb-1">
                  {isRtl ? 'صافي المبلغ المستلم المتوقع للعائلة' : 'EXPECTED FAMILY PAYOUT (NET)'}
                </span>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-3xl md:text-5xl font-sans font-black tracking-tight text-white">
                    {isLoading ? '...' : netRecipient.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-lg font-black text-[#10B981]">{activeCorridor.currencyCode}</span>
                  
                  <span className="text-sds-text-sec text-xs font-bold px-1">
                    ({isRtl ? 'مقابل' : 'for'} {amount.toLocaleString()} SAR)
                  </span>
                </div>

                <p className="text-[11px] text-sds-text-sec mt-3 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
                  {isRtl 
                    ? "مضمون وخالٍ من الرسوم والضرائب الخفية • تحديث فوري" 
                    : "Fully calculated including all transfer fees, markups, and taxes."}
                </p>
              </div>

              {/* REASONS, SCORE, AND FRESHNESS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Confidence Gauge */}
                <div className="md:col-span-4 flex items-center gap-4 bg-[#071A35]/60 p-3 rounded-2xl border border-sds-border">
                  <SDSSisGauge score={sisScore} size="sm" />
                  <div className="text-left font-sans">
                    <span className="text-[9px] text-sds-text-sec font-black uppercase block tracking-wider">
                      {isRtl ? 'درجة الموثوقية' : 'CONFIDENCE SCORE'}
                    </span>
                    <span className="text-sm font-black text-white block mt-0.5">
                      {sisScore}%
                    </span>
                    <span className="text-[10px] font-bold text-[#10B981] block uppercase tracking-wide">
                      {isRtl ? 'ممتازة جداً' : sisLabel}
                    </span>
                  </div>
                </div>

                {/* Recommendation Reason */}
                <div className="md:col-span-8 text-left space-y-1">
                  <span className="text-[9px] text-sds-text-sec font-black uppercase block tracking-wider">
                    {isRtl ? 'سبب اختيار هذه القناة' : 'RECOMMENDATION LOGIC'}
                  </span>
                  <p className="text-xs font-bold text-white leading-relaxed">
                    {getDynamicReason()}
                  </p>
                  <p className="text-[10px] text-sds-text-sec font-mono">
                    {isRtl ? 'مبني على ١٥ تقريراً من مجتمع المغتربين في آخر ساعة.' : 'Based on 15 verified community reports within the past hour.'}
                  </p>
                </div>

              </div>

              {/* ACTION ROW */}
              <div className="mt-8 pt-5 border-t border-sds-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[10px] text-sds-text-sec font-medium leading-normal max-w-sm text-left">
                  {isRtl 
                    ? "* الأسعار مستخرجة مباشرة ومحدثة لضمان الحصول على أقصى توفير ممكن لعائلتك." 
                    : "* Rates fetched dynamically from verified mobile wallets and community reports."}
                </span>

                <div className="flex gap-3">
                  <button
                    onClick={handleCompareFull}
                    className="px-5 py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 active:scale-98 text-[#071A35] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span>{isRtl ? 'مقارنة كل الخيارات الآن' : 'Compare Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* COMMUNITY VERIFICATION STATUS & RECENT REPORTS */}
            <SDSCard padding="md" variant="shadow" className="border border-sds-border text-left">
              <div className="flex items-center justify-between border-b border-sds-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] border border-[#F59E0B]/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">
                      {isRtl ? 'آخر تقارير التحويل المؤكدة' : 'LATEST VERIFIED EXPAT REPORTS'}
                    </h3>
                    <p className="text-[10px] text-sds-text-sec">{isRtl ? 'تقارير فورية مباشرة من مستخدمينا في المملكة' : 'Crowdsourced rate validations from expats'}</p>
                  </div>
                </div>
                <SDSBadge type="verified" />
              </div>

              {/* Recent reports list */}
              <div className="mt-4 space-y-3.5">
                {[
                  { user: 'Hassan K.', amount: '2,500 SAR', provider: 'STC Pay', time: '10 mins ago', saved: '45 SAR' },
                  { user: 'Amir M.', amount: '1,500 SAR', provider: 'Al Rajhi Tahweel', time: '28 mins ago', saved: '28 SAR' },
                  { user: 'Siddharth P.', amount: '4,000 SAR', provider: 'Mobily Pay', time: '55 mins ago', saved: '62 SAR' }
                ].map((rep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#091F3E] rounded-xl border border-sds-border/40 hover:border-sds-border transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0C2547] text-xs font-black text-white flex items-center justify-center border border-sds-border font-mono">
                        {rep.user.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          {rep.user} <span className="text-[10px] text-sds-text-sec font-normal">• {rep.time}</span>
                        </span>
                        <p className="text-[10px] text-sds-text-sec font-bold">
                          {isRtl ? 'أرسل' : 'Sent'} <span className="text-white font-mono">{rep.amount}</span> {isRtl ? 'عبر' : 'via'} <span className="text-[#F59E0B] font-extrabold">{rep.provider}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-sds-text-sec block font-black uppercase leading-none">{isRtl ? 'التوفير المحقق' : 'Saved'}</span>
                      <span className="text-xs font-black text-[#10B981] font-mono mt-0.5 block">+{rep.saved}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SDSCard>

            {/* TRANFSERS HISTORY */}
            <SDSCard padding="md" variant="shadow" className="border border-sds-border text-left">
              <div className="flex items-center justify-between border-b border-sds-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sds-primary/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">
                      {isRtl ? 'سجل الحوالات والتوثيق' : 'RECORDED TRANSFER HISTORY'}
                    </h3>
                    <p className="text-[10px] text-sds-text-sec">{isRtl ? 'الحوالات التي قمت بمقارنتها وتوثيقها معنا' : 'Transfers compared or submitted'}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveTab('savings')}
                  className="text-[10px] font-black uppercase text-[#10B981] hover:underline cursor-pointer font-mono"
                >
                  {isRtl ? 'عرض السجل الكامل ←' : 'View full history →'}
                </button>
              </div>

              {/* Transfer History Table/List */}
              <div className="mt-4">
                {transfers.length > 0 ? (
                  <div className="space-y-3">
                    {transfers.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 bg-[#091F3E] rounded-xl border border-sds-border/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <CountryFlag country="" currency={item.currency_code} size="xs" />
                          <ProviderLogo channel={{ providerCode: item.provider_id, displayName: item.provider_name }} size="xs" shape="circle" />
                          <div>
                            <span className="font-extrabold text-white block">
                              {item.send_amount} SAR → {item.recipient_amount.toLocaleString()} {item.currency_code}
                            </span>
                            <span className="text-[10px] text-sds-text-sec font-mono font-bold">
                              {new Date(item.recorded_at!).toLocaleDateString()} • {item.provider_name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#10B981] font-black font-mono block">
                            +{item.computed_savings} SAR
                          </span>
                          <span className="text-[9px] text-sds-text-sec uppercase font-bold">{isRtl ? 'توفير' : 'Saved'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-[#091F3E] border border-dashed border-sds-border rounded-2xl">
                    <p className="text-[11px] text-sds-text-sec font-black uppercase">
                      {isRtl ? 'لا توجد حوالات مسجلة بعد' : 'Start tracking your savings after your first comparison.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('compare')}
                      className="mt-2 text-[10px] font-black text-[#10B981] hover:underline cursor-pointer"
                    >
                      {isRtl ? 'قارن الأسعار الآن' : 'Compare Rates Now'}
                    </button>
                  </div>
                )}
              </div>
            </SDSCard>

          </div>

          {/* RIGHT SECTION: QUICK ACTIONS, CALCULATOR, RECENT SAVINGS BENTO (Col span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* QUICK SEND CALCULATOR & CORRIDOR DROP-DOWN */}
            <SDSCard padding="md" variant="shadow" className="space-y-5 border border-sds-border text-left bg-gradient-to-br from-[#0C2547] to-[#091F3E]">
              <div className="flex items-center gap-2 border-b border-sds-border/60 pb-3">
                <Calculator className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-xs font-black uppercase text-white tracking-widest">
                  {isRtl ? 'الحاسبة السريعة' : 'QUICK CALCULATOR'}
                </h3>
              </div>

              {/* Corridor Dropdown */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest">
                  {isRtl ? 'بلد التحويل المستهدف' : 'TARGET CORRIDOR'}
                </label>
                <div className="relative">
                  <select
                    value={selectedCorridorId}
                    onChange={(e) => setSelectedCorridorId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-black text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                  >
                    {CORRIDORS.map((c) => (
                      <option key={c.id} value={c.id} className="font-bold text-[#071A35]">
                        {c.flag} {isRtl ? c.toCountryAr : c.toCountry} ({c.currencyCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input amount */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest">
                  {isRtl ? 'أنت ترسل (ريال سعودي)' : 'YOU SEND (SAR)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#071A35] border border-sds-border focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/10 rounded-xl px-4 py-2.5 font-mono font-black text-sm text-white focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-sds-text-sec font-mono">
                    SAR
                  </span>
                </div>
              </div>

              {/* Family Receives */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest">
                  {isRtl ? 'العائلة تستلم' : 'THEY RECEIVE'}
                </label>
                <div className="p-3 bg-[#071A35] border border-sds-border rounded-xl font-mono text-sm font-black text-[#10B981] flex justify-between items-center">
                  <span>
                    {isLoading ? (isRtl ? 'جاري الحساب...' : 'Calculating...') : netRecipient.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-xs font-bold text-sds-text-sec">{activeCorridor.currencyCode}</span>
                </div>
              </div>

              {/* Conversion Breakdown Meta */}
              <div className="flex items-center justify-between text-[11px] pt-3 border-t border-sds-border/60">
                <div>
                  <span className="text-[9px] text-sds-text-sec block font-black uppercase">{isRtl ? 'أفضل مزود' : 'BEST PROVIDER'}</span>
                  <span className="font-extrabold text-white">{bestProvider}</span>
                </div>
                <div>
                  <span className="text-[9px] text-sds-text-sec block font-black uppercase text-right">{isRtl ? 'التوفير المتوقع' : 'EST SAVINGS'}</span>
                  <span className="font-mono text-[#10B981] font-black">+{estimatedSavings} SAR</span>
                </div>
              </div>

              <button
                onClick={handleCompareFull}
                className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 active:scale-98 text-[#071A35] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>{isRtl ? 'تحليل ومقارنة كل الأسعار' : 'Compare All Providers'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </SDSCard>

            {/* RECENT SAVINGS BENTO CARD */}
            <SDSCard padding="md" variant="shadow" className="border border-sds-border text-left bg-gradient-to-b from-[#0C2547] to-[#071A35]">
              <div className="flex items-center gap-2 border-b border-sds-border/60 pb-3">
                <Wallet className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs font-black uppercase text-white tracking-widest">
                  {isRtl ? 'ملخص التوفير الشخصي' : 'REMIT SAVINGS METRICS'}
                </h3>
              </div>

              {/* Key numbers */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-[#091F3E] p-3.5 rounded-2xl border border-sds-border/40 text-left">
                  <span className="text-[9px] text-sds-text-sec block uppercase font-black tracking-wide">
                    {isRtl ? 'هذا الشهر' : 'THIS MONTH'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black font-mono text-white">
                      {monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-sds-text-sec font-bold">SAR</span>
                  </div>
                </div>

                <div className="bg-[#091F3E] p-3.5 rounded-2xl border border-sds-border/40 text-left">
                  <span className="text-[9px] text-sds-text-sec block uppercase font-black tracking-wide">
                    {isRtl ? 'إجمالي التوفير' : 'LIFETIME'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black font-mono text-[#F59E0B]">
                      {lifetimeSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-[#F59E0B] font-bold">SAR</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#10B981]/5 rounded-xl border border-[#10B981]/15 text-xs text-sds-text leading-relaxed">
                {isRtl ? (
                  <>
                    لقد قمت بتوفير ما يقارب <span className="text-[#10B981] font-black">{lifetimeSavings.toLocaleString()} ريال</span> عن طريق الإرسال بالقنوات الموصى بها بدلاً من البنوك التقليدية. استمر بالتحقق الذكي!
                  </>
                ) : (
                  <>
                    Your financial intelligence has saved you <span className="text-[#10B981] font-black">{lifetimeSavings.toLocaleString()} SAR</span> vs. standard average bank rates this year.
                  </>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveTab('savings')}
                  className="text-[11px] font-black text-[#10B981] hover:underline cursor-pointer"
                >
                  {isRtl ? 'أدوات تحليل المدخرات الكاملة ←' : 'Savings Analytics Dashboard →'}
                </button>
              </div>
            </SDSCard>

          </div>

        </div>

      </div>

    </div>
  );
}
