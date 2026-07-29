import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import { ColumnDef } from '../../types'
import { telemetryStyles } from './Telemetry.styles'

// Matches the actual `app_telemetry` table schema in Supabase
interface AppTelemetryRow {
  id?: string
  business_id: string
  device_id: string
  app_version: string
  platform: string
  event_type: string
  scope: string
  severity: string
  message: string
  occurred_at: string
}

export default function Telemetry() {
  const [data, setData]       = useState<AppTelemetryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; data?: AppTelemetryRow[] }>('admin-telemetry', {
        body: { limit: 100 },
      })

      if (!error && data?.ok) {
        setData((data.data ?? []) as AppTelemetryRow[])
        return
      }

      const { data: rows, error: err } = await supabase
        .from('app_telemetry')
        .select('business_id, device_id, app_version, platform, event_type, scope, severity, message, occurred_at')
        .order('occurred_at', { ascending: false })
        .limit(100)
      if (err) {
        setError(err.message)
        setData([])
      } else {
        setData((rows ?? []) as AppTelemetryRow[])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const severityBadgeVariants: Record<string, BadgeVariant> = {
    CRITICAL: 'red',
    ERROR:    'red',
    WARNING:  'amber',
    WARN:     'amber',
    INFO:     'cyan',
    HEALTH:   'green',
  }

  const columns: ColumnDef<AppTelemetryRow>[] = [
    {
      key: 'occurred_at',
      header: 'Time',
      width: '160px',
      render: (r) => new Date(r.occurred_at).toLocaleString(),
    },
    {
      key: 'severity',
      header: 'Severity',
      width: '110px',
      render: (r) => (
        <StatusBadge variant={severityBadgeVariants[r.severity?.toUpperCase?.()] || 'purple'}>
          {r.severity}
        </StatusBadge>
      ),
    },
    { key: 'event_type', header: 'Event Type', width: '160px' },
    { key: 'platform',   header: 'Platform',   width: '100px' },
    {
      key: 'device_id',
      header: 'Device ID',
      width: '150px',
      render: (r) => <code style={{ fontSize: '11px', color: 'var(--cyan)' }}>{r.device_id}</code>,
    },
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
          <h1 style={telemetryStyles.title}>Telemetry &amp; Error Logs</h1>
          <p style={telemetryStyles.subtitle}>Real-time system events, sync failures &amp; crash logs across desktop apps</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      <DataTable
        title={`Telemetry Events (${data.length})`}
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search event type, severity, message…"
        rowKey={(r) => r.device_id + '_' + r.occurred_at}
      />
    </div>
  )
}
