import React from 'react';
import { useLanguage } from './LanguageContext';
import { 
  Users, Award, CheckCircle2, ShieldCheck, 
  HelpCircle, MessageSquare, HeartHandshake, Compass, 
  Star, Trophy, ChevronRight, Activity
} from 'lucide-react';

interface CommunityProps {
  setCurrentPage: (page: string) => void;
}

export const Community: React.FC<CommunityProps> = ({ setCurrentPage }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const aspects = [
    {
      titleEn: 'Community Verified Rates',
      titleAr: 'الأسعار المؤكدة مجتمعياً',
      descEn: 'Rates backed by real-time mobile app screenshot uploads from active expats across Saudi Arabia.',
      descAr: 'أسعار صرف مدعومة بلقطات شاشة حقيقية مرفوعة من التطبيقات عبر المغتربين النشطين في المملكة.',
      icon: CheckCircle2
    },
    {
      titleEn: 'Verification Process',
      titleAr: 'آلية التحقق والاعتماد',
      descEn: 'Our system runs automated optical character recognition (OCR) on screenshots alongside manual user upvotes to certify rates.',
      descAr: 'يقوم نظامنا بتشغيل التعرف الضوئي التلقائي (OCR) على لقطات الشاشة جنباً إلى جنب مع تصويتات المستخدمين لتأكيد الأسعار.',
      icon: Activity
    },
    {
      titleEn: 'Contributor Reputation',
      titleAr: 'سمعة ومكانة المساهمين',
      descEn: 'Earn badges and points for every validated rate report. Rise from "Novice Expat" to "Remittance Sage".',
      descAr: 'احصل على شارات ونقاط لكل تقرير سعر معتمد. ارتقِ من "مغترب مبتدئ" إلى "حكيم التحويلات".',
      icon: Trophy
    }
  ];

  const rules = [
    {
      titleEn: 'Submit Only Real Screenshots',
      titleAr: 'إرسال لقطات شاشة حقيقية فقط',
      descEn: 'Always upload direct, unedited mobile screenshots of your active digital wallet to maintain maximum data reliability.',
      descAr: 'قم دائماً برفع لقطات شاشة مباشرة وغير معدلة لمحفظتك الرقمية النشطة لضمان أقصى درجات الموثوقية.'
    },
    {
      titleEn: 'Avoid Spreading Stale Data',
      titleAr: 'تجنب نشر البيانات القديمة',
      descEn: 'Submit rates immediately after capturing, as digital wallet pricing changes rapidly throughout the business day.',
      descAr: 'أرسل الأسعار فور التقاطها، حيث تتغير أسعار صرف المحافظ الرقمية بسرعة خلال يوم العمل.'
    },
    {
      titleEn: 'Help Moderate',
      titleAr: 'ساعد في الإشراف والمراجعة',
      descEn: 'Upvote correct community submissions or flag anomalies if you notice an incorrect rate displayed.',
      descAr: 'صوّت بالموافقة للمشاركات الصحيحة من المجتمع أو أبلغ عن أي عروض غير دقيقة تلاحظها.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-16 text-white text-left rtl:text-right animate-fade-in">
      
      {/* Header Block */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00C16A]/10 border border-[#00C16A]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#00E07A] font-mono tracking-wider uppercase">
          <Users className="w-3.5 h-3.5" />
          <span>{isEn ? 'Community Trust Hub' : 'مركز ثقة المجتمع'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {isEn ? 'Crowdsourced Financial Intelligence' : 'الذكاء المالي التشاركي للمجتمع'}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {isEn
            ? 'SariRemit is powered by Saudi Arabia\'s most helpful expat network. Together, we bypass bank markups and help each other save.'
            : 'ساري ريميت مدعوم من شبكة المغتربين الأكثر تعاوناً في المملكة. معاً، نتجاوز هوامش البنوك ونساعد بعضنا البعض في التوفير.'}
        </p>
      </div>

      {/* Aspects Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aspects.map((aspect, idx) => {
          const Icon = aspect.icon;
          return (
            <div key={idx} className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 space-y-4 hover:border-[#00C16A]/10 transition-all duration-300 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#00C16A]/10 text-[#00E07A] flex items-center justify-center border border-[#00C16A]/20">
                <Icon className="w-5 h-5 text-[#00E07A]" />
              </div>
              <h4 className="font-bold text-white text-sm">
                {isEn ? aspect.titleEn : aspect.titleAr}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                {isEn ? aspect.descEn : aspect.descAr}
              </p>
            </div>
          );
        })}
      </div>

      {/* Guidelines & Recognition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-2">
            <HeartHandshake className="w-5 h-5 text-[#00E07A]" />
            <span>{isEn ? 'Community Guidelines' : 'إرشادات مجتمعنا'}</span>
          </h3>
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div key={idx} className="space-y-1">
                <h5 className="font-bold text-white text-xs md:text-sm">
                  {idx + 1}. {isEn ? rule.titleEn : rule.titleAr}
                </h5>
                <p className="text-slate-400 text-xs leading-relaxed pl-4">
                  {isEn ? rule.descEn : rule.descAr}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-2">
            <Trophy className="w-5 h-5 text-[#00E07A]" />
            <span>{isEn ? 'Recognition & Rewards' : 'نظام التكريم والمكافآت'}</span>
          </h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
            <p>
              {isEn
                ? 'Every verified rate you submit earns you 10 trust points. Accumulating trust points unlocks exclusive expat badges, elevates your ranking, and allows your submitted rates to carry higher priority within our Rate Resolution Engine.'
                : 'كل سعر صرف مؤكد ترسله يمنحك ١٠ نقاط ثقة. يؤدي تجميع نقاط الثقة إلى فتح شارات حصرية، ويرفع تصنيفك، ويمنح أسعارك المرسلة أولوية أعلى في محرك تسوية الأسعار الخاص بنا.'}
            </p>
            <div className="space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#00E07A]">
                <span>{isEn ? 'Level 1: Novice Expat' : 'مغترب مستجد'}</span>
                <span>0 - 100 pts</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-blue-400">
                <span>{isEn ? 'Level 2: Budget Champion' : 'بطل التوفير'}</span>
                <span>100 - 300 pts</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-amber-400">
                <span>{isEn ? 'Level 3: Savings Master' : 'سيد الادخار'}</span>
                <span>300 - 500 pts</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-[#00E07A]">
                <span>{isEn ? 'Level 4: Remittance Sage' : 'حكيم التحويلات'}</span>
                <span>500+ pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button to Track & Submit */}
      <div className="bg-gradient-to-r from-[#00C16A]/10 to-transparent border border-[#00C16A]/10 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <h4 className="text-lg font-bold text-white">
          {isEn ? 'Contribute and Help Your Fellow Expats Save' : 'ساهم وساعد زملائك المغتربين في التوفير'}
        </h4>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {isEn
            ? 'Have a real-time rate screenshot from your digital wallet app? Verify a transfer now to update our live indexes.'
            : 'هل لديك لقطة شاشة لسعر الصرف الحالي من تطبيق محفظتك الرقمية؟ قم بتوثيق عملية تحويل الآن لتحديث مؤشراتنا الحية.'}
        </p>
        <button
          onClick={() => setCurrentPage('submit')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00C16A] hover:bg-[#00E07A] text-[#071326] font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider"
        >
          <span>{isEn ? 'Verify a Transfer' : 'توثيق عملية تحويل'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
