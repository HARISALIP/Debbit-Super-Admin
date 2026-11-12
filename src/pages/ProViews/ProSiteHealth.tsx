import { useEffect, useState } from 'react'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatCard from '../../components/molecules/StatCard'
import StatusBadge from '../../components/atoms/StatusBadge'
import { ColumnDef, ProHealth } from '../../types'
import { PROBLEM_TEXT, ago, callPro } from '../../lib/pro'
import { billingStyles as s } from '../Billing/Billing.styles'
import { ProPage, muted, shopName, useProShops } from './shared'

type Row = { id: string; name: string; status: string; reachable: boolean; ms: number | null; problem: string | null; scheduler: boolean | null
  backup: string | null; backupHours: number | null; disk: number | null; versions: string }

// Server health of every Pro shop: can the gateway reach the site, is its scheduler on, when was the last backup, how full is the disk.
export default function ProSiteHealth() {
  const { shops, loading, error, load } = useProShops()
  const [h, setH] = useState<ProHealth | null>(null)
  useEffect(() => { void callPro<ProHealth>('health').then(r => setH(r.ok ? r.data : null)) }, [shops])
  const rows: Row[] = shops.map(r => {
    const site = h?.sites.find(x => x.id === r.id), hh = r.figures?.health ?? site?.health ?? null
    const backupHours = hh?.last_backup_at ? (Date.now() - new Date(hh.last_backup_at).getTime()) / 3600000 : null
    return { id: r.id, name: shopName(r), status: r.status, reachable: site ? site.reachable : !!r.figures, ms: site?.ms ?? null,
      problem: r.figures ? null : PROBLEM_TEXT[r.problem ?? site?.problem ?? 'unreachable'] ?? 'Not readable', scheduler: hh ? hh.scheduler_on : null,
      backup: hh?.last_backup_at ?? null, backupHours, disk: hh?.disk_used_percent ?? null,
      versions: hh ? Object.entries(hh.versions).map(([k, v]) => `${k} ${v}`).join(' · ') : '' }
  })
  const columns: ColumnDef<Row>[] = [
    { key: 'name', header: 'Business', width: '200px', render: r => <span style={{ fontWeight: 700 }}>{r.name}<div style={{ fontSize: 11, ...muted, fontWeight: 400 }}>{r.id}</div></span> },
    { key: 'reachable', header: 'Reachable', width: '150px', render: r => r.problem ? <span style={{ color: 'var(--red)' }}>❌ {r.problem}</span> : <>✅ {r.ms !== null ? `${r.ms} ms` : ''}</> },
    { key: 'scheduler', header: 'Scheduler', width: '100px', render: r => r.scheduler === null ? '—' : r.scheduler ? <StatusBadge variant="green">On</StatusBadge> : <StatusBadge variant="red">Off</StatusBadge> },
    { key: 'backup', header: 'Last backup', width: '140px', render: r => r.backupHours === null ? (r.problem ? '—' : <span style={{ color: 'var(--red)' }}>⚠️ none found</span>) : r.backupHours > 26 ? <span style={{ color: 'var(--red)' }}>⚠️ {ago(r.backup)}</span> : ago(r.backup) },
    { key: 'disk', header: 'Disk used', width: '100px', align: 'right', render: r => r.disk === null ? '—' : r.disk >= 85 ? <span style={{ color: 'var(--red)' }}>⚠️ {r.disk}%</span> : `${r.disk}%` },
    { key: 'versions', header: 'App versions', width: '320px', render: r => <span style={{ fontSize: 11, ...muted }}>{r.versions || '—'}</span> },
  ]
  const bad = rows.filter(r => r.problem || r.scheduler === false || r.backupHours === null || r.backupHours > 26 || (r.disk ?? 0) >= 85).length
  return (
    <ProPage title="Health" subtitle="Server health of every Pro shop: reachable, scheduler, last backup and disk. Read-only." onRefresh={() => void load()} error={error}>
      <div style={s.kpiGrid}>
        <StatCard title="SITES REACHABLE" value={loading ? '…' : `${rows.filter(r => !r.problem).length} of ${rows.length}`} subtext="through the Pro gateway" accentColor="green" />
        <StatCard title="NEED A LOOK" value={loading ? '…' : bad} subtext="unreachable, scheduler off, old backup or full disk" accentColor={bad ? 'red' : 'green'} />
        <StatCard title="GATEWAY" value={h ? `${Math.round(h.gateway.uptime_seconds / 3600)}h up` : '…'} subtext={h ? `${h.gateway.memory_mb} MB · sessions ${h.sessions_ok ? 'OK' : 'not OK'}` : ''} accentColor="blue" />
      </div>
      <DataTable title={`Sites (${rows.length})`} columns={columns} data={rows} loading={loading} searchPlaceholder="Search business…" rowKey={r => r.id} />
    </ProPage>
  )
}
