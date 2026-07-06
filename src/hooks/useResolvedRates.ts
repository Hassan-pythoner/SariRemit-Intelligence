import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { getRemittanceOptions, PROVIDERS } from '../data/mockData';
import { resolveRate } from '../utils/costEngine';
import { getOptionTimestamp, formatRelativeTime, getFreshnessLabelFromTimestamp } from '../utils/timestampHelper';
import { getResolvedRecommendation } from '../utils/recommendationEngine';

export interface UseResolvedRatesParams {
  amount: number;
  corridor: string;
  receiveMethod: string;
  adminRateOverrides: any[];
  recentSubmissions: any[];
  customRates?: Record<string, number>;
  customFees?: Record<string, any>;
  resolvedRates?: any[];
  marketReferenceRates?: any[];
  communityConsensuses?: any[];
  sortBy?: 'received' | 'rate' | 'fee' | 'speed';
  filterProvider?: string;
}

export function useResolvedRates({
  amount,
  corridor,
  receiveMethod,
  adminRateOverrides = [],
  recentSubmissions = [],
  customRates = {},
  customFees = {},
  resolvedRates = [],
  marketReferenceRates = [],
  communityConsensuses = [],
  sortBy = 'received',
  filterProvider = 'all'
}: UseResolvedRatesParams) {
  const { language } = useLanguage();

  const [liveApiRates, setLiveApiRates] = useState<any>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(false);
  const [liveRatesSource, setLiveRatesSource] = useState<string>('');
  const [liveLastFetched, setLiveLastFetched] = useState<string>('');

  const fetchLiveRates = async () => {
    setIsLiveLoading(true);
    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const browser = /Chrome/i.test(navigator.userAgent) ? "Chrome" :
                      /Safari/i.test(navigator.userAgent) ? "Safari" :
                      /Firefox/i.test(navigator.userAgent) ? "Firefox" : "Browser";
      const deviceLabel = `${isMobile ? 'Mobile' : 'Desktop'} ${browser}`;
      
      const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http')
        ? window.location.origin
        : '';
      const res = await fetch(`${origin}/api/live-rates?device=${encodeURIComponent(deviceLabel)}&corridor=${encodeURIComponent(corridor)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setLiveApiRates(data.rates);
          setLiveRatesSource(data.source);
          if (data.lastFetched) {
            setLiveLastFetched(new Date(data.lastFetched).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load real-time public exchange rates gracefully:", err);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsLiveLoading(true);
    try {
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const browser = /Chrome/i.test(navigator.userAgent) ? "Chrome" :
                      /Safari/i.test(navigator.userAgent) ? "Safari" :
                      /Firefox/i.test(navigator.userAgent) ? "Firefox" : "Browser";
      const deviceLabel = `${isMobile ? 'Mobile' : 'Desktop'} ${browser}`;
      
      const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http')
        ? window.location.origin
        : '';
      const res = await fetch(`${origin}/api/live-rates/refresh?device=${encodeURIComponent(deviceLabel)}&corridor=${encodeURIComponent(corridor)}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setLiveApiRates(data.rates);
          setLiveRatesSource(data.source);
          if (data.lastFetched) {
            setLiveLastFetched(new Date(data.lastFetched).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
          }
        }
      }
    } catch (err) {
      console.warn("Failed to force refresh live rates gracefully:", err);
    } finally {
      setIsLiveLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 60000);
    return () => clearInterval(interval);
  }, [corridor]);

  const processedOptions = useMemo(() => {
    const rawOptions = getRemittanceOptions(corridor);
    if (!rawOptions) return [];

    return rawOptions
      .map(opt => {
        let baselineRate = opt.exchangeRate;
        let baselineFee = opt.fee;
        
        if (liveApiRates && liveApiRates[corridor]) {
          const liveOpt = liveApiRates[corridor].find((l: any) => {
            if (opt.subService) {
              return l.providerId === opt.providerId && l.subService === opt.subService;
            }
            return l.providerId === opt.providerId;
          });
          if (liveOpt) {
            baselineRate = liveOpt.exchangeRate;
            baselineFee = liveOpt.fee;
          }
        }

        const overrideKey = `${opt.providerId}_${opt.corridorId}`;
        if (customRates && customRates[overrideKey] !== undefined) {
          baselineRate = Math.max(0.01, baselineRate + customRates[overrideKey]);
        }

        const resolution = resolveRate(
          opt.providerId,
          opt.corridorId,
          opt.subService,
          amount,
          receiveMethod as any,
          adminRateOverrides || [],
          recentSubmissions || [],
          liveApiRates || {},
          customFees || {},
          baselineRate,
          baselineFee
        );

        const optTimestamp = getOptionTimestamp(
          { providerId: opt.providerId, corridorId: opt.corridorId, subService: opt.subService },
          resolvedRates,
          adminRateOverrides,
          marketReferenceRates,
          communityConsensuses
        );
        const relativeTime = formatRelativeTime(optTimestamp, language === 'en' ? 'en' : 'ar');
        const freshnessLabel = getFreshnessLabelFromTimestamp(optTimestamp);

        // Evaluate cache status of Market Reference Rates (if used)
        let finalSourceBadge = resolution.source_badge;
        let finalSourceLabel = resolution.sourceLabel;
        let finalFreshnessLabel: any = freshnessLabel;
        let finalRateSource = resolution.selectedRateSource;
        let finalConfidenceScore = resolution.sourceConfidence;

        if (resolution.selectedRateSource === 'Market Reference Rate' || resolution.selectedRateSource === 'Reference Rate (Unavailable)') {
          const matchingRefRate = marketReferenceRates?.find(m => 
            m.corridor === opt.corridorId && 
            m.provider_id === opt.providerId
          );

          if (matchingRefRate) {
            const refTimestamp = matchingRefRate.timestamp || matchingRefRate.retrievedAt || matchingRefRate.updatedAt;
            if (refTimestamp) {
              const ageInHours = (Date.now() - new Date(refTimestamp).getTime()) / (1000 * 60 * 60);
              if (ageInHours > 12) {
                finalRateSource = 'Reference Rate (Unavailable)';
                finalSourceBadge = 'Reference Rate (Unavailable)';
                finalSourceLabel = 'Market Reference Rate unavailable';
                finalFreshnessLabel = 'Unable to verify current market intelligence.';
                finalConfidenceScore = 0;
              } else {
                if (ageInHours <= 0.25) {
                  const minsAgo = Math.max(1, Math.round(ageInHours * 60));
                  finalSourceBadge = 'Market Reference';
                  finalSourceLabel = 'Market Reference Rate';
                  finalFreshnessLabel = `Updated ${minsAgo} minutes ago`;
                } else {
                  const hoursAgo = Math.max(1, Math.round(ageInHours));
                  finalSourceBadge = 'Market Reference';
                  finalSourceLabel = 'Market Reference Rate (Cached)';
                  finalFreshnessLabel = `Updated ${hoursAgo} hours ago`;
                }
              }
            } else {
              finalRateSource = 'Reference Rate (Unavailable)';
              finalSourceBadge = 'Reference Rate (Unavailable)';
              finalSourceLabel = 'Market Reference Rate unavailable';
              finalFreshnessLabel = 'Unable to verify current market intelligence.';
              finalConfidenceScore = 0;
            }
          } else {
            finalRateSource = 'Reference Rate (Unavailable)';
            finalSourceBadge = 'Reference Rate (Unavailable)';
            finalSourceLabel = 'Market Reference Rate unavailable';
            finalFreshnessLabel = 'Unable to verify current market intelligence.';
            finalConfidenceScore = 0;
          }
        }

        return {
          ...opt,
          exchangeRate: resolution.selectedExchangeRate,
          transfer_fee: resolution.selectedFee,
          transferFee: resolution.selectedFee,
          vatAmount: resolution.selectedVat, // For mobile
          vat_amount: resolution.selectedVat, // For desktop
          additional_charges: Math.max(0, resolution.selectedTotalCost - resolution.selectedFee - resolution.selectedVat),
          total_cost: resolution.selectedTotalCost,
          net_transfer_amount: Math.max(0, amount - resolution.selectedTotalCost),
          effective_exchange_rate: amount > 0 ? Number((resolution.selectedRecipientAmount / amount).toFixed(6)) : 0,
          
          fee: resolution.selectedFee, 
          estimatedReceived: resolution.selectedRecipientAmount,
          netSending: Math.max(0, amount - resolution.selectedTotalCost),
          lastUpdatedMinutesAgo: opt.lastUpdatedMinutesAgo,
          isLiveFetched: finalRateSource === 'Provider Verified' || finalRateSource === 'Public Market Rate' || (finalRateSource === 'Market Reference Rate' && finalSourceLabel !== 'Market Reference Rate unavailable'),
          
          firebaseTimestamp: optTimestamp,
          relativeTime: relativeTime,
          
          selected_rate_source: finalRateSource,
          source_confidence: finalConfidenceScore,
          confidenceScore: finalConfidenceScore, // For mobile compatibility
          source_label: finalSourceLabel,
          is_expiring_soon: resolution.isExpiringSoon,
          matched_override_id: resolution.matchedOverrideId,
          resolved_at: resolution.resolvedAt || optTimestamp,
          freshness_score: finalSourceLabel === 'Market Reference Rate unavailable' ? 0 : resolution.freshness_score,
          freshness_label: finalFreshnessLabel,
          source_badge: finalSourceBadge,
          cost_breakdown: resolution.cost_breakdown || {
            promotionalDiscount: 0,
            providerDiscount: 0,
          }
        };
      })
      .filter(opt => {
        if (receiveMethod !== 'all' && !opt.transferMethods.includes(receiveMethod as any)) {
          return false;
        }
        if (filterProvider !== 'all' && opt.providerId !== filterProvider) {
          return false;
        }
        return true;
      });
  }, [corridor, amount, receiveMethod, liveApiRates, customRates, customFees, adminRateOverrides, recentSubmissions, resolvedRates, marketReferenceRates, communityConsensuses, filterProvider, language]);

  const sortedOptions = useMemo(() => {
    return [...processedOptions].sort((a, b) => {
      if (sortBy === 'received') {
        if (Math.abs(b.estimatedReceived - a.estimatedReceived) > 0.0001) {
          return b.estimatedReceived - a.estimatedReceived;
        }
        if (Math.abs(a.total_cost - b.total_cost) > 0.0001) {
          return a.total_cost - b.total_cost;
        }
        if (b.confidenceScore !== a.confidenceScore) {
          return b.confidenceScore - a.confidenceScore;
        }
        const provA = PROVIDERS.find(p => p.id === a.providerId);
        const provB = PROVIDERS.find(p => p.id === b.providerId);
        const ratingA = provA?.rating || 0;
        const ratingB = provB?.rating || 0;
        return ratingB - ratingA;
      }
      if (sortBy === 'rate') return b.exchangeRate - a.exchangeRate;
      if (sortBy === 'fee') return a.total_cost - b.total_cost;
      if (sortBy === 'speed') {
        const getSpeedWeight = (opt: any) => {
          if (opt.deliverySpeedEn.toLowerCase().includes('instant')) return 1;
          if (opt.deliverySpeedEn.toLowerCase().includes('minute')) return 2;
          if (opt.deliverySpeedEn.toLowerCase().includes('hour')) return 3;
          return 4;
        };
        return getSpeedWeight(a) - getSpeedWeight(b);
      }
      return 0;
    });
  }, [processedOptions, sortBy]);

  const sortedByValue = useMemo(() => {
    return [...processedOptions].sort((a, b) => {
      if (Math.abs(b.estimatedReceived - a.estimatedReceived) > 0.0001) {
        return b.estimatedReceived - a.estimatedReceived;
      }
      if (Math.abs(a.total_cost - b.total_cost) > 0.0001) {
        return a.total_cost - b.total_cost;
      }
      if (b.confidenceScore !== a.confidenceScore) {
        return b.confidenceScore - a.confidenceScore;
      }
      const provA = PROVIDERS.find(p => p.id === a.providerId);
      const provB = PROVIDERS.find(p => p.id === b.providerId);
      return (provB?.rating || 0) - (provA?.rating || 0);
    });
  }, [processedOptions]);

  const bestOption = useMemo(() => sortedByValue.length > 0 ? sortedByValue[0] : null, [sortedByValue]);
  const worstOption = useMemo(() => sortedByValue.length > 0 ? sortedByValue[sortedByValue.length - 1] : null, [sortedByValue]);

  const savingsDiff = useMemo(() => {
    return bestOption && worstOption 
      ? bestOption.estimatedReceived - worstOption.estimatedReceived 
      : 0;
  }, [bestOption, worstOption]);

  const savingsDiffSar = useMemo(() => {
    return bestOption && savingsDiff > 0
      ? savingsDiff / bestOption.exchangeRate
      : 0;
  }, [bestOption, savingsDiff]);

  const recommendation = useMemo(() => {
    return getResolvedRecommendation({
      amount,
      corridor,
      receiveMethod,
      adminRateOverrides,
      recentSubmissions,
      liveApiRates,
      customFees,
      customRates,
      resolvedRates,
      marketReferenceRates,
      communityConsensuses
    });
  }, [amount, corridor, receiveMethod, adminRateOverrides, recentSubmissions, liveApiRates, customFees, customRates, resolvedRates, marketReferenceRates, communityConsensuses]);

  return {
    processedOptions,
    sortedOptions,
    bestOption,
    worstOption,
    savingsDiff,
    savingsDiffSar,
    recommendation,
    liveApiRates,
    isLiveLoading,
    liveRatesSource,
    liveLastFetched,
    fetchLiveRates,
    handleForceRefresh
  };
}
