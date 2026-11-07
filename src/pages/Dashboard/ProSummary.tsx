import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ProCustomer, ProShopRow, ProSubscription } from '../../types'
import { callPro, callProBilling, callProCrm, paidState } from '../../lib/pro'
import { attentionFor } from '../../lib/proAttention'

type Summary = { month: string; received: Record<string, number>; payments: number }

// debbit Pro at a glance on the Dashboard: customers, who used it this week, money received this month, who has not paid,
// AI questions and who needs attention. Same read-only feed and Supabase records as the Pro customers page.
export default function ProSummary() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProShopRow[] | null>(null)
  const [subs, setSubs] = useState<Map<string, ProSubscription> | null>(null)
  const [cards, setCards] = useState<Map<string, ProCustomer>>(new Map())
  const [money, setMoney] = useState<Summary | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [shops, bill, crm, sum] = await Promise.all([callPro<{ shops: ProShopRow[] }>('shops'), callProBilling<{ subscriptions: ProSubscription[] }>({ op: 'list' }),
      callProCrm<{ customers: ProCustomer[] }>({ op: 'list' }), callProBilling<Summary>({ op: 'summary' })])
    if (shops.ok) { setRows(shops.data.shops); setNote(null) } else { setRows(null); setNote(shops.error) }
    setSubs(bill.ok ? new Map(bill.data.subscriptions.map(x => [x.shop_id, x])) : null)
    setCards(crm.ok ? new Map(crm.data.customers.map(x => [x.shop_id, x])) : new Map())
    setMoney(sum.ok ? sum.data : null)
  }, [])
  useEffect(() => { void load() }, [load])

  if (note) return <div className="card" style={{ marginBottom: 24, fontSize: 13, borderLeft: '4px solid var(--amber, #d97706)' }}>ℹ️ debbit Pro: {note}</div>
  const list = rows ?? []
  const active = list.filter(r => (r.figures?.people.signed_in_last_7_days ?? 0) > 0).length
  const notPaid = subs ? list.filter(r => paidState(subs.get(r.id)).rank === 0).length : null
  const ai = list.reduce((n, r) => n + (r.figures?.ai_this_month.questions ?? 0), 0)
  const aiOn = list.filter(r => r.gateway?.ai).length
  const attention = list.map(r => ({ r, a: attentionFor(r, subs ? subs.get(r.id) ?? null : undefined, cards.get(r.id) ?? null) })).filter(x => x.a.some(a => a.level === 'red'))
  const received = money ? Object.entries(money.received).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' + ') || '0' : '—'

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800 }}>debbit Pro</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pro')}>All Pro customers →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 12 }}>
        <StatCard title="CUSTOMERS" value={rows ? list.length : '…'} subtext={`${active} used it this week`} />
        <StatCard title="RECEIVED THIS MONTH" value={received} subtext={money ? `${money.payments} payment${money.payments === 1 ? '' : 's'} recorded` : 'payments not set up'} accentColor="green" />
        <StatCard title="NOT PAID" value={notPaid ?? '—'} subtext="overdue or trial ended" accentColor={notPaid ? 'red' : 'green'} />
        <StatCard title="AI QUESTIONS" value={rows ? ai : '…'} subtext={`this month · AI on for ${aiOn}`} accentColor="violet" />
        <StatCard title="NEED ATTENTION" value={rows ? attention.length : '…'} subtext="something red on their page" accentColor={attention.length ? 'red' : 'green'} />
      </div>
      {attention.length > 0 && (
        <div className="card" style={{ fontSize: 13 }}>
          {attention.slice(0, 6).map(({ r, a }) => (
            <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
              <button className="btn btn-ghost btn-sm" style={{ padding: 0, fontWeight: 700 }} onClick={() => navigate(`/pro/${r.id}`)}>{cards.get(r.id)?.business_name ?? r.figures?.businesses[0]?.name ?? r.id}</button>
              <StatusBadge variant={a[0].level}>{a[0].area}</StatusBadge><span>{a[0].text}</span>
              {a.length > 1 && <span style={{ color: 'var(--text-muted)' }}>and {a.length - 1} more</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
