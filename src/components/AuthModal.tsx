import React, { useState } from 'react';
import { SariRemitLogo } from './SariRemitLogo';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { CORRIDORS } from '../data/mockData';
import { CorridorId } from '../types';
import { ShieldCheck, Mail, Lock, User, Globe, AlertCircle, CheckCircle, X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { signUpUser, signInUser, signInWithGoogle, auth, trackEvent } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; homeCountry: CorridorId; role?: string }) => void;
  onContinueAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, onContinueAsGuest }) => {
  const { t, language, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [homeCountry, setHomeCountry] = useState<CorridorId>('KE');
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    resetForm();
  };

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Basic Validations
    if (!email || !password) {
      setErrorMsg(language === 'en' ? 'Please fill in all fields.' : 'يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg(language === 'en' ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg(language === 'en' ? 'Password must be at least 6 characters long.' : 'يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
      return;
    }

    if (activeTab === 'signup' && !name) {
      setErrorMsg(language === 'en' ? 'Please enter your full name.' : 'يرجى إدخال الاسم الكامل.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        const { user, error } = await signUpUser(email, password, name, homeCountry);
        setIsLoading(false);
        if (error) {
          setErrorMsg(error);
          return;
        }
        trackEvent('Signup', { event_type: 'auth', email, name, homeCountry });
        setSuccessMsg(language === 'en' ? 'Account created successfully!' : 'تم إنشاء الحساب بنجاح!');
        setTimeout(() => {
          if (user) {
            onLoginSuccess({
              name: user.name,
              email: user.email,
              homeCountry: user.homeCountry as CorridorId
            });
          }
          onClose();
          resetForm();
        }, 1200);
      } else {
        const { user, error } = await signInUser(email, password);
        setIsLoading(false);
        if (error) {
          setErrorMsg(error);
          return;
        }
        trackEvent('Login', { event_type: 'auth', email });
        setSuccessMsg(language === 'en' ? 'Welcome back!' : 'مرحباً بعودتك!');
        setTimeout(() => {
          if (user) {
            onLoginSuccess({
              name: user.name,
              email: user.email,
              homeCountry: user.homeCountry as CorridorId,
              role: user.role
            });
          }
          onClose();
          resetForm();
        }, 1200);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An authentication error occurred.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const { user, error } = await signInWithGoogle();
      setIsLoading(false);
      if (error) {
        setErrorMsg(error);
        return;
      }
      if (user) {
        trackEvent('Login', { event_type: 'auth', method: 'google', email: user.email });
      }
      setSuccessMsg(language === 'en' ? 'Welcome!' : 'مرحباً بك!');
      setTimeout(() => {
        if (user) {
          onLoginSuccess({
            name: user.name,
            email: user.email,
            homeCountry: user.homeCountry as CorridorId,
            role: user.role
          });
        }
        onClose();
        resetForm();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An authentication error occurred.');
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { type: 'spring', damping: 18, stiffness: 140 }
            }}
            exit={{ 
              scale: 0.92, 
              y: 15, 
              opacity: 0,
              transition: { duration: 0.2 }
            }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden text-left rtl:text-right p-6"
          >
            {/* Close Button */}
            <button
              id="auth-modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Identity */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="dark:hidden">
                <SariRemitLogo variant="full" light={true} />
              </div>
              <div className="hidden dark:block">
                <SariRemitLogo variant="full" light={false} />
              </div>
            </div>

            {/* Tab Toggles */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl mt-5 gap-1.5">
              <button
                type="button"
                id="auth-tab-signup"
                onClick={() => handleTabChange('signup')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Create Account' : 'إنشاء حساب جديد'}
              </button>
              <button
                type="button"
                id="auth-tab-signin"
                onClick={() => handleTabChange('signin')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Log In' : 'تسجيل الدخول'}
              </button>
            </div>

            {/* Form Context */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
              
              {/* Messages */}
              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-450 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                  <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {/* Full Name (Sign Up only) */}
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {language === 'en' ? 'FULL NAME' : 'الاسم الكامل'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 rtl:right-3 rtl:left-auto" />
                    <input
                      type="text"
                      id="auth-input-name"
                      placeholder={language === 'en' ? 'e.g. Hassan Gaturu' : 'مثال: حسن أحمد'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-green-500 rtl:pr-9 rtl:pl-4"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'EMAIL ADDRESS' : 'البريد الإلكتروني'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 rtl:right-3 rtl:left-auto" />
                  <input
                    type="email"
                    id="auth-input-email"
                    placeholder="expat@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-green-500 rtl:pr-9 rtl:pl-4"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'en' ? 'PASSWORD' : 'كلمة المرور'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 rtl:right-3 rtl:left-auto" />
                  <input
                    type="password"
                    id="auth-input-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-green-500 rtl:pr-9 rtl:pl-4"
                  />
                </div>
              </div>

              {/* Home Country (Sign Up only) */}
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {language === 'en' ? 'HOME COUNTRY (CORRIDOR)' : 'بلد الوجهة الرئيسي'}
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-slate-400 w-4 h-4 rtl:right-3 rtl:left-auto" />
                    <select
                      id="auth-input-corridor"
                      value={homeCountry}
                      onChange={(e) => setHomeCountry(e.target.value as CorridorId)}
                      className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white text-xs pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-green-500 cursor-pointer appearance-none rtl:pr-9 rtl:pl-4"
                    >
                      {CORRIDORS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.flag} {language === 'en' ? c.nameEn : c.nameAr} ({c.currencyCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-green-600/10 hover:shadow-green-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>
                        {activeTab === 'signup'
                          ? (language === 'en' ? 'Register & Join' : 'تسجيل والانضمام')
                          : (language === 'en' ? 'Secure Log In' : 'تسجيل دخول آمن')}
                      </span>
                      {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Or continue with' : 'أو المتابعة باستخدام'}
                </span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              {/* Google Auth Button */}
              <div>
                <button
                  type="button"
                  id="auth-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>{language === 'en' ? 'Sign in with Google' : 'تسجيل الدخول باستخدام جوجل'}</span>
                </button>
              </div>

              {onContinueAsGuest && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    id="auth-modal-guest-btn"
                    onClick={() => {
                      onContinueAsGuest();
                      onClose();
                    }}
                    className="text-xs text-green-600 dark:text-green-500 font-bold hover:underline transition-all cursor-pointer block mx-auto"
                  >
                    {language === 'en' ? 'Continue as Guest' : 'المتابعة كزائر'}
                  </button>
                </div>
              )}

              {/* Quick info footer */}
              <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 inline mr-1" />
                {auth 
                  ? (language === 'en' ? '⚡ Connected to Firebase Authentication database.' : '⚡ متصل بقاعدة بيانات هوية فيربيس.')
                  : (language === 'en' ? 'Secure simulated local sandboxed authentication. Your credentials are saved securely in your browser cache.' : 'دخول آمن ومحمي محلياً. يتم حفظ بيانات الاعتماد الخاصة بك بأمان في ذاكرة التخزين المؤقت لمتصفحك.')
                }
              </p>

            </form>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
};
