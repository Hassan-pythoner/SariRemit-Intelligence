import React, { useState, useEffect } from 'react';
import { SariRemitLogo } from './SariRemitLogo';
import { useLanguage } from './LanguageContext';
import { CORRIDORS, PROVIDERS } from '../data/mockData';
import { UserProfile, CorridorId, ProviderId, CommunityTransferVerification } from '../types';
import { 
  User, Shield, Smartphone, Heart, Target, Award, CheckCircle, 
  Settings, Save, Languages, MessageSquare, Flame, HelpCircle,
  KeyRound, ShieldCheck, ArrowRight, ArrowLeft, Lock, Loader2, RefreshCw
} from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import { getFirebaseCommunityTransferVerifications } from '../lib/firebase';

interface ProfilePageProps {
  profile: UserProfile;
  saveProfile: (newProfile: UserProfile) => void;
  recordSavedAmount?: (savedAmount: number, details?: { providerId: string; amount: number; corridorId: string }) => void;
  deleteSavingsRecord?: (id: string) => void;
  userSession?: { id?: string; name: string; email: string; homeCountry: CorridorId; isGuest?: boolean } | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  profile, 
  saveProfile, 
  recordSavedAmount,
  deleteSavingsRecord,
  userSession,
  onOpenAuthModal,
  onSignOut
}) => {
  const { t, language, setLanguage } = useLanguage();

  // Form states
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [customSavedAmount, setCustomSavedAmount] = useState<number>(20);
  const [homeCountry, setHomeCountry] = useState<CorridorId>(profile.homeCountry);
  const [savingsTarget, setSavingsTarget] = useState<number>(profile.savingsTargetSar);
  const [favoriteProviders, setFavoriteProviders] = useState<ProviderId[]>(profile.favoriteProviders);
  const [notifSms, setNotifSms] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);

  // Community verifications states
  const [verifications, setVerifications] = useState<CommunityTransferVerification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Sync form state when profile prop updates
  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone || '');
    setHomeCountry(profile.homeCountry);
    setSavingsTarget(profile.savingsTargetSar);
    setFavoriteProviders(profile.favoriteProviders || []);
  }, [profile]);

  // Fetch community verifications
  const loadVerifications = async () => {
    if (userSession && !userSession.isGuest) {
      setLoadingVerifications(true);
      try {
        const data = await getFirebaseCommunityTransferVerifications(userSession.id || userSession.email);
        setVerifications(data);
      } catch (e) {
        console.warn('Failed to load community verifications', e);
      } finally {
        setLoadingVerifications(false);
      }
    }
  };

  useEffect(() => {
    loadVerifications();
  }, [userSession]);

  // Calculate Expat Rank based on simulated savings
  const getExpatRank = (saved: number) => {
    if (saved < 50) return { rank: language === 'en' ? 'Novice Expat 🎒' : 'مغترب مستجد 🎒', bg: 'from-blue-600/20 to-indigo-700/25 border-indigo-500/30', max: 50 };
    if (saved < 150) return { rank: language === 'en' ? 'Budget Champion 🛡️' : 'بطل التوفير 🛡️', bg: 'from-amber-600/20 to-orange-700/25 border-orange-500/30', max: 150 };
    if (saved < 500) return { rank: language === 'en' ? 'Savings Master 👑' : 'سيد الادخار 👑', bg: 'from-green-600/20 to-teal-700/25 border-green-500/30', max: 500 };
    return { rank: language === 'en' ? 'Remittance Sage 🧙‍♂️' : 'حكيم التحويلات 🧙‍♂️', bg: 'from-purple-600/20 to-pink-700/25 border-pink-500/30', max: 1000 };
  };

  const expatRank = getExpatRank(profile.totalSavedSar);
  const progressPercent = Math.min(100, (profile.totalSavedSar / expatRank.max) * 100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    saveProfile({
      ...profile,
      name,
      phone,
      homeCountry,
      savingsTargetSar: savingsTarget,
      favoriteProviders,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleProviderToggle = (pid: ProviderId) => {
    if (favoriteProviders.includes(pid)) {
      setFavoriteProviders(favoriteProviders.filter(id => id !== pid));
    } else {
      setFavoriteProviders([...favoriteProviders, pid]);
    }
  };

  const isRtl = language === 'ar';

  if (!userSession) {
    return (
      <div className="space-y-8 pb-16 text-white animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-[#00E07A]" />
            <span>{t('profileTitle')}</span>
          </h1>
          <p className="text-[#AFC4D8] text-sm max-w-2xl">
            {t('profileSub')}
          </p>
        </div>

        {/* Lock Wall */}
        <div className="max-w-2xl mx-auto bg-[#061B3A] border border-white/10 p-8 rounded-[28px] shadow-2xl text-center space-y-6 mt-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#00E07A]/10 border border-[#00E07A]/25 flex items-center justify-center text-[#00E07A] relative">
              <KeyRound className="w-10 h-10" />
              <Lock className="w-5 h-5 absolute -bottom-1 -right-1 bg-[#031126] text-[#00E07A] rounded-full p-0.5 border-2 border-white/10" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00E07A]/10 border border-[#00E07A]/25 text-[10px] font-bold text-[#00E07A] rounded-full font-mono uppercase tracking-wider">
              {language === 'en' ? 'SECURE EXPAT PROFILE' : 'ملف المغترب الآمن'}
            </span>
            <h2 className="text-2xl font-black text-white leading-tight">
              {language === 'en' ? 'Unlock Your Expat Dashboard' : 'افتح لوحة تحكم المغترب الخاصة بك'}
            </h2>
            <p className="text-xs text-[#AFC4D8] max-w-lg mx-auto leading-relaxed">
              {language === 'en'
                ? 'Join SariRemit to customize your profile, save your primary sending corridors, track your verified savings goals, customize SMS alerts, and unlock your official Expat Rank badge.'
                : 'انضم إلى ساري ريميت لتخصيص ملفك الشخصي، وحفظ قنوات التحويل المفضلة لديك، وتتبع أهداف التوفير الموثقة، وتخصيص تنبيهات الرسائل النصية، وفتح شارة مستوى المغترب الرسمية الخاصة بك.'}
            </p>
          </div>

          {/* Feature highlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left rtl:text-right pt-2">
            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <Award className="w-5 h-5 text-[#FDBA2D]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'Expat Level Rank' : 'مستوى المغترب'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Earn rank badges by logging savings' : 'احصل على شارات مميزة بتسجيل توفيرك'}
              </p>
            </div>
            
            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <Target className="w-5 h-5 text-[#FDBA2D]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'Custom Targets' : 'أهداف مخصصة'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Set and track monthly savings targets' : 'حدد وتتبع أهداف الادخار الشهرية'}
              </p>
            </div>

            <div className="p-4 bg-[#031126] rounded-2xl border border-white/10 space-y-1">
              <ShieldCheck className="w-5 h-5 text-[#00C16A]" />
              <h4 className="text-xs font-bold text-white">
                {language === 'en' ? 'Verified Status' : 'حالة موثقة'}
              </h4>
              <p className="text-[10px] text-[#B8C7D9]/80 leading-snug">
                {language === 'en' ? 'Gain community trust status instantly' : 'احصل على حالة موثوقية مجتمعية فورية'}
              </p>
            </div>
          </div>

          <div className="pt-4 max-w-xs mx-auto space-y-3.5">
            <button
              id="profile-lock-unlock-btn"
              onClick={onOpenAuthModal}
              className="w-full py-3.5 bg-gradient-to-r from-[#00C16A] to-[#00E07A] hover:opacity-90 text-[#031126] font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <span>{language === 'en' ? 'Sign In / Register Now' : 'تسجيل دخول / إنشاء حساب'}</span>
              {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
            <p className="text-[9px] text-[#B8C7D9]">
              {language === 'en'
                ? 'Free & fully secure. No credit card required.'
                : 'مجاني وآمن بالكامل. لا يتطلب أي بطاقات ائتمانية.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-white animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-[#00E07A]" />
          <span>{t('profileTitle')}</span>
        </h1>
        <p className="text-[#AFC4D8] text-sm max-w-2xl">
          {t('profileSub')}
        </p>
      </div>

      {/* Grid: Expat Rank & Target bar top, form details below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Expat Badge, Progress metrics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Expat Level Rank Card */}
          <div className={`bg-gradient-to-br ${expatRank.bg} border text-white p-6 rounded-[24px] relative overflow-hidden shadow-2xl`}>
            <div className="absolute -bottom-6 -right-6 opacity-5 text-9xl">⚡</div>
            
            <div className="space-y-4 relative z-10">
              <span className="bg-white/10 text-[#00E07A] font-mono text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded border border-[#00E07A]/25">
                {t('expatLevel')}
              </span>
              <h3 className="text-2xl font-black leading-tight">
                {expatRank.rank}
              </h3>
              <p className="text-xs text-[#AFC4D8] leading-relaxed">
                {language === 'en'
                  ? 'Your ranking grows as you compare rates, submit community data, and record transaction savings with SariRemit.'
                  : 'يزداد تصنيفك كلما قارنت الأسعار، أرسلت مشاركات للمجتمع، وسجلت مدخرات حقيقية معنا.'}
              </p>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#B8C7D9]/60">{language === 'en' ? 'Rank Progress' : 'تقدم المستوى'}</span>
                  <span className="font-bold text-[#00E07A]">{profile.totalSavedSar.toFixed(2)} / {expatRank.max} SAR</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-[#031126] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00E07A] rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Contributor Trust Score Card */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h4 className="font-extrabold text-white flex items-center justify-between pb-2 border-b border-white/10 text-xs uppercase tracking-wider font-sans">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-[#00E07A]" />
                <span>{language === 'en' ? 'Contributor Trust Score' : 'مؤشر ثقة المساهم'}</span>
              </span>
              <button 
                type="button"
                onClick={loadVerifications}
                className="p-1 hover:bg-white/5 rounded transition-colors text-[#7E96AA] hover:text-white cursor-pointer"
                title={language === 'en' ? 'Sync data' : 'مزامنة البيانات'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingVerifications ? 'animate-spin' : ''}`} />
              </button>
            </h4>

            {(() => {
              const verifiedVerifications = verifications.filter(v => v.submission_status === 'Verified');
              const contributorPoints = verifications.length * 10 + verifiedVerifications.length * 15;

              const getContributorLevel = (pts: number) => {
                if (pts < 20) return { name: language === 'en' ? 'New Contributor' : 'مساهم جديد', badge: '🌱', color: 'text-blue-400' };
                if (pts < 50) return { name: language === 'en' ? 'Verified Contributor' : 'مساهم موثق', badge: '✓', color: 'text-[#00E07A]' };
                if (pts < 100) return { name: language === 'en' ? 'Trusted Contributor' : 'مساهم موثوق به', badge: '⭐️', color: 'text-amber-400' };
                if (pts < 200) return { name: language === 'en' ? 'Gold Contributor' : 'مساهم ذهبي', badge: '🥇', color: 'text-yellow-400' };
                return { name: language === 'en' ? 'Community Expert' : 'خبير مجتمعي', badge: '👑', color: 'text-purple-400' };
              };

              const contributorLevel = getContributorLevel(contributorPoints);

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-[#031126] p-3 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#00C16A]/15 to-[#00E07A]/5 border border-[#00C16A]/20 flex items-center justify-center font-bold text-lg">
                      {contributorLevel.badge}
                    </div>
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black block ${contributorLevel.color}`}>
                        {contributorLevel.name}
                      </span>
                      <span className="text-[10px] text-[#B8C7D9]/60 block font-mono">
                        {contributorPoints} {language === 'en' ? 'Trust Points' : 'نقاط ثقة'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-[#031126] p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-[#B8C7D9]/50 block uppercase">{language === 'en' ? 'Submissions' : 'المشاركات'}</span>
                      <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">{verifications.length}</span>
                    </div>
                    <div className="bg-[#031126] p-2.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-[#B8C7D9]/50 block uppercase">{language === 'en' ? 'Verified' : 'المعتمدة'}</span>
                      <span className="text-sm font-extrabold text-[#00E07A] font-mono mt-0.5 block">{verifiedVerifications.length}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Savings Target Dashboard Meter */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h4 className="font-extrabold text-white flex items-center gap-1.5 pb-2 border-b border-white/10 text-xs uppercase tracking-wider">
              <Target className="w-5 h-5 text-[#00E07A]" />
              <span>{t('savingsTracker')}</span>
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#031126] p-4 rounded-xl text-center border border-white/10">
                <div className="flex-1">
                  <span className="text-[9px] text-[#B8C7D9]/60 block uppercase font-mono">{t('lifetimeSavings')}</span>
                  <span className="text-xl font-bold text-[#00E07A] font-mono block mt-1">
                    {profile.totalSavedSar.toFixed(2)} SAR
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="flex-1">
                  <span className="text-[9px] text-[#B8C7D9]/60 block uppercase font-mono">{t('monthlySavingsGoal')}</span>
                  <span className="text-xl font-bold text-white font-mono block mt-1">
                    {profile.savingsTargetSar} SAR
                  </span>
                </div>
              </div>

              {/* Progress target ratio bar */}
              <div className="space-y-1.5 text-xs text-[#B8C7D9]">
                <div className="flex justify-between text-[10px] font-mono">
                  <span>{language === 'en' ? 'Goal Achievement' : 'تحقيق الهدف'}</span>
                  <span className="text-[#00E07A] font-bold">{Math.min(100, Math.round((profile.totalSavedSar / profile.savingsTargetSar) * 100))}%</span>
                </div>
                <div className="h-2 bg-[#031126] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#00E07A] rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (profile.totalSavedSar / profile.savingsTargetSar) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Record custom saving section */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <span className="text-[10px] text-[#B8C7D9]/60 block uppercase font-extrabold tracking-wider">
                  {language === 'en' ? 'Quick Record Saving' : 'تسجيل سريع للوفر'}
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      id="profile-custom-saved-amount"
                      value={customSavedAmount === 0 ? '' : customSavedAmount}
                      onChange={(e) => setCustomSavedAmount(Math.max(0, Number(e.target.value)))}
                      placeholder={language === 'en' ? 'Amount (SAR)' : 'المبلغ (ريال)'}
                      className="w-full bg-[#031126] text-white font-mono text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-[#B8C7D9]/60 font-bold">SAR</span>
                  </div>
                  <button
                    type="button"
                    id="profile-log-savings-btn"
                    onClick={() => {
                      if (customSavedAmount > 0) {
                        if (recordSavedAmount) {
                          recordSavedAmount(customSavedAmount, {
                            providerId: 'urpay',
                            amount: 1000,
                            corridorId: homeCountry
                          });
                        }
                        setCustomSavedAmount(20); // reset
                      }
                    }}
                    className="px-4 py-2 bg-[#00C16A] hover:bg-[#00E07A] text-[#031126] font-extrabold text-xs rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    {language === 'en' ? 'Record' : 'سجل'}
                  </button>
                </div>
                <p className="text-[9px] text-[#B8C7D9]/60 leading-relaxed">
                  {language === 'en'
                    ? 'Tip: Did you compare rates and save? Record it here to boost your Expat Level!'
                    : 'نصيحة: هل قارنت الأسعار ووفرت؟ سجل توفيرك هنا لترقية مستواك!'}
                </p>
              </div>
            </div>
          </div>

          {/* Real Savings History Engine panel */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h4 className="font-extrabold text-white flex items-center justify-between pb-2 border-b border-white/10 text-xs uppercase tracking-wider font-sans">
              <span className="flex items-center gap-1.5">
                <Award className="w-5 h-5 text-[#00E07A]" />
                <span>{language === 'en' ? 'Savings History Log' : 'سجل الادخار الفعلي'}</span>
              </span>
              <span className="text-[10px] bg-[#00E07A]/10 text-[#00E07A] px-2.5 py-0.5 rounded-full font-mono font-bold">
                {(profile.savingsHistory || []).length} {language === 'en' ? 'logs' : 'قيود'}
              </span>
            </h4>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {!profile.savingsHistory || profile.savingsHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#B8C7D9] space-y-3 flex flex-col items-center justify-center">
                  <SariRemitLogo variant="icon" className="w-8 h-8 opacity-45" />
                  <div>
                    <p className="font-bold text-slate-300">{language === 'en' ? 'No transfers recorded yet.' : 'لم يتم تسجيل أي عمليات تحويل بعد.'}</p>
                    <p className="text-[10px] text-[#B8C7D9]/60 mt-1">
                      {language === 'en' ? "Let's help you maximize your next remittance." : 'دعنا نساعدك في تحقيق أقصى استفادة من تحويلك القادم.'}
                    </p>
                  </div>
                </div>
              ) : (
                profile.savingsHistory.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-[#031126] border border-white/10 rounded-xl flex items-center justify-between text-xs transition-all hover:border-[#00C16A]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00C16A]/10 to-[#00E07A]/5 border border-[#00C16A]/25 flex items-center justify-center font-bold text-sm">
                        💰
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#00E07A]">+{item.savedSar.toFixed(2)} SAR</span>
                          <span className="text-[8px] text-[#B8C7D9]/60 bg-white/5 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                            {item.providerId.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#B8C7D9]/80">
                          {language === 'en' 
                            ? `Sent ${item.amount} SAR on ${new Date(item.date).toLocaleDateString()}` 
                            : `حوّل ${item.amount} ر.س في ${new Date(item.date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {deleteSavingsRecord && (
                      <button
                        type="button"
                        onClick={() => deleteSavingsRecord(item.id)}
                        className="p-1 text-[#B8C7D9]/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                        title={language === 'en' ? 'Delete entry' : 'حذف القيد'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Verified Transfers List Card */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4 animate-fade-in">
            <h4 className="font-extrabold text-white flex items-center justify-between pb-2 border-b border-white/10 text-xs uppercase tracking-wider font-sans">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-[#00E07A]" />
                <span>{language === 'en' ? 'My Verified Transfers' : 'حوالاتي المؤكدة مجتمعياً'}</span>
              </span>
              <span className="text-[10px] bg-[#00E07A]/10 text-[#00E07A] px-2.5 py-0.5 rounded-full font-mono font-bold">
                {verifications.length} {language === 'en' ? 'submissions' : 'مرفوعات'}
              </span>
            </h4>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {loadingVerifications ? (
                <div className="text-center py-8 text-xs text-[#B8C7D9] flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#00E07A] animate-spin" />
                  <span>{language === 'en' ? 'Loading verifications...' : 'جاري تحميل الحوالات المؤكدة...'}</span>
                </div>
              ) : verifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#B8C7D9] space-y-3 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    ✓
                  </div>
                  <div>
                    <p className="font-bold text-slate-300">{language === 'en' ? 'No verified transfers yet.' : 'لا توجد حوالات موثقة بعد.'}</p>
                    <p className="text-[10px] text-[#B8C7D9]/60 mt-1">
                      {language === 'en' 
                        ? 'Submit your first completed transfer receipt to earn trust points!' 
                        : 'أرسل أول إيصال حوالة مكتملة للحصول على نقاط الموثوقية!'}
                    </p>
                  </div>
                </div>
              ) : (
                verifications.map((item) => {
                  const corr = CORRIDORS.find(c => c.id === item.corridor);
                  const isVerifiedStatus = item.submission_status === 'Verified' || item.verification_status === 'approved';
                  const isRejectedStatus = item.submission_status === 'Rejected' || item.verification_status === 'rejected';

                  let statusBadge = (
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold font-sans">
                      ⏳ {language === 'en' ? 'Pending' : 'قيد المراجعة'}
                    </span>
                  );

                  if (isVerifiedStatus) {
                    statusBadge = (
                      <span className="text-[9px] bg-[#00E07A]/15 text-[#00E07A] border border-[#00E07A]/25 px-2 py-0.5 rounded-full font-bold font-sans">
                        ✓ {language === 'en' ? 'Verified' : 'معتمد'}
                      </span>
                    );
                  } else if (isRejectedStatus) {
                    statusBadge = (
                      <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full font-bold font-sans">
                        🚨 {language === 'en' ? 'Discrepancy' : 'مرفوض'}
                      </span>
                    );
                  }

                  return (
                    <div 
                      key={item.id} 
                      className="p-3 bg-[#031126] border border-white/5 rounded-xl space-y-2.5 transition-all hover:border-[#00C16A]/10 text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[10px] text-[#7E96AA] font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {statusBadge}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-xs uppercase">{item.provider}</span>
                            <span className="text-[10px] text-slate-400">{corr?.flag} {item.corridor}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {item.amount_sent} SAR @ {item.exchange_rate}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-[#7E96AA] block">{language === 'en' ? 'Payout:' : 'المستلم:'}</span>
                          <span className="text-xs font-black text-white font-mono">
                            {item.recipient_amount.toFixed(2)} {corr?.currencyCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Form details, Favorites, settings */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
          
          {/* Details Form Card */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-5">
            <h3 className="font-extrabold text-white pb-2 border-b border-white/10 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Shield className="w-5 h-5 text-[#00E07A]" />
              <span>{t('personalDetails')}</span>
            </h3>

            {showSuccess && (
              <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 text-[#00E07A] p-3.5 rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold">{t('profileSavedSuccess')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#B8C7D9]/60 uppercase tracking-widest">
                  {language === 'en' ? 'Full Name' : 'الاسم الكامل'}
                </label>
                <input
                  type="text"
                  id="profile-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#031126] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#B8C7D9]/60 uppercase tracking-widest">
                  {language === 'en' ? 'Mobile Number' : 'رقم الجوال'}
                </label>
                <input
                  type="text"
                  id="profile-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#031126] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#B8C7D9]/60 uppercase tracking-widest">
                  {language === 'en' ? 'Primary Destination Country' : 'بلد الوجهة الرئيسي'}
                </label>
                <select
                  id="profile-home-country"
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value as CorridorId)}
                  className="w-full bg-[#031126] text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A] cursor-pointer font-semibold"
                >
                  {CORRIDORS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#031126] text-white">
                      {c.flag} {language === 'en' ? c.nameEn : c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#B8C7D9]/60 uppercase tracking-widest">
                  {language === 'en' ? 'Savings Goal (SAR / Month)' : 'هدف التوفير (ريال / الشهر)'}
                </label>
                <input
                  type="number"
                  id="profile-savings-goal"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#031126] text-white font-mono text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#00C16A]"
                />
              </div>
            </div>
          </div>

          {/* Favorite providers checklist */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white pb-2 border-b border-white/10 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>{language === 'en' ? 'Preferred Channels' : 'القنوات المفضلة'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROVIDERS.map((p) => {
                const isFav = favoriteProviders.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    id={`fav-provider-${p.id}`}
                    onClick={() => handleProviderToggle(p.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer ${
                      isFav
                        ? 'border-[#00E07A]/50 bg-[#00E07A]/5 text-[#00E07A]'
                        : 'border-white/10 bg-[#031126] text-[#B8C7D9] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ProviderLogo providerId={p.id} className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-white/10" />
                      <span>{p.name}</span>
                    </div>

                    <span className="text-base">{isFav ? '❤️' : '🤍'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting & Utilities */}
          <div className="bg-[#061B3A] border border-white/10 p-6 rounded-[24px] shadow-2xl space-y-4">
            <h3 className="font-extrabold text-white pb-2 border-b border-white/10 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Settings className="w-5 h-5 text-[#00E07A]" />
              <span>{t('settings')}</span>
            </h3>

            <div className="space-y-4">
              
              {/* Lang select switch inside profile */}
              <div className="flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-white">{t('languagePref')}</h4>
                  <p className="text-[#B8C7D9] mt-0.5">{language === 'en' ? 'Toggle English / Arabic layouts' : 'التبديل بين الإنجليزية والعربية'}</p>
                </div>
                <div className="flex bg-[#031126] p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    id="profile-lang-en"
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      language === 'en' ? 'bg-[#061B3A] text-[#00E07A] font-extrabold border border-[#00E07A]/20' : 'text-[#B8C7D9]/60'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    id="profile-lang-ar"
                    onClick={() => setLanguage('ar')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      language === 'ar' ? 'bg-[#061B3A] text-[#00E07A] font-extrabold border border-[#00E07A]/20' : 'text-[#B8C7D9]/60'
                    }`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              {/* Toggle notifications */}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-white/10">
                <div>
                  <h4 className="font-bold text-white">{t('notificationPref')}</h4>
                  <p className="text-[#B8C7D9] mt-0.5">{language === 'en' ? 'Get rate peaks and weekly digests' : 'احصل على ذروة أسعار الصرف وملخصات أسبوعية'}</p>
                </div>
                <button
                  type="button"
                  id="profile-sms-toggle"
                  onClick={() => setNotifSms(!notifSms)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-bold transition-all cursor-pointer ${
                    notifSms 
                      ? 'bg-[#00E07A]/15 text-[#00E07A] border-[#00E07A]/30' 
                      : 'bg-[#031126] text-[#B8C7D9]/60 border-white/10'
                  }`}
                >
                  {notifSms ? '🟢 ACTIVE' : '⚪ OFF'}
                </button>
              </div>

            </div>
          </div>

          {/* Submit Save changes */}
          <button
            type="submit"
            id="profile-save-submit"
            className="w-full py-3 bg-gradient-to-r from-[#00C16A] to-[#00E07A] text-[#031126] font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#031126]" />
            <span>{t('saveProfile')}</span>
          </button>

        </form>

      </div>

    </div>
  );
};
