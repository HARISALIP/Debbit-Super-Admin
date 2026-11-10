// =============================================================================
// debbit OS Super Admin Portal · debbit Pro customer records
//
// What debbit knows about each Pro customer, kept here in Supabase only (migration 20261107180000_pro_customer_records.sql):
// the customer card (owner, contact, stage, tags, AI consent), a notes timeline (append-only) and the Super Admin change log.
// Only this function (service role, after requireSuperAdmin) reaches the tables. Nothing here touches a Pro shop.
//
// Body: {op:'list'} | {op:'get', id} | {op:'save', id, ...card} | {op:'add_note', id, kind, body} | {op:'log', id?}
// =============================================================================
import { CORS_HEADERS, json, requireSuperAdmin, AuthzError } from '../_shared/authz.ts'

const SHOP_ID = /^[a-z0-9][a-z0-9-]{0,62}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const STAGES = ['trial', 'onboarding', 'live', 'paused', 'left']
const CONSENT = ['not_asked', 'asked', 'agreed', 'refused']
const KINDS = ['note', 'call', 'visit', 'email', 'issue', 'training']
const NOT_READY = 'The customer records tables are not in the database yet. Apply migration 20261107180000_pro_customer_records.sql first.'

class Bad extends Error {}
const text = (v: unknown, max: number, what: string): string | null => {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || v.length > max) throw new Bad(`${what} must be text of at most ${max} characters.`)
  return v.trim() || null
}
const date = (v: unknown, what: string): string | null => {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v + 'T00:00:00Z'))) throw new Bad(`${what} must be a date.`)
  return v
}
const oneOf = (v: unknown, list: string[], what: string, fallback: string): string => {
  if (v === undefined || v === null || v === '') return fallback
  if (typeof v !== 'string' || !list.includes(v)) throw new Bad(`Choose ${what} from the list.`)
  return v
}
const tags = (v: unknown): string[] => {
  if (v === undefined || v === null) return []
  if (!Array.isArray(v) || v.length > 20 || !v.every(t => typeof t === 'string' && t.trim().length > 0 && t.length <= 30)) throw new Bad('Tags: at most 20, each up to 30 characters.')
  return [...new Set(v.map(t => (t as string).trim().toLowerCase()))]
}
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
  const needsId = op !== 'list' && !(op === 'log' && (id === undefined || id === null))
  if (needsId && (typeof id !== 'string' || !SHOP_ID.test(id))) return json({ ok: false, error: 'Unknown shop' }, 400)
  const log = (action: string, detail: Record<string, unknown>) =>
    supabase.from('super_admin_log').insert({ admin_email: email, action, target: id ?? null, detail })

  try {
    if (op === 'list') {
      const { data, error } = await supabase.from('pro_customers').select('*').order('shop_id')
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (error) throw error
      return json({ ok: true, customers: data ?? [] })
    }

    if (op === 'get') {
      const [card, notes] = await Promise.all([
        supabase.from('pro_customers').select('*').eq('shop_id', id).maybeSingle(),
        supabase.from('pro_notes').select('*').eq('shop_id', id).order('created_at', { ascending: false }).limit(200),
      ])
      if (missing(card.error) || missing(notes.error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (card.error) throw card.error
      if (notes.error) throw notes.error
      return json({ ok: true, customer: card.data ?? null, notes: notes.data ?? [] })
    }

    if (op === 'save') {
      const ownerEmail = text(body.owner_email, 254, 'Owner email')
      if (ownerEmail && !EMAIL.test(ownerEmail)) throw new Bad('Owner email does not look like an email address.')
      const consent = oneOf(body.ai_consent, CONSENT, 'the AI consent answer', 'not_asked')
      const row = {
        shop_id: id,
        business_name: text(body.business_name, 140, 'Business name'),
        owner_name: text(body.owner_name, 140, 'Owner name'),
        owner_email: ownerEmail,
        owner_phone: text(body.owner_phone, 40, 'Phone'),
        country: text(body.country, 60, 'Country'),
        city: text(body.city, 80, 'City'),
        industry: text(body.industry, 60, 'Industry'),
        stage: oneOf(body.stage, STAGES, 'a stage', 'onboarding'),
        tags: tags(body.tags),
        account_manager: text(body.account_manager, 140, 'Account manager'),
        started_on: date(body.started_on, 'Started on'),
        ai_consent: consent,
        ai_consent_on: consent === 'agreed' || consent === 'refused' ? date(body.ai_consent_on, 'Consent date') : null,
        updated_by: email,
      }
      const before = await supabase.from('pro_customers').select('*').eq('shop_id', id).maybeSingle()
      if (missing(before.error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (before.error) throw before.error
      const { data, error } = await supabase.from('pro_customers').upsert(row, { onConflict: 'shop_id' }).select('*').single()
      if (error) throw error
      // Which fields changed, not their old values: enough to see who changed what and when.
      const changed = Object.keys(row).filter(k => !['updated_by'].includes(k) && JSON.stringify((before.data as Record<string, unknown> | null)?.[k] ?? null) !== JSON.stringify((row as Record<string, unknown>)[k]))
      if (changed.length) { const r = await log('customer_saved', { changed }); if (r.error) throw r.error }
      return json({ ok: true, customer: data })
    }

    if (op === 'add_note') {
      const kind = oneOf(body.kind, KINDS, 'what kind of note', 'note')
      const note = text(body.body, 4000, 'The note')
      if (!note) throw new Bad('Write the note first.')
      const { data, error } = await supabase.from('pro_notes').insert({ shop_id: id, kind, body: note, created_by: email }).select('*').single()
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (error) throw error
      const r = await log('note_added', { kind, note_id: data.id }); if (r.error) throw r.error
      return json({ ok: true, note: data })
    }

    if (op === 'log') {
      let q = supabase.from('super_admin_log').select('*').order('at', { ascending: false }).limit(200)
      if (id) q = q.eq('target', id)
      const { data, error } = await q
      if (missing(error)) return json({ ok: false, notReady: true, error: NOT_READY })
      if (error) throw error
      return json({ ok: true, log: data ?? [] })
    }

    return json({ ok: false, error: 'Unknown request' }, 400)
  } catch (e) {
    if (e instanceof Bad) return json({ ok: false, error: e.message }, 400)
    console.error(JSON.stringify({ event: 'pro_crm_failed', op, error: (e as { message?: string })?.message ?? String(e) }))
    return json({ ok: false, error: 'Could not save. Try again.' }, 500)
  }
})
