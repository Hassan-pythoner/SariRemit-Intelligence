import { getRemittanceChannelsSync, getBrandAssetsSync } from './supabaseService';
import { PROVIDERS as STATIC_PROVIDERS } from './constants';

export interface ProviderIdentity {
  provider_id: string;
  provider_code: string;
  display_name: string;
  short_name: string;
  category: string;
  transfer_method: string;
  logo_url: string | null;
  brand_asset_id: string | null;
  theme: string;
  primary_colour: string;
  secondary_colour: string;
  provider_initials: string;
  status: string;
  supported_corridors: string[];
  created_at: string;
  updated_at: string;
}

// Memory Cache for PIS
let pisCache: ProviderIdentity[] | null = null;

// Listen for global cache clear events to maintain decoupling
if (typeof window !== 'undefined') {
  window.addEventListener('pis-cache-cleared', () => {
    pisCache = null;
  });
}

/**
 * Clear the Provider Identity presentation cache
 */
export function clearProviderPresentationCache(): void {
  pisCache = null;
  // Trigger a custom event for local reactive components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pis-cache-cleared'));
  }
}

/**
 * Color fallback by provider code
 */
export function getFallbackColor(providerCode: string): string {
  switch (providerCode?.toLowerCase()) {
    case 'stc-pay': return '#9333ea';
    case 'urpay': return '#4f46e5';
    case 'mobily-pay': return '#0ea5e9';
    case 'enjaz': return '#d97706';
    case 'quickpay': return '#059669';
    case 'western-union': return '#eab308';
    case 'al-rajhi-tahweel': return '#1d4ed8';
    case 'barq': return '#10b981';
    case 'tiqmo': return '#f59e0b';
    default: return '#10B981';
  }
}

/**
 * Generate precise initials based on the Provider Initial Generator Rules
 */
export function generateProviderInitials(displayName: string, providerCode: string): string {
  const code = (providerCode || '').toLowerCase().trim();
  const name = (displayName || '').toLowerCase().trim();

  if (code === 'urpay' || name.includes('urpay') || name.includes('ur pay')) return 'UP';
  if (code === 'stc-pay' || code === 'stcpay' || name.includes('stc pay') || name.includes('stc_pay') || name.includes('stc bank')) return 'SP';
  if (code === 'barq' || name.includes('barq')) return 'BQ';
  if (code === 'tiqmo' || name.includes('tiqmo')) return 'TQ';
  if (code === 'mobily-pay' || code === 'mobilypay' || name.includes('mobily pay')) return 'MP';
  if (code === 'moneygram' || name.includes('moneygram') || name.includes('money gram')) return 'MG';
  if (code === 'western-union' || code === 'westernunion' || name.includes('western union') || name.includes('western_union')) return 'WU';
  if (code === 'enjaz' || name.includes('enjaz')) return 'EJ';
  if (code === 'quickpay' || code === 'quick pay' || name.includes('quickpay') || name.includes('quick pay')) return 'QP';
  if (code === 'al-rajhi-tahweel' || name.includes('al rajhi') || name.includes('tahweel')) return 'AR';

  if (displayName) {
    const parts = displayName.trim().split(/[\s-_]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const init = (parts[0][0] + parts[1][0]).toUpperCase();
      if (init !== 'RU' && init !== '??' && init !== 'UN') return init;
    }
    const clean = displayName.replace(/[^a-zA-Z]/g, '');
    if (clean.length >= 2) {
      const init = clean.substring(0, 2).toUpperCase();
      if (init !== 'RU' && init !== '??' && init !== 'UN') return init;
    }
  }

  return 'SR'; // Safe default instead of RU, ??, or Unknown
}

/**
 * Derive short name for a provider
 */
export function deriveShortName(displayName: string, providerCode: string): string {
  const code = (providerCode || '').toLowerCase().trim();
  if (code === 'stc-pay' || code === 'stcpay') return 'STC Pay';
  if (code === 'urpay') return 'UrPay';
  if (code === 'mobily-pay' || code === 'mobilypay') return 'Mobily Pay';
  if (code === 'enjaz') return 'Enjaz';
  if (code === 'quickpay') return 'QuickPay';
  if (code === 'western-union' || code === 'westernunion') return 'Western Union';
  if (code === 'al-rajhi-tahweel') return 'Tahweel';
  if (code === 'barq') return 'Barq';
  if (code === 'tiqmo') return 'Tiqmo';

  const parts = displayName.split(/[\s/\\()]+/);
  return parts[0] || displayName;
}

/**
 * Get all canonical Provider Identity Objects
 */
export function getAllProviderIdentities(): ProviderIdentity[] {
  if (pisCache) {
    return pisCache;
  }

  const channels = getRemittanceChannelsSync() || [];
  const brandAssets = getBrandAssetsSync() || [];
  const list: ProviderIdentity[] = [];

  // Helper to check if dynamic channel exists for a provider_code
  const hasChannel = (code: string) => channels.some((c: any) => (c.providerCode || '').toLowerCase() === code.toLowerCase());

  // 1. Process dynamic remittance channels from database
  channels.forEach((ch: any) => {
    const pCode = (ch.providerCode || ch.provider_code || ch.id || '').toLowerCase().trim();

    // Resolve Brand Asset manually to avoid circular dependencies
    const brandAssetId = ch.brandAssetId || ch.brand_asset_id;
    let bamAsset = ch.brand_asset || ch.brandAsset;
    if (!bamAsset && brandAssetId) {
      bamAsset = brandAssets.find((a: any) => a.id === brandAssetId && a.status === 'active');
    }
    if (!bamAsset && pCode) {
      bamAsset = brandAssets.find((a: any) => a.provider_code === pCode && a.asset_type === 'provider_logo' && a.status === 'active');
    }

    const primaryColor = bamAsset?.primary_color || getFallbackColor(pCode);
    const secondaryColor = bamAsset?.secondary_color || '#ffffff';
    const logoUrl = bamAsset?.public_url || bamAsset?.light_url || bamAsset?.dark_url || ch.logoUrl || ch.logo_url || null;

    // Categorization: Always consume category directly from remittance_channels
    const category = ch.category || 'wallet';
    const transferMethod = ch.supportedTransferMethods && ch.supportedTransferMethods.length > 0 
      ? ch.supportedTransferMethods[0] 
      : (category.toLowerCase() === 'wallet' ? 'Mobile Wallet' : 'Bank Transfer');

    const initials = generateProviderInitials(ch.displayName || ch.providerName || pCode, pCode);

    list.push({
      provider_id: ch.id,
      provider_code: pCode,
      display_name: ch.displayName || ch.providerName || pCode,
      short_name: deriveShortName(ch.displayName || ch.providerName || pCode, pCode),
      category: category,
      transfer_method: transferMethod,
      logo_url: logoUrl,
      brand_asset_id: bamAsset?.id || null,
      theme: `bg-gradient-to-r from-[${primaryColor}] to-[${primaryColor}]/80`,
      primary_colour: primaryColor,
      secondary_colour: secondaryColor,
      provider_initials: initials,
      status: ch.status || 'active',
      supported_corridors: ch.supportedCorridors || [],
      created_at: ch.createdAt || ch.created_at || new Date().toISOString(),
      updated_at: ch.updatedAt || ch.updated_at || new Date().toISOString(),
    });
  });

  // 2. Process legacy static providers not present in dynamic database list (backward compatibility)
  STATIC_PROVIDERS.forEach((sp: any) => {
    const pCode = sp.id.toLowerCase().trim();
    if (hasChannel(pCode)) {
      return; // Prioritize dynamic DB channel
    }

    const pCodeMatch = pCode;
    const bamAsset = brandAssets.find((a: any) => a.provider_code === pCodeMatch && a.asset_type === 'provider_logo' && a.status === 'active');

    const primaryColor = bamAsset?.primary_color || getFallbackColor(pCode);
    const secondaryColor = bamAsset?.secondary_color || '#ffffff';
    const logoUrl = bamAsset?.public_url || bamAsset?.light_url || bamAsset?.dark_url || null;
    const initials = generateProviderInitials(sp.name, pCode);

    list.push({
      provider_id: sp.id,
      provider_code: pCode,
      display_name: sp.name,
      short_name: deriveShortName(sp.name, pCode),
      category: pCode.includes('pay') || pCode.includes('wallet') ? 'wallet' : 'bank',
      transfer_method: pCode.includes('pay') || pCode.includes('wallet') ? 'Mobile Wallet' : 'Bank Transfer',
      logo_url: logoUrl,
      brand_asset_id: bamAsset?.id || null,
      theme: `bg-gradient-to-r from-[${primaryColor}] to-[${primaryColor}]/80`,
      primary_colour: primaryColor,
      secondary_colour: secondaryColor,
      provider_initials: initials,
      status: 'active',
      supported_corridors: ['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  pisCache = list;
  return list;
}

/**
 * Get a single canonical Provider Identity Object by ID or Code (validated and fallbacked gracefully)
 */
export function getProviderIdentity(idOrCode: string): ProviderIdentity {
  const all = getAllProviderIdentities();
  
  const target = (idOrCode || '').toLowerCase().trim();
  const normalizedTarget = target.replace(/[\s_]+/g, '-'); // e.g., "stc pay" -> "stc-pay"
  const strippedTarget = target.replace(/[^a-z0-9]/g, ''); // e.g., "stc-pay" -> "stcpay"

  const found = all.find(p => {
    const pId = p.provider_id.toLowerCase();
    const pCode = p.provider_code.toLowerCase();
    const pName = p.display_name.toLowerCase();
    const pShort = p.short_name.toLowerCase();

    return pId === target || pCode === target ||
           pId === normalizedTarget || pCode === normalizedTarget ||
           pId.replace(/[^a-z0-9]/g, '') === strippedTarget ||
           pCode.replace(/[^a-z0-9]/g, '') === strippedTarget ||
           pName === target || pShort === target ||
           pName.includes(target) || target.includes(pName);
  });

  if (found) {
    return found;
  }

  // If PIS cannot resolve, log the reason in development mode
  if (typeof window !== 'undefined' && (import.meta.env?.DEV || process.env.NODE_ENV !== 'production')) {
    console.warn(`[PIS Dev Log] Provider Identity Service could not resolve a registered provider for ID/Code: "${idOrCode}". Dynamic fallback generated.`);
  }

  // Graceful Fallback if missing
  const cleanId = idOrCode || 'unknown';
  const cleanCode = cleanId.toLowerCase().trim();
  const initials = generateProviderInitials(cleanId, cleanCode);
  const fallbackColor = getFallbackColor(cleanCode) || '#374151';

  // Format the fallback display name elegantly instead of raw 'unknown' or 'Unknown Provider'
  let formattedName = cleanId;
  if (cleanId === 'unknown') {
    formattedName = 'SariRemit Partner';
  } else {
    // stc-pay -> STC Pay, mobily-pay -> Mobily Pay
    formattedName = cleanId
      .replace(/[-_]+/g, ' ')
      .replace(/\b[a-z]/g, (char) => char.toUpperCase());
    // Special capitalization logic
    if (formattedName.toLowerCase().includes('stc')) {
      formattedName = formattedName.replace(/Stc/i, 'STC');
    }
  }

  return {
    provider_id: cleanId,
    provider_code: cleanCode,
    display_name: formattedName,
    short_name: deriveShortName(formattedName, cleanCode),
    category: 'bank',
    transfer_method: 'Bank Transfer',
    logo_url: null,
    brand_asset_id: null,
    theme: `bg-slate-700`,
    primary_colour: fallbackColor,
    secondary_colour: '#ffffff',
    provider_initials: initials,
    status: 'active',
    supported_corridors: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
