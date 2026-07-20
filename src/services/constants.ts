import { Corridor, Provider } from '../types';

export const ENABLE_SDS_3_USER_SHELL = true;
export const ENABLE_SDS_3_DASHBOARD = true;

// Centralized Theme System Rollout Flags
export const ENABLE_LIGHT_MODE = true;
export const ENABLE_SYSTEM_THEME = true;
export const ENABLE_THEME_SYNC_TO_PROFILE = false;

// Settings & Account Architecture Feature Flags
export const ENABLE_SETTINGS_ACCOUNT_ARCHITECTURE = true;
export const ENABLE_PROFILE_OVERVIEW_V2 = true;
export const ENABLE_ACCOUNT_DATA_EXPORT = true;
export const ENABLE_ACCOUNT_DELETION = true;
export const ENABLE_ACTIVE_SESSION_MANAGEMENT = true;
export const ENABLE_ACCOUNT_DELETION_RECOVERY_WINDOW = true;

export const PROVIDERS: Provider[] = [
  { id: 'stc-pay', name: 'STC Pay / STC Bank', logoColor: 'bg-purple-600', logoText: 'stc', rating: 4.8 },
  { id: 'urpay', name: 'Urpay', logoColor: 'bg-blue-600', logoText: 'ur', rating: 4.7 },
  { id: 'mobily-pay', name: 'Mobily Pay', logoColor: 'bg-cyan-500', logoText: 'mb', rating: 4.6 },
  { id: 'enjaz', name: 'Enjaz (Bank Albilad)', logoColor: 'bg-amber-600', logoText: 'ej', rating: 4.5 },
  { id: 'quickpay', name: 'QuickPay (SNB)', logoColor: 'bg-emerald-700', logoText: 'qp', rating: 4.4 },
  { id: 'western-union', name: 'Western Union', logoColor: 'bg-yellow-500 text-black', logoText: 'wu', rating: 4.3 },
  { id: 'al-rajhi-tahweel', name: 'Al Rajhi Tahweel', logoColor: 'bg-blue-800', logoText: 'ar', rating: 4.5 },
];

export const CORRIDORS: Corridor[] = [
  { id: 'sa-in', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'India', toCountryAr: 'الهند', currencyCode: 'INR', flag: '🇮🇳', baseExchangeRate: 22.25, typicalFee: 15 },
  { id: 'sa-pk', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Pakistan', toCountryAr: 'باكستان', currencyCode: 'PKR', flag: '🇵🇰', baseExchangeRate: 74.40, typicalFee: 15 },
  { id: 'sa-ph', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Philippines', toCountryAr: 'الفلبين', currencyCode: 'PHP', flag: '🇵🇭', baseExchangeRate: 15.18, typicalFee: 14 },
  { id: 'sa-bd', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Bangladesh', toCountryAr: 'بنجلاديش', currencyCode: 'BDT', flag: '🇧🇩', baseExchangeRate: 31.20, typicalFee: 15 },
  { id: 'sa-eg', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Egypt', toCountryAr: 'مصر', currencyCode: 'EGP', flag: '🇪🇬', baseExchangeRate: 12.85, typicalFee: 18 },
  { id: 'sa-ke', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Kenya', toCountryAr: 'كينيا', currencyCode: 'KES', flag: '🇰🇪', baseExchangeRate: 34.60, typicalFee: 12 },
  { id: 'sa-ug', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Uganda', toCountryAr: 'أوغندا', currencyCode: 'UGX', flag: '🇺🇬', baseExchangeRate: 985.00, typicalFee: 15 },
  { id: 'sa-et', fromCountry: 'Saudi Arabia', fromCountryAr: 'المملكة العربية السعودية', toCountry: 'Ethiopia', toCountryAr: 'إثيوبيا', currencyCode: 'ETB', flag: '🇪🇹', baseExchangeRate: 15.30, typicalFee: 15 },
];
