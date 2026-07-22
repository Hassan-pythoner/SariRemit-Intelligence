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
}

export default function Navigation({
  activeTab,
  setActiveTab,
  language,
  toggleLanguage,
  t,
  profile
}: NavigationProps) {
  const isRtl = language === 'ar';
  const { toggleTheme, resolvedTheme } = useTheme();
  const isLoggedIn = !!profile.email;
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
    navItems.push({ id: 'profile', label: isRtl ? 'الملف الشخصي' : 'Profile', icon: User });
  }

  return (
    <>
      {/* Top sticky header */}
      <header className="sticky top-0 z-50 w-full bg-sds-bg-sidebar/80 backdrop-blur-md border-b border-sds-border shadow-sds-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* 1. LEFT: Genuine Corporate Logo Image (Preserving Proportions) */}
          <div 
            onClick={() => setActiveTab('landing')} 
            className={`flex items-center gap-3 cursor-pointer transition-transform active:scale-98 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <SariRemitLogo variant="primary" size="md" surface={resolvedTheme} showSlogan={true} />
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
                    className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer pb-2 pt-2 border-b-2 hover:-translate-y-[1px] ${
                      isActive
                        ? 'text-sds-text border-sds-primary'
                        : 'text-sds-text-muted border-transparent hover:text-sds-text hover:border-sds-text-sec/30'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-sds-primary' : 'text-sds-text-muted group-hover:text-sds-text'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            /* Redesigned Landing Page anchors */
            <nav className={`hidden md:flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              {publicLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScroll(link.anchor)}
                  className="text-xs font-semibold uppercase tracking-widest text-sds-text-muted hover:text-sds-text transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sds-bg-surface-soft hover:bg-sds-border/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-sds-text transition-colors cursor-pointer border border-sds-border shrink-0"
            >
              <Globe2 className="w-3.5 h-3.5 text-sds-secondary" />
              <span>{language === 'en' ? 'EN | عربي' : 'عربي | EN'}</span>
            </button>

            {/* Theme Toggle Button (Section 9) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center p-2.5 bg-sds-bg-surface-soft hover:bg-sds-border/20 rounded-xl text-sds-text transition-colors cursor-pointer border border-sds-border shrink-0"
            >
              {resolvedTheme === 'dark' ? (
                <span className="text-amber-400 text-[13px] leading-none" role="img" aria-label="light mode">☀️</span>
              ) : (
                <span className="text-indigo-600 text-[13px] leading-none" role="img" aria-label="dark mode">🌙</span>
              )}
            </button>

            {isLoggedIn ? (
              /* Logged In User Capsule - Avatar and Preferred indicator */
              <div 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-2.5 py-1.5 bg-sds-bg-surface-soft border border-sds-border hover:border-sds-primary/40 rounded-xl cursor-pointer transition-all hover:scale-102 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-7 h-7 rounded-full bg-sds-secondary/10 border border-sds-secondary/20 text-sds-secondary flex items-center justify-center font-black text-xs shrink-0 font-mono">
                  {profile.name.charAt(0).toUpperCase() || <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs font-bold text-sds-text hidden lg:inline-block max-w-[90px] truncate">
                  {profile.name}
                </span>
              </div>
            ) : (
              /* Public Visitor CTAs */
              <div className="hidden md:flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('sign-in')}
                  className="text-xs font-bold uppercase tracking-wider text-sds-text-sec hover:text-sds-text"
                >
                  {isRtl ? 'دخول' : 'Sign In'}
                </button>
                <button 
                  onClick={handleCompareClick}
                  className="px-4 py-2 bg-sds-gold hover:bg-sds-gold/90 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sds-sm cursor-pointer"
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
                  className="px-3 py-1.5 bg-sds-gold hover:bg-sds-gold/90 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  {isRtl ? 'قارن' : 'Compare'}
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 text-sds-text hover:text-sds-text-sec rounded-xl border border-sds-border bg-sds-bg-surface shrink-0"
                  aria-label="Toggle Menu"
                >
                  {isMenuOpen ? <X className="w-5 h-5 text-sds-secondary" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 4. SMOOTH MOBILE NAVIGATION DRAWER (Only when menu is open) */}
      {isMenuOpen && !isLoggedIn && (
        <div className="fixed inset-0 z-40 bg-sds-bg flex flex-col pt-20 px-6 space-y-6 md:hidden animate-fadeIn">
          <div className="flex flex-col space-y-4 text-left">
            {publicLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleScroll(link.anchor)}
                className={`text-base font-semibold uppercase tracking-widest text-sds-text hover:text-sds-secondary py-2 border-b border-sds-border flex items-center justify-between ${isRtl ? 'flex-row-reverse text-right' : ''}`}
              >
                <span>{isRtl ? link.labelAr : link.labelEn}</span>
                <ArrowRight className="w-4 h-4 text-sds-text-muted" />
              </button>
            ))}
          </div>

          <div className="pt-6 space-y-4">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setActiveTab('sign-in');
              }}
              className="w-full py-3.5 bg-sds-bg-surface border border-sds-border rounded-xl text-xs font-semibold uppercase tracking-wider text-sds-text"
            >
              {isRtl ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              onClick={handleCompareClick}
              className="w-full py-3.5 bg-sds-gold hover:bg-sds-gold/90 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-sds-md cursor-pointer"
            >
              {isRtl ? 'مقارنة الأسعار الآن' : 'Compare Rates Now'}
            </button>
          </div>
        </div>
      )}

      {/* 5. USER-SIDE MOBILE BOTTOM NAVIGATION (Only for logged-in users to preserve full-app screen flow) */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sds-bg-sidebar/90 backdrop-blur-md border-t border-sds-border shadow-sds-lg px-2 pb-safe">
          <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center">
            {[
              { id: 'dashboard', label: isRtl ? 'الرئيسية' : 'Home', icon: Home },
              { id: 'compare', label: isRtl ? 'المقارنة' : 'Compare', icon: ArrowLeftRight },
              { id: 'submit', label: isRtl ? 'مشاركة' : 'Submit', icon: Plus, isFab: true },
              { id: 'savings', label: isRtl ? 'المدخرات' : 'Savings', icon: PiggyBank },
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
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sds-md transition-all ${
                      isActive 
                        ? 'bg-sds-gold text-slate-950 scale-95 font-bold' 
                        : 'bg-sds-gold text-slate-950 hover:scale-105 active:scale-95 font-bold'
                    }`}>
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className={`text-[9px] font-bold tracking-tight mt-1 truncate max-w-full px-1 ${
                      isActive ? 'text-sds-text font-semibold' : 'text-sds-text-muted'
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
                  <div className={`px-4 py-1 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-sds-bg-surface text-sds-text' 
                      : 'text-sds-text-muted hover:text-sds-text'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold tracking-tight mt-1 truncate max-w-full px-1 ${
                    isActive ? 'text-sds-text font-semibold' : 'text-sds-text-muted'
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
