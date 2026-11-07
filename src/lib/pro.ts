import { supabase } from './supabase'

// Every Pro read goes through the admin-pro Edge Function, which checks super_admins and holds the Pro gateway key.
export type ProResult<T> = { ok: true; data: T } | { ok: false; error: string; notConnected?: boolean }

export async function callPro<T>(op: 'shops' | 'shop' | 'health', id?: string): Promise<ProResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string; notConnected?: boolean } & T>('admin-pro', { body: { op, id } })
    if (error || !data?.ok) return { ok: false, error: data?.error || error?.message || 'Could not reach Debbit Pro', notConnected: !!data?.notConnected }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not reach Debbit Pro' }
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
