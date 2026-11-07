// =============================================================================
// debbit OS Super Admin Portal · Debbit Pro shops (read-only)
//
// Pro keeps every shop's records in its own ERPNext site, behind the Pro gateway. This function asks the gateway's admin read API
// (debbitOG docs/SUPER-ADMIN-API.md) for counts, dates and statuses only, after requireSuperAdmin() has checked the caller.
// The gateway key (PRO_ADMIN_KEY) lives only in this function's secrets: the browser never sees it. Without PRO_GATEWAY_URL and
// PRO_ADMIN_KEY it answers that Pro is not connected. It only reads; nothing here changes a Pro shop.
//
// Body: {op:'shops'} | {op:'shop', id:'<registry id>'} | {op:'health'}
// =============================================================================
import { CORS_HEADERS, json, requireSuperAdmin, AuthzError } from '../_shared/authz.ts'

const SHOP_ID = /^[a-z0-9][a-z0-9-]{0,62}$/

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  let email: string
  try {
    ;({ email } = await requireSuperAdmin(req))
  } catch (e) {
    const err = e as AuthzError
    return json({ ok: false, error: err.message }, err.status ?? 500)
  }

  const base = (Deno.env.get('PRO_GATEWAY_URL') ?? '').trim().replace(/\/+$/, '')
  const key = (Deno.env.get('PRO_ADMIN_KEY') ?? '').trim()
  // HTTPS only; plain http only to this machine, for local testing.
  if (!/^(https:\/\/[A-Za-z0-9.-]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/.test(base) || key.length < 32) {
    return json({ ok: false, notConnected: true, error: 'Debbit Pro is not connected yet. Set PRO_GATEWAY_URL and PRO_ADMIN_KEY in this project\'s Edge Function secrets.' }, 200)
  }

  const body = await req.json().catch(() => ({}))
  const op = body?.op
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
    return json({ ok: false, error: 'The Pro gateway did not answer. It may be starting up; try again in a minute.' }, 502)
  }
  const data = await response.json().catch(() => null)
  if (response.status === 404 && op === 'shop') return json({ ok: false, error: 'No such Pro shop.' }, 404)
  if (response.status === 401) return json({ ok: false, error: 'The Pro gateway refused the admin key. Check PRO_ADMIN_KEY matches DEBBIT_ADMIN_KEY on the gateway.' }, 502)
  if (response.status === 404) return json({ ok: false, notConnected: true, error: 'The Pro gateway has no admin read API yet. Set DEBBIT_ADMIN_KEY on the gateway.' }, 200)
  if (!response.ok || !data || typeof data !== 'object') return json({ ok: false, error: `The Pro gateway answered ${response.status}.` }, 502)
  return json({ ok: true, ...data })
})
