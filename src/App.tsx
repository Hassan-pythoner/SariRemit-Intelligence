/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { enTranslations, arTranslations } from './translations';
import { getUserProfile, saveUserProfile } from './services/ratesService';
import { getAuthSession, checkIsAdminSync, syncSupabaseToLocal, signOutSession } from './services/supabaseService';
import { UserProfile as UserProfileType, TranslationDict } from './types';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import { SariRemitLogo } from './components/SdsBamComponents';
import CompareRates from './components/CompareRates';
import SubmitRate from './components/SubmitRate';
import CorridorInsights from './components/CorridorInsights';
import Alerts from './components/Alerts';
import UserProfile from './components/UserProfile';
import SrcmcControl from './components/SrcmcControl';
import Dashboard from './components/Dashboard';
import Savings from './components/Savings';
import Onboarding from './components/Onboarding';
import LegalPages from './components/LegalPages';
import SupportHistory from './components/SupportHistory';
import { 
  Bell, Sparkles, CheckCircle2, MessageSquare, Landmark, Info,
  LayoutDashboard, ArrowLeftRight, PlusCircle, PiggyBank, Compass, User, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Globe
} from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import { ENABLE_SDS_3_USER_SHELL } from './services/constants';

export default function App() {
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const session = getAuthSession();
    return session.user ? 'dashboard' : 'landing';
  });
  
  // Initialize profile from Supabase session if available, fallback to empty guest profile
  const getInitialProfile = (): UserProfileType => {
    const session = getAuthSession();
    if (session.user) {
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        preferredCorridorId: session.user.preferredCorridorId,
        language: session.user.language,
        onboarding_completed: session.user.onboarding_completed,
        primary_destination_country: session.user.primary_destination_country,
        primary_destination_currency: session.user.primary_destination_currency,
        preferred_channels: session.user.preferred_channels,
        estimated_monthly_send_amount: session.user.estimated_monthly_send_amount,
      };
    }
    // Return empty guest profile to prevent fake logins from mock profile defaults
    return {
      name: '',
      email: '',
      phone: '',
      preferredCorridorId: 'sa-pk',
      language: 'en',
      onboarding_completed: false
    };
  };

  const [profile, setProfile] = useState<UserProfileType>(getInitialProfile());
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [srcmcAccess, setSrcmcAccess] = useState<any | null>(null);
  const [srcmcAccessLoading, setSrcmcAccessLoading] = useState<boolean>(true);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const isLoggedIn = !!profile.email;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sds_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);

  // Monitor loading timeout
  useEffect(() => {
    let timer: any;
    if (appLoading || (isLoggedIn && srcmcAccessLoading)) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout for resilient fallback
    } else {
      setLoadingTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [appLoading, srcmcAccessLoading, isLoggedIn]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sds_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Verify and fetch authentic Supabase session/profile on mount
  useEffect(() => {
    async function checkSessionOnMount() {
      try {
        console.log('[SariRemit Mount Check] Checking for active Supabase session...');
        setSrcmcAccessLoading(true);
        
        // Check if we are handling a Google OAuth redirect callback
        const isCallback = window.location.pathname.startsWith('/auth/callback');
        if (isCallback) {
          console.log('[SariRemit Auth Callback] Detected auth callback path. Handling Google OAuth...');
          try {
            const { handleGoogleCallback, getAndRepairUserSrcmcAccess } = await import('./services/supabaseService');
            const session = await handleGoogleCallback();
            
            if (session && session.user) {
              console.log('[SariRemit Auth Callback] Google login successful. User ID:', session.user.id);
              const resolvedProfile = {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                phone: session.user.phone,
                preferredCorridorId: session.user.preferredCorridorId,
                language: session.user.language,
                onboarding_completed: session.user.onboarding_completed,
                primary_destination_country: session.user.primary_destination_country,
                primary_destination_currency: session.user.primary_destination_currency,
                preferred_channels: session.user.preferred_channels,
                estimated_monthly_send_amount: session.user.estimated_monthly_send_amount,
              };
              setProfile(resolvedProfile);
              if (resolvedProfile.language) {
                setLanguage(resolvedProfile.language);
              }

              const access = await getAndRepairUserSrcmcAccess(session.user.id, session.user.email);
              setSrcmcAccess(access);

              // 10. If onboarding_completed is true, redirect to /dashboard.
              // 11. If onboarding_completed is false, redirect to /onboarding (onboarding handles this automatically when logged in)
              setActiveTab('dashboard');
              triggerToast(language === 'en' ? "Signed in with Google successfully!" : "تم تسجيل الدخول باستخدام Google بنجاح!");
            }
          } catch (err: any) {
            console.error('[SariRemit Auth Callback] Google authentication error:', err);
            triggerToast(language === 'en' ? `Google login failed: ${err.message}` : `فشل تسجيل الدخول باستخدام Google: ${err.message}`);
            setActiveTab('sign-in');
          } finally {
            // Clean up url so that refreshing the page doesn't run the callback again!
            try {
              window.history.replaceState(null, '', '/');
            } catch (e) {
              console.warn('Failed to clean up URL:', e);
            }
            setSrcmcAccessLoading(false);
            setAppLoading(false);
          }
          return;
        }

        const { getCurrentSessionProfile, getAndRepairUserSrcmcAccess } = await import('./services/supabaseService');
        const session = await getCurrentSessionProfile();
        
        if (session && session.user) {
          console.log('[SariRemit Mount Check] Session found. User ID:', session.user.id);
          console.log('[SariRemit Mount Check] Email:', session.user.email);
          console.log('[SariRemit Mount Check] Onboarding Status:', session.user.onboarding_completed);
          
          const resolvedProfile = {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            phone: session.user.phone,
            preferredCorridorId: session.user.preferredCorridorId,
            language: session.user.language,
            onboarding_completed: session.user.onboarding_completed,
            primary_destination_country: session.user.primary_destination_country,
            primary_destination_currency: session.user.primary_destination_currency,
            preferred_channels: session.user.preferred_channels,
            estimated_monthly_send_amount: session.user.estimated_monthly_send_amount,
          };
          setProfile(resolvedProfile);
          if (resolvedProfile.language) {
            setLanguage(resolvedProfile.language);
          }
          
          // Fetch SRCMC access record using user.id
          const access = await getAndRepairUserSrcmcAccess(session.user.id, session.user.email);
          console.log('[SariRemit Mount Check] SRCMC Access result:', access);
          setSrcmcAccess(access);

          // Redirect to dashboard (renders onboarding if incomplete, else home dashboard)
          setActiveTab('dashboard');
          console.log('[SariRemit Mount Check] Redirect destination:', resolvedProfile.onboarding_completed ? 'dashboard' : 'onboarding');
        } else {
          console.log('[SariRemit Mount Check] No active session found.');
          setSrcmcAccess(null);
          setProfile({
            name: '',
            email: '',
            phone: '',
            preferredCorridorId: 'sa-pk',
            language: 'en',
            onboarding_completed: false
          });
          setActiveTab('landing');
        }
      } catch (err) {
        console.error('[SariRemit Mount Check] Error during session validation:', err);
      } finally {
        setSrcmcAccessLoading(false);
        setAppLoading(false);
      }
    }
    
    checkSessionOnMount();
  }, []);

  // Sync profile when session state updates
  const syncProfileWithSession = async () => {
    setSrcmcAccessLoading(true);
    const updated = getInitialProfile();
    setProfile(updated);
    if (updated.language) {
      setLanguage(updated.language);
    }

    const session = getAuthSession();
    if (session.user) {
      try {
        const { getAndRepairUserSrcmcAccess } = await import('./services/supabaseService');
        const access = await getAndRepairUserSrcmcAccess(session.user.id, session.user.email);
        setSrcmcAccess(access);
      } catch (err) {
        console.error('Error syncing SRCMC access during session sync:', err);
      }
    } else {
      setSrcmcAccess(null);
    }
    setSrcmcAccessLoading(false);

    // Handle tab redirection on login/logout
    if (updated.email) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('sign-in'); // Redirect user to login form on logout
    }
  };
  
  // Shared quick search parameters between Landing Page and Compare Rates Page
  const [quickSearch, setQuickSearch] = useState<{ corridorId: string; amount: number } | null>(null);

  // Success Notification Toast states
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Load language from profile
  useEffect(() => {
    if (profile.language) {
      setLanguage(profile.language);
    }
  }, [profile]);

  // Synchronize dynamic Supabase data to client-side localStorage cache
  useEffect(() => {
    syncSupabaseToLocal();
  }, [isLoggedIn, activeTab]);

  // Protect routes and redirect unauthorized users
  useEffect(() => {
    const restrictedTabs = ['dashboard', 'compare', 'submit', 'savings', 'insights', 'alerts', 'srcmc', 'profile', 'support'];
    if (!isLoggedIn && restrictedTabs.includes(activeTab)) {
      setActiveTab('sign-in');
      triggerToast(language === 'en' ? "Please sign in or sign up to access S." : "يرجى تسجيل الدخول أو إنشاء حساب للوصول.");
    } else if (isLoggedIn && activeTab === 'srcmc') {
      if (srcmcAccessLoading) {
        return; // wait for check to complete
      }
      if (!srcmcAccess || srcmcAccess.is_active !== true) {
        setActiveTab('dashboard');
        triggerToast(language === 'en' ? "Access denied. Admins only." : "تم رفض الوصول. للمسؤولين فقط.");
      }
    }
  }, [activeTab, isLoggedIn, srcmcAccess, srcmcAccessLoading, language]);

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
    const updatedProfile = { ...profile, language: nextLang };
    setProfile(updatedProfile);
    saveUserProfile(updatedProfile);
    triggerToast(nextLang === 'en' ? "Language changed to English!" : "تم تغيير اللغة إلى العربية!");
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  const handleFooterScroll = (anchorId: string) => {
    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = async () => {
    signOutSession();
    await syncProfileWithSession();
    triggerToast(language === 'en' ? "Signed out successfully!" : "تم تسجيل الخروج بنجاح!");
  };

  const isSidebarVisible = isLoggedIn && ENABLE_SDS_3_USER_SHELL && profile.onboarding_completed && !['landing', 'privacy-policy', 'terms-of-use', 'disclaimer', 'community-verification-policy', 'rate-update-policy'].includes(activeTab);

  const canSeeSrcmc = srcmcAccess?.is_active === true;

  const sidebarItems = [
    { id: 'dashboard', label: language === 'en' ? 'Dashboard' : 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'compare', label: language === 'en' ? 'Compare Rates' : 'مقارنة الأسعار', icon: ArrowLeftRight },
    { id: 'submit', label: language === 'en' ? 'Verify Rate' : 'توثيق الحوالات', icon: PlusCircle },
    { id: 'savings', label: language === 'en' ? 'Savings Journey' : 'المدخرات والوفر', icon: PiggyBank },
    { id: 'profile', label: language === 'en' ? 'Profile Settings' : 'الملف الشخصي', icon: User },
    { id: 'support', label: language === 'en' ? 'Support Center' : 'الدعم والمساعدة', icon: MessageSquare },
    ...(canSeeSrcmc ? [{ id: 'srcmc', label: language === 'en' ? 'SRCMC Control' : 'لوحة تحكم SRCMC', icon: ShieldCheck }] : []),
  ];

  const renderTabContent = (currentTab: string) => {
    if (isLoggedIn && !profile.onboarding_completed) {
      return (
        <Onboarding
          language={language}
          t={language === 'en' ? enTranslations : arTranslations}
          profile={profile}
          onComplete={(updatedProfile) => {
            setProfile(updatedProfile);
            setActiveTab('dashboard');
            triggerToast(language === 'en' ? "Onboarding completed! Welcome to your Dashboard." : "اكتمل الإعداد! مرحبًا بك في لوحة التحكم الخاصة بك.");
          }}
        />
      );
    }

    const tDict = language === 'en' ? enTranslations : arTranslations;

    switch (currentTab) {
      case 'landing':
        return (
          <LandingPage
            setActiveTab={setActiveTab}
            language={language}
            t={tDict}
            setQuickSearch={setQuickSearch}
            isLoggedIn={isLoggedIn}
          />
        );
      case 'privacy-policy':
      case 'terms-of-use':
      case 'disclaimer':
      case 'community-verification-policy':
      case 'rate-update-policy':
        return (
          <LegalPages
            pageType={currentTab as any}
            setActiveTab={setActiveTab}
            language={language}
          />
        );
      case 'about':
        return (
          <div className="max-w-3xl mx-auto space-y-6 text-left p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-black text-white uppercase">About SariRemit</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              SariRemit is a community-driven, crowd-sourced remittance monitoring and analysis platform built for expatriates and migrant workers in the Kingdom of Saudi Arabia.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              By pulling live, verified rates from major financial channels—such as STC Pay, UrPay, Enjaz, QuickPay, and Al Rajhi Tahweel—we empower you to identify the most competitive exchange rate terms and fee options to make every Saudi Riyal go the maximum distance for your family back home.
            </p>
          </div>
        );
      case 'how-it-works':
        return (
          <div className="max-w-3xl mx-auto space-y-6 text-left p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-black text-white uppercase border-b border-slate-800 pb-2">
              {language === 'en' ? 'How It Works' : 'كيف يعمل ساري ريميت'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">1</div>
                <div>
                  <h4 className="font-bold text-white">
                    {language === 'en' ? 'Compare Live Rates' : 'قارن الأسعار المباشرة'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'en' 
                      ? "We aggregate exchange rates and fees across Saudi's most popular digital wallets and money counters daily." 
                      : "نحن نجمع أسعار الصخ والرسوم اليومية لأكثر المحافظ الرقمية شعبية في المملكة."}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">2</div>
                <div>
                  <h4 className="font-bold text-white">
                    {language === 'en' ? "Understand What You'll Really Pay" : "افهم ما ستدفعه بالفعل"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'en' 
                      ? "Most channels make money on hidden exchange margins. We calculate the exact, finalized recipient amount so you know the real winner." 
                      : "معظم قنوات التحويل تحقق أرباحاً خفية من فروق أسعار الصرف. نحن نحسب المبلغ النهائي المستلم بدقة لتعرف الخيار الأفضل لك."}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/20">3</div>
                <div>
                  <h4 className="font-bold text-white">
                    {language === 'en' ? 'Contribute & Trust' : 'شارك واكسب الثقة'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === 'en' 
                      ? "Our rates are verified using daily crowd-sourced screenshot uploads, audited by community verifiers to guarantee absolute accuracy." 
                      : "يتم تأكيد أسعارنا يومياً من خلال لقطات الشاشة المرفوعة من المغتربين، وتدقيقها لضمان الدقة الكاملة."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'profile':
      case 'sign-in':
      case 'sign-up':
        return (
          <UserProfile
            language={language}
            t={tDict}
            profile={profile}
            setProfile={(updatedProfile) => {
              setProfile(updatedProfile);
              triggerToast(language === 'en' ? "Profile settings updated!" : "تم تحديث إعدادات الملف الشخصي!");
            }}
            onSessionSync={syncProfileWithSession}
            initialAuthTab={currentTab === 'sign-up' ? 'signup' : 'signin'}
          />
        );
      default:
        // Authenticated tabs
        if (!isLoggedIn) {
          return (
            <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-xl space-y-5">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">
                {language === 'en' ? 'Sign in to unlock full features' : 'سجل الدخول لفتح جميع الميزات'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'en' 
                  ? "Create an account or sign in to access SariRemit's full suite of comparison analytics, verified rates, confidence scores, custom alerts, and savings tracking." 
                  : "أنشئ حساباً أو سجل الدخول للوصول إلى مجموعة ساري ريميت الكاملة من تحليلات المقارنة والأسعار المؤكدة، ودرجات الثقة، والتنبيهات المخصصة، وتتبع الوفر."}
              </p>
              <button
                onClick={() => setActiveTab('sign-in')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Go to Sign In / Sign Up
              </button>
            </div>
          );
        }

        switch (currentTab) {
          case 'dashboard':
            return (
              <Dashboard
                language={language}
                t={tDict}
                profile={profile}
                setActiveTab={setActiveTab}
                setQuickSearch={setQuickSearch}
              />
            );
          case 'compare':
            return (
              <CompareRates
                language={language}
                t={tDict}
                quickSearch={quickSearch}
                setQuickSearch={setQuickSearch}
                setActiveTab={setActiveTab}
              />
            );
          case 'submit':
            return (
              <SubmitRate
                language={language}
                t={tDict}
                onSubmissionSuccess={() => {
                  triggerToast(
                    language === 'en' 
                      ? "Rate contributed successfully! Verifying..." 
                      : "تمت إضافة مشاركتك! جاري التحقق..."
                  );
                }}
              />
            );
          case 'savings':
            return (
              <Savings
                language={language}
                t={tDict}
                profile={profile}
              />
            );
          case 'insights':
            return (
              <CorridorInsights
                language={language}
                t={tDict}
              />
            );
          case 'alerts':
            return (
              <Alerts
                language={language}
                t={tDict}
                onAlertCreated={() => {
                  triggerToast(
                    language === 'en' 
                      ? "Live rate alert set successfully!" 
                      : "تم تعيين تنبيه الأسعار بنجاح!"
                  );
                }}
              />
            );
          case 'srcmc':
            return srcmcAccessLoading ? (
              <div className="min-h-[400px] flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-sds-text-sec font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-sds-secondary animate-ping" />
                    Loading SRCMC Access Configuration...
                  </div>
                </div>
              </div>
            ) : srcmcAccess?.is_active ? (
              <SrcmcControl
                language={language}
                t={tDict}
                profile={profile}
                onSessionSync={syncProfileWithSession}
                srcmcAccess={srcmcAccess}
              />
            ) : (
              <div className="text-center py-12 text-rose-400 font-bold uppercase tracking-wider font-mono">
                Access Denied.
              </div>
            );
          case 'support':
            return (
              <SupportHistory
                language={language}
                t={tDict}
                onBack={() => setActiveTab('dashboard')}
              />
            );
          default:
            return null;
        }
    }
  };

  const t: TranslationDict = language === 'en' ? enTranslations : arTranslations;
  const isRtl = language === 'ar';
  const isOnboardingRequired = isLoggedIn && !profile.onboarding_completed;

  if (appLoading || (isLoggedIn && srcmcAccessLoading)) {
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-[#071A35] flex flex-col items-center justify-center font-sans p-6 text-center select-none animate-fade-in">
          <div className="max-w-md w-full bg-[#0C2547] border border-sds-border rounded-3xl p-8 shadow-sds-xl space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center animate-bounce mb-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {language === 'en' 
                  ? 'We’re having trouble opening your account.' 
                  : 'نواجه مشكلة في فتح حسابك.'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                {language === 'en'
                  ? 'Your latest information will be ready shortly. Please check your internet connection or try again.'
                  : 'ستكون أحدث معلوماتك جاهزة قريبًا. يرجى التحقق من اتصالك بالإنترنت أو المحاولة مرة أخرى.'}
              </p>
            </div>

            <div className="w-full pt-4 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-[#10B981] hover:bg-[#0d9466] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
                <span>{language === 'en' ? 'Try Again' : 'المحاولة مرة أخرى'}</span>
              </button>
              
              <button
                onClick={async () => {
                  signOutSession();
                  setLoadingTimeout(false);
                  setAppLoading(false);
                  setSrcmcAccessLoading(false);
                  setProfile({
                    name: '',
                    email: '',
                    phone: '',
                    preferredCorridorId: 'sa-pk',
                    language: 'en',
                    onboarding_completed: false
                  });
                  setActiveTab('sign-in');
                }}
                className="w-full py-3 bg-[#071A35] hover:bg-[#0b2b57] text-slate-200 hover:text-white font-semibold rounded-xl border border-sds-border transition-all cursor-pointer"
              >
                {language === 'en' ? 'Go to Sign In' : 'الذهاب لتسجيل الدخول'}
              </button>

              <button
                onClick={() => {
                  setLoadingTimeout(false);
                  setAppLoading(false);
                  setSrcmcAccessLoading(false);
                  setActiveTab('landing');
                }}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-300 font-medium transition-all cursor-pointer"
              >
                {language === 'en' ? 'Return to Home' : 'العودة للرئيسية'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#071A35] flex flex-col items-center justify-center font-sans p-6 text-center select-none relative overflow-hidden">
        {/* Abstract background blobs for premium aesthetic */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="flex flex-col items-center space-y-6 relative z-10 max-w-sm">
          {/* Logo element with custom container */}
          <div className="p-4 rounded-3xl bg-[#0C2547]/40 border border-sds-border/30 backdrop-blur-sm shadow-sds-md">
            <SariRemitLogo variant="compact" size="xl" surface="dark" className="animate-pulse" />
          </div>

          <div className="space-y-2">
            {/* Short status message */}
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isLoggedIn 
                ? (language === 'en' ? 'Getting your account ready…' : 'جاري تجهيز حسابك...')
                : (language === 'en' ? 'Preparing your SariRemit experience…' : 'جاري تحضير تجربة ساري ريميت...')}
            </h3>
            {/* Optional supporting line */}
            <p className="text-xs text-slate-400">
              {language === 'en' 
                ? 'Your latest information will be ready shortly.' 
                : 'ستكون أحدث معلوماتك جاهزة قريبًا.'}
            </p>
          </div>

          {/* Subtle animated progress indicator */}
          <div className="flex items-center gap-1.5 pt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  if (isSidebarVisible) {
    return (
      <div 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className={`min-h-screen flex bg-sds-bg-canvas text-sds-text-primary font-sans transition-all duration-300 ${isRtl ? 'text-right' : 'text-left'}`}
      >
        {/* Desktop Left Sidebar (hidden on mobile) */}
        <aside 
          className={`hidden md:flex flex-col border-r border-slate-800 bg-[#030c18] transition-all duration-300 shrink-0 select-none ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 bg-[#020a16]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <SariRemitLogo 
                variant={isSidebarCollapsed ? 'monogram' : 'primary'} 
                size={isSidebarCollapsed ? 'sm' : 'md'} 
                surface="dark" 
              />
              {!isSidebarCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="font-sans font-black text-xs uppercase tracking-wider text-amber-400">SariRemit</span>
                  <span className="text-[10px] text-slate-400 tracking-tight font-mono">Know before you send.</span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={toggleSidebar}
                className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? `bg-sds-emerald-soft text-white ${isRtl ? 'border-r-4 border-sds-emerald-primary' : 'border-l-4 border-sds-emerald-primary'}` 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sds-mint' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Collapse Toggle for Collapsed State */}
          {isSidebarCollapsed && (
            <div className="p-4 border-t border-slate-800 flex justify-center bg-[#020a16]">
              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800 bg-[#020a16]">
            <div className="flex items-center justify-between gap-2.5">
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-sds-emerald-soft text-sds-emerald-primary border border-sds-emerald-primary/20 flex items-center justify-center font-black text-xs shrink-0 font-mono uppercase">
                  {profile.name.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </div>
                {!isSidebarCollapsed && (
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-[120px]">{profile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{canSeeSrcmc ? (isRtl ? 'مشرف' : 'Admin') : (isRtl ? 'مستخدم' : 'Verified User')}</p>
                  </div>
                )}
              </div>
              {!isSidebarCollapsed && (
                <button 
                  onClick={handleLogout}
                  title={isRtl ? 'تسجيل الخروج' : 'Sign Out'}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Content Panel Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-sds-bg-canvas relative pb-20 md:pb-0">
          {/* Mobile compact header (hidden on desktop) */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#030c18] border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <SariRemitLogo variant="monogram" size="sm" surface="dark" />
              <span className="font-extrabold text-xs text-white uppercase tracking-wider font-sans">
                {activeTab === 'dashboard' ? (isRtl ? 'الرئيسية' : 'Dashboard') : sidebarItems.find(i => i.id === activeTab)?.label}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <NotificationCenter userId={profile.id} language={language} setActiveTab={setActiveTab} />
              
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-7 h-7 rounded-full bg-[#0d2a22] text-[#10b981] border border-[#10b981]/20 flex items-center justify-center font-black text-xs"
              >
                {profile.name.charAt(0).toUpperCase() || <User className="w-3" />}
              </button>
            </div>
          </div>

          {/* Desktop Compact Top Utility Bar (hidden on mobile) */}
          <header className="hidden md:flex h-16 border-b border-slate-800 bg-[#030c18]/40 backdrop-blur-md items-center justify-between px-6 shrink-0 select-none">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sds-emerald-primary animate-pulse" />
                {isRtl ? 'نبض ساري ريميت - مباشر ومؤكد' : 'SariRemit Pulse - Live & Verified'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications bell */}
              <NotificationCenter userId={profile.id} language={language} setActiveTab={setActiveTab} />

              {/* Language Selector */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors cursor-pointer border border-slate-800 font-mono"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'en' ? 'EN | عربي' : 'عربي | EN'}</span>
              </button>

              {/* Profile Card trigger */}
              <div 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 px-2.5 py-1 bg-[#051326] border border-slate-800 hover:border-amber-400/40 rounded-xl cursor-pointer transition-all hover:scale-102"
              >
                <div className="w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-black text-[10px] shrink-0 font-mono uppercase">
                  {profile.name.charAt(0).toUpperCase() || <User className="w-3" />}
                </div>
                <span className="text-xs font-bold text-slate-200">{profile.name}</span>
              </div>
            </div>
          </header>

          {/* Scrollable Main content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-sds-bg-canvas">
            <div className="max-w-6xl mx-auto">
              {renderTabContent(activeTab)}
            </div>
          </main>

          {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#030c18] border-t border-slate-800 shadow-xl px-2 pb-safe">
            <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center">
              <button 
                onClick={() => { setActiveTab('dashboard'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span className="text-[9px] font-black tracking-tight mt-1">{isRtl ? 'الرئيسية' : 'Home'}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('compare'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'compare' ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <ArrowLeftRight className="w-4.5 h-4.5" />
                <span className="text-[9px] font-black tracking-tight mt-1">{isRtl ? 'المقارنة' : 'Compare'}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('submit'); setIsMobileMoreOpen(false); }}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  activeTab === 'submit' ? 'bg-amber-400 text-slate-900 scale-95' : 'bg-amber-400 text-slate-900'
                }`}>
                  <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className={`text-[9px] font-black tracking-tight mt-1 ${activeTab === 'submit' ? 'text-amber-400' : 'text-slate-400'}`}>{isRtl ? 'توثيق' : 'Verify'}</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('savings'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'savings' ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <PiggyBank className="w-4.5 h-4.5" />
                <span className="text-[9px] font-black tracking-tight mt-1">{isRtl ? 'المدخرات' : 'Savings'}</span>
              </button>
              
              <button 
                onClick={() => setIsMobileMoreOpen(true)}
                className={`flex flex-col items-center justify-center cursor-pointer ${isMobileMoreOpen ? 'text-amber-400' : 'text-slate-400'}`}
              >
                <Menu className="w-4.5 h-4.5" />
                <span className="text-[9px] font-black tracking-tight mt-1">{isRtl ? 'المزيد' : 'More'}</span>
              </button>
            </div>
          </div>

          {/* Mobile More Drawer overlay */}
          {isMobileMoreOpen && (
            <div className="fixed inset-0 z-50 bg-[#030c18]/85 backdrop-blur-sm flex justify-end flex-col animate-fadeIn md:hidden">
              <div className="absolute inset-0 -z-10" onClick={() => setIsMobileMoreOpen(false)} />
              
              <div className="bg-[#051326] border-t border-slate-800 rounded-t-3xl max-w-lg w-full mx-auto px-6 pt-5 pb-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-sm font-black text-white uppercase tracking-wider">{isRtl ? 'خيارات إضافية' : 'More Options'}</span>
                  <button 
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={() => { setActiveTab('profile'); setIsMobileMoreOpen(false); }}
                    className={`p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col items-center gap-2 text-center text-xs font-bold ${
                      activeTab === 'profile' ? 'border-[#10B981] text-[#10B981]' : 'text-slate-200'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>{isRtl ? 'الملف الشخصي' : 'Profile Settings'}</span>
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('support'); setIsMobileMoreOpen(false); }}
                    className={`p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col items-center gap-2 text-center text-xs font-bold ${
                      activeTab === 'support' ? 'border-[#10B981] text-[#10B981]' : 'text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>{isRtl ? 'الدعم الفني' : 'Support Center'}</span>
                  </button>
                  
                  {canSeeSrcmc && (
                    <button 
                      onClick={() => { setActiveTab('srcmc'); setIsMobileMoreOpen(false); }}
                      className={`p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col items-center gap-2 text-center text-xs font-bold col-span-2 ${
                        activeTab === 'srcmc' ? 'border-[#10B981] text-[#10B981]' : 'text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>{isRtl ? 'لوحة تحكم SRCMC' : 'SRCMC Control Panel'}</span>
                    </button>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-4">
                  <button
                    onClick={() => { toggleLanguage(); setIsMobileMoreOpen(false); }}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 font-mono"
                  >
                    <Globe className="w-4 h-4 text-[#F59E0B]" />
                    <span>{language === 'en' ? 'English | عربي' : 'عربي | English'}</span>
                  </button>
                  
                  <button
                    onClick={() => { handleLogout(); setIsMobileMoreOpen(false); }}
                    className="flex items-center gap-2 px-3.5 py-2 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded-xl text-xs font-bold text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification HUD */}
        {showToast && (
          <div className={`fixed bottom-24 md:bottom-6 z-50 max-w-sm w-full mx-auto px-4 transition-all duration-300 ${
            isRtl ? 'left-0 sm:left-6' : 'right-0 sm:right-6'
          }`}>
            <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-2xl shadow-emerald-950/20 flex items-center gap-3 animate-bounce">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold font-mono tracking-wide text-emerald-400 uppercase">SariRemit System</p>
                <p className="text-xs text-slate-200 font-medium mt-0.5">{toastMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${isRtl ? 'text-right' : 'text-left'} bg-sds-bg text-sds-text`}
    >
      
      {/* Navigation Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
        profile={profile}
        srcmcAccess={srcmcAccess}
        srcmcAccessLoading={srcmcAccessLoading}
      />

      {/* Main Content Area */}
      <main className={activeTab === 'landing' ? "flex-1 w-full bg-sds-bg" : "flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-sds-bg"}>
        <div className="transition-opacity duration-300">
          
          {isLoggedIn && !profile.onboarding_completed ? (
            <Onboarding
              language={language}
              t={t}
              profile={profile}
              onComplete={(updatedProfile) => {
                setProfile(updatedProfile);
                setActiveTab('dashboard');
                triggerToast(language === 'en' ? "Onboarding completed! Welcome to your Dashboard." : "اكتمل الإعداد! مرحبًا بك في لوحة التحكم الخاصة بك.");
              }}
            />
          ) : (
            <>
              {/* Public Views */}
              {activeTab === 'landing' && (
                <LandingPage
                  setActiveTab={setActiveTab}
                  language={language}
                  t={t}
                  setQuickSearch={setQuickSearch}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {['privacy-policy', 'terms-of-use', 'disclaimer', 'community-verification-policy', 'rate-update-policy'].includes(activeTab) && (
                <LegalPages
                  pageType={activeTab as any}
                  setActiveTab={setActiveTab}
                  language={language}
                />
              )}

              {activeTab === 'about' && (
                <div className="max-w-3xl mx-auto space-y-6 text-left p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 uppercase">About SariRemit</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    SariRemit is a community-driven, crowd-sourced remittance monitoring and analysis platform built for expatriates and migrant workers in the Kingdom of Saudi Arabia.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    By pulling live, verified rates from major financial channels—such as STC Pay, UrPay, Enjaz, QuickPay, and Al Rajhi Tahweel—we empower you to identify the most competitive exchange rate terms and fee options to make every Saudi Riyal go the maximum distance for your family back home.
                  </p>
                </div>
              )}

              {activeTab === 'how-it-works' && (
                <div className="max-w-3xl mx-auto space-y-6 text-left p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 uppercase">
                    {language === 'en' ? 'How It Works' : 'كيف يعمل ساري ريميت'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-850 font-bold flex items-center justify-center shrink-0">1</div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {language === 'en' ? 'Compare Live Rates' : 'قارن الأسعار المباشرة'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {language === 'en' 
                            ? "We aggregate exchange rates and fees across Saudi's most popular digital wallets and money counters daily." 
                            : "نحن نجمع أسعار الصرف والرسوم اليومية لأكثر المحافظ الرقمية شعبية في المملكة."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-850 font-bold flex items-center justify-center shrink-0">2</div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {language === 'en' ? "Understand What You'll Really Pay" : "افهم ما ستدفعه بالفعل"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {language === 'en' 
                            ? "Most channels make money on hidden exchange margins. We calculate the exact, finalized recipient amount so you know the real winner." 
                            : "معظم قنوات التحويل تحقق أرباحاً خفية من فروق أسعار الصرف. نحن نحسب المبلغ النهائي المستلم بدقة لتعرف الخيار الأفضل لك."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-850 font-bold flex items-center justify-center shrink-0">3</div>
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {language === 'en' ? 'Contribute & Trust' : 'شارك واكسب الثقة'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {language === 'en' 
                            ? "Our rates are verified using daily crowd-sourced screenshot uploads, audited by community verifiers to guarantee absolute accuracy." 
                            : "يتم تأكيد أسعارنا يومياً من خلال لقطات الشاشة المرفوعة من المغتربين، وتدقيقها لضمان الدقة الكاملة."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'profile' || activeTab === 'sign-in' || activeTab === 'sign-up') && (
                <UserProfile
                  language={language}
                  t={t}
                  profile={profile}
                  setProfile={(updatedProfile) => {
                    setProfile(updatedProfile);
                    triggerToast(language === 'en' ? "Profile settings updated!" : "تم تحديث إعدادات الملف الشخصي!");
                  }}
                  onSessionSync={syncProfileWithSession}
                  initialAuthTab={activeTab === 'sign-up' ? 'signup' : 'signin'}
                />
              )}

              {/* Guarded/Authenticated Views */}
              {!isLoggedIn && ['dashboard', 'compare', 'submit', 'savings', 'insights', 'alerts', 'srcmc', 'support'].includes(activeTab) && (
                <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-xl space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {language === 'en' ? 'Sign in to unlock full features' : 'سجل الدخول لفتح جميع الميزات'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {language === 'en' 
                      ? "Create an account or sign in to access SariRemit's full suite of comparison analytics, verified rates, confidence scores, custom alerts, and savings tracking." 
                      : "أنشئ حساباً أو سجل الدخول للوصول إلى مجموعة ساري ريميت الكاملة من تحليلات المقارنة والأسعار المؤكدة، ودرجات الثقة، والتنبيهات المخصصة، وتتبع الوفر."}
                  </p>
                  <button
                    onClick={() => setActiveTab('sign-in')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Go to Sign In / Sign Up
                  </button>
                </div>
              )}

              {isLoggedIn && (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard
                      language={language}
                      t={t}
                      profile={profile}
                      setActiveTab={setActiveTab}
                      setQuickSearch={setQuickSearch}
                    />
                  )}

                  {activeTab === 'compare' && (
                    <CompareRates
                      language={language}
                      t={t}
                      quickSearch={quickSearch}
                      setQuickSearch={setQuickSearch}
                      setActiveTab={setActiveTab}
                    />
                  )}

                  {activeTab === 'submit' && (
                    <SubmitRate
                      language={language}
                      t={t}
                      onSubmissionSuccess={() => {
                        triggerToast(
                          language === 'en' 
                            ? "Rate contributed successfully! Verifying..." 
                            : "تمت إضافة مشاركتك! جاري التحقق..."
                        );
                      }}
                    />
                  )}

                  {activeTab === 'savings' && (
                    <Savings
                      language={language}
                      t={t}
                      profile={profile}
                    />
                  )}

                  {activeTab === 'insights' && (
                    <CorridorInsights
                      language={language}
                      t={t}
                    />
                  )}

                  {activeTab === 'alerts' && (
                    <Alerts
                      language={language}
                      t={t}
                      onAlertCreated={() => {
                        triggerToast(
                          language === 'en' 
                            ? "Live rate alert set successfully!" 
                            : "تم تعيين تنبيه الأسعار بنجاح!"
                        );
                      }}
                    />
                  )}

                  {activeTab === 'srcmc' && (
                    srcmcAccessLoading ? (
                      <div className="min-h-[400px] flex flex-col items-center justify-center font-sans">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2 text-sds-text-sec font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-sds-secondary animate-ping" />
                            Loading SRCMC Access Configuration...
                          </div>
                        </div>
                      </div>
                    ) : srcmcAccess?.is_active ? (
                      <SrcmcControl
                        language={language}
                        t={t}
                        profile={profile}
                        onSessionSync={syncProfileWithSession}
                        srcmcAccess={srcmcAccess}
                      />
                    ) : (
                      <div className="text-center py-12 text-rose-400 font-bold uppercase tracking-wider font-mono">
                        Access Denied.
                      </div>
                    )
                  )}

                  {activeTab === 'support' && (
                    <SupportHistory
                      language={language}
                      t={t}
                      onBack={() => setActiveTab('dashboard')}
                    />
                  )}
                </>
              )}
            </>
          )}

        </div>
      </main>

      {/* Toast Notification HUD */}
      {showToast && (
        <div className={`fixed bottom-20 md:bottom-6 z-50 max-w-sm w-full mx-auto px-4 transition-all duration-300 ${
          isRtl ? 'left-0 sm:left-6' : 'right-0 sm:right-6'
        }`}>
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 shadow-2xl shadow-emerald-950/20 flex items-center gap-3 animate-bounce">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold font-mono tracking-wide text-emerald-400 uppercase">SariRemit System</p>
              <p className="text-xs text-slate-200 font-medium mt-0.5">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Structured Footer */}
      <footer className="bg-[#04111F] border-t border-slate-800 text-slate-300 py-16 px-4 pb-28 md:pb-16 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: SariRemit */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              SariRemit
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => handleFooterScroll('about')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'عن المنصة' : 'About'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFooterScroll('about')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'رسالتنا وهدفنا' : 'Mission'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFooterScroll('how-it-works')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'كيف يعمل' : 'How It Works'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFooterScroll('contact')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'اتصل بنا' : 'Contact'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {isRtl ? 'المنصة والخدمات' : 'Platform'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => setActiveTab(isLoggedIn ? 'compare' : 'sign-in')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'مقارنة الأسعار' : 'Compare Rates'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab(isLoggedIn ? 'savings' : 'sign-in')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'تتبع المدخرات' : 'Track Savings'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab(isLoggedIn ? 'submit' : 'sign-in')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'توثيق الحوالات' : 'Verify a Transfer'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab(isLoggedIn ? 'profile' : 'sign-in')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              {isRtl ? 'الثقة والقانونية' : 'Trust & Legal'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => setActiveTab('privacy-policy')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('terms-of-use')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'شروط الاستخدام' : 'Terms of Use'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('disclaimer')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'إخلاء المسؤولية' : 'Disclaimer'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('community-verification-policy')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'سياسة التحقق المجتمعي' : 'Community Verification Policy'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveTab('rate-update-policy')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'سياسة تحديث الأسعار' : 'Rate Update Policy'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {isRtl ? 'الدعم والمساعدة' : 'Support'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => handleFooterScroll('faq')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'مركز المساعدة' : 'Help Centre'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFooterScroll('contact')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'الإبلاغ عن مشكلة' : 'Report an Issue'}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFooterScroll('contact')}
                  className="hover:text-amber-400 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'دعم العملاء' : 'Contact Support'}
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright and legal disclaimer notes */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="text-xs font-mono text-slate-400">
            © {new Date().getFullYear()} SariRemit. All rights reserved.
          </div>
          <div className="text-[10px] text-slate-500 md:text-right leading-relaxed font-mono">
            ⚠️ {isRtl 
              ? 'ساري ريميت يقدم تحليلات تحويلات ومقارنة أسعار الصرف. المنصة مستقلة ولا تقوم بمعالجة أو الاحتفاظ بأموال العملاء.' 
              : 'SariRemit provides remittance intelligence and comparison information. It does not process or hold customer funds.'}
          </div>
        </div>
      </footer>

    </div>
  );
}
