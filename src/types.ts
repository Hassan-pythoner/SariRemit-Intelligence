export interface Provider {
  id: string;
  name: string;
  logoColor: string; // Tailwind class like bg-blue-600, bg-yellow-500 etc
  logoText: string;
  rating: number;
}

export interface Corridor {
  id: string;
  fromCountry: string;
  fromCountryAr: string;
  toCountry: string;
  toCountryAr: string;
  currencyCode: string;
  flag: string;
  baseExchangeRate: number; // 1 SAR to target currency
  typicalFee: number; // in SAR
}

export interface RemittanceRate {
  id: string;
  providerId: string;
  providerName: string;
  corridorId: string;
  exchangeRate: number; // 1 SAR to target currency
  transferFee: number; // in SAR
  deliverySpeed: string; // e.g., "Instant", "1-2 Hours", "1-2 Days"
  deliverySpeedAr: string;
  transferMethod: 'wallet' | 'cash' | 'bank';
  confidenceScore: number; // 1-100 rating
  lastUpdated: string; // ISO string or relative time
  isPartner?: boolean;
}

export interface RateSubmission {
  id: string;
  providerId: string;
  providerName: string;
  corridorId: string;
  exchangeRate: number;
  transferFee: number;
  sendAmount: number;
  receiveAmount: number;
  submittedAt: string;
  screenshotUrl?: string;
  screenshotName?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy?: string;
  submittedByEmail?: string;
  vatAmount?: number;
  otherCosts?: number;
}

export interface RateAlert {
  id: string;
  corridorId: string;
  targetRate: number;
  providerId?: string;
  type: 'above' | 'below';
  channel: 'whatsapp' | 'email' | 'sms';
  active: boolean;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  preferredCorridorId: string;
  language: 'en' | 'ar';
  onboarding_completed?: boolean;
  primary_destination_country?: string;
  primary_destination_currency?: string;
  preferred_channels?: string[];
  estimated_monthly_send_amount?: number;
}

export interface TranslationDict {
  appName: string;
  tagline: string;
  landingDesc: string;
  compareRates: string;
  compareRatesDesc: string;
  submitRate: string;
  submitRateDesc: string;
  corridorInsights: string;
  alerts: string;
  profile: string;
  bestValue: string;
  savingsHigh: string;
  chooseCountry: string;
  sendingAmount: string;
  receivingCurrency: string;
  provider: string;
  transferMethod: string;
  allMethods: string;
  bankTransfer: string;
  cashPickup: string;
  mobileWallet: string;
  exchangeRate: string;
  transferFee: string;
  estReceived: string;
  deliverySpeed: string;
  confidenceScore: string;
  lastUpdated: string;
  savingsInsightTitle: string;
  savingsInsightDesc: string;
  submitRateFormTitle: string;
  uploadScreenshot: string;
  alertMeTitle: string;
  alertMeDesc: string;
  createAlertBtn: string;
  trendingTitle: string;
  trendUp: string;
  trendDown: string;
  backToLanding: string;
  activeAlerts: string;
  noAlerts: string;
  addAlert: string;
  todayRate: string;
  fee: string;
  sar: string;
  arabic: string;
  english: string;
  getStarted: string;
  saveNow: string;
  viewDetails: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  howItWorks: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  disclaimer: string;
  quickStats: string;
  activeUsers: string;
  totalSaved: string;
  verifiedToday: string;
}

export type ResolvedRate = {
  providerId: string;
  providerName: string;
  destinationCountry: string;
  destinationCurrency: string;
  transferMethod: string;
  resolvedRate: number;
  transferFee: number;
  vatAmount: number;
  otherCosts?: number;
  totalFee: number;
  sourceType:
    | "admin_override"
    | "community_verified"
    | "manual_channel_rate"
    | "market_reference"
    | "last_known_valid";
  sourceLabel: string;
  confidence: "high" | "medium" | "low";
  freshness: "fresh" | "aging" | "stale";
  lastUpdated: string;
  expiresAt?: string | null;
  reason: string;
};

export type RecommendationResult = {
  bestProviderId: string;
  bestProviderName: string;
  transferMethod: string;
  sendAmount: number;
  destinationCurrency: string;
  netRecipientAmount: number;
  estimatedSavings: number;
  recommendationType: "send_now" | "compare_more" | "wait";
  confidence: "high" | "medium" | "low";
  reason: string;
  resolvedRateSource: string;
  lastUpdated: string;
};

export type SISResult = {
  providerId: string;
  sisScore: number;
  sisLabel: "Excellent" | "Strong" | "Fair" | "Weak" | "Poor";
  sisReason: string;
  components: {
    rateAdvantageScore: number;
    feeAdvantageScore: number;
    trueCostScore: number;
    confidenceScore: number;
    freshnessScore: number;
    savingsScore: number;
  };
};

export type TrueCostResult = {
  providerId: string;
  providerName: string;
  sendAmount: number;
  destinationCurrency: string;

  visibleFees: number;
  transferFee: number;
  vatAmount: number;
  otherCosts?: number;

  marketReferenceRate?: number | null;
  resolvedRate: number;

  idealRecipientAmount?: number | null;
  actualRecipientAmount: number;

  exchangeRateLoss?: number | null;
  hiddenCost?: number | null;
  trueCost?: number | null;
  trueCostPercent?: number | null;

  transparencyRating: "excellent" | "good" | "fair" | "poor" | "unknown";
  explanation: string;
};

export interface SicSnapshot {
  id?: string;
  destination_country: string;
  destination_currency: string;
  send_amount: number;
  transfer_method?: string;
  resolved_rates: ResolvedRate[];
  sis_results: SISResult[];
  true_cost_results?: TrueCostResult[];
  recommendation: RecommendationResult;
  engine_status?: string;
  generated_at?: string;
  sic_version?: string;
}

export type SRCMCRole =
  | "main_admin"
  | "rate_monitor"
  | "override_manager"
  | "community_verifier"
  | "channel_manager"
  | "corridor_manager"
  | "viewer";

export type SRCMCPermission =
  | "view_dashboard"
  | "monitor_rates"
  | "manage_overrides"
  | "approve_community_rates"
  | "manage_corridors"
  | "manage_channels"
  | "view_sic"
  | "view_true_cost"
  | "view_history"
  | "view_audit_logs"
  | "manage_admins";

export type CorridorStatus =
  | "active"
  | "inactive"
  | "coming_soon"
  | "paused";

export type Channel = {
  id: string;
  providerName: string;
  providerCode: string;
  displayName: string;
  category: "wallet" | "bank" | "money_transfer_operator" | "exchange_house" | "other";
  status: "active" | "inactive" | "coming_soon" | "paused";
  supportedCorridors: string[];
  supportedTransferMethods: string[];
  defaultTransferFee?: number | null;
  defaultVatRate?: number | null;
  feeCurrency: "SAR";
  logoUrl?: string | null;
  websiteUrl?: string | null;
  notes?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type OverrideStatus =
  | "active"
  | "expired"
  | "replaced"
  | "cancelled";


