# debbit OS — Super Admin Portal

Platform-level dashboard for debbit's owners: registered businesses, usage,
and who's paying vs. on trial. Separate from the main debbit app — its own
login (Supabase Auth, gated by the `super_admins` allowlist table), its own
deployment.

## Stack

- React + Vite + React Router, deployed to Vercel
- Supabase (Auth for login, Postgres for data, Edge Functions for every
  cross-tenant query — the browser only ever holds the anon key, never the
  service-role key)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

## Database & Edge Functions

`supabase/migrations/` and `supabase/functions/` are kept in sync with the
`debbit-os` Supabase project via its GitHub integration (Project Settings →
Integrations → GitHub) — every push to `main` applies new migrations and
redeploys changed functions automatically.

Every `admin-*` Edge Function starts by calling `requireSuperAdmin()`,
which verifies the caller's Supabase session belongs to an active row in
`super_admins` before touching any cross-business data with the
service-role key.

## debbit Pro shops (`/pro`)

Pro keeps each shop in its own ERPNext site, behind the Pro gateway (`openhousedebbit/debbitOG`). The **Pro shops** pages read it
through the `admin-pro` Edge Function, which checks `super_admins` and then calls the gateway's read-only admin API
(debbitOG `docs/SUPER-ADMIN-API.md`). Counts, dates and statuses only; nothing here changes a Pro shop.

Set two Edge Function secrets (Supabase → Project Settings → Edge Functions → Secrets):

| Secret | Value |
|---|---|
| `PRO_GATEWAY_URL` | the Pro gateway, e.g. `https://pro-gateway.onrender.com` (no trailing slash) |
| `PRO_ADMIN_KEY` | the same value as `DEBBIT_ADMIN_KEY` on the gateway |

Without them the page says Pro is not connected.

### Paid or not

Pro has no billing of its own. Each Pro shop's plan, price, "paid until" date and the payments debbit received are entered by hand on
the shop's page and kept in `pro_subscriptions` and `pro_payments` (monorepo `supabase/migrations/095_pro_subscriptions.sql`), through
the `admin-pro-billing` Edge Function. Only that function reaches the tables (RLS on, no policies). A saved payment cannot be changed
or deleted; recording one moves "paid until" forward, never back. Until migration 095 is applied, the pages say so and everything else
works as before.

### Customer records

What debbit itself knows about each Pro customer is kept here in Supabase only, never in the shop: a customer card (owner, contact,
country, stage, tags, account manager, AI consent), a notes timeline and a change log of everything any Super Admin saves. Tables
`pro_customers`, `pro_notes` and `super_admin_log` (migration `supabase/migrations/20261107180000_pro_customer_records.sql`), reached only
by the `admin-pro-crm` Edge Function. RLS is on with no policies; notes and the log are append-only (a trigger refuses edits and deletes).
Payments and plan changes in `admin-pro-billing` are written to the same log.

**The separation rule:** Super Admin's backend is Supabase only. It never connects to a shop's ERPNext database, the VPS or Render, and
it never changes a shop. Its only link to Pro is the gateway's read-only admin feed.
