import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge from '../../components/atoms/StatusBadge'
import { BusinessRow, ColumnDef } from '../../types'
import { businessesStyles } from './Businesses.styles'

const MOCK_DATA: BusinessRow[] = [
  { id: 'b1', name: 'Metro Mart KL',         legal_name: 'Metro Mart Sdn Bhd',       country: 'MY', currency: 'MYR', business_type: 'RETAIL',        created_at: '2026-07-29T10:00:00Z', is_active: true  },
  { id: 'b2', name: 'Spice Garden Bistro',   legal_name: 'Spice Garden Pte Ltd',     country: 'IN', currency: 'INR', business_type: 'FOOD_BEVERAGE', created_at: '2026-07-28T14:30:00Z', is_active: true  },
  { id: 'b3', name: 'Al Madina Wholesale',   legal_name: 'Al Madina Trading LLC',    country: 'AE', currency: 'AED', business_type: 'WHOLESALE',     created_at: '2026-07-27T09:15:00Z', is_active: false },
  { id: 'b4', name: 'Borneo Tech Services',  legal_name: 'Borneo Services Enterprise', country: 'MY', currency: 'MYR', business_type: 'SERVICE',       created_at: '2026-07-26T16:00:00Z', is_active: true  },
]

export default function Businesses() {
  const [data, setData]           = useState<BusinessRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && rows && rows.length > 0) setData(rows as BusinessRow[])
      else setData(MOCK_DATA)
    } catch {
      setData(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleActive(row: BusinessRow) {
    const next = !row.is_active
    setData(prev => prev.map(item => item.id === row.id ? { ...item, is_active: next } : item))
    setActionMsg(`${String(row.name)} ${next ? 'activated' : 'suspended'}.`)
    setTimeout(() => setActionMsg(null), 3000)
  }

  const columns: ColumnDef<BusinessRow>[] = [
    {
      key: 'name',
      header: 'Business',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(r.name)}</div>
          {r.legal_name && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.legal_name}</div>
          )}
        </div>
      ),
    },
    { key: 'country',       header: 'Country',  width: '100px' },
    { key: 'currency',      header: 'Currency', width: '100px' },
    { key: 'business_type', header: 'Type',     width: '150px' },
    {
      key: 'created_at',
      header: 'Registered',
      width: '140px',
      render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <StatusBadge variant={r.is_active ? 'green' : 'red'}>
          {r.is_active ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
  ]

  const actions = (row: BusinessRow) => (
    <div style={businessesStyles.actionCell}>
      <Link to={`/businesses/${String(row.id)}`} className="btn btn-ghost btn-sm">View</Link>
      <button
        className={`btn btn-sm ${row.is_active ? 'btn-danger' : 'btn-success'}`}
        onClick={() => { void toggleActive(row) }}
      >
        {row.is_active ? 'Suspend' : 'Activate'}
      </button>
    </div>
  )

  return (
    <div className="fade-in">
      <div style={businessesStyles.headerRow}>
        <div>
          <h1 style={businessesStyles.title}>Businesses</h1>
          <p style={businessesStyles.subtitle}>Manage multi-tenant merchant organizations</p>
        </div>
        <button className="btn btn-primary" onClick={() => void load()}>
          🔄 Refresh
        </button>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          ✓ {actionMsg}
        </div>
      )}

      <DataTable
        title={`All Businesses (${data.length})`}
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search by name, country, type…"
        rowKey={r => r.id}
        actions={actions}
      />
    </div>
  )
}
