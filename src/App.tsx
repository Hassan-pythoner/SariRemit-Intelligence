import React, { useState, useEffect } from 'react';
import { MobileApp } from './components/MobileApp';
import { SariRemitLogo } from './components/SariRemitLogo';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CompareRates } from './components/CompareRates';
import { SubmitRate } from './components/SubmitRate';
import { CorridorInsights } from './components/CorridorInsights';
import { AlertsPage } from './components/AlertsPage';
import { ProfilePage } from './components/ProfilePage';
import { SavingsCelebration } from './components/SavingsCelebration';
import { AuthModal } from './components/AuthModal';
import { AdminPortal } from './components/AdminPortal';
import { TermsModal } from './components/TermsModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { HowItWorks } from './components/HowItWorks';
import { About } from './components/About';
import { Community } from './components/Community';
import { Insights } from './components/Insights';
import { Resources } from './components/Resources';
import { 
  INITIAL_CROWDSOURCED_RATES, INITIAL_ALERTS, DEFAULT_PROFILE, getRemittanceOptions 
} from './data/mockData';
import { resolveRate } from './utils/costEngine';
import { SecurityTrustEngine } from './utils/securityTrustEngine';
import { CrowdsourcedRate, RateAlert, UserProfile, CorridorId, AdminRateOverride } from './types';
import { 
  ShieldAlert, Users, Coins, HeartHandshake,
  Home, ArrowLeftRight, PlusCircle, TrendingUp, Bell, User, 
  LogOut, LogIn, Moon, Sun, Languages, Menu, X, ShieldCheck, 
  AlertCircle, ArrowRight, ChevronRight, MessageSquareWarning, Settings, HelpCircle, Activity, Lock
} from 'lucide-react';
import {
  db,
  getFirebaseOverrides,
  subscribeFirebaseOverrides,
  upsertFirebaseOverride,
  deleteFirebaseOverride,
  getFirebaseCrowdsourcedRates,
  upsertFirebaseCrowdsourcedRate,
  upvoteFirebaseCrowdsourcedRate,
  getFirebaseConfig,
  setFirebaseConfig,
  deleteFirebaseConfig,
  signOutUser,
  getFirebaseUserProfile,
  updateFirebaseUserProfile,
  submitFirebaseRateAlert,
  getFirebaseRateAlerts,
  updateFirebaseRateAlertStatus,
  deleteFirebaseRateAlert,
  submitReportedIssue,
  trackEvent,
  submitUserFeedback,
  getFirebaseResolvedRates,
  getFirebaseMarketReferenceRates,
  getFirebaseCommunityConsensuses,
  upsertFirebaseMarketReferenceRate,
  updateMarketApiHealth,
  addMarketReferenceAudit,
  submitTrustSurvey
} from './lib/firebase';
import {
  supabase,
  getSupabaseOverrides,
  upsertSupabaseOverride,
  deleteSupabaseOverride,
  getSupabaseCrowdsourcedRates,
  upsertSupabaseCrowdsourcedRate,
  upvoteSupabaseCrowdsourcedRate,
  getSupabaseConfig,
  setSupabaseConfig,
  deleteSupabaseConfig,
  getSupabaseUserProfile,
  updateSupabaseUserProfile
} from './lib/supabase';

function MainAppContent() {
  const { t, language, toggleLanguage } = useLanguage();

  // Screen size detection for mobile-specific application
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme state (persisted in localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Authentication State
  const [userSession, setUserSession] = useState<{ id?: string; name: string; email: string; homeCountry: CorridorId; role?: string; isGuest?: boolean } | null>(() => {
    const saved = localStorage.getItem('sariremit_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session && session.email && session.email.toLowerCase() === 'hassan.gaturu20@gmail.com') {
          session.role = 'admin';
          localStorage.setItem('sariremit_session', JSON.stringify(session));
        }
        return session;
      } catch (e) {
        console.warn('Failed to parse saved session', e);
      }
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Quick-compare calculator presets
  const [calculatorPreset, setCalculatorPreset] = useState<{ amount: number; corridorId: string }>({
    amount: 1000,
    corridorId: 'PK'
  });

  // Shared application states
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [resourcesSubTab, setResourcesSubTab] = useState<string>('faq');
  const [isGatewayLoading, setIsGatewayLoading] = useState<boolean>(false);
  const [gatewayLoadingStep, setGatewayLoadingStep] = useState<number>(0);
  const [loadingUserName, setLoadingUserName] = useState<string>('');
  // Notification structure
  interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    isRead: boolean;
    type?: 'success' | 'info' | 'warning';
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const savedSession = localStorage.getItem('sariremit_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const userKey = session.id || session.email;
        const savedNotifs = localStorage.getItem(`sariremit_notifications_${userKey}`);
        if (savedNotifs) return JSON.parse(savedNotifs);
      } catch (e) {}
    }
    return [
      {
        id: 'notif-welcome',
        title: language === 'en' ? 'Welcome to SariRemit! 👋' : 'مرحباً بك في ساري ريميت! 👋',
        desc: language === 'en' 
          ? 'Start comparing live digital wallet rates to find your best saving opportunities.'
          : 'ابدأ مقارنة أسعار صرف المحافظ الرقمية للعثور على أفضل فرص التوفير الحقيقية.',
        time: 'Just now',
        isRead: false,
        type: 'info'
      }
    ];
  });

  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Feedback states
  const [feedbackSavedAmount, setFeedbackSavedAmount] = useState<number | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState<'Very helpful' | 'Helpful' | 'Not sure' | 'Not helpful'>('Very helpful');
  const [feedbackAccuracy, setFeedbackAccuracy] = useState<'Yes, it matched' | 'Almost matched' | 'No, it was different'>('Yes, it matched');
  const [feedbackComments, setFeedbackComments] = useState<string>('');
  const [feedbackProvider, setFeedbackProvider] = useState<string>('urpay');
  const [feedbackCorridor, setFeedbackCorridor] = useState<string>('PK');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  const [recentSubmissions, setRecentSubmissions] = useState<CrowdsourcedRate[]>(() => {
    const savedSession = localStorage.getItem('sariremit_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session && !session.isGuest) {
          return []; // Blank for real users, ensuring no mock data is shown
        }
      } catch (e) {}
    }
    return INITIAL_CROWDSOURCED_RATES;
  });

  const [alerts, setAlerts] = useState<RateAlert[]>(() => {
    const savedSession = localStorage.getItem('sariremit_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const userKey = session.id || session.email;
        const savedAlerts = localStorage.getItem(`sariremit_alerts_${userKey}`);
        if (savedAlerts) {
          return JSON.parse(savedAlerts);
        }
      } catch (e) {
        console.warn('Failed to parse saved alerts', e);
      }
    }
    return []; // Blank by default for new accounts/logged out users
  });
  const [profile, setProfile] = useState<UserProfile>(() => {
    const savedSession = localStorage.getItem('sariremit_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const userKey = session.id || session.email;
      const savedProfile = localStorage.getItem(`sariremit_profile_${userKey}`);
      if (savedProfile) {
        try {
          return JSON.parse(savedProfile);
        } catch (e) {
          console.warn('Failed to parse saved profile', e);
        }
      }
      return {
        ...DEFAULT_PROFILE,
        name: session.name || DEFAULT_PROFILE.name,
        homeCountry: session.homeCountry || DEFAULT_PROFILE.homeCountry
      };
    }
    return DEFAULT_PROFILE;
  });
  const [celebrationAmount, setCelebrationAmount] = useState<number | null>(null);

  // Rate Override Manager state
  const [adminRateOverrides, setAdminRateOverrides] = useState<AdminRateOverride[]>(() => {
    const saved = localStorage.getItem('sariremit_admin_overrides');
    return saved ? JSON.parse(saved) : [];
  });

  // Custom rates state for admin overrides
  const [customRates, setCustomRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('sariremit_custom_rates');
    return saved ? JSON.parse(saved) : {};
  });

  // Custom fees state for admin overrides
  const [customFees, setCustomFees] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('sariremit_custom_fees');
    return saved ? JSON.parse(saved) : {};
  });

  const [resolvedRates, setResolvedRates] = useState<any[]>([]);
  const [marketReferenceRates, setMarketReferenceRates] = useState<any[]>([]);
  const [communityConsensuses, setCommunityConsensuses] = useState<any[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      // 1. Try to fetch from Firebase if configured (Highest priority for live syncing)
      if (db) {
        try {
          console.log('🔄 Fetching config and data from Firebase Firestore...');
          const [dbOverrides, dbSubmissions, dbCustomRates, dbCustomFees, dbResolved, dbMarket, dbConsensus] = await Promise.all([
            getFirebaseOverrides(),
            getFirebaseCrowdsourcedRates(),
            getFirebaseConfig('custom_rates'),
            getFirebaseConfig('custom_fees'),
            getFirebaseResolvedRates(),
            getFirebaseMarketReferenceRates(),
            getFirebaseCommunityConsensuses()
          ]);

          if (dbOverrides) {
            setAdminRateOverrides(dbOverrides);
            localStorage.setItem('sariremit_admin_overrides', JSON.stringify(dbOverrides));
          }
          if (dbSubmissions && dbSubmissions.length > 0) {
            setRecentSubmissions(dbSubmissions);
          }
          if (dbCustomRates) {
            setCustomRates(dbCustomRates);
            localStorage.setItem('sariremit_custom_rates', JSON.stringify(dbCustomRates));
          }
          if (dbCustomFees) {
            setCustomFees(dbCustomFees);
            localStorage.setItem('sariremit_custom_fees', JSON.stringify(dbCustomFees));
          }
          if (dbResolved) {
            setResolvedRates(dbResolved);
          }
          if (dbMarket) {
            setMarketReferenceRates(dbMarket);
          }
          if (dbConsensus) {
            setCommunityConsensuses(dbConsensus);
          }

          console.log('✅ Firebase Firestore data sync complete.');
          return; // Skip other databases if Firebase succeeded
        } catch (err) {
          console.warn('⚠️ Failed to load from Firebase:', err);
        }
      }

      // 2. Try to fetch from Supabase if configured (Priority for Netlify if Firebase is absent/failed)
      if (supabase) {
        try {
          console.log('🔄 Fetching config and data from Supabase Cloud Database...');
          const [dbOverrides, dbSubmissions, dbCustomRates, dbCustomFees] = await Promise.all([
            getSupabaseOverrides(),
            getSupabaseCrowdsourcedRates(),
            getSupabaseConfig('custom_rates'),
            getSupabaseConfig('custom_fees')
          ]);

          if (dbOverrides && dbOverrides.length > 0) {
            setAdminRateOverrides(dbOverrides);
            localStorage.setItem('sariremit_admin_overrides', JSON.stringify(dbOverrides));
          }
          if (dbSubmissions && dbSubmissions.length > 0) {
            setRecentSubmissions(dbSubmissions);
          }
          if (dbCustomRates && Object.keys(dbCustomRates).length > 0) {
            setCustomRates(dbCustomRates);
            localStorage.setItem('sariremit_custom_rates', JSON.stringify(dbCustomRates));
          }
          if (dbCustomFees && Object.keys(dbCustomFees).length > 0) {
            setCustomFees(dbCustomFees);
            localStorage.setItem('sariremit_custom_fees', JSON.stringify(dbCustomFees));
          }

          console.log('✅ Supabase Cloud Database sync complete.');
          return;
        } catch (err) {
          console.warn('⚠️ Failed to load from Supabase:', err);
        }
      }

      // 3. Fallback to Local Express API (Only overwrite state if values exist to prevent zeroing out localStorage)
      try {
        const res = await fetch('/api/custom-config');
        if (res.ok) {
          const data = await res.json();
          if (data.customRates && Object.keys(data.customRates).length > 0) {
            setCustomRates(data.customRates);
            localStorage.setItem('sariremit_custom_rates', JSON.stringify(data.customRates));
          }
          if (data.customFees && Object.keys(data.customFees).length > 0) {
            setCustomFees(data.customFees);
            localStorage.setItem('sariremit_custom_fees', JSON.stringify(data.customFees));
          }
          if (data.adminOverrides && data.adminOverrides.length > 0) {
            setAdminRateOverrides(data.adminOverrides);
            localStorage.setItem('sariremit_admin_overrides', JSON.stringify(data.adminOverrides));
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom config from backend:", err);
      }

      // 3. Initialize dummy reported issues to reflect recent platform feedback in the control and monitoring center
      const localSavedIssues = localStorage.getItem('sariremit_reported_issues');
      if (!localSavedIssues) {
        const dummyIssues = [
          {
            id: 'issue-101',
            category: 'Rate Discrepancy / Value Layout',
            description: 'The Compare rates page has too many calculation rows. Users do not care about calculations but rather who offers the best value to maximize their yield.',
            email: 'muhammad.k@gmail.com',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            status: 'pending'
          },
          {
            id: 'issue-102',
            category: 'Interface / Layout Redundancy',
            description: 'The landing page is beautiful but has too much information. Let\'s remove the recent popular rates and crowdsourced cards for simplicity.',
            email: 'maria.c@outlook.com',
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
            status: 'pending'
          },
          {
            id: 'issue-103',
            category: 'Assets / Media path bug',
            description: 'The landing page background/hero banner image fails to load when published live. Please fix the path import structure to support bundler resolution.',
            email: 'admin.helper@sariremit.com',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            status: 'resolved'
          }
        ];
        localStorage.setItem('sariremit_reported_issues', JSON.stringify(dummyIssues));
      }
    };
    fetchConfig();
  }, []);

  // Background refresh and monitor for Market Reference Rates
  useEffect(() => {
    // Try loading cached reference rates from localStorage first
    const cachedRef = localStorage.getItem('sariremit_market_reference_rates');
    if (cachedRef) {
      try {
        setMarketReferenceRates(JSON.parse(cachedRef));
      } catch (e) {
        console.warn("Failed to parse cached market reference rates", e);
      }
    }

    const refreshRefRates = async () => {
      try {
        console.log("🔄 [RRE Engine] Refreshing Market Reference Intelligence from backend...");
        const res = await fetch("/api/market-reference");
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error("All sequential market reference rate providers failed.");

        const ratesMap = data.rates;
        const selectedSource = data.source;
        const apiHealth = data.health || [];

        // Re-construct the list of rates
        const newRefRates: any[] = [];
        const corridorIds = ['PK', 'IN', 'PH', 'KE', 'BD', 'EG', 'UG', 'ET'];
        const providerIds = ['urpay', 'stcpay', 'mobilypay', 'alrajhi', 'quickpay', 'enjaz', 'westernunion'];

        const bases: Record<string, number> = {
          PK: 74.2, IN: 22.3, PH: 15.6, KE: 34.8, BD: 31.4, EG: 12.9, UG: 985.0, ET: 15.2
        };
        const mults: Record<string, number> = {
          urpay: 1.015, stcpay: 1.012, mobilypay: 1.008, alrajhi: 1.002, quickpay: 0.998, enjaz: 0.995, westernunion: 0.985
        };

        corridorIds.forEach(corridor => {
          const currencySymbol = corridor === 'PK' ? 'PKR' : 
                                 corridor === 'IN' ? 'INR' : 
                                 corridor === 'PH' ? 'PHP' : 
                                 corridor === 'KE' ? 'KES' : 
                                 corridor === 'BD' ? 'BDT' : 
                                 corridor === 'EG' ? 'EGP' : 
                                 corridor === 'UG' ? 'UGX' : 'ETB';
          
          const rateVal = ratesMap[currencySymbol] || bases[corridor];

          providerIds.forEach(pId => {
            const adjustedRate = rateVal * (mults[pId] || 1.0);
            newRefRates.push({
              id: `mr_${pId}_${corridor}`.toLowerCase(),
              corridor,
              exchange_rate: Number(adjustedRate.toFixed(4)),
              provider_id: pId,
              source: selectedSource,
              timestamp: new Date().toISOString()
            });
          });
        });

        setMarketReferenceRates(newRefRates);
        localStorage.setItem('sariremit_market_reference_rates', JSON.stringify(newRefRates));

        console.log("✅ [RRE Engine] Market Reference Intelligence background refresh complete.");
      } catch (err: any) {
        console.error("❌ [RRE Engine] Market Reference Intelligence failed:", err);
      }
    };

    // Run immediately and then set interval for every 15 minutes
    refreshRefRates();
    const intervalId = setInterval(refreshRefRates, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Real-time listener for Firebase Overrides
  useEffect(() => {
    if (!db) return;
    console.log('📡 Setting up real-time Firebase overrides subscription...');
    const unsubscribe = subscribeFirebaseOverrides((updatedOverrides) => {
      console.log('🔥 Firebase overrides real-time update:', updatedOverrides);
      setAdminRateOverrides(updatedOverrides);
      localStorage.setItem('sariremit_admin_overrides', JSON.stringify(updatedOverrides));
    });
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Load and synchronize user profile from local storage and optional Firebase when user session changes
  useEffect(() => {
    const syncProfile = async () => {
      if (userSession) {
        const userKey = userSession.id || userSession.email;
        const savedProfile = localStorage.getItem(`sariremit_profile_${userKey}`);
        
        let initialProfile = DEFAULT_PROFILE;
        if (savedProfile) {
          try {
            initialProfile = JSON.parse(savedProfile);
          } catch (e) {
            console.warn('Failed to parse local profile', e);
          }
        } else {
          initialProfile = {
            ...DEFAULT_PROFILE,
            name: userSession.name,
            homeCountry: userSession.homeCountry
          };
          localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(initialProfile));
        }

        setProfile(initialProfile);

        if (db && userSession.role !== 'admin' && userSession.id) {
          try {
            const dbProfile = await getFirebaseUserProfile(userSession.id);
            if (dbProfile) {
              setProfile(dbProfile);
              localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(dbProfile));
            } else {
              // First time login, save local profile to Firebase
              await updateFirebaseUserProfile(userSession.id, initialProfile);
            }
          } catch (err) {
            console.warn('Failed to sync profile with Firebase:', err);
          }
        }
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    };
    syncProfile();
  }, [userSession]);

  // Load and synchronize user alerts from local storage and Firestore when user session changes
  useEffect(() => {
    const syncAlerts = async () => {
      if (userSession) {
        const userKey = userSession.id || userSession.email;
        let initialAlerts: RateAlert[] = [];
        const savedAlerts = localStorage.getItem(`sariremit_alerts_${userKey}`);
        if (savedAlerts) {
          try {
            initialAlerts = JSON.parse(savedAlerts);
          } catch (e) {
            initialAlerts = [];
          }
        }
        setAlerts(initialAlerts);

        if (userSession.id) {
          try {
            const dbAlerts = await getFirebaseRateAlerts(userSession.id);
            if (dbAlerts && dbAlerts.length > 0) {
              setAlerts(dbAlerts);
              localStorage.setItem(`sariremit_alerts_${userKey}`, JSON.stringify(dbAlerts));
            }
          } catch (err) {
            console.warn('Failed to sync alerts with Firebase:', err);
          }
        }
      } else {
        setAlerts([]);
      }
    };
    syncAlerts();
  }, [userSession]);

  // Persist alerts changes to local storage when alerts are updated
  useEffect(() => {
    if (userSession) {
      const userKey = userSession.id || userSession.email;
      localStorage.setItem(`sariremit_alerts_${userKey}`, JSON.stringify(alerts));
    }
  }, [alerts, userSession]);

  // Persist notifications on update
  useEffect(() => {
    if (userSession) {
      const userKey = userSession.id || userSession.email;
      localStorage.setItem(`sariremit_notifications_${userKey}`, JSON.stringify(notifications));
    }
  }, [notifications, userSession]);

  // Notifications operational helpers
  const addNotification = (title: string, desc: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title,
      desc,
      time: language === 'en' ? 'Just now' : 'الآن',
      isRead: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Real-time active price alerts monitor
  useEffect(() => {
    if (alerts.length === 0) return;
    const activeAlerts = alerts.filter(a => a.isActive);
    if (activeAlerts.length === 0) return;

    activeAlerts.forEach(alert => {
      const options = getRemittanceOptions(alert.corridorId);
      const opt = options.find(o => o.providerId === alert.providerId || alert.providerId === 'all');
      
      if (opt) {
        const baselineRate = opt.exchangeRate;
        const baselineFee = opt.fee;
        const resolution = resolveRate(
          opt.providerId,
          alert.corridorId,
          opt.subService,
          1000,
          'all',
          adminRateOverrides || [],
          recentSubmissions || [],
          {},
          customFees || {},
          baselineRate,
          baselineFee
        );
        const rate = resolution.selectedExchangeRate;
        let triggered = false;
        
        if (alert.condition === 'above' && rate >= alert.targetRate) triggered = true;
        if (alert.condition === 'below' && rate <= alert.targetRate) triggered = true;

        if (triggered) {
          const notifId = `trigger_${alert.id}_${Math.floor(Date.now() / (3600000 * 24))}`; // alert once a day max
          const alreadyNotified = notifications.some(n => n.id === notifId);
          
          if (!alreadyNotified) {
            const providerName = alert.providerId === 'all' ? (language === 'en' ? 'Any Channel' : 'أي قناة') : alert.providerId.toUpperCase();
            const title = language === 'en' 
              ? `Price Watch Target Met! 🚨` 
              : `تم تحقيق هدف مراقبة الأسعار! 🚨`;
            const desc = language === 'en'
              ? `Your alert for ${alert.corridorId} via ${providerName} is triggered! Current rate: ${rate.toFixed(3)} (target: ${alert.targetRate})`
              : `تنبيهك لـ ${alert.corridorId} عبر ${providerName} تم تفعيله! السعر الحالي: ${rate.toFixed(3)} (المستهدف: ${alert.targetRate})`;

            setNotifications(prev => [
              {
                id: notifId,
                title,
                desc,
                time: language === 'en' ? 'Just now' : 'الآن',
                isRead: false,
                type: 'warning'
              },
              ...prev
            ]);
          }
        }
      }
    });
  }, [alerts, adminRateOverrides, customRates, language]);

  const handleUpdateAdminOverride = async (override: AdminRateOverride) => {
    setAdminRateOverrides(prev => {
      const idx = prev.findIndex(o => o.id === override.id);
      let next;
      if (idx > -1) {
        next = prev.map(o => o.id === override.id ? override : o);
      } else {
        next = [...prev, override];
      }
      localStorage.setItem('sariremit_admin_overrides', JSON.stringify(next));
      return next;
    });

    // Sync to Supabase if active
    if (supabase) {
      await upsertSupabaseOverride(override);
    }

    // Sync to Firebase if active
    if (db) {
      await upsertFirebaseOverride(override);
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/admin-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(override)
      });
    } catch (err) {
      console.error("Failed to sync admin override to server:", err);
    }
  };

  const handleDeleteAdminOverride = async (id: string) => {
    setAdminRateOverrides(prev => {
      const next = prev.filter(o => o.id !== id);
      localStorage.setItem('sariremit_admin_overrides', JSON.stringify(next));
      return next;
    });

    // Sync to Supabase if active
    if (supabase) {
      await deleteSupabaseOverride(id);
    }

    // Sync to Firebase if active
    if (db) {
      await deleteFirebaseOverride(id);
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/admin-overrides/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error("Failed to delete admin override on server:", err);
    }
  };

  const handleUpdateCustomRates = async (providerId: string, corridorId: string, rate: number) => {
    let updated: Record<string, number> = {};
    setCustomRates(prev => {
      updated = { ...prev, [`${providerId}_${corridorId}`]: rate };
      localStorage.setItem('sariremit_custom_rates', JSON.stringify(updated));
      return updated;
    });

    // Sync to Supabase if active
    if (supabase) {
      await setSupabaseConfig('custom_rates', updated);
    }

    // Sync to Firebase if active
    if (db) {
      await setFirebaseConfig('custom_rates', updated);
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/custom-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, corridorId, rate })
      });
    } catch (err) {
      console.error("Failed to sync custom rate to server:", err);
    }
  };

  const handleResetCustomRates = async () => {
    setCustomRates({});
    localStorage.removeItem('sariremit_custom_rates');

    // Sync to Supabase if active
    if (supabase) {
      await deleteSupabaseConfig('custom_rates');
    }

    // Sync to Firebase if active
    if (db) {
      await deleteFirebaseConfig('custom_rates');
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/custom-rates/reset', { method: 'POST' });
    } catch (err) {
      console.error("Failed to reset custom rates on server:", err);
    }
  };

  const handleUpdateCustomFee = async (key: string, feeConfig: any) => {
    let updated: Record<string, any> = {};
    setCustomFees(prev => {
      updated = { ...prev, [key]: feeConfig };
      localStorage.setItem('sariremit_custom_fees', JSON.stringify(updated));
      return updated;
    });

    // Sync to Supabase if active
    if (supabase) {
      await setSupabaseConfig('custom_fees', updated);
    }

    // Sync to Firebase if active
    if (db) {
      await setFirebaseConfig('custom_fees', updated);
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/custom-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, feeConfig })
      });
    } catch (err) {
      console.error("Failed to sync custom fee to server:", err);
    }
  };

  const handleResetCustomFees = async () => {
    setCustomFees({});
    localStorage.removeItem('sariremit_custom_fees');

    // Sync to Supabase if active
    if (supabase) {
      await deleteSupabaseConfig('custom_fees');
    }

    // Sync to Firebase if active
    if (db) {
      await deleteFirebaseConfig('custom_fees');
    }

    // Always sync with fallback local API
    try {
      await fetch('/api/custom-fees/reset', { method: 'POST' });
    } catch (err) {
      console.error("Failed to reset custom fees on server:", err);
    }
  };

  const handleLoginSuccess = (user: { id?: string; name: string; email: string; homeCountry: CorridorId; role?: string }) => {
    const updatedUser = { ...user };
    if (user.email && user.email.toLowerCase() === 'hassan.gaturu20@gmail.com') {
      updatedUser.role = 'admin';
    }
    
    // Register active device session and log immutable audit event in securityTrustEngine & Firestore
    if (user.email) {
      SecurityTrustEngine.registerUserSession(user.email);
      SecurityTrustEngine.logEvent(
        user.email,
        (updatedUser.role === 'admin' ? 'Admin' : 'User') as any,
        'Login',
        `Expat ${user.name} initiated secure session on corridor ${user.homeCountry}.`,
        'Success',
        'Info'
      );
    }
    
    // Set loading user name
    setLoadingUserName(user.name);
    
    // Trigger the premium gateway loading sequence
    setIsGatewayLoading(true);
    setGatewayLoadingStep(0);
    
    // Simulate steps of loading
    setTimeout(() => setGatewayLoadingStep(1), 400);
    setTimeout(() => setGatewayLoadingStep(2), 800);
    setTimeout(() => setGatewayLoadingStep(3), 1200);

    setTimeout(() => {
      setUserSession(updatedUser);
      localStorage.setItem('sariremit_session', JSON.stringify(updatedUser));
      
      // Sync profile page values automatically for seamless UX
      if (updatedUser.role !== 'admin') {
        setProfile(prev => ({
          ...prev,
          name: updatedUser.name,
          homeCountry: updatedUser.homeCountry
        }));
      }
      setIsGatewayLoading(false);
    }, 1600);
  };

  const handleSignOut = async () => {
    setUserSession(null);
    localStorage.removeItem('sariremit_session');
    await signOutUser();
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      name: language === 'en' ? 'Guest Expat' : 'زائر',
      email: 'guest@sariremit.local',
      homeCountry: 'PK' as CorridorId,
      isGuest: true
    };
    
    // Set loading user name
    setLoadingUserName(guestUser.name);
    
    // Trigger the premium gateway loading sequence
    setIsGatewayLoading(true);
    setGatewayLoadingStep(0);
    
    // Simulate steps of loading
    setTimeout(() => setGatewayLoadingStep(1), 300);
    setTimeout(() => setGatewayLoadingStep(2), 600);
    setTimeout(() => setGatewayLoadingStep(3), 900);

    setTimeout(() => {
      setUserSession(guestUser);
      setCurrentPage('landing');
      setIsGatewayLoading(false);
    }, 1200);
  };

  const navigateToPage = (pageId: string) => {
    if (userSession?.isGuest && !['landing', 'compare', 'community', 'how-it-works', 'about', 'resources'].includes(pageId)) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentPage(pageId);
  };

  // State modification actions
  const addNewSubmission = async (sub: Omit<CrowdsourcedRate, 'id' | 'timestamp' | 'votes' | 'isVerified'>) => {
    const newSub: CrowdsourcedRate = {
      ...sub,
      id: `sub-${Date.now()}`,
      timestamp: language === 'en' ? 'Just now' : 'الآن',
      votes: 1,
      isVerified: false
    };
    setRecentSubmissions(prev => [newSub, ...prev]);
    
    // Give user credit points for submitting
    setProfile(prev => {
      const updated = {
        ...prev,
        totalSavedSar: prev.totalSavedSar + 5.00 // simulated reward
      };
      if (userSession) {
        const userKey = userSession.id || userSession.email;
        localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(updated));
      }
      if (db && userSession && userSession.role !== 'admin' && userSession.id) {
        updateFirebaseUserProfile(userSession.id, updated);
      }
      return updated;
    });

    // Sync to Firebase if active
    if (db) {
      await upsertFirebaseCrowdsourcedRate(newSub);
    }
  };

  const upvoteSubmission = async (id: string) => {
    let currentVotes = 1;
    setRecentSubmissions(prev => 
      prev.map(sub => {
        if (sub.id === id) {
          currentVotes = sub.votes;
          return { ...sub, votes: sub.votes + 1 };
        }
        return sub;
      })
    );

    if (db) {
      await upvoteFirebaseCrowdsourcedRate(id, currentVotes);
    }
  };

  const verifySubmission = async (id: string) => {
    let targetSub: CrowdsourcedRate | undefined;
    setRecentSubmissions(prev => 
      prev.map(sub => {
        if (sub.id === id) {
          targetSub = { ...sub, votes: sub.votes + 2, isVerified: true };
          return targetSub;
        }
        return sub;
      })
    );

    if (db && targetSub) {
      await upsertFirebaseCrowdsourcedRate(targetSub);
    }
  };

  const addNewAlert = async (alert: Omit<RateAlert, 'id' | 'createdAt' | 'isActive'>) => {
    const newAlert: RateAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      userId: userSession?.id || undefined
    };
    setAlerts(prev => [newAlert, ...prev]);
    await submitFirebaseRateAlert(newAlert);
  };

  const toggleAlertStatus = async (id: string) => {
    let targetIsActive = false;
    setAlerts(prev => 
      prev.map(al => {
        if (al.id === id) {
          targetIsActive = !al.isActive;
          return { ...al, isActive: targetIsActive };
        }
        return al;
      })
    );
    if (userSession?.id) {
      await updateFirebaseRateAlertStatus(id, userSession.id, targetIsActive);
    }
  };

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(al => al.id !== id));
    if (userSession?.id) {
      await deleteFirebaseRateAlert(id, userSession.id);
    }
  };

  const handleSaveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (userSession) {
      const userKey = userSession.id || userSession.email;
      localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(newProfile));
    }
    if (db && userSession && userSession.role !== 'admin' && userSession.id) {
      await updateFirebaseUserProfile(userSession.id, newProfile);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFeedbackSubmitting(true);

    try {
      const feedbackId = `fdb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      let sessionId = sessionStorage.getItem('sariremit_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('sariremit_session_id', sessionId);
      }

      const transferRecordId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const feedbackPayload = {
        id: feedbackId,
        user_id: userSession?.id || userSession?.uid || null,
        session_id: sessionId,
        transfer_record_id: transferRecordId,
        provider: feedbackProvider,
        corridor: feedbackCorridor,
        helpfulness_rating: feedbackHelpful,
        amount_accuracy: feedbackAccuracy,
        transfer_completed: true,
        issue_type: 'none',
        comment: feedbackComments,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      await submitUserFeedback(feedbackPayload);

      // Track the feedback submitted event
      await trackEvent('Feedback Submitted', {
        event_type: 'feedback',
        helpfulness: feedbackHelpful,
        accuracy: feedbackAccuracy,
        provider: feedbackProvider,
        corridor: feedbackCorridor,
        feedback_id: feedbackId
      });

      setFeedbackSuccess(true);
      
      setTimeout(() => {
        setFeedbackSavedAmount(null);
        setFeedbackSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  // Fun helper to add logged comparison savings
  const recordSavedAmount = async (savedAmount: number, details?: { providerId: string; amount: number; corridorId: string }) => {
    setProfile(prev => {
      const newHistoryItem = {
        id: `tx_${Date.now()}`,
        providerId: details?.providerId || 'urpay',
        amount: details?.amount || 1000,
        savedSar: savedAmount,
        date: new Date().toISOString()
      };

      const existingHistory = prev.savingsHistory || [];
      const updatedHistory = [newHistoryItem, ...existingHistory];

      // Sync local storage general transfer history as well
      try {
        localStorage.setItem('sariremit_transfer_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to write to sariremit_transfer_history key", e);
      }

      const updated = {
        ...prev,
        totalSavedSar: prev.totalSavedSar + savedAmount,
        savingsHistory: updatedHistory
      };

      if (userSession) {
        const userKey = userSession.id || userSession.email;
        localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(updated));
      }
      if (db && userSession && userSession.role !== 'admin' && userSession.id) {
        updateFirebaseUserProfile(userSession.id, updated);
      }

      // Add a dynamic notification about the logged savings!
      const provName = details?.providerId || 'urpay';
      addNotification(
        language === 'en' ? 'Savings Logged Successfully! 🎉' : 'تم تسجيل التوفير بنجاح! 🎉',
        language === 'en' 
          ? `You logged a transfer of ${details?.amount || 1000} SAR using ${provName.toUpperCase()}, saving ${savedAmount.toFixed(2)} SAR!`
          : `لقد قمت بتسجيل عملية تحويل بمبلغ ${details?.amount || 1000} ريال عبر ${provName.toUpperCase()}، مما وفر لك ${savedAmount.toFixed(2)} ريال!`,
        'success'
      );

      return updated;
    });
    
    // Trigger celebration for savings of 5 SAR or more
    if (savedAmount >= 5) {
      setCelebrationAmount(savedAmount);
    }

    // Trigger feedback modal showing a question or two to improve experience
    setFeedbackSavedAmount(savedAmount);
    setFeedbackHelpful('Very helpful');
    setFeedbackAccuracy('Yes, it matched');
    setFeedbackComments('');
    setFeedbackProvider(details?.providerId || 'urpay');
    setFeedbackCorridor(details?.corridorId || 'PK');
    setFeedbackSuccess(false);

    // Track Record Transfer Event
    trackEvent('Record Transfer', {
      amount: details?.amount || 1000,
      provider: details?.providerId || 'urpay',
      corridor: details?.corridorId || 'PK',
      saved_sar: savedAmount,
      event_type: 'transaction'
    });
  };

  const deleteSavingsRecord = async (id: string) => {
    setProfile(prev => {
      const existingHistory = prev.savingsHistory || [];
      const updatedHistory = existingHistory.filter(item => item.id !== id);
      const removedItem = existingHistory.find(item => item.id === id);
      const refundAmount = removedItem ? removedItem.savedSar : 0;

      // Sync local storage general transfer history as well
      try {
        localStorage.setItem('sariremit_transfer_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to write to sariremit_transfer_history key", e);
      }

      const updated = {
        ...prev,
        totalSavedSar: Math.max(0, prev.totalSavedSar - refundAmount),
        savingsHistory: updatedHistory
      };

      if (userSession) {
        const userKey = userSession.id || userSession.email;
        localStorage.setItem(`sariremit_profile_${userKey}`, JSON.stringify(updated));
      }
      if (db && userSession && userSession.role !== 'admin' && userSession.id) {
        updateFirebaseUserProfile(userSession.id, updated);
      }

      addNotification(
        language === 'en' ? 'Savings Log Deleted' : 'تم حذف سجل التوفير',
        language === 'en'
          ? `Transaction log removed. Saved amount has been adjusted.`
          : `تمت إزالة سجل المعاملة وتعديل المبلغ الموفر.`,
        'info'
      );

      return updated;
    });
  };

  // Determine user level description
  const getUserLevelDesc = (saved: number) => {
    if (saved < 50) return language === 'en' ? 'Novice Expat' : 'مغترب مستجد';
    if (saved < 150) return language === 'en' ? 'Budget Champion' : 'بطل التوفير';
    if (saved < 500) return language === 'en' ? 'Savings Master' : 'سيد الادخار';
    return language === 'en' ? 'Remittance Sage' : 'حكيم التحويلات';
  };

  const activeLevel = getUserLevelDesc(profile.totalSavedSar);

  if (isGatewayLoading) {
    const stepsEn = [
      "Securing encrypted handshake with Supabase database...",
      "Decrypting live wallet provider configurations...",
      "Resolving optimal KSA-to-expat remittance paths...",
      "Gateway authorized. Welcome to SariRemit!"
    ];
    const stepsAr = [
      "تأمين اتصال مشفر بقاعدة بيانات سوبابيز...",
      "فك تشفير إعدادات موفري محافظ الخدمة الحالية...",
      "تحليل وتحديد قنوات التحويل المثالية من المملكة...",
      "تم تفويض البوابة بنجاح. مرحباً بك في ساري ريميت!"
    ];

    const displayName = loadingUserName || userSession?.name || (language === 'en' ? 'Valued Expat' : 'مغتربنا العزيز');

    return (
      <div className="min-h-screen bg-[#061B3A] flex flex-col items-center justify-center text-white px-6">
        <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
          
          {/* Centered Premium Official Logo */}
          <SariRemitLogo variant="full" animate={true} />

          <div className="space-y-4">
            {/* Dynamic Progress Indicator */}
            <div className="pt-4 max-w-xs mx-auto">
              <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden relative border border-white/5">
                <div 
                  className="absolute left-0 top-0 h-full bg-[#FDBA2D] transition-all duration-300 ease-out shadow-[0_0_12px_#FDBA2D]"
                  style={{ width: `${(gatewayLoadingStep + 1) * 25}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Preparing Remittance Intelligence label */}
          <p className="text-xs font-mono text-slate-400 min-h-[40px] flex flex-col items-center justify-center px-4 leading-relaxed font-semibold">
            <span className="text-[#F4B63F] uppercase tracking-widest text-[10px] mb-1">
              {language === 'en' ? 'Preparing Remittance Intelligence…' : 'جاري تحضير ذكاء التحويلات...'}
            </span>
            <span className="text-slate-500 text-[10px]">
              {language === 'en' ? stepsEn[gatewayLoadingStep] : stepsAr[gatewayLoadingStep]}
            </span>
          </p>

          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-[#FDBA2D]/30 border-t-[#FDBA2D] rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile && userSession?.role !== 'admin' && !isGatewayLoading) {
    return (
      <div className="min-h-screen bg-[#071326]">
        <MobileApp
          userSession={userSession}
          profile={profile}
          adminRateOverrides={adminRateOverrides}
          recentSubmissions={recentSubmissions}
          customRates={customRates}
          customFees={customFees}
          resolvedRates={resolvedRates}
          marketReferenceRates={marketReferenceRates}
          communityConsensuses={communityConsensuses}
          alerts={alerts}
          addNewSubmission={addNewSubmission}
          upvoteSubmission={upvoteSubmission}
          verifySubmission={verifySubmission}
          addNewAlert={addNewAlert}
          toggleAlertStatus={toggleAlertStatus}
          deleteAlert={deleteAlert}
          handleSaveProfile={handleSaveProfile}
          recordSavedAmount={recordSavedAmount}
          deleteSavingsRecord={deleteSavingsRecord}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onContinueAsGuest={handleContinueAsGuest}
        />
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onLoginSuccess={handleLoginSuccess} 
            onContinueAsGuest={handleContinueAsGuest}
          />
        )}
      </div>
    );
  }

  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#071326] text-white flex flex-col transition-colors duration-200">
        {/* Sleek Gateway Top Navbar */}
        <Navbar 
          currentPage={currentPage}
          setCurrentPage={(pageId) => {
            if (['how-it-works', 'about', 'resources'].includes(pageId)) {
              const element = document.getElementById(`${pageId}-section`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            } else if (pageId === 'landing') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          userLevel="Guest"
          totalSaved={0}
          userSession={null}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSignOut={() => {}}
          onSelectResourceTab={(tab) => {
            setResourcesSubTab(tab);
            const element = document.getElementById('resources-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          notifications={[]}
        />

        {/* Gateway Main Body */}
        <main className="flex-grow">
          <LandingPage 
            setCurrentPage={(page) => {
              // Any attempt to navigate triggers AuthModal since user is not logged in!
              setIsAuthModalOpen(true);
            }} 
            setCalculatorPreset={setCalculatorPreset}
            recentSubmissions={recentSubmissions}
            upvoteSubmission={upvoteSubmission}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onContinueAsGuest={handleContinueAsGuest}
            onSelectResourceTab={(tab) => {
              setResourcesSubTab(tab);
              const element = document.getElementById('resources-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            resourcesSubTab={resourcesSubTab}
            resolvedRates={resolvedRates}
            adminRateOverrides={adminRateOverrides}
            marketReferenceRates={marketReferenceRates}
            communityConsensuses={communityConsensuses}
          />
        </main>

        {/* Footer info inside gateway */}
        <footer className="bg-[#0B1E35] border-t border-white/5 py-12 text-center text-xs text-[#7E96AA] space-y-4">
          <div className="flex justify-center mb-2">
            <SariRemitLogo variant="icon" className="w-10 h-10" />
          </div>
          <p className="max-w-2xl mx-auto text-xs leading-relaxed px-4 text-[#AFC4D8]">
            {language === 'en'
              ? 'SariRemit is a remittance intelligence platform helping expatriates maximize the value their families receive through transparent, evidence-based recommendations.'
              : 'ساري ريميت هي منصة ذكاء مخصصة لتحويل الأموال تساعد المغتربين على زيادة قيمة التحويلات التي تتلقاها عائلاتهم من خلال توصيات شفافة ومبنية على الأدلة والبيانات.'}
          </p>
          <p className="text-[#F4B63F] font-bold text-[10px] uppercase tracking-wider">
            {language === 'en' ? 'Helping Expats Make Every Riyal Count.' : 'مساعدة المغتربين لجعل كل ريال ذا قيمة.'}
          </p>
          <p className="text-[10px] text-slate-500 pt-2 border-t border-white/5 max-w-md mx-auto">
            © 2026 SariRemit. Independently optimizing expat remittances from KSA. All brand trademarks (urpay, stc pay, Mobily Pay) shown belong to their respective operators.
          </p>
        </footer>

        {/* Modal windows */}
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            onLoginSuccess={handleLoginSuccess} 
            onContinueAsGuest={handleContinueAsGuest}
          />
        )}
        
        {isTermsModalOpen && (
          <TermsModal 
            isOpen={isTermsModalOpen} 
            onClose={() => setIsTermsModalOpen(false)} 
          />
        )}

        {isReportModalOpen && (
          <ReportIssueModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
          />
        )}
      </div>
    );
  }

  if (userSession?.role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-white transition-colors duration-200">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdminPortal
            userSession={userSession}
            onSignOut={handleSignOut}
            recentSubmissions={recentSubmissions}
            onUpdateSubmissions={setRecentSubmissions}
            alerts={alerts}
            onUpdateAlerts={setAlerts}
            customRates={customRates}
            onUpdateCustomRates={handleUpdateCustomRates}
            onResetCustomRates={handleResetCustomRates}
            customFees={customFees}
            onUpdateCustomFee={handleUpdateCustomFee}
            onResetCustomFees={handleResetCustomFees}
            adminRateOverrides={adminRateOverrides}
            onUpdateAdminOverride={handleUpdateAdminOverride}
            onDeleteAdminOverride={handleDeleteAdminOverride}
            resolvedRates={resolvedRates}
            marketReferenceRates={marketReferenceRates}
            communityConsensuses={communityConsensuses}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#071326] text-[#FFFFFF] transition-colors duration-200 pb-12 lg:pb-0">
      
      {/* 1. Redesigned Premium Horizontal Top Sticky Navbar */}
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={navigateToPage}
        userLevel={activeLevel}
        totalSaved={profile.totalSavedSar}
        userSession={userSession}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onSelectResourceTab={(tab) => setResourcesSubTab(tab)}
        notifications={notifications}
        isNotificationDropdownOpen={isNotificationDropdownOpen}
        setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        clearAllNotifications={clearAllNotifications}
        markNotificationAsRead={markNotificationAsRead}
      />

      {/* 2. Unified Responsive Main Content Body */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden bg-[#071326]">
        
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 bg-[#071326]">
          
          {/* Render Active View */}
          {currentPage === 'landing' && (
            <div className="space-y-12">
              <Dashboard 
                setCurrentPage={navigateToPage}
                setCalculatorPreset={setCalculatorPreset}
                adminRateOverrides={adminRateOverrides}
                userSession={userSession}
                profile={profile}
                customRates={customRates}
                customFees={customFees}
                recentSubmissions={recentSubmissions}
              />
            </div>
          )}

          {currentPage === 'compare' && (
            <CompareRates 
              amountPreset={calculatorPreset.amount}
              corridorPreset={calculatorPreset.corridorId}
              clearPresets={() => setCalculatorPreset({ amount: 1000, corridorId: 'PK' })}
              recordSavedAmount={recordSavedAmount}
              userSession={userSession?.isGuest ? null : userSession}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              customRates={customRates}
              customFees={customFees}
              adminRateOverrides={adminRateOverrides}
              recentSubmissions={recentSubmissions}
              alerts={alerts}
              addNewAlert={addNewAlert}
              toggleAlertStatus={toggleAlertStatus}
              deleteAlert={deleteAlert}
              resolvedRates={resolvedRates}
              marketReferenceRates={marketReferenceRates}
              communityConsensuses={communityConsensuses}
            />
          )}

          {currentPage === 'submit' && (
            <SubmitRate 
              addNewSubmission={addNewSubmission}
              recentSubmissions={recentSubmissions}
              upvoteSubmission={upvoteSubmission}
              verifySubmission={verifySubmission}
              userSession={userSession}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentPage === 'how-it-works' && (
            <HowItWorks setCurrentPage={navigateToPage} />
          )}

          {currentPage === 'about' && (
            <About setCurrentPage={navigateToPage} />
          )}

          {currentPage === 'community' && (
            <Community setCurrentPage={navigateToPage} />
          )}

          {currentPage === 'insights' && (
            <Insights setCurrentPage={navigateToPage} />
          )}

          {currentPage === 'resources' && (
            <Resources initialResource={resourcesSubTab} setCurrentPage={navigateToPage} />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage 
              alerts={alerts}
              addNewAlert={addNewAlert}
              toggleAlertStatus={toggleAlertStatus}
              deleteAlert={deleteAlert}
              userSession={userSession}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentPage === 'profile' && (
            <ProfilePage 
              profile={profile}
              saveProfile={handleSaveProfile}
              recordSavedAmount={recordSavedAmount}
              deleteSavingsRecord={deleteSavingsRecord}
              userSession={userSession}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
            />
          )}

        </main>

        {/* 3. Redesigned Premium Multi-column Expanded Footer */}
        <footer className="bg-[#01100e] text-slate-400 border-t border-emerald-500/10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
              
              {/* Brand Column */}
              <div className="md:col-span-4 space-y-4">
                <SariRemitLogo variant="horizontal" />
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mt-3">
                  {language === 'en'
                    ? 'SariRemit is a remittance intelligence platform helping expatriates maximize the value their families receive through transparent, evidence-based recommendations.'
                    : 'ساري ريميت هي منصة ذكاء مخصصة لتحويل الأموال تساعد المغتربين على زيادة قيمة التحويلات التي تتلقاها عائلاتهم من خلال توصيات شفافة ومبنية على الأدلة والبيانات.'}
                </p>
                <p className="text-[#F4B63F] font-bold text-[10px] uppercase tracking-wider mt-2">
                  {language === 'en' ? 'Helping Expats Make Every Riyal Count.' : 'مساعدة المغتربين لجعل كل ريال ذا قيمة.'}
                </p>
                <div className="pt-2 text-[10px] text-slate-500 font-mono leading-relaxed">
                  <p>🇸🇦 {language === 'en' ? 'Designed for expats in Saudi Arabia.' : 'صمم خصيصاً للمغتربين في المملكة العربية السعودية.'}</p>
                </div>
              </div>

              {/* Company Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <h5 className="text-white font-extrabold uppercase tracking-widest font-mono text-[11px]">
                  {language === 'en' ? 'Company' : 'الشركة'}
                </h5>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => navigateToPage('about')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'About Us' : 'من نحن'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('charter'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Trust Charter' : 'ميثاق الثقة'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('blog'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Insights Blog' : 'المدونة'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('contact'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Contact Us' : 'اتصل بنا'}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Product Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <h5 className="text-white font-extrabold uppercase tracking-widest font-mono text-[11px]">
                  {language === 'en' ? 'Product' : 'المنتج'}
                </h5>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => navigateToPage('compare')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Compare Rates' : 'مقارنة أسعار الصرف'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateToPage('how-it-works')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'How It Works' : 'كيف نعمل'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateToPage('alerts')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Rate Alerts' : 'تنبيهات الأسعار'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateToPage('submit')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Track Transfers' : 'تتبع الحوالات'}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Resources Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <h5 className="text-white font-extrabold uppercase tracking-widest font-mono text-[11px]">
                  {language === 'en' ? 'Resources' : 'الموارد'}
                </h5>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => { setResourcesSubTab('faq'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'FAQs' : 'الأسئلة الشائعة'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('help'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Help Center' : 'مركز المساعدة'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('glossary'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Rate Glossary' : 'قاموس المصطلحات'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('savings-guide'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Savings Guide' : 'دليل التوفير'}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Community & Legal Column */}
              <div className="md:col-span-2 space-y-3 text-xs">
                <h5 className="text-white font-extrabold uppercase tracking-widest font-mono text-[11px]">
                  {language === 'en' ? 'Community & Legal' : 'المجتمع والسياسات'}
                </h5>
                <ul className="space-y-2.5">
                  <li>
                    <button onClick={() => navigateToPage('community')} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Community Trust' : 'ثقة المجتمع'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('privacy'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { setResourcesSubTab('terms'); navigateToPage('resources'); }} className="hover:text-[#00E07A] transition-colors cursor-pointer text-left">
                      {language === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setIsReportModalOpen(true)} className="text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer text-left">
                      ⚠️ {language === 'en' ? 'Report Issue' : 'الإبلاغ عن خطأ'}
                    </button>
                  </li>
                </ul>
              </div>

            </div>

            {/* Regulatory and Independence Disclaimer */}
            <div className="border-t border-emerald-500/10 pt-8 space-y-4 text-[11px] text-slate-500 leading-relaxed">
              <div className="flex gap-2 items-start text-left">
                <ShieldAlert className="w-4 h-4 text-[#00E07A] shrink-0 mt-0.5" />
                <p>
                  <strong>{language === 'en' ? 'Independence & SAMA Open Banking philosophy Disclaimer:' : 'إخلاء مسؤولية الاستقلالية ومبادئ المصرفية المفتوحة:'}</strong>{' '}
                  {language === 'en'
                    ? 'SariRemit is a fully independent crowdsourced remittance comparison directory. We have no affiliation with SAMA, stc pay, urpay, Mobily Pay, Enjaz, or any financial bank. All statistics, coefficients, rates and fees are periodically logged or verified. SariRemit does not hold, handle, or transmit funds.'
                    : 'ساري ريميت هو دليل مقارنة مستقل تماماً. ليس لنا أي علاقة رسمية بالبنك المركزي السعودي (SAMA)، إس تي سي باي، يورباي، موبايلي باي، أو إنجاز. جميع أسعار الصرف والرسوم مقدمة من المجتمع أو تُجلب دورياً. ساري ريميت لا يمس ولا يحول ولا يستلم أي أموال.'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-emerald-500/10 text-center font-mono">
                <p>
                  © 2026 SariRemit. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-600">v1.4.2</span>
                </div>
              </div>
            </div>

          </div>
        </footer>

      </div>

      {isTermsModalOpen && (
        <TermsModal 
          isOpen={isTermsModalOpen} 
          onClose={() => setIsTermsModalOpen(false)} 
        />
      )}

      {isReportModalOpen && (
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          userSession={userSession}
        />
      )}

      {feedbackSavedAmount !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white animate-fade-in">
          <div className="bg-[#10263D] border border-[#00C16A]/20 rounded-[28px] max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setFeedbackSavedAmount(null)}
              className="absolute top-4 right-4 text-[#7E96AA] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#00C16A]/10 text-[#00E07A] rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-[#00C16A]/20">
                📈
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {language === 'en' ? 'Share Your Savings Experience!' : 'شاركنا تجربة ادخارك!'}
              </h3>
              <p className="text-xs text-[#AFC4D8] leading-relaxed">
                {language === 'en'
                  ? `We noticed you just saved ${feedbackSavedAmount.toFixed(2)} SAR! Help us improve the rate matching engine:`
                  : `لقد وفرت للتو ${feedbackSavedAmount.toFixed(2)} ريال! ساعدنا في تحسين محرك مطابقة الأسعار بقليل من الملاحظات:`}
              </p>
            </div>

            {feedbackSuccess ? (
              <div className="bg-[#00C16A]/10 border border-[#00C16A]/20 text-[#00E07A] p-4 rounded-xl text-center font-bold text-xs animate-scale-up space-y-1">
                <p>🎉 {language === 'en' ? 'Thank You!' : 'شكراً لك!'}</p>
                <p className="font-normal text-[11px] text-[#AFC4D8]">
                  {language === 'en' ? 'Your feedback has been logged securely.' : 'تم تسجيل رأيك وملاحظاتك بأمان.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Question 1 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-[#7E96AA] uppercase font-bold tracking-wider">
                    {language === 'en' ? "Was SariRemit's recommendation helpful?" : "هل كانت توصية ساري ريميت مفيدة؟"}
                  </label>
                  <select
                    value={feedbackHelpful}
                    onChange={(e) => setFeedbackHelpful(e.target.value as any)}
                    className="w-full bg-[#071326] text-xs text-white px-3 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                  >
                    <option value="Very helpful">{language === 'en' ? 'Very helpful' : 'مفيدة جداً'}</option>
                    <option value="Helpful">{language === 'en' ? 'Helpful' : 'مفيدة'}</option>
                    <option value="Not sure">{language === 'en' ? 'Not sure' : 'غير متأكد'}</option>
                    <option value="Not helpful">{language === 'en' ? 'Not helpful' : 'غير مفيدة'}</option>
                  </select>
                </div>

                {/* Question 2 */}
                <div className="space-y-2">
                  <label className="text-[11px] text-[#7E96AA] uppercase font-bold tracking-wider">
                    {language === 'en' ? "Did the final amount match what SariRemit estimated?" : "هل تطابق المبلغ النهائي مع تقدير ساري ريميت؟"}
                  </label>
                  <select
                    value={feedbackAccuracy}
                    onChange={(e) => setFeedbackAccuracy(e.target.value as any)}
                    className="w-full bg-[#071326] text-xs text-white px-3 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A]"
                  >
                    <option value="Yes, it matched">{language === 'en' ? 'Yes, it matched' : 'نعم، تطابق تماماً'}</option>
                    <option value="Almost matched">{language === 'en' ? 'Almost matched' : 'تقريباً تطابق'}</option>
                    <option value="No, it was different">{language === 'en' ? 'No, it was different' : 'لا، كان مختلفاً'}</option>
                  </select>
                </div>

                {/* Optional Comments */}
                <div className="space-y-2">
                  <label className="text-[11px] text-[#7E96AA] uppercase font-bold tracking-wider block">
                    {language === 'en' ? 'Any additional comments? (Optional)' : 'أي ملاحظات إضافية؟ (اختياري)'}
                  </label>
                  <textarea
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder={language === 'en' ? 'Type here...' : 'اكتب هنا...'}
                    className="w-full bg-[#071326] text-xs text-white px-3 py-2.5 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A] h-20 resize-none"
                  />
                </div>

                {/* Submit & Skip buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackSavedAmount(null)}
                    className="flex-1 py-2.5 bg-transparent hover:bg-white/5 text-[#7E96AA] hover:text-white rounded-xl text-xs font-extrabold cursor-pointer border border-white/5 transition-all uppercase tracking-wider"
                  >
                    {language === 'en' ? 'Skip' : 'تخطي'}
                  </button>
                  <button
                    type="submit"
                    disabled={isFeedbackSubmitting}
                    className="flex-1 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] disabled:bg-emerald-800 text-[#071326] rounded-xl text-xs font-extrabold cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isFeedbackSubmitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-[#071326]/30 border-t-[#071326] rounded-full animate-spin"></span>
                    ) : (
                      <span>{language === 'en' ? 'Submit' : 'إرسال'}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
