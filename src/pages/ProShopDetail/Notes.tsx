import { useCallback, useEffect, useState } from 'react'
import { ProNote, ProNoteKind } from '../../types'
import { NOTE_KIND_TEXT, callProCrm } from '../../lib/pro'

const field = { padding: '6px 8px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' } as const

// A timeline of what debbit did with this customer: notes, calls, visits, issues, training. Append-only: a note cannot be edited or deleted.
export default function Notes({ shopId }: { shopId: string }) {
  const [notes, setNotes] = useState<ProNote[]>([])
  const [kind, setKind] = useState<ProNoteKind>('note')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [notReady, setNotReady] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await callProCrm<{ notes: ProNote[] }>({ op: 'get', id: shopId })
    if (r.ok) { setNotes(r.data.notes); setNotReady(null) } else if (r.notReady) setNotReady(r.error); else setMsg(r.error)
  }, [shopId])
  useEffect(() => { void load() }, [load])

  async function add() {
    setBusy(true); setMsg(null)
    const r = await callProCrm<{ note: ProNote }>({ op: 'add_note', id: shopId, kind, body })
    if (r.ok) { setNotes(n => [r.data.note, ...n]); setBody('') } else setMsg(r.error)
    setBusy(false)
  }

  if (notReady) return <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--amber, #d97706)', fontSize: 13 }}>ℹ️ Notes: {notReady}</div>
  return (
    <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Notes and contact</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
        <select style={field} value={kind} onChange={e => setKind(e.target.value as ProNoteKind)} aria-label="Kind">
          {Object.entries(NOTE_KIND_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <textarea style={{ ...field, flex: 1, minHeight: 60 }} value={body} onChange={e => setBody(e.target.value)} maxLength={4000} placeholder="What happened, what was agreed, what to follow up" />
        <button className="btn btn-primary" disabled={busy || !body.trim()} onClick={() => void add()}>{busy ? 'Adding…' : 'Add'}</button>
      </div>
      {msg && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{msg}</div>}
      {notes.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No notes yet.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(n => (
            <div key={n.id} style={{ borderLeft: '3px solid var(--border)', paddingLeft: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{NOTE_KIND_TEXT[n.kind]} · {n.created_by} · {new Date(n.created_at).toLocaleString()}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>Notes cannot be edited or deleted. Add a new note to correct one.</div>
    </div>
  )
}
