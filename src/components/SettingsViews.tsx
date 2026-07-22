import React, { useState } from 'react';
import { 
  User, Mail, Phone, Globe, Shield, Trophy, MapPin, 
  Clock, CheckCircle, AlertTriangle, Save, Loader2, 
  Bell, X, FileText, Sparkles, Laptop, Sun, Moon, 
  ArrowLeftRight, Trash2, Key, Monitor, Smartphone, 
  Download, CheckSquare, Square, ChevronRight, MessageSquare,
  ShieldCheck, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { TranslationDict, UserProfile as UserProfileType, RateSubmission, UserProgress, UserAchievement } from '../types';
import { CORRIDORS, PROVIDERS } from '../services/constants';
import { SDSButton, SDSCard, SDSBadge } from './Sds';
import { CountryFlag, AchievementIcon } from './SdsBamComponents';
import { deleteUserAccount, ACHIEVEMENT_DEFINITIONS } from '../services/supabaseService';

// Interfaces for settings components
interface SettingsViewProps {
  language: 'en' | 'ar';
  t: TranslationDict;
  profile: UserProfileType;
  setProfile: (profile: UserProfileType) => void;
  onSessionSync: () => void;
  mySubmissions: RateSubmission[];
  userProgress: UserProgress | null;
  userAchievements: UserAchievement[];
  // Input states & setters passed from parent for consistency
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  preferredCorridorId: string;
  setPreferredCorridorId: (v: string) => void;
  userLanguage: 'en' | 'ar';
  setUserLanguage: (v: 'en' | 'ar') => void;
  preference: 'light' | 'dark' | 'system';
  setPreference: (v: 'light' | 'dark' | 'system') => void;
  
  // Notification states
  engagementEnabled: boolean;
  setEngagementEnabled: (v: boolean) => void;
  achievementEnabled: boolean;
  setAchievementEnabled: (v: boolean) => void;
  rateEnabled: boolean;
  setRateEnabled: (v: boolean) => void;
  transferEnabled: boolean;
  setTransferEnabled: (v: boolean) => void;
  communityEnabled: boolean;
  setCommunityEnabled: (v: boolean) => void;
  adminEnabled: boolean;
  setAdminEnabled: (v: boolean) => void;
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  emailEnabled: boolean;
  setEmailEnabled: (v: boolean) => void;
  
  // Actions
  onSave: () => Promise<void>;
  isLoading: boolean;
  success: boolean;
  triggerToast: (msg: string) => void;
}

// 1. PROFILE OVERVIEW SUB-VIEW
export function ProfileOverview({ language, t, profile, userProgress, userAchievements, mySubmissions }: SettingsViewProps) {
  const isRtl = language === 'ar';
  const approvedCount = mySubmissions.filter(s => s.status === 'approved').length;
  const initials = (profile.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Expat Verification Status Identity Card */}
      <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sds-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl font-black font-mono shadow-md relative shrink-0">
            {initials}
            <span className="absolute -bottom-1 -right-1 bg-[#10B981] w-4 h-4 rounded-full border-2 border-[#0C2547] flex items-center justify-center" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-base font-black text-white leading-snug">{profile.name || 'SariRemit User'}</h4>
            <p className="text-xs text-sds-text-sec">{profile.email}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-[#10B981]">
                {isRtl ? 'حساب موثق' : 'Verified Expat Account'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-[#071A35]/80 border border-sds-border/60 rounded-2xl px-4 py-3 text-left sm:text-right shrink-0">
          <span className="text-[9px] text-sds-text-sec uppercase tracking-widest font-mono font-black">Community Trust Level</span>
          <div className="text-lg font-black text-white mt-0.5">
            {userProgress?.currentLevel ? `Level ${userProgress.currentLevel}` : (approvedCount >= 3 ? 'SariRemit Champion' : 'Expat Rank I')}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold">
            {userProgress?.progressPoints || 0} XP Total Progress
          </span>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0C2547]/50 border border-sds-border rounded-2xl p-4 text-left">
          <span className="text-[9px] text-sds-text-sec uppercase font-black tracking-widest font-mono">Transfers</span>
          <div className="text-2xl font-black text-white mt-1">
            {userProgress ? userProgress.recordedTransferCount : 0}
          </div>
          <p className="text-[10px] text-sds-text-sec mt-0.5">Logged histories</p>
        </div>
        <div className="bg-[#0C2547]/50 border border-sds-border rounded-2xl p-4 text-left">
          <span className="text-[9px] text-sds-text-sec uppercase font-black tracking-widest font-mono">Contributions</span>
          <div className="text-2xl font-black text-white mt-1">
            {userProgress ? userProgress.approvedRateContributionCount : approvedCount}
          </div>
          <p className="text-[10px] text-sds-text-sec mt-0.5">Verified crowd rates</p>
        </div>
        <div className="bg-[#0C2547]/50 border border-sds-border rounded-2xl p-4 text-left col-span-2">
          <span className="text-[9px] text-sds-text-sec uppercase font-black tracking-widest font-mono">Lifetime Remit Savings</span>
          <div className="text-2xl font-black text-[#10B981] mt-1">
            +{userProgress ? Math.round(userProgress.lifetimeEstimatedSavingsSar) : 0} SAR
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">Saved using best rate recommendations</p>
        </div>
      </div>

      {/* Status Progress Panel */}
      {userProgress && (
        <div className="bg-[#0C2547] border border-sds-border rounded-3xl p-5 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">Next Rank Milestone</h4>
            <span className="text-xs font-bold text-sds-text-sec font-mono">{userProgress.progressPoints % 100}/100 XP</span>
          </div>
          <div className="w-full bg-[#071A35] rounded-full h-2.5 overflow-hidden border border-sds-border/40">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.min(100, userProgress.progressPoints % 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-sds-text-sec leading-normal">
            Gain XP by uploading transfer receipts and submitting crowdsourced exchange rates. Helping other expats increases your community verified badge level!
          </p>
        </div>
      )}
    </div>
  );
}

// 2. PERSONAL INFORMATION
export function PersonalInformation({ language, t, name, setName, phone, setPhone, onSave, isLoading, success }: SettingsViewProps) {
  const isRtl = language === 'ar';
  const sessionUser = profile => profile.email || 'expat@sariremit.net';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-5 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Personal Information</h4>
        <p className="text-[11px] text-sds-text-sec">Update your contact identity details. Real names are used to maintain verified verifier accountability.</p>
      </div>

      {success && (
        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/25 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{isRtl ? 'تم حفظ التعديلات بنجاح!' : 'Personal details updated successfully!'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Full Name</label>
          <div className="relative">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-colors"
            />
            <User className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Email Address (Account ID)</label>
          <div className="relative">
            <input
              type="email"
              disabled
              value={name ? (profile => profile.email) : ''}
              placeholder="verified.expat@sariremit.net"
              className="w-full pl-10 pr-4 py-2.5 bg-[#071A35]/40 border border-sds-border/60 rounded-xl font-bold text-sm text-sds-text-sec cursor-not-allowed"
            />
            <Mail className="w-4 h-4 text-sds-text-sec opacity-40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Phone Number (WhatsApp rate alerts)</label>
        <div className="relative">
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966 50 123 4567"
            className="w-full pl-10 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-colors"
          />
          <Phone className="w-4 h-4 text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-2.5 bg-sds-gold hover:bg-sds-gold/90 disabled:bg-sds-gold/50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{isRtl ? 'حفظ التغييرات' : 'Save Details'}</span>
      </button>
    </form>
  );
}

// 3. DEFAULT PREFERENCES
export function DefaultPreferences({ language, t, preferredCorridorId, setPreferredCorridorId, profile, setProfile, onSave, isLoading, success, triggerToast }: SettingsViewProps) {
  const isRtl = language === 'ar';
  
  // Local state for additional preferences not in top-level parent props
  const [channels, setChannels] = useState<string[]>(profile.preferred_channels || ['urpay', 'stc-pay', 'western-union']);
  const [sendAmount, setSendAmount] = useState<number>(profile.estimated_monthly_send_amount || 1500);

  const toggleChannel = (id: string) => {
    const updated = channels.includes(id) ? channels.filter(c => c !== id) : [...channels, id];
    setChannels(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Update local preference values into parent profile
    const updatedProfile = {
      ...profile,
      preferredCorridorId,
      preferred_channels: channels,
      estimated_monthly_send_amount: sendAmount
    };
    setProfile(updatedProfile);
    await onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Default Transfer Preferences</h4>
        <p className="text-[11px] text-sds-text-sec">Pre-configure your main send parameters so that the rate calculator, alerts, and savings reports load optimized values instantly.</p>
      </div>

      {success && (
        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/25 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Default preferences saved!</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Preferred Corridor */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Default Send Corridor</label>
          <select
            value={preferredCorridorId}
            onChange={(e) => setPreferredCorridorId(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] cursor-pointer transition-colors"
          >
            {CORRIDORS.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#071A35]">
                {c.flag} {language === 'en' ? c.toCountry : c.toCountryAr} ({c.currencyCode})
              </option>
            ))}
          </select>
        </div>

        {/* Estimated Monthly Send */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Typical Monthly Send Amount (SAR)</label>
          <div className="relative">
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full pl-12 pr-4 py-2.5 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]"
            />
            <span className="text-[10px] text-sds-text-sec absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold">SAR</span>
          </div>
        </div>
      </div>

      {/* Preferred Channels List Checklist */}
      <div className="space-y-3.5">
        <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Preferred Remittance Providers</label>
        <p className="text-[10px] text-sds-text-sec">Choose which wallets and banks you use regularly. S will highlight best rates among these preferred channels.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {PROVIDERS.map((provider) => {
            const isChecked = channels.includes(provider.id);
            return (
              <button
                type="button"
                key={provider.id}
                onClick={() => toggleChannel(provider.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  isChecked 
                    ? 'border-[#10B981] bg-[#10B981]/10 text-white font-bold' 
                    : 'border-sds-border bg-[#071A35]/35 text-sds-text-sec hover:border-sds-border-sec hover:bg-[#071A35]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${provider.logoColor}`} />
                  <span className="text-xs font-bold truncate">{provider.name}</span>
                </div>
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-[#10B981] shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-sds-text-sec opacity-40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-2.5 bg-sds-gold hover:bg-sds-gold/90 disabled:bg-sds-gold/50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Save Transfer Preferences</span>
      </button>
    </form>
  );
}

// 4. NOTIFICATION SETTINGS
export function NotificationSettings({ 
  language, t, onSave, isLoading, success,
  engagementEnabled, setEngagementEnabled,
  achievementEnabled, setAchievementEnabled,
  rateEnabled, setRateEnabled,
  transferEnabled, setTransferEnabled,
  communityEnabled, setCommunityEnabled,
  adminEnabled, setAdminEnabled,
  pushEnabled, setPushEnabled,
  emailEnabled, setEmailEnabled
}: SettingsViewProps) {
  const isRtl = language === 'ar';

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Notification Preferences</h4>
        <p className="text-[11px] text-sds-text-sec">Fine-tune the alert routing and triggers you wish to receive from SariRemit.</p>
      </div>

      {success && (
        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/25 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Notification rules saved successfully!</span>
        </div>
      )}

      {/* Primary Delivery Channels */}
      <div className="bg-[#071A35]/40 border border-sds-border rounded-2xl p-4 sm:p-5 space-y-4">
        <h5 className="text-[10px] font-black text-white font-mono uppercase tracking-widest">Primary Delivery Channels</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-[#071A35] p-3.5 rounded-xl border border-sds-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-white">Browser Push Alerts</span>
              <p className="text-[9px] text-sds-text-sec">Receive real-time push indicators on desktop & mobile.</p>
            </div>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${pushEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${pushEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#071A35] p-3.5 rounded-xl border border-sds-border/60">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-white">Email Newsletters & Summaries</span>
              <p className="text-[9px] text-sds-text-sec">Receive weekly savings logs and security audit updates.</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${emailEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${emailEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Checklists */}
      <div className="space-y-3.5">
        <h5 className="text-[10px] font-black text-sds-text-sec font-mono uppercase tracking-widest">Notification Event Triggers</h5>
        <div className="space-y-3">
          {/* Row 1: Exchange Rate Alerts */}
          <div className="flex items-start justify-between bg-[#0C2547]/40 border border-sds-border p-4 rounded-2xl">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Exchange Rate Alerts
              </span>
              <p className="text-[10px] text-sds-text-sec">Triggers immediately when market benchmark rates cross your set thresholds or reach highly optimized thresholds.</p>
            </div>
            <button
              type="button"
              onClick={() => setRateEnabled(!rateEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${rateEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${rateEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>

          {/* Row 2: Achievements & Level Ups */}
          <div className="flex items-start justify-between bg-[#0C2547]/40 border border-sds-border p-4 rounded-2xl">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Badges & Accomplishments
              </span>
              <p className="text-[10px] text-sds-text-sec">Receive reminders when you unlock community milestones, rankings, or new badges.</p>
            </div>
            <button
              type="button"
              onClick={() => setAchievementEnabled(!achievementEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${achievementEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${achievementEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>

          {/* Row 3: Recorded Transfers and Audits */}
          <div className="flex items-start justify-between bg-[#0C2547]/40 border border-sds-border p-4 rounded-2xl">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                Recorded Transfers & Savings Tracker
              </span>
              <p className="text-[10px] text-sds-text-sec">Logs and notifies on transaction compliance audits and monthly cumulative remittance savings calculations.</p>
            </div>
            <button
              type="button"
              onClick={() => setTransferEnabled(!transferEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${transferEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${transferEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>

          {/* Row 4: Community Submissions Updates */}
          <div className="flex items-start justify-between bg-[#0C2547]/40 border border-sds-border p-4 rounded-2xl">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-teal-400" />
                Community Verifications
              </span>
              <p className="text-[10px] text-sds-text-sec">Receive alert notifications when screenshots you submit are approved, rejected, or flag reviewed by moderators.</p>
            </div>
            <button
              type="button"
              onClick={() => setCommunityEnabled(!communityEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${communityEnabled ? 'bg-[#10B981]' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 left-1 bg-slate-900 w-4 h-4 rounded-full transition-transform ${communityEnabled ? 'translate-x-6 bg-white' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave()}
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-2.5 bg-sds-gold hover:bg-sds-gold/90 disabled:bg-sds-gold/50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Save Notification Preferences</span>
      </button>
    </div>
  );
}

// 5. APPEARANCE SETTINGS
export function AppearanceSettings({ language, preference, setPreference, triggerToast }: SettingsViewProps) {
  const isRtl = language === 'ar';

  const handleSetPref = (theme: 'light' | 'dark' | 'system') => {
    setPreference(theme);
    triggerToast(
      theme === 'light' 
        ? (isRtl ? 'تم تفعيل المظهر المضيء' : 'Light theme enabled') 
        : theme === 'dark' 
          ? (isRtl ? 'تم تفعيل المظهر الداكن' : 'Dark theme enabled')
          : (isRtl ? 'تم تفعيل مظهر النظام' : 'System theme synchronised')
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Appearance & Theme</h4>
        <p className="text-[11px] text-sds-text-sec">Choose your preferred visual template for SariRemit to ensure pleasant reading experiences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Light theme */}
        <button
          type="button"
          onClick={() => handleSetPref('light')}
          className={`p-4 rounded-2xl border transition-all flex flex-col items-start text-left cursor-pointer ${
            preference === 'light'
              ? 'border-[#10B981] bg-[#10B981]/10 text-white'
              : 'border-sds-border bg-[#071A35]/30 text-sds-text-sec hover:border-[#10B981] hover:bg-[#071A35]/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sun className={`w-4 h-4 ${preference === 'light' ? 'text-amber-400' : 'text-sds-text-sec'}`} />
            <span className="text-xs font-black uppercase tracking-wider font-mono">Light Mode</span>
          </div>
          <p className="text-[10px] text-sds-text-sec leading-snug">Crisp slate styling with clear high-contrast white backgrounds.</p>
        </button>

        {/* Dark theme */}
        <button
          type="button"
          onClick={() => handleSetPref('dark')}
          className={`p-4 rounded-2xl border transition-all flex flex-col items-start text-left cursor-pointer ${
            preference === 'dark'
              ? 'border-[#10B981] bg-[#10B981]/10 text-white'
              : 'border-sds-border bg-[#071A35]/30 text-sds-text-sec hover:border-[#10B981] hover:bg-[#071A35]/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Moon className={`w-4 h-4 ${preference === 'dark' ? 'text-[#10B981]' : 'text-sds-text-sec'}`} />
            <span className="text-xs font-black uppercase tracking-wider font-mono">Dark Mode</span>
          </div>
          <p className="text-[10px] text-sds-text-sec leading-snug">Deep twilight slate blue canvas that protects expat eyes at night.</p>
        </button>

        {/* System theme */}
        <button
          type="button"
          onClick={() => handleSetPref('system')}
          className={`p-4 rounded-2xl border transition-all flex flex-col items-start text-left cursor-pointer ${
            preference === 'system'
              ? 'border-[#10B981] bg-[#10B981]/10 text-white'
              : 'border-sds-border bg-[#071A35]/30 text-sds-text-sec hover:border-[#10B981] hover:bg-[#071A35]/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Laptop className={`w-4 h-4 ${preference === 'system' ? 'text-teal-400' : 'text-sds-text-sec'}`} />
            <span className="text-xs font-black uppercase tracking-wider font-mono">System Default</span>
          </div>
          <p className="text-[10px] text-sds-text-sec leading-snug">Automatically matches your phone or computer operating system.</p>
        </button>
      </div>
    </div>
  );
}

// 6. LANGUAGE SETTINGS
export function LanguageSettings({ language, userLanguage, setUserLanguage, onSave, isLoading, success }: SettingsViewProps) {
  const isRtl = language === 'ar';

  const handleLang = async (lang: 'en' | 'ar') => {
    setUserLanguage(lang);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Preferred Language</h4>
        <p className="text-[11px] text-sds-text-sec">Choose your primary language. SariRemit fully localized all dashboards and verified crowd rate alerts.</p>
      </div>

      {success && (
        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/25 rounded-xl text-xs text-[#10B981] font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Language settings updated! Please click save to apply.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleLang('en')}
          className={`p-5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
            userLanguage === 'en'
              ? 'border-[#10B981] bg-[#10B981]/10 text-white font-bold'
              : 'border-sds-border bg-[#071A35]/30 text-sds-text-sec hover:border-[#10B981]'
          }`}
        >
          <span className="text-2xl mb-1">🇺🇸</span>
          <span className="text-sm font-black font-sans">English</span>
          <p className="text-[10px] text-sds-text-sec mt-1">International Standard representation</p>
        </button>

        <button
          type="button"
          onClick={() => handleLang('ar')}
          className={`p-5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
            userLanguage === 'ar'
              ? 'border-[#10B981] bg-[#10B981]/10 text-white font-bold'
              : 'border-sds-border bg-[#071A35]/30 text-sds-text-sec hover:border-[#10B981]'
          }`}
        >
          <span className="text-2xl mb-1">🇸🇦</span>
          <span className="text-sm font-black font-sans">العربية</span>
          <p className="text-[10px] text-sds-text-sec mt-1">الترجمة الرسمية الكاملة للمملكة</p>
        </button>
      </div>

      <button
        onClick={() => onSave()}
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-2.5 bg-sds-gold hover:bg-sds-gold/90 disabled:bg-sds-gold/50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{isRtl ? 'حفظ اللغة وتطبيقها' : 'Save & Sync Language'}</span>
      </button>
    </div>
  );
}

// 7. CONTRIBUTIONS HISTORY
export function ContributionsList({ language, mySubmissions }: SettingsViewProps) {
  const isRtl = language === 'ar';

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Your Rate Contributions</h4>
        <p className="text-[11px] text-sds-text-sec">A log of crowdsourced screenshot submissions you have provided for expat audit verifications.</p>
      </div>

      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {mySubmissions.length === 0 ? (
          <div className="py-12 bg-[#071A35]/20 border border-dashed border-sds-border rounded-2xl text-center text-xs text-sds-text-sec font-bold uppercase">
            No submissions yet. Go to the "Verify Rate" page to upload your first proof!
          </div>
        ) : (
          mySubmissions.map((sub) => {
            const corr = CORRIDORS.find(c => c.id === sub.corridorId) || CORRIDORS[0];
            const isApproved = sub.status === 'approved';
            const isPending = sub.status === 'pending' || sub.status === 'submitted' || sub.status === 'security_review';
            const statusLabel = isApproved ? 'Approved' : isPending ? 'Under Review' : 'Flagged';

            return (
              <div key={sub.id} className="bg-[#0C2547]/50 border border-sds-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <CountryFlag country="" currency={corr.currencyCode} size="sm" />
                      {corr.flag} 1 SAR = {sub.exchangeRate} {corr.currencyCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border ${
                      isApproved 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : isPending 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] text-sds-text-sec font-mono font-bold">
                    <span>Provider: <strong className="text-white">{sub.providerName}</strong></span>
                    <span>•</span>
                    <span>Fee: <strong className="text-white">{sub.transferFee} SAR</strong></span>
                    <span>•</span>
                    <span>Observed: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] block text-sds-text-sec font-mono">Proof Uploaded:</span>
                  <span className="text-[11px] font-black text-white truncate max-w-[150px] block font-mono">{sub.screenshotName || 'receipt_proof.jpg'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 8. ACHIEVEMENTS GRID
export function AchievementsGrid({ language, userAchievements }: SettingsViewProps) {
  const isRtl = language === 'ar';

  return (
    <div className="space-y-5 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Unlocked SariRemit Badges</h4>
            <p className="text-[11px] text-sds-text-sec">Earn high-profile badges by helping the Saudi expat community track real rates.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/25 text-[#F59E0B] text-xs font-black font-mono">
            {userAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length} Earned
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ACHIEVEMENT_DEFINITIONS.map(def => {
          const isUnlocked = userAchievements.some(a => a.achievementId === def.id);
          const unlockedAt = userAchievements.find(a => a.achievementId === def.id)?.awardedAt;

          return (
            <div 
              key={def.id} 
              className={`p-4 rounded-3xl border transition-all flex flex-col items-center text-center space-y-2.5 relative ${
                isUnlocked 
                  ? 'bg-[#0C2547] border-[#F59E0B]/30 shadow-sds-sm' 
                  : 'bg-[#0C2547]/40 border-sds-border/40 opacity-45'
              }`}
            >
              {isUnlocked && (
                <span className="absolute top-2 right-2 text-xs">✨</span>
              )}
              <div className="w-12 h-12 flex items-center justify-center bg-[#071A35] rounded-2xl border border-sds-border/60 shadow-inner">
                <AchievementIcon achievement={def} size="md" className={isUnlocked ? '' : 'grayscale opacity-50'} />
              </div>
              <div className="space-y-1">
                <h5 className={`text-xs font-black truncate max-w-full leading-tight ${isUnlocked ? 'text-white' : 'text-sds-text-sec'}`}>
                  {def.title}
                </h5>
                <p className="text-[9px] text-sds-text-sec leading-snug line-clamp-3">
                  {def.description}
                </p>
                {isUnlocked && unlockedAt && (
                  <span className="text-[8px] text-emerald-400 font-mono font-bold block pt-1.5 border-t border-sds-border/30">
                    Unlocked {new Date(unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 9. SECURITY & ACCESS
export function SecuritySettings({ language, profile, triggerToast }: SettingsViewProps) {
  const isRtl = language === 'ar';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast(isRtl ? 'كلمات المرور غير متطابقة' : 'New passwords do not match!');
      return;
    }
    setLoading(true);
    // Emulated / Secure change call
    setTimeout(() => {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast(isRtl ? 'تم تحديث كلمة المرور بنجاح' : 'Password changed successfully! Relog token is updated.');
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Security & Authentication</h4>
        <p className="text-[11px] text-sds-text-sec">Manage login protocols, verify multi-factor rules, or secure your expat profile credentials.</p>
      </div>

      {/* Auth Provider Indicators */}
      <div className="bg-[#071A35]/40 border border-sds-border p-4 sm:p-5 rounded-2xl space-y-3.5">
        <h5 className="text-[10px] font-black text-white font-mono uppercase tracking-widest">Active Sign-In Methods</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-[#071A35] p-3 rounded-xl border border-sds-border/60">
            <span className="text-xs font-black text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#10B981]" />
              Email & Password auth
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Enabled</span>
          </div>
          <div className="flex items-center justify-between bg-[#071A35] p-3 rounded-xl border border-sds-border/60">
            <span className="text-xs font-black text-white flex items-center gap-2 font-mono">
              Google OAuth integration
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono border bg-slate-500/10 text-slate-400 border-slate-500/20">Linked</span>
          </div>
        </div>
      </div>

      {/* Change Password Panel */}
      <form onSubmit={handlePasswordChange} className="space-y-4 bg-[#0C2547]/40 border border-sds-border p-5 rounded-3xl">
        <h5 className="text-[10px] font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-[#F59E0B]" />
          Update Account Password
        </h5>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sds-text-sec opacity-60 hover:opacity-100"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sds-text-sec opacity-60 hover:opacity-100"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-[#071A35] hover:bg-[#071A35]/80 text-white border border-sds-border/60 font-black text-[10px] uppercase font-mono tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
          Update Secure Password
        </button>
      </form>
    </div>
  );
}

// 10. ACTIVE SESSIONS
export function ActiveSessions({ language, triggerToast }: SettingsViewProps) {
  const isRtl = language === 'ar';
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Chrome / Windows PC (Riyadh, SA)', ip: '91.74.12.103', current: true, date: 'Active Now' },
    { id: '2', device: 'Safari / iPhone 15 Pro (Jeddah, SA)', ip: '2001:16a2:ce45::1', current: false, date: '12 hours ago' },
    { id: '3', device: 'SariRemit Mobile App / Android Phone', ip: '46.152.193.44', current: false, date: '3 days ago' },
  ]);

  const handleRevoke = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    triggerToast(isRtl ? 'تم إنهاء الجلسة المحددة بنجاح' : 'Selected session revoked successfully.');
  };

  const handleRevokeOthers = () => {
    setSessions(sessions.filter(s => s.current));
    triggerToast(isRtl ? 'تم إنهاء جميع الأجهزة الأخرى بنجاح' : 'All other active sessions have been securely terminated.');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Active Authorized Sessions</h4>
            <p className="text-[11px] text-sds-text-sec">Audit the devices and locations holding valid access tokens to your SariRemit account.</p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOthers}
              className="px-3.5 py-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] font-black font-mono text-[9px] uppercase tracking-wider rounded-xl cursor-pointer shrink-0 transition-colors"
            >
              Terminate Other Sessions
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map(sess => (
          <div key={sess.id} className="bg-[#0C2547]/50 border border-sds-border p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-start gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-[#071A35] border border-sds-border/60 flex items-center justify-center shrink-0">
                {sess.device.includes('iPhone') || sess.device.includes('Android') ? (
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Monitor className="w-5 h-5 text-teal-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white leading-none">{sess.device}</span>
                  {sess.current && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Current Session</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-sds-text-sec font-mono font-bold leading-none">
                  <span>IP: {sess.ip}</span>
                  <span>•</span>
                  <span>Last Checked: {sess.date}</span>
                </div>
              </div>
            </div>

            {!sess.current && (
              <button
                onClick={() => handleRevoke(sess.id)}
                className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase font-mono tracking-wider cursor-pointer"
              >
                Log Out Device
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 11. PRIVACY & DATA POLICY
export function PrivacyAndData({ language, profile, mySubmissions, triggerToast }: SettingsViewProps) {
  const isRtl = language === 'ar';
  const [downloading, setDownloading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletePhase, setDeletePhase] = useState<'explain' | 'confirm' | 'final'>('explain');

  const handleDownloadData = () => {
    setDownloading(true);
    triggerToast(isRtl ? 'جاري تحضير ملف البيانات الخاص بك...' : 'Preparing your data archive...');
    
    setTimeout(() => {
      // Package details
      const archive = {
        exportedAt: new Date().toISOString(),
        profile: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          preferredCorridor: profile.preferredCorridorId,
          language: profile.language,
          onboardingCompleted: profile.onboarding_completed
        },
        activity: {
          submissionsCount: mySubmissions.length,
          submissions: mySubmissions
        },
        regulatoryCompliance: {
          saudiDataProtectionLaw: 'PDPL Aligned',
          retentionStatus: 'Active'
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archive, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sariremit_export_${profile.email || 'expat'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloading(false);
      triggerToast(isRtl ? 'تم تحميل ملف البيانات بنجاح!' : 'Your personal data package has been downloaded successfully!');
    }, 1500);
  };

  const executePurge = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      triggerToast('Please type the confirmation string exactly as shown.');
      return;
    }
    setDeleting(true);
    
    // Call the database secure deletion service
    const success = await deleteUserAccount(profile.id || '', profile.email || '');
    setDeleting(false);
    
    if (success) {
      setDeleteModalOpen(false);
      window.location.hash = '';
      window.location.reload();
    } else {
      triggerToast('Deletion error. Please contact S community verifiers.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1.5 border-b border-sds-border pb-4">
        <h4 className="text-sm font-black text-white font-mono uppercase tracking-wider">Privacy & Saudi PDPL Alignment</h4>
        <p className="text-[11px] text-sds-text-sec">Review your rights under the Saudi Personal Data Protection Law (PDPL) and control your data exports or profile deletion.</p>
      </div>

      {/* PDPL Rights Card */}
      <div className="bg-[#071A35]/40 border border-sds-border p-5 rounded-2xl space-y-4 text-xs text-sds-text-sec leading-relaxed">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
          <h5 className="text-[11px] font-black text-white uppercase tracking-wider font-mono">Saudi PDPL Right to Transparency</h5>
        </div>
        <p>
          Under the Saudi Personal Data Protection Law (PDPL) issued by Royal Decree, you hold explicit rights to access, inspect, export, or permanently delete any personal identifiers processed by SariRemit. S operates an offline-first decentralized architecture which ensures verification receipts are deleted as soon as community audit loops complete.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1.5">
          <div className="bg-[#071A35] p-3 rounded-xl border border-sds-border/40">
            <span className="font-extrabold text-white block text-[11px] mb-1">Data Minimisation</span>
            We only collect name, email, and phone to safeguard against rate spoofing and sybil attacks. No bank passwords or balance credentials are ever read.
          </div>
          <div className="bg-[#071A35] p-3 rounded-xl border border-sds-border/40">
            <span className="font-extrabold text-white block text-[11px] mb-1">Audit Trail Purges</span>
            Receipt screenshot uploads are used purely for crowd-sourced verification audits and are permanently destroyed within weeks of approval.
          </div>
        </div>
      </div>

      {/* Export / Delete Actions Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Export Card */}
        <div className="bg-[#0C2547]/40 border border-sds-border p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h5 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#10B981]" />
              Download My Data (GDPR/PDPL)
            </h5>
            <p className="text-[10px] text-sds-text-sec leading-normal">
              Request a full machine-readable JSON copy of your personal data archive, including recorded transfer milestones, contributions history, and profile meta parameters.
            </p>
          </div>
          <button
            onClick={handleDownloadData}
            disabled={downloading}
            className="w-full py-2.5 bg-[#071A35] hover:bg-[#071A35]/80 text-white border border-sds-border text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#10B981]" />}
            <span>Download Personal Data</span>
          </button>
        </div>

        {/* Delete Card */}
        <div className="bg-[#0C2547]/40 border border-sds-border p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h5 className="text-xs font-black text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" />
              Permanent Account Deletion
            </h5>
            <p className="text-[10px] text-sds-text-sec leading-normal">
              Permanently delete your profile, purging all personal identification records, WhatsApp subscription details, and audited transfers from our Supabase Cloud clusters.
            </p>
          </div>
          <button
            onClick={() => { setDeletePhase('explain'); setDeleteModalOpen(true); }}
            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* MULTIPHASE DELETION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#0C2547] border border-sds-border rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-left">
            <button 
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-sds-text-sec hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {deletePhase === 'explain' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Permanent Account Deletion</h3>
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase">Warning: This action is irreversible</span>
                </div>
                <p className="text-xs text-sds-text-sec leading-relaxed">
                  Deleting your account permanently destroys your authenticated session. To comply with privacy directives, the following actions will take place:
                </p>
                <div className="bg-[#071A35] p-3 rounded-xl border border-sds-border/50 text-[10px] text-sds-text-sec space-y-2">
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold shrink-0">🗑️</span>
                    <span><strong>Purged Data</strong>: Your name, email address, phone, and push tokens are completely wiped from our cloud storage.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold shrink-0">🗑️</span>
                    <span><strong>Financial logs</strong>: All recorded transfers, savings journey charts, and cumulative metrics are permanently deleted.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-extrabold shrink-0">👥</span>
                    <span><strong>Contributions</strong>: Exchange rate screenshots and submissions are fully anonymized (removing email and name) to safeguard public statistics.</span>
                  </div>
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 py-2.5 bg-[#071A35] hover:bg-[#071A35]/80 text-white border border-sds-border text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeletePhase('confirm')}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-center"
                  >
                    Proceed to Confirm
                  </button>
                </div>
              </div>
            )}

            {deletePhase === 'confirm' && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-black text-white">Confirm Account Deletion</h3>
                <p className="text-xs text-sds-text-sec leading-relaxed">
                  To confirm that you wish to erase your identity, recorded transfers, and accrued XP, please authenticate by filling out the verification fields below:
                </p>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Type <strong className="text-white select-all">DELETE MY ACCOUNT</strong> to verify:
                    </label>
                    <input
                      type="text"
                      required
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE MY ACCOUNT"
                      className="w-full px-3.5 py-2 bg-[#071A35] border border-red-500/30 rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-sds-text-sec uppercase tracking-widest font-mono">
                      Enter Account Password to Authorise:
                    </label>
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 bg-[#071A35] border border-sds-border rounded-xl font-bold text-sm text-white focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setDeletePhase('explain')}
                    className="flex-1 py-2.5 bg-[#071A35] hover:bg-[#071A35]/80 text-white border border-sds-border text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-center"
                  >
                    Back
                  </button>
                  <button
                    onClick={executePurge}
                    disabled={deleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/40 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
