import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { 
  HelpCircle, BookOpen, FileText, Landmark, ShieldCheck, Mail, Compass, Sparkles, 
  ChevronDown, ChevronUp, Star, Phone, MessageSquare, MapPin
} from 'lucide-react';

interface ResourcesProps {
  initialResource?: string;
  setCurrentPage: (page: string) => void;
}

export const Resources: React.FC<ResourcesProps> = ({ initialResource = 'faq', setCurrentPage }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState<string>(initialResource);

  useEffect(() => {
    setActiveTab(initialResource);
  }, [initialResource]);

  const tabs = [
    { id: 'faq', labelEn: 'FAQs', labelAr: 'الأسئلة الشائعة' },
    { id: 'help', labelEn: 'Help Center', labelAr: 'مركز المساعدة' },
    { id: 'glossary', labelEn: 'Rate Glossary', labelAr: 'قاموس المصطلحات' },
    { id: 'savings-guide', labelEn: 'Savings Guide', labelAr: 'دليل التوفير' },
    { id: 'blog', labelEn: 'Blog', labelAr: 'المدونة' },
    { id: 'contact', labelEn: 'Contact Us', labelAr: 'اتصل بنا' },
    { id: 'privacy', labelEn: 'Privacy Policy', labelAr: 'سياسة الخصوصية' },
    { id: 'terms', labelEn: 'Terms of Service', labelAr: 'شروط الخدمة' },
    { id: 'charter', labelEn: 'Trust Charter', labelAr: 'ميثاق الثقة' }
  ];

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      qEn: 'How does SariRemit calculate optimal savings?',
      qAr: 'كيف يحسب ساري ريميت التوفير الأمثل؟',
      aEn: 'We subtract the total cost (fee + hidden exchange rate markup) of the best provider from the worst provider or standard physical bank averages, showing you exactly how much extra money your family receives.',
      aAr: 'نطرح التكلفة الإجمالية (الرسوم + هامش سعر الصرف المخفي) لأفضل عرض من العرض الأسوأ أو من متوسط البنوك التقليدية لتوضيح المبلغ الإضافي الدقيق الذي ستحصل عليه عائلتك.'
    },
    {
      qEn: 'Is my personal data safe on SariRemit?',
      qAr: 'هل بياناتي الشخصية آمنة في ساري ريميت؟',
      aEn: 'Absolutely. We do not store or transmit financial information, nor do we require bank credentials. Your email session is secured via industry-standard tokens.',
      aAr: 'بالتأكيد. نحن لا نخزن ولا ننقل أي معلومات مالية، ولا نطلب بيانات حساباتك البنكية. جلسة بريدك الإلكتروني مؤمنة بالكامل.'
    },
    {
      qEn: 'What is the Rate Resolution Engine (RRE)?',
      qAr: 'ما هو محرك تسوية وثقة الأسعار (RRE)؟',
      aEn: 'Our proprietary algorithm that handles data verification. It filters out anomalies and ranks prices based on time freshness, contributor reputation, and live digital API validations.',
      aAr: 'خوارزميتنا الخاصة بالتحقق من دقة البيانات وتصفية الشوائب، وتصنيف عروض الأسعار حسب وقت تحديثها وسمعة المساهم.'
    }
  ];

  const glossaryItems = [
    { termEn: 'Mid-Market Rate', termAr: 'سعر السوق المتوسط', defEn: 'The midpoint between the buy and sell prices of two currencies on the global market.', defAr: 'نقطة المنتصف بين أسعار شراء وبيع العملات في السوق العالمية.' },
    { termEn: 'Exchange Rate Markup', termAr: 'هامش سعر الصرف', defEn: 'The hidden percentage added to the mid-market rate by providers to generate profit.', defAr: 'النسبة المئوية المخفية التي يضيفها موفر الخدمة لزيادة أرباحه.' },
    { termEn: 'OCR Verification', termAr: 'التحقق الضوئي للقطات الشاشة', defEn: 'Optical Character Recognition used to scan uploaded transaction screenshots to verify community-submitted rates.', defAr: 'تقنية التعرف الضوئي لقراءة لقطات الشاشة المرفوعة من المجتمع وتأكيد أسعار الصرف.' }
  ];

  const blogs = [
    { date: 'June 25, 2026', titleEn: 'stc pay vs urpay: The Ultimate Comparison', descEn: 'We pit Saudi Arabia\'s biggest digital wallet giants against each other.' },
    { date: 'May 18, 2026', titleEn: 'Maximizing Your Transfers with the 2026 Savings Guide', descEn: 'Practical steps for expat workers to save over 2,500 SAR annually.' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white text-left rtl:text-right animate-fade-in space-y-8">
      
      {/* Header Block */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00C16A]/10 border border-[#00C16A]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#00E07A] font-mono tracking-wider uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isEn ? 'SariRemit Resource Directory' : 'دليل الموارد والتعليم'}</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight leading-tight">
          {isEn ? 'Guides, Support & Trust Policies' : 'الأدلة والمساعدة وسياسات الثقة'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left sidebar tabs */}
        <div className="md:col-span-3 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 gap-2 md:gap-1.5 scrollbar-none shrink-0 snap-x">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap snap-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeTab === tab.id
                  ? 'bg-[#10263D] border-[#00C16A]/30 text-[#00E07A] glow-green'
                  : 'hover:bg-white/5 border-transparent text-slate-400'
              } md:w-full text-left rtl:text-right`}
            >
              {isEn ? tab.labelEn : tab.labelAr}
            </button>
          ))}
        </div>

        {/* Right content view */}
        <div className="md:col-span-9 bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl min-h-[400px]">
          
          {/* FAQ VIEW */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Frequently Asked Questions' : 'الأسئلة الشائعة'}</span>
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-3">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center text-left rtl:text-right text-xs md:text-sm font-bold text-white hover:text-[#00E07A] transition-colors py-1 cursor-pointer"
                    >
                      <span>{isEn ? faq.qEn : faq.qAr}</span>
                      {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {openFaq === idx && (
                      <p className="text-slate-400 text-xs leading-relaxed mt-2 pl-2">
                        {isEn ? faq.aEn : faq.aAr}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HELP CENTER VIEW */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Help & Support Center' : 'مركز المساعدة والدعم'}</span>
              </h3>
              <div className="space-y-4 text-xs md:text-sm text-slate-350 leading-relaxed">
                <p>
                  {isEn
                    ? 'Welcome to the SariRemit support desk. We are here to ensure you get unbiased assistance. If you spot wrong rates, or encounter system loading issues, reach out immediately.'
                    : 'مرحباً بك في مكتب دعم ساري ريميت. نحن هنا لمساعدتك والتأكد من حصولك على تجربة سلسة. إذا لاحظت أي أسعار غير دقيقة، تواصل معنا.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <h5 className="font-bold text-white text-xs">📬 Email Support</h5>
                    <p className="text-[11px] text-slate-400">support@sariremit.com</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <h5 className="font-bold text-white text-xs">⚡ Fast Ticket</h5>
                    <p className="text-[11px] text-slate-400">Use "Report Issue" in the footer</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RATE GLOSSARY VIEW */}
          {activeTab === 'glossary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Rate Glossary' : 'قاموس المصطلحات'}</span>
              </h3>
              <div className="space-y-4">
                {glossaryItems.map((item, idx) => (
                  <div key={idx} className="space-y-1 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                    <h5 className="font-bold text-[#00E07A] text-xs md:text-sm">
                      {isEn ? item.termEn : item.termAr}
                    </h5>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {isEn ? item.defEn : item.defAr}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAVINGS GUIDE VIEW */}
          {activeTab === 'savings-guide' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Savings Guide' : 'دليل التوفير المالي'}</span>
              </h3>
              <div className="space-y-4 text-xs md:text-sm text-slate-350 leading-relaxed">
                <p>
                  {isEn
                    ? 'Maximize your transfer value with our 3-step optimal savings strategy:'
                    : 'ضاعف قيمة تحويلاتك المالية باتباع استراتيجيتنا البسيطة المكونة من ٣ خطوات للادخار الأمثل:'}
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li><strong>Compare before every send</strong>: Rates fluctuate hourly; yesterday\'s best app might be today\'s worst.</li>
                  <li><strong>Watch the markup spread</strong>: Do not just trust "zero fee" marketing slogans. Check the true exchange rate difference.</li>
                  <li><strong>Setup Price Alerts</strong>: Set targets for high rates so you receive instant triggers.</li>
                </ol>
              </div>
            </div>
          )}

          {/* BLOG VIEW */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'SariRemit Insights Blog' : 'مدونة ساري ريميت'}</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {blogs.map((b, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{b.date}</span>
                    <h5 className="font-bold text-white text-xs sm:text-sm">{b.titleEn}</h5>
                    <p className="text-slate-400 text-xs leading-relaxed">{b.descEn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT US VIEW */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Contact Us' : 'اتصل بنا'}</span>
              </h3>
              <div className="space-y-4 text-xs md:text-sm text-slate-350">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-2">
                    <Mail className="w-5 h-5 text-[#00E07A]" />
                    <span className="font-bold text-white text-xs">Email</span>
                    <span className="text-[10px] text-slate-400">support@sariremit.com</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-2">
                    <MessageSquare className="w-5 h-5 text-[#00E07A]" />
                    <span className="font-bold text-white text-xs">Community Support</span>
                    <span className="text-[10px] text-slate-400">24/7 Portal</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center text-center space-y-2">
                    <MapPin className="w-5 h-5 text-[#00E07A]" />
                    <span className="font-bold text-white text-xs">Location</span>
                    <span className="text-[10px] text-slate-400">Riyadh, Saudi Arabia</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY VIEW */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Privacy Policy' : 'سياسة الخصوصية'}</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <p>
                  SariRemit respects your privacy. We do NOT collect, store, or sell any transaction values or banking credentials. Any account data you provide is used solely to configure notifications and alerts, and is persisted securely under Google Firebase/Supabase encryption standards.
                </p>
                <p>
                  Cookies are strictly limited to caching preferences such as dark theme state and language settings.
                </p>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE VIEW */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Terms of Service' : 'شروط وأحكام الخدمة'}</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <p>
                  By accessing SariRemit, you understand that all exchange rates and comparisons are retrieved on an "as-is" basis and are subject to immediate changes by digital wallet operators. SariRemit is an independent directory, and you hold full financial accountability for transactions executed inside third-party applications.
                </p>
              </div>
            </div>
          )}

          {/* TRUST CHARTER VIEW */}
          {activeTab === 'charter' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00E07A]" />
                <span>{isEn ? 'Trust Charter' : 'ميثاق الثقة والأمان'}</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                <p>
                  Our Trust Charter ensures complete impartiality. We are committed to mathematically driven rankings. Under no circumstances will we hide high-yield channels or promote lower rates to favor specific digital wallets. Our loyalty is entirely with expat savings.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
