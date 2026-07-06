import React from 'react';
import { SariRemitLogo } from './SariRemitLogo';
import { useLanguage } from './LanguageContext';
import { 
  Award, ShieldCheck, Heart, Users, Compass, 
  MapPin, Milestone, Activity, Mail, Sparkles, ArrowRight
} from 'lucide-react';

interface AboutProps {
  setCurrentPage: (page: string) => void;
}

export const About: React.FC<AboutProps> = ({ setCurrentPage }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const values = [
    {
      titleEn: 'Radical Transparency',
      titleAr: 'الشفافية المطلقة',
      descEn: 'We lay out all fees, hidden markup spreads, and transaction variables explicitly. No trick pricing.',
      descAr: 'نعرض جميع الرسوم، هوامش الربح المخفية، ومتغيرات المعاملات بكل وضوح. لا توجد أسعار مضللة.',
      icon: ShieldCheck
    },
    {
      titleEn: 'Community First',
      titleAr: 'المجتمع أولاً',
      descEn: 'We designed SariRemit as a public service utility for Saudi Arabia\'s valued expat communities.',
      descAr: 'قمنا بتصميم ساري ريميت كخدمة عامة لمجتمعات المغتربين الكرام في المملكة العربية السعودية.',
      icon: Users
    },
    {
      titleEn: 'Data Integrity',
      titleAr: 'سلامة البيانات',
      descEn: 'Combining live computer telemetry with real-world crowdsourced community screenshot verifications.',
      descAr: 'الدمج بين القياس الرقمي المباشر وتأكيدات لقطات الشاشة الحقيقية المقدمة من المجتمع.',
      icon: Activity
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16 animate-fade-in text-white text-left rtl:text-right">
      
      {/* Centered Brand Logo */}
      <div className="flex justify-center pt-4">
        <SariRemitLogo variant="full" animate={true} />
      </div>

      {/* Intro Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00C16A]/10 border border-[#00C16A]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#00E07A] font-mono tracking-wider uppercase">
          <Award className="w-3.5 h-3.5" />
          <span>{isEn ? 'About Us' : 'من نحن'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {isEn ? 'Empowering Expats with Remittance Intelligence' : 'تمكين المغتربين بذكاء تحويل الأموال'}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {isEn 
            ? 'SariRemit is Saudi Arabia\'s leading independent remittance intelligence platform, dedicated to helping expats optimize their hard-earned transfers.'
            : 'ساري ريميت هي المنصة المستقلة الرائدة لذكاء تحويل الأموال في المملكة، المخصصة لمساعدة المغتربين في توفير مبالغ تحويلاتهم المكتسبة بجهدهم.'}
        </p>
      </div>

      {/* Mission & Vision Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-3 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C16A]/5 rounded-bl-full pointer-events-none" />
          <h3 className="text-[#00E07A] font-bold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
            <Milestone className="w-4 h-4" />
            <span>{isEn ? 'Our Mission' : 'مهمتنا'}</span>
          </h3>
          <h4 className="text-lg md:text-xl font-bold text-white">
            {isEn ? 'Saving Every Riyal Count' : 'جعل كل ريال ذا قيمة حقيقية'}
          </h4>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            {isEn
              ? 'Our mission is to level the financial playing field for expats by exposing exact transaction fees, exchange markups, and delivering transparent recommendations that maximize what families receive.'
              : 'مهمتنا هي توفير أرضية مالية عادلة للمغتربين من خلال كشف الرسوم الحقيقية، وهامش الربح لأسعار الصرف، وتقديم توصيات شفافة تزيد من المبالغ المستلمة لدى عائلاتهم.'}
          </p>
        </div>

        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-3 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest font-mono flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span>{isEn ? 'Our Vision' : 'رؤيتنا'}</span>
          </h3>
          <h4 className="text-lg md:text-xl font-bold text-white">
            {isEn ? 'A Fairer Global Remittance Ecosystem' : 'منظومة عالمية أكثر عدلاً لتحويل الأموال'}
          </h4>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            {isEn
              ? 'We envision a world where remittance transparency is the absolute standard. By championing local community contributions and AI-backed rates analytics, we guide migrants to make optimized financial decisions.'
              : 'نطمح إلى مجتمع تسوده الشفافية الكاملة في التحويلات. من خلال دعم مشاركات المجتمع والتحليلات المدعومة بالذكاء الاصطناعي، نوجه المغتربين لاتخاذ قرارات مالية مثالية.'}
          </p>
        </div>
      </div>

      {/* Our Story & Why We Built SariRemit */}
      <div className="space-y-6">
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight border-b border-white/5 pb-2">
          {isEn ? 'Our Story & Why We Built This' : 'قصتنا ولماذا قمنا ببناء هذه المنصة'}
        </h3>
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-4 text-slate-350 text-xs md:text-sm leading-relaxed shadow-lg">
          <p>
            {isEn
              ? 'Living and working in the Kingdom of Saudi Arabia, expats send billions of Riyals home annually. However, finding the exact best rate in a landscape saturated with digital wallets (stc pay, urpay, Mobily Pay, Enjaz) is historically tedious.'
              : 'بالعيش والعمل في المملكة العربية السعودية، يرسل المغتربون مليارات الريالات سنوياً لعائلاتهم. ومع ذلك، كان العثور على أفضل سعر صرف في ظل انتشار المحافظ الرقمية المتعددة أمراً شاقاً تاريخياً.'}
          </p>
          <p>
            {isEn
              ? 'SariRemit was born as a digital response to this complexity. We realized that while each provider advertises "unbeatable offers," hidden markup spreads often erode savings. We combined verified developer telemetry with local community screenshots to create Saudi Arabia\'s most trusted, real-time remittance intelligence hub.'
              : 'ولدت ساري ريميت كحل رقمي لتجاوز هذا التعقيد. لقد أدركنا أنه بينما تعلن كل شركة عن "عروض لا تقبل المنافسة"، فإن هوامش أسعار الصرف المخفية غالباً ما تلتهم المدخرات. لذا دمجنا القياس المباشر مع لقطات الشاشة المجتمعية لإنشاء مركز التحويل الأكثر موثوقية في المملكة.'}
          </p>
        </div>
      </div>

      {/* Founder's Statement */}
      <div className="bg-gradient-to-r from-slate-900 via-[#10223D]/50 to-slate-900 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00C16A]/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <span>{isEn ? "Founder\'s Statement" : 'بيان المؤسس'}</span>
        </h3>
        
        <blockquote className="text-slate-300 italic text-xs md:text-sm leading-relaxed border-l-2 border-[#00C16A] pl-4 md:pl-6">
          {isEn
            ? '“SariRemit was founded with one primary promise: to make sure that not a single hard-earned Riyal is wasted. Our team works tirelessly to keep our rate comparison fully independent, mathematical, and community-verified. When you use SariRemit, you are taking back control of your financial freedom.”'
            : '“تأسست ساري ريميت بعهد أساسي واحد: التأكد من عدم إضاعة ريال واحد مكتسب بجهد. يعمل فريقنا بلا كلل للحفاظ على استقلالية مقارنة الأسعار وحيادها بشكل رياضي وبتحقق كامل من المجتمع. عندما تستخدم ساري ريميت، فإنك تستعيد السيطرة على حريتك المالية.”'}
        </blockquote>
        
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#00C16A] to-[#00E07A] text-[#071326] rounded-full flex items-center justify-center font-bold text-sm">
            SR
          </div>
          <div>
            <h5 className="font-bold text-white text-xs sm:text-sm">{isEn ? 'Founder & CEO' : 'المؤسس والرئيس التنفيذي'}</h5>
            <p className="text-[10px] text-slate-400 font-mono">SariRemit</p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="space-y-6">
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight border-b border-white/5 pb-2">
          {isEn ? 'Our Shared Core Values' : 'قيمنا الجوهرية المشتركة'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div key={idx} className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-[#00C16A]/10 transition-all duration-300 shadow-md">
                <div className="w-8 h-8 rounded-lg bg-[#00C16A]/10 text-[#00E07A] flex items-center justify-center border border-[#00C16A]/20">
                  <Icon className="w-4.5 h-4.5 text-[#00E07A]" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {isEn ? v.titleEn : v.titleAr}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {isEn ? v.descEn : v.descAr}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Charter Summary & Brand Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-3 shadow-lg">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
            🛡️ {isEn ? 'Trust Charter Summary' : 'ملخص ميثاق الثقة'}
          </h4>
          <p className="text-slate-450 text-xs leading-relaxed">
            {isEn
              ? 'Our Trust Charter mandates 100% independence from remittance providers. We do not participate in affiliate schemes, nor do we promote higher pricing for partner benefits. The rate resolver works solely on math.'
              : 'يفرض ميثاق الثقة الخاص بنا استقلالية بنسبة ١٠٠٪ عن موفري الخدمة. نحن لا نشارك في برامج تسويق بالعمولة، ولا نروج لأسعار أعلى لصالح شركاء. محرك حل الأسعار يعمل بالكامل حسابياً.'}
          </p>
        </div>

        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-3 shadow-lg">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider font-mono">
            🌱 {isEn ? 'Brand Philosophy' : 'فلسفة العلامة التجارية'}
          </h4>
          <p className="text-slate-450 text-xs leading-relaxed">
            {isEn
              ? '“Make Every Riyal Count” is not just a slogan; it is our design core. We prioritize fast, accessible mobile interfaces, clear typography, and clean layouts so that users can make stressful financial decisions with complete confidence.'
              : '“اجعل كل ريال ذا قيمة” ليس مجرد شعار؛ بل هو جوهر تصميمنا. نحن نمنح الأولوية للواجهات السريعة والسهلة الاستخدام، والخطوط الواضحة حتى يتمكن المستخدمون من اتخاذ القرارات المالية بثقة تامة.'}
          </p>
        </div>
      </div>



      {/* Call To Action */}
      <div className="bg-gradient-to-r from-emerald-500/15 to-[#00C16A]/5 border border-[#00C16A]/15 rounded-2xl p-8 text-center space-y-5 shadow-xl">
        <h4 className="text-lg md:text-xl font-bold text-white">
          {isEn ? 'Ready to Maximize Your Next Transfer?' : 'جاهز لمضاعفة قيمة تحويلك القادم؟'}
        </h4>
        <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          {isEn
            ? 'Compare live digital wallet rates now to verify who is offering the top riyal yield for your family.'
            : 'قارن أسعار صرف المحافظ الرقمية المباشرة الآن للتحقق من الجهة التي تمنح عائلتك أعلى عائد للريال.'}
        </p>
        <button
          onClick={() => setCurrentPage('compare')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all uppercase tracking-wider"
        >
          <span>{isEn ? 'Go to Comparison Tool' : 'الذهاب إلى أداة المقارنة'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
