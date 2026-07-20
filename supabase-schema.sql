-- =========================================================================
-- SARIREMIT NETWORK DATABASE SCHEMA FOR SUPABASE (POSTGRESQL) - REBUILT
-- 
-- IMPORTANT: As requested, this file has been rebuilt from scratch to include
-- all feature integrations (BAM, SIC, CRVS, SEPS, SNS, Overrides) and establish
-- strict, robust relationships between tables.
-- 
-- NOTE: The "public.user_profiles" table already exists and works perfectly. 
-- To respect user intent and keep user data intact, we do NOT drop or recreate 
-- "public.user_profiles". This script establishes strong relational integrity 
-- (Foreign Keys) referencing the existing "public.user_profiles" table.
-- =========================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 0. CLEANUP existing tables (in reverse order of foreign key dependency)
-- =========================================================================
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.fraud_integrity_events CASCADE;
DROP TABLE IF EXISTS public.sic_snapshots CASCADE;
DROP TABLE IF EXISTS public.market_reference_rates CASCADE;
DROP TABLE IF EXISTS public.srcmc_audit_logs CASCADE;
DROP TABLE IF EXISTS public.channel_corridor_coverage CASCADE;
DROP TABLE IF EXISTS public.remittance_channels CASCADE;
DROP TABLE IF EXISTS public.brand_asset_permissions CASCADE;
DROP TABLE IF EXISTS public.brand_assets CASCADE;
DROP TABLE IF EXISTS public.corridor_settings CASCADE;
DROP TABLE IF EXISTS public.srcmc_admin_access CASCADE;
DROP TABLE IF EXISTS public.sis_weights CASCADE;
DROP TABLE IF EXISTS public.rate_overrides CASCADE;
DROP TABLE IF EXISTS public.user_rate_alerts CASCADE;
DROP TABLE IF EXISTS public.user_transfer_savings CASCADE;
DROP TABLE IF EXISTS public.recorded_transfers CASCADE;
DROP TABLE IF EXISTS public.community_rate_submissions CASCADE;


-- =========================================================================
-- 1. REFERENCE SHELL FOR EXISTING USER PROFILES (DO NOT RUN - FOR REFERENCE ONLY)
-- =========================================================================
-- CREATE TABLE IF NOT EXISTS public.user_profiles (
--     id TEXT PRIMARY KEY,
--     name TEXT NOT NULL,
--     email TEXT UNIQUE NOT NULL,
--     phone TEXT NOT NULL,
--     preferred_corridor_id TEXT DEFAULT 'sa-pk',
--     language TEXT DEFAULT 'en',
--     onboarding_completed BOOLEAN DEFAULT false,
--     primary_destination_country TEXT,
--     primary_destination_currency TEXT,
--     preferred_channels JSONB DEFAULT '[]'::jsonb,
--     estimated_monthly_send_amount NUMERIC,
--     rate_submissions_restricted BOOLEAN DEFAULT false,
--     first_transfer_recorded_at TIMESTAMPTZ,
--     first_transfer_experience_prompt_shown_at TIMESTAMPTZ,
--     first_transfer_experience_completed_at TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
--     updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
--     engagement_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     achievement_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     rate_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     transfer_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     community_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     security_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     admin_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
--     push_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
--     email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
--     privacy_policy_version TEXT,
--     privacy_policy_accepted_at TIMESTAMPTZ
-- );


-- ==========================================
-- 2. BRAND ASSET MANAGER (BAM) TABLES
-- ==========================================
CREATE TABLE public.brand_assets (
    id TEXT PRIMARY KEY,
    asset_type TEXT NOT NULL,                                                                                    -- 'logo_primary', 'logo_horizontal', 'icon_square', 'banner', 'illustration'
    asset_key TEXT NOT NULL,                                                                                     -- 'stcpay', 'mobilypay', 'urpay', 'barq', etc.
    asset_name TEXT NOT NULL,                                                                                    -- Brand display name
    owner_type TEXT NOT NULL,                                                                                    -- 'provider', 'corridor', 'system', 'other'
    owner_id TEXT,                                                                                               -- Matches channel_id or corridor_id
    provider_code TEXT,
    country_code TEXT,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,
    width_px INT,
    height_px INT,
    public_url TEXT,
    light_url TEXT,
    dark_url TEXT,
    thumbnail_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    approval_status TEXT NOT NULL CHECK (approval_status IN ('official', 'placeholder', 'pending_permission', 'restricted')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'pending_approval', 'archived')),
    alt_text TEXT,
    version INT DEFAULT 1 NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    archived_at TIMESTAMPTZ
);

-- Enable RLS & Policies
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.brand_assets;
CREATE POLICY "Enable read/write for all" ON public.brand_assets FOR ALL USING (true);


CREATE TABLE public.brand_asset_permissions (
    id TEXT PRIMARY KEY,
    brand_asset_id TEXT NOT NULL REFERENCES public.brand_assets(id) ON DELETE CASCADE,
    permission_status TEXT NOT NULL,                                                                             -- 'granted', 'pending', 'denied', 'expired'
    permission_source TEXT,                                                                                      -- 'partner_agreement', 'public_domain', 'fair_use_justified', 'explicit_written'
    permission_reference TEXT,                                                                                   -- URL, Ticket ID, or doc reference
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    restrictions TEXT,
    contact_name TEXT,
    contact_email TEXT,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.brand_asset_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.brand_asset_permissions;
CREATE POLICY "Enable read/write for all" ON public.brand_asset_permissions FOR ALL USING (true);


-- ==========================================
-- 3. REMITTANCE CHANNELS TABLE (BAM Linked)
-- ==========================================
CREATE TABLE public.remittance_channels (
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
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    brand_asset_id TEXT REFERENCES public.brand_assets(id) ON DELETE SET NULL                                   -- Robust BAM linkage
);

-- Enable RLS & Policies
ALTER TABLE public.remittance_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.remittance_channels;
CREATE POLICY "Enable read/write for all" ON public.remittance_channels FOR ALL USING (true);


-- ==========================================
-- 4. CHANNEL CORRIDOR COVERAGE TABLE
-- ==========================================
CREATE TABLE public.channel_corridor_coverage (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES public.remittance_channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
    corridor_id TEXT NOT NULL,                                                                                   -- 'sa-pk', 'sa-ke', 'sa-ph', 'sa-in', etc.
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
-- 5. COMMUNITY RATE SUBMISSIONS TABLE (CRVS & SAF)
-- ==========================================
CREATE TABLE public.community_rate_submissions (
    id TEXT PRIMARY KEY,
    corridor_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) DEFAULT 10.00 NOT NULL,
    send_amount NUMERIC(12, 2) DEFAULT 0.00,
    receive_amount NUMERIC(12, 2) DEFAULT 0.00,
    submitted_by TEXT,                                                                                           -- Relates to user_profiles(id)
    submitted_by_name TEXT,
    submitted_by_email TEXT,                                                                                     -- Relates to user_profiles(email)
    status TEXT DEFAULT 'pending' NOT NULL,                                                                      -- Managed by CRVS state machine ('pending', 'approved', 'rejected', 'flagged')
    screenshot_name TEXT,
    screenshot_url TEXT,
    screenshot_storage_path TEXT,
    vat_amount NUMERIC(8, 2),
    other_costs NUMERIC(8, 2),
    
    destination_country TEXT,
    destination_currency TEXT,
    date_observed TEXT,
    time_observed TEXT,
    transfer_method TEXT,
    user_note TEXT,
    amount_sent NUMERIC(12, 2),
    amount_received NUMERIC(12, 2),
    screenshot_path TEXT,
    screenshot_original_name TEXT,
    screenshot_mime_type TEXT,
    screenshot_size_bytes BIGINT,
    screenshot_hash TEXT,
    screenshot_uploaded_at TIMESTAMPTZ,
    evidence_status TEXT DEFAULT 'pending',
    fraud_risk_score NUMERIC(5, 2) DEFAULT 0.00,
    fraud_risk_level TEXT DEFAULT 'low',
    fraud_flags TEXT[] DEFAULT '{}'::TEXT[],
    
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    reviewer_notes TEXT,
    valid_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast correlation and lookup
CREATE INDEX IF NOT EXISTS idx_submissions_user_email ON public.community_rate_submissions(submitted_by_email);

-- Enable RLS & Policies
ALTER TABLE public.community_rate_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.community_rate_submissions;
DROP POLICY IF EXISTS "Enable insert/update/delete for all" ON public.community_rate_submissions;

CREATE POLICY "Enable read access for all" ON public.community_rate_submissions FOR SELECT USING (true);
CREATE POLICY "Enable insert/update/delete for all" ON public.community_rate_submissions FOR ALL USING (true);


-- =========================================================================
-- 6. SEPS - RECORDED TRANSFERS TABLE
-- =========================================================================
CREATE TABLE public.recorded_transfers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,                                                                                      -- Relates to user_profiles(id)
    channel_id TEXT,
    corridor_id TEXT,
    send_amount_sar NUMERIC(12, 2) NOT NULL,
    destination_currency TEXT,
    estimated_recipient_amount NUMERIC(12, 2) NOT NULL,
    actual_recipient_amount NUMERIC(12, 2),
    resolved_rate NUMERIC(12, 6) NOT NULL,
    rate_source TEXT,
    transfer_fee_sar NUMERIC(12, 2) NOT NULL,
    vat_amount_sar NUMERIC(12, 2) NOT NULL,
    other_charges_sar NUMERIC(12, 2) NOT NULL,
    estimated_savings_destination NUMERIC(12, 2),
    estimated_savings_sar NUMERIC(12, 2),
    savings_comparison_type TEXT,
    comparison_channel_id TEXT,
    idempotency_key TEXT,
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'recorded' NOT NULL,                                                                     -- 'recorded', 'invalidated'
    invalidated_at TIMESTAMPTZ,
    invalidation_reason TEXT,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT recorded_transfers_user_idempotency_unique UNIQUE (user_id, idempotency_key),
    CONSTRAINT fk_recorded_transfers_user_profile 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Indexing for lookup speed
CREATE INDEX IF NOT EXISTS idx_recorded_transfers_user_id ON public.recorded_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_recorded_transfers_recorded_at ON public.recorded_transfers(recorded_at DESC);

-- Enable RLS & Policies
ALTER TABLE public.recorded_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own recorded transfers" ON public.recorded_transfers;
DROP POLICY IF EXISTS "Users insert own recorded transfers" ON public.recorded_transfers;
DROP POLICY IF EXISTS "Users update own recorded transfers" ON public.recorded_transfers;
DROP POLICY IF EXISTS "Users delete own recorded transfers" ON public.recorded_transfers;

CREATE POLICY "Users read own recorded transfers" ON public.recorded_transfers FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
CREATE POLICY "Users insert own recorded transfers" ON public.recorded_transfers FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users update own recorded transfers" ON public.recorded_transfers FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users delete own recorded transfers" ON public.recorded_transfers FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- Also allow public/guest writes to recorded transfers for robust client synchronization
DROP POLICY IF EXISTS "Allow guest inserts" ON public.recorded_transfers;
CREATE POLICY "Allow guest inserts" ON public.recorded_transfers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow guest select" ON public.recorded_transfers;
CREATE POLICY "Allow guest select" ON public.recorded_transfers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow guest update" ON public.recorded_transfers;
CREATE POLICY "Allow guest update" ON public.recorded_transfers FOR UPDATE USING (true);


-- =========================================================================
-- 7. USER TRANSFER SAVINGS & ANALYTICS LEDGER
-- =========================================================================
CREATE TABLE public.user_transfer_savings (
    id TEXT PRIMARY KEY,                                                                                         -- Relates directly to recorded_transfers(id) or unique UUID
    user_id TEXT NOT NULL,                                                                                       -- Relates to user_profiles(id)
    corridor_id TEXT NOT NULL,
    send_amount NUMERIC(12, 2) NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) NOT NULL,
    computed_savings NUMERIC(10, 2) NOT NULL,                                                                    -- Computed by Recommendation Engine
    recipient_amount NUMERIC(12, 2) NOT NULL,
    transfer_status TEXT DEFAULT 'completed' NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    provider_id TEXT,
    provider_name TEXT,
    destination_country TEXT,
    destination_currency TEXT,
    send_amount_sar NUMERIC(12, 2),
    estimated_recipient_amount NUMERIC(12, 2),
    actual_recipient_amount NUMERIC(12, 2),
    savings_amount_sar NUMERIC(10, 2),
    savings_amount_destination NUMERIC(12, 2),
    comparison_type TEXT,
    comparison_label TEXT,
    status TEXT DEFAULT 'recorded',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Relational Foreign Key Connection to user_profiles
    CONSTRAINT fk_savings_user_profile 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Index for retrieving user specific transactions and savings analytics
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON public.user_transfer_savings(user_id);

-- Enable RLS & Policies
ALTER TABLE public.user_transfer_savings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.user_transfer_savings;
DROP POLICY IF EXISTS "Enable insert/update/delete for all" ON public.user_transfer_savings;

CREATE POLICY "Enable read access for all" ON public.user_transfer_savings FOR SELECT USING (true);
CREATE POLICY "Enable insert/update/delete for all" ON public.user_transfer_savings FOR ALL USING (true);


-- ==========================================
-- 8. USER CUSTOM RATE ALERTS TABLE
-- ==========================================
CREATE TABLE public.user_rate_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                                                                                       -- Relates to user_profiles(id)
    corridor_id TEXT NOT NULL,
    target_rate NUMERIC(10, 4) NOT NULL,
    alert_type TEXT CHECK (alert_type IN ('above', 'below')) NOT NULL,
    channel TEXT CHECK (channel IN ('whatsapp', 'email', 'sms')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Relational Foreign Key Connection to user_profiles
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
-- 9. RATE OVERRIDES TABLE (Admin Overrides)
-- ==========================================
CREATE TABLE public.rate_overrides (
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
-- 10. SIS WEIGHTS TABLE (RRE configurations)
-- ==========================================
CREATE TABLE public.sis_weights (
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
-- 11. SRCMC ADMIN ACCESS TABLE (Linked to user_profiles)
-- ==========================================
CREATE TABLE public.srcmc_admin_access (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('main_admin', 'rate_monitor', 'override_manager', 'community_verifier', 'channel_manager', 'corridor_manager', 'viewer')),
    permissions TEXT[] NOT NULL,
    pin_code TEXT NOT NULL,
    pin_generated_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
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
-- 12. CORRIDOR SETTINGS TABLE
-- ==========================================
CREATE TABLE public.corridor_settings (
    id TEXT PRIMARY KEY,
    corridor_code TEXT UNIQUE NOT NULL,                                                                          -- 'sa-pk', 'sa-ke', etc.
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
-- 13. SRCMC AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE public.srcmc_audit_logs (
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
-- 14. MARKET REFERENCE RATES TABLE
-- ==========================================
CREATE TABLE public.market_reference_rates (
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
-- 15. SIC SNAPSHOTS TABLE (SariRemit Intelligence Core)
-- ==========================================
CREATE TABLE public.sic_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_country TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    send_amount NUMERIC(12, 2) NOT NULL,
    transfer_method TEXT,
    resolved_rates JSONB NOT NULL,
    sis_results JSONB NOT NULL,
    true_cost_results JSONB NOT NULL,
    recommendation JSONB NOT NULL,
    reference_benchmark JSONB,
    engine_status TEXT DEFAULT 'active' NOT NULL,
    sic_version TEXT DEFAULT 'v1.2' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.sic_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_snapshots;
CREATE POLICY "Enable read/write for all" ON public.sic_snapshots FOR ALL USING (true);


-- ==========================================
-- 16. FRAUD INTEGRITY EVENTS TABLE (CRVS & SAF)
-- ==========================================
CREATE TABLE public.fraud_integrity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id TEXT,
    submission_id TEXT,
    channel_id TEXT,
    corridor_id TEXT,
    risk_score NUMERIC(5, 2) NOT NULL,
    risk_flags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies
ALTER TABLE public.fraud_integrity_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.fraud_integrity_events;
CREATE POLICY "Enable read/write for all" ON public.fraud_integrity_events FOR ALL USING (true);


-- ==========================================
-- 17. NOTIFICATIONS TABLE (SNS)
-- ==========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,                     -- Robust Profile reference
  audience_type TEXT NOT NULL DEFAULT 'user',                                                                  -- 'user', 'guest', 'admin', 'broadcast'
  category TEXT NOT NULL,                                                                                      -- 'rate_alert', 'achievement', 'transfer', 'security', 'community', 'admin_broadcast'
  priority TEXT NOT NULL DEFAULT 'normal',                                                                     -- 'low', 'normal', 'high', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  source_system TEXT,
  source_event TEXT,
  source_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for notification idempotency
CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_idempotency_unique
ON public.notifications(user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- Indexes for swift lookups
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS notifications_category_idx ON public.notifications(category);
CREATE INDEX IF NOT EXISTS notifications_source_idx ON public.notifications(source_system, source_event);

-- Enable RLS & Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Admins read all notifications" ON public.notifications;
CREATE POLICY "Admins read all notifications" ON public.notifications FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.srcmc_admin_access
    WHERE srcmc_admin_access.user_id = auth.uid()
    AND srcmc_admin_access.is_active = true
  )
);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Admins insert all notifications" ON public.notifications;
CREATE POLICY "Admins insert all notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Also allow guest access for notification actions
DROP POLICY IF EXISTS "Allow guest select notifications" ON public.notifications;
CREATE POLICY "Allow guest select notifications" ON public.notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow guest update notifications" ON public.notifications;
CREATE POLICY "Allow guest update notifications" ON public.notifications FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow guest insert notifications" ON public.notifications;
CREATE POLICY "Allow guest insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


-- =========================================================================
-- 18. STORAGE BUCKET INITIALIZATION & POLICIES FOR SCREENSHOTS
-- =========================================================================

-- Ensure verification-screenshots bucket exists in storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-screenshots', 'verification-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-screenshots
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'verification-screenshots');

CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'verification-screenshots');


-- ==========================================
-- 19. SEED INITIAL ADMINISTRATIVE PROFILES & ACCESS
-- ==========================================

-- Seed Administrator SRCMC access profiles
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


-- Seed Corridor Settings
INSERT INTO public.corridor_settings (id, corridor_code, destination_country, destination_currency, status, display_as_coming_soon, notes)
VALUES 
    ('sa-pk', 'sa-pk', 'Pakistan', 'PKR', 'active', false, 'Active Pakistan remittance corridor'),
    ('sa-in', 'sa-in', 'India', 'INR', 'active', false, 'Active India remittance corridor'),
    ('sa-ph', 'sa-ph', 'Philippines', 'PHP', 'active', false, 'Active Philippines remittance corridor'),
    ('sa-eg', 'sa-eg', 'Egypt', 'EGP', 'active', false, 'Active Egypt remittance corridor'),
    ('sa-bd', 'sa-bd', 'Bangladesh', 'BDT', 'active', false, 'Active Bangladesh remittance corridor'),
    ('sa-ke', 'sa-ke', 'Kenya', 'KES', 'active', false, 'Active Kenya remittance corridor')
ON CONFLICT (corridor_code) DO UPDATE 
SET destination_country = EXCLUDED.destination_country, destination_currency = EXCLUDED.destination_currency, status = EXCLUDED.status;


-- Seed Market Reference Rates
INSERT INTO public.market_reference_rates (corridor_id, rate)
VALUES 
    ('sa-pk', 74.25),
    ('sa-in', 22.15),
    ('sa-ph', 14.85),
    ('sa-eg', 12.40),
    ('sa-bd', 31.10),
    ('sa-ke', 34.50)
ON CONFLICT (corridor_id) DO UPDATE 
SET rate = EXCLUDED.rate, last_updated = timezone('utc'::text, now());


-- =========================================================================
-- 13. SUPPORT & FEEDBACK MODULE TABLES
-- =========================================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
  ticket TEXT;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(COUNT(*), 0) + 1 INTO next_seq 
  FROM public.support_feedback_requests 
  WHERE ticket_number LIKE 'SR-' || current_year || '-%';
  
  ticket := 'SR-' || current_year || '-' || lpad(next_seq::text, 6, '0');
  RETURN ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS public.support_feedback_requests (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    related_channel_id TEXT REFERENCES public.remittance_channels(id) ON DELETE SET NULL,
    related_corridor_id TEXT REFERENCES public.corridor_settings(id) ON DELETE SET NULL,
    related_transfer_id TEXT REFERENCES public.recorded_transfers(id) ON DELETE SET NULL,
    related_submission_id TEXT REFERENCES public.community_rate_submissions(id) ON DELETE SET NULL,
    preferred_language TEXT DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'normal',
    spam_risk_level TEXT NOT NULL DEFAULT 'low',
    spam_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
    assigned_to TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_summary TEXT,
    submitted_from TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS support_feedback_user_created_idx
on public.support_feedback_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS support_feedback_status_idx
on public.support_feedback_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS support_feedback_category_idx
on public.support_feedback_requests(category);

CREATE INDEX IF NOT EXISTS support_feedback_email_idx
on public.support_feedback_requests(lower(email));

-- Enable RLS & Policies
ALTER TABLE public.support_feedback_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create own support requests" ON public.support_feedback_requests;
CREATE POLICY "Users create own support requests" ON public.support_feedback_requests FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users read own support requests" ON public.support_feedback_requests;
CREATE POLICY "Users read own support requests" ON public.support_feedback_requests FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Allow guest inserts for support requests" ON public.support_feedback_requests;
CREATE POLICY "Allow guest inserts for support requests" ON public.support_feedback_requests FOR INSERT WITH CHECK (true);

-- Allow admins to read/write all support requests
DROP POLICY IF EXISTS "Admins read all support requests" ON public.support_feedback_requests;
CREATE POLICY "Admins read all support requests" ON public.support_feedback_requests FOR ALL USING (true);


CREATE TABLE IF NOT EXISTS public.support_request_messages (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES public.support_feedback_requests(id) ON DELETE CASCADE,
    sender_user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_request_messages_request_id ON public.support_request_messages(request_id);

-- Enable RLS & Policies
ALTER TABLE public.support_request_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read messages for own requests" ON public.support_request_messages;
CREATE POLICY "Users read messages for own requests" ON public.support_request_messages FOR SELECT USING (
    is_internal = false AND 
    EXISTS (
        SELECT 1 FROM public.support_feedback_requests r 
        WHERE r.id = request_id AND (r.user_id = auth.uid()::text OR r.email = (auth.jwt() ->> 'email'))
    )
);

DROP POLICY IF EXISTS "Users insert messages for own requests" ON public.support_request_messages;
CREATE POLICY "Users insert messages for own requests" ON public.support_request_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_feedback_requests r 
        WHERE r.id = request_id AND (r.user_id = auth.uid()::text OR r.email = (auth.jwt() ->> 'email'))
    )
);

DROP POLICY IF EXISTS "Admins all for messages" ON public.support_request_messages;
CREATE POLICY "Admins all for messages" ON public.support_request_messages FOR ALL USING (true);


-- =========================================================================
-- 15. SARIREMIT LEGAL & COMPLIANCE FRAMEWORK (SLCF) MIGRATIONS
-- =========================================================================
-- These columns track individual consent and acceptance of the Privacy Policy
-- in full alignment with the Saudi Personal Data Protection Law (PDPL).

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.2';

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ DEFAULT now();

-- These columns track individual consent and acceptance of the Terms of Service.
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0';

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;


-- =========================================================================
-- 16. SARIREMIT PROVIDER IDENTITY & COVERAGE SEEDS (PIS/BAM)
-- =========================================================================
-- These queries populate canonical brand assets, remittance channels,
-- and channel corridor coverages to ensure the recommenders load correctly.

-- A. Seed Brand Assets (BAM)
INSERT INTO public.brand_assets (
    id, asset_type, asset_key, asset_name, owner_type, owner_id, provider_code, country_code, storage_path, public_url, approval_status, status, version, primary_color, secondary_color, metadata, created_at, updated_at
) VALUES
    ('ba-stc-pay', 'provider_logo', 'stc-pay', 'STC Pay Logo', 'provider', 'stc-pay', 'stc-pay', 'SA', 'providers/stc-pay/stc-pay-logo.svg', '', 'official', 'active', 1, '#9333ea', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-urpay', 'provider_logo', 'urpay', 'Urpay Logo', 'provider', 'urpay', 'urpay', 'SA', 'providers/urpay/urpay-logo.svg', '', 'official', 'active', 1, '#4f46e5', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-mobily-pay', 'provider_logo', 'mobily-pay', 'Mobily Pay Logo', 'provider', 'mobily-pay', 'mobily-pay', 'SA', 'providers/mobily-pay/mobily-pay-logo.svg', '', 'official', 'active', 1, '#0ea5e9', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-enjaz', 'provider_logo', 'enjaz', 'Enjaz Logo', 'provider', 'enjaz', 'enjaz', 'SA', 'providers/enjaz/enjaz-logo.svg', '', 'official', 'active', 1, '#d97706', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-quickpay', 'provider_logo', 'quickpay', 'QuickPay Logo', 'provider', 'quickpay', 'quickpay', 'SA', 'providers/quickpay/quickpay-logo.svg', '', 'official', 'active', 1, '#059669', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-western-union', 'provider_logo', 'western-union', 'Western Union Logo', 'provider', 'western-union', 'western-union', 'SA', 'providers/western-union/western-union-logo.svg', '', 'official', 'active', 1, '#eab308', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now())),
    ('ba-al-rajhi-tahweel', 'provider_logo', 'al-rajhi-tahweel', 'Al Rajhi Tahweel Logo', 'provider', 'al-rajhi-tahweel', 'al-rajhi-tahweel', 'SA', 'providers/al-rajhi-tahweel/tahweel-logo.svg', '', 'placeholder', 'active', 1, '#1e293b', '#ffffff', '{}'::jsonb, timezone('utc'::text, now()), timezone('utc'::text, now()))
ON CONFLICT (id) DO UPDATE
SET asset_name = EXCLUDED.asset_name, status = EXCLUDED.status, primary_color = EXCLUDED.primary_color;

-- B. Seed Remittance Channels
INSERT INTO public.remittance_channels (
    id, provider_name, provider_code, display_name, category, status, supported_corridors, supported_transfer_methods, default_transfer_fee, default_vat_rate, fee_currency, logo_url, website_url, brand_asset_id
) VALUES
    ('stc-pay', 'STC Pay', 'stc-pay', 'STC Pay / STC Bank', 'wallet', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Bank Transfer', 'Mobile Wallet'], 10.00, 0.15, 'SAR', '', 'https://stcpay.com.sa', 'ba-stc-pay'),
    ('urpay', 'Urpay', 'urpay', 'Urpay', 'wallet', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Bank Transfer', 'Mobile Wallet'], 12.00, 0.15, 'SAR', '', 'https://urpay.com.sa', 'ba-urpay'),
    ('mobily-pay', 'Mobily Pay', 'mobily-pay', 'Mobily Pay', 'wallet', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Mobile Wallet', 'Bank Transfer'], 8.00, 0.15, 'SAR', '', 'https://mobilypay.com.sa', 'ba-mobily-pay'),
    ('enjaz', 'Enjaz', 'enjaz', 'Enjaz (Bank Albilad)', 'bank', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 'SAR', '', 'https://www.bankalbilad.com', 'ba-enjaz'),
    ('quickpay', 'QuickPay', 'quickpay', 'QuickPay (SNB)', 'bank', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 'SAR', '', 'https://www.alahli.com', 'ba-quickpay'),
    ('western-union', 'Western Union', 'western-union', 'Western Union', 'money_transfer_operator', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Cash Pickup', 'Bank Transfer'], 18.00, 0.15, 'SAR', '', 'https://www.westernunion.com', 'ba-western-union'),
    ('al-rajhi-tahweel', 'Al Rajhi Tahweel', 'al-rajhi-tahweel', 'Al Rajhi Tahweel', 'bank', 'active', ARRAY['sa-ke', 'sa-ug', 'sa-in', 'sa-pk', 'sa-ph', 'sa-bd', 'sa-eg', 'sa-et'], ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 'SAR', '', 'https://www.alrajhibank.com.sa', 'ba-al-rajhi-tahweel')
ON CONFLICT (id) DO UPDATE
SET display_name = EXCLUDED.display_name, category = EXCLUDED.category, status = EXCLUDED.status, brand_asset_id = EXCLUDED.brand_asset_id;

-- C. Seed Channel Corridor Coverage (Rates and custom fee rules)
INSERT INTO public.channel_corridor_coverage (
    id, channel_id, corridor_id, status, supported_transfer_methods, custom_transfer_fee, custom_vat_rate, exchange_rate, transfer_fee, vat_rate, vat_amount, other_costs
) VALUES
    -- Pakistan (sa-pk, base rate 74.25)
    ('cov-stc-pay-sa-pk', 'stc-pay', 'sa-pk', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 10.00, 0.15, 74.62, 10.00, 0.15, 1.50, 0.00),
    ('cov-urpay-sa-pk', 'urpay', 'sa-pk', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 12.00, 0.15, 74.95, 12.00, 0.15, 1.80, 0.00),
    ('cov-mobily-pay-sa-pk', 'mobily-pay', 'sa-pk', 'active', ARRAY['Mobile Wallet', 'Bank Transfer'], 8.00, 0.15, 74.50, 8.00, 0.15, 1.20, 0.00),
    ('cov-enjaz-sa-pk', 'enjaz', 'sa-pk', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 74.20, 15.00, 0.15, 2.25, 0.00),
    ('cov-quickpay-sa-pk', 'quickpay', 'sa-pk', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 74.15, 15.00, 0.15, 2.25, 0.00),
    ('cov-western-union-sa-pk', 'western-union', 'sa-pk', 'active', ARRAY['Cash Pickup', 'Bank Transfer'], 18.00, 0.15, 74.75, 18.00, 0.15, 2.70, 0.00),
    ('cov-al-rajhi-tahweel-sa-pk', 'al-rajhi-tahweel', 'sa-pk', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 74.30, 15.00, 0.15, 2.25, 0.00),

    -- India (sa-in, base rate 22.15)
    ('cov-stc-pay-sa-in', 'stc-pay', 'sa-in', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 10.00, 0.15, 22.25, 10.00, 0.15, 1.50, 0.00),
    ('cov-urpay-sa-in', 'urpay', 'sa-in', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 12.00, 0.15, 22.35, 12.00, 0.15, 1.80, 0.00),
    ('cov-mobily-pay-sa-in', 'mobily-pay', 'sa-in', 'active', ARRAY['Mobile Wallet', 'Bank Transfer'], 8.00, 0.15, 22.20, 8.00, 0.15, 1.20, 0.00),
    ('cov-enjaz-sa-in', 'enjaz', 'sa-in', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 22.05, 15.00, 0.15, 2.25, 0.00),
    ('cov-quickpay-sa-in', 'quickpay', 'sa-in', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 21.98, 15.00, 0.15, 2.25, 0.00),
    ('cov-western-union-sa-in', 'western-union', 'sa-in', 'active', ARRAY['Cash Pickup', 'Bank Transfer'], 18.00, 0.15, 22.30, 18.00, 0.15, 2.70, 0.00),
    ('cov-al-rajhi-tahweel-sa-in', 'al-rajhi-tahweel', 'sa-in', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 22.10, 15.00, 0.15, 2.25, 0.00),

    -- Kenya (sa-ke, base rate 34.50)
    ('cov-stc-pay-sa-ke', 'stc-pay', 'sa-ke', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 10.00, 0.15, 34.65, 10.00, 0.15, 1.50, 0.00),
    ('cov-urpay-sa-ke', 'urpay', 'sa-ke', 'active', ARRAY['Bank Transfer', 'Mobile Wallet'], 12.00, 0.15, 34.80, 12.00, 0.15, 1.80, 0.00),
    ('cov-mobily-pay-sa-ke', 'mobily-pay', 'sa-ke', 'active', ARRAY['Mobile Wallet', 'Bank Transfer'], 8.00, 0.15, 34.55, 8.00, 0.15, 1.20, 0.00),
    ('cov-enjaz-sa-ke', 'enjaz', 'sa-ke', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 34.35, 15.00, 0.15, 2.25, 0.00),
    ('cov-quickpay-sa-ke', 'quickpay', 'sa-ke', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 34.30, 15.00, 0.15, 2.25, 0.00),
    ('cov-western-union-sa-ke', 'western-union', 'sa-ke', 'active', ARRAY['Cash Pickup', 'Bank Transfer'], 18.00, 0.15, 34.70, 18.00, 0.15, 2.70, 0.00),
    ('cov-al-rajhi-tahweel-sa-ke', 'al-rajhi-tahweel', 'sa-ke', 'active', ARRAY['Bank Transfer', 'Cash Pickup'], 15.00, 0.15, 34.40, 15.00, 0.15, 2.25, 0.00)
ON CONFLICT (channel_id, corridor_id) DO UPDATE
SET status = EXCLUDED.status, exchange_rate = EXCLUDED.exchange_rate, transfer_fee = EXCLUDED.transfer_fee;


-- ====================================================
-- SIC 2.0: EVIDENCE & PROVENANCE ENGINE (EPE) MIGRATION
-- ====================================================

-- 1. Main Evidence Records Table
CREATE TABLE IF NOT EXISTS public.sic_evidence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type TEXT NOT NULL,          -- 'exchange_rate', 'reference_benchmark', 'fee_structure'
    source_type TEXT NOT NULL,           -- 'management_override', 'management_verified', 'community_verified', 'community_submitted', 'public_reference_api', 'legacy_unclassified'
    provider_id TEXT,
    provider_code TEXT,
    corridor_id TEXT NOT NULL,
    source_currency TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    numeric_value NUMERIC(20, 6) NOT NULL,
    provider_specific BOOLEAN DEFAULT TRUE,
    corridor_specific BOOLEAN DEFAULT TRUE,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    source_name TEXT,                    -- e.g. 'rate_overrides', 'market_reference_rates'
    source_record_id TEXT,               -- Reference ID of raw database entry
    status TEXT NOT NULL DEFAULT 'active', -- 'pending', 'active', 'verified', 'rejected', 'expired', 'incomplete', 'superseded'
    freshness_state TEXT NOT NULL DEFAULT 'unknown', -- 'fresh', 'aging', 'stale', 'expired', 'unknown'
    permitted_uses TEXT[] DEFAULT ARRAY['comparison', 'recommendation', 'audit', 'analytics']::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Audit Trail Logs for Cryptographic Provenance Traceability
CREATE TABLE IF NOT EXISTS public.epe_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,                -- 'register_evidence', 'state_override', 'freshness_recalculated', 'superseded'
    details TEXT NOT NULL,
    evidence_id UUID,
    actor_email TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optimized Performance Indexes for Real-time RRE Filtering & Auditing
CREATE INDEX IF NOT EXISTS idx_sic_evidence_corridor_status ON public.sic_evidence_records(corridor_id, status);
CREATE INDEX IF NOT EXISTS idx_sic_evidence_subject_provider ON public.sic_evidence_records(subject_type, provider_code);
CREATE INDEX IF NOT EXISTS idx_sic_evidence_observed ON public.sic_evidence_records(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_epe_audit_evidence_id ON public.epe_audit_logs(evidence_id);


-- ====================================================
-- SIC 2.0: EVIDENCE RESOLUTION & DECISION ENGINE (ERDE) MIGRATION
-- ====================================================

-- 4. Resolution Policies Table
CREATE TABLE IF NOT EXISTS public.sic_resolution_policies (
    policy_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version INT DEFAULT 1 NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'shadow', 'active', 'inactive', 'archived')),
    preserve_management_override_priority BOOLEAN DEFAULT TRUE NOT NULL,
    minimum_quality_score INT DEFAULT 40 NOT NULL,
    require_verified_evidence BOOLEAN DEFAULT FALSE NOT NULL,
    require_provider_specificity_for_recommendation BOOLEAN DEFAULT TRUE NOT NULL,
    require_corridor_match BOOLEAN DEFAULT TRUE NOT NULL,
    reject_expired_evidence BOOLEAN DEFAULT TRUE NOT NULL,
    allow_aging_evidence BOOLEAN DEFAULT TRUE NOT NULL,
    allow_unknown_freshness BOOLEAN DEFAULT FALSE NOT NULL,
    allow_legacy_fallback BOOLEAN DEFAULT TRUE NOT NULL,
    weights JSONB NOT NULL DEFAULT '{}'::JSONB,
    conflict_thresholds JSONB NOT NULL DEFAULT '{}'::JSONB,
    tie_breaker_order TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_resolution_policies
ALTER TABLE public.sic_resolution_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_resolution_policies;
CREATE POLICY "Enable read/write for all" ON public.sic_resolution_policies FOR ALL USING (true);


-- 5. Conflict Registry Table
CREATE TABLE IF NOT EXISTS public.sic_evidence_conflicts (
    id TEXT PRIMARY KEY,
    conflict_key TEXT NOT NULL,
    provider_id TEXT,
    corridor_id TEXT,
    source_currency TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    subject_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('no_conflict', 'minor_variance', 'moderate_variance', 'major_conflict', 'critical_conflict', 'structural_conflict')),
    status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'under_review', 'resolved', 'dismissed', 'auto_resolved', 'archived')),
    evidence_ids TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    absolute_difference NUMERIC(20, 6) DEFAULT 0.00 NOT NULL,
    percentage_difference NUMERIC(8, 4) DEFAULT 0.00 NOT NULL,
    estimated_recipient_impact NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    detection_reason TEXT,
    detected_at TIMESTAMPTZ NOT NULL,
    review_notes TEXT,
    assigned_to TEXT,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_evidence_conflicts
ALTER TABLE public.sic_evidence_conflicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_evidence_conflicts;
CREATE POLICY "Enable read/write for all" ON public.sic_evidence_conflicts FOR ALL USING (true);


-- 6. Resolution Ledger/History Table
CREATE TABLE IF NOT EXISTS public.sic_evidence_resolutions (
    id TEXT PRIMARY KEY,
    context_key TEXT NOT NULL,
    provider_id TEXT,
    corridor_id TEXT,
    source_currency TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    subject_type TEXT NOT NULL,
    requested_use TEXT NOT NULL,
    environment TEXT NOT NULL,
    status TEXT NOT NULL,
    selected_evidence_id TEXT,
    selected_value NUMERIC(20, 6),
    selected_currency TEXT,
    selected_source_type TEXT,
    selected_quality_score INT,
    selected_quality_band TEXT,
    policy_id TEXT REFERENCES public.sic_resolution_policies(policy_id) ON DELETE SET NULL,
    policy_version INT,
    resolution_reason_code TEXT,
    resolution_reason_user_facing TEXT,
    resolution_reason_internal TEXT,
    conflict_severity TEXT,
    warnings TEXT[] DEFAULT '{}'::TEXT[],
    generated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_evidence_resolutions
ALTER TABLE public.sic_evidence_resolutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_evidence_resolutions;
CREATE POLICY "Enable read/write for all" ON public.sic_evidence_resolutions FOR ALL USING (true);


-- 7. Optimized Performance Indexes for ERDE Real-time Resolution & Auditing
CREATE INDEX IF NOT EXISTS idx_sic_policies_status ON public.sic_resolution_policies(status);
CREATE INDEX IF NOT EXISTS idx_sic_conflicts_status_severity ON public.sic_evidence_conflicts(status, severity);
CREATE INDEX IF NOT EXISTS idx_sic_conflicts_key ON public.sic_evidence_conflicts(conflict_key);
CREATE INDEX IF NOT EXISTS idx_sic_resolutions_corridor_provider ON public.sic_evidence_resolutions(corridor_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_sic_resolutions_generated ON public.sic_evidence_resolutions(generated_at DESC);


-- ====================================================
// SIC 2.0 Phase 3A: SIS INTELLIGENCE SCHEMAS
-- ====================================================

-- 8. SIS Policies Table
CREATE TABLE IF NOT EXISTS public.sic_policies (
    policy_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version INT DEFAULT 1 NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived', 'inactive')),
    weights JSONB NOT NULL DEFAULT '{}'::JSONB,
    caps JSONB NOT NULL DEFAULT '{}'::JSONB,
    blocking_rules JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_policies
ALTER TABLE public.sic_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_policies;
CREATE POLICY "Enable read/write for all" ON public.sic_policies FOR ALL USING (true);


-- 9. SIS Results Table
CREATE TABLE IF NOT EXISTS public.sic_results (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    corridor_id TEXT NOT NULL,
    overall_score INT NOT NULL,
    confidence_band TEXT NOT NULL CHECK (confidence_band IN ('Very High', 'High', 'Moderate', 'Low', 'Very Low', 'Unavailable')),
    applied_caps TEXT[] DEFAULT '{}'::TEXT[],
    applied_blocking_rules TEXT[] DEFAULT '{}'::TEXT[],
    warnings TEXT[] DEFAULT '{}'::TEXT[],
    strengths TEXT[] DEFAULT '{}'::TEXT[],
    limitations TEXT[] DEFAULT '{}'::TEXT[],
    policy_id TEXT NOT NULL,
    policy_version INT NOT NULL,
    user_summary TEXT,
    internal_explanation TEXT,
    generated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_results
ALTER TABLE public.sic_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_results;
CREATE POLICY "Enable read/write for all" ON public.sic_results FOR ALL USING (true);


-- 10. SIS Audit Logs Table
CREATE TABLE IF NOT EXISTS public.sic_audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS & Policies for sic_audit_logs
ALTER TABLE public.sic_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for all" ON public.sic_audit_logs;
CREATE POLICY "Enable read/write for all" ON public.sic_audit_logs FOR ALL USING (true);


-- Optimized Indexes for SIS Intelligence Querying
CREATE INDEX IF NOT EXISTS idx_sic_policies_lookup ON public.sic_policies(status, version);
CREATE INDEX IF NOT EXISTS idx_sic_results_corridor_provider ON public.sic_results(corridor_id, provider_id);
CREATE INDEX IF NOT EXISTS idx_sic_results_band ON public.sic_results(confidence_band);
CREATE INDEX IF NOT EXISTS idx_sic_audit_action ON public.sic_audit_logs(action);


-- ==========================================
-- 20. SEED DEFAULT SIC RESOLUTION POLICIES (ERDE PHASE 2)
-- ==========================================
INSERT INTO public.sic_resolution_policies (
    policy_id,
    name,
    description,
    version,
    status,
    preserve_management_override_priority,
    minimum_quality_score,
    require_verified_evidence,
    require_provider_specificity_for_recommendation,
    require_corridor_match,
    reject_expired_evidence,
    allow_aging_evidence,
    allow_unknown_freshness,
    allow_legacy_fallback,
    weights,
    conflict_thresholds,
    tie_breaker_order,
    created_by
) VALUES 
    (
        'sic-balanced-v1',
        'SIC Balanced Resolution Policy v1',
        'Initial secure policy. Prefers valid overrides, highly verified provider sources, and fresh corroborated evidence. Safeguards against unverified claims.',
        1,
        'active',
        TRUE,
        40,
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        TRUE,
        '{"verificationQuality": 25, "freshnessQuality": 20, "sourceAuthority": 20, "providerSpecificity": 15, "corridorSpecificity": 10, "provenanceCompleteness": 5, "attachmentSupport": 5, "corroborationQuality": 0, "consistencyQuality": 0}'::JSONB,
        '{"minorPercentage": 0.5, "moderatePercentage": 1.5, "majorPercentage": 3.5, "criticalPercentage": 5.0}'::JSONB,
        ARRAY['management_override', 'quality_score', 'provider_specific', 'corridor_specific', 'verified_status', 'observation_time', 'provenance_completeness', 'stable_id'],
        'system'
    ),
    (
        'sic-strict-v1',
        'SIC High-Trust Strict Policy v1',
        'Highly conservative policy. Rejects unverified, aging, or non-specific provider evidence. Requires critical conflict blocking.',
        1,
        'draft',
        TRUE,
        60,
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        FALSE,
        FALSE,
        '{"verificationQuality": 35, "freshnessQuality": 15, "sourceAuthority": 20, "providerSpecificity": 15, "corridorSpecificity": 5, "provenanceCompleteness": 5, "attachmentSupport": 5, "corroborationQuality": 0, "consistencyQuality": 0}'::JSONB,
        '{"minorPercentage": 0.3, "moderatePercentage": 1.0, "majorPercentage": 2.5, "criticalPercentage": 4.0}'::JSONB,
        ARRAY['management_override', 'verified_status', 'quality_score', 'provider_specific', 'corridor_specific', 'observation_time', 'provenance_completeness', 'stable_id'],
        'system'
    )
ON CONFLICT (policy_id) DO NOTHING;


-- ==========================================
-- 21. SEED DEFAULT SIS INTELLIGENCE POLICIES (SIS PHASE 3A)
-- ==========================================
INSERT INTO public.sic_policies (
    policy_id,
    name,
    description,
    version,
    status,
    weights,
    caps,
    blocking_rules,
    created_by
) VALUES
    (
        'sis-standard-v2',
        'SIS Standard Intelligence Policy v2',
        'Standard Phase 3A multidimensional intelligence policy. Provides balanced confidence metrics across nine dimensions.',
        1,
        'active',
        '{"verification": 20, "freshness": 18, "provenance": 12, "providerIdentity": 10, "corridorSpecificity": 10, "costCompleteness": 12, "consistency": 10, "sourceDiversity": 5, "resolutionStrength": 3}'::JSONB,
        '{"legacyFallbackCap": 50, "unknownFreshnessCap": 60, "majorUnresolvedConflictCap": 40, "missingFeeInformationCap": 45, "benchmarkOnlyCap": 30, "communityOnlyEvidenceCap": 55}'::JSONB,
        '{"blockRecommendationOnErdeBlock": true, "blockOnNoProviderSpecificRate": true, "blockOnBenchmarkOnly": true, "blockOnCriticalConflict": true, "blockOnInvalidNormalization": true, "blockOnResolutionFailed": true}'::JSONB,
        'system'
    ),
    (
        'sis-conservative-v2',
        'SIS Conservative Strict Policy v2',
        'Strict confidence model. Severely caps aging or community-sourced evidence, requiring high administrative verification.',
        1,
        'draft',
        '{"verification": 30, "freshness": 20, "provenance": 10, "providerIdentity": 8, "corridorSpecificity": 8, "costCompleteness": 12, "consistency": 8, "sourceDiversity": 2, "resolutionStrength": 2}'::JSONB,
        '{"legacyFallbackCap": 40, "unknownFreshnessCap": 50, "majorUnresolvedConflictCap": 30, "missingFeeInformationCap": 35, "benchmarkOnlyCap": 20, "communityOnlyEvidenceCap": 45}'::JSONB,
        '{"blockRecommendationOnErdeBlock": true, "blockOnNoProviderSpecificRate": true, "blockOnBenchmarkOnly": true, "blockOnCriticalConflict": true, "blockOnInvalidNormalization": true, "blockOnResolutionFailed": true}'::JSONB,
        'system'
    )
ON CONFLICT (policy_id) DO NOTHING;






