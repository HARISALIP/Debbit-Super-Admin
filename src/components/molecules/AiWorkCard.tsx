import { ProAiWork } from '../../types'
import { JOB_STATUS_TEXT, OUTCOME_COLUMNS, WORKER_TEXT } from '../../lib/aiWork'
import { ago, fmt } from '../../lib/pro'

// What debbit's AI team did this month: each AI worker's work by outcome, each AI job's tasks by state, and approvals. Counts only.
export default function AiWorkCard({ work, note }: { work: ProAiWork | null | undefined; note?: string }) {
  const muted = { color: 'var(--text-muted)' }
  if (!work) {
    return (
      <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
        <div style={{ fontWeight: 800, marginBottom: 4 }}>AI work this month</div>
        <div style={muted}>{note ?? 'Not available yet: the site needs the latest update (on the VPS: bash infra/vps/update.sh).'}</div>
      </div>
    )
  }
  const workers = Object.entries(work.workers).filter(([, o]) => Object.values(o).some(n => n > 0))
  const extra = (o: Record<string, number>) => Object.entries(o).filter(([k, n]) => n > 0 && !OUTCOME_COLUMNS.some(c => c.key === k)).map(([k, n]) => `${k.replace(/_/g, ' ')} ${n}`).join(' · ')
  const jobs = Object.entries(work.jobs)
  const cell = { padding: '6px 8px', textAlign: 'right' as const }
  return (
    <div className="card" style={{ marginBottom: 24, fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800 }}>AI work this month ({work.month})</div>
          <div style={{ fontSize: 12, ...muted }}>What each AI worker did and what happened to it. Anything that changes a record waits for a person's approval.</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span><b>{fmt(work.waiting_approval)}</b> waiting for approval</span>
          <span><b>{fmt(work.approvals.given)}</b> approvals given · <b>{fmt(work.approvals.used)}</b> used</span>
          <span style={muted}>last AI action {work.last_action_at ? ago(work.last_action_at) : 'never'}</span>
        </div>
      </div>
      {workers.length ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: jobs.length ? 16 : 0 }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>AI worker</th>
            {OUTCOME_COLUMNS.map(c => <th key={c.key} style={cell} title={c.hint}>{c.label}</th>)}
            <th style={{ ...cell, textAlign: 'left' }}>Other</th>
          </tr></thead>
          <tbody>{workers.map(([actor, o]) => (
            <tr key={actor} style={{ borderBottom: '1px solid var(--border, #f3f4f6)' }}>
              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{WORKER_TEXT[actor] ?? actor}</td>
              {OUTCOME_COLUMNS.map(c => <td key={c.key} style={{ ...cell, color: c.key === 'denied' && o[c.key] ? 'var(--red)' : undefined }}>{o[c.key] ? fmt(o[c.key]) : '—'}</td>)}
              <td style={{ ...cell, textAlign: 'left', ...muted }}>{extra(o) || ''}</td>
            </tr>
          ))}</tbody>
        </table>
      ) : <div style={{ ...muted, marginBottom: jobs.length ? 16 : 0 }}>No AI work recorded this month.</div>}
      {jobs.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>AI job</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Tasks</th>
            <th style={cell}>Steps</th>
            <th style={cell}>Cost</th>
          </tr></thead>
          <tbody>{jobs.map(([job, j]) => (
            <tr key={job} style={{ borderBottom: '1px solid var(--border, #f3f4f6)' }}>
              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{job.replace(/[_.]/g, ' ')}</td>
              <td style={{ padding: '6px 8px' }}>{Object.entries(j.statuses).map(([k, n]) => `${JOB_STATUS_TEXT[k] ?? k} ${n}`).join(' · ')}</td>
              <td style={cell}>{fmt(j.steps)}</td>
              <td style={cell}>${j.cost_usd.toFixed(2)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}
