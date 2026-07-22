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
  Clock, CheckCircle, Clock3, AlertTriangle, Save, LogIn, UserPlus, LogOut, Loader2, Bell, X, FileText, Sparkles,
  ChevronLeft, ChevronRight, Monitor, Smartphone, ArrowLeftRight, ShieldCheck, Key
} from 'lucide-react';
import { SDSButton, SDSCard, SDSBadge, SDSInput, SDSSelect } from './Sds';
import { SariRemitLogo, SariRemitMonogram, ProviderLogo, CountryFlag, AchievementIcon } from './SdsBamComponents';
import { useTheme } from '../context/ThemeContext';
import { 
  ProfileOverview, PersonalInformation, DefaultPreferences, 
  NotificationSettings, AppearanceSettings, LanguageSettings, 
  ContributionsList, AchievementsGrid, SecuritySettings, 
  ActiveSessions, PrivacyAndData 
} from './SettingsViews';

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
  const { preference, setPreference } = useTheme();

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
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

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

  // Sub-tab hash routing state and handlers
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const getSubTabFromHash = (hash: string): string => {
    if (hash === '#/account') return 'overview';
    if (hash === '#/account/profile') return 'personal-info';
    if (hash === '#/account/preferences') return 'preferences';
    if (hash === '#/account/activity') return 'activity';
    if (hash === '#/account/contributions') return 'contributions';
    if (hash === '#/account/achievements') return 'achievements';
    if (hash === '#/settings/notifications') return 'notifications';
    if (hash === '#/settings/appearance') return 'appearance';
    if (hash === '#/settings/language') return 'language';
    if (hash === '#/settings/security') return 'security';
    if (hash === '#/settings/sessions') return 'sessions';
    if (hash === '#/settings/privacy' || hash === '#/settings/data' || hash === '#/settings/delete-account') return 'privacy-data';
    return 'overview';
  };

  const [activeSubTab, setActiveSubTab] = useState<string>(getSubTabFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSubTab(getSubTabFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSubTabChange = (subtab: string) => {
    setActiveSubTab(subtab);
    const hashMap: Record<string, string> = {
      'overview': '#/account',
      'personal-info': '#/account/profile',
      'preferences': '#/account/preferences',
      'activity': '#/account/activity',
      'contributions': '#/account/contributions',
      'achievements': '#/account/achievements',
      'notifications': '#/settings/notifications',
      'appearance': '#/settings/appearance',
      'language': '#/settings/language',
      'security': '#/settings/security',
      'sessions': '#/settings/sessions',
      'privacy-data': '#/settings/privacy'
    };
    if (hashMap[subtab]) {
      window.location.hash = hashMap[subtab];
    }
  };

  const navGroups = [
    {
      titleEn: 'My Account',
      titleAr: 'حسابي',
      items: [
        { id: 'overview', labelEn: 'Profile Overview', labelAr: 'نظرة عامة', icon: User },
        { id: 'personal-info', labelEn: 'Personal Information', labelAr: 'المعلومات الشخصية', icon: FileText },
        { id: 'preferences', labelEn: 'Default Preferences', labelAr: 'التفضيلات الافتراضية', icon: ArrowLeftRight }
      ]
    },
    {
      titleEn: 'Activity & Community',
      titleAr: 'النشاط والمجتمع',
      items: [
        { id: 'contributions', labelEn: 'Contributions Log', labelAr: 'سجل المساهمات', icon: Globe },
        { id: 'achievements', labelEn: 'Earned Badges', labelAr: 'الشارات المكتسبة', icon: Trophy }
      ]
    },
    {
      titleEn: 'Preferences',
      titleAr: 'التفضيلات والمظهر',
      items: [
        { id: 'notifications', labelEn: 'Notification Controls', labelAr: 'إعدادات الإشعارات', icon: Bell },
        { id: 'appearance', labelEn: 'Appearance & Theme', labelAr: 'المظهر والسمة', icon: Sparkles },
        { id: 'language', labelEn: 'App Language', labelAr: 'لغة التطبيق', icon: Globe }
      ]
    },
    {
      titleEn: 'Security & Privacy',
      titleAr: 'الأمان والخصوصية',
      items: [
        { id: 'security', labelEn: 'Sign-in & Password', labelAr: 'تسجيل الدخول وكلمة المرور', icon: Key },
        { id: 'sessions', labelEn: 'Active Device Sessions', labelAr: 'الأجهزة النشطة', icon: Monitor },
        { id: 'privacy-data', labelEn: 'Privacy & Deletion', labelAr: 'الخصوصية وحذف الحساب', icon: ShieldCheck }
      ]
    }
  ];

  const renderActiveSubTab = () => {
    const subProps = {
      language,
      t,
      profile,
      setProfile,
      onSessionSync,
      mySubmissions,
      userProgress,
      userAchievements,
      name,
      setName,
      phone,
      setPhone,
      preferredCorridorId,
      setPreferredCorridorId,
      userLanguage,
      setUserLanguage,
      preference,
      setPreference,
      engagementEnabled,
      setEngagementEnabled,
      achievementEnabled,
      setAchievementEnabled,
      rateEnabled,
      setRateEnabled,
      transferEnabled,
      setTransferEnabled,
      communityEnabled,
      setCommunityEnabled,
      adminEnabled,
      setAdminEnabled,
      pushEnabled,
      setPushEnabled,
      emailEnabled,
      setEmailEnabled,
      onSave: handleSavePreferences,
      isLoading,
      success,
      triggerToast
    };

    switch (activeSubTab) {
      case 'overview':
        return <ProfileOverview {...subProps} />;
      case 'personal-info':
        return <PersonalInformation {...subProps} />;
      case 'preferences':
        return <DefaultPreferences {...subProps} />;
      case 'notifications':
        return <NotificationSettings {...subProps} />;
      case 'appearance':
        return <AppearanceSettings {...subProps} />;
      case 'language':
        return <LanguageSettings {...subProps} />;
      case 'contributions':
        return <ContributionsList {...subProps} />;
      case 'achievements':
        return <AchievementsGrid {...subProps} />;
      case 'security':
        return <SecuritySettings {...subProps} />;
      case 'sessions':
        return <ActiveSessions {...subProps} />;
      case 'privacy-data':
        return <PrivacyAndData {...subProps} />;
      default:
        return <ProfileOverview {...subProps} />;
    }
  };

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

    if (!termsAccepted) {
      setAuthError(isRtl ? 'الرجاء قراءة وقبول شروط الاستخدام للمتابعة' : 'Please read and agree to the Terms of Use to proceed');
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
        new Date().toISOString(),
        'v1.0',
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

  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        <div className="max-w-4xl mx-auto bg-sds-card border border-sds-border rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-sds-md text-left">
          
          {/* Welcome Info Panel */}
          <div className="md:col-span-5 bg-sds-bg-sec/60 p-6 sm:p-8 text-sds-text flex flex-col justify-between border-b md:border-b-0 md:border-r border-sds-border relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sds-success/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <SariRemitMonogram surface="dark" size="md" />
              <h3 className="text-sm font-black tracking-wider uppercase text-sds-text font-mono">
                SariRemit Network
              </h3>
              <p className="text-xs text-sds-text-sec leading-relaxed">
                By joining our verified trust-based platform, your contributions safeguard thousands of expatriates across the Kingdom.
              </p>
            </div>

            <div className="pt-6 space-y-3.5 border-t border-sds-border/60 text-[11px] text-sds-text-sec">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>Save default corridors for instant calculation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>Submit rates and earn high-tier contributor reputation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-sds-success shrink-0 mt-0.5" />
                <span>Gain exclusive insights into hidden fee thresholds</span>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="md:col-span-7 p-6 sm:p-8 space-y-6 bg-sds-card">
            
            {/* Form Mode Selector */}
            <div className="flex bg-sds-bg-sec p-1 rounded-xl border border-sds-border">
              <button
                type="button"
                onClick={() => { setActiveAuthTab('signin'); setAuthError(''); setAuthSuccess(''); }}
                className={`flex-1 py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeAuthTab === 'signin' 
                    ? 'bg-sds-primary text-white shadow-sds-sm' 
                    : 'text-sds-text-sec hover:text-sds-text'
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
                    ? 'bg-sds-primary text-white shadow-sds-sm' 
                    : 'text-sds-text-sec hover:text-sds-text'
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

                <p className="text-[10px] text-sds-text-sec text-center leading-normal mt-3">
                  {isRtl ? (
                    <>
                      من خلال تسجيل الدخول، فإنك تؤكد موافقتك على{" "}
                      <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#10B981] hover:underline font-bold">شروط الاستخدام</button>
                      {" "}و{" "}
                      <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#10B981] hover:underline font-bold">سياسة الخصوصية</button>.
                    </>
                  ) : (
                    <>
                      By signing in, you confirm your acceptance of the{" "}
                      <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#10B981] hover:underline font-bold">Terms of Use</button>
                      {" "}and{" "}
                      <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#10B981] hover:underline font-bold">Privacy Policy</button>.
                    </>
                  )}
                </p>
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

                  <div className="flex items-start gap-2.5 pt-1 pb-1">
                    <input
                      id="terms-accept-checkbox"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-sds-border bg-[#071A35] text-[#10B981] focus:ring-[#10B981] mt-0.5 cursor-pointer accent-[#10B981]"
                    />
                    <label htmlFor="terms-accept-checkbox" className="text-[11px] leading-tight font-bold text-sds-text-sec cursor-pointer select-none">
                      {isRtl ? (
                        <>
                          أوافق وألتزم بـ{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-[#10B981] hover:underline focus:outline-none font-black"
                          >
                            شروط الاستخدام الخاصة بساري ريميت (إطار الامتثال القانوني SLCF)
                          </button>
                        </>
                      ) : (
                        <>
                          I have read and agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-[#10B981] hover:underline focus:outline-none font-black inline"
                          >
                            SariRemit Terms of Use (SLCF Framework)
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
        <div className="relative text-left">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-20 right-4 z-50 p-4 bg-[#071A35]/95 border border-[#10B981]/35 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-white animate-slideIn">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span className="font-extrabold">{toastMessage}</span>
            </div>
          )}

          {/* Desktop Layout (hidden on mobile, shown on md and above) */}
          <div className="hidden md:grid grid-cols-12 gap-8 items-start">
            {/* Sidebar Navigation (Col span 4) */}
            <div className="col-span-4 bg-sds-card border border-sds-border rounded-3xl p-5 space-y-5 shadow-sds-sm animate-fadeIn">
              <div className="space-y-1 pb-3.5 border-b border-sds-border/50 text-left">
                <span className="text-[10px] text-sds-text-sec uppercase tracking-widest font-mono font-bold">Authenticated User</span>
                <h3 className="text-sm font-black text-sds-text truncate max-w-full leading-none mt-1">{profile.name || 'Expat User'}</h3>
                <span className="text-[10px] text-sds-text-sec truncate block">{profile.email}</span>
              </div>

              <div className="space-y-5">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1.5 text-left">
                    <h5 className="text-[9px] font-black uppercase tracking-widest text-sds-text-sec font-mono px-2.5">
                      {isRtl ? group.titleAr : group.titleEn}
                    </h5>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isSelected = activeSubTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSubTabChange(item.id)}
                            className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-sds-success/10 text-sds-success font-black' 
                                : 'text-sds-text-sec hover:bg-sds-bg-sec hover:text-sds-text'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{isRtl ? item.labelAr : item.labelEn}</span>
                            </div>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sds-success" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full mt-4 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out Account'}</span>
              </button>
            </div>

            {/* Content Display (Col span 8) */}
            <div className="col-span-8 bg-sds-card border border-sds-border rounded-3xl p-6 sm:p-8 shadow-sds-md min-h-[480px]">
              {renderActiveSubTab()}
            </div>
          </div>

          {/* Mobile Layout (shown on mobile, hidden on md and above) */}
          <div className="block md:hidden animate-fadeIn">
            {activeSubTab !== 'overview' ? (
              /* Mobile Sub-page view with Header Back button */
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => handleSubTabChange('overview')}
                  className="flex items-center gap-2 px-3 py-2 bg-[#071A35] border border-sds-border rounded-xl text-xs font-black uppercase tracking-wider font-mono text-[#10B981] hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>{isRtl ? '← العودة للحساب' : '← Back to Account'}</span>
                </button>
                <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-5 shadow-sds-md text-left animate-fadeIn">
                  {renderActiveSubTab()}
                </div>
              </div>
            ) : (
              /* Mobile Menu view */
              <div className="space-y-5">
                {/* Embedded Overview inside main mobile menu for beautiful rhythm */}
                {renderActiveSubTab()}

                <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-4 space-y-4 shadow-sds-md">
                  {navGroups.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5 text-left">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-sds-text-sec font-mono px-2">
                        {isRtl ? group.titleAr : group.titleEn}
                      </h5>
                      <div className="space-y-1">
                        {group.items.filter(item => item.id !== 'overview').map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSubTabChange(item.id)}
                              className="w-full px-3 py-3 bg-[#071A35]/30 hover:bg-[#071A35]/60 border border-sds-border/40 rounded-2xl flex items-center justify-between text-sds-text transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className="w-8 h-8 rounded-xl bg-[#071A35] border border-sds-border/60 flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-xs font-bold text-white truncate">{isRtl ? item.labelAr : item.labelEn}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-sds-text-sec shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out Account'}</span>
                  </button>
                </div>
              </div>
            )}
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

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0C2547] border border-sds-border w-full max-w-2xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#071A35] border-b border-sds-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider font-mono">
                  {isRtl ? 'شروط استخدام ساري ريميت (إطار الامتثال SLCF)' : 'SariRemit Terms of Use (SLCF Framework)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-lg bg-[#0C2547] hover:bg-[#071A35] border border-sds-border/40 text-sds-text-sec hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-sds-text-sec text-left leading-relaxed">
              <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-xl text-emerald-300 font-semibold leading-normal">
                {isRtl ? 
                  'شروط الاستخدام هذه مخصصة لمنصة ساري ريميت كإطار قانوني ملزم يحكم تصفحك ومشاركتك في المنصة في المملكة العربية السعودية. يرجى قراءتها بعناية.' :
                  'These Terms of Use govern your access to and participation on the SariRemit platform in the Kingdom of Saudi Arabia. They form a legally binding agreement under our Legal & Compliance Framework (SLCF).'
                }
              </div>

              <div className="space-y-4">
                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">1. What SariRemit Is (Our Purpose)</h4>
                  <p>SariRemit is an independent decision-support platform designed to aggregate, compare, and analyze remittance corridors (such as STC Pay, UrPay, Enjaz, etc.) to help expats identify optimal rates and track transaction savings.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider font-mono">2. WHAT SARIREMIT IS NOT (CRITICAL DISCLAIMER)</h4>
                  <p className="font-bold text-slate-200">SariRemit is NOT a financial institution, bank, or remittance company. We do not hold, receive, transfer, or process any money. All financial transfers must be executed independently by you through licensed providers in Saudi Arabia.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">3. User Account Security</h4>
                  <p>You agree to register with true personal information (name, email, phone) and protect your secure credentials. Multi-accounting, spoofing identities, or sharing accounts is strictly prohibited.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">4. Community Participation & Rate Verification (CRVS)</h4>
                  <p>When you submit rates, you represent that they are accurate and observed within the last 24 hours. To protect our community, rate submissions must be backed by genuine, unaltered screenshot evidence which is audited by SRCMC controllers.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider font-mono">5. Anti-Fraud & Screenshot Policy (SAF)</h4>
                  <p>SariRemit enforces a zero-tolerance policy against fake contributions, automated scraping, or rate manipulation. Falsifying receipt screenshots will result in immediate and permanent account termination, and registration of the offense in our Security & Audit Framework (SAF).</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">6. Intellectual Property & Brand Assets (BAM)</h4>
                  <p>All platform software, algorithms (SIC, RRE, SIS, TCE), trade secrets, design patterns (SDS), brand identifiers, and analytical metrics are the exclusive property of SariRemit.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">7. Limitation of Liability</h4>
                  <p>While we strive for absolute rate precision via daily audits, we do not guarantee the completeness or constant availability of third-party rates. We are not liable for any transaction choices, financial decisions, or rate fluctuations at the commercial counters.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">8. Suspension & Termination</h4>
                  <p>SariRemit reserves the right to suspend or terminate accounts that violate our terms, disrupt community harmony, upload offensive feedback, or target our infrastructure.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">9. Governing Law & Jurisdiction</h4>
                  <p>These terms and all platform interactions are governed exclusively by the laws and regulations of the Kingdom of Saudi Arabia. Any disputes are subject to the exclusive jurisdiction of the competent courts in Riyadh.</p>
                </section>

                <section className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">10. Updates & Acceptance</h4>
                  <p>SariRemit may update these Terms of Use to match regulatory alignments. Logging in or continuing to use the platform signifies active acceptance of the latest terms.</p>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#071A35] border-t border-sds-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0C2547] hover:bg-[#071A35] text-sds-text-sec text-xs font-bold transition-all border border-sds-border/40 cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
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
