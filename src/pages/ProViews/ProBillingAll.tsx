import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProSubscription } from '../../types'
import { PaidState, callProBilling, fmt, paidState } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'
import { ProPage, muted, shopName, useProShops } from './shared'

type Row = { id: string; name: string; plan: string; price: string; paidUntil: string | null; trialEnds: string | null; paid: PaidState; hasPlan: boolean }

// Paid or not for every Pro shop, from the plans and payments kept in Super Admin. Plans and payments are entered on each shop's page.
export default function ProBillingAll() {
  const navigate = useNavigate()
  const { shops, loading, error, load } = useProShops()
  const [subs, setSubs] = useState<ProSubscription[]>([])
  const [received, setReceived] = useState<Record<string, number>>({})
  const [note, setNote] = useState<string | null>(null)
  useEffect(() => {
    void Promise.all([callProBilling<{ subscriptions: ProSubscription[] }>({ op: 'list' }), callProBilling<{ received: Record<string, number> }>({ op: 'summary' })]).then(([l, sm]) => {
      setSubs(l.ok ? l.data.subscriptions : []); setReceived(sm.ok ? sm.data.received : {}); setNote(l.ok ? null : l.error)
    })
  }, [shops])
  const byId = new Map(subs.map(x => [x.shop_id, x]))
  const ids = Array.from(new Set([...shops.map(r => r.id), ...subs.map(x => x.shop_id)]))
  const rows: Row[] = ids.map(id => {
    const r = shops.find(x => x.id === id), sub = byId.get(id)
    return { id, name: sub?.shop_name ?? (r ? shopName(r) : id), plan: sub?.plan ?? '', price: sub?.price !== null && sub?.price !== undefined ? `${sub.currency ?? ''} ${fmt(sub.price)}` : '—',
      paidUntil: sub?.paid_until ?? null, trialEnds: sub?.trial_ends ?? null, paid: paidState(sub), hasPlan: !!sub }
  }).sort((a, b) => a.paid.rank - b.paid.rank)
  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Business', width: '220px', render: r => <span style={{ fontWeight: 700 }}>{r.name}<div style={{ fontSize: 11, ...muted, fontWeight: 400 }}>{r.id}</div></span> },
    { key: 'paid', header: 'Paid', width: '140px', render: r => <StatusBadge variant={r.paid.variant}>{r.paid.label}</StatusBadge> },
    { key: 'plan', header: 'Plan', width: '120px', render: r => r.plan || <span style={muted}>{r.hasPlan ? '—' : 'no plan yet'}</span> },
    { key: 'price', header: 'Price', width: '120px', align: 'right' },
    { key: 'paidUntil', header: 'Paid until', width: '110px', render: r => r.paidUntil ?? '—' },
    { key: 'trialEnds', header: 'Trial ends', width: '110px', render: r => r.trialEnds ?? '—' },
  ]
  const unpaid = rows.filter(r => r.paid.rank === 0).length, soon = rows.filter(r => r.paid.rank === 2).length
  const money = Object.entries(received).map(([c, n]) => `${c} ${fmt(n)}`).join(' · ') || '—'
  return (
    <ProPage title="Billing" subtitle="Paid or not for every Pro customer. Set a plan and record payments on the customer's own page (Billing tab)." onRefresh={() => void load()} error={error ?? note}>
      <div style={s.kpiGrid}>
        <StatCard title="NOT PAID" value={loading ? '…' : unpaid} subtext="overdue or trial ended" accentColor={unpaid ? 'red' : 'green'} />
        <StatCard title="DUE WITHIN 7 DAYS" value={loading ? '…' : soon} subtext="remind them" accentColor="violet" />
        <StatCard title="RECEIVED THIS MONTH" value={money} subtext="payments entered by hand" accentColor="blue" />
      </div>
      <DataTable title={`Customers (${rows.length})`} columns={columns} data={rows} loading={loading} searchPlaceholder="Search business…"
        rowKey={r => r.id} actions={r => <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pro/${r.id}`)}>Open</button>} />
    </ProPage>
  )
}
