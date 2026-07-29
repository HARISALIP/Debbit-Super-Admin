import React from 'react'

export type BadgeVariant = 'green' | 'red' | 'amber' | 'purple' | 'cyan' | 'muted'

interface StatusBadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: string
}

export default function StatusBadge({
  variant = 'purple',
  children,
  icon,
}: StatusBadgeProps) {
  const badgeClasses: Record<BadgeVariant, string> = {
    green:  'badge badge-green',
    red:    'badge badge-red',
    amber:  'badge badge-amber',
    purple: 'badge badge-purple',
    cyan:   'badge badge-cyan',
    muted:  'badge badge-muted',
  }

  return (
    <span className={badgeClasses[variant]}>
      {icon && <span style={{ fontSize: '10px' }}>{icon}</span>}
      {children}
    </span>
  )
}
