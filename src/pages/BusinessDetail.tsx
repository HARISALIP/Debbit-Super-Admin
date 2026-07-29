import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ActiveBadge } from '../components/StatusBadge'
import type { Business, BusinessMember } from '../lib/types'

interface BusinessStats {
  salesCount: number
  productCount: number
  customerCount: number
  memberCount: number
}

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>()
  const [biz, setBiz]         = useState<Business | null>(null)
  const [members, setMembers] = useState<BusinessMember[]>([])
  const [bstats, setBstats]   = useState<BusinessStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) void load(id)
  }, [id])

  async function load(bizId: string) {
    setLoading(true)
    const [{ data: bizData }, { data: memberData }] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', bizId).single(),
      supabase.from('business_members')
        .select('*, users(email, full_name)')
        .eq('business_id', bizId)
        .order('joined_at', { ascending: false }),
    ])

    const [{ count: sales }, { count: products }, { count: customers }] = await Promise.all([
      supabase.from('sales').select('*', { count: 'exact', head: true }).eq('business_id', bizId),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', bizId),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', bizId),
    ])

    setBiz(bizData as Business)
    setMembers((memberData ?? []) as BusinessMember[])
    setBstats({
      salesCount:   sales ?? 0,
      productCount: products ?? 0,
      customerCount:customers ?? 0,
      memberCount:  memberData?.length ?? 0,
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="loading-state" style={{ height: '60vh' }}><div className="spinner" /><p>Loading business…</p></div>
  }

  if (!biz) {
    return (
      <div className="fade-in">
        <div className="alert alert-error">Business not found.</div>
        <Link to="/businesses" className="btn btn-ghost">← Back</Link>
      </div>
    )
  }

  const fields: [string, string | null | undefined][] = [
    ['ID',              biz.id],
    ['Legal Name',      biz.legal_name],
    ['Registration No', biz.registration_no],
    ['Tax ID',          biz.tax_id],
    ['Country',         biz.country],
    ['Currency',        biz.currency],
    ['Business Type',   biz.business_type],
    ['City',            biz.city],
    ['Phone',           biz.phone],
    ['Email',           biz.email],
    ['Created',         new Date(biz.created_at).toLocaleString()],
    ['Updated',         new Date(biz.updated_at).toLocaleString()],
  ]

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <Link to="/businesses" className="btn btn-ghost btn-sm">← Back</Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
            {biz.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>Business Detail</p>
        </div>
        <ActiveBadge active={biz.is_active} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Sales',     value: bstats?.salesCount ?? 0,    icon: '🧾' },
          { label: 'Products',  value: bstats?.productCount ?? 0,  icon: '📦' },
          { label: 'Customers', value: bstats?.customerCount ?? 0, icon: '🧑‍💼' },
          { label: 'Members',   value: bstats?.memberCount ?? 0,   icon: '👥' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--violet-light)' }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Info */}
        <div className="card">
          <p className="section-title">Business Info</p>
          <table style={{ width: '100%' }}>
            <tbody>
              {fields.map(([label, val]) => (
                <tr key={label}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '6px 0', width: '140px', fontWeight: 600 }}>{label}</td>
                  <td style={{ color: 'var(--text-primary)', fontSize: label === 'ID' ? '11px' : '13px', padding: '6px 0', fontFamily: label === 'ID' ? 'monospace' : undefined }}>
                    {val ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Members */}
        <div className="card">
          <p className="section-title">Team Members</p>
          {members.length === 0 && <p className="text-muted text-sm">No members found.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.users?.full_name ?? '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.users?.email ?? '—'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-violet">{m.role}</span>
                  <ActiveBadge active={m.is_active} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
