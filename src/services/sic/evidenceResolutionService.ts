import { supabaseClient } from '../supabaseService';
import { EpeService } from './evidenceProvenanceService';
import { 
  EvidenceRecord, 
  ResolutionContext, 
  EligibilityResult, 
  EvidenceQualityProfile, 
  ResolutionPolicy, 
  ResolutionResult, 
  OperationalDecisionPackage, 
  EvidenceConflict,
  EpeAuditLog
} from '../../types';

// Central Rollout Feature Flags for Phase 2
export const ERDE_FEATURE_FLAGS = {
  ENABLE_ERDE_PHASE_2: true,
  ENABLE_ERDE_SHADOW_MODE: true,
  ENABLE_ERDE_OPERATIONAL_MODE: false, // Starts in shadow, toggled by admin
  ENABLE_ERDE_CONFLICT_REGISTRY: true,
  ENABLE_ERDE_POLICY_MANAGEMENT: true,
  ENABLE_ERDE_RESOLUTION_HISTORY: true,
  ENABLE_ERDE_USER_EXPLAINABILITY: true,
};

// Default Policies
export const DEFAULT_RESOLUTION_POLICIES: ResolutionPolicy[] = [
  {
    policyId: 'sic-balanced-v1',
    name: 'SIC Balanced Resolution Policy v1',
    description: 'Initial secure policy. Prefers valid overrides, highly verified provider sources, and fresh corroborated evidence. Safeguards against unverified claims.',
    version: 1,
    status: 'active',
    preserveManagementOverridePriority: true,
    minimumQualityScore: 40,
    requireVerifiedEvidence: false,
    requireProviderSpecificityForRecommendation: true,
    requireCorridorMatch: true,
    rejectExpiredEvidence: true,
    allowAgingEvidence: true,
    allowUnknownFreshness: false,
    allowLegacyFallback: true,
    weights: {
      verificationQuality: 25,
      freshnessQuality: 20,
      sourceAuthority: 20,
      providerSpecificity: 15,
      corridorSpecificity: 10,
      provenanceCompleteness: 5,
      attachmentSupport: 5,
      corroborationQuality: 0,
      consistencyQuality: 0,
    },
    conflictThresholds: {
      minorPercentage: 0.5,
      moderatePercentage: 1.5,
      majorPercentage: 3.5,
      criticalPercentage: 5.0,
    },
    tieBreakerOrder: [
      'management_override',
      'quality_score',
      'provider_specific',
      'corridor_specific',
      'verified_status',
      'observation_time',
      'provenance_completeness',
      'stable_id'
    ],
    createdAt: '2026-07-19T00:00:00Z',
    updatedAt: '2026-07-19T00:00:00Z',
    createdBy: 'system'
  },
  {
    policyId: 'sic-strict-v1',
    name: 'SIC High-Trust Strict Policy v1',
    description: 'Highly conservative policy. Rejects unverified, aging, or non-specific provider evidence. Requires critical conflict blocking.',
    version: 1,
    status: 'draft',
    preserveManagementOverridePriority: true,
    minimumQualityScore: 60,
    requireVerifiedEvidence: true,
    requireProviderSpecificityForRecommendation: true,
    requireCorridorMatch: true,
    rejectExpiredEvidence: true,
    allowAgingEvidence: false,
    allowUnknownFreshness: false,
    allowLegacyFallback: false,
    weights: {
      verificationQuality: 35,
      freshnessQuality: 15,
      sourceAuthority: 20,
      providerSpecificity: 15,
      corridorSpecificity: 5,
      provenanceCompleteness: 5,
      attachmentSupport: 5,
      corroborationQuality: 0,
      consistencyQuality: 0,
    },
    conflictThresholds: {
      minorPercentage: 0.2,
      moderatePercentage: 1.0,
      majorPercentage: 2.0,
      criticalPercentage: 3.0,
    },
    tieBreakerOrder: [
      'management_override',
      'quality_score',
      'provider_specific',
      'verified_status',
      'observation_time',
      'stable_id'
    ],
    createdAt: '2026-07-19T00:00:00Z',
    updatedAt: '2026-07-19T00:00:00Z',
    createdBy: 'system'
  }
];

// LocalStorage helpers
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

export const EdeService = {
  // --- POLICY MANAGEMENT ---
  async getPolicies(): Promise<ResolutionPolicy[]> {
    const local = getLocalStorageItem<ResolutionPolicy[]>('sr_sic_resolution_policies', []);
    if (local.length === 0) {
      saveLocalStorageItem('sr_sic_resolution_policies', DEFAULT_RESOLUTION_POLICIES);
      return DEFAULT_RESOLUTION_POLICIES;
    }
    return local;
  },

  async getActivePolicy(): Promise<ResolutionPolicy> {
    const policies = await this.getPolicies();
    const active = policies.find(p => p.status === 'active');
    return active || policies[0] || DEFAULT_RESOLUTION_POLICIES[0];
  },

  async savePolicy(policy: ResolutionPolicy, actorEmail: string): Promise<ResolutionPolicy> {
    const policies = await this.getPolicies();
    
    // Deactivate previous active policies if this is active
    if (policy.status === 'active') {
      policies.forEach(p => {
        if (p.policyId !== policy.policyId && p.status === 'active') {
          p.status = 'inactive';
          p.updatedAt = new Date().toISOString();
        }
      });
    }

    const idx = policies.findIndex(p => p.policyId === policy.policyId && p.version === policy.version);
    if (idx >= 0) {
      policies[idx] = {
        ...policy,
        updatedAt: new Date().toISOString(),
        createdBy: actorEmail
      };
    } else {
      policies.push({
        ...policy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorEmail
      });
    }

    saveLocalStorageItem('sr_sic_resolution_policies', policies);
    
    // Sync to Supabase if available
    if (supabaseClient) {
      try {
        await supabaseClient
          .from('sic_resolution_policies')
          .upsert([{
            policy_id: policy.policyId,
            name: policy.name,
            description: policy.description,
            version: policy.version,
            status: policy.status,
            preserve_management_override_priority: policy.preserveManagementOverridePriority,
            minimum_quality_score: policy.minimumQualityScore,
            require_verified_evidence: policy.requireVerifiedEvidence,
            require_provider_specificity_for_recommendation: policy.requireProviderSpecificityForRecommendation,
            require_corridor_match: policy.requireCorridorMatch,
            reject_expired_evidence: policy.rejectExpiredEvidence,
            allow_aging_evidence: policy.allowAgingEvidence,
            allow_unknown_freshness: policy.allowUnknownFreshness,
            allow_legacy_fallback: policy.allowLegacyFallback,
            weights: policy.weights,
            conflict_thresholds: policy.conflictThresholds,
            tie_breaker_order: policy.tieBreakerOrder,
            created_by: actorEmail,
            updated_at: new Date().toISOString()
          }]);
      } catch (err) {
        console.error('Error saving policy to Supabase:', err);
      }
    }

    await EpeService.logAudit({
      actorId: actorEmail,
      evidenceId: policy.policyId,
      action: 'policy_saved',
      reason: `Saved/updated policy ${policy.name} (v${policy.version})`
    });

    return policy;
  },

  async rollbackPolicy(policyId: string, version: number, actorEmail: string): Promise<ResolutionPolicy | null> {
    const policies = await this.getPolicies();
    const target = policies.find(p => p.policyId === policyId && p.version === version);
    if (!target) return null;

    policies.forEach(p => {
      p.status = p.policyId === policyId && p.version === version ? 'active' : 'inactive';
      p.updatedAt = new Date().toISOString();
    });

    saveLocalStorageItem('sr_sic_resolution_policies', policies);

    await EpeService.logAudit({
      actorId: actorEmail,
      evidenceId: policyId,
      action: 'policy_rollback',
      reason: `Rolled back active policy to ${target.name} version ${version}`
    });

    return target;
  },

  // --- CONCONTEXT BUILDER ---
  buildContext(input: Omit<ResolutionContext, 'contextId' | 'requestedAt'>): ResolutionContext {
    return {
      contextId: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: new Date().toISOString(),
      ...input
    };
  },

  // --- CANDIDATE DISCOVERY ---
  async discoverCandidates(context: ResolutionContext, mockEvidenceList?: EvidenceRecord[]): Promise<EvidenceRecord[]> {
    const allEvidence = mockEvidenceList || await EpeService.getAllEvidence();
    
    // Discovery step filters basically on matching the domain attributes
    return allEvidence.filter(e => {
      // 1. Subject Type must match
      if (e.subjectType !== context.subjectType) return false;

      // 2. Currency matches
      if (e.sourceCurrency !== context.sourceCurrency || e.destinationCurrency !== context.destinationCurrency) return false;

      // 3. Corridor matches
      if (context.corridorId && e.corridorId !== context.corridorId) return false;

      return true;
    });
  },

  // --- ELIGIBILITY ENGINE ---
  evaluateEvidenceEligibility(evidence: EvidenceRecord, context: ResolutionContext, policy: ResolutionPolicy): EligibilityResult {
    const exclusionCodes: string[] = [];
    const warnings: string[] = [];

    // status validation
    if (evidence.status === 'rejected') exclusionCodes.push('STATUS_REJECTED');
    if (evidence.status === 'revoked') exclusionCodes.push('STATUS_REVOKED');
    if (evidence.status === 'archived') exclusionCodes.push('STATUS_ARCHIVED');
    if (evidence.status === 'incomplete') exclusionCodes.push('STATUS_INCOMPLETE');

    // Permitted use matching
    if (!evidence.permittedUses.includes(context.requestedPermittedUse)) {
      exclusionCodes.push('PERMITTED_USE_NOT_ALLOWED');
    }

    // Expiry policies
    if (policy.rejectExpiredEvidence && (evidence.freshnessState === 'expired' || (evidence.expiresAt && new Date(evidence.expiresAt).getTime() < Date.now()))) {
      exclusionCodes.push('EVIDENCE_EXPIRED');
    }

    // Aging rules
    if (!policy.allowAgingEvidence && evidence.freshnessState === 'aging') {
      exclusionCodes.push('AGING_EVIDENCE_REJECTED_BY_POLICY');
    }

    // Unknown freshness
    if (!policy.allowUnknownFreshness && evidence.freshnessState === 'unknown') {
      exclusionCodes.push('UNKNOWN_FRESHNESS_REJECTED_BY_POLICY');
    }

    // Verification requirements
    if (policy.requireVerifiedEvidence && evidence.status !== 'verified' && evidence.status !== 'active') {
      exclusionCodes.push('UNVERIFIED_EVIDENCE_REJECTED_BY_POLICY');
    }

    // Corridor specificity matches
    if (policy.requireCorridorMatch && context.corridorId && evidence.corridorId !== context.corridorId) {
      exclusionCodes.push('CORRIDOR_MISMATCH');
    }

    // Provider Specific constraints
    if (context.providerId) {
      // If we seek a provider offer, we must not use global corridor benchmarks
      if (evidence.subjectType === 'reference_benchmark') {
        exclusionCodes.push('BENCHMARK_CANNOT_BE_PROVIDER_OFFER');
      }

      // Exact provider matching
      if (evidence.providerSpecific) {
        const provCode = (evidence.providerCode || evidence.providerId || '').toLowerCase();
        const searchCode = context.providerId.toLowerCase();
        if (provCode !== searchCode) {
          exclusionCodes.push('PROVIDER_MISMATCH');
        }
      } else {
        exclusionCodes.push('NON_PROVIDER_SPECIFIC_EVIDENCE_IN_PROVIDER_CONTEXT');
      }
    }

    // Required numeric value check
    if (evidence.numericValue === undefined || evidence.numericValue === null || isNaN(evidence.numericValue)) {
      exclusionCodes.push('INVALID_NUMERIC_VALUE');
    }

    // Failed integrity
    if (evidence.metadata?.integrity_failed === true) {
      exclusionCodes.push('FAILED_INTEGRITY_VALIDATION');
    }

    return {
      eligible: exclusionCodes.length === 0,
      exclusionCodes,
      warnings
    };
  },

  // --- EVIDENCE QUALITY PROFILER ---
  evaluateEvidenceQuality(
    evidence: EvidenceRecord, 
    context: ResolutionContext, 
    policy: ResolutionPolicy,
    allCandidates: EvidenceRecord[]
  ): EvidenceQualityProfile {
    const contributingFactors: string[] = [];
    const limitations: string[] = [];

    // Calculate score for each factor (0-100)
    
    // 1. Verification Quality
    let vScore = 30;
    if (evidence.status === 'verified') {
      vScore = 100;
      contributingFactors.push('Formally verified by administration');
    } else if (evidence.status === 'active') {
      vScore = 80;
      contributingFactors.push('Active operational evidence');
    } else if (evidence.sourceType === 'management_override') {
      vScore = 100;
      contributingFactors.push('Management administrative override authoritative');
    } else {
      limitations.push('Lacks formal administrative verification');
    }

    // 2. Freshness Quality
    let fScore = 0;
    if (evidence.freshnessState === 'fresh') {
      fScore = 100;
      contributingFactors.push('Extremely fresh observation');
    } else if (evidence.freshnessState === 'aging') {
      fScore = 65;
      contributingFactors.push('Aging within safe threshold');
    } else if (evidence.freshnessState === 'stale') {
      fScore = 20;
      limitations.push('Stale data, high degradation risk');
    } else {
      fScore = 40;
    }

    // 3. Source Authority
    let authScore = 30;
    const sType = evidence.sourceType;
    if (sType === 'management_override') {
      authScore = 100;
    } else if (sType === 'management_verified') {
      authScore = 95;
    } else if (sType === 'provider_authorized' || sType === 'provider_published') {
      authScore = 90;
    } else if (sType === 'community_verified') {
      authScore = 75;
    } else if (sType === 'public_reference_api') {
      authScore = 60;
    } else if (sType === 'community_submitted') {
      authScore = 45;
    } else if (sType === 'legacy_unclassified') {
      authScore = 40;
    }

    // 4. Provider Specificity
    const pScore = evidence.providerSpecific ? 100 : 40;
    if (evidence.providerSpecific) contributingFactors.push('Provider-specific matching');

    // 5. Corridor Specificity
    const cScore = evidence.corridorSpecific ? 100 : 50;
    if (evidence.corridorSpecific) contributingFactors.push('Corridor-specific matching');

    // 6. Provenance Completeness
    let compScore = 100;
    const missing = [];
    if (!evidence.providerCode) missing.push('provider');
    if (!evidence.observedAt) missing.push('observed_at');
    if (!evidence.sourceName) missing.push('source');
    if (missing.length > 0) {
      compScore = Math.max(20, 100 - missing.length * 25);
      limitations.push(`Missing metadata fields: ${missing.join(', ')}`);
    } else {
      contributingFactors.push('Fully described provenance trail');
    }

    // 7. Attachment Support
    const aScore = (evidence.attachmentPath || evidence.attachmentHash) ? 100 : 0;
    if (aScore > 0) contributingFactors.push('Accompanied by verified screens/documents');

    // 8. Corroboration Quality (agreement with other active evidence of similar type)
    let corrScore = 50;
    const sameSubjectCandidates = allCandidates.filter(c => 
      c.id !== evidence.id && 
      c.providerCode === evidence.providerCode && 
      c.subjectType === evidence.subjectType &&
      c.status === 'verified' &&
      c.numericValue !== null && c.numericValue !== undefined
    );
    if (sameSubjectCandidates.length > 0 && evidence.numericValue !== null && evidence.numericValue !== undefined) {
      const matchingCount = sameSubjectCandidates.filter(c => {
        const diff = Math.abs((c.numericValue || 0) - (evidence.numericValue || 0));
        const pct = (diff / (evidence.numericValue || 1)) * 100;
        return pct < 1.0; // Within 1% variance
      }).length;
      if (matchingCount > 0) {
        corrScore = 100;
        contributingFactors.push(`Corroborated by ${matchingCount} independent sources`);
      } else {
        corrScore = 30;
        limitations.push('Isolated observation lacking corroboration');
      }
    }

    // 9. Consistency Quality
    const consScore = 80;

    // Weight application
    const w = policy.weights;
    const sumWeights = 
      (w.verificationQuality || 0) +
      (w.freshnessQuality || 0) +
      (w.sourceAuthority || 0) +
      (w.providerSpecificity || 0) +
      (w.corridorSpecificity || 0) +
      (w.provenanceCompleteness || 0) +
      (w.attachmentSupport || 0) +
      (w.corroborationQuality || 0) +
      (w.consistencyQuality || 0);

    const totalWeightedScore = 
      (vScore * (w.verificationQuality || 0)) +
      (fScore * (w.freshnessQuality || 0)) +
      (authScore * (w.sourceAuthority || 0)) +
      (pScore * (w.providerSpecificity || 0)) +
      (cScore * (w.corridorSpecificity || 0)) +
      (compScore * (w.provenanceCompleteness || 0)) +
      (aScore * (w.attachmentSupport || 0)) +
      (corrScore * (w.corroborationQuality || 0)) +
      (consScore * (w.consistencyQuality || 0));

    const finalScore = sumWeights > 0 ? Math.round(totalWeightedScore / sumWeights) : 50;

    let qualityBand: "very_high" | "high" | "moderate" | "low" | "unusable" = "moderate";
    if (finalScore >= 85) qualityBand = "very_high";
    else if (finalScore >= 70) qualityBand = "high";
    else if (finalScore >= 50) qualityBand = "moderate";
    else if (finalScore >= 30) qualityBand = "low";
    else qualityBand = "unusable";

    return {
      verificationQuality: vScore,
      freshnessQuality: fScore,
      sourceAuthority: authScore,
      providerSpecificity: pScore,
      corridorSpecificity: cScore,
      provenanceCompleteness: compScore,
      attachmentSupport: aScore,
      corroborationQuality: corrScore,
      consistencyQuality: consScore,
      operationalEligibility: finalScore >= policy.minimumQualityScore ? 100 : 0,
      totalQualityScore: finalScore,
      qualityBand,
      contributingFactors,
      limitations
    };
  },

  // --- CONFLICT DETECTOR ---
  async detectEvidenceConflicts(
    eligibleCandidates: EvidenceRecord[], 
    context: ResolutionContext, 
    policy: ResolutionPolicy
  ): Promise<EvidenceConflict[]> {
    const conflicts: EvidenceConflict[] = [];

    // Compare pairs of eligible candidates
    if (eligibleCandidates.length < 2) return [];

    // Compare matching parameters
    const subType = context.subjectType;
    const threshold = policy.conflictThresholds || { minorPercentage: 0.5, moderatePercentage: 1.5, majorPercentage: 3.5, criticalPercentage: 5.0 };

    for (let i = 0; i < eligibleCandidates.length; i++) {
      for (let j = i + 1; j < eligibleCandidates.length; j++) {
        const c1 = eligibleCandidates[i];
        const c2 = eligibleCandidates[j];

        // Ensure we are comparing same subject & provider specificity
        if (c1.providerCode !== c2.providerCode) continue;

        const val1 = c1.numericValue || 0;
        const val2 = c2.numericValue || 0;

        if (val1 === 0 && val2 === 0) continue;

        // Structural check: different currencies or direction
        if (c1.sourceCurrency !== c2.sourceCurrency || c1.destinationCurrency !== c2.destinationCurrency) {
          const conflictId = `conf-struct-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          conflicts.push({
            id: conflictId,
            conflictKey: `${subType}::${context.corridorId}::structural`,
            providerId: c1.providerId,
            corridorId: context.corridorId,
            sourceCurrency: context.sourceCurrency,
            destinationCurrency: context.destinationCurrency,
            subjectType: subType,
            severity: 'structural_conflict',
            status: 'open',
            evidenceIds: [c1.id, c2.id],
            absoluteDifference: 0,
            percentageDifference: 100,
            estimatedRecipientImpact: 0,
            detectionReason: `Structural currency mismatch between candidates ${c1.id} (${c1.sourceCurrency}) and ${c2.id} (${c2.sourceCurrency})`,
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          continue;
        }

        const avg = (val1 + val2) / 2;
        const absDiff = Math.abs(val1 - val2);
        const pctDiff = (absDiff / avg) * 100;

        let severity: "no_conflict" | "minor_variance" | "moderate_variance" | "major_conflict" | "critical_conflict" = "no_conflict";

        if (pctDiff >= threshold.criticalPercentage) {
          severity = 'critical_conflict';
        } else if (pctDiff >= threshold.majorPercentage) {
          severity = 'major_conflict';
        } else if (pctDiff >= threshold.moderatePercentage) {
          severity = 'moderate_variance';
        } else if (pctDiff >= threshold.minorPercentage) {
          severity = 'minor_variance';
        }

        if (severity !== 'no_conflict') {
          const conflictId = `conf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const sendAmt = context.sendAmount || 1000;
          const estimatedImpact = sendAmt * absDiff;

          const conflict: EvidenceConflict = {
            id: conflictId,
            conflictKey: `${subType}::${c1.providerCode || 'global'}::variance`,
            providerId: c1.providerId,
            corridorId: context.corridorId,
            sourceCurrency: context.sourceCurrency,
            destinationCurrency: context.destinationCurrency,
            subjectType: subType,
            severity,
            status: 'open',
            evidenceIds: [c1.id, c2.id],
            absoluteDifference: absDiff,
            percentageDifference: pctDiff,
            estimatedRecipientImpact: estimatedImpact,
            detectionReason: `Numeric variance of ${pctDiff.toFixed(2)}% found between ${c1.sourceType} (${val1}) and ${c2.sourceType} (${val2})`,
            detectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          conflicts.push(conflict);

          // Persist to local registry
          const localConflicts = getLocalStorageItem<EvidenceConflict[]>('sr_sic_evidence_conflicts', []);
          const existingIdx = localConflicts.findIndex(x => x.conflictKey === conflict.conflictKey && x.status === 'open');
          if (existingIdx === -1) {
            saveLocalStorageItem('sr_sic_evidence_conflicts', [conflict, ...localConflicts]);
            
            // Log to Supabase conflict table if it exists
            if (supabaseClient) {
              try {
                await supabaseClient
                  .from('sic_evidence_conflicts')
                  .insert([{
                    id: conflict.id,
                    conflict_key: conflict.conflictKey,
                    provider_id: conflict.providerId,
                    corridor_id: conflict.corridorId,
                    source_currency: conflict.sourceCurrency,
                    destination_currency: conflict.destinationCurrency,
                    subject_type: conflict.subjectType,
                    severity: conflict.severity,
                    status: conflict.status,
                    evidence_ids: conflict.evidenceIds,
                    absolute_difference: conflict.absoluteDifference,
                    percentage_difference: conflict.percentageDifference,
                    estimated_recipient_impact: conflict.estimatedRecipientImpact,
                    detection_reason: conflict.detectionReason,
                    detected_at: conflict.createdAt
                  }]);
              } catch (err) {
                // safer swallow
              }
            }
          }
        }
      }
    }

    return conflicts;
  },

  // --- RESOLUTION SELECTOR ---
  async resolveEvidence(context: ResolutionContext, policyId?: string, mockEvidenceList?: EvidenceRecord[]): Promise<ResolutionResult> {
    const resolutionId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const policies = await this.getPolicies();
    const policy = policies.find(p => p.policyId === policyId) || await this.getActivePolicy();

    const result: ResolutionResult = {
      resolutionId,
      context,
      status: 'unresolved',
      candidateEvidenceIds: [],
      eligibleEvidenceIds: [],
      excludedEvidence: [],
      nonSelectedEvidence: [],
      conflictIds: [],
      resolutionPolicyId: policy.policyId,
      resolutionPolicyVersion: policy.version,
      resolutionReasonCode: 'UNRESOLVED',
      resolutionReasonUserFacing: 'Evidence resolution pending.',
      resolutionReasonInternal: 'Initial state before candidate execution.',
      warnings: [],
      generatedAt: new Date().toISOString()
    };

    try {
      // 1. Discover candidates
      const rawCandidates = await this.discoverCandidates(context, mockEvidenceList);
      result.candidateEvidenceIds = rawCandidates.map(c => c.id);

      if (rawCandidates.length === 0) {
        result.status = 'insufficient_evidence';
        result.resolutionReasonCode = 'NO_VALID_CANDIDATES';
        result.resolutionReasonUserFacing = 'SariRemit does not currently have enough verified provider-specific information to recommend this option confidently.';
        result.resolutionReasonInternal = 'No candidate evidence discovered for the specified subject/corridor route.';
        return result;
      }

      // 2. Evaluate eligibility
      const eligibleList: EvidenceRecord[] = [];
      const eligibilityProfiles = rawCandidates.map(c => {
        const elig = this.evaluateEvidenceEligibility(c, context, policy);
        if (elig.eligible) {
          eligibleList.push(c);
          result.eligibleEvidenceIds.push(c.id);
        } else {
          result.excludedEvidence.push({
            evidenceId: c.id,
            reasons: elig.exclusionCodes
          });
        }
        return { candidateId: c.id, eligibility: elig };
      });

      if (eligibleList.length === 0) {
        result.status = 'insufficient_evidence';
        result.resolutionReasonCode = 'NO_ELIGIBLE_CANDIDATES';
        result.resolutionReasonUserFacing = 'SariRemit does not currently have enough verified provider-specific information to recommend this option confidently.';
        result.resolutionReasonInternal = 'Candidates were found but all were marked ineligible based on constraints or policy rules.';
        return result;
      }

      // 3. Detect conflicts
      const conflicts = await this.detectEvidenceConflicts(eligibleList, context, policy);
      result.conflictIds = conflicts.map(conf => conf.id);
      
      const hasCriticalConflict = conflicts.some(c => c.severity === 'critical_conflict' || c.severity === 'structural_conflict');
      const hasMajorConflict = conflicts.some(c => c.severity === 'major_conflict');

      if (conflicts.length > 0) {
        result.conflictSeverity = hasCriticalConflict ? 'critical' : (hasMajorConflict ? 'major' : 'minor');
      }

      // 4. Override priority handling
      const activeOverrides = eligibleList.filter(c => c.sourceType === 'management_override' && c.status === 'active');
      if (policy.preserveManagementOverridePriority && activeOverrides.length > 0) {
        // Evaluate freshness, but since management override overrides, we select it deterministically!
        // Rank by observation time among active overrides
        activeOverrides.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
        const selected = activeOverrides[0];
        const profile = this.evaluateEvidenceQuality(selected, context, policy, eligibleList);

        result.status = 'resolved';
        result.selectedEvidenceId = selected.id;
        result.selectedValue = selected.numericValue;
        result.selectedCurrency = selected.currency || selected.destinationCurrency || null;
        result.selectedSourceType = selected.sourceType;
        result.selectedQualityProfile = profile;
        result.resolutionReasonCode = 'ACTIVE_MANAGEMENT_OVERRIDE_SELECTED';
        result.resolutionReasonUserFacing = 'This comparison uses an active rate verified by SariRemit management.';
        result.resolutionReasonInternal = 'Selected highly authoritative active administrative rate override based on policy priority guidelines.';
        
        // Populate nonselected
        eligibleList.forEach(e => {
          if (e.id !== selected.id) {
            result.nonSelectedEvidence.push({
              evidenceId: e.id,
              reasonCodes: ['ADMIN_OVERRIDE_PRECEDENCE']
            });
          }
        });

        // Save snapshot & return
        await this.persistResolutionRecord(result);
        return result;
      }

      // 5. Critical Conflict blocking
      if (hasCriticalConflict) {
        result.status = 'blocked_by_conflict';
        result.resolutionReasonCode = 'BLOCKED_BY_CRITICAL_CONFLICT';
        result.resolutionReasonUserFacing = 'Recent sources differ more than expected. Review the provider’s final rate before sending.';
        result.resolutionReasonInternal = 'ERDE selection engine blocked due to outstanding critical variance or structural integrity conflicts.';
        await this.persistResolutionRecord(result);
        return result;
      }

      // 6. Rank candidates
      const candidatesWithScores = eligibleList.map(c => {
        const qProfile = this.evaluateEvidenceQuality(c, context, policy, eligibleList);
        return { c, qProfile };
      });

      // Filter on minimum quality score
      const passingCandidates = candidatesWithScores.filter(item => item.qProfile.totalQualityScore >= policy.minimumQualityScore);
      
      if (passingCandidates.length === 0) {
        result.status = 'insufficient_evidence';
        result.resolutionReasonCode = 'ALTERNATIVES_LOWER_QUALITY';
        result.resolutionReasonUserFacing = 'SariRemit does not currently have enough verified provider-specific information to recommend this option confidently.';
        result.resolutionReasonInternal = 'No candidate achieved the minimum required quality score specified by the current active policy.';
        await this.persistResolutionRecord(result);
        return result;
      }

      // Execute ranking algorithm using tieBreakerOrder
      passingCandidates.sort((itemA, itemB) => {
        for (const rule of policy.tieBreakerOrder) {
          if (rule === 'management_override') {
            const isA = itemA.c.sourceType === 'management_override';
            const isB = itemB.c.sourceType === 'management_override';
            if (isA && !isB) return -1;
            if (!isA && isB) return 1;
          }
          if (rule === 'quality_score') {
            const diff = itemB.qProfile.totalQualityScore - itemA.qProfile.totalQualityScore;
            if (Math.abs(diff) > 0) return diff;
          }
          if (rule === 'provider_specific') {
            const isA = itemA.c.providerSpecific;
            const isB = itemB.c.providerSpecific;
            if (isA && !isB) return -1;
            if (!isA && isB) return 1;
          }
          if (rule === 'corridor_specific') {
            const isA = itemA.c.corridorSpecific;
            const isB = itemB.c.corridorSpecific;
            if (isA && !isB) return -1;
            if (!isA && isB) return 1;
          }
          if (rule === 'verified_status') {
            const isA = itemA.c.status === 'verified';
            const isB = itemB.c.status === 'verified';
            if (isA && !isB) return -1;
            if (!isA && isB) return 1;
          }
          if (rule === 'observation_time') {
            const tA = new Date(itemA.c.observedAt).getTime();
            const tB = new Date(itemB.c.observedAt).getTime();
            if (tB !== tA) return tB - tA; // newer first
          }
          if (rule === 'provenance_completeness') {
            const diff = itemB.qProfile.provenanceCompleteness - itemA.qProfile.provenanceCompleteness;
            if (Math.abs(diff) > 0) return diff;
          }
          if (rule === 'stable_id') {
            return itemA.c.id.localeCompare(itemB.c.id);
          }
        }
        return 0;
      });

      const selectedItem = passingCandidates[0];
      const selected = selectedItem.c;

      result.status = hasMajorConflict ? 'resolved_with_warning' : 'resolved';
      result.selectedEvidenceId = selected.id;
      result.selectedValue = selected.numericValue;
      result.selectedCurrency = selected.currency || selected.destinationCurrency || null;
      result.selectedSourceType = selected.sourceType;
      result.selectedQualityProfile = selectedItem.qProfile;

      // Classify reason code based on selected candidate type
      if (selected.sourceType === 'management_verified') {
        result.resolutionReasonCode = 'HIGHEST_QUALITY_PROVIDER_EVIDENCE';
        result.resolutionReasonUserFacing = 'This comparison uses recently verified administrative evidence.';
      } else if (selected.sourceType === 'provider_authorized' || selected.sourceType === 'provider_published') {
        result.resolutionReasonCode = 'PROVIDER_AUTHORIZED_EVIDENCE_SELECTED';
        result.resolutionReasonUserFacing = 'This comparison uses recently available provider-specific information.';
      } else if (selected.sourceType === 'community_verified') {
        result.resolutionReasonCode = 'VERIFIED_COMMUNITY_EVIDENCE_SELECTED';
        result.resolutionReasonUserFacing = 'This comparison uses a recently verified provider rate submitted with supporting information.';
      } else {
        result.resolutionReasonCode = 'NEWEST_VERIFIED_PROVIDER_EVIDENCE';
        result.resolutionReasonUserFacing = 'Verified partner data used.';
      }

      result.resolutionReasonInternal = `Deterministically selected highest ranking candidate ${selected.id} using active policy '${policy.name}' (Quality Score: ${selectedItem.qProfile.totalQualityScore})`;

      if (hasMajorConflict) {
        result.warnings.push('Major conflict detected in eligible evidence set, resolution degraded to warning status');
      }

      // Populate nonselected list with reasons
      passingCandidates.forEach(item => {
        if (item.c.id !== selected.id) {
          result.nonSelectedEvidence.push({
            evidenceId: item.c.id,
            reasonCodes: ['LOWER_RANKING_SCORE']
          });
        }
      });

      await this.persistResolutionRecord(result);
      return result;

    } catch (err: any) {
      console.error('Fatal ERDE Exception during resolution:', err);
      result.status = 'error';
      result.resolutionReasonCode = 'RESOLUTION_ENGINE_ERROR';
      result.resolutionReasonUserFacing = 'Evidence resolution engine encountered an internal system error.';
      result.resolutionReasonInternal = `ERDE Exception: ${err.message || String(err)}`;
      return result;
    }
  },

  // --- PERSISTENCE AND HISTORY LAYER ---
  async persistResolutionRecord(res: ResolutionResult): Promise<void> {
    const records = getLocalStorageItem<ResolutionResult[]>('sr_sic_resolutions', []);
    
    // De-duplicate: only save if selection or policy changed from previous to avoid page-refresh bloat
    const sorted = [...records].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    const match = sorted.find(r => 
      r.context.corridorId === res.context.corridorId && 
      r.context.providerId === res.context.providerId && 
      r.context.subjectType === res.context.subjectType
    );

    if (match && match.selectedEvidenceId === res.selectedEvidenceId && match.status === res.status && match.resolutionPolicyId === res.resolutionPolicyId) {
      // Nothing changed, return to save space
      return;
    }

    saveLocalStorageItem('sr_sic_resolutions', [res, ...records.slice(0, 99)]);

    // Write to Supabase if table exists
    if (supabaseClient) {
      try {
        await supabaseClient
          .from('sic_evidence_resolutions')
          .insert([{
            id: res.resolutionId,
            context_key: `${res.context.subjectType}::${res.context.providerId || 'global'}::${res.context.corridorId || 'global'}`,
            provider_id: res.context.providerId,
            corridor_id: res.context.corridorId,
            source_currency: res.context.sourceCurrency,
            destination_currency: res.context.destinationCurrency,
            subject_type: res.context.subjectType,
            requested_use: res.context.requestedPermittedUse,
            environment: res.context.environment,
            status: res.status,
            selected_evidence_id: res.selectedEvidenceId,
            selected_value: res.selectedValue,
            selected_currency: res.selectedCurrency,
            selected_source_type: res.selectedSourceType,
            selected_quality_score: res.selectedQualityProfile?.totalQualityScore,
            selected_quality_band: res.selectedQualityProfile?.qualityBand,
            policy_id: res.resolutionPolicyId,
            policy_version: res.resolutionPolicyVersion,
            resolution_reason_code: res.resolutionReasonCode,
            resolution_reason_user_facing: res.resolutionReasonUserFacing,
            resolution_reason_internal: res.resolutionReasonInternal,
            conflict_severity: res.conflictSeverity,
            warnings: res.warnings,
            generated_at: res.generatedAt
          }]);
      } catch (err) {
        // safest swallow
      }
    }

    // Log the EPE audit event for ERDE resolution change
    await EpeService.logAudit({
      actorId: 'system_erde',
      evidenceId: res.selectedEvidenceId || 'none',
      action: 'evidence_resolved',
      newStatus: res.status,
      reason: `ERDE resolved subject '${res.context.subjectType}' using policy '${res.resolutionPolicyId}'`
    });
  },

  async getResolutions(): Promise<ResolutionResult[]> {
    return getLocalStorageItem<ResolutionResult[]>('sr_sic_resolutions', []);
  },

  async getConflicts(): Promise<EvidenceConflict[]> {
    return getLocalStorageItem<EvidenceConflict[]>('sr_sic_evidence_conflicts', []);
  },

  async updateConflictStatus(
    conflictId: string, 
    status: "acknowledged" | "under_review" | "resolved" | "dismissed", 
    actorEmail: string, 
    notes: string
  ): Promise<void> {
    const list = getLocalStorageItem<EvidenceConflict[]>('sr_sic_evidence_conflicts', []);
    const idx = list.findIndex(c => c.id === conflictId);
    if (idx >= 0) {
      const conf = list[idx];
      conf.status = status;
      conf.reviewNotes = notes;
      conf.assignedTo = actorEmail;
      conf.updatedAt = new Date().toISOString();
      if (status === 'resolved') conf.resolvedAt = new Date().toISOString();
      if (status === 'dismissed') conf.dismissedAt = new Date().toISOString();
      if (status === 'acknowledged') conf.acknowledgedAt = new Date().toISOString();

      list[idx] = conf;
      saveLocalStorageItem('sr_sic_evidence_conflicts', list);

      // Sync Supabase
      if (supabaseClient) {
        try {
          await supabaseClient
            .from('sic_evidence_conflicts')
            .update({
              status,
              review_notes: notes,
              assigned_to: actorEmail,
              updated_at: conf.updatedAt,
              resolved_at: conf.resolvedAt,
              dismissed_at: conf.dismissedAt,
              acknowledged_at: conf.acknowledgedAt
            })
            .eq('id', conflictId);
        } catch {
          // swallow safe
        }
      }

      await EpeService.logAudit({
        actorId: actorEmail,
        evidenceId: conflictId,
        action: `conflict_${status}`,
        reason: `Admin updated conflict state to ${status}. Notes: ${notes}`
      });
    }
  },

  // --- OPERATIONAL DECISION PACKAGE BUILDER ---
  async buildOperationalDecisionPackage(
    providerId: string, 
    corridorId: string, 
    sendAmount: number,
    sourceCurrency: string,
    destinationCurrency: string,
    policyId?: string
  ): Promise<OperationalDecisionPackage> {
    const packageId = `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const policies = await this.getPolicies();
    const policy = policies.find(p => p.policyId === policyId) || await this.getActivePolicy();

    // 1. Resolve Exchange Rate
    const rateContext = this.buildContext({
      providerId,
      corridorId,
      sourceCurrency,
      destinationCurrency,
      subjectType: 'exchange_rate',
      sendAmount,
      requestedPermittedUse: 'recommendation',
      environment: 'production'
    });
    const resolvedRate = await this.resolveEvidence(rateContext, policy.policyId);

    // 2. Resolve Transfer Fee
    const feeContext = this.buildContext({
      providerId,
      corridorId,
      sourceCurrency,
      destinationCurrency,
      subjectType: 'transfer_fee',
      sendAmount,
      requestedPermittedUse: 'recommendation',
      environment: 'production'
    });
    const resolvedTransferFee = await this.resolveEvidence(feeContext, policy.policyId);

    // 3. Resolve VAT
    const vatContext = this.buildContext({
      providerId,
      corridorId,
      sourceCurrency,
      destinationCurrency,
      subjectType: 'VAT',
      sendAmount,
      requestedPermittedUse: 'recommendation',
      environment: 'production'
    });
    const resolvedVAT = await this.resolveEvidence(vatContext, policy.policyId);

    // 4. Resolve Benchmark
    const benchContext = this.buildContext({
      corridorId,
      sourceCurrency,
      destinationCurrency,
      subjectType: 'reference_benchmark',
      requestedPermittedUse: 'reference_benchmarking',
      environment: 'production'
    });
    const resolvedBenchmark = await this.resolveEvidence(benchContext, policy.policyId);

    // Assess overall state
    let overallEvidenceState: "complete" | "usable" | "partial" | "weak" | "blocked" | "unavailable" = 'unavailable';
    const activeConflictIds: string[] = [];
    const evidenceWarnings: string[] = [];

    if (resolvedRate.status === 'blocked_by_conflict') {
      overallEvidenceState = 'blocked';
    } else if (resolvedRate.status === 'resolved' && resolvedTransferFee.status === 'resolved') {
      overallEvidenceState = 'complete';
    } else if (resolvedRate.selectedValue && resolvedTransferFee.selectedValue) {
      overallEvidenceState = 'usable';
    } else if (resolvedRate.selectedValue) {
      overallEvidenceState = 'partial';
    } else {
      overallEvidenceState = 'unavailable';
    }

    if (resolvedRate.conflictIds) activeConflictIds.push(...resolvedRate.conflictIds);
    if (resolvedTransferFee.conflictIds) activeConflictIds.push(...resolvedTransferFee.conflictIds);

    if (resolvedRate.warnings) evidenceWarnings.push(...resolvedRate.warnings);
    if (resolvedTransferFee.warnings) evidenceWarnings.push(...resolvedTransferFee.warnings);

    return {
      packageId,
      providerId,
      corridorId,
      sourceCurrency,
      destinationCurrency,
      sendAmount,
      resolvedRate,
      resolvedTransferFee,
      resolvedVAT,
      resolvedBenchmark,
      overallEvidenceState,
      activeConflictIds,
      evidenceWarnings,
      generatedAt: new Date().toISOString(),
      policyId: policy.policyId,
      policyVersion: policy.version
    };
  },

  // --- POLICY SIMULATOR ---
  async simulatePolicy(draftPolicy: ResolutionPolicy): Promise<{
    changedCount: number;
    affectedProviders: string[];
    affectedCorridors: string[];
    avgQualityScore: number;
    blockedCount: number;
    totalResolutions: number;
  }> {
    const activePolicy = await this.getActivePolicy();
    const allEvidence = await EpeService.getAllEvidence();

    // Group evidence to form contexts
    const groups: Record<string, EvidenceRecord[]> = {};
    allEvidence.forEach(e => {
      if (e.subjectType === 'exchange_rate' && e.corridorId) {
        const key = `${e.corridorId}::${e.providerCode || 'global'}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
      }
    });

    let changedCount = 0;
    const affectedProviders = new Set<string>();
    const affectedCorridors = new Set<string>();
    let totalQualityScore = 0;
    let totalScored = 0;
    let blockedCount = 0;
    let totalResolutions = 0;

    for (const key of Object.keys(groups)) {
      const [corrId, provCode] = key.split('::');
      const mockContext = this.buildContext({
        providerId: provCode === 'global' ? null : provCode,
        corridorId: corrId,
        sourceCurrency: 'SAR',
        destinationCurrency: groups[key][0].destinationCurrency || 'USD',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      totalResolutions++;

      // Resolve with active policy (simulate)
      const resActive = await this.resolveEvidence(mockContext, activePolicy.policyId);
      // Resolve with draft policy
      const resDraft = await this.resolveEvidence(mockContext, draftPolicy.policyId);

      if (resDraft.status === 'blocked_by_conflict') blockedCount++;

      if (resDraft.selectedQualityProfile) {
        totalQualityScore += resDraft.selectedQualityProfile.totalQualityScore;
        totalScored++;
      }

      if (resActive.selectedEvidenceId !== resDraft.selectedEvidenceId) {
        changedCount++;
        if (provCode !== 'global') affectedProviders.add(provCode);
        affectedCorridors.add(corrId);
      }
    }

    return {
      changedCount,
      affectedProviders: Array.from(affectedProviders),
      affectedCorridors: Array.from(affectedCorridors),
      avgQualityScore: totalScored > 0 ? Math.round(totalQualityScore / totalScored) : 0,
      blockedCount,
      totalResolutions
    };
  },

  async runErdeTestSuite(): Promise<any[]> {
    const testCases: any[] = [];
    const runAssert = (label: string, condition: boolean, expected: string, actual: string) => {
      return { label, passed: condition, expected, actual };
    };

    const makeEvidence = (overrides: Partial<EvidenceRecord>): EvidenceRecord => {
      return {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        subjectType: 'exchange_rate',
        providerId: 'prov-a',
        providerCode: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        numericValue: 1.0,
        sourceType: 'community_verified',
        sourceName: 'Default Source',
        freshnessState: 'fresh',
        status: 'verified',
        providerSpecific: true,
        corridorSpecific: true,
        receivedAt: new Date().toISOString(),
        observedAt: new Date().toISOString(),
        permittedUses: ['recommendation', 'audit'],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides
      };
    };

    const mockPolicies = await this.getPolicies();
    const policy = mockPolicies[0] || {
      policyId: 'pol-default',
      name: 'Standard Resolution Policy',
      version: 1,
      status: 'active',
      preserveManagementOverridePriority: true,
      minimumQualityScore: 50,
      requireVerifiedEvidence: false,
      requireProviderSpecificityForRecommendation: true,
      requireCorridorMatch: true,
      rejectExpiredEvidence: true,
      allowAgingEvidence: true,
      allowUnknownFreshness: true,
      allowLegacyFallback: true,
      weights: {
        verificationQuality: 15,
        freshnessQuality: 15,
        sourceAuthority: 25,
        providerSpecificity: 10,
        corridorSpecificity: 10,
        provenanceCompleteness: 10,
        attachmentSupport: 5,
        corroborationQuality: 5,
        consistencyQuality: 5
      },
      conflictThresholds: {
        minorPercentage: 0.5,
        moderatePercentage: 1.5,
        majorPercentage: 3.5,
        criticalPercentage: 5.0
      },
      tieBreakerOrder: ['source_authority', 'freshness', 'quality_score', 'observed_at']
    };

    // ----------------------------------------------------
    // TEST 1: Scenario A - Active Management Override vs Verified Community
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-mgt-override',
          numericValue: 5.20,
          sourceType: 'management_override',
          sourceName: 'Admin Control Panel Override',
          freshnessState: 'fresh',
          status: 'verified'
        }),
        makeEvidence({
          id: 'ev-comm-verified',
          numericValue: 5.15,
          sourceType: 'community_verified',
          sourceName: 'User Submission Feed',
          freshnessState: 'fresh',
          status: 'verified'
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution Status is Resolved', res.status === 'resolved', 'resolved', res.status),
        runAssert('Selected ID is management override', res.selectedEvidenceId === 'ev-mgt-override', 'ev-mgt-override', res.selectedEvidenceId || 'none'),
        runAssert('Selected Value matches Override (5.20)', res.resolvedValue === 5.20, '5.2', String(res.resolvedValue))
      ];

      testCases.push({
        id: 't-scenario-a',
        name: 'Scenario A: Priority Override Escalation',
        description: 'Verify that active management overrides take precedence over verified community candidates under default policy.',
        scenario: 'Scenario A',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Reason code: ${res.resolutionReasonCode}. Selected provider: ${res.selectedProviderId}`
      });
    }

    // ----------------------------------------------------
    // TEST 2: Scenario B - Expired Management Override Fallback
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-mgt-override-stale',
          numericValue: 5.30,
          sourceType: 'management_override',
          sourceName: 'Stale Override',
          freshnessState: 'stale',
          status: 'verified',
          observedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
        }),
        makeEvidence({
          id: 'ev-comm-fresh',
          numericValue: 5.12,
          sourceType: 'community_verified',
          sourceName: 'Fresh Community Submission',
          freshnessState: 'fresh',
          status: 'verified',
          attachmentPath: '/uploads/screen.png'
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution Status is Resolved', res.status === 'resolved', 'resolved', res.status),
        runAssert('Stale override is excluded', !res.eligibleEvidenceIds.includes('ev-mgt-override-stale'), 'true', String(!res.eligibleEvidenceIds.includes('ev-mgt-override-stale'))),
        runAssert('Selected ID is fresh community record', res.selectedEvidenceId === 'ev-comm-fresh', 'ev-comm-fresh', res.selectedEvidenceId || 'none')
      ];

      testCases.push({
        id: 't-scenario-b',
        name: 'Scenario B: Expired Override Exclusion',
        description: 'Verify that expired or stale management overrides are excluded, and selection falls back safely to active verified community.',
        scenario: 'Scenario B',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Excluded list count: ${res.excludedEvidence.length}. Selected value: ${res.resolvedValue}`
      });
    }

    // ----------------------------------------------------
    // TEST 3: Scenario C - Public Benchmark Recommendation Restriction
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-benchmark-only',
          providerId: 'global',
          providerCode: 'global',
          providerSpecific: false,
          numericValue: 5.10,
          sourceType: 'public_reference_api',
          sourceName: 'Refinitiv Benchmark API',
          freshnessState: 'fresh',
          status: 'verified'
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution is insufficient', res.status === 'insufficient_evidence', 'insufficient_evidence', res.status),
        runAssert('Selected ID is undefined', !res.selectedEvidenceId, 'undefined', res.selectedEvidenceId || 'none')
      ];

      testCases.push({
        id: 't-scenario-c',
        name: 'Scenario C: Public Benchmark Restriction',
        description: 'Ensure that public reference API benchmarks are restricted from driving provider recommendations.',
        scenario: 'Scenario C',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Reason Code: ${res.resolutionReasonCode}. Internal Reason: ${res.resolutionReasonInternal}`
      });
    }

    // ----------------------------------------------------
    // TEST 4: Scenario D - Severe Numeric Variance Conflict
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-candidate-1',
          numericValue: 34.40,
          sourceType: 'management_override',
          sourceName: 'System A',
          freshnessState: 'fresh',
          status: 'verified'
        }),
        makeEvidence({
          id: 'ev-candidate-2',
          numericValue: 37.80,
          sourceType: 'community_verified',
          sourceName: 'System B',
          freshnessState: 'fresh',
          status: 'verified'
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution is blocked by conflict', res.status === 'blocked_by_conflict', 'blocked_by_conflict', res.status),
        runAssert('Conflict list is populated', res.conflictIds.length > 0, 'true', String(res.conflictIds.length > 0))
      ];

      testCases.push({
        id: 't-scenario-d',
        name: 'Scenario D: Variance Conflict Blocking',
        description: 'Verify that extreme numeric variances (>5.0%) trigger critical conflicts and block automated rate selection.',
        scenario: 'Scenario D',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Reason Code: ${res.resolutionReasonCode}. Detect conflicts count: ${res.conflictIds.length}`
      });
    }

    // ----------------------------------------------------
    // TEST 5: Scenario E - Corroborated Evidence Resolution
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-corr-1',
          numericValue: 34.44,
          sourceType: 'community_verified',
          sourceName: 'Feed One',
          freshnessState: 'fresh',
          status: 'verified',
          observedAt: new Date(Date.now() - 15 * 60000).toISOString()
        }),
        makeEvidence({
          id: 'ev-corr-2',
          numericValue: 34.45,
          sourceType: 'community_verified',
          sourceName: 'Feed Two',
          freshnessState: 'fresh',
          status: 'verified',
          observedAt: new Date(Date.now() - 10 * 60000).toISOString()
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution is resolved', res.status === 'resolved', 'resolved', res.status),
        runAssert('Quality profile is high', res.selectedQualityProfile !== undefined && res.selectedQualityProfile.totalQualityScore >= 70, '>=70', String(res.selectedQualityProfile?.totalQualityScore || 0))
      ];

      testCases.push({
        id: 't-scenario-e',
        name: 'Scenario E: High Corroboration Engine',
        description: 'Verify that highly congruent community submissions corroborate each other, resulting in a high-confidence resolved output.',
        scenario: 'Scenario E',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Quality Score: ${res.selectedQualityProfile?.totalQualityScore}. Quality Band: ${res.selectedQualityProfile?.qualityBand}`
      });
    }

    // ----------------------------------------------------
    // TEST 6: Scenario F - Legacy Fallback Degrade
    // ----------------------------------------------------
    {
      const context = this.buildContext({
        providerId: 'prov-a',
        corridorId: 'sar-egp',
        sourceCurrency: 'SAR',
        destinationCurrency: 'EGP',
        subjectType: 'exchange_rate',
        requestedPermittedUse: 'recommendation',
        environment: 'sandbox'
      });

      const mockEvidence: EvidenceRecord[] = [
        makeEvidence({
          id: 'ev-legacy-fallback',
          numericValue: 5.15,
          sourceType: 'legacy_unclassified',
          sourceName: 'Legacy Hardcoded Ref',
          freshnessState: 'stale',
          status: 'active',
          observedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
        })
      ];

      const res = await this.resolveEvidence(context, policy.policyId, mockEvidence);
      const assertions = [
        runAssert('Resolution is resolved (via legacy fallback)', res.status === 'resolved', 'resolved', res.status),
        runAssert('Selected ID is legacy rate', res.selectedEvidenceId === 'ev-legacy-fallback', 'ev-legacy-fallback', res.selectedEvidenceId || 'none'),
        runAssert('Is flagged as low quality/degraded', res.selectedQualityProfile !== undefined && res.selectedQualityProfile.qualityBand === 'low', 'low', res.selectedQualityProfile?.qualityBand || 'none')
      ];

      testCases.push({
        id: 't-scenario-f',
        name: 'Scenario F: Legacy Fallback Degradation',
        description: 'Verify that the engine degrades gracefully to legacy unclassified evidence when no better candidates are available.',
        scenario: 'Scenario F',
        status: assertions.every(a => a.passed) ? 'passed' : 'failed',
        assertions,
        details: `Reason Code: ${res.resolutionReasonCode}. Warnings Count: ${res.warnings.length}`
      });
    }

    return testCases;
  }
};
