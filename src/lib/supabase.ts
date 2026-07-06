import { createClient } from '@supabase/supabase-js';
import { AdminRateOverride, CrowdsourcedRate, UserProfile } from '../types';

// Read Supabase environment variables safely
const rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

function validateConfig(url: string, key: string): { url: string; key: string; valid: boolean } {
  const u = typeof url === 'string' ? url.trim().replace(/['"]/g, '') : '';
  const k = typeof key === 'string' ? key.trim().replace(/['"]/g, '') : '';
  
  if (!u || !k) return { url: '', key: '', valid: false };
  if (u === 'undefined' || k === 'undefined') return { url: '', key: '', valid: false };
  if (u === 'null' || k === 'null') return { url: '', key: '', valid: false };
  if (u.includes('xxxx') || u.includes('placeholder') || u.includes('your-')) return { url: '', key: '', valid: false };
  if (k.includes('xxxx') || k.includes('placeholder') || k.includes('your-')) return { url: '', key: '', valid: false };
  if (!u.startsWith('http://') && !u.startsWith('https://')) return { url: '', key: '', valid: false };
  
  return { url: u, key: k, valid: true };
}

const config = validateConfig(rawSupabaseUrl, rawSupabaseAnonKey);

// Initialize Supabase Client dynamically based on credentials
export const supabase = config.valid ? createClient(config.url, config.key) : null;

if (supabase) {
  console.log('✅ Supabase integration is active. Connected to Supabase Cloud Database.');
} else {
  console.log('ℹ️ Supabase integration is currently in offline-first / local fallback mode.');
}

// ==========================================
// DB Table Initializer Script (SQL)
// This can be executed directly in the Supabase SQL editor:
/*
-- 1. Table for Admin Rate Overrides
CREATE TABLE IF NOT EXISTS admin_overrides (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  transfer_partner TEXT,
  corridor TEXT NOT NULL,
  send_amount_min NUMERIC NOT NULL,
  send_amount_max NUMERIC NOT NULL,
  receive_method TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  transfer_fee NUMERIC NOT NULL,
  vat_amount NUMERIC NOT NULL,
  additional_charges NUMERIC NOT NULL,
  total_cost NUMERIC,
  start_date TEXT,
  end_date TEXT,
  override_reason TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Table for Crowdsourced Rates
CREATE TABLE IF NOT EXISTS crowdsourced_rates (
  id TEXT PRIMARY KEY,
  corridor_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  amount_sar NUMERIC NOT NULL,
  recipient_amount NUMERIC NOT NULL,
  submitted_by TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  votes INTEGER DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Table for App Configurations (Key-Value)
CREATE TABLE IF NOT EXISTS app_config (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Table for User Profiles (Custom User Data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  home_country TEXT,
  favorite_providers TEXT[], -- array of text
  savings_target_sar NUMERIC DEFAULT 100,
  total_saved_sar NUMERIC DEFAULT 0,
  joined_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Disable Row Level Security (RLS) so client can query/insert directly
-- (Or create custom RLS policies for read/write permissions)
ALTER TABLE admin_overrides DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdsourced_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, home_country, joined_date, preferred_language)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Sari Expat'),
    COALESCE(new.raw_user_meta_data->>'home_country', 'KE'),
    timezone('utc'::text, now())::text,
    'en'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
// ==========================================

// --- Helper Functions for Admin Overrides ---

export async function getSupabaseOverrides(): Promise<AdminRateOverride[] | null> {
  if (!supabase) return null;
  try {
    let result = await supabase
      .from('admin_rate_overrides')
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) {
      // Fallback to legacy or alternate name
      result = await supabase
        .from('admin_overrides')
        .select('*')
        .order('created_at', { ascending: false });
    }

    if (result.error) throw result.error;
    const data = result.data;
    
    return (data || []).map(o => ({
      id: o.id,
      providerId: o.provider_id,
      providerName: o.provider_name,
      transferPartner: o.transfer_partner,
      corridor: o.corridor,
      sendAmountMin: Number(o.send_amount_min),
      sendAmountMax: Number(o.send_amount_max),
      receiveMethod: o.receive_method,
      exchangeRate: Number(o.exchange_rate),
      transferFee: Number(o.transfer_fee),
      vatAmount: Number(o.vat_amount),
      additionalCharges: Number(o.additional_charges),
      totalCost: o.total_cost ? Number(o.total_cost) : undefined,
      startDate: o.start_date || undefined,
      endDate: o.end_date || undefined,
      overrideReason: o.override_reason,
      active: o.active,
      createdBy: o.created_by || 'Admin',
      createdAt: o.created_at,
      updatedAt: o.updated_at
    }));
  } catch (err) {
    console.warn('Supabase getSupabaseOverrides error:', err);
    return null;
  }
}

export async function upsertSupabaseOverride(override: AdminRateOverride): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbRow = {
      id: override.id,
      provider_id: override.providerId,
      provider_name: override.providerName,
      transfer_partner: override.transferPartner || null,
      corridor: override.corridor,
      send_amount_min: override.sendAmountMin,
      send_amount_max: override.sendAmountMax,
      receive_method: override.receiveMethod,
      exchange_rate: override.exchangeRate,
      transfer_fee: override.transferFee,
      vat_amount: override.vatAmount,
      additional_charges: override.additionalCharges,
      total_cost: override.totalCost || null,
      start_date: override.startDate || null,
      end_date: override.endDate || null,
      override_reason: override.overrideReason,
      active: override.active,
      created_by: override.createdBy,
      updated_at: new Date().toISOString()
    };

    let result = await supabase
      .from('admin_rate_overrides')
      .upsert(dbRow, { onConflict: 'id' });

    if (result.error) {
      result = await supabase
        .from('admin_overrides')
        .upsert(dbRow, { onConflict: 'id' });
    }

    if (result.error) throw result.error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertSupabaseOverride error:', err);
    return false;
  }
}

export async function deleteSupabaseOverride(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    let result = await supabase
      .from('admin_rate_overrides')
      .delete()
      .eq('id', id);

    if (result.error) {
      result = await supabase
        .from('admin_overrides')
        .delete()
        .eq('id', id);
    }

    if (result.error) throw result.error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteSupabaseOverride error:', err);
    return false;
  }
}

// --- Helper Functions for Crowdsourced Rates ---

export async function getSupabaseCrowdsourcedRates(): Promise<CrowdsourcedRate[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('crowdsourced_rates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      corridorId: r.corridor_id as any,
      providerId: r.provider_id as any,
      exchangeRate: Number(r.exchange_rate),
      fee: Number(r.fee),
      amountSar: Number(r.amount_sar || 1000),
      recipientAmount: Number(r.recipient_amount),
      submittedBy: r.submitted_by,
      timestamp: r.timestamp,
      votes: r.votes,
      isVerified: r.is_verified
    }));
  } catch (err) {
    console.warn('Supabase getSupabaseCrowdsourcedRates error:', err);
    return null;
  }
}

export async function upsertSupabaseCrowdsourcedRate(rate: CrowdsourcedRate): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbRow = {
      id: rate.id,
      corridor_id: rate.corridorId,
      provider_id: rate.providerId,
      exchange_rate: rate.exchangeRate,
      fee: rate.fee,
      amount_sar: rate.amountSar,
      recipient_amount: rate.recipientAmount,
      submitted_by: rate.submittedBy,
      timestamp: rate.timestamp,
      votes: rate.votes,
      is_verified: rate.isVerified
    };

    const { error } = await supabase
      .from('crowdsourced_rates')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertSupabaseCrowdsourcedRate error:', err);
    return false;
  }
}

export async function upvoteSupabaseCrowdsourcedRate(id: string, currentVotes: number): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('crowdsourced_rates')
      .update({ votes: currentVotes + 1 })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upvoteSupabaseCrowdsourcedRate error:', err);
    return false;
  }
}

// --- Helper Functions for App Settings and Configuration ---

export async function getSupabaseConfig(key: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return null gracefully
        return null;
      }
      throw error;
    }
    return data?.value || null;
  } catch (err) {
    console.warn(`Supabase getSupabaseConfig for ${key} error:`, err);
    return null;
  }
}

export async function setSupabaseConfig(key: string, value: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn(`Supabase setSupabaseConfig for ${key} error:`, err);
    return false;
  }
}

export async function deleteSupabaseConfig(key: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('app_config')
      .delete()
      .eq('key', key);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn(`Supabase deleteSupabaseConfig for ${key} error:`, err);
    return false;
  }
}

// --- Authentication Helpers (with Local Fallbacks) ---

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  homeCountry: any;
  role?: string;
}

export async function signUpUser(email: string, password: string, name: string, homeCountry: string): Promise<{ user: AuthUser | null; error: string | null }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            home_country: homeCountry
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        return {
          user: {
            id: data.user.id,
            name: data.user.user_metadata?.name || name,
            email: data.user.email || email,
            homeCountry: data.user.user_metadata?.home_country || homeCountry
          },
          error: null
        };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Error signing up.' };
    }
  }

  // Fallback to local storage simulation
  const storedUsersRaw = localStorage.getItem('sariremit_users');
  const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
  const exists = usersList.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return { user: null, error: 'An account with this email already exists.' };
  }
  const newUser = { id: `local-${Date.now()}`, name, email, password, homeCountry };
  usersList.push(newUser);
  localStorage.setItem('sariremit_users', JSON.stringify(usersList));
  return {
    user: { id: newUser.id, name, email, homeCountry },
    error: null
  };
}

export async function signInUser(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  // Check Admin first
  if (email.toLowerCase() === 'admin@sariremit.com' && password === 'adminpassword') {
    return {
      user: {
        id: 'admin-static-id',
        name: 'SariRemit Admin',
        email: 'admin@sariremit.com',
        homeCountry: 'KE',
        role: 'admin'
      },
      error: null
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.user) {
        return {
          user: {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'Sari Expat',
            email: data.user.email || email,
            homeCountry: data.user.user_metadata?.home_country || 'KE',
            role: (data.user.email && data.user.email.toLowerCase() === 'hassan.gaturu20@gmail.com') ? 'admin' : undefined
          },
          error: null
        };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Error signing in.' };
    }
  }

  // Fallback to local storage simulation
  const storedUsersRaw = localStorage.getItem('sariremit_users');
  const usersList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
  const matchedUser = usersList.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (matchedUser) {
    return {
      user: {
        id: matchedUser.id || `local-${matchedUser.email}`,
        name: matchedUser.name,
        email: matchedUser.email,
        homeCountry: matchedUser.homeCountry || 'KE',
        role: (matchedUser.email && matchedUser.email.toLowerCase() === 'hassan.gaturu20@gmail.com') ? 'admin' : undefined
      },
      error: null
    };
  }

  if (email.toLowerCase() === 'expat@sariremit.com' && password === '123456') {
    return {
      user: {
        id: 'expat-static-id',
        name: 'Sari Expat',
        email: 'expat@sariremit.com',
        homeCountry: 'KE'
      },
      error: null
    };
  }

  return { user: null, error: 'Invalid email or password.' };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

// --- User Profile DB Operations (with Local Fallbacks) ---

export async function getSupabaseUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, trigger might be lagging or tables are just set up
        return null;
      }
      throw error;
    }
    if (data) {
      return {
        name: data.name || 'Sari Expat',
        phone: data.phone || '',
        preferredLanguage: (data.preferred_language as 'en' | 'ar') || 'en',
        homeCountry: data.home_country || 'KE',
        favoriteProviders: data.favorite_providers || [],
        savingsTargetSar: Number(data.savings_target_sar || 100),
        totalSavedSar: Number(data.total_saved_sar || 0),
        joinedDate: data.joined_date || new Date().toISOString()
      };
    }
    return null;
  } catch (err) {
    console.warn('Supabase getSupabaseUserProfile error:', err);
    return null;
  }
}

export async function updateSupabaseUserProfile(userId: string, profile: UserProfile): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: profile.name,
        phone: profile.phone,
        preferred_language: profile.preferredLanguage,
        home_country: profile.homeCountry,
        favorite_providers: profile.favoriteProviders,
        savings_target_sar: profile.savingsTargetSar,
        total_saved_sar: profile.totalSavedSar,
        joined_date: profile.joinedDate,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase updateSupabaseUserProfile error:', err);
    return false;
  }
}

