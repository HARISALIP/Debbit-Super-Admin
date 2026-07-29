import { useState } from 'react'

export default function Dashboard() {
  const [filterPeriod, setFilterPeriod] = useState<'Today' | 'Week' | 'Month'>('Today')
  const [viewMode, setViewMode]         = useState<'Pulse' | 'Full'>('Pulse')

  return (
    <div className="fade-in">
      {/* ── Greeting & Date Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Good afternoon, Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Tuesday, 30 June 2026 · here's what matters right now.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '99px', padding: '4px', display: 'flex', gap: '2px' }}>
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

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '99px', padding: '4px', display: 'flex', gap: '2px' }}>
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

      {/* ── AI Prompt Box ("Tell debbit what happened...") ── */}
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

      {/* ── Today's Sales Card & Chart ── */}
      <div className="card" style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              TODAY'S SALES
            </div>
            <div style={{ fontSize: '38px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0', letterSpacing: '-1px' }}>
              RM 4,820
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-green">▲ 14%</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>vs last Tuesday</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              118 sales · avg basket RM 40.85
            </div>
          </div>

          {/* Trend Area Chart SVG */}
          <div style={{ width: '450px', height: '140px' }}>
            <svg viewBox="0 0 450 140" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--purple-main)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--purple-main)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 110 Q 75 90, 150 60 T 300 40 T 450 20 L 450 140 L 0 140 Z"
                fill="url(#salesGrad)"
              />
              <path
                d="M 0 110 Q 75 90, 150 60 T 300 40 T 450 20"
                fill="none"
                stroke="var(--purple-main)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="450" cy="20" r="5" fill="var(--purple-main)" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-Metric Grid with Top Accent Borders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {/* Gross Profit */}
        <div className="card card-accent-violet">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
            GROSS PROFIT
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>
            RM 1,640
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            34% margin
          </div>
        </div>

        {/* Money In */}
        <div className="card card-accent-green">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
            MONEY IN
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>
            RM 5,240
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            sales + receipts
          </div>
        </div>

        {/* Money Out */}
        <div className="card card-accent-red">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
            MONEY OUT
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>
            RM 2,890
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            stock + bills + wages
          </div>
        </div>

        {/* Cash In Hand */}
        <div className="card card-accent-blue">
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
            CASH IN HAND
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0' }}>
            RM 8,430
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            ~52 days runway
          </div>
        </div>
      </div>

      {/* ── AI Insights ("debbit says — what needs you right now") ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', color: 'var(--amber)' }}>✨</span>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            debbit says <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— what needs you right now</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Alert 1 */}
          <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Reorder Cooking Oil</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              9 left and you sell ~6 a day — you'll run dry by Thursday.
            </p>
          </div>

          {/* Alert 2 */}
          <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Best Tuesday this month</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              RM 4,820 today — 14% above last Tuesday. Cold drinks leading.
            </p>
          </div>

          {/* Alert 3 */}
          <div className="card" style={{ borderLeft: '4px solid var(--cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>💧</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Cash runway is healthy</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              52 days of cover at current spend. Nothing to worry about.
            </p>
          </div>
        </div>
      </div>

      {/* ── Floating Ask AI Button (Pulse Web Spec) ── */}
      <button className="floating-ai-btn">
        <span>✨</span> Ask debbit
      </button>
    </div>
  )
}
