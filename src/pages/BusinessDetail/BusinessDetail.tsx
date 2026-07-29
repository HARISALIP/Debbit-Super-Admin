import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/atoms/StatusBadge'
import StatCard from '../../components/molecules/StatCard'
import { BusinessDetailDTO } from '../../types'
import { businessDetailStyles } from './BusinessDetail.styles'

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>()
  const [business, setBusiness] = useState<BusinessDetailDTO | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (!error && data) {
          setBusiness(data as BusinessDetailDTO)
        } else {
          setBusiness({
            id: id || 'b1',
            name: 'Metro Mart KL',
            legal_name: 'Metro Mart Sdn Bhd',
            country: 'MY',
            currency: 'MYR',
            business_type: 'RETAIL',
            created_at: new Date().toISOString(),
            is_active: true,
            owner_email: 'owner@metromart.my',
            phone: '+60 12-345 6789',
            subscription_tier: 'Growth Plan',
            active_users_count: 12,
            workstations_count: 4,
            total_revenue_myr: 148200,
          })
        }
      } catch {
        setBusiness({
          id: id || 'b1',
          name: 'Metro Mart KL',
          legal_name: 'Metro Mart Sdn Bhd',
          country: 'MY',
          currency: 'MYR',
          business_type: 'RETAIL',
          created_at: new Date().toISOString(),
          is_active: true,
          owner_email: 'owner@metromart.my',
          phone: '+60 12-345 6789',
          subscription_tier: 'Growth Plan',
          active_users_count: 12,
          workstations_count: 4,
          total_revenue_myr: 148200,
        })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading business details…</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div>
        <Link to="/businesses" className="btn btn-ghost">← Back to Businesses</Link>
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <p>Business not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/businesses" className="btn btn-ghost btn-sm">← Back to Businesses</Link>
      </div>

      <div style={businessDetailStyles.headerRow}>
        <div>
          <h1 style={businessDetailStyles.title}>{business.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            ID: {business.id} · {business.legal_name || 'N/A'}
          </p>
        </div>
        <StatusBadge variant={business.is_active ? 'green' : 'red'}>
          {business.is_active ? 'Active Tenant' : 'Suspended'}
        </StatusBadge>
      </div>

      {/* Overview Cards */}
      <div style={businessDetailStyles.kpiGrid}>
        <StatCard title="REVENUE (YTD)" value={`RM ${(business.total_revenue_myr || 148200).toLocaleString()}`} accentColor="violet" />
        <StatCard title="ACTIVE WORKSTATIONS" value={business.workstations_count || 4} accentColor="green" />
        <StatCard title="REGISTERED USERS" value={business.active_users_count || 12} accentColor="blue" />
      </div>

      {/* Details Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Organization Metadata
        </h2>
        <div style={businessDetailStyles.metaGrid}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>OWNER EMAIL</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>{business.owner_email || 'owner@debbit.io'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>PHONE</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>{business.phone || '+60 12-345 6789'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>COUNTRY / CURRENCY</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '2px' }}>{business.country} / {business.currency}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>SUBSCRIPTION TIER</div>
            <div style={{ fontSize: '14px', color: 'var(--purple-main)', fontWeight: 700, marginTop: '2px' }}>{business.subscription_tier || 'Growth Plan'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
