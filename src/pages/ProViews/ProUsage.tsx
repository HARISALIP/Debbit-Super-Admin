import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import { ColumnDef } from '../../types'
import { estimateUsd, fmt } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'
import { ProPage, muted, shopName, useProShops } from './shared'

type ShopRow = { id: string; name: string; sales7: number | null; sales30: number | null; bills30: number | null; payments30: number | null; journals30: number | null
  ai: number | null; aiUsd: number | null; support: number | null }
type AiRow = { key: string; business: string; month: string; task: string; model: string; calls: number; tokens: number; usd: number | null }

// How each Pro shop uses debbit: documents made, AI questions and their estimated cost, support requests. Counts only.
export default function ProUsage() {
  const { shops, detail, loading, error, load } = useProShops(true)
  const ai: AiRow[] = shops.flatMap(r => (detail[r.id]?.ai_usage ?? []).map((u, i) => ({ key: `${r.id}#${i}`, business: shopName(r), month: u.month, task: u.task, model: u.model, calls: u.calls,
    tokens: u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens,
    usd: estimateUsd(u.model, u.input_tokens, u.output_tokens, u.cache_read_input_tokens, u.cache_creation_input_tokens) })))
  const month = new Date().toISOString().slice(0, 7)
  const rows: ShopRow[] = shops.map(r => {
    const f = r.figures, a7 = f?.activity.last_7_days, a30 = f?.activity.last_30_days
    const usd = ai.filter(x => x.business === shopName(r) && x.month === month).reduce<number | null>((n, x) => x.usd === null ? n : (n ?? 0) + x.usd, null)
    return { id: r.id, name: shopName(r), sales7: a7 ? (a7.sales_invoices ?? 0) + (a7.till_sales ?? 0) : null, sales30: a30 ? (a30.sales_invoices ?? 0) + (a30.till_sales ?? 0) : null,
      bills30: a30?.supplier_bills ?? null, payments30: a30?.payments ?? null, journals30: a30?.journals ?? null,
      ai: f?.ai_this_month.questions ?? null, aiUsd: usd, support: f?.support?.open ?? null }
  })
  const usd = (n: number | null) => n === null ? '—' : `$${n.toFixed(2)}`
  const shopCols: ColumnDef<ShopRow>[] = [
    { key: 'name', header: 'Business', width: '200px', render: r => <span style={{ fontWeight: 700 }}>{r.name}<div style={{ fontSize: 11, ...muted, fontWeight: 400 }}>{r.id}</div></span> },
    { key: 'sales7', header: 'Sales (7d)', width: '90px', align: 'right', render: r => fmt(r.sales7) },
    { key: 'sales30', header: 'Sales (30d)', width: '100px', align: 'right', render: r => fmt(r.sales30) },
    { key: 'bills30', header: 'Bills (30d)', width: '90px', align: 'right', render: r => fmt(r.bills30) },
    { key: 'payments30', header: 'Payments (30d)', width: '110px', align: 'right', render: r => fmt(r.payments30) },
    { key: 'journals30', header: 'Journals (30d)', width: '110px', align: 'right', render: r => fmt(r.journals30) },
    { key: 'ai', header: 'AI questions (month)', width: '140px', align: 'right', render: r => fmt(r.ai) },
    { key: 'aiUsd', header: 'AI cost (month, est.)', width: '140px', align: 'right', render: r => usd(r.aiUsd) },
    { key: 'support', header: 'Support open', width: '100px', align: 'right', render: r => fmt(r.support) },
  ]
  const aiCols: ColumnDef<AiRow>[] = [
    { key: 'month', header: 'Month', width: '90px' },
    { key: 'business', header: 'Business', width: '180px' },
    { key: 'task', header: 'AI job', width: '140px' },
    { key: 'model', header: 'Model', width: '160px' },
    { key: 'calls', header: 'Calls', width: '80px', align: 'right', render: r => fmt(r.calls) },
    { key: 'tokens', header: 'Tokens', width: '110px', align: 'right', render: r => fmt(r.tokens) },
    { key: 'usd', header: 'Cost (est.)', width: '100px', align: 'right', render: r => usd(r.usd) },
  ]
  const sum = (k: keyof ShopRow) => rows.reduce((n, r) => n + (typeof r[k] === 'number' ? (r[k] as number) : 0), 0)
  return (
    <ProPage title="Usage" subtitle="How each Pro shop uses debbit: documents made, AI questions and their estimated cost. Counts only, never the records themselves." onRefresh={() => void load()} error={error}>
      <div style={s.kpiGrid}>
        <StatCard title="SALES DOCUMENTS (30D)" value={loading ? '…' : fmt(sum('sales30'))} subtext={`${fmt(sum('sales7'))} in the last 7 days`} accentColor="green" />
        <StatCard title="AI QUESTIONS THIS MONTH" value={loading ? '…' : fmt(sum('ai'))} subtext="all shops" accentColor="violet" />
        <StatCard title="AI COST THIS MONTH" value={loading ? '…' : usd(sum('aiUsd'))} subtext="estimate from token counts" accentColor="blue" />
      </div>
      <DataTable title="By business" columns={shopCols} data={rows} loading={loading} searchPlaceholder="Search business…" rowKey={r => r.id} />
      <div style={{ height: 24 }} />
      <DataTable title={`AI use by month (${ai.length})`} subtitle="Last 6 months, per AI job and model" columns={aiCols} data={ai} loading={loading} searchPlaceholder="Search business, job, model…" rowKey={r => r.key} />
    </ProPage>
  )
}
