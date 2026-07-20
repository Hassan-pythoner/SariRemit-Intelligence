import React, { useState, useEffect } from 'react';
import { TranslationDict, UserProfile } from '../types';
import { 
  ArrowLeftRight, Bell, Compass, PlusCircle, User, UserPlus, Globe2, Sparkles, 
  LayoutDashboard, PiggyBank, Info, CheckCircle2, Home, Plus, Menu, X, ArrowRight, ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { SariRemitLogo } from './SdsBamComponents';
import NotificationCenter from './NotificationCenter';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'en' | 'ar';
  toggleLanguage: () => void;
  t: TranslationDict;
  profile: UserProfile;
  srcmcAccess?: any;
  srcmcAccessLoading?: boolean;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  language,
  toggleLanguage,
  t,
  profile,
  srcmcAccess,
  srcmcAccessLoading
}: NavigationProps) {
  const isRtl = language === 'ar';
  const { toggleTheme, resolvedTheme } = useTheme();
  const isLoggedIn = !!profile.email;
  const canSeeSrcmcNav = srcmcAccess?.is_active === true;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Handle scrolling to landing page anchors smoothly
  const handleScroll = (anchorId: string) => {
    setIsMenuOpen(false);
    if (activeTab !== 'landing') {
      setActiveTab('landing');
      setTimeout(() => {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const element = document.getElementById(anchorId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleCompareClick = () => {
    setIsMenuOpen(false);
    if (isLoggedIn) {
      setActiveTab('compare');
    } else {
      setActiveTab('sign-in');
    }
  };

  // Public Links for Visitor Redesign Navigation
  const publicLinks = [
    { labelEn: "Home", labelAr: "الرئيسية", anchor: "home" },
    { labelEn: "About", labelAr: "من نحن", anchor: "about" },
    { labelEn: "How It Works", labelAr: "كيف نعمل", anchor: "how-it-works" },
    { labelEn: "Why SariRemit", labelAr: "لماذا ساري", anchor: "why-sariremit" },
    { labelEn: "Trust", labelAr: "ميثاق الشفافية", anchor: "trust" },
    { labelEn: "FAQ", labelAr: "الأسئلة الشائعة", anchor: "faq" },
    { labelEn: "Contact", labelAr: "اتصل بنا", anchor: "contact" }
  ];

  // Logged-in App Navigation Items (Icons accompany navigation as per Sds specification)
  const navItems = [];
  if (isLoggedIn) {
    navItems.push({ id: 'dashboard', label: isRtl ? 'الرئيسية' : 'Home', icon: Home });
    navItems.push({ id: 'compare', label: isRtl ? 'مقارنة الأسعار' : 'Compare', icon: ArrowLeftRight });
    navItems.push({ id: 'submit', label: isRtl ? 'توثيق الحوالات' : 'Verify', icon: PlusCircle });
    navItems.push({ id: 'savings', label: isRtl ? 'المدخرات' : 'Savings', icon: PiggyBank });
    navItems.push({ id: 'support', label: isRtl ? 'الدعم الفني' : 'Support', icon: MessageSquare });
    if (canSeeSrcmcNav) {
      navItems.push({ id: 'srcmc', label: isRtl ? 'لوحة التحكم' : 'SRCMC', icon: ShieldCheck });
    }
    navItems.push({ id: 'profile', label: isRtl ? 'الملف الشخصي' : 'Profile', icon: User });
  }

  return (
    <>
      {/* Top sticky header */}
      <header className="sticky top-0 z-50 w-full bg-[#051326] border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* 1. LEFT: Genuine Corporate Logo Image (Preserving Proportions) */}
          <div 
            onClick={() => setActiveTab('landing')} 
            className={`flex items-center gap-3 cursor-pointer transition-transform active:scale-98 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <SariRemitLogo variant="primary" size="md" surface="dark" showSlogan={true} />
          </div>

          {/* 2. CENTER NAVIGATION */}
          {isLoggedIn ? (
            /* Logged in Desktop items with icons */
            <nav className={`hidden md:flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`nav-desktop-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer pb-2 pt-2 border-b-2 hover:-translate-y-[1px] ${
                      isActive
                        ? 'text-amber-400 border-amber-400'
                        : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            /* Redesigned Landing Page anchors */
            <nav className={`hidden md:flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              {publicLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScroll(link.anchor)}
                  className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {isRtl ? link.labelAr : link.labelEn}
                </button>
              ))}
            </nav>
          )}

          {/* 3. RIGHT ACTIONS */}
          <div className={`flex items-center gap-3.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Notification Bell (Only when logged in) */}
            {isLoggedIn && (
              <NotificationCenter 
                userId={profile.id} 
                language={language} 
                setActiveTab={setActiveTab} 
              />
            )}

            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors cursor-pointer border border-slate-800 shrink-0 font-mono"
            >
              <Globe2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'EN | عربي' : 'عربي | EN'}</span>
            </button>

            {/* Theme Toggle Button (Section 9) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-200 transition-colors cursor-pointer border border-slate-800 shrink-0"
            >
              {resolvedTheme === 'dark' ? (
                <span className="text-amber-400 text-[13px] leading-none" role="img" aria-label="light mode">☀️</span>
              ) : (
                <span className="text-indigo-400 text-[13px] leading-none" role="img" aria-label="dark mode">🌙</span>
              )}
            </button>

            {isLoggedIn ? (
              /* Logged In User Capsule - Avatar and Preferred indicator */
              <div 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-2 py-1 bg-slate-900/60 border border-slate-800 hover:border-amber-400/40 rounded-xl cursor-pointer transition-all hover:scale-102 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 font-mono">
                  {profile.name.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-bold text-slate-200 hidden lg:inline-block max-w-[90px] truncate">
                  {profile.name}
                </span>
              </div>
            ) : (
              /* Public Visitor CTAs */
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('sign-in')}
                  className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                >
                  {isRtl ? 'دخول' : 'Sign In'}
                </button>
                <button 
                  onClick={handleCompareClick}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {isRtl ? 'مقارنة الأسعار' : 'Compare Rates'}
                </button>
              </div>
            )}

            {/* Compact Mobile Hamburger (Only for public view / guests) */}
            {!isLoggedIn && (
              <div className="md:hidden flex items-center gap-2">
                <button 
                  onClick={handleCompareClick}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  {isRtl ? 'قارن' : 'Compare'}
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 text-slate-200 hover:text-white rounded-lg border border-slate-800 bg-slate-900 shrink-0"
                  aria-label="Toggle Menu"
                >
                  {isMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 4. SMOOTH MOBILE NAVIGATION DRAWER (Only when menu is open) */}
      {isMenuOpen && !isLoggedIn && (
        <div className="fixed inset-0 z-40 bg-[#051326] flex flex-col pt-20 px-6 space-y-6 md:hidden animate-fadeIn">
          <div className="flex flex-col space-y-4 text-left">
            {publicLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleScroll(link.anchor)}
                className={`text-base font-black uppercase tracking-widest text-slate-200 hover:text-amber-400 py-2 border-b border-slate-850 flex items-center justify-between ${isRtl ? 'flex-row-reverse text-right' : ''}`}
              >
                <span>{isRtl ? link.labelAr : link.labelEn}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="pt-6 space-y-4">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setActiveTab('sign-in');
              }}
              className="w-full py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-200"
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              onClick={handleCompareClick}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg"
            >
              {isRtl ? 'مقارنة الأسعار الآن' : 'Compare Rates Now'}
            </button>
          </div>
        </div>
      )}

      {/* 5. USER-SIDE MOBILE BOTTOM NAVIGATION (Only for logged-in users to preserve full-app screen flow) */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#051326] border-t border-slate-800 shadow-xl px-2 pb-safe">
          <div className={`grid ${canSeeSrcmcNav ? 'grid-cols-6' : 'grid-cols-5'} h-16 max-w-lg mx-auto items-center`}>
            {[
              { id: 'dashboard', label: isRtl ? 'الرئيسية' : 'Home', icon: Home },
              { id: 'compare', label: isRtl ? 'المقارنة' : 'Compare', icon: ArrowLeftRight },
              { id: 'submit', label: isRtl ? 'مشاركة' : 'Submit', icon: Plus, isFab: true },
              { id: 'savings', label: isRtl ? 'المدخرات' : 'Savings', icon: PiggyBank },
              ...(canSeeSrcmcNav ? [{ id: 'srcmc', label: isRtl ? 'لوحة التحكم' : 'SRCMC', icon: ShieldCheck }] : []),
              { id: 'profile', label: isRtl ? 'الحساب' : 'Profile', icon: User }
            ].map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              if ('isFab' in item && item.isFab) {
                return (
                  <button
                    key={item.id}
                    id={`nav-mobile-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className="flex flex-col items-center justify-center -mt-5 focus:outline-none cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isActive 
                        ? 'bg-amber-400 text-slate-900 scale-95' 
                        : 'bg-amber-400 text-slate-900 hover:scale-105 active:scale-95'
                    }`}>
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className={`text-[9px] font-black tracking-tight mt-1 truncate max-w-full px-1 ${
                      isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`nav-mobile-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center focus:outline-none cursor-pointer"
                >
                  <div className={`px-4 py-1 rounded-full transition-all ${
                    isActive 
                      ? 'bg-slate-900 text-amber-400' 
                      : 'text-slate-400 hover:text-amber-400'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-black tracking-tight mt-1 truncate max-w-full px-1 ${
                    isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
