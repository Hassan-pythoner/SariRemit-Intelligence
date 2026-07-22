import { useState, useEffect, useRef } from 'react';
import { FreshnessInfo, formatIntelligenceFreshness } from '../services/freshnessService';

/**
 * Hook to automatically update relative freshness text every 15 seconds.
 */
export function useIntelligenceFreshness(
  lastUpdatedInput?: string | Date | number | null,
  isRefreshing: boolean = false,
  isLiveRealtime: boolean = false
): FreshnessInfo {
  // Use a ref for fallback timestamp so it stays stable across renders if lastUpdatedInput is missing
  const fallbackRef = useRef<string>(new Date().toISOString());
  const effectiveInput = lastUpdatedInput || fallbackRef.current;

  const timestampKey = effectiveInput instanceof Date 
    ? effectiveInput.getTime() 
    : String(effectiveInput);

  const [freshness, setFreshness] = useState<FreshnessInfo>(() =>
    formatIntelligenceFreshness(effectiveInput, isRefreshing, isLiveRealtime)
  );

  useEffect(() => {
    const nextFreshness = formatIntelligenceFreshness(effectiveInput, isRefreshing, isLiveRealtime);
    setFreshness(prev => {
      if (
        prev.status === nextFreshness.status &&
        prev.formattedTextEn === nextFreshness.formattedTextEn &&
        prev.formattedTextAr === nextFreshness.formattedTextAr
      ) {
        return prev;
      }
      return nextFreshness;
    });

    const interval = setInterval(() => {
      setFreshness(prev => {
        const periodic = formatIntelligenceFreshness(effectiveInput, isRefreshing, isLiveRealtime);
        if (
          prev.status === periodic.status &&
          prev.formattedTextEn === periodic.formattedTextEn &&
          prev.formattedTextAr === periodic.formattedTextAr
        ) {
          return prev;
        }
        return periodic;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [timestampKey, isRefreshing, isLiveRealtime]);

  return freshness;
}

