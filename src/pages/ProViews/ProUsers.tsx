import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProPerson } from '../../types'
import { ago } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'
import { ProPage, muted, shopName, useProShops } from './shared'

type Row = ProPerson & { key: string; shop: string; business: string; accessText: string }

// Everyone who can sign in to a Pro shop, read from each site. Read-only: people are added, changed or switched off by the shop owner
// in debbit Pro (Staff and team), never from here.
export default function ProUsers() {
  const navigate = useNavigate()
  const { shops, detail, loading, error, load } = useProShops(true)
  const rows: Row[] = shops.flatMap(r => (detail[r.id]?.people ?? []).map(p => ({ ...p, key: `${r.id}:${p.email}`, shop: r.id, business: shopName(r), accessText: p.access.join(', ') })))
  const unread = shops.filter(r => !loading && !detail[r.id]?.people).map(shopName)
  const columns: ColumnDef<Row>[] = [
    { key: 'full_name', header: 'Person', width: '220px', render: r => <span style={{ fontWeight: 700 }}>{r.full_name || r.email}<div style={{ fontSize: 11, ...muted, fontWeight: 400 }}>{r.email}</div></span> },
    { key: 'business', header: 'Business', width: '180px' },
    { key: 'accessText', header: 'Access', width: '200px', render: r => <>{r.debbit_staff && <StatusBadge variant="cyan">debbit staff</StatusBadge>} {r.accessText || <span style={muted}>none</span>}</> },
    { key: 'enabled', header: 'Account', width: '90px', render: r => <StatusBadge variant={r.enabled ? 'green' : 'muted'}>{r.enabled ? 'On' : 'Off'}</StatusBadge> },
    { key: 'last_sign_in', header: 'Last sign-in', width: '120px', render: r => r.last_sign_in ? ago(r.last_sign_in) : 'never' },
    { key: 'last_active', header: 'Last active', width: '120px', render: r => r.last_active ? ago(r.last_active) : '—' },
    { key: 'added', header: 'Added', width: '110px', render: r => r.added ? r.added.slice(0, 10) : '—' },
  ]
  const on = rows.filter(r => r.enabled && !r.debbit_staff)
  const recent = on.filter(r => r.last_sign_in && Date.now() - new Date(r.last_sign_in).getTime() < 7 * 864e5).length
  const never = on.filter(r => !r.last_sign_in).length
  return (
    <ProPage title="Users" subtitle="Everyone who can sign in to a Pro shop. Shop owners add or switch people off in debbit Pro; nothing here changes an account." onRefresh={() => void load()} error={error}>
      {unread.length > 0 && <div className="card" style={{ marginBottom: 20, fontSize: 13, borderLeft: '4px solid var(--amber, #d97706)' }}>ℹ️ People could not be read for {unread.join(', ')}.</div>}
      <div style={s.kpiGrid}>
        <StatCard title="PEOPLE" value={loading ? '…' : on.length} subtext={`accounts switched on · ${rows.length - on.length} off or debbit staff`} accentColor="blue" />
        <StatCard title="SIGNED IN THIS WEEK" value={loading ? '…' : recent} subtext="in the last 7 days" accentColor="green" />
        <StatCard title="NEVER SIGNED IN" value={loading ? '…' : never} subtext="may need help getting started" accentColor={never ? 'red' : 'green'} />
      </div>
      <DataTable title={`People (${rows.length})`} columns={columns} data={rows} loading={loading} searchPlaceholder="Search name, email, business…"
        rowKey={r => r.key} actions={r => <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pro/${r.shop}`)}>Shop</button>} />
    </ProPage>
  )
}
