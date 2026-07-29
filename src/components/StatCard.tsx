import React from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  color?: 'violet' | 'cyan' | 'green' | 'amber' | 'red'
  trend?: number   // % change, positive = up, negative = down
  suffix?: string
}

const COLOR_MAP: Record<string, { bg: string; color: string; glow: string }> = {
  violet: { bg: 'var(--violet-dim)',  color: 'var(--violet-light)', glow: 'var(--shadow-glow-v)' },
  cyan:   { bg: 'var(--cyan-dim)',    color: 'var(--cyan)',         glow: 'var(--shadow-glow-c)' },
  green:  { bg: 'var(--green-dim)',   color: 'var(--green)',        glow: '0 0 20px rgba(16,185,129,0.2)' },
  amber:  { bg: 'var(--amber-dim)',   color: 'var(--amber)',        glow: '0 0 20px rgba(245,158,11,0.2)' },
  red:    { bg: 'var(--red-dim)',     color: 'var(--red)',          glow: '0 0 20px rgba(239,68,68,0.2)' },
}

export default function StatCard({
  label, value, icon, color = 'violet', trend, suffix = ''
}: StatCardProps) {
  const palette = COLOR_MAP[color]

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow orb */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: palette.bg, filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          background: palette.bg, color: palette.color,
          width: '40px', height: '40px', borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: trend >= 0 ? 'var(--green)' : 'var(--red)',
            background: trend >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
            padding: '2px 7px', borderRadius: '99px',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-primary)', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}
