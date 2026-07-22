import React from 'react';
import { Sparkles, ShieldCheck, Zap, Award, Info } from 'lucide-react';

interface RecommendationInsightProps {
  option: any;
  isRtl?: boolean;
  className?: string;
}

export function RecommendationInsight({
  option,
  isRtl = false,
  className = '',
}: RecommendationInsightProps) {
  const getInsightText = (): { title: string; body: string } => {
    if (!option) {
      return {
        title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
        body: isRtl
          ? 'يوفر هذا الخيار أعلى قيمة استلام إجمالية محددة وفق أحدث مقارنة بين المزودين النشطين.'
          : 'This recommendation currently offers the strongest calculated overall value across active providers.',
      };
    }

    const resolved = option.resolved || option;
    const sis2 = option.sis2 || option.sis;
    const fee = resolved.transfer_fee ?? option.totalFees ?? 0;
    const sourceLabel = resolved.source_label || resolved.source_type || '';
    const confidence = sis2?.confidenceBand || resolved.confidence || '';

    // Factor 1: Zero or Low Fee
    if (fee === 0) {
      return {
        title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
        body: isRtl
          ? 'رسوم التحويل المجانية (0 ريال) تضمن وصول المبلغ بالكامل دون أي خصومات إضافية.'
          : 'Zero transfer fee (0 SAR) ensures maximum payout with no hidden deductions.',
      };
    }

    // Factor 2: High Confidence & Verified Evidence
    if ((confidence === 'Very High' || confidence === 'High') && sourceLabel.toLowerCase().includes('verifi')) {
      return {
        title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
        body: isRtl
          ? 'سعر صرف موثق ومؤكد عبر مساهمات المجتمع النشطة، مما يعزز دقة وموثوقية هذا الخيار.'
          : 'A verified provider rate backed by active community evidence ensures maximum confidence and reliability.',
      };
    }

    // Factor 3: High SIS Score Advantage
    if (sis2?.overallScore && sis2.overallScore >= 88) {
      return {
        title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
        body: isRtl
          ? 'درجة الذكاء الاصطناعي (SIS) المرتفعة تشير إلى تفوق متكامل في سعر الصرف وانخفاض التكلفة الكلية.'
          : 'High SariRemit Intelligence Score (SIS) reflects an optimal balance of rate advantage and overall cost retention.',
      };
    }

    // Factor 4: Low Fee Advantage
    if (fee < 10) {
      return {
        title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
        body: isRtl
          ? `رسوم تحويل منخفضة للغاية (${fee} ريال) تجعل إجمالي تكلفة المعاملة هي الأوفر حالياً.`
          : `Low transfer fee (${fee} SAR) combined with a competitive rate delivers the highest net recipient payout.`,
      };
    }

    // Default Fallback
    return {
      title: isRtl ? 'لماذا يتصدر هذا الخيار اليوم' : 'Why this leads today',
      body: isRtl
        ? 'يوفر هذا الخيار أعلى قيمة استلام محسوبة بناءً على مقارنة الأسعار والرسوم الموثوقة.'
        : 'This recommendation currently offers the strongest calculated overall value for your transfer amount.',
    };
  };

  const insight = getInsightText();

  return (
    <div className={`p-3.5 bg-sds-bg-sec/80 border border-sds-border rounded-2xl flex items-start gap-3 text-left ${className}`}>
      <div className="p-1.5 rounded-lg bg-sds-primary/10 text-sds-primary shrink-0 mt-0.5 border border-sds-primary/20">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
      <div className="space-y-0.5 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-sds-text font-mono block">
          {insight.title}
        </span>
        <p className="text-sds-text-sec text-[11px] leading-snug font-medium">
          {insight.body}
        </p>
      </div>
    </div>
  );
}
