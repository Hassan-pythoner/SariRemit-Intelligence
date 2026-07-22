import React from 'react';
import { FreshnessStatus } from '../../services/freshnessService';
import { Loader2, ShieldCheck, Clock, AlertTriangle, Database, Zap } from 'lucide-react';

interface LiveIntelligenceStatusProps {
  status: FreshnessStatus;
  monitoredProvidersCount?: number;
  formattedText?: string;
  lastUpdatedText?: string;
  isRtl?: boolean;
  className?: string;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveIntelligenceStatus({
  status,
  monitoredProvidersCount = 7,
  formattedText,
  lastUpdatedText,
  isRtl = false,
  className = '',
  compact = false,
  size,
}: LiveIntelligenceStatusProps) {
  const displayTime = lastUpdatedText || formattedText;
  const renderDotAndIcon = () => {
    switch (status) {
      case 'live':
        return (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sds-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sds-success"></span>
          </span>
        );
      case 'refreshing':
        return <Loader2 className="w-3 h-3 text-sds-primary animate-spin shrink-0" />;
      case 'recent':
        return <span className="inline-block w-2 h-2 rounded-full bg-sds-success shrink-0" />;
      case 'delayed':
        return <span className="inline-block w-2 h-2 rounded-full bg-sds-gold shrink-0" />;
      case 'cached':
        return <Database className="w-3 h-3 text-sds-text-sec shrink-0" />;
      case 'unavailable':
      default:
        return <span className="inline-block w-2 h-2 rounded-full bg-sds-error shrink-0" />;
    }
  };

  const getDefaultText = () => {
    if (displayTime) return displayTime;
    switch (status) {
      case 'live':
        return isRtl ? 'بيانات حية ومباشرة' : 'Live Intelligence';
      case 'refreshing':
        return isRtl ? 'جاري التحقق والتحديث...' : 'Refreshing intelligence...';
      case 'recent':
        return isRtl ? 'تم التحديث مؤخراً' : 'Recently Updated';
      case 'delayed':
        return isRtl ? 'بيانات أقدم من المعتاد' : 'Delayed Data';
      case 'cached':
        return isRtl ? 'مستخرج من الأرشيف الآمن' : 'Using Cached Data';
      case 'unavailable':
      default:
        return isRtl ? 'تحديث غير متوفر' : 'Temporarily Unavailable';
    }
  };

  return (
    <div
      role="status"
      aria-label={getDefaultText()}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight border transition-colors ${
        status === 'live'
          ? 'bg-sds-success/10 border-sds-success/25 text-sds-success'
          : status === 'refreshing'
          ? 'bg-sds-primary/10 border-sds-primary/25 text-sds-primary'
          : status === 'recent'
          ? 'bg-sds-bg-sec border-sds-border text-sds-text'
          : status === 'delayed'
          ? 'bg-sds-gold/10 border-sds-gold/25 text-sds-gold'
          : status === 'cached'
          ? 'bg-sds-bg-sec border-sds-border text-sds-text-sec'
          : 'bg-sds-error/10 border-sds-error/25 text-sds-error'
      } ${className}`}
    >
      {renderDotAndIcon()}
      <span className="truncate">
        {getDefaultText()}
        {!compact && monitoredProvidersCount > 0 && status === 'live' && (
          <span className="opacity-70 font-normal">
            {' • '}{isRtl ? `مراقبة ${monitoredProvidersCount} مزودين` : `Monitoring ${monitoredProvidersCount} providers`}
          </span>
        )}
      </span>
    </div>
  );
}
