import { ProHealth } from '../../types'
import { PROBLEM_TEXT, ProResult } from '../../lib/pro'

// Plain-words check of the read-only link to debbit Pro: which switch is still missing, in the order they are set up.
// Uses only the health read the page already makes; it asks nothing extra of the gateway and changes nothing.
type Check = { label: string; state: 'ok' | 'missing' | 'unknown'; fix: string }

export function connectionChecks(r: ProResult<ProHealth> | null): Check[] {
  const step = r && !r.ok ? r.step : undefined
  const failedAt = r?.ok ? 99 : step === 'secrets' ? 0 : step === 'unreachable' ? 1 : step === 'gateway_off' ? 2 : step === 'key' ? 3 : -1
  const at = (i: number): Check['state'] => (failedAt === -1 ? 'unknown' : i < failedAt ? 'ok' : i === failedAt ? 'missing' : 'unknown')
  const sites = r?.ok ? r.data.sites : []
  const noReader = sites.filter(x => !x.reachable)
  return [
    { label: 'Super Admin knows where Pro is', state: at(0), fix: 'Supabase → Edge Functions → Secrets: set PRO_GATEWAY_URL and PRO_ADMIN_KEY.' },
    { label: 'The Pro gateway answers', state: at(1), fix: 'Render → pro-gateway: check it is Live. A sleeping service can take a minute; press Refresh.' },
    { label: 'The read-only feed is switched on', state: at(2), fix: 'Render → pro-gateway → Environment: set DEBBIT_ADMIN_KEY, then Manual Deploy.' },
    { label: 'The two keys match', state: at(3), fix: 'PRO_ADMIN_KEY in Supabase must be exactly the same as DEBBIT_ADMIN_KEY on Render.' },
    { label: sites.length ? `Every shop can be read (${sites.length - noReader.length} of ${sites.length})` : 'Every shop can be read',
      state: !r?.ok ? 'unknown' : noReader.length ? 'missing' : 'ok',
      fix: noReader.length ? noReader.map(x => `${x.id}: ${PROBLEM_TEXT[x.problem ?? ''] ?? 'not readable'}`).join(' · ') + '. On the VPS run bash infra/vps/update.sh: it makes the reader on every site by itself.' : '' },
  ]
}

export default function ProConnection({ result }: { result: ProResult<ProHealth> | null }) {
  if (!result) return null
  const checks = connectionChecks(result)
  const allOk = checks.every(c => c.state === 'ok')
  const icon = (c: Check) => (c.state === 'ok' ? '✅' : c.state === 'missing' ? '❌' : '○')
  return (
    <div className="card" style={{ marginBottom: 20, fontSize: 13, borderLeft: `4px solid ${allOk ? 'var(--green, #16a34a)' : 'var(--amber, #d97706)'}` }}>
      <div style={{ fontWeight: 600, marginBottom: allOk ? 0 : 8 }}>
        {allOk ? '✅ Connected to debbit Pro (read-only)' : 'Connection to debbit Pro: not finished'}
      </div>
      {!allOk && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {checks.map(c => (
            <li key={c.label}>
              {icon(c)} {c.label}
              {c.state === 'missing' && c.fix && <div style={{ marginLeft: 22, color: 'var(--text-muted, #6b7280)' }}>{c.fix}</div>}
            </li>
          ))}
        </ul>
      )}
      {!allOk && !result.ok && !result.step && <div style={{ marginTop: 8, color: 'var(--text-muted, #6b7280)' }}>{result.error}</div>}
    </div>
  )
}
