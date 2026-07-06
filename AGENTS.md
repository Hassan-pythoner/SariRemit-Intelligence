# Project Guidelines and Database Setup

This project is configured for hosting on **Netlify** with state persistence handled by **Supabase**.

## Netlify Deployment Settings

When deploying this project to Netlify, configure the following environment variables in your Netlify site settings (**Site settings > Environment variables**):

| Variable Name | Description | Example / Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Project Public/Anon Key | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Required for Gemini AI exchange rate predictions | `AIzaSy...` |

## Supabase PostgreSQL Schema Setup

To initialize your Supabase database, navigate to the **SQL Editor** in your Supabase dashboard and run the following script:

```sql
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

-- 3. Table for App Configurations (Key-Value Settings)
CREATE TABLE IF NOT EXISTS app_config (
  "key" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Disable Row Level Security (RLS) so client can query/insert directly
-- (Or create custom RLS policies for read/write permissions)
ALTER TABLE admin_overrides DISABLE ROW LEVEL SECURITY;
ALTER TABLE crowdsourced_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;
```

## Local Development and Fail-safe Execution

This application implements an **offline-first and local fallback model**:
- If Supabase credentials are not found at runtime, the application gracefully operates using `localStorage` and queries local fallback APIs (such as local Node/Express backend configuration), ensuring the application remains 100% interactive and functional even before cloud resources are provisioned.
- Once Supabase credentials are provided, data synchronizes with the cloud PostgreSQL database in real time.
