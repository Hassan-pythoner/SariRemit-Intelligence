import React from 'react';
import { Award, ShieldCheck, ArrowRight, HelpCircle, Sparkles, Check, ChevronRight } from 'lucide-react';
import { AdaptiveRecommendationSurface } from './AdaptiveRecommendationSurface';
import { LiveIntelligenceStatus } from '../intelligence/LiveIntelligenceStatus';
import { AnimatedFinancialValue } from './AnimatedFinancialValue';
import { RecommendationInsight } from './RecommendationInsight';
import { ProviderLogo, CountryFlag } from '../SdsBamComponents';
import { FreshnessStatus } from '../../services/freshnessService';
import { Corridor } from '../../types';

interface RecommendationHeroProps {
  recommendedChannel: any;
  activeCorridor: Corridor;
  amount: number;
  netRecipient: number;
  estimatedSavings: number;
  sisScore: number;
  confidence: string;
  freshnessStatus: FreshnessStatus;
  lastUpdatedText: string;
  isUpdating?: boolean;
  updateNotice?: string | null;
  isRtl?: boolean;
  onRecordTransfer: () => void;
  onCompareFull: () => void;
  onExplainOpen: () => void;
}

export function RecommendationHero({
  recommendedChannel,
  activeCorridor,
  amount,
  netRecipient,
  estimatedSavings,
  sisScore,
  confidence,
  freshnessStatus,
  lastUpdatedText,
  isUpdating = false,
  updateNotice,
  isRtl = false,
  onRecordTransfer,
  onCompareFull,
  onExplainOpen,
}: RecommendationHeroProps) {
  const resolved = recommendedChannel?.resolved || {
    provider_id: 'stc-pay',
    provider_name: 'STC Pay',
    displayName: 'STC Pay',
    resolved_rate: activeCorridor.baseExchangeRate,
    transfer_fee: activeCorridor.typicalFee,
    source_label: 'Verified Direct Rate',
  };

  const providerName = resolved.displayName || resolved.provider_name || resolved.providerName || 'STC Pay';
  const providerId = resolved.provider_id || resolved.provider_code || 'stc-pay';
  const exchangeRate = resolved.resolved_rate || activeCorridor.baseExchangeRate;
  const transferFee = resolved.transfer_fee ?? activeCorridor.typicalFee ?? 0;

  const getConfidenceBadgeColor = (band: string) => {
    if (band === 'Very High' || band === 'High') {
      return 'bg-sds-success/10 text-sds-success border-sds-success/20';
    } else if (band === 'Moderate') {
      return 'bg-sds-gold/10 text-sds-gold border-sds-gold/20';
    } else {
      return 'bg-sds-error/10 text-sds-error border-sds-error/20';
    }
  };

  return (
    <AdaptiveRecommendationSurface providerId={providerId} isUpdating={isUpdating}>
      
      {/* 1. Header: Badge & Ambient Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sds-border pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sds-gold text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-sds-xs border border-sds-gold/30">
            <Sparkles className="w-3 h-3 text-slate-950" />
            {isRtl ? 'التوصية الأولى اليوم' : "Today's Top Recommendation"}
          </span>

          <LiveIntelligenceStatus
            status={freshnessStatus}
            formattedText={lastUpdatedText}
            isRtl={isRtl}
            compact={true}
          />
        </div>

        {/* Update Notice Toast if present */}
        {updateNotice && (
          <span className="text-[10px] font-mono font-bold text-sds-success bg-sds-success/10 border border-sds-success/25 px-2.5 py-1 rounded-lg animate-fadeIn">
            {updateNotice}
          </span>
        )}
      </div>

      {/* 2. Provider Identity Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProviderLogo
            channel={{
              ...resolved,
              providerCode: providerId,
              displayName: providerName,
            }}
            size="lg"
            shape="circle"
            surface="light"
          />
          <div className="text-left space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-sds-text uppercase tracking-tight font-sans">
                {providerName}
              </h3>
              <span className="px-2 py-0.5 bg-sds-bg-sec border border-sds-border rounded-md text-[9px] font-mono font-bold uppercase text-sds-text-sec">
                {resolved.delivery_type || (isRtl ? 'تحويل فوري' : 'Instant Transfer')}
              </span>
            </div>
            <div className="text-xs text-sds-text-sec flex items-center gap-1.5 font-medium">
              <CountryFlag country="" currency={activeCorridor.currencyCode} size="xs" />
              <span>{isRtl ? activeCorridor.toCountryAr : activeCorridor.toCountry} ({activeCorridor.currencyCode})</span>
              <span>•</span>
              <span className="font-mono">{amount.toLocaleString()} SAR</span>
            </div>
          </div>
        </div>

        {/* SIS Score Gauge Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sds-bg-sec border border-sds-border rounded-2xl">
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-sds-text-sec block uppercase">
              {isRtl ? 'مؤشر الذكاء' : 'SIS Score'}
            </span>
            <span className="text-sm font-mono font-black text-sds-success leading-none">
              {sisScore}/100
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-mono font-bold uppercase ${getConfidenceBadgeColor(confidence)}`}>
            {confidence}
          </span>
        </div>
      </div>

      {/* 3. Main Recipient Payout Display (Hero Value) */}
      <div className="p-4 sm:p-5 bg-sds-bg-sec/90 border border-sds-border rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="text-left space-y-1">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-sds-text-sec block">
            {isRtl ? 'المبلغ المستلم الصافي للمستفيد' : 'Net Recipient Payout'}
          </span>
          <div className="text-3xl sm:text-4xl font-black text-sds-success flex items-baseline gap-2">
            <AnimatedFinancialValue
              value={netRecipient}
              suffix={activeCorridor.currencyCode}
              precision={2}
            />
          </div>
        </div>

        <div className="text-right sm:text-right space-y-1 border-t sm:border-t-0 sm:border-l border-sds-border pt-2 sm:pt-0 sm:pl-4">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-sds-text-sec block">
            {isRtl ? 'الوفورات التقديرية' : 'Estimated Savings'}
          </span>
          <span className="text-lg font-black text-sds-gold font-mono block">
            +<AnimatedFinancialValue value={estimatedSavings} suffix="SAR" precision={1} />
          </span>
          <span className="text-[9px] text-sds-text-sec font-medium block">
            {isRtl ? 'مقارنة بمتوسط السوق' : 'vs market baseline'}
          </span>
        </div>
      </div>

      {/* 4. Financial Breakdown Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-sds-bg-sec/60 rounded-xl border border-sds-border">
          <span className="text-[9px] text-sds-text-sec uppercase font-mono font-bold block">
            {isRtl ? 'سعر الصرف المطبق' : 'Exchange Rate'}
          </span>
          <span className="font-mono font-bold text-sds-text mt-0.5 block">
            1 SAR = {exchangeRate.toFixed(4)} {activeCorridor.currencyCode}
          </span>
        </div>

        <div className="p-3 bg-sds-bg-sec/60 rounded-xl border border-sds-border">
          <span className="text-[9px] text-sds-text-sec uppercase font-mono font-bold block">
            {isRtl ? 'رسوم التحويل' : 'Transfer Fee'}
          </span>
          <span className="font-mono font-bold text-sds-text mt-0.5 block">
            {transferFee === 0 ? (
              <span className="text-sds-success font-black uppercase">{isRtl ? 'مجاناً (0 ريال)' : 'FREE (0 SAR)'}</span>
            ) : (
              `${transferFee} SAR`
            )}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 bg-sds-bg-sec/60 rounded-xl border border-sds-border">
          <span className="text-[9px] text-sds-text-sec uppercase font-mono font-bold block">
            {isRtl ? 'مصدر البيانات' : 'Evidence Source'}
          </span>
          <span className="font-mono font-bold text-sds-text mt-0.5 block truncate">
            {resolved.source_label || (isRtl ? 'سعر مباشر موثق' : 'Verified Direct Rate')}
          </span>
        </div>
      </div>

      {/* 5. Contextual "Why this leads today" Insight */}
      <RecommendationInsight option={recommendedChannel} isRtl={isRtl} />

      {/* 6. Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onRecordTransfer}
          className="flex-1 min-w-[160px] py-3.5 px-5 bg-sds-gold hover:opacity-90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sds-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Award className="w-4 h-4" />
          <span>{isRtl ? 'تسجيل هذا التحويل المالي' : 'Record Transfer'}</span>
        </button>

        <button
          type="button"
          onClick={onCompareFull}
          className="py-3.5 px-4 bg-sds-bg-sec hover:bg-sds-border/40 border border-sds-border text-sds-text font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{isRtl ? 'جدول المقارنة الشامل' : 'View Full Comparison'}</span>
          <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onExplainOpen}
          className="p-3.5 bg-sds-bg-sec hover:bg-sds-border/40 border border-sds-border text-sds-text-sec hover:text-sds-text rounded-xl transition-colors cursor-pointer"
          title={isRtl ? 'لماذا هذه التوصية؟' : 'Why this recommendation?'}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

    </AdaptiveRecommendationSurface>
  );
}
