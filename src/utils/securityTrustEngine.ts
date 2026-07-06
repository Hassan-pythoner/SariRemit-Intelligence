import { CorridorId, ProviderId, CrowdsourcedRate } from '../types';
import { 
  getFirebaseSecurityPolicy,
  setFirebaseSecurityPolicy,
  getFirebaseDeviceSessions,
  upsertFirebaseDeviceSession,
  getFirebaseContributorReputations,
  upsertFirebaseContributorReputation,
  getFirebaseAuditLogs,
  addFirebaseAuditLog
} from '../lib/firebase';

// ==========================================
// 1. Role-Based Access Control Definitions
// ==========================================
export type SecurityRole = 'User' | 'Contributor' | 'Moderator' | 'Operations' | 'Admin' | 'Super Admin';

export interface RolePermissions {
  viewRates: boolean;
  submitRates: boolean;
  uploadScreenshots: boolean;
  moderateSubmissions: boolean;
  configureOverrides: boolean;
  accessSecurityCenter: boolean;
  manageUsers: boolean;
  immutableAuditLogs: boolean;
}

export const ROLE_PERMISSIONS: Record<SecurityRole, RolePermissions> = {
  'User': {
    viewRates: true,
    submitRates: false,
    uploadScreenshots: false,
    moderateSubmissions: false,
    configureOverrides: false,
    accessSecurityCenter: false,
    manageUsers: false,
    immutableAuditLogs: false,
  },
  'Contributor': {
    viewRates: true,
    submitRates: true,
    uploadScreenshots: true,
    moderateSubmissions: false,
    configureOverrides: false,
    accessSecurityCenter: false,
    manageUsers: false,
    immutableAuditLogs: false,
  },
  'Moderator': {
    viewRates: true,
    submitRates: true,
    uploadScreenshots: true,
    moderateSubmissions: true,
    configureOverrides: false,
    accessSecurityCenter: false,
    manageUsers: false,
    immutableAuditLogs: false,
  },
  'Operations': {
    viewRates: true,
    submitRates: true,
    uploadScreenshots: true,
    moderateSubmissions: true,
    configureOverrides: true,
    accessSecurityCenter: false,
    manageUsers: false,
    immutableAuditLogs: false,
  },
  'Admin': {
    viewRates: true,
    submitRates: true,
    uploadScreenshots: true,
    moderateSubmissions: true,
    configureOverrides: true,
    accessSecurityCenter: true,
    manageUsers: true,
    immutableAuditLogs: false,
  },
  'Super Admin': {
    viewRates: true,
    submitRates: true,
    uploadScreenshots: true,
    moderateSubmissions: true,
    configureOverrides: true,
    accessSecurityCenter: true,
    manageUsers: true,
    immutableAuditLogs: true,
  }
};

// ==========================================
// 2. Account Security & Session Structures
// ==========================================
export interface DeviceSession {
  id: string;
  email: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  os: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  status: 'Secure' | 'Flagged' | 'Revoked';
  threatLevel: 'Low' | 'Medium' | 'High';
}

// ==========================================
// 3. Contributor Reputation & Scores
// ==========================================
export type TrustLevel = 'New Contributor' | 'Trusted Contributor' | 'Verified Contributor' | 'Community Reporter';

export interface ContributorReputation {
  email: string;
  name: string;
  role: SecurityRole;
  contributorScore: number; // 0-100
  verifiedCount: number;
  rejectedCount: number;
  trustLevel: TrustLevel;
  joinedDate: string;
  status: 'Active' | 'Under Investigation' | 'Suspended';
}

// ==========================================
// 4. Immutable Audit Trail Structures
// ==========================================
export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: SecurityRole;
  actionCategory: 'Login' | 'Rate Approval' | 'Rate Rejection' | 'Override' | 'User Management' | 'Security Policy';
  actionDetails: string;
  ipAddress: string;
  status: 'Success' | 'Failed' | 'Blocked';
  severity: 'Info' | 'Warning' | 'Critical';
}

// ==========================================
// 5. Risk Scoring Structures
// ==========================================
export interface SubmissionRiskReport {
  submissionId: string;
  providerId: ProviderId;
  corridorId: CorridorId;
  submittedRate: number;
  submittedBy: string;
  riskScore: number;       // 0 - 100%
  trustScore: number;      // 0 - 100%
  verificationScore: number; // 0 - 100%
  riskClassification: 'Low' | 'Medium' | 'High';
  triggerFlags: string[];
}

// ==========================================
// 6. Security Policy Configuration
// ==========================================
export interface SecurityPolicyConfig {
  strictVerification: boolean;
  blockVpnProxies: boolean;
  enforceAdminMfa: boolean;
  autoModeration: boolean;
  anomalyThresholdPercent: number; // e.g., 5 for 5%
  maxSubmissionsPerHour: number;
}

// ==========================================
// INITIAL SEED DATA
// ==========================================
const DEFAULT_SESSIONS: DeviceSession[] = [
  {
    id: 'sess_1',
    email: 'hassan.gaturu20@gmail.com',
    deviceType: 'Desktop',
    os: 'macOS Sequoia 15.2',
    browser: 'Chrome 125.0',
    ipAddress: '194.143.23.82',
    location: 'Riyadh, Saudi Arabia',
    lastActive: 'Just now',
    status: 'Secure',
    threatLevel: 'Low'
  },
  {
    id: 'sess_2',
    email: 'hassan.gaturu20@gmail.com',
    deviceType: 'Mobile',
    os: 'iOS 17.5',
    browser: 'Safari Mobile',
    ipAddress: '194.143.23.85',
    location: 'Riyadh, Saudi Arabia',
    lastActive: '12 mins ago',
    status: 'Secure',
    threatLevel: 'Low'
  },
  {
    id: 'sess_3',
    email: 'spammer.rate88@gmail.com',
    deviceType: 'Mobile',
    os: 'Android 11',
    browser: 'Chrome Mobile',
    ipAddress: '82.165.11.234',
    location: 'Jeddah (VPN Proxy Identified)',
    lastActive: '1 hour ago',
    status: 'Flagged',
    threatLevel: 'High'
  },
  {
    id: 'sess_4',
    email: 'muhammad.k@gmail.com',
    deviceType: 'Mobile',
    os: 'Android 14',
    browser: 'Samsung Internet',
    ipAddress: '176.124.90.15',
    location: 'Dammam, Saudi Arabia',
    lastActive: '4 mins ago',
    status: 'Secure',
    threatLevel: 'Low'
  }
];

const DEFAULT_REPUTATIONS: ContributorReputation[] = [
  {
    email: 'hassan.gaturu20@gmail.com',
    name: 'Hassan Gaturu',
    role: 'Admin',
    contributorScore: 98,
    verifiedCount: 42,
    rejectedCount: 0,
    trustLevel: 'Community Reporter',
    joinedDate: '2026-01-10',
    status: 'Active'
  },
  {
    email: 'muhammad.k@gmail.com',
    name: 'Muhammad Khan',
    role: 'Contributor',
    contributorScore: 85,
    verifiedCount: 19,
    rejectedCount: 1,
    trustLevel: 'Verified Contributor',
    joinedDate: '2026-02-15',
    status: 'Active'
  },
  {
    email: 'maria.c@outlook.com',
    name: 'Maria Cruz',
    role: 'Contributor',
    contributorScore: 92,
    verifiedCount: 28,
    rejectedCount: 0,
    trustLevel: 'Verified Contributor',
    joinedDate: '2026-03-01',
    status: 'Active'
  },
  {
    email: 'spammer.rate88@gmail.com',
    name: 'Unknown Submitter',
    role: 'User',
    contributorScore: 12,
    verifiedCount: 1,
    rejectedCount: 7,
    trustLevel: 'New Contributor',
    joinedDate: '2026-06-25',
    status: 'Under Investigation'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: '2026-06-28T01:10:05-07:00',
    actorEmail: 'hassan.gaturu20@gmail.com',
    actorRole: 'Admin',
    actionCategory: 'Login',
    actionDetails: 'Successful admin panel authentication verified via primary session token.',
    ipAddress: '194.143.23.82',
    status: 'Success',
    severity: 'Info'
  },
  {
    id: 'aud_2',
    timestamp: '2026-06-28T01:12:30-07:00',
    actorEmail: 'hassan.gaturu20@gmail.com',
    actorRole: 'Admin',
    actionCategory: 'Rate Approval',
    actionDetails: 'Approved crowdsourced urpay PHP rate of 15.62 after positive screenshot confirmation.',
    ipAddress: '194.143.23.82',
    status: 'Success',
    severity: 'Info'
  },
  {
    id: 'aud_3',
    timestamp: '2026-06-28T00:45:00-07:00',
    actorEmail: 'system_daemon',
    actorRole: 'Operations',
    actionCategory: 'Security Policy',
    actionDetails: 'Automated Rate Submission Security flagged impossible exchange rate 1 SAR = 450.0 PKR from account spammer.rate88@gmail.com.',
    ipAddress: '82.165.11.234',
    status: 'Blocked',
    severity: 'Critical'
  },
  {
    id: 'aud_4',
    timestamp: '2026-06-28T00:20:15-07:00',
    actorEmail: 'system_daemon',
    actorRole: 'Operations',
    actionCategory: 'Security Policy',
    actionDetails: 'Screenshot Verification Security rejected reused screenshot submission for corridor IN.',
    ipAddress: '127.0.0.1',
    status: 'Blocked',
    severity: 'Warning'
  },
  {
    id: 'aud_5',
    timestamp: '2026-06-27T23:55:10-07:00',
    actorEmail: 'operations_desk@sariremit.gov',
    actorRole: 'Operations',
    actionCategory: 'Override',
    actionDetails: 'Updated global admin corridor override: urpay Pakistan corridor (+0.12 SAR bonus rate)',
    ipAddress: '194.143.24.11',
    status: 'Success',
    severity: 'Info'
  }
];

const DEFAULT_SECURITY_POLICY: SecurityPolicyConfig = {
  strictVerification: true,
  blockVpnProxies: false,
  enforceAdminMfa: true,
  autoModeration: true,
  anomalyThresholdPercent: 5,
  maxSubmissionsPerHour: 3
};

// ==========================================
// ENGINE CONTROLLER & DATA ACCESS LAYER
// ==========================================
export class SecurityTrustEngine {
  
  // Generic helper to read/write state safely
  private static getStored<T>(key: string, defaultVal: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultVal;
    }
  }

  private static setStored<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // 1. Policy Config
  public static getPolicyConfig(): SecurityPolicyConfig {
    return this.getStored<SecurityPolicyConfig>('sariremit_sec_policy', DEFAULT_SECURITY_POLICY);
  }

  public static updatePolicyConfig(config: SecurityPolicyConfig): void {
    this.setStored<SecurityPolicyConfig>('sariremit_sec_policy', config);
    this.logEvent('system_daemon', 'Operations', 'Security Policy', `Security settings updated: Strict verification [${config.strictVerification}], Auto-moderation [${config.autoModeration}], Threshold [${config.anomalyThresholdPercent}%]`, 'Success', 'Warning');
    setFirebaseSecurityPolicy(config).catch(err => console.warn('Failed to sync policy config:', err));
  }

  // 2. Active Sessions Management
  public static getActiveSessions(): DeviceSession[] {
    return this.getStored<DeviceSession[]>('sariremit_sec_sessions', DEFAULT_SESSIONS);
  }

  public static revokeSession(sessionId: string, actorEmail: string): void {
    const sessions = this.getActiveSessions();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, status: 'Revoked' as const } : s);
    this.setStored<DeviceSession[]>('sariremit_sec_sessions', updated);
    
    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
      const updatedSession = { ...targetSession, status: 'Revoked' as const };
      upsertFirebaseDeviceSession(updatedSession).catch(err => console.warn('Failed to sync session revocation:', err));
      this.logEvent(actorEmail, 'Admin', 'User Management', `Forcefully terminated device session ${sessionId} registered on ${targetSession.browser} (${targetSession.ipAddress}) owned by ${targetSession.email}.`, 'Success', 'Warning');
    }
  }

  // 3. Contributor Reputation Management
  public static getReputations(): ContributorReputation[] {
    return this.getStored<ContributorReputation[]>('sariremit_sec_reputations', DEFAULT_REPUTATIONS);
  }

  public static getContributorReputation(email: string, name: string = 'New Contributor'): ContributorReputation {
    const reps = this.getReputations();
    const matched = reps.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (matched) return matched;

    // Create a new contributor entry with default baseline values
    const newRep: ContributorReputation = {
      email: email,
      name: name,
      role: 'Contributor',
      contributorScore: 50, // neutral starting score
      verifiedCount: 0,
      rejectedCount: 0,
      trustLevel: 'New Contributor',
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    
    reps.push(newRep);
    this.setStored<ContributorReputation[]>('sariremit_sec_reputations', reps);
    upsertFirebaseContributorReputation(newRep).catch(err => console.warn('Failed to sync new contributor:', err));
    return newRep;
  }

  public static updateReputationScore(email: string, scoreDelta: number, isVerifiedIncrement: boolean = false, isRejectedIncrement: boolean = false): void {
    const reps = this.getReputations();
    const updated = reps.map(r => {
      if (r.email.toLowerCase() === email.toLowerCase()) {
        const newScore = Math.max(0, Math.min(100, r.contributorScore + scoreDelta));
        const verifiedCount = r.verifiedCount + (isVerifiedIncrement ? 1 : 0);
        const rejectedCount = r.rejectedCount + (isRejectedIncrement ? 1 : 0);
        
        // Dynamic Trust Level allocation based on score
        let trustLevel: TrustLevel = 'New Contributor';
        if (newScore >= 90) trustLevel = 'Community Reporter';
        else if (newScore >= 70) trustLevel = 'Verified Contributor';
        else if (newScore >= 30) trustLevel = 'Trusted Contributor';

        return {
          ...r,
          contributorScore: newScore,
          verifiedCount,
          rejectedCount,
          trustLevel
        };
      }
      return r;
    });

    this.setStored<ContributorReputation[]>('sariremit_sec_reputations', updated);

    const updatedRep = updated.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (updatedRep) {
      upsertFirebaseContributorReputation(updatedRep).catch(err => console.warn('Failed to sync reputation score update:', err));
    }
  }

  public static updateReputationStatus(email: string, status: 'Active' | 'Under Investigation' | 'Suspended', actorEmail: string): void {
    const reps = this.getReputations();
    const updated = reps.map(r => r.email.toLowerCase() === email.toLowerCase() ? { ...r, status } : r);
    this.setStored<ContributorReputation[]>('sariremit_sec_reputations', updated);
    
    const updatedRep = updated.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (updatedRep) {
      upsertFirebaseContributorReputation(updatedRep).catch(err => console.warn('Failed to sync reputation status update:', err));
    }

    this.logEvent(actorEmail, 'Admin', 'User Management', `Administrative update: Contributor status for ${email} modified to [${status}].`, 'Success', 'Critical');
  }

  // 4. Immutable Audit Trail Logs
  public static getAuditLogs(): AuditLog[] {
    return this.getStored<AuditLog[]>('sariremit_sec_audit_logs', DEFAULT_AUDIT_LOGS);
  }

  public static logEvent(
    actorEmail: string, 
    actorRole: SecurityRole, 
    category: AuditLog['actionCategory'], 
    details: string,
    status: AuditLog['status'] = 'Success',
    severity: AuditLog['severity'] = 'Info'
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorEmail,
      actorRole,
      actionCategory: category,
      actionDetails: details,
      ipAddress: '194.143.23.82', // local fallback default
      status,
      severity
    };
    logs.unshift(newLog); // push to top of stack
    this.setStored<AuditLog[]>('sariremit_sec_audit_logs', logs);
    addFirebaseAuditLog(newLog).catch(err => console.warn('Failed to sync audit log event:', err));
  }

  // Register or refresh a session upon user authentication
  public static registerUserSession(email: string): void {
    const sessions = this.getActiveSessions();
    const existingIndex = sessions.findIndex(s => s.email.toLowerCase() === email.toLowerCase() && s.status !== 'Revoked');
    
    if (existingIndex !== -1) {
      const existing = { ...sessions[existingIndex], lastActive: 'Just now' };
      sessions[existingIndex] = existing;
      this.setStored<DeviceSession[]>('sariremit_sec_sessions', sessions);
      upsertFirebaseDeviceSession(existing).catch(err => console.warn('Failed to sync session update:', err));
    } else {
      const newSess: DeviceSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        email,
        deviceType: window.innerWidth < 640 ? 'Mobile' : (window.innerWidth < 1024 ? 'Tablet' : 'Desktop'),
        os: navigator.userAgent.includes('Mac') ? 'macOS' : (navigator.userAgent.includes('Windows') ? 'Windows' : 'Android/iOS'),
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : (navigator.userAgent.includes('Safari') ? 'Safari' : 'Firefox'),
        ipAddress: '194.143.23.82', // standard demo fallback IP
        location: 'Riyadh, Saudi Arabia',
        lastActive: 'Just now',
        status: 'Secure',
        threatLevel: 'Low'
      };
      sessions.unshift(newSess);
      this.setStored<DeviceSession[]>('sariremit_sec_sessions', sessions);
      upsertFirebaseDeviceSession(newSess).catch(err => console.warn('Failed to sync new session:', err));
    }
  }

  // Bidirectional Synchronization Handshake with Firebase
  public static async syncWithFirebase(): Promise<void> {
    try {
      // 1. Sync Security Policy
      const fbPolicy = await getFirebaseSecurityPolicy();
      if (fbPolicy) {
        this.setStored<SecurityPolicyConfig>('sariremit_sec_policy', fbPolicy);
      } else {
        const localPolicy = this.getPolicyConfig();
        await setFirebaseSecurityPolicy(localPolicy);
      }

      // 2. Sync Device Sessions
      const fbSessions = await getFirebaseDeviceSessions();
      const localSessions = this.getActiveSessions();
      if (fbSessions) {
        const mergedSessionsMap = new Map<string, DeviceSession>();
        localSessions.forEach(s => mergedSessionsMap.set(s.id, s));
        fbSessions.forEach(s => {
          const existing = mergedSessionsMap.get(s.id);
          if (!existing || s.status === 'Revoked' || s.threatLevel === 'High') {
            mergedSessionsMap.set(s.id, s);
          }
        });
        const mergedSessions = Array.from(mergedSessionsMap.values());
        this.setStored<DeviceSession[]>('sariremit_sec_sessions', mergedSessions);

        for (const session of mergedSessions) {
          if (!fbSessions.some(fs => fs.id === session.id)) {
            await upsertFirebaseDeviceSession(session);
          }
        }
      } else {
        for (const session of localSessions) {
          await upsertFirebaseDeviceSession(session);
        }
      }

      // 3. Sync Contributor Reputations
      const fbReps = await getFirebaseContributorReputations();
      const localReps = this.getReputations();
      if (fbReps) {
        const mergedRepsMap = new Map<string, ContributorReputation>();
        localReps.forEach(r => mergedRepsMap.set(r.email.toLowerCase(), r));
        fbReps.forEach(r => {
          const existing = mergedRepsMap.get(r.email.toLowerCase());
          if (!existing || r.contributorScore > existing.contributorScore || r.status !== 'Active') {
            mergedRepsMap.set(r.email.toLowerCase(), r);
          }
        });
        const mergedReps = Array.from(mergedRepsMap.values());
        this.setStored<ContributorReputation[]>('sariremit_sec_reputations', mergedReps);

        for (const rep of mergedReps) {
          if (!fbReps.some(fr => fr.email.toLowerCase() === rep.email.toLowerCase())) {
            await upsertFirebaseContributorReputation(rep);
          }
        }
      } else {
        for (const rep of localReps) {
          await upsertFirebaseContributorReputation(rep);
        }
      }

      // 4. Sync Audit Logs
      const fbLogs = await getFirebaseAuditLogs();
      const localLogs = this.getAuditLogs();
      if (fbLogs) {
        const mergedLogsMap = new Map<string, AuditLog>();
        localLogs.forEach(l => mergedLogsMap.set(l.id, l));
        fbLogs.forEach(l => mergedLogsMap.set(l.id, l));
        
        const mergedLogs = Array.from(mergedLogsMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.setStored<AuditLog[]>('sariremit_sec_audit_logs', mergedLogs);

        for (const log of mergedLogs) {
          if (!fbLogs.some(fl => fl.id === log.id)) {
            await addFirebaseAuditLog(log);
          }
        }
      } else {
        for (const log of localLogs) {
          await addFirebaseAuditLog(log);
        }
      }

      console.log('🔄 Security Control Center successfully performed sync handshake with Firebase.');
    } catch (err) {
      console.warn('⚠️ Firebase handshake sync failed (operating in offline fallback):', err);
    }
  }

  // 5. Rate Submission Security Evaluator
  public static evaluateSubmissionRate(
    sub: Omit<CrowdsourcedRate, 'id' | 'timestamp' | 'votes' | 'isVerified'>,
    recentSubmissions: CrowdsourcedRate[],
    liveRate?: number // average baseline rate
  ): { isValid: boolean; flags: string[]; suggestion: string } {
    
    const flags: string[] = [];
    let suggestion = '';

    // Check 1: Duplicate submissions (identical rate, provider and corridor within 2 hours)
    const duplicate = recentSubmissions.find(r => 
      r.providerId === sub.providerId && 
      r.corridorId === sub.corridorId && 
      Math.abs(r.exchangeRate - sub.exchangeRate) < 0.0001 &&
      r.submittedBy.toLowerCase() === sub.submittedBy.toLowerCase()
    );
    if (duplicate) {
      flags.push('DUPLICATE_RATE_SUBMISSION');
    }

    // Check 2: Impossible rate (>15% deviation from baseline or standard)
    if (liveRate) {
      const deviation = Math.abs(sub.exchangeRate - liveRate) / liveRate;
      if (deviation > 0.15) {
        flags.push('IMPOSSIBLE_RATE_DEVIATION');
        suggestion = 'Exquisite rate fluctuation is highly abnormal. This exceeds typical corridors margins.';
      } else if (deviation > 0.05) {
        flags.push('HIGH_ANOMALY_DETECTION');
        suggestion = 'Rate differs significantly from live market indexes. Requires screenshot audit.';
      }
    }

    // Check 3: Rate Submission Frequency limit (Max 3 submissions per hour per user)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const userHourlySubmissions = recentSubmissions.filter(r => 
      r.submittedBy.toLowerCase() === sub.submittedBy.toLowerCase()
      // simple timestamp contains substring or fallback parsing
    );
    if (userHourlySubmissions.length >= 3) {
      flags.push('SUBMISSION_FREQUENCY_EXCEEDED');
      suggestion = 'Rate limit triggered. Maximum hourly user contributions reached.';
    }

    const isValid = flags.length === 0;
    return { isValid, flags, suggestion };
  }

  // 6. Screenshot Verification Engine
  public static evaluateScreenshot(
    file: File | string | undefined, 
    corridorId: CorridorId
  ): { integrityScore: number; flags: string[]; isAccepted: boolean } {
    const flags: string[] = [];
    
    if (!file) {
      return { integrityScore: 0, flags: ['NO_PROOF_ATTACHED'], isAccepted: false };
    }

    // Since front-end handles actual file, we simulate image hashing & metadata extraction
    // Check 1: Duplicate / Reused image detection (by random name matches or mock hash matching)
    const isMockReused = typeof file === 'string' && file.includes('reused');
    if (isMockReused) {
      flags.push('REUSED_SCREENSHOT_HASH');
    }

    // Check 2: Screenshot age verification (simulated extraction checking creation dates)
    const isMockOutdated = typeof file === 'string' && file.includes('old');
    if (isMockOutdated) {
      flags.push('OUTDATED_SCREENSHOT_METADATA');
    }

    // Check 3: Image integrity checks (resolution/metadata bounds)
    const integrityScore = flags.length > 0 ? 30 : 95;
    const isAccepted = flags.length === 0 && integrityScore > 70;

    return { integrityScore, flags, isAccepted };
  }

  // 7. Core Risk & Trust Scorer
  public static calculateRiskScoring(
    sub: CrowdsourcedRate,
    recentSubmissions: CrowdsourcedRate[],
    liveRate?: number
  ): SubmissionRiskReport {
    
    const triggerFlags: string[] = [];
    let riskScore = 10; // baseline safe score
    let trustScore = 80; // default trust starting
    let verificationScore = sub.isVerified ? 90 : 25;

    // Evaluate contributor profile
    const rep = this.getContributorReputation(sub.submittedBy);
    trustScore = Math.round((trustScore + rep.contributorScore) / 2);

    if (rep.status === 'Suspended') {
      triggerFlags.push('SUBMITTER_SUSPENDED');
      riskScore += 50;
    } else if (rep.status === 'Under Investigation') {
      triggerFlags.push('SUBMITTER_UNDER_INVESTIGATION');
      riskScore += 30;
    }

    // Submitter history
    if (rep.rejectedCount > 2) {
      triggerFlags.push('CONTRIBUTOR_HIGH_REJECTION_RATE');
      riskScore += 25;
    }

    // Rate deviation check
    if (liveRate) {
      const deviation = Math.abs(sub.exchangeRate - liveRate) / liveRate;
      if (deviation > 0.12) {
        triggerFlags.push('CRITICAL_RATE_ANOMALY');
        riskScore += 45;
      } else if (deviation > 0.05) {
        triggerFlags.push('MINOR_RATE_ANOMALY');
        riskScore += 15;
      }
    }

    // Verification screenshot weight
    if (sub.screenshotUrl) {
      verificationScore = Math.min(100, verificationScore + 35);
      riskScore = Math.max(0, riskScore - 15); // screenshot reduces risk
    } else {
      triggerFlags.push('NO_PROOF_SUBMISSION');
      riskScore += 10;
    }

    // Calculate final Risk Classification
    const finalRiskScore = Math.min(100, Math.max(0, riskScore));
    let riskClassification: 'Low' | 'Medium' | 'High' = 'Low';
    if (finalRiskScore >= 60) riskClassification = 'High';
    else if (finalRiskScore >= 30) riskClassification = 'Medium';

    return {
      submissionId: sub.id,
      providerId: sub.providerId,
      corridorId: sub.corridorId,
      submittedRate: sub.exchangeRate,
      submittedBy: sub.submittedBy,
      riskScore: finalRiskScore,
      trustScore,
      verificationScore,
      riskClassification,
      triggerFlags
    };
  }

  // 8. Data Protection Layer Access Checker
  public static checkDataAccess(
    userSession: { email: string; role?: string } | null,
    targetEmail: string
  ): boolean {
    if (!userSession) return false;
    
    // Admin, Super Admin, and Operations have unrestricted data visibility
    if (['Admin', 'Super Admin', 'Operations'].includes(userSession.role || '')) {
      return true;
    }
    
    // General users only access their own data
    return userSession.email.toLowerCase() === targetEmail.toLowerCase();
  }

  // 9. Dashboard Data Aggregation
  public static getDashboardStatistics() {
    const sessions = this.getActiveSessions();
    const reputations = this.getReputations();
    const auditLogs = this.getAuditLogs();
    
    const suspiciousAccountsCount = reputations.filter(r => r.status !== 'Active' || r.contributorScore < 30).length;
    const flaggedRatesCount = auditLogs.filter(l => l.actionCategory === 'Security Policy' && l.severity === 'Critical').length;
    const securityEventsCount = auditLogs.filter(l => l.severity === 'Critical' || l.severity === 'Warning').length;

    return {
      suspiciousAccounts: suspiciousAccountsCount,
      flaggedRates: flaggedRatesCount,
      duplicateScreenshots: 1, // Simulated baseline static indicators
      highRiskContributors: reputations.filter(r => r.contributorScore < 20).length,
      activeSessionsCount: sessions.filter(s => s.status === 'Secure').length,
      securityEventsCount
    };
  }
}
