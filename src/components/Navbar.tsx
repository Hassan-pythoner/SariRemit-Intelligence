import React, { useState, useEffect, useRef } from 'react';
import { SariRemitLogo } from './SariRemitLogo';
import { useLanguage } from './LanguageContext';
import { 
  Menu, X, ArrowLeftRight, TrendingUp, Bell, User, PlusCircle, Home, 
  Languages, LogIn, LogOut, ShieldCheck, Lock, Sun, Moon, Search, 
  ChevronDown, BookOpen, HelpCircle, FileText, Info, Award, Brain, Users,
  CheckCircle, Landmark, Sparkles, MapPin
} from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  userLevel: string;
  totalSaved: number;
  userSession: any;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onSelectResourceTab?: (tab: string) => void;
  notifications?: any[];
  isNotificationDropdownOpen?: boolean;
  setIsNotificationDropdownOpen?: (open: boolean) => void;
  markAllNotificationsAsRead?: () => void;
  clearAllNotifications?: () => void;
  markNotificationAsRead?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  userLevel, 
  totalSaved,
  userSession,
  onOpenAuthModal,
  onSignOut,
  onSelectResourceTab,
  notifications = [],
  isNotificationDropdownOpen = false,
  setIsNotificationDropdownOpen,
  markAllNotificationsAsRead,
  clearAllNotifications,
  markNotificationAsRead
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const isEn = language === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rotating Trust Strip State
  const trustMessages = [
    isEn ? 'Independent Recommendations (No Bank Affiliation)' : 'توصيات مستقلة بالكامل (بدون تبعية لأي بنك)',
    isEn ? 'Powered by Verified Intelligence & RRE Engine' : 'بدعم من الذكاء الاصطناعي ومحرك تسوية الأسعار RRE',
    isEn ? 'Community Verified Rates via Live Screenshot Audits' : 'أسعار صرف مؤكدة من المجتمع عبر لقطات الشاشة المباشرة',
    isEn ? 'Helping Expats Make Every Riyal Count 🇸🇦' : 'مساعدة المغتربين في توفير كل ريال ذي قيمة 🇸🇦',
    isEn ? 'Rates and Fees Updated Every Few Minutes' : 'يتم تحديث الأسعار والرسوم كل بضع دقائق تلقائياً'
  ];
  const [trustIndex, setTrustIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Rotation timer for trust strip
    const rotationTimer = setInterval(() => {
      setTrustIndex((prev) => (prev + 1) % trustMessages.length);
    }, 4500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(rotationTimer);
    };
  }, [language]);

  const primaryNavItems = !userSession 
    ? [
        { id: 'landing', labelEn: 'Home', labelAr: 'الرئيسية' },
        { id: 'how-it-works', labelEn: 'How It Works', labelAr: 'كيف نعمل' },
        { id: 'about', labelEn: 'About', labelAr: 'من نحن' },
        { id: 'resources', labelEn: 'Resources', labelAr: 'الموارد' },
      ]
    : [
        { id: 'landing', labelEn: 'Home', labelAr: 'الرئيسية' },
        { id: 'compare', labelEn: 'Compare Rates', labelAr: 'مقارنة أسعار الصرف' },
        { id: 'community', labelEn: 'Community', labelAr: 'المجتمع' },
        { id: 'insights', labelEn: 'Insights', labelAr: 'الرؤى والتحليلات' },
      ];

  const resourceDropdownItems = [
    { id: 'faq', labelEn: 'FAQs', labelAr: 'الأسئلة الشائعة', icon: HelpCircle },
    { id: 'help', labelEn: 'Help Center', labelAr: 'مركز المساعدة', icon: Info },
    { id: 'glossary', labelEn: 'Rate Glossary', labelAr: 'قاموس المصطلحات', icon: BookOpen },
    { id: 'savings-guide', labelEn: 'Savings Guide', labelAr: 'دليل التوفير المالي', icon: Sparkles },
    { id: 'blog', labelEn: 'Blog', labelAr: 'المدونة', icon: FileText },
    { id: 'contact', labelEn: 'Contact Us', labelAr: 'اتصل بنا', icon: User },
    { id: 'privacy', labelEn: 'Privacy Policy', labelAr: 'سياسة الخصوصية', icon: FileText },
    { id: 'terms', labelEn: 'Terms of Service', labelAr: 'شروط الخدمة', icon: ShieldCheck },
    { id: 'charter', labelEn: 'Trust Charter', labelAr: 'ميثاق الثقة', icon: Award }
  ];

  // Searchable contents
  const searchableIndex = [
    { type: 'Page', titleEn: 'Home', titleAr: 'الرئيسية', dest: 'landing' },
    { type: 'Page', titleEn: 'Compare Rates Tool', titleAr: 'أداة مقارنة الأسعار', dest: 'compare' },
    { type: 'Page', titleEn: 'How It Works / RRE Engine', titleAr: 'محرك تسوية الأسعار RRE', dest: 'how-it-works' },
    { type: 'Page', titleEn: 'About SariRemit', titleAr: 'من نحن وقصتنا', dest: 'about' },
    { type: 'Page', titleEn: 'Community Trust Hub', titleAr: 'ثقة المجتمع والمشاركات', dest: 'community' },
    { type: 'Page', titleEn: 'Corridor Insights & Analytics', titleAr: 'تحليلات الرؤى والوجهات', dest: 'insights' },
    
    // Wallet channels
    { type: 'Provider', titleEn: 'urpay (Al Rajhi Bank)', titleAr: 'يورباي (بنك الراجحي)', dest: 'compare' },
    { type: 'Provider', titleEn: 'stc pay (stc bank)', titleAr: 'إس تي سي باي', dest: 'compare' },
    { type: 'Provider', titleEn: 'Mobily Pay', titleAr: 'موبايلي باي', dest: 'compare' },
    { type: 'Provider', titleEn: 'Enjaz QuickPay', titleAr: 'إنجاز بنك البلاد', dest: 'compare' },

    // Country Corridors
    { type: 'Corridor', titleEn: 'Pakistan (PKR)', titleAr: 'باكستان', dest: 'compare' },
    { type: 'Corridor', titleEn: 'India (INR)', titleAr: 'الهند', dest: 'compare' },
    { type: 'Corridor', titleEn: 'Philippines (PHP)', titleAr: 'الفلبين', dest: 'compare' },
    { type: 'Corridor', titleEn: 'Kenya (KES)', titleAr: 'كينيا', dest: 'compare' },
    { type: 'Corridor', titleEn: 'Bangladesh (BDT)', titleAr: 'بنجلاديش', dest: 'compare' },
    { type: 'Corridor', titleEn: 'Egypt (EGP)', titleAr: 'مصر', dest: 'compare' },

    // Resources tabs
    { type: 'Resource', titleEn: 'Frequently Asked Questions (FAQs)', titleAr: 'الأسئلة الشائعة', dest: 'resources', subTab: 'faq' },
    { type: 'Resource', titleEn: 'Help Center Support', titleAr: 'مركز المساعدة والدعم', dest: 'resources', subTab: 'help' },
    { type: 'Resource', titleEn: 'Exchange Rate Glossary', titleAr: 'قاموس مصطلحات الأسعار', dest: 'resources', subTab: 'glossary' },
    { type: 'Resource', titleEn: 'Expat Savings Guide', titleAr: 'دليل التوفير المالي للمغتربين', dest: 'resources', subTab: 'savings-guide' },
    { type: 'Resource', titleEn: 'Insights Blog', titleAr: 'مدونة المقالات', dest: 'resources', subTab: 'blog' },
    { type: 'Resource', titleEn: 'Contact Us / Support', titleAr: 'اتصل بنا', dest: 'resources', subTab: 'contact' },
    { type: 'Resource', titleEn: 'Privacy and Cookies Policy', titleAr: 'سياسة الخصوصية والكوكيز', dest: 'resources', subTab: 'privacy' },
    { type: 'Resource', titleEn: 'Saudi Regulatory Terms & Conditions', titleAr: 'الشروط والأحكام الخاصة بالأنظمة السعودية', dest: 'resources', subTab: 'terms' },
    { type: 'Resource', titleEn: 'Our Core Trust Charter', titleAr: 'ميثاق الأمان والنزاهة للأسعار', dest: 'resources', subTab: 'charter' }
  ];

  const filteredSearchResults = searchQuery.trim() === '' ? [] : searchableIndex.filter(item => {
    const textEn = (item.titleEn + ' ' + item.type).toLowerCase();
    const textAr = (item.titleAr + ' ' + item.type).toLowerCase();
    const query = searchQuery.toLowerCase();
    return textEn.includes(query) || textAr.includes(query);
  });

  const handleSearchResultClick = (item: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (item.dest === 'resources') {
      if (onSelectResourceTab) {
        onSelectResourceTab(item.subTab);
      }
      setCurrentPage('resources');
    } else {
      setCurrentPage(item.dest);
    }
  };

  const handleResourceDropdownClick = (subId: string) => {
    setIsResourcesOpen(false);
    if (onSelectResourceTab) {
      onSelectResourceTab(subId);
    }
    const element = document.getElementById('resources-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentPage('resources');
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full transition-all duration-300">
      
      {/* 1. Glassmorphism Top Sticky Navbar Container */}
      <nav className={`w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#071a34]/85 backdrop-blur-md border-b border-emerald-500/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]' 
          : 'bg-[#071a34] border-b border-white/5 py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* LEFT SIDE: SariRemit Premium Logo */}
            <SariRemitLogo 
              variant="horizontal" 
              onClick={() => setCurrentPage('landing')} 
            />

            {/* MIDDLE: Primary Navigation Items with Microinteractions */}
            <div className="hidden lg:flex items-center gap-1">
              {primaryNavItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`px-3 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-250 relative cursor-pointer group ${
                      isActive 
                        ? 'text-[#00E07A]' 
                        : 'text-slate-350 hover:text-white'
                    }`}
                  >
                    <span>{isEn ? item.labelEn : item.labelAr}</span>
                    
                    {/* Active page gold underline indicator animation & subtle glow */}
                    {isActive ? (
                      <>
                        <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-amber-400 to-[#00E07A] rounded-full" />
                        <span className="absolute inset-0 bg-[#00E07A]/5 rounded-xl filter blur-sm -z-10" />
                      </>
                    ) : (
                      <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-amber-400 transition-all duration-300 group-hover:left-2 group-hover:w-[calc(100%-16px)] rounded-full" />
                    )}
                  </button>
                );
              })}

              {/* RESOURCES DROPDOWN MENU - Only shown on Landing Page (not logged in) */}
              {!userSession && (
                <div className="relative">
                  <button
                    onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                    onBlur={() => setTimeout(() => setIsResourcesOpen(false), 200)}
                    className={`px-3 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-250 flex items-center gap-1 cursor-pointer ${
                      currentPage === 'resources' ? 'text-[#00E07A]' : 'text-slate-350 hover:text-white'
                    }`}
                  >
                    <span>{isEn ? 'Resources' : 'الموارد'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Animated resources dropdown menu block */}
                  {isResourcesOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-[#0B1E35] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 grid grid-cols-1 gap-1 animate-fade-in text-white text-left rtl:text-right">
                      {resourceDropdownItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            onMouseDown={() => handleResourceDropdownClick(sub.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                          >
                            <SubIcon className="w-4 h-4 text-[#00E07A]" />
                            <span>{isEn ? sub.labelEn : sub.labelAr}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDE ACTIONS: Search, Language switcher, Get Started primary CTA, Sign In / Join */}
            <div className="hidden lg:flex items-center gap-3">
              
              {/* Optional Search Trigger */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 text-slate-300 hover:text-[#00E07A] hover:border-[#00C16A]/20 transition-all cursor-pointer"
                title={isEn ? 'Search' : 'بحث'}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 text-slate-300 hover:text-[#00E07A] hover:border-[#00C16A]/20 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono font-bold tracking-widest uppercase"
                title="Switch Language"
              >
                <Languages className="w-4.5 h-4.5 text-[#00E07A]" />
                <span>{isEn ? 'Ar' : 'En'}</span>
              </button>

              {/* Guest / Auth buttons */}
              {!userSession ? (
                <>
                  <button
                    onClick={onOpenAuthModal}
                    className="px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-white/5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {isEn ? 'Sign In' : 'تسجيل دخول'}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 bg-[#10263D] border border-white/5 rounded-xl px-2.5 py-1">
                  <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-[#00C16A] to-[#00E07A] text-[#071326] flex items-center justify-center font-bold text-xs">
                    {userSession.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left rtl:text-right leading-none">
                    <span className="text-[11px] font-bold text-white max-w-[80px] truncate">{userSession.name}</span>
                    <span className="text-[9px] text-[#00E07A] font-mono font-bold uppercase">{userSession.isGuest ? 'Guest' : 'Member'}</span>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="p-1 hover:bg-red-500/10 rounded-md text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                    title={isEn ? 'Sign Out' : 'تسجيل الخروج'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Get Started - Primary Green CTA */}
              <button
                onClick={() => {
                  if (userSession?.isGuest) {
                    onOpenAuthModal();
                  } else {
                    setCurrentPage('compare');
                  }
                }}
                className="px-5 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-102 cursor-pointer shadow-md shadow-[#00C16A]/10"
              >
                {isEn ? 'Get Started' : 'ابدأ الآن'}
              </button>
            </div>

            {/* Mobile / Tablet Hamburger & Search trigger */}
            <div className="flex items-center lg:hidden gap-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 bg-slate-800/60 rounded-lg text-slate-300"
              >
                <Search className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-slate-800/60 rounded-lg text-slate-300 hover:text-white"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 2. ROTATING TRUST BAR - Slim strip directly below the navbar */}
      <div className="w-full bg-[#01100e] border-y border-emerald-500/10 py-2.5 text-center relative overflow-hidden shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00E07A] animate-pulse shrink-0" />
          <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase text-slate-300 font-mono transition-opacity duration-300">
            {trustMessages[trustIndex]}
          </span>
        </div>
      </div>

      {/* 3. MOBILE DROPDOWN HAMBURGER MENU */}
      {isOpen && (
        <div className="lg:hidden bg-[#071326] border-b border-white/5 px-4 pt-2 pb-6 space-y-3 text-white text-left rtl:text-right">
          {primaryNavItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  isActive 
                    ? 'bg-[#10263D] border-[#00C16A]/30 text-[#00E07A]' 
                    : 'hover:bg-white/5 border-transparent text-slate-450'
                }`}
              >
                <span>{isEn ? item.labelEn : item.labelAr}</span>
              </button>
            );
          })}

          {/* Resources Mobile List */}
          {!userSession && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase pl-4">{isEn ? 'Resources Directory' : 'الموارد والأدلة'}</span>
              <div className="grid grid-cols-2 gap-1.5 pl-2">
                {resourceDropdownItems.slice(0, 6).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      handleResourceDropdownClick(sub.id);
                      setIsOpen(false);
                    }}
                    className="text-left rtl:text-right px-3 py-1.5 bg-slate-800/30 rounded-lg text-[11px] text-slate-300 hover:text-white"
                  >
                    {isEn ? sub.labelEn : sub.labelAr}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
            {/* Mobile language switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 rounded-xl text-xs text-slate-350"
            >
              <Languages className="w-4 h-4 text-[#00E07A]" />
              <span>{isEn ? 'Ar العربية' : 'En English'}</span>
            </button>

            {/* Mobile login/register */}
            {!userSession ? (
              <button
                onClick={() => {
                  onOpenAuthModal();
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-[#00C16A] text-[#071326] text-xs font-bold rounded-xl"
              >
                {isEn ? 'Sign In' : 'دخول'}
              </button>
            ) : (
              <button
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl"
              >
                {isEn ? 'Sign Out' : 'خروج'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE SEARCH OVERLAY MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-start justify-center p-4 pt-16 md:pt-24 animate-fade-in text-white">
          <div className="bg-[#10263D] border border-white/10 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title / Description */}
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#00E07A] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                <span>{isEn ? 'Remittance Search Intelligence' : 'ذكاء البحث والتحري'}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEn ? 'Search providers, countries, tutorials, guidelines, resources, or FAQs:' : 'ابحث عن الشركات، الدول، الأدلة، المصطلحات، أو الأسئلة الشائعة:'}
              </p>
            </div>

            {/* Search Input field */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Type provider or country (e.g. urpay, Pakistan)...' : 'اكتب اسم الشركة أو الدولة للبحث...'}
                className="w-full bg-[#071326] text-xs text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-[#00C16A] pl-10"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>

            {/* Results output list */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchQuery.trim() !== '' && filteredSearchResults.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-450">
                  {isEn ? 'No matching resources or guides found.' : 'لم يتم العثور على أي نتائج مطابقة.'}
                </p>
              )}

              {filteredSearchResults.map((result, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSearchResultClick(result)}
                  className="p-2.5 bg-slate-900/40 hover:bg-[#00E07A]/10 border border-white/5 hover:border-[#00C16A]/20 rounded-xl cursor-pointer transition-all flex items-center justify-between text-left rtl:text-right"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">{isEn ? result.titleEn : result.titleAr}</p>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{result.type}</span>
                  </div>
                  <span className="text-[10px] text-[#00E07A] font-mono font-bold">Go →</span>
                </div>
              ))}

              {searchQuery.trim() === '' && (
                <div className="space-y-2.5 pt-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">{isEn ? 'Quick Suggestions' : 'اقتراحات سريعة'}</span>
                  <div className="flex flex-wrap gap-2">
                    {['urpay', 'stc pay', 'Pakistan', 'FAQ', 'Savings Guide'].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-2.5 py-1.5 bg-slate-800/40 hover:bg-slate-800 rounded-lg text-[10px] font-semibold text-slate-350 border border-white/5"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
