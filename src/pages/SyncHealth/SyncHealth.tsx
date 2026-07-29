import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import { WorkstationRow, DeviceKeyRow, ColumnDef } from '../../types'
import { syncHealthStyles } from './SyncHealth.styles'

const MOCK_WORKSTATIONS: WorkstationRow[] = [
  { id: 'w1', name: 'KL Main Register 01', business_name: 'Metro Mart KL',       last_sync: '2026-07-29T11:58:00Z', pending_sync_count: 0,  status: 'Healthy'  },
  { id: 'w2', name: 'Bistro POS Counter',  business_name: 'Spice Garden Bistro', last_sync: '2026-07-29T11:40:00Z', pending_sync_count: 14, status: 'Syncing'  },
  { id: 'w3', name: 'Wholesale Depot 02',  business_name: 'Al Madina Wholesale',  last_sync: '2026-07-27T16:20:00Z', pending_sync_count: 89, status: 'Offline'  },
  { id: 'w4', name: 'Services Terminal',   business_name: 'Borneo Tech Services', last_sync: '2026-07-29T10:00:00Z', pending_sync_count: 2,  status: 'Healthy'  },
]

const MOCK_DEVICE_KEYS: DeviceKeyRow[] = [
  { id: 'dk1', device_name: 'POS-Terminal-KL-01',  key_prefix: 'deb_live_9f82...', created_at: '2026-06-15T00:00:00Z', status: 'Active'  },
  { id: 'dk2', device_name: 'Bistro-iPad-Counter',  key_prefix: 'deb_live_3a11...', created_at: '2026-07-01T00:00:00Z', status: 'Active'  },
  { id: 'dk3', device_name: 'Wholesale-Depot-Old',  key_prefix: 'deb_live_7c44...', created_at: '2026-01-10T00:00:00Z', status: 'Revoked' },
]

export default function SyncHealth() {
  const [workstations, setWorkstations] = useState<WorkstationRow[]>([])
  const [deviceKeys, setDeviceKeys]     = useState<DeviceKeyRow[]>([])
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: wsRows } = await supabase.from('workstations').select('*')
      const { data: dkRows } = await supabase.from('device_keys').select('*')

      if (wsRows && wsRows.length > 0) setWorkstations(wsRows as WorkstationRow[])
      else setWorkstations(MOCK_WORKSTATIONS)

      if (dkRows && dkRows.length > 0) setDeviceKeys(dkRows as DeviceKeyRow[])
      else setDeviceKeys(MOCK_DEVICE_KEYS)
    } catch {
      setWorkstations(MOCK_WORKSTATIONS)
      setDeviceKeys(MOCK_DEVICE_KEYS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const statusBadgeVariants: Record<string, BadgeVariant> = {
    Healthy: 'green',
    Syncing: 'cyan',
    Offline: 'red',
    Error:   'red',
    Active:  'green',
    Revoked: 'muted',
  }

  const wsColumns: ColumnDef<WorkstationRow>[] = [
    { key: 'name',          header: 'Workstation Name', width: '200px' },
    { key: 'business_name', header: 'Business',         width: '180px' },
    {
      key: 'last_sync',
      header: 'Last Sync',
      width: '160px',
      render: (r) => new Date(r.last_sync).toLocaleString(),
    },
    {
      key: 'pending_sync_count',
      header: 'Pending Records',
      width: '140px',
      render: (r) => r.pending_sync_count > 0 ? (
        <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{r.pending_sync_count} pending</span>
      ) : (
        <span style={{ color: 'var(--green)' }}>✓ Synced</span>
      ),
    },
    {
      key: 'status',
      header: 'Health Status',
      width: '120px',
      render: (r) => (
        <StatusBadge variant={statusBadgeVariants[r.status] || 'purple'}>
          {r.status}
        </StatusBadge>
      ),
    },
  ]

  const dkColumns: ColumnDef<DeviceKeyRow>[] = [
    { key: 'device_name', header: 'Device Name', width: '200px' },
    {
      key: 'key_prefix',
      header: 'Key Prefix',
      width: '160px',
      render: (r) => <code style={{ color: 'var(--cyan)' }}>{r.key_prefix}</code>,
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '140px',
      render: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <StatusBadge variant={statusBadgeVariants[r.status] || 'muted'}>
          {r.status}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={syncHealthStyles.headerRow}>
        <div>
          <h1 style={syncHealthStyles.title}>Sync Health & Workstations</h1>
          <p style={syncHealthStyles.subtitle}>Monitor offline-first SQLite database synchronization across POS registers</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <DataTable
          title={`Active Workstations (${workstations.length})`}
          columns={wsColumns}
          data={workstations}
          loading={loading}
          searchPlaceholder="Search workstation name, business…"
          rowKey={r => r.id}
        />
      </div>

      <div>
        <DataTable
          title={`Provisioned Device Keys (${deviceKeys.length})`}
          columns={dkColumns}
          data={deviceKeys}
          loading={loading}
          searchPlaceholder="Search device name…"
          rowKey={r => r.id}
        />
      </div>
    </div>
  )
}
