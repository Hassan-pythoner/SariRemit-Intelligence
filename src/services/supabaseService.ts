import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Corridor, Provider, UserProfile, ResolvedRate, RecommendationResult, SISResult, SicSnapshot, TrueCostResult } from '../types';
import { PROVIDERS, CORRIDORS } from './constants';

// Interfaces for Supabase tables
export interface DbRateOverride {
  id: string;
  provider_id: string;
  corridor_id: string;
  rate: number;
  transfer_fee: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  vat_amount?: number;
  other_costs?: number;
  status?: 'active' | 'expired' | 'replaced' | 'cancelled';
  source_note?: string;
  created_by?: string;
}

export interface DbCommunitySubmission {
  id: string;
  provider_id: string;
  provider_name: string;
  corridor_id: string;
  exchange_rate: number;
  transfer_fee: number;
  send_amount: number;
  receive_amount: number;
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_at: string;
  screenshot_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  vat_amount?: number;
  other_costs?: number;
}

export interface ExtraCosts {
  vat_amount?: number;
  other_costs?: number;
}

const EXTRA_COSTS_KEY = 'sr_supabase_extra_costs';

export function getExtraCosts(id: string): ExtraCosts {
  const data = localStorage.getItem(EXTRA_COSTS_KEY);
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    return parsed[id] || {};
  } catch {
    return {};
  }
}

export function saveExtraCosts(id: string, costs: ExtraCosts): void {
  const data = localStorage.getItem(EXTRA_COSTS_KEY);
  let parsed: Record<string, ExtraCosts> = {};
  if (data) {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = {};
    }
  }
  parsed[id] = costs;
  localStorage.setItem(EXTRA_COSTS_KEY, JSON.stringify(parsed));
}

export interface DbMarketReferenceRate {
  id: string;
  corridor_id: string;
  rate: number;
  last_updated: string;
}

export interface DbResolvedRate {
  id: string;
  provider_id: string;
  provider_name: string;
  corridor_id: string;
  resolved_rate: number;
  transfer_fee: number;
  source_type: 'admin_override' | 'community_verified' | 'manual_channel_rate' | 'market_reference' | 'last_known_valid';
  source_label: string;
  confidence: 'high' | 'medium' | 'low';
  freshness_status: 'fresh' | 'aging' | 'stale';
  last_updated: string;
  expires_at?: string;
  is_active: boolean;
  reason: string;
}

export interface DbRecommendationResult {
  id: string;
  corridor_id: string;
  best_provider_id: string;
  best_provider_name: string;
  best_channel: string;
  send_amount: number;
  net_recipient_amount: number;
  estimated_savings: number;
  compared_against_average: number;
  recommendation_type: 'send_now' | 'compare_more' | 'wait';
  reason: string;
  resolved_rate_source: string;
  confidence: 'high' | 'medium' | 'low';
  last_updated: string;
}

export interface DbSisScore {
  id: string;
  provider_id: string;
  corridor_id: string;
  sis_score: number;
  sis_label: 'Excellent' | 'Strong' | 'Fair' | 'Weak' | 'Poor';
  sis_reason: string;
  rate_advantage_score: number;
  fee_advantage_score: number;
  true_cost_score?: number;
  confidence_score: number;
  freshness_score: number;
  savings_score: number;
}

// Check environment variables for Supabase
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_'));

let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// High fidelity Local Emulated Database (localStorage fallback)
const OVERRIDES_KEY = 'sr_supabase_overrides';
const COMMUNITY_KEY = 'sr_supabase_community';
const MARKET_KEY = 'sr_supabase_market';
const RESOLVED_KEY = 'sr_supabase_resolved';
const RECOMMENDATIONS_KEY = 'sr_supabase_recommendations';
const SIS_KEY = 'sr_supabase_sis';
const USER_SESSION_KEY = 'sr_supabase_user_session';

// Initialize emulated tables if not present
const getLocalStorageItem = <T>(key: string, initialValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initialValue));
    return initialValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return initialValue;
  }
};

const saveLocalStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Data for Fallback
const initialMarketRates: DbMarketReferenceRate[] = CORRIDORS.map(c => ({
  id: `market-${c.id}`,
  corridor_id: c.id,
  rate: c.baseExchangeRate,
  last_updated: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
}));

const initialCommunitySubmissions: DbCommunitySubmission[] = [
  {
    id: 'sub-init-1',
    provider_id: 'stc-pay',
    provider_name: 'STC Pay / STC Bank',
    corridor_id: 'sa-pk',
    exchange_rate: 74.82,
    transfer_fee: 10,
    send_amount: 1000,
    receive_amount: 74820,
    submitted_by_name: 'Ahmed Hassan',
    submitted_by_email: 'ahmed.hassan@saudi-expats.com',
    submitted_at: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
    screenshot_name: 'stc_pay_screenshot.png',
    status: 'approved',
  },
  {
    id: 'sub-init-2',
    provider_id: 'urpay',
    provider_name: 'Urpay',
    corridor_id: 'sa-in',
    exchange_rate: 22.34,
    transfer_fee: 12,
    send_amount: 2000,
    receive_amount: 44680,
    submitted_by_name: 'Hassan Gaturu',
    submitted_by_email: 'gaturuhassan@gmail.com',
    submitted_at: new Date(Date.now() - 7200000).toISOString(), // 2 hrs ago
    screenshot_name: 'urpay_receipt.jpg',
    status: 'approved',
  },
  {
    id: 'sub-init-3',
    provider_id: 'mobily-pay',
    provider_name: 'Mobily Pay',
    corridor_id: 'sa-ph',
    exchange_rate: 15.22,
    transfer_fee: 8,
    send_amount: 1500,
    receive_amount: 22830,
    submitted_by_name: 'John Doe',
    submitted_by_email: 'john.doe@gmail.com',
    submitted_at: new Date(Date.now() - 14400000).toISOString(), // 4 hrs ago
    status: 'pending',
  },
];

const initialOverrides: DbRateOverride[] = [
  {
    id: 'over-init-1',
    provider_id: 'stc-pay',
    corridor_id: 'sa-in',
    rate: 22.45,
    transfer_fee: 5,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(), // Expires in 2 days
    is_active: true,
  },
  {
    id: 'over-init-2',
    provider_id: 'urpay',
    corridor_id: 'sa-pk',
    rate: 74.95,
    transfer_fee: 6,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago (triggers warning!)
    is_active: true,
  },
];

// Helper to check if override is active and not expired
export function isOverrideValid(override: DbRateOverride): boolean {
  if (!override.is_active) return false;
  if (override.status && override.status !== 'active') return false;
  if (override.expires_at && new Date(override.expires_at) < new Date()) {
    return false;
  }
  return true;
}

// --- DB GETTERS AND SETTERS WITH AUTO-FALLBACK ---

// Admin Overrides
export async function fetchOverrides(): Promise<DbRateOverride[]> {
  let rows: DbRateOverride[] = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('rate_overrides').select('*');
    if (!error && data) {
      rows = data.map((row: any) => ({
        ...row,
        rate: parseFloat(row.rate),
        transfer_fee: parseFloat(row.transfer_fee),
        vat_amount: row.vat_amount !== null && row.vat_amount !== undefined ? parseFloat(row.vat_amount) : undefined,
        other_costs: row.other_costs !== null && row.other_costs !== undefined ? parseFloat(row.other_costs) : undefined,
        status: row.status || 'active',
        source_note: row.source_note || '',
        created_by: row.created_by || '',
      })) as DbRateOverride[];
    } else {
      console.warn('Supabase overrides error, falling back to emulated storage:', error);
      rows = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
    }
  } else {
    rows = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
  }

  // Attach extra costs
  return rows.map(r => {
    const extra = getExtraCosts(r.id);
    return {
      ...r,
      vat_amount: r.vat_amount !== undefined ? r.vat_amount : extra.vat_amount,
      other_costs: r.other_costs !== undefined ? r.other_costs : extra.other_costs
    };
  });
}

export async function saveOverride(override: any): Promise<DbRateOverride> {
  const isUuid = override.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(override.id);

  if (supabaseClient) {
    if (isUuid) {
      // It's an update of an existing override in Supabase!
      const { id, created_at, ...updatePayload } = override;
      const { data, error } = await supabaseClient
        .from('rate_overrides')
        .update({
          corridor_id: updatePayload.corridor_id,
          provider_id: updatePayload.provider_id,
          rate: updatePayload.rate,
          transfer_fee: updatePayload.transfer_fee,
          expires_at: updatePayload.expires_at,
          is_active: updatePayload.is_active,
          status: updatePayload.status,
          source_note: updatePayload.source_note,
          created_by: updatePayload.created_by,
          vat_amount: updatePayload.vat_amount,
          other_costs: updatePayload.other_costs
        })
        .eq('id', id)
        .select();

      if (!error && data && data[0]) {
        const savedRow = data[0] as DbRateOverride;
        const resultRow = {
          ...savedRow,
          rate: parseFloat(savedRow.rate as any),
          transfer_fee: parseFloat(savedRow.transfer_fee as any),
          vat_amount: savedRow.vat_amount !== null && savedRow.vat_amount !== undefined ? parseFloat(savedRow.vat_amount as any) : undefined,
          other_costs: savedRow.other_costs !== null && savedRow.other_costs !== undefined ? parseFloat(savedRow.other_costs as any) : undefined,
          status: savedRow.status || 'active',
          source_note: savedRow.source_note || '',
          created_by: savedRow.created_by || '',
        };
        // Also sync local storage
        const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
        const updated = current.map(o => o.id === resultRow.id ? resultRow : o);
        saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
        return resultRow;
      }
      console.error('Supabase update override error details:', error);
    } else {
      // It's a new insert in Supabase!
      const insertPayload = {
        corridor_id: override.corridor_id,
        provider_id: override.provider_id,
        rate: override.rate,
        transfer_fee: override.transfer_fee,
        expires_at: override.expires_at,
        is_active: override.is_active !== undefined ? override.is_active : true,
        status: override.status || 'active',
        source_note: override.source_note,
        created_by: override.created_by,
        vat_amount: override.vat_amount,
        other_costs: override.other_costs
      };

      const { data, error } = await supabaseClient.from('rate_overrides').insert([insertPayload]).select();
      if (!error && data && data[0]) {
        const savedRow = data[0] as DbRateOverride;
        const resultRow = {
          ...savedRow,
          rate: parseFloat(savedRow.rate as any),
          transfer_fee: parseFloat(savedRow.transfer_fee as any),
          vat_amount: savedRow.vat_amount !== null && savedRow.vat_amount !== undefined ? parseFloat(savedRow.vat_amount as any) : undefined,
          other_costs: savedRow.other_costs !== null && savedRow.other_costs !== undefined ? parseFloat(savedRow.other_costs as any) : undefined,
          status: savedRow.status || 'active',
          source_note: savedRow.source_note || '',
          created_by: savedRow.created_by || '',
        };

        if (override.vat_amount !== undefined || override.other_costs !== undefined) {
          saveExtraCosts(resultRow.id, {
            vat_amount: override.vat_amount,
            other_costs: override.other_costs
          });
        }

        const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
        const filtered = current.filter(o => !(o.provider_id === override.provider_id && o.corridor_id === override.corridor_id));
        const updated = [resultRow, ...filtered];
        saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
        return resultRow;
      }
      console.error('Supabase save override error details:', error);
      console.warn('Supabase save override error, using emulated storage:', error);
    }
  }

  // Emulated fallback
  const idToUse = override.id || `override-${Date.now()}`;
  const createdAt = override.created_at || new Date().toISOString();
  const newRow: DbRateOverride = {
    ...override,
    id: idToUse,
    created_at: createdAt,
  };

  const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
  let updated;
  if (override.id) {
    updated = current.map(o => o.id === override.id ? newRow : o);
    if (!updated.some(o => o.id === override.id)) {
      updated = [newRow, ...updated];
    }
  } else {
    const filtered = current.filter(o => !(o.provider_id === override.provider_id && o.corridor_id === override.corridor_id));
    updated = [newRow, ...filtered];
  }
  saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);

  if (override.vat_amount !== undefined || override.other_costs !== undefined) {
    saveExtraCosts(newRow.id, {
      vat_amount: override.vat_amount,
      other_costs: override.other_costs
    });
  }
  return newRow;
}

export async function updateOverrideStatus(id: string, is_active: boolean): Promise<void> {
  if (supabaseClient) {
    const statusVal = is_active ? 'active' : 'cancelled';
    const { error } = await supabaseClient.from('rate_overrides').update({ is_active, status: statusVal }).eq('id', id);
    if (!error) {
      const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
      const updated = current.map(o => o.id === id ? { ...o, is_active, status: statusVal as any } : o);
      saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
      return;
    }
    console.warn('Supabase update override status error, using emulated storage:', error);
  }

  const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
  const updated = current.map(o => o.id === id ? { ...o, is_active, status: is_active ? 'active' : 'cancelled' as any } : o);
  saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
}

export async function deleteOverrideRow(id: string): Promise<void> {
  if (supabaseClient) {
    // Soft delete / cancel instead of hard physical deletion so records persist in "Override History"!
    const { error } = await supabaseClient
      .from('rate_overrides')
      .update({ is_active: false, status: 'cancelled' })
      .eq('id', id);
    if (!error) {
      const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
      const updated = current.map(o => o.id === id ? { ...o, is_active: false, status: 'cancelled' as const } : o);
      saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
      return;
    }
    console.warn('Supabase delete override error, using emulated storage:', error);
  }

  const current = getLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, initialOverrides);
  const updated = current.map(o => o.id === id ? { ...o, is_active: false, status: 'cancelled' as const } : o);
  saveLocalStorageItem<DbRateOverride[]>(OVERRIDES_KEY, updated);
}

// Community Submissions
export async function fetchCommunitySubmissions(): Promise<DbCommunitySubmission[]> {
  let rows: DbCommunitySubmission[] = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('community_rate_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      rows = data.map((row: any) => ({
        id: row.id,
        provider_id: row.provider_id,
        provider_name: row.provider_name,
        corridor_id: row.corridor_id,
        exchange_rate: parseFloat(row.exchange_rate),
        transfer_fee: parseFloat(row.transfer_fee),
        send_amount: row.send_amount || 1000,
        receive_amount: row.receive_amount || (1000 * parseFloat(row.exchange_rate)),
        submitted_by_name: row.submitted_by_name || (row.submitted_by_email ? row.submitted_by_email.split('@')[0] : 'Contributor'),
        submitted_by_email: row.submitted_by_email || '',
        submitted_at: row.created_at || new Date().toISOString(),
        status: row.status,
      })) as DbCommunitySubmission[];
    } else {
      console.error('Supabase fetch community submissions error details:', error);
      console.warn('Supabase fetch community error, using emulated storage:', error);
      rows = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
    }
  } else {
    rows = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
  }

  // Attach extra costs
  return rows.map(s => {
    const extra = getExtraCosts(s.id);
    return {
      ...s,
      vat_amount: extra.vat_amount,
      other_costs: extra.other_costs
    };
  });
}

export async function saveCommunitySubmission(submission: Omit<DbCommunitySubmission, 'id' | 'submitted_at' | 'status'> & { vat_amount?: number; other_costs?: number; }): Promise<DbCommunitySubmission> {
  const newRow: DbCommunitySubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submitted_at: new Date().toISOString(),
    status: 'pending',
  };

  if (supabaseClient) {
    const supabaseRow = {
      id: newRow.id,
      corridor_id: newRow.corridor_id,
      provider_id: newRow.provider_id,
      provider_name: newRow.provider_name,
      exchange_rate: newRow.exchange_rate,
      transfer_fee: newRow.transfer_fee,
      submitted_by_email: newRow.submitted_by_email,
      status: newRow.status,
    };
    const { data, error } = await supabaseClient.from('community_rate_submissions').insert([supabaseRow]).select();
    if (!error && data && data[0]) {
      const savedRow = data[0];
      if (submission.vat_amount !== undefined || submission.other_costs !== undefined) {
        saveExtraCosts(savedRow.id, {
          vat_amount: submission.vat_amount,
          other_costs: submission.other_costs
        });
      }
      return {
        ...newRow,
        ...savedRow,
        submitted_at: savedRow.created_at || newRow.submitted_at,
      } as DbCommunitySubmission;
    }
    console.error('Supabase save submission error details:', error);
    console.warn('Supabase save submission error, using emulated storage:', error);
  }

  const current = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
  const updated = [newRow, ...current];
  saveLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, updated);

  if (submission.vat_amount !== undefined || submission.other_costs !== undefined) {
    saveExtraCosts(newRow.id, {
      vat_amount: submission.vat_amount,
      other_costs: submission.other_costs
    });
  }
  return newRow;
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const current = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
  const updated = current.map(s => s.id === id ? { ...s, status } : s);
  saveLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, updated);

  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('community_rate_submissions')
      .update({ status })
      .eq('id', id);
    if (error) {
      console.error('Supabase update submission status error details:', error);
    }
  }
}

// Market Reference Rates
export async function fetchMarketReferenceRates(): Promise<DbMarketReferenceRate[]> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('market_reference_rates').select('*');
    if (!error && data) return data as DbMarketReferenceRate[];
    console.warn('Supabase fetch market error, using emulated storage:', error);
  }
  return getLocalStorageItem<DbMarketReferenceRate[]>(MARKET_KEY, initialMarketRates);
}

export async function updateMarketRate(corridor_id: string, rate: number): Promise<void> {
  if (supabaseClient) {
    const { error } = await supabaseClient.from('market_reference_rates').upsert({ corridor_id, rate, last_updated: new Date().toISOString() });
    if (!error) return;
    console.warn('Supabase update market rate error, using emulated storage:', error);
  }

  const current = getLocalStorageItem<DbMarketReferenceRate[]>(MARKET_KEY, initialMarketRates);
  const existing = current.find(m => m.corridor_id === corridor_id);
  let updated;
  if (existing) {
    updated = current.map(m => m.corridor_id === corridor_id ? { ...m, rate, last_updated: new Date().toISOString() } : m);
  } else {
    updated = [...current, { id: `market-${corridor_id}`, corridor_id, rate, last_updated: new Date().toISOString() }];
  }
  saveLocalStorageItem<DbMarketReferenceRate[]>(MARKET_KEY, updated);
}


// --- SARIREMIT INTELLIGENCE CORE (SIC) ---

export function getFreshnessStatus(lastUpdatedStr: string): 'fresh' | 'aging' | 'stale' {
  const diffHours = (Date.now() - new Date(lastUpdatedStr).getTime()) / 3600000;
  if (diffHours <= 1) return 'fresh';
  if (diffHours <= 24) return 'aging';
  return 'stale';
}

export interface DbSisWeights {
  rate_weight: number;
  fee_weight: number;
  confidence_weight: number;
  freshness_weight: number;
  savings_weight: number;
}

const WEIGHTS_KEY = 'sr_supabase_sis_weights';
const initialWeights: DbSisWeights = {
  rate_weight: 0.30,
  fee_weight: 0.20,
  confidence_weight: 0.20,
  freshness_weight: 0.15,
  savings_weight: 0.15
};

export async function getSisWeights(): Promise<DbSisWeights> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('sis_weights').select('*').single();
    if (!error && data) return data as DbSisWeights;
    console.warn('Supabase weights error, falling back to emulated storage:', error);
  }
  return getLocalStorageItem<DbSisWeights>(WEIGHTS_KEY, initialWeights);
}

export async function saveSisWeights(weights: DbSisWeights): Promise<DbSisWeights> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient.from('sis_weights').upsert({ id: 1, ...weights }).select();
    if (!error && data && data[0]) return data[0] as DbSisWeights;
    console.error('Supabase save weights error details:', error);
    console.warn('Supabase save weights error, using emulated storage:', error);
  }
  saveLocalStorageItem<DbSisWeights>(WEIGHTS_KEY, weights);
  return weights;
}

/**
 * SIC: 1. Rate Resolution Engine — RRE
 * Resolves optimal exchange rates for all available providers in a corridor using strict priority:
 * 1. Active Admin Override (rate_overrides)
 * 2. Approved Community Verified Rate (community_rate_submissions)
 * 3. Live Market Reference Rate (market_reference_rates)
 * 4. Last Known Valid Rate (corridor defaults)
 */
export async function resolveRatesWithRRE(
  corridorId: string,
  sendAmount: number = 1000
): Promise<ResolvedRate[]> {
  const corridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
  const overrides = await fetchOverrides();
  const communitySubmissions = await fetchCommunitySubmissions();
  const marketRates = await fetchMarketReferenceRates();

  const resolvedList: ResolvedRate[] = [];

  const activeChannels = getActiveChannelsForCorridor(corridorId);

  for (const ch of activeChannels) {
    const provider = {
      id: ch.providerCode,
      name: ch.displayName || ch.providerName,
    };

    const coverage = getChannelCoverageSync(ch.id, corridorId);

    let resolvedRate = corridor.baseExchangeRate;
    let transferFee = (coverage && coverage.custom_transfer_fee !== null && coverage.custom_transfer_fee !== undefined)
      ? coverage.custom_transfer_fee
      : (ch.defaultTransferFee !== null && ch.defaultTransferFee !== undefined ? ch.defaultTransferFee : corridor.typicalFee);

    const defaultVatRate = (coverage && coverage.custom_vat_rate !== null && coverage.custom_vat_rate !== undefined)
      ? coverage.custom_vat_rate
      : (ch.defaultVatRate !== null && ch.defaultVatRate !== undefined ? ch.defaultVatRate : 0.15);

    let sourceType: 'admin_override' | 'community_verified' | 'manual_channel_rate' | 'market_reference' | 'last_known_valid';
    let sourceLabel = '';
    let confidence: 'high' | 'medium' | 'low';
    let reason = '';
    let expiresAt: string | null = null;
    let lastUpdated = '';

    const supportedMethods = coverage?.supported_transfer_methods || ch.supportedTransferMethods || [];
    const transferMethod = supportedMethods[0] || 'Bank Transfer';

    let customVat: number | undefined;
    let customOtherCosts: number | undefined;

    // 1. Active Admin Override
    const activeOverride = overrides.find(
      o => o.provider_id === provider.id && o.corridor_id === corridorId && isOverrideValid(o)
    );

    if (activeOverride) {
      resolvedRate = activeOverride.rate;
      transferFee = activeOverride.transfer_fee;
      customVat = activeOverride.vat_amount;
      customOtherCosts = activeOverride.other_costs;
      sourceType = 'admin_override';
      sourceLabel = 'Management Verified Rate';
      confidence = 'high';
      expiresAt = activeOverride.expires_at || null;
      lastUpdated = activeOverride.created_at;
      reason = 'Active admin override configured by SRCMC. Highest priority selection.';
    } else {
      // 2. Approved Community Verified Rate (within 24 hours of submission)
      const freshnessThresholdMs = 24 * 60 * 60 * 1000;
      const approvedCommunity = communitySubmissions
         .filter(s => {
           const isApproved = s.status === 'approved';
           const isMatching = s.provider_id === provider.id && s.corridor_id === corridorId;
           const ageMs = Date.now() - new Date(s.submitted_at).getTime();
           return isApproved && isMatching && ageMs <= freshnessThresholdMs;
         })
         .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];

      if (approvedCommunity) {
        resolvedRate = approvedCommunity.exchange_rate;
        transferFee = approvedCommunity.transfer_fee;
        customVat = approvedCommunity.vat_amount;
        customOtherCosts = approvedCommunity.other_costs;
        sourceType = 'community_verified';
        sourceLabel = 'Community Verified Rate';
        confidence = 'medium';
        lastUpdated = approvedCommunity.submitted_at;
        reason = 'No active admin override exists; utilizing live approved community verified submission.';
      } else if (coverage && coverage.exchange_rate !== null && coverage.exchange_rate !== undefined && coverage.exchange_rate > 0) {
        // 3. Manual Channel Coverage Rate
        resolvedRate = coverage.exchange_rate;
        transferFee = (coverage.transfer_fee !== null && coverage.transfer_fee !== undefined)
          ? coverage.transfer_fee
          : ((coverage.custom_transfer_fee !== null && coverage.custom_transfer_fee !== undefined) ? coverage.custom_transfer_fee : transferFee);
        customVat = (coverage.vat_amount !== null && coverage.vat_amount !== undefined) ? coverage.vat_amount : undefined;
        customOtherCosts = (coverage.other_costs !== null && coverage.other_costs !== undefined) ? coverage.other_costs : undefined;
        sourceType = 'manual_channel_rate';
        sourceLabel = 'Channel Coverage Rate';
        confidence = 'medium';
        lastUpdated = coverage.updated_at || new Date().toISOString();
        reason = 'This rate was saved in the channel coverage settings.';
      } else {
        // 4. Live Market Reference Rate
        const marketRef = marketRates.find(m => m.corridor_id === corridorId);
        if (marketRef) {
          let providerModifier = 1.0;
          let feeModifier = 0;
          switch (provider.id) {
            case 'stc-pay': providerModifier = 1.004; feeModifier = -5; break;
            case 'urpay': providerModifier = 1.002; feeModifier = -3; break;
            case 'mobily-pay': providerModifier = 1.001; feeModifier = -7; break;
            case 'enjaz': providerModifier = 0.998; feeModifier = 2; break;
            case 'quickpay': providerModifier = 0.995; feeModifier = 0; break;
            case 'western-union': providerModifier = 0.990; feeModifier = 5; break;
            case 'al-rajhi-tahweel': providerModifier = 1.000; feeModifier = 1; break;
            default:
              providerModifier = ch.category === 'wallet' ? 1.003 : 1.000;
              feeModifier = ch.category === 'wallet' ? -4 : 0;
              break;
          }
          resolvedRate = parseFloat((marketRef.rate * providerModifier).toFixed(4));
          
          if (coverage && (coverage.transfer_fee !== null && coverage.transfer_fee !== undefined)) {
            transferFee = coverage.transfer_fee;
          } else if (coverage && (coverage.custom_transfer_fee !== null && coverage.custom_transfer_fee !== undefined)) {
            transferFee = coverage.custom_transfer_fee;
          } else {
            transferFee = Math.max(0, transferFee + feeModifier);
          }

          if (coverage && coverage.vat_amount !== null && coverage.vat_amount !== undefined) {
            customVat = coverage.vat_amount;
          }
          if (coverage && coverage.other_costs !== null && coverage.other_costs !== undefined) {
            customOtherCosts = coverage.other_costs;
          }

          sourceType = 'market_reference';
          sourceLabel = 'Market Reference Rate';
          confidence = 'medium';
          lastUpdated = marketRef.last_updated;
          reason = 'No active override, approved community rate, or manual channel rate exists. Public market reference rate is used.';
        } else {
          // 5. Last Known Valid Rate (Emergency fallback)
          let baseProviderModifier = 1.0;
          let baseFeeModifier = 0;
          switch (provider.id) {
            case 'stc-pay': baseProviderModifier = 1.003; baseFeeModifier = -5; break;
            case 'urpay': baseProviderModifier = 1.001; baseFeeModifier = -3; break;
            case 'mobily-pay': baseProviderModifier = 1.000; baseFeeModifier = -7; break;
            case 'enjaz': baseProviderModifier = 0.997; baseFeeModifier = 2; break;
            case 'quickpay': baseProviderModifier = 0.994; baseFeeModifier = 0; break;
            case 'western-union': baseProviderModifier = 0.988; baseFeeModifier = 5; break;
            case 'al-rajhi-tahweel': baseProviderModifier = 1.000; baseFeeModifier = 1; break;
            default:
              baseProviderModifier = ch.category === 'wallet' ? 1.002 : 1.000;
              baseFeeModifier = ch.category === 'wallet' ? -4 : 0;
              break;
          }
          resolvedRate = parseFloat((corridor.baseExchangeRate * baseProviderModifier).toFixed(4));
          
          if (coverage && (coverage.transfer_fee !== null && coverage.transfer_fee !== undefined)) {
            transferFee = coverage.transfer_fee;
          } else if (coverage && (coverage.custom_transfer_fee !== null && coverage.custom_transfer_fee !== undefined)) {
            transferFee = coverage.custom_transfer_fee;
          } else {
            transferFee = Math.max(0, transferFee + baseFeeModifier);
          }

          if (coverage && coverage.vat_amount !== null && coverage.vat_amount !== undefined) {
            customVat = coverage.vat_amount;
          }
          if (coverage && coverage.other_costs !== null && coverage.other_costs !== undefined) {
            customOtherCosts = coverage.other_costs;
          }

          sourceType = 'last_known_valid';
          sourceLabel = 'Last Known Valid Rate';
          confidence = 'low';
          lastUpdated = new Date(Date.now() - 86400000 * 2).toISOString();
          reason = 'No active rates or feeds available; using emergency fallback static parameters.';
        }
      }
    }

    const vatAmount = customVat !== undefined && customVat !== null ? customVat : parseFloat((transferFee * defaultVatRate).toFixed(2));
    const otherCosts = customOtherCosts !== undefined && customOtherCosts !== null ? customOtherCosts : 0;
    const totalFeeSar = transferFee + vatAmount + otherCosts;
    const totalFee = parseFloat((totalFeeSar * resolvedRate).toFixed(4));

    const ageHrs = (Date.now() - new Date(lastUpdated).getTime()) / 3600000;
    let freshness: 'fresh' | 'aging' | 'stale' = 'stale';
    if (ageHrs <= 1) freshness = 'fresh';
    else if (ageHrs <= 24) freshness = 'aging';

    resolvedList.push({
      providerId: provider.id,
      providerName: provider.name,
      destinationCountry: corridor.toCountry,
      destinationCurrency: corridor.currencyCode,
      transferMethod,
      resolvedRate,
      transferFee,
      vatAmount,
      otherCosts,
      totalFee,
      sourceType,
      sourceLabel,
      confidence,
      freshness,
      lastUpdated,
      expiresAt,
      reason
    });
  }

  return resolvedList;
}

/**
 * SIC: True Cost Engine — TCE
 * Calculates detailed cost components, hidden exchange-rate margins, and transparency ratings.
 */
export async function calculateTrueCost(
  resolvedRates: ResolvedRate[],
  input: { corridorId: string; sendAmount: number }
): Promise<TrueCostResult[]> {
  const marketRates = await fetchMarketReferenceRates();
  const marketRef = marketRates.find(m => m.corridor_id === input.corridorId);
  const marketReferenceRate = marketRef ? marketRef.rate : null;

  return resolvedRates.map(resolved => {
    const otherCosts = resolved.otherCosts || 0;
    const visibleFees = resolved.transferFee + resolved.vatAmount + otherCosts;
    const visibleFeesInDest = visibleFees * resolved.resolvedRate;
    
    let idealRecipientAmount: number | null = null;
    let exchangeRateLoss: number | null = null;
    let hiddenCost: number | null = null;
    let trueCost: number | null = null;
    let trueCostPercent: number | null = null;
    let transparencyRating: "excellent" | "good" | "fair" | "poor" | "unknown" = "unknown";
    let explanation = "";

    if (marketReferenceRate) {
      idealRecipientAmount = parseFloat((input.sendAmount * marketReferenceRate).toFixed(4));
      const rawLoss = idealRecipientAmount - (input.sendAmount * resolved.resolvedRate);
      exchangeRateLoss = parseFloat(Math.max(0, rawLoss).toFixed(4));
      hiddenCost = exchangeRateLoss;
      trueCost = parseFloat((visibleFeesInDest + exchangeRateLoss).toFixed(4));
      trueCostPercent = parseFloat(((trueCost / idealRecipientAmount) * 100).toFixed(4));

      if (trueCostPercent <= 0.5) transparencyRating = "excellent";
      else if (trueCostPercent <= 1.0) transparencyRating = "good";
      else if (trueCostPercent <= 2.0) transparencyRating = "fair";
      else transparencyRating = "poor";

      explanation = `True cost is ${trueCost.toFixed(2)} ${resolved.destinationCurrency} (${trueCostPercent.toFixed(2)}% of transfer value). Visible fees: ${visibleFees.toFixed(2)} SAR. Exchange rate markup: ${hiddenCost.toFixed(2)} ${resolved.destinationCurrency}.`;
    } else {
      explanation = "Market reference rate is currently unavailable. Hidden exchange-rate markup cannot be computed, but visible fees are fully disclosed.";
    }

    const actualRecipientAmount = parseFloat(((input.sendAmount - visibleFees) * resolved.resolvedRate).toFixed(4));

    return {
      providerId: resolved.providerId,
      providerName: resolved.providerName,
      sendAmount: input.sendAmount,
      destinationCurrency: resolved.destinationCurrency,
      visibleFees,
      transferFee: resolved.transferFee,
      vatAmount: resolved.vatAmount,
      otherCosts,
      marketReferenceRate,
      resolvedRate: resolved.resolvedRate,
      idealRecipientAmount,
      actualRecipientAmount,
      exchangeRateLoss,
      hiddenCost,
      trueCost,
      trueCostPercent,
      transparencyRating,
      explanation
    };
  });
}

/**
 * SIC: 2. SariRemit Intelligence Score — SIS
 * Compiles a comprehensive reliability/pricing index score from 0 to 100.
 */
export function calculateSISForResolvedRates(
  resolvedRates: ResolvedRate[],
  trueCostResults: TrueCostResult[] = [],
  sendAmount: number = 1000
): SISResult[] {
  const results: SISResult[] = [];
  if (!resolvedRates || resolvedRates.length === 0) {
    return results;
  }

  const rates = resolvedRates.map(r => r.resolvedRate);
  const bestRate = Math.max(...rates);
  const fees = resolvedRates.map(r => r.transferFee);
  const lowestFee = Math.min(...fees);

  const netAmounts = resolvedRates.map(r => (sendAmount * r.resolvedRate) - r.totalFee);
  const avgNet = netAmounts.length > 0 ? netAmounts.reduce((sum, v) => sum + v, 0) / netAmounts.length : 0;

  for (const resolved of resolvedRates) {
    // 1. Rate Advantage Score (30% changed to 25% for true cost)
    let rateAdvantageScore = 20;
    if (resolved.resolvedRate === bestRate) {
      rateAdvantageScore = 100;
    } else {
      const rateDiffPct = (bestRate - resolved.resolvedRate) / bestRate;
      if (rateDiffPct <= 0.001) rateAdvantageScore = 95;
      else if (rateDiffPct <= 0.0025) rateAdvantageScore = 85;
      else if (rateDiffPct <= 0.005) rateAdvantageScore = 70;
      else if (rateDiffPct <= 0.01) rateAdvantageScore = 50;
      else if (rateDiffPct <= 0.02) rateAdvantageScore = 30;
      else rateAdvantageScore = 10;
    }

    // 2. Fee Advantage Score (20% changed to 15% for true cost)
    let feeAdvantageScore = 20;
    if (resolved.transferFee === lowestFee) {
      feeAdvantageScore = 100;
    } else {
      const feeDiff = resolved.transferFee - lowestFee;
      if (feeDiff <= 2) feeAdvantageScore = 85;
      else if (feeDiff <= 5) feeAdvantageScore = 70;
      else if (feeDiff <= 10) feeAdvantageScore = 50;
      else if (feeDiff <= 15) feeAdvantageScore = 30;
      else feeAdvantageScore = 10;
    }

    // 3. True Cost Score (20%)
    let trueCostScore = 50;
    const tcResult = trueCostResults.find(t => t.providerId === resolved.providerId);
    const transparency = tcResult?.transparencyRating || "unknown";
    if (transparency === "excellent") trueCostScore = 100;
    else if (transparency === "good") trueCostScore = 80;
    else if (transparency === "fair") trueCostScore = 60;
    else if (transparency === "poor") trueCostScore = 30;
    else if (transparency === "unknown") trueCostScore = 50;

    // 4. Confidence Score (15%)
    let confidenceScore = 40;
    if (resolved.sourceType === 'admin_override') confidenceScore = 100;
    else if (resolved.sourceType === 'community_verified') confidenceScore = 85;
    else if (resolved.sourceType === 'market_reference') confidenceScore = 70;
    else if (resolved.sourceType === 'last_known_valid') confidenceScore = 40;

    // 5. Freshness Score (10%)
    let freshnessScore = 10;
    const ageHrs = (Date.now() - new Date(resolved.lastUpdated).getTime()) / 3600000;
    if (ageHrs <= 1) freshnessScore = 100;
    else if (ageHrs <= 6) freshnessScore = 85;
    else if (ageHrs <= 24) freshnessScore = 65;
    else if (ageHrs <= 48) freshnessScore = 35;
    else freshnessScore = 10;

    // 6. Savings Score (15%)
    let savingsScore = 20;
    const netRecipientAmount = (sendAmount * resolved.resolvedRate) - resolved.totalFee;
    if (netRecipientAmount > avgNet) {
      const savingsPct = (netRecipientAmount - avgNet) / avgNet;
      if (savingsPct >= 0.01) savingsScore = 100;
      else if (savingsPct >= 0.005) savingsScore = 85;
      else if (savingsPct >= 0.002) savingsScore = 70;
      else savingsScore = 50;
    } else {
      savingsScore = 30;
    }

    const rawScore = (
      rateAdvantageScore * 0.25 +
      feeAdvantageScore * 0.15 +
      trueCostScore * 0.20 +
      confidenceScore * 0.15 +
      freshnessScore * 0.10 +
      savingsScore * 0.15
    );

    const sisScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    let sisLabel: 'Excellent' | 'Strong' | 'Fair' | 'Weak' | 'Poor' = 'Fair';
    if (sisScore >= 90) sisLabel = 'Excellent';
    else if (sisScore >= 75) sisLabel = 'Strong';
    else if (sisScore >= 60) sisLabel = 'Fair';
    else if (sisScore >= 40) sisLabel = 'Weak';
    else sisLabel = 'Poor';

    let sisReason = `SIS ${sisScore} — ${sisLabel}. `;
    if (sisScore >= 90) {
      sisReason += `Outstanding option. Extremely high payout and premium true cost transparency rating of "${transparency.toUpperCase()}".`;
    } else if (sisScore >= 75) {
      sisReason += `Highly competitive option. Solid exchange rates, reasonable visible fees, and verified true cost structure.`;
    } else if (sisScore >= 60) {
      sisReason += `Fair pricing. Exchange rates are average, and hidden margins may affect overall true cost value.`;
    } else {
      sisReason += `Suboptimal conditions. High hidden markup or excessive fees detected. Consider safer, more cost-effective alternatives.`;
    }

    results.push({
      providerId: resolved.providerId,
      sisScore,
      sisLabel,
      sisReason,
      components: {
        rateAdvantageScore,
        feeAdvantageScore,
        trueCostScore,
        confidenceScore,
        freshnessScore,
        savingsScore
      }
    });
  }

  return results;
}

/**
 * SIC: 3. Recommendation Engine
 * Recommends the absolute optimal provider for remittances under the RRE + SIS umbrella.
 */
export function generateRecommendation(
  resolvedRates: ResolvedRate[],
  trueCostResults: TrueCostResult[],
  sisResults: SISResult[],
  sendAmount: number = 1000,
  corridorId?: string
): RecommendationResult {
  if (!resolvedRates || resolvedRates.length === 0) {
    const corridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
    return {
      bestProviderId: 'stc-pay',
      bestProviderName: 'STC Pay / STC Bank',
      transferMethod: 'Bank Transfer',
      sendAmount,
      destinationCurrency: corridor ? corridor.currencyCode : 'KES',
      netRecipientAmount: 0,
      estimatedSavings: 0,
      recommendationType: 'wait',
      confidence: 'low',
      reason: 'No active remittance channels are available for this corridor at the moment.',
      resolvedRateSource: 'last_known_valid',
      lastUpdated: new Date().toISOString()
    };
  }

  const options = resolvedRates.map(resolved => {
    const sis = sisResults.find(s => s.providerId === resolved.providerId)!;
    const tcResult = trueCostResults.find(t => t.providerId === resolved.providerId)!;
    return { resolved, sis, tcResult, actualRecipientAmount: tcResult.actualRecipientAmount };
  });

  // Sort according to priority:
  // 1. Highest net recipient amount
  // 2. Lowest true cost (lower is better; if null, default to visible fees * resolvedRate)
  // 3. Highest SIS score
  // 4. Highest confidence
  // 5. Freshest data
  // 6. Lowest visible fee (resolved.transferFee)
  const ranked = [...options].sort((a, b) => {
    if (Math.abs(b.actualRecipientAmount - a.actualRecipientAmount) > 0.01) {
      return b.actualRecipientAmount - a.actualRecipientAmount;
    }

    const trueCostA = a.tcResult.trueCost !== null && a.tcResult.trueCost !== undefined
      ? a.tcResult.trueCost
      : (a.tcResult.visibleFees * a.resolved.resolvedRate);
    const trueCostB = b.tcResult.trueCost !== null && b.tcResult.trueCost !== undefined
      ? b.tcResult.trueCost
      : (b.tcResult.visibleFees * b.resolved.resolvedRate);
    if (Math.abs(trueCostA - trueCostB) > 0.01) {
      return trueCostA - trueCostB;
    }

    if (b.sis.sisScore !== a.sis.sisScore) {
      return b.sis.sisScore - a.sis.sisScore;
    }

    const confWeight = { high: 3, medium: 2, low: 1 };
    if (a.resolved.confidence !== b.resolved.confidence) {
      return confWeight[b.resolved.confidence] - confWeight[a.resolved.confidence];
    }

    const timeA = new Date(a.resolved.lastUpdated).getTime();
    const timeB = new Date(b.resolved.lastUpdated).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    return a.resolved.transferFee - b.resolved.transferFee;
  });

  const best = ranked[0];
  const totalNet = options.reduce((sum, o) => sum + o.actualRecipientAmount, 0);
  const avgNet = totalNet / options.length;
  const estimatedSavings = Math.max(0, best.actualRecipientAmount - avgNet);

  // Recommendation status type
  let recommendationType: 'send_now' | 'compare_more' | 'wait' = 'compare_more';
  const isConfidenceOk = best.resolved.confidence === 'high' || best.resolved.confidence === 'medium';
  const isFreshnessOk = best.resolved.freshness === 'fresh' || best.resolved.freshness === 'aging';
  const hasPositiveSavings = estimatedSavings > 0;

  if (isConfidenceOk && isFreshnessOk && hasPositiveSavings) {
    recommendationType = 'send_now';
  } else if (resolvedRates.every(r => r.freshness === 'stale' || r.confidence === 'low')) {
    recommendationType = 'wait';
  } else {
    recommendationType = 'compare_more';
  }

  const sourceLabelHuman = best.resolved.sourceType === 'admin_override'
    ? 'management verified rate'
    : best.resolved.sourceType === 'community_verified'
    ? 'community verified rate'
    : 'live market reference rate';

  const transparencyLabel = best.tcResult.transparencyRating.toUpperCase();
  const reason = `${best.resolved.providerName} via ${best.resolved.transferMethod} is recommended today. Recipient receives ${best.actualRecipientAmount.toFixed(2)} ${best.resolved.destinationCurrency}, securing an SIS of ${best.sis.sisScore} (${best.sis.sisLabel}) with a "${transparencyLabel}" true cost transparency rating.`;

  return {
    bestProviderId: best.resolved.providerId,
    bestProviderName: best.resolved.providerName,
    transferMethod: best.resolved.transferMethod,
    sendAmount,
    destinationCurrency: best.resolved.destinationCurrency,
    netRecipientAmount: best.actualRecipientAmount,
    estimatedSavings,
    recommendationType,
    confidence: best.resolved.confidence,
    reason,
    resolvedRateSource: best.resolved.sourceType,
    lastUpdated: best.resolved.lastUpdated
  };
}

/**
 * SIC: SariRemit Intelligence Core — SIC
 * Exposes a unified function containing the entire resolution pipeline.
 */
export async function getSariRemitIntelligence(input: {
  corridorId: string;
  sendAmount: number;
}): Promise<{
  resolvedRates: ResolvedRate[];
  trueCostResults: TrueCostResult[];
  sisResults: SISResult[];
  recommendation: RecommendationResult;
  generatedAt: string;
  engine: string;
  engineStatus: string;
}> {
  const resolvedRates = await resolveRatesWithRRE(input.corridorId, input.sendAmount);
  const trueCostResults = await calculateTrueCost(resolvedRates, input);
  const sisResults = calculateSISForResolvedRates(resolvedRates, trueCostResults, input.sendAmount);
  const recommendation = generateRecommendation(resolvedRates, trueCostResults, sisResults, input.sendAmount, input.corridorId);

  // Store snapshots locally in sandbox mode for auditable logs
  if (typeof window !== 'undefined' && window.localStorage) {
    const snapshots = getLocalStorageItem<any[]>('sr_sic_snapshots', []);
    const newSnapshot = {
      id: `snapshot-${Date.now()}`,
      destination_country: resolvedRates[0]?.destinationCountry || '',
      destination_currency: resolvedRates[0]?.destinationCurrency || '',
      send_amount: input.sendAmount,
      resolved_rates: resolvedRates,
      sis_results: sisResults,
      true_cost_results: trueCostResults,
      recommendation: recommendation,
      engine_status: 'active',
      generated_at: new Date().toISOString(),
      sic_version: 'v1.1'
    };
    saveLocalStorageItem<any[]>('sr_sic_snapshots', [newSnapshot, ...snapshots.slice(0, 49)]);
  }

  if (supabaseClient) {
    try {
      await supabaseClient.from('sic_snapshots').insert([{
        destination_country: resolvedRates[0]?.destinationCountry || '',
        destination_currency: resolvedRates[0]?.destinationCurrency || '',
        send_amount: input.sendAmount,
        transfer_method: recommendation.transferMethod,
        resolved_rates: resolvedRates,
        sis_results: sisResults,
        true_cost_results: trueCostResults,
        recommendation: recommendation,
        engine_status: 'active',
        sic_version: 'v1.1'
      }]);
    } catch (err) {
      // Ignored if table doesn't exist yet
    }
  }

  return {
    resolvedRates,
    trueCostResults,
    sisResults,
    recommendation,
    generatedAt: new Date().toISOString(),
    engine: "SIC",
    engineStatus: "active"
  };
}

// --- BACKWARD COMPATIBLE ENGINE WRAPPERS ---

export async function resolveRate(
  corridorId: string,
  providerId: string,
  sendAmount: number = 1000
): Promise<DbResolvedRate> {
  const resolvedList = await resolveRatesWithRRE(corridorId, sendAmount);
  const resolved = resolvedList.find(r => r.providerId === providerId) || resolvedList[0];

  if (!resolved) {
    const corridor = CORRIDORS.find(c => c.id === corridorId) || CORRIDORS[0];
    return {
      id: `resolved-${providerId}-${corridorId}`,
      provider_id: providerId,
      provider_name: providerId,
      corridor_id: corridorId,
      resolved_rate: corridor ? corridor.baseExchangeRate : 1.0,
      transfer_fee: corridor ? corridor.typicalFee : 10,
      source_type: 'last_known_valid',
      source_label: 'Last Known Valid Rate',
      confidence: 'low',
      freshness_status: 'stale',
      last_updated: new Date().toISOString(),
      is_active: false,
      reason: 'No active remittance channel is currently configured for this corridor.'
    };
  }

  return {
    id: `resolved-${providerId}-${corridorId}`,
    provider_id: providerId,
    provider_name: resolved.providerName,
    corridor_id: corridorId,
    resolved_rate: resolved.resolvedRate,
    transfer_fee: resolved.transferFee,
    source_type: resolved.sourceType,
    source_label: resolved.sourceLabel,
    confidence: resolved.confidence,
    freshness_status: resolved.freshness,
    last_updated: resolved.lastUpdated,
    expires_at: resolved.expiresAt || undefined,
    is_active: true,
    reason: resolved.reason
  };
}

export function calculateSIS(
  resolved: DbResolvedRate,
  allResolvedInCorridor: DbResolvedRate[],
  customWeights?: DbSisWeights
): DbSisScore {
  const mappedList: ResolvedRate[] = allResolvedInCorridor.map(r => {
    const ageHrs = (Date.now() - new Date(r.last_updated).getTime()) / 3600000;
    const freshness = ageHrs <= 1 ? 'fresh' : ageHrs <= 24 ? 'aging' : 'stale';
    const vat = parseFloat((r.transfer_fee * 0.15).toFixed(2));
    return {
      providerId: r.provider_id,
      providerName: r.provider_name,
      destinationCountry: '',
      destinationCurrency: '',
      transferMethod: '',
      resolvedRate: r.resolved_rate,
      transferFee: r.transfer_fee,
      vatAmount: vat,
      totalFee: (r.transfer_fee + vat) * r.resolved_rate,
      sourceType: r.source_type,
      sourceLabel: r.source_label,
      confidence: r.confidence,
      freshness,
      lastUpdated: r.last_updated,
      expiresAt: r.expires_at || null,
      reason: r.reason
    };
  });

  const computedAll = calculateSISForResolvedRates(mappedList);
  const computed = computedAll.find(c => c.providerId === resolved.provider_id) || computedAll[0];

  if (!computed) {
    return {
      id: `sis-${resolved.provider_id}-${resolved.corridor_id}`,
      provider_id: resolved.provider_id,
      corridor_id: resolved.corridor_id,
      sis_score: 50,
      sis_label: 'Fair',
      sis_reason: 'No dynamic scoring data available.',
      rate_advantage_score: 50,
      fee_advantage_score: 50,
      confidence_score: 50,
      freshness_score: 50,
      savings_score: 50
    };
  }

  return {
    id: `sis-${resolved.provider_id}-${resolved.corridor_id}`,
    provider_id: resolved.provider_id,
    corridor_id: resolved.corridor_id,
    sis_score: computed.sisScore,
    sis_label: computed.sisLabel,
    sis_reason: computed.sisReason,
    rate_advantage_score: computed.components.rateAdvantageScore,
    fee_advantage_score: computed.components.feeAdvantageScore,
    confidence_score: computed.components.confidenceScore,
    freshness_score: computed.components.freshnessScore,
    savings_score: computed.components.savingsScore
  };
}

export async function getRecommendations(
  corridorId: string,
  sendAmount: number = 1000
): Promise<{
  bestOption: DbRecommendationResult;
  allOptions: { resolved: DbResolvedRate; sis: DbSisScore; netAmount: number; totalFees: number; trueCost?: TrueCostResult }[];
}> {
  const sic = await getSariRemitIntelligence({ corridorId, sendAmount });

  const mappedOptions = sic.resolvedRates.map(resolved => {
    const sis = sic.sisResults.find(s => s.providerId === resolved.providerId)!;
    const tcResult = sic.trueCostResults.find(t => t.providerId === resolved.providerId);

    const dbResolved: DbResolvedRate = {
      id: `resolved-${resolved.providerId}-${corridorId}`,
      provider_id: resolved.providerId,
      provider_name: resolved.providerName,
      corridor_id: corridorId,
      resolved_rate: resolved.resolvedRate,
      transfer_fee: resolved.transferFee,
      source_type: resolved.sourceType,
      source_label: resolved.sourceLabel,
      confidence: resolved.confidence,
      freshness_status: resolved.freshness,
      last_updated: resolved.lastUpdated,
      expires_at: resolved.expiresAt || undefined,
      is_active: true,
      reason: resolved.reason
    };

    const dbSis: DbSisScore = {
      id: `sis-${resolved.providerId}-${corridorId}`,
      provider_id: resolved.providerId,
      corridor_id: corridorId,
      sis_score: sis.sisScore,
      sis_label: sis.sisLabel,
      sis_reason: sis.sisReason,
      rate_advantage_score: sis.components.rateAdvantageScore,
      fee_advantage_score: sis.components.feeAdvantageScore,
      true_cost_score: sis.components.trueCostScore,
      confidence_score: sis.components.confidenceScore,
      freshness_score: sis.components.freshnessScore,
      savings_score: sis.components.savingsScore
    };

    const netAmount = tcResult ? tcResult.actualRecipientAmount : ((sendAmount * resolved.resolvedRate) - resolved.totalFee);

    return {
      resolved: dbResolved,
      sis: dbSis,
      netAmount,
      totalFees: resolved.transferFee + resolved.vatAmount,
      trueCost: tcResult
    };
  });

  const best = mappedOptions.find(o => o.resolved.provider_id === sic.recommendation.bestProviderId) || mappedOptions[0];

  const dbBestOption: DbRecommendationResult = {
    id: `rec-${corridorId}-${Date.now()}`,
    corridor_id: corridorId,
    best_provider_id: sic.recommendation.bestProviderId,
    best_provider_name: sic.recommendation.bestProviderName,
    best_channel: sic.recommendation.transferMethod,
    send_amount: sendAmount,
    net_recipient_amount: sic.recommendation.netRecipientAmount,
    estimated_savings: sic.recommendation.estimatedSavings,
    compared_against_average: sic.recommendation.estimatedSavings,
    recommendation_type: sic.recommendation.recommendationType,
    reason: sic.recommendation.reason,
    resolved_rate_source: sic.recommendation.resolvedRateSource,
    confidence: sic.recommendation.confidence,
    last_updated: sic.recommendation.lastUpdated
  };

  return {
    bestOption: dbBestOption,
    allOptions: mappedOptions
  };
}


// --- SUPABASE USER AUTHENTICATION / SIMULATOR ---

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    preferredCorridorId: string;
    language: 'en' | 'ar';
    onboarding_completed?: boolean;
    primary_destination_country?: string;
    primary_destination_currency?: string;
    preferred_channels?: string[];
    estimated_monthly_send_amount?: number;
  } | null;
}

const initialRegisteredUsers = [
  {
    id: 'user-init-1',
    email: 'ahmed.hassan@saudi-expats.com',
    name: 'Ahmed Hassan',
    phone: '+966 50 123 4567',
    preferred_corridor_id: 'sa-pk',
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'user-init-2',
    email: 'gaturuhassan@gmail.com',
    name: 'Hassan Gaturu',
    phone: '+966 55 987 6543',
    preferred_corridor_id: 'sa-in',
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'user-init-3',
    email: 'john.doe@gmail.com',
    name: 'John Doe',
    phone: '+966 53 111 2222',
    preferred_corridor_id: 'sa-ph',
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export function getAuthSession(): AuthSession {
  return getLocalStorageItem<AuthSession>(USER_SESSION_KEY, { user: null });
}

export function saveAuthSession(session: AuthSession): void {
  saveLocalStorageItem<AuthSession>(USER_SESSION_KEY, session);
}

export async function signUpWithSupabase(
  email: string,
  name: string,
  phone: string,
  preferredCorridorId: string,
  password?: string
): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const signupPassword = password || 'password123';
  let authUserId = `user-${Date.now()}`;
  
  const newUser = {
    id: authUserId,
    email: normalizedEmail,
    name,
    phone,
    preferredCorridorId,
    language: 'en' as const,
    onboarding_completed: false,
  };

  if (isSupabaseConfigured && supabaseClient) {
    // 1. Check if email already exists in our profiles
    const { data: existingProfileByEmail } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfileByEmail) {
      throw new Error(
        "An account with this email address already exists. Please sign in instead."
      );
    }

    // 2. Perform Supabase Auth SignUp
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: normalizedEmail,
      password: signupPassword,
      options: {
        data: {
          name: name,
          full_name: name,
          phone: phone,
          preferredCorridorId: preferredCorridorId,
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      authUserId = authData.user.id;
      newUser.id = authUserId;

      // 3. Create the database profile (Use ID from auth.users.id)
      const { error: profileError } = await supabaseClient.from('user_profiles').insert({
        id: authUserId,
        email: normalizedEmail,
        name: name,
        phone: phone,
        preferred_corridor_id: preferredCorridorId,
        language: 'en',
        onboarding_completed: false,
        created_at: new Date().toISOString()
      });

      if (profileError) {
        console.error('[SariRemit Auth] Failed to create user profile during signup:', profileError);
        throw profileError;
      }
    }
  } else {
    // Local emulation fallback mode
    const allUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
    const matchedLocalUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (matchedLocalUser) {
      throw new Error(
        "An account with this email address already exists. Please sign in instead."
      );
    }

    const emulatedUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      preferred_corridor_id: newUser.preferredCorridorId,
      language: newUser.language,
      onboarding_completed: false,
      created_at: new Date().toISOString()
    };
    allUsers.push(emulatedUser);
    saveLocalStorageItem('sr_supabase_registered_users', allUsers);
  }

  const session = { user: newUser };
  saveAuthSession(session);
  return session;
}

export async function signInWithSupabase(email: string, password?: string): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();
  const signinPassword = password || 'password123';

  if (isSupabaseConfigured && supabaseClient) {
    // 1. Perform authentic Supabase signIn
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: signinPassword,
    });

    if (authError) {
      // Return clear error messages
      if (authError.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error("Incorrect email or password");
      }
      throw authError;
    }

    if (authData.user) {
      const authUserId = authData.user.id;
      console.log('[SariRemit Auth] Real Auth User ID after login:', authUserId);

      // 2. Fetch profile from user_profiles table (Primary Key = authUserId)
      let { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (!profile) {
        console.log('[SariRemit Auth] No profile exists on signin. Creating missing profile linked to auth.users.id...');
        const { data: newProfile, error: createError } = await supabaseClient
          .from('user_profiles')
          .insert({
            id: authUserId,
            email: normalizedEmail,
            name: authData.user?.user_metadata?.name || authData.user?.user_metadata?.full_name || normalizedEmail.split('@')[0].toUpperCase(),
            phone: authData.user?.user_metadata?.phone || '+966 50 123 4567',
            preferred_corridor_id: 'sa-pk',
            language: 'en',
            onboarding_completed: false,
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (createError) {
          console.error('[SariRemit Auth] Failed to create linked profile on signin:', createError);
          throw createError;
        }
        profile = newProfile;
      }

      if (profile) {
        const session = {
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            phone: profile.phone,
            preferredCorridorId: profile.preferred_corridor_id,
            language: profile.language || 'en',
            onboarding_completed: profile.onboarding_completed || false,
            primary_destination_country: profile.primary_destination_country,
            primary_destination_currency: profile.primary_destination_currency,
            preferred_channels: profile.preferred_channels || [],
            estimated_monthly_send_amount: profile.estimated_monthly_send_amount ? parseFloat(profile.estimated_monthly_send_amount) : undefined,
          }
        };

        saveAuthSession(session);
        return session;
      }
    }
    throw new Error("Unable to retrieve user information from Supabase Auth.");
  } else {
    // Local emulation fallback mode
    const allUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
    const matchedLocalUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!matchedLocalUser) {
      throw new Error("No account found or invalid login details");
    }

    const session = {
      user: {
        id: matchedLocalUser.id,
        email: matchedLocalUser.email,
        name: matchedLocalUser.name,
        phone: matchedLocalUser.phone,
        preferredCorridorId: matchedLocalUser.preferred_corridor_id || matchedLocalUser.preferredCorridorId || 'sa-pk',
        language: (matchedLocalUser.language as 'en' | 'ar') || 'en',
        onboarding_completed: matchedLocalUser.onboarding_completed || false,
        primary_destination_country: matchedLocalUser.primary_destination_country,
        primary_destination_currency: matchedLocalUser.primary_destination_currency,
        preferred_channels: matchedLocalUser.preferred_channels || [],
        estimated_monthly_send_amount: matchedLocalUser.estimated_monthly_send_amount,
      }
    };

    saveAuthSession(session);
    return session;
  }
}

export async function getCurrentSessionProfile(): Promise<AuthSession> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data: { session: sbSession }, error: sbError } = await supabaseClient.auth.getSession();

      if (!sbError && sbSession?.user) {
        const authUser = sbSession.user;
        const normalizedEmail = authUser.email?.trim().toLowerCase() || '';

        console.log('[SariRemit Auth] Fetching session profile on mount for ID:', authUser.id);

        let { data: profile } = await supabaseClient
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!profile) {
          console.log('[SariRemit Auth] Session check: creating missing profile for auth.users.id:', authUser.id);
          const { data: newProfile } = await supabaseClient
            .from('user_profiles')
            .insert({
              id: authUser.id,
              email: normalizedEmail,
              name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || normalizedEmail.split('@')[0].toUpperCase(),
              phone: authUser.user_metadata?.phone || '+966 50 123 4567',
              preferred_corridor_id: 'sa-pk',
              language: 'en',
              onboarding_completed: false,
              created_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();
          profile = newProfile;
        }

        if (profile) {
          const session = {
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              preferredCorridorId: profile.preferred_corridor_id,
              language: profile.language || 'en',
              onboarding_completed: profile.onboarding_completed || false,
              primary_destination_country: profile.primary_destination_country,
              primary_destination_currency: profile.primary_destination_currency,
              preferred_channels: profile.preferred_channels || [],
              estimated_monthly_send_amount: profile.estimated_monthly_send_amount ? parseFloat(profile.estimated_monthly_send_amount) : undefined,
            }
          };
          saveAuthSession(session);
          return session;
        }
      } else {
        // Clear cached stale local session when there's no Supabase session active
        saveAuthSession({ user: null });
        return { user: null };
      }
    } catch (err) {
      console.warn('Failed to verify active Supabase auth session:', err);
      saveAuthSession({ user: null });
      return { user: null };
    }
  }

  // Local emulation fallback mode
  return getAuthSession();
}

export async function updateUserProfileInDb(profile: {
  id: string;
  name: string;
  phone: string;
  preferredCorridorId: string;
  language: 'en' | 'ar';
  email?: string;
  onboarding_completed?: boolean;
  primary_destination_country?: string;
  primary_destination_currency?: string;
  preferred_channels?: string[];
  estimated_monthly_send_amount?: number;
}): Promise<void> {
  const targetId = profile.id;
  const userEmail = (profile.email || getAuthSession().user?.email || '').trim().toLowerCase();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      console.log('[SariRemit Profile Sync] Syncing profile for targetId:', targetId);

      const payload = {
        name: profile.name || 'User',
        phone: profile.phone || '+966 50 123 4567',
        preferred_corridor_id: profile.preferredCorridorId || 'sa-pk',
        language: profile.language || 'en',
        onboarding_completed: profile.onboarding_completed !== undefined ? profile.onboarding_completed : false,
        primary_destination_country: profile.primary_destination_country || null,
        primary_destination_currency: profile.primary_destination_currency || null,
        preferred_channels: profile.preferred_channels || [],
        estimated_monthly_send_amount: profile.estimated_monthly_send_amount !== undefined && !isNaN(Number(profile.estimated_monthly_send_amount)) ? Number(profile.estimated_monthly_send_amount) : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('user_profiles')
        .update(payload)
        .eq('id', targetId);

      if (error) {
        console.error('Failed to update Supabase user_profiles table:', error);
        throw error;
      }

      // Update auth user metadata
      await supabaseClient.auth.updateUser({
        data: {
          name: profile.name,
          phone: profile.phone,
          preferredCorridorId: profile.preferredCorridorId,
        }
      });
    } catch (err) {
      console.warn('Failed to update Supabase user profile:', err);
      throw err;
    }
  } else {
    // Local emulation fallback mode
    const allUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
    const updatedUsers = allUsers.map(u => u.id === targetId || u.email.toLowerCase() === userEmail
      ? {
          ...u,
          id: targetId,
          name: profile.name,
          phone: profile.phone,
          preferred_corridor_id: profile.preferredCorridorId,
          language: profile.language,
          onboarding_completed: profile.onboarding_completed !== undefined ? profile.onboarding_completed : false,
          primary_destination_country: profile.primary_destination_country,
          primary_destination_currency: profile.primary_destination_currency,
          preferred_channels: profile.preferred_channels || [],
          estimated_monthly_send_amount: profile.estimated_monthly_send_amount,
          updated_at: new Date().toISOString()
        }
      : u
    );
    saveLocalStorageItem('sr_supabase_registered_users', updatedUsers);
  }

  // Always update current session in state / localStorage cache to remain snappy
  const currentSession = getAuthSession();
  if (currentSession.user) {
    currentSession.user = {
      ...currentSession.user,
      id: targetId,
      name: profile.name,
      phone: profile.phone,
      preferredCorridorId: profile.preferredCorridorId,
      language: profile.language,
      onboarding_completed: profile.onboarding_completed !== undefined ? profile.onboarding_completed : false,
      primary_destination_country: profile.primary_destination_country,
      primary_destination_currency: profile.primary_destination_currency,
      preferred_channels: profile.preferred_channels || [],
      estimated_monthly_send_amount: profile.estimated_monthly_send_amount,
    };
    saveAuthSession(currentSession);
  }
}

export async function fetchAllUserProfiles(): Promise<any[]> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
      console.warn('Supabase fetch all profiles error, using emulated storage:', error);
    } catch (err) {
      console.warn('Supabase fetch all profiles error:', err);
    }
  }
  return getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
}

export function signOutSession(): void {
  saveAuthSession({ user: null });
  if (isSupabaseConfigured && supabaseClient) {
    supabaseClient.auth.signOut().catch(() => {});
  }
}

// --- USER SAVINGS AND TRANSFERS MANAGEMENT ---
export interface UserTransferSavings {
  id?: string;
  user_id: string;
  corridor_id: string;
  send_amount: number;
  exchange_rate: number;
  transfer_fee: number;
  computed_savings: number;
  recipient_amount: number;
  transfer_status: string;
  recorded_at?: string;
}

const initialTransferSavings: UserTransferSavings[] = [
  {
    id: 'trans-init-1',
    user_id: 'user-init-2', // Hassan Gaturu
    corridor_id: 'sa-ke',
    send_amount: 1000,
    exchange_rate: 37.54,
    transfer_fee: 10,
    computed_savings: 45.2,
    recipient_amount: 37540,
    transfer_status: 'completed',
    recorded_at: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export async function fetchUserTransfers(userId: string): Promise<UserTransferSavings[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('user_transfer_savings')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });
      if (!error && data) return data;
      console.warn('Supabase fetch transfers failed, using local storage emulation:', error);
    } catch (err) {
      console.warn('Supabase fetch transfers error:', err);
    }
  }
  const allTransfers = getLocalStorageItem<UserTransferSavings[]>('sr_user_transfer_savings', initialTransferSavings);
  return allTransfers.filter(t => t.user_id === userId);
}

export async function saveUserTransfer(transfer: UserTransferSavings): Promise<void> {
  const newTransfer = {
    ...transfer,
    id: transfer.id || `trans-${Date.now()}`,
    recorded_at: transfer.recorded_at || new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('user_transfer_savings')
        .insert(newTransfer);
      if (error) console.error('Failed to insert transfer into Supabase:', error);
    } catch (err) {
      console.warn('Supabase insert transfer error:', err);
    }
  }

  const allTransfers = getLocalStorageItem<UserTransferSavings[]>('sr_user_transfer_savings', initialTransferSavings);
  allTransfers.push(newTransfer);
  saveLocalStorageItem('sr_user_transfer_savings', allTransfers);
}

// =========================================================================
// SARIREMIT MONITORING & CONTROL CENTRE (SRCMC) REALTIME ENGINE
// =========================================================================

export interface SRCMCAdminAccess {
  id: string;
  email: string;
  role: 'main_admin' | 'rate_monitor' | 'override_manager' | 'community_verifier' | 'channel_manager' | 'corridor_manager' | 'viewer';
  permissions: string[];
  pin_code: string;
  pin_generated_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorridorSetting {
  id: string;
  corridor_code: string;
  destination_country: string;
  destination_currency: string;
  status: 'active' | 'inactive' | 'coming_soon' | 'paused';
  display_as_coming_soon: boolean;
  notes?: string;
  activated_at?: string;
  disabled_at?: string;
  updated_at: string;
}

export interface ChannelCorridorCoverage {
  id: string;
  channel_id: string;
  corridor_id: string;
  status: 'active' | 'inactive' | 'coming_soon' | 'paused';
  supported_transfer_methods: string[];
  custom_transfer_fee?: number | null;
  custom_vat_rate?: number | null;
  exchange_rate?: number | null;
  transfer_fee?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  other_costs?: number | null;
  notes?: string;
  updated_at?: string;
}

export interface SRCMCAuditLog {
  id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
}

const ADMIN_ACCESS_KEY = 'sr_srcmc_admin_access';
const CORRIDOR_SETTINGS_KEY = 'sr_corridor_settings';
const CHANNELS_KEY = 'sr_remittance_channels';
const CHANNEL_COVERAGE_KEY = 'sr_channel_coverage';
const AUDIT_LOGS_KEY = 'sr_srcmc_audit_logs';

const initialAdmins: SRCMCAdminAccess[] = [
  {
    id: 'admin-1',
    email: 'gaturuhassan@gmail.com',
    role: 'main_admin',
    permissions: [
      'view_dashboard', 'monitor_rates', 'manage_overrides',
      'approve_community_rates', 'manage_corridors', 'manage_channels',
      'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'
    ],
    pin_code: '123456',
    pin_generated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'admin-2',
    email: 'hassan.gaturu20@gmail.com',
    role: 'main_admin',
    permissions: [
      'view_dashboard', 'monitor_rates', 'manage_overrides',
      'approve_community_rates', 'manage_corridors', 'manage_channels',
      'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'
    ],
    pin_code: '123456',
    pin_generated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'admin-3',
    email: 'hassan.dev26@gmail.com',
    role: 'main_admin',
    permissions: [
      'view_dashboard', 'monitor_rates', 'manage_overrides',
      'approve_community_rates', 'manage_corridors', 'manage_channels',
      'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'
    ],
    pin_code: '123456',
    pin_generated_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const initialCorridorSettings: CorridorSetting[] = [
  { id: 'cs-ke', corridor_code: 'sa-ke', destination_country: 'Kenya', destination_currency: 'KES', status: 'active', display_as_coming_soon: false, notes: 'Primary active launch corridor', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cs-ug', corridor_code: 'sa-ug', destination_country: 'Uganda', destination_currency: 'UGX', status: 'active', display_as_coming_soon: false, notes: 'Primary active launch corridor', activated_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cs-in', corridor_code: 'sa-in', destination_country: 'India', destination_currency: 'INR', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
  { id: 'cs-pk', corridor_code: 'sa-pk', destination_country: 'Pakistan', destination_currency: 'PKR', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
  { id: 'cs-ph', corridor_code: 'sa-ph', destination_country: 'Philippines', destination_currency: 'PHP', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
  { id: 'cs-bd', corridor_code: 'sa-bd', destination_country: 'Bangladesh', destination_currency: 'BDT', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
  { id: 'cs-eg', corridor_code: 'sa-eg', destination_country: 'Egypt', destination_currency: 'EGP', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
  { id: 'cs-et', corridor_code: 'sa-et', destination_country: 'Ethiopia', destination_currency: 'ETB', status: 'inactive', display_as_coming_soon: false, notes: 'Inactive corridor', updated_at: new Date().toISOString() },
];

const initialChannels: any[] = [
  { id: 'stc-pay', providerName: 'STC Pay / STC Bank', providerCode: 'stc-pay', displayName: 'STC Pay / STC Bank', category: 'wallet', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Mobile Wallet', 'Bank Transfer'], defaultTransferFee: 10, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'STC digital payment division.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'urpay', providerName: 'Urpay', providerCode: 'urpay', displayName: 'Urpay', category: 'wallet', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Mobile Wallet', 'Bank Transfer'], defaultTransferFee: 12, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'Al Rajhi digital banking.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mobily-pay', providerName: 'Mobily Pay', providerCode: 'mobily-pay', displayName: 'Mobily Pay', category: 'wallet', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Mobile Wallet', 'Bank Transfer'], defaultTransferFee: 8, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'Mobily financial ecosystem.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'enjaz', providerName: 'Enjaz (Bank Albilad)', providerCode: 'enjaz', displayName: 'Enjaz (Bank Albilad)', category: 'exchange_house', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Cash Pickup', 'Bank Transfer'], defaultTransferFee: 15, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'Physical branch and kiosk payments.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'quickpay', providerName: 'QuickPay (SNB)', providerCode: 'quickpay', displayName: 'QuickPay (SNB)', category: 'bank', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Bank Transfer'], defaultTransferFee: 15, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'SNB remittance services.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'western-union', providerName: 'Western Union', providerCode: 'western-union', displayName: 'Western Union', category: 'money_transfer_operator', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Cash Pickup', 'Bank Transfer'], defaultTransferFee: 15, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'Traditional cash out.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'al-rajhi-tahweel', providerName: 'Al Rajhi Tahweel', providerCode: 'al-rajhi-tahweel', displayName: 'Al Rajhi Tahweel', category: 'bank', status: 'active', supportedCorridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], supportedTransferMethods: ['Bank Transfer', 'Cash Pickup'], defaultTransferFee: 15, defaultVatRate: 0.15, feeCurrency: 'SAR', notes: 'Tahweel branches.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const initialCoverages: ChannelCorridorCoverage[] = initialChannels.flatMap(ch => 
  ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'].map(corr => ({
    id: `cov-${ch.id}-${corr}`,
    channel_id: ch.id,
    corridor_id: corr,
    status: 'active',
    supported_transfer_methods: ch.supportedTransferMethods,
    custom_transfer_fee: ch.defaultTransferFee,
    custom_vat_rate: ch.defaultVatRate,
    notes: ''
  }))
);

// 1. Admin Access Control Methods
export async function fetchAdminAccess(): Promise<SRCMCAdminAccess[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('srcmc_admin_access').select('*');
      if (!error && data) return data as SRCMCAdminAccess[];
    } catch (err) {
      console.warn('Supabase admin access error, falling back:', err);
    }
  }
  return getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
}

export async function saveAdminAccess(admin: SRCMCAdminAccess): Promise<SRCMCAdminAccess> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('srcmc_admin_access').upsert(admin).select();
      if (!error && data && data[0]) return data[0] as SRCMCAdminAccess;
    } catch (err) {
      console.warn('Supabase save admin error, falling back:', err);
    }
  }
  const current = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
  const filtered = current.filter(a => a.email.toLowerCase() !== admin.email.toLowerCase());
  const updated = [admin, ...filtered];
  saveLocalStorageItem(ADMIN_ACCESS_KEY, updated);
  return admin;
}

export async function generatePinCode(email: string): Promise<string> {
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const current = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
  const updated = current.map(a => {
    if (a.email.toLowerCase() === email.toLowerCase()) {
      return {
        ...a,
        pin_code: pin,
        pin_generated_at: new Date().toISOString()
      };
    }
    return a;
  });
  saveLocalStorageItem(ADMIN_ACCESS_KEY, updated);

  if (supabaseClient) {
    try {
      await supabaseClient.from('srcmc_admin_access').update({
        pin_code: pin,
        pin_generated_at: new Date().toISOString()
      }).eq('email', email);
    } catch (err) {
      console.warn('Supabase update pin failed, continuing with fallback:', err);
    }
  }
  return pin;
}

export async function revokeAdminAccess(email: string): Promise<void> {
  const current = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
  const updated = current.filter(a => a.email.toLowerCase() !== email.toLowerCase());
  saveLocalStorageItem(ADMIN_ACCESS_KEY, updated);

  if (supabaseClient) {
    try {
      await supabaseClient.from('srcmc_admin_access').delete().eq('email', email);
    } catch (err) {
      console.warn('Supabase delete admin access failed, continuing with fallback:', err);
    }
  }
}

// 2. Corridor settings methods
export async function fetchCorridorSettings(): Promise<CorridorSetting[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('corridor_settings').select('*');
      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          corridor_code: r.corridor_code,
          destination_country: r.destination_country,
          destination_currency: r.destination_currency,
          status: r.status,
          display_as_coming_soon: r.display_as_coming_soon,
          notes: r.notes,
          activated_at: r.activated_at,
          disabled_at: r.disabled_at,
          updated_at: r.updated_at
        })) as CorridorSetting[];
        saveLocalStorageItem<CorridorSetting[]>(CORRIDOR_SETTINGS_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetch corridor settings error, falling back:', err);
    }
  }
  return getLocalStorageItem<CorridorSetting[]>(CORRIDOR_SETTINGS_KEY, initialCorridorSettings);
}

export function getCorridorSettingsSync(): CorridorSetting[] {
  return getLocalStorageItem<CorridorSetting[]>(CORRIDOR_SETTINGS_KEY, initialCorridorSettings);
}

export async function saveCorridorSetting(setting: CorridorSetting): Promise<CorridorSetting> {
  if (setting.status === 'active') {
    import('./marketRateService').then(({ fetchAndStoreMarketReferenceRate }) => {
      fetchAndStoreMarketReferenceRate(setting.corridor_code).catch(err => {
        console.error(`[SariRemit MC] Automatic Market Reference Rate activation failed for corridor setting ${setting.corridor_code}:`, err);
      });
    }).catch(err => console.error('[SariRemit MC] Failed to dynamically import marketRateService in saveCorridorSetting:', err));
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('corridor_settings').upsert(setting).select();
      if (!error && data && data[0]) {
        const saved: CorridorSetting = {
          id: data[0].id,
          corridor_code: data[0].corridor_code,
          destination_country: data[0].destination_country,
          destination_currency: data[0].destination_currency,
          status: data[0].status,
          display_as_coming_soon: data[0].display_as_coming_soon,
          notes: data[0].notes,
          activated_at: data[0].activated_at,
          disabled_at: data[0].disabled_at,
          updated_at: data[0].updated_at
        };
        const current = getLocalStorageItem<CorridorSetting[]>(CORRIDOR_SETTINGS_KEY, initialCorridorSettings);
        const filtered = current.filter(c => c.corridor_code !== saved.corridor_code);
        saveLocalStorageItem(CORRIDOR_SETTINGS_KEY, [saved, ...filtered]);
        return saved;
      }
    } catch (err) {
      console.warn('Supabase save corridor error, falling back:', err);
    }
  }
  const current = getLocalStorageItem<CorridorSetting[]>(CORRIDOR_SETTINGS_KEY, initialCorridorSettings);
  const filtered = current.filter(c => c.corridor_code !== setting.corridor_code);
  const updated = [setting, ...filtered];
  saveLocalStorageItem(CORRIDOR_SETTINGS_KEY, updated);
  return setting;
}

export function getActiveCorridorsSync(): Corridor[] {
  const settings = getCorridorSettingsSync();
  const activeCodes = settings.filter(s => s.status === 'active').map(s => s.corridor_code);
  return CORRIDORS.filter(c => activeCodes.includes(c.id));
}

// 3. Channels & Dynamic Coverage Methods
export async function fetchRemittanceChannels(): Promise<any[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('remittance_channels').select('*');
      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          providerName: r.provider_name,
          providerCode: r.provider_code,
          displayName: r.display_name,
          category: r.category,
          status: r.status,
          supportedCorridors: r.supported_corridors || [],
          supportedTransferMethods: r.supported_transfer_methods || [],
          defaultTransferFee: r.default_transfer_fee !== null ? parseFloat(r.default_transfer_fee) : null,
          defaultVatRate: r.default_vat_rate !== null ? parseFloat(r.default_vat_rate) : null,
          feeCurrency: r.fee_currency || 'SAR',
          logoUrl: r.logo_url,
          websiteUrl: r.website_url,
          notes: r.notes,
          createdBy: r.created_by,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        saveLocalStorageItem<any[]>(CHANNELS_KEY, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetch channels failed, falling back:', err);
    }
  }
  return getLocalStorageItem<any[]>(CHANNELS_KEY, initialChannels);
}

export function getRemittanceChannelsSync(): any[] {
  return getLocalStorageItem<any[]>(CHANNELS_KEY, initialChannels);
}

export async function saveRemittanceChannel(channel: any): Promise<any> {
  const current = getLocalStorageItem<any[]>(CHANNELS_KEY, initialChannels);
  
  // Enforce lowercase stable provider code uniqueness
  const pCode = channel.providerCode.toLowerCase().trim();
  const existingWithCode = current.find(c => c.id !== channel.id && c.providerCode.toLowerCase() === pCode);
  if (existingWithCode) {
    throw new Error(`Provider code '${pCode}' is already registered for channel '${existingWithCode.displayName}'. Unique lowercase stable codes are required.`);
  }

  const updatedChannel = {
    ...channel,
    providerCode: pCode
  };

  if (supabaseClient) {
    try {
      const dbRow = {
        id: updatedChannel.id,
        provider_name: updatedChannel.providerName,
        provider_code: updatedChannel.providerCode,
        display_name: updatedChannel.displayName,
        category: updatedChannel.category,
        status: updatedChannel.status,
        default_transfer_fee: updatedChannel.defaultTransferFee,
        default_vat_rate: updatedChannel.defaultVatRate,
        fee_currency: updatedChannel.feeCurrency,
        logo_url: updatedChannel.logoUrl,
        website_url: updatedChannel.websiteUrl,
        notes: updatedChannel.notes,
        created_by: updatedChannel.createdBy,
        created_at: updatedChannel.createdAt,
        updated_at: new Date().toISOString()
      };
      await supabaseClient.from('remittance_channels').upsert(dbRow);
    } catch (err) {
      console.warn('Supabase save channel failed, falling back:', err);
    }
  }

  const filtered = current.filter(c => c.id !== updatedChannel.id);
  const updated = [updatedChannel, ...filtered];
  saveLocalStorageItem(CHANNELS_KEY, updated);

  // Generate default coverage rows if not already present
  const currentCoverages = getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
  const newCoverages = [...currentCoverages];
  let coverageChanged = false;
  
  updatedChannel.supportedCorridors.forEach((corrId: string) => {
    const exists = currentCoverages.some(cov => cov.channel_id === updatedChannel.id && cov.corridor_id === corrId);
    if (!exists) {
      newCoverages.push({
        id: `cov-${updatedChannel.id}-${corrId}`,
        channel_id: updatedChannel.id,
        corridor_id: corrId,
        status: 'active',
        supported_transfer_methods: updatedChannel.supportedTransferMethods || ['Bank Transfer'],
        custom_transfer_fee: updatedChannel.defaultTransferFee,
        custom_vat_rate: updatedChannel.defaultVatRate,
        notes: 'Auto-provisioned coverage row'
      });
      coverageChanged = true;
    }
  });

  if (coverageChanged) {
    saveLocalStorageItem(CHANNEL_COVERAGE_KEY, newCoverages);
    
    // Trigger activation of market rates for the newly added corridors
    import('./marketRateService').then(({ fetchAndStoreMarketReferenceRate }) => {
      updatedChannel.supportedCorridors.forEach((corrId: string) => {
        fetchAndStoreMarketReferenceRate(corrId).catch(err => {
          console.error(`[SariRemit MC] Automatic Market Reference Rate activation background failed during channel save for corridor ${corrId}:`, err);
        });
      });
    }).catch(err => console.error('[SariRemit MC] Failed to dynamically import marketRateService in saveRemittanceChannel:', err));

    if (supabaseClient) {
      try {
        const payload = newCoverages.filter(cov => cov.id.startsWith(`cov-${updatedChannel.id}-`)).map(c => ({
          channel_id: c.channel_id,
          corridor_id: c.corridor_id,
          status: c.status,
          supported_transfer_methods: c.supported_transfer_methods,
          custom_transfer_fee: c.custom_transfer_fee,
          custom_vat_rate: c.custom_vat_rate,
          notes: c.notes
        }));
        await supabaseClient.from('channel_corridor_coverage').upsert(payload);
      } catch (e) {
        console.warn('Supabase save coverage rows failed:', e);
      }
    }
  }

  return updatedChannel;
}

export async function deleteRemittanceChannel(id: string): Promise<void> {
  if (supabaseClient) {
    try {
      await supabaseClient.from('remittance_channels').delete().eq('id', id);
      await supabaseClient.from('channel_corridor_coverage').delete().eq('channel_id', id);
    } catch (err) {
      console.warn('Supabase delete channel failed, falling back:', err);
    }
  }
  const current = getLocalStorageItem<any[]>(CHANNELS_KEY, initialChannels);
  const updated = current.filter(c => c.id !== id);
  saveLocalStorageItem(CHANNELS_KEY, updated);

  const currentCoverages = getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
  const updatedCoverages = currentCoverages.filter(cov => cov.channel_id !== id);
  saveLocalStorageItem(CHANNEL_COVERAGE_KEY, updatedCoverages);
}

export async function fetchChannelCoverage(channelId?: string): Promise<ChannelCorridorCoverage[]> {
  if (supabaseClient) {
    try {
      let query = supabaseClient.from('channel_corridor_coverage').select('*');
      if (channelId) query = query.eq('channel_id', channelId);
      const { data, error } = await query;
      if (!error && data) {
        const fetched: ChannelCorridorCoverage[] = (data as any[]).map((r: any) => ({
          id: r.id || `cov-${r.channel_id}-${r.corridor_id}`,
          channel_id: r.channel_id,
          corridor_id: r.corridor_id,
          status: r.status || 'active',
          supported_transfer_methods: r.supported_transfer_methods || [],
          custom_transfer_fee: r.transfer_fee ?? r.custom_transfer_fee ?? null,
          custom_vat_rate: r.vat_rate ?? r.custom_vat_rate ?? null,
          exchange_rate: r.exchange_rate ?? null,
          transfer_fee: r.transfer_fee ?? r.custom_transfer_fee ?? null,
          vat_rate: r.vat_rate ?? r.custom_vat_rate ?? null,
          vat_amount: r.vat_amount ?? null,
          other_costs: r.other_costs ?? null,
          notes: r.notes ?? '',
          updated_at: r.updated_at
        }));

        const current = getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
        let updated: ChannelCorridorCoverage[];
        if (fetched.length === 0) {
          updated = current;
        } else {
          const fetchedMap = new Map(fetched.map(f => [`${f.channel_id}-${f.corridor_id}`, f]));
          updated = current.map(item => {
            const match = fetchedMap.get(`${item.channel_id}-${item.corridor_id}`);
            return match ? match : item;
          });
          const existingKeys = new Set(current.map(c => `${c.channel_id}-${c.corridor_id}`));
          for (const f of fetched) {
            const key = `${f.channel_id}-${f.corridor_id}`;
            if (!existingKeys.has(key)) {
              updated.push(f);
            }
          }
        }
        saveLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, updated);
        return fetched;
      }
    } catch (err) {
      console.warn('Supabase fetch coverage failed, falling back:', err);
    }
  }
  const all = getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
  return channelId ? all.filter(c => c.channel_id === channelId) : all;
}

export function getChannelCoveragesSync(): ChannelCorridorCoverage[] {
  return getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
}

export function getChannelCoverageSync(channelId: string, corridorId: string): ChannelCorridorCoverage | null {
  const all = getChannelCoveragesSync();
  return all.find(c => c.channel_id === channelId && c.corridor_id === corridorId) || null;
}

export async function saveChannelCoverage(coverage: ChannelCorridorCoverage): Promise<ChannelCorridorCoverage> {
  // Trigger automatic Market Reference Rate activation immediately
  import('./marketRateService').then(({ fetchAndStoreMarketReferenceRate }) => {
    fetchAndStoreMarketReferenceRate(coverage.corridor_id).catch(err => {
      console.error(`[SariRemit MC] Automatic Market Reference Rate activation background failed for corridor ${coverage.corridor_id}:`, err);
    });
  }).catch(err => console.error('[SariRemit MC] Failed to dynamically import marketRateService in saveChannelCoverage:', err));

  const updatedAt = new Date().toISOString();
  const updatedCov = {
    ...coverage,
    updated_at: updatedAt
  };
  if (supabaseClient) {
    try {
      await supabaseClient.from('channel_corridor_coverage').upsert({
        id: updatedCov.id,
        channel_id: updatedCov.channel_id,
        corridor_id: updatedCov.corridor_id,
        status: updatedCov.status,
        supported_transfer_methods: updatedCov.supported_transfer_methods,
        custom_transfer_fee: updatedCov.transfer_fee ?? updatedCov.custom_transfer_fee,
        custom_vat_rate: updatedCov.vat_rate ?? updatedCov.custom_vat_rate,
        exchange_rate: updatedCov.exchange_rate,
        transfer_fee: updatedCov.transfer_fee,
        vat_rate: updatedCov.vat_rate,
        vat_amount: updatedCov.vat_amount,
        other_costs: updatedCov.other_costs,
        notes: updatedCov.notes,
        updated_at: updatedAt
      }, {
        onConflict: 'channel_id,corridor_id'
      });
    } catch (e) {
      console.warn('Supabase save single coverage failed, falling back:', e);
    }
  }
  const current = getLocalStorageItem<ChannelCorridorCoverage[]>(CHANNEL_COVERAGE_KEY, initialCoverages);
  const filtered = current.filter(c => !(c.channel_id === updatedCov.channel_id && c.corridor_id === updatedCov.corridor_id));
  const updated = [updatedCov, ...filtered];
  saveLocalStorageItem(CHANNEL_COVERAGE_KEY, updated);
  return updatedCov;
}

export function getActiveChannelsForCorridor(corridorId: string): any[] {
  const channels = getRemittanceChannelsSync();
  const coverages = getChannelCoveragesSync();
  const corridorSettings = getCorridorSettingsSync();

  const corridorSetting = corridorSettings.find(s => s.corridor_code === corridorId);
  const isCorridorActive = corridorSetting ? corridorSetting.status === 'active' : (corridorId === 'sa-ke' || corridorId === 'sa-ug');

  if (!isCorridorActive) {
    return [];
  }

  // Enforce that a valid Market Reference Rate has been retrieved and stored
  const marketRates = getLocalStorageItem<DbMarketReferenceRate[]>(MARKET_KEY, initialMarketRates);
  const marketRef = marketRates.find(m => m.corridor_id === corridorId);
  if (!marketRef || typeof marketRef.rate !== 'number' || marketRef.rate <= 0) {
    return [];
  }

  return channels.filter(ch => {
    // 1. Channel status must be active
    if (ch.status !== 'active') return false;

    // 2. Find coverage for this channel and corridor
    const coverage = coverages.find(cov => cov.channel_id === ch.id && cov.corridor_id === corridorId);

    if (coverage) {
      // 3. If coverage row exists, its status must be explicitly active
      if (coverage.status !== 'active') return false;
    } else {
      // 4. If no coverage row exists yet, check if it falls under statically supported corridors
      if (!ch.supportedCorridors?.includes(corridorId)) return false;
    }

    return true;
  });
}

// 4. Audit Log Methods
export async function logAuditAction(actorEmail: string, action: string, targetType: string, targetId: string, metadata: any): Promise<void> {
  const newLog: SRCMCAuditLog = {
    id: `log-${Date.now()}`,
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
    created_at: new Date().toISOString()
  };

  const current = getLocalStorageItem<SRCMCAuditLog[]>(AUDIT_LOGS_KEY, []);
  saveLocalStorageItem(AUDIT_LOGS_KEY, [newLog, ...current]);

  if (supabaseClient) {
    try {
      await supabaseClient.from('srcmc_audit_logs').insert([{
        actor_email: actorEmail,
        action,
        target_type: targetType,
        target_id: targetId,
        metadata
      }]);
    } catch (err) {
      console.warn('Supabase save audit log failed:', err);
    }
  }
}

export async function fetchAuditLogs(): Promise<SRCMCAuditLog[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('srcmc_audit_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as SRCMCAuditLog[];
    } catch (err) {
      console.warn('Supabase fetch audit logs failed, falling back:', err);
    }
  }
  return getLocalStorageItem<SRCMCAuditLog[]>(AUDIT_LOGS_KEY, []);
}

export function checkIsAdminSync(email: string | undefined): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase().trim();
  if (
    lowerEmail === 'gaturuhassan@gmail.com' ||
    lowerEmail === 'hassan.gaturu20@gmail.com' ||
    lowerEmail === 'hassan.dev26@gmail.com'
  ) {
    return true;
  }
  const admins = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
  const currentAdmin = admins.find(a => a.email.toLowerCase().trim() === lowerEmail && a.is_active);
  return !!currentAdmin;
}

export async function syncSupabaseToLocal(): Promise<void> {
  if (!supabaseClient) return;
  try {
    const [channels, coverages, corridors, overrides, submissions, marketRates] = await Promise.all([
      fetchRemittanceChannels(),
      fetchChannelCoverage(),
      fetchCorridorSettings(),
      fetchOverrides(),
      fetchCommunitySubmissions(),
      fetchMarketReferenceRates(),
    ]);

    if (channels && channels.length > 0) {
      saveLocalStorageItem(CHANNELS_KEY, channels);
    }
    if (coverages && coverages.length > 0) {
      saveLocalStorageItem(CHANNEL_COVERAGE_KEY, coverages);
    }
    if (corridors && corridors.length > 0) {
      saveLocalStorageItem(CORRIDOR_SETTINGS_KEY, corridors);
    }
    if (overrides && overrides.length > 0) {
      saveLocalStorageItem(OVERRIDES_KEY, overrides);
    }
    if (submissions && submissions.length > 0) {
      saveLocalStorageItem(COMMUNITY_KEY, submissions);
    }
    if (marketRates && marketRates.length > 0) {
      saveLocalStorageItem(MARKET_KEY, marketRates);
    }
  } catch (err) {
    console.warn('Failed to sync database to localStorage:', err);
  }
}


