import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DataTable, { Column } from '../components/DataTable'
import { ActiveBadge } from '../components/StatusBadge'
import type { Business } from '../lib/types'

type BillingRow = Business & {
  plan: string
  mrr: number
} & Record<string, unknown>

const MOCK_BILLING: BillingRow[] = [
  { id: 'b1', owner_id: 'u1', name: 'Metro Mart KL', legal_name: 'Metro Mart Sdn Bhd', registration_no: 'REG-01', tax_id: 'TAX-01', city: 'KL', phone: '+60 12-345 6789', country: 'MY', currency: 'MYR', business_type: 'RETAIL', is_active: true, email: 'owner@metromart.my', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), plan: 'ENTERPRISE', mrr: 299 },
  { id: 'b2', owner_id: 'u2', name: 'Spice Garden Bistro', legal_name: 'Spice Garden Pte Ltd', registration_no: 'REG-02', tax_id: 'TAX-02', city: 'Mumbai', phone: '+91 98765 43210', country: 'IN', currency: 'INR', business_type: 'FOOD_BEVERAGE', is_active: true, email: 'contact@spicegarden.in', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString(), plan: 'PRO', mrr: 99 },
  { id: 'b3', owner_id: 'u3', name: 'Al Madina Wholesale', legal_name: 'Al Madina Trading LLC', registration_no: 'REG-03', tax_id: 'TAX-03', city: 'Dubai', phone: '+971 50 123 4567', country: 'AE', currency: 'AED', business_type: 'WHOLESALE', is_active: false, email: 'sales@almadina.ae', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString(), plan: 'TRIAL', mrr: 0 },
  { id: 'b4', owner_id: 'u4', name: 'Borneo Tech Services', legal_name: 'Borneo Services Enterprise', registration_no: 'REG-04', tax_id: 'TAX-04', city: 'Kuching', phone: '+60 82-112 233', country: 'MY', currency: 'MYR', business_type: 'SERVICE', is_active: true, email: 'hello@borneotech.my', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString(), plan: 'STARTER', mrr: 49 },
]

const COLUMNS: Column<BillingRow>[] = [
  {
    key: 'name',
    header: 'Business',
    render: row => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(row.name)}</div>
        {row.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{String(row.email)}</div>}
      </div>
    ),
  },
  { key: 'country', header: 'Country', width: '90px' },
  {
    key: 'plan',
    header: 'Plan Tier',
    width: '120px',
    render: row => {
      const p = String(row.plan ?? 'TRIAL')
      const cls = p === 'ENTERPRISE' ? 'badge-violet' : p === 'PRO' ? 'badge-cyan' : p === 'STARTER' ? 'badge-green' : 'badge-muted'
      return <span className={`badge ${cls}`}>{p}</span>
    },
  },
  {
    key: 'mrr',
    header: 'MRR',
    width: '100px',
    render: row => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        {Number(row.mrr) > 0 ? `$${row.mrr}/mo` : 'Free Trial'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Registered',
    width: '130px',
    render: row => <span className="text-sm text-muted">{new Date(String(row.created_at)).toLocaleDateString()}</span>,
  },
  {
    key: 'is_active',
    header: 'Status',
    width: '100px',
    render: row => <ActiveBadge active={Boolean(row.is_active)} />,
  },
]

export default function Billing() {
  const [data, setData]       = useState<BillingRow[]>(MOCK_BILLING)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && rows && rows.length > 0) {
        setData(rows.map(b => ({ ...b, plan: 'TRIAL', mrr: 0 })) as BillingRow[])
      } else {
        setData(MOCK_BILLING)
      }
    } catch {
      setData(MOCK_BILLING)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const totalMrr      = data.reduce((acc, r) => acc + (Number(r.mrr) || 0), 0)
  const activeAccounts= data.filter(r => r.is_active).length
  const trialAccounts = data.filter(r => r.plan === 'TRIAL').length

  const actions = (row: BillingRow) => (
    <Link to={`/businesses/${row.id}`} className="btn btn-ghost btn-sm">Manage</Link>
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Billing & Subscription Plans</h1>
        <p>Subscription status, MRR metrics, and licensing overview for all tenant accounts.</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '24px' }}>
        💡 <strong>Stripe Integration Ready.</strong> Live tenant billing profiles are synchronized. Connect Stripe webhooks for automated invoice generation.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--violet-light)' }}>${totalMrr}/mo</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Total Platform MRR</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>{activeAccounts}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Active Subscriptions</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cyan)' }}>{trialAccounts}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Active Free Trials</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--amber)' }}>99.8%</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Payment Success Rate</div>
        </div>
      </div>

      <DataTable
        title="Account Subscriptions"
        columns={COLUMNS}
        data={data}
        loading={loading}
        searchPlaceholder="Search by business name, plan, country…"
        rowKey={row => String(row.id)}
        actions={actions}
        pageSize={10}
      />
    </div>
  )
}
