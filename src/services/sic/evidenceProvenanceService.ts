import { supabaseClient } from '../supabaseService';
import { 
  EvidenceRecord, 
  EvidenceSubjectType, 
  EvidenceSourceType, 
  EvidenceStatusType, 
  EvidenceFreshnessStateType,
  EpeAuditLog
} from '../../types';

// Central feature flags
export const EPE_FEATURE_FLAGS = {
  ENABLE_SIC_2_EPE_PHASE_1: true,
  ENABLE_EPE_LEGACY_COMPATIBILITY: true,
  ENABLE_SRCMC_EVIDENCE_DIAGNOSTICS: true,
};

// Initial Freshness Policy
export interface EvidenceFreshnessPolicy {
  sourceType: EvidenceSourceType;
  subjectType: EvidenceSubjectType;
  freshForMinutes: number;
  agingForMinutes: number;
  staleAfterMinutes: number;
  expiresAfterMinutes?: number | null;
}

export const DEFAULT_FRESHNESS_POLICIES: EvidenceFreshnessPolicy[] = [
  {
    sourceType: 'management_verified',
    subjectType: 'exchange_rate',
    freshForMinutes: 180, // 3 hours
    agingForMinutes: 1440, // 24 hours
    staleAfterMinutes: 2880, // 48 hours
  },
  {
    sourceType: 'management_override',
    subjectType: 'exchange_rate',
    freshForMinutes: 60,
    agingForMinutes: 360,
    staleAfterMinutes: 1440,
  },
  {
    sourceType: 'community_verified',
    subjectType: 'exchange_rate',
    freshForMinutes: 120, // 2 hours
    agingForMinutes: 720, // 12 hours
    staleAfterMinutes: 1440, // 24 hours
  },
  {
    sourceType: 'community_submitted',
    subjectType: 'exchange_rate',
    freshForMinutes: 60,
    agingForMinutes: 360,
    staleAfterMinutes: 720,
  },
  {
    sourceType: 'public_reference_api',
    subjectType: 'reference_benchmark',
    freshForMinutes: 60, // 1 hour
    agingForMinutes: 360, // 6 hours
    staleAfterMinutes: 1440, // 24 hours
  },
  {
    sourceType: 'user_recorded_outcome',
    subjectType: 'transfer_outcome',
    freshForMinutes: 1440,
    agingForMinutes: 10080, // 7 days
    staleAfterMinutes: 43200, // 30 days
  },
  {
    sourceType: 'legacy_unclassified',
    subjectType: 'exchange_rate',
    freshForMinutes: 60,
    agingForMinutes: 1440,
    staleAfterMinutes: 2880,
  }
];

// Helper to access LocalStorage safe
const getLocalStorageItem = <T>(key: string, initialValue: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return initialValue;
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : initialValue;
  } catch {
    return initialValue;
  }
};

const saveLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(key, JSON.stringify(value));
};

/**
 * Calculate the unique fingerprint for deduplicating evidence records.
 */
export function generateFingerprint(input: {
  subjectType: string;
  sourceType: string;
  providerId?: string | null;
  corridorId?: string | null;
  observedAt: string;
  numericValue?: number | null;
  attachmentHash?: string | null;
}): string {
  const parts = [
    input.subjectType,
    input.sourceType,
    input.providerId || '',
    input.corridorId || '',
    new Date(input.observedAt).getTime().toString(),
    input.numericValue !== undefined && input.numericValue !== null ? input.numericValue.toFixed(4) : '',
    input.attachmentHash || ''
  ];
  return parts.join('::');
}

/**
 * Calculates permitted uses based on evidence criteria.
 */
export function derivePermittedUses(
  subjectType: EvidenceSubjectType,
  sourceType: EvidenceSourceType,
  providerSpecific: boolean
): string[] {
  const uses: string[] = ['historical_analysis'];

  if (subjectType === 'reference_benchmark') {
    uses.push('reference_benchmark', 'anomaly_detection', 'corridor_context', 'sis_confidence');
    return uses;
  }

  if (subjectType === 'transfer_outcome') {
    uses.push('performance_evaluation', 'anomaly_detection');
    return uses;
  }

  // Provider specific rates and fees
  if (providerSpecific) {
    uses.push('provider_comparison', 'sis_confidence', 'trust_evaluation', 'true_cost_calculation');
    
    // Only verified or authorised outputs drive recommendations or user-facing rates directly
    if (
      sourceType === 'management_verified' || 
      sourceType === 'management_override' || 
      sourceType === 'community_verified' || 
      sourceType === 'provider_authorized' || 
      sourceType === 'provider_published'
    ) {
      uses.push('user_facing_rate', 'recommendation');
    } else if (sourceType === 'legacy_unclassified') {
      uses.push('user_facing_rate', 'recommendation'); // support legacy continuity
    }
  }

  return uses;
}

/**
 * Calculate the freshness state based on policies.
 */
export function calculateFreshness(
  observedAtStr: string,
  subjectType: EvidenceSubjectType,
  sourceType: EvidenceSourceType,
  expiresAtStr?: string | null
): EvidenceFreshnessStateType {
  if (expiresAtStr) {
    const expiresAt = new Date(expiresAtStr).getTime();
    if (expiresAt < Date.now()) {
      return 'expired';
    }
  }

  const observedAt = new Date(observedAtStr).getTime();
  const diffMinutes = (Date.now() - observedAt) / 60000;

  if (diffMinutes < 0) return 'fresh';

  const policy = DEFAULT_FRESHNESS_POLICIES.find(
    p => p.sourceType === sourceType && p.subjectType === subjectType
  ) || DEFAULT_FRESHNESS_POLICIES.find(
    p => p.sourceType === 'legacy_unclassified'
  );

  if (!policy) return 'unknown';

  if (policy.expiresAfterMinutes && diffMinutes >= policy.expiresAfterMinutes) {
    return 'expired';
  }
  if (diffMinutes >= policy.staleAfterMinutes) {
    return 'stale';
  }
  if (diffMinutes >= policy.agingForMinutes) {
    return 'aging';
  }
  if (diffMinutes >= policy.freshForMinutes) {
    return 'aging';
  }

  return 'fresh';
}

/**
 * Validates an evidence record for logical rules.
 */
export function validateEvidence(record: Partial<EvidenceRecord>): {
  isValid: boolean;
  errors: string[];
  isComplete: boolean;
} {
  const errors: string[] = [];
  let isComplete = true;

  if (!record.subjectType) {
    errors.push('Missing subjectType');
    isComplete = false;
  }
  if (!record.sourceType) {
    errors.push('Missing sourceType');
    isComplete = false;
  }
  if (!record.observedAt) {
    errors.push('Missing observedAt timestamp');
    isComplete = false;
  }

  // Rule 2 & 15: Public reference must never be provider-specific
  if (record.subjectType === 'reference_benchmark' && record.providerSpecific) {
    errors.push('Reference benchmarks cannot be provider-specific');
    isComplete = false;
  }

  // Rule 3: Provider-specific claim must have providerId
  if (record.providerSpecific && !record.providerId) {
    errors.push('Provider-specific evidence must specify a providerId');
    isComplete = false;
  }

  // Rule 4: Corridor-specific rate must specify source & destination currency (or currencies)
  if (record.corridorSpecific) {
    if (!record.corridorId) {
      errors.push('Corridor-specific evidence must specify a corridorId');
    }
    if (record.subjectType === 'exchange_rate' && (!record.sourceCurrency || !record.destinationCurrency)) {
      errors.push('Corridor-specific exchange rate must identify source and destination currencies');
      isComplete = false;
    }
  }

  // Rule 5: Fee observation cannot have subject exchange_rate
  if (record.subjectType === 'transfer_fee' && record.numericValue !== undefined && record.numericValue !== null) {
    if (record.numericValue < 0) {
      errors.push('Transfer fees cannot be negative');
    }
  }

  if (record.subjectType === 'exchange_rate' && record.numericValue !== undefined && record.numericValue !== null) {
    if (record.numericValue <= 0) {
      errors.push('Exchange rates must be greater than zero');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    isComplete
  };
}

/**
 * Hashes an evidence file/path to identify duplicates.
 */
export function hashEvidenceAttachment(filePath: string): string {
  // Simple deterministic hash of path name for sandbox/frontend purposes
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'sha256_' + Math.abs(hash).toString(16);
}

/**
 * Evidence & Provenance Engine Service
 */
export const EpeService = {
  /**
   * Register a new evidence record. Checks for duplicates and saves to DB/LocalStorage.
   */
  async registerEvidence(input: Omit<Partial<EvidenceRecord>, 'id' | 'createdAt' | 'updatedAt'>, actorId?: string | null): Promise<EvidenceRecord> {
    const observedAt = input.observedAt || new Date().toISOString();
    const receivedAt = new Date().toISOString();
    const providerSpecific = input.providerSpecific !== undefined ? input.providerSpecific : !!input.providerId;
    const corridorSpecific = input.corridorSpecific !== undefined ? input.corridorSpecific : !!input.corridorId;

    const freshness = calculateFreshness(
      observedAt,
      input.subjectType || 'exchange_rate',
      input.sourceType || 'legacy_unclassified',
      input.expiresAt
    );

    const permittedUses = input.permittedUses || derivePermittedUses(
      input.subjectType || 'exchange_rate',
      input.sourceType || 'legacy_unclassified',
      providerSpecific
    );

    const fingerprint = input.evidence_fingerprint || generateFingerprint({
      subjectType: input.subjectType || 'exchange_rate',
      sourceType: input.sourceType || 'legacy_unclassified',
      providerId: input.providerId,
      corridorId: input.corridorId,
      observedAt,
      numericValue: input.numericValue,
      attachmentHash: input.attachmentHash
    });

    const valResult = validateEvidence({
      ...input,
      providerSpecific,
      corridorSpecific
    });

    const status: EvidenceStatusType = input.status || (valResult.isComplete ? 'active' : 'incomplete');

    const newRecord: EvidenceRecord = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subjectType: input.subjectType || 'exchange_rate',
      sourceType: input.sourceType || 'legacy_unclassified',
      status,
      providerId: input.providerId || null,
      providerCode: input.providerCode || input.providerId || null,
      corridorId: input.corridorId || null,
      sourceCurrency: input.sourceCurrency || 'SAR',
      destinationCurrency: input.destinationCurrency || null,
      numericValue: input.numericValue !== undefined ? input.numericValue : null,
      textValue: input.textValue || null,
      currency: input.currency || null,
      unit: input.unit || null,
      providerSpecific,
      corridorSpecific,
      observedAt,
      receivedAt,
      verifiedAt: input.verifiedAt || null,
      expiresAt: input.expiresAt || null,
      submittedBy: input.submittedBy || null,
      verifiedBy: input.verifiedBy || null,
      sourceName: input.sourceName || null,
      sourceReference: input.sourceReference || input.sourceRecordId || `ref-${fingerprint}`,
      sourceRecordId: input.sourceRecordId || null,
      attachmentPath: input.attachmentPath || null,
      attachmentHash: input.attachmentHash || null,
      freshnessState: freshness,
      permittedUses,
      confidenceInput: input.confidenceInput !== undefined ? input.confidenceInput : null,
      evidence_fingerprint: fingerprint,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check for fingerprint duplicates in localStorage to avoid duplicate warnings
    const localRecords = getLocalStorageItem<EvidenceRecord[]>('sr_sic_evidence_records', []);
    const existingIndex = localRecords.findIndex(r => r.evidence_fingerprint === fingerprint && r.status !== 'archived');
    
    if (existingIndex >= 0) {
      // Return existing matching record to ensure deduplication
      return localRecords[existingIndex];
    }

    // Write to Supabase if client is active
    if (supabaseClient) {
      try {
        const payload = {
          subject_type: newRecord.subjectType,
          source_type: newRecord.sourceType,
          status: newRecord.status,
          provider_id: newRecord.providerId,
          provider_code: newRecord.providerCode,
          corridor_id: newRecord.corridorId,
          source_currency: newRecord.sourceCurrency,
          destination_currency: newRecord.destinationCurrency,
          numeric_value: newRecord.numericValue,
          text_value: newRecord.textValue,
          currency: newRecord.currency,
          unit: newRecord.unit,
          provider_specific: newRecord.providerSpecific,
          corridor_specific: newRecord.corridorSpecific,
          observed_at: newRecord.observedAt,
          received_at: newRecord.receivedAt,
          verified_at: newRecord.verifiedAt,
          expires_at: newRecord.expiresAt,
          submitted_by: newRecord.submittedBy,
          verified_by: newRecord.verifiedBy,
          source_name: newRecord.sourceName,
          source_reference: newRecord.sourceReference,
          source_record_id: newRecord.sourceRecordId,
          attachment_path: newRecord.attachmentPath,
          attachment_hash: newRecord.attachmentHash,
          freshness_state: newRecord.freshnessState,
          permitted_uses: newRecord.permittedUses,
          confidence_input: newRecord.confidenceInput,
          evidence_fingerprint: newRecord.evidence_fingerprint,
          metadata: newRecord.metadata
        };

        const { data, error } = await supabaseClient
          .from('sic_evidence_records')
          .insert([payload])
          .select();

        if (!error && data && data[0]) {
          const dbRow = data[0];
          newRecord.id = dbRow.id;
        }
      } catch (err) {
        console.error('Supabase error inserting evidence record, falling back to LocalStorage', err);
      }
    }

    // Save to local storage for instant playground persistence
    saveLocalStorageItem('sr_sic_evidence_records', [newRecord, ...localRecords]);

    // Log the audit event
    await this.logAudit({
      actorId,
      evidenceId: newRecord.id,
      action: 'evidence_registered',
      newStatus: newRecord.status,
      sourceRecord: `${newRecord.sourceName}:${newRecord.sourceRecordId || ''}`
    });

    return newRecord;
  },

  /**
   * Classify legacy rates without EPE metadata into a wrapping EvidenceRecord structure.
   */
  classifyLegacyRateEvidence(input: {
    id: string;
    type: 'override' | 'submission' | 'coverage' | 'market_rate';
    corridorId: string;
    providerId: string;
    rate: number;
    fee: number;
    updatedAt: string;
    metadata?: any;
  }): EvidenceRecord {
    let subjectType: EvidenceSubjectType = 'exchange_rate';
    let sourceType: EvidenceSourceType = 'legacy_unclassified';
    let status: EvidenceStatusType = 'active';
    let providerSpecific = true;
    let corridorSpecific = true;
    let sourceCurrency = 'SAR';
    let destinationCurrency = null;

    if (input.type === 'override') {
      sourceType = 'management_override';
      status = 'verified';
    } else if (input.type === 'submission') {
      sourceType = 'community_verified';
      status = 'verified';
    } else if (input.type === 'market_rate') {
      subjectType = 'reference_benchmark';
      sourceType = 'public_reference_api';
      providerSpecific = false;
      status = 'active';
    } else if (input.type === 'coverage') {
      sourceType = 'management_verified';
      status = 'active';
    }

    const fingerprint = generateFingerprint({
      subjectType,
      sourceType,
      providerId: input.providerId,
      corridorId: input.corridorId,
      observedAt: input.updatedAt,
      numericValue: input.rate
    });

    return {
      id: `legacy-${input.type}-${input.id}`,
      subjectType,
      sourceType,
      status,
      providerId: input.providerId,
      providerCode: input.providerId,
      corridorId: input.corridorId,
      sourceCurrency,
      destinationCurrency,
      numericValue: input.rate,
      textValue: null,
      currency: 'SAR',
      unit: null,
      providerSpecific,
      corridorSpecific,
      observedAt: input.updatedAt,
      receivedAt: input.updatedAt,
      verifiedAt: input.type === 'override' || input.type === 'submission' ? input.updatedAt : null,
      expiresAt: null,
      submittedBy: null,
      verifiedBy: null,
      sourceName: input.type === 'override' ? 'rate_overrides' : (input.type === 'submission' ? 'community_rate_submissions' : 'channel_corridor_coverage'),
      sourceReference: 'legacy_compatibility_import',
      sourceRecordId: input.id,
      attachmentPath: null,
      attachmentHash: null,
      freshnessState: calculateFreshness(input.updatedAt, subjectType, sourceType),
      permittedUses: derivePermittedUses(subjectType, sourceType, providerSpecific),
      confidenceInput: null,
      evidence_fingerprint: fingerprint,
      metadata: input.metadata || {},
      createdAt: input.updatedAt,
      updatedAt: input.updatedAt
    };
  },

  /**
   * Retrieves all evidence records (with Supabase sync & LocalStorage fallback).
   */
  async getAllEvidence(): Promise<EvidenceRecord[]> {
    let dbRecords: EvidenceRecord[] = [];
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('sic_evidence_records')
          .select('*')
          .order('observed_at', { ascending: false });

        if (!error && data) {
          dbRecords = data.map((row: any) => ({
            id: row.id,
            subjectType: row.subject_type,
            sourceType: row.source_type,
            status: row.status,
            providerId: row.provider_id,
            providerCode: row.provider_code,
            corridorId: row.corridor_id,
            sourceCurrency: row.source_currency,
            destinationCurrency: row.destination_currency,
            numericValue: row.numeric_value ? parseFloat(row.numeric_value) : null,
            textValue: row.text_value,
            currency: row.currency,
            unit: row.unit,
            providerSpecific: row.provider_specific,
            corridorSpecific: row.corridor_specific,
            observedAt: row.observed_at,
            receivedAt: row.received_at,
            verifiedAt: row.verified_at,
            expiresAt: row.expires_at,
            submittedBy: row.submitted_by,
            verifiedBy: row.verified_by,
            sourceName: row.source_name,
            sourceReference: row.source_reference || row.source_record_id || `db-ref-${row.id}`,
            sourceRecordId: row.source_record_id,
            attachmentPath: row.attachment_path,
            attachmentHash: row.attachment_hash,
            freshnessState: row.freshness_state,
            permittedUses: row.permitted_uses || [],
            confidenceInput: row.confidence_input ? parseFloat(row.confidence_input) : null,
            evidence_fingerprint: row.evidence_fingerprint,
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
        }
      } catch (err) {
        console.error('Error fetching evidence records from Supabase', err);
      }
    }

    const localRecords = getLocalStorageItem<EvidenceRecord[]>('sr_sic_evidence_records', []);
    
    // Merge DB and Local records cleanly (DB records take priority if conflict on ID)
    const mergedMap = new Map<string, EvidenceRecord>();
    localRecords.forEach(r => mergedMap.set(r.id, r));
    dbRecords.forEach(r => mergedMap.set(r.id, r));

    const merged = Array.from(mergedMap.values());
    
    // Dynamically recalculate freshness upon fetching
    return merged.map(r => ({
      ...r,
      freshnessState: calculateFreshness(r.observedAt, r.subjectType, r.sourceType, r.expiresAt)
    }));
  },

  /**
   * Transition an evidence status.
   */
  async transitionStatus(id: string, newStatus: EvidenceStatusType, actorId?: string | null, reason?: string | null): Promise<EvidenceRecord | null> {
    const records = await this.getAllEvidence();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    const record = records[index];
    const previousStatus = record.status;
    
    record.status = newStatus;
    record.updatedAt = new Date().toISOString();
    
    if (newStatus === 'verified') {
      record.verifiedAt = new Date().toISOString();
      record.verifiedBy = actorId || null;
    }

    if (supabaseClient) {
      try {
        const updatePayload: any = {
          status: newStatus,
          updated_at: record.updatedAt
        };
        if (newStatus === 'verified') {
          updatePayload.verified_at = record.verifiedAt;
          updatePayload.verified_by = record.verifiedBy;
        }

        await supabaseClient
          .from('sic_evidence_records')
          .update(updatePayload)
          .eq('id', id);
      } catch (err) {
        console.error('Error transitioning status in Supabase', err);
      }
    }

    const localList = getLocalStorageItem<EvidenceRecord[]>('sr_sic_evidence_records', []);
    const localIdx = localList.findIndex(r => r.id === id);
    if (localIdx >= 0) {
      localList[localIdx] = record;
      saveLocalStorageItem('sr_sic_evidence_records', localList);
    } else {
      saveLocalStorageItem('sr_sic_evidence_records', [record, ...localList]);
    }

    // Log audit event
    await this.logAudit({
      actorId,
      evidenceId: id,
      action: `evidence_${newStatus}`,
      previousStatus,
      newStatus,
      reason
    });

    return record;
  },

  async verifyEvidence(id: string, actorId?: string | null): Promise<EvidenceRecord | null> {
    return this.transitionStatus(id, 'verified', actorId, 'CRVS Administrative Verification');
  },

  async rejectEvidence(id: string, reason?: string | null, actorId?: string | null): Promise<EvidenceRecord | null> {
    return this.transitionStatus(id, 'rejected', actorId, reason || 'Rejected by administrator');
  },

  async revokeEvidence(id: string, reason?: string | null, actorId?: string | null): Promise<EvidenceRecord | null> {
    return this.transitionStatus(id, 'revoked', actorId, reason || 'Revoked due to integrity or compliance guidelines');
  },

  async markEvidenceIncomplete(id: string, actorId?: string | null): Promise<EvidenceRecord | null> {
    return this.transitionStatus(id, 'incomplete', actorId, 'Provenance parameters missing or unverified');
  },

  async supersedeEvidence(previousId: string, replacementId: string, actorId?: string | null): Promise<void> {
    await this.transitionStatus(previousId, 'superseded', actorId, `Superseded by replacement record ID: ${replacementId}`);
    
    // Create an audit trace log link
    await this.logAudit({
      actorId,
      evidenceId: previousId,
      action: 'evidence_superseded',
      reason: `Replaced by ${replacementId}`
    });
  },

  async linkEvidenceToSourceRecord(evidenceId: string, sourceName: string, sourceRecordId: string, actorId?: string | null): Promise<EvidenceRecord | null> {
    const records = await this.getAllEvidence();
    const record = records.find(r => r.id === evidenceId);
    if (!record) return null;

    record.sourceName = sourceName;
    record.sourceRecordId = sourceRecordId;
    record.updatedAt = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient
          .from('sic_evidence_records')
          .update({
            source_name: sourceName,
            source_record_id: sourceRecordId,
            updated_at: record.updatedAt
          })
          .eq('id', evidenceId);
      } catch (err) {
        console.error('Error linking source in Supabase', err);
      }
    }

    const localList = getLocalStorageItem<EvidenceRecord[]>('sr_sic_evidence_records', []);
    const localIdx = localList.findIndex(r => r.id === evidenceId);
    if (localIdx >= 0) {
      localList[localIdx] = record;
      saveLocalStorageItem('sr_sic_evidence_records', localList);
    }

    await this.logAudit({
      actorId,
      evidenceId,
      action: 'evidence_linked',
      reason: `Linked to ${sourceName}:${sourceRecordId}`
    });

    return record;
  },

  /**
   * Log an EPE audit trail event.
   */
  async logAudit(log: Omit<EpeAuditLog, 'id' | 'timestamp'>): Promise<EpeAuditLog> {
    const newLog: EpeAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...log
    };

    if (supabaseClient) {
      try {
        // We write to standard system audit logs table or srcmc_audit_logs if it exists
        await supabaseClient
          .from('srcmc_audit_logs')
          .insert([{
            action_type: log.action,
            details: `Evidence ID: ${log.evidenceId}. Prev: ${log.previousStatus || 'N/A'}, New: ${log.newStatus || 'N/A'}. Reason: ${log.reason || 'N/A'}`,
            admin_email: log.actorId || 'system_epe',
            created_at: newLog.timestamp
          }]);
      } catch (err) {
        // Safe console swallow, logging fallback
      }
    }

    const localAudits = getLocalStorageItem<EpeAuditLog[]>('sr_sic_evidence_audits', []);
    saveLocalStorageItem('sr_sic_evidence_audits', [newLog, ...localAudits.slice(0, 99)]);
    return newLog;
  },

  async getAuditLogs(): Promise<EpeAuditLog[]> {
    return getLocalStorageItem<EpeAuditLog[]>('sr_sic_evidence_audits', []);
  },

  /**
   * Get filtered evidence list for dashboard decisioning based on corridor context.
   */
  async getEvidenceForSicInput(corridorId: string): Promise<EvidenceRecord[]> {
    const all = await this.getAllEvidence();
    return all.filter(r => 
      r.corridorId === corridorId && 
      (r.status === 'active' || r.status === 'verified')
    );
  }
};
