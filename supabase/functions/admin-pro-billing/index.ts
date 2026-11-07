// =============================================================================
// debbit OS Super Admin Portal · Debbit Pro shops: paid or not
//
// Pro has no billing of its own, so debbit keeps each Pro shop's plan, price and "paid until" date here, and the payments it
// received, entered by hand. Tables pro_subscriptions and pro_payments (monorepo migration 095): RLS on, no policies, so only this
// function (service role, after requireSuperAdmin) reaches them. Payments are append-only; recording one moves paid_until forward
// in the same transaction (admin_record_pro_payment). Nothing here touches a Pro shop's own ERPNext records.
//
// Body: {op:'list'} | {op:'get', id} | {op:'save', id, shop_name?, plan?, price?, currency?, paid_until?, trial_ends?, notes?}
//     | {op:'record_payment', id, amount, currency, paid_on, covers_until, method, reference?, note?}
// =============================================================================
import { CORS_HEADERS, json, requireSuperAdmin, AuthzError } from '../_shared/authz.ts'

const SHOP_ID = /^[a-z0-9][a-z0-9-]{0,62}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const CURRENCY = /^[A-Za-z]{3}$/
const METHODS = ['cash', 'mobile_money', 'bank_transfer', 'card', 'other']
const NOT_READY = 'The Pro payments tables are not in the database yet. Apply migration 095_pro_subscriptions.sql first.'

class Bad extends Error {}
const text = (v: unknown, max: number, what: string): string | null => {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || v.length > max) throw new Bad(`${what} must be text of at most ${max} characters.`)
  return v.trim() || null
}
const date = (v: unknown, what: string, required = false): string | null => {
  if ((v === undefined || v === null || v === '') && !required) return null
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v + 'T00:00:00Z'))) throw new Bad(`${what} must be a date.`)
  return v
}
const money = (v: unknown, what: string, required = false): number | null => {
  if ((v === undefined || v === null || v === '') && !required) return null
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n) || n < 0 || n >= 1e10 || Math.round(n * 100) !== n * 100) throw new Bad(`${what} must be an amount with at most 2 decimals.`)
  return n
}
const currency = (v: unknown, required = false): string | null => {
  if ((v === undefined || v === null || v === '') && !required) return null
  if (typeof v !== 'string' || !CURRENCY.test(v)) throw new Bad('Currency must be a 3-letter code, like TZS or USD.')
  return v.toUpperCase()
}
// PostgREST says a table or function is missing with these codes; anything else is a real failure.
const missing = (e: { code?: string } | null) => !!e && ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(e.code ?? '')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  let supabase, email: string
  try {
    ;({ supabase, email } = await requireSuperAdmin(req))
  } catch (e) {
    const err = e as AuthzError
    return json({ ok: false, error: err.message }, err.status ?? 500)
  }

  const body = await req.json().catch(() => ({}))
  const op = body?.op
  const id = body?.id
  if (op !== 'list' && (typeof id !== 'string' || !SHOP_ID.test(id))) return json({ ok: false, error: 'Unknown shop' }, 400)

  try {
    if (op === 'list') {
      const { data, error } = await supabase.from('pro_subscriptions').select('*').order('shop_id')
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (error) throw error
      return json({ ok: true, subscriptions: data ?? [] })
    }

    if (op === 'get') {
      const [sub, pays] = await Promise.all([
        supabase.from('pro_subscriptions').select('*').eq('shop_id', id).maybeSingle(),
        supabase.from('pro_payments').select('*').eq('shop_id', id).order('paid_on', { ascending: false }).order('created_at', { ascending: false }).limit(100),
      ])
      if (missing(sub.error) || missing(pays.error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (sub.error) throw sub.error
      if (pays.error) throw pays.error
      return json({ ok: true, subscription: sub.data ?? null, payments: pays.data ?? [] })
    }

    if (op === 'save') {
      const row = {
        shop_id: id,
        shop_name: text(body.shop_name, 140, 'Shop name'),
        plan: text(body.plan, 60, 'Plan'),
        price: money(body.price, 'Price'),
        currency: currency(body.currency),
        paid_until: date(body.paid_until, 'Paid until'),
        trial_ends: date(body.trial_ends, 'Trial ends'),
        notes: text(body.notes, 1000, 'Notes'),
        updated_by: email,
      }
      const { data, error } = await supabase.from('pro_subscriptions').upsert(row, { onConflict: 'shop_id' }).select('*').single()
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (error) throw error
      console.log(JSON.stringify({ event: 'pro_subscription_saved', shop: id, by: email }))
      return json({ ok: true, subscription: data })
    }

    if (op === 'record_payment') {
      const amount = money(body.amount, 'Amount', true)!
      if (amount <= 0) throw new Bad('Amount must be more than zero.')
      const paidOn = date(body.paid_on, 'Paid on', true)!
      const coversUntil = date(body.covers_until, 'Covers until', true)!
      if (coversUntil < paidOn) throw new Bad('"Covers until" cannot be before the day it was paid.')
      if (!METHODS.includes(body.method)) throw new Bad('Choose how it was paid.')
      const { data, error } = await supabase.rpc('admin_record_pro_payment', {
        p_shop_id: id, p_amount: amount, p_currency: currency(body.currency, true), p_paid_on: paidOn, p_covers_until: coversUntil,
        p_method: body.method, p_reference: text(body.reference, 120, 'Reference'), p_note: text(body.note, 500, 'Note'), p_recorded_by: email,
      })
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      // The function's own refusals (no plan saved yet, wrong currency) are plain sentences meant for the admin.
      if (error?.code === 'P0001') return json({ ok: false, error: error.message }, 400)
      if (error) throw error
      console.log(JSON.stringify({ event: 'pro_payment_recorded', shop: id, by: email }))
      return json({ ok: true, subscription: data })
    }

    return json({ ok: false, error: 'Unknown request' }, 400)
  } catch (e) {
    if (e instanceof Bad) return json({ ok: false, error: e.message }, 400)
    console.error(JSON.stringify({ event: 'pro_billing_failed', op, error: (e as { message?: string })?.message ?? String(e) }))
    return json({ ok: false, error: 'Could not save. Try again.' }, 500)
  }
})
