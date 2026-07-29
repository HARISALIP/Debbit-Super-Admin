import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  subtitle: string
  icon: string
  badge?: string
  badgeColor?: string
}

const NAV: NavItem[] = [
  { to: '/',            label: 'Today',       subtitle: 'Platform at a glance', icon: '🏠' },
  { to: '/businesses',  label: 'Businesses',  subtitle: 'Tenant accounts',      icon: '🏢', badge: '12 active', badgeColor: 'badge-green' },
  { to: '/users',       label: 'Users',       subtitle: 'Registered accounts',   icon: '👥', badge: '34' },
  { to: '/telemetry',   label: 'Telemetry',   subtitle: 'Error & crash logs',    icon: '📡', badge: '2 new', badgeColor: 'badge-red' },
  { to: '/sync',        label: 'Sync Health', subtitle: 'Workstations & POS',   icon: '🔄' },
  { to: '/billing',     label: 'Billing',     subtitle: 'Subscriptions & MRR',  icon: '💳' },
]

export default function Sidebar() {
  return (
    <nav style={styles.sidebar}>
      <div style={styles.navArea}>
        <div style={styles.sectionLabel}>YOU RUN THE PLATFORM</div>

        {NAV.map(({ to, label, subtitle, icon, badge, badgeColor }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              background: isActive ? 'var(--purple-bg)' : 'transparent',
              color:      isActive ? 'var(--purple-main)' : 'var(--text-primary)',
              fontWeight: isActive ? 700 : 500,
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Bar on Far Left */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '-14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '24px',
                      borderRadius: '0 4px 4px 0',
                      background: 'var(--purple-main)',
                      boxShadow: 'var(--shadow-glow)',
                    }}
                  />
                )}

                <span style={styles.linkIcon}>{icon}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', lineHeight: 1.2 }}>{label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }} className="truncate">
                    {subtitle}
                  </div>
                </div>
                {badge && (
                  <span className={`badge ${badgeColor || 'badge-purple'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Promo Card (Matching Screenshot "debbit balances the books") */}
      <div style={styles.footer}>
        <div
          style={{
            background: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)',
            borderRadius: 'var(--r-md)',
            padding: '16px',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(107, 33, 168, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f472b6', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f4e8fb' }}>debbit balances the books</span>
          </div>
          <p style={{ fontSize: '11px', color: '#d8b4fe', lineHeight: 1.4 }}>
            Money, tax & ledger post themselves in the background automatically.
          </p>
        </div>
      </div>
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-w)',
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100%',
    overflow: 'hidden',
  },
  navArea: {
    flex: 1,
    padding: '24px 14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '4px 10px 10px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    borderRadius: 'var(--r-md)',
    textDecoration: 'none',
    transition: 'all 0.15s',
    cursor: 'pointer',
  },
  linkIcon: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
  },
}
