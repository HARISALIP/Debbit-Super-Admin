import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import { TelemetryRow, ColumnDef } from '../../types'
import { telemetryStyles } from './Telemetry.styles'

const MOCK_TELEMETRY: TelemetryRow[] = [
  { id: 't1', timestamp: '2026-07-29T11:45:10Z', event_type: 'SYNC_TIMEOUT',       severity: 'WARNING',  business_name: 'Metro Mart KL',       device_info: 'POS-Terminal-01', message: 'SQLite sync timed out after 30s' },
  { id: 't2', timestamp: '2026-07-29T10:12:00Z', event_type: 'AUTH_FAILED',        severity: 'CRITICAL', business_name: 'Al Madina Wholesale', device_info: 'Desktop-App-v2.4', message: 'Device key expired or revoked' },
  { id: 't3', timestamp: '2026-07-29T09:30:15Z', event_type: 'PRINTER_DISCONNECTED', severity: 'INFO',     business_name: 'Spice Garden Bistro', device_info: 'Thermal-Receipt-R2', message: 'USB printer re-connected successfully' },
  { id: 't4', timestamp: '2026-07-28T18:22:00Z', event_type: 'DB_MIGRATION_ERR',   severity: 'ERROR',    business_name: 'Borneo Tech Services', device_info: 'POS-Terminal-02', message: 'Column constraint violation on table sales' },
]

export default function Telemetry() {
  const [data, setData]       = useState<TelemetryRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .order('timestamp', { ascending: false })
      if (!error && rows && rows.length > 0) setData(rows as TelemetryRow[])
      else setData(MOCK_TELEMETRY)
    } catch {
      setData(MOCK_TELEMETRY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const severityBadgeVariants: Record<string, BadgeVariant> = {
    CRITICAL: 'red',
    ERROR:    'red',
    WARNING:  'amber',
    INFO:     'cyan',
  }

  const columns: ColumnDef<TelemetryRow>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      width: '160px',
      render: (r) => new Date(r.timestamp).toLocaleString(),
    },
    {
      key: 'severity',
      header: 'Severity',
      width: '110px',
      render: (r) => (
        <StatusBadge variant={severityBadgeVariants[r.severity] || 'purple'}>
          {r.severity}
        </StatusBadge>
      ),
    },
    { key: 'event_type',    header: 'Event Type',  width: '160px' },
    { key: 'business_name', header: 'Business',    width: '170px' },
    { key: 'device_info',   header: 'Device/App',  width: '150px' },
    {
      key: 'message',
      header: 'Log Message',
      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.message}</span>,
    },
  ]

  return (
    <div className="fade-in">
      <div style={telemetryStyles.headerRow}>
        <div>
          <h1 style={telemetryStyles.title}>Telemetry & Error Logs</h1>
          <p style={telemetryStyles.subtitle}>Real-time system events, sync failures & crash logs across desktop apps</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>
          🔄 Refresh
        </button>
      </div>

      <DataTable
        title={`Telemetry Events (${data.length})`}
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search event type, severity, message…"
        rowKey={r => r.id}
      />
    </div>
  )
}
