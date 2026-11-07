-- =============================================================================
-- Super Admin · debbit Pro customer records (7 Nov 2026)
--
-- What debbit itself knows about each Pro customer, kept only here in Supabase, never in a shop's ERPNext site:
--   pro_customers     one card per Pro shop (registry id): who the owner is, how to reach them, where they are in onboarding
--   pro_notes         a timeline of notes, calls and visits; append-only (a note can never be edited or deleted)
--   super_admin_log   every change any Super Admin makes through the portal; append-only
--
-- RLS is on with no policies, and anon/authenticated have no grants, so only the Edge Functions (service role, after
-- requireSuperAdmin) reach these tables. Safe to run more than once.
-- Version is a timestamp so it can never collide with the numbered debbit OS migrations in the same project.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pro_customers (
  shop_id          TEXT PRIMARY KEY CHECK (shop_id ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  business_name    TEXT CHECK (char_length(business_name) <= 140),
  owner_name       TEXT CHECK (char_length(owner_name) <= 140),
  owner_email      TEXT CHECK (char_length(owner_email) <= 254),
  owner_phone      TEXT CHECK (char_length(owner_phone) <= 40),
  country          TEXT CHECK (char_length(country) <= 60),
  city             TEXT CHECK (char_length(city) <= 80),
  industry         TEXT CHECK (char_length(industry) <= 60),
  stage            TEXT NOT NULL DEFAULT 'onboarding' CHECK (stage IN ('trial', 'onboarding', 'live', 'paused', 'left')),
  tags             TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 20),
  account_manager  TEXT CHECK (char_length(account_manager) <= 140),
  started_on       DATE,
  ai_consent       TEXT NOT NULL DEFAULT 'not_asked' CHECK (ai_consent IN ('not_asked', 'asked', 'agreed', 'refused')),
  ai_consent_on    DATE,
  updated_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pro_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     TEXT NOT NULL CHECK (shop_id ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  kind        TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note', 'call', 'visit', 'email', 'issue', 'training')),
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_notes_shop ON public.pro_notes (shop_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.super_admin_log (
  id           BIGSERIAL PRIMARY KEY,
  at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_email  TEXT NOT NULL,
  action       TEXT NOT NULL CHECK (char_length(action) <= 60),
  target       TEXT CHECK (char_length(target) <= 120),
  detail       JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_super_admin_log_at ON public.super_admin_log (at DESC);
CREATE INDEX IF NOT EXISTS idx_super_admin_log_target ON public.super_admin_log (target, at DESC);

-- updated_at on the card
CREATE OR REPLACE FUNCTION public.pro_touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_pro_customers_updated_at ON public.pro_customers;
CREATE TRIGGER trg_pro_customers_updated_at BEFORE UPDATE ON public.pro_customers FOR EACH ROW EXECUTE FUNCTION public.pro_touch_updated_at();

-- Notes and the log are append-only, even for the service role.
CREATE OR REPLACE FUNCTION public.pro_append_only() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% rows cannot be changed or deleted', TG_TABLE_NAME; END $$;
DROP TRIGGER IF EXISTS trg_pro_notes_append_only ON public.pro_notes;
CREATE TRIGGER trg_pro_notes_append_only BEFORE UPDATE OR DELETE ON public.pro_notes FOR EACH ROW EXECUTE FUNCTION public.pro_append_only();
DROP TRIGGER IF EXISTS trg_super_admin_log_append_only ON public.super_admin_log;
CREATE TRIGGER trg_super_admin_log_append_only BEFORE UPDATE OR DELETE ON public.super_admin_log FOR EACH ROW EXECUTE FUNCTION public.pro_append_only();

ALTER TABLE public.pro_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pro_customers, public.pro_notes, public.super_admin_log FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.super_admin_log_id_seq FROM anon, authenticated;
