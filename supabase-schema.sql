-- =========================================================================
-- SARIREMIT NETWORK DATABASE SCHEMA FOR SUPABASE (POSTGRESQL) - FROM SCRATCH
-- 
-- This schema establishes strong relational integrity (foreign keys) 
-- between User Profiles and all their interactions with the platform,
-- including rates, remittance channels, corridors, and audit logs.
-- =========================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USER PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,                             -- Stores Supabase Auth UUID or Client Guest ID
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,                      -- Used for cross-reference lookup
    phone TEXT NOT NULL,
    preferred_corridor_id TEXT DEFAULT 'sa-pk',
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    onboarding_completed BOOLEAN DEFAULT false,
    primary_destination_country TEXT,
    primary_destination_currency TEXT,
    preferred_channels JSONB DEFAULT '[]'::jsonb,
    estimated_monthly_send_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Permissive preview policies
DROP POLICY IF EXISTS "Enable read access for all" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert/upsert for all" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for all" ON public.user_profiles;

CREATE POLICY "Enable read access for all" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert/upsert for all" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.user_profiles FOR UPDATE USING (true);


-- ==========================================
-- 2. COMMUNITY RATE SUBMISSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.community_rate_submissions (
    id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) DEFAULT 10.00 NOT NULL,
    submitted_by TEXT,                               -- Relates to user_profiles(id)
    submitted_by_email TEXT,                         -- Relates to user_profiles(email)
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relational Foreign Key Connection
    CONSTRAINT fk_user_profile_email 
        FOREIGN KEY (submitted_by_email) 
        REFERENCES public.user_profiles(email) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- Index for fast correlation and admin query lookups
CREATE INDEX IF NOT EXISTS idx_submissions_user_email ON public.community_rate_submissions(submitted_by_email);

-- Enable RLS & Policies
ALTER TABLE public.community_rate_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.community_rate_submissions;
DROP POLICY IF EXISTS "Enable insert/update/delete for all" ON public.community_rate_submissions;

CREATE POLICY "Enable read access for all" ON public.community_rate_submissions FOR SELECT USING (true);
CREATE POLICY "Enable insert/update/delete for all" ON public.community_rate_submissions FOR ALL USING (true);


-- ==========================================
-- 3. USER TRANSFER RECORD & SAVINGS LOG
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_transfer_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                           -- Relates to user_profiles(id)
    corridor_id TEXT NOT NULL,
    send_amount NUMERIC(12, 2) NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) NOT NULL,
    computed_savings NUMERIC(10, 2) NOT NULL,        -- Computed by the Recommendation & SIS engine
    recipient_amount NUMERIC(12, 2) NOT NULL,
    transfer_status TEXT DEFAULT 'completed' NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relational Foreign Key Connection
    CONSTRAINT fk_savings_user_profile 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Index for retrieving user specific transaction and savings analytics
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON public.user_transfer_savings(user_id);

-- Enable RLS & Policies
ALTER TABLE public.user_transfer_savings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.user_transfer_savings;
DROP POLICY IF EXISTS "Enable insert for all" ON public.user_transfer_savings;

CREATE POLICY "Enable read access for all" ON public.user_transfer_savings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.user_transfer_savings FOR INSERT WITH CHECK (true);


-- ==========================================
-- 4. USER CUSTOM RATE ALERTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_rate_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                           -- Relates to user_profiles(id)
    corridor_id TEXT NOT NULL,
    target_rate NUMERIC(10, 4) NOT NULL,
    alert_type TEXT CHECK (alert_type IN ('above', 'below')) NOT NULL,
    channel TEXT CHECK (channel IN ('whatsapp', 'email', 'sms')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relational Foreign Key Connection
    CONSTRAINT fk_alerts_user_profile 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Index for notification engines
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.user_rate_alerts(user_id);

-- Enable RLS & Policies
ALTER TABLE public.user_rate_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.user_rate_alerts;
DROP POLICY IF EXISTS "Enable insert/update/delete for all" ON public.user_rate_alerts;

CREATE POLICY "Enable read access for all" ON public.user_rate_alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert/update/delete for all" ON public.user_rate_alerts FOR ALL USING (true);


-- ==========================================
-- 5. RATE OVERRIDES TABLE (Admin Overrides)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rate_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) DEFAULT 0.00 NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'active',
    source_note TEXT,
    created_by TEXT,
    vat_amount NUMERIC(8, 2),
    other_costs NUMERIC(8, 2)
);

-- Enable RLS & Policies
ALTER TABLE public.rate_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.rate_overrides;

CREATE POLICY "Enable read/write for all" ON public.rate_overrides FOR ALL USING (true);


-- ==========================================
-- 6. SIS WEIGHTS TABLE (RRE configuration)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sis_weights (
    id INT PRIMARY KEY DEFAULT 1,
    rate_weight NUMERIC(3, 2) DEFAULT 0.30 NOT NULL,
    fee_weight NUMERIC(3, 2) DEFAULT 0.20 NOT NULL,
    confidence_weight NUMERIC(3, 2) DEFAULT 0.20 NOT NULL,
    freshness_weight NUMERIC(3, 2) DEFAULT 0.15 NOT NULL,
    savings_weight NUMERIC(3, 2) DEFAULT 0.15 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS & Policies
ALTER TABLE public.sis_weights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sis_weights;

CREATE POLICY "Enable read/write for all" ON public.sis_weights FOR ALL USING (true);

-- Populate default weights row
INSERT INTO public.sis_weights (id, rate_weight, fee_weight, confidence_weight, freshness_weight, savings_weight)
VALUES (1, 0.30, 0.20, 0.20, 0.15, 0.15)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 7. SRCMC ADMIN ACCESS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.srcmc_admin_access (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('main_admin', 'rate_monitor', 'override_manager', 'community_verifier', 'channel_manager', 'corridor_manager', 'viewer')),
    permissions TEXT[] NOT NULL,
    pin_code TEXT NOT NULL,
    pin_generated_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT fk_admin_profile_email 
        FOREIGN KEY (email) 
        REFERENCES public.user_profiles(email) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS srcmc_admin_access_user_id_unique
ON public.srcmc_admin_access(user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS srcmc_admin_access_active_user_idx
ON public.srcmc_admin_access(user_id, is_active);

-- Enable RLS & Policies
ALTER TABLE public.srcmc_admin_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.srcmc_admin_access;
DROP POLICY IF EXISTS "Users can read own SRCMC access" ON public.srcmc_admin_access;

CREATE POLICY "Enable read/write for all" ON public.srcmc_admin_access FOR ALL USING (true);
CREATE POLICY "Users can read own SRCMC access" ON public.srcmc_admin_access FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- ==========================================
-- 8. CORRIDOR SETTINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.corridor_settings (
    id TEXT PRIMARY KEY,
    corridor_code TEXT UNIQUE NOT NULL,
    destination_country TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'coming_soon', 'paused')),
    display_as_coming_soon BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    activated_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.corridor_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.corridor_settings;

CREATE POLICY "Enable read/write for all" ON public.corridor_settings FOR ALL USING (true);


-- ==========================================
-- 9. REMITTANCE CHANNELS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.remittance_channels (
    id TEXT PRIMARY KEY,
    provider_name TEXT NOT NULL,
    provider_code TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wallet', 'bank', 'money_transfer_operator', 'exchange_house', 'other')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'coming_soon', 'paused')),
    supported_corridors TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    supported_transfer_methods TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    default_transfer_fee NUMERIC(8, 2) NOT NULL,
    default_vat_rate NUMERIC(5, 4) NOT NULL,
    fee_currency TEXT DEFAULT 'SAR' NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.remittance_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.remittance_channels;

CREATE POLICY "Enable read/write for all" ON public.remittance_channels FOR ALL USING (true);


-- ==========================================
-- 10. CHANNEL CORRIDOR COVERAGE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.channel_corridor_coverage (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES public.remittance_channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
    corridor_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'coming_soon', 'paused')),
    supported_transfer_methods TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    custom_transfer_fee NUMERIC(8, 2),
    custom_vat_rate NUMERIC(5, 4),
    exchange_rate NUMERIC(10, 4),
    transfer_fee NUMERIC(8, 2),
    vat_rate NUMERIC(5, 4),
    vat_amount NUMERIC(8, 2),
    other_costs NUMERIC(8, 2),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_channel_corridor UNIQUE (channel_id, corridor_id)
);

-- Enable RLS & Policies
ALTER TABLE public.channel_corridor_coverage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.channel_corridor_coverage;

CREATE POLICY "Enable read/write for all" ON public.channel_corridor_coverage FOR ALL USING (true);


-- ==========================================
-- 11. SRCMC AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.srcmc_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.srcmc_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.srcmc_audit_logs;

CREATE POLICY "Enable read/write for all" ON public.srcmc_audit_logs FOR ALL USING (true);


-- ==========================================
-- 12. MARKET REFERENCE RATES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.market_reference_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_id TEXT UNIQUE NOT NULL,
    rate NUMERIC(10, 4) NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.market_reference_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.market_reference_rates;

CREATE POLICY "Enable read/write for all" ON public.market_reference_rates FOR ALL USING (true);


-- ==========================================
-- 13. SIC SNAPSHOTS TABLE (SariRemit Intelligence Core)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sic_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_country TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    send_amount NUMERIC(12, 2) NOT NULL,
    transfer_method TEXT,
    resolved_rates JSONB NOT NULL,
    sis_results JSONB NOT NULL,
    true_cost_results JSONB NOT NULL,
    recommendation JSONB NOT NULL,
    engine_status TEXT DEFAULT 'active' NOT NULL,
    sic_version TEXT DEFAULT 'v1.1' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.sic_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_snapshots;

CREATE POLICY "Enable read/write for all" ON public.sic_snapshots FOR ALL USING (true);


-- ==========================================
-- 14. SEED INITIAL ADMIN PROFILES & ACCESS
-- ==========================================
INSERT INTO public.user_profiles (id, name, email, phone, preferred_corridor_id, language, onboarding_completed)
VALUES 
    ('profile-gaturu-hassan', 'Gaturu Hassan', 'gaturuhassan@gmail.com', '+966 50 111 2026', 'sa-ke', 'en', true),
    ('profile-hassan-gaturu20', 'Hassan Gaturu', 'hassan.gaturu20@gmail.com', '+966 50 789 2026', 'sa-pk', 'en', true),
    ('profile-hassan-dev26', 'Hassan Dev', 'hassan.dev26@gmail.com', '+966 50 999 2026', 'sa-ke', 'en', true)
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, phone = EXCLUDED.phone, onboarding_completed = true;

INSERT INTO public.srcmc_admin_access (id, email, role, permissions, pin_code, pin_generated_at, is_active)
VALUES 
    (
        'admin-gaturu-hassan',
        'gaturuhassan@gmail.com',
        'main_admin',
        ARRAY['view_dashboard', 'monitor_rates', 'manage_overrides', 'approve_community_rates', 'manage_corridors', 'manage_channels', 'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'],
        '123456',
        timezone('utc'::text, now()),
        TRUE
    ),
    (
        'admin-hassan-gaturu20',
        'hassan.gaturu20@gmail.com',
        'main_admin',
        ARRAY['view_dashboard', 'monitor_rates', 'manage_overrides', 'approve_community_rates', 'manage_corridors', 'manage_channels', 'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'],
        '123456',
        timezone('utc'::text, now()),
        TRUE
    ),
    (
        'admin-hassan-dev26',
        'hassan.dev26@gmail.com',
        'main_admin',
        ARRAY['view_dashboard', 'monitor_rates', 'manage_overrides', 'approve_community_rates', 'manage_corridors', 'manage_channels', 'view_sic', 'view_true_cost', 'view_history', 'view_audit_logs', 'manage_admins'],
        '123456',
        timezone('utc'::text, now()),
        TRUE
    )
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, is_active = EXCLUDED.is_active;
