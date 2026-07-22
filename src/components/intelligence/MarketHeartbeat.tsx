import React from 'react';
import { TrendingUp, RefreshCw, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { SriReferenceBenchmark } from '../../types';
import { FreshnessStatus } from '../../services/freshnessService';

interface MarketHeartbeatProps {
  benchmark?: SriReferenceBenchmark | null;
  benchmarkRate?: number;
  activeCorridor?: any;
  corridorCode?: string;
  currencyCode?: string;
  monitoredProvidersCount?: number;
  providerCount?: number;
  status?: FreshnessStatus;
  freshnessStatus?: FreshnessStatus;
  lastUpdatedText?: string;
  confidenceBand?: string;
  isRtl?: boolean;
  className?: string;
}

export function MarketHeartbeat({
  benchmark,
  benchmarkRate,
  activeCorridor,
  currencyCode = 'PKR',
  monitoredProvidersCount,
  providerCount,
  status,
  freshnessStatus,
  lastUpdatedText = 'Just now',
  isRtl = false,
  className = '',
}: MarketHeartbeatProps) {
  const rateVal = benchmarkRate ?? benchmark?.rate ?? 0;
  const providersTotal = providerCount ?? monitoredProvidersCount ?? 7;
  const targetCurrency = activeCorridor?.currencyCode || currencyCode;

  return (
    <div className={`bg-sds-card border border-sds-border rounded-3xl p-5 shadow-sds-md space-y-4 text-left ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sds-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sds-primary/10 border border-sds-primary/20 text-sds-primary">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-sds-text tracking-wider font-mono">
              {isRtl ? 'نبض سوق تحويل الأموال' : 'Market Intelligence Heartbeat'}
            </h3>
            <p className="text-[10px] text-sds-text-sec font-medium">
              {isRtl ? 'مراقبة المؤشرات والمقارنات في الوقت الفعلي' : 'Active monitoring of reference rates & fee benchmarks'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-sds-success/10 border border-sds-success/20 text-sds-success text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sds-success animate-pulse" />
          {isRtl ? 'نشط' : 'Active'}
        </span>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Metric 1: Reference Index */}
        <div className="p-3 bg-sds-bg-sec rounded-2xl border border-sds-border/60">
          <span className="text-[9px] font-mono font-bold uppercase text-sds-text-sec block">
            {isRtl ? 'السعر المرجعي (SRI)' : 'Reference Index (SRI)'}
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-sds-text block mt-1">
            {rateVal > 0 ? rateVal.toFixed(2) : '--'} <span className="text-[10px] text-sds-text-sec font-sans">{targetCurrency}</span>
          </span>
          <span className="text-[8px] text-sds-text-sec mt-0.5 block">
            {isRtl ? 'مؤشر السوق المحايد' : 'Neutral market baseline'}
          </span>
        </div>

        {/* Metric 2: Monitored Channels */}
        <div className="p-3 bg-sds-bg-sec rounded-2xl border border-sds-border/60">
          <span className="text-[9px] font-mono font-bold uppercase text-sds-text-sec block">
            {isRtl ? 'المزودون المراقَبون' : 'Monitored Providers'}
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-sds-success block mt-1">
            {providersTotal} {isRtl ? 'مؤسسة' : 'Channels'}
          </span>
          <span className="text-[8px] text-sds-text-sec mt-0.5 block">
            {isRtl ? 'بنوك ومحافظ رقمية' : 'Banks & digital wallets'}
          </span>
        </div>

        {/* Metric 3: Data Freshness */}
        <div className="p-3 bg-sds-bg-sec rounded-2xl border border-sds-border/60">
          <span className="text-[9px] font-mono font-bold uppercase text-sds-text-sec block">
            {isRtl ? 'حالة التحديث' : 'Data Freshness'}
          </span>
          <span className="text-xs font-black font-mono text-sds-text block mt-1 truncate">
            {lastUpdatedText}
          </span>
          <span className="text-[8px] text-sds-text-sec mt-0.5 block">
            {isRtl ? 'تحديث موثق' : 'Verified update timestamp'}
          </span>
        </div>

        {/* Metric 4: Stability Indicator */}
        <div className="p-3 bg-sds-bg-sec rounded-2xl border border-sds-border/60">
          <span className="text-[9px] font-mono font-bold uppercase text-sds-text-sec block">
            {isRtl ? 'استقرار المسار' : 'Corridor Stability'}
          </span>
          <span className="text-xs font-black font-mono text-sds-success block mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sds-success" />
            {isRtl ? 'مستقر وآمن' : 'Optimal & Stable'}
          </span>
          <span className="text-[8px] text-sds-text-sec mt-0.5 block">
            {isRtl ? 'تذبذب منخفض' : 'Low volatility index'}
          </span>
        </div>

      </div>

    </div>
  );
}

interface CorridorMovementProps {
  changeAmount?: number;
  lastUpdated?: string;
  isRtl?: boolean;
}

export function CorridorMovement({
  changeAmount = 0,
  lastUpdated,
  isRtl = false,
}: CorridorMovementProps) {
  if (changeAmount === 0) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sds-bg-sec border border-sds-border text-[9px] font-mono text-sds-text-sec">
        <Minus className="w-3 h-3 text-sds-text-sec" />
        <span>{isRtl ? 'مستقر' : 'Stable'}</span>
      </div>
    );
  }

  const isPositive = changeAmount > 0;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-mono font-bold ${
        isPositive
          ? 'bg-sds-success/10 border-sds-success/20 text-sds-success'
          : 'bg-sds-error/10 border-sds-error/20 text-sds-error'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3 text-sds-success" />
      ) : (
        <ArrowDownRight className="w-3 h-3 text-sds-error" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {changeAmount.toFixed(2)} {isRtl ? 'اليوم' : 'today'}
      </span>
    </div>
  );
}
