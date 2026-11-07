import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProPerson, ProShopDetail as Detail } from '../../types'
import { PROBLEM_TEXT, ago, callPro, estimateUsd, fmt } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'

const TASK: Record<string, string> = { ask: 'Ask debbit', draft: 'Reminder drafts', classify: 'Bank suggestions' }

// One Pro shop: its businesses, people, activity counts, AI use by month and the health of its site. Read only.
export default function ProShopDetail() {
  const { id = '' } = useParams()
  const [d, setD] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const r = await callPro<Detail>('shop', id)
    if (r.ok) setD(r.data); else { setError(r.error); setD(null) }
    setLoading(false)
  }, [id])
  useEffect(() => { void load() }, [load])

  const months = useMemo(() => {
    const by: Record<string, { month: string; questions: number; tokens: number; usd: number }> = {}
    for (const r of d?.ai_usage ?? []) {
      const m = (by[r.month] ??= { month: r.month, questions: 0, tokens: 0, usd: 0 })
      if (r.task === 'questions') m.questions += r.calls
      else {
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

  const people: ColumnDef<ProPerson>[] = [
    { key: 'full_name', header: 'Name', width: '180px' },
    { key: 'email', header: 'Email', width: '220px' },
    { key: 'access', header: 'Access', width: '160px', render: p => p.access.length ? p.access.join(', ') : (p.debbit_staff ? 'debbit staff' : '—') },
    { key: 'enabled', header: 'Status', width: '100px', render: p => <StatusBadge variant={p.enabled ? 'green' : 'muted'}>{p.enabled ? 'Enabled' : 'Disabled'}</StatusBadge> },
    { key: 'last_sign_in', header: 'Last sign-in', width: '120px', render: p => ago(p.last_sign_in) },
    { key: 'added', header: 'Added', width: '110px', render: p => p.added ? new Date(p.added).toLocaleDateString() : '—' },
  ]

  const f = d?.figures
  const h = f?.health
  return (
    <div className="fade-in">
      <div style={s.headerRow}>
        <div>
          <Link to="/pro" style={{ fontSize: 12, color: 'var(--text-muted)' }}>← Pro shops</Link>
          <h1 style={s.title}>{f?.businesses[0]?.name ?? id}</h1>
          <p style={s.subtitle}>
            {id} · site {d?.site ?? '…'} · {d ? <StatusBadge variant={d.status === 'active' ? 'green' : 'amber'}>{d.status === 'active' ? 'Active' : 'Paused'}</StatusBadge> : null}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>🔄 Refresh</button>
      </div>

      {error && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--red)', fontSize: 13 }}>⚠️ {error}</div>}
      {d?.problem && <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--red)', fontSize: 13 }}>⚠️ {PROBLEM_TEXT[d.problem]}</div>}

      <div style={{ ...s.kpiGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard title="PEOPLE" value={loading ? '…' : fmt(f?.people.enabled)} subtext={f ? `${f.people.signed_in_last_7_days} signed in this week` : ''} accentColor="blue" />
        <StatCard title="SALES DOCS (30D)" value={loading ? '…' : fmt(f ? (f.activity.last_30_days.sales_invoices ?? 0) + (f.activity.last_30_days.till_sales ?? 0) : null)} subtext={f?.activity.last_sale_date ? `last sale ${f.activity.last_sale_date}` : 'no sale yet'} accentColor="green" />
        <StatCard title="AI QUESTIONS" value={loading ? '…' : fmt(f?.ai_this_month.questions)} subtext={f ? `this month (${f.ai_this_month.month})` : ''} />
        <StatCard title="SUPPORT WAITING" value={loading ? '…' : fmt(f?.support?.waiting_for_debbit)} subtext={f?.support ? `${f.support.open} open` : ''} accentColor={f?.support?.waiting_for_debbit ? 'red' : 'green'} />
      </div>

      {f && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Activity (submitted documents)</div>
            <table style={{ width: '100%' }}><tbody>
              {(['sales_invoices', 'till_sales', 'supplier_bills', 'payments', 'journals'] as const).map(k => (
                <tr key={k}><td>{{ sales_invoices: 'Sales invoices', till_sales: 'Till sales', supplier_bills: 'Supplier bills', payments: 'Payments', journals: 'Journals' }[k]}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(f.activity.last_7_days[k])} <span style={{ color: 'var(--text-muted)' }}>7d</span></td>
                  <td style={{ textAlign: 'right' }}>{fmt(f.activity.last_30_days[k])} <span style={{ color: 'var(--text-muted)' }}>30d</span></td></tr>
              ))}
            </tbody></table>
            <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>Businesses: {f.businesses.slice(0, 5).map(b => `${b.name} (${b.country ?? '—'}, ${b.currency ?? '—'})`).join(' · ')}{f.businesses.length > 5 ? ` and ${f.businesses.length - 5} more` : ''}</div>
          </div>
          <div className="card" style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Site health</div>
            <div>Scheduler: {h?.scheduler_on ? '✅ on' : '❌ off (automatic jobs and emails stop)'}</div>
            <div>Last backup: {h?.last_backup_at ? `${new Date(h.last_backup_at).toLocaleString()} (${ago(h.last_backup_at)})` : '❌ none found'}</div>
            <div>Disk used: {h?.disk_used_percent ?? '—'}%{(h?.disk_used_percent ?? 0) >= 80 ? ' ⚠️' : ''}</div>
            <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>{Object.entries(h?.versions ?? {}).map(([a, v]) => `${a} ${v}`).join(' · ')}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>AI use by month</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Questions counted toward the monthly allowance. Cost is an estimate from token counts at list prices.</div>
        {months.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip formatter={(v: number, n: string) => n === 'questions' ? [v, 'Questions'] : [v, n]} />
              <Bar dataKey="questions" fill="var(--purple-main)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{loading ? 'Loading…' : 'No AI use recorded yet.'}</div>}
        {months.length > 0 && (
          <table style={{ width: '100%', fontSize: 13, marginTop: 12 }}><tbody>
            {months.slice().reverse().map(m => <tr key={m.month}><td>{m.month}</td><td style={{ textAlign: 'right' }}>{fmt(m.questions)} questions</td><td style={{ textAlign: 'right' }}>{fmt(m.tokens)} tokens</td><td style={{ textAlign: 'right' }}>≈ ${m.usd.toFixed(2)}</td></tr>)}
          </tbody></table>
        )}
        {thisMonthTasks.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>This month: {thisMonthTasks.map(r => `${TASK[r.task] ?? r.task} ${r.calls}× (${r.model})`).join(' · ')}</div>
        )}
      </div>

      <DataTable title={`People (${d?.people?.length ?? 0})`} columns={people} data={d?.people ?? []} loading={loading} searchPlaceholder="Search name, email…" rowKey={p => p.email} />
    </div>
  )
}
