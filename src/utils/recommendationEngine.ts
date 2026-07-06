import { getRemittanceOptions, PROVIDERS } from '../data/mockData';
import { resolveRate } from './costEngine';
import { analyzeCorridorIntelligence } from './intelligenceEngine';
import { getOptionTimestamp, getFreshnessLabelFromTimestamp } from './timestampHelper';

export interface RecommendationInput {
  amount: number;
  corridor: string; // e.g. 'PK'
  receiveMethod?: string; // e.g. 'all', 'wallet', 'bank', 'cash'
  // Dynamic datasets (from Firebase / reactive state)
  adminRateOverrides?: any[];
  recentSubmissions?: any[];
  liveApiRates?: any;
  customFees?: any;
  customRates?: any;
  resolvedRates?: any[];
  marketReferenceRates?: any[];
  communityConsensuses?: any[];
}

export interface RecommendationResult {
  recommended_provider: string; // e.g. 'urpay'
  provider_name: string;
  recipient_amount: number;
  exchange_rate: number;
  transfer_fee: number;
  vat_amount: number;
  total_cost: number;
  extra_value: number;
  confidence_label: string; // High/Medium/Low
  freshness_label: string;
  send_wait_signal: string; // Send Now/Wait/Monitor
  updated_at: string; // timestamp string
  source_label: string; // e.g. 'Verified Rate'
  sub_service?: string;
  delivery_speed?: string;
  currency_code?: string;
}

/**
 * Single source of truth for rate and recommendation resolution.
 * Combines True Cost Engine (RRE) and Corridor Timing Intelligence.
 */
export function getResolvedRecommendation(params: RecommendationInput): RecommendationResult | null {
  const {
    amount,
    corridor,
    receiveMethod = 'all',
    adminRateOverrides = [],
    recentSubmissions = [],
    liveApiRates = {},
    customFees = {},
    customRates = {},
    resolvedRates = [],
    marketReferenceRates = [],
    communityConsensuses = []
  } = params;

  // Retrieve base options for the corridor
  const rawOptions = getRemittanceOptions(corridor);
  if (!rawOptions || rawOptions.length === 0) return null;

  // Process all options with resolveRate
  const processed = rawOptions.map(opt => {
    let baselineRate = opt.exchangeRate;
    let baselineFee = opt.fee;
    
    // Live rate override
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

    // Custom rate offset
    const overrideKey = `${opt.providerId}_${opt.corridorId}`;
    if (customRates && customRates[overrideKey] !== undefined) {
      baselineRate = Math.max(0.01, baselineRate + customRates[overrideKey]);
    }

    // Resolve rate with standard Engine mapping priorities
    const resolution = resolveRate(
      opt.providerId,
      opt.corridorId,
      opt.subService as any,
      amount,
      receiveMethod as any,
      adminRateOverrides,
      recentSubmissions,
      liveApiRates,
      customFees,
      baselineRate,
      baselineFee
    );

    // Get real Firebase / computed timestamp
    const optTimestamp = getOptionTimestamp(
      { providerId: opt.providerId, corridorId: opt.corridorId, subService: opt.subService },
      resolvedRates,
      adminRateOverrides,
      marketReferenceRates,
      communityConsensuses
    );
    const freshnessLabel = getFreshnessLabelFromTimestamp(optTimestamp);

    return {
      ...opt,
      exchangeRate: resolution.selectedExchangeRate,
      fee: resolution.selectedFee,
      vatAmount: resolution.selectedVat,
      total_cost: resolution.selectedTotalCost,
      estimatedReceived: resolution.selectedRecipientAmount,
      confidenceScore: resolution.sourceConfidence,
      firebaseTimestamp: optTimestamp,
      freshness_label: freshnessLabel,
      source_label: resolution.sourceLabel,
      selected_rate_source: resolution.selectedRateSource,
    };
  });

  // Filter based on receiveMethod
  const filtered = processed.filter(opt => {
    if (receiveMethod !== 'all' && !opt.transferMethods.includes(receiveMethod as any)) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) return null;

  // Run the intelligence timing engine
  const intelligence = analyzeCorridorIntelligence(amount, corridor, filtered);
  if (!intelligence) return null;

  const bestOpt = intelligence.bestOption;
  const pName = PROVIDERS.find(p => p.id === bestOpt.providerId)?.name || bestOpt.providerId;

  return {
    recommended_provider: bestOpt.providerId,
    provider_name: pName,
    recipient_amount: bestOpt.estimatedReceived,
    exchange_rate: bestOpt.exchangeRate,
    transfer_fee: bestOpt.fee,
    vat_amount: bestOpt.vatAmount || 0,
    total_cost: bestOpt.total_cost,
    extra_value: intelligence.extraValue,
    confidence_label: intelligence.confidence,
    freshness_label: bestOpt.freshness_label || 'Unknown',
    send_wait_signal: intelligence.signal,
    updated_at: bestOpt.firebaseTimestamp || new Date().toISOString(),
    source_label: bestOpt.source_label || 'Live API',
    sub_service: bestOpt.subService,
    delivery_speed: bestOpt.deliverySpeedEn,
    currency_code: bestOpt.currencyCode
  };
}
