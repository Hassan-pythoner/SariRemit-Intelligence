import { Corridor, Provider, RemittanceRate, RateSubmission, RateAlert, UserProfile } from '../types';
import { getRemittanceChannelsSync, getChannelCoverageSync } from './supabaseService';
import { PROVIDERS, CORRIDORS } from './constants';

export { PROVIDERS, CORRIDORS };

// Helper to generate dynamic rates that look extremely realistic and fluctuate based on provider profile
export function getRemittanceRates(corridorId: string, sendAmount: number): RemittanceRate[] {
  const corridor = CORRIDORS.find(c => c.id === corridorId);
  if (!corridor) return [];

  const activeChannels = getRemittanceChannelsSync().filter(ch => 
    ch.status === 'active' && ch.supportedCorridors?.includes(corridorId)
  );

  return activeChannels.map((ch) => {
    const coverage = getChannelCoverageSync(ch.id, corridorId);

    let resolvedRate = corridor.baseExchangeRate;
    let transferFee = (coverage && coverage.custom_transfer_fee !== null && coverage.custom_transfer_fee !== undefined)
      ? coverage.custom_transfer_fee
      : (ch.defaultTransferFee !== null && ch.defaultTransferFee !== undefined ? ch.defaultTransferFee : corridor.typicalFee);

    let rateModifier = 1.0;
    switch (ch.providerCode) {
      case 'stc-pay': rateModifier = 1.006; break;
      case 'urpay': rateModifier = 1.004; break;
      case 'mobily-pay': rateModifier = 1.002; break;
      case 'enjaz': rateModifier = 0.998; break;
      case 'quickpay': rateModifier = 0.995; break;
      case 'western-union': rateModifier = 0.991; break;
      case 'al-rajhi-tahweel': rateModifier = 1.001; break;
      default:
        rateModifier = ch.category === 'wallet' ? 1.003 : 1.000;
        break;
    }

    const calculatedRate = parseFloat((corridor.baseExchangeRate * rateModifier).toFixed(4));
    
    // speed
    let speed = '1-2 Hours';
    let speedAr = 'خلال ١-٢ ساعة';
    if (ch.category === 'wallet') {
      speed = 'Instant to Wallet';
      speedAr = 'فوري للمحفظة';
    } else if (ch.category === 'bank') {
      speed = 'Same Day';
      speedAr = 'في نفس اليوم';
    }

    const supportedMethods = coverage?.supported_transfer_methods || ch.supportedTransferMethods || [];
    const method = (supportedMethods[0] || 'Bank Transfer').toLowerCase().includes('wallet') ? 'wallet' : 'bank';

    let confidence = 90;
    if (ch.providerCode === 'stc-pay' || ch.providerCode === 'urpay') confidence = 98;
    else if (ch.providerCode === 'western-union') confidence = 92;

    return {
      id: `${ch.id}-${corridor.id}`,
      providerId: ch.id,
      providerName: ch.displayName || ch.providerName,
      corridorId: corridor.id,
      exchangeRate: calculatedRate,
      transferFee: transferFee,
      deliverySpeed: speed,
      deliverySpeedAr: speedAr,
      transferMethod: method as any,
      confidenceScore: confidence,
      lastUpdated: new Date().toISOString(),
      isPartner: ch.providerCode === 'stc-pay' || ch.providerCode === 'urpay'
    };
  });
}

// LocalStorage Keys
const SUBMISSIONS_KEY = 'sariremit_submissions';
const ALERTS_KEY = 'sariremit_alerts';
const USER_KEY = 'sariremit_user';

// Mock DB Initial Data Load and Getters
export function getSubmissions(): RateSubmission[] {
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  if (!data) {
    const initial: RateSubmission[] = [
      {
        id: 'sub-1',
        providerId: 'stc-pay',
        providerName: 'STC Pay / STC Bank',
        corridorId: 'sa-pk',
        exchangeRate: 74.82,
        transferFee: 10,
        sendAmount: 1000,
        receiveAmount: 74820,
        submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
        screenshotName: 'stc_pay_screenshot.png',
        status: 'approved'
      },
      {
        id: 'sub-2',
        providerId: 'urpay',
        providerName: 'Urpay',
        corridorId: 'sa-in',
        exchangeRate: 22.34,
        transferFee: 12,
        sendAmount: 2000,
        receiveAmount: 44680,
        submittedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hrs ago
        screenshotName: 'urpay_receipt.jpg',
        status: 'approved'
      },
      {
        id: 'sub-3',
        providerId: 'mobily-pay',
        providerName: 'Mobily Pay',
        corridorId: 'sa-ph',
        exchangeRate: 15.22,
        transferFee: 8,
        sendAmount: 1500,
        receiveAmount: 22830,
        submittedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hrs ago
        status: 'pending'
      }
    ];
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveSubmission(submission: Omit<RateSubmission, 'id' | 'submittedAt' | 'status'>): RateSubmission {
  const current = getSubmissions();
  const newSub: RateSubmission = {
    ...submission,
    id: `sub-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    status: 'pending' // Admin approvals mock
  };
  const updated = [newSub, ...current];
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updated));
  return newSub;
}

export function getAlerts(): RateAlert[] {
  const data = localStorage.getItem(ALERTS_KEY);
  if (!data) {
    const initial: RateAlert[] = [
      {
        id: 'alert-1',
        corridorId: 'sa-pk',
        targetRate: 75.0,
        providerId: 'stc-pay',
        type: 'above',
        channel: 'whatsapp',
        active: true,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'alert-2',
        corridorId: 'sa-in',
        targetRate: 22.4,
        type: 'above',
        channel: 'sms',
        active: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ];
    localStorage.setItem(ALERTS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveAlert(alert: Omit<RateAlert, 'id' | 'createdAt' | 'active'>): RateAlert {
  const current = getAlerts();
  const newAlert: RateAlert = {
    ...alert,
    id: `alert-${Date.now()}`,
    active: true,
    createdAt: new Date().toISOString()
  };
  const updated = [newAlert, ...current];
  localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  return newAlert;
}

export function toggleAlert(alertId: string): RateAlert[] {
  const current = getAlerts();
  const updated = current.map(alert => 
    alert.id === alertId ? { ...alert, active: !alert.active } : alert
  );
  localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteAlert(alertId: string): RateAlert[] {
  const current = getAlerts();
  const updated = current.filter(alert => alert.id !== alertId);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
  return updated;
}

export function getUserProfile(): UserProfile {
  const data = localStorage.getItem(USER_KEY);
  if (!data) {
    const initial: UserProfile = {
      name: "Ahmed Hassan",
      email: "ahmed.hassan@saudi-expats.com",
      phone: "+966 50 123 4567",
      preferredCorridorId: "sa-pk",
      language: "en"
    };
    localStorage.setItem(USER_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
}
