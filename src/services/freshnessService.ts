export type FreshnessStatus = 'live' | 'recent' | 'refreshing' | 'delayed' | 'cached' | 'unavailable';

export interface FreshnessInfo {
  status: FreshnessStatus;
  formattedTextEn: string;
  formattedTextAr: string;
  diffMinutes: number | null;
  lastUpdatedDate: Date | null;
}

/**
 * Formats genuine timestamps accurately without hardcoded fake values or random numbers.
 */
export function formatIntelligenceFreshness(
  lastUpdatedInput?: string | Date | number | null,
  isRefreshing: boolean = false,
  isLiveRealtime: boolean = false
): FreshnessInfo {
  if (isRefreshing) {
    return {
      status: 'refreshing',
      formattedTextEn: 'Refreshing intelligence...',
      formattedTextAr: 'جاري تحديث البيانات...',
      diffMinutes: 0,
      lastUpdatedDate: new Date(),
    };
  }

  if (!lastUpdatedInput) {
    return {
      status: 'unavailable',
      formattedTextEn: 'Freshness unavailable',
      formattedTextAr: 'الحداثة غير متوفرة',
      diffMinutes: null,
      lastUpdatedDate: null,
    };
  }

  const date = new Date(lastUpdatedInput);
  if (isNaN(date.getTime())) {
    return {
      status: 'unavailable',
      formattedTextEn: 'Freshness unavailable',
      formattedTextAr: 'الحداثة غير متوفرة',
      diffMinutes: null,
      lastUpdatedDate: null,
    };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (isLiveRealtime && diffSeconds < 30) {
    return {
      status: 'live',
      formattedTextEn: 'Updated just now',
      formattedTextAr: 'تم التحديث الآن',
      diffMinutes,
      lastUpdatedDate: date,
    };
  }

  if (diffSeconds < 60) {
    return {
      status: 'recent',
      formattedTextEn: diffSeconds <= 10 ? 'Updated just now' : `Updated ${diffSeconds}s ago`,
      formattedTextAr: diffSeconds <= 10 ? 'تم التحديث الآن' : `تم التحديث منذ ${diffSeconds} ثانية`,
      diffMinutes: 0,
      lastUpdatedDate: date,
    };
  }

  if (diffMinutes < 60) {
    return {
      status: 'recent',
      formattedTextEn: `Updated ${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`,
      formattedTextAr: `تم التحديث منذ ${diffMinutes} دقيقة`,
      diffMinutes,
      lastUpdatedDate: date,
    };
  }

  if (diffHours < 24) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      status: 'cached',
      formattedTextEn: `Refreshed today at ${timeStr}`,
      formattedTextAr: `تم التحديث اليوم الساعة ${timeStr}`,
      diffMinutes,
      lastUpdatedDate: date,
    };
  }

  return {
    status: 'delayed',
    formattedTextEn: 'Data is older than usual',
    formattedTextAr: 'البيانات أقدم من المعتاد',
    diffMinutes,
    lastUpdatedDate: date,
  };
}
