import { Corridor, Provider, RemittanceOption, CrowdsourcedRate, RateAlert, UserProfile } from '../types';

export const CORRIDORS: Corridor[] = [
  { id: 'PK', nameEn: 'Pakistan', nameAr: 'باكستان', currencyCode: 'PKR', currencySymbol: '₨', flag: '🇵🇰', defaultExchangeRate: 74.2 },
  { id: 'IN', nameEn: 'India', nameAr: 'الهند', currencyCode: 'INR', currencySymbol: '₹', flag: '🇮🇳', defaultExchangeRate: 22.3 },
  { id: 'PH', nameEn: 'Philippines', nameAr: 'الفلبين', currencyCode: 'PHP', currencySymbol: '₱', flag: '🇵🇭', defaultExchangeRate: 15.6 },
  { id: 'KE', nameEn: 'Kenya', nameAr: 'كينيا', currencyCode: 'KES', currencySymbol: 'KSh', flag: '🇰🇪', defaultExchangeRate: 34.8 },
  { id: 'BD', nameEn: 'Bangladesh', nameAr: 'بنجلاديش', currencyCode: 'BDT', currencySymbol: '৳', flag: '🇧🇩', defaultExchangeRate: 31.4 },
  { id: 'EG', nameEn: 'Egypt', nameAr: 'مصر', currencyCode: 'EGP', currencySymbol: 'E£', flag: '🇪🇬', defaultExchangeRate: 12.9 },
  { id: 'UG', nameEn: 'Uganda', nameAr: 'أوغندا', currencyCode: 'UGX', currencySymbol: 'USh', flag: '🇺🇬', defaultExchangeRate: 985.0 },
  { id: 'ET', nameEn: 'Ethiopia', nameAr: 'إثيوبيا', currencyCode: 'ETB', currencySymbol: 'Br', flag: '🇪🇹', defaultExchangeRate: 15.2 }
];

export const PROVIDERS: Provider[] = [
  { id: 'stcpay', name: 'STC Pay / STC Bank', logoColor: 'bg-purple-600', textColor: 'text-purple-600', typeEn: 'Digital Wallet', typeAr: 'محفظة رقمية', rating: 4.8 },
  { id: 'urpay', name: 'urpay (Al Rajhi)', logoColor: 'bg-blue-600', textColor: 'text-blue-600', typeEn: 'Digital Wallet', typeAr: 'محفظة رقمية', rating: 4.7 },
  { id: 'mobilypay', name: 'Mobily Pay', logoColor: 'bg-cyan-500', textColor: 'text-cyan-600', typeEn: 'Digital Wallet', typeAr: 'محفظة رقمية', rating: 4.6 },
  { id: 'enjaz', name: 'Enjaz (Bank Albilad)', logoColor: 'bg-amber-600', textColor: 'text-amber-600', typeEn: 'Remittance Center', typeAr: 'مركز تحويل', rating: 4.4 },
  { id: 'quickpay', name: 'QuickPay (SNB)', logoColor: 'bg-green-700', textColor: 'text-green-700', typeEn: 'Bank Service', typeAr: 'خدمة بنكية', rating: 4.5 },
  { id: 'westernunion', name: 'Western Union', logoColor: 'bg-yellow-500', textColor: 'text-yellow-600', typeEn: 'Global Network', typeAr: 'شبكة عالمية', rating: 4.3 },
  { id: 'alrajhi', name: 'Tahweel Al Rajhi', logoColor: 'bg-sky-800', textColor: 'text-sky-800', typeEn: 'Bank Service', typeAr: 'خدمة بنكية', rating: 4.5 }
];

// Helper to generate realistic options for corridors
export const getRemittanceOptions = (corridorId: string): RemittanceOption[] => {
  const base = CORRIDORS.find(c => c.id === corridorId)?.defaultExchangeRate || 10;
  
  return [
    {
      providerId: 'urpay',
      corridorId: corridorId as any,
      subService: 'Western Union',
      exchangeRate: base * 1.015, // Best rate
      fee: 13.00,
      deliverySpeedEn: 'Instant (Western Union)',
      deliverySpeedAr: 'فوري (ويسترن يونيون)',
      transferMethods: ['wallet', 'bank'],
      confidenceScore: 98,
      lastUpdatedMinutesAgo: 5,
      isOfficialPartner: true
    },
    {
      providerId: 'urpay',
      corridorId: corridorId as any,
      subService: 'Transfast',
      exchangeRate: base * 1.011,
      fee: 7.00, // Promo fee
      deliverySpeedEn: 'Instant (Transfast)',
      deliverySpeedAr: 'فوري (ترانس فاست)',
      transferMethods: ['wallet', 'bank'],
      confidenceScore: 97,
      lastUpdatedMinutesAgo: 5,
      isOfficialPartner: true
    },
    {
      providerId: 'urpay',
      corridorId: corridorId as any,
      subService: 'Moneygram',
      exchangeRate: base * 1.006,
      fee: 10.00,
      deliverySpeedEn: 'Instant (Moneygram)',
      deliverySpeedAr: 'فوري (موني جرام)',
      transferMethods: ['wallet', 'bank'],
      confidenceScore: 96,
      lastUpdatedMinutesAgo: 5,
      isOfficialPartner: true
    },
    {
      providerId: 'stcpay',
      corridorId: corridorId as any,
      exchangeRate: base * 1.012,
      fee: 10.00,
      deliverySpeedEn: 'Instant (Mobile Wallet)',
      deliverySpeedAr: 'فوري (محفظة جوال)',
      transferMethods: ['wallet', 'bank', 'cash'],
      confidenceScore: 97,
      lastUpdatedMinutesAgo: 12
    },
    {
      providerId: 'mobilypay',
      corridorId: corridorId as any,
      exchangeRate: base * 1.008,
      fee: 9.00,
      deliverySpeedEn: 'Instant (Mobile Wallet)',
      deliverySpeedAr: 'فوري (محفظة جوال)',
      transferMethods: ['wallet', 'bank'],
      confidenceScore: 94,
      lastUpdatedMinutesAgo: 24
    },
    {
      providerId: 'alrajhi',
      corridorId: corridorId as any,
      exchangeRate: base * 1.002,
      fee: 15.00,
      deliverySpeedEn: '1 - 4 hours (Account)',
      deliverySpeedAr: '١ - ٤ ساعات (للحساب)',
      transferMethods: ['bank', 'cash'],
      confidenceScore: 92,
      lastUpdatedMinutesAgo: 45
    },
    {
      providerId: 'quickpay',
      corridorId: corridorId as any,
      exchangeRate: base * 0.998,
      fee: 15.00,
      deliverySpeedEn: 'Same Day to Bank',
      deliverySpeedAr: 'نفس اليوم للبنك',
      transferMethods: ['bank'],
      confidenceScore: 90,
      lastUpdatedMinutesAgo: 60
    },
    {
      providerId: 'enjaz',
      corridorId: corridorId as any,
      exchangeRate: base * 0.995,
      fee: 14.00,
      deliverySpeedEn: '10 Minutes Cash Pickup',
      deliverySpeedAr: '١٠ دقائق استلام نقدي',
      transferMethods: ['cash', 'bank'],
      confidenceScore: 88,
      lastUpdatedMinutesAgo: 85
    },
    {
      providerId: 'westernunion',
      corridorId: corridorId as any,
      exchangeRate: base * 0.985, // Lower rate
      fee: 18.00, // Higher fee
      deliverySpeedEn: 'Minutes (Cash Pickup)',
      deliverySpeedAr: 'دقائق (استلام نقدي)',
      transferMethods: ['cash'],
      confidenceScore: 85,
      lastUpdatedMinutesAgo: 120
    }
  ];
};

// Mock historical trend data for each corridor over the last 15 days
export const getHistoricalTrends = (corridorId: string) => {
  const base = CORRIDORS.find(c => c.id === corridorId)?.defaultExchangeRate || 10;
  const dates = [
    'Jun 09', 'Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15', 
    'Jun 16', 'Jun 17', 'Jun 18', 'Jun 19', 'Jun 20', 'Jun 21', 'Jun 22', 'Jun 23'
  ];
  
  // Create a slight wavy trend
  return dates.map((date, index) => {
    const factor = 1 + Math.sin(index * 0.6) * 0.012 + (index * 0.001);
    return {
      date,
      rate: Number((base * factor).toFixed(3)),
      bestProvider: index % 2 === 0 ? 'urpay' : 'stcpay'
    };
  });
};

// Initial crowdsourced rates
export const INITIAL_CROWDSOURCED_RATES: CrowdsourcedRate[] = [
  {
    id: 'sub-1',
    providerId: 'urpay',
    corridorId: 'PK',
    exchangeRate: 75.45,
    fee: 8.00,
    amountSar: 1000,
    recipientAmount: 74850,
    submittedBy: 'Muhammad K.',
    timestamp: '2 hours ago',
    votes: 18,
    isVerified: true
  },
  {
    id: 'sub-2',
    providerId: 'stcpay',
    corridorId: 'IN',
    exchangeRate: 22.58,
    fee: 10.00,
    amountSar: 2000,
    recipientAmount: 44934,
    submittedBy: 'Anil S.',
    timestamp: '4 hours ago',
    votes: 12,
    isVerified: true
  },
  {
    id: 'sub-3',
    providerId: 'mobilypay',
    corridorId: 'PH',
    exchangeRate: 15.82,
    fee: 9.00,
    amountSar: 1500,
    recipientAmount: 23587,
    submittedBy: 'Maria C.',
    timestamp: '5 hours ago',
    votes: 9,
    isVerified: false
  },
  {
    id: 'sub-4',
    providerId: 'urpay',
    corridorId: 'KE',
    exchangeRate: 35.35,
    fee: 8.00,
    amountSar: 500,
    recipientAmount: 17392,
    submittedBy: 'John O.',
    timestamp: 'Yesterday',
    votes: 24,
    isVerified: true
  }
];

// Initial rate alerts
export const INITIAL_ALERTS: RateAlert[] = [
  {
    id: 'alert-1',
    corridorId: 'PK',
    providerId: 'urpay',
    targetRate: 74.8,
    condition: 'above',
    contactInfo: 'hassan.g***@gmail.com',
    createdAt: '2026-06-21',
    isActive: true
  },
  {
    id: 'alert-2',
    corridorId: 'KE',
    providerId: 'all',
    targetRate: 35.0,
    condition: 'above',
    contactInfo: 'hassan.g***@gmail.com',
    createdAt: '2026-06-22',
    isActive: true
  }
];

// Default profile
export const DEFAULT_PROFILE: UserProfile = {
  name: 'Sari Expat',
  phone: '',
  preferredLanguage: 'en',
  homeCountry: 'KE',
  favoriteProviders: [],
  savingsTargetSar: 100,
  totalSavedSar: 0,
  joinedDate: 'Jun 2026'
};
