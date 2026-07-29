import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DataTable, { Column } from '../components/DataTable'
import { ActiveBadge } from '../components/StatusBadge'
import type { Business } from '../lib/types'

type BusinessRow = Business & Record<string, unknown>

const MOCK_DATA: BusinessRow[] = [
  { id: 'b1', owner_id: 'u1', name: 'Metro Mart KL', legal_name: 'Metro Mart Sdn Bhd', registration_no: 'REG-2026-001', tax_id: 'SST-88219', country: 'MY', currency: 'MYR', business_type: 'RETAIL', is_active: true, city: 'Kuala Lumpur', phone: '+60 12-345 6789', email: 'owner@metromart.my', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b2', owner_id: 'u2', name: 'Spice Garden Bistro', legal_name: 'Spice Garden Pte Ltd', registration_no: 'REG-2026-002', tax_id: 'GST-99120', country: 'IN', currency: 'INR', business_type: 'FOOD_BEVERAGE', is_active: true, city: 'Mumbai', phone: '+91 98765 43210', email: 'contact@spicegarden.in', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'b3', owner_id: 'u3', name: 'Al Madina Wholesale', legal_name: 'Al Madina Trading LLC', registration_no: 'REG-2026-003', tax_id: 'VAT-10023', country: 'AE', currency: 'AED', business_type: 'WHOLESALE', is_active: false, city: 'Dubai', phone: '+971 50 123 4567', email: 'sales@almadina.ae', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: 'b4', owner_id: 'u4', name: 'Borneo Tech Services', legal_name: 'Borneo Services Enterprise', registration_no: 'REG-2026-004', tax_id: 'SST-44102', country: 'MY', currency: 'MYR', business_type: 'SERVICE', is_active: true, city: 'Kuching', phone: '+60 82-112 233', email: 'hello@borneotech.my', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
]

const COLUMNS: Column<BusinessRow>[] = [
  {
    key: 'name',
    header: 'Business',
    render: row => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(row.name)}</div>
        {row.legal_name && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{String(row.legal_name)}</div>}
      </div>
    ),
  },
  { key: 'country',       header: 'Country',  width: '80px' },
  { key: 'currency',      header: 'Currency', width: '90px' },
  { key: 'business_type', header: 'Type',     width: '120px' },
  {
    key: 'created_at',
    header: 'Registered',
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

export default function Businesses() {
  const [data, setData]         = useState<BusinessRow[]>(MOCK_DATA)
  const [loading, setLoading]   = useState(true)
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

  const actions = (row: BusinessRow) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
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
      <div className="page-header">
        <h1>Businesses</h1>
        <p>All registered tenants across the debbit OS platform.</p>
      </div>

      {actionMsg && <div className="alert alert-info">{actionMsg}</div>}

      <DataTable
        title="All Businesses"
        columns={COLUMNS}
        data={data}
        loading={loading}
        searchPlaceholder="Search by name, country, type…"
        rowKey={row => String(row.id)}
        actions={actions}
      />
    </div>
  )
}
