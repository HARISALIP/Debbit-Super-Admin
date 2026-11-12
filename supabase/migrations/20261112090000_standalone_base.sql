-- =============================================================================
-- Super Admin · its own Supabase project (12 Nov 2026)
--
-- Super Admin used to share the debbit-os project. This migration makes a fresh project stand on its own: the super_admins
-- allowlist (as 051) and debbit Pro "paid or not" (as monorepo 095, rebuilt from admin-pro-billing): pro_subscriptions,
-- pro_payments (append-only) and admin_record_pro_payment, which records a payment and moves paid_until forward, never back.
-- RLS on; pro_* tables have no policies or grants, so only the Edge Functions (service role, after requireSuperAdmin) reach them.
-- Safe to run more than once, and harmless on the shared project where these already exist.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS public.super_admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_super_admins_updated_at ON public.super_admins;
CREATE TRIGGER trg_super_admins_updated_at BEFORE UPDATE ON public.super_admins FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "super_admin_self_read" ON public.super_admins;
CREATE POLICY "super_admin_self_read" ON public.super_admins FOR SELECT TO authenticated USING (email = auth.email());
REVOKE ALL ON public.super_admins FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.super_admins FROM authenticated;

CREATE TABLE IF NOT EXISTS public.pro_subscriptions (
  shop_id     TEXT PRIMARY KEY CHECK (shop_id ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  shop_name   TEXT CHECK (char_length(shop_name) <= 140),
  plan        TEXT CHECK (char_length(plan) <= 60),
  price       NUMERIC(12,2) CHECK (price >= 0),
  currency    TEXT CHECK (currency ~ '^[A-Z]{3}$'),
  paid_until  DATE,
  trial_ends  DATE,
  notes       TEXT CHECK (char_length(notes) <= 1000),
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_pro_subscriptions_updated_at ON public.pro_subscriptions;
CREATE TRIGGER trg_pro_subscriptions_updated_at BEFORE UPDATE ON public.pro_subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.pro_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       TEXT NOT NULL REFERENCES public.pro_subscriptions (shop_id),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency      TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  paid_on       DATE NOT NULL,
  covers_until  DATE NOT NULL CHECK (covers_until >= paid_on),
  method        TEXT NOT NULL CHECK (method IN ('cash', 'mobile_money', 'bank_transfer', 'card', 'other')),
  reference     TEXT CHECK (char_length(reference) <= 120),
  note          TEXT CHECK (char_length(note) <= 500),
  recorded_by   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_payments_shop ON public.pro_payments (shop_id, paid_on DESC);
CREATE INDEX IF NOT EXISTS idx_pro_payments_paid_on ON public.pro_payments (paid_on);

CREATE OR REPLACE FUNCTION public.pro_payments_append_only() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'A recorded payment cannot be changed or deleted'; END $$;
DROP TRIGGER IF EXISTS trg_pro_payments_append_only ON public.pro_payments;
CREATE TRIGGER trg_pro_payments_append_only BEFORE UPDATE OR DELETE ON public.pro_payments FOR EACH ROW EXECUTE FUNCTION public.pro_payments_append_only();

-- Records one payment and moves paid_until forward (never back), in one transaction. Plain-sentence refusals are P0001.
CREATE OR REPLACE FUNCTION public.admin_record_pro_payment(
  p_shop_id TEXT, p_amount NUMERIC, p_currency TEXT, p_paid_on DATE, p_covers_until DATE,
  p_method TEXT, p_reference TEXT, p_note TEXT, p_recorded_by TEXT
) RETURNS public.pro_subscriptions LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE sub public.pro_subscriptions;
BEGIN
  SELECT * INTO sub FROM public.pro_subscriptions WHERE shop_id = p_shop_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Save this shop''s plan first, then record the payment.' USING ERRCODE = 'P0001'; END IF;
  IF sub.currency IS NOT NULL AND sub.currency <> upper(p_currency) THEN
    RAISE EXCEPTION 'This shop''s plan is in %, not %.', sub.currency, upper(p_currency) USING ERRCODE = 'P0001';
  END IF;
  INSERT INTO public.pro_payments (shop_id, amount, currency, paid_on, covers_until, method, reference, note, recorded_by)
  VALUES (p_shop_id, p_amount, upper(p_currency), p_paid_on, p_covers_until, p_method, p_reference, p_note, p_recorded_by);
  UPDATE public.pro_subscriptions
     SET paid_until = GREATEST(COALESCE(paid_until, p_covers_until), p_covers_until), updated_by = p_recorded_by
   WHERE shop_id = p_shop_id
  RETURNING * INTO sub;
  RETURN sub;
END $$;

ALTER TABLE public.pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pro_subscriptions, public.pro_payments FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_record_pro_payment(TEXT, NUMERIC, TEXT, DATE, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
