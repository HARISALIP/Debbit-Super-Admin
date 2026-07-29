import React, { useState } from 'react'
import StatCard from '../../components/molecules/StatCard'
import { dashboardStyles } from './Dashboard.styles'

export default function Dashboard() {
  const [filterPeriod, setFilterPeriod] = useState<'Today' | 'Week' | 'Month'>('Today')
  const [viewMode, setViewMode]         = useState<'Pulse' | 'Full'>('Pulse')

  return (
    <div className="fade-in">
      {/* Greeting Header */}
      <div style={dashboardStyles.headerRow}>
        <div>
          <h1 style={dashboardStyles.title}>Good afternoon, Admin</h1>
          <p style={dashboardStyles.subtitle}>
            Tuesday, 30 June 2026 · here's what matters right now.
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
            <div style={dashboardStyles.salesLabel}>TODAY'S SALES</div>
            <div style={dashboardStyles.salesValue}>RM 4,820</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-green">▲ 14%</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>vs last Tuesday</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              118 sales · avg basket RM 40.85
            </div>
          </div>

          {/* SVG Trend Chart */}
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

      {/* 4-Metric KPI Grid */}
      <div style={dashboardStyles.kpiGrid}>
        <StatCard title="GROSS PROFIT" value="RM 1,640" subtext="34% margin" accentColor="violet" />
        <StatCard title="MONEY IN" value="RM 5,240" subtext="sales + receipts" accentColor="green" />
        <StatCard title="MONEY OUT" value="RM 2,890" subtext="stock + bills + wages" accentColor="red" />
        <StatCard title="CASH IN HAND" value="RM 8,430" subtext="~52 days runway" accentColor="blue" />
      </div>

      {/* AI Insights ("debbit says") */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', color: 'var(--amber)' }}>✨</span>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            debbit says <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— what needs you right now</span>
          </h2>
        </div>

        <div style={dashboardStyles.insightsGrid}>
          <div className="card" style={{ borderLeft: '4px solid var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Reorder Cooking Oil</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              9 left and you sell ~6 a day — you'll run dry by Thursday.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Best Tuesday this month</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              RM 4,820 today — 14% above last Tuesday. Cold drinks leading.
            </p>
          </div>

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

      {/* Floating Ask AI Button */}
      <button className="floating-ai-btn">
        <span>✨</span> Ask debbit
      </button>
    </div>
  )
}
