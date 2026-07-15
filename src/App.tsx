/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { enTranslations, arTranslations } from './translations';
import { getUserProfile, saveUserProfile } from './services/ratesService';
import { getAuthSession, checkIsAdminSync, syncSupabaseToLocal } from './services/supabaseService';
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
import { Bell, Sparkles, CheckCircle2, MessageSquare, Landmark, Info } from 'lucide-react';

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
  const isLoggedIn = !!profile.email;

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

  const t: TranslationDict = language === 'en' ? enTranslations : arTranslations;
  const isRtl = language === 'ar';
  const isOnboardingRequired = isLoggedIn && !profile.onboarding_completed;

  if (appLoading || (isLoggedIn && srcmcAccessLoading)) {
    return (
      <div className="min-h-screen bg-sds-bg flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <SariRemitLogo variant="primary" size="xl" surface="dark" showSlogan={true} className="animate-pulse" />
          <div className="flex items-center gap-2 text-sds-text-sec font-mono text-xs font-bold uppercase tracking-widest mt-2">
            <div className="w-2 h-2 rounded-full bg-sds-secondary animate-ping" />
            Loading App Session & Access Control...
          </div>
        </div>
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
