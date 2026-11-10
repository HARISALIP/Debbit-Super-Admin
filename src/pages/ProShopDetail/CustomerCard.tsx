import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ProAiConsent, ProCustomer, ProStage } from '../../types'
import { CONSENT_TEXT, STAGE_TEXT, callProCrm } from '../../lib/pro'

const field = { padding: '6px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', width: '100%' } as const
const label = { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 } as const

type Form = { business_name: string; owner_name: string; owner_email: string; owner_phone: string; country: string; city: string; industry: string
  stage: ProStage; tags: string; account_manager: string; started_on: string; ai_consent: ProAiConsent; ai_consent_on: string }
const formFrom = (c: ProCustomer | null, name: string, country: string): Form => ({
  business_name: c?.business_name ?? name, owner_name: c?.owner_name ?? '', owner_email: c?.owner_email ?? '', owner_phone: c?.owner_phone ?? '',
  country: c?.country ?? country, city: c?.city ?? '', industry: c?.industry ?? '', stage: c?.stage ?? 'onboarding', tags: (c?.tags ?? []).join(', '),
  account_manager: c?.account_manager ?? '', started_on: c?.started_on ?? '', ai_consent: c?.ai_consent ?? 'not_asked', ai_consent_on: c?.ai_consent_on ?? '',
})

// Who the customer is and where they are with debbit: kept by debbit in Supabase, never in the shop. Every save is logged.
export default function CustomerCard({ shopId, shopName, shopCountry, onLoaded }: { shopId: string; shopName: string; shopCountry: string; onLoaded?: (c: ProCustomer | null) => void }) {
  const [card, setCard] = useState<ProCustomer | null>(null)
  const [form, setForm] = useState<Form>(formFrom(null, shopName, shopCountry))
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [notReady, setNotReady] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await callProCrm<{ customer: ProCustomer | null }>({ op: 'get', id: shopId })
    if (r.ok) { setCard(r.data.customer); setForm(formFrom(r.data.customer, shopName, shopCountry)); setNotReady(null); onLoaded?.(r.data.customer) }
    else if (r.notReady) setNotReady(r.error)
    else setMsg({ ok: false, text: r.error })
  }, [shopId, shopName, shopCountry, onLoaded])
  useEffect(() => { void load() }, [load])

  async function save() {
    setBusy(true); setMsg(null)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const r = await callProCrm<{ customer: ProCustomer }>({ op: 'save', id: shopId, ...form, tags })
    if (r.ok) { setCard(r.data.customer); setForm(formFrom(r.data.customer, shopName, shopCountry)); setEditing(false); setMsg({ ok: true, text: 'Saved.' }); onLoaded?.(r.data.customer) }
    else setMsg({ ok: false, text: r.error })
    setBusy(false)
  }

  if (notReady) return <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--amber, #d97706)', fontSize: 13 }}>ℹ️ Customer card: {notReady}</div>

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }))
  const stage = STAGE_TEXT[card?.stage ?? 'onboarding']
  const row = (title: string, value: string | null | undefined) => <div style={{ display: 'flex', gap: 8, padding: '3px 0' }}><span style={{ color: 'var(--text-muted)', width: 130 }}>{title}</span><span>{value || '—'}</span></div>

  return (
    <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 800 }}>Customer</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge variant={stage.variant}>{stage.label}</StatusBadge>
          {!editing && <button className="btn" onClick={() => setEditing(true)}>Edit</button>}
        </div>
      </div>
      {msg && <div style={{ fontSize: 12, color: msg.ok ? 'var(--green)' : 'var(--red)', marginBottom: 10 }}>{msg.text}</div>}
      {!editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            {row('Business', card?.business_name ?? shopName)}
            {row('Owner', card?.owner_name)}
            {row('Email', card?.owner_email)}
            {row('Phone', card?.owner_phone)}
            {row('Where', [card?.city, card?.country ?? shopCountry].filter(Boolean).join(', '))}
          </div>
          <div>
            {row('Industry', card?.industry)}
            {row('Account manager', card?.account_manager)}
            {row('With debbit since', card?.started_on)}
            {row('AI consent', `${CONSENT_TEXT[card?.ai_consent ?? 'not_asked']}${card?.ai_consent_on ? ` (${card.ai_consent_on})` : ''}`)}
            {row('Tags', card?.tags.length ? card.tags.join(', ') : null)}
          </div>
          {card && <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-muted)' }}>Last changed by {card.updated_by} on {new Date(card.updated_at).toLocaleString()}</div>}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div><label style={label}>Business name</label><input style={field} value={form.business_name} onChange={set('business_name')} maxLength={140} /></div>
            <div><label style={label}>Owner name</label><input style={field} value={form.owner_name} onChange={set('owner_name')} maxLength={140} /></div>
            <div><label style={label}>Owner email</label><input style={field} type="email" value={form.owner_email} onChange={set('owner_email')} maxLength={254} /></div>
            <div><label style={label}>Phone</label><input style={field} value={form.owner_phone} onChange={set('owner_phone')} maxLength={40} /></div>
            <div><label style={label}>Country</label><input style={field} value={form.country} onChange={set('country')} maxLength={60} /></div>
            <div><label style={label}>City</label><input style={field} value={form.city} onChange={set('city')} maxLength={80} /></div>
            <div><label style={label}>Industry</label><input style={field} value={form.industry} onChange={set('industry')} maxLength={60} placeholder="e.g. wholesale" /></div>
            <div><label style={label}>Stage</label><select style={field} value={form.stage} onChange={set('stage')}>{Object.entries(STAGE_TEXT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label style={label}>Account manager</label><input style={field} value={form.account_manager} onChange={set('account_manager')} maxLength={140} /></div>
            <div><label style={label}>With debbit since</label><input style={field} type="date" value={form.started_on} onChange={set('started_on')} /></div>
            <div><label style={label}>AI consent</label><select style={field} value={form.ai_consent} onChange={set('ai_consent')}>{Object.entries(CONSENT_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div><label style={label}>Consent date</label><input style={field} type="date" value={form.ai_consent_on} onChange={set('ai_consent_on')} disabled={form.ai_consent !== 'agreed' && form.ai_consent !== 'refused'} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={label}>Tags (comma between)</label><input style={field} value={form.tags} onChange={set('tags')} placeholder="e.g. pilot, tanzania, needs training" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn" disabled={busy} onClick={() => { setEditing(false); setForm(formFrom(card, shopName, shopCountry)) }}>Cancel</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Kept by debbit only. Nothing here changes the shop. AI consent is a record of what the owner told you; switching AI on still happens on the gateway.</div>
        </>
      )}
    </div>
  )
}
