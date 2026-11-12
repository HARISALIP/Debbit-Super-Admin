import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ProShopDetail, ProShopRow } from '../../types'
import { callPro } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'

// The Businesses, Users, Usage, Health and Billing pages for debbit Pro. Everything is read through the same read-only Pro feed as
// Pro shops (admin-pro → gateway /api/admin/v1): counts, dates, names and statuses. Nothing on these pages changes a shop.

export function shopName(r: ProShopRow): string {
  return r.figures?.businesses[0]?.name ?? r.id
}

/** Every Pro shop from the list read; with details, also each shop's own read (people list, AI use by month). */
export function useProShops(details = false) {
  const [shops, setShops] = useState<ProShopRow[]>([])
  const [detail, setDetail] = useState<Record<string, ProShopDetail | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const list = await callPro<{ shops: ProShopRow[] }>('shops')
    if (!list.ok) { setError(list.error); setShops([]); setDetail({}); setLoading(false); return }
    setShops(list.data.shops)
    if (details) {
      const reads = await Promise.all(list.data.shops.map(r => callPro<ProShopDetail>('shop', r.id)))
      setDetail(Object.fromEntries(list.data.shops.map((r, i) => [r.id, reads[i].ok ? reads[i].data : null])))
    }
    setLoading(false)
  }, [details])
  useEffect(() => { void load() }, [load])
  return { shops, detail, loading, error, load }
}

export function ProPage({ title, subtitle, onRefresh, error, children }: { title: string; subtitle: string; onRefresh: () => void; error: string | null; children: ReactNode }) {
  return (
    <div className="fade-in">
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>{title}</h1>
          <p style={s.subtitle}>{subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={onRefresh}>🔄 Refresh</button>
      </div>
      {error && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--amber, #d97706)', fontSize: 13 }}>ℹ️ {error} The Connection card on Pro shops says what is missing.</div>}
      {children}
    </div>
  )
}

export const muted = { color: 'var(--text-muted)' }
