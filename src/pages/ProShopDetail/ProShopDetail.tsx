import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProCustomer, ProPerson, ProRecentDoc, ProShopDetail as Detail, ProSnapshot, ProSubscription, SuperAdminLogEntry } from '../../types'
import AiWorkCard from '../../components/molecules/AiWorkCard'
import { CONSENT_TEXT, PROBLEM_TEXT, ago, callPro, callProBilling, callProCrm, estimateUsd, fmt } from '../../lib/pro'
import { attentionFor } from '../../lib/proAttention'
import { billingStyles as s } from '../Billing/Billing.styles'
import ProPayments from './ProPayments'
import CustomerCard from './CustomerCard'
import Notes from './Notes'

const TASK: Record<string, string> = { ask: 'Ask debbit', draft: 'Reminder drafts', classify: 'Bank suggestions', extract: 'Reading documents', reason: 'Harder questions', escalate: 'Escalations' }
const IDENTITY: Record<string, string> = { 'ai:assistant': 'Ask debbit may read', 'ai:collections': 'Collections may draft', 'ai:bank': 'Bank matching may suggest', 'ai:bookkeeper': 'Bookkeeper may prepare for approval' }
const KIND: Record<string, string> = { sales_invoices: 'Sales invoice', till_sales: 'Till sale', supplier_bills: 'Supplier bill', payments: 'Payment', journals: 'Journal', stock_moves: 'Stock move', deliveries: 'Delivery', goods_received: 'Goods received' }
const COUNTRY_APP: Record<string, string> = { myinvois_erpgulf: 'Malaysia e-invoice (MyInvois)', ksa_compliance: 'Saudi e-invoice (ZATCA)' }
const TABS = ['overview', 'people', 'activity', 'ai', 'health', 'billing', 'notes'] as const
type Tab = typeof TABS[number]
const TAB_TEXT: Record<Tab, string> = { overview: 'Overview', people: 'People', activity: 'Activity', ai: 'AI', health: 'Health', billing: 'Billing', notes: 'Notes and history' }
const OLDER = 'Shown after the gateway and this site are updated (richer admin feed).'

const yes = (b: boolean | undefined) => (b === undefined ? '—' : b ? '✅ yes' : '— not yet')

// Everything debbit knows about one Pro customer, in tabs. Shop figures come from the gateway's read-only feed (counts, dates, statuses);
// the customer card, billing and notes are debbit's own records in Supabase. Nothing on this page changes the shop.
export default function ProShopDetail() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'overview'
  const [d, setD] = useState<Detail | null>(null)
  const [sub, setSub] = useState<ProSubscription | null | undefined>(undefined)
  const [card, setCard] = useState<ProCustomer | null>(null)
  const [log, setLog] = useState<SuperAdminLogEntry[] | null>(null)
  const [trend, setTrend] = useState<ProSnapshot[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    // Refresh today's snapshot first (the list read saves it), then read the saved days back.
    void callPro<{ days: ProSnapshot[] }>('trend', id).then(t => setTrend(t.ok ? t.data.days : null))
    const [r, b, l, c] = await Promise.all([callPro<Detail>('shop', id), callProBilling<{ subscription: ProSubscription | null }>({ op: 'get', id }),
      callProCrm<{ log: SuperAdminLogEntry[] }>({ op: 'log', id }), callProCrm<{ customer: ProCustomer | null }>({ op: 'get', id })])
    if (c.ok) setCard(c.data.customer)
    if (r.ok) setD(r.data); else { setError(r.error); setD(null) }
    setSub(b.ok ? b.data.subscription : undefined)
    setLog(l.ok ? l.data.log : null)
    setLoading(false)
  }, [id])
  useEffect(() => { void load() }, [load])

  const months = useMemo(() => {
    const by: Record<string, { month: string; questions: number; calls: number; tokens: number; usd: number }> = {}
    for (const r of d?.ai_usage ?? []) {
      const m = (by[r.month] ??= { month: r.month, questions: 0, calls: 0, tokens: 0, usd: 0 })
      if (r.task === 'questions') m.questions += r.calls
      else {
        m.calls += r.calls
        m.tokens += r.input_tokens + r.output_tokens + r.cache_read_input_tokens + r.cache_creation_input_tokens
        m.usd += estimateUsd(r.model, r.input_tokens, r.output_tokens, r.cache_read_input_tokens, r.cache_creation_input_tokens) ?? 0
      }
    }
    return Object.values(by).sort((a, b) => a.month.localeCompare(b.month))
  }, [d])
  const thisMonthTasks = useMemo(() => {
    const month = d?.figures?.ai_this_month.month
    return (d?.ai_usage ?? []).filter(r => r.month === month && r.task !== 'questions')
  }, [d])
  const attention = useMemo(() => (d ? attentionFor(d, sub, card) : []), [d, sub, card])
  const onCard = useCallback((c: ProCustomer | null) => setCard(c), [])

  const people: ColumnDef<ProPerson>[] = [
    { key: 'full_name', header: 'Name', width: '180px' },
    { key: 'email', header: 'Email', width: '220px' },
    { key: 'access', header: 'Access', width: '160px', render: p => p.access.length ? p.access.join(', ') : (p.debbit_staff ? 'debbit staff' : '—') },
    { key: 'enabled', header: 'Status', width: '100px', render: p => <StatusBadge variant={p.enabled ? 'green' : 'muted'}>{p.enabled ? 'Enabled' : 'Disabled'}</StatusBadge> },
    { key: 'last_sign_in', header: 'Last sign-in', width: '120px', render: p => ago(p.last_sign_in) },
    { key: 'last_active', header: 'Last active', width: '120px', render: p => ago(p.last_active) },
    { key: 'added', header: 'Added', width: '110px', render: p => p.added ? new Date(p.added).toLocaleDateString() : '—' },
  ]
  const recentCols: ColumnDef<ProRecentDoc>[] = [
    { key: 'kind', header: 'What', width: '150px', render: r => KIND[r.kind] ?? r.kind },
    { key: 'date', header: 'Dated', width: '110px', render: r => r.date ?? '—' },
    { key: 'by', header: 'Made by', width: '220px' },
    { key: 'state', header: 'State', width: '110px', render: r => <StatusBadge variant={r.state === 'cancelled' ? 'red' : 'green'}>{r.state === 'cancelled' ? 'Cancelled' : 'In force'}</StatusBadge> },
    { key: 'at', header: 'Last changed', width: '120px', render: r => ago(r.at) },
  ]

  const f = d?.figures
  const h = f?.health
  const name = card?.business_name ?? f?.businesses[0]?.name ?? id
  const card2 = (title: string, body: ReactNode) => <div className="card" style={{ fontSize: 13 }}><div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>{body}</div>
  const row = (t: string, v: ReactNode) => <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ color: 'var(--text-muted)' }}>{t}</span><span>{v}</span></div>
  const muted = (t: string) => <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t}</div>

  return (
    <div className="fade-in">
      <div style={s.headerRow}>
        <div>
          <Link to="/pro" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Pro customers</Link>
          <h1 style={s.title}>{name}</h1>
          <p style={s.subtitle}>
            {id} · site {d?.site ?? '…'} · {d ? <StatusBadge variant={d.status === 'active' ? 'green' : 'amber'}>{d.status === 'active' ? 'Active' : 'Paused'}</StatusBadge> : null}
            {d?.gateway?.ai ? <> · <StatusBadge variant="purple">AI on</StatusBadge></> : null}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>🔄 Refresh</button>
      </div>

      {error && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--red)', fontSize: 13 }}>⚠️ {error}</div>}
      {d?.problem && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--red)', fontSize: 13 }}>⚠️ {PROBLEM_TEXT[d.problem]}</div>}

      <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className="btn btn-ghost btn-sm"
            style={{ borderRadius: 0, borderBottom: tab === t ? '2px solid var(--purple-main)' : '2px solid transparent', fontWeight: tab === t ? 800 : 500 }}
            onClick={() => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })}>
            {TAB_TEXT[t]}{t === 'overview' && attention.length ? ` (${attention.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'overview' && <>
        <div style={{ ...s.kpiGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <StatCard title="PEOPLE" value={loading ? '…' : fmt(f?.people.enabled)} subtext={f ? `${f.people.signed_in_last_7_days} signed in this week` : ''} accentColor="blue" />
          <StatCard title="SALES DOCS (30D)" value={loading ? '…' : fmt(f ? (f.activity.last_30_days.sales_invoices ?? 0) + (f.activity.last_30_days.till_sales ?? 0) : null)} subtext={f?.activity.last_sale_date ? `last sale ${f.activity.last_sale_date}` : 'no sale yet'} accentColor="green" />
          <StatCard title="AI QUESTIONS" value={loading ? '…' : fmt(f?.ai_this_month.questions)} subtext={f ? `this month (${f.ai_this_month.month})` : ''} />
          <StatCard title="SUPPORT WAITING" value={loading ? '…' : fmt(f?.support?.waiting_for_debbit)} subtext={f?.support ? `${f.support.open} open` : ''} accentColor={f?.support?.waiting_for_debbit ? 'red' : 'green'} />
        </div>
        <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Needs attention</div>
          {loading ? muted('Loading…') : attention.length === 0 ? <div style={{ color: 'var(--green)' }}>✅ Nothing needs attention.</div> : attention.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '3px 0' }}><StatusBadge variant={a.level}>{a.area}</StatusBadge><span>{a.text}</span></div>
          ))}
        </div>
        <CustomerCard shopId={id} shopName={f?.businesses[0]?.name ?? ''} shopCountry={f?.businesses[0]?.country ?? ''} onLoaded={onCard} />
        {f && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {card2('Businesses on this site', f.businesses.map(b => <div key={b.name} style={{ padding: '3px 0' }}>{b.name} <span style={{ color: 'var(--text-muted)' }}>· {b.country ?? '—'} · {b.currency ?? '—'} · since {b.created ? new Date(b.created).toLocaleDateString() : '—'}</span></div>))}
          {card2('Setup', f.setup ? <>
            {row('Customers', fmt(f.setup.records.customers))}{row('Suppliers', fmt(f.setup.records.suppliers))}{row('Products', fmt(f.setup.records.products))}
            {row('Warehouses', fmt(f.setup.records.warehouses))}{row('Bank accounts', fmt(f.setup.records.bank_accounts))}{row('Tax templates', fmt(f.setup.records.tax_templates))}
            {row('Opening account balances', yes(f.setup.opening.account_balances))}{row('Opening customer balances', yes(f.setup.opening.customer_balances))}
            {row('Opening supplier balances', yes(f.setup.opening.supplier_balances))}{row('Opening stock', yes(f.setup.opening.opening_stock))}
          </> : muted(OLDER))}
        </div>}
      </>}

      {tab === 'people' && <DataTable title={`People (${d?.people?.length ?? 0})`} columns={people} data={d?.people ?? []} loading={loading} searchPlaceholder="Search name, email…" rowKey={p => p.email} />}

      {tab === 'activity' && <>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Last 30 days, day by day</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Documents submitted (sales, till, bills, payments, journals) and sign-ins.</div>
          {f?.daily?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={f.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="documents" name="Documents" stroke="var(--purple-main)" dot={false} />
                <Line type="monotone" dataKey="sign_ins" name="Sign-ins" stroke="var(--cyan)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : muted(loading ? 'Loading…' : OLDER)}
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Last 90 days</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Saved once a day when someone opens the Pro customers list, so a day nobody looked is missing.</div>
          {trend && trend.length > 1 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend.map(t => ({ day: t.day, ...t.figures }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="documents_7" name="Documents (7 days)" stroke="var(--purple-main)" dot={false} />
                <Line type="monotone" dataKey="signed_in_7" name="People signed in (7 days)" stroke="var(--cyan)" dot={false} />
                <Line type="monotone" dataKey="ai_questions_month" name="AI questions (month)" stroke="var(--green)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : muted(trend === null ? 'Trends are not available yet (needs the snapshots migration).' : 'Not enough saved days yet. Lines appear after the list has been opened on two different days.')}
        </div>
        {f && card2('Submitted documents', <table style={{ width: '100%' }}><tbody>
          {(['sales_invoices', 'till_sales', 'supplier_bills', 'payments', 'journals'] as const).map(k => (
            <tr key={k}><td>{KIND[k]}s</td>
              <td style={{ textAlign: 'right' }}>{fmt(f.activity.last_7_days[k])} <span style={{ color: 'var(--text-muted)' }}>7d</span></td>
              <td style={{ textAlign: 'right' }}>{fmt(f.activity.last_30_days[k])} <span style={{ color: 'var(--text-muted)' }}>30d</span></td></tr>
          ))}
        </tbody></table>)}
        <div style={{ height: 24 }} />
        {d?.recent ? <DataTable title="Latest documents" columns={recentCols} data={d.recent} loading={loading} searchPlaceholder="Search kind, person…" rowKey={r => `${r.kind}-${r.at}-${r.by}`} />
          : card2('Latest documents', muted(loading ? 'Loading…' : OLDER))}
      </>}

      {tab === 'ai' && <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {card2('Switched on', <>
            {row('AI on the gateway for this shop', d?.gateway ? (d.gateway.ai ? '✅ on' : '— off') : '—')}
            {row('Owner\'s consent', card ? `${CONSENT_TEXT[card.ai_consent]}${card.ai_consent_on ? ` (${card.ai_consent_on})` : ''}` : '—')}
            {row('Paused by the owner', f?.ai_rules ? (f.ai_rules.paused ? '⏸ paused' : 'no') : '—')}
            {row('People who may approve AI work', f?.ai_rules ? fmt(f.ai_rules.approvers) : '—')}
            {row('Rules version', f?.ai_rules ? f.ai_rules.version : '—')}
          </>)}
          {card2('What the owner allowed', f?.ai_rules ? (Object.keys(f.ai_rules.ticked).length ? Object.entries(f.ai_rules.ticked).map(([who, caps]) => (
            <div key={who} style={{ padding: '3px 0' }}><b>{IDENTITY[who] ?? who}</b><div style={{ color: 'var(--text-muted)' }}>{caps.join(', ') || '—'}</div></div>
          )) : muted('Nothing ticked: every AI job is off.')) : muted(f ? OLDER : '—'))}
        </div>
        <AiWorkCard work={d?.ai_work} />
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>AI use by month</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>AI calls are every AI job (questions, drafts, suggestions, reading documents, agent jobs); questions are the ones counted toward the monthly allowance. Cost is an estimate from token counts at list prices.</div>
          {months.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip formatter={(v: number, n: string) => n === 'questions' ? [v, 'Questions'] : n === 'calls' ? [v, 'AI calls (all jobs)'] : [v, n]} />
                <Bar dataKey="calls" fill="var(--green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="questions" fill="var(--purple-main)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : muted(loading ? 'Loading…' : 'No AI use recorded yet.')}
          {months.length > 0 && (
            <table style={{ width: '100%', fontSize: 13, marginTop: 12 }}><tbody>
              {months.slice().reverse().map(m => <tr key={m.month}><td>{m.month}</td><td style={{ textAlign: 'right' }}>{fmt(m.calls)} AI calls</td><td style={{ textAlign: 'right' }}>{fmt(m.questions)} questions</td><td style={{ textAlign: 'right' }}>{fmt(m.tokens)} tokens</td><td style={{ textAlign: 'right' }}>≈ ${m.usd.toFixed(2)}</td></tr>)}
            </tbody></table>
          )}
          {thisMonthTasks.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>This month: {thisMonthTasks.map(r => `${TASK[r.task] ?? r.task} ${r.calls}× (${r.model})`).join(' · ')}</div>
          )}
        </div>
      </>}

      {tab === 'health' && f && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {card2('Site', <>
          {row('Scheduler', h?.scheduler_on ? '✅ on' : '❌ off (automatic jobs and emails stop)')}
          {row('Last backup', h?.last_backup_at ? `${new Date(h.last_backup_at).toLocaleString()} (${ago(h.last_backup_at)})` : '❌ none found')}
          {row('Disk used', `${h?.disk_used_percent ?? '—'}%${(h?.disk_used_percent ?? 0) >= 85 ? ' ⚠️' : ''}`)}
          {row('Errors logged (7 days)', f.problems_7_days ? fmt(f.problems_7_days.errors) : '—')}
          {row('Emails that failed (7 days)', f.problems_7_days ? fmt(f.problems_7_days.failed_emails) : '—')}
          {row('Account email from the gateway', d?.gateway ? (d.gateway.account_mail ? '✅ on' : '— off') : '—')}
        </>)}
        {card2('Software', <>
          {Object.entries(h?.versions ?? {}).map(([a, v]) => row(a, v))}
          <div style={{ marginTop: 8 }}><b>Country apps:</b> {f.country_apps ? (f.country_apps.length ? f.country_apps.map(a => COUNTRY_APP[a] ?? a).join(', ') : 'none') : '—'}</div>
        </>)}
      </div>}
      {tab === 'health' && !f && muted(loading ? 'Loading…' : 'No figures from this site.')}

      {tab === 'billing' && <ProPayments shopId={id} shopName={f?.businesses[0]?.name ?? ''} />}

      {tab === 'notes' && <>
        <Notes shopId={id} />
        {card2('Changes made in Super Admin', log === null ? muted('The change log is not available yet.') : log.length === 0 ? muted('No changes recorded yet.') : log.map(e => (
          <div key={e.id} style={{ padding: '3px 0' }}><span style={{ color: 'var(--text-muted)' }}>{new Date(e.at).toLocaleString()} · {e.admin_email}</span> · {e.action.replace(/_/g, ' ')}
            {Array.isArray((e.detail as { changed?: unknown }).changed) ? <span style={{ color: 'var(--text-muted)' }}> ({((e.detail as { changed: string[] }).changed).join(', ')})</span> : null}</div>
        )))}
      </>}
    </div>
  )
}
