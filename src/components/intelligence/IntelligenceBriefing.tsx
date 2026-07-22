import React from 'react';
import { Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { Corridor } from '../../types';

interface IntelligenceBriefingProps {
  corridor: Corridor;
  bestProviderName?: string;
  amount?: number;
  confidenceBand?: string;
  isRtl?: boolean;
  className?: string;
}

export function IntelligenceBriefing({
  corridor,
  bestProviderName = 'STC Pay',
  amount = 1000,
  confidenceBand = 'Very High',
  isRtl = false,
  className = '',
}: IntelligenceBriefingProps) {
  const countryName = isRtl ? corridor.toCountryAr || corridor.toCountry : corridor.toCountry;
  const currCode = corridor.currencyCode;

  const getBriefingText = () => {
    if (isRtl) {
      return `سوق التحويلات إلى ${countryName} مستقر. يوفر ${bestProviderName} حالياً أعلى قيمة استلام مؤكدة بمستوى ثقة (${confidenceBand}) لمبلغ ${amount.toLocaleString()} ريال.`;
    }
    return `${countryName}'s corridor is stable. ${bestProviderName} currently offers the strongest verified payout with ${confidenceBand} confidence for a ${amount.toLocaleString()} SAR transfer.`;
  };

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 bg-sds-primary/10 border border-sds-primary/20 rounded-2xl text-xs text-sds-text ${className}`}>
      <div className="p-1 rounded-lg bg-sds-primary/20 text-sds-primary shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
      <p className="font-medium text-[11px] leading-relaxed">
        {getBriefingText()}
      </p>
    </div>
  );
}
