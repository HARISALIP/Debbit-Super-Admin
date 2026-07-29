import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import DataTable, { Column } from '../components/DataTable'
import { ActiveBadge } from '../components/StatusBadge'
import type { User } from '../lib/types'

type UserRow = User & Record<string, unknown>

const MOCK_USERS: UserRow[] = [
  { id: 'u1', auth_uid: 'a1', email: 'owner@metromart.my', full_name: 'Ahmad Razak', phone: '+60 12-345 6789', auth_provider: 'supabase', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'u2', auth_uid: 'a2', email: 'contact@spicegarden.in', full_name: 'Rajesh Sharma', phone: '+91 98765 43210', auth_provider: 'clerk', is_active: true, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'u3', auth_uid: 'a3', email: 'sales@almadina.ae', full_name: 'Tariq Al-Mansoor', phone: '+971 50 123 4567', auth_provider: 'supabase', is_active: false, created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'u4', auth_uid: 'a4', email: 'cashier@metromart.my', full_name: 'Siti Aminah', phone: '+60 19-876 5432', auth_provider: 'supabase', is_active: true, created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
]

const COLUMNS: Column<UserRow>[] = [
  {
    key: 'full_name',
    header: 'Name',
    render: row => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(row.full_name) || '—'}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{String(row.email)}</div>
      </div>
    ),
  },
  {
    key: 'auth_provider',
    header: 'Provider',
    width: '100px',
    render: row => (
      <span className="badge badge-cyan">{String(row.auth_provider)}</span>
    ),
  },
  { key: 'phone', header: 'Phone', width: '130px', render: row => <span>{String(row.phone ?? '—')}</span> },
  {
    key: 'created_at',
    header: 'Joined',
    width: '130px',
    render: row => <span className="text-sm text-muted">{new Date(String(row.created_at)).toLocaleDateString()}</span>,
  },
  {
    key: 'is_active',
    header: 'Status',
    width: '90px',
    render: row => <ActiveBadge active={Boolean(row.is_active)} />,
  },
]

export default function Users() {
  const [data, setData]       = useState<UserRow[]>(MOCK_USERS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && rows && rows.length > 0) setData(rows as UserRow[])
      else setData(MOCK_USERS)
    } catch {
      setData(MOCK_USERS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Users</h1>
        <p>All user accounts registered across the debbit OS platform.</p>
      </div>

      <DataTable
        title="All Users"
        columns={COLUMNS}
        data={data}
        loading={loading}
        searchPlaceholder="Search by name, email…"
        rowKey={row => String(row.id)}
      />
    </div>
  )
}
