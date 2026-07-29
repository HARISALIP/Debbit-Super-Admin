import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import DataTable, { Column } from '../components/DataTable'
import { SeverityBadge } from '../components/StatusBadge'
import type { AppTelemetry, TelemetrySeverity } from '../lib/types'

type TelRow = AppTelemetry & Record<string, unknown>

const MOCK_TEL: TelRow[] = [
  { id: 't1', business_id: 'b1', device_id: 'DEV-WIN-001', app_version: '1.4.2', platform: 'win32', event_type: 'SYNC_FAIL', scope: 'sync_engine', severity: 'ERROR', message: 'SQLite WAL checkpoint timeout during background sync', occurred_at: new Date().toISOString(), received_at: new Date().toISOString() },
  { id: 't2', business_id: 'b2', device_id: 'DEV-WIN-002', app_version: '1.4.1', platform: 'win32', event_type: 'CRASH', scope: 'ipc_handler', severity: 'ERROR', message: 'Uncaught Exception in inventory movement calculator', occurred_at: new Date(Date.now() - 3600000).toISOString(), received_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 't3', business_id: 'b1', device_id: 'DEV-WIN-001', app_version: '1.4.2', platform: 'win32', event_type: 'HEALTH', scope: 'backup_job', severity: 'INFO', message: 'Daily automated backup verified successfully (size: 42.1MB)', occurred_at: new Date(Date.now() - 7200000).toISOString(), received_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 't4', business_id: 'b3', device_id: 'DEV-MAC-003', app_version: '1.4.0', platform: 'darwin', event_type: 'MYINVOIS_FAIL', scope: 'myinvois_api', severity: 'WARN', message: 'LHDN MyInvois API rate limit exceeded — retrying in 30s', occurred_at: new Date(Date.now() - 10800000).toISOString(), received_at: new Date(Date.now() - 10800000).toISOString() },
]

const COLUMNS: Column<TelRow>[] = [
  {
    key: 'severity',
    header: 'Severity',
    width: '90px',
    render: row => <SeverityBadge severity={row.severity as string | null} />,
  },
  {
    key: 'event_type',
    header: 'Event',
    width: '120px',
    render: row => <span className="badge badge-muted">{String(row.event_type ?? '—')}</span>,
  },
  {
    key: 'message',
    header: 'Message',
    render: row => <span className="truncate" style={{ display: 'block', maxWidth: '300px', color: 'var(--text-secondary)' }}>{String(row.message ?? '—')}</span>,
  },
  { key: 'scope',        header: 'Scope',      width: '110px', render: row => <span className="text-sm text-muted">{String(row.scope ?? '—')}</span> },
  { key: 'device_id',   header: 'Device',     width: '140px', render: row => <span className="font-mono text-sm text-muted">{String(row.device_id ?? '—')}</span> },
  { key: 'app_version', header: 'Version',    width: '80px',  render: row => <span className="text-sm text-muted">v{String(row.app_version ?? '?')}</span> },
  {
    key: 'received_at',
    header: 'Received',
    width: '150px',
    render: row => <span className="text-sm text-muted">{new Date(String(row.received_at)).toLocaleString()}</span>,
  },
]

export default function Telemetry() {
  const [data, setData]               = useState<TelRow[]>(MOCK_TEL)
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState<TelemetrySeverity | 'ALL'>('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('app_telemetry')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(500)

      if (filter !== 'ALL') q = q.eq('severity', filter)

      const { data: rows, error } = await q
      if (!error && rows && rows.length > 0) setData(rows as TelRow[])
      else setData(filter === 'ALL' ? MOCK_TEL : MOCK_TEL.filter(r => r.severity === filter))
    } catch {
      setData(filter === 'ALL' ? MOCK_TEL : MOCK_TEL.filter(r => r.severity === filter))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { void load() }, [load])

  const errorCount = data.filter(r => r.severity === 'ERROR').length
  const warnCount  = data.filter(r => r.severity === 'WARN').length

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Telemetry</h1>
        <p>Real-time error, crash, and health events from all debbit OS desktops.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {([
          { label: 'All',    val: 'ALL',   badge: null },
          { label: 'Errors', val: 'ERROR', badge: errorCount, cls: 'badge-red' },
          { label: 'Warns',  val: 'WARN',  badge: warnCount,  cls: 'badge-amber' },
          { label: 'Info',   val: 'INFO',  badge: null,       cls: 'badge-cyan' },
        ] as const).map(f => (
          <button
            key={f.val}
            onClick={() => setFilter(f.val as TelemetrySeverity | 'ALL')}
            className={`btn ${filter === f.val ? 'btn-primary' : 'btn-ghost'}`}
            style={{ gap: '6px' }}
          >
            {f.label}
            {f.badge !== null && f.badge !== undefined && (
              <span className={`badge ${f.cls}`} style={{ padding: '0 6px' }}>{f.badge}</span>
            )}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => { void load() }}>↻ Refresh</button>
      </div>

      <DataTable
        title="Telemetry Events"
        columns={COLUMNS}
        data={data}
        loading={loading}
        searchPlaceholder="Search by message, device, scope…"
        rowKey={row => String(row.id)}
        pageSize={25}
      />
    </div>
  )
}
