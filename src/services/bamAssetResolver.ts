import { BrandAsset, BrandAssetType, BrandAssetStatus, BrandingApprovalStatus } from '../types';
import { getBrandAssetsSync } from './supabaseService';
import { getProviderIdentity, generateProviderInitials } from './pisService';

// Centralized Feature Flags for BAM roll-out and rollback strategy
export const BAM_FEATURE_FLAGS = {
  ENABLE_BAM: true,
  ENABLE_BAM_UI: true,
  ENABLE_BAM_PUBLIC_ASSETS: true,
  ENABLE_BAM_SRCMC: true,
  ENABLE_BAM_ASSET_VERSIONING: true,
};

// Initialize from localStorage if present
try {
  const storedFlags = localStorage.getItem('BAM_FEATURE_FLAGS');
  if (storedFlags) {
    Object.assign(BAM_FEATURE_FLAGS, JSON.parse(storedFlags));
  }
} catch (e) {
  console.warn('Failed to parse BAM_FEATURE_FLAGS from localStorage:', e);
}

export function getBamFeatureFlags() {
  return BAM_FEATURE_FLAGS;
}

export function saveBamFeatureFlags(flags: typeof BAM_FEATURE_FLAGS) {
  Object.assign(BAM_FEATURE_FLAGS, flags);
  try {
    localStorage.setItem('BAM_FEATURE_FLAGS', JSON.stringify(BAM_FEATURE_FLAGS));
  } catch (e) {
    console.warn('Failed to save BAM_FEATURE_FLAGS to localStorage:', e);
  }
}

export type BrandSurface =
  | "light"
  | "dark"
  | "neutral"
  | "transparent";

export type BrandAssetSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

export type ResolvedBrandAsset = {
  id?: string;
  source:
    | "bam_official"
    | "bam_placeholder"
    | "legacy"
    | "sds_fallback";
  url?: string | null;
  thumbnailUrl?: string | null;
  altText: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  approvalStatus?: string;
  version?: number;
  fallbackInitials?: string;
};

// Map size token to pixel values or class representations
export const SDS_ASSET_SIZES = {
  xs: 'w-5 h-5 text-[9px]',      // 20px
  sm: 'w-7 h-7 text-[10px]',     // 28px
  md: 'w-10 h-10 text-[13px]',   // 40px
  lg: 'w-14 h-14 text-[18px]',   // 56px
  xl: 'w-20 h-20 text-[26px]',   // 80px
};

/**
 * 1. Single Brand Asset Finder by ID
 */
export function getBrandAsset(id: string): BrandAsset | undefined {
  const assets = getBrandAssetsSync();
  return assets.find(a => a.id === id);
}

/**
 * Helper to resolve the correct URL based on surface
 */
export function resolveAssetVariant(asset: BrandAsset, surface?: BrandSurface): string | null {
  if (surface === 'dark') {
    return asset.light_url || asset.public_url || null;
  }
  if (surface === 'light') {
    return asset.dark_url || asset.public_url || null;
  }
  return asset.public_url || asset.light_url || asset.dark_url || null;
}

/**
 * Fallback to generate standard initials for a provider or country
 */
export function getFallbackInitials(name: string): string {
  return generateProviderInitials(name, name);
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
    default: return '#10B981';
  }
}

/**
 * 2. Get SariRemit logo configuration
 */
export function getSariRemitLogo(surface?: BrandSurface, size?: BrandAssetSize): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: 'SariRemit Logo Fallback (BAM UI Disabled)',
      primaryColor: '#10B981',
      secondaryColor: '#F59E0B',
      fallbackInitials: 'SR'
    };
  }

  const assets = getBrandAssetsSync();
  const asset = assets.find(a => a.asset_type === 'sariremit_logo' && a.status === 'active');
  
  if (asset) {
    const url = resolveAssetVariant(asset, surface);
    return {
      id: asset.id,
      source: 'bam_official',
      url,
      thumbnailUrl: asset.thumbnail_url || url,
      altText: asset.alt_text || 'SariRemit Official Logo',
      primaryColor: asset.primary_color || '#10B981',
      secondaryColor: asset.secondary_color || '#F59E0B',
      approvalStatus: 'official',
      version: asset.version,
      fallbackInitials: 'SR'
    };
  }

  // Default hardcoded token fallback
  return {
    source: 'sds_fallback',
    url: null,
    altText: 'SariRemit Logo Fallback',
    primaryColor: '#10B981',
    secondaryColor: '#F59E0B',
    fallbackInitials: 'SR'
  };
}

/**
 * 3. Get SariRemit monogram
 */
export function getSariRemitMonogram(surface?: BrandSurface, size?: BrandAssetSize): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: 'SariRemit Monogram Fallback (BAM UI Disabled)',
      primaryColor: '#10B981',
      secondaryColor: '#F59E0B',
      fallbackInitials: 'S'
    };
  }

  const assets = getBrandAssetsSync();
  const asset = assets.find(a => a.asset_type === 'sariremit_monogram' && a.status === 'active');

  if (asset) {
    const url = resolveAssetVariant(asset, surface);
    return {
      id: asset.id,
      source: 'bam_official',
      url,
      thumbnailUrl: asset.thumbnail_url || url,
      altText: asset.alt_text || 'SariRemit Monogram',
      primaryColor: asset.primary_color || '#10B981',
      secondaryColor: asset.secondary_color || '#F59E0B',
      approvalStatus: 'official',
      version: asset.version,
      fallbackInitials: 'S'
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: 'SariRemit Monogram Fallback',
    primaryColor: '#10B981',
    secondaryColor: '#F59E0B',
    fallbackInitials: 'S'
  };
}

/**
 * 4. Get Provider Branding details
 */
export function getProviderBranding(channel: any, surface?: BrandSurface): ResolvedBrandAsset {
  const providerCode = typeof channel === 'string'
    ? channel
    : (channel?.providerCode || channel?.provider_code || channel?.provider_id || channel?.id || '');
  const identity = getProviderIdentity(providerCode);

  return {
    id: identity.brand_asset_id || undefined,
    source: identity.logo_url ? 'bam_official' : 'sds_fallback',
    url: identity.logo_url,
    thumbnailUrl: identity.logo_url,
    altText: `${identity.display_name} Logo`,
    primaryColor: identity.primary_colour,
    secondaryColor: identity.secondary_colour,
    approvalStatus: identity.brand_asset_id ? 'official' : 'placeholder',
    version: 1,
    fallbackInitials: identity.provider_initials
  };
}

/**
 * 5. Get Provider Logo Wrapper
 */
export function getProviderLogo(channel: any, surface?: BrandSurface): ResolvedBrandAsset {
  return getProviderBranding(channel, surface);
}

/**
 * 6. Get Country Flag
 */
export function getCountryFlag(country: string, currency?: string, flagAssetId?: string): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: `Flag of ${country} (fallback - BAM UI Disabled)`,
      fallbackInitials: getFallbackInitials(country)
    };
  }

  const assets = getBrandAssetsSync();
  const cCode = country?.toLowerCase().substring(0, 3) || currency?.toLowerCase().substring(0, 3) || '';

  let bamAsset: BrandAsset | undefined;
  if (flagAssetId) {
    bamAsset = assets.find(a => a.id === flagAssetId && a.asset_type === 'country_flag' && a.status === 'active');
  }
  if (!bamAsset && cCode) {
    bamAsset = assets.find(a => (a.country_code?.toLowerCase() === cCode || a.asset_key?.toLowerCase().includes(cCode)) && a.asset_type === 'country_flag' && a.status === 'active');
  }

  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      thumbnailUrl: bamAsset.thumbnail_url || bamAsset.public_url,
      altText: bamAsset.alt_text || `Official Flag of ${country}`,
      primaryColor: bamAsset.primary_color,
      approvalStatus: bamAsset.approval_status,
      version: bamAsset.version
    };
  }

  // standard country emoji or fallback representation
  return {
    source: 'sds_fallback',
    url: null,
    altText: `Flag of ${country} (fallback)`,
    fallbackInitials: getFallbackInitials(country)
  };
}

/**
 * 7. Get Corridor Icon
 */
export function getCorridorIcon(corridor: any): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: `Corridor icon fallback (BAM UI Disabled)`,
      fallbackInitials: '➔'
    };
  }

  const assets = getBrandAssetsSync();
  const key = corridor?.key || corridor?.id || '';
  
  const bamAsset = assets.find(a => a.asset_key === key && a.asset_type === 'corridor_icon' && a.status === 'active');
  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      altText: bamAsset.alt_text || `Corridor icon for ${key}`,
      approvalStatus: bamAsset.approval_status
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: `Corridor icon fallback for ${key}`,
    fallbackInitials: '➔'
  };
}

/**
 * 8. Get Badge Asset
 */
export function getBadgeAsset(type: string): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: `${type} Badge (fallback - BAM UI Disabled)`,
      primaryColor: '#10B981'
    };
  }

  const assets = getBrandAssetsSync();
  const bamAsset = assets.find(a => a.asset_key === type && a.asset_type === 'badge' && a.status === 'active');
  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      altText: bamAsset.alt_text || `${type} Badge`,
      primaryColor: bamAsset.primary_color,
      secondaryColor: bamAsset.secondary_color
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: `${type} Badge (fallback)`,
    primaryColor: '#10B981'
  };
}

/**
 * 9. Get Achievement Icon
 */
export function getAchievementIcon(achievement: any): ResolvedBrandAsset {
  if (!BAM_FEATURE_FLAGS.ENABLE_BAM_UI) {
    return {
      source: 'sds_fallback',
      url: null,
      altText: `Achievement ${achievement?.name} (fallback - BAM UI Disabled)`,
      fallbackInitials: '🏆'
    };
  }

  const assets = getBrandAssetsSync();
  const assetId = achievement?.icon_asset_id || achievement?.iconAssetId;
  const iconKey = achievement?.icon_key || achievement?.iconKey || achievement?.id || '';

  let bamAsset: BrandAsset | undefined;
  if (assetId) {
    bamAsset = assets.find(a => a.id === assetId && a.asset_type === 'achievement_icon' && a.status === 'active');
  }
  if (!bamAsset && iconKey) {
    bamAsset = assets.find(a => a.asset_key === iconKey && a.asset_type === 'achievement_icon' && a.status === 'active');
  }

  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      thumbnailUrl: bamAsset.thumbnail_url || bamAsset.public_url,
      altText: bamAsset.alt_text || `Achievement icon for ${achievement?.name || iconKey}`,
      primaryColor: bamAsset.primary_color,
      secondaryColor: bamAsset.secondary_color,
      version: bamAsset.version
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: `Achievement ${achievement?.name || iconKey} (fallback)`,
    fallbackInitials: '🏆'
  };
}

/**
 * 10. Get Illustration
 */
export function getIllustration(type: string): ResolvedBrandAsset {
  const assets = getBrandAssetsSync();
  const bamAsset = assets.find(a => a.asset_key === type && a.asset_type === 'illustration' && a.status === 'active');
  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      altText: bamAsset.alt_text || `${type} Illustration`
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: `${type} Illustration (fallback)`
  };
}

/**
 * 11. Get Partner Logo
 */
export function getPartnerLogo(partnerKey: string): ResolvedBrandAsset {
  const assets = getBrandAssetsSync();
  const bamAsset = assets.find(a => a.asset_key === partnerKey && a.asset_type === 'partner_logo' && a.status === 'active');
  if (bamAsset) {
    return {
      id: bamAsset.id,
      source: 'bam_official',
      url: bamAsset.public_url,
      altText: bamAsset.alt_text || `${partnerKey} Partner Logo`
    };
  }

  return {
    source: 'sds_fallback',
    url: null,
    altText: `${partnerKey} Partner (fallback)`,
    fallbackInitials: getFallbackInitials(partnerKey)
  };
}

/**
 * 12. Resolve Asset Fallback generic handler
 */
export function resolveAssetFallback(type: BrandAssetType, key: string): ResolvedBrandAsset {
  return {
    source: 'sds_fallback',
    url: null,
    altText: `${key} fallback`,
    fallbackInitials: getFallbackInitials(key)
  };
}

/**
 * 13. Notification Icon Resolver
 */
export function resolveNotificationAsset(notification: any): ResolvedBrandAsset {
  const type = notification?.type || notification?.category || '';
  
  if (type === 'transfer' || type === 'transaction') {
    // resolve to provider branding if we have a provider
    return getProviderBranding(notification?.channel || notification?.payload);
  }
  if (type === 'rate_alert' || type === 'rate') {
    // resolve to corridor flag
    const country = notification?.payload?.country || notification?.payload?.targetCountry || 'Kenya';
    return getCountryFlag(country);
  }
  if (type === 'achievement' || type === 'seps') {
    // resolve to achievement icon
    return getAchievementIcon(notification?.payload?.achievement);
  }
  if (type === 'security') {
    // resolve to security fallback
    return {
      source: 'sds_fallback',
      url: null,
      altText: 'Security Alert Icon',
      fallbackInitials: '🔒'
    };
  }
  
  // system update
  return getSariRemitMonogram();
}
