import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef } from '../../types'
import { PROBLEM_TEXT, ago, fmt } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'
import { ProPage, muted, useProShops } from './shared'

type Row = { key: string; shop: string; name: string; country: string; currency: string; created: string | null; status: string
  people: number | null; signedIn: number | null; lastSale: string | null; docs30: number | null; problem: string | null }

export default function ProBusinesses() {
  const navigate = useNavigate()
  const { shops, loading, error, load } = useProShops()
  const rows: Row[] = shops.flatMap(r => {
    const f = r.figures
    const docs30 = f ? Object.values(f.activity.last_30_days).reduce<number>((n, v) => n + (v ?? 0), 0) : null
    const base = { shop: r.id, status: r.status, people: f?.people.enabled ?? null, signedIn: f?.people.signed_in_last_7_days ?? null,
      lastSale: f?.activity.last_sale_date ?? null, docs30, problem: f ? null : PROBLEM_TEXT[r.problem ?? 'unreachable'] ?? 'Not readable' }
    const list = f?.businesses.length ? f.businesses : [{ name: r.id, country: null, currency: null, created: null }]
    return list.map((b, i) => ({ ...base, key: `${r.id}#${i}`, name: b.name, country: b.country ?? '', currency: b.currency ?? '', created: b.created }))
  })
  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Business', width: '220px', render: r => <span style={{ fontWeight: 700 }}>{r.name}<div style={{ fontSize: 11, ...muted, fontWeight: 400 }}>{r.shop}</div></span> },
    { key: 'status', header: 'Site', width: '90px', render: r => <StatusBadge variant={r.status === 'active' ? 'green' : 'amber'}>{r.status === 'active' ? 'Active' : 'Paused'}</StatusBadge> },
    { key: 'country', header: 'Country', width: '90px' },
    { key: 'currency', header: 'Currency', width: '90px' },
    { key: 'created', header: 'Started', width: '110px', render: r => r.created ? r.created.slice(0, 10) : '—' },
    { key: 'people', header: 'People', width: '80px', align: 'right', render: r => fmt(r.people) },
    { key: 'signedIn', header: 'Signed in (7d)', width: '110px', align: 'right', render: r => fmt(r.signedIn) },
    { key: 'docs30', header: 'Documents (30d)', width: '120px', align: 'right', render: r => fmt(r.docs30) },
    { key: 'lastSale', header: 'Last sale', width: '110px', render: r => r.problem ? <span style={{ color: 'var(--red)' }}>{r.problem}</span> : r.lastSale ? `${r.lastSale} (${ago(r.lastSale)})` : '—' },
  ]
  const active = shops.filter(r => r.status === 'active').length
  const quiet = rows.filter(r => !r.problem && (!r.lastSale || Date.now() - new Date(r.lastSale).getTime() > 7 * 864e5)).length
  return (
    <ProPage title="Businesses" subtitle="Every business on debbit Pro, from each shop's own site. Open one for its full page." onRefresh={() => void load()} error={error}>
      <div style={s.kpiGrid}>
        <StatCard title="BUSINESSES" value={loading ? '…' : rows.length} subtext={`${shops.length} Pro shops`} accentColor="blue" />
        <StatCard title="ACTIVE SITES" value={loading ? '…' : active} subtext={`${shops.length - active} paused`} accentColor="green" />
        <StatCard title="NO SALE IN 7 DAYS" value={loading ? '…' : quiet} subtext="worth a call" accentColor={quiet ? 'red' : 'green'} />
      </div>
      <DataTable title={`Businesses (${rows.length})`} columns={columns} data={rows} loading={loading} searchPlaceholder="Search business, shop, country…"
        rowKey={r => r.key} actions={r => <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pro/${r.shop}`)}>Open</button>} />
    </ProPage>
  )
}
