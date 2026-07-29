import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import DebbitLogo from './DebbitLogo'

export default function TopHeader() {
  const { session } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const email    = session?.user?.email ?? 'admin@debbit.io'
  const name     = email.split('@')[0]
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="top-bar">
      {/* Left Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <DebbitLogo size="sm" showBadge={false} />
      </div>

      {/* Center Command Search Bar (⌘K) */}
      <div className="search-box">
        <span>🔍</span>
        <input
          className="search-input"
          placeholder="Search anything — or jump to any tool..."
        />
        <span
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right Controls (Theme Toggle + Mode Badge + User Avatar) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Theme Toggle Moon/Sun */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, justifyContent: 'center' }}
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* VIEWING AS Role Dropdown Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <span>VIEWING AS</span>
          <div
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-base)',
              padding: '6px 14px',
              borderRadius: '99px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            Super Admin - God mode ▾
          </div>
        </div>

        {/* User Avatar & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>debbit OS</div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--purple-bg)',
              color: 'var(--purple-main)',
              border: '1px solid var(--purple-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
