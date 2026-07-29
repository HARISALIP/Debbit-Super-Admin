type Variant = 'green' | 'red' | 'amber' | 'violet' | 'cyan' | 'muted'

interface StatusBadgeProps {
  variant: Variant
  children: React.ReactNode
  dot?: boolean
}

export default function StatusBadge({ variant, children, dot = true }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'currentColor', display: 'inline-block', flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge variant={active ? 'green' : 'red'}>
      {active ? 'Active' : 'Inactive'}
    </StatusBadge>
  )
}

export function SeverityBadge({ severity }: { severity: string | null }) {
  const map: Record<string, Variant> = {
    ERROR: 'red',
    WARN:  'amber',
    INFO:  'cyan',
  }
  const v = severity ? (map[severity] ?? 'muted') : 'muted'
  return <StatusBadge variant={v}>{severity ?? '—'}</StatusBadge>
}
