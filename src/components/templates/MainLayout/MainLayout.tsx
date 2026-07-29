import React, { ReactNode } from 'react'
import TopHeader from '../../organisms/TopHeader/TopHeader'
import Sidebar from '../../organisms/Sidebar/Sidebar'
import { mainLayoutStyles } from './MainLayout.styles'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div style={mainLayoutStyles.appShell}>
      <TopHeader />
      <div style={mainLayoutStyles.appMain}>
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
