import React from 'react'
import StatusBadge, { BadgeVariant } from '../atoms/StatusBadge'

interface StatCardProps {
  title: string
  value: string | number
  subtext?: string
  trend?: {
    value: string
    isUp?: boolean
  }
  badgeVariant?: BadgeVariant
  accentColor?: 'violet' | 'green' | 'red' | 'blue'
  icon?: string
}

export default function StatCard({
  title,
  value,
  subtext,
  trend,
  badgeVariant = 'green',
  accentColor = 'violet',
  icon,
}: StatCardProps) {
  const accentClass = `card card-accent-${accentColor}`

  return (
    <div className={accentClass}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          {title}
        </div>
        {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      </div>

      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {trend && (
          <StatusBadge variant={badgeVariant}>
            {trend.isUp ? '▲' : '▼'} {trend.value}
          </StatusBadge>
        )}
        {subtext && (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  )
}
