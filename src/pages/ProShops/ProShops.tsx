import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProHealth, ProShopRow } from '../../types'
import { PROBLEM_TEXT, ago, callPro, fmt } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'

type Row = ProShopRow & { people_enabled: number | null; ai_questions: number | null; sales_7: number | null; waiting: number | null; last_sale: string | null }

// Debbit Pro shops: one ERPNext site each, read through the Pro gateway. Counts, dates and statuses only; nothing here changes a shop.
export default function ProShops() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [health, setHealth] = useState<ProHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const [shops, h] = await Promise.all([callPro<{ shops: ProShopRow[] }>('shops'), callPro<ProHealth>('health')])
    if (!shops.ok) {
      setError(shops.error); setNotConnected(!!shops.notConnected); setRows([])
    } else {
      setNotConnected(false)
      setRows(shops.data.shops.map(r => ({
        ...r,
        people_enabled: r.figures?.people.enabled ?? null,
        ai_questions: r.figures?.ai_this_month.questions ?? null,
        sales_7: r.figures ? (r.figures.activity.last_7_days.sales_invoices ?? 0) + (r.figures.activity.last_7_days.till_sales ?? 0) : null,
        waiting: r.figures?.support?.waiting_for_debbit ?? null,
        last_sale: r.figures?.activity.last_sale_date ?? null,
      })))
    }
    setHealth(h.ok ? h.data : null)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const columns: ColumnDef<Row>[] = [
    { key: 'id', header: 'Shop', width: '180px', render: r => <span style={{ fontWeight: 700 }}>{r.figures?.businesses[0]?.name ?? r.id}<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.id}</div></span> },
    { key: 'status', header: 'Status', width: '110px', render: r => <StatusBadge variant={r.status === 'active' ? 'green' : 'amber'}>{r.status === 'active' ? 'Active' : 'Paused'}</StatusBadge> },
    { key: 'people_enabled', header: 'People', width: '80px', align: 'right', render: r => fmt(r.people_enabled) },
    { key: 'sales_7', header: 'Sales docs (7d)', width: '120px', align: 'right', render: r => fmt(r.sales_7) },
    { key: 'last_sale', header: 'Last sale', width: '110px', render: r => r.last_sale ?? '—' },
    { key: 'ai_questions', header: 'AI this month', width: '110px', align: 'right', render: r => fmt(r.ai_questions) },
    { key: 'waiting', header: 'Support waiting', width: '120px', align: 'right', render: r => r.waiting ? <StatusBadge variant="red">{r.waiting}</StatusBadge> : fmt(r.waiting) },
    { key: 'health', header: 'Site', width: '200px', render: r => {
      if (!r.figures) return <span style={{ color: 'var(--red)' }}>{PROBLEM_TEXT[r.problem ?? 'unreachable']}</span>
      const h = r.figures.health
      const backupHours = h.last_backup_at ? (Date.now() - new Date(h.last_backup_at).getTime()) / 3600000 : null
      return <span>{h.scheduler_on ? '' : '⚠️ scheduler off · '}{backupHours === null ? '⚠️ no backup' : backupHours > 26 ? `⚠️ backup ${ago(h.last_backup_at)}` : `backup ${ago(h.last_backup_at)}`}</span>
    } },
  ]

  const reachable = health?.sites.filter(x => x.reachable).length ?? 0
  const totalPeople = rows.reduce((n, r) => n + (r.people_enabled ?? 0), 0)
  const totalAi = rows.reduce((n, r) => n + (r.ai_questions ?? 0), 0)
  const waiting = rows.reduce((n, r) => n + (r.waiting ?? 0), 0)

  return (
    <div className="fade-in">
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>Debbit Pro shops</h1>
          <p style={s.subtitle}>Every Pro shop, its people, AI use and server health. Read only; counts, not records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>🔄 Refresh</button>
      </div>

      {error && <div className="card" style={{ marginBottom: 20, borderLeft: `4px solid ${notConnected ? 'var(--amber, #d97706)' : 'var(--red)'}`, fontSize: 13 }}>{notConnected ? 'ℹ️' : '⚠️'} {error}</div>}

      <div style={{ ...s.kpiGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard title="PRO SHOPS" value={loading ? '…' : rows.length} subtext={`${rows.filter(r => r.status === 'active').length} active`} />
        <StatCard title="PEOPLE" value={loading ? '…' : totalPeople} subtext="enabled accounts" accentColor="blue" />
        <StatCard title="AI QUESTIONS" value={loading ? '…' : totalAi} subtext="this month, all shops" accentColor="violet" />
        <StatCard title="SUPPORT WAITING" value={loading ? '…' : waiting} subtext="requests waiting for debbit" accentColor={waiting ? 'red' : 'green'} />
      </div>

      {health && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          <div><b>Gateway</b> up {Math.round(health.gateway.uptime_seconds / 3600)}h · {health.gateway.memory_mb} MB{health.gateway.version ? ` · ${health.gateway.version}` : ''}</div>
          <div><b>Sessions</b> {health.sessions_ok ? '✅' : '❌'}</div>
          {health.memberships_ok !== null && <div><b>Memberships</b> {health.memberships_ok ? '✅' : '❌'}</div>}
          <div><b>Sites reachable</b> {reachable} of {health.sites.length}{health.sites.length ? ` · slowest ${Math.max(0, ...health.sites.map(x => x.ms ?? 0))} ms` : ''}</div>
        </div>
      )}

      <DataTable
        title={`Pro shops (${rows.length})`}
        columns={columns}
        data={rows}
        loading={loading}
        searchPlaceholder="Search shop, site…"
        rowKey={r => r.id}
        actions={r => <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pro/${r.id}`)}>Open</button>}
      />
    </div>
  )
}
