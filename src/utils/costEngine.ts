// True Cost Engine for SariRemit
import { 
  AdminRateOverride, 
  RateResolutionResult, 
  RateSourceType, 
  ProviderId, 
  CorridorId, 
  TransferMethod, 
  CrowdsourcedRate 
} from '../types';

export interface FeeStructure {
  providerId: string;
  corridorId: string;
  subService?: string;
  transferFee: number;
  vatRate: number; // e.g. 0.15 (15%)
  vatAmount?: number; // optional explicit VAT override
  serviceCharge: number;
  corridorCharge: number;
  promotionalDiscount: number;
  providerDiscount: number;
  effectiveDate?: string;
  expiryDate?: string;
}

export interface CostCalculationOutput {
  sendAmount: number;
  exchangeRate: number;
  transferFee: number;
  vatAmount: number;
  serviceCharge: number;
  corridorCharge: number;
  promotionalDiscount: number;
  providerDiscount: number;
  totalCost: number; // sum of fees + charges - discounts
  netTransferAmount: number; // sendAmount - totalCost
  recipientAmount: number; // netTransferAmount * exchangeRate
  effectiveExchangeRate: number; // recipientAmount / sendAmount
}

// Default fee structures for providers if no admin override is set
export const DEFAULT_FEE_STRUCTURES: Record<string, Partial<FeeStructure>> = {
  'urpay_Western Union': { transferFee: 13.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'urpay_Transfast': { transferFee: 7.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'urpay_Moneygram': { transferFee: 10.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'stcpay_none': { transferFee: 10.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'stcpay_default': { transferFee: 10.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'mobilypay_default': { transferFee: 9.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'alrajhi_default': { transferFee: 15.0, vatRate: 0.15, serviceCharge: 2.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'quickpay_default': { transferFee: 15.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 1.0, promotionalDiscount: 0.0, providerDiscount: 0.0 },
  'enjaz_default': { transferFee: 14.0, vatRate: 0.15, serviceCharge: 0.0, corridorCharge: 0.0, promotionalDiscount: 1.0, providerDiscount: 0.0 },
  'westernunion_default': { transferFee: 18.0, vatRate: 0.15, serviceCharge: 3.0, corridorCharge: 0.0, promotionalDiscount: 0.0, providerDiscount: 1.0 },
};

/**
 * Calculates full costs and family-received amounts using the Effective Recipient Value model.
 */
export function calculateTrueCost(
  sendAmount: number,
  exchangeRate: number,
  feeConfig: Partial<FeeStructure>
): CostCalculationOutput {
  const transferFee = feeConfig.transferFee !== undefined ? feeConfig.transferFee : 10.0;
  const vatRate = feeConfig.vatRate !== undefined ? feeConfig.vatRate : 0.15;
  
  // Calculate VAT (default is vatRate * transferFee if not explicitly set)
  const vatAmount = feeConfig.vatAmount !== undefined 
    ? feeConfig.vatAmount 
    : Number((transferFee * vatRate).toFixed(4));
    
  const serviceCharge = feeConfig.serviceCharge || 0;
  const corridorCharge = feeConfig.corridorCharge || 0;
  const promotionalDiscount = feeConfig.promotionalDiscount || 0;
  const providerDiscount = feeConfig.providerDiscount || 0;

  // Total cost added on top / subtracted from sending power
  const totalFeesAndCharges = transferFee + vatAmount + serviceCharge + corridorCharge;
  const totalDiscounts = promotionalDiscount + providerDiscount;
  
  // Total cost paid by sender (cannot be negative)
  const totalCost = Math.max(0, totalFeesAndCharges - totalDiscounts);
  
  // Net amount converted to target currency (cannot be negative)
  const netTransferAmount = Math.max(0, sendAmount - totalCost);
  
  // Beneficiary receives
  const recipientAmount = Number((netTransferAmount * exchangeRate).toFixed(4));
  
  // Effective Exchange Rate (Rate per original SAR sent)
  const effectiveExchangeRate = sendAmount > 0 
    ? Number((recipientAmount / sendAmount).toFixed(6)) 
    : 0;

  return {
    sendAmount,
    exchangeRate,
    transferFee,
    vatAmount,
    serviceCharge,
    corridorCharge,
    promotionalDiscount,
    providerDiscount,
    totalCost: Number(totalCost.toFixed(4)),
    netTransferAmount: Number(netTransferAmount.toFixed(4)),
    recipientAmount,
    effectiveExchangeRate
  };
}

/**
 * Finds the appropriate fee structure for a provider/corridor/subService, considering custom admin overrides.
 */
export function getFeeStructure(
  providerId: string,
  corridorId: string,
  subService?: string,
  customFees: Record<string, Partial<FeeStructure>> = {}
): FeeStructure {
  // Check exact custom match: provider_corridor_partner
  const keyExact = `${providerId}_${corridorId}_${subService || 'none'}`;
  // Check custom generic provider match: provider_partner
  const keyGeneric = `${providerId}_${subService || 'none'}`;
  // Check custom generic fallback: provider_corridor_default
  const keyCorridorDefault = `${providerId}_${corridorId}_default`;
  // Check default keys
  const defaultExactKey = `${providerId}_${subService}`;
  const defaultKey = `${providerId}_default`;
  const defaultNoneKey = `${providerId}_none`;

  const mergedConfig: Partial<FeeStructure> = {
    providerId,
    corridorId,
    subService,
    transferFee: 10.0,
    vatRate: 0.15,
    serviceCharge: 0,
    corridorCharge: 0,
    promotionalDiscount: 0,
    providerDiscount: 0
  };

  // Find base default
  let baseDefault: Partial<FeeStructure> = {};
  if (subService && DEFAULT_FEE_STRUCTURES[defaultExactKey]) {
    baseDefault = DEFAULT_FEE_STRUCTURES[defaultExactKey];
  } else if (!subService && DEFAULT_FEE_STRUCTURES[defaultNoneKey]) {
    baseDefault = DEFAULT_FEE_STRUCTURES[defaultNoneKey];
  } else if (DEFAULT_FEE_STRUCTURES[defaultKey]) {
    baseDefault = DEFAULT_FEE_STRUCTURES[defaultKey];
  } else {
    // Standard stcpay / mobilypay fallback matching default templates
    if (providerId === 'urpay') {
      baseDefault = { transferFee: 10.0 };
    } else if (providerId === 'stcpay') {
      baseDefault = { transferFee: 10.0 };
    } else if (providerId === 'mobilypay') {
      baseDefault = { transferFee: 9.0 };
    } else if (providerId === 'alrajhi') {
      baseDefault = { transferFee: 15.0 };
    } else if (providerId === 'enjaz') {
      baseDefault = { transferFee: 14.0 };
    } else if (providerId === 'quickpay') {
      baseDefault = { transferFee: 15.0 };
    } else if (providerId === 'westernunion') {
      baseDefault = { transferFee: 18.0 };
    }
  }

  // Merge base defaults
  Object.assign(mergedConfig, baseDefault);

  // Apply custom overrides in order of specificity
  if (customFees[keyExact]) {
    Object.assign(mergedConfig, customFees[keyExact]);
  } else if (customFees[keyGeneric]) {
    Object.assign(mergedConfig, customFees[keyGeneric]);
  } else if (customFees[keyCorridorDefault]) {
    Object.assign(mergedConfig, customFees[keyCorridorDefault]);
  }

  return mergedConfig as FeeStructure;
}

/**
 * Standardized Rate Resolution Engine (RRE) mapping rate priorities
 */
export function resolveRate(
  providerId: ProviderId,
  corridorId: CorridorId,
  subService: 'Western Union' | 'Transfast' | 'Moneygram' | undefined,
  sendingAmount: number,
  selectedMethod: TransferMethod | 'all',
  adminOverrides: AdminRateOverride[],
  recentSubmissions: CrowdsourcedRate[],
  liveApiRates: Record<string, any>,
  customFees: Record<string, any>,
  defaultRate: number,
  defaultFee: number
): RateResolutionResult {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayStr = `${year}-${month}-${date}`;

  const getFreshnessStatus = (mins: number) => {
    if (mins <= 30) return { label: 'Very Fresh', score: 100 };
    if (mins <= 120) return { label: 'Fresh', score: 85 };
    if (mins <= 360) return { label: 'Moderately Fresh', score: 70 };
    if (mins <= 720) return { label: 'Getting Old', score: 50 };
    if (mins <= 1440) return { label: 'Stale', score: 30 };
    return { label: 'Expired', score: 0 };
  };
  
  // 1. Admin Override Rate (Priority 1)
  const activeOverride = adminOverrides?.find(o => {
    if (!o.active) return false;
    
    // Check providerId or providerName match
    const pIdNormalized = providerId ? providerId.toLowerCase().replace(/\s+/g, '') : '';
    const oIdNormalized = o.providerId ? o.providerId.toLowerCase().replace(/\s+/g, '') : '';
    const oNameNormalized = o.providerName ? o.providerName.toLowerCase().replace(/\s+/g, '') : '';
    
    const providerMatches = (pIdNormalized === oIdNormalized) || (pIdNormalized && pIdNormalized === oNameNormalized);
    if (!providerMatches) return false;
    
    // Check corridor match
    const oCorridorUpper = o.corridor ? o.corridor.toUpperCase() : 'ALL';
    const cIdUpper = corridorId ? corridorId.toUpperCase() : '';
    if (oCorridorUpper !== 'ALL' && oCorridorUpper !== cIdUpper) return false;
    
    // Check transferPartner if specified
    if (o.transferPartner && subService) {
      const oPartnerNorm = o.transferPartner.toLowerCase().replace(/\s+/g, '');
      const subNorm = subService.toLowerCase().replace(/\s+/g, '');
      if (oPartnerNorm !== subNorm) return false;
    }
    
    // Check send amount range
    if (sendingAmount < o.sendAmountMin || sendingAmount > o.sendAmountMax) return false;
    
    // Check receive method match
    if (o.receiveMethod && o.receiveMethod !== 'all' && selectedMethod !== 'all' && o.receiveMethod !== selectedMethod) return false;
    
    // Check date ranges (inclusive)
    if (o.startDate) {
      const start = new Date(o.startDate);
      start.setHours(0,0,0,0);
      if (today < start) return false;
    }
    if (o.endDate) {
      const end = new Date(o.endDate);
      end.setHours(23,59,59,999);
      if (today > end) return false;
    }
    
    return true;
  });

  if (activeOverride) {
    const isExpiringSoon = activeOverride.endDate ? (
      (new Date(activeOverride.endDate).getTime() - new Date(todayStr).getTime()) <= 3 * 24 * 60 * 60 * 1000
    ) : false;
    
    const totalCost = activeOverride.transferFee + activeOverride.vatAmount + activeOverride.additionalCharges;
    const netAmount = Math.max(0, sendingAmount - totalCost);
    const recipientAmount = netAmount * activeOverride.exchangeRate;

    return {
      providerId,
      corridorId,
      subService,
      selectedRateSource: 'Admin Verified',
      selectedExchangeRate: activeOverride.exchangeRate,
      selectedFee: activeOverride.transferFee,
      selectedVat: activeOverride.vatAmount,
      selectedTotalCost: totalCost,
      selectedRecipientAmount: Number(recipientAmount.toFixed(4)),
      sourceConfidence: 100,
      sourceLabel: 'Verified Rate',
      resolvedAt: new Date().toISOString(),
      isExpiringSoon,
      matchedOverrideId: activeOverride.id,
      freshness_score: 100,
      freshness_label: 'Very Fresh',
      source_badge: 'Verified Provider',
      cost_breakdown: {
        sendAmount: sendingAmount,
        exchangeRate: activeOverride.exchangeRate,
        transferFee: activeOverride.transferFee,
        vatAmount: activeOverride.vatAmount,
        serviceCharge: 0,
        corridorCharge: 0,
        promotionalDiscount: 0,
        providerDiscount: 0,
        totalCost,
        netTransferAmount: netAmount,
        recipientAmount,
        effectiveExchangeRate: sendingAmount > 0 ? recipientAmount / sendingAmount : 0
      }
    };
  }

  // 2. Verified Provider Rate (Priority 2)
  let liveRateOpt: any = null;
  if (liveApiRates && liveApiRates[corridorId]) {
    liveRateOpt = liveApiRates[corridorId].find((l: any) => {
      if (subService) {
        return l.providerId === providerId && l.subService === subService;
      }
      return l.providerId === providerId;
    });
  }

  if (liveRateOpt && liveRateOpt.confidenceScore >= 95) {
    const feeConfig = getFeeStructure(providerId, corridorId, subService, customFees);
    const costCalc = calculateTrueCost(sendingAmount, liveRateOpt.exchangeRate, feeConfig);
    const mins = liveRateOpt.lastUpdatedMinutesAgo || 10;
    const fresh = getFreshnessStatus(mins);

    return {
      providerId,
      corridorId,
      subService,
      selectedRateSource: 'Provider Verified',
      selectedExchangeRate: liveRateOpt.exchangeRate,
      selectedFee: costCalc.transferFee,
      selectedVat: costCalc.vatAmount,
      selectedTotalCost: costCalc.totalCost,
      selectedRecipientAmount: costCalc.recipientAmount,
      sourceConfidence: liveRateOpt.confidenceScore,
      sourceLabel: 'Provider Rate',
      resolvedAt: new Date().toISOString(),
      freshness_score: fresh.score,
      freshness_label: fresh.label,
      source_badge: 'Verified Provider',
      cost_breakdown: costCalc
    };
  }

  // 3. Screenshot Verified Community Rate (Priority 3)
  const screenshotVerifiedSub = recentSubmissions?.find(s => 
    s.providerId === providerId && 
    s.corridorId === corridorId && 
    s.isVerified === true && 
    s.screenshotUrl
  );

  if (screenshotVerifiedSub) {
    const feeConfig = getFeeStructure(providerId, corridorId, subService, customFees);
    const appliedFee = screenshotVerifiedSub.fee !== undefined ? screenshotVerifiedSub.fee : (feeConfig.transferFee || 10);
    const tempConfig = { ...feeConfig, transferFee: appliedFee };
    const costCalc = calculateTrueCost(sendingAmount, screenshotVerifiedSub.exchangeRate, tempConfig);
    
    return {
      providerId,
      corridorId,
      subService,
      selectedRateSource: 'Community Verified',
      selectedExchangeRate: screenshotVerifiedSub.exchangeRate,
      selectedFee: costCalc.transferFee,
      selectedVat: costCalc.vatAmount,
      selectedTotalCost: costCalc.totalCost,
      selectedRecipientAmount: costCalc.recipientAmount,
      sourceConfidence: 90,
      sourceLabel: 'Community Report',
      resolvedAt: new Date().toISOString(),
      freshness_score: 100,
      freshness_label: 'Very Fresh',
      source_badge: 'Community Verified',
      cost_breakdown: costCalc
    };
  }

  // 4. Trusted Community Rate (Priority 4)
  const trustedCommunitySub = recentSubmissions?.find(s => 
    s.providerId === providerId && 
    s.corridorId === corridorId && 
    s.votes >= 1
  );

  if (trustedCommunitySub) {
    const feeConfig = getFeeStructure(providerId, corridorId, subService, customFees);
    const appliedFee = trustedCommunitySub.fee !== undefined ? trustedCommunitySub.fee : (feeConfig.transferFee || 10);
    const tempConfig = { ...feeConfig, transferFee: appliedFee };
    const costCalc = calculateTrueCost(sendingAmount, trustedCommunitySub.exchangeRate, tempConfig);
    
    return {
      providerId,
      corridorId,
      subService,
      selectedRateSource: 'Community Verified',
      selectedExchangeRate: trustedCommunitySub.exchangeRate,
      selectedFee: costCalc.transferFee,
      selectedVat: costCalc.vatAmount,
      selectedTotalCost: costCalc.totalCost,
      selectedRecipientAmount: costCalc.recipientAmount,
      sourceConfidence: 75,
      sourceLabel: 'Community Report',
      resolvedAt: new Date().toISOString(),
      freshness_score: 85,
      freshness_label: 'Fresh',
      source_badge: 'Community Verified',
      cost_breakdown: costCalc
    };
  }

  // 5. Public API Reference Rate (Priority 5)
  if (liveRateOpt) {
    const feeConfig = getFeeStructure(providerId, corridorId, subService, customFees);
    const costCalc = calculateTrueCost(sendingAmount, liveRateOpt.exchangeRate, feeConfig);
    const mins = liveRateOpt.lastUpdatedMinutesAgo || 180;
    const fresh = getFreshnessStatus(mins);

    const sourceLabel = mins <= 15 ? 'Market Reference Rate (Live)' : 'Market Reference Rate (Cached)';

    return {
      providerId,
      corridorId,
      subService,
      selectedRateSource: 'Market Reference Rate',
      selectedExchangeRate: liveRateOpt.exchangeRate,
      selectedFee: costCalc.transferFee,
      selectedVat: costCalc.vatAmount,
      selectedTotalCost: costCalc.totalCost,
      selectedRecipientAmount: costCalc.recipientAmount,
      sourceConfidence: liveRateOpt.confidenceScore || 60,
      sourceLabel: sourceLabel,
      resolvedAt: new Date().toISOString(),
      freshness_score: fresh.score,
      freshness_label: fresh.label,
      source_badge: 'Market Reference',
      cost_breakdown: costCalc
    };
  }

  // 6. Fallback Rate (Priority 6)
  const feeConfig = getFeeStructure(providerId, corridorId, subService, customFees);
  const costCalc = calculateTrueCost(sendingAmount, defaultRate, feeConfig);
  return {
    providerId,
    corridorId,
    subService,
    selectedRateSource: 'Reference Rate (Unavailable)',
    selectedExchangeRate: defaultRate,
    selectedFee: costCalc.transferFee,
    selectedVat: costCalc.vatAmount,
    selectedTotalCost: costCalc.totalCost,
    selectedRecipientAmount: costCalc.recipientAmount,
    sourceConfidence: 40,
    sourceLabel: 'Reference Rate (Unavailable)',
    resolvedAt: new Date().toISOString(),
    freshness_score: 40,
    freshness_label: 'Getting Old',
    source_badge: 'Estimated Fallback',
    cost_breakdown: costCalc
  };
}

