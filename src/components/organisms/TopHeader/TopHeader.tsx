import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import DebbitLogo from '../../atoms/DebbitLogo'
import { topHeaderStyles } from './TopHeader.styles'

export default function TopHeader() {
  const { session, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const email    = session?.user?.email ?? 'admin@debbit.io'
  const name     = email.split('@')[0]
  const initials = email.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await signOut()
    setShowDropdown(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

        {/* User Avatar & Name with Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer', ...topHeaderStyles.userProfile }}
          >
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

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '8px',
              background: theme === 'dark' ? '#1f2937' : '#ffffff',
              border: theme === 'dark' ? '#374151' : '#e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              minWidth: '240px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              zIndex: 1000,
            }}>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#f9fafb' : '#111827', marginBottom: '4px' }}>
                  {session?.user?.user_metadata?.full_name || name}
                </div>
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  {email}
                </div>
                <div style={{ fontSize: '11px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>
                  Super Admin
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
