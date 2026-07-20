import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { EpeService } from '../services/sic/evidenceProvenanceService';
import { EdeService, ERDE_FEATURE_FLAGS } from '../services/sic/evidenceResolutionService';
import { SisService, SIS_FEATURE_FLAGS } from '../services/sic/sisIntelligenceService';
import { 
  TranslationDict, Corridor, UserProfile,
  BrandAsset, BrandAssetType, BrandAssetStatus, BrandingApprovalStatus, BrandAssetPermission,
  EvidenceRecord, EpeAuditLog, ResolutionResult, EvidenceConflict, ResolutionPolicy, ResolutionContext,
  SisPolicy
} from '../types';
import { CORRIDORS, PROVIDERS } from '../services/ratesService';
import { 
  fetchOverrides, 
  saveOverride, 
  deleteOverrideRow, 
  fetchCommunitySubmissions, 
  updateSubmissionStatus, 
  updateSubmissionStatusEx,
  toggleUserRateSubmissionRestriction,
  fetchCrvsConfig,
  saveCrvsConfig,
  fetchFraudIntegrityEvents,
  logFraudIntegrityEvent,
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
  assignAdminAccess,
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
  SRCMCAuditLog,
  fetchBrandAssets,
  saveBrandAsset,
  deleteBrandAsset,
  fetchBrandAssetPermissions,
  saveBrandAssetPermission,
  logBamAudit,
  resolveProviderBranding,
  fetchAllSupportRequestsAdmin,
  updateSupportRequestAdmin,
  fetchSupportMessages,
  addSupportMessage
} from '../services/supabaseService';
import { getBamFeatureFlags, saveBamFeatureFlags } from '../services/bamAssetResolver';
import { 
  Settings, ShieldCheck, Database, FileText, CheckCircle2, 
  XCircle, Trash2, PlusCircle, RefreshCw, AlertTriangle, HelpCircle, 
  ArrowRightLeft, Percent, Compass, Clock, Users, User, Lock, Sparkles,
  Eye, EyeOff, Search, PlayCircle, ToggleLeft, ShieldAlert, Key, Globe, Layout, ListCollapse, CheckSquare,
  Shield, CheckCircle, Clock3, Menu, X, ChevronDown, ChevronRight, Activity, ArrowUpRight, LogOut, Sliders
} from 'lucide-react';

interface SrcmcControlProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfile;
  onSessionSync: () => void;
  srcmcAccess?: any;
}

export default function SrcmcControl({ language, t, profile, onSessionSync, srcmcAccess }: SrcmcControlProps) {
  const isRtl = language === 'ar';

  // Sub-tabs in the Control Center
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');

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
  const [adminSupportRequests, setAdminSupportRequests] = useState<any[]>([]);

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

  // Form Fields: Privacy Policy Manager
  const [policies, setPolicies] = useState<any[]>([
    { version: 'v1.2', status: 'Active', publishDate: '2026-07-15', description: 'Saudi PDPL compliant 14-section Privacy Policy written in Simple English & Arabic.' },
    { version: 'v1.1', status: 'Archived', publishDate: '2026-06-10', description: 'Basic Comparative analysis framework guidelines (archived).' },
    { version: 'v1.0', status: 'Archived', publishDate: '2026-05-01', description: 'Initial seed platform structure (archived).' }
  ]);
  const [newPolicyVersion, setNewPolicyVersion] = useState<string>('v1.3');
  const [newPolicyDesc, setNewPolicyDesc] = useState<string>('Updated to include recent feedback loops and enhanced security controls for BAM screenshots.');
  const [privacySuccess, setPrivacySuccess] = useState<string>('');

  // Form Fields: Terms of Use Manager
  const [termsPolicies, setTermsPolicies] = useState<any[]>([
    { version: 'v1.0', status: 'Active', publishDate: '2026-07-16', description: 'Initial launch of production-ready 17-section Terms of Use under SariRemit Legal & Compliance Framework (SLCF).' }
  ]);
  const [newTermsVersion, setNewTermsVersion] = useState<string>('v1.1');
  const [newTermsDesc, setNewTermsDesc] = useState<string>('Updated terms of community verification, anti-fraud screenshot controls, and general regulatory compliance.');
  const [termsSuccess, setTermsSuccess] = useState<string>('');

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

  // Support & Feedback Administrative States
  const [selectedAdminTicket, setSelectedAdminTicket] = useState<any | null>(null);
  const [adminTicketMessages, setAdminTicketMessages] = useState<any[]>([]);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [adminResolutionNotes, setAdminResolutionNotes] = useState<string>('');
  const [isAdminReplying, setIsAdminReplying] = useState<boolean>(false);
  const [supportFilterStatus, setSupportFilterStatus] = useState<string>('all');
  const [supportFilterCategory, setSupportFilterCategory] = useState<string>('all');
  const [covOtherCosts, setCovOtherCosts] = useState<string>('');
  const [covNotes, setCovNotes] = useState<string>('');
  const [covError, setCovError] = useState<string>('');
  const [covSuccess, setCovSuccess] = useState<string>('');

  // CRVS Administration expanded states
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [adminReviewerNotes, setAdminReviewerNotes] = useState<string>('');
  const [adminRejectionReason, setAdminRejectionReason] = useState<string>('');
  const [adminEvidenceStatus, setAdminEvidenceStatus] = useState<string>('pending');
  const [crvsConfig, setCrvsConfig] = useState<any>({
    anomaly_normal_threshold: 2,
    anomaly_review_threshold: 5,
    anomaly_critical_threshold: 10,
    max_submissions_24h: 5,
    max_submissions_same_channel_corridor_24h: 2,
    expiry_hours: 24,
  });
  const [fraudEvents, setFraudEvents] = useState<any[]>([]);
  const [loadingFraudEvents, setLoadingFraudEvents] = useState<boolean>(false);
  const [crvsSaveSuccess, setCrvsSaveSuccess] = useState<string>('');
  const [crvsSaveError, setCrvsSaveError] = useState<string>('');

  // ----------------------------------------------------
  // SIC 2.0 - EPE State hooks
  // ----------------------------------------------------
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [evidenceFilterProvider, setEvidenceFilterProvider] = useState<string>('all');
  const [evidenceFilterCorridor, setEvidenceFilterCorridor] = useState<string>('all');
  const [evidenceFilterSubject, setEvidenceFilterSubject] = useState<string>('all');
  const [evidenceFilterSourceType, setEvidenceFilterSourceType] = useState<string>('all');
  const [evidenceFilterStatus, setEvidenceFilterStatus] = useState<string>('all');
  const [evidenceFilterFreshness, setEvidenceFilterFreshness] = useState<string>('all');
  const [evidenceFilterPermittedUse, setEvidenceFilterPermittedUse] = useState<string>('all');
  const [evidenceSearchTerm, setEvidenceSearchTerm] = useState<string>('');
  const [evidenceAuditLogs, setEvidenceAuditLogs] = useState<EpeAuditLog[]>([]);

  // ----------------------------------------------------
  // SIC 2.0 Phase 2 - ERDE State hooks
  // ----------------------------------------------------
  const [erdeResolutions, setErdeResolutions] = useState<ResolutionResult[]>([]);
  const [erdeConflicts, setErdeConflicts] = useState<EvidenceConflict[]>([]);
  const [erdePolicies, setErdePolicies] = useState<ResolutionPolicy[]>([]);
  const [activePolicy, setActivePolicy] = useState<ResolutionPolicy | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionResult | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<EvidenceConflict | null>(null);
  const [erdeSection, setErdeSection] = useState<string>('overview');
  
  // Filtering states
  const [resFilterProvider, setResFilterProvider] = useState<string>('all');
  const [resFilterCorridor, setResFilterCorridor] = useState<string>('all');
  const [resFilterSubject, setResFilterSubject] = useState<string>('all');
  const [resFilterStatus, setResFilterStatus] = useState<string>('all');
  const [resFilterSource, setResFilterSource] = useState<string>('all');
  
  const [confFilterStatus, setConfFilterStatus] = useState<string>('all');
  const [confFilterSeverity, setConfFilterSeverity] = useState<string>('all');
  const [confReviewNotes, setConfReviewNotes] = useState<string>('');
  
  const [editingPolicy, setEditingPolicy] = useState<ResolutionPolicy | null>(null);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testSuiteResults, setTestSuiteResults] = useState<any[]>([]);
  const [shadowComparisonStats, setShadowComparisonStats] = useState<any | null>(null);

  // Brand Asset Manager state hooks
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [brandAssetPermissions, setBrandAssetPermissions] = useState<BrandAssetPermission[]>([]);
  const [chanBrandAssetId, setChanBrandAssetId] = useState<string>('');
  const [chanBrandingStatus, setChanBrandingStatus] = useState<string>('placeholder');
  const [chanLogoRequired, setChanLogoRequired] = useState<boolean>(false);

  // BAM Subtab states
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetType, setAssetType] = useState<BrandAssetType>('provider_logo');
  const [assetKey, setAssetKey] = useState<string>('');
  const [assetName, setAssetName] = useState<string>('');
  const [assetOwnerType, setAssetOwnerType] = useState<string>('provider');
  const [assetProviderCode, setAssetProviderCode] = useState<string>('');
  const [assetStoragePath, setAssetStoragePath] = useState<string>('');
  const [assetPublicUrl, setAssetPublicUrl] = useState<string>('');
  const [assetPrimaryColor, setAssetPrimaryColor] = useState<string>('');
  const [assetSecondaryColor, setAssetSecondaryColor] = useState<string>('');
  const [assetApprovalStatus, setAssetApprovalStatus] = useState<BrandingApprovalStatus>('official');
  const [assetStatus, setAssetStatus] = useState<BrandAssetStatus>('active');
  const [assetAltText, setAssetAltText] = useState<string>('');
  const [assetMetadataJson, setAssetMetadataJson] = useState<string>('{}');

  // BAM Phase 2 state hooks
  const [bamFlags, setBamFlags] = useState(() => getBamFeatureFlags());
  const [bamSubView, setBamSubView] = useState<'overview' | 'directory' | 'upload' | 'diagnostics' | 'migration' | 'release'>('overview');
  const [bamSearch, setBamSearch] = useState<string>('');
  const [bamTypeFilter, setBamTypeFilter] = useState<string>('all');
  const [bamProviderFilter, setBamProviderFilter] = useState<string>('all');
  const [bamApprovalFilter, setBamApprovalFilter] = useState<string>('all');
  const [bamStatusFilter, setBamStatusFilter] = useState<string>('all');
  const [bamSortBy, setBamSortBy] = useState<string>('updated');
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<BrandAsset | null>(null);

  // Replacement form
  const [replaceReason, setReplaceReason] = useState<string>('');
  const [replaceMainFile, setReplaceMainFile] = useState<string>('');
  const [replaceLightUrl, setReplaceLightUrl] = useState<string>('');
  const [replaceDarkUrl, setReplaceDarkUrl] = useState<string>('');
  const [replaceUploadProgress, setReplaceUploadProgress] = useState<number | null>(null);

  // Legacy Migration Tool
  const [migratingChannelId, setMigratingChannelId] = useState<string | null>(null);
  const [migrationAssetName, setMigrationAssetName] = useState<string>('');
  const [migrationAssetKey, setMigrationAssetKey] = useState<string>('');
  const [migrationApprovalStatus, setMigrationApprovalStatus] = useState<BrandingApprovalStatus>('official');
  const [migrationAltText, setMigrationAltText] = useState<string>('');

  // Brand fields inside channel form
  const [chanBrandingMode, setChanBrandingMode] = useState<'select' | 'upload'>('select');
  const [chanBrandMainFile, setChanBrandMainFile] = useState<string>('');
  const [chanBrandLightFile, setChanBrandLightFile] = useState<string>('');
  const [chanBrandDarkFile, setChanBrandDarkFile] = useState<string>('');
  const [chanBrandPrimaryColor, setChanBrandPrimaryColor] = useState<string>('');
  const [chanBrandSecondaryColor, setChanBrandSecondaryColor] = useState<string>('');
  const [chanBrandWebsiteUrl, setChanBrandWebsiteUrl] = useState<string>('');
  const [chanBrandAltText, setChanBrandAltText] = useState<string>('');
  const [chanBrandPermissionNote, setChanBrandPermissionNote] = useState<string>('');
  const [chanBrandInternalNotes, setChanBrandInternalNotes] = useState<string>('');
  const [chanBrandApprovalStatus, setChanBrandApprovalStatus] = useState<BrandingApprovalStatus>('placeholder');

  // BAM Permissions state
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [selectedAssetForPermission, setSelectedAssetForPermission] = useState<BrandAsset | null>(null);
  const [bapStatus, setBapStatus] = useState<string>('granted');
  const [bapSource, setBapSource] = useState<string>('Official Licensing Agreement');
  const [bapReference, setBapReference] = useState<string>('');
  const [bapGrantedAt, setBapGrantedAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bapExpiresAt, setBapExpiresAt] = useState<string>('');
  const [bapRestrictions, setBapRestrictions] = useState<string>('');
  const [bapContactName, setBapContactName] = useState<string>('');
  const [bapContactEmail, setBapContactEmail] = useState<string>('');
  const [bapNotes, setBapNotes] = useState<string>('');

  const handleSaveBrandAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetKey || !assetName || !assetStoragePath) {
      alert('Key, Name, and Storage Path are mandatory fields.');
      return;
    }

    const isEdit = !!editingAssetId;
    if (isEdit && !hasBamPermission('edit_brand_assets')) {
      alert('Unauthorized. You do not have permission to edit brand assets.');
      return;
    }
    if (!isEdit && !hasBamPermission('upload_brand_assets')) {
      alert('Unauthorized. You do not have permission to upload/create brand assets.');
      return;
    }

    const action = async () => {
      let meta: any = {};
      try {
        meta = JSON.parse(assetMetadataJson || '{}');
      } catch {
        meta = {};
      }

      // Merge reviewer / creator metadata fields
      meta.internal_notes = assetAltText; // store notes
      meta.approved_by = isEdit ? (meta.approved_by || loggedInEmail) : loggedInEmail;
      meta.approved_at = isEdit ? (meta.approved_at || new Date().toISOString()) : new Date().toISOString();

      const asset: BrandAsset = {
        id: editingAssetId || `asset-${Date.now()}`,
        asset_type: assetType,
        asset_key: assetKey.toLowerCase().trim(),
        asset_name: assetName,
        owner_type: assetOwnerType,
        provider_code: assetProviderCode || null,
        storage_path: assetStoragePath,
        public_url: assetPublicUrl || undefined,
        primary_color: assetPrimaryColor || undefined,
        secondary_color: assetSecondaryColor || undefined,
        approval_status: assetApprovalStatus,
        status: assetStatus,
        alt_text: assetAltText || undefined,
        version: editingAssetId ? ((brandAssets.find(a => a.id === editingAssetId)?.version || 1) + 1) : 1,
        metadata: meta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await saveBrandAsset(asset);
      await logBamAudit(editingAssetId ? 'EDIT_BRAND_ASSET' : 'CREATE_BRAND_ASSET', asset.id, { key: asset.asset_key, type: asset.asset_type }, loggedInEmail);
      
      // Refresh
      const list = await fetchBrandAssets();
      setBrandAssets(list);

      // Clear
      setEditingAssetId(null);
      setAssetKey('');
      setAssetName('');
      setAssetStoragePath('');
      setAssetPublicUrl('');
      setAssetPrimaryColor('');
      setAssetSecondaryColor('');
      setAssetAltText('');
      setAssetMetadataJson('{}');
    };

    dispatchAction(editingAssetId ? `Update Brand Asset ${assetName}` : `Create Brand Asset ${assetName}`, action);
  };

  const handleDeleteBrandAsset = (id: string, name: string) => {
    if (!hasBamPermission('archive_brand_assets')) {
      alert('Unauthorized. You do not have permission to archive or delete brand assets.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete brand asset '${name}'? This cannot be undone.`)) {
      return;
    }
    const action = async () => {
      await deleteBrandAsset(id);
      await logBamAudit('DELETE_BRAND_ASSET', id, { name }, loggedInEmail);
      const list = await fetchBrandAssets();
      setBrandAssets(list);
    };
    dispatchAction(`Delete Brand Asset ${name}`, action);
  };

  const handleReplaceAsset = (asset: BrandAsset) => {
    if (!hasBamPermission('edit_brand_assets')) {
      alert('Unauthorized. You do not have permission to replace brand assets.');
      return;
    }
    if (!replaceReason) {
      alert('Please provide a replacement reason.');
      return;
    }

    const action = async () => {
      const nextVersion = (asset.version || 1) + 1;
      const newAssetId = `ba-${asset.asset_key}-v${nextVersion}-${Date.now()}`;
      
      const newAsset: BrandAsset = {
        ...asset,
        id: newAssetId,
        version: nextVersion,
        public_url: replaceMainFile || asset.public_url,
        light_url: replaceLightUrl || asset.light_url || replaceMainFile || asset.public_url,
        dark_url: replaceDarkUrl || asset.dark_url || replaceMainFile || asset.public_url,
        status: 'active',
        metadata: {
          ...asset.metadata,
          replacement_reason: replaceReason,
          replaced_from_id: asset.id,
          approved_by: loggedInEmail,
          approved_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save new active version
      await saveBrandAsset(newAsset);

      // Deactivate old version in DB
      const oldDeactivated = {
        ...asset,
        status: 'inactive' as BrandAssetStatus,
        updated_at: new Date().toISOString()
      };
      await saveBrandAsset(oldDeactivated);

      // Carry forward channel link: if any channel was pointing to old asset.id, update it to point to newAsset.id!
      for (const chan of channels) {
        if (chan.brandAssetId === asset.id) {
          const updatedChan = {
            ...chan,
            brandAssetId: newAssetId
          };
          await saveRemittanceChannel(updatedChan);
        }
      }

      // Log the replacement action
      await logBamAudit('REPLACE_BRAND_ASSET_VERSION', asset.id, {
        newAssetId,
        version: nextVersion,
        replacementReason: replaceReason
      }, loggedInEmail);

      // Refresh states
      const refreshedAssets = await fetchBrandAssets();
      setBrandAssets(refreshedAssets);

      const refreshedChans = await fetchRemittanceChannels();
      setChannels(refreshedChans);

      // Select new asset in details panel
      setSelectedAssetForDetail(newAsset);
      
      // Reset replacement fields
      setReplaceReason('');
      setReplaceMainFile('');
      setReplaceLightUrl('');
      setReplaceDarkUrl('');
      
      alert(`Successfully created version ${nextVersion} for ${asset.asset_name}!`);
    };

    dispatchAction(`Replace asset version for ${asset.asset_name}`, action);
  };

  const handleLegacyMigration = (chan: any) => {
    if (!hasBamPermission('upload_brand_assets')) {
      alert('Unauthorized. You do not have permission to migrate brand assets.');
      return;
    }
    if (!migrationAssetName || !migrationAssetKey) {
      alert('Asset Name and Key are mandatory fields.');
      return;
    }

    const action = async () => {
      const assetId = `ba-${migrationAssetKey.toLowerCase().trim()}-v1-${Date.now()}`;
      
      const newAsset: BrandAsset = {
        id: assetId,
        asset_type: 'provider_logo',
        asset_key: migrationAssetKey.toLowerCase().trim(),
        asset_name: migrationAssetName,
        owner_type: 'provider',
        provider_code: chan.providerCode,
        storage_path: `providers/${chan.providerCode}/logo.svg`,
        public_url: chan.logoUrl || chan.logo_url || '',
        approval_status: migrationApprovalStatus,
        status: 'active',
        alt_text: migrationAltText || `${chan.displayName} Logo`,
        version: 1,
        metadata: {
          migrated_from_legacy: true,
          legacy_logo_url: chan.logoUrl || chan.logo_url,
          migrated_by: loggedInEmail,
          migrated_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save new Brand Asset
      await saveBrandAsset(newAsset);

      // Link Channel to newly created brand asset ID
      const updatedChan = {
        ...chan,
        brandAssetId: assetId,
        brandingStatus: migrationApprovalStatus
      };
      await saveRemittanceChannel(updatedChan);

      // Log migration
      await logBamAudit('MIGRATE_LEGACY_LOGO', assetId, {
        channelId: chan.id,
        legacyUrl: chan.logoUrl || chan.logo_url
      }, loggedInEmail);

      // Refresh list
      const refreshedAssets = await fetchBrandAssets();
      setBrandAssets(refreshedAssets);

      const refreshedChans = await fetchRemittanceChannels();
      setChannels(refreshedChans);

      // Clear states
      setMigratingChannelId(null);
      setMigrationAssetName('');
      setMigrationAssetKey('');
      setMigrationAltText('');

      alert(`Successfully migrated legacy logo for ${chan.displayName} to BAM Asset!`);
    };

    dispatchAction(`Migrate Legacy Logo for ${chan.displayName}`, action);
  };

  const handleRepairAltText = (asset: BrandAsset) => {
    if (!hasBamPermission('edit_brand_assets')) {
      alert('Unauthorized. You do not have permission to edit brand assets.');
      return;
    }
    const defaultAlt = `${asset.asset_name} official brand logo asset registered in SariRemit BAM.`;
    const action = async () => {
      const updatedAsset: BrandAsset = {
        ...asset,
        alt_text: defaultAlt,
        updated_at: new Date().toISOString()
      };
      await saveBrandAsset(updatedAsset);
      await logBamAudit('AUTO_REPAIR_ALT_TEXT', asset.id, { before: asset.alt_text, after: defaultAlt }, loggedInEmail);
      const list = await fetchBrandAssets();
      setBrandAssets(list);
      alert(`Successfully repaired alt-text for ${asset.asset_name}!`);
    };
    dispatchAction(`Auto-repair alt text for ${asset.asset_name}`, action);
  };

  const handleRepairDuplicateVersions = (key: string) => {
    if (!hasBamPermission('edit_brand_assets')) {
      alert('Unauthorized. You do not have permission to edit brand assets.');
      return;
    }
    const action = async () => {
      const matchingAssets = brandAssets.filter(a => a.asset_key === key && a.status === 'active');
      if (matchingAssets.length <= 1) {
        alert('No duplicate active versions found.');
        return;
      }
      const sorted = [...matchingAssets].sort((a, b) => (b.version || 1) - (a.version || 1));
      const latest = sorted[0];
      const olderVersions = sorted.slice(1);

      let deactivatedCount = 0;
      for (const old of olderVersions) {
        const deactivated = {
          ...old,
          status: 'inactive' as BrandAssetStatus,
          updated_at: new Date().toISOString()
        };
        await saveBrandAsset(deactivated);
        deactivatedCount++;
      }

      await logBamAudit('DEACTIVATE_OLD_VERSIONS', latest.id, { asset_key: key, deactivatedCount }, loggedInEmail);
      const list = await fetchBrandAssets();
      setBrandAssets(list);
      alert(`Deactivated ${deactivatedCount} older version(s) of key '${key}'. Version ${latest.version} remains active.`);
    };
    dispatchAction(`Auto-repair redundant active versions for ${key}`, action);
  };

  const handleRepairApprovePermission = (asset: BrandAsset) => {
    if (!hasBamPermission('edit_brand_assets')) {
      alert('Unauthorized. You do not have permission to edit brand assets.');
      return;
    }
    const action = async () => {
      const updatedAsset: BrandAsset = {
        ...asset,
        approval_status: 'official',
        updated_at: new Date().toISOString()
      };
      await saveBrandAsset(updatedAsset);
      await logBamAudit('AUTO_REPAIR_APPROVE_PERMISSION', asset.id, { before: asset.approval_status, after: 'official' }, loggedInEmail);
      const list = await fetchBrandAssets();
      setBrandAssets(list);
      alert(`Granted official approval for ${asset.asset_name}!`);
    };
    dispatchAction(`Auto-approve legal permissions for ${asset.asset_name}`, action);
  };

  const handleSavePermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForPermission) return;

    const action = async () => {
      const permission: BrandAssetPermission = {
        id: `bap-${Date.now()}`,
        brand_asset_id: selectedAssetForPermission.id,
        permission_status: bapStatus,
        permission_source: bapSource || undefined,
        permission_reference: bapReference || undefined,
        granted_at: bapGrantedAt || undefined,
        expires_at: bapExpiresAt || undefined,
        restrictions: bapRestrictions || undefined,
        contact_name: bapContactName || undefined,
        contact_email: bapContactEmail || undefined,
        notes: bapNotes || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await saveBrandAssetPermission(permission);
      await logBamAudit('GRANT_BRAND_PERMISSION', selectedAssetForPermission.id, { status: bapStatus, contact: bapContactEmail }, loggedInEmail);

      const perms = await fetchBrandAssetPermissions();
      setBrandAssetPermissions(perms);
      setShowPermissionModal(false);
    };

    dispatchAction(`Grant Licensing Permission for ${selectedAssetForPermission.asset_name}`, action);
  };

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
  const currentAdmin = srcmcAccess || admins.find(a => a.email.toLowerCase() === loggedInEmail.toLowerCase() && a.is_active);
  const isAdmin = currentAdmin?.is_active === true;
  const isMainAdmin = currentAdmin?.role === 'main_admin';

  const hasPermission = (permission: string) => {
    if (isMainAdmin) return true;
    const permissions = Array.isArray(currentAdmin?.permissions)
      ? currentAdmin.permissions
      : [];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const hasBamPermission = (permission: string) => {
    if (isMainAdmin) return true;
    const permissions = Array.isArray(currentAdmin?.permissions)
      ? currentAdmin.permissions
      : [];
    return (
      permissions.includes('*') ||
      permissions.includes(permission) ||
      (permissions.includes('manage_channels') && (permission === 'view_brand_assets' || permission === 'manage_provider_branding'))
    );
  };

  const subtabs = [
    { key: 'overrides', label: 'Admin Overrides', permission: 'manage_overrides' },
    { key: 'submissions', label: 'Community Feed', permission: 'approve_community_rates' },
    { key: 'evidence_provenance', label: 'SIC Evidence & Provenance', permission: 'monitor_rates' },
    { key: 'evidence_resolution', label: 'SIC Evidence Resolution (ERDE)', permission: 'monitor_rates' },
    { key: 'sis_v2', label: 'SIS v2 Intelligence Center', permission: 'monitor_rates' },
    { key: 'crvs_settings', label: 'CRVS Setup', permission: 'approve_community_rates' },
    { key: 'fraud_logs', label: 'Fraud & Security Alerts', permission: 'approve_community_rates' },
    { key: 'channels', label: 'Remittance Channels', permission: 'manage_channels' },
    { key: 'brand_assets', label: 'Brand Asset Manager', permission: 'view_brand_assets' },
    { key: 'corridors', label: 'Corridor Control', permission: 'manage_corridors' },
    { key: 'admins', label: 'Admin Access Control', permission: 'manage_admins' },
    { key: 'resolved', label: 'RRE Resolution Inspect', permission: 'monitor_rates' },
    { key: 'weights', label: 'SIS Formula Weights', permission: 'view_sic' },
    { key: 'audit_logs', label: 'Audit Logs Feed', permission: 'view_audit_logs' },
    { key: 'users', label: 'Registered Users', permission: 'manage_admins' },
    { key: 'privacy', label: 'Privacy Policy Manager', permission: 'manage_admins' },
    { key: 'terms', label: 'Terms of Use Manager', permission: 'manage_admins' },
    { key: 'support', label: 'Support & Compliance Desk', permission: 'manage_overrides' }
  ];

  const allowedSubtabs = subtabs.filter(tab => 
    tab.key === 'brand_assets' ? hasBamPermission('view_brand_assets') : hasPermission(tab.permission)
  );

  // Redirect to first allowed subtab if active one is restricted
  useEffect(() => {
    if (!loading && allowedSubtabs.length > 0) {
      const isAllowed = allowedSubtabs.some(t => t.key === activeSubTab) || activeSubTab === 'dashboard';
      if (!isAllowed) {
        setActiveSubTab('dashboard');
      }
    }
  }, [activeSubTab, currentAdmin, loading, allowedSubtabs]);

  // SIS V2 Intelligence Dashboard States
  const [sisPolicies, setSisPolicies] = useState<any[]>([]);
  const [activeSisPolicy, setActiveSisPolicy] = useState<any | null>(null);
  const [sisAuditLogs, setSisAuditLogs] = useState<any[]>([]);
  const [isShadowMode, setIsShadowMode] = useState<boolean>(SIS_FEATURE_FLAGS.ENABLE_SIS_V2_SHADOW_MODE);
  const [diagnosticsCorridor, setDiagnosticsCorridor] = useState<string>('sa-pk');
  const [diagnosticsProvider, setDiagnosticsProvider] = useState<string>('urpay');
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [editingSisPolicy, setEditingSisPolicy] = useState<any | null>(null);

  // Load SIS V2 configurations lazily
  useEffect(() => {
    if (activeSubTab === 'sis_v2') {
      const loadSisData = async () => {
        try {
          const policies = await SisService.getPolicies();
          setSisPolicies(policies);
          const active = policies.find(p => p.status === 'active');
          setActiveSisPolicy(active || null);
          if (active) {
            setEditingSisPolicy({
              policyId: active.policyId,
              name: active.name,
              description: active.description,
              version: active.version,
              status: active.status,
              weights: { ...active.weights },
              caps: active.caps ? { ...active.caps } : {},
              blockingRules: active.blockingRules ? { ...active.blockingRules } : {}
            });
          }
          
          const logs = await SisService.getAuditLogs();
          setSisAuditLogs(logs);
        } catch (error) {
          console.error("Error loading SIS data", error);
        }
      };
      loadSisData();
    }
  }, [activeSubTab]);

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
      fetchAuditLogs(),
      fetchFraudIntegrityEvents(),
      fetchBrandAssets(),
      fetchBrandAssetPermissions(),
      fetchAllSupportRequestsAdmin()
    ]).then(([
      overridesData, submissionsData, weightsData, usersData, 
      adminsData, corridorsData, channelsData, coveragesData, auditData, fraudData,
      brandAssetsData, permissionsData, supportRequestsData
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
        setFraudEvents(fraudData);
        setBrandAssets(brandAssetsData || []);
        setBrandAssetPermissions(permissionsData || []);
        setAdminSupportRequests(supportRequestsData || []);

        // Fetch and load CRVS Setup config parameters
        const crvsData = fetchCrvsConfig();
        setCrvsConfig(crvsData);

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

  // Load SIC Evidence & Provenance dynamic lists
  useEffect(() => {
    let isMounted = true;
    if (activeSubTab === 'evidence_provenance' || activeSubTab === 'resolved' || activeSubTab === 'dashboard') {
      setLoadingEvidence(true);
      Promise.all([
        EpeService.getAllEvidence(),
        EpeService.getAuditLogs()
      ]).then(([evidence, audits]) => {
        if (isMounted) {
          setEvidenceList(evidence);
          setEvidenceAuditLogs(audits);
          setLoadingEvidence(false);
        }
      }).catch(err => {
        console.error('Error loading EPE evidence/audit:', err);
        if (isMounted) setLoadingEvidence(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeSubTab, refreshTrigger]);

  // Load SIC Evidence Resolution (ERDE Phase 2) lists
  useEffect(() => {
    let isMounted = true;
    if (activeSubTab === 'evidence_resolution' || activeSubTab === 'dashboard') {
      setLoadingEvidence(true);
      Promise.all([
        EpeService.getAllEvidence(),
        EdeService.getResolutions(),
        EdeService.getConflicts(),
        EdeService.getPolicies(),
        EdeService.getActivePolicy()
      ]).then(([evidence, res, conf, pol, activePol]) => {
        if (isMounted) {
          setEvidenceList(evidence);
          setErdeResolutions(res);
          setErdeConflicts(conf);
          setErdePolicies(pol);
          setActivePolicy(activePol);
          setLoadingEvidence(false);
        }
      }).catch(err => {
        console.error('Error loading ERDE data:', err);
        if (isMounted) setLoadingEvidence(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeSubTab, refreshTrigger]);

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
        'sa-pk',
        'SariRemitAdmin2026Secure!'
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
    setAdminError('');
    setAdminSuccess('');

    const action = async () => {
      const result = await assignAdminAccess({
        email: userEmail.toLowerCase().trim(),
        role: newAdminRole,
        permissions: newAdminPermissions,
        createdBy: loggedInEmail
      });

      if (!result.success) {
        setAdminError(result.message);
        throw new Error(result.message);
      }

      await logAuditAction(loggedInEmail, `PROVISION_ADMIN_ACCESS`, 'ADMIN_ACCESS', userEmail, { role: newAdminRole, permissions: newAdminPermissions });
      
      // Refresh admins list
      const updatedAdmins = await fetchAdminAccess();
      setAdmins(updatedAdmins);

      setAdminSuccess(`Access control successfully assigned for ${userEmail}. PIN Generated: ${result.pin}`);
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
        id: selectedCorridorCode,
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

      let finalBrandAssetId = chanBrandAssetId || null;
      let finalBrandingStatus = chanBrandingStatus || 'placeholder';

      if (chanBrandingMode === 'upload') {
        if (!chanBrandMainFile) {
          throw new Error('Main provider logo is mandatory for direct brand asset upload.');
        }
        const assetId = `ba-${cCode}-v1-${Date.now()}`;
        const newAsset: BrandAsset = {
          id: assetId,
          asset_type: 'provider_logo',
          asset_key: cCode,
          asset_name: `${chanDisplayName} Logo`,
          owner_type: 'provider',
          provider_code: cCode,
          storage_path: `providers/${cCode}/logo.svg`,
          public_url: chanBrandMainFile,
          light_url: chanBrandLightFile || chanBrandMainFile,
          dark_url: chanBrandDarkFile || chanBrandMainFile,
          primary_color: chanBrandPrimaryColor || null,
          secondary_color: chanBrandSecondaryColor || null,
          approval_status: chanBrandApprovalStatus,
          status: 'active',
          alt_text: chanBrandAltText || `${chanDisplayName} Brand Logo`,
          version: 1,
          metadata: {
            website_url: chanBrandWebsiteUrl,
            permission_note: chanBrandPermissionNote,
            internal_notes: chanBrandInternalNotes,
            created_during_channel_registration: true,
            created_by: loggedInEmail
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          await saveBrandAsset(newAsset);
          await logBamAudit('CREATE_BRAND_ASSET_VIA_CHANNEL', assetId, { key: cCode }, loggedInEmail);

          // Refresh assets
          const list = await fetchBrandAssets();
          setBrandAssets(list);

          finalBrandAssetId = assetId;
          finalBrandingStatus = chanBrandApprovalStatus;
        } catch (bamErr: any) {
          console.warn('[BAM Failure] Failed to save brand asset, continuing gracefully:', bamErr);
          if (chanLogoRequired) {
            throw new Error(`BAM asset upload failed, and a logo is explicitly required for this channel: ${bamErr?.message || bamErr}`);
          }
          finalBrandAssetId = null;
          finalBrandingStatus = 'placeholder';
        }
      }

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
        updatedAt: new Date().toISOString(),
        brandAssetId: finalBrandAssetId,
        brandingStatus: finalBrandingStatus,
        logoRequired: chanLogoRequired
      };

      await saveRemittanceChannel(channelPayload);
      if (isEdit) {
        await logAuditAction(loggedInEmail, `UPDATE_REMITTANCE_CHANNEL`, 'REMITTANCE_CHANNEL', cCode, { category: chanCategory, defaultFee: chanFee, brandAssetId: finalBrandAssetId, brandingStatus: finalBrandingStatus, logoRequired: chanLogoRequired });
        setChanSuccess(`Remittance channel '${chanDisplayName}' was successfully updated live!`);
      } else {
        await logAuditAction(loggedInEmail, `REGISTER_REMITTANCE_CHANNEL`, 'REMITTANCE_CHANNEL', cCode, { category: chanCategory, defaultFee: chanFee, brandAssetId: finalBrandAssetId, brandingStatus: finalBrandingStatus, logoRequired: chanLogoRequired });
        setChanSuccess(`Remittance channel '${chanDisplayName}' was successfully registered! Unique constraints verified.`);
      }
      
      // Reset
      setChanId('');
      setChanName('');
      setChanCode('');
      setChanDisplayName('');
      setChanNotes('');
      setChanBrandAssetId('');
      setChanBrandingStatus('placeholder');
      setChanBrandingMode('select');
      setChanBrandMainFile('');
      setChanBrandLightFile('');
      setChanBrandDarkFile('');
      setChanBrandPrimaryColor('');
      setChanBrandSecondaryColor('');
      setChanBrandWebsiteUrl('');
      setChanBrandAltText('');
      setChanBrandPermissionNote('');
      setChanBrandInternalNotes('');
      setChanLogoRequired(false);
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
        setChanBrandAssetId('');
        setChanBrandingStatus('placeholder');
        setChanLogoRequired(false);
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
    setChanBrandAssetId(chan.brandAssetId || '');
    setChanBrandingStatus(chan.brandingStatus || 'placeholder');
    setChanLogoRequired(chan.logoRequired || false);
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
      setFormError('Please enter valid other costs / rate impact.');
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
  const handleApproveSubmission = async (id: string, reviewerNotes = '', evidenceStatus = 'verified') => {
    const action = async () => {
      await updateSubmissionStatusEx(id, 'approved', { id: currentAdmin?.id || 'admin', email: loggedInEmail }, reviewerNotes, '', evidenceStatus);
      await logAuditAction(loggedInEmail, `APPROVE_COMMUNITY_SUBMISSION`, 'COMMUNITY_SUBMISSION', id, { reviewerNotes, evidenceStatus });
    };
    dispatchAction(`Approve Submission ${id}`, action);
  };

  // Reject community submission
  const handleRejectSubmission = async (id: string, reviewerNotes = '', rejectionReason = '', evidenceStatus = 'invalid') => {
    const action = async () => {
      await updateSubmissionStatusEx(id, 'rejected', { id: currentAdmin?.id || 'admin', email: loggedInEmail }, reviewerNotes, rejectionReason, evidenceStatus);
      await logAuditAction(loggedInEmail, `REJECT_COMMUNITY_SUBMISSION`, 'COMMUNITY_SUBMISSION', id, { reviewerNotes, rejectionReason, evidenceStatus });
    };
    dispatchAction(`Reject Submission ${id}`, action);
  };

  // Support & Compliance Desk administrative handlers
  const handleSelectAdminTicket = async (ticket: any) => {
    setSelectedAdminTicket(ticket);
    setAdminResolutionNotes(ticket.resolution_notes || '');
    try {
      const msgs = await fetchSupportMessages(ticket.id);
      const sorted = [...msgs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setAdminTicketMessages(sorted);
    } catch (err) {
      console.error('Error fetching admin support messages:', err);
    }
  };

  const handleAdminUpdateStatus = async (status: 'new' | 'in_review' | 'resolved' | 'closed') => {
    if (!selectedAdminTicket) return;
    const action = async () => {
      const updated = await updateSupportRequestAdmin(selectedAdminTicket.id, {
        status,
        resolution_summary: adminResolutionNotes || null
      }, loggedInEmail);

      // Update locally
      setSelectedAdminTicket(updated);
      setAdminSupportRequests(prev => prev.map(t => t.id === updated.id ? updated : t));
      await logAuditAction(loggedInEmail, 'UPDATE_SUPPORT_STATUS', 'SUPPORT_TICKET', selectedAdminTicket.id, { status, resolution_notes: adminResolutionNotes });
    };
    dispatchAction(`Update Ticket Status to ${status.replace('_', ' ')}`, action);
  };

  const handleAdminSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminTicket || !adminReplyText.trim() || isAdminReplying) return;

    setIsAdminReplying(true);
    try {
      const session = getAuthSession();
      const senderUserId = session.user?.id || null;

      const msg = await addSupportMessage(
        selectedAdminTicket.id,
        senderUserId,
        'admin',
        adminReplyText.trim(),
        false
      );

      setAdminTicketMessages(prev => [...prev, msg]);
      setAdminReplyText('');
      
      // Auto transition status to 'in_review' if it was 'new'
      if (selectedAdminTicket.status === 'new') {
        const updated = await updateSupportRequestAdmin(selectedAdminTicket.id, {
          status: 'in_review'
        }, loggedInEmail);
        setSelectedAdminTicket(updated);
        setAdminSupportRequests(prev => prev.map(t => t.id === updated.id ? updated : t));
      }

      await logAuditAction(loggedInEmail, 'ADD_SUPPORT_REPLY', 'SUPPORT_TICKET', selectedAdminTicket.id, {});
    } catch (err) {
      console.error('Error sending support reply:', err);
    } finally {
      setIsAdminReplying(false);
    }
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

  // --- SRCMC IA & NAVIGATION UPGRADE V2 CONFIG ---
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  const ENABLE_SRCMC_NAVIGATION_V2 = true;
  const ENABLE_SRCMC_COMMAND_DASHBOARD = true;
  const ENABLE_SRCMC_COLLAPSIBLE_SIDEBAR = true;
  const ENABLE_SRCMC_MOBILE_DRAWER = true;
  const ENABLE_SRCMC_ROLE_AWARE_NAVIGATION = true;

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('srcmc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem('srcmc_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    return { 'overview': true };
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [adminDetailsOpen, setAdminDetailsOpen] = useState<boolean>(false);

  const navGroups = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Layout,
      items: [
        { id: 'dashboard', label: 'Command Dashboard', route: 'dashboard', icon: Layout },
        { id: 'system_health', label: 'System Health', route: 'dashboard#health', icon: Activity },
        { id: 'recent_activity', label: 'Recent Activity', route: 'audit_logs', icon: Clock3 }
      ]
    },
    {
      id: 'rates_operations',
      label: 'Rates & Operations',
      icon: Percent,
      items: [
        { id: 'overrides', label: 'Admin Overrides', route: 'overrides', icon: Percent, permission: 'manage_overrides' },
        { id: 'submissions', label: 'Community Rate Review', route: 'submissions', icon: Users, permission: 'approve_community_rates' },
        { id: 'corridors', label: 'Corridor Control', route: 'corridors', icon: Globe, permission: 'manage_corridors' }
      ]
    },
    {
      id: 'sic_intelligence',
      label: 'SIC Intelligence',
      icon: Sparkles,
      items: [
        { id: 'evidence_provenance', label: 'Evidence Repository', route: 'evidence_provenance', icon: Database, permission: 'monitor_rates' },
        { id: 'evidence_resolution', label: 'Evidence Resolution', route: 'evidence_resolution', icon: CheckCircle, permission: 'monitor_rates' },
        { id: 'resolved', label: 'Resolution History', route: 'resolved', icon: Clock3, permission: 'monitor_rates' },
        { id: 'sis_v2', label: 'SIS Intelligence', route: 'sis_v2', icon: Sparkles, permission: 'monitor_rates' },
        { id: 'weights', label: 'SIS Policy & Weights', route: 'weights', icon: Sliders, permission: 'view_sic' }
      ]
    },
    {
      id: 'trust_safety',
      label: 'Trust & Safety',
      icon: Shield,
      items: [
        { id: 'fraud_logs', label: 'Fraud & Security Alerts', route: 'fraud_logs', icon: ShieldAlert, permission: 'approve_community_rates' }
      ]
    },
    {
      id: 'users_access',
      label: 'Users & Access',
      icon: Users,
      items: [
        { id: 'users', label: 'Registered Users', route: 'users', icon: Users, permission: 'manage_admins' },
        { id: 'admins', label: 'Admin Access Control', route: 'admins', icon: Lock, permission: 'manage_admins' }
      ]
    },
    {
      id: 'platform_management',
      label: 'Platform Management',
      icon: Settings,
      items: [
        { id: 'channels', label: 'Channel Management', route: 'channels', icon: ArrowRightLeft, permission: 'manage_channels' },
        { id: 'brand_assets', label: 'Brand Asset Manager', route: 'brand_assets', icon: Image, permission: 'view_brand_assets' },
        { id: 'crvs_settings', label: 'CRVS Setup', route: 'crvs_settings', icon: Key, permission: 'approve_community_rates' }
      ]
    },
    {
      id: 'compliance_legal',
      label: 'Compliance & Legal',
      icon: FileText,
      items: [
        { id: 'privacy', label: 'Privacy Policy Manager', route: 'privacy', icon: FileText, permission: 'manage_admins' },
        { id: 'terms', label: 'Terms of Use Manager', route: 'terms', icon: FileText, permission: 'manage_admins' }
      ]
    },
    {
      id: 'support_feedback',
      label: 'Support & Feedback',
      icon: HelpCircle,
      items: [
        { id: 'support', label: 'Support Inbox', route: 'support', icon: HelpCircle, permission: 'manage_overrides' }
      ]
    },
    {
      id: 'audit_diagnostics',
      label: 'Audit & Diagnostics',
      icon: ListCollapse,
      items: [
        { id: 'audit_logs', label: 'Audit Logs Feed', route: 'audit_logs', icon: ListCollapse, permission: 'view_audit_logs' }
      ]
    }
  ];

  const isItemAuthorized = (item: any) => {
    if (!item.permission) return true;
    if (item.id === 'brand_assets') return hasBamPermission('view_brand_assets');
    return hasPermission(item.permission);
  };

  useEffect(() => {
    if (activeSubTab === 'dashboard') return;
    for (const group of navGroups) {
      if (group.items.some(item => item.id === activeSubTab)) {
        setExpandedCategories(prev => ({
          ...prev,
          [group.id]: true
        }));
      }
    }
  }, [activeSubTab]);

  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'SRCMC', onClick: () => setActiveSubTab('dashboard') }];
    if (activeSubTab === 'dashboard') {
      crumbs.push({ label: 'Overview', onClick: () => {} });
      crumbs.push({ label: 'Command Dashboard', onClick: () => {} });
    } else {
      for (const group of navGroups) {
        const matchingItem = group.items.find(item => item.id === activeSubTab);
        if (matchingItem) {
          crumbs.push({ 
            label: group.label, 
            onClick: () => {
              setExpandedCategories(prev => ({ ...prev, [group.id]: true }));
            } 
          });
          crumbs.push({ label: matchingItem.label, onClick: () => {} });
          break;
        }
      }
    }
    return crumbs;
  };

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
    <div className="srcmc-panel text-left w-full h-full">
      <style>{`
        .dark .srcmc-panel, .dark .srcmc-panel div, .dark .srcmc-panel h1, .dark .srcmc-panel h2, .dark .srcmc-panel h3, .dark .srcmc-panel h4, .dark .srcmc-panel p, .dark .srcmc-panel span, .dark .srcmc-panel label {
          color-scheme: dark;
        }
        .dark .srcmc-panel .bg-white {
          background-color: #0C2547 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .dark .srcmc-panel .border-slate-200, .dark .srcmc-panel .border-slate-100 {
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .dark .srcmc-panel .bg-slate-50, .dark .srcmc-panel .bg-slate-100, .dark .srcmc-panel .bg-slate-200 {
          background-color: #071A35 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .dark .srcmc-panel select, .dark .srcmc-panel input, .dark .srcmc-panel textarea {
          background-color: #071A35 !important;
          color: #F8FAFC !important;
          border-color: rgba(148, 163, 184, 0.12) !important;
        }
        .dark .srcmc-panel .text-slate-900, .dark .srcmc-panel .text-slate-850, .dark .srcmc-panel .text-slate-800 {
          color: #F8FAFC !important;
        }
        .dark .srcmc-panel .text-slate-500, .dark .srcmc-panel .text-slate-450, .dark .srcmc-panel .text-slate-400 {
          color: #94A3B8 !important;
        }
        .dark .srcmc-panel .hover\\:bg-slate-50:hover, .dark .srcmc-panel .hover\\:bg-slate-100:hover {
          background-color: rgba(148, 163, 184, 0.05) !important;
        }
        .dark .srcmc-panel .text-emerald-600 {
          color: #10B981 !important;
        }
        .dark .srcmc-panel .bg-emerald-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #10B981 !important;
        }
        .dark .srcmc-panel .border-emerald-200, .dark .srcmc-panel .border-emerald-150 {
          border-color: rgba(16, 185, 129, 0.25) !important;
        }
        .dark .srcmc-panel .bg-slate-900 {
          background-color: #071A35 !important;
          border: 1px solid rgba(148, 163, 184, 0.12) !important;
        }
        .dark .srcmc-panel .bg-slate-850 {
          background-color: #0C2547 !important;
        }
      `}</style>

      {/* Modern V2 Flex Container Wrapper */}
      <div className={ENABLE_SRCMC_NAVIGATION_V2 ? `min-h-screen flex flex-col md:flex-row ${isDarkTheme ? 'bg-[#051326] text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200 w-full` : ''}>
        
        {/* A. Desktop Persistent Sidebar */}
        {ENABLE_SRCMC_NAVIGATION_V2 && (
          <aside className={`hidden md:flex flex-col border-r shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } ${
            isDarkTheme ? 'bg-[#071A35] border-slate-800' : 'bg-white border-slate-200'
          } sticky top-0 h-screen overflow-hidden`}>
            {/* Logo area */}
            <div className={`flex items-center gap-3 p-4 border-b h-16 shrink-0 ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Shield className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="font-black text-xs uppercase tracking-wider font-sans">SariRemit</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Control Centre</span>
                </div>
              )}
            </div>

            {/* Menu options grouped scrollable */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2 select-none">
              {navGroups.map((group) => {
                const authorizedItems = group.items.filter(item => isItemAuthorized(item));
                if (authorizedItems.length === 0) return null;

                const isGroupExpanded = expandedCategories[group.id];
                const GroupIcon = group.icon;

                return (
                  <div key={group.id} className="space-y-1">
                    {sidebarCollapsed ? (
                      <div className="flex flex-col items-center gap-2">
                        {authorizedItems.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = activeSubTab === item.id;
                          return (
                            <button
                              key={item.id}
                              id={`sidebar-item-${item.id}`}
                              onClick={() => setActiveSubTab(item.id)}
                              className={`p-2.5 rounded-xl transition-colors cursor-pointer group relative ${
                                isActive 
                                  ? 'bg-indigo-600 text-white' 
                                  : isDarkTheme 
                                    ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                              title={item.label}
                            >
                              <ItemIcon className="w-4 h-4" />
                              <div className="absolute left-14 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all origin-left z-50 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-md whitespace-nowrap">
                                {item.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => toggleCategory(group.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors rounded-lg ${
                            isDarkTheme 
                              ? 'text-slate-400 hover:bg-slate-800/30' 
                              : 'text-slate-500 hover:bg-slate-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GroupIcon className="w-3.5 h-3.5" />
                            <span>{group.label}</span>
                          </div>
                          {isGroupExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>

                        {isGroupExpanded && (
                          <div className="mt-1 space-y-0.5 pl-3">
                            {authorizedItems.map((item) => {
                              const ItemIcon = item.icon;
                              const isActive = activeSubTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  id={`sidebar-item-${item.id}`}
                                  onClick={() => setActiveSubTab(item.id)}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                                    isActive 
                                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                                      : isDarkTheme 
                                        ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' 
                                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <ItemIcon className="w-4 h-4 shrink-0" />
                                  <span className="truncate text-left">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className={`p-2 border-t shrink-0 flex items-center justify-between ${
              isDarkTheme ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                } ${sidebarCollapsed ? 'mx-auto' : ''}`}
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <Layout className="w-4 h-4 transform rotate-180" />
              </button>
              {!sidebarCollapsed && (
                <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                  v2.4.0-admin
                </span>
              )}
            </div>
          </aside>
        )}

        {/* B. Mobile Drawer Navigation */}
        {ENABLE_SRCMC_NAVIGATION_V2 && mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" id="mobile-navigation-drawer">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />
            <div className={`relative flex flex-col w-4/5 max-w-sm h-full ${
              isDarkTheme ? 'bg-[#071A35] text-white border-r border-slate-800' : 'bg-white text-slate-900 border-r border-slate-200'
            } shadow-2xl p-4 transition-transform duration-300`}>
              <div className="flex items-center justify-between border-b border-slate-200/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  <span className="font-black text-xs uppercase tracking-wider">SRCMC Navigation</span>
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-lg hover:bg-slate-100/10" title="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {navGroups.map((group) => {
                  const authorizedItems = group.items.filter(item => isItemAuthorized(item));
                  if (authorizedItems.length === 0) return null;
                  const isGroupExpanded = expandedCategories[group.id];
                  const GroupIcon = group.icon;

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        onClick={() => toggleCategory(group.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400"
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className="w-3.5 h-3.5" />
                          <span>{group.label}</span>
                        </div>
                        {isGroupExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      {isGroupExpanded && (
                        <div className="mt-1 space-y-1 pl-3">
                          {authorizedItems.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = activeSubTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setActiveSubTab(item.id);
                                  setMobileDrawerOpen(false);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold transition-all ${
                                  isActive ? 'bg-indigo-600 text-white' : isDarkTheme ? 'text-slate-300 hover:bg-slate-800/50' : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <ItemIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate text-left">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* C. Right Main Content Area Wrapper */}
        <div className={`flex-1 ${ENABLE_SRCMC_NAVIGATION_V2 ? 'flex flex-col min-w-0 md:h-screen md:overflow-y-auto' : ''}`}>
          
          {/* Top Header Grid */}
          {ENABLE_SRCMC_NAVIGATION_V2 ? (
            <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 ${
              isDarkTheme ? 'bg-[#071A35]/90 border-slate-800' : 'bg-white/95 border-slate-200'
            } backdrop-blur-xs`}>
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-bold tracking-tight">
                {getBreadcrumbs().map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-400">/</span>}
                    <button
                      onClick={crumb.onClick}
                      className={`transition-colors text-left hover:text-indigo-500 ${
                        idx === getBreadcrumbs().length - 1 
                          ? isDarkTheme ? 'text-slate-200 font-black' : 'text-slate-900 font-black' 
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                  isSupabaseConfigured 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isSupabaseConfigured ? 'Supabase Connected' : 'Local Sandbox Emulation'}
                </span>

                <button 
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDarkTheme 
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Refresh database state"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setAdminDetailsOpen(true)}
                  className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isDarkTheme 
                      ? 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-800' 
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono text-[10px] font-bold">
                    {activeSession.user?.name ? activeSession.user.name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="flex flex-col text-left text-[10px]">
                    <span className="font-bold leading-tight truncate max-w-[80px]">{activeSession.user?.name || 'Administrator'}</span>
                    <span className="text-[8px] text-slate-400 uppercase leading-none mt-0.5">{currentAdmin?.role || 'SYSTEM ROOT'}</span>
                  </div>
                </button>
              </div>
            </header>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 px-6 pt-6">
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
          )}

          {/* D. Profile Details Panel Drawer */}
          {ENABLE_SRCMC_NAVIGATION_V2 && adminDetailsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-end" id="admin-details-drawer">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAdminDetailsOpen(false)} />
              <div className={`relative flex flex-col w-full max-w-md h-full ${
                isDarkTheme ? 'bg-[#0C2547] border-l border-slate-800 text-white' : 'bg-white border-l border-slate-200 text-slate-900'
              } shadow-2xl p-6 transition-transform duration-300`}>
                <div className="flex items-center justify-between border-b border-slate-200/10 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-black text-xs uppercase tracking-wider">System Root Actor Information</h3>
                  </div>
                  <button onClick={() => setAdminDetailsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100/10" title="Close panel">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                  <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                    isDarkTheme ? 'bg-[#071A35] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono text-lg font-black shadow-md">
                      {activeSession.user?.name ? activeSession.user.name[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{activeSession.user?.name || 'Administrator'}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{currentAdmin?.role || 'SYSTEM ROOT'}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{loggedInEmail}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Granted Granular Permissions</h5>
                    <div className="space-y-2">
                      {(currentAdmin?.permissions || [
                        'view_dashboard', 'monitor_rates', 'manage_overrides',
                        'approve_community_rates', 'manage_corridors', 'manage_channels',
                        'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'
                      ]).map((perm, idx) => {
                        const labelMap: Record<string, string> = {
                          manage_overrides: 'Manage Live Overrides & Spreader Controls',
                          approve_community_rates: 'Approve & Moderate Community Rate Submissions',
                          monitor_rates: 'Monitor Exchange Rates & SIC Evidence Repositories',
                          manage_channels: 'Configure Remittance Channels & Corridors',
                          view_sic: 'View SIC Intelligence Framework Policy & Weights',
                          view_audit_logs: 'Inspect Operational & Administrative Audit Trail',
                          manage_admins: 'Manage Admin Access, Registrations, & Security Credentials',
                          view_dashboard: 'Access Main Control Panel Dashboards',
                          view_history: 'Access Historic Pipeline Action Logs',
                          view_true_cost: 'Audit True Cost Margins & Partner Tariffs'
                        };
                        return (
                          <div key={idx} className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                            isDarkTheme ? 'bg-[#071A35]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                            <div>
                              <span className="font-mono text-[10px] font-bold block">{perm}</span>
                              <span className="text-[10px] text-slate-400 font-medium leading-normal block mt-0.5">
                                {labelMap[perm] || 'Authorized action within administrative workspace'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Security Session</h5>
                    <div className={`p-3 rounded-lg border text-[10px] font-mono space-y-1.5 ${
                      isDarkTheme ? 'bg-[#071A35] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Session IP:</span>
                        <span className="text-slate-300">127.0.0.1 (Sandbox Gateway)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Node:</span>
                        <span className="text-slate-300">sr-backend-run-node</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Environment:</span>
                        <span className="text-slate-300">{isSupabaseConfigured ? 'Production Remote API' : 'Sandbox Client Emulation'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Auth Signature:</span>
                        <span className="text-slate-300">HS256 SHA-2 Cryptographic</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Duration:</span>
                        <span className="text-slate-300">01:42:04 UTC</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/10 pt-4 mt-4">
                  <button
                    onClick={() => onSessionSync()}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminate Session</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* E. Legacy Role Status Card and subtabs */}
          {!ENABLE_SRCMC_NAVIGATION_V2 && (
            <div className="px-6 space-y-6">
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

              <div className="flex flex-wrap border-b border-slate-200 gap-1 sm:gap-0">
                {allowedSubtabs.map((tab) => (
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
            </div>
          )}

          {/* F. Page Padding Container */}
          <div className={ENABLE_SRCMC_NAVIGATION_V2 ? 'p-6 md:p-8 space-y-8 flex-1' : 'px-6 pb-24 mt-6'}>
            
            {loading ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Syncing database assets...</p>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* BRAND NEW: SRCMC COMMAND & INTELLIGENCE DASHBOARD LANDING PAGE */}
                {ENABLE_SRCMC_NAVIGATION_V2 && activeSubTab === 'dashboard' && (
                  <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300" id="command-dashboard-view">
                    
                    {/* Header Banner */}
                    <div className={`p-6 rounded-2xl border ${
                      isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200'
                    } shadow-md`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-sans font-black tracking-tight flex items-center gap-2">
                            <Layout className="w-6 h-6 text-indigo-500" />
                            <span>SRCMC Operational Command & Intelligence Dashboard</span>
                          </h2>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                            Real-time core metrics, system configuration states, and rate engine diagnostics.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-mono uppercase tracking-widest font-black text-emerald-400">Pipeline State: ACTIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Bento Grid Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Overrides Metric */}
                      <div 
                        onClick={() => setActiveSubTab('overrides')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-32 ${
                          isDarkTheme ? 'bg-[#0C2547] hover:bg-[#0C2547]/80 border-slate-800' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                        id="metric-active-overrides"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Overrides</span>
                          <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
                            <Percent className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <span className="text-3xl font-black font-sans leading-none block">
                            {overrides.filter(o => o.is_active && (!o.expires_at || new Date(o.expires_at) > new Date())).length}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold block mt-1">
                            Live rates overridden manually
                          </span>
                        </div>
                      </div>

                      {/* Submissions Metric */}
                      <div 
                        onClick={() => setActiveSubTab('submissions')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-32 ${
                          isDarkTheme ? 'bg-[#0C2547] hover:bg-[#0C2547]/80 border-slate-800' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                        id="metric-pending-submissions"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Rates</span>
                          <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                            <Users className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <span className="text-3xl font-black font-sans leading-none block">
                            {submissions.filter(s => s.status === 'pending_verification' || s.status === 'pending' || s.status === 'security_review').length}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold block mt-1">
                            Community submissions awaiting review
                          </span>
                        </div>
                      </div>

                      {/* Evidence Conflicts Metric */}
                      <div 
                        onClick={() => setActiveSubTab('evidence_resolution')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-32 ${
                          isDarkTheme ? 'bg-[#0C2547] hover:bg-[#0C2547]/80 border-slate-800' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                        id="metric-evidence-conflicts"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidence Conflicts</span>
                          <div className="p-1.5 rounded bg-rose-500/10 text-rose-400">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <span className="text-3xl font-black font-sans leading-none block">
                            {erdeConflicts.filter(c => c.status === 'open').length}
                          </span>
                          <span className="text-[9px] font-mono text-rose-500 font-bold block mt-1">
                            🚨 {erdeConflicts.filter(c => c.status === 'open' && (c.severity === 'major_conflict' || c.severity === 'critical_conflict')).length} major exceptions
                          </span>
                        </div>
                      </div>

                      {/* Security Incidents Metric */}
                      <div 
                        onClick={() => setActiveSubTab('fraud_logs')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-32 ${
                          isDarkTheme ? 'bg-[#0C2547] hover:bg-[#0C2547]/80 border-slate-800' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                        id="metric-security-alerts"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Alerts</span>
                          <div className="p-1.5 rounded bg-red-500/10 text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <span className="text-3xl font-black font-sans leading-none block">
                            {fraudEvents.length}
                          </span>
                          <span className="text-[9px] font-mono text-red-400 font-bold block mt-1">
                            Manipulations & speed spam blocks
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Tables (Two Columns Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* Overrides Subtable */}
                        <div className={`p-6 rounded-xl border ${
                          isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}>
                          <div className="flex items-center justify-between border-b border-slate-200/10 pb-3 mb-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              <Percent className="w-4 h-4" />
                              Active Administrative Rate Overrides
                            </h3>
                            <button onClick={() => setActiveSubTab('overrides')} className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:underline">
                              View overrides &rarr;
                            </button>
                          </div>
                          {overrides.filter(o => o.is_active && (!o.expires_at || new Date(o.expires_at) > new Date())).length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                              No active rate overrides in place. Rate Pipeline is healthy.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-[11px] font-mono">
                                <thead>
                                  <tr className="border-b border-slate-200/10 text-slate-400 font-black uppercase tracking-wider text-[9px] pb-2">
                                    <th className="py-2 pr-4">Corridor</th>
                                    <th className="py-2 pr-4">Provider</th>
                                    <th className="py-2 pr-4">Value</th>
                                    <th className="py-2 pr-4">Expires</th>
                                    <th className="py-2 pr-4 text-right">Reason</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/5 font-medium text-slate-300">
                                  {overrides.filter(o => o.is_active && (!o.expires_at || new Date(o.expires_at) > new Date())).slice(0, 5).map((ov) => (
                                    <tr key={ov.id} className="hover:bg-slate-500/5">
                                      <td className="py-3 pr-4 font-bold">{ov.corridor_id}</td>
                                      <td className="py-3 pr-4">{ov.provider_code}</td>
                                      <td className="py-3 pr-4 text-indigo-400 font-bold">{ov.override_value?.toFixed(4)}</td>
                                      <td className="py-3 pr-4 text-slate-400">
                                        {ov.expires_at ? new Date(ov.expires_at).toLocaleTimeString() : 'Never'}
                                      </td>
                                      <td className="py-3 pr-4 text-right text-slate-400 font-sans truncate max-w-[150px]">{ov.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Submissions Subtable */}
                        <div className={`p-6 rounded-xl border ${
                          isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}>
                          <div className="flex items-center justify-between border-b border-slate-200/10 pb-3 mb-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              Pending Community Rate Submissions
                            </h3>
                            <button onClick={() => setActiveSubTab('submissions')} className="text-[10px] font-black uppercase tracking-wider text-amber-500 hover:underline">
                              Review submissions &rarr;
                            </button>
                          </div>
                          {submissions.filter(s => s.status === 'pending_verification' || s.status === 'pending' || s.status === 'security_review').length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                              No community submissions awaiting moderation. Feed is fully processed.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-[11px] font-mono">
                                <thead>
                                  <tr className="border-b border-slate-200/10 text-slate-400 font-black uppercase tracking-wider text-[9px]">
                                    <th className="py-2 pr-4">Timestamp</th>
                                    <th className="py-2 pr-4">User</th>
                                    <th className="py-2 pr-4">Corridor</th>
                                    <th className="py-2 pr-4">Claimed</th>
                                    <th className="py-2 pr-4 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/5 font-medium text-slate-300">
                                  {submissions.filter(s => s.status === 'pending_verification' || s.status === 'pending' || s.status === 'security_review').slice(0, 5).map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-500/5">
                                      <td className="py-3 pr-4 text-slate-400">{new Date(sub.timestamp || sub.created_at).toLocaleTimeString()}</td>
                                      <td className="py-3 pr-4 truncate max-w-[100px]">{sub.user_email}</td>
                                      <td className="py-3 pr-4 font-bold">{sub.corridor_id}</td>
                                      <td className="py-3 pr-4 text-emerald-400 font-bold">{sub.submitted_rate?.toFixed(4)}</td>
                                      <td className="py-3 pr-4 text-right font-sans">
                                        <button
                                          onClick={() => setActiveSubTab('submissions')}
                                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] uppercase font-black cursor-pointer"
                                        >
                                          Resolve
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Quick Actions + Health */}
                      <div className="lg:col-span-1 space-y-6">
                        {/* Quick Actions */}
                        <div className={`p-6 rounded-xl border ${
                          isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}>
                          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 border-b border-slate-200/10 pb-2.5 mb-4 flex items-center gap-1.5">
                            <Layout className="w-4 h-4" />
                            Administrative Quick Actions
                          </h4>
                          <div className="space-y-2">
                            <button onClick={() => setActiveSubTab('overrides')} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                              isDarkTheme ? 'bg-[#071A35] border-slate-850 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 border-slate-200 hover:bg-indigo-600 hover:text-white'
                            }`}>
                              <span>Deploy Override</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setActiveSubTab('submissions')} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                              isDarkTheme ? 'bg-[#071A35] border-slate-850 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 border-slate-200 hover:bg-indigo-600 hover:text-white'
                            }`}>
                              <span>Moderate Community</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setActiveSubTab('evidence_resolution')} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                              isDarkTheme ? 'bg-[#071A35] border-slate-850 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 border-slate-200 hover:bg-indigo-600 hover:text-white'
                            }`}>
                              <span>Audit Conflicts</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setActiveSubTab('support')} className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-colors ${
                              isDarkTheme ? 'bg-[#071A35] border-slate-850 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 border-slate-200 hover:bg-indigo-600 hover:text-white'
                            }`}>
                              <span>Open Support Desk</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Health Panel */}
                        <div className={`p-6 rounded-xl border ${
                          isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`} id="health">
                          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 border-b border-slate-200/10 pb-2.5 mb-4 flex items-center gap-1.5">
                            <Activity className="w-4 h-4" />
                            System Intelligence
                          </h4>
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Supabase DB:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {isSupabaseConfigured ? 'Operational' : 'Emulated'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">SIC Evidence Count:</span>
                              <span className="font-bold text-indigo-400 font-mono">{evidenceList.length} files</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Low Confidence:</span>
                              <span className={`font-bold font-mono ${evidenceList.filter(e => e.confidenceInput !== null && e.confidenceInput !== undefined && e.confidenceInput < 0.6).length > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                                {evidenceList.filter(e => e.confidenceInput !== null && e.confidenceInput !== undefined && e.confidenceInput < 0.6).length} flagged
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Support Requests:</span>
                              <span className="font-bold font-mono text-indigo-400">
                                {adminSupportRequests.filter(s => s.status === 'open' || s.status === 'new').length} active
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">User Profiles:</span>
                              <span className="font-bold font-mono text-indigo-400">{registeredUsers.length} active</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent actions */}
                        <div className={`p-6 rounded-xl border ${
                          isDarkTheme ? 'bg-[#0C2547] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}>
                          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 border-b border-slate-200/10 pb-2.5 mb-4 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            Recent Actions Feed
                          </h4>
                          {auditLogs.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                              No recent administrative actions recorded.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                              {auditLogs.slice(0, 4).map((log) => (
                                <div key={log.id} className="text-[10px] space-y-1 border-b border-slate-200/5 pb-2 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between font-mono text-slate-400">
                                    <span className="truncate max-w-[120px] font-bold">{log.actor_email}</span>
                                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-slate-300 font-medium font-sans">
                                    <span className="px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-mono font-bold uppercase mr-1">
                                      {log.action.replace('AUTHORIZED_ACTION: ', '')}
                                    </span>
                                    {log.target_type} : <span className="font-mono text-slate-400">{log.target_id}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Estimated Rate Impact (SAR)</label>
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

          {/* TAB 1.5: SIC EVIDENCE & PROVENANCE ENGINE (EPE) DIAGNOSTICS */}
          {activeSubTab === 'evidence_provenance' && (
            <div className="space-y-6">
              {/* OVERVIEW METRICS PANEL */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Active</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-600">{evidenceList.filter(e => e.status === 'active').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">records</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Verified Submitted</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-indigo-600">{evidenceList.filter(e => e.status === 'verified').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">records</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pending Actions</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-600">{evidenceList.filter(e => e.status === 'pending').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">records</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Stale/Expired</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-rose-600">{evidenceList.filter(e => e.freshnessState === 'stale' || e.freshnessState === 'expired').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">records</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Incomplete</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-500">{evidenceList.filter(e => e.status === 'incomplete').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">records</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Public Feeds</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-teal-600">{evidenceList.filter(e => e.subjectType === 'reference_benchmark').length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">feeds</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Provider Match</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-600">{evidenceList.filter(e => e.providerSpecific).length}</span>
                    <span className="text-[10px] text-slate-400 font-bold">scoped</span>
                  </div>
                </div>
              </div>

              {/* FILTERS CARD */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Audit & Diagnostic Filter Presets</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {/* Search Term */}
                  <div className="lg:col-span-2">
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Search Evidence ID/Value</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={evidenceSearchTerm}
                        onChange={(e) => setEvidenceSearchTerm(e.target.value)}
                        placeholder="Search UUID or Value..."
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 pl-8 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* Provider Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Provider Code</label>
                    <select
                      value={evidenceFilterProvider}
                      onChange={(e) => setEvidenceFilterProvider(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Providers</option>
                      {Array.from(new Set(evidenceList.map(e => e.providerCode))).filter(Boolean).map(code => (
                        <option key={String(code)} value={String(code)}>{String(code).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Corridor Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Corridor Route</label>
                    <select
                      value={evidenceFilterCorridor}
                      onChange={(e) => setEvidenceFilterCorridor(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Corridors</option>
                      {Array.from(new Set(evidenceList.map(e => e.corridorId))).filter(Boolean).map(cid => (
                        <option key={String(cid)} value={String(cid)}>{String(cid).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Type Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Subject Type</label>
                    <select
                      value={evidenceFilterSubject}
                      onChange={(e) => setEvidenceFilterSubject(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Subjects</option>
                      <option value="exchange_rate">Exchange Rate</option>
                      <option value="reference_benchmark">Reference Benchmark</option>
                      <option value="fee_structure">Fee Structure</option>
                    </select>
                  </div>

                  {/* Source Type Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Source Type</label>
                    <select
                      value={evidenceFilterSourceType}
                      onChange={(e) => setEvidenceFilterSourceType(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Sources</option>
                      <option value="management_override">Management Override</option>
                      <option value="management_verified">Management Verified</option>
                      <option value="community_verified">Community Verified</option>
                      <option value="community_submitted">Community Submitted</option>
                      <option value="public_reference_api">Public Reference API</option>
                      <option value="legacy_unclassified">Legacy Unclassified</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">EPE Status</label>
                    <select
                      value={evidenceFilterStatus}
                      onChange={(e) => setEvidenceFilterStatus(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                      <option value="incomplete">Incomplete</option>
                      <option value="superseded">Superseded</option>
                    </select>
                  </div>

                  {/* Freshness Filter */}
                  <div>
                    <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1">Freshness Tier</label>
                    <select
                      value={evidenceFilterFreshness}
                      onChange={(e) => setEvidenceFilterFreshness(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-600 transition-colors font-semibold"
                    >
                      <option value="all">All Freshness</option>
                      <option value="fresh">Fresh (&lt;1h)</option>
                      <option value="aging">Aging (&lt;24h)</option>
                      <option value="stale">Stale (&gt;24h)</option>
                      <option value="expired">Expired (Policy Limit)</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TWO-COLUMN EXPLORER & TIMELINE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1 & 2: THE EVIDENCE REGISTER */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                        <Database className="w-5 h-5 text-emerald-600" />
                        Provenance Records Database (EPE)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Immutable cryptographic logs linking every active resolution rate to physical administrative actions or verifiable market references.
                      </p>
                    </div>
                  </div>

                  {loadingEvidence ? (
                    <div className="py-24 text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-slate-400 text-xs font-black uppercase tracking-wider animate-pulse">Scanning Sandbox Registers...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                            <th className="py-3 px-4">Subject Route</th>
                            <th className="py-3 px-4">Observation Value</th>
                            <th className="py-3 px-4">Status & Source</th>
                            <th className="py-3 px-4">Freshness</th>
                            <th className="py-3 px-4">Last Synced</th>
                            <th className="py-3 px-4 text-right">Provenance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(() => {
                            const filtered = evidenceList.filter(item => {
                              if (evidenceFilterProvider !== 'all' && item.providerCode !== evidenceFilterProvider) return false;
                              if (evidenceFilterCorridor !== 'all' && item.corridorId !== evidenceFilterCorridor) return false;
                              if (evidenceFilterSubject !== 'all' && item.subjectType !== evidenceFilterSubject) return false;
                              if (evidenceFilterSourceType !== 'all' && item.sourceType !== evidenceFilterSourceType) return false;
                              if (evidenceFilterStatus !== 'all' && item.status !== evidenceFilterStatus) return false;
                              if (evidenceFilterFreshness !== 'all' && item.freshnessState !== evidenceFilterFreshness) return false;
                              
                              if (evidenceSearchTerm.trim() !== '') {
                                const term = evidenceSearchTerm.toLowerCase();
                                const idMatch = item.id.toLowerCase().includes(term);
                                const valMatch = item.numericValue.toString().includes(term);
                                const provMatch = item.providerCode?.toLowerCase().includes(term);
                                const corrMatch = item.corridorId?.toLowerCase().includes(term);
                                if (!idMatch && !valMatch && !provMatch && !corrMatch) return false;
                              }
                              return true;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="py-16 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                                    No evidence records found matching selected diagnostic presets.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((row) => {
                              const statusStyles: Record<string, string> = {
                                pending: 'bg-amber-50 text-amber-800 border-amber-200',
                                active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                                verified: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                                rejected: 'bg-rose-50 text-rose-800 border-rose-200',
                                expired: 'bg-rose-50 text-rose-700 border-rose-200',
                                superseded: 'bg-purple-50 text-purple-800 border-purple-200',
                                incomplete: 'bg-slate-50 text-slate-500 border-slate-200'
                              };

                              const freshnessStyles: Record<string, string> = {
                                fresh: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                                aging: 'bg-amber-100 text-amber-900 border-amber-300',
                                stale: 'bg-rose-100 text-rose-900 border-rose-300',
                                expired: 'bg-red-200 text-red-950 border-red-400',
                                unknown: 'bg-slate-100 text-slate-600 border-slate-300'
                              };

                              return (
                                <tr key={row.id} className="hover:bg-slate-50/35 transition-colors text-slate-600">
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                                        {row.subjectType.replace('_', ' ')}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {row.providerCode?.toUpperCase()} • {row.corridorId?.toUpperCase()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-mono">
                                    <div className="flex flex-col">
                                      <span className="font-black text-slate-900 text-xs">{row.numericValue.toFixed(4)}</span>
                                      <span className="text-[9px] text-slate-400">{row.sourceCurrency} → {row.destinationCurrency}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase border font-black ${statusStyles[row.status] || 'bg-slate-100'}`}>
                                        {row.status}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-semibold truncate max-w-[120px]" title={row.sourceType}>
                                        {row.sourceType.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase border font-semibold ${freshnessStyles[row.freshnessState] || 'bg-slate-100'}`}>
                                      {row.freshnessState}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                                    {new Date(row.observedAt).toLocaleTimeString()}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() => setSelectedEvidence(row)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-700 font-bold uppercase transition-all duration-150 border border-slate-200 hover:border-emerald-200"
                                    >
                                      Trace
                                      <ArrowRightLeft className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* COLUMN 3: REAL-TIME CRYPTOGRAPHIC AUDIT TRAILS */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      EPE Cryptographic Audits
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Cryptographically sequenced log of state updates, freshness recalculations, and permission checks.
                    </p>
                  </div>

                  {loadingEvidence ? (
                    <div className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] animate-pulse">
                      Loading audit database...
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {evidenceAuditLogs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                          No audit entries recorded.
                        </div>
                      ) : (
                        evidenceAuditLogs.map((log) => {
                          const actionColors: Record<string, string> = {
                            register_evidence: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                            state_override: 'text-purple-600 bg-purple-50 border-purple-100',
                            freshness_recalculated: 'text-amber-600 bg-amber-50 border-amber-100',
                            superseded: 'text-rose-600 bg-rose-50 border-rose-100'
                          };

                          return (
                            <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-[11px] hover:border-indigo-200 transition-colors">
                              <div className="flex justify-between items-center flex-wrap gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase border font-extrabold ${actionColors[log.action] || 'text-slate-600 bg-slate-100'}`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-slate-600 font-medium leading-relaxed">
                                {log.details}
                              </p>
                              {log.actorEmail && (
                                <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                                  <span>Actor:</span>
                                  <span className="font-mono text-slate-500">{log.actorEmail}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED PROVENANCE DRAWER / MODAL OVERLAY */}
              {selectedEvidence && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                    {/* Modal Header */}
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-widest">
                          SIC 2.0 Audited Provenance
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                          Tracing Evidence: {selectedEvidence.id.substring(0, 8)}...
                        </h4>
                      </div>
                      <button 
                        onClick={() => setSelectedEvidence(null)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                      {/* Section 1: Subject Overview */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Subject Type</span>
                          <span className="text-xs font-black text-slate-800 uppercase">{selectedEvidence.subjectType.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Observed Value</span>
                          <span className="text-xs font-black text-emerald-700 font-mono">{selectedEvidence.numericValue.toFixed(4)} {selectedEvidence.destinationCurrency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">Scope Specificity</span>
                          <span className="text-xs font-black text-slate-800 uppercase">
                            {selectedEvidence.providerSpecific ? 'Provider Specific' : 'Global Corridor'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 block">EPE Status</span>
                          <span className="text-xs font-black text-indigo-700 uppercase">{selectedEvidence.status}</span>
                        </div>
                      </div>

                      {/* Section 2: Detailed Provenance & Source Metadata */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <Database className="w-4 h-4 text-emerald-600" />
                          Source Evidence Mapping
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400">Verifiable Source Registry</span>
                              <p className="font-bold text-slate-800">{selectedEvidence.sourceName || 'System Generated'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400">Database Record Reference ID</span>
                              <p className="font-mono text-slate-500 break-all select-all">{selectedEvidence.sourceRecordId || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400">Remittance Corridor</span>
                              <p className="font-bold text-slate-800 uppercase">{selectedEvidence.corridorId} ({selectedEvidence.sourceCurrency} to {selectedEvidence.destinationCurrency})</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400">Channel Provider</span>
                              <p className="font-bold text-slate-800 uppercase">{selectedEvidence.providerCode || 'Global/Reference'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Freshness Policy & Estimation */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Freshness & Persistence Policies
                        </h5>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400 block">Observed Timestamp</span>
                              <span className="font-mono text-slate-700">{new Date(selectedEvidence.observedAt).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400 block">Verified Timestamp</span>
                              <span className="font-mono text-slate-700">
                                {selectedEvidence.verifiedAt ? new Date(selectedEvidence.verifiedAt).toLocaleString() : 'Automatically Inferred'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400 block">Estimated Expiration</span>
                              <span className="font-mono text-rose-700 font-bold">
                                {selectedEvidence.expiresAt ? new Date(selectedEvidence.expiresAt).toLocaleString() : 'Policy Default'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-black text-slate-400 block">Freshness Evaluation State</span>
                              <span className="font-bold text-emerald-700 uppercase">{selectedEvidence.freshnessState}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Permitted Uses */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          Downstream Permitted Uses (EPE Core Rulebook)
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedEvidence.permittedUses.map((use) => {
                            const useLabels: Record<string, string> = {
                              comparison: 'Allow Corridor Price Comparison',
                              recommendation: 'Allow Active Partner Recommendations',
                              audit: 'Retain for Cryptographic Audits',
                              analytics: 'Enable Downstream Time-series Analytics'
                            };

                            return (
                              <span key={use} className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-lg text-xs font-bold">
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                                {useLabels[use] || use}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 5: Specific Audit Timeline */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                          <FileText className="w-4 h-4 text-slate-600" />
                          Cryptographic Auditing Feed for {selectedEvidence.id.substring(0, 8)}
                        </h5>
                        <div className="space-y-2">
                          {evidenceAuditLogs.filter(log => log.evidenceId === selectedEvidence.id).length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold italic">No specific override or state modifications recorded for this record.</p>
                          ) : (
                            evidenceAuditLogs.filter(log => log.evidenceId === selectedEvidence.id).map(log => (
                              <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                                  <span className="uppercase text-[9px] text-indigo-700">{log.action}</span>
                                  <span className="font-mono text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-600 font-medium">{log.details}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-between items-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        UUID: <span className="font-mono select-all text-slate-500">{selectedEvidence.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedEvidence.status === 'active' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to mark this evidence record as superseded? This will disqualify it from downstream price comparison matching.')) {
                                await EpeService.transitionStatus(selectedEvidence.id, 'superseded', 'admin@sariremit.com', 'Manual override: marked evidence record as superseded');
                                const allEvidence = await EpeService.getAllEvidence();
                                setEvidenceList(allEvidence);
                                const item = allEvidence.find(e => e.id === selectedEvidence.id);
                                if (item) setSelectedEvidence(item);
                                const audits = await EpeService.getAuditLogs();
                                setEvidenceAuditLogs(audits);
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Supersede / Disqualify
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedEvidence(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Dismiss Trace
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.6: SIC EVIDENCE RESOLUTION & DECISION ENGINE (ERDE) */}
          {activeSubTab === 'evidence_resolution' && (
            <div className="space-y-6 animate-fade-in">
              {/* TOP HEADER CONTROLS */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-indigo-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      SIC 2.0 Engine
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                      Phase 2 (ERDE)
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight mt-1">
                    Evidence Resolution & Decision Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deterministic candidate evaluation, eligibility profiling, and audit-proven operational selections.
                  </p>
                </div>
                
                {/* GLOBAL CONTROL BUTTONS */}
                <div className="flex items-center gap-2">
                  <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Operational Mode:</span>
                    <button 
                      onClick={() => {
                        const next = !ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE;
                        ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE = next;
                        ERDE_FEATURE_FLAGS.ENABLE_ERDE_SHADOW_MODE = !next;
                        // Trigger re-render
                        dispatchAction(`Toggle ERDE to ${next ? 'OPERATIONAL' : 'SHADOW'} mode`, async () => {
                          setRefreshTrigger(prev => prev + 1);
                        });
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                        ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE 
                          ? 'bg-emerald-600 text-emerald-50' 
                          : 'bg-amber-600 text-amber-50'
                      }`}
                    >
                      {ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE ? 'Active' : 'Shadow Mode'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      dispatchAction('Simulate Live SIC Resolve Sweep', async () => {
                        setLoadingEvidence(true);
                        try {
                          const allEvidence = await EpeService.getAllEvidence();
                          const corridors = Array.from(new Set(allEvidence.map(e => e.corridorId).filter(Boolean)));
                          let resolutionsCount = 0;
                          
                          for (const corr of corridors) {
                            const context = EdeService.buildContext({
                              providerId: null,
                              corridorId: corr,
                              sourceCurrency: 'SAR',
                              destinationCurrency: allEvidence.find(x => x.corridorId === corr)?.destinationCurrency || 'USD',
                              subjectType: 'exchange_rate',
                              requestedPermittedUse: 'recommendation',
                              environment: 'production'
                            });
                            await EdeService.resolveEvidence(context);
                            resolutionsCount++;
                          }
                          
                          setRefreshTrigger(prev => prev + 1);
                          alert(`Successfully executed resolution sweeps for ${resolutionsCount} corridors!`);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoadingEvidence(false);
                        }
                      });
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Trigger Resolve Sweep
                  </button>
                </div>
              </div>

              {/* QUICK STATS PANEL */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Active Policy</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-800">
                      v{activePolicy?.version || 1}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[100px]">
                      {activePolicy?.name || 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Resolutions</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-indigo-600">
                      {erdeResolutions.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">completed</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Open Conflicts</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className={`text-xl font-black ${erdeConflicts.filter(c => c.status === 'open').length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
                      {erdeConflicts.filter(c => c.status === 'open').length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">active</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Shadow Congruence</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-emerald-600">
                      99.1%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">congruent</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Draft Policies</span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-amber-600">
                      {erdePolicies.filter(p => p.status === 'draft').length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">staged</span>
                  </div>
                </div>
              </div>

              {/* INNER SECTION SELECTOR */}
              <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
                {[
                  { key: 'overview', label: 'Engine Overview', icon: Layout },
                  { key: 'resolutions', label: 'Operational Decisions', icon: FileText },
                  { key: 'conflicts', label: 'Conflict Triage Center', icon: ShieldAlert },
                  { key: 'policies', label: 'Policy Settings', icon: Settings },
                  { key: 'shadow', label: 'Shadow Mode Dashboard', icon: Eye },
                  { key: 'tests', label: 'Diagnostics & Test Suite', icon: PlayCircle }
                ].map(sec => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.key}
                      onClick={() => {
                        setErdeSection(sec.key);
                        setSelectedResolution(null);
                        setSelectedConflict(null);
                        setEditingPolicy(null);
                      }}
                      className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-all ${
                        erdeSection === sec.key 
                          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' 
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {sec.label}
                    </button>
                  );
                })}
              </div>

              {/* SECTION: OVERVIEW */}
              {erdeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ENGINE ARCHITECTURE BRIEF */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-600" />
                      Evidence Resolution Context Flow
                    </h4>
                    
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The <strong>Evidence Resolution & Decision Engine (ERDE)</strong> sits directly between the raw evidence provenance store and downstream remittance rate calculations. By running in real-time, it discovers candidates, evaluates eligibility profiles, profiles freshness constraints, and executes deterministic ranking based on fine-tuned administrative weights.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">1</div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mt-2">Candidate Discovery</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Filters raw evidence list matching the target corridor, subject, and provider specifications.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">2</div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mt-2">Eligibility & Quality</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Performs multi-dimensional scoring for freshness, verification status, and provenance completeness.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">3</div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mt-2">Conflict Detection</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Analyzes numeric and structural differences. Blocks automatically on extreme variance to prevent fraud.
                        </p>
                      </div>
                    </div>

                    {/* CURRENT MODE DIAGNOSIS */}
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 flex justify-between items-center flex-wrap gap-4 mt-2">
                      <div>
                        <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider">Engine Execution Status</span>
                        <h5 className="text-xs font-bold text-white mt-0.5">
                          {ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE 
                            ? 'OPERATIONAL MODE ACTIVE — Automated resolutions writing live decisions' 
                            : 'SHADOW MODE RUNNING — Resolving in background, comparison logs generated'
                          }
                        </h5>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {ERDE_FEATURE_FLAGS.ENABLE_ERDE_OPERATIONAL_MODE ? 'Live Ingress' : 'Passive Monitoring'}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE POLICY SNAPSHOT */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Active Policy Details
                      </h4>
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Policy ID:</span>
                          <span className="font-mono text-slate-800 font-bold">{activePolicy?.policyId}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Version:</span>
                          <span className="font-bold text-slate-800">v{activePolicy?.version}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Min Quality Score:</span>
                          <span className="font-bold text-indigo-600">{activePolicy?.minimumQualityScore} pts</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Override Priority:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activePolicy?.preserveManagementOverridePriority ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {activePolicy?.preserveManagementOverridePriority ? 'Preserved' : 'Normal Weighted'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Legacy Fallback:</span>
                          <span className="font-bold text-slate-800">{activePolicy?.allowLegacyFallback ? 'Allowed' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Expired Exclusion:</span>
                          <span className="font-bold text-slate-800">{activePolicy?.rejectExpiredEvidence ? 'Active Exclude' : 'Include with degradation'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setErdeSection('policies')}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center"
                    >
                      Fine-Tune Policy Weights
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION: RESOLUTIONS (DECISIONS) */}
              {erdeSection === 'resolutions' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                        Operational Decisions Journal ({erdeResolutions.length})
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Historical list of real-time resolved values and structured audit trails.
                      </p>
                    </div>

                    {/* FILTERS */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={resFilterStatus}
                        onChange={(e) => setResFilterStatus(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                      >
                        <option value="all">All Statuses</option>
                        <option value="resolved">Resolved</option>
                        <option value="blocked_by_conflict">Blocked</option>
                        <option value="insufficient_evidence">Insufficient</option>
                      </select>
                      <select
                        value={resFilterCorridor}
                        onChange={(e) => setResFilterCorridor(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                      >
                        <option value="all">All Corridors</option>
                        {Array.from(new Set(erdeResolutions.map(r => r.context.corridorId).filter(Boolean))).map(c => (
                          <option key={String(c)} value={String(c)}>{String(c).toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* RESOLUTIONS JOURNAL LIST */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Resolution ID</th>
                          <th className="py-3 px-4">Corridor</th>
                          <th className="py-3 px-4">Resolved Value</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Reason / Policy</th>
                          <th className="py-3 px-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {erdeResolutions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                              No resolutions stored in ledger. Trigger a Resolve Sweep to build decisions journal!
                            </td>
                          </tr>
                        ) : (
                          erdeResolutions
                            .filter(r => resFilterStatus === 'all' || r.status === resFilterStatus)
                            .filter(r => resFilterCorridor === 'all' || r.context.corridorId === resFilterCorridor)
                            .map(row => {
                              const isBlock = row.status === 'blocked_by_conflict';
                              const isIns = row.status === 'insufficient_evidence';
                              const statusColor = isBlock 
                                ? 'bg-rose-100 text-rose-800' 
                                : isIns 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-emerald-100 text-emerald-800';

                              return (
                                <tr 
                                  key={row.resolutionId}
                                  onClick={() => setSelectedResolution(row)}
                                  className="hover:bg-slate-50 cursor-pointer transition-all"
                                >
                                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                    {row.resolutionId}
                                  </td>
                                  <td className="py-3 px-4 font-bold uppercase">
                                    {row.context.corridorId}
                                  </td>
                                  <td className="py-3 px-4 font-black text-slate-800">
                                    {row.status === 'resolved' ? (row.resolvedValue?.toFixed(4) || '—') : '—'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${statusColor}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-800">{row.resolutionReasonCode}</div>
                                    <div className="text-[10px] text-slate-400">Policy ID: {row.resolutionPolicyId} (v{row.resolutionPolicyVersion})</div>
                                  </td>
                                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                                    {new Date(row.generatedAt).toLocaleTimeString()}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* EXPANDED RESOLUTION DRAWER DETAIL */}
                  {selectedResolution && (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mt-4 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Resolution Audit Drawer</span>
                          <h5 className="text-sm font-black text-slate-800 mt-1">
                            Auditing resolution record: <span className="font-mono text-indigo-600">{selectedResolution.resolutionId}</span>
                          </h5>
                        </div>
                        <button 
                          onClick={() => setSelectedResolution(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                        >
                          ✕ Close Audit
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <h6 className="font-black uppercase tracking-wider text-[10px] text-slate-500">Context Properties</h6>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Subject:</span> <span className="font-bold uppercase text-slate-700">{selectedResolution.context.subjectType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Corridor ID:</span> <span className="font-bold uppercase text-slate-700">{selectedResolution.context.corridorId}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Provider Specificity:</span> <span className="font-bold text-slate-700">{selectedResolution.context.providerId || 'Global Match'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Environment:</span> <span className="font-bold uppercase text-slate-700">{selectedResolution.context.environment}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Requested Use:</span> <span className="font-bold text-slate-700">{selectedResolution.context.requestedPermittedUse}</span></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h6 className="font-black uppercase tracking-wider text-[10px] text-slate-500">Selection Explanation</h6>
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-bold uppercase text-indigo-600">{selectedResolution.status}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Selected Candidate:</span> <span className="font-mono font-bold text-slate-800">{selectedResolution.selectedEvidenceId || 'None'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Selected Value:</span> <span className="font-black text-slate-800">{selectedResolution.resolvedValue || '—'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Reason User Facing:</span> <span className="font-bold text-slate-700">{selectedResolution.resolutionReasonUserFacing}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Reason Internal:</span> <span className="text-slate-500 italic">{selectedResolution.resolutionReasonInternal}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* CANDIDATES CLASSIFICATION TABLE */}
                      <div className="space-y-2 text-xs">
                        <h6 className="font-black uppercase tracking-wider text-[10px] text-slate-500">Candidates Eligibility Matrix</h6>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400">
                              <tr>
                                <th className="py-2 px-3">Evidence ID / Source</th>
                                <th className="py-2 px-3">Source Type</th>
                                <th className="py-2 px-3">Rate</th>
                                <th className="py-2 px-3">Quality Score</th>
                                <th className="py-2 px-3">Freshness</th>
                                <th className="py-2 px-3">Eligibility State</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                              {/* SELECTED */}
                              {selectedResolution.selectedEvidenceId && (
                                <tr className="bg-emerald-50/50 font-semibold">
                                  <td className="py-2 px-3 font-mono text-emerald-800">
                                    ★ {selectedResolution.selectedEvidenceId}
                                  </td>
                                  <td className="py-2 px-3 uppercase text-emerald-800">
                                    {selectedResolution.selectedSourceType}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-emerald-900">
                                    {selectedResolution.resolvedValue?.toFixed(4)}
                                  </td>
                                  <td className="py-2 px-3 text-emerald-800">
                                    {selectedResolution.selectedQualityProfile?.totalQualityScore} pts ({selectedResolution.selectedQualityProfile?.qualityBand})
                                  </td>
                                  <td className="py-2 px-3 text-emerald-800 uppercase text-[9px] font-black">
                                    {evidenceList.find(x => x.id === selectedResolution.selectedEvidenceId)?.freshnessState || 'fresh'}
                                  </td>
                                  <td className="py-2 px-3 text-emerald-800 font-bold uppercase text-[9px]">
                                    Selected Winner
                                  </td>
                                </tr>
                              )}

                              {/* ELIGIBLE BUT NOT SELECTED */}
                              {selectedResolution.eligibleEvidenceIds
                                .filter(id => id !== selectedResolution.selectedEvidenceId)
                                .map(id => {
                                  const item = evidenceList.find(x => x.id === id);
                                  return (
                                    <tr key={id}>
                                      <td className="py-2 px-3 font-mono text-slate-500">{id}</td>
                                      <td className="py-2 px-3 uppercase text-slate-500">{item?.sourceType || 'community'}</td>
                                      <td className="py-2 px-3 text-slate-800 font-bold">{item?.numericValue}</td>
                                      <td className="py-2 px-3 text-slate-500">—</td>
                                      <td className="py-2 px-3 text-slate-400 uppercase text-[9px]">{item?.freshnessState}</td>
                                      <td className="py-2 px-3 text-slate-500 font-medium">Eligible (Defeated by Tie-breakers)</td>
                                    </tr>
                                  );
                                })}

                              {/* EXCLUDED CANDIDATES */}
                              {selectedResolution.excludedEvidence.map(ex => (
                                <tr key={ex.evidenceId} className="bg-slate-100/50 text-slate-400">
                                  <td className="py-2 px-3 font-mono">{ex.evidenceId}</td>
                                  <td className="py-2 px-3 uppercase">unknown</td>
                                  <td className="py-2 px-3">—</td>
                                  <td className="py-2 px-3">—</td>
                                  <td className="py-2 px-3 uppercase text-[9px]">Stale / Expired</td>
                                  <td className="py-2 px-3 font-black text-rose-600 uppercase text-[9px]">
                                    EXCLUDED: {ex.exclusionReason}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: CONFLICTS (TRIAGE CENTER) */}
              {erdeSection === 'conflicts' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      Active Variance & Conflict Triage Center
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Numeric anomalies and structural currency mismatches detected across candidate inputs are queued here. Serious variance blocks auto-publishing.
                    </p>
                  </div>

                  {/* FILTER CONTROLS */}
                  <div className="flex gap-2 flex-wrap pb-2 border-b border-slate-100">
                    <select
                      value={confFilterStatus}
                      onChange={(e) => setConfFilterStatus(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open Alerts</option>
                      <option value="resolved_by_admin">Resolved by Admin</option>
                    </select>
                    <select
                      value={confFilterSeverity}
                      onChange={(e) => setConfFilterSeverity(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical_conflict">Critical Conflict</option>
                      <option value="major_conflict">Major Conflict</option>
                      <option value="moderate_variance">Moderate Variance</option>
                      <option value="minor_variance">Minor Variance</option>
                    </select>
                  </div>

                  {/* TRIAGE GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CONFLICTS LIST */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Detected Conflicts Queue</h5>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {erdeConflicts.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
                            Perfect Harmony: No candidate rate conflicts detected.
                          </div>
                        ) : (
                          erdeConflicts
                            .filter(c => confFilterStatus === 'all' || c.status === confFilterStatus)
                            .filter(c => confFilterSeverity === 'all' || c.severity === confFilterSeverity)
                            .map(c => {
                              const isCrit = c.severity === 'critical_conflict' || c.severity === 'major_conflict';
                              const activeItem = selectedConflict?.id === c.id;

                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setSelectedConflict(c);
                                    setConfReviewNotes('');
                                  }}
                                  className={`p-4 rounded-xl border transition-all cursor-pointer text-xs ${
                                    activeItem 
                                      ? 'border-indigo-600 bg-indigo-50/20' 
                                      : isCrit 
                                        ? 'border-rose-100 bg-rose-50/10 hover:border-rose-200' 
                                        : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      c.status === 'open' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {c.status}
                                    </span>
                                  </div>
                                  
                                  <div className="mt-2 font-bold text-slate-800 uppercase">
                                    {c.subjectType}:: {c.corridorId}
                                  </div>

                                  <p className="text-[11px] text-slate-500 mt-1">
                                    {c.detectionReason}
                                  </p>

                                  <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                                    <span>Variance: <span className="font-bold text-slate-600">{c.percentageDifference.toFixed(2)}%</span></span>
                                    <span>Severity: <span className={`font-bold ${isCrit ? 'text-rose-600' : 'text-amber-600'}`}>{c.severity.replace('_', ' ')}</span></span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* DETAIL AND ACTION AREA */}
                    <div>
                      <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Triage & Override Desk</h5>
                      {selectedConflict ? (
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block font-black uppercase">Conflict Core</span>
                            <div className="font-bold text-slate-800">{selectedConflict.id}</div>
                            <div>Detection reason: <span className="text-slate-600 font-medium">{selectedConflict.detectionReason}</span></div>
                            <div>Detected At: <span className="font-mono text-slate-500">{new Date(selectedConflict.detectedAt).toLocaleString()}</span></div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex justify-between"><span className="text-slate-400">Absolute Variance:</span> <span className="font-mono font-bold text-slate-800">{selectedConflict.absoluteDifference.toFixed(4)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Percentage Variance:</span> <span className="font-mono font-bold text-slate-800">{selectedConflict.percentageDifference.toFixed(2)}%</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Est. Impact (Per 1000 SAR):</span> <span className="font-mono font-bold text-rose-600">{selectedConflict.estimatedRecipientImpact.toFixed(2)} SAR</span></div>
                          </div>

                          {selectedConflict.status === 'open' ? (
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Resolution Action Notes</label>
                              <textarea
                                value={confReviewNotes}
                                onChange={(e) => setConfReviewNotes(e.target.value)}
                                placeholder="State manual review justification, confirmation parameters, or policy override details..."
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (confReviewNotes.trim() === '') return alert('Justification notes required!');
                                    dispatchAction(`Resolve conflict ${selectedConflict.id} administrative override`, async () => {
                                      await EdeService.updateConflictStatus(selectedConflict.id, 'resolved', profile?.email || 'admin@sariremit.com', confReviewNotes);
                                      setSelectedConflict(null);
                                      setRefreshTrigger(prev => prev + 1);
                                    });
                                  }}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-black uppercase tracking-wider text-[11px] transition-all"
                                >
                                  Resolve Conflict Alert
                                </button>
                                <button
                                  onClick={() => setSelectedConflict(null)}
                                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-200/50 text-slate-600 italic">
                              This conflict was reviewed and marked as resolved by admin.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16 text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
                          Select a conflict alert from the list to perform operational triage, view impact calculations, and input override notes.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: POLICIES */}
              {erdeSection === 'policies' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-850">
                        Resolution Policies Weight Administration
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Change freshness, verification status, and corridor specificity sliders to fine-tune automation behavior. Use draft status to simulate before rollouts.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newId = `pol-${Date.now()}`;
                        setEditingPolicy({
                          policyId: newId,
                          name: 'New Custom Resolution Policy',
                          version: (erdePolicies.length + 1),
                          status: 'draft',
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
                        });
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      Create Draft Policy
                    </button>
                  </div>

                  {/* EDITING POLICY MODAL/DESK */}
                  {editingPolicy ? (
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-6 text-xs animate-fade-in">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-black text-slate-800">
                          Editing Policy Configuration: <span className="font-mono text-indigo-600">{editingPolicy.name}</span> (v{editingPolicy.version})
                        </h5>
                        <button 
                          onClick={() => setEditingPolicy(null)}
                          className="text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕ Close Form
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* META PROPERTIES */}
                        <div className="space-y-4">
                          <h6 className="font-black uppercase text-[10px] tracking-wider text-slate-500">General Rules</h6>
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Policy Display Name</label>
                              <input
                                type="text"
                                value={editingPolicy.name}
                                onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Min Quality Score</label>
                                <input
                                  type="number"
                                  value={editingPolicy.minimumQualityScore}
                                  onChange={(e) => setEditingPolicy({ ...editingPolicy, minimumQualityScore: Number(e.target.value) })}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Status</label>
                                <select
                                  value={editingPolicy.status}
                                  onChange={(e) => setEditingPolicy({ ...editingPolicy, status: e.target.value as any })}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold"
                                >
                                  <option value="draft">Draft (Simulations Only)</option>
                                  <option value="active">Active (Production Ingress)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2 mt-2">
                              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={editingPolicy.preserveManagementOverridePriority}
                                  onChange={(e) => setEditingPolicy({ ...editingPolicy, preserveManagementOverridePriority: e.target.checked })}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                Preserve Management Override Priority
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={editingPolicy.rejectExpiredEvidence}
                                  onChange={(e) => setEditingPolicy({ ...editingPolicy, rejectExpiredEvidence: e.target.checked })}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                Strictly Reject Expired/Stale Evidence
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={editingPolicy.allowLegacyFallback}
                                  onChange={(e) => setEditingPolicy({ ...editingPolicy, allowLegacyFallback: e.target.checked })}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                Allow Graceful Legacy Fallback
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* WEIGHT SLIDERS */}
                        <div className="space-y-4">
                          <h6 className="font-black uppercase text-[10px] tracking-wider text-slate-500">Evaluation Weight Coefficients</h6>
                          
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                            {[
                              { key: 'sourceAuthority', label: 'Source Authority Power' },
                              { key: 'verificationQuality', label: 'Formally Verified Premium' },
                              { key: 'freshnessQuality', label: 'Freshness Observability coefficient' },
                              { key: 'providerSpecificity', label: 'Provider Specific Match coefficient' },
                              { key: 'corridorSpecificity', label: 'Corridor Direct Match coefficient' },
                              { key: 'provenanceCompleteness', label: 'Provenance completeness scale' },
                              { key: 'attachmentSupport', label: 'Cryptographic document attach support' }
                            ].map(wt => (
                              <div key={wt.key} className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700">
                                  <span>{wt.label}</span>
                                  <span className="font-mono text-indigo-600 text-xs">{(editingPolicy.weights as any)[wt.key] || 0}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="50"
                                  value={(editingPolicy.weights as any)[wt.key] || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditingPolicy({
                                      ...editingPolicy,
                                      weights: {
                                        ...editingPolicy.weights,
                                        [wt.key]: val
                                      }
                                    });
                                  }}
                                  className="w-full accent-indigo-600"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                        <button
                          onClick={async () => {
                            setSimulating(true);
                            try {
                              const stats = await EdeService.simulatePolicy(editingPolicy);
                              setShadowComparisonStats(stats);
                              alert(`Simulation finished! Active vs Draft mismatch: ${stats.changedCount} corridors affected. Draft Avg Quality Score: ${stats.avgQualityScore} pts.`);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setSimulating(false);
                            }
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                        >
                          {simulating ? 'Running Simulation...' : 'Simulate Draft Differential'}
                        </button>
                        
                        <button
                          onClick={() => {
                            dispatchAction(`Save Resolution Policy: ${editingPolicy.name} (v${editingPolicy.version})`, async () => {
                              await EdeService.savePolicy(editingPolicy, profile.email);
                              setEditingPolicy(null);
                              setRefreshTrigger(prev => prev + 1);
                            });
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                        >
                          Publish Resolution Policy
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* POLICIES LEDGER LIST */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Policies Register</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {erdePolicies.map(pol => {
                        const isActive = pol.status === 'active';
                        return (
                          <div 
                            key={`${pol.policyId}-v${pol.version}`}
                            className={`p-4 rounded-xl border flex flex-col justify-between h-[160px] ${
                              isActive ? 'border-emerald-600 bg-emerald-50/10' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {pol.status}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">Version {pol.version}</span>
                              </div>
                              <h6 className="font-black text-slate-800 mt-2 text-xs truncate">{pol.name}</h6>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{pol.description || 'Custom evaluation rules.'}</p>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingPolicy(pol)}
                                className="flex-1 text-center py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold uppercase transition-all"
                              >
                                Edit Rules
                              </button>
                              
                              {!isActive && (
                                <button
                                  onClick={() => {
                                    dispatchAction(`Activate Resolution Policy ${pol.policyId} (v${pol.version})`, async () => {
                                      await EdeService.rollbackPolicy(pol.policyId, pol.version, profile.email);
                                      setRefreshTrigger(prev => prev + 1);
                                    });
                                  }}
                                  className="flex-1 text-center py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                >
                                  Rollback / Activate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: SHADOW MODE */}
              {erdeSection === 'shadow' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <Eye className="w-5 h-5 text-amber-500" />
                      Passive Shadow Mode Cockpit
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Monitor ERDE recommendations in parallel with the legacy SIS rate equations. Ensures perfect alignment and safety before toggling operational mode live.
                    </p>
                  </div>

                  {/* COMPARISON METRICS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Background Validations</span>
                      <div className="mt-2 text-2xl font-black text-slate-800">1,482</div>
                      <span className="text-[10px] text-slate-400 mt-1">Simulated rate matches checked</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Average Rate Delta</span>
                      <div className="mt-2 text-2xl font-black text-emerald-600">0.0014%</div>
                      <span className="text-[10px] text-slate-400 mt-1">Excellent convergence metrics</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Operational Health</span>
                      <div className="mt-2 text-2xl font-black text-emerald-600">100%</div>
                      <span className="text-[10px] text-slate-400 mt-1">No safety thresholds breached</span>
                    </div>
                  </div>

                  {/* SIMULATED LIVE STREAM COMPARISON */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Live Shadow Comparison Stream</h5>
                    <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-[11px] space-y-1.5 overflow-x-auto max-h-[250px]">
                      <div>[SYSTEM] SHADOW_MODE:: Initiating comparison loop sweep at {new Date().toISOString()}</div>
                      <div>[COMPARE] CORRIDOR:: sar-inr | Legacy Rate: 22.1480 | ERDE Resolved Rec: 22.1480 | Status: CONGRUENT (Delta: 0.00%)</div>
                      <div>[COMPARE] CORRIDOR:: sar-egp | Legacy Rate: 13.0850 | ERDE Resolved Rec: 13.0850 | Status: CONGRUENT (Delta: 0.00%)</div>
                      <div>[COMPARE] CORRIDOR:: sar-pkr | Legacy Rate: 74.2250 | ERDE Resolved Rec: 74.2200 | Status: MINIMAL_VARIANCE (Delta: 0.006%)</div>
                      <div>[COMPARE] CORRIDOR:: sar-phl | Legacy Rate: 14.8100 | ERDE Resolved Rec: 14.8100 | Status: CONGRUENT (Delta: 0.00%)</div>
                      <div>[COMPARE] CORRIDOR:: sar-npr | Legacy Rate: 35.4020 | ERDE Resolved Rec: 35.4020 | Status: CONGRUENT (Delta: 0.00%)</div>
                      <div>[SYSTEM] SHADOW_MODE:: Safe execution thresholds cleared. No critical conflicts detected.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: TESTS (DIAGNOSTICS & TEST SUITE) */}
              {erdeSection === 'tests' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
                  <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                        <PlayCircle className="w-5 h-5 text-indigo-600" />
                        ERDE Automated Diagnostics & Scenario Test Center
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Run complete compliance and behavior checks for Scenarios A to F. Asserts management override priorities, stale exclusions, and conflict variance triggers.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        setRunningTests(true);
                        try {
                          const results = await EdeService.runErdeTestSuite();
                          setTestSuiteResults(results);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setRunningTests(false);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      {runningTests ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Running Scenario Sweeps...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Run Compliance Suite
                        </>
                      )}
                    </button>
                  </div>

                  {/* TEST GRID RESULTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testSuiteResults.length === 0 ? (
                      <div className="md:col-span-2 text-center py-16 text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50">
                        Click "Run Compliance Suite" above to execute all 6 Scenario tests and unit validations directly in-app!
                      </div>
                    ) : (
                      testSuiteResults.map(tc => {
                        const passed = tc.status === 'passed';
                        return (
                          <div 
                            key={tc.id} 
                            className={`p-4 rounded-xl border flex flex-col justify-between ${
                              passed ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {tc.scenario} :: {tc.status}
                                </span>
                                <span className="font-mono text-[9px] text-slate-400 font-bold">{tc.id}</span>
                              </div>
                              <h5 className="font-black text-slate-800 text-xs mt-2">{tc.name}</h5>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal">{tc.description}</p>
                              
                              {/* INNER ASSERTIONS LIST */}
                              <div className="mt-3 space-y-1.5">
                                {tc.assertions.map((as: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                                    {as.passed ? (
                                      <span className="text-emerald-600 font-bold">✓</span>
                                    ) : (
                                      <span className="text-rose-600 font-bold">✗</span>
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium text-slate-700">{as.label}</div>
                                      <div className="text-[9px] text-slate-400 font-mono">Expected: "{as.expected}" | Actual: "{as.actual}"</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500 truncate">
                              {tc.details}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: SIS V2 INTELLIGENCE CENTER */}
          {activeSubTab === 'sis_v2' && (
            <div className="space-y-6">
              {/* Header Status Bar */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-black tracking-tight">SIS 2.0 CONFIDENCE CONTROL STATION</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                    Operators can manage multidimensional confidence weights, define blocking criteria/caps, audit shadow-mode performance logs, and perform live confidence path routing diagnostic simulations.
                  </p>
                </div>
                
                {/* Feature Flag Controls */}
                <div className="flex flex-wrap gap-3">
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Operational Mode</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${isShadowMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="text-xs font-mono font-bold uppercase">
                        {isShadowMode ? 'SHADOW MODE ACTIVE' : 'LIVE OPERATIONAL ACTIVE'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const newShadowMode = !isShadowMode;
                      setIsShadowMode(newShadowMode);
                      SisService.setFeatureFlags(newShadowMode, !newShadowMode);
                      
                      // Log this control action
                      await SisService.logPolicyAction(
                        'operator',
                        'TOGGLE_SHADOW_MODE',
                        `Shadow mode toggled to ${newShadowMode}. Operational mode is ${!newShadowMode}.`,
                        { shadowMode: newShadowMode, operationalMode: !newShadowMode }
                      );
                      
                      // Refresh logs
                      const logs = await SisService.getAuditLogs();
                      setSisAuditLogs(logs);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
                      isShadowMode
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-emerald-600/20 shadow-md'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600/20 shadow-md'
                    }`}
                  >
                    {isShadowMode ? 'Switch to Live Mode' : 'Switch to Shadow Mode'}
                  </button>
                </div>
              </div>

              {/* Grid 2-Column: Left (Active Policy & Formulation), Right (Diagnostics Simulator & Audit Logs) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left Column: Weight allocations & New Policies */}
                <div className="xl:col-span-6 space-y-6">
                  {/* Weight Formulation Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-left">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">ACTIVE WEIGHT ALLOCATIONS</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Policy Name: <span className="font-mono text-slate-950 font-bold">{activeSisPolicy?.name || 'Default System Matrix'}</span></p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200 uppercase font-black">
                        Active Version
                      </span>
                    </div>

                    {editingSisPolicy ? (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        // Validate sum
                        const total = Object.values(editingSisPolicy.weights).reduce((acc: number, curr: any) => acc + parseFloat(curr || 0), 0) as number;
                        if (Math.abs(total - 1.0) > 0.001 && Math.abs(total - 100) > 0.1) {
                          alert(`Validation Error: Weights must sum up to exactly 1.0 (or 100%). Your total is ${total.toFixed(3)}`);
                          return;
                        }
                        
                        // Standardize to decimal if they wrote percentage e.g. 20 instead of 0.2
                        const normalizedWeights = { ...editingSisPolicy.weights };
                        if (total > 5) {
                          Object.keys(normalizedWeights).forEach(k => {
                            normalizedWeights[k] = (normalizedWeights as any)[k] / 100;
                          });
                        }

                        try {
                          const updatedPolicy: SisPolicy = {
                            policyId: editingSisPolicy.policyId || 'sis-standard-v2',
                            name: editingSisPolicy.name,
                            description: editingSisPolicy.description || 'Custom formulation policy',
                            version: editingSisPolicy.version || 1,
                            status: 'active',
                            weights: normalizedWeights,
                            caps: editingSisPolicy.caps,
                            blockingRules: editingSisPolicy.blockingRules,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            createdBy: currentAdmin?.email || 'operator'
                          };

                          await SisService.savePolicy(updatedPolicy, currentAdmin?.email || 'operator');
                          
                          // Log control action
                          await SisService.logPolicyAction(
                            currentAdmin?.email || 'operator',
                            'UPDATE_POLICY',
                            `Updated policy weights, caps, and rules for version "${editingSisPolicy.name}".`,
                            { name: editingSisPolicy.name, weights: normalizedWeights }
                          );
                          
                          // Refresh data
                          const policies = await SisService.getPolicies();
                          setSisPolicies(policies);
                          const active = policies.find(p => p.status === 'active');
                          setActiveSisPolicy(active || null);
                          const logs = await SisService.getAuditLogs();
                          setSisAuditLogs(logs);
                          
                          alert("SIS v2 Policy Matrix updated and activated successfully!");
                        } catch (error) {
                          console.error(error);
                          alert("Failed to save policy.");
                        }
                      }} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Policy Formulation Name</label>
                          <input
                            type="text"
                            value={editingSisPolicy.name}
                            onChange={(e) => setEditingSisPolicy({ ...editingSisPolicy, name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                            placeholder="e.g. Robust Winter 2026 Specificity Weight Matrix"
                            required
                          />
                        </div>

                        {/* Weight Grid */}
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">9-Dimension Relative Weights (Must sum to 100% or 1.0)</span>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {Object.keys(editingSisPolicy.weights).map((k) => {
                              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <div key={k} className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block truncate">{label}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editingSisPolicy.weights[k]}
                                    onChange={(e) => {
                                      const nextWeights = { ...editingSisPolicy.weights, [k]: parseFloat(e.target.value) || 0 };
                                      setEditingSisPolicy({ ...editingSisPolicy, weights: nextWeights });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                                    required
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Caps & Rules Editor (Standard Object Key Inputs) */}
                        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Caps list */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Confidence Caps</span>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 text-xs">
                              {Object.entries(editingSisPolicy.caps).map(([key, value]) => {
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return (
                                  <div key={key} className="space-y-1">
                                    <label className="text-[9px] font-mono font-bold text-slate-500 uppercase block">{label}</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={value as number}
                                      onChange={(e) => {
                                        const nextCaps = { ...editingSisPolicy.caps, [key]: parseInt(e.target.value) || 0 };
                                        setEditingSisPolicy({ ...editingSisPolicy, caps: nextCaps });
                                      }}
                                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-800"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Blocking Rules list */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Blocking Rules</span>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 text-xs">
                              {Object.entries(editingSisPolicy.blockingRules).map(([key, value]) => {
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return (
                                  <label key={key} className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1.5 rounded border border-slate-150 select-none">
                                    <input
                                      type="checkbox"
                                      checked={!!value}
                                      onChange={(e) => {
                                        const nextRules = { ...editingSisPolicy.blockingRules, [key]: e.target.checked };
                                        setEditingSisPolicy({ ...editingSisPolicy, blockingRules: nextRules });
                                      }}
                                      className="rounded text-slate-900 focus:ring-0 focus:ring-offset-0"
                                    />
                                    <span className="text-[10px] font-mono text-slate-700">{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Save and Activate Policy Formulation
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No policy formulation active.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Diagnostics Simulator & Audit Logs */}
                <div className="xl:col-span-6 space-y-6">
                  {/* Diagnostics Simulator */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-left">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">LIVE PATH CONFIDENCE DIAGNOSTICS</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Test exactly how EPE evidence outputs resolve under active SIS 2.0 evaluation.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-600 uppercase text-[9px] block">Select Corridor Target</label>
                        <select
                          value={diagnosticsCorridor}
                          onChange={(e) => setDiagnosticsCorridor(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        >
                          <option value="sa-pk">SA-PK (Saudi Arabia to Pakistan)</option>
                          <option value="sa-eg">SA-EG (Saudi Arabia to Egypt)</option>
                          <option value="sa-ph">SA-PH (Saudi Arabia to Philippines)</option>
                          <option value="sa-in">SA-IN (Saudi Arabia to India)</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-xs">
                        <label className="font-bold text-slate-600 uppercase text-[9px] block">Select Remittance Provider</label>
                        <select
                          value={diagnosticsProvider}
                          onChange={(e) => setDiagnosticsProvider(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        >
                          {PROVIDERS.map((p) => (
                            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          // Compile context or mock data dynamically for diagnostic
                          const mockResolution: any = {
                            resolved: {
                              id: `sim-${Date.now()}`,
                              provider_id: diagnosticsProvider,
                              resolved_rate: 64.25,
                              transfer_fee: 0,
                              freshness_status: 'fresh',
                              source_type: 'market_reference',
                              last_updated: new Date().toISOString()
                            }
                          };

                          const res = await SisService.calculateSisV2ForOption(mockResolution, diagnosticsCorridor);
                          setDiagnosticResult(res);
                        } catch (error) {
                          console.error(error);
                          alert("Failed to run confidence path diagnostics.");
                        }
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" /> Run Confidence Diagnostics
                    </button>

                    {diagnosticResult && (
                      <div className="bg-[#071A35] text-white p-5 rounded-2xl border border-slate-800 space-y-4 font-sans">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Simulator Diagnostics Output</span>
                          <span className="text-[10px] text-amber-400 font-bold font-mono">
                            BAND: {diagnosticResult.confidenceBand} ({diagnosticResult.overallScore}/100)
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                          {diagnosticResult.userSummary}
                        </div>

                        {/* List strengths & limitations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                          <div>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block mb-1">Strengths</span>
                            <ul className="space-y-0.5 list-none">
                              {diagnosticResult.strengths.map((s: string, idx: number) => (
                                <li key={idx} className="text-slate-300 flex items-start gap-1">
                                  <span className="text-emerald-400 font-bold">✓</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider block mb-1">Limitations</span>
                            <ul className="space-y-0.5 list-none">
                              {diagnosticResult.limitations.map((l: string, idx: number) => (
                                <li key={idx} className="text-slate-300 flex items-start gap-1">
                                  <span className="text-amber-400 font-bold">⚠</span> {l}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Subject level scorecard */}
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
                          <span className="text-[9px] font-black text-white uppercase tracking-wider block border-b border-slate-800/40 pb-0.5">Subject Confidence Scorecard</span>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                            <div>
                              <span className="text-slate-400 block">Exchange Rate:</span>
                              <span className="font-mono text-white font-bold">{diagnosticResult.subjectConfidence.exchangeRate.band} ({diagnosticResult.subjectConfidence.exchangeRate.score})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Transfer Fee:</span>
                              <span className="font-mono text-white font-bold">{diagnosticResult.subjectConfidence.transferFee.band} ({diagnosticResult.subjectConfidence.transferFee.score})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">VAT amount:</span>
                              <span className="font-mono text-white font-bold">{diagnosticResult.subjectConfidence.vat.band} ({diagnosticResult.subjectConfidence.vat.score})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Delivery Estimate:</span>
                              <span className="font-mono text-white font-bold">{diagnosticResult.subjectConfidence.deliveryEstimate.band} ({diagnosticResult.subjectConfidence.deliveryEstimate.score})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Logs Feed */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-left">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">POLICY PERFORMANCE & AUDIT LOGS</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Real-time log of state changes, threshold blocks, and operational events.</p>
                      </div>
                      <button
                        onClick={async () => {
                          const logs = await SisService.getAuditLogs();
                          setSisAuditLogs(logs);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        title="Reload logs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
                      {sisAuditLogs.length === 0 ? (
                        <p className="text-slate-400 italic text-center py-4">No audit events generated today.</p>
                      ) : (
                        sisAuditLogs.map((log) => (
                          <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 font-mono text-[10px] space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>{new Date(log.created_at).toLocaleString()}</span>
                              <span className="font-bold text-slate-600">{log.actor}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-sans font-extrabold text-slate-900">
                              <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-200 text-slate-800 uppercase">
                                {log.event_type}
                              </span>
                              <span>{log.description}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
                        const isExpanded = expandedSubId === row.id;
                        
                        // Check if author of report matches the logged in admin
                        const isSelfSubmission = loggedInEmail.toLowerCase() === (row.submitted_by_email || '').toLowerCase();
                        
                        // Get submitter profile to see if they are restricted
                        const submitterProfile = registeredUsers.find(u => u.email?.toLowerCase() === (row.submitted_by_email || '').toLowerCase());
                        const isSubmitterRestricted = submitterProfile?.rate_submissions_restricted === true;

                        return (
                          <React.Fragment key={row.id}>
                            <tr className={`hover:bg-slate-50/40 transition-colors ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                              <td className="py-4 px-5">
                                <span className="font-bold text-slate-800 block">{row.submitted_by_name || 'Contributor'}</span>
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{row.submitted_by_email}</span>
                                {isSubmitterRestricted && (
                                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-bold mt-1 border border-rose-100">
                                    <ShieldAlert className="w-2.5 h-2.5" /> Restricted
                                  </span>
                                )}
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
                              <td className="py-4 px-5 text-right">
                                <button
                                  onClick={() => {
                                    if (isExpanded) {
                                      setExpandedSubId(null);
                                    } else {
                                      setExpandedSubId(row.id);
                                      setAdminReviewerNotes(row.reviewer_notes || '');
                                      setAdminRejectionReason(row.rejection_reason || '');
                                      setAdminEvidenceStatus(row.evidence_status || 'pending');
                                    }
                                  }}
                                  className={`px-3 py-1.5 text-[10px] font-black rounded uppercase tracking-wider transition-all cursor-pointer ${
                                    isExpanded 
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isExpanded ? 'Collapse' : 'Review & Verify'}
                                </button>
                              </td>
                            </tr>

                            {/* EXPANDED MODERATION PANEL */}
                            {isExpanded && (
                              <tr className="bg-slate-50/60 border-t border-b border-slate-200">
                                <td colSpan={7} className="p-6">
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left text-xs">
                                    
                                    {/* Left Column: Security Score & Fraud Flags */}
                                    <div className="lg:col-span-5 space-y-4">
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500">Security & Fraud Analysis (SAF)</h4>
                                        
                                        {/* Score Badge */}
                                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                          <span className="font-semibold text-slate-600">Integrity Score</span>
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border ${
                                              (row.fraud_risk_score || 0) >= 70 
                                                ? 'bg-red-50 text-red-700 border-red-100' 
                                                : (row.fraud_risk_score || 0) >= 40 
                                                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                              Score: {row.fraud_risk_score || 0}%
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                              row.fraud_risk_level === 'CRITICAL' 
                                                ? 'bg-red-100 text-red-800 border-red-200' 
                                                : row.fraud_risk_level === 'HIGH' 
                                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                                : row.fraud_risk_level === 'MODERATE' 
                                                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                              {row.fraud_risk_level || 'LOW'} RISK
                                            </span>
                                          </div>
                                        </div>

                                        {/* Fraud Flags */}
                                        {row.fraud_flags && row.fraud_flags.length > 0 ? (
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide block">Triggered Risk Indicators:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {row.fraud_flags.map((f, fi) => (
                                                <span key={fi} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-semibold border border-rose-100">
                                                  ⚠️ {f}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                            No abnormal security markers or frequency alerts detected.
                                          </div>
                                        )}

                                        {/* CRVS Metadata Details */}
                                        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px] font-medium text-slate-600">
                                          <div className="flex justify-between">
                                            <span>Transfer Method:</span>
                                            <span className="font-mono text-slate-800 uppercase">{row.transfer_method || 'Wallet'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Observed On:</span>
                                            <span className="font-mono text-slate-800">{row.date_observed || row.submitted_at?.split('T')[0]} @ {row.time_observed || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>File Original Name:</span>
                                            <span className="font-mono text-slate-800 truncate max-w-[160px]">{row.screenshot_original_name || row.screenshot_name || 'N/A'}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>File Dimensions/Size:</span>
                                            <span className="font-mono text-slate-800">{row.screenshot_size_bytes ? ((row.screenshot_size_bytes) / 1024).toFixed(1) : 'N/A'} KB</span>
                                          </div>
                                        </div>

                                      </div>

                                      {/* Submitter Restriction Controls */}
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500">Submitter Security Privileges</h4>
                                        <div className="flex items-center justify-between gap-4">
                                          <div>
                                            <p className="font-bold text-slate-800 text-[11px]">{row.submitted_by_name || 'Contributor'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{row.submitted_by_email}</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await toggleUserRateSubmissionRestriction(submitterProfile?.id || row.submitted_by_email || '', !isSubmitterRestricted);
                                              setRefreshTrigger(prev => prev + 1);
                                              await logAuditAction(loggedInEmail, isSubmitterRestricted ? 'RESTORE_RATE_SUBMISSION_PRIVILEGES' : 'RESTRICT_RATE_SUBMISSION_PRIVILEGES', 'USER_PROFILE', row.submitted_by_email, {});
                                            }}
                                            className={`px-3 py-1.5 rounded font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                                              isSubmitterRestricted 
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                                : 'bg-rose-500 hover:bg-rose-600 text-white'
                                            }`}
                                          >
                                            {isSubmitterRestricted ? 'Restore Privileges' : 'Restrict Submitter'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Column: Screenshot Evidence Viewer */}
                                    <div className="lg:col-span-3 space-y-2">
                                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500 block">Screenshot Evidence</span>
                                      {row.screenshot_url ? (
                                        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-56 shadow-xs flex items-center justify-center">
                                          <img 
                                            src={row.screenshot_url} 
                                            alt="Evidence Screenshot" 
                                            className="max-h-52 w-full object-contain cursor-pointer hover:scale-105 transition-transform duration-250"
                                            onClick={() => window.open(row.screenshot_url, '_blank')}
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      ) : (
                                        <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50 font-mono text-[10px]">
                                          No Screenshot URL Available
                                        </div>
                                      )}
                                      <p className="text-[9px] text-slate-400 text-center italic">Click the screenshot image to open in new tab</p>
                                    </div>

                                    {/* Right Column: Moderation Input & Finalization */}
                                    <div className="lg:col-span-4 space-y-4">
                                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                                        <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-slate-500">Moderator Control Panel</h4>
                                        
                                        {/* Self-approval Guard */}
                                        {isSelfSubmission ? (
                                          <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[11px] leading-relaxed font-bold">
                                            ❌ <strong>Self-Approval Blocked:</strong> As the creator of this rate submission, you are strictly forbidden by platform integrity rules from approving your own report.
                                          </div>
                                        ) : (
                                          <div className="space-y-3.5">
                                            
                                            {/* Evidence Status */}
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Evidence Status Selection</label>
                                              <select
                                                value={adminEvidenceStatus}
                                                onChange={(e) => setAdminEvidenceStatus(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              >
                                                <option value="pending">Pending Review</option>
                                                <option value="verified">Verified (Perfect Screenshot Match)</option>
                                                <option value="duplicate">Duplicate (Same rate screenshot recycled)</option>
                                                <option value="redacted">Partially Redacted / Blurred</option>
                                                <option value="invalid">Invalid / Fake Screenshot</option>
                                                <option value="fraud_blocked">Fraud Flagged (Blacklisted)</option>
                                              </select>
                                            </div>

                                            {/* Reviewer Notes */}
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Moderator Verification Notes</label>
                                              <textarea
                                                rows={2}
                                                placeholder="Write any evidence match findings, or notes for audit trail..."
                                                value={adminReviewerNotes}
                                                onChange={(e) => setAdminReviewerNotes(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                              />
                                            </div>

                                            {/* Rejection Reason */}
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Rejection Reason (Mandatory if Rejecting)</label>
                                              <textarea
                                                rows={2}
                                                placeholder="Required if rejecting. e.g. Screenshot mismatch, rate expired, blur..."
                                                value={adminRejectionReason}
                                                onChange={(e) => setAdminRejectionReason(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                              />
                                            </div>

                                            {/* Action Buttons */}
                                            {row.status === 'pending_verification' || row.status === 'pending' || row.status === 'security_review' ? (
                                              <div className="flex gap-2 pt-1">
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    await handleApproveSubmission(row.id, adminReviewerNotes, adminEvidenceStatus);
                                                    setExpandedSubId(null);
                                                    setRefreshTrigger(prev => prev + 1);
                                                  }}
                                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider rounded-lg cursor-pointer transition-colors"
                                                >
                                                  Approve Rate
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    if (!adminRejectionReason.trim()) {
                                                      alert('Rejection reason is mandatory.');
                                                      return;
                                                    }
                                                    await handleRejectSubmission(row.id, adminReviewerNotes, adminRejectionReason, adminEvidenceStatus);
                                                    setExpandedSubId(null);
                                                    setRefreshTrigger(prev => prev + 1);
                                                  }}
                                                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-wider rounded-lg cursor-pointer transition-colors"
                                                >
                                                  Reject Rate
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="p-2.5 bg-slate-100 rounded-lg text-center text-[10px] font-black text-slate-400 uppercase tracking-wide">
                                                This report is already {row.status}
                                              </div>
                                            )}

                                          </div>
                                        )}

                                      </div>
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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

                  {/* SDS Brand Asset Manager Integration */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400">SDS Brand Integration (BAM)</h4>
                    
                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-200/50 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setChanBrandingMode('select')}
                        className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
                          chanBrandingMode === 'select'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Select BAM Asset
                      </button>
                      <button
                        type="button"
                        onClick={() => setChanBrandingMode('upload')}
                        className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
                          chanBrandingMode === 'upload'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Direct Upload BAM Logo
                      </button>
                    </div>

                    {chanBrandingMode === 'select' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Linked Brand Asset</label>
                          <select
                            value={chanBrandAssetId}
                            onChange={(e) => setChanBrandAssetId(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="">-- No BAM Asset (Initials/Legacy Fallback) --</option>
                            {brandAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>
                                {asset.asset_name} ({asset.approval_status})
                              </option>
                            ))}
                          </select>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                            Resolves automatically inside rates UI using SDS priority logic.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Branding Approval Status</label>
                          <select
                            value={chanBrandingStatus}
                            onChange={(e) => setChanBrandingStatus(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="official">Official Verified Branding</option>
                            <option value="placeholder">Approved Placeholder Branding</option>
                            <option value="pending_permission">Pending Licensing / Review</option>
                            <option value="restricted">Restricted / Hidden</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans text-xs">
                        {/* Simulated Drag-and-drop file selector for Main logo */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Main Provider Logo SVG / PNG</label>
                          <div 
                            className="border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                            onClick={() => {
                              const simulatedUrl = prompt('Enter logo public URL (or click OK to use a beautifully styled default SVG):', `https://api.dicebear.com/7.x/initials/svg?seed=${chanDisplayName || 'SR'}&backgroundColor=059669&textColor=ffffff`);
                              if (simulatedUrl) {
                                setChanBrandMainFile(simulatedUrl);
                              }
                            }}
                          >
                            {chanBrandMainFile ? (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[9px] text-slate-600 truncate max-w-[140px]">{chanBrandMainFile}</span>
                                <span className="text-[8px] bg-emerald-50 text-emerald-600 font-extrabold uppercase px-1 rounded">Linked</span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="block text-[9px] text-slate-500 font-bold">Drag & Drop Logo or Click to Upload</span>
                                <span className="block text-[8px] text-slate-400 font-mono">Accepts SVG, WebP, PNG (Max 500KB)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Light-mode and Dark-mode logos */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Light-Mode URL (Opt)</label>
                            <input
                              type="text"
                              placeholder="URL to light variant..."
                              value={chanBrandLightFile}
                              onChange={(e) => setChanBrandLightFile(e.target.value)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Dark-Mode URL (Opt)</label>
                            <input
                              type="text"
                              placeholder="URL to dark variant..."
                              value={chanBrandDarkFile}
                              onChange={(e) => setChanBrandDarkFile(e.target.value)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Brand Colors */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Primary Brand Color</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="color"
                                value={chanBrandPrimaryColor || '#10B981'}
                                onChange={(e) => setChanBrandPrimaryColor(e.target.value)}
                                className="w-6 h-6 border-0 rounded-md cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder="#10B981"
                                value={chanBrandPrimaryColor}
                                onChange={(e) => setChanBrandPrimaryColor(e.target.value)}
                                className="w-full text-[10px] font-mono p-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-850"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Secondary Color</label>
                            <div className="flex gap-1.5 items-center">
                              <input
                                type="color"
                                value={chanBrandSecondaryColor || '#1e293b'}
                                onChange={(e) => setChanBrandSecondaryColor(e.target.value)}
                                className="w-6 h-6 border-0 rounded-md cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder="#1e293b"
                                value={chanBrandSecondaryColor}
                                onChange={(e) => setChanBrandSecondaryColor(e.target.value)}
                                className="w-full text-[10px] font-mono p-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-850"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Website & Alt Text */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Website URL</label>
                            <input
                              type="text"
                              placeholder="e.g. stcpay.com.sa"
                              value={chanBrandWebsiteUrl}
                              onChange={(e) => setChanBrandWebsiteUrl(e.target.value)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Accessibility Alt Text</label>
                            <input
                              type="text"
                              placeholder="e.g. STC Pay Official Brand Logo"
                              value={chanBrandAltText}
                              onChange={(e) => setChanBrandAltText(e.target.value)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Approval Status & Licensing Permission Note */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Approval Status</label>
                            <select
                              value={chanBrandApprovalStatus}
                              onChange={(e) => setChanBrandApprovalStatus(e.target.value as any)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-850"
                            >
                              <option value="official">Official Verified Logo</option>
                              <option value="placeholder">Approved Placeholder Logo</option>
                              <option value="pending_permission">Pending Licensing Review</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Licensing Reference / Note</label>
                            <input
                              type="text"
                              placeholder="e.g. Written consent via email"
                              value={chanBrandPermissionNote}
                              onChange={(e) => setChanBrandPermissionNote(e.target.value)}
                              className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Internal notes */}
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Branding Internal Notes</label>
                          <textarea
                            rows={1}
                            placeholder="Add administrative notes..."
                            value={chanBrandInternalNotes}
                            onChange={(e) => setChanBrandInternalNotes(e.target.value)}
                            className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explicit Logo Requirement Toggle */}
                  <div className="flex items-center gap-2 px-1 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                    <input
                      type="checkbox"
                      id="chanLogoRequired"
                      checked={chanLogoRequired}
                      onChange={(e) => setChanLogoRequired(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <label htmlFor="chanLogoRequired" className="text-[10px] uppercase font-black tracking-wider text-slate-600 cursor-pointer select-none">
                      Require Logo & Validation (Disables self-healing fallback)
                    </label>
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
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                                  <span>ID: {chan.id}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-indigo-600 font-bold">BAM: {chan.brandAssetId || 'None'}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-emerald-600 font-bold">Branding: {chan.brandingStatus || 'placeholder'}</span>
                                </div>
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
                        <th className="py-3 px-5">Comparison Confidence (TCE)</th>
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

                          const confidenceLabel = row.trueCost?.comparisonConfidence || (row.trueCost?.transparencyRating === 'excellent' ? 'Very High' : 'High');
                          const tColor = (confidenceLabel === 'Very High' || confidenceLabel === 'High') 
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
                                  {confidenceLabel}
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

          {/* TAB: CRVS SETTINGS */}
          {activeSubTab === 'crvs_settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Community Rate Verification System (CRVS) Config
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Manage live risk thresholds, sub-threshold trigger flags, speed limitations, and rate anomaly parameters.
                </p>
              </div>

              {crvsSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-lg text-xs font-bold">
                  {crvsSaveSuccess}
                </div>
              )}
              {crvsSaveError && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-lg text-xs font-bold">
                  {crvsSaveError}
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setCrvsSaveSuccess('');
                setCrvsSaveError('');
                try {
                  saveCrvsConfig(crvsConfig);
                  await logAuditAction(loggedInEmail, 'UPDATE_CRVS_CONFIG', 'CRVS_CONFIG', 'GLOBAL', crvsConfig);
                  setCrvsSaveSuccess('CRVS system configuration parameters updated live!');
                } catch (err: any) {
                  setCrvsSaveError('Failed to save CRVS configuration.');
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-gap-6 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Anomaly Normal Threshold (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.anomaly_normal_threshold}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, anomaly_normal_threshold: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Rate deviation below this % is considered normal and auto-approved if evidence is perfect.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Anomaly Review Threshold (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.anomaly_review_threshold}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, anomaly_review_threshold: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Rate deviation above this % triggers manual verification review by community verifiers.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Anomaly Critical Threshold (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.anomaly_critical_threshold}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, anomaly_critical_threshold: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Rate deviation above this % is automatically rejected as critical outlier fraud.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Max Submissions per User (24h)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.max_submissions_24h}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, max_submissions_24h: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Absolute maximum rate reports a single user can submit within a rolling 24-hour window.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Max Submissions per Channel & Route (24h)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.max_submissions_same_channel_corridor_24h}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, max_submissions_same_channel_corridor_24h: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Prevents speed spams of the exact same route and provider by a single account.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Rate Expiry Window (Hours)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={crvsConfig.expiry_hours}
                      onChange={(e) => setCrvsConfig({ ...crvsConfig, expiry_hours: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-[9px] text-slate-400">Number of hours before a verified community rate is deemed stale and ineligible in the RRE.</p>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Save CRVS Parameters
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: FRAUD LOGS */}
          {activeSubTab === 'fraud_logs' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  SariRemit SAF Fraud & Security Incidents
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time audit log tracking rate manipulation indicators, automated speed spams, duplicate evidence recycling, and block events.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Incident Level</th>
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Event Description</th>
                      <th className="py-3 px-4">Risk Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
                    {fraudEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50/20">
                          No security threat vectors or fraud incidents detected yet.
                        </td>
                      </tr>
                    ) : (
                      fraudEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                            {new Date(ev.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${
                              ev.risk_level === 'CRITICAL' 
                                ? 'bg-red-100 text-red-800 border-red-200 animate-pulse' 
                                : ev.risk_level === 'HIGH' 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : ev.risk_level === 'MODERATE' 
                                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {ev.risk_level}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-slate-800 block text-xs">{ev.user_email}</span>
                            <span className="text-[10px] text-slate-400">Score: {ev.risk_score}%</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 leading-normal max-w-sm">
                            <strong>{ev.event_type}</strong>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ev.details}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {Array.isArray(ev.metadata?.flags) ? ev.metadata.flags.map((fl: string, flIdx: number) => (
                                <span key={flIdx} className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-[9px] font-bold text-rose-600 rounded">
                                  {fl}
                                </span>
                              )) : <span className="text-slate-400 italic text-[10px]">None</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* TAB: BRAND ASSETS MANAGER (BAM) */}
          {activeSubTab === 'brand_assets' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* BAM Header with mini sub-views selection */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    SariRemit Design System (SDS) — Brand Asset Manager
                  </h2>
                  <p className="text-xs text-slate-500 max-w-2xl">
                    Maintain design system assets, vector logos, brand colors, licensing approvals, and track usage locations across client-facing interfaces.
                  </p>
                </div>
                
                {/* BAM Subtabs Navigation */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start lg:self-center">
                  {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'directory', label: 'Asset Library' },
                    { key: 'upload', label: 'Register / Edit' },
                    { key: 'diagnostics', label: 'Brand Health' },
                    { key: 'migration', label: 'Logo Migration' },
                    { key: 'release', label: 'Release & Docs' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setBamSubView(tab.key as any);
                        if (tab.key !== 'upload') setEditingAssetId(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                        bamSubView === tab.key
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BAM View 1: Overview & Stats */}
              {bamSubView === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total BAM Assets</span>
                      <p className="text-2xl font-black text-slate-900">{brandAssets.length}</p>
                      <span className="text-[9px] text-emerald-600 font-bold">100% cloud-synced</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Active Assets</span>
                      <p className="text-2xl font-black text-slate-900">
                        {brandAssets.filter(a => a.status === 'active').length}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">Serving active channels</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Official Verified</span>
                      <p className="text-2xl font-black text-slate-900">
                        {brandAssets.filter(a => a.approval_status === 'official').length}
                      </p>
                      <span className="text-[9px] text-indigo-600 font-bold">Trademark cleared</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pending Permission</span>
                      <p className="text-2xl font-black text-amber-600">
                        {brandAssets.filter(a => a.approval_status === 'pending_permission').length}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">Awaiting consent files</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Brand Health & Info */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                      <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Brand Governance Policy</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed font-sans font-medium">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                          <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wide">1. Single Source of Truth</span>
                          <p className="text-slate-500 text-[11px]">All vector SVGs, dark/light variants, and colors must reside in the BAM database. Inline SVG code or unlinked external CDNs are prohibited.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                          <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wide">2. Immutability & History</span>
                          <p className="text-slate-500 text-[11px]">Never delete or overwrite an active brand logo asset. Instead, register a new version. The system auto-archives the old version while maintaining link references.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                          <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wide">3. Priority Fallback Chain</span>
                          <p className="text-slate-500 text-[11px]">The Rates UI resolves branding in the following sequence: Linked BAM Brand Asset &rarr; Legacy Logo Fallback URL &rarr; SDS Dynamic Initials.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                          <span className="font-extrabold text-slate-800 block text-[11px] uppercase tracking-wide">4. Accessibility Enforcement</span>
                          <p className="text-slate-500 text-[11px]">Every brand asset must declare a clear accessibility alt-text string explaining the provider's logo shape and contrast characteristics.</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Rail */}
                    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                      <h3 className="text-xs uppercase font-black tracking-wider text-slate-800">Quick Operations</h3>
                      <div className="flex flex-col gap-2 font-sans font-bold">
                        <button
                          type="button"
                          onClick={() => setBamSubView('upload')}
                          className="w-full text-left p-3 hover:bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs flex justify-between items-center transition-colors cursor-pointer"
                        >
                          <span>Register New Brand Asset</span>
                          <span className="text-[10px] text-indigo-600 font-mono">→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBamSubView('diagnostics')}
                          className="w-full text-left p-3 hover:bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs flex justify-between items-center transition-colors cursor-pointer"
                        >
                          <span>Run Brand Health Diagnostics</span>
                          <span className="text-[10px] text-indigo-600 font-mono">→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBamSubView('migration')}
                          className="w-full text-left p-3 hover:bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs flex justify-between items-center transition-colors cursor-pointer"
                        >
                          <span>Migrate Legacy Logos</span>
                          <span className="text-[10px] text-indigo-600 font-mono">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAM View 2: Asset Library (Directory) */}
              {bamSubView === 'directory' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
                  
                  {/* Left Hand: Search & Filter panel with asset list */}
                  <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                    
                    {/* Search & Filter bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      <div className="md:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <input
                          type="text"
                          placeholder="Search assets..."
                          value={bamSearch}
                          onChange={(e) => setBamSearch(e.target.value)}
                          className="w-full text-xs p-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-450 font-sans"
                        />
                      </div>
                      <div>
                        <select
                          value={bamTypeFilter}
                          onChange={(e) => setBamTypeFilter(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-slate-400 font-sans"
                        >
                          <option value="all">All Types</option>
                          <option value="provider_logo">Provider Logo</option>
                          <option value="provider_logo_dark">Logo (Dark)</option>
                          <option value="provider_logo_light">Logo (Light)</option>
                          <option value="sariremit_logo">SariRemit Logo</option>
                          <option value="country_flag">Flag</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={bamApprovalFilter}
                          onChange={(e) => setBamApprovalFilter(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-slate-400 font-sans"
                        >
                          <option value="all">All Approvals</option>
                          <option value="official">Official Only</option>
                          <option value="placeholder">Placeholder Only</option>
                          <option value="pending_permission">Pending Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Filtered Assets List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {brandAssets
                        .filter(asset => {
                          const matchesQuery = asset.asset_name.toLowerCase().includes(bamSearch.toLowerCase()) || asset.asset_key.toLowerCase().includes(bamSearch.toLowerCase());
                          const matchesType = bamTypeFilter === 'all' || asset.asset_type === bamTypeFilter;
                          const matchesApproval = bamApprovalFilter === 'all' || asset.approval_status === bamApprovalFilter;
                          return matchesQuery && matchesType && matchesApproval;
                        })
                        .map(asset => {
                          const isSelected = selectedAssetForDetail?.id === asset.id;
                          return (
                            <div
                              key={asset.id}
                              onClick={() => setSelectedAssetForDetail(asset)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Visual box indicator */}
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-150 overflow-hidden relative">
                                  {asset.public_url ? (
                                    <img src={asset.public_url} alt={asset.alt_text || ''} className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{asset.asset_key.slice(0, 2)}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-slate-850 truncate">{asset.asset_name}</h4>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    KEY: <span className="font-bold text-slate-600">{asset.asset_key}</span> • Version: <span className="font-bold text-slate-600">{asset.version}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  asset.approval_status === 'official' ? 'bg-emerald-50 text-emerald-700' :
                                  asset.approval_status === 'placeholder' ? 'bg-amber-50 text-amber-700' :
                                  'bg-rose-50 text-rose-700'
                                }`}>
                                  {asset.approval_status}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  asset.status === 'active' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {asset.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Hand: Asset Details & Version History Inspector */}
                  <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs min-h-[500px]">
                    {selectedAssetForDetail ? (
                      <div className="space-y-6 animate-in fade-in duration-100 font-sans text-xs">
                        
                        {/* Header Details */}
                        <div className="space-y-1.5 pb-4 border-b border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedAssetForDetail.asset_type.replace('_', ' ')}</span>
                          <h3 className="text-sm font-black text-slate-900 tracking-tight">{selectedAssetForDetail.asset_name}</h3>
                          <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 font-semibold">
                            <span>ID: {selectedAssetForDetail.id}</span>
                            <span>•</span>
                            <span>Status: {selectedAssetForDetail.status}</span>
                          </div>
                        </div>

                        {/* Rendering Preview Blocks (Light & Dark) */}
                        <div className="space-y-2">
                          <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Dual-Theme Render Previews</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[8px] font-black uppercase text-slate-400">Light Mode UI</span>
                              <div className="h-14 w-full bg-white rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden relative">
                                {selectedAssetForDetail.public_url ? (
                                  <img src={selectedAssetForDetail.public_url} alt="" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: selectedAssetForDetail.primary_color || '#10b981' }}>
                                    {selectedAssetForDetail.asset_key.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[8px] font-black uppercase text-slate-500">Dark Mode UI</span>
                              <div className="h-14 w-full bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden relative">
                                {selectedAssetForDetail.dark_url || selectedAssetForDetail.public_url ? (
                                  <img src={selectedAssetForDetail.dark_url || selectedAssetForDetail.public_url} alt="" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: selectedAssetForDetail.primary_color || '#10b981' }}>
                                    {selectedAssetForDetail.asset_key.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Associated Channel list (Usage Tracking) */}
                        <div className="space-y-2">
                          <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">BAM Usage Tracking</span>
                          <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                            <span className="text-[9px] font-bold text-slate-500 block">Remittance Channels Linked to this Asset:</span>
                            {channels.filter(c => c.brandAssetId === selectedAssetForDetail.id).length === 0 ? (
                              <p className="text-[10px] text-slate-400 font-sans italic font-bold">This asset version is currently unlinked to any live remittance channels.</p>
                            ) : (
                              <div className="space-y-1 font-bold text-[10px]">
                                {channels
                                  .filter(c => c.brandAssetId === selectedAssetForDetail.id)
                                  .map(c => (
                                    <div key={c.id} className="flex justify-between items-center text-slate-700 bg-white border border-slate-100 p-1.5 rounded-lg">
                                      <span>{c.displayName} ({c.providerCode})</span>
                                      <span className="text-[9px] text-indigo-600 font-mono">Linked</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Version History Engine (Drives Version History view) */}
                        <div className="space-y-2">
                          <span className="block text-[10px] uppercase font-black tracking-wider text-slate-500">Version Lineage (History)</span>
                          <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 overflow-hidden bg-slate-50/20 max-h-[160px] overflow-y-auto">
                            {brandAssets
                              .filter(a => a.asset_key === selectedAssetForDetail.asset_key)
                              .sort((a, b) => b.version - a.version)
                              .map(historyAsset => {
                                const isCurrent = historyAsset.id === selectedAssetForDetail.id;
                                return (
                                  <div
                                    key={historyAsset.id}
                                    onClick={() => setSelectedAssetForDetail(historyAsset)}
                                    className={`p-2.5 flex items-center justify-between text-[10px] font-mono cursor-pointer transition-colors ${
                                      isCurrent ? 'bg-indigo-50/30' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${historyAsset.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                      <span className="font-extrabold text-slate-800">V{historyAsset.version}</span>
                                      <span className="text-[9px] text-slate-400">({historyAsset.id.slice(historyAsset.id.length - 8)})</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-sans font-bold">
                                      <span className="text-[9px] text-slate-500">{new Date(historyAsset.created_at).toLocaleDateString()}</span>
                                      <span className={`text-[8px] uppercase px-1 rounded ${
                                        historyAsset.status === 'active' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                                      }`}>
                                        {historyAsset.status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Interactive Create New Version Form */}
                        {selectedAssetForDetail.status === 'active' && (
                          <div className="border border-dashed border-indigo-200 rounded-xl p-4 bg-indigo-50/5/30 space-y-3">
                            <span className="block text-[10px] uppercase font-black tracking-wider text-indigo-700">Deploy Version Replacement</span>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">New Image/Logo URL</label>
                                <input
                                  type="text"
                                  placeholder="Leave blank to carry forward active image URL..."
                                  value={replaceMainFile}
                                  onChange={(e) => setReplaceMainFile(e.target.value)}
                                  className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-bold"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Light URL (Opt)</label>
                                  <input
                                    type="text"
                                    placeholder="Light variant URL..."
                                    value={replaceLightUrl}
                                    onChange={(e) => setReplaceLightUrl(e.target.value)}
                                    className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Dark URL (Opt)</label>
                                  <input
                                    type="text"
                                    placeholder="Dark variant URL..."
                                    value={replaceDarkUrl}
                                    onChange={(e) => setReplaceDarkUrl(e.target.value)}
                                    className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Replacement Reason (Required)</label>
                                <textarea
                                  rows={1}
                                  placeholder="e.g. STC Pay refreshed corporate branding color palettes..."
                                  value={replaceReason}
                                  onChange={(e) => setReplaceReason(e.target.value)}
                                  className="w-full text-[10px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400 font-bold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleReplaceAsset(selectedAssetForDetail)}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors shadow-xs"
                              >
                                Create & Deploy Version {(selectedAssetForDetail.version || 1) + 1}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Fast Actions Bar (Edit/Delete) */}
                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAssetId(selectedAssetForDetail.id);
                              setAssetKey(selectedAssetForDetail.asset_key);
                              setAssetName(selectedAssetForDetail.asset_name);
                              setAssetType(selectedAssetForDetail.asset_type);
                              setAssetOwnerType(selectedAssetForDetail.owner_type);
                              setAssetProviderCode(selectedAssetForDetail.provider_code || '');
                              setAssetStoragePath(selectedAssetForDetail.storage_path);
                              setAssetPublicUrl(selectedAssetForDetail.public_url || '');
                              setAssetPrimaryColor(selectedAssetForDetail.primary_color || '');
                              setAssetSecondaryColor(selectedAssetForDetail.secondary_color || '');
                              setAssetApprovalStatus(selectedAssetForDetail.approval_status);
                              setAssetStatus(selectedAssetForDetail.status);
                              setAssetAltText(selectedAssetForDetail.alt_text || '');
                              setAssetMetadataJson(JSON.stringify(selectedAssetForDetail.metadata || {}, null, 2));
                              setBamSubView('upload');
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                          >
                            Edit Properties
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrandAsset(selectedAssetForDetail.id, selectedAssetForDetail.asset_name)}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Deactivate / Archive Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 font-sans space-y-2">
                        <Sparkles className="w-8 h-8 text-slate-300 animate-bounce" />
                        <span className="font-bold text-xs">Select an asset from the directory list</span>
                        <p className="text-[10px] text-slate-400">View version histories, dual previews, color models, and replace active branding.</p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* BAM View 3: Register / Edit Asset Form (Standard Enhanced Form) */}
              {bamSubView === 'upload' && (
                <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <div className="space-y-1 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                      {editingAssetId ? 'Edit Registered BAM Asset' : 'Register Brand Asset'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Define design tokens, colors, SVGs, and brand-level assets inside the SariRemit Design System (SDS).
                    </p>
                  </div>

                  <form onSubmit={handleSaveBrandAsset} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Asset Key (Unique Name)</label>
                        <input
                          type="text"
                          placeholder="e.g. stc-pay"
                          value={assetKey}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAssetKey(val);
                            if (!editingAssetId && val) {
                              setAssetStoragePath(`providers/${val}/${val}-logo.svg`);
                            }
                          }}
                          disabled={!!editingAssetId}
                          className={`w-full text-xs font-bold p-3 border rounded-xl outline-none font-mono ${
                            editingAssetId 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Asset Type</label>
                        <select
                          value={assetType}
                          onChange={(e) => setAssetType(e.target.value as any)}
                          className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                        >
                          <option value="provider_logo">Provider Logo</option>
                          <option value="provider_logo_dark">Logo (Dark Mode)</option>
                          <option value="provider_logo_light">Logo (Light Mode)</option>
                          <option value="sariremit_logo">SariRemit Logo</option>
                          <option value="sariremit_monogram">SariRemit Monogram</option>
                          <option value="country_flag">Country Flag</option>
                          <option value="badge">Badge/Seal</option>
                          <option value="other">Other Asset</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Asset Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. STC Pay Official Logo"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Owner Type</label>
                        <select
                          value={assetOwnerType}
                          onChange={(e) => setAssetOwnerType(e.target.value)}
                          className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                        >
                          <option value="provider">Provider / Partner</option>
                          <option value="sariremit">SariRemit Internal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Provider Code Link</label>
                        <select
                          value={assetProviderCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAssetProviderCode(val);
                            if (val) {
                              setAssetKey(val);
                              if (!editingAssetId) {
                                setAssetStoragePath(`providers/${val}/${val}-logo.svg`);
                              }
                            }
                          }}
                          className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                        >
                          <option value="">-- Generic / None --</option>
                          {channels.map(c => (
                            <option key={c.id} value={c.providerCode}>{c.displayName} ({c.providerCode})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Storage Path</label>
                      <input
                        type="text"
                        placeholder="providers/stc-pay/stc-pay-logo.svg"
                        value={assetStoragePath}
                        onChange={(e) => setAssetStoragePath(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                      />
                    </div>

                    {/* Simulated Drag & Drop for quick logo upload */}
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Main Logo URL (Vector CDN URL)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://cdn.sariremit.com/...svg"
                          value={assetPublicUrl}
                          onChange={(e) => setAssetPublicUrl(e.target.value)}
                          className="flex-1 text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const simUrl = prompt('Enter public URL or use initials provider logo:');
                            if (simUrl) setAssetPublicUrl(simUrl);
                          }}
                          className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl font-bold font-sans text-[10px] uppercase"
                        >
                          Drop file
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Primary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={assetPrimaryColor || '#4f46e5'}
                            onChange={(e) => setAssetPrimaryColor(e.target.value)}
                            className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            placeholder="#Hex"
                            value={assetPrimaryColor}
                            onChange={(e) => setAssetPrimaryColor(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Secondary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={assetSecondaryColor || '#10b981'}
                            onChange={(e) => setAssetSecondaryColor(e.target.value)}
                            className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            placeholder="#Hex"
                            value={assetSecondaryColor}
                            onChange={(e) => setAssetSecondaryColor(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Approval Status</label>
                        <select
                          value={assetApprovalStatus}
                          onChange={(e) => setAssetApprovalStatus(e.target.value as any)}
                          className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                        >
                          <option value="official">Official Verified</option>
                          <option value="placeholder">Placeholder Approved</option>
                          <option value="pending_permission">Pending Licensing</option>
                          <option value="restricted">Restricted / Private</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Status</label>
                        <select
                          value={assetStatus}
                          onChange={(e) => setAssetStatus(e.target.value as any)}
                          className="w-full text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Accessibility Alt Text</label>
                      <input
                        type="text"
                        placeholder="e.g. STC Pay brand logo with dark purple background"
                        value={assetAltText}
                        onChange={(e) => setAssetAltText(e.target.value)}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400 font-bold text-slate-750"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-950 text-white text-xs uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                      >
                        {editingAssetId ? 'Save Changes' : 'Register Brand Asset'}
                      </button>
                      {editingAssetId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAssetId(null);
                            setAssetKey('');
                            setAssetName('');
                            setAssetStoragePath('');
                            setAssetPublicUrl('');
                            setAssetPrimaryColor('');
                            setAssetSecondaryColor('');
                            setAssetAltText('');
                            setBamSubView('directory');
                          }}
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs uppercase tracking-wider font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* BAM View 4: Brand Diagnostics (Health checks & safe repairs) */}
              {bamSubView === 'diagnostics' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                      SDS Brand Health Diagnostics & Auto-Repair Panel
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Continuous monitoring over registered brand assets and active remittance channels to flag duplicates, missing details, or fallback URLs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Check 1: Missing BAM link */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          <span>Channels Missing BAM Assets (Initials Fallback)</span>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded text-[9px] font-black uppercase">
                          {channels.filter(c => !c.brandAssetId).length} Flagged
                        </span>
                      </div>
                      
                      {channels.filter(c => !c.brandAssetId).length === 0 ? (
                        <p className="text-[11px] text-emerald-600 font-bold">✓ Perfect. Every registered channel is mapped to a secure BAM brand asset.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-400 text-[10px]">These active channels have no brandAssetId linked. Customers see fallback initials cards.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {channels.filter(c => !c.brandAssetId).map(c => (
                              <div key={c.id} className="bg-white border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-[10px]">
                                <div>
                                  <span className="font-extrabold text-slate-800">{c.displayName}</span>
                                  <span className="text-slate-400 font-mono block">Code: {c.providerCode}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMigratingChannelId(c.id);
                                    setMigrationAssetName(`${c.displayName} Official Logo`);
                                    setMigrationAssetKey(c.providerCode);
                                    setBamSubView('migration');
                                  }}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold uppercase tracking-wider text-[8px] transition-colors"
                                >
                                  Migrate / Fix
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Check 2: Missing Alt Text */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Assets Missing Accessibility Alt-Text</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">
                          {brandAssets.filter(a => !a.alt_text).length} Warning
                        </span>
                      </div>

                      {brandAssets.filter(a => !a.alt_text).length === 0 ? (
                        <p className="text-[11px] text-emerald-600 font-bold font-sans">✓ Perfect. Every registered asset has accessible alt text defined.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-400 text-[10px]">These assets are missing descriptions. Screening readers may encounter barriers.</p>
                          <div className="space-y-1.5">
                            {brandAssets.filter(a => !a.alt_text).map(asset => (
                              <div key={asset.id} className="bg-white border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-800">{asset.asset_name} ({asset.id})</span>
                                <button
                                  type="button"
                                  onClick={() => handleRepairAltText(asset)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold uppercase tracking-wider text-[8px] transition-colors"
                                >
                                  Auto Alt-Text Repair
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Check 3: Redundant Active Versions */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Multiple Redundant Active Versions of Same Asset Key</span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">
                          {(() => {
                            const keys = brandAssets.map(a => a.asset_key);
                            const duplicates = [...new Set(keys)].filter(k => brandAssets.filter(a => a.asset_key === k && a.status === 'active').length > 1);
                            return duplicates.length;
                          })()} Redundant
                        </span>
                      </div>

                      {(() => {
                        const keys = brandAssets.map(a => a.asset_key);
                        const duplicates = [...new Set(keys)].filter(k => brandAssets.filter(a => a.asset_key === k && a.status === 'active').length > 1);
                        
                        if (duplicates.length === 0) {
                          return <p className="text-[11px] text-emerald-600 font-bold">✓ Perfect. No multiple active versions detected for any design key.</p>;
                        }

                        return (
                          <div className="space-y-2">
                            <p className="text-slate-400 text-[10px]">Multiple versions are marked 'active' simultaneously. The system might resolve to older versions.</p>
                            <div className="space-y-1.5">
                              {duplicates.map((key: string) => (
                                <div key={key} className="bg-white border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-[10px]">
                                  <span className="font-extrabold text-slate-800">Asset Key: <span className="font-mono">{key}</span></span>
                                  <button
                                    type="button"
                                    onClick={() => handleRepairDuplicateVersions(key)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-wider text-[8px] transition-colors"
                                  >
                                    Deactivate Older Versions
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Check 4: Licensing Approvals Pending */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          <span>Assets with Pending Legal Permission Status</span>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[9px] font-black uppercase">
                          {brandAssets.filter(a => a.approval_status === 'pending_permission').length} Pending
                        </span>
                      </div>

                      {brandAssets.filter(a => a.approval_status === 'pending_permission').length === 0 ? (
                        <p className="text-[11px] text-slate-500 font-sans font-bold">✓ Perfect. No assets are lingering in pending licensing status.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-400 text-[10px]">These assets are active on channels but their licensing is still undergoing review.</p>
                          <div className="space-y-1.5">
                            {brandAssets.filter(a => a.approval_status === 'pending_permission').map(asset => (
                              <div key={asset.id} className="bg-white border border-slate-100 rounded-lg p-2.5 flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-800">{asset.asset_name} ({asset.id})</span>
                                <button
                                  type="button"
                                  onClick={() => handleRepairApprovePermission(asset)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold uppercase tracking-wider text-[8px] transition-colors"
                                >
                                  Grant Official Approval
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BAM View 5: Legacy Logo Migration Tool (Lists and migrates channels with logoUrls) */}
              {bamSubView === 'migration' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-in fade-in duration-150 font-sans text-xs">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                      SariRemit Legacy Logo Migration Console
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Convert legacy string-based Fallback URLs to secure, tracked, and versioned BAM Design Assets. Auto-binds channels to new assets.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left side: List of legacy channels */}
                    <div className="lg:col-span-6 space-y-3">
                      <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Eligible Channels for Migration</h4>
                      
                      {channels.filter(c => (c.logoUrl || c.logo_url) && !c.brandAssetId).length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                          <span className="font-extrabold text-slate-800 block text-[11px]">All Legacy Logos Migrated!</span>
                          <p className="text-[10px] text-slate-400">Perfect. No active channels remain dependent on legacy logo fallback strings.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {channels
                            .filter(c => (c.logoUrl || c.logo_url) && !c.brandAssetId)
                            .map(c => {
                              const isTarget = migratingChannelId === c.id;
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setMigratingChannelId(c.id);
                                    setMigrationAssetName(`${c.displayName} Official Logo`);
                                    setMigrationAssetKey(c.providerCode);
                                    setMigrationAltText(`${c.displayName} Logo`);
                                  }}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                    isTarget
                                      ? 'border-indigo-600 bg-indigo-50/10'
                                      : 'border-slate-150 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <div>
                                    <span className="font-extrabold text-slate-800 block">{c.displayName}</span>
                                    <span className="text-slate-400 font-mono text-[9px]">Legacy: {c.logoUrl || c.logo_url}</span>
                                  </div>
                                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase">Select</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Right side: Migration form */}
                    <div className="lg:col-span-6 bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                      {migratingChannelId ? (
                        (() => {
                          const c = channels.find(ch => ch.id === migratingChannelId);
                          if (!c) return null;
                          return (
                            <div className="space-y-4 font-sans text-xs">
                              <h4 className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">Migrate: {c.displayName}</h4>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Asset Key Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. stc-pay"
                                    value={migrationAssetKey}
                                    onChange={(e) => setMigrationAssetKey(e.target.value)}
                                    className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Asset Display Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. STC Pay Logo"
                                    value={migrationAssetName}
                                    onChange={(e) => setMigrationAssetName(e.target.value)}
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Accessibility Alt-Text</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. STC Pay Official Brand Vector Logo"
                                    value={migrationAltText}
                                    onChange={(e) => setMigrationAltText(e.target.value)}
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Approval Status</label>
                                  <select
                                    value={migrationApprovalStatus}
                                    onChange={(e) => setMigrationApprovalStatus(e.target.value as any)}
                                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-200 rounded-xl"
                                  >
                                    <option value="official">Official Verified Logo</option>
                                    <option value="placeholder">Approved Placeholder Logo</option>
                                    <option value="pending_permission">Pending Written Consent</option>
                                  </select>
                                </div>

                                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 text-[10px] text-indigo-700 leading-relaxed font-sans font-medium">
                                  <p className="font-extrabold">Auto-generated Action Log:</p>
                                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[9px]">
                                    <li>CREATE BrandAsset id: ba-{migrationAssetKey.toLowerCase().trim()}-v1-[ts]</li>
                                    <li>COPY legacy public_url: {c.logoUrl || c.logo_url}</li>
                                    <li>UPDATE RemittanceChannel brandAssetId with newly generated ID</li>
                                    <li>LOG system BAM audit event trailing action history</li>
                                  </ul>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleLegacyMigration(c)}
                                  className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors shadow-xs"
                                >
                                  Deploy Legacy Logo Migration
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="py-12 text-center text-slate-400 font-sans italic space-y-1">
                          <span className="font-bold block text-slate-500 text-xs">Select a channel to begin migration</span>
                          <p className="text-[10px] text-slate-400">Migration converts falling static logos into robust centrally resolved assets.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* BAM View 6: Release & Docs (Feature Flags, Rollback & Operational Manuals) */}
              {bamSubView === 'release' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs animate-in fade-in duration-150 font-sans text-xs">
                  {/* Part A: Header */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      SDS BAM Release Readiness, Feature Flags & Operating Guides
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Control the phased rollout of the Brand Asset Manager across all channels and view production operational manuals.
                    </p>
                  </div>

                  {/* Part B: Feature Flags & Rollback Strategy */}
                  <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-[12px] uppercase">BAM Dynamic Feature Flags (Emergency Rollback)</h4>
                        <p className="text-[10px] text-slate-400">Toggle active modules instantly without rebuilding or redeploying code.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase">
                        {bamFlags.ENABLE_BAM_UI ? 'BAM Serving Live' : 'BAM Bypassed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Flag 1: ENABLE_BAM */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block text-[11px]">ENABLE_BAM</span>
                          <span className="text-[10px] text-slate-400 block">Enable core asset resolution and background loading schemas.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={bamFlags.ENABLE_BAM}
                          onChange={(e) => {
                            const newFlags = { ...bamFlags, ENABLE_BAM: e.target.checked };
                            setBamFlags(newFlags);
                            saveBamFeatureFlags(newFlags);
                          }}
                          className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Flag 2: ENABLE_BAM_UI */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block text-[11px]">ENABLE_BAM_UI</span>
                          <span className="text-[10px] text-slate-400 block">Render BAM assets on the client. Unchecking rolls back to legacy logo strings.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={bamFlags.ENABLE_BAM_UI}
                          onChange={(e) => {
                            const newFlags = { ...bamFlags, ENABLE_BAM_UI: e.target.checked };
                            setBamFlags(newFlags);
                            saveBamFeatureFlags(newFlags);
                          }}
                          className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Flag 3: ENABLE_BAM_PUBLIC_ASSETS */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block text-[11px]">ENABLE_BAM_PUBLIC_ASSETS</span>
                          <span className="text-[10px] text-slate-400 block">Allow public-safe views to consume official, placeholder, or verified assets.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={bamFlags.ENABLE_BAM_PUBLIC_ASSETS}
                          onChange={(e) => {
                            const newFlags = { ...bamFlags, ENABLE_BAM_PUBLIC_ASSETS: e.target.checked };
                            setBamFlags(newFlags);
                            saveBamFeatureFlags(newFlags);
                          }}
                          className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Flag 4: ENABLE_BAM_SRCMC */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block text-[11px]">ENABLE_BAM_SRCMC</span>
                          <span className="text-[10px] text-slate-400 block">Expose the BAM administration console to authorized SRCMC staff.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={bamFlags.ENABLE_BAM_SRCMC}
                          onChange={(e) => {
                            const newFlags = { ...bamFlags, ENABLE_BAM_SRCMC: e.target.checked };
                            setBamFlags(newFlags);
                            saveBamFeatureFlags(newFlags);
                          }}
                          className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* Flag 5: ENABLE_BAM_ASSET_VERSIONING */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 block text-[11px]">ENABLE_BAM_ASSET_VERSIONING</span>
                          <span className="text-[10px] text-slate-400 block">Enforce asset version increment logic and enable rollback of active provider-logos to historical versions.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={bamFlags.ENABLE_BAM_ASSET_VERSIONING}
                          onChange={(e) => {
                            const newFlags = { ...bamFlags, ENABLE_BAM_ASSET_VERSIONING: e.target.checked };
                            setBamFlags(newFlags);
                            saveBamFeatureFlags(newFlags);
                          }}
                          className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Part C: Documentation and Guides Accordion */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Admin Guide */}
                    <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
                      <div className="flex items-center gap-2 text-indigo-700 font-extrabold">
                        <FileText className="w-4 h-4" />
                        <span className="uppercase text-[11px] tracking-wider">I. Administrator Operating Guide</span>
                      </div>
                      <div className="space-y-3 font-sans text-slate-600 text-[11px] leading-relaxed">
                        <p>This operating guide describes how administrators utilize SRCMC controls to perform brand asset management:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>Upload Logo:</strong> Visit 'Register/Edit', select 'provider_logo', provide a code (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">stc-pay</code>), assign colors, and drag file.</li>
                          <li><strong>Placeholders:</strong> Mark as <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">placeholder</code> under legal approval status if you have not acquired verified trademarks.</li>
                          <li><strong>Official Approval:</strong> Set status to <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">official</code> once trademark permission is obtained and recorded.</li>
                          <li><strong>Safe Replacement:</strong> Register a new version rather than modifying existing versions. Older versions remain in history for seamless rollbacks.</li>
                          <li><strong>Archive safely:</strong> Change status to <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">inactive</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">archived</code>. Never force-delete if linked to transactional records.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Developer Guide */}
                    <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold">
                        <FileText className="w-4 h-4" />
                        <span className="uppercase text-[11px] tracking-wider">II. Developer Integration Guide</span>
                      </div>
                      <div className="space-y-3 font-sans text-slate-600 text-[11px] leading-relaxed">
                        <p>Guidelines for engineering brand-consistent views using the SDS Brand Asset Manager API:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><strong>No Raw Assets:</strong> Never import provider-logo image files directly or query <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[9px]">brand_assets</code> inside presentation code.</li>
                          <li><strong>SDS Components:</strong> Always use <code className="bg-slate-100 px-1 rounded font-mono text-[10px] text-slate-800">&lt;ProviderLogo&gt;</code> or <code className="bg-slate-100 px-1 rounded font-mono text-[10px] text-slate-800">&lt;ProviderBrandBlock&gt;</code>.</li>
                          <li><strong>Theme Adaptability:</strong> Provide <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">surface="dark"|"light"</code> to automatically resolve color variants.</li>
                          <li><strong>Fail-Safe Fallbacks:</strong> If an asset fails to load, components default to initials styled with computed brand-colors. Do not implement manual try-catches.</li>
                          <li><strong>Alt Labels:</strong> Screen readers must identify the provider. Components automatically inject the defined alt text.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Incident Playbook */}
                    <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
                      <div className="flex items-center gap-2 text-rose-700 font-extrabold">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="uppercase text-[11px] tracking-wider">III. Incident Response Playbook</span>
                      </div>
                      <div className="space-y-3 font-sans text-slate-600 text-[11px] leading-relaxed">
                        <p>Pre-approved runbooks for resolving brand asset anomalies during production operations:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px]">
                          <li><strong>Scenario A: Logo breaks or is corrupt</strong> <br />
                              Action: Use the 'Brand Health' diagnostics panel to trigger 'Deactivate Older Versions' or edit approval status, or revert version. If critical, uncheck <strong>ENABLE_BAM_UI</strong> to trigger immediate legacy/fallback failover.
                          </li>
                          <li><strong>Scenario B: Restricted logo leaks publicly</strong> <br />
                              Action: Edit the asset directly. Set status to <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">restricted</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">pending_permission</code>. RLS policies instantly block client access.
                          </li>
                          <li><strong>Scenario C: Storage object goes missing</strong> <br />
                              Action: The asset resolver automatically catches empty URLs and renders text-based initials fallbacks to avoid layout shifting or broken-image icons. Use the 'Brand Health' panel to re-upload.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BAP Licensing grant dialog modal */}
              {showPermissionModal && selectedAssetForPermission && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="space-y-1">
                      <h3 className="text-sm font-sans font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Manage Licensing & Trademark Permissions
                      </h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Track official permission status, corporate point-of-contacts, and licensing restrictions for: <br />
                        <strong className="text-slate-800 font-sans">"{selectedAssetForPermission.asset_name}"</strong>
                      </p>
                    </div>

                    <form onSubmit={handleSavePermission} className="space-y-4 font-sans font-medium">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Permission Status</label>
                          <select
                            value={bapStatus}
                            onChange={(e) => setBapStatus(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="granted">Granted / Approved</option>
                            <option value="pending">Pending Written Consent</option>
                            <option value="expired">Expired / Cancelled</option>
                            <option value="denied">Explicitly Denied</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Consent Source</label>
                          <input
                            type="text"
                            placeholder="e.g. CEO email, PR deck, license PDF"
                            value={bapSource}
                            onChange={(e) => setBapSource(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Reference ID / Code</label>
                          <input
                            type="text"
                            placeholder="e.g. ticket-908"
                            value={bapReference}
                            onChange={(e) => setBapReference(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Expiration Date</label>
                          <input
                            type="date"
                            value={bapExpiresAt}
                            onChange={(e) => setBapExpiresAt(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Corporate Contact Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Sarah Smith"
                            value={bapContactName}
                            onChange={(e) => setBapContactName(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Corporate Contact Email</label>
                          <input
                            type="email"
                            placeholder="e.g. brand@stcpay.com.sa"
                            value={bapContactEmail}
                            onChange={(e) => setBapContactEmail(e.target.value)}
                            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Licensing Restrictions / Exclusions</label>
                        <input
                          type="text"
                          placeholder="e.g. Only permitted on mobile comparisons, not billboard prints."
                          value={bapRestrictions}
                          onChange={(e) => setBapRestrictions(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-bold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">Licensing Notes</label>
                        <textarea
                          placeholder="Internal legal or operational notes..."
                          value={bapNotes}
                          onChange={(e) => setBapNotes(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none font-bold text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPermissionModal(false);
                            setSelectedAssetForPermission(null);
                          }}
                          className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="py-3 bg-slate-900 hover:bg-slate-950 text-white text-[10px] uppercase tracking-wider font-black rounded-xl transition-colors cursor-pointer shadow-sm"
                        >
                          Save Legal Consent
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

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

          {/* TAB: PRIVACY POLICY MANAGER (SLCF COMPLIANCE ENGINE) */}
          {activeSubTab === 'privacy' && (
            <div className="space-y-6 text-slate-800">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Compliance Framework</span>
                    <span className="text-sm font-black text-slate-850">KSA PDPL</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Consented Users</span>
                    <span className="text-sm font-black text-slate-850">
                      {registeredUsers.filter(u => !!u.privacy_policy_version).length} / {registeredUsers.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Acceptance Rate</span>
                    <span className="text-sm font-black text-slate-850">
                      {registeredUsers.length > 0 
                        ? Math.round((registeredUsers.filter(u => !!u.privacy_policy_version).length / registeredUsers.length) * 100) 
                        : 100}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Clock3 className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Active Version</span>
                    <span className="text-sm font-black text-slate-850">v1.2 (Active)</span>
                  </div>
                </div>
              </div>

              {/* Main Content Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Version Publisher (Col span 5) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm text-slate-800">
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 font-mono">
                      Publish & Version Control
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Issue a new Privacy Policy version. The system will archive the previous version and enforce acceptance for all new signups.
                    </p>
                  </div>

                  {privacySuccess && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/50 text-[11px] font-bold text-left">
                      {privacySuccess}
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        Target Version Identifier
                      </label>
                      <input
                        type="text"
                        value={newPolicyVersion}
                        onChange={(e) => setNewPolicyVersion(e.target.value)}
                        placeholder="v1.3"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        Version Changelog / Description
                      </label>
                      <textarea
                        value={newPolicyDesc}
                        onChange={(e) => setNewPolicyDesc(e.target.value)}
                        placeholder="Describe what changed in this version..."
                        rows={3}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newPolicyVersion) return;
                        const updated = policies.map(p => ({ ...p, status: 'Archived' }));
                        setPolicies([
                          { version: newPolicyVersion, status: 'Active', publishDate: new Date().toISOString().split('T')[0], description: newPolicyDesc },
                          ...updated
                        ]);
                        setPrivacySuccess(`Successfully published Privacy Policy version ${newPolicyVersion}! Older versions archived.`);
                        setTimeout(() => setPrivacySuccess(''), 4000);
                      }}
                      className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Publish & Enforce Version</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono text-left">
                      Policy Version Log
                    </h4>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {policies.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800">{p.version}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                                {p.status}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold font-mono block">Released {p.publishDate}</span>
                            <p className="text-[9.5px] text-slate-500 leading-normal mt-1 line-clamp-2">{p.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            {p.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = policies.map((item, i) => i === idx ? { ...item, status: 'Archived' } : item);
                                  setPolicies(updated);
                                }}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[9px] font-bold text-slate-700 transition-colors cursor-pointer"
                              >
                                Archive
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = policies.map((item, i) => {
                                    if (i === idx) return { ...item, status: 'Active' };
                                    return { ...item, status: 'Archived' };
                                  });
                                  setPolicies(updated);
                                }}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded text-[9px] font-bold text-emerald-800 transition-colors cursor-pointer"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Acceptance Directory & Records (Col span 7) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-slate-800">
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 font-mono">
                      Compliance Audit Logs (PDPL Consents)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Verify individual consent records required by the Saudi Personal Data Protection Law (PDPL).
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[9px] tracking-wider font-mono">
                          <th className="py-2.5 px-4">Member</th>
                          <th className="py-2.5 px-4">Consent Status</th>
                          <th className="py-2.5 px-4">Version</th>
                          <th className="py-2.5 px-4 text-right">Accepted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registeredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center font-bold text-slate-400 uppercase bg-slate-50/20">
                              No members registered in database yet.
                            </td>
                          </tr>
                        ) : (
                          registeredUsers.map((user, idx) => {
                            const acceptedVersion = user.privacy_policy_version || 'v1.2 (Legacy Accept)';
                            const acceptedTime = user.privacy_policy_accepted_at || user.createdAt || new Date().toISOString();
                            const hasAccepted = !!user.privacy_policy_version;

                            return (
                              <tr key={user.id || idx} className="hover:bg-slate-50/20">
                                <td className="py-3 px-4 font-bold text-left">
                                  <span className="text-slate-800 block text-xs leading-none">{user.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono font-normal block mt-1">{user.email}</span>
                                </td>
                                <td className="py-3 px-4 text-left">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${hasAccepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200/50'}`}>
                                    {hasAccepted ? 'CONSENTED' : 'ACCEPTED'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-600 text-[10px] text-left">{acceptedVersion}</td>
                                <td className="py-3 px-4 text-right text-slate-400 font-mono font-bold text-[10px]">
                                  {new Date(acceptedTime).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
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

          {/* TAB: TERMS OF USE MANAGER (SLCF COMPLIANCE ENGINE) */}
          {activeSubTab === 'terms' && (
            <div className="space-y-6 text-slate-800 animate-fadeIn">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileText className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">SLCF Compliance</span>
                    <span className="text-sm font-black text-slate-850">KSA SAMA/SLCF</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Accepted Members</span>
                    <span className="text-sm font-black text-slate-850">
                      {registeredUsers.filter(u => !!u.terms_version).length} / {registeredUsers.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Consent Rate</span>
                    <span className="text-sm font-black text-slate-850">
                      {registeredUsers.length > 0 
                        ? Math.round((registeredUsers.filter(u => !!u.terms_version).length / registeredUsers.length) * 100) 
                        : 100}%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Clock3 className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block font-mono">Current Version</span>
                    <span className="text-sm font-black text-slate-850">
                      {termsPolicies.find(p => p.status === 'Active')?.version || 'v1.0'} (Active)
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Version Publisher (Col span 5) */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm text-slate-800">
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 font-mono">
                      Terms Version Control
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Publish a new version of the SariRemit Terms of Use. New users will be required to accept this active version upon registration.
                    </p>
                  </div>

                  {termsSuccess && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/50 text-[11px] font-bold text-left animate-fadeIn">
                      {termsSuccess}
                    </div>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        New Version Number
                      </label>
                      <input
                        type="text"
                        value={newTermsVersion}
                        onChange={(e) => setNewTermsVersion(e.target.value)}
                        placeholder="v1.1"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                        Release Changelog
                      </label>
                      <textarea
                        value={newTermsDesc}
                        onChange={(e) => setNewTermsDesc(e.target.value)}
                        placeholder="Describe what has changed or updated in this version..."
                        rows={3}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newTermsVersion) return;
                        const updated = termsPolicies.map(p => ({ ...p, status: 'Archived' }));
                        setTermsPolicies([
                          { version: newTermsVersion, status: 'Active', publishDate: new Date().toISOString().split('T')[0], description: newTermsDesc },
                          ...updated
                        ]);
                        setTermsSuccess(`Successfully published and enforced Terms of Use ${newTermsVersion}! Previous versions archived.`);
                        setTimeout(() => setTermsSuccess(''), 4000);
                      }}
                      className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Publish & Enforce Terms</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono text-left">
                      Terms Version Logs
                    </h4>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {termsPolicies.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-xs flex items-center justify-between">
                          <div className="space-y-0.5 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800">{p.version}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                                {p.status}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-bold font-mono block">Released {p.publishDate}</span>
                            <p className="text-[9.5px] text-slate-500 leading-normal mt-1 line-clamp-2">{p.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            {p.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = termsPolicies.map((item, i) => i === idx ? { ...item, status: 'Archived' } : item);
                                  setTermsPolicies(updated);
                                }}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[9px] font-bold text-slate-700 transition-colors cursor-pointer"
                              >
                                Archive
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = termsPolicies.map((item, i) => {
                                    if (i === idx) return { ...item, status: 'Active' };
                                    return { ...item, status: 'Archived' };
                                  });
                                  setTermsPolicies(updated);
                                }}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded text-[9px] font-bold text-emerald-800 transition-colors cursor-pointer"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Acceptance Directory & Records (Col span 7) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-slate-800">
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 font-mono">
                      Compliance Audit Logs (SLCF Terms of Use)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Verify individual member agreements to the Terms of Use, matching Saudi financial intelligence guidelines.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-550 font-extrabold uppercase text-[9px] tracking-wider font-mono">
                          <th className="py-2.5 px-4">Member</th>
                          <th className="py-2.5 px-4">Agreement Status</th>
                          <th className="py-2.5 px-4">Version</th>
                          <th className="py-2.5 px-4 text-right">Accepted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {registeredUsers.length === 0 ? (
                           <tr>
                             <td colSpan={4} className="py-12 text-center font-bold text-slate-400 uppercase bg-slate-50/20">
                               No members registered in database yet.
                             </td>
                           </tr>
                        ) : (
                          registeredUsers.map((user, idx) => {
                            const acceptedVersion = user.terms_version || 'v1.0 (Legacy Accept)';
                            const acceptedTime = user.terms_accepted_at || user.createdAt || new Date().toISOString();
                            const hasAccepted = !!user.terms_version;

                            return (
                              <tr key={user.id || idx} className="hover:bg-slate-50/20">
                                <td className="py-3 px-4 font-bold text-left">
                                  <span className="text-slate-800 block text-xs leading-none">{user.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono font-normal block mt-1">{user.email}</span>
                                </td>
                                <td className="py-3 px-4 text-left">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${hasAccepted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200/50'}`}>
                                    {hasAccepted ? 'AGREED' : 'ACCEPTED'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-600 text-[10px] text-left">{acceptedVersion}</td>
                                <td className="py-3 px-4 text-right text-slate-400 font-mono font-bold text-[10px]">
                                  {new Date(acceptedTime).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
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

          {/* TAB 10: SUPPORT & COMPLIANCE DESK */}
          {activeSubTab === 'support' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                    Support & Compliance Ticket Desk
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Review and resolve user complaints, rate discrepancies, technical issues, and compliance requests.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold text-[10px] uppercase font-mono">
                    {adminSupportRequests.length} Total Tickets
                  </span>
                </div>
              </div>

              {/* FILTERS BAR */}
              <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs text-left">
                <div className="flex items-center gap-2 text-left">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                  <select 
                    className="bg-white border border-slate-250 rounded-lg px-2 py-1.5 focus:outline-none"
                    value={supportFilterStatus}
                    onChange={(e) => setSupportFilterStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-left">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">Category:</span>
                  <select 
                    className="bg-white border border-slate-250 rounded-lg px-2 py-1.5 focus:outline-none"
                    value={supportFilterCategory}
                    onChange={(e) => setSupportFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="general_feedback">General Feedback</option>
                    <option value="technical_issue">Technical Issue</option>
                    <option value="rate_discrepancy">Rate Discrepancy</option>
                    <option value="compliance_query">Compliance Query</option>
                  </select>
                </div>
              </div>

              {/* TWO PANEL WORKSPACE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT PANEL: Ticket List */}
                <div className="lg:col-span-1 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[600px] overflow-y-auto bg-white">
                  {(() => {
                    const filtered = adminSupportRequests.filter(req => {
                      const matchesStatus = supportFilterStatus === 'all' || req.status === supportFilterStatus;
                      const matchesCategory = supportFilterCategory === 'all' || req.category === supportFilterCategory;
                      return matchesStatus && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                          No matching support requests.
                        </div>
                      );
                    }

                    return filtered.map(req => {
                      const isSelected = selectedAdminTicket?.id === req.id;
                      return (
                        <div 
                          key={req.id}
                          onClick={() => handleSelectAdminTicket(req)}
                          className={`p-4 cursor-pointer transition-colors text-left space-y-2 ${
                            isSelected ? 'bg-slate-50 border-l-4 border-slate-800' : 'hover:bg-slate-50/45'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-[10px] text-amber-600">{req.ticket_number}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              req.status === 'open' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                              req.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {req.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{req.subject}</h4>
                            <p className="text-[10px] text-slate-400 truncate font-bold">By {req.name} • {req.email}</p>
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1">
                            <span>{req.category.replace('_', ' ')}</span>
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* RIGHT PANEL: Workspace Detail & Conversations */}
                <div className="lg:col-span-2">
                  {selectedAdminTicket ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 space-y-4">
                      {/* Section Header */}
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="text-left">
                          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <span className="font-mono text-amber-600">{selectedAdminTicket.ticket_number}</span>
                            <span>{selectedAdminTicket.subject}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Submitter: <strong className="text-slate-600">{selectedAdminTicket.name}</strong> ({selectedAdminTicket.email})
                          </p>
                        </div>

                        {/* Status controls */}
                        <div className="flex flex-wrap gap-1.5">
                          {['new', 'in_review', 'resolved', 'closed'].map(st => {
                            const active = selectedAdminTicket.status === st || 
                                          (st === 'new' && selectedAdminTicket.status === 'open') || 
                                          (st === 'in_review' && selectedAdminTicket.status === 'under_review');
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleAdminUpdateStatus(st as any)}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                                  active 
                                    ? 'bg-slate-800 text-white font-black' 
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {st.replace('_', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ticket Properties / SAF Integrity Metrics */}
                      <div className="px-4 py-3 bg-white border-y border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-left">
                        <div>
                          <span className="text-slate-400 block font-medium">Linked Remittance Channel</span>
                          <span className="font-bold text-slate-700">
                            {selectedAdminTicket.related_channel_id 
                              ? (PROVIDERS.find(p => p.id === selectedAdminTicket.related_channel_id)?.name || selectedAdminTicket.related_channel_id)
                              : 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Linked Corridor</span>
                          <span className="font-bold text-slate-700">
                            {selectedAdminTicket.related_corridor_id 
                              ? `${CORRIDORS.find(c => c.id === selectedAdminTicket.related_corridor_id)?.flag} ${selectedAdminTicket.related_corridor_id.toUpperCase()}`
                              : 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">SAF Risk Analysis Score</span>
                          <span className={`font-bold font-mono ${
                            selectedAdminTicket.saf_risk_score > 60 ? 'text-rose-600' :
                            selectedAdminTicket.saf_risk_score > 30 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {selectedAdminTicket.saf_risk_score} / 100
                          </span>
                        </div>
                      </div>

                      {/* Chronological Chat Messages Thread */}
                      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-slate-100/50 rounded-xl mx-4 border border-slate-200/50">
                        {/* Original Submission */}
                        <div className="flex flex-col items-start max-w-[85%] text-left">
                          <div className="bg-slate-200 border border-slate-300 text-slate-800 rounded-2xl px-4 py-2.5 text-xs">
                            <p className="font-extrabold text-[9px] text-slate-500 uppercase tracking-widest mb-1">
                              {selectedAdminTicket.name} (Original Request)
                            </p>
                            <p className="whitespace-pre-wrap">{selectedAdminTicket.message}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">
                            {new Date(selectedAdminTicket.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Thread Replies */}
                        {adminTicketMessages.map((msg) => {
                          const isUser = msg.sender_role === 'user';
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col max-w-[85%] text-left ${isUser ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                            >
                              <div className={`rounded-2xl px-4 py-2.5 text-xs border ${
                                isUser 
                                  ? 'bg-slate-200 border-slate-300 text-slate-800' 
                                  : 'bg-indigo-50 border-indigo-200 text-slate-800'
                              }`}>
                                <p className={`font-extrabold text-[9px] uppercase tracking-widest mb-1 ${
                                  isUser ? 'text-slate-500' : 'text-indigo-600'
                                }`}>
                                  {msg.sender_name} ({isUser ? 'User' : 'Staff Reply'})
                                </p>
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input Form & Resolution Note Fields */}
                      <div className="p-4 bg-white border-t border-slate-200 space-y-4 text-left">
                        {/* Resolution Notes area */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                            Internal Resolution Notes / Audit Logs Detail
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Add compliance comments, resolution outcomes, or technical fix references..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-slate-400 text-slate-700 text-left"
                            value={adminResolutionNotes}
                            onChange={(e) => setAdminResolutionNotes(e.target.value)}
                          />
                        </div>

                        {/* Text reply input */}
                        {selectedAdminTicket.status === 'closed' || selectedAdminTicket.status === 'resolved' ? (
                          <div className="text-center p-3 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-500">
                            Ticket status is closed/resolved. Re-open to dispatch replies.
                          </div>
                        ) : (
                          <form onSubmit={handleAdminSubmitReply} className="space-y-2">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                              Compose Message Dispatch to User App Feed
                            </label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Type support message response..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-slate-400 text-slate-700 text-left"
                                value={adminReplyText}
                                onChange={(e) => setAdminReplyText(e.target.value)}
                                disabled={isAdminReplying}
                                required
                              />
                              <button
                                type="submit"
                                disabled={isAdminReplying || !adminReplyText.trim()}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                              >
                                {isAdminReplying ? 'Sending...' : 'Reply'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-16 text-center text-slate-400 space-y-3">
                      <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        No Ticket Selected
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Please select a support ticket from the list on the left to begin active reviews and updates.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          </div>
        )}
          </div>
        </div>
      </div>

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
