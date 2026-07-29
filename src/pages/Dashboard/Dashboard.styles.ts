import React from 'react'

export const dashboardStyles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    marginTop: '4px',
  },
  filterGroup: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '99px',
    padding: '4px',
    display: 'flex',
    gap: '2px',
  },
  salesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  salesLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  salesValue: {
    fontSize: '38px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '4px 0',
    letterSpacing: '-1px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
}
