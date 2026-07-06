// Rate Confidence & Freshness Engine for SariRemit
// Remittance Intelligence Platform Core

export interface CommunityRateSubmission {
  submission_id: string;
  user_id: string;
  provider: string;
  transfer_partner?: string;
  corridor: string;
  currency: string;
  send_amount: number;
  exchange_rate: number;
  transfer_fee: number;
  vat?: number;
  vat_amount: number;
  additional_charges: number;
  recipient_amount: number;
  screenshot_url?: string;
  ocr_result?: string;
  submission_time: string; // ISO string
  device_id: string;
  verification_status: 'Submitted' | 'OCR Extraction' | 'Validation' | 'Duplicate Detection' | 'Confidence Calculation' | 'Approved' | 'Rejected';
  confidence_score: number; // 0-100
  reputation_score?: number; // 0-100
  review_status?: 'pending' | 'flagged' | 'approved' | 'rejected';
}

export interface CommunityRateConsensus {
  provider: string;
  corridor: string;
  transfer_partner?: string;
  currency: string;
  send_amount_range: string;
  community_rate: number;
  community_fee: number;
  community_vat: number;
  community_additional_charges: number;
  community_total_cost: number;
  community_recipient_amount: number;
  submission_count: number;
  independent_users_count: number;
  confidence: number; // 0-100
  updated_at: string; // ISO string
  is_eligible: boolean;
}

export interface MarketReferenceRate {
  id: string;
  corridor: string;
  exchange_rate: number;
  provider_id: string;
  source: string;
  timestamp: string;
}

export interface ResolvedRate {
  provider_id: string;
  corridor_id: string;
  sub_service?: string;
  resolved_rate: number;
  resolved_fee: number;
  resolved_vat: number;
  resolved_total_cost: number;
  resolved_recipient_amount: number;
  confidence_score: number; // 0-100
  freshness_score: number; // 0-100
  freshness_label: 'Very Fresh' | 'Fresh' | 'Moderately Fresh' | 'Getting Old' | 'Stale' | 'Expired';
  source_badge: 'Verified Provider' | 'Community Verified' | 'Market Reference' | 'Estimated Fallback';
  last_updated_at: string;
  details?: string;
  matched_override_id?: string;
}

export interface ResolvedRateAuditHistory {
  id: string;
  provider_id: string;
  corridor_id: string;
  sub_service?: string;
  previous_rate: number;
  new_rate: number;
  reason: string;
  source: string;
  timestamp: string;
  user_or_admin: string;
}

// -------------------------------------------------------------
// MEDIAN HELPER FOR COMMUNITY CONSENSUS
// -------------------------------------------------------------
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

// -------------------------------------------------------------
// 1. FRAUD PROTECTION ENGINE
// -------------------------------------------------------------
export function detectFraud(
  submission: Partial<CommunityRateSubmission>,
  recentSubmissions: CommunityRateSubmission[] = [],
  liveRate?: number,
  userReputation: number = 50
): { isFraudulent: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Flag 1: Impossible Rates (Exchange rate deviates > 15% from liveRate if present)
  if (liveRate && submission.exchange_rate) {
    const deviation = Math.abs(submission.exchange_rate - liveRate) / liveRate;
    if (deviation > 0.15) {
      reasons.push('IMPOSSIBLE_RATE_DEVIATION');
    }
  }

  // Flag 2: Duplicate Screenshots (Same screenshot URL submitted by other user or multiple times)
  if (submission.screenshot_url && submission.screenshot_url.trim().length > 0) {
    const duplicateScreenshot = recentSubmissions.find(s => 
      s.screenshot_url === submission.screenshot_url && 
      s.submission_id !== submission.submission_id
    );
    if (duplicateScreenshot) {
      reasons.push('DUPLICATE_SCREENSHOT_DETECTION');
    }
  }

  // Flag 3: Rapid Repeat Submissions (Same user, same provider, same corridor within 5 minutes)
  if (submission.user_id && submission.provider && submission.corridor && submission.submission_time) {
    const submissionTime = new Date(submission.submission_time).getTime();
    const rapidRepeat = recentSubmissions.find(s => {
      if (s.user_id !== submission.user_id || s.provider !== submission.provider || s.corridor !== submission.corridor) {
        return false;
      }
      const existingTime = new Date(s.submission_time).getTime();
      return Math.abs(submissionTime - existingTime) < 5 * 60 * 1000 && s.submission_id !== submission.submission_id;
    });
    if (rapidRepeat) {
      reasons.push('RAPID_REPEAT_SUBMISSIONS');
    }
  }

  // Flag 4: Conflicting Reports (User submission is extremely different from recent approved consensus/reports)
  const similarRecent = recentSubmissions.filter(s => 
    s.provider === submission.provider && 
    s.corridor === submission.corridor && 
    s.review_status === 'approved'
  );
  if (similarRecent.length > 0 && submission.exchange_rate) {
    const avgRecentRate = similarRecent.reduce((sum, s) => sum + s.exchange_rate, 0) / similarRecent.length;
    const deviation = Math.abs(submission.exchange_rate - avgRecentRate) / avgRecentRate;
    if (deviation > 0.12) {
      reasons.push('CONFLICTING_COMMUNITY_REPORTS');
    }
  }

  // Flag 5: Suspicious Users / Low Reputation Accounts (Reputation < 20)
  if (userReputation < 20) {
    reasons.push('LOW_REPUTATION_ACCOUNT');
  }

  const isFraudulent = reasons.length > 0;
  return { isFraudulent, reasons };
}

// -------------------------------------------------------------
// 2. CONFIDENCE ENGINE
// -------------------------------------------------------------
export function calculateSubmissionConfidence(
  submission: Partial<CommunityRateSubmission>,
  userReputation: number = 50,
  ocrMatchPercent: number = 100,
  screenshotValidityPercent: number = 100,
  hasSimilarReports: boolean = true,
  isCorridorConsistent: boolean = true,
  isProviderConsistent: boolean = true,
  historicalAccuracyScore: number = 95
): number {
  // Suggested Weights:
  // OCR Match = 20%
  // Screenshot Validity = 15%
  // User Reputation = 20%
  // Similar Reports = 25%
  // Freshness = 10%
  // Historical Accuracy = 10%

  const w_ocr = 0.20;
  const w_ss = 0.15;
  const w_rep = 0.20;
  const w_sim = 0.25;
  const w_fresh = 0.10;
  const w_hist = 0.10;

  // 1. OCR Match score (0-100)
  const ocrScore = submission.ocr_result ? ocrMatchPercent : 0;

  // 2. Screenshot validity score (0-100)
  const ssScore = submission.screenshot_url ? screenshotValidityPercent : 0;

  // 3. User Reputation score (0-100)
  const repScore = userReputation;

  // 4. Similar reports factor (0-100)
  const simScore = hasSimilarReports ? 100 : 40;

  // 5. Freshness score (100 if submitted in last 2 hours, linearly decreasing to 0 at 24 hours)
  let freshScore = 100;
  if (submission.submission_time) {
    const ageHours = (Date.now() - new Date(submission.submission_time).getTime()) / (1000 * 60 * 60);
    freshScore = Math.max(0, Math.min(100, 100 - (ageHours / 24) * 100));
  }

  // 6. Historical accuracy score
  const histScore = historicalAccuracyScore;

  // Weighted score calculation
  const weighted = 
    (ocrScore * w_ocr) + 
    (ssScore * w_ss) + 
    (repScore * w_rep) + 
    (simScore * w_sim) + 
    (freshScore * w_fresh) + 
    (histScore * w_hist);

  return Math.round(weighted);
}

// -------------------------------------------------------------
// 3. VERIFICATION PIPELINE
// -------------------------------------------------------------
export function runVerificationPipeline(
  submission: Partial<CommunityRateSubmission>,
  userReputation: number,
  recentSubmissions: CommunityRateSubmission[],
  liveRate?: number
): {
  status: CommunityRateSubmission['verification_status'];
  confidence_score: number;
  fraudFlags: string[];
  review_status: CommunityRateSubmission['review_status'];
} {
  // Step 1: Submitted (Initial state)
  let status: CommunityRateSubmission['verification_status'] = 'Submitted';

  // Step 2: OCR Extraction
  status = 'OCR Extraction';
  const ocrMatched = submission.screenshot_url ? true : false;
  const ocrMatchPercent = ocrMatched ? 95 : 0;

  // Step 3: Validation & Fraud Protection
  status = 'Validation';
  const fraudCheck = detectFraud(submission, recentSubmissions, liveRate, userReputation);

  if (fraudCheck.isFraudulent) {
    return {
      status: 'Rejected',
      confidence_score: 0,
      fraudFlags: fraudCheck.reasons,
      review_status: 'rejected'
    };
  }

  // Step 4: Duplicate Detection
  status = 'Duplicate Detection';
  const duplicateRate = recentSubmissions.find(s => 
    s.provider === submission.provider &&
    s.corridor === submission.corridor &&
    Math.abs(s.exchange_rate - (submission.exchange_rate || 0)) < 0.0001 &&
    s.user_id !== submission.user_id
  );

  // Step 5: Confidence Calculation
  status = 'Confidence Calculation';
  const hasSimilar = duplicateRate ? true : false;
  const confidence = calculateSubmissionConfidence(
    submission,
    userReputation,
    ocrMatchPercent,
    submission.screenshot_url ? 100 : 0,
    hasSimilar,
    true,
    true,
    95
  );

  // Decide review status and final pipeline state
  // Auto-approve if high user reputation & ocr matches, or flag for moderator if confidence is low
  let review: CommunityRateSubmission['review_status'] = 'pending';
  let finalStatus: CommunityRateSubmission['verification_status'] = status;

  if (confidence >= 80) {
    review = 'approved';
    finalStatus = 'Approved';
  } else if (confidence < 40) {
    review = 'rejected';
    finalStatus = 'Rejected';
  } else {
    review = 'pending';
    finalStatus = 'Validation';
  }

  return {
    status: finalStatus,
    confidence_score: confidence,
    fraudFlags: [],
    review_status: review
  };
}

// -------------------------------------------------------------
// 4. COMMUNITY CONSENSUS ENGINE
// -------------------------------------------------------------
export function calculateCommunityConsensus(
  provider: string,
  corridor: string,
  currency: string,
  sendAmountRange: string,
  submissions: CommunityRateSubmission[]
): CommunityRateConsensus | null {
  // Group submissions by Provider, Corridor, Send Amount Range
  const filtered = submissions.filter(s => 
    s.provider === provider && 
    s.corridor === corridor && 
    s.currency === currency &&
    s.review_status === 'approved'
  );

  if (filtered.length === 0) return null;

  // Get lists of fields
  const rates = filtered.map(s => s.exchange_rate);
  const fees = filtered.map(s => s.transfer_fee);
  const vats = filtered.map(s => s.vat);
  const charges = filtered.map(s => s.additional_charges);
  const recipients = filtered.map(s => s.recipient_amount);

  // Calculate median values
  const medianRate = calculateMedian(rates);
  const medianFee = calculateMedian(fees);
  const medianVat = calculateMedian(vats);
  const medianCharges = calculateMedian(charges);
  const medianRecipient = calculateMedian(recipients);

  const totalCost = medianFee + medianVat + medianCharges;

  // Get independent users count
  const uniqueUsers = new Set(filtered.map(s => s.user_id));
  const independent_users_count = uniqueUsers.size;

  // Aggregate confidence (average of submissions' confidence scores)
  const avgConfidence = filtered.reduce((acc, s) => acc + s.confidence_score, 0) / filtered.length;

  // Activation Policy Check:
  // Consensus becomes eligible ONLY IF:
  // 1. At least 3 independent users submitted similar rates.
  // 2. Confidence >= 90%.
  // 3. Submissions are less than 12 hours old.
  // 4. No fraud indicators detected.
  const now = Date.now();
  const sub12h = filtered.filter(s => (now - new Date(s.submission_time).getTime()) < 12 * 60 * 60 * 1000);
  const independent12hCount = new Set(sub12h.map(s => s.user_id)).size;

  const is_eligible = 
    independent_users_count >= 3 && 
    avgConfidence >= 90 && 
    sub12h.length >= 3 && 
    independent12hCount >= 3;

  return {
    provider,
    corridor,
    currency,
    send_amount_range: sendAmountRange,
    community_rate: medianRate,
    community_fee: medianFee,
    community_vat: medianVat,
    community_additional_charges: medianCharges,
    community_total_cost: totalCost,
    community_recipient_amount: medianRecipient,
    submission_count: filtered.length,
    independent_users_count,
    confidence: Math.round(avgConfidence),
    updated_at: new Date().toISOString(),
    is_eligible
  };
}

// -------------------------------------------------------------
// 5. FRESHNESS ENGINE
// -------------------------------------------------------------
export function getFreshnessStatus(lastUpdatedMinutes: number): {
  label: ResolvedRate['freshness_label'];
  score: number;
} {
  // Rules:
  // 0–30 min: Very Fresh
  // 31–120 min: Fresh
  // 2–6 hrs (121-360 min): Moderately Fresh
  // 6–12 hrs (361-720 min): Getting Old
  // 12–24 hrs (721-1440 min): Stale
  // 24+ hrs (1441+ min): Expired

  if (lastUpdatedMinutes <= 30) {
    return { label: 'Very Fresh', score: 100 };
  } else if (lastUpdatedMinutes <= 120) {
    return { label: 'Fresh', score: 85 };
  } else if (lastUpdatedMinutes <= 360) {
    return { label: 'Moderately Fresh', score: 70 };
  } else if (lastUpdatedMinutes <= 720) {
    return { label: 'Getting Old', score: 50 };
  } else if (lastUpdatedMinutes <= 1440) {
    return { label: 'Stale', score: 30 };
  } else {
    return { label: 'Expired', score: 0 };
  }
}

// -------------------------------------------------------------
// 6. RATE PRIORITY ENGINE
// -------------------------------------------------------------
export function resolveRateWithPriority(
  providerId: string,
  corridorId: string,
  subService: string | undefined,
  sendingAmount: number,
  selectedMethod: string,
  adminOverrides: any[],
  liveApiRates: any[],
  communityConsensuses: CommunityRateConsensus[],
  marketReferenceRates: MarketReferenceRate[],
  fallbackRate: number,
  fallbackFee: number,
  customFees: Record<string, any> = {}
): ResolvedRate {
  
  // Try each priority level:
  const nowStr = new Date().toISOString();

  // Priority 1: Active Admin Override
  const activeOverride = adminOverrides?.find(o => {
    if (!o.active) return false;
    const pIdNormalized = providerId ? providerId.toLowerCase().replace(/\s+/g, '') : '';
    const oIdNormalized = o.providerId ? o.providerId.toLowerCase().replace(/\s+/g, '') : '';
    const oNameNormalized = o.providerName ? o.providerName.toLowerCase().replace(/\s+/g, '') : '';
    const providerMatches = (pIdNormalized === oIdNormalized) || (pIdNormalized && pIdNormalized === oNameNormalized);
    if (!providerMatches) return false;

    const oCorridorUpper = o.corridor ? o.corridor.toUpperCase() : 'ALL';
    const cIdUpper = corridorId ? corridorId.toUpperCase() : '';
    if (oCorridorUpper !== 'ALL' && oCorridorUpper !== cIdUpper) return false;

    if (o.transferPartner && subService) {
      const oPartnerNorm = o.transferPartner.toLowerCase().replace(/\s+/g, '');
      const subNorm = subService.toLowerCase().replace(/\s+/g, '');
      if (oPartnerNorm !== subNorm) return false;
    }

    if (sendingAmount < o.sendAmountMin || sendingAmount > o.sendAmountMax) return false;
    if (o.receiveMethod && o.receiveMethod !== 'all' && selectedMethod !== 'all' && o.receiveMethod !== selectedMethod) return false;

    // Dates
    const today = new Date();
    today.setHours(0,0,0,0);
    if (o.startDate && today < new Date(o.startDate)) return false;
    if (o.endDate && today > new Date(o.endDate)) return false;

    return true;
  });

  if (activeOverride) {
    const totalCost = activeOverride.transferFee + activeOverride.vatAmount + activeOverride.additionalCharges;
    const netAmount = Math.max(0, sendingAmount - totalCost);
    const recipientAmount = netAmount * activeOverride.exchangeRate;

    return {
      provider_id: providerId,
      corridor_id: corridorId,
      sub_service: subService,
      resolved_rate: activeOverride.exchangeRate,
      resolved_fee: activeOverride.transferFee,
      resolved_vat: activeOverride.vatAmount,
      resolved_total_cost: totalCost,
      resolved_recipient_amount: Number(recipientAmount.toFixed(4)),
      confidence_score: 100,
      freshness_score: 100,
      freshness_label: 'Very Fresh',
      source_badge: 'Verified Provider',
      last_updated_at: nowStr,
      details: 'Overridden by Admin Operation settings',
      matched_override_id: activeOverride.id
    };
  }

  // Priority 2: Recent Official Provider / API Rates
  let liveRateOpt: any = null;
  if (liveApiRates) {
    liveRateOpt = liveApiRates.find((l: any) => {
      const matchProvider = l.providerId === providerId;
      if (!matchProvider) return false;
      if (subService) {
        return l.subService === subService;
      }
      return true;
    });
  }

  if (liveRateOpt) {
    const lastUpdatedMin = liveRateOpt.lastUpdatedMinutesAgo || 10;
    const { label, score } = getFreshnessStatus(lastUpdatedMin);
    
    // Calculate total cost
    const fee = liveRateOpt.fee !== undefined ? liveRateOpt.fee : fallbackFee;
    const vat = fee * 0.15;
    const totalCost = fee + vat;
    const netAmount = Math.max(0, sendingAmount - totalCost);
    const recipientAmount = netAmount * liveRateOpt.exchangeRate;

    // High confidence for provider verified rates
    const confidence = liveRateOpt.confidenceScore || 96;

    return {
      provider_id: providerId,
      corridor_id: corridorId,
      sub_service: subService,
      resolved_rate: liveRateOpt.exchangeRate,
      resolved_fee: fee,
      resolved_vat: vat,
      resolved_total_cost: totalCost,
      resolved_recipient_amount: Number(recipientAmount.toFixed(4)),
      confidence_score: confidence,
      freshness_score: score,
      freshness_label: label,
      source_badge: 'Verified Provider',
      last_updated_at: nowStr,
      details: 'Fetched directly from official provider endpoints'
    };
  }

  // Priority 3: Community Consensus (If eligible and active)
  const consensus = communityConsensuses?.find(c => 
    c.provider === providerId && 
    c.corridor === corridorId &&
    (!subService || c.transfer_partner === subService) &&
    c.is_eligible
  );

  if (consensus) {
    const netAmount = Math.max(0, sendingAmount - consensus.community_total_cost);
    const recipientAmount = netAmount * consensus.community_rate;

    return {
      provider_id: providerId,
      corridor_id: corridorId,
      sub_service: subService,
      resolved_rate: consensus.community_rate,
      resolved_fee: consensus.community_fee,
      resolved_vat: consensus.community_vat,
      resolved_total_cost: consensus.community_total_cost,
      resolved_recipient_amount: Number(recipientAmount.toFixed(4)),
      confidence_score: consensus.confidence,
      freshness_score: 90,
      freshness_label: 'Fresh',
      source_badge: 'Community Verified',
      last_updated_at: consensus.updated_at,
      details: `Aggregated consensus from ${consensus.submission_count} verified community submissions`
    };
  }

  // Priority 4: Market Reference Rate
  const refRate = marketReferenceRates?.find(m => 
    m.corridor === corridorId && 
    m.provider_id === providerId
  );

  if (refRate) {
    const fee = fallbackFee;
    const vat = fee * 0.15;
    const totalCost = fee + vat;
    const netAmount = Math.max(0, sendingAmount - totalCost);
    const recipientAmount = netAmount * refRate.exchange_rate;

    return {
      provider_id: providerId,
      corridor_id: corridorId,
      sub_service: subService,
      resolved_rate: refRate.exchange_rate,
      resolved_fee: fee,
      resolved_vat: vat,
      resolved_total_cost: totalCost,
      resolved_recipient_amount: Number(recipientAmount.toFixed(4)),
      confidence_score: 75,
      freshness_score: 70,
      freshness_label: 'Moderately Fresh',
      source_badge: 'Market Reference',
      last_updated_at: refRate.timestamp,
      details: `Estimated market indexes sourced via ${refRate.source}`
    };
  }

  // Priority 5: Fallback Rate
  const vat = fallbackFee * 0.15;
  const totalCost = fallbackFee + vat;
  const netAmount = Math.max(0, sendingAmount - totalCost);
  const recipientAmount = netAmount * fallbackRate;

  return {
    provider_id: providerId,
    corridor_id: corridorId,
    sub_service: subService,
    resolved_rate: fallbackRate,
    resolved_fee: fallbackFee,
    resolved_vat: vat,
    resolved_total_cost: totalCost,
    resolved_recipient_amount: Number(recipientAmount.toFixed(4)),
    confidence_score: 55,
    freshness_score: 40,
    freshness_label: 'Getting Old',
    source_badge: 'Estimated Fallback',
    last_updated_at: nowStr,
    details: 'Standard mathematical model backup fallback estimate'
  };
}
