import { CORRIDORS } from './constants';
import { updateMarketRate } from './supabaseService';

export interface MarketRateObservation {
  source: string;
  rate: number;
  retrievedAt: string;
  success: boolean;
  error?: string;
}

export interface AggregatedMarketRate {
  corridorId: string;
  currencyPair: string;
  rate: number;
  sources: { name: string; rate: number }[];
  confidence: 'high' | 'medium' | 'low';
  freshness: 'fresh' | 'aging' | 'stale';
  method: string;
  retrievedAt: string;
}

// Timeout helper to prevent hanging on unresponsive endpoints
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    fetch(url, options)
      .then(
        res => {
          clearTimeout(timer);
          resolve(res);
        },
        err => {
          clearTimeout(timer);
          reject(err);
        }
      );
  });
}

// 1. Adapter for ExchangeRate-API V6 (Primary Keyless API)
async function fetchExchangeRateApiV6(destCurrency: string): Promise<number> {
  const url = `https://open.er-api.com/v6/latest/SAR`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  const data = await response.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Invalid API response structure');
  }
  const rate = data.rates[destCurrency];
  if (typeof rate !== 'number' || rate <= 0) {
    throw new Error(`Rate for ${destCurrency} not found or invalid`);
  }
  return rate;
}

// 2. Adapter for ExchangeRate-API V4 (Secondary Backup Keyless API)
async function fetchExchangeRateApiV4(destCurrency: string): Promise<number> {
  const url = `https://api.exchangerate-api.com/v4/latest/SAR`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  const data = await response.json();
  if (!data.rates) {
    throw new Error('Invalid API response structure');
  }
  const rate = data.rates[destCurrency];
  if (typeof rate !== 'number' || rate <= 0) {
    throw new Error(`Rate for ${destCurrency} not found or invalid`);
  }
  return rate;
}

// 3. Adapter for Frankfurter API (Third Backup API using USD base conversion)
async function fetchFrankfurterApi(destCurrency: string): Promise<number> {
  const url = `https://api.frankfurter.app/latest?from=USD`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  const data = await response.json();
  if (!data.rates) {
    throw new Error('Invalid API response structure');
  }
  
  // Frankfurter might not support all exotic currencies, but does support major ones
  const targetRate = destCurrency === 'USD' ? 1.0 : data.rates[destCurrency];
  const sarRate = data.rates['SAR'];
  
  if (typeof targetRate !== 'number' || typeof sarRate !== 'number' || sarRate <= 0) {
    throw new Error(`Currency ${destCurrency} or SAR not supported by Frankfurter`);
  }
  
  // Convert USD base rates to SAR base: (USD -> destCurrency) / (USD -> SAR)
  const rate = targetRate / sarRate;
  if (rate <= 0) {
    throw new Error('Calculated exchange rate is invalid');
  }
  return rate;
}

/**
 * Resolves a unified market rate by collecting from multiple sources and applying consensus
 */
export async function fetchAndResolveMarketRate(corridorId: string): Promise<AggregatedMarketRate> {
  const corridor = CORRIDORS.find(c => c.id === corridorId);
  if (!corridor) {
    throw new Error(`Invalid corridor ID: ${corridorId}`);
  }

  const destCurrency = corridor.currencyCode;
  const currencyPair = `SAR/${destCurrency}`;
  const observations: { source: string; rate: number | null; error?: string }[] = [];

  // Parallel fetches with individual catch blocks to ensure partial success
  const fetchPromises = [
    fetchExchangeRateApiV6(destCurrency)
      .then(rate => { observations.push({ source: 'ExchangeRate-API V6', rate }); })
      .catch(err => { observations.push({ source: 'ExchangeRate-API V6', rate: null, error: err.message }); }),

    fetchExchangeRateApiV4(destCurrency)
      .then(rate => { observations.push({ source: 'ExchangeRate-API V4', rate }); })
      .catch(err => { observations.push({ source: 'ExchangeRate-API V4', rate: null, error: err.message }); }),

    fetchFrankfurterApi(destCurrency)
      .then(rate => { observations.push({ source: 'Frankfurter API', rate }); })
      .catch(err => { observations.push({ source: 'Frankfurter API', rate: null, error: err.message }); })
  ];

  await Promise.all(fetchPromises);

  // Filter successful observations
  const successfulSources = observations.filter(o => o.rate !== null && o.rate > 0) as { source: string; rate: number }[];

  let finalRate: number;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let method = 'none';

  if (successfulSources.length >= 2) {
    // 2 or more sources succeeded: check agreement and use average/median
    const rates = successfulSources.map(s => s.rate);
    const sum = rates.reduce((a, b) => a + b, 0);
    const avg = sum / rates.length;

    // Check deviation from average
    const maxDeviation = Math.max(...rates.map(r => Math.abs(r - avg) / avg));

    finalRate = parseFloat(avg.toFixed(4));
    method = `${successfulSources.length}_source_average`;

    if (maxDeviation <= 0.015) {
      // Very close agreement (< 1.5% deviation)
      confidence = 'high';
    } else if (maxDeviation <= 0.03) {
      // Moderate agreement (1.5% - 3%)
      confidence = 'medium';
    } else {
      // Low agreement (> 3%)
      confidence = 'low';
    }
  } else if (successfulSources.length === 1) {
    // Only 1 source succeeded
    finalRate = parseFloat(successfulSources[0].rate.toFixed(4));
    confidence = 'medium'; // single source is moderate confidence if fresh
    method = 'single_source';
  } else {
    // All sources failed: fallback
    console.warn(`All external public FX sources failed for corridor ${corridorId}. Resolving fallback...`);
    
    // Look up last stored rate in localStorage
    const stored = localStorage.getItem('sr_supabase_market');
    let lastValidRate: number | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const existing = parsed.find((m: any) => m.corridor_id === corridorId);
        if (existing && existing.rate > 0) {
          lastValidRate = existing.rate;
        }
      } catch (err) {
        console.error('Error parsing market rates cache:', err);
      }
    }

    if (lastValidRate) {
      finalRate = lastValidRate;
      confidence = 'low'; // Stale fallback rate
      method = 'stale_database_fallback';
    } else {
      // Hard fallback to static constants
      finalRate = corridor.baseExchangeRate;
      confidence = 'low';
      method = 'static_constants_fallback';
    }
  }

  return {
    corridorId,
    currencyPair,
    rate: finalRate,
    sources: successfulSources.map(s => ({ name: s.source, rate: s.rate })),
    confidence,
    freshness: successfulSources.length > 0 ? 'fresh' : 'stale',
    method,
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Triggers the Market Reference retrieval, computes statistics, and updates the database/localStorage
 */
export async function fetchAndStoreMarketReferenceRate(corridorId: string): Promise<AggregatedMarketRate> {
  const result = await fetchAndResolveMarketRate(corridorId);
  
  // Store the rate immediately in Supabase and localStorage fallbacks
  await updateMarketRate(corridorId, result.rate);
  
  // Update details inside the market rates cache to include auditing fields
  const stored = localStorage.getItem('sr_supabase_market');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const updated = parsed.map((m: any) => {
        if (m.corridor_id === corridorId) {
          return {
            ...m,
            rate: result.rate,
            last_updated: result.retrievedAt,
            source_count: result.sources.length,
            source_names: result.sources.map(s => s.name),
            selected_method: result.method,
            confidence_level: result.confidence,
            freshness_status: result.freshness,
            status: 'active'
          };
        }
        return m;
      });
      localStorage.setItem('sr_supabase_market', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update extra auditing metadata in cache:', err);
    }
  }

  return result;
}
