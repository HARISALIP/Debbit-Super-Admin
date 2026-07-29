import React from 'react'

interface DebbitLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
  badgeText?: string
}

export default function DebbitLogo({
  size = 'md',
  showBadge = true,
  badgeText = 'SUPER ADMIN',
}: DebbitLogoProps) {
  const heights = { sm: '26px', md: '34px', lg: '42px' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img
        src="/debbit-logo.png"
        alt="debbit"
        style={{
          height: heights[size],
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />

      {showBadge && (
        <div
          style={{
            fontSize: '9px',
            color: 'var(--purple-main)',
            letterSpacing: '1.5px',
            fontWeight: 700,
          }}
        >
          {badgeText}
        </div>
      )}
    </div>
  )
}
