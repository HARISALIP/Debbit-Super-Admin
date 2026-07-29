import React from 'react'

export const dataTableStyles: Record<string, React.CSSProperties> = {
  headerText: {
    margin: 0,
  },
  actionsCell: {
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  paginationInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'nowrap',
  },
  pageSizeSelect: {
    width: '70px',
    padding: '2px 8px',
    fontSize: '12px',
    height: '30px',
    display: 'inline-block',
  },
}
