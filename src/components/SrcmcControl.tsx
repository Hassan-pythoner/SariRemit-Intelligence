import React, { useState, useEffect } from 'react';
import { TranslationDict, Corridor, UserProfile } from '../types';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { 
  fetchOverrides, 
  saveOverride, 
  deleteOverrideRow, 
  fetchCommunitySubmissions, 
  updateSubmissionStatus, 
  getSisWeights, 
  saveSisWeights, 
  calculateSIS,
  isSupabaseConfigured,
  fetchAllUserProfiles,
  getAuthSession,
  signUpWithSupabase,
  getSariRemitIntelligence,
  fetchAdminAccess,
  saveAdminAccess,
  generatePinCode,
  revokeAdminAccess,
  fetchCorridorSettings,
  saveCorridorSetting,
  getActiveCorridorsSync,
  fetchRemittanceChannels,
  saveRemittanceChannel,
  deleteRemittanceChannel,
  fetchChannelCoverage,
  saveChannelCoverage,
  logAuditAction,
  fetchAuditLogs,
  SRCMCAdminAccess,
  CorridorSetting,
  ChannelCorridorCoverage,
  SRCMCAuditLog
} from '../services/supabaseService';
import { 
  Settings, ShieldCheck, Database, FileText, CheckCircle2, 
  XCircle, Trash2, PlusCircle, RefreshCw, AlertTriangle, HelpCircle, 
  ArrowRightLeft, Percent, Compass, Clock, Users, User, Lock, Sparkles,
  Eye, EyeOff, Search, PlayCircle, ToggleLeft, ShieldAlert, Key, Globe, Layout, ListCollapse, CheckSquare
} from 'lucide-react';

interface SrcmcControlProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfile;
  onSessionSync: () => void;
}

export default function SrcmcControl({ language, t, profile, onSessionSync }: SrcmcControlProps) {
  const isRtl = language === 'ar';

  // Sub-tabs in the Control Center
  const [activeSubTab, setActiveSubTab] = useState<'overrides' | 'submissions' | 'resolved' | 'weights' | 'channels' | 'corridors' | 'admins' | 'audit_logs' | 'users'>('overrides');

  // Core Data sets
  const [overrides, setOverrides] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [weights, setWeights] = useState<any>({
    rate_weight: 0.30,
    fee_weight: 0.20,
    confidence_weight: 0.20,
    freshness_weight: 0.15,
    savings_weight: 0.15
  });

  // Dynamic SRCMC Data sets
  const [admins, setAdmins] = useState<SRCMCAdminAccess[]>([]);
  const [corridorSettings, setCorridorSettings] = useState<CorridorSetting[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [coverages, setCoverages] = useState<ChannelCorridorCoverage[]>([]);
  const [auditLogs, setAuditLogs] = useState<SRCMCAuditLog[]>([]);

  // Selection & Forms states
  const [selectedChannelForCoverage, setSelectedChannelForCoverage] = useState<any | null>(null);

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form Fields: New Override
  const [overrideCorridor, setOverrideCorridor] = useState<string>('sa-ke');
  const [overrideProvider, setOverrideProvider] = useState<string>('');
  const [overrideRate, setOverrideRate] = useState<string>('');
  const [overrideFee, setOverrideFee] = useState<string>('10');
  const [overrideVat, setOverrideVat] = useState<string>(''); // Blank = automatic 15%
  const [overrideOtherCosts, setOverrideOtherCosts] = useState<string>('0');
  const [overrideExpiry, setOverrideExpiry] = useState<string>('60'); // Minutes
  const [overrideIsActive, setOverrideIsActive] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('Operational override adjustment');
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Form Fields: Weights
  const [weightsForm, setWeightsForm] = useState<any>({
    rate: '0.30',
    fee: '0.20',
    confidence: '0.20',
    freshness: '0.15',
    savings: '0.15'
  });
  const [weightsError, setWeightsError] = useState<string>('');
  const [weightsSuccess, setWeightsSuccess] = useState<string>('');

  // Form Fields: Register Channel
  const [chanId, setChanId] = useState<string>('');
  const [chanName, setChanName] = useState<string>('');
  const [chanCode, setChanCode] = useState<string>('');
  const [chanDisplayName, setChanDisplayName] = useState<string>('');
  const [chanCategory, setChanCategory] = useState<'wallet' | 'bank' | 'money_transfer_operator' | 'exchange_house' | 'other'>('wallet');
  const [chanStatus, setChanStatus] = useState<'active' | 'inactive' | 'coming_soon' | 'paused'>('active');
  const [chanCorridors, setChanCorridors] = useState<string[]>(['sa-ke', 'sa-ug']);
  const [chanTransferMethods, setChanTransferMethods] = useState<string[]>(['Mobile Wallet', 'Bank Transfer']);
  const [chanFee, setChanFee] = useState<string>('10');
  const [chanVat, setChanVat] = useState<string>('0.15');
  const [chanNotes, setChanNotes] = useState<string>('');
  const [chanError, setChanError] = useState<string>('');
  const [chanSuccess, setChanSuccess] = useState<string>('');
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  // Form Fields: Corridor Control
  const [selectedCorridorCode, setSelectedCorridorCode] = useState<string>('sa-ke');
  const [corridorStatusField, setCorridorStatusField] = useState<'active' | 'inactive' | 'coming_soon' | 'paused'>('active');
  const [corridorComingSoonField, setCorridorComingSoonField] = useState<boolean>(false);
  const [corridorNotesField, setCorridorNotesField] = useState<string>('');
  const [corridorError, setCorridorError] = useState<string>('');
  const [corridorSuccess, setCorridorSuccess] = useState<string>('');

  // Form Fields: Admin Access Control
  const [searchAdminEmail, setSearchAdminEmail] = useState<string>('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [newAdminRole, setNewAdminRole] = useState<'main_admin' | 'rate_monitor' | 'override_manager' | 'community_verifier' | 'channel_manager' | 'corridor_manager' | 'viewer'>('viewer');
  const [newAdminPermissions, setNewAdminPermissions] = useState<string[]>(['view_dashboard', 'monitor_rates']);
  const [newAdminPin, setNewAdminPin] = useState<string>('');
  const [revealPinId, setRevealPinId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccess, setAdminSuccess] = useState<string>('');

  // Form Fields: Coverage Setting Form
  const [covCorridorCode, setCovCorridorCode] = useState<string>('sa-ke');
  const [covStatus, setCovStatus] = useState<'active' | 'inactive' | 'coming_soon' | 'paused'>('active');
  const [covTransferMethods, setCovTransferMethods] = useState<string[]>(['Mobile Wallet', 'Bank Transfer']);
  const [covFee, setCovFee] = useState<string>('10');
  const [covVat, setCovVat] = useState<string>('0.15');
  const [covExchangeRate, setCovExchangeRate] = useState<string>('');
  const [covVatAmount, setCovVatAmount] = useState<string>('');
  const [covOtherCosts, setCovOtherCosts] = useState<string>('');
  const [covNotes, setCovNotes] = useState<string>('');
  const [covError, setCovError] = useState<string>('');
  const [covSuccess, setCovSuccess] = useState<string>('');

  // PIN Verification Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{
    execute: () => Promise<void>;
    description: string;
  } | null>(null);

  // Authentication Quick Sign-in states
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Fetch Session Admin status
  const activeSession = getAuthSession();
  const loggedInEmail = activeSession.user?.email || '';

  // Retrieve matching admin record
  const currentAdmin = admins.find(a => a.email.toLowerCase() === loggedInEmail.toLowerCase() && a.is_active);
  const isAdmin = loggedInEmail.toLowerCase() === 'hassan.gaturu20@gmail.com' || loggedInEmail.toLowerCase() === 'gaturuhassan@gmail.com' || loggedInEmail.toLowerCase() === 'hassan.dev26@gmail.com' || !!currentAdmin;
  const isMainAdmin = loggedInEmail.toLowerCase() === 'gaturuhassan@gmail.com' || loggedInEmail.toLowerCase() === 'hassan.gaturu20@gmail.com' || loggedInEmail.toLowerCase() === 'hassan.dev26@gmail.com' || currentAdmin?.role === 'main_admin';

  // Load everything
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchOverrides(),
      fetchCommunitySubmissions(),
      getSisWeights(),
      fetchAllUserProfiles(),
      fetchAdminAccess(),
      fetchCorridorSettings(),
      fetchRemittanceChannels(),
      fetchChannelCoverage(),
      fetchAuditLogs()
    ]).then(([
      overridesData, submissionsData, weightsData, usersData, 
      adminsData, corridorsData, channelsData, coveragesData, auditData
    ]) => {
      if (isMounted) {
        setOverrides(overridesData);
        setSubmissions(submissionsData);
        setRegisteredUsers(usersData);
        setAdmins(adminsData);
        setCorridorSettings(corridorsData);
        setChannels(channelsData);
        setCoverages(coveragesData);
        setAuditLogs(auditData);

        // Pre-select dynamic provider if channels are available
        const activeCh = channelsData.filter(c => c.status === 'active');
        if (activeCh.length > 0 && !overrideProvider) {
          setOverrideProvider(activeCh[0].providerCode);
        }

        if (weightsData) {
          setWeights(weightsData);
          setWeightsForm({
            rate: weightsData.rate_weight.toString(),
            fee: weightsData.fee_weight.toString(),
            confidence: weightsData.confidence_weight.toString(),
            freshness: weightsData.freshness_weight.toString(),
            savings: weightsData.savings_weight.toString()
          });
        }
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error fetching dynamic SRCMC data:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // Sync found users for Admin assignment
  useEffect(() => {
    if (searchAdminEmail.trim() === '') {
      setFoundUsers([]);
      return;
    }
    const term = searchAdminEmail.toLowerCase();
    const filtered = registeredUsers.filter(u => u.email.toLowerCase().includes(term));
    setFoundUsers(filtered);
  }, [searchAdminEmail, registeredUsers]);

  // Action Dispatcher with mandatory 6-digit PIN checks
  const dispatchAction = (actionDesc: string, actionFn: () => Promise<void>) => {
    // If user is main_admin and hasn't set up a custom admin access, let them skip or prompt default PIN 123456
    setPendingAction({
      execute: actionFn,
      description: actionDesc
    });
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  // Submit PIN Code
  const handleVerifyPin = async () => {
    if (!pendingAction) return;

    // PIN lookup
    let isValid = false;
    const cleanPin = pinInput.trim();

    if (cleanPin.length !== 6 || isNaN(parseInt(cleanPin))) {
      setPinError('PIN code must be a 6-digit numeric combination.');
      return;
    }

    // Checking if primary admin bypass or matching secondary admin code
    const lowerEmail = loggedInEmail.toLowerCase();
    if (lowerEmail === 'hassan.gaturu20@gmail.com' || lowerEmail === 'gaturuhassan@gmail.com' || lowerEmail === 'hassan.dev26@gmail.com') {
      // Default sandbox bypass or initial credentials check
      const rec = admins.find(a => a.email.toLowerCase() === lowerEmail);
      if (rec) {
        if (rec.pin_code === cleanPin) isValid = true;
      } else {
        // Fallback default PIN
        if (cleanPin === '123456') isValid = true;
      }
    } else if (currentAdmin) {
      if (currentAdmin.pin_code === cleanPin) {
        isValid = true;
      }
    }

    if (isValid) {
      try {
        await pendingAction.execute();
        await logAuditAction(
          loggedInEmail,
          `AUTHORIZED_ACTION: ${pendingAction.description}`,
          'SYSTEM_ACTION',
          'SUCCESS',
          { pin_used: '******', executed_at: new Date().toISOString() }
        );
        setShowPinModal(false);
        setPendingAction(null);
        setRefreshTrigger(prev => prev + 1);
      } catch (err: any) {
        setPinError(err.message || 'Action execution failed after PIN verification.');
      }
    } else {
      setPinError('Authorization Denied. Invalid 6-digit PIN code entered.');
      await logAuditAction(
        loggedInEmail,
        `REJECTED_PIN_ATTEMPT: ${pendingAction.description}`,
        'SECURITY_AUDIT',
        'FAILED',
        { entered_pin_length: cleanPin.length, attempted_at: new Date().toISOString() }
      );
    }
  };

  // Quick Login as admin
  const handleAdminQuickLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await signUpWithSupabase(
        'hassan.gaturu20@gmail.com',
        'Hassan Gaturu',
        '+966 50 789 2026',
        'sa-pk'
      );
      if (res.user) {
        onSessionSync();
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Quick sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Save Admin Access Control
  const handleAddAdminAccess = async (userEmail: string) => {
    if (!isMainAdmin) {
      setAdminError('Access Denied. Only the Primary Main Admin can provision access.');
      return;
    }
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const newAdmin: SRCMCAdminAccess = {
      id: `admin-${Date.now()}`,
      email: userEmail.toLowerCase().trim(),
      role: newAdminRole,
      permissions: newAdminPermissions,
      pin_code: pin,
      pin_generated_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const action = async () => {
      await saveAdminAccess(newAdmin);
      await logAuditAction(loggedInEmail, `PROVISION_ADMIN_ACCESS`, 'ADMIN_ACCESS', userEmail, { role: newAdminRole, permissions: newAdminPermissions });
      setAdminSuccess(`Access control successfully assigned for ${userEmail}. PIN Generated: ${pin}`);
      setSearchAdminEmail('');
    };

    dispatchAction(`Provision Access for Admin ${userEmail}`, action);
  };

  // Regenerate PIN
  const handleRegenPin = (email: string) => {
    dispatchAction(`Regenerate PIN for Admin ${email}`, async () => {
      const newPin = await generatePinCode(email);
      await logAuditAction(loggedInEmail, `REGENERATE_PIN_CODE`, 'ADMIN_ACCESS', email, {});
      setAdminSuccess(`New PIN code successfully generated for ${email}: ${newPin}`);
    });
  };

  // Revoke Admin Access Completely
  const handleRevokeAdmin = (email: string) => {
    dispatchAction(`Revoke Access Completely for ${email}`, async () => {
      await revokeAdminAccess(email);
      await logAuditAction(loggedInEmail, `REVOKE_ADMIN_ACCESS`, 'ADMIN_ACCESS', email, {});
      setAdminSuccess(`Administrative access completely revoked for ${email}.`);
    });
  };

  // Toggle Admin Status
  const handleToggleAdminStatus = (adminRow: SRCMCAdminAccess) => {
    dispatchAction(`Toggle Status for Admin ${adminRow.email}`, async () => {
      const updated = {
        ...adminRow,
        is_active: !adminRow.is_active,
        updated_at: new Date().toISOString()
      };
      await saveAdminAccess(updated);
      await logAuditAction(loggedInEmail, `TOGGLE_ADMIN_STATUS`, 'ADMIN_ACCESS', adminRow.email, { new_status: updated.is_active });
      setAdminSuccess(`Admin status for ${adminRow.email} toggled successfully.`);
    });
  };

  // Save Corridor settings
  const handleSaveCorridorSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCorridorError('');
    setCorridorSuccess('');

    const targetCorridor = CORRIDORS.find(c => c.id === selectedCorridorCode);
    if (!targetCorridor) return;

    const action = async () => {
      const setting: CorridorSetting = {
        id: `cs-${selectedCorridorCode}`,
        corridor_code: selectedCorridorCode,
        destination_country: targetCorridor.toCountry,
        destination_currency: targetCorridor.currencyCode,
        status: corridorStatusField,
        display_as_coming_soon: corridorComingSoonField,
        notes: corridorNotesField,
        activated_at: corridorStatusField === 'active' ? new Date().toISOString() : undefined,
        disabled_at: corridorStatusField !== 'active' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString()
      };
      await saveCorridorSetting(setting);
      await logAuditAction(loggedInEmail, `UPDATE_CORRIDOR_SETTINGS`, 'CORRIDOR_SETTING', selectedCorridorCode, { status: corridorStatusField, DisplayAsComingSoon: corridorComingSoonField });
      setCorridorSuccess(`Corridor settings for ${selectedCorridorCode} updated live!`);
    };

    dispatchAction(`Update Corridor ${selectedCorridorCode}`, action);
  };

  // Register or Update Channel
  const handleRegisterChannel = (e: React.FormEvent) => {
    e.preventDefault();
    setChanError('');
    setChanSuccess('');

    const cId = chanId.toLowerCase().trim();
    const cCode = chanCode.toLowerCase().trim();

    if (!cId || !chanName || !cCode || !chanDisplayName) {
      setChanError('All primary identification fields are mandatory.');
      return;
    }

    const action = async () => {
      const isEdit = !!editingChannelId;
      const targetId = isEdit ? editingChannelId : cId;

      const channelPayload = {
        id: targetId,
        providerName: chanName,
        providerCode: cCode,
        displayName: chanDisplayName,
        category: chanCategory,
        status: chanStatus,
        supportedCorridors: chanCorridors,
        supportedTransferMethods: chanTransferMethods,
        defaultTransferFee: parseFloat(chanFee) || 10,
        defaultVatRate: parseFloat(chanVat) || 0.15,
        feeCurrency: 'SAR',
        notes: chanNotes,
        createdBy: loggedInEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveRemittanceChannel(channelPayload);
      if (isEdit) {
        await logAuditAction(loggedInEmail, `UPDATE_REMITTANCE_CHANNEL`, 'REMITTANCE_CHANNEL', cCode, { category: chanCategory, defaultFee: chanFee });
        setChanSuccess(`Remittance channel '${chanDisplayName}' was successfully updated live!`);
      } else {
        await logAuditAction(loggedInEmail, `REGISTER_REMITTANCE_CHANNEL`, 'REMITTANCE_CHANNEL', cCode, { category: chanCategory, defaultFee: chanFee });
        setChanSuccess(`Remittance channel '${chanDisplayName}' was successfully registered! Unique constraints verified.`);
      }
      
      // Reset
      setChanId('');
      setChanName('');
      setChanCode('');
      setChanDisplayName('');
      setChanNotes('');
      setEditingChannelId(null);
      
      // Re-fetch channels to update table UI
      const refreshedChans = await fetchRemittanceChannels();
      setChannels(refreshedChans);
    };

    dispatchAction(editingChannelId ? `Update Remittance Channel ${chanDisplayName}` : `Register Remittance Channel ${chanDisplayName}`, action);
  };

  // Delete Channel
  const handleDeleteChannel = (targetChanId: string, displayName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete/deactivate '${displayName}'? This will permanently erase the channel and all corridor coverage records.`)) {
      return;
    }
    setChanError('');
    setChanSuccess('');

    const action = async () => {
      await deleteRemittanceChannel(targetChanId);
      await logAuditAction(loggedInEmail, `DELETE_REMITTANCE_CHANNEL`, 'REMITTANCE_CHANNEL', targetChanId, {});
      setChanSuccess(`Remittance channel '${displayName}' and its configurations were successfully deleted.`);
      
      // Reset form if we were editing this channel
      if (editingChannelId === targetChanId) {
        setChanId('');
        setChanName('');
        setChanCode('');
        setChanDisplayName('');
        setChanNotes('');
        setEditingChannelId(null);
      }

      // Re-fetch channels to update table UI
      const refreshedChans = await fetchRemittanceChannels();
      setChannels(refreshedChans);
    };

    dispatchAction(`Delete Remittance Channel ${displayName}`, action);
  };

  // Start Editing Channel
  const handleStartEditChannel = (chan: any) => {
    setEditingChannelId(chan.id);
    setChanId(chan.id);
    setChanName(chan.providerName || '');
    setChanCode(chan.providerCode || '');
    setChanDisplayName(chan.displayName || '');
    setChanCategory(chan.category || 'wallet');
    setChanStatus(chan.status || 'active');
    setChanCorridors(chan.supportedCorridors || ['sa-ke', 'sa-ug']);
    setChanTransferMethods(chan.supportedTransferMethods || ['Mobile Wallet', 'Bank Transfer']);
    setChanFee(chan.defaultTransferFee?.toString() || '10');
    setChanVat(chan.defaultVatRate?.toString() || '0.15');
    setChanNotes(chan.notes || '');
    setChanError('');
    setChanSuccess('');
  };

  // Save Coverage settings
  const handleSaveCoverageSetting = (e: React.FormEvent) => {
    e.preventDefault();
    setCovError('');
    setCovSuccess('');

    if (!selectedChannelForCoverage) return;

    const action = async () => {
      const cov: ChannelCorridorCoverage = {
        id: `cov-${selectedChannelForCoverage.id}-${covCorridorCode}`,
        channel_id: selectedChannelForCoverage.id,
        corridor_id: covCorridorCode,
        status: covStatus,
        supported_transfer_methods: covTransferMethods,
        custom_transfer_fee: parseFloat(covFee),
        custom_vat_rate: parseFloat(covVat),
        exchange_rate: covExchangeRate !== '' ? parseFloat(covExchangeRate) : null,
        transfer_fee: parseFloat(covFee),
        vat_rate: parseFloat(covVat),
        vat_amount: covVatAmount !== '' ? parseFloat(covVatAmount) : null,
        other_costs: covOtherCosts !== '' ? parseFloat(covOtherCosts) : null,
        notes: covNotes
      };
      await saveChannelCoverage(cov);
      await logAuditAction(loggedInEmail, `UPDATE_CHANNEL_COVERAGE`, 'CHANNEL_COVERAGE', cov.id, { status: covStatus, customFee: covFee });
      setCovSuccess(`Corridor coverage for ${selectedChannelForCoverage.displayName} to ${covCorridorCode} updated successfully.`);
    };

    dispatchAction(`Update Corridor Coverage for ${selectedChannelForCoverage.displayName}`, action);
  };

  // Handle saving new override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const parsedRate = parseFloat(overrideRate);
    const parsedFee = parseFloat(overrideFee);
    const parsedExpiry = parseInt(overrideExpiry);
    const parsedVat = overrideVat !== '' ? parseFloat(overrideVat) : undefined;
    const parsedOtherCosts = parseFloat(overrideOtherCosts) || 0;

    if (isNaN(parsedRate) || parsedRate <= 0) {
      setFormError('Please enter a valid positive exchange rate.');
      return;
    }
    if (isNaN(parsedFee) || parsedFee < 0) {
      setFormError('Please enter a valid transfer fee (use 0 for free).');
      return;
    }
    if (parsedVat !== undefined && (isNaN(parsedVat) || parsedVat < 0)) {
      setFormError('Please enter a valid VAT amount (or leave blank for automatic 15% calculation).');
      return;
    }
    if (isNaN(parsedOtherCosts) || parsedOtherCosts < 0) {
      setFormError('Please enter valid hidden/other costs.');
      return;
    }
    if (isNaN(parsedExpiry) || parsedExpiry <= 0) {
      setFormError('Please enter a positive validity period (in minutes).');
      return;
    }

    const action = async () => {
      const expiresAt = new Date(Date.now() + parsedExpiry * 60 * 1000).toISOString();
      const payload = {
        corridor_id: overrideCorridor,
        provider_id: overrideProvider,
        rate: parsedRate,
        transfer_fee: parsedFee,
        expires_at: expiresAt,
        is_active: overrideIsActive,
        vat_amount: parsedVat,
        other_costs: parsedOtherCosts,
        status: 'active' as const,
        source_note: overrideReason,
        created_by: loggedInEmail
      };

      await saveOverride(payload);
      await logAuditAction(loggedInEmail, `CREATE_RATE_OVERRIDE`, 'RATE_OVERRIDE', overrideProvider, { corridor: overrideCorridor, rate: parsedRate, fee: parsedFee });
      setFormSuccess('Admin Override configured and deployed to RRE successfully!');
      setOverrideRate('');
      setOverrideVat('');
      setOverrideOtherCosts('0');
    };

    dispatchAction(`Create Rate Override for ${overrideProvider}`, action);
  };

  // Cancel/Delete override
  const handleDeleteOverride = async (id: string) => {
    const action = async () => {
      await deleteOverrideRow(id);
      await logAuditAction(loggedInEmail, `DELETE_RATE_OVERRIDE`, 'RATE_OVERRIDE', id, {});
    };
    dispatchAction(`Delete Rate Override ${id}`, action);
  };

  // Expire Override Now
  const handleExpireOverrideNow = async (row: any) => {
    const action = async () => {
      const expiredPayload = {
        ...row,
        expires_at: new Date().toISOString(),
        status: 'expired' as const
      };
      await saveOverride(expiredPayload);
      await logAuditAction(loggedInEmail, `FORCE_EXPIRE_RATE_OVERRIDE`, 'RATE_OVERRIDE', row.id, {});
    };
    dispatchAction(`Force Expire Override ${row.id}`, action);
  };

  // Approve community submission
  const handleApproveSubmission = async (id: string) => {
    const action = async () => {
      await updateSubmissionStatus(id, 'approved');
      await logAuditAction(loggedInEmail, `APPROVE_COMMUNITY_SUBMISSION`, 'COMMUNITY_SUBMISSION', id, {});
    };
    dispatchAction(`Approve Submission ${id}`, action);
  };

  // Reject community submission
  const handleRejectSubmission = async (id: string) => {
    const action = async () => {
      await updateSubmissionStatus(id, 'rejected');
      await logAuditAction(loggedInEmail, `REJECT_COMMUNITY_SUBMISSION`, 'COMMUNITY_SUBMISSION', id, {});
    };
    dispatchAction(`Reject Submission ${id}`, action);
  };

  // Handle updating formula weights
  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeightsError('');
    setWeightsSuccess('');

    const r = parseFloat(weightsForm.rate);
    const f = parseFloat(weightsForm.fee);
    const c = parseFloat(weightsForm.confidence);
    const fr = parseFloat(weightsForm.freshness);
    const s = parseFloat(weightsForm.savings);

    if ([r, f, c, fr, s].some(val => isNaN(val) || val < 0 || val > 1)) {
      setWeightsError('All weights must be numbers between 0.0 and 1.0.');
      return;
    }

    const total = parseFloat((r + f + c + fr + s).toFixed(4));
    if (total !== 1.0) {
      setWeightsError(`The weights must sum up exactly to 1.00. Current sum is ${total}. Please adjust values.`);
      return;
    }

    const action = async () => {
      await saveSisWeights({
        rate_weight: r,
        fee_weight: f,
        confidence_weight: c,
        freshness_weight: fr,
        savings_weight: s
      });
      await logAuditAction(loggedInEmail, `UPDATE_SIS_FORMULA_WEIGHTS`, 'SIS_WEIGHTS', 'GLOBAL', { rate_w: r, fee_w: f });
      setWeightsSuccess('SariRemit Intelligence Score (SIS) formula weights updated live!');
    };

    dispatchAction(`Update SIS Weights`, action);
  };

  // Dynamic Pipeline Resolved rates calculations
  const [resolvedList, setResolvedList] = useState<any[]>([]);
  const [loadingResolved, setLoadingResolved] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingResolved(true);

    Promise.all(
      CORRIDORS.map(async (corridor) => {
        try {
          const sic = await getSariRemitIntelligence({ corridorId: corridor.id, sendAmount: 1000 });
          return { corridor, sic };
        } catch (err) {
          console.error(`Error calculating SIC for corridor ${corridor.id}:`, err);
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const list: any[] = [];
      results.forEach((res) => {
        if (!res) return;
        const { corridor, sic } = res;
        sic.resolvedRates.forEach((resolved) => {
          const ch = channels.find(p => p.providerCode === resolved.providerId);
          const sis = sic.sisResults.find((s) => s.providerId === resolved.providerId);
          const trueCost = sic.trueCostResults.find((t) => t.providerId === resolved.providerId);

          if (sis) {
            list.push({
              corridor,
              provider: ch || { id: resolved.providerId, displayName: resolved.providerName },
              resolved: {
                resolved_rate: resolved.resolvedRate,
                transfer_fee: resolved.transferFee,
                source_type: resolved.sourceType,
                freshness_status: resolved.freshness,
                last_updated: resolved.lastUpdated
              },
              sis: {
                sis_score: sis.sisScore,
                sis_label: sis.sisLabel,
                rate_advantage_score: sis.components.rateAdvantageScore,
                fee_advantage_score: sis.components.feeAdvantageScore,
                true_cost_score: sis.components.trueCostScore,
                confidence_score: sis.components.confidenceScore,
                freshness_score: sis.components.freshnessScore,
                savings_score: sis.components.savingsScore
              },
              trueCost
            });
          }
        });
      });
      setResolvedList(list);
      setLoadingResolved(false);
    }).catch((err) => {
      console.error('Error fetching resolved rates from pipeline:', err);
      if (isMounted) setLoadingResolved(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger, overrides, submissions, channels]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto border border-slate-200 text-slate-800 shadow-sm animate-pulse">
          <Lock className="w-10 h-10 text-slate-700" />
        </div>

        <div className="space-y-3">
          <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 uppercase tracking-wider text-[10px] font-mono">
            Security Restriction
          </span>
          <h2 className="text-2xl font-sans font-black text-slate-900 tracking-tight">
            SRCMC Operator Portal Restricted
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The SariRemit Control and Monitoring Center manages the live RRE configuration, active community submission reviews, and evaluations. Access is strictly granted to designated system administrators.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md max-w-md mx-auto space-y-6">
          <div className="text-xs space-y-2 text-left">
            <div className="flex flex-col border-b border-slate-100 pb-2 space-y-1">
              <span className="text-slate-500 font-bold">Designated Admins:</span>
              <span className="font-mono font-bold text-slate-800 text-[10px]">hassan.dev26@gmail.com</span>
              <span className="font-mono font-bold text-slate-800 text-[10px]">hassan.gaturu20@gmail.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Your Status:</span>
              {activeSession.user ? (
                <span className="font-mono font-bold text-rose-600 truncate max-w-[200px]">
                  Connected ({activeSession.user.email})
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-400">Not Authenticated</span>
              )}
            </div>
          </div>

          {authError && (
            <p className="text-xs text-red-600 font-bold font-mono bg-red-50 p-2.5 rounded border border-red-100">
              {authError}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleAdminQuickLogin}
              disabled={authLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
              <span>Quick Authenticate as Admin</span>
            </button>
            <p className="text-[10px] text-slate-400 font-medium">
              Clicking establishes the administrative profile on the platform in one tap.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="srcmc-panel space-y-8 pb-24 text-left">
      <style>{`
        .srcmc-panel, .srcmc-panel div, .srcmc-panel h1, .srcmc-panel h2, .srcmc-panel h3, .srcmc-panel h4, .srcmc-panel p, .srcmc-panel span, .srcmc-panel label {
          color-scheme: dark;
        }
        .srcmc-panel .bg-white {
          background-color: #0C2547 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .srcmc-panel .border-slate-200, .srcmc-panel .border-slate-100 {
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .srcmc-panel .bg-slate-50, .srcmc-panel .bg-slate-100, .srcmc-panel .bg-slate-200 {
          background-color: #071A35 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .srcmc-panel select, .srcmc-panel input, .srcmc-panel textarea {
          background-color: #071A35 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .srcmc-panel .text-slate-900, .srcmc-panel .text-slate-850, .srcmc-panel .text-slate-800 {
          color: #F8FAFC !important;
        }
        .srcmc-panel .text-slate-500, .srcmc-panel .text-slate-450, .srcmc-panel .text-slate-400 {
          color: #94A3B8 !important;
        }
        .srcmc-panel .hover\\:bg-slate-50:hover, .srcmc-panel .hover\\:bg-slate-100:hover {
          background-color: rgba(148, 163, 184, 0.05) !important;
        }
        .srcmc-panel .text-emerald-600 {
          color: #10B981 !important;
        }
        .srcmc-panel .bg-emerald-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #10B981 !important;
        }
        .srcmc-panel .border-emerald-200, .srcmc-panel .border-emerald-150 {
          border-color: rgba(16, 185, 129, 0.25) !important;
        }
        .srcmc-panel .bg-slate-900 {
          background-color: #071A35 !important;
          border: 1px solid rgba(148, 163, 184, 0.12) !important;
        }
        .srcmc-panel .bg-slate-850 {
          background-color: #0C2547 !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-slate-800" />
            <span>SariRemit Control Centre (SRCMC)</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SRCMC OPERATIONAL COMMAND AND MONITORING HUB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
            isSupabaseConfigured 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isSupabaseConfigured ? 'Supabase Connected' : 'Local Sandbox Emulation'}
          </span>

          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Role Status Card */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-850 rounded-xl border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight">{activeSession.user?.name || 'Administrator'}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] uppercase font-mono font-bold">
                {currentAdmin?.role || 'SYSTEM ROOT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Authorized Actor: <span className="font-mono text-white font-bold">{loggedInEmail}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-xl">
          {(currentAdmin?.permissions || [
            'view_dashboard', 'monitor_rates', 'manage_overrides',
            'approve_community_rates', 'manage_corridors', 'manage_channels',
            'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'
          ]).map((p, idx) => (
            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5 text-[9px] font-mono">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 sm:gap-0">
        {[
          { key: 'overrides', label: 'Admin Overrides' },
          { key: 'submissions', label: 'Community Feed' },
          { key: 'channels', label: 'Remittance Channels' },
          { key: 'corridors', label: 'Corridor Control' },
          { key: 'admins', label: 'Admin Access Control' },
          { key: 'resolved', label: 'RRE Resolution Inspect' },
          { key: 'weights', label: 'SIS Formula Weights' },
          { key: 'audit_logs', label: 'Audit Logs Feed' },
          { key: 'users', label: 'Registered Users' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`px-4 py-3 text-xs uppercase tracking-wider font-black border-b-2 transition-all cursor-pointer ${
              activeSubTab === tab.key
                ? 'border-slate-800 text-slate-900 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Syncing database assets...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: ADMIN OVERRIDES */}
          {activeSubTab === 'overrides' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Side */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    Configure Admin Override
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Instantly override a corridor provider exchange rate, fee, VAT, or other cost.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveOverride} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Corridor Route</label>
                    <select
                      value={overrideCorridor}
                      onChange={(e) => setOverrideCorridor(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    >
                      {getActiveCorridorsSync().map(c => (
                        <option key={c.id} value={c.id}>{c.flag} {c.fromCountry} to {c.toCountry} ({c.currencyCode})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Remittance Channel / Provider</label>
                    <select
                      value={overrideProvider}
                      onChange={(e) => setOverrideProvider(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    >
                      <option value="">-- Choose Active Channel --</option>
                      {channels.filter(ch => ch.status === 'active').map(c => (
                        <option key={c.id} value={c.providerCode}>{c.displayName} ({c.providerCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Exchange Rate</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 33.4500"
                        value={overrideRate}
                        onChange={(e) => setOverrideRate(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Transfer Fee (SAR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrideFee}
                        onChange={(e) => setOverrideFee(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">VAT Amount (SAR)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto (15%)"
                        value={overrideVat}
                        onChange={(e) => setOverrideVat(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Hidden Costs (SAR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrideOtherCosts}
                        onChange={(e) => setOverrideOtherCosts(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Validity Period (Minutes)</label>
                    <select
                      value={overrideExpiry}
                      onChange={(e) => setOverrideExpiry(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="360">6 Hours</option>
                      <option value="1440">24 Hours</option>
                      <option value="10080">7 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Reason / Source Note</label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                      placeholder="Specify reason or reference..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Deploy Override To RRE
                  </button>
                </form>
              </div>

              {/* Overrides Table / History Side */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Active Overrides */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Active Overrides
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        These overrides are currently live and routing traffic in the rate resolution engine.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-150/40 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Provider / Channel</th>
                          <th className="py-3 px-4">Corridor</th>
                          <th className="py-3 px-4">Rate</th>
                          <th className="py-3 px-4">Fee / Costs</th>
                          <th className="py-3 px-4">Expires</th>
                          <th className="py-3 px-4">SIC Relationship Impacts</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {overrides.filter(o => o.is_active && (!o.expires_at || new Date(o.expires_at) > new Date())).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/30">
                              No active overrides in place. Normal pipeline in execution.
                            </td>
                          </tr>
                        ) : (
                          overrides.filter(o => o.is_active && (!o.expires_at || new Date(o.expires_at) > new Date())).map((row) => {
                            const corr = CORRIDORS.find(c => c.id === row.corridor_id);
                            return (
                              <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-4 px-4 font-bold text-slate-800">{row.provider_id.toUpperCase()}</td>
                                <td className="py-4 px-4 font-bold">
                                  {corr ? `${corr.flag} ${corr.toCountry}` : row.corridor_id.toUpperCase()}
                                </td>
                                <td className="py-4 px-4 font-mono font-bold text-emerald-700">{row.rate.toFixed(4)}</td>
                                <td className="py-4 px-4">
                                  <div className="font-mono space-y-0.5 text-[10px]">
                                    <div>Fee: <span className="font-bold text-slate-700">{row.transfer_fee} SAR</span></div>
                                    <div>VAT: <span className="font-bold text-slate-700">{row.vat_amount ?? 'Auto'} SAR</span></div>
                                    <div>Other: <span className="font-bold text-slate-700">{row.other_costs ?? 0} SAR</span></div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">
                                  {row.expires_at ? new Date(row.expires_at).toLocaleTimeString() : 'Never'}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold uppercase">
                                      In RRE
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold uppercase">
                                      Affected True Cost
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase">
                                      Affected SIS
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right space-y-1">
                                  <button
                                    onClick={() => handleExpireOverrideNow(row)}
                                    className="px-2 py-1 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-black cursor-pointer uppercase block w-full text-center"
                                  >
                                    Expire Now
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOverride(row.id)}
                                    className="px-2 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-black cursor-pointer uppercase block w-full text-center"
                                  >
                                    Cancel / Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Override History */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-600" />
                      Override History
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Auditable record of historical or expired rate overrides.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Provider</th>
                          <th className="py-3 px-4">Corridor</th>
                          <th className="py-3 px-4">Rate / Fee</th>
                          <th className="py-3 px-4">Created By</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Reason / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {overrides.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                              No history records present.
                            </td>
                          </tr>
                        ) : (
                          overrides.map((row) => {
                            const isCurrentlyActive = row.is_active && (!row.expires_at || new Date(row.expires_at) > new Date());
                            if (isCurrentlyActive) return null; // Only show inactive/expired in history

                            const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
                            const statusLabel = isExpired ? 'Expired' : (row.status === 'replaced' ? 'Replaced' : 'Cancelled');
                            const statusColor = isExpired ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800';

                            return (
                              <tr key={row.id} className="hover:bg-slate-50/20 text-slate-600 transition-colors">
                                <td className="py-3 px-4 font-bold uppercase">{row.provider_id}</td>
                                <td className="py-3 px-4 font-bold">{row.corridor_id.toUpperCase()}</td>
                                <td className="py-3 px-4 font-mono">
                                  <span>{row.rate.toFixed(4)}</span> / <span className="text-[10px]">{row.transfer_fee} SAR</span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-bold truncate max-w-[120px]">{row.created_by || 'Root Main'}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[10px] italic text-slate-400">{row.source_note || 'Manual trigger deactivation'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: COMMUNITY FEED */}
          {activeSubTab === 'submissions' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Community Submitted Rates Feed
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Approve or reject rate reports uploaded by expats. Approved rates enter RRE resolution instantly.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-5">Submitter Details</th>
                      <th className="py-3 px-5">Corridor Route</th>
                      <th className="py-3 px-5">Reported Rate</th>
                      <th className="py-3 px-5">Fees & Extra Costs</th>
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Action Status</th>
                      <th className="py-3 px-5 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                          No expat rate reports registered yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((row) => {
                        const corr = CORRIDORS.find(c => c.id === row.corridor_id);
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-800 block">{row.submitted_by_name || 'Contributor'}</span>
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{row.submitted_by_email}</span>
                            </td>
                            <td className="py-4 px-5">
                              {corr ? (
                                <span className="inline-flex items-center gap-1 font-bold">
                                  <span>{corr.flag}</span>
                                  <span>{corr.toCountry} ({corr.currencyCode})</span>
                                </span>
                              ) : row.corridor_id.toUpperCase()}
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-bold text-slate-800 font-mono">{row.exchange_rate.toFixed(4)}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{row.provider_name}</span>
                            </td>
                            <td className="py-4 px-5 font-mono text-[10px] text-slate-600">
                              <div>Fee: <span className="font-bold text-slate-800">{row.transfer_fee} SAR</span></div>
                              <div>VAT: <span className="font-bold text-slate-800">{row.vat_amount ?? 0} SAR</span></div>
                              <div>Other: <span className="font-bold text-slate-800">{row.other_costs ?? 0} SAR</span></div>
                            </td>
                            <td className="py-4 px-5 text-slate-400 font-mono text-[10px]">
                              {new Date(row.submitted_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                                row.status === 'approved' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : row.status === 'rejected' 
                                  ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                  : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right space-x-1.5">
                              {row.status === 'pending' ? (
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => handleApproveSubmission(row.id)}
                                    className="px-2.5 py-1 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded cursor-pointer uppercase shadow-xs transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectSubmission(row.id)}
                                    className="px-2.5 py-1 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-black rounded cursor-pointer uppercase shadow-xs transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 italic">Moderated</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: REMITTANCE CHANNELS */}
          {activeSubTab === 'channels' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Channel Creation & Edit Panel */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-emerald-600" />
                    {editingChannelId ? 'Edit Remittance Channel' : 'Register Remittance Channel'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingChannelId 
                      ? 'Update primary properties, fees, and system-wide status of this channel.'
                      : 'Add new banks, digital wallets, exchange houses, or operators dynamically.'}
                  </p>
                </div>

                {chanError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{chanError}</span>
                  </div>
                )}
                {chanSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{chanSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterChannel} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Unique Channel ID (No Spaces)</label>
                    <input
                      type="text"
                      placeholder="e.g. barq"
                      value={chanId}
                      onChange={(e) => setChanId(e.target.value)}
                      disabled={!!editingChannelId}
                      className={`w-full text-xs font-bold p-3 border rounded-xl outline-none font-mono ${
                        editingChannelId 
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Provider Code</label>
                      <input
                        type="text"
                        placeholder="e.g. barq"
                        value={chanCode}
                        onChange={(e) => setChanCode(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Category</label>
                      <select
                        value={chanCategory}
                        onChange={(e) => setChanCategory(e.target.value as any)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                      >
                        <option value="wallet">Digital Wallet</option>
                        <option value="bank">Traditional Bank</option>
                        <option value="exchange_house">Exchange House</option>
                        <option value="money_transfer_operator">MTO</option>
                        <option value="other">Other Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Official Registered Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Barq Remit"
                      value={chanName}
                      onChange={(e) => setChanName(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Display Name (UI)</label>
                    <input
                      type="text"
                      placeholder="e.g. Barq Wallet"
                      value={chanDisplayName}
                      onChange={(e) => setChanDisplayName(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Fee (SAR)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={chanFee}
                        onChange={(e) => setChanFee(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">VAT % Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        value={chanVat}
                        onChange={(e) => setChanVat(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">System Status</label>
                      <select
                        value={chanStatus}
                        onChange={(e) => setChanStatus(e.target.value as any)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="coming_soon">Coming Soon</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Internal Notes</label>
                    <textarea
                      value={chanNotes}
                      onChange={(e) => setChanNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                      placeholder="Add system notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                    >
                      {editingChannelId ? 'Save Changes' : 'Register Dynamic Channel'}
                    </button>
                    {editingChannelId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChannelId(null);
                          setChanId('');
                          setChanName('');
                          setChanCode('');
                          setChanDisplayName('');
                          setChanNotes('');
                          setChanStatus('active');
                          setChanError('');
                          setChanSuccess('');
                        }}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs uppercase tracking-wider font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Channels list and Corridor Specific settings drawer */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Channel Records Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <ListCollapse className="w-4 h-4 text-indigo-600" />
                      Remittance Channels Directory
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select any registered provider to configure customized route-by-route coverage, VAT and transfer fee structures.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-4">Channel (ID)</th>
                          <th className="py-3 px-4">Provider Code</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Default Fee</th>
                          <th className="py-3 px-4">Corridors</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Configure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {channels.map((chan) => {
                          return (
                            <tr key={chan.id} className={`hover:bg-slate-50/40 transition-colors ${selectedChannelForCoverage?.id === chan.id ? 'bg-indigo-50/20' : ''}`}>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                <div>{chan.displayName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {chan.id}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-500">{chan.providerCode}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-600">{chan.category.toUpperCase()}</td>
                              <td className="py-3.5 px-4 font-mono">{chan.defaultTransferFee} SAR</td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                                  {chan.supportedCorridors.map((co: string) => (
                                    <span key={co} className="px-1 bg-slate-100 border border-slate-150 rounded text-[9px] font-bold">
                                      {co.toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                  chan.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {chan.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEditChannel(chan)}
                                    className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      const activeCorrs = getActiveCorridorsSync();
                                      const defaultCorridor = activeCorrs.find(c => chan.supportedCorridors?.includes(c.id))?.id 
                                        || activeCorrs[0]?.id 
                                        || chan.supportedCorridors[0] 
                                        || 'sa-ke';
                                      setSelectedChannelForCoverage(chan);
                                      setCovCorridorCode(defaultCorridor);
                                      const existingCov = coverages.find(cv => cv.channel_id === chan.id && cv.corridor_id === defaultCorridor);
                                      if (existingCov) {
                                        setCovStatus(existingCov.status);
                                        setCovFee(existingCov.transfer_fee?.toString() || existingCov.custom_transfer_fee?.toString() || chan.defaultTransferFee.toString());
                                        setCovVat(existingCov.vat_rate?.toString() || existingCov.custom_vat_rate?.toString() || chan.defaultVatRate.toString());
                                        setCovExchangeRate(existingCov.exchange_rate?.toString() || '');
                                        setCovVatAmount(existingCov.vat_amount?.toString() || '');
                                        setCovOtherCosts(existingCov.other_costs?.toString() || '');
                                        setCovNotes(existingCov.notes || '');
                                      } else {
                                        setCovStatus('active');
                                        setCovFee(chan.defaultTransferFee.toString());
                                        setCovVat(chan.defaultVatRate.toString());
                                        setCovExchangeRate('');
                                        setCovVatAmount('');
                                        setCovOtherCosts('');
                                        setCovNotes('');
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 rounded-lg cursor-pointer"
                                  >
                                    Coverage
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChannel(chan.id, chan.displayName)}
                                    className="px-2 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-lg cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Corridor Specific settings drawer */}
                {selectedChannelForCoverage && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-black text-slate-850 uppercase text-xs">
                          Route-specific Coverage settings: {selectedChannelForCoverage.displayName}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Configure dynamic attributes specifically for selected corridors.
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedChannelForCoverage(null)}
                        className="px-2 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 rounded font-bold cursor-pointer"
                      >
                        Close Panel
                      </button>
                    </div>

                    {covError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold">
                        {covError}
                      </div>
                    )}
                    {covSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                        {covSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSaveCoverageSetting} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Corridor Route</label>
                        <select
                          value={covCorridorCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCovCorridorCode(val);
                            const existingCov = coverages.find(cv => cv.channel_id === selectedChannelForCoverage.id && cv.corridor_id === val);
                            if (existingCov) {
                              setCovStatus(existingCov.status);
                              setCovFee(existingCov.transfer_fee?.toString() || existingCov.custom_transfer_fee?.toString() || selectedChannelForCoverage.defaultTransferFee.toString());
                              setCovVat(existingCov.vat_rate?.toString() || existingCov.custom_vat_rate?.toString() || selectedChannelForCoverage.defaultVatRate.toString());
                              setCovExchangeRate(existingCov.exchange_rate?.toString() || '');
                              setCovVatAmount(existingCov.vat_amount?.toString() || '');
                              setCovOtherCosts(existingCov.other_costs?.toString() || '');
                              setCovNotes(existingCov.notes || '');
                            } else {
                              setCovStatus('active');
                              setCovFee(selectedChannelForCoverage.defaultTransferFee.toString());
                              setCovVat(selectedChannelForCoverage.defaultVatRate.toString());
                              setCovExchangeRate('');
                              setCovVatAmount('');
                              setCovOtherCosts('');
                              setCovNotes('');
                            }
                          }}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none"
                        >
                          {getActiveCorridorsSync().map((c) => (
                            <option key={c.id} value={c.id}>{c.flag} {c.id.toUpperCase()} ({c.fromCountry} to {c.toCountry})</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Route Status</label>
                        <select
                          value={covStatus}
                          onChange={(e) => setCovStatus(e.target.value as any)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="coming_soon">Coming Soon</option>
                          <option value="paused">Paused</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Custom Fee (SAR)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={covFee}
                          onChange={(e) => setCovFee(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Custom VAT % (e.g. 0.15)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={covVat}
                          onChange={(e) => setCovVat(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Custom Exchange Rate (Optional)</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="Uses market rate if empty"
                          value={covExchangeRate}
                          onChange={(e) => setCovExchangeRate(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Custom VAT Amount (Optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1.50"
                          value={covVatAmount}
                          onChange={(e) => setCovVatAmount(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Custom Other Costs (Optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 2.00"
                          value={covOtherCosts}
                          onChange={(e) => setCovOtherCosts(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Notes / Justification</label>
                        <input
                          type="text"
                          placeholder="e.g. Promotion rate details"
                          value={covNotes}
                          onChange={(e) => setCovNotes(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div className="md:col-span-12 mt-2">
                        <button
                          type="submit"
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          Apply Setting
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 4: CORRIDOR CONTROL */}
          {activeSubTab === 'corridors' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Side */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Configure Corridor Status
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Change route parameters, mark as coming-soon, or restrict a route entirely.
                  </p>
                </div>

                {corridorError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold">
                    {corridorError}
                  </div>
                )}
                {corridorSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                    {corridorSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveCorridorSettings} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Target Corridor</label>
                    <select
                      value={selectedCorridorCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCorridorCode(val);
                        const setting = corridorSettings.find(s => s.corridor_code === val);
                        if (setting) {
                          setCorridorStatusField(setting.status);
                          setCorridorComingSoonField(setting.display_as_coming_soon);
                          setCorridorNotesField(setting.notes || '');
                        } else {
                          setCorridorStatusField('active');
                          setCorridorComingSoonField(false);
                          setCorridorNotesField('');
                        }
                      }}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    >
                      {CORRIDORS.map(c => (
                        <option key={c.id} value={c.id}>{c.flag} {c.fromCountry} to {c.toCountry} ({c.currencyCode})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Corridor Route Status</label>
                    <select
                      value={corridorStatusField}
                      onChange={(e) => setCorridorStatusField(e.target.value as any)}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                    >
                      <option value="active">Active (Deploy Live)</option>
                      <option value="inactive">Inactive / Hidden</option>
                      <option value="coming_soon">Coming Soon Pipeline</option>
                      <option value="paused">Temporarily Paused</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="comingSoonField"
                      checked={corridorComingSoonField}
                      onChange={(e) => setCorridorComingSoonField(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 outline-none"
                    />
                    <label htmlFor="comingSoonField" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Flag / Display as 'Coming Soon' in UI
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Route Notes</label>
                    <textarea
                      value={corridorNotesField}
                      onChange={(e) => setCorridorNotesField(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      placeholder="Specify country pipeline details..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Deploy Corridor Config
                  </button>
                </form>
              </div>

              {/* Status Board */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    SariRemit Live Corridor Status Board
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live status representation of corridors in user facing application.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {CORRIDORS.map(corridor => {
                    const setting = corridorSettings.find(s => s.corridor_code === corridor.id);
                    const status = setting ? setting.status : 'active';
                    const isComing = setting ? setting.display_as_coming_soon : false;

                    const bg = status === 'active' ? 'bg-emerald-50/50 border-emerald-150 text-emerald-800' : status === 'paused' ? 'bg-amber-50/50 border-amber-150 text-amber-800' : 'bg-slate-50/70 border-slate-200 text-slate-500';

                    return (
                      <div key={corridor.id} className={`p-4 rounded-2xl border ${bg} space-y-2`}>
                        <div className="flex justify-between items-center">
                          <span className="text-3xl">{corridor.flag}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-100'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-bold block">{corridor.toCountry}</span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">{corridor.id.toUpperCase()} • {corridor.currencyCode}</span>
                        </div>
                        {isComing && (
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[8px] font-black uppercase">
                            Coming Soon
                          </span>
                        )}
                        {setting?.notes && (
                          <p className="text-[9px] italic text-slate-400 line-clamp-2 mt-2">{setting.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: ADMIN ACCESS CONTROL */}
          {activeSubTab === 'admins' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Assign Access */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Assign Administrative Access
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Main Admins can provision role assignments and grant scoped permissions to registered platform users.
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold">
                    {adminError}
                  </div>
                )}
                {adminSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                    {adminSuccess}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Search User by Email</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search expat profiles..."
                        value={searchAdminEmail}
                        onChange={(e) => setSearchAdminEmail(e.target.value)}
                        className="w-full text-xs font-bold pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    {foundUsers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {foundUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSearchAdminEmail(user.email);
                              setFoundUsers([]);
                            }}
                            className="w-full text-left p-3 text-xs hover:bg-slate-50 font-bold block"
                          >
                            {user.name} ({user.email})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Administrative Role</label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => {
                        const r = e.target.value as any;
                        setNewAdminRole(r);
                        // pre-assign permission profiles
                        if (r === 'main_admin') {
                          setNewAdminPermissions(['view_dashboard', 'monitor_rates', 'manage_overrides', 'approve_community_rates', 'manage_corridors', 'manage_channels', 'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins']);
                        } else if (r === 'rate_monitor') {
                          setNewAdminPermissions(['view_dashboard', 'monitor_rates']);
                        } else if (r === 'override_manager') {
                          setNewAdminPermissions(['view_dashboard', 'monitor_rates', 'manage_overrides', 'view_history']);
                        } else if (r === 'channel_manager') {
                          setNewAdminPermissions(['view_dashboard', 'manage_channels']);
                        } else {
                          setNewAdminPermissions(['view_dashboard']);
                        }
                      }}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="main_admin">Main Admin (Root Control)</option>
                      <option value="rate_monitor">Rate Monitor</option>
                      <option value="override_manager">Override Manager</option>
                      <option value="community_verifier">Community Verifier</option>
                      <option value="channel_manager">Channel Manager</option>
                      <option value="corridor_manager">Corridor Manager</option>
                      <option value="viewer">Viewer (Read-Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Grant Permissions</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                      {[
                        { key: 'view_dashboard', label: 'View Dashboard' },
                        { key: 'monitor_rates', label: 'Monitor Rates' },
                        { key: 'manage_overrides', label: 'Manage Overrides' },
                        { key: 'approve_community_rates', label: 'Approve Community Rates' },
                        { key: 'manage_corridors', label: 'Manage Corridors' },
                        { key: 'manage_channels', label: 'Manage Channels' },
                        { key: 'view_sic', label: 'Inspect SIC resolutions' },
                        { key: 'view_true_cost', label: 'Inspect True Cost' },
                        { key: 'view_history', label: 'Inspect Histories' },
                        { key: 'view_audit_logs', label: 'Inspect Audit Logs' },
                        { key: 'manage_admins', label: 'Manage System Admins' }
                      ].map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`perm-${perm.key}`}
                            checked={newAdminPermissions.includes(perm.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAdminPermissions([...newAdminPermissions, perm.key]);
                              } else {
                                setNewAdminPermissions(newAdminPermissions.filter(p => p !== perm.key));
                              }
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <label htmlFor={`perm-${perm.key}`} className="text-[11px] font-bold text-slate-700 cursor-pointer">{perm.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddAdminAccess(searchAdminEmail)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Provision Scoped Access
                  </button>
                </div>
              </div>

              {/* Admins Table */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Authorized Access Directory (Main & Secondary Operators)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Directory of admins with security PIN credentials.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Operator Email</th>
                        <th className="py-3 px-4">System Role</th>
                        <th className="py-3 px-4">Security PIN</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Credentials Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {admins.map((adminRow) => {
                        const isRevealed = revealPinId === adminRow.id;
                        return (
                          <tr key={adminRow.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{adminRow.email}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-600">{adminRow.role.toUpperCase()}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-xs text-slate-800">
                                  {isRevealed ? adminRow.pin_code : '******'}
                                </span>
                                <button
                                  onClick={() => setRevealPinId(isRevealed ? null : adminRow.id)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Reveal PIN Code"
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                adminRow.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {adminRow.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleToggleAdminStatus(adminRow)}
                                className="px-2 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer font-bold"
                              >
                                Toggle Access
                              </button>
                              <button
                                onClick={() => handleRegenPin(adminRow.email)}
                                className="px-2 py-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg cursor-pointer font-bold"
                              >
                                Regen PIN
                              </button>
                              {adminRow.email !== 'gaturuhassan@gmail.com' && (
                                <button
                                  onClick={() => handleRevokeAdmin(adminRow.email)}
                                  className="px-2 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer font-bold"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: RRE RESOLUTION INSPECT */}
          {activeSubTab === 'resolved' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Compass className="w-5 h-5 text-emerald-600" />
                    SariRemit Intelligence Core (SIC) — Active Resolutions
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live end-to-end tracing of resolved exchange rates, community validation confidence indices, and active admin overrides.
                  </p>
                </div>
              </div>

              {loadingResolved ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-wider animate-pulse">Running full SIC pipeline calculation...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-5">Corridor Route</th>
                        <th className="py-3 px-5">Remittance Channel</th>
                        <th className="py-3 px-5">Resolved Rate (SAR)</th>
                        <th className="py-3 px-5">Fees (Fee+VAT+Other)</th>
                        <th className="py-3 px-5">RRE Resolution Source</th>
                        <th className="py-3 px-5">Transparency Index (TCE)</th>
                        <th className="py-3 px-5 font-mono">SIS Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {resolvedList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                            No channels or corridors currently active.
                          </td>
                        </tr>
                      ) : (
                        resolvedList.map((row, index) => {
                          const srcLabelClass = row.resolved.source_type === 'admin_override' 
                            ? 'bg-purple-100 text-purple-800 font-black border-purple-200'
                            : row.resolved.source_type === 'community_verified'
                            ? 'bg-indigo-100 text-indigo-800 font-bold border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200';

                          const tColor = row.trueCost?.transparencyRating === 'excellent' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border-amber-200';

                          return (
                            <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-5">
                                <span className="inline-flex items-center gap-1 font-bold">
                                  <span>{row.corridor.flag}</span>
                                  <span>{row.corridor.fromCountry} to {row.corridor.toCountry}</span>
                                </span>
                              </td>
                              <td className="py-4 px-5 font-bold text-slate-800">{row.provider.displayName}</td>
                              <td className="py-4 px-5 font-mono font-bold text-emerald-700">{row.resolved.resolved_rate.toFixed(4)}</td>
                              <td className="py-4 px-5 font-mono text-[10px] text-slate-500">
                                <div>Fee: <span className="font-bold text-slate-700">{row.resolved.transfer_fee} SAR</span></div>
                                <div>VAT: <span className="font-bold text-slate-700">{row.trueCost?.vatAmount || 0} SAR</span></div>
                                <div>Other: <span className="font-bold text-slate-700">{row.trueCost?.otherCosts || 0} SAR</span></div>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2 py-1 rounded text-[9px] uppercase border font-semibold ${srcLabelClass}`}>
                                  {row.resolved.source_type.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase border font-black ${tColor}`}>
                                  {row.trueCost?.transparencyRating || 'Excellent'}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-mono text-slate-900 font-black text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-indigo-600">{row.sis.sis_score}</span>
                                  <span className="text-[9px] text-slate-400 font-sans">({row.sis.sis_label})</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SIS FORMULA WEIGHTS */}
          {activeSubTab === 'weights' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Weights Form */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Percent className="w-5 h-5 text-emerald-600" />
                    Configure Dynamic Intelligence (SIS) Weightings
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    The SariRemit Intelligence Score (SIS) ranks operators dynamically. Calibrate factor weightings to refine priorities (Must sum exactly to 1.00).
                  </p>
                </div>

                {weightsError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-mono font-bold">
                    {weightsError}
                  </div>
                )}
                {weightsSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold">
                    {weightsSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveWeights} className="space-y-4 font-semibold">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Rate Advantage weight</label>
                      <span className="text-[11px] font-mono text-slate-700 font-bold">{(parseFloat(weightsForm.rate) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weightsForm.rate}
                      onChange={(e) => setWeightsForm({ ...weightsForm, rate: e.target.value })}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Transfer Fee Advantage weight</label>
                      <span className="text-[11px] font-mono text-slate-700 font-bold">{(parseFloat(weightsForm.fee) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weightsForm.fee}
                      onChange={(e) => setWeightsForm({ ...weightsForm, fee: e.target.value })}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Confidence and Verification Index</label>
                      <span className="text-[11px] font-mono text-slate-700 font-bold">{(parseFloat(weightsForm.confidence) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weightsForm.confidence}
                      onChange={(e) => setWeightsForm({ ...weightsForm, confidence: e.target.value })}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Rate Freshness and Age penalty weight</label>
                      <span className="text-[11px] font-mono text-slate-700 font-bold">{(parseFloat(weightsForm.freshness) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weightsForm.freshness}
                      onChange={(e) => setWeightsForm({ ...weightsForm, freshness: e.target.value })}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Expat Exchanged Savings (TCE) weight</label>
                      <span className="text-[11px] font-mono text-slate-700 font-bold">{(parseFloat(weightsForm.savings) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={weightsForm.savings}
                      onChange={(e) => setWeightsForm({ ...weightsForm, savings: e.target.value })}
                      className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Deploy Intelligence Rules
                  </button>
                </form>
              </div>

              {/* Formula Explanation */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Compass className="w-5 h-5 shrink-0" />
                  <h4 className="font-black text-xs uppercase tracking-wider">SariRemit Multi-Factor Scoring Formula Tracing</h4>
                </div>
                <div className="text-xs text-slate-650 space-y-3 leading-relaxed">
                  <p>
                    The active engine utilizes five core indicators parsed from live resolution data arrays:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 bg-white border border-slate-150 p-4 rounded-xl">
                    <li><strong className="text-slate-800">Rate Advantage ({(weights.rate_weight * 100).toFixed(0)}%):</strong> How highly competitive the exchange rate is versus the active market reference feed.</li>
                    <li><strong className="text-slate-800">Fee Advantage ({(weights.fee_weight * 100).toFixed(0)}%):</strong> Minimization index for transaction fees.</li>
                    <li><strong className="text-slate-800">Confidence ({(weights.confidence_weight * 100).toFixed(0)}%):</strong> Multiplier for validated status (Highest for management overrides, followed by community confirmed, lowest for fallbacks).</li>
                    <li><strong className="text-slate-800">Freshness ({(weights.freshness_weight * 100).toFixed(0)}%):</strong> Decaying factor scaling down aging rates.</li>
                    <li><strong className="text-slate-800">True Cost Savings ({(weights.savings_weight * 100).toFixed(0)}%):</strong> Disclosed net recipient value inside our True Cost Engine.</li>
                  </ul>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 font-mono text-[10px] space-y-1">
                    <span className="font-black block uppercase text-slate-500">Live Equation Status</span>
                    <span className="text-indigo-800 font-bold block">
                      SIS_SCORE = (RateAdv * {weights.rate_weight}) + (FeeAdv * {weights.fee_weight}) + (Conf * {weights.confidence_weight}) + (Fresh * {weights.freshness_weight}) + (Savings * {weights.savings_weight})
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeSubTab === 'audit_logs' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  System Audit Logs Feed
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Immutable chronological log tracking operator actions and credential PIN checks.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Administrator Email</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Target Type / ID</th>
                      <th className="py-3 px-4">Metadata Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                          No audit entries recorded in database yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/20 text-slate-650 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-400 shrink-0">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-850 font-mono truncate max-w-[150px]">{log.actor_email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-150 text-[9px] font-black uppercase">
                              {log.action.replace('AUTHORIZED_ACTION: ', '')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-bold font-mono text-[10px]">
                            {log.target_type} • {log.target_id}
                          </td>
                          <td className="py-3 px-4 text-[10px] text-slate-400 font-mono truncate max-w-xs" title={JSON.stringify(log.metadata)}>
                            {JSON.stringify(log.metadata)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: REGISTERED USERS */}
          {activeSubTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    Expat Platform Profiles Directory
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Review registered expat profiles, default corridor selections, and contact info securely.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-200/60 rounded-lg text-slate-750 font-bold text-[10px] uppercase font-mono">
                  {registeredUsers.length} Records Found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-5">Member Name</th>
                      <th className="py-3 px-5">Email Address</th>
                      <th className="py-3 px-5">KSA Mobile Contact</th>
                      <th className="py-3 px-5">Default Corridor</th>
                      <th className="py-3 px-5">Registered Since</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registeredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center font-bold text-slate-400 uppercase tracking-widest bg-slate-50/20">
                          No authenticated members recorded in Supabase yet.
                        </td>
                      </tr>
                    ) : (
                      registeredUsers.map((user, idx) => {
                        const corr = CORRIDORS.find(c => c.id === user.preferredCorridorId);
                        const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'SR';
                        const colors = ['bg-emerald-100 text-emerald-800 border-emerald-200', 'bg-blue-100 text-blue-800 border-blue-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-indigo-100 text-indigo-800 border-indigo-200'];
                        const colorClass = colors[idx % colors.length];

                        return (
                          <tr key={user.id || idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${colorClass}`}>
                                  {initials}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 block">{user.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">ID: {user.id ? user.id.slice(0, 8) : `guest-${idx}`}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 font-mono font-bold text-slate-600">{user.email}</td>
                            <td className="py-4 px-5 text-slate-550 font-bold font-mono">{user.phone || '+966 (05) ...'}</td>
                            <td className="py-4 px-5 font-bold">
                              {corr ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-100 text-slate-700">
                                  <span>{corr.flag}</span>
                                  <span>{corr.toCountry}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-slate-400 font-bold font-mono">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'July 7, 2026'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SECURE 6-DIGIT PIN AUTHENTICATION DIALOG MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Key className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-sans font-black text-slate-900 tracking-tight">
                Secure PIN Code Authorization
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed px-4">
                Please enter your assigned 6-digit administrative security PIN to execute: <br />
                <strong className="text-slate-800">"{pendingAction?.description}"</strong>
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold text-center">
                {pinError}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="password"
                maxLength={6}
                placeholder="• • • • • •"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl font-black font-mono tracking-[0.5em] p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-400"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowPinModal(false);
                    setPendingAction(null);
                  }}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPin}
                  className="py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Authorize Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
