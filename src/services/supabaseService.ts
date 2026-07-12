import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Corridor, Provider, UserProfile, ResolvedRate, RecommendationResult, SISResult, SicSnapshot, TrueCostResult, RecordedTransfer, UserExperienceFeedback, AchievementDefinition, UserAchievement, UserProgress } from '../types';
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
  screenshot_url?: string;
  screenshot_storage_path?: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'submitted' | 'security_review' | 'pending_verification' | 'needs_more_evidence' | 'blocked' | 'expired' | 'withdrawn' | string;
  vat_amount?: number;
  other_costs?: number;

  // CRVS & SAF Fields
  destination_country?: string;
  destination_currency?: string;
  date_observed?: string;
  time_observed?: string;
  transfer_method?: string; // 'wallet' | 'cash' | 'bank' etc.
  user_note?: string;
  amount_sent?: number;
  amount_received?: number;

  screenshot_path?: string;
  screenshot_original_name?: string;
  screenshot_mime_type?: string;
  screenshot_size_bytes?: number;
  screenshot_hash?: string;
  screenshot_uploaded_at?: string;
  evidence_status?: string; // 'pending' | 'verified' | 'invalid' | 'needs_more_evidence' etc.

  fraud_risk_score?: number;
  fraud_risk_level?: string; // 'low' | 'moderate' | 'high' | 'critical'
  fraud_flags?: string[];
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  reviewer_notes?: string;
  valid_until?: string;
  updated_at?: string;
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

export let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    // Log the Supabase project hostname in development mode only
    if ((import.meta as any).env?.DEV) {
      try {
        const hostname = new URL(supabaseUrl).hostname;
        console.log('[SariRemit Dev] Connected to Supabase Project Hostname:', hostname);
      } catch (e) {
        console.log('[SariRemit Dev] Connected to Supabase URL:', supabaseUrl);
      }
    }
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

// CRVS Configuration management
export interface CrvsConfig {
  anomaly_normal_threshold: number;
  anomaly_review_threshold: number;
  anomaly_critical_threshold: number;
  max_submissions_24h: number;
  max_submissions_same_channel_corridor_24h: number;
  expiry_hours: number;
}

const CRVS_CONFIG_KEY = 'sr_crvs_config';
const DEFAULT_CRVS_CONFIG: CrvsConfig = {
  anomaly_normal_threshold: 2,
  anomaly_review_threshold: 5,
  anomaly_critical_threshold: 10,
  max_submissions_24h: 5,
  max_submissions_same_channel_corridor_24h: 2,
  expiry_hours: 24,
};

export function fetchCrvsConfig(): CrvsConfig {
  const data = localStorage.getItem(CRVS_CONFIG_KEY);
  if (!data) return DEFAULT_CRVS_CONFIG;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CRVS_CONFIG;
  }
}

export function saveCrvsConfig(config: CrvsConfig): void {
  localStorage.setItem(CRVS_CONFIG_KEY, JSON.stringify(config));
}

// Fraud & Integrity Events management
export interface FraudIntegrityEvent {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  submission_id?: string;
  channel_id?: string;
  corridor_id?: string;
  risk_score: number;
  risk_flags: string[];
  metadata: any;
  status: 'open' | 'resolved';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
  created_at: string;
}

const FRAUD_EVENTS_KEY = 'sr_fraud_integrity_events';

export async function fetchFraudIntegrityEvents(): Promise<FraudIntegrityEvent[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('fraud_integrity_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data as FraudIntegrityEvent[];
      }
    } catch (err) {
      console.warn('Supabase fetch fraud events error, using emulated:', err);
    }
  }
  return getLocalStorageItem<FraudIntegrityEvent[]>(FRAUD_EVENTS_KEY, []);
}

export async function logFraudIntegrityEvent(event: Omit<FraudIntegrityEvent, 'id' | 'created_at' | 'status'>): Promise<FraudIntegrityEvent> {
  const newEvent: FraudIntegrityEvent = {
    ...event,
    id: `event-${Date.now()}`,
    status: 'open',
    created_at: new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('fraud_integrity_events')
        .insert([{
          event_type: newEvent.event_type,
          severity: newEvent.severity,
          user_id: newEvent.user_id,
          submission_id: newEvent.submission_id,
          channel_id: newEvent.channel_id,
          corridor_id: newEvent.corridor_id,
          risk_score: newEvent.risk_score,
          risk_flags: newEvent.risk_flags,
          metadata: newEvent.metadata,
          status: newEvent.status,
        }]);
    } catch (err) {
      console.warn('Supabase insert fraud event error, using emulated:', err);
    }
  }

  const current = getLocalStorageItem<FraudIntegrityEvent[]>(FRAUD_EVENTS_KEY, []);
  saveLocalStorageItem(FRAUD_EVENTS_KEY, [newEvent, ...current]);
  return newEvent;
}

// SariRemit Anti-Fraud Framework (SAF) Risk Score Calculator
export async function runAntiFraudChecks(
  submission: Partial<DbCommunitySubmission>
): Promise<{
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  flags: string[];
}> {
  const config = fetchCrvsConfig();
  const flags: string[] = [];
  
  let rateAnomalyRisk = 0;
  let duplicateEvidenceRisk = 0;
  let submissionFrequencyRisk = 0;
  let accountRisk = 0;
  let evidenceQualityRisk = 0;
  let consistencyRisk = 0;

  // 1. Rate Anomaly Check (30% weight)
  const marketRates = await fetchMarketReferenceRates();
  const marketRef = marketRates.find(m => m.corridor_id === submission.corridor_id);
  if (marketRef && submission.exchange_rate) {
    const deviationPercent = (Math.abs(submission.exchange_rate - marketRef.rate) / marketRef.rate) * 100;
    if (deviationPercent <= config.anomaly_normal_threshold) {
      rateAnomalyRisk = 10;
    } else if (deviationPercent <= config.anomaly_review_threshold) {
      rateAnomalyRisk = 45;
      flags.push(`RATE_DEVIATION_ALERT: Rate is ${deviationPercent.toFixed(1)}% offset from market reference`);
    } else if (deviationPercent <= config.anomaly_critical_threshold) {
      rateAnomalyRisk = 75;
      flags.push(`HIGH_RATE_DEVIATION: Rate is ${deviationPercent.toFixed(1)}% offset from market reference`);
    } else {
      rateAnomalyRisk = 100;
      flags.push(`CRITICAL_RATE_ANOMALY: Rate is ${deviationPercent.toFixed(1)}% offset from market reference`);
    }
  } else {
    rateAnomalyRisk = 20; // Default baseline risk if no market reference
  }

  // 2. Duplicate Evidence Check (20% weight)
  const fileHash = submission.screenshot_hash;
  const submissions = await fetchCommunitySubmissions();
  if (fileHash) {
    const dups = submissions.filter(s => s.screenshot_hash === fileHash && s.id !== submission.id);
    if (dups.length > 0) {
      const differentUser = dups.some(d => d.submitted_by_email?.toLowerCase() !== submission.submitted_by_email?.toLowerCase());
      if (differentUser) {
        duplicateEvidenceRisk = 100;
        flags.push('DUPLICATE_SCREENSHOT_DIFFERENT_USER');
      } else {
        duplicateEvidenceRisk = 60;
        flags.push('DUPLICATE_SCREENSHOT_SAME_USER');
      }
    }
  }

  // 3. Submission Frequency Check (15% weight)
  if (submission.submitted_by_email) {
    const userSubs = submissions.filter(s => {
      const ageHours = (Date.now() - new Date(s.submitted_at).getTime()) / 3600000;
      return s.submitted_by_email?.toLowerCase() === submission.submitted_by_email?.toLowerCase() && ageHours <= 24;
    });

    if (userSubs.length >= config.max_submissions_24h) {
      submissionFrequencyRisk = 100;
      flags.push('EXCESSIVE_SUBMISSIONS_24H');
    } else if (userSubs.length >= 3) {
      submissionFrequencyRisk = 50;
      flags.push('HIGH_SUBMISSION_FREQUENCY');
    }

    const corridorChannelSubs = userSubs.filter(s => s.corridor_id === submission.corridor_id && s.provider_id === submission.provider_id);
    if (corridorChannelSubs.length >= config.max_submissions_same_channel_corridor_24h) {
      submissionFrequencyRisk = Math.max(submissionFrequencyRisk, 80);
      flags.push('EXCESSIVE_SAME_ROUTE_SUBMISSIONS_24H');
    }
  }

  // 4. Account Risk Check (15% weight)
  if (submission.submitted_by_email) {
    const allProfiles = await fetchAllUserProfiles();
    const profile = allProfiles.find(u => u.email?.toLowerCase() === submission.submitted_by_email?.toLowerCase());
    
    // Check account history / rejections
    const rejectedSubs = submissions.filter(s => s.submitted_by_email?.toLowerCase() === submission.submitted_by_email?.toLowerCase() && s.status === 'rejected');
    if (rejectedSubs.length > 2) {
      accountRisk = 80;
      flags.push('ACCOUNT_HISTORY_REJECTIONS');
    }

    // Check account age (new account check)
    if (profile && profile.created_at) {
      const ageHours = (Date.now() - new Date(profile.created_at).getTime()) / 3600000;
      if (ageHours <= 24) {
        accountRisk = Math.max(accountRisk, 30);
        flags.push('NEW_ACCOUNT_MONITORING');
      }
    }
  }

  // 5. Evidence Quality / Size Check (10% weight)
  if (submission.screenshot_size_bytes) {
    if (submission.screenshot_size_bytes < 20 * 1024) {
      evidenceQualityRisk = 85;
      flags.push('TINY_SCREENSHOT_SUSPICIOUS');
    } else if (submission.screenshot_size_bytes > 8 * 1024 * 1024) {
      evidenceQualityRisk = 30;
      flags.push('LARGE_SCREENSHOT_SIZE');
    }
  }

  // 6. Consistency Check (10% weight)
  if (submission.transfer_fee !== undefined) {
    if (submission.transfer_fee === 0) {
      consistencyRisk = 30;
      flags.push('ZERO_FEE_SUBMISSION');
    } else if (submission.transfer_fee > 100) {
      consistencyRisk = 70;
      flags.push('EXCESSIVE_FEE_SUBMISSION');
    }
  }

  // Calculate weighted score
  const riskScore = Math.min(100, Math.round(
    rateAnomalyRisk * 0.30
    + duplicateEvidenceRisk * 0.20
    + submissionFrequencyRisk * 0.15
    + accountRisk * 0.15
    + evidenceQualityRisk * 0.10
    + consistencyRisk * 0.10
  ));

  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'moderate';

  return { riskScore, riskLevel, flags };
}

// Trust Confidence Engine Helper for Community Rates
export function computeCommunityTrustConfidence(
  submission: DbCommunitySubmission,
  allApprovedSubmissions: DbCommunitySubmission[],
  marketRate?: number
): number {
  let trustScore = 85; // Baseline for approved community rate

  // 1. Evidence verification state
  if (submission.evidence_status === 'verified') {
    trustScore += 5;
  } else {
    trustScore -= 10;
  }

  // 2. Rate freshness
  const ageHours = (Date.now() - new Date(submission.submitted_at).getTime()) / 3600000;
  if (ageHours <= 2) trustScore += 5;
  else if (ageHours > 12) trustScore -= 10;

  // 3. Market deviation
  if (marketRate) {
    const deviation = Math.abs(submission.exchange_rate - marketRate) / marketRate * 100;
    if (deviation <= 0.5) trustScore += 5;
    else if (deviation > 2.0) trustScore -= 15;
  }

  // 4. Agreement among other approved submissions on the same route
  const matchingRouteApproved = allApprovedSubmissions.filter(
    s => s.corridor_id === submission.corridor_id && 
         s.provider_id === submission.provider_id && 
         s.id !== submission.id
  );
  if (matchingRouteApproved.length > 0) {
    const ratesDiffs = matchingRouteApproved.map(s => Math.abs(s.exchange_rate - submission.exchange_rate) / submission.exchange_rate * 100);
    const hasCloseAgreement = ratesDiffs.some(diff => diff <= 0.2);
    if (hasCloseAgreement) {
      trustScore += 5;
    } else {
      trustScore -= 5;
    }
  }

  return Math.max(30, Math.min(100, trustScore));
}

// User submission restriction helper
export async function toggleUserRateSubmissionRestriction(userId: string, restrict: boolean): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient
        .from('user_profiles')
        .update({ rate_submissions_restricted: restrict })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase toggle restriction error:', err);
    }
  }

  const allUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
  const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, rate_submissions_restricted: restrict } : u);
  saveLocalStorageItem('sr_supabase_registered_users', updatedUsers);

  const currentSession = getAuthSession();
  if (currentSession.user && currentSession.user.id === userId) {
    currentSession.user.rate_submissions_restricted = restrict;
    saveAuthSession(currentSession);
  }
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
        screenshot_name: row.screenshot_name,
        screenshot_url: row.screenshot_url,
        screenshot_storage_path: row.screenshot_storage_path,
        status: row.status,

        destination_country: row.destination_country,
        destination_currency: row.destination_currency,
        date_observed: row.date_observed,
        time_observed: row.time_observed,
        transfer_method: row.transfer_method,
        user_note: row.user_note,
        amount_sent: row.amount_sent,
        amount_received: row.amount_received,
        screenshot_path: row.screenshot_path,
        screenshot_original_name: row.screenshot_original_name,
        screenshot_mime_type: row.screenshot_mime_type,
        screenshot_size_bytes: row.screenshot_size_bytes ? parseInt(row.screenshot_size_bytes) : undefined,
        screenshot_hash: row.screenshot_hash,
        screenshot_uploaded_at: row.screenshot_uploaded_at,
        evidence_status: row.evidence_status || 'pending',
        fraud_risk_score: row.fraud_risk_score ? parseFloat(row.fraud_risk_score) : 0,
        fraud_risk_level: row.fraud_risk_level || 'low',
        fraud_flags: Array.isArray(row.fraud_flags) ? row.fraud_flags : (typeof row.fraud_flags === 'string' ? JSON.parse(row.fraud_flags) : []),
        approved_by: row.approved_by,
        approved_at: row.approved_at,
        rejected_by: row.rejected_by,
        rejected_at: row.rejected_at,
        rejection_reason: row.rejection_reason,
        reviewer_notes: row.reviewer_notes,
        valid_until: row.valid_until,
        updated_at: row.updated_at,
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
      vat_amount: s.vat_amount !== undefined ? s.vat_amount : extra.vat_amount,
      other_costs: s.other_costs !== undefined ? s.other_costs : extra.other_costs
    };
  });
}

export async function saveCommunitySubmission(
  submission: Omit<DbCommunitySubmission, 'id' | 'submitted_at' | 'status'> & { 
    vat_amount?: number; 
    other_costs?: number;
    status?: string;
    screenshot_url?: string;
    screenshot_storage_path?: string;
  }
): Promise<DbCommunitySubmission> {
  const subId = `sub-${Date.now()}`;
  
  // Execute SAF Anti-Fraud Core Checks
  const { riskScore, riskLevel, flags } = await runAntiFraudChecks(submission);
  
  // Status Routing based on Risk
  let routedStatus: string = 'pending_verification';
  if (riskScore >= 75) {
    routedStatus = 'security_review';
  } else if (riskScore >= 50) {
    routedStatus = 'security_review';
  } else {
    routedStatus = 'pending_verification';
  }

  const newRow: DbCommunitySubmission = {
    ...submission,
    id: subId,
    submitted_at: new Date().toISOString(),
    status: submission.status || routedStatus,
    screenshot_url: submission.screenshot_url || '',
    screenshot_storage_path: submission.screenshot_storage_path || '',
    evidence_status: 'pending',
    fraud_risk_score: riskScore,
    fraud_risk_level: riskLevel,
    fraud_flags: flags,
    updated_at: new Date().toISOString()
  };

  if (supabaseClient) {
    const supabaseRow = {
      id: newRow.id,
      corridor_id: newRow.corridor_id,
      provider_id: newRow.provider_id,
      provider_name: newRow.provider_name,
      exchange_rate: newRow.exchange_rate,
      transfer_fee: newRow.transfer_fee,
      send_amount: newRow.send_amount,
      receive_amount: newRow.receive_amount,
      submitted_by_name: newRow.submitted_by_name,
      submitted_by_email: newRow.submitted_by_email,
      screenshot_name: newRow.screenshot_name,
      screenshot_url: newRow.screenshot_url,
      screenshot_storage_path: newRow.screenshot_storage_path,
      status: newRow.status,
      vat_amount: newRow.vat_amount,
      other_costs: newRow.other_costs,

      destination_country: newRow.destination_country,
      destination_currency: newRow.destination_currency,
      date_observed: newRow.date_observed,
      time_observed: newRow.time_observed,
      transfer_method: newRow.transfer_method,
      user_note: newRow.user_note,
      amount_sent: newRow.amount_sent,
      amount_received: newRow.amount_received,
      screenshot_path: newRow.screenshot_path || newRow.screenshot_storage_path,
      screenshot_original_name: newRow.screenshot_original_name || newRow.screenshot_name,
      screenshot_mime_type: newRow.screenshot_mime_type,
      screenshot_size_bytes: newRow.screenshot_size_bytes,
      screenshot_hash: newRow.screenshot_hash,
      screenshot_uploaded_at: newRow.screenshot_uploaded_at || newRow.submitted_at,
      evidence_status: newRow.evidence_status,
      fraud_risk_score: newRow.fraud_risk_score,
      fraud_risk_level: newRow.fraud_risk_level,
      fraud_flags: newRow.fraud_flags,
      updated_at: newRow.updated_at
    };
    
    try {
      const { data, error } = await supabaseClient.from('community_rate_submissions').insert([supabaseRow]).select();
      
      if (!error && data && data[0]) {
        const savedRow = data[0];
        
        // Log fraud event if risk is moderate or high
        if (riskScore >= 25) {
          await logFraudIntegrityEvent({
            event_type: riskScore >= 75 ? 'CRVS_CRITICAL_FRAUD_TRIGGER' : 'CRVS_MODERATE_FRAUD_TRIGGER',
            severity: riskScore >= 75 ? 'critical' : (riskScore >= 50 ? 'high' : 'medium'),
            submission_id: savedRow.id,
            channel_id: savedRow.provider_id,
            corridor_id: savedRow.corridor_id,
            risk_score: riskScore,
            risk_flags: flags,
            metadata: { exchange_rate: savedRow.exchange_rate, original_name: savedRow.screenshot_name }
          });
        }

        if (submission.vat_amount !== undefined || submission.other_costs !== undefined) {
          saveExtraCosts(savedRow.id, {
            vat_amount: submission.vat_amount,
            other_costs: submission.other_costs
          });
        }
        return {
          ...newRow,
          ...savedRow,
          submitted_at: savedRow.submitted_at || savedRow.created_at || newRow.submitted_at,
        } as DbCommunitySubmission;
      }
      console.error('Supabase save submission error details:', error);
    } catch (err) {
      console.warn('Supabase save submission error, using emulated storage:', err);
    }
  }

  const current = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
  const updated = [newRow, ...current];
  saveLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, updated);

  if (riskScore >= 25) {
    await logFraudIntegrityEvent({
      event_type: riskScore >= 75 ? 'CRVS_CRITICAL_FRAUD_TRIGGER' : 'CRVS_MODERATE_FRAUD_TRIGGER',
      severity: riskScore >= 75 ? 'critical' : (riskScore >= 50 ? 'high' : 'medium'),
      submission_id: newRow.id,
      channel_id: newRow.provider_id,
      corridor_id: newRow.corridor_id,
      risk_score: riskScore,
      risk_flags: flags,
      metadata: { exchange_rate: newRow.exchange_rate, original_name: newRow.screenshot_name }
    });
  }

  if (submission.vat_amount !== undefined || submission.other_costs !== undefined) {
    saveExtraCosts(newRow.id, {
      vat_amount: submission.vat_amount,
      other_costs: submission.other_costs
    });
  }
  return newRow;
}

// Extended updateSubmissionStatus support for CRVS Admin features
export async function updateSubmissionStatusEx(
  id: string,
  status: string,
  adminUser?: { id: string; email: string },
  reviewerNotes?: string,
  rejectionReason?: string,
  evidenceStatus?: string
): Promise<void> {
  const nowStr = new Date().toISOString();
  const config = fetchCrvsConfig();
  const validUntilStr = status === 'approved' 
    ? new Date(Date.now() + config.expiry_hours * 60 * 60 * 1000).toISOString()
    : undefined;

  // Anti-self approval validation check
  const submissions = await fetchCommunitySubmissions();
  const targetSub = submissions.find(s => s.id === id);
  if (targetSub && adminUser) {
    if (targetSub.submitted_by_email?.toLowerCase() === adminUser.email.toLowerCase() && status === 'approved') {
      throw new Error("Admins are strictly forbidden from approving their own submissions.");
    }
  }

  const updates: any = {
    status,
    updated_at: nowStr,
    reviewer_notes: reviewerNotes,
    evidence_status: evidenceStatus || (status === 'approved' ? 'verified' : (status === 'rejected' ? 'invalid' : 'pending'))
  };

  if (status === 'approved') {
    updates.approved_by = adminUser?.id || null;
    updates.approved_at = nowStr;
    updates.valid_until = validUntilStr;
  } else if (status === 'rejected') {
    updates.rejected_by = adminUser?.id || null;
    updates.rejected_at = nowStr;
    updates.rejection_reason = rejectionReason;
  }

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('community_rate_submissions')
        .update(updates)
        .eq('id', id);
      if (!error) {
        const current = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
        const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
        saveLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, updated);
        return;
      }
      console.warn('Supabase updateSubmissionStatusEx failed, falling back:', error);
    } catch (err) {
      console.warn('Supabase updateSubmissionStatusEx error:', err);
    }
  }

  const current = getLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, initialCommunitySubmissions);
  const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
  saveLocalStorageItem<DbCommunitySubmission[]>(COMMUNITY_KEY, updated);
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  await updateSubmissionStatusEx(id, status);
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
      // 2. Approved Community Verified Rate (verified & within custom validity hours)
      const approvedCommunity = communitySubmissions
         .filter(s => {
           const isApprovedAndEligible = s.status === 'approved';
           const isVerified = s.evidence_status === 'verified';
           
           // Expiration validation check
           let isNotExpired = false;
           if (s.valid_until) {
             isNotExpired = new Date(s.valid_until).getTime() > Date.now();
           } else {
             const ageMs = Date.now() - new Date(s.submitted_at).getTime();
             isNotExpired = ageMs <= 24 * 60 * 60 * 1000; // default 24h fallback
           }
           
           const isNotBlocked = s.status !== 'blocked';
           const isMatching = s.provider_id === provider.id && s.corridor_id === corridorId;
           return isApprovedAndEligible && isVerified && isNotExpired && isNotBlocked && isMatching;
         })
         .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];

      if (approvedCommunity) {
        resolvedRate = approvedCommunity.exchange_rate;
        transferFee = approvedCommunity.transfer_fee;
        customVat = approvedCommunity.vat_amount;
        customOtherCosts = approvedCommunity.other_costs;
        sourceType = 'community_verified';
        sourceLabel = 'Community Verified Rate';
        
        // Calculate dynamic trust confidence via Trust Engine
        const marketRef = marketRates.find(m => m.corridor_id === corridorId);
        const trustScore = computeCommunityTrustConfidence(approvedCommunity, communitySubmissions, marketRef?.rate);
        confidence = trustScore >= 90 ? 'high' : (trustScore >= 70 ? 'medium' : 'low');
        
        lastUpdated = approvedCommunity.submitted_at;
        reason = `Verified by CRVS (Trust score: ${trustScore}/100) from ${approvedCommunity.submitted_by_name || 'Expats'}.`;
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
    rate_submissions_restricted?: boolean;
    first_transfer_recorded_at?: string;
    first_transfer_experience_prompt_shown_at?: string;
    first_transfer_experience_completed_at?: string;
    engagement_notifications_enabled?: boolean;
  } | null;
}

const initialRegisteredUsers = [
  {
    id: 'user-init-1',
    email: 'ahmed.hassan@saudi-expats.com',
    password: 'ahmed_hassan_remit_secure_9238',
    name: 'Ahmed Hassan',
    phone: '+966 50 123 4567',
    preferred_corridor_id: 'sa-pk',
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'user-init-2',
    email: 'gaturuhassan@gmail.com',
    password: 'gaturu_hassan_remit_secure_8174',
    name: 'Hassan Gaturu',
    phone: '+966 55 987 6543',
    preferred_corridor_id: 'sa-in',
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'user-init-3',
    email: 'john.doe@gmail.com',
    password: 'john_doe_remit_secure_5742',
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

export interface SignUpResponse {
  user: any | null;
  session: AuthSession | null;
  confirmationRequired: boolean;
}

export async function signUpWithSupabase(
  email: string,
  name: string,
  phone: string,
  preferredCorridorId: string,
  password: string
): Promise<SignUpResponse> {
  const normalizedEmail = email.trim().toLowerCase();
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
      password: password,
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

      // 3. Create the database profile (Use ID from auth.users.id) only if not already exists (safe trigger / fallback)
      const { data: existingProfile } = await supabaseClient
        .from('user_profiles')
        .select('id')
        .eq('id', authUserId)
        .maybeSingle();

      if (!existingProfile) {
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

        if (profileError && !profileError.message.includes('duplicate key')) {
          console.error('[SariRemit Auth] Failed to create user profile during signup:', profileError);
          throw profileError;
        }
      }
    }

    // If session is null, email confirmation is required! Do NOT log them in automatically.
    if (!authData.session) {
      return {
        user: authData.user,
        session: null,
        confirmationRequired: true
      };
    }

    const session = {
      user: {
        id: authUserId,
        email: normalizedEmail,
        name,
        phone,
        preferredCorridorId,
        language: 'en' as const,
        onboarding_completed: false
      }
    };
    saveAuthSession(session);
    return {
      user: authData.user,
      session,
      confirmationRequired: false
    };
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
      password: password,
      name: newUser.name,
      phone: newUser.phone,
      preferred_corridor_id: newUser.preferredCorridorId,
      language: newUser.language,
      onboarding_completed: false,
      created_at: new Date().toISOString()
    };
    allUsers.push(emulatedUser);
    saveLocalStorageItem('sr_supabase_registered_users', allUsers);

    const session = { user: newUser };
    saveAuthSession(session);
    return {
      user: newUser,
      session,
      confirmationRequired: false
    };
  }
}

export async function signInWithSupabase(email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabaseClient) {
    // 1. Perform authentic Supabase signIn
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
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

    const expectedPassword = matchedLocalUser.password;
    if (!expectedPassword || expectedPassword !== password) {
      throw new Error("Incorrect email or password");
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

export async function signInWithGoogle(): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      throw error;
    }
  } else {
    // Emulated local redirect to /auth/callback for local testing
    console.log('[SariRemit Auth] Google Sign-In: emulated redirecting to /auth/callback...');
    window.location.href = `${window.location.origin}/auth/callback?mock=google`;
  }
}

export async function handleGoogleCallback(): Promise<AuthSession> {
  if (isSupabaseConfigured && supabaseClient) {
    // 1. Wait until Supabase restores a valid session (poll/timeout check)
    let session = null;
    for (let i = 0; i < 20; i++) {
      const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
      if (currentSession) {
        session = currentSession;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!session) {
      // Secondary fallback wait via onAuthStateChange
      session = await new Promise((resolve) => {
        const { data: { subscription } } = supabaseClient!.auth.onAuthStateChange((event, currentSession) => {
          if (currentSession) {
            subscription.unsubscribe();
            resolve(currentSession);
          }
        });
        setTimeout(() => {
          subscription.unsubscribe();
          resolve(null);
        }, 3000);
      });
    }

    if (!session) {
      throw new Error("Unable to restore valid Supabase session. Google login failed or was cancelled.");
    }

    // 2. Get the authenticated user using supabase.auth.getUser()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error(userError?.message || "Failed to retrieve authenticated user details from Supabase.");
    }

    // 3. Require both a valid session and user (completed by checks above)
    const normalizedEmail = user.email?.trim().toLowerCase() || '';

    // 4 & 5. Fetch existing profile using profile.id = user.id. Do not fetch only by email.
    let { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Google Callback] Error fetching profile by ID:', profileError);
    }

    // 6. Do not create another Auth account.
    
    // 7. Create a profile only when no profile exists for the authenticated user ID.
    // 8. Never generate a separate profile UUID.
    if (!profile) {
      console.log('[Google Callback] No profile found for ID:', user.id, '. Checking if existing email/password profile exists to link identity...');
      
      // Preserve the Supabase-linked identity behavior: if profile by email exists, link it
      const { data: profileByEmail } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profileByEmail) {
        console.log('[Google Callback] Found existing profile with same email but different ID. Linking ID...', user.id);
        const { data: updatedProfile, error: updateError } = await supabaseClient
          .from('user_profiles')
          .update({ id: user.id })
          .eq('email', normalizedEmail)
          .select()
          .maybeSingle();
        
        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        } else {
          console.warn('[Google Callback] Linking profile ID failed:', updateError);
          profile = profileByEmail;
        }
      } else {
        console.log('[Google Callback] Creating new profile with user ID:', user.id);
        const name = user.user_metadata?.name || user.user_metadata?.full_name || normalizedEmail.split('@')[0].toUpperCase();
        const phone = user.user_metadata?.phone || '+966 50 123 4567';

        const { data: newProfile, error: createError } = await supabaseClient
          .from('user_profiles')
          .insert({
            id: user.id,
            email: normalizedEmail,
            name: name,
            phone: phone,
            preferred_corridor_id: 'sa-pk',
            language: 'en',
            onboarding_completed: false, // new Google user sees onboarding once
            created_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (createError) {
          console.error('[Google Callback] Failed to create new user profile:', createError);
          throw createError;
        }
        profile = newProfile;
      }
    }

    if (!profile) {
      throw new Error("Failed to load or initialize profile for the authenticated Google user.");
    }

    // 9. Never reset onboarding_completed.
    // 12. Do not redirect until auth and profile loading have completed.
    const resolvedSession = {
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

    saveAuthSession(resolvedSession);
    return resolvedSession;
  } else {
    // Local emulation mock Google callback behavior
    console.log('[Google Callback] Emulation mode handling mock login...');
    const mockEmail = 'mock.google.user@gmail.com';
    const emulatedUserId = 'user-mock-google-id';

    const allUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
    let matchedUser = allUsers.find(u => u.email.toLowerCase() === mockEmail.toLowerCase() || u.id === emulatedUserId);

    if (!matchedUser) {
      matchedUser = {
        id: emulatedUserId,
        email: mockEmail,
        password: 'google-emulated-pass',
        name: 'MOCK GOOGLE USER',
        phone: '+966 50 000 0000',
        preferred_corridor_id: 'sa-pk',
        language: 'en',
        onboarding_completed: false,
        created_at: new Date().toISOString()
      };
      allUsers.push(matchedUser);
      saveLocalStorageItem('sr_supabase_registered_users', allUsers);
    }

    const session = {
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.name,
        phone: matchedUser.phone,
        preferredCorridorId: matchedUser.preferred_corridor_id || 'sa-pk',
        language: matchedUser.language || 'en',
        onboarding_completed: matchedUser.onboarding_completed || false,
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
        // Securely confirm the user using getUser()
        const { data: { user: secureUser }, error: getUserError } = await supabaseClient.auth.getUser();
        if (getUserError || !secureUser) {
          console.warn('[SariRemit Auth] Secure getUser check failed, clearing session.');
          saveAuthSession({ user: null });
          return { user: null };
        }

        const authUser = secureUser;
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
              rate_submissions_restricted: profile.rate_submissions_restricted || false,
              first_transfer_recorded_at: profile.first_transfer_recorded_at || undefined,
              first_transfer_experience_prompt_shown_at: profile.first_transfer_experience_prompt_shown_at || undefined,
              first_transfer_experience_completed_at: profile.first_transfer_experience_completed_at || undefined,
              engagement_notifications_enabled: profile.engagement_notifications_enabled !== false,
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
  rate_submissions_restricted?: boolean;
  first_transfer_recorded_at?: string;
  first_transfer_experience_prompt_shown_at?: string;
  first_transfer_experience_completed_at?: string;
  engagement_notifications_enabled?: boolean;
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
        rate_submissions_restricted: profile.rate_submissions_restricted !== undefined ? profile.rate_submissions_restricted : false,
        first_transfer_recorded_at: profile.first_transfer_recorded_at || null,
        first_transfer_experience_prompt_shown_at: profile.first_transfer_experience_prompt_shown_at || null,
        first_transfer_experience_completed_at: profile.first_transfer_experience_completed_at || null,
        engagement_notifications_enabled: profile.engagement_notifications_enabled !== undefined ? profile.engagement_notifications_enabled : true,
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
          rate_submissions_restricted: profile.rate_submissions_restricted,
          first_transfer_recorded_at: profile.first_transfer_recorded_at || u.first_transfer_recorded_at,
          first_transfer_experience_prompt_shown_at: profile.first_transfer_experience_prompt_shown_at || u.first_transfer_experience_prompt_shown_at,
          first_transfer_experience_completed_at: profile.first_transfer_experience_completed_at || u.first_transfer_experience_completed_at,
          engagement_notifications_enabled: profile.engagement_notifications_enabled !== undefined ? profile.engagement_notifications_enabled : u.engagement_notifications_enabled,
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
      rate_submissions_restricted: profile.rate_submissions_restricted,
      first_transfer_recorded_at: profile.first_transfer_recorded_at || currentSession.user.first_transfer_recorded_at,
      first_transfer_experience_prompt_shown_at: profile.first_transfer_experience_prompt_shown_at || currentSession.user.first_transfer_experience_prompt_shown_at,
      first_transfer_experience_completed_at: profile.first_transfer_experience_completed_at || currentSession.user.first_transfer_experience_completed_at,
      engagement_notifications_enabled: profile.engagement_notifications_enabled !== undefined ? profile.engagement_notifications_enabled : currentSession.user.engagement_notifications_enabled,
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

// =========================================================================
// SARIREMIT ENGAGEMENT & PROGRESS SYSTEM (SEPS) ENGINE
// =========================================================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'ach-1',
    code: 'first_transfer',
    title: 'First Transfer Recorded',
    description: 'You recorded your first transfer on SariRemit.',
    category: 'transfer',
    iconKey: 'first-step',
    sortOrder: 1,
    status: 'active'
  },
  {
    id: 'ach-2',
    code: 'smart_sender',
    title: 'Smart Sender',
    description: 'You recorded three transfers with optimal comparison options.',
    category: 'transfer',
    iconKey: 'arrow-path',
    sortOrder: 2,
    status: 'active'
  },
  {
    id: 'ach-3',
    code: 'regular_comparator',
    title: 'Regular Comparator',
    description: 'You recorded five transfers after comparing the best rates.',
    category: 'transfer',
    iconKey: 'arrow-path',
    sortOrder: 3,
    status: 'active'
  },
  {
    id: 'ach-4',
    code: 'experienced_sender',
    title: 'Experienced Sender',
    description: 'You recorded ten transfers with SariRemit.',
    category: 'transfer',
    iconKey: 'arrow-path',
    sortOrder: 4,
    status: 'active'
  },
  {
    id: 'ach-5',
    code: 'savings_starter',
    title: 'Savings Starter',
    description: 'Saved your first SAR using smart recommendations.',
    category: 'savings',
    iconKey: 'savings-jar',
    sortOrder: 5,
    status: 'active'
  },
  {
    id: 'ach-6',
    code: 'savings_builder',
    title: 'Savings Builder',
    description: 'Reached a cumulative estimated savings of 100 SAR or more.',
    category: 'savings',
    iconKey: 'savings-jar',
    sortOrder: 6,
    status: 'active'
  },
  {
    id: 'ach-7',
    code: 'first_verified',
    title: 'First Verified Rate',
    description: 'Your first community rate submission has been verified and approved.',
    category: 'contribution',
    iconKey: 'shield-check',
    sortOrder: 7,
    status: 'active'
  },
  {
    id: 'ach-8',
    code: 'trusted_contributor',
    title: 'Trusted Contributor',
    description: 'You contributed three approved community rate reports.',
    category: 'contribution',
    iconKey: 'shield-check',
    sortOrder: 8,
    status: 'active'
  },
  {
    id: 'ach-9',
    code: 'community_helper',
    title: 'Community Helper',
    description: 'You contributed five approved community rate reports.',
    category: 'contribution',
    iconKey: 'shield-check',
    sortOrder: 9,
    status: 'active'
  }
];

// 1. Fetch recorded transfers
export async function fetchRecordedTransfers(userId: string): Promise<RecordedTransfer[]> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('recorded_transfers')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });
      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          channelId: item.channel_id,
          corridorId: item.corridor_id,
          sendAmountSAR: parseFloat(item.send_amount_sar),
          destinationCurrency: item.destination_currency,
          estimatedRecipientAmount: parseFloat(item.estimated_recipient_amount),
          actualRecipientAmount: item.actual_recipient_amount ? parseFloat(item.actual_recipient_amount) : null,
          resolvedRate: parseFloat(item.resolved_rate),
          rateSource: item.rate_source,
          transferFeeSAR: parseFloat(item.transfer_fee_sar),
          vatAmountSAR: parseFloat(item.vat_amount_sar),
          otherChargesSAR: parseFloat(item.other_charges_sar),
          estimatedSavingsDestination: item.estimated_savings_destination ? parseFloat(item.estimated_savings_destination) : null,
          estimatedSavingsSAR: item.estimated_savings_sar ? parseFloat(item.estimated_savings_sar) : null,
          savingsComparisonType: item.savings_comparison_type,
          comparisonChannelId: item.comparison_channel_id,
          idempotencyKey: item.idempotency_key,
          recordedAt: item.recorded_at,
          createdAt: item.created_at
        }));
      }
      console.warn('Supabase fetch recorded transfers failed:', error);
    } catch (err) {
      console.warn('Supabase fetch recorded transfers error:', err);
    }
  }

  // Fallback
  const list = getLocalStorageItem<RecordedTransfer[]>('sr_recorded_transfers', []);
  return list.filter(item => item.userId === userId).sort((a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

// 2. Save recorded transfer and return newly earned achievements
export async function saveRecordedTransfer(transfer: RecordedTransfer): Promise<{ success: boolean; newAchievements: UserAchievement[]; firstTime: boolean }> {
  // Prevent duplicate records via idempotencyKey
  const existingTransfers = await fetchRecordedTransfers(transfer.userId);
  if (transfer.idempotencyKey && existingTransfers.some(t => t.idempotencyKey === transfer.idempotencyKey)) {
    console.warn('[SEPS] Ignored duplicate recorded transfer with idempotencyKey:', transfer.idempotencyKey);
    return { success: true, newAchievements: [], firstTime: false };
  }

  // Insert to recorded_transfers
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const dbPayload = {
        id: transfer.id,
        user_id: transfer.userId,
        channel_id: transfer.channelId || null,
        corridor_id: transfer.corridorId || null,
        send_amount_sar: transfer.sendAmountSAR,
        destination_currency: transfer.destinationCurrency,
        estimated_recipient_amount: transfer.estimatedRecipientAmount,
        actual_recipient_amount: transfer.actualRecipientAmount || null,
        resolved_rate: transfer.resolvedRate,
        rate_source: transfer.rateSource || null,
        transfer_fee_sar: transfer.transferFeeSAR,
        vat_amount_sar: transfer.vatAmountSAR,
        other_charges_sar: transfer.otherChargesSAR,
        estimated_savings_destination: transfer.estimatedSavingsDestination || null,
        estimated_savings_sar: transfer.estimatedSavingsSAR || null,
        savings_comparison_type: transfer.savingsComparisonType,
        comparison_channel_id: transfer.comparisonChannelId || null,
        idempotency_key: transfer.idempotencyKey || null,
        recorded_at: transfer.recordedAt,
        created_at: transfer.createdAt,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient.from('recorded_transfers').insert(dbPayload);
      if (error) {
        console.error('Failed to save recorded transfer in Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase save recorded transfer error:', err);
    }
  }

  // Save to Local Storage anyway
  const list = getLocalStorageItem<RecordedTransfer[]>('sr_recorded_transfers', []);
  list.push(transfer);
  saveLocalStorageItem('sr_recorded_transfers', list);

  // SECTION 15 Integration: Also save to old user_transfer_savings so existing savings widgets remain perfectly in sync
  const savingsRecord: UserTransferSavings = {
    id: transfer.id,
    user_id: transfer.userId,
    corridor_id: transfer.corridorId,
    send_amount: transfer.sendAmountSAR,
    exchange_rate: transfer.resolvedRate,
    transfer_fee: transfer.transferFeeSAR,
    computed_savings: transfer.estimatedSavingsSAR || 0,
    recipient_amount: transfer.estimatedRecipientAmount,
    transfer_status: 'completed',
    recorded_at: transfer.recordedAt
  };
  await saveUserTransfer(savingsRecord);

  // Update profile first_transfer_recorded_at if null
  const profile = getAuthSession().user;
  const isFirstTime = !profile?.first_transfer_recorded_at;
  if (profile && isFirstTime) {
    const updatedFields = {
      ...profile,
      first_transfer_recorded_at: transfer.recordedAt
    };
    await updateUserProfileInDb(updatedFields);
  }

  // Recalculate progress & award achievements
  const progress = await recalculateUserProgress(transfer.userId);
  
  // Return new achievements awarded during this recalculation (we can compare before and after)
  const prevAchievements = getLocalStorageItem<UserAchievement[]>('sr_user_achievements', []);
  // Recalculate will have already saved new achievements
  const allAchievements = await fetchUserAchievements(transfer.userId);
  const newlyAwarded = allAchievements.filter(ach => !prevAchievements.some(p => p.achievementId === ach.achievementId));

  return { success: true, newAchievements: newlyAwarded, firstTime: isFirstTime };
}

// 3. Delete recorded transfer
export async function deleteRecordedTransfer(id: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient.from('recorded_transfers').delete().eq('id', id).eq('user_id', userId);
      await supabaseClient.from('user_transfer_savings').delete().eq('id', id).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase delete transfer error:', err);
    }
  }

  // Local storage recorded_transfers
  const list = getLocalStorageItem<RecordedTransfer[]>('sr_recorded_transfers', []);
  const updatedList = list.filter(t => !(t.id === id && t.userId === userId));
  saveLocalStorageItem('sr_recorded_transfers', updatedList);

  // Local storage user_transfer_savings
  const savingsList = getLocalStorageItem<UserTransferSavings[]>('sr_user_transfer_savings', []);
  const updatedSavings = savingsList.filter(t => !(t.id === id && t.user_id === userId));
  saveLocalStorageItem('sr_user_transfer_savings', updatedSavings);

  // Recalculate progress
  await recalculateUserProgress(userId);
}

// 4. Update recorded transfer actual recipient amount
export async function updateRecordedTransferActualAmount(id: string, actualAmount: number, userId: string): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient
        .from('recorded_transfers')
        .update({ actual_recipient_amount: actualAmount, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase update actual amount error:', err);
    }
  }

  const list = getLocalStorageItem<RecordedTransfer[]>('sr_recorded_transfers', []);
  const updatedList = list.map(t => (t.id === id && t.userId === userId) ? { ...t, actualRecipientAmount: actualAmount } : t);
  saveLocalStorageItem('sr_recorded_transfers', updatedList);
}

// 5. Submit user experience feedback
export async function submitUserExperienceFeedback(feedback: UserExperienceFeedback): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const dbPayload = {
        id: feedback.id,
        user_id: feedback.userId,
        feedback_type: feedback.feedbackType,
        rating: feedback.rating || null,
        selected_reasons: feedback.selectedReasons,
        comment: feedback.comment || null,
        related_transfer_id: feedback.relatedTransferId || null,
        skipped: feedback.skipped,
        source_screen: feedback.sourceScreen || null,
        submitted_at: feedback.submittedAt,
        created_at: new Date().toISOString()
      };

      const { error } = await supabaseClient.from('user_experience_feedback').insert(dbPayload);
      if (error) {
        console.error('Failed to insert user experience feedback in Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase insert feedback error:', err);
    }
  }

  // Local
  const list = getLocalStorageItem<UserExperienceFeedback[]>('sr_user_experience_feedback', []);
  list.push(feedback);
  saveLocalStorageItem('sr_user_experience_feedback', list);

  // Update profile experience dates
  const profile = getAuthSession().user;
  if (profile) {
    if (feedback.feedbackType === 'first_transfer_experience') {
      const updatedFields = {
        ...profile,
        first_transfer_experience_completed_at: feedback.skipped ? undefined : feedback.submittedAt,
        first_transfer_experience_prompt_shown_at: profile.first_transfer_experience_prompt_shown_at || feedback.submittedAt
      };
      await updateUserProfileInDb(updatedFields);
    }
  }

  // Recalculate progress for feedback points
  await recalculateUserProgress(feedback.userId);
}

// 6. Fetch user experience feedback
export async function fetchUserExperienceFeedback(userId: string): Promise<UserExperienceFeedback[]> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('user_experience_feedback')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          feedbackType: item.feedback_type,
          rating: item.rating,
          selectedReasons: item.selected_reasons || [],
          comment: item.comment,
          relatedTransferId: item.related_transfer_id,
          skipped: item.skipped,
          sourceScreen: item.source_screen,
          submittedAt: item.submitted_at
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch feedback error:', err);
    }
  }

  const list = getLocalStorageItem<UserExperienceFeedback[]>('sr_user_experience_feedback', []);
  return list.filter(item => item.userId === userId);
}

// 7. Fetch user achievements
export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          achievementId: item.achievement_id,
          sourceType: item.source_type,
          sourceId: item.source_id,
          awardedAt: item.awarded_at,
          metadata: item.metadata || {}
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch achievements error:', err);
    }
  }

  const list = getLocalStorageItem<UserAchievement[]>('sr_user_achievements', []);
  return list.filter(item => item.userId === userId);
}

// 8. Fetch user progress
export async function fetchUserProgress(userId: string): Promise<UserProgress> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) {
        return {
          userId: data.user_id,
          recordedTransferCount: data.recorded_transfer_count,
          approvedRateContributionCount: data.approved_rate_contribution_count,
          lifetimeEstimatedSavingsSar: parseFloat(data.lifetime_estimated_savings_sar),
          currentLevel: data.current_level,
          progressPoints: data.progress_points,
          latestAchievementCode: data.latest_achievement_code,
          updatedAt: data.updated_at
        };
      }
    } catch (err) {
      console.warn('Supabase fetch progress error:', err);
    }
  }

  const progressList = getLocalStorageItem<UserProgress[]>('sr_user_progress', []);
  const found = progressList.find(p => p.userId === userId);
  if (found) return found;

  // Otherwise calculate on demand
  return recalculateUserProgress(userId);
}

// 9. Recalculate user progress & award achievements
export async function recalculateUserProgress(userId: string): Promise<UserProgress> {
  const transfers = await fetchRecordedTransfers(userId);
  const transferCount = transfers.length;

  // Calculate savings
  const lifetimeSavings = transfers.reduce((acc, t) => acc + (t.estimatedSavingsSAR || 0), 0);

  // Calculate approved community submissions
  let approvedContributions = 0;
  const session = getAuthSession();
  if (session.user) {
    const submissions = await fetchCommunitySubmissions();
    const userSubmissions = submissions.filter(s => 
      (s.submitted_by_email?.toLowerCase() === session.user?.email?.toLowerCase()) && 
      s.status === 'approved'
    );
    approvedContributions = userSubmissions.length;
  }

  // Check feedback
  const feedback = await fetchUserExperienceFeedback(userId);
  const hasFeedback = feedback.some(f => !f.skipped);

  // Compute Points
  let points = 0;
  points += transferCount * 10;
  points += approvedContributions * 25;
  points += hasFeedback ? 5 : 0;
  points += lifetimeSavings > 0 ? 10 : 0;

  // Determine Level
  let level = 'new_member';
  if (points >= 200) {
    level = 'community_champion';
  } else if (points >= 100) {
    level = 'trusted_contributor';
  } else if (points >= 50) {
    level = 'confident_sender';
  } else if (points >= 20) {
    level = 'smart_sender';
  }

  // Evaluate achievements to award
  const newlyAwarded: UserAchievement[] = [];
  const currentAchievements = await fetchUserAchievements(userId);

  const checkAndAward = async (code: string, isEligible: boolean) => {
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.code === code);
    if (def && isEligible) {
      const alreadyEarned = currentAchievements.some(a => a.achievementId === def.id);
      if (!alreadyEarned) {
        const newAward: UserAchievement = {
          id: `award-${code}-${Date.now()}`,
          userId,
          achievementId: def.id,
          awardedAt: new Date().toISOString(),
          metadata: { code }
        };

        // Persist to Supabase if configured
        if (isSupabaseConfigured && supabaseClient) {
          try {
            await supabaseClient.from('user_achievements').insert({
              id: newAward.id,
              user_id: newAward.userId,
              achievement_id: newAward.achievementId,
              awarded_at: newAward.awardedAt,
              metadata: newAward.metadata
            });
          } catch (err) {
            console.warn('Failed to insert achievement in Supabase:', err);
          }
        }

        // Add to local storage achievements
        const achList = getLocalStorageItem<UserAchievement[]>('sr_user_achievements', []);
        achList.push(newAward);
        saveLocalStorageItem('sr_user_achievements', achList);

        newlyAwarded.push(newAward);
        currentAchievements.push(newAward);
      }
    }
  };

  // Perform checks
  await checkAndAward('first_transfer', transferCount >= 1);
  await checkAndAward('smart_sender', transferCount >= 3);
  await checkAndAward('regular_comparator', transferCount >= 5);
  await checkAndAward('experienced_sender', transferCount >= 10);
  await checkAndAward('savings_starter', lifetimeSavings > 0);
  await checkAndAward('savings_builder', lifetimeSavings >= 100);
  await checkAndAward('first_verified', approvedContributions >= 1);
  await checkAndAward('trusted_contributor', approvedContributions >= 3);
  await checkAndAward('community_helper', approvedContributions >= 5);

  const latestAchievementCode = currentAchievements.length > 0 
    ? ACHIEVEMENT_DEFINITIONS.find(def => def.id === currentAchievements[currentAchievements.length - 1].achievementId)?.code 
    : null;

  const progress: UserProgress = {
    userId,
    recordedTransferCount: transferCount,
    approvedRateContributionCount: approvedContributions,
    lifetimeEstimatedSavingsSar: lifetimeSavings,
    currentLevel: level,
    progressPoints: points,
    latestAchievementCode,
    updatedAt: new Date().toISOString()
  };

  // Persist progress to Supabase
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const dbPayload = {
        user_id: progress.userId,
        recorded_transfer_count: progress.recordedTransferCount,
        approved_rate_contribution_count: progress.approvedRateContributionCount,
        lifetime_estimated_savings_sar: progress.lifetimeEstimatedSavingsSar,
        current_level: progress.currentLevel,
        progress_points: progress.progressPoints,
        latest_achievement_code: progress.latestAchievementCode,
        updated_at: progress.updatedAt
      };
      await supabaseClient.from('user_progress').upsert(dbPayload);
    } catch (err) {
      console.warn('Failed to upsert progress in Supabase:', err);
    }
  }

  // Save to local storage progress
  const progressList = getLocalStorageItem<UserProgress[]>('sr_user_progress', []);
  const updatedProgressList = progressList.filter(p => p.userId !== userId);
  updatedProgressList.push(progress);
  saveLocalStorageItem('sr_user_progress', updatedProgressList);

  return progress;
}

// 10. Award achievement if eligible (manual or admin triggered)
export async function awardAchievementIfEligible(userId: string, code: string, metadata?: Record<string, any>): Promise<UserAchievement | null> {
  const def = ACHIEVEMENT_DEFINITIONS.find(a => a.code === code);
  if (!def) return null;

  const currentAchievements = await fetchUserAchievements(userId);
  const alreadyEarned = currentAchievements.some(a => a.achievementId === def.id);
  if (alreadyEarned) return null;

  const newAward: UserAchievement = {
    id: `award-${code}-${Date.now()}`,
    userId,
    achievementId: def.id,
    awardedAt: new Date().toISOString(),
    metadata: metadata || {}
  };

  if (isSupabaseConfigured && supabaseClient) {
    try {
      await supabaseClient.from('user_achievements').insert({
        id: newAward.id,
        user_id: newAward.userId,
        achievement_id: newAward.achievementId,
        awarded_at: newAward.awardedAt,
        metadata: newAward.metadata
      });
    } catch (err) {
      console.warn('Failed to insert achievement in Supabase:', err);
    }
  }

  const achList = getLocalStorageItem<UserAchievement[]>('sr_user_achievements', []);
  achList.push(newAward);
  saveLocalStorageItem('sr_user_achievements', achList);

  await recalculateUserProgress(userId);
  return newAward;
}

// 11. Fetch SRCMC Feedback Analytics
export async function fetchFeedbackAnalytics(): Promise<any> {
  // Return list of all experience feedbacks for administrative dashboard summary
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('user_experience_feedback').select('*');
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetch feedback analytics error:', err);
    }
  }
  return getLocalStorageItem<UserExperienceFeedback[]>('sr_user_experience_feedback', []);
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
  user_id?: string | null;
  email: string;
  role: 'main_admin' | 'rate_monitor' | 'override_manager' | 'community_verifier' | 'channel_manager' | 'corridor_manager' | 'viewer';
  permissions: string[];
  pin_code: string;
  pin_generated_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAndRepairUserSrcmcAccess(userId: string, email: string): Promise<SRCMCAdminAccess | null> {
  const normalizedEmail = email.toLowerCase().trim();

  if (supabaseClient) {
    try {
      // 1. Query directly by authenticated user_id
      const { data: directAccess, error: directError } = await supabaseClient
        .from('srcmc_admin_access')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!directError && directAccess) {
        return directAccess as SRCMCAdminAccess;
      }

      // 2. Query by email where user_id is null or needs to be set
      const { data: emailAccess, error: emailError } = await supabaseClient
        .from('srcmc_admin_access')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (!emailError && emailAccess) {
        // Safe update: associate user_id with the record
        const { data: repairedAccess, error: repairError } = await supabaseClient
          .from('srcmc_admin_access')
          .update({
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailAccess.id)
          .select()
          .maybeSingle();

        if (!repairError && repairedAccess) {
          console.log(`[SRCMC Auth Repair] Successfully set user_id for: ${normalizedEmail}`);
          return repairedAccess as SRCMCAdminAccess;
        }
        return emailAccess as SRCMCAdminAccess;
      }
    } catch (err) {
      console.warn('[SRCMC Auth Repair] Failed to repair admin access:', err);
    }
  }

  // Fallback / Local Emulation
  const admins = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);
  const matchIdx = admins.findIndex(
    a => (a.user_id === userId || a.id === userId || a.email.toLowerCase().trim() === normalizedEmail) && a.is_active
  );

  if (matchIdx !== -1) {
    if (!admins[matchIdx].user_id) {
      admins[matchIdx] = {
        ...admins[matchIdx],
        user_id: userId,
        updated_at: new Date().toISOString()
      };
      saveLocalStorageItem(ADMIN_ACCESS_KEY, admins);
    }
    return admins[matchIdx];
  }

  return null;
}

export async function assignAdminAccess(params: {
  email: string;
  role: 'main_admin' | 'rate_monitor' | 'override_manager' | 'community_verifier' | 'channel_manager' | 'corridor_manager' | 'viewer';
  permissions: string[];
  createdBy: string;
}): Promise<{ success: boolean; message: string; pin?: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  
  if (supabaseClient) {
    try {
      // 1. Validate against existing profile in user_profiles
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profileError || !profile) {
        return {
          success: false,
          message: 'No registered SariRemit account found for this email address. Users must first register/onboard before administrative access can be assigned.'
        };
      }

      const targetUserId = profile.id;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      // Check if there is an existing access record (avoid duplicates)
      const { data: existingRecord } = await supabaseClient
        .from('srcmc_admin_access')
        .select('*')
        .or(`user_id.eq.${targetUserId},email.eq.${normalizedEmail}`)
        .maybeSingle();

      const recordId = existingRecord?.id || `admin-${Date.now()}`;
      const recordPin = existingRecord?.pin_code || pin;

      const { error: upsertError } = await supabaseClient
        .from('srcmc_admin_access')
        .upsert({
          id: recordId,
          user_id: targetUserId,
          email: normalizedEmail,
          role: params.role,
          permissions: params.permissions,
          pin_code: recordPin,
          pin_generated_at: existingRecord?.pin_generated_at || new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      return {
        success: true,
        message: `Successfully assigned access for ${normalizedEmail}.`,
        pin: recordPin
      };
    } catch (err: any) {
      console.error('[assignAdminAccess] Error:', err);
      return {
        success: false,
        message: err.message || 'Failed to assign admin access in Supabase.'
      };
    }
  }

  // Local Emulation Fallback
  const registeredUsers = getLocalStorageItem<any[]>('sr_supabase_registered_users', initialRegisteredUsers);
  const matchedUser = registeredUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail);

  if (!matchedUser) {
    return {
      success: false,
      message: 'No registered SariRemit account found for this email address. Users must first register/onboard before administrative access can be assigned.'
    };
  }

  const targetUserId = matchedUser.id;
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const admins = getLocalStorageItem<SRCMCAdminAccess[]>(ADMIN_ACCESS_KEY, initialAdmins);

  const existingIdx = admins.findIndex(a => a.user_id === targetUserId || a.email.toLowerCase().trim() === normalizedEmail);
  if (existingIdx !== -1) {
    admins[existingIdx] = {
      ...admins[existingIdx],
      user_id: targetUserId,
      email: normalizedEmail,
      role: params.role,
      permissions: params.permissions,
      is_active: true,
      updated_at: new Date().toISOString()
    };
  } else {
    admins.push({
      id: `admin-${Date.now()}`,
      user_id: targetUserId,
      email: normalizedEmail,
      role: params.role,
      permissions: params.permissions,
      pin_code: pin,
      pin_generated_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  saveLocalStorageItem(ADMIN_ACCESS_KEY, admins);
  return {
    success: true,
    message: `Successfully assigned access for ${normalizedEmail}.`,
    pin: pin
  };
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


