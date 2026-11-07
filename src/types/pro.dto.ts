// Debbit Pro shops, as the Pro gateway's admin read API returns them (debbitOG docs/SUPER-ADMIN-API.md). Counts, dates and statuses only.

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
}

export interface ProShopRow {
  id: string
  site: string
  status: ProShopStatus
  figures: ProShopFigures | null
  problem?: ProProblem
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
}

export interface ProHealth {
  gateway: { version: string | null; node: string; uptime_seconds: number; memory_mb: number }
  sessions_ok: boolean | null
  memberships_ok: boolean | null
  sites: { id: string; site: string; status: ProShopStatus; reachable: boolean; ms: number | null; health?: ProSiteHealth | null; problem?: ProProblem }[]
}
