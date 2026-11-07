-- =============================================================================
-- Super Admin · daily snapshots of each Pro shop's figures (7 Nov 2026)
--
-- When a super admin opens the Pro customers list, admin-pro saves that day's headline counts for each shop once (later opens the
-- same day update the row). Nothing polls the shops. The customer page draws 90-day lines from these rows.
-- Counts only, as the gateway's read-only feed sends them: no names, emails, amounts or text. RLS on, no policies, no grants.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pro_snapshots (
  shop_id     TEXT NOT NULL CHECK (shop_id ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  day         DATE NOT NULL,
  figures     JSONB NOT NULL,
  taken_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, day)
);

ALTER TABLE public.pro_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pro_snapshots FROM anon, authenticated;
