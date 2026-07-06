/**
 * Reusable Timestamp & Freshness Helper for SariRemit
 * Sourced entirely from real Firebase fields with multi-language support.
 */

export function parseTimestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  // If it's a Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // If it's an object with seconds/nanoseconds (de-serialized Firestore Timestamp)
  if (typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  // If it's a Date object
  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? null : timestamp;
  }
  // If it's a number (milliseconds)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  // If it's a string (e.g. ISO string)
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatRelativeTime(timestamp: any, language: 'en' | 'ar' = 'en'): string {
  const date = parseTimestampToDate(timestamp);
  if (!date) {
    return language === 'en' ? 'Update time unavailable' : 'وقت التحديث غير متاح';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return language === 'en' ? 'Updated just now' : 'تم التحديث الآن';
  }
  if (diffMins < 60) {
    return language === 'en' 
      ? `Updated ${diffMins} minute${diffMins > 1 ? 's' : ''} ago` 
      : `تم التحديث قبل ${diffMins} دقيقة`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    if (isToday) {
      if (diffHours === 1) {
        return language === 'en' ? 'Updated 1 hour ago' : 'تم التحديث قبل ساعة';
      }
      return language === 'en' ? `Updated ${diffHours} hours ago` : `تم التحديث قبل ${diffHours} ساعة`;
    } else {
      return language === 'en' ? 'Updated today' : 'تم التحديث اليوم';
    }
  }

  const yesterdayDate = new Date(now.getTime() - 86400000);
  const isYesterday = yesterdayDate.getDate() === date.getDate() &&
                      yesterdayDate.getMonth() === date.getMonth() &&
                      yesterdayDate.getFullYear() === date.getFullYear();
  if (isYesterday) {
    return language === 'en' ? 'Updated yesterday' : 'تم التحديث بالأمس';
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return language === 'en' 
      ? `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago` 
      : `تم التحديث قبل ${diffDays} يوم`;
  }

  return language === 'en' ? 'Update time unavailable' : 'وقت التحديث غير متاح';
}

export function getFreshnessLabelFromTimestamp(timestamp: any): 'Very Fresh' | 'Fresh' | 'Moderately Fresh' | 'Getting Old' | 'Stale' | 'Expired' | 'Unknown' {
  const date = parseTimestampToDate(timestamp);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins <= 30) {
    return 'Very Fresh';
  } else if (diffMins <= 120) {
    return 'Fresh';
  } else if (diffMins <= 360) { // 2–6 hours
    return 'Moderately Fresh';
  } else if (diffMins <= 720) { // 6–12 hours
    return 'Getting Old';
  } else if (diffMins <= 1440) { // 12–24 hours
    return 'Stale';
  } else {
    return 'Expired';
  }
}

/**
 * Priority timestamp finder for options
 * 1. resolved_rates.updated_at
 * 2. resolved_rates.resolved_at
 * 3. admin_rate_overrides.updated_at
 * 4. market_reference_rates.fetched_at
 * 5. community_rate_consensus.updated_at
 */
export function getOptionTimestamp(
  option: { providerId: string; corridorId: string; subService?: string },
  resolvedRates: any[] = [],
  adminRateOverrides: any[] = [],
  marketReferenceRates: any[] = [],
  communityConsensuses: any[] = []
): any {
  const pId = option.providerId;
  const cId = option.corridorId;
  const sub = option.subService;

  // 1 & 2: resolved_rates.updated_at or resolved_rates.resolved_at
  if (resolvedRates && resolvedRates.length > 0) {
    const resRate = resolvedRates.find(r => 
      r.provider_id === pId && 
      r.corridor_id === cId && 
      (!sub || r.sub_service === sub)
    );
    if (resRate) {
      if (resRate.updated_at) return resRate.updated_at;
      if (resRate.resolved_at) return resRate.resolved_at;
      if (resRate.last_updated_at) return resRate.last_updated_at;
    }
  }

  // 3: admin_rate_overrides.updated_at
  if (adminRateOverrides && adminRateOverrides.length > 0) {
    const override = adminRateOverrides.find(o => 
      o.providerId === pId && 
      (o.corridor === cId || o.corridor === 'all') && 
      (!sub || o.transferPartner === sub) && 
      o.active
    );
    if (override) {
      if (override.updated_at) return override.updated_at;
      if (override.updatedAt) return override.updatedAt;
    }
  }

  // 4: market_reference_rates.fetched_at
  if (marketReferenceRates && marketReferenceRates.length > 0) {
    const refRate = marketReferenceRates.find(m => 
      m.provider_id === pId && 
      m.corridor === cId
    );
    if (refRate) {
      if (refRate.fetched_at) return refRate.fetched_at;
      if (refRate.timestamp) return refRate.timestamp;
    }
  }

  // 5: community_rate_consensus.updated_at
  if (communityConsensuses && communityConsensuses.length > 0) {
    const consensus = communityConsensuses.find(c => 
      c.provider === pId && 
      c.corridor === cId && 
      (!sub || c.transfer_partner === sub)
    );
    if (consensus) {
      if (consensus.updated_at) return consensus.updated_at;
      if (consensus.consensus_updated_at) return consensus.consensus_updated_at;
    }
  }

  return null;
}
