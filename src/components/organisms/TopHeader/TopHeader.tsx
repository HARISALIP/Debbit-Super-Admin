import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import DebbitLogo from '../../atoms/DebbitLogo'
import { topHeaderStyles } from './TopHeader.styles'

export default function TopHeader() {
  const { session } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const email    = session?.user?.email ?? 'admin@debbit.io'
  const name     = email.split('@')[0]
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="top-bar">
      {/* Left Logo */}
      <div style={topHeaderStyles.logoContainer}>
        <DebbitLogo size="sm" showBadge={false} />
      </div>

      {/* Center Command Search Bar (⌘K) */}
      <div className="search-box">
        <span>🔍</span>
        <input
          className="search-input"
          placeholder="Search anything — or jump to any tool..."
        />
        <span style={topHeaderStyles.searchShortcut}>
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div style={topHeaderStyles.controlsRow}>
        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-sm"
          style={topHeaderStyles.themeBtn}
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* VIEWING AS Role Dropdown Pill */}
        <div style={topHeaderStyles.roleWrapper}>
          <span>VIEWING AS</span>
          <div style={topHeaderStyles.roleBadge}>
            Super Admin - God mode ▾
          </div>
        </div>

        {/* User Avatar & Name */}
        <div style={topHeaderStyles.userProfile}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>debbit OS</div>
          </div>
          <div style={topHeaderStyles.userAvatar}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
