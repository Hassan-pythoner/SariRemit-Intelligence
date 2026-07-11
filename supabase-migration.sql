-- ====================================================
-- SAFS SQL MIGRATION FOR SUPABASE SQL EDITOR
-- ====================================================

-- 1. Create community_transfer_verifications table if not exists
CREATE TABLE IF NOT EXISTS public.community_transfer_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    corridor_id TEXT NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL,
    transfer_fee NUMERIC(8, 2) NOT NULL,
    send_amount NUMERIC(12, 2) NOT NULL,
    receive_amount NUMERIC(12, 2) NOT NULL,
    submitted_by_name TEXT NOT NULL,
    submitted_by_email TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    screenshot_name TEXT,
    screenshot_url TEXT,
    screenshot_storage_path TEXT,
    vat_amount NUMERIC(8, 2),
    other_costs NUMERIC(8, 2),
    genuine_confirmation BOOLEAN DEFAULT false,
    transaction_time TIMESTAMPTZ DEFAULT now(),
    transfer_channel TEXT,
    
    -- SAFS Screening & Moderation Fields
    status TEXT DEFAULT 'pending' NOT NULL, -- maps to submission_status / status
    verification_status TEXT DEFAULT 'pending_review' NOT NULL,
    fraud_status TEXT DEFAULT 'screening' NOT NULL,
    risk_level TEXT DEFAULT 'unassessed' NOT NULL,
    risk_score INTEGER DEFAULT 0,
    risk_reasons JSONB DEFAULT '[]'::jsonb,
    screenshot_hash TEXT,
    duplicate_of UUID,
    eligible_for_rre BOOLEAN DEFAULT false,
    screened_at TIMESTAMPTZ,
    review_priority TEXT DEFAULT 'normal',
    reviewed_by TEXT, -- references user_profiles(id)
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if the table already existed
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_review';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS fraud_status TEXT DEFAULT 'screening';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'unassessed';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS risk_reasons JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS screenshot_hash TEXT;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS duplicate_of UUID;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS eligible_for_rre BOOLEAN DEFAULT false;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS screened_at TIMESTAMPTZ;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS review_priority TEXT DEFAULT 'normal';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT '';
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS screenshot_storage_path TEXT;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS transfer_channel TEXT;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS genuine_confirmation BOOLEAN DEFAULT false;
ALTER TABLE public.community_transfer_verifications ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMPTZ;

-- 2. Create fraud_review_events table
CREATE TABLE IF NOT EXISTS public.fraud_review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.community_transfer_verifications(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    risk_level TEXT,
    risk_score INTEGER,
    reasons JSONB DEFAULT '[]'::jsonb,
    previous_status TEXT,
    new_status TEXT,
    reviewed_by TEXT REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indices for speed and integrity optimization
CREATE INDEX IF NOT EXISTS idx_ctv_verification_status ON public.community_transfer_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_ctv_fraud_status ON public.community_transfer_verifications(fraud_status);
CREATE INDEX IF NOT EXISTS idx_ctv_risk_level ON public.community_transfer_verifications(risk_level);
CREATE INDEX IF NOT EXISTS idx_ctv_submitted_by_email ON public.community_transfer_verifications(submitted_by_email);
CREATE INDEX IF NOT EXISTS idx_ctv_provider_corridor ON public.community_transfer_verifications(provider_id, corridor_id);
CREATE INDEX IF NOT EXISTS idx_ctv_created_at ON public.community_transfer_verifications(created_at);
CREATE INDEX IF NOT EXISTS idx_ctv_screenshot_hash ON public.community_transfer_verifications(screenshot_hash);

-- 4. Enable RLS on newly created tables
ALTER TABLE public.community_transfer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_review_events ENABLE ROW LEVEL SECURITY;

-- 5. Open security policies for preview convenience
DROP POLICY IF EXISTS "Enable read access for all" ON public.community_transfer_verifications;
DROP POLICY IF EXISTS "Enable all access for all" ON public.community_transfer_verifications;
CREATE POLICY "Enable read access for all" ON public.community_transfer_verifications FOR SELECT USING (true);
CREATE POLICY "Enable all access for all" ON public.community_transfer_verifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read access for all" ON public.fraud_review_events;
DROP POLICY IF EXISTS "Enable all access for all" ON public.fraud_review_events;
CREATE POLICY "Enable read access for all" ON public.fraud_review_events FOR SELECT USING (true);
CREATE POLICY "Enable all access for all" ON public.fraud_review_events FOR ALL USING (true);
