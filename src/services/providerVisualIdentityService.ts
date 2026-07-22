import { BrandSurface } from './bamAssetResolver';

export interface ProviderVisualIdentity {
  providerId: string;
  providerCode: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  contrastPreference: 'light' | 'dark';
  surfaceMode: 'aurora' | 'solid' | 'subtle';
  accentGlow: string;
}

// Registry of official provider brand identities for SDS 2.0 Adaptive Surface
const PROVIDER_IDENTITIES: Record<string, ProviderVisualIdentity> = {
  'stc-pay': {
    providerId: 'stc-pay',
    providerCode: 'stc-pay',
    displayName: 'STC Pay',
    primaryColor: '#4F008C',
    secondaryColor: '#8C33FF',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(140, 51, 255, 0.25)',
  },
  'urpay': {
    providerId: 'urpay',
    providerCode: 'urpay',
    displayName: 'urpay',
    primaryColor: '#00A859',
    secondaryColor: '#34D399',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(52, 211, 153, 0.25)',
  },
  'quickpay': {
    providerId: 'quickpay',
    providerCode: 'quickpay',
    displayName: 'SNB QuickPay',
    primaryColor: '#006633',
    secondaryColor: '#10B981',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
  },
  'mobily-pay': {
    providerId: 'mobily-pay',
    providerCode: 'mobily-pay',
    displayName: 'Mobily Pay',
    primaryColor: '#0099DA',
    secondaryColor: '#38BDF8',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(56, 189, 248, 0.25)',
  },
  'alrajhi': {
    providerId: 'alrajhi',
    providerCode: 'alrajhi',
    displayName: 'Tahweel Al Rajhi',
    primaryColor: '#0A2540',
    secondaryColor: '#2563EB',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(37, 99, 235, 0.25)',
  },
  'enjaz': {
    providerId: 'enjaz',
    providerCode: 'enjaz',
    displayName: 'Enjaz (Bank AlJazira)',
    primaryColor: '#004B23',
    secondaryColor: '#059669',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(5, 150, 105, 0.25)',
  },
  'western-union': {
    providerId: 'western-union',
    providerCode: 'western-union',
    displayName: 'Western Union',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
  },
  'moneygram': {
    providerId: 'moneygram',
    providerCode: 'moneygram',
    displayName: 'MoneyGram',
    primaryColor: '#DC2626',
    secondaryColor: '#F87171',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(248, 113, 113, 0.25)',
  },
  'friendi-pay': {
    providerId: 'friendi-pay',
    providerCode: 'friendi-pay',
    displayName: 'FRiENDi Pay',
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(56, 189, 248, 0.25)',
  },
  'lari-exchange': {
    providerId: 'lari-exchange',
    providerCode: 'lari-exchange',
    displayName: 'Lari Exchange',
    primaryColor: '#B45309',
    secondaryColor: '#FBBF24',
    contrastPreference: 'dark',
    surfaceMode: 'aurora',
    accentGlow: 'rgba(251, 191, 36, 0.25)',
  }
};

// SDS 2.0 Default Neutral Identity (Fallback)
const DEFAULT_NEUTRAL_IDENTITY: ProviderVisualIdentity = {
  providerId: 'default-sds',
  providerCode: 'default-sds',
  displayName: 'SariRemit Verified',
  primaryColor: '#0F766E',
  secondaryColor: '#10B981',
  contrastPreference: 'dark',
  surfaceMode: 'subtle',
  accentGlow: 'rgba(16, 185, 129, 0.2)',
};

/**
 * Normalizes provider string identifiers and returns typed ProviderVisualIdentity
 */
export function getProviderVisualIdentity(rawProviderId?: string): ProviderVisualIdentity {
  if (!rawProviderId) return DEFAULT_NEUTRAL_IDENTITY;

  const normalized = rawProviderId.toLowerCase().trim().replace(/\s+/g, '-');

  if (PROVIDER_IDENTITIES[normalized]) {
    return PROVIDER_IDENTITIES[normalized];
  }

  // Substring matching for resilience
  for (const [key, identity] of Object.entries(PROVIDER_IDENTITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return identity;
    }
  }

  // Custom provider color synthesis from name if unknown
  return {
    ...DEFAULT_NEUTRAL_IDENTITY,
    providerId: normalized,
    displayName: rawProviderId,
  };
}
