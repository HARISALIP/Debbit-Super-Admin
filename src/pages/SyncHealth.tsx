import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import DataTable, { Column } from '../components/DataTable'
import { ActiveBadge } from '../components/StatusBadge'
import type { DeviceKey, Workstation } from '../lib/types'

type DeviceRow      = DeviceKey   & Record<string, unknown>
type WorkstationRow = Workstation & Record<string, unknown>

const MOCK_DEVICES: DeviceRow[] = [
  { id: 'd1', business_id: 'b1', device_id: 'DEV-WIN-001', label: 'POS Terminal #1 (Metro Mart)', is_active: true, last_seen_at: new Date(Date.now() - 300000).toISOString(), created_at: new Date().toISOString(), businesses: { name: 'Metro Mart KL' } },
  { id: 'd2', business_id: 'b2', device_id: 'DEV-WIN-002', label: 'Billing Register (Spice Garden)', is_active: true, last_seen_at: new Date(Date.now() - 7200000).toISOString(), created_at: new Date().toISOString(), businesses: { name: 'Spice Garden Bistro' } },
  { id: 'd3', business_id: 'b3', device_id: 'DEV-MAC-003', label: 'Warehouse Workstation (Al Madina)', is_active: false, last_seen_at: null, created_at: new Date().toISOString(), businesses: { name: 'Al Madina Wholesale' } },
]

const MOCK_WORKSTATIONS: WorkstationRow[] = [
  { id: 'w1', business_id: 'b1', device_id: 'DEV-WIN-001', hostname: 'DESKTOP-POS-01', platform: 'win32', last_sync_at: new Date(Date.now() - 120000).toISOString(), app_version: '1.4.2', is_active: true, created_at: new Date().toISOString(), businesses: { name: 'Metro Mart KL' } },
  { id: 'w2', business_id: 'b2', device_id: 'DEV-WIN-002', hostname: 'RESTAURANT-MAIN', platform: 'win32', last_sync_at: new Date(Date.now() - 3600000).toISOString(), app_version: '1.4.1', is_active: true, created_at: new Date().toISOString(), businesses: { name: 'Spice Garden Bistro' } },
]

const DEVICE_COLS: Column<DeviceRow>[] = [
  { key: 'device_id', header: 'Device ID', render: row => <span className="font-mono text-sm">{String(row.device_id)}</span> },
  { key: 'label',     header: 'Label',     render: row => <span>{String(row.label ?? '—')}</span> },
  {
    key: 'business_name',
    header: 'Business',
    render: row => <span>{String((row.businesses as { name?: string } | undefined)?.name ?? '—')}</span>,
  },
  {
    key: 'last_seen_at',
    header: 'Last Seen',
    width: '160px',
    render: row => {
      const ts = row.last_seen_at as string | null
      if (!ts) return <span className="text-muted text-sm">Never</span>
      const diff = Date.now() - new Date(ts).getTime()
      const mins = Math.floor(diff / 60000)
      const isStale = mins > 60
      return (
        <span style={{ color: isStale ? 'var(--amber)' : 'var(--green)', fontSize: '12px' }}>
          {mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`}
        </span>
      )
    },
  },
  { key: 'is_active', header: 'Status', width: '90px', render: row => <ActiveBadge active={Boolean(row.is_active)} /> },
  { key: 'created_at', header: 'Added', width: '120px', render: row => <span className="text-sm text-muted">{new Date(String(row.created_at)).toLocaleDateString()}</span> },
]

const WS_COLS: Column<WorkstationRow>[] = [
  { key: 'hostname',  header: 'Hostname', render: row => <span style={{ fontWeight: 600 }}>{String(row.hostname ?? '—')}</span> },
  { key: 'platform',  header: 'Platform', width: '100px', render: row => <span className="badge badge-muted">{String(row.platform ?? '—')}</span> },
  {
    key: 'business_name',
    header: 'Business',
    render: row => <span>{String((row.businesses as { name?: string } | undefined)?.name ?? '—')}</span>,
  },
  { key: 'app_version', header: 'Version', width: '90px', render: row => <span className="text-sm">v{String(row.app_version ?? '?')}</span> },
  {
    key: 'last_sync_at',
    header: 'Last Sync',
    width: '160px',
    render: row => {
      const ts = row.last_sync_at as string | null
      if (!ts) return <span className="text-muted text-sm">Never</span>
      const diff = Date.now() - new Date(ts).getTime()
      const mins = Math.floor(diff / 60000)
      return (
        <span style={{ color: mins > 120 ? 'var(--amber)' : 'var(--green)', fontSize: '12px' }}>
          {mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`}
        </span>
      )
    },
  },
  { key: 'is_active', header: 'Status', width: '90px', render: row => <ActiveBadge active={Boolean(row.is_active)} /> },
]

export default function SyncHealth() {
  const [devices, setDevices]         = useState<DeviceRow[]>(MOCK_DEVICES)
  const [workstations, setWorkstations] = useState<WorkstationRow[]>(MOCK_WORKSTATIONS)
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: dRows }, { data: wRows }] = await Promise.all([
        supabase.from('device_keys').select('*, businesses(name)').order('last_seen_at', { ascending: false }),
        supabase.from('workstations').select('*, businesses(name)').order('last_sync_at', { ascending: false }),
      ])
      setDevices(dRows && dRows.length > 0 ? (dRows as DeviceRow[]) : MOCK_DEVICES)
      setWorkstations(wRows && wRows.length > 0 ? (wRows as WorkstationRow[]) : MOCK_WORKSTATIONS)
    } catch {
      setDevices(MOCK_DEVICES)
      setWorkstations(MOCK_WORKSTATIONS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const staleDevices = devices.filter(d => {
    if (!d.last_seen_at) return true
    return Date.now() - new Date(String(d.last_seen_at)).getTime() > 60 * 60 * 1000
  }).length

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Sync Health</h1>
          <p>Device keys and workstation sync status across all businesses.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => { void load() }}>↻ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyan)' }}>{devices.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Devices</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--amber)' }}>{staleDevices}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Stale (&gt;1h)</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--violet-light)' }}>{workstations.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Workstations</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DataTable title="Device Keys" columns={DEVICE_COLS} data={devices} loading={loading} rowKey={row => String(row.id)} />
        <DataTable title="Workstations" columns={WS_COLS} data={workstations} loading={loading} rowKey={row => String(row.id)} />
      </div>
    </div>
  )
}
