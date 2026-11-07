// debbit Pro shops, as the Pro gateway's admin read API returns them (debbitOG docs/SUPER-ADMIN-API.md). Counts, dates and statuses only.

export type ProShopStatus = 'active' | 'suspended'
export type ProProblem = 'no_reader' | 'reader_refused' | 'unreachable'

export interface ProActivityCounts {
  sales_invoices: number | null
  till_sales: number | null
  supplier_bills: number | null
  payments: number | null
  journals: number | null
}

export interface ProTokens {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export interface ProSiteHealth {
  scheduler_on: boolean
  last_backup_at: string | null
  disk_used_percent: number | null
  versions: Record<string, string>
}

export interface ProShopFigures {
  site: string
  businesses: { name: string; country: string | null; currency: string | null; created: string | null }[]
  people: { enabled: number; disabled: number; signed_in_last_7_days: number; last_sign_in: string | null }
  activity: { last_sale_date: string | null; last_7_days: ProActivityCounts; last_30_days: ProActivityCounts }
  support: { waiting_for_debbit: number; open: number } | null
  ai_this_month: { month: string; questions: number } & ProTokens
  health: ProSiteHealth
  // Sent by gateways with the richer admin feed (debbitOG, 7 Nov 2026); missing on older sites.
  setup?: ProSetup
  ai_rules?: ProAiRules | null
  country_apps?: string[]
  problems_7_days?: { errors: number | null; failed_emails: number | null }
  daily?: ProDay[]
}

export interface ProSetup {
  records: { customers: number | null; suppliers: number | null; products: number | null; warehouses: number | null; bank_accounts: number | null; tax_templates: number | null }
  opening: { account_balances: boolean; customer_balances: boolean; supplier_balances: boolean; opening_stock: boolean }
}

export interface ProAiRules {
  paused: boolean
  version: number
  // Capability ids ticked per AI identity, e.g. {"ai:assistant": ["customers.list", ...]}
  ticked: Record<string, string[]>
  approvers: number
}

export interface ProDay { date: string; documents: number; sign_ins: number }

export interface ProRecentDoc {
  kind: string
  date: string | null
  by: string
  state: 'in force' | 'cancelled'
  at: string | null
}

export interface ProShopRow {
  id: string
  site: string
  status: ProShopStatus
  figures: ProShopFigures | null
  problem?: ProProblem
  // What the gateway switched on for this shop (never a key). Missing on older gateways.
  gateway?: { ai: boolean; account_mail: boolean }
}

export interface ProPerson {
  email: string
  full_name: string
  enabled: boolean
  access: string[]
  debbit_staff: boolean
  last_sign_in: string | null
  last_active: string | null
  added: string | null
}

export interface ProAiUsageRow extends ProTokens {
  month: string
  task: string
  model: string
  calls: number
}

export interface ProShopDetail extends ProShopRow {
  people: ProPerson[] | null
  ai_usage: ProAiUsageRow[] | null
  recent?: ProRecentDoc[] | null
}

export interface ProHealth {
  gateway: { version: string | null; node: string; uptime_seconds: number; memory_mb: number; ai?: { models: Record<string, string>; monthly_questions: number | null } | null }
  sessions_ok: boolean | null
  memberships_ok: boolean | null
  sites: { id: string; site: string; status: ProShopStatus; reachable: boolean; ms: number | null; health?: ProSiteHealth | null; problem?: ProProblem }[]
}

// Paid or not: kept by hand in the Super Admin (admin-pro-billing, monorepo migration 095). Pro itself has no billing.
export type ProPaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'other'

export interface ProSubscription {
  shop_id: string
  shop_name: string | null
  plan: string | null
  price: number | null
  currency: string | null
  paid_until: string | null
  trial_ends: string | null
  notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ProPayment {
  id: string
  shop_id: string
  amount: number
  currency: string
  paid_on: string
  covers_until: string
  method: ProPaymentMethod
  reference: string | null
  note: string | null
  recorded_by: string
  created_at: string
}

// What debbit itself knows about a Pro customer, kept in Supabase only (admin-pro-crm, migration 20261107180000).
export type ProStage = 'trial' | 'onboarding' | 'live' | 'paused' | 'left'
export type ProAiConsent = 'not_asked' | 'asked' | 'agreed' | 'refused'
export type ProNoteKind = 'note' | 'call' | 'visit' | 'email' | 'issue' | 'training'

export interface ProCustomer {
  shop_id: string
  business_name: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  country: string | null
  city: string | null
  industry: string | null
  stage: ProStage
  tags: string[]
  account_manager: string | null
  started_on: string | null
  ai_consent: ProAiConsent
  ai_consent_on: string | null
  updated_by: string
  created_at: string
  updated_at: string
}

export interface ProNote {
  id: string
  shop_id: string
  kind: ProNoteKind
  body: string
  created_by: string
  created_at: string
}

export interface SuperAdminLogEntry {
  id: number
  at: string
  admin_email: string
  action: string
  target: string | null
  detail: Record<string, unknown>
}

// One saved day of a shop's headline counts (admin-pro, pro_snapshots).
export interface ProSnapshot {
  day: string
  figures: { people_enabled: number | null; signed_in_7: number | null; documents_7: number; documents_30: number; ai_questions_month: number | null
    ai_tokens_month: number; support_open: number | null; disk_used_percent: number | null; errors_7: number | null }
}
