export type CorridorId = 'KE' | 'IN' | 'PK' | 'PH' | 'BD' | 'EG' | 'UG' | 'ET';

export interface Corridor {
  id: CorridorId;
  nameEn: string;
  nameAr: string;
  currencyCode: string;
  currencySymbol: string;
  flag: string;
  defaultExchangeRate: number; // average rate for reference
}

export type ProviderId = 'stcpay' | 'urpay' | 'mobilypay' | 'enjaz' | 'quickpay' | 'westernunion' | 'alrajhi';

export interface Provider {
  id: ProviderId;
  name: string;
  logoColor: string; // Tailind bg class
  textColor: string; // Tailwind text class
  typeEn: string;
  typeAr: string;
  rating: number; // e.g. 4.8
}

export type TransferMethod = 'wallet' | 'bank' | 'cash';

export interface RemittanceOption {
  providerId: ProviderId;
  corridorId: CorridorId;
  exchangeRate: number; // 1 SAR = X target currency
  fee: number; // Fee in SAR
  deliverySpeedEn: string;
  deliverySpeedAr: string;
  transferMethods: TransferMethod[];
  confidenceScore: number; // 0-100 based on recent updates
  lastUpdatedMinutesAgo: number;
  isOfficialPartner?: boolean;
  subService?: 'Western Union' | 'Transfast' | 'Moneygram';
}

export interface CrowdsourcedRate {
  id: string;
  providerId: ProviderId;
  corridorId: CorridorId;
  exchangeRate: number;
  fee: number;
  amountSar: number;
  recipientAmount: number;
  screenshotUrl?: string; // or base64 data for preview
  submittedBy: string;
  timestamp: string; // human readable or iso
  votes: number;
  isVerified: boolean;
}

export interface RateAlert {
  id: string;
  corridorId: CorridorId;
  providerId: 'all' | ProviderId;
  targetRate: number;
  condition: 'above' | 'below';
  contactInfo: string;
  createdAt: string;
  isActive: boolean;
  userId?: string;
}

export interface UserProfile {
  userId?: string;
  name: string;
  phone: string;
  preferredLanguage: 'en' | 'ar';
  homeCountry: CorridorId;
  favoriteProviders: ProviderId[];
  savingsTargetSar: number; // Goal amount to save
  totalSavedSar: number; // Simulated total savings
  joinedDate: string;
  savingsHistory?: Array<{
    id: string;
    providerId: string;
    amount: number;
    savedSar: number;
    date: string;
  }>;
  contributorTrustScore?: number;
  contributorLevel?: 'New Contributor' | 'Verified Contributor' | 'Trusted Contributor' | 'Gold Contributor' | 'Community Expert';
  feedback_completed?: boolean;
  hasCompletedRecommendationSurvey?: boolean;
}

export interface UserFirstImpressionFeedback {
  id: string;
  user_id: string;
  rating: number;
  selected_reasons: string[];
  comment: string;
  submitted_at: string;
  platform: string;
  corridor: string;
  provider: string;
}

export interface CommunityTransferVerification {
  id: string;
  userId: string;
  userEmail: string;
  sessionId: string;
  providerId: string;
  providerName: string;
  corridor: string;
  destinationCountry: string;
  receiveCurrency: string;
  amountSent: number;
  exchangeRate: number;
  transferFee: number;
  vatAmount: number;
  additionalCharges: number;
  receiveMethod: 'wallet' | 'bank' | 'cash';
  recipientAmount: number;
  screenshotUrl: string;
  screenshotStoragePath: string;
  submissionStatus: 'pending' | 'verified' | 'rejected' | string;
  verificationStatus: 'pending_review' | 'approved' | 'rejected' | string;
  reviewedBy: string | null;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;

  // Compatibility fields with snake_case
  user_id?: string;
  session_id?: string;
  provider?: string;
  amount_sent?: number;
  exchange_rate?: number;
  transfer_fee?: number;
  vat?: number;
  additional_charges?: number;
  receive_method?: 'wallet' | 'bank' | 'cash';
  recipient_amount?: number;
  screenshot_url?: string;
  submission_status?: string;
  verification_status?: string;
  reviewed_by?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type RateSourceType = 'Admin Verified' | 'Provider Verified' | 'Community Verified' | 'Public Market Rate' | 'Market Reference Rate' | 'Estimated' | 'Reference Rate (Unavailable)';

export interface AdminRateOverride {
  id: string;
  providerId: ProviderId;
  providerName: string;
  transferPartner?: string; // sub-service (Western Union, Transfast, Moneygram)
  corridor: string; // 'all' or corridorId (e.g. 'PK')
  sendAmountMin: number;
  sendAmountMax: number;
  receiveMethod: 'wallet' | 'bank' | 'cash' | 'all';
  exchangeRate: number;
  transferFee: number;
  vatAmount: number;
  additionalCharges: number;
  totalCost?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  overrideReason: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RateResolutionResult {
  providerId: ProviderId;
  corridorId: CorridorId;
  subService?: 'Western Union' | 'Transfast' | 'Moneygram';
  selectedRateSource: RateSourceType;
  selectedExchangeRate: number;
  selectedFee: number;
  selectedVat: number;
  selectedTotalCost: number;
  selectedRecipientAmount: number;
  sourceConfidence: number;
  sourceLabel: string; // user-facing label
  resolvedAt: string;
  isExpiringSoon?: boolean;
  cost_breakdown?: any;
  matchedOverrideId?: string;
  freshness_score?: number;
  freshness_label?: string;
  source_badge?: string;
}

export interface RreSurveyFeedback {
  id: string;
  userId: string;
  timestamp: string;
  recommendationRating: 'Very Helpful' | 'Helpful' | 'Neutral' | 'Not Helpful' | 'Not Used';
  usedRecommendedChannel: 'Yes' | 'No';
  reasonForDifferentChoice?: 'My usual provider' | 'Lower fee elsewhere' | 'Convenience' | 'Branch availability' | 'Promotion' | 'Other' | string;
  userSuggestion?: string;
  corridor: string;
  providerRecommended: string;
  providerUsed: string;
  transferAmount: number;
  recommendationSignal: string;
  createdAt: string;
}


