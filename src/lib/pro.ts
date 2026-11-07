import { supabase } from './supabase'

// Every Pro read goes through the admin-pro Edge Function, which checks super_admins and holds the Pro gateway key.
export type ProResult<T> = { ok: true; data: T } | { ok: false; error: string; notConnected?: boolean }

export async function callPro<T>(op: 'shops' | 'shop' | 'health' | 'trend', id?: string): Promise<ProResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; notConnected?: boolean } & T>('admin-pro', { body: { op, id } })
    if (error || !data?.ok) return { ok: false, error: data?.error || error?.message || 'Could not reach debbit Pro', notConnected: !!data?.notConnected }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not reach debbit Pro' }
  }
}

export const PROBLEM_TEXT: Record<string, string> = {
  no_reader: 'No admin reader account on this site yet',
  reader_refused: 'The site refused the admin reader',
  unreachable: 'Site not reachable',
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return '—'
  const h = Math.floor(ms / 3600000)
  if (h < 1) return 'within the hour'
  if (h < 48) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString())

// Rough Claude cost per million tokens (USD), for an estimate only; the real bill is Anthropic's. Unknown models are left out.
const PRICE: { match: RegExp; input: number; output: number }[] = [
  { match: /haiku/i, input: 1, output: 5 },
  { match: /sonnet/i, input: 3, output: 15 },
  { match: /opus/i, input: 5, output: 25 },
]
export function estimateUsd(model: string, input: number, output: number, cacheRead = 0, cacheWrite = 0): number | null {
  const p = PRICE.find(x => x.match.test(model))
  if (!p) return null
  return (input * p.input + output * p.output + cacheRead * p.input * 0.1 + cacheWrite * p.input * 1.25) / 1_000_000
}

// Paid or not, through the admin-pro-billing Edge Function (super_admins checked there). notReady: the migration is not applied yet.
export type BillingResult<T> = { ok: true; data: T } | { ok: false; error: string; notReady?: boolean }

export async function callProBilling<T>(body: Record<string, unknown>): Promise<BillingResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; notReady?: boolean } & T>('admin-pro-billing', { body })
    if (error || !data?.ok) {
      // A 400 carries a plain sentence in the body; supabase-js puts the response on error.context.
      let message = data?.error
      const ctx = (error as { context?: Response } | null)?.context
      if (!message && ctx && typeof ctx.json === 'function') message = await ctx.json().then((b: { error?: string }) => b?.error).catch(() => undefined)
      return { ok: false, error: message || error?.message || 'Could not reach the payments store', notReady: !!data?.notReady }
    }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not reach the payments store' }
  }
}

export const METHOD_TEXT: Record<string, string> = { cash: 'Cash', mobile_money: 'Mobile money', bank_transfer: 'Bank transfer', card: 'Card', other: 'Other' }

export type PaidState = { label: string; variant: 'green' | 'amber' | 'red' | 'muted' | 'cyan'; rank: number }

/** Paid, due soon (7 days or less), overdue, on trial, or not set. Dates are whole days in UTC, as stored. */
export function paidState(sub: { paid_until: string | null; trial_ends: string | null } | null | undefined, today = new Date().toISOString().slice(0, 10)): PaidState {
  const days = (d: string) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000)
  if (sub?.paid_until && days(sub.paid_until) >= 0) {
    const left = days(sub.paid_until)
    return left <= 7 ? { label: left === 0 ? 'Due today' : `Due in ${left}d`, variant: 'amber', rank: 2 } : { label: `Paid to ${sub.paid_until}`, variant: 'green', rank: 4 }
  }
  if (sub?.trial_ends && days(sub.trial_ends) >= 0) return { label: `Trial to ${sub.trial_ends}`, variant: 'cyan', rank: 3 }
  if (sub?.paid_until) return { label: `Overdue ${-days(sub.paid_until)}d`, variant: 'red', rank: 0 }
  if (sub?.trial_ends) return { label: 'Trial ended', variant: 'red', rank: 0 }
  return { label: 'Not set', variant: 'muted', rank: 1 }
}

/** The day before the same date next month(s): a payment made on 7 Nov for one month covers until 6 Dec. */
export function addMonths(from: string, months: number): string {
  const d = new Date(from + 'T00:00:00Z')
  const day = d.getUTCDate()
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  // 31 Jan + 1 month: February has no 31st, so it covers to its last day rather than the day before.
  if (day > last) d.setUTCDate(last)
  else { d.setUTCDate(day); d.setUTCDate(d.getUTCDate() - 1) }
  return d.toISOString().slice(0, 10)
}

// Customer records (card, notes, change log), through the admin-pro-crm Edge Function (super_admins checked there).
export async function callProCrm<T>(body: Record<string, unknown>): Promise<BillingResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; notReady?: boolean } & T>('admin-pro-crm', { body })
    if (error || !data?.ok) {
      let message = data?.error
      const ctx = (error as { context?: Response } | null)?.context
      if (!message && ctx && typeof ctx.json === 'function') message = await ctx.json().then((b: { error?: string }) => b?.error).catch(() => undefined)
      return { ok: false, error: message || error?.message || 'Could not reach the customer records', notReady: !!data?.notReady }
    }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not reach the customer records' }
  }
}

export const STAGE_TEXT: Record<string, { label: string; variant: PaidState['variant'] }> = {
  trial: { label: 'Trial', variant: 'cyan' }, onboarding: { label: 'Onboarding', variant: 'amber' }, live: { label: 'Live', variant: 'green' },
  paused: { label: 'Paused', variant: 'muted' }, left: { label: 'Left', variant: 'red' },
}
export const CONSENT_TEXT: Record<string, string> = { not_asked: 'Not asked yet', asked: 'Asked, waiting', agreed: 'Agreed', refused: 'Said no' }
export const NOTE_KIND_TEXT: Record<string, string> = { note: 'Note', call: 'Call', visit: 'Visit', email: 'Email', issue: 'Issue', training: 'Training' }
