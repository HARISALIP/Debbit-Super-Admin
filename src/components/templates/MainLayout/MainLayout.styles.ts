import React from 'react'

export const mainLayoutStyles: Record<string, React.CSSProperties> = {
  appShell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  appMain: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
}
