import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import StatCard from '../../components/molecules/StatCard'
import { BillingRow, ColumnDef } from '../../types'
import { billingStyles } from './Billing.styles'

export default function Billing() {
  const [data, setData]       = useState<BillingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: rows, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
      if (error) {
        setError(error.message)
        setData([])
      } else {
        setData((rows ?? []) as BillingRow[])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const statusBadgeVariants: Record<string, BadgeVariant> = {
    Paid:      'green',
    'Past Due': 'red',
    Trial:     'purple',
    Cancelled: 'muted',
  }

  const columns: ColumnDef<BillingRow>[] = [
    { key: 'business_name', header: 'Business',      width: '200px' },
    { key: 'plan',          header: 'Plan Tier',     width: '140px' },
    { key: 'amount',        header: 'Amount',        width: '120px' },
    { key: 'billing_cycle', header: 'Cycle',         width: '120px' },
    {
      key: 'next_billing',
      header: 'Next Invoice',
      width: '140px',
      render: (r) => new Date(r.next_billing).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (r) => (
        <StatusBadge variant={statusBadgeVariants[r.status] || 'purple'}>
          {r.status}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={billingStyles.headerRow}>
        <div>
          <h1 style={billingStyles.title}>Billing & Subscriptions</h1>
          <p style={billingStyles.subtitle}>Manage platform subscription plans, invoices & recurring revenue (MRR)</p>
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

      <div style={billingStyles.kpiGrid}>
        <StatCard title="TOTAL SUBSCRIPTIONS" value={loading ? '…' : String(data.length)} subtext="across all businesses" accentColor="violet" />
        <StatCard 
          title="ACTIVE SUBSCRIPTIONS" 
          value={loading ? '…' : String(data.filter(r => r.status === 'Paid').length)} 
          subtext="currently active" 
          accentColor="green" 
        />
        <StatCard 
          title="PAST DUE" 
          value={loading ? '…' : String(data.filter(r => r.status === 'Past Due').length)} 
          subtext="need attention" 
          accentColor={data.filter(r => r.status === 'Past Due').length > 0 ? 'red' : 'green'} 
        />
      </div>

      <DataTable
        title={`All Subscriptions (${data.length})`}
        columns={columns}
        data={data}
        loading={loading}
        searchPlaceholder="Search business, plan tier, status…"
        rowKey={r => r.id}
      />
    </div>
  )
}
