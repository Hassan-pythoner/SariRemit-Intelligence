// Remittance Intelligence & Timing Engine for SariRemit
import { getHistoricalTrends } from '../data/mockData';
import { getFeeStructure, calculateTrueCost } from './costEngine';

export interface IntelligenceOutput {
  bestOption: any;
  alternativeOption: any;
  signal: 'Send Now' | 'Wait' | 'Monitor';
  confidence: 'High' | 'Medium' | 'Low';
  opportunityScore: 'Excellent Opportunity' | 'Good Opportunity' | 'Average Opportunity' | 'Weak Opportunity';
  opportunityScoreAr: 'فرصة ممتازة' | 'فرصة جيدة' | 'فرصة متوسطة' | 'فرصة ضعيفة';
  explanationEn: string;
  explanationAr: string;
  extraValue: number; // recipient amount difference between best and average/worst
  worstOption: any;
  trendAverage: number;
}

/**
 * Runs the intelligence engine to produce decision-support metrics for a given corridor and amount.
 */
export function analyzeCorridorIntelligence(
  sendingAmount: number,
  corridorId: string,
  processedOptions: any[] // options that have already had true cost calculated
): IntelligenceOutput | null {
  if (!processedOptions || processedOptions.length === 0) return null;

  // 1. Sort options by highest recipient amount, then lowest cost, then confidence
  const sortedOptions = [...processedOptions].sort((a, b) => {
    if (Math.abs(b.estimatedReceived - a.estimatedReceived) > 0.0001) {
      return b.estimatedReceived - a.estimatedReceived;
    }
    if (Math.abs(a.total_cost - b.total_cost) > 0.0001) {
      return a.total_cost - b.total_cost;
    }
    return b.confidenceScore - a.confidenceScore;
  });

  const bestOption = sortedOptions[0];
  const worstOption = sortedOptions[sortedOptions.length - 1];
  const alternativeOption = sortedOptions.length > 1 ? sortedOptions[1] : null;

  // Calculate extra value received by picking best vs worst option
  const extraValue = bestOption && worstOption ? Math.max(0, bestOption.estimatedReceived - worstOption.estimatedReceived) : 0;

  // 2. Timing logic using historical trend data
  const trends = getHistoricalTrends(corridorId);
  const avgRate = trends.reduce((acc, t) => acc + t.rate, 0) / trends.length;
  
  const currentRate = bestOption.exchangeRate;
  const currentEffectiveRate = bestOption.effective_exchange_rate || (bestOption.estimatedReceived / sendingAmount);
  
  // Rate freshness & confidence score inputs
  const freshnessScore = bestOption.confidenceScore;
  const lastUpdated = bestOption.lastUpdatedMinutesAgo;

  let signal: 'Send Now' | 'Wait' | 'Monitor' = 'Send Now';
  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  let opportunityScore: 'Excellent Opportunity' | 'Good Opportunity' | 'Average Opportunity' | 'Weak Opportunity' = 'Average Opportunity';
  let opportunityScoreAr: 'فرصة ممتازة' | 'فرصة جيدة' | 'فرصة متوسطة' | 'فرصة ضعيفة' = 'فرصة متوسطة';
  
  // Custom threshold percentages relative to the 15-day historical average
  const percentDifference = ((currentRate - avgRate) / avgRate) * 100;

  // Confidence determination based on freshness and source
  if (freshnessScore >= 94 && lastUpdated <= 15) {
    confidence = 'High';
  } else if (freshnessScore >= 88 && lastUpdated <= 60) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // Signal & Opportunity score calculations
  if (lastUpdated > 120 || freshnessScore < 85) {
    signal = 'Monitor';
    opportunityScore = 'Average Opportunity';
    opportunityScoreAr = 'فرصة متوسطة';
  } else if (percentDifference >= 0.8) {
    signal = 'Send Now';
    opportunityScore = 'Excellent Opportunity';
    opportunityScoreAr = 'فرصة ممتازة';
  } else if (percentDifference >= 0.2) {
    signal = 'Send Now';
    opportunityScore = 'Good Opportunity';
    opportunityScoreAr = 'فرصة جيدة';
  } else if (percentDifference <= -0.5) {
    signal = 'Wait';
    opportunityScore = 'Weak Opportunity';
    opportunityScoreAr = 'فرصة ضعيفة';
  } else {
    // Slight negative trend or near average
    // Look at last few days trend direction
    const recentTrends = trends.slice(-3);
    const isUpwardTrend = recentTrends.length >= 2 && recentTrends[recentTrends.length - 1].rate > recentTrends[0].rate;
    
    if (isUpwardTrend && percentDifference < 0) {
      signal = 'Wait';
      opportunityScore = 'Good Opportunity';
      opportunityScoreAr = 'فرصة جيدة';
    } else {
      signal = 'Send Now';
      opportunityScore = 'Average Opportunity';
      opportunityScoreAr = 'فرصة متوسطة';
    }
  }

  // Recommendation Explanations (Humorously/Thoughtfully simple, avoiding algorithmic jargon)
  let explanationEn = '';
  let explanationAr = '';

  if (signal === 'Send Now') {
    if (opportunityScore === 'Excellent Opportunity') {
      explanationEn = "Your family receives significantly more money today because transfer conditions are at an unusually high peak compared to recent weeks.";
      explanationAr = "تستلم عائلتك مبلغاً أكبر بكثير اليوم لأن ظروف التحويل في ذروة عالية غير معتادة مقارنة بالأسابيع الأخيرة.";
    } else if (opportunityScore === 'Good Opportunity') {
      explanationEn = "Current conditions are favorable compared to recent averages. This option combines strong rates with lower fees and VAT.";
      explanationAr = "الظروف الحالية مواتية مقارنة بالمتوسطات الأخيرة. يجمع هذا الخيار بين أسعار صرف قوية ورسوم وضريبة مخفضة.";
    } else {
      explanationEn = "Your family receives more money through this provider today, and rates are stable. It's a solid, secure time to send.";
      explanationAr = "تستلم عائلتك مبالغ أكبر عبر هذا المزود اليوم، وأسعار الصرف مستقرة. إنه وقت مناسب وآمن للإرسال.";
    }
  } else if (signal === 'Wait') {
    explanationEn = "Current rates are slightly below the recent average, but market signals suggest rates are moving upward. Waiting could increase the amount your family receives.";
    explanationAr = "الأسعار الحالية أقل قليلاً من المتوسط الأخير، لكن مؤشرات السوق تشير إلى تحسنها قريباً. قد يؤدي الانتظار لزيادة المبلغ الذي تستلمه عائلتك.";
  } else {
    explanationEn = "Exchange rates are currently fluctuating rapidly or data is fresh but unverified. We recommend monitoring the corridor before initiating a large transfer.";
    explanationAr = "تتذبذب أسعار الصرف حالياً بشكل سريع أو أن البيانات لم يتم التحقق منها بالكامل بعد. ننصح بمراقبة السوق قبل البدء بعملية تحويل كبيرة.";
  }

  return {
    bestOption,
    alternativeOption,
    signal,
    confidence,
    opportunityScore,
    opportunityScoreAr,
    explanationEn,
    explanationAr,
    extraValue,
    worstOption,
    trendAverage: Number(avgRate.toFixed(4))
  };
}
