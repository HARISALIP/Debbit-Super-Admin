import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import DataTable from '../../components/organisms/DataTable/DataTable'
import StatusBadge, { BadgeVariant } from '../../components/atoms/StatusBadge'
import StatCard from '../../components/molecules/StatCard'
import { BillingSubscription, BillingStatus, ColumnDef } from '../../lib/types'
import { billingStyles } from './Billing.styles'

export default function Billing() {
  const [data, setData]       = useState<BillingSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

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
        setData((rows ?? []) as BillingSubscription[])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  async function toggleEnabled(row: BillingSubscription) {
    const next = !row.is_enabled
    const { error } = await supabase
      .from('billing_subscriptions')
      .update({ is_enabled: next, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (!error) {
      setData(prev => prev.map(item => item.id === row.id ? { ...item, is_enabled: next } : item))
      setActionMsg(`${row.business_name} ${next ? 'enabled' : 'disabled'}.`)
      setTimeout(() => setActionMsg(null), 3000)
    } else {
      setError(error.message)
    }
  }

  async function updateStatus(row: BillingSubscription, newStatus: BillingStatus) {
    const { error } = await supabase
      .from('billing_subscriptions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (!error) {
      setData(prev => prev.map(item => item.id === row.id ? { ...item, status: newStatus } : item))
      setActionMsg(`${row.business_name} status updated to ${newStatus}.`)
      setTimeout(() => setActionMsg(null), 3000)
    } else {
      setError(error.message)
    }
  }

  useEffect(() => { void load() }, [load])

  const statusBadgeVariants: Record<BillingStatus, BadgeVariant> = {
    Active:     'green',
    'Past Due': 'red',
    Suspended:  'amber',
    Cancelled:  'muted',
  }

  const columns: ColumnDef<BillingSubscription>[] = [
    { key: 'business_name', header: 'Business',      width: '200px' },
    { key: 'plan_tier',     header: 'Plan Tier',     width: '140px' },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (r) => `RM ${r.amount}`,
    },
    { key: 'billing_cycle', header: 'Cycle',         width: '120px' },
    {
      key: 'next_billing_date',
      header: 'Next Invoice',
      width: '140px',
      render: (r) => new Date(r.next_billing_date).toLocaleDateString(),
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
    {
      key: 'is_enabled',
      header: 'Enabled',
      width: '100px',
      render: (r) => (
        <StatusBadge variant={r.is_enabled ? 'green' : 'red'}>
          {r.is_enabled ? 'Yes' : 'No'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${r.is_enabled ? 'btn-danger' : 'btn-success'}`}
            onClick={() => void toggleEnabled(r)}
          >
            {r.is_enabled ? 'Disable' : 'Enable'}
          </button>
          <select
            className="btn btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            value={r.status}
            onChange={(e) => void updateStatus(r, e.target.value as BillingStatus)}
          >
            <option value="Active">Active</option>
            <option value="Past Due">Past Due</option>
            <option value="Suspended">Suspended</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
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

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          ✓ {actionMsg}
        </div>
      )}

      <div style={billingStyles.kpiGrid}>
        <StatCard title="TOTAL SUBSCRIPTIONS" value={loading ? '…' : String(data.length)} subtext="across all businesses" accentColor="violet" />
        <StatCard
          title="ACTIVE SUBSCRIPTIONS"
          value={loading ? '…' : String(data.filter(r => r.status === 'Active').length)}
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
