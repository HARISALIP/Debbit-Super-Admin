// =============================================================================
// debbit OS Super Admin Portal · debbit Pro shops (read-only)
//
// Pro keeps every shop's records in its own ERPNext site, behind the Pro gateway. This function asks the gateway's admin read API
// (debbitOG docs/SUPER-ADMIN-API.md) for counts, dates and statuses only, after requireSuperAdmin() has checked the caller.
// The gateway key (PRO_ADMIN_KEY) lives only in this function's secrets: the browser never sees it. Without PRO_GATEWAY_URL and
// PRO_ADMIN_KEY it answers that Pro is not connected. It only reads; nothing here changes a Pro shop.
//
// Failures carry step: 'secrets' | 'unreachable' | 'gateway_off' | 'key', so the Connection card can say which switch is missing.
// Body: {op:'shops'} | {op:'shop', id:'<registry id>'} | {op:'health'} | {op:'trend', id}
//
// Each successful 'shops' read also saves that day's headline counts per shop in pro_snapshots (Supabase only, migration
// 20261107190000), so the customer page can draw 90-day lines without anything polling the shops. 'trend' reads those rows back.
// =============================================================================
import { CORS_HEADERS, json, requireSuperAdmin, AuthzError } from '../_shared/authz.ts'

const SHOP_ID = /^[a-z0-9][a-z0-9-]{0,62}$/

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  // deno-lint-ignore no-explicit-any
  let email: string, supabase: any
  try {
    ;({ email, supabase } = await requireSuperAdmin(req))
  } catch (e) {
    const err = e as AuthzError
    return json({ ok: false, error: err.message }, err.status ?? 500)
  }

  const base = (Deno.env.get('PRO_GATEWAY_URL') ?? '').trim().replace(/\/+$/, '')
  const key = (Deno.env.get('PRO_ADMIN_KEY') ?? '').trim()
  // HTTPS only; plain http only to this machine, for local testing.
  if (!/^(https:\/\/[A-Za-z0-9.-]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/.test(base) || key.length < 32) {
    return json({ ok: false, notConnected: true, step: 'secrets', error: 'debbit Pro is not connected yet. Set PRO_GATEWAY_URL and PRO_ADMIN_KEY in this project\'s Edge Function secrets.' }, 200)
  }

  const body = await req.json().catch(() => ({}))
  const op = body?.op
  if (op === 'trend') {
    if (typeof body.id !== 'string' || !SHOP_ID.test(body.id)) return json({ ok: false, error: 'Unknown shop' }, 400)
    const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase.from('pro_snapshots').select('day, figures').eq('shop_id', body.id).gte('day', since).order('day')
    if (error) return json({ ok: false, notReady: ['42P01', 'PGRST205'].includes(error.code ?? ''), error: 'Trends are not available yet. Apply migration 20261107190000_pro_snapshots.sql.' }, 200)
    return json({ ok: true, days: data ?? [] })
  }
  let path: string
  if (op === 'shops') path = 'v1/shops'
  else if (op === 'health') path = 'v1/health'
  else if (op === 'shop' && typeof body.id === 'string' && SHOP_ID.test(body.id)) path = 'v1/shops/' + body.id
  else return json({ ok: false, error: 'Unknown request' }, 400)

  let response: Response
  try {
    response = await fetch(`${base}/api/admin/${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}`, 'X-Debbit-Admin': email, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(25000),
    })
  } catch {
    return json({ ok: false, step: 'unreachable', error: 'The Pro gateway did not answer. It may be starting up; try again in a minute.' }, 502)
  }
  const data = await response.json().catch(() => null)
  if (response.status === 404 && op === 'shop') return json({ ok: false, error: 'No such Pro shop.' }, 404)
  if (response.status === 401) return json({ ok: false, step: 'key', error: 'The Pro gateway refused the admin key. Check PRO_ADMIN_KEY matches DEBBIT_ADMIN_KEY on the gateway.' }, 502)
  if (response.status === 404) return json({ ok: false, notConnected: true, step: 'gateway_off', error: 'The Pro gateway has no admin read API yet. Set DEBBIT_ADMIN_KEY on the gateway.' }, 200)
  if (!response.ok || !data || typeof data !== 'object') return json({ ok: false, error: `The Pro gateway answered ${response.status}.` }, 502)
  if (op === 'shops' && Array.isArray(data.shops)) await snapshot(supabase, data.shops)
  return json({ ok: true, ...data })
})

// Today's headline counts per shop, one row per shop per day. Never fails the read: without the table it only logs.
// deno-lint-ignore no-explicit-any
async function snapshot(supabase: any, shops: any[]) {
  const day = new Date().toISOString().slice(0, 10)
  const sum = (o: Record<string, number | null> | undefined) => Object.values(o ?? {}).reduce((n: number, v) => n + (v ?? 0), 0)
  const rows = shops.filter(s => s?.figures && typeof s.id === 'string' && SHOP_ID.test(s.id)).map(s => {
    const f = s.figures
    const ai = f.ai_this_month ?? {}
    return { shop_id: s.id, day, taken_at: new Date().toISOString(), figures: {
      people_enabled: f.people?.enabled ?? null, signed_in_7: f.people?.signed_in_last_7_days ?? null,
      documents_7: sum(f.activity?.last_7_days), documents_30: sum(f.activity?.last_30_days),
      ai_questions_month: ai.questions ?? null, ai_tokens_month: (ai.input_tokens ?? 0) + (ai.output_tokens ?? 0),
      support_open: f.support?.open ?? null, disk_used_percent: f.health?.disk_used_percent ?? null,
      errors_7: f.problems_7_days?.errors ?? null,
    } }
  })
  if (!rows.length) return
  const { error } = await supabase.from('pro_snapshots').upsert(rows, { onConflict: 'shop_id,day' })
  if (error) console.error(JSON.stringify({ event: 'pro_snapshot_failed', code: error.code }))
}
