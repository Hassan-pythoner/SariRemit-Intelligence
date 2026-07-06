import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { CorridorInsights } from './CorridorInsights';
import { 
  TrendingUp, BarChart4, BookOpen, FileText, 
  Sparkles, Award, ShieldCheck, HelpCircle, 
  TrendingDown, Globe, Activity, CheckCircle2 
} from 'lucide-react';

interface InsightsProps {
  setCurrentPage: (page: string) => void;
}

export const Insights: React.FC<InsightsProps> = ({ setCurrentPage }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const articles = [
    {
      titleEn: 'Expat Survival Guide: stc pay vs urpay',
      titleAr: 'دليل المغترب المالي: المقارنة بين stc pay و urpay',
      readTimeEn: '5 min read',
      readTimeAr: 'قراءة في ٥ دقائق',
      descEn: 'A detailed analysis of transfer speeds, local cash pickup networks, and fee structures for Saudi Arabia\'s top digital wallets.',
      descAr: 'تحليل مفصل لسرعات التحويل، شبكات استلام الكاش المحلية، وهياكل الرسوم لأبرز المحافظ الرقمية في المملكة.'
    },
    {
      titleEn: 'How to Avoid Hidden Exchange Rate Markups',
      titleAr: 'كيف تتجنب هوامش أسعار الصرف المخفية',
      readTimeEn: '4 min read',
      readTimeAr: 'قراءة في ٤ دقائق',
      descEn: 'Why "Zero Fees" can sometimes cost you more than standard fee-based transfers. Understand mid-market rates.',
      descAr: 'لماذا قد تكلفك التحويلات "ذات الرسوم الصفرية" أحياناً أكثر من التحويلات القياسية الخاضعة للرسوم.'
    },
    {
      titleEn: 'Navigating New Saudi Fintech Regulations',
      titleAr: 'دليل الأنظمة واللوائح الجديدة للمحافظ الرقمية في المملكة',
      readTimeEn: '6 min read',
      readTimeAr: 'قراءة في ٦ دقائق',
      descEn: 'How the Saudi Central Bank (SAMA) is safeguarding digital wallet transfers and verifying expat identities.',
      descAr: 'كيف يعمل البنك المركزي السعودي (SAMA) على حماية تحويلات المحافظ الرقمية والتحقق من هويات المغتربين.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 text-white text-left rtl:text-right animate-fade-in">
      
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00C16A]/10 border border-[#00C16A]/20 px-4 py-1.5 rounded-full text-xs font-bold text-[#00E07A] font-mono tracking-wider uppercase">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isEn ? 'Intelligence Hub' : 'مركز التحليلات والرؤى'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
          {isEn ? 'Market Analysis & Savings Statistics' : 'تحليلات السوق وإحصائيات التوفير'}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {isEn
            ? 'Track real-time trends, review provider performance index cards, and read curated expert educational guides.'
            : 'تتبع الاتجاهات الحقيقية لأسعار الصرف، راجع مؤشرات أداء الشركات، واقرأ أدلة الخبراء المنسقة والمفيدة.'}
        </p>
      </div>

      {/* 1. Reuse existing CorridorInsights */}
      <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl">
        <h3 className="text-base font-extrabold text-white uppercase tracking-wider font-mono border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
          <Globe className="w-4.5 h-4.5 text-[#00E07A]" />
          <span>{isEn ? 'Interactive Corridor History & Advice' : 'سجل المسارات التفاعلي والنصائح'}</span>
        </h3>
        <CorridorInsights />
      </div>

      {/* 2. Provider Performance & Corridor Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider Performance */}
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-4 shadow-lg">
          <h3 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00E07A]" />
            <span>{isEn ? 'Provider Performance Matrix' : 'مصفوفة أداء الشركات'}</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <span className="font-bold">urpay (Al Rajhi Bank)</span>
              <span className="text-[#00E07A] font-mono font-bold bg-[#00C16A]/10 px-2 py-0.5 rounded">9.4 / 10</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <span className="font-bold">stc pay</span>
              <span className="text-[#00E07A] font-mono font-bold bg-[#00C16A]/10 px-2 py-0.5 rounded">9.1 / 10</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <span className="font-bold">Mobily Pay</span>
              <span className="text-blue-400 font-mono font-bold bg-blue-500/10 px-2 py-0.5 rounded">8.7 / 10</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-white/5">
              <span className="font-bold">Enjaz QuickPay</span>
              <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded">8.2 / 10</span>
            </div>
          </div>
        </div>

        {/* Savings Statistics */}
        <div className="bg-[#0B1E35] border border-white/5 rounded-2xl p-6 md:p-8 space-y-4 shadow-lg">
          <h3 className="text-lg font-bold text-white tracking-tight border-b border-white/5 pb-2 flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-[#00E07A]" />
            <span>{isEn ? 'Expat Savings Insights' : 'رؤى توفير المغتربين'}</span>
          </h3>
          <div className="space-y-4 text-xs text-slate-400">
            <p>
              {isEn
                ? 'Expats optimizing their remittance through digital wallet comparisons save an average of 4.5% per transaction compared to walk-in bank rates.'
                : 'يوفر المغتربون الذين يحسنون تحويلاتهم عبر مقارنة المحافظ الرقمية ما متوسطه ٤.٥٪ لكل معاملة مقارنة بأسعار البنوك التقليدية.'}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-lg font-mono font-bold text-[#00E07A] block">180+ SAR</span>
                <span className="text-[10px] text-slate-400">{isEn ? 'Avg Monthly Saving' : 'متوسط التوفير الشهري'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-lg font-mono font-bold text-[#00E07A] block">12,500+</span>
                <span className="text-[10px] text-slate-400">{isEn ? 'Active Expats' : 'مغترب نشط'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Articles / Guides */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight border-b border-white/5 pb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00E07A]" />
          <span>{isEn ? 'Curated Educational Articles' : 'أدلة ومقالات تعليمية منسقة'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art, idx) => (
            <div key={idx} className="bg-[#0B1E35] border border-white/5 rounded-2xl p-5 space-y-3 hover:border-[#00C16A]/10 transition-all duration-300 shadow-md">
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-[#00C16A]/10 px-2 py-0.5 rounded">
                {isEn ? art.readTimeEn : art.readTimeAr}
              </span>
              <h4 className="font-bold text-white text-xs md:text-sm leading-snug">
                {isEn ? art.titleEn : art.titleAr}
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {isEn ? art.descEn : art.descAr}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
