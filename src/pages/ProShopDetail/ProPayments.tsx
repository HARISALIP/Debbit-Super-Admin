import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ProPayment, ProPaymentMethod, ProSubscription } from '../../types'
import { METHOD_TEXT, addMonths, callProBilling, paidState } from '../../lib/pro'

const field = { padding: '6px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', width: '100%' } as const
const label = { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 } as const
const today = () => new Date().toISOString().slice(0, 10)
const nextDay = (d: string) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10) }
// A payment continues from the current paid-until date when the shop is paid ahead, otherwise from the day it paid.
const cover = (sub: ProSubscription | null, paidOn: string, months: string) =>
  addMonths(sub?.paid_until && sub.paid_until >= paidOn ? nextDay(sub.paid_until) : paidOn, Number(months) || 1)

type Plan = { shop_name: string; plan: string; price: string; currency: string; paid_until: string; trial_ends: string; notes: string }
const planFrom = (s: ProSubscription | null, name: string): Plan => ({
  shop_name: s?.shop_name ?? name, plan: s?.plan ?? '', price: s?.price === null || s?.price === undefined ? '' : String(s.price),
  currency: s?.currency ?? '', paid_until: s?.paid_until ?? '', trial_ends: s?.trial_ends ?? '', notes: s?.notes ?? '',
})

// Paid or not for one Pro shop: its plan and "paid until" date, and the payments debbit received, entered by hand.
// Payments cannot be changed or removed once saved; a mistake is explained in the notes.
export default function ProPayments({ shopId, shopName }: { shopId: string; shopName: string }) {
  const [sub, setSub] = useState<ProSubscription | null>(null)
  const [payments, setPayments] = useState<ProPayment[]>([])
  const [plan, setPlan] = useState<Plan>(planFrom(null, shopName))
  const [pay, setPay] = useState({ amount: '', paid_on: today(), months: '1', covers_until: addMonths(today(), 1), method: 'mobile_money' as ProPaymentMethod, reference: '', note: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [notReady, setNotReady] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await callProBilling<{ subscription: ProSubscription | null; payments: ProPayment[] }>({ op: 'get', id: shopId })
    if (r.ok) {
      const s = r.data.subscription
      setSub(s); setPayments(r.data.payments); setPlan(planFrom(s, shopName)); setNotReady(null)
      setPay(p => ({ ...p, covers_until: p.months === 'custom' ? p.covers_until : cover(s, p.paid_on, p.months) }))
    }
    else if (r.notReady) setNotReady(r.error)
    else setMsg({ ok: false, text: r.error })
    setLoading(false)
  }, [shopId, shopName])
  useEffect(() => { void load() }, [load])

  async function savePlan() {
    setBusy(true); setMsg(null)
    const r = await callProBilling<{ subscription: ProSubscription }>({ op: 'save', id: shopId, ...plan })
    if (r.ok) { setSub(r.data.subscription); setPlan(planFrom(r.data.subscription, shopName)); setPay(p => ({ ...p, covers_until: p.months === 'custom' ? p.covers_until : cover(r.data.subscription, p.paid_on, p.months) })); setMsg({ ok: true, text: 'Plan saved.' }) }
    else setMsg({ ok: false, text: r.error })
    setBusy(false)
  }

  async function recordPayment() {
    const currency = sub?.currency ?? plan.currency
    if (!window.confirm(`Record ${pay.amount} ${currency} paid on ${pay.paid_on}, covering until ${pay.covers_until}? A saved payment cannot be changed.`)) return
    setBusy(true); setMsg(null)
    const r = await callProBilling<{ subscription: ProSubscription }>({
      op: 'record_payment', id: shopId, amount: pay.amount, currency, paid_on: pay.paid_on, covers_until: pay.covers_until,
      method: pay.method, reference: pay.reference, note: pay.note,
    })
    if (r.ok) { setMsg({ ok: true, text: 'Payment recorded.' }); setPay(p => ({ ...p, amount: '', reference: '', note: '' })); await load() }
    else setMsg({ ok: false, text: r.error })
    setBusy(false)
  }

  const state = paidState(sub)
  const setP = (k: keyof Plan) => (e: { target: { value: string } }) => setPlan(p => ({ ...p, [k]: e.target.value }))

  if (notReady) return <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--amber, #d97706)', fontSize: 13 }}>ℹ️ Paid or not: {notReady}</div>

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}>Paid or not</div>
        {!loading && <StatusBadge variant={state.variant}>{state.label}</StatusBadge>}
      </div>
      {msg && <div style={{ fontSize: 12, color: msg.ok ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><span style={label}>Shop name</span><input style={field} value={plan.shop_name} onChange={setP('shop_name')} /></div>
            <div><span style={label}>Plan</span><input style={field} placeholder="e.g. Pro monthly" value={plan.plan} onChange={setP('plan')} /></div>
            <div><span style={label}>Price per month</span><input style={field} inputMode="decimal" value={plan.price} onChange={setP('price')} /></div>
            <div><span style={label}>Currency</span><input style={field} placeholder="TZS" maxLength={3} value={plan.currency} onChange={e => setPlan(p => ({ ...p, currency: e.target.value.toUpperCase() }))} /></div>
            <div><span style={label}>Paid until</span><input style={field} type="date" value={plan.paid_until} onChange={setP('paid_until')} /></div>
            <div><span style={label}>Free trial until</span><input style={field} type="date" value={plan.trial_ends} onChange={setP('trial_ends')} /></div>
          </div>
          <div style={{ marginTop: 10 }}><span style={label}>Notes</span><textarea style={{ ...field, minHeight: 56 }} value={plan.notes} onChange={setP('notes')} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <button className="btn btn-sm" disabled={busy || loading} onClick={() => void savePlan()}>{busy ? '…' : 'Save plan'}</button>
            {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last changed by {sub.updated_by ?? '—'} on {new Date(sub.updated_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Record a payment</div>
          {!sub ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Save the plan first.</div> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><span style={label}>Amount ({sub.currency ?? 'set a currency'})</span><input style={field} inputMode="decimal" placeholder={sub.price ? String(sub.price) : ''} value={pay.amount} onChange={e => setPay(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><span style={label}>How</span>
                  <select style={field} value={pay.method} onChange={e => setPay(p => ({ ...p, method: e.target.value as ProPaymentMethod }))}>
                    {Object.entries(METHOD_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><span style={label}>Paid on</span><input style={field} type="date" value={pay.paid_on} onChange={e => { const paid_on = e.target.value; setPay(p => ({ ...p, paid_on, covers_until: p.months === 'custom' ? p.covers_until : cover(sub, paid_on, p.months) })) }} /></div>
                <div><span style={label}>Months</span>
                  <select style={field} value={pay.months} onChange={e => { const months = e.target.value; setPay(p => ({ ...p, months, covers_until: months === 'custom' ? p.covers_until : cover(sub, p.paid_on, months) })) }}>
                    {['1', '3', '6', '12'].map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="custom">Other</option>
                  </select></div>
                <div><span style={label}>Covers until</span><input style={field} type="date" value={pay.covers_until} onChange={e => setPay(p => ({ ...p, months: 'custom', covers_until: e.target.value }))} /></div>
                <div><span style={label}>Reference</span><input style={field} placeholder="M-Pesa code, receipt no." value={pay.reference} onChange={e => setPay(p => ({ ...p, reference: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 10 }}><span style={label}>Note</span><input style={field} value={pay.note} onChange={e => setPay(p => ({ ...p, note: e.target.value }))} /></div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={busy || !pay.amount || !sub.currency} onClick={() => void recordPayment()}>{busy ? '…' : 'Record payment'}</button>
              {!sub.currency && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Set the plan's currency first.</div>}
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 8px' }}>Payments ({payments.length})</div>
      {payments.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{loading ? 'Loading…' : 'No payments recorded yet.'}</div> : (
        <table style={{ width: '100%', fontSize: 13 }}>
          <thead><tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}><th>Paid on</th><th style={{ textAlign: 'right' }}>Amount</th><th>How</th><th>Covers until</th><th>Reference</th><th>Recorded by</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id}><td>{p.paid_on}</td><td style={{ textAlign: 'right' }}>{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {p.currency}</td>
              <td>{METHOD_TEXT[p.method] ?? p.method}</td><td>{p.covers_until}</td><td>{p.reference ?? '—'}{p.note ? <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.note}</div> : null}</td><td>{p.recorded_by}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}
