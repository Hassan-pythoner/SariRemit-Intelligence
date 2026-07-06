import React from 'react';
import { useLanguage } from './LanguageContext';
import { 
  ArrowRight, Landmark, ShieldCheck, Activity, Brain, 
  Sparkles, CheckCircle2, ChevronRight, HelpCircle, 
  Compass, BadgePercent, Coins, ClipboardCheck
} from 'lucide-react';

interface HowItWorksProps {
  setCurrentPage: (page: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ setCurrentPage }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const steps = [
    {
      num: '1',
      titleEn: 'Enter Amount & Select Corridor',
      titleAr: 'أدخل المبلغ واختر الوجهة',
      descEn: 'Input the amount of Saudi Riyals (SAR) you plan to send and select your family\'s home country corridor (Pakistan, India, Philippines, Kenya, etc.).',
      descAr: 'أدخل المبلغ بالريال السعودي (SAR) الذي تنوي إرساله واختر دولة المستلم (باكستان، الهند، الفلبين، كينيا، إلخ).',
      icon: Compass,
      color: 'from-emerald-500 to-green-500',
      badge: isEn ? 'Step 1' : 'الخطوة ١'
    },
    {
      num: '2',
      titleEn: 'Multi-Source Data Collection',
      titleAr: 'جمع البيانات من مصادر متعددة',
      descEn: 'SariRemit automatically retrieves live rates, transaction fees, VAT estimates, digital wallet updates, and crowd-sourced community screenshot verifications in real-time.',
      descAr: 'يقوم ساري ريميت تلقائياً بجلب أسعار الصرف الحية، رسوم المعاملات، تقديرات ضريبة القيمة المضافة، تحديثات المحافظ الرقمية، وتأكيدات لقطات الشاشة من المجتمع في الوقت الفعلي.',
      icon: Coins,
      color: 'from-blue-500 to-indigo-500',
      badge: isEn ? 'Step 2' : 'الخطوة ٢',
      bulletsEn: ['Live Exchange Rates', 'Transfer Fees & VAT', 'Community Intelligence', 'Provider Reliability Logs'],
      bulletsAr: ['أسعار الصرف الحية', 'رسوم التحويل وضريبة القيمة المضافة', 'ذكاء المجتمع المشترك', 'سجلات موثوقية موفري الخدمة']
    },
    {
      num: '3',
      titleEn: 'Rate Confidence Engine (RRE)',
      titleAr: 'محرك تسوية وثقة الأسعار',
      descEn: 'Our proprietary RRE evaluates all available data feeds, filters out anomalies or stale values, and ranks the reliability of each provider\'s offer.',
      descAr: 'يقوم محرك RRE الخاص بنا بتقييم جميع قنوات البيانات المتاحة، واستبعاد القيم الشاذة أو القديمة، وتصنيف موثوقية عرض كل شركة.',
      icon: ShieldCheck,
      color: 'from-amber-500 to-yellow-500',
      badge: isEn ? 'Step 3' : 'الخطوة ٣'
    },
    {
      num: '4',
      titleEn: 'Remittance Intelligence Optimization',
      titleAr: 'محرك ذكاء التحويل والتحسين',
      descEn: 'SariRemit analyzes all options and highlights the absolute best provider to maximize the final currency amount your family receives.',
      descAr: 'يحلل ساري ريميت جميع الخيارات ويبرز لك الشركة الأفضل على الإطلاق لضمان حصول عائلتك على أكبر مبلغ ممكن بالعملة المحلية.',
      icon: Brain,
      color: 'from-emerald-500 to-teal-500',
      badge: isEn ? 'Step 4' : 'الخطوة ٤'
    },
    {
      num: '5',
      titleEn: 'Log Transfer & Track Long-term Savings',
      titleAr: 'سجل معاملتك وتتبع وفوراتك',
      descEn: 'Once you send your money via the recommended app, log the transfer on SariRemit to track your total accumulated savings and build your expat trust score.',
      descAr: 'بمجرد إرسال أموالك عبر التطبيق الموصى به، قم بتسجيل المعاملة على ساري ريميت لتتبع وفوراتك المتراكمة ورفع مستوى نقاط ثقتك.',
      icon: ClipboardCheck,
      color: 'from-purple-500 to-fuchsia-500',
      badge: isEn ? 'Step 5' : 'الخطوة ٥'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 animate-fade-in text-white text-left rtl:text-right">
      
      {/* Header section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00C16A]/10 border border-[#00C16A]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#00E07A] font-mono tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isEn ? 'How It Works' : 'كيف يعمل ساري ريميت'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {isEn ? 'The Intelligence Behind Your Savings' : 'الذكاء الكامن وراء توفيرك المالي'}
        </h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          {isEn 
            ? 'Discover how we scan, verify, and filter Saudi digital wallets to find the exact channel that maximizes your family transfers.'
            : 'اكتشف كيف نقوم بمسح ومطابقة وتصفية أسعار المحافظ الرقمية السعودية للعثور على القناة الدقيقة التي تعود بأقصى قيمة لعائلتك.'}
        </p>
      </div>

      {/* Visual Timeline Section */}
      <div className="relative border-l-2 border-slate-800/80 ml-4 md:ml-8 pl-6 md:pl-12 space-y-12 py-4">
        
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          return (
            <div key={idx} className="relative group">
              {/* Timeline dot badge */}
              <div className={`absolute -left-[43px] md:-left-[63px] top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700/80 flex items-center justify-center font-bold text-xs text-[#00E07A] group-hover:border-[#00C16A] group-hover:scale-110 transition-all shadow-md`}>
                {step.num}
              </div>

              {/* Step Card */}
              <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-4 hover:border-[#00C16A]/20 transition-all duration-300 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00C16A]/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-800/60 text-[#00E07A] rounded-xl border border-white/5">
                      <IconComponent className="w-6 h-6 text-[#00E07A]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E07A] bg-[#00E07A]/10 border border-[#00E07A]/15 px-2 py-0.5 rounded-full uppercase">
                        {step.badge}
                      </span>
                      <h3 className="text-lg md:text-xl font-bold text-white mt-1">
                        {isEn ? step.titleEn : step.titleAr}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-slate-350 text-xs md:text-sm leading-relaxed max-w-2xl">
                  {isEn ? step.descEn : step.descAr}
                </p>

                {step.bulletsEn && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                    {(isEn ? step.bulletsEn : step.bulletsAr).map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E07A]" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Quote / Banner */}
      <div className="bg-gradient-to-r from-[#00C16A]/10 to-indigo-500/5 border border-[#00C16A]/10 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <h4 className="text-sm font-bold text-[#00E07A] uppercase tracking-wider font-mono">
          {isEn ? 'Unbiased Intelligence' : 'ذكاء مالي مستقل تماماً'}
        </h4>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {isEn 
            ? 'SariRemit does not sell or feature sponsored rates. We hold no bank affiliation. Every ranking is purely generated by mathematical utility: which channel delivers the absolute highest exchange yield.'
            : 'ساري ريميت لا يبيع ولا يروج لأسعار مدعومة إعلانياً. نحن لا نتبع لأي بنك. كل ترتيب يتم إنشاؤه بناءً على مصلحة المستخدم المحضة: أي القنوات تمنحك أعلى عائد تحويل حقيقي.'}
        </p>
        <button
          onClick={() => setCurrentPage('compare')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md cursor-pointer hover:scale-102 transition-all uppercase tracking-wider"
        >
          <span>{isEn ? 'Compare Live Rates Now' : 'قارن أسعار الصرف الحية الآن'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
