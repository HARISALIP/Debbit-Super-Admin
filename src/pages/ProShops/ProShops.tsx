import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import ProConnection from '../../components/molecules/ProConnection'
import { ColumnDef, ProCustomer, ProHealth, ProShopRow, ProSubscription } from '../../types'
import { PROBLEM_TEXT, PaidState, ProResult, STAGE_TEXT, ago, callPro, callProBilling, callProCrm, fmt, paidState } from '../../lib/pro'
import { Attention, attentionFor } from '../../lib/proAttention'
import { billingStyles as s } from '../Billing/Billing.styles'

type Row = ProShopRow & { people_enabled: number | null; ai_questions: number | null; sales_7: number | null; waiting: number | null; last_sale: string | null; paid: PaidState | null
  card: ProCustomer | null; attention: Attention[]; name: string; owner: string; stage: string; tags: string; country: string }
type Filter = 'all' | 'attention' | 'not_paid' | 'ai_on' | 'trial' | 'onboarding' | 'live' | 'paused' | 'left'
const FILTER_TEXT: Record<Filter, string> = { all: 'All', attention: 'Needs attention', not_paid: 'Not paid', ai_on: 'AI on', trial: 'Trial', onboarding: 'Onboarding', live: 'Live', paused: 'Paused', left: 'Left' }

// debbit Pro shops: one ERPNext site each, read through the Pro gateway. Counts, dates and statuses only; nothing here changes a shop.
export default function ProShops() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [health, setHealth] = useState<ProHealth | null>(null)
  const [link, setLink] = useState<ProResult<ProHealth> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notConnected, setNotConnected] = useState(false)
  const [billingNote, setBillingNote] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const [shops, h, bill, crm] = await Promise.all([callPro<{ shops: ProShopRow[] }>('shops'), callPro<ProHealth>('health'),
      callProBilling<{ subscriptions: ProSubscription[] }>({ op: 'list' }), callProCrm<{ customers: ProCustomer[] }>({ op: 'list' })])
    const subs = new Map((bill.ok ? bill.data.subscriptions : []).map(x => [x.shop_id, x]))
    const cards = new Map((crm.ok ? crm.data.customers : []).map(x => [x.shop_id, x]))
    setBillingNote(bill.ok ? null : bill.error)
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
        paid: bill.ok ? paidState(subs.get(r.id)) : null,
        card: cards.get(r.id) ?? null,
        attention: attentionFor(r, bill.ok ? subs.get(r.id) ?? null : undefined, cards.get(r.id) ?? null),
        // Plain text fields so the table search finds a customer by business, owner, phone, country or tag.
        name: cards.get(r.id)?.business_name ?? r.figures?.businesses[0]?.name ?? r.id,
        owner: [cards.get(r.id)?.owner_name, cards.get(r.id)?.owner_phone, cards.get(r.id)?.owner_email].filter(Boolean).join(' · '),
        stage: cards.get(r.id)?.stage ?? '',
        tags: (cards.get(r.id)?.tags ?? []).join(', '),
        country: cards.get(r.id)?.country ?? r.figures?.businesses[0]?.country ?? '',
      })))
    }
    setHealth(h.ok ? h.data : null); setLink(h)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Customer', width: '200px', render: r => <span style={{ fontWeight: 700 }}>{r.name}<div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{r.owner || r.id}{r.country ? ` · ${r.country}` : ''}</div></span> },
    { key: 'stage', header: 'Stage', width: '110px', render: r => r.card ? <StatusBadge variant={STAGE_TEXT[r.card.stage].variant}>{STAGE_TEXT[r.card.stage].label}</StatusBadge> : <span style={{ color: 'var(--text-muted)' }}>no card</span> },
    { key: 'status', header: 'Site', width: '90px', render: r => <StatusBadge variant={r.status === 'active' ? 'green' : 'amber'}>{r.status === 'active' ? 'Active' : 'Paused'}</StatusBadge> },
    { key: 'attention', header: 'Needs attention', width: '200px', render: r => r.attention.length ? <span title={r.attention.map(a => a.text).join('\n')}><StatusBadge variant={r.attention[0].level}>{r.attention.length}</StatusBadge> {r.attention[0].text}</span> : <span style={{ color: 'var(--green)' }}>✓</span> },
    { key: 'paid', header: 'Paid', width: '130px', render: r => r.paid ? <StatusBadge variant={r.paid.variant}>{r.paid.label}</StatusBadge> : '—' },
    { key: 'people_enabled', header: 'People', width: '80px', align: 'right', render: r => fmt(r.people_enabled) },
    { key: 'sales_7', header: 'Sales docs (7d)', width: '120px', align: 'right', render: r => fmt(r.sales_7) },
    { key: 'last_sale', header: 'Last sale', width: '110px', render: r => r.last_sale ?? '—' },
    { key: 'ai_questions', header: 'AI this month', width: '110px', align: 'right', render: r => <>{r.gateway?.ai ? '' : <span style={{ color: 'var(--text-muted)' }}>off · </span>}{fmt(r.ai_questions)}</> },
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
  const unpaid = rows.filter(r => r.paid && r.paid.rank === 0).length
  const dueSoon = rows.filter(r => r.paid && r.paid.rank === 2).length
  const needs = rows.filter(r => r.attention.some(a => a.level === 'red')).length
  const shown = rows.filter(r => filter === 'all' ? true : filter === 'attention' ? r.attention.length > 0 : filter === 'not_paid' ? r.paid?.rank === 0
    : filter === 'ai_on' ? !!r.gateway?.ai : r.card?.stage === filter)
  const allAttention = rows.flatMap(r => r.attention.map(a => ({ ...a, id: r.id, name: r.name })))

  return (
    <div className="fade-in">
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>debbit Pro customers</h1>
          <p style={s.subtitle}>Every Pro customer: who they are, whether they have paid, how they use debbit, AI and server health. Shop figures are counts, not records; nothing here changes a shop.</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>🔄 Refresh</button>
      </div>

      <ProConnection result={link} />

      {error && !notConnected && !(link && !link.ok && link.step) && <div className="card" style={{ marginBottom: 20, borderLeft: `4px solid ${notConnected ? 'var(--amber, #d97706)' : 'var(--red)'}`, fontSize: 13 }}>{notConnected ? 'ℹ️' : '⚠️'} {error}</div>}

      {billingNote && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--amber, #d97706)', fontSize: 13 }}>ℹ️ Paid or not: {billingNote}</div>}

      <div style={{ ...s.kpiGrid, gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <StatCard title="PRO CUSTOMERS" value={loading ? '…' : rows.length} subtext={`${rows.filter(r => r.status === 'active').length} active · ${needs} need attention`} accentColor={needs ? 'red' : undefined} />
        <StatCard title="NOT PAID" value={loading ? '…' : unpaid} subtext={`overdue or trial ended · ${dueSoon} due within 7 days`} accentColor={unpaid ? 'red' : 'green'} />
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

      {allAttention.length > 0 && (
        <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Needs attention ({allAttention.length})</div>
          {allAttention.slice(0, 15).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0', alignItems: 'center' }}>
              <StatusBadge variant={a.level}>{a.area}</StatusBadge>
              <button className="btn btn-ghost btn-sm" style={{ padding: 0, fontWeight: 700 }} onClick={() => navigate(`/pro/${a.id}`)}>{a.name}</button>
              <span>{a.text}</span>
            </div>
          ))}
          {allAttention.length > 15 && <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>and {allAttention.length - 15} more: choose "Needs attention" below.</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {(Object.keys(FILTER_TEXT) as Filter[]).map(k => (
          <button key={k} className={filter === k ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter(k)}>{FILTER_TEXT[k]}</button>
        ))}
      </div>

      <DataTable
        title={`Pro customers (${shown.length}${shown.length !== rows.length ? ` of ${rows.length}` : ''})`}
        columns={columns}
        data={shown}
        loading={loading}
        searchPlaceholder="Search business, owner, phone, tag…"
        rowKey={r => r.id}
        actions={r => <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pro/${r.id}`)}>Open</button>}
      />
    </div>
  )
}
