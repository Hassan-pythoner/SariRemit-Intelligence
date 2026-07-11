import React, { useState, useEffect } from 'react';
import { TranslationDict, UserProfile as UserProfileType, RateSubmission } from '../types';
import { CORRIDORS } from '../services/ratesService';
import { 
  getAuthSession, signInWithSupabase, signUpWithSupabase, 
  signOutSession, updateUserProfileInDb, fetchCommunitySubmissions 
} from '../services/supabaseService';
import { 
  User, Mail, Phone, Globe, Shield, Trophy, MapPin, 
  Clock, CheckCircle, Clock3, AlertTriangle, Save, LogIn, UserPlus, LogOut, Loader2 
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';

interface UserProfileProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfileType;
  setProfile: (profile: UserProfileType) => void;
  onSessionSync: () => void;
  initialAuthTab?: 'signin' | 'signup';
}

export default function UserProfile({
  language,
  t,
  profile,
  setProfile,
  onSessionSync,
  initialAuthTab,
}: UserProfileProps) {
  const isRtl = language === 'ar';

  const session = getAuthSession();
  const isAuthenticated = session.user !== null;

  // Authentication inputs
  const [activeAuthTab, setActiveAuthTab] = useState<'signin' | 'signup'>(initialAuthTab || 'signin');

  useEffect(() => {
    if (initialAuthTab) {
      setActiveAuthTab(initialAuthTab);
    }
  }, [initialAuthTab]);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('password123'); // Pre-filled demo credentials
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authCorridor, setAuthCorridor] = useState<string>('sa-pk');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Profile preferences inputs
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [phone, setPhone] = useState<string>(profile.phone);
  const [preferredCorridorId, setPreferredCorridorId] = useState<string>(profile.preferredCorridorId);
  const [userLanguage, setUserLanguage] = useState<'en' | 'ar'>(profile.language);
  
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mySubmissions, setMySubmissions] = useState<RateSubmission[]>([]);

  // Keep preference inputs in sync with session updates
  useEffect(() => {
    const activeSession = getAuthSession();
    if (activeSession.user) {
      setName(activeSession.user.name);
      setEmail(activeSession.user.email);
      setPhone(activeSession.user.phone);
      setPreferredCorridorId(activeSession.user.preferredCorridorId);
      setUserLanguage(activeSession.user.language || 'en');
    }
  }, [isAuthenticated]);

  // Load user-specific rate contributions
  useEffect(() => {
    const activeSession = getAuthSession();
    if (activeSession.user) {
      fetchCommunitySubmissions()
        .then((allSubmissions) => {
          // Filter submissions by current user's email or initial mock submissions
          const filtered: RateSubmission[] = allSubmissions
            .filter(
              s => s.submitted_by_email?.toLowerCase() === activeSession.user?.email.toLowerCase() ||
                   s.id?.startsWith('sub-init') // Show initial mock submissions too for visual completeness
            )
            .map(s => ({
              id: s.id,
              providerId: s.provider_id,
              providerName: s.provider_name,
              corridorId: s.corridor_id,
              exchangeRate: s.exchange_rate,
              transferFee: s.transfer_fee,
              sendAmount: s.send_amount,
              receiveAmount: s.receive_amount,
              submittedByEmail: s.submitted_by_email,
              submittedAt: s.submitted_at,
              screenshotName: s.screenshot_name,
              status: s.status
            }));
          setMySubmissions(filtered);
        })
        .catch((err) => {
          console.error("Failed to load community submissions for profile page:", err);
        });
    } else {
      setMySubmissions([]);
    }
  }, [success, isAuthenticated]);

  // Handle Authentication submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail) {
      setAuthError(isRtl ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithSupabase(authEmail);
      if (res.user) {
        setAuthSuccess(isRtl ? 'تم تسجيل الدخول بنجاح!' : 'Authenticated successfully! Welcome back.');
        setProfile({
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          preferredCorridorId: res.user.preferredCorridorId,
          language: res.user.language,
          onboarding_completed: res.user.onboarding_completed,
          primary_destination_country: res.user.primary_destination_country,
          primary_destination_currency: res.user.primary_destination_currency,
          preferred_channels: res.user.preferred_channels,
          estimated_monthly_send_amount: res.user.estimated_monthly_send_amount,
        });
        onSessionSync();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail || !authName || !authPhone) {
      setAuthError(isRtl ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithSupabase(authEmail, authName, authPhone, authCorridor);
      if (res.user) {
        setAuthSuccess(isRtl ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully! Welcome to SariRemit.');
        setProfile({
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          preferredCorridorId: res.user.preferredCorridorId,
          language: res.user.language,
          onboarding_completed: res.user.onboarding_completed,
          primary_destination_country: res.user.primary_destination_country,
          primary_destination_currency: res.user.primary_destination_currency,
          preferred_channels: res.user.preferred_channels,
          estimated_monthly_send_amount: res.user.estimated_monthly_send_amount,
        });
        onSessionSync();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setIsLoading(true);

    try {
      const activeSession = getAuthSession();
      if (activeSession.user) {
        const updatedProfile = {
          id: activeSession.user.id,
          name,
          phone,
          preferredCorridorId,
          language: userLanguage,
          email: activeSession.user.email,
          onboarding_completed: profile.onboarding_completed,
          primary_destination_country: profile.primary_destination_country,
          primary_destination_currency: profile.primary_destination_currency,
          preferred_channels: profile.preferred_channels,
          estimated_monthly_send_amount: profile.estimated_monthly_send_amount,
        };
        await updateUserProfileInDb(updatedProfile);
        setProfile({
          name,
          email: activeSession.user.email,
          phone,
          preferredCorridorId,
          language: userLanguage,
          onboarding_completed: profile.onboarding_completed,
          primary_destination_country: profile.primary_destination_country,
          primary_destination_currency: profile.primary_destination_currency,
          preferred_channels: profile.preferred_channels,
          estimated_monthly_send_amount: profile.estimated_monthly_send_amount,
        });
        onSessionSync();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutSession();
    // Reset inputs
    setAuthEmail('');
    setAuthName('');
    setAuthPhone('');
    setAuthSuccess('');
    setAuthError('');
    onSessionSync();
  };

  const approvedCount = mySubmissions.filter(s => s.status === 'approved').length;

  return (
    <div className={`space-y-6 pb-24 text-sds-text ${isRtl ? 'text-right' : 'text-left'} animate-fadeIn`}>
      
      {/* Page Header */}
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight flex items-center gap-2.5">
          <User className="w-7 h-7 text-[#10B981] shrink-0" />
          <span>{t.profile}</span>
        </h1>
        <p className="text-xs text-sds-text-sec max-w-2xl">
          {isAuthenticated 
            ? "Manage your personal details, default destination corridors, and view your verified crowd-sourced community contributions."
            : "Create an account or sign in to access SariRemit’s full features."
          }
        </p>
      </div>

      {!isAuthenticated ? (
        /* Authentication Section (Unauthenticated State) */
        <div className="max-w-4xl mx-auto bg-[#0C2547] border border-sds-border rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-sds-lg text-left">
          
          {/* Welcome Info Panel */}
          <div className="md:col-span-5 bg-[#071A35]/60 p-6 sm:p-8 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-sds-border relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center font-black text-xl shadow-md text-[#071A35] relative">
                S
                <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
              </div>
              <h3 className="text-sm font-black tracking-wider uppercase text-white font-mono">
                SariRemit Network
              </h3>
              <p className="text-xs text-sds-text-sec leading-relaxed">
                By joining our verified trust-based platform, your contributions safeguard thousands of expatriates across the Kingdom.
              </p>
            </div>

            <div className="pt-6 space-y-3.5 border-t border-sds-border/60 text-[11px] text-sds-text-sec">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Save default corridors for instant calculation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Submit rates and earn high-tier contributor reputation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Gain exclusive insights into hidden fee thresholds</span>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6 bg-[#0C2547]">
            
            {/* Form Mode Selector */}
            <div className="flex bg-[#071A35] p-1 rounded-xl border border-sds-border">
              <button
                type="button"
                onClick={() => { setActiveAuthTab('signin'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeAuthTab === 'signin' 
                    ? 'bg-[#10B981] text-[#071A35] shadow-sds-sm' 
                    : 'text-sds-text-sec hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveAuthTab('signup'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeAuthTab === 'signup' 
                    ? 'bg-[#10B981] text-[#071A35] shadow-sds-sm' 
                    : 'text-sds-text-sec hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Forms */}
            {activeAuthTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g., ahmed@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    />
                    <Mail className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Password (Preset)
                    </label>
                    <span className="text-[9px] text-[#F59E0B] font-mono font-bold uppercase">Demo: password123</span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    />
                    <Shield className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-55 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>Sign In to SariRemit</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4 text-left">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Ahmed Hassan"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    />
                    <User className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ahmed.hassan@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    />
                    <Mail className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Phone (KSA Mobile number)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                    />
                    <Phone className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Default Destination Country
                  </label>
                  <select
                    value={authCorridor}
                    onChange={(e) => setAuthCorridor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer"
                  >
                    {CORRIDORS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#071A35]">
                        {c.flag} {c.toCountry} ({c.currencyCode})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 disabled:opacity-55 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Register & Authenticate</span>
                </button>
              </form>
            )}

            <p className="text-[10px] text-sds-text-sec text-center leading-normal">
              By authenticating, you establish your secure profile recorded directly in the Supabase Cloud database.
            </p>
          </div>
        </div>
      ) : (
        /* Profile Management Panels (Authenticated State) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          
          {/* Left: Preferences Form (Col span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <form 
              onSubmit={handleSavePreferences}
              className="bg-[#0C2547] p-6 sm:p-8 rounded-3xl border border-sds-border shadow-sds-md space-y-6"
            >
              <div className="flex justify-between items-center border-b border-sds-border/60 pb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono">
                  Account Preferences
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20 text-[9px] font-mono font-black uppercase">
                  Connected to Supabase
                </span>
              </div>

              {success && (
                <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/25 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Your profile preferences have been updated in Supabase!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-colors"
                    />
                    <User className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Email (Read Only representation for safety) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Email Address (Account ID)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35]/40 border border-sds-border/60 rounded-xl font-bold text-sm text-sds-text-sec cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-sds-text-sec opacity-40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Phone Number (WhatsApp alerts)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 50 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-colors"
                    />
                    <Phone className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Preferred Destination */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                    Default Destination
                  </label>
                  <select
                    value={preferredCorridorId}
                    onChange={(e) => setPreferredCorridorId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer transition-colors"
                  >
                    {CORRIDORS.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#071A35]">
                        {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr} ({c.currencyCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                  Preferred App Language
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserLanguage('en')}
                    className={`py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      userLanguage === 'en'
                        ? 'border-[#10B981] bg-[#10B981]/10 text-white shadow-xs font-bold'
                        : 'border-sds-border text-sds-text-sec hover:border-[#10B981] hover:bg-[#071A35]/50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserLanguage('ar')}
                    className={`py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                      userLanguage === 'ar'
                        ? 'border-[#10B981] bg-[#10B981]/10 text-white shadow-xs font-bold'
                        : 'border-sds-border text-sds-text-sec hover:border-[#10B981] hover:bg-[#071A35]/50'
                    }`}
                  >
                    العربية (Arabic)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="profile-save-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#10B981] hover:bg-[#10B981]/90 disabled:bg-slate-500 text-[#071A35] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Save Preferences</span>
              </button>
            </form>

            {/* Logout Card */}
            <div className="bg-[#0C2547] p-5 rounded-3xl border border-sds-border flex items-center justify-between text-xs">
              <div className="text-left space-y-0.5">
                <p className="font-bold text-white uppercase text-[10px] tracking-wide font-mono">Switching accounts or logging off?</p>
                <p className="text-sds-text-sec text-[11px]">This clears your active browser session cache.</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/35 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Right: Contributor Profile Rank and Contribution History (Col span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Rank Badge Card */}
            <div className="bg-gradient-to-br from-[#0C2547] to-[#071A35] text-white p-6 rounded-3xl shadow-sds-md space-y-4 border border-sds-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20 shrink-0 shadow-inner">
                  <Trophy className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] font-black tracking-widest px-2 py-0.5 rounded-md uppercase font-mono border border-[#10B981]/10">
                    {approvedCount >= 3 ? 'Elite Contributor' : 'Active Contributor'}
                  </span>
                  <h3 className="text-sm font-black mt-1.5 uppercase tracking-wide">
                    {approvedCount >= 3 ? 'SariRemit Champion' : 'Verified Expat'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-sds-border/60 text-left font-mono">
                <div>
                  <span className="text-[10px] text-sds-text-sec block uppercase font-sans tracking-wider font-black">Verified Rates</span>
                  <span className="text-lg font-black text-white">{approvedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sds-text-sec block uppercase font-sans tracking-wider font-black">Remittance Impact</span>
                  <span className="text-lg font-black text-[#10B981]">+{Math.max(125, approvedCount * 125)} Expats</span>
                </div>
              </div>
              
              <p className="text-[11px] text-sds-text-sec leading-relaxed text-left">
                Your profile details form the basis of your trust score. Each verified rate you contribute helps fellow expats escape high-fee remittance traps.
              </p>
            </div>

            {/* Past Submissions list */}
            <div className="bg-[#0C2547] p-5 rounded-3xl border border-sds-border shadow-sds-md space-y-4 text-left">
              <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono border-b border-sds-border/60 pb-2">
                Your Contribution History
              </h3>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {mySubmissions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-sds-text-sec font-bold uppercase">
                    No submissions yet. Be the first to share today's rate!
                  </div>
                ) : (
                  mySubmissions.map((sub) => {
                    const corr = CORRIDORS.find(c => c.id === sub.corridorId) || CORRIDORS[0];
                    return (
                      <div key={sub.id} className="p-3 bg-[#071A35]/80 rounded-xl border border-sds-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{corr.flag}</span>
                          <div className="text-left">
                            <span className="font-extrabold text-white block leading-tight">
                              {sub.providerName}
                            </span>
                            <span className="text-[10px] text-sds-text-sec font-mono font-bold">
                              1 SAR = <span className="text-[#F59E0B]">{sub.exchangeRate}</span> {corr.currencyCode}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-1.5 font-mono font-bold">
                          {sub.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold text-[9px] flex items-center gap-1 border border-[#10B981]/25 uppercase">
                              <CheckCircle className="w-3 h-3" /> VERIFIED
                            </span>
                          ) : sub.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-bold text-[9px] flex items-center gap-1 border border-[#F59E0B]/25 uppercase animate-pulse">
                              <Clock3 className="w-3 h-3" /> PENDING
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold text-[9px] flex items-center gap-1 border border-red-500/25 uppercase">
                              <AlertTriangle className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
