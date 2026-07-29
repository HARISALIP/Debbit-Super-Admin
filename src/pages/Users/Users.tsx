import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge from '../../components/atoms/StatusBadge'
import { UserRow, ColumnDef } from '../../types'
import { usersStyles } from './Users.styles'

const MOCK_USERS: UserRow[] = [
  { id: 'u1', email: 'ahmad@metromart.my', full_name: 'Ahmad Razak',       role: 'Owner',       business_name: 'Metro Mart KL',        last_sign_in: '2026-07-29T11:20:00Z', status: 'Active' },
  { id: 'u2', email: 'sarah@spicegarden.in', full_name: 'Sarah Sharma',    role: 'Store Manager', business_name: 'Spice Garden Bistro', last_sign_in: '2026-07-28T16:45:00Z', status: 'Active' },
  { id: 'u3', email: 'omar@almadina.ae',    full_name: 'Omar Al-Mansoor',  role: 'Admin',       business_name: 'Al Madina Wholesale',  last_sign_in: '2026-07-25T09:10:00Z', status: 'Inactive' },
  { id: 'u4', email: 'lim@borneotech.my',   full_name: 'Lim Guan Eng',     role: 'Cashier',     business_name: 'Borneo Tech Services', last_sign_in: '2026-07-29T08:05:00Z', status: 'Active' },
]

export default function Users() {
  const [data, setData]       = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('profiles')
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

  const columns: ColumnDef<UserRow>[] = [
    {
      key: 'full_name',
      header: 'User Name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.full_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.email}</div>
        </div>
      ),
    },
    { key: 'role',          header: 'Role',          width: '140px' },
    { key: 'business_name', header: 'Business',      width: '180px' },
    {
      key: 'last_sign_in',
      header: 'Last Active',
      width: '160px',
      render: (r) => r.last_sign_in ? new Date(r.last_sign_in).toLocaleString() : '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <StatusBadge variant={r.status === 'Active' ? 'green' : 'muted'}>
          {r.status}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={usersStyles.headerRow}>
        <div>
          <h1 style={usersStyles.title}>Platform Users</h1>
          <p style={usersStyles.subtitle}>View registered merchant staff and admin user accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>
          🔄 Refresh
        </button>
      </div>

      <DataTable
        title={`All Users (${data.length})`}
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search by user name, email, role…"
        rowKey={r => r.id}
      />
    </div>
  )
}
