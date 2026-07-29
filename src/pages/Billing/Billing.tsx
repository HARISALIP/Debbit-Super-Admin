import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import StatCard from '../../components/molecules/StatCard'
import { BillingRow, ColumnDef } from '../../types'
import { billingStyles } from './Billing.styles'

const MOCK_BILLING: BillingRow[] = [
  { id: 'b1', business_name: 'Metro Mart KL',       plan: 'Growth Plan', amount: 'RM 299/mo', billing_cycle: 'Monthly', next_billing: '2026-08-15T00:00:00Z', status: 'Paid'     },
  { id: 'b2', business_name: 'Spice Garden Bistro', plan: 'Enterprise',  amount: 'RM 599/mo', billing_cycle: 'Annual',  next_billing: '2027-01-01T00:00:00Z', status: 'Paid'     },
  { id: 'b3', business_name: 'Al Madina Wholesale', plan: 'Starter',     amount: 'RM 149/mo', billing_cycle: 'Monthly', next_billing: '2026-07-20T00:00:00Z', status: 'Past Due' },
  { id: 'b4', business_name: 'Borneo Tech Services', plan: 'Growth Plan', amount: 'RM 299/mo', billing_cycle: 'Monthly', next_billing: '2026-08-01T00:00:00Z', status: 'Paid'     },
]

export default function Billing() {
  const [data, setData]       = useState<BillingRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
      if (!error && rows && rows.length > 0) setData(rows as BillingRow[])
      else setData(MOCK_BILLING)
    } catch {
      setData(MOCK_BILLING)
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

      <div style={billingStyles.kpiGrid}>
        <StatCard title="ESTIMATED MRR" value="RM 14,850" subtext="+18% growth" trend={{ value: '18% MRR', isUp: true }} accentColor="violet" />
        <StatCard title="ACTIVE SUBSCRIPTIONS" value="12 accounts" subtext="98% retention" accentColor="green" />
        <StatCard title="PAST DUE INVOICES" value="1 account" subtext="RM 149 overdue" badgeVariant="red" accentColor="red" />
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
