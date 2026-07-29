import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import StatCard from '../../components/molecules/StatCard'
import { dashboardStyles } from './Dashboard.styles'

interface SalesRow {
  sale_date: string
  total: number
}

interface SyncSummary {
  totalBusinesses: number
  activeWorkstations: number
  recentSales: number
  openTickets: number
}

interface DashboardPayload {
  ok?: boolean
  summary?: SyncSummary
  chart?: SalesRow[]
  todayRevenue?: number
}

function fmt(n: number) {
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const [filterPeriod, setFilterPeriod] = useState<'Today' | 'Week' | 'Month'>('Today')
  const [viewMode, setViewMode]         = useState<'Pulse' | 'Full'>('Pulse')
  const [salesChart, setSalesChart]     = useState<SalesRow[]>([])
  const [summary, setSummary]           = useState<SyncSummary | null>(null)
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke<DashboardPayload>('admin-dashboard', {
        body: { days: 7 },
      })

      if (!error && data?.ok) {
        setSalesChart((data.chart ?? []) as SalesRow[])
        setTodayRevenue(typeof data.todayRevenue === 'number' ? data.todayRevenue : 0)
        setSummary(
          data.summary
            ? {
                totalBusinesses: data.summary.totalBusinesses ?? 0,
                activeWorkstations: data.summary.activeWorkstations ?? 0,
                recentSales: data.summary.recentSales ?? 0,
                openTickets: data.summary.openTickets ?? 0,
              }
            : null
        )
        return
      }

      const days: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
      }
      const today = days[days.length - 1]

      const [bizRes, wsRes, salesRes, supportRes] = await Promise.all([
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('workstation_devices').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('sales')
          .select('sale_date, total')
          .eq('is_void', false)
          .gte('sale_date', days[0])
          .lte('sale_date', today),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ])

      const salesData = (salesRes.data ?? []) as SalesRow[]
      const totals: Record<string, number> = {}
      days.forEach(d => { totals[d] = 0 })
      salesData.forEach(r => { totals[r.sale_date] = (totals[r.sale_date] || 0) + (r.total || 0) })
      setSalesChart(days.map(d => ({ sale_date: d, total: totals[d] })))
      setTodayRevenue(totals[today] ?? 0)

      setSummary({
        totalBusinesses:    bizRes.count ?? 0,
        activeWorkstations: wsRes.count ?? 0,
        recentSales:        salesData.reduce((s, r) => s + (r.total || 0), 0),
        openTickets:        supportRes.count ?? 0,
      })
    } catch (e) {
      console.error('Dashboard load error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // SVG sparkline
  const maxSale = Math.max(...salesChart.map(r => r.total), 1)
  const W = 450, H = 120
  const pts = salesChart.map((r, i) => {
    const x = (i / (salesChart.length - 1)) * W
    const y = H - (r.total / maxSale) * (H - 20)
    return `${x},${y}`
  }).join(' ')
  const areaPath = salesChart.length > 1
    ? `M ${salesChart.map((r, i) => {
        const x = (i / (salesChart.length - 1)) * W
        const y = H - (r.total / maxSale) * (H - 20)
        return `${x} ${y}`
      }).join(' L ')} L ${W} ${H} L 0 ${H} Z`
    : ''
  const linePath = salesChart.length > 1
    ? `M ${pts.split(' ').map((p, i) => (i === 0 ? p : p)).join(' L ')}`
    : ''

  return (
    <div className="fade-in">
      {/* Greeting Header */}
      <div style={dashboardStyles.headerRow}>
        <div>
          <h1 style={dashboardStyles.title}>
            {loading ? 'Loading…' : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Admin`}
          </h1>
          <p style={dashboardStyles.subtitle}>
            {new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · here&apos;s what matters right now.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={dashboardStyles.filterGroup}>
            {(['Today', 'Week', 'Month'] as const).map(p => (
              <button
                key={p}
                className="btn btn-sm"
                style={{
                  borderRadius: '99px',
                  background: filterPeriod === p ? 'var(--purple-main)' : 'transparent',
                  color: filterPeriod === p ? '#fff' : 'var(--text-secondary)',
                  padding: '4px 14px',
                }}
                onClick={() => setFilterPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={dashboardStyles.filterGroup}>
            {(['Pulse', 'Full'] as const).map(v => (
              <button
                key={v}
                className="btn btn-sm"
                style={{
                  borderRadius: '99px',
                  background: viewMode === v ? 'var(--purple-main)' : 'transparent',
                  color: viewMode === v ? '#fff' : 'var(--text-secondary)',
                  padding: '4px 14px',
                }}
                onClick={() => setViewMode(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Prompt Box */}
      <div className="ai-prompt-box">
        <span style={{ fontSize: '20px', color: 'var(--purple-main)' }}>✨</span>
        <input
          className="ai-prompt-input"
          placeholder="Tell debbit what happened, or ask anything..."
        />
        <button className="btn btn-primary" style={{ borderRadius: '99px', padding: '8px 20px' }}>
          Ask
        </button>
      </div>

      {/* Today's Sales Card */}
      <div className="card" style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={dashboardStyles.salesHeader}>
          <div>
            <div style={dashboardStyles.salesLabel}>TODAY&apos;S SALES</div>
            <div style={dashboardStyles.salesValue}>
              {todayRevenue !== null ? `RM ${fmt(todayRevenue)}` : 'Loading…'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {loading ? '…' : `Last 7 days total: RM ${fmt(summary?.recentSales ?? 0)}`}
            </div>
          </div>

          {/* SVG Sparkline */}
          <div style={{ width: '450px', height: '140px' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--purple-main)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--purple-main)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#salesGrad)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--purple-main)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {salesChart.length > 0 && (
                <circle
                  cx={(salesChart.length - 1) / (salesChart.length - 1) * W}
                  cy={H - (salesChart[salesChart.length - 1].total / maxSale) * (H - 20)}
                  r="5"
                  fill="var(--purple-main)"
                />
              )}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Metric KPI Grid */}
      <div style={dashboardStyles.kpiGrid}>
        <StatCard
          title="REGISTERED BUSINESSES"
          value={loading ? '…' : String(summary?.totalBusinesses ?? 0)}
          subtext="across all tenants"
          accentColor="violet"
        />
        <StatCard
          title="ACTIVE WORKSTATIONS"
          value={loading ? '…' : String(summary?.activeWorkstations ?? 0)}
          subtext="POS terminals online"
          accentColor="green"
        />
        <StatCard
          title="7-DAY REVENUE"
          value={loading ? '…' : `RM ${fmt(summary?.recentSales ?? 0)}`}
          subtext="across all businesses"
          accentColor="blue"
        />
        <StatCard
          title="OPEN SUPPORT TICKETS"
          value={loading ? '…' : String(summary?.openTickets ?? 0)}
          subtext="pending resolution"
          accentColor={summary?.openTickets ? 'red' : 'green'}
        />
      </div>

      {/* Platform Status Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', color: 'var(--amber)' }}>✨</span>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            debbit says <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— platform health overview</span>
          </h2>
        </div>

        <div style={dashboardStyles.insightsGrid}>
          <div className="card" style={{ borderLeft: '4px solid var(--purple-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏢</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {summary?.totalBusinesses ?? '—'} businesses registered
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Total merchant organizations onboarded across all regions.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🖥️</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {summary?.activeWorkstations ?? '—'} active POS terminals
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Workstation devices currently registered and active.
            </p>
          </div>

          <div className="card" style={{ borderLeft: (summary?.openTickets ?? 0) > 0 ? '4px solid var(--amber)' : '4px solid var(--cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>{(summary?.openTickets ?? 0) > 0 ? '🎫' : '✅'}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {summary?.openTickets ?? '—'} open support tickets
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {(summary?.openTickets ?? 0) > 0
                ? 'Some tickets need attention. Review in support tab.'
                : 'All support tickets resolved — platform is healthy.'}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Ask AI Button */}
      <button className="floating-ai-btn" onClick={() => void load()}>
        <span>🔄</span> Refresh data
      </button>
    </div>
  )
}
