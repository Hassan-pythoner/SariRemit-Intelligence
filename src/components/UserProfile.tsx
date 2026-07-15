import React, { useState, useEffect } from 'react';
import { TranslationDict, UserProfile as UserProfileType, RateSubmission, UserProgress, UserAchievement } from '../types';
import { CORRIDORS } from '../services/ratesService';
import { 
  getAuthSession, signInWithSupabase, signUpWithSupabase, 
  signOutSession, updateUserProfileInDb, fetchCommunitySubmissions,
  fetchUserProgress, fetchUserAchievements, ACHIEVEMENT_DEFINITIONS,
  signInWithGoogle
} from '../services/supabaseService';
import { 
  User, Mail, Phone, Globe, Shield, Trophy, MapPin, 
  Clock, CheckCircle, Clock3, AlertTriangle, Save, LogIn, UserPlus, LogOut, Loader2, Bell, X
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';
import { SariRemitLogo, SariRemitMonogram, ProviderLogo, CountryFlag, AchievementIcon } from './SdsBamComponents';

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
  const [authPassword, setAuthPassword] = useState<string>(''); // No pre-filled credentials for safety
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authCorridor, setAuthCorridor] = useState<string>('sa-pk');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // Profile preferences inputs
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [phone, setPhone] = useState<string>(profile.phone);
  const [preferredCorridorId, setPreferredCorridorId] = useState<string>(profile.preferredCorridorId);
  const [userLanguage, setUserLanguage] = useState<'en' | 'ar'>(profile.language);
  
  const [engagementEnabled, setEngagementEnabled] = useState<boolean>(profile.engagement_notifications_enabled !== false);
  const [achievementEnabled, setAchievementEnabled] = useState<boolean>(profile.achievement_notifications_enabled !== false);
  const [rateEnabled, setRateEnabled] = useState<boolean>(profile.rate_notifications_enabled !== false);
  const [transferEnabled, setTransferEnabled] = useState<boolean>(profile.transfer_notifications_enabled !== false);
  const [communityEnabled, setCommunityEnabled] = useState<boolean>(profile.community_notifications_enabled !== false);
  const [securityEnabled, setSecurityEnabled] = useState<boolean>(true);
  const [adminEnabled, setAdminEnabled] = useState<boolean>(profile.admin_notifications_enabled !== false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(!!profile.push_notifications_enabled);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(!!profile.email_notifications_enabled);
  
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mySubmissions, setMySubmissions] = useState<RateSubmission[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  // Load user progress and achievements
  useEffect(() => {
    const activeSession = getAuthSession();
    if (activeSession.user) {
      fetchUserProgress(activeSession.user.id)
        .then(progress => setUserProgress(progress))
        .catch(err => console.error('[UserProfile] Failed to load user progress:', err));

      fetchUserAchievements(activeSession.user.id)
        .then(ach => setUserAchievements(ach))
        .catch(err => console.error('[UserProfile] Failed to load achievements:', err));
    } else {
      setUserProgress(null);
      setUserAchievements([]);
    }
  }, [isAuthenticated, success]);

  // Keep preference inputs in sync with session updates
  useEffect(() => {
    const activeSession = getAuthSession();
    if (activeSession.user) {
      setName(activeSession.user.name);
      setEmail(activeSession.user.email);
      setPhone(activeSession.user.phone);
      setPreferredCorridorId(activeSession.user.preferredCorridorId);
      setUserLanguage(activeSession.user.language || 'en');
      setEngagementEnabled(activeSession.user.engagement_notifications_enabled !== false);
      setAchievementEnabled(activeSession.user.achievement_notifications_enabled !== false);
      setRateEnabled(activeSession.user.rate_notifications_enabled !== false);
      setTransferEnabled(activeSession.user.transfer_notifications_enabled !== false);
      setCommunityEnabled(activeSession.user.community_notifications_enabled !== false);
      setSecurityEnabled(true);
      setAdminEnabled(activeSession.user.admin_notifications_enabled !== false);
      setPushEnabled(!!activeSession.user.push_notifications_enabled);
      setEmailEnabled(!!activeSession.user.email_notifications_enabled);
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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed');
      setIsLoading(false);
    }
  };

  // Handle Authentication submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail) {
      setAuthError(isRtl ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email address');
      return;
    }
    if (!authPassword) {
      setAuthError(isRtl ? 'الرجاء إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithSupabase(authEmail, authPassword);
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
    if (!authPassword) {
      setAuthError(isRtl ? 'الرجاء إدخال كلمة المرور المطلوبة' : 'Please choose a password');
      return;
    }

    if (!privacyAccepted) {
      setAuthError(isRtl ? 'الرجاء قراءة وقبول سياسة الخصوصية للمتابعة' : 'Please read and accept the Privacy Policy to proceed');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithSupabase(
        authEmail, 
        authName, 
        authPhone, 
        authCorridor, 
        authPassword, 
        'v1.2', 
        new Date().toISOString()
      );
      if (res.confirmationRequired) {
        setAuthSuccess(isRtl ? 'Check your email to confirm your account.' : 'Check your email to confirm your account.');
      } else if (res.session && res.session.user) {
        setAuthSuccess(isRtl ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully! Welcome to SariRemit.');
        setProfile({
          name: res.session.user.name,
          email: res.session.user.email,
          phone: res.session.user.phone,
          preferredCorridorId: res.session.user.preferredCorridorId,
          language: res.session.user.language,
          onboarding_completed: res.session.user.onboarding_completed,
          primary_destination_country: res.session.user.primary_destination_country,
          primary_destination_currency: res.session.user.primary_destination_currency,
          preferred_channels: res.session.user.preferred_channels,
          estimated_monthly_send_amount: res.session.user.estimated_monthly_send_amount,
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
          engagement_notifications_enabled: engagementEnabled,
          achievement_notifications_enabled: achievementEnabled,
          rate_notifications_enabled: rateEnabled,
          transfer_notifications_enabled: transferEnabled,
          community_notifications_enabled: communityEnabled,
          security_notifications_enabled: true,
          admin_notifications_enabled: adminEnabled,
          push_notifications_enabled: pushEnabled,
          email_notifications_enabled: emailEnabled,
        };
        await updateUserProfileInDb(updatedProfile);
        setProfile({
          ...profile,
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
          engagement_notifications_enabled: engagementEnabled,
          achievement_notifications_enabled: achievementEnabled,
          rate_notifications_enabled: rateEnabled,
          transfer_notifications_enabled: transferEnabled,
          community_notifications_enabled: communityEnabled,
          security_notifications_enabled: true,
          admin_notifications_enabled: adminEnabled,
          push_notifications_enabled: pushEnabled,
          email_notifications_enabled: emailEnabled,
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
              <SariRemitMonogram surface="dark" size="md" />
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
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 disabled:opacity-55 text-slate-900 font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm border border-slate-200 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.117C18.29 1.156 15.54 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.81 11.57-11.79 0-.79-.085-1.39-.193-1.925H12.24z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-sds-border/40" />
                  </div>
                  <span className="relative bg-[#0C2547] px-3 text-[9px] font-black text-sds-text-sec uppercase tracking-widest font-mono">or</span>
                </div>

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
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Password
                    </label>
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
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 disabled:opacity-55 text-slate-900 font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-sm border border-slate-200 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.117C18.29 1.156 15.54 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.81 11.57-11.79 0-.79-.085-1.39-.193-1.925H12.24z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-sds-border/40" />
                  </div>
                  <span className="relative bg-[#0C2547] px-3 text-[9px] font-black text-sds-text-sec uppercase tracking-widest font-mono">or</span>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
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
                      Password
                    </label>
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

                  <div className="flex items-start gap-2.5 pt-1 pb-1">
                    <input
                      id="privacy-accept-checkbox"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-sds-border bg-[#071A35] text-[#10B981] focus:ring-[#10B981] mt-0.5 cursor-pointer accent-[#10B981]"
                    />
                    <label htmlFor="privacy-accept-checkbox" className="text-[11px] leading-tight font-bold text-sds-text-sec cursor-pointer select-none">
                      {isRtl ? (
                        <>
                          أوافق وأقر بأنني قد قرأت وفهمت{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-[#10B981] hover:underline focus:outline-none font-black"
                          >
                            سياسة الخصوصية الخاصة بساري ريميت (المتوافقة مع نظام حماية البيانات السعودي PDPL)
                          </button>
                        </>
                      ) : (
                        <>
                          I have read and agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-[#10B981] hover:underline focus:outline-none font-black inline"
                          >
                            SariRemit Privacy Policy (Saudi PDPL Compliant)
                          </button>
                        </>
                      )}
                    </label>
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
              </div>
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

              {/* Notification Preferences Section */}
              <div className="space-y-4 border-t border-sds-border/60 pt-6 text-left">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#10B981]" />
                  <h4 className="text-[11px] font-black text-white uppercase tracking-wider font-mono">
                    Notification Preferences
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Engagement Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={engagementEnabled}
                      onChange={(e) => setEngagementEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Engagement Notifications</span>
                      <span className="text-[10px] text-sds-text-sec block">General tips, updates, and experience feedback.</span>
                    </div>
                  </label>

                  {/* Rate Alerts */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={rateEnabled}
                      onChange={(e) => setRateEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Rate & Provider Alerts</span>
                      <span className="text-[10px] text-sds-text-sec block">Alerts for target rates and recommendation improvements.</span>
                    </div>
                  </label>

                  {/* Transfer Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={transferEnabled}
                      onChange={(e) => setTransferEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Transfer Notifications</span>
                      <span className="text-[10px] text-sds-text-sec block">Confirmations when transfer records and savings are saved.</span>
                    </div>
                  </label>

                  {/* Achievement Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={achievementEnabled}
                      onChange={(e) => setAchievementEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Achievements & Milestones</span>
                      <span className="text-[10px] text-sds-text-sec block">Notifications for new levels, badges, and milestones.</span>
                    </div>
                  </label>

                  {/* Community Submissions */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={communityEnabled}
                      onChange={(e) => setCommunityEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Community Verification</span>
                      <span className="text-[10px] text-sds-text-sec block">Updates on your submitted rate evidence reviews.</span>
                    </div>
                  </label>

                  {/* Security Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/30 rounded-xl border border-sds-border/30 select-none opacity-85">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-1 w-4 h-4 rounded text-[#10B981]/50 bg-[#0C2547] border-sds-border cursor-not-allowed"
                    />
                    <div className="space-y-0.5 flex-1">
                      <span className="text-xs font-black text-white flex items-center justify-between gap-1.5 w-full">
                        <span>Security Alerts</span>
                        <Shield className="w-3.5 h-3.5 text-[#F59E0B]" />
                      </span>
                      <span className="text-[10px] text-[#F59E0B] font-mono block font-bold">Required for account safety.</span>
                    </div>
                  </label>

                  {/* Push Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Push Notifications</span>
                      <span className="text-[10px] text-sds-text-sec block">Send instant notifications directly to this browser.</span>
                    </div>
                  </label>

                  {/* Email Notifications */}
                  <label className="flex items-start gap-3 p-3 bg-[#071A35]/60 hover:bg-[#071A35] rounded-xl border border-sds-border/60 cursor-pointer select-none transition-all">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#10B981] bg-[#0C2547] border-sds-border focus:ring-[#10B981] cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Email Notifications</span>
                      <span className="text-[10px] text-sds-text-sec block">Send daily or weekly summary digests to your email.</span>
                    </div>
                  </label>
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
            
            {/* Dynamic Level & Progress Card */}
            <div className="bg-gradient-to-br from-[#0C2547] to-[#071A35] text-white p-6 rounded-3xl shadow-sds-md space-y-4 border border-sds-border relative overflow-hidden text-left animate-fadeIn">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/20 shrink-0 shadow-inner">
                  <Trophy className="w-7 h-7" />
                </div>
                <div className="text-left flex-1">
                  <span className="text-[9px] bg-[#10B981]/15 text-[#10B981] font-black tracking-widest px-2 py-0.5 rounded-md uppercase font-mono border border-[#10B981]/10">
                    {userProgress?.currentLevel || (approvedCount >= 3 ? 'Elite Contributor' : 'Active Contributor')}
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="text-sm font-black uppercase tracking-wide">
                      {userProgress?.currentLevel ? `Level: ${userProgress.currentLevel}` : (approvedCount >= 3 ? 'SariRemit Champion' : 'Verified Expat')}
                    </h3>
                    <span className="text-xs font-bold text-sds-text-sec font-mono">
                      {userProgress?.progressPoints || 0} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {userProgress && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-sds-text-sec uppercase font-mono">
                    <span>Next Rank Milestone</span>
                    <span>{userProgress.progressPoints % 100}/100 XP</span>
                  </div>
                  <div className="w-full bg-[#071A35] rounded-full h-2 overflow-hidden border border-sds-border/40">
                    <div 
                      className="bg-[#10B981] h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.min(100, userProgress.progressPoints % 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-sds-border/60 text-left font-mono">
                <div>
                  <span className="text-[9px] text-sds-text-sec block uppercase font-sans tracking-wider font-bold">Transfers</span>
                  <span className="text-base font-black text-white">
                    {userProgress ? userProgress.recordedTransferCount : 0}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-sds-text-sec block uppercase font-sans tracking-wider font-bold">Contributions</span>
                  <span className="text-base font-black text-white">
                    {userProgress ? userProgress.approvedRateContributionCount : approvedCount}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-sds-text-sec block uppercase font-sans tracking-wider font-bold">Savings (SAR)</span>
                  <span className="text-base font-black text-[#10B981]">
                    +{userProgress ? Math.round(userProgress.lifetimeEstimatedSavingsSar) : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Remittance Badge Grid */}
            <div className="bg-[#0C2547] p-5 rounded-3xl border border-sds-border shadow-sds-md space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-sds-border/60 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                  SariRemit Badges
                </h3>
                <span className="text-[10px] font-bold text-[#F59E0B] font-mono">
                  {userAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {ACHIEVEMENT_DEFINITIONS.map(def => {
                  const isUnlocked = userAchievements.some(a => a.achievementId === def.id);
                  return (
                    <div 
                      key={def.id} 
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center text-center space-y-1.5 ${isUnlocked ? 'bg-[#071A35] border-[#F59E0B]/30' : 'bg-[#071A35]/40 border-sds-border/40 opacity-50'}`}
                      title={def.description}
                    >
                      <div className="shrink-0 flex items-center justify-center">
                        <AchievementIcon achievement={def} size="sm" className={isUnlocked ? '' : 'grayscale opacity-60'} />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-extrabold line-clamp-1 leading-tight ${isUnlocked ? 'text-white' : 'text-sds-text-sec'}`}>
                          {def.title}
                        </span>
                        <span className="text-[8px] text-sds-text-sec leading-none block line-clamp-2">
                          {def.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                          <CountryFlag country={corr.toCountry} currency={corr.currencyCode} size="xs" />
                          <ProviderLogo channel={{ providerCode: sub.providerId, displayName: sub.providerName }} size="xs" shape="circle" />
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

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0C2547] border border-sds-border w-full max-w-2xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#071A35] border-b border-sds-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider font-mono">
                  {isRtl ? 'سياسة الخصوصية لساري ريميت (متوافقة مع نظام حماية البيانات PDPL)' : 'SariRemit Privacy Policy (PDPL Compliant)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 rounded-lg bg-[#0C2547] hover:bg-[#071A35] border border-sds-border/40 text-sds-text-sec hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-sds-text-sec text-left leading-relaxed">
              <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl text-emerald-300 font-semibold leading-normal">
                {isRtl ? 
                  'سياسة الخصوصية هذه مخصصة لمنصة ساري ريميت ومتوافقة تماماً مع نظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية. تصف السياسة كيفية جمع بياناتك، ومعالجتها، وحمايتها عند استخدام المنصة.' :
                  'This Privacy Policy has been written specifically for SariRemit and is fully aligned with the Saudi Personal Data Protection Law (PDPL) issued by Royal Decree No. (M/19). It describes how we collect, process, and safeguard your personal information.'
                }
              </div>

              <div className="space-y-4">
                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">1. Introduction</h4>
                  <p>SariRemit helps expatriates compare different remittance channels, estimate transaction savings, and make informed choices. Protecting your data and respecting your privacy is one of our absolute core principles.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">2. Information We Collect</h4>
                  <p>We collect Account Information (name, email, phone, credentials), Profile Information (preferences, saved corridors), Transfer Records (estimated savings, transfer dates), Community Submissions (voluntary screenshots, exchange rates), Support requests, and technical details (cookies, session logs).</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">3. Why We Collect Information</h4>
                  <p>Data is used to securely register and authenticate you, allow corridor comparisons, calculate estimated savings, verify community rate submissions, prevent rate seeding fraud, distribute notifications, and respond to support requests.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">4. Legal Basis for Processing</h4>
                  <p>Under KSA PDPL, we process data based on: your active consent when registering, performance of the remittance comparative analysis service, our legitimate interest in securing the system and verifying rates, and compliance with local legal requirements.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">5. How We Protect Information (SAF)</h4>
                  <p>We apply the SariRemit Security & Audit Framework (SAF) which uses TLS/SSL data encryption, Row Level Security (RLS) to keep your personal records private, strict administrative audit logs, anti-fraud screenshot controls, and secure tokenized authentication.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">6. Who Can Access Your Data</h4>
                  <p>Only you have access to your private profile. Verified SRCMC administrators can access submissions and support tickets strictly to perform reviews or fix issues. Individual records are completely shielded from public view; only fully anonymized rates are published.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">7. Third Party Services</h4>
                  <p>We use Supabase for hosting our database, storing screenshots, and providing authentication. All third parties must maintain equal compliance with Saudi security baselines.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">8. Cookies</h4>
                  <p>Essential session cookies are used to keep you authenticated and remember your language preference (English/Arabic).</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">9. Data Retention</h4>
                  <p>We retain active accounts while they are in use. If deleted, all associated personal records are purged or anonymized. Verification screenshots are destroyed immediately after rate audits complete.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">10. Your Rights Under KSA PDPL</h4>
                  <p>You have powerful rights: the right to know and access your records, correct inaccuracies immediately, destroy/delete your records, export your transfer logs to an electronic file, and withdraw consent anytime.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">11. Children's Privacy</h4>
                  <p>SariRemit does not knowingly collect personal information from individuals under the legal age of majority in Saudi Arabia.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">12. International Users</h4>
                  <p>We operate inside Saudi Arabia to serve local expatriate residents. Any cloud backups or processing conform strictly to PDPL guidelines.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">13. Policy Updates</h4>
                  <p>We notify users of policy changes. Continued use represents agreement to any updated terms.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">14. Contact Compliance Desk</h4>
                  <p>Reach out to us at <span className="text-[#10B981] font-bold">support@sariremit.com</span> for any compliance or privacy queries.</p>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#071A35] border-t border-sds-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0C2547] hover:bg-[#071A35] text-sds-text-sec text-xs font-bold transition-all border border-sds-border/40 cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrivacyAccepted(true);
                  setShowPrivacyModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-[#071A35] text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isRtl ? 'أوافق وأغلق' : 'Accept & Close'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
