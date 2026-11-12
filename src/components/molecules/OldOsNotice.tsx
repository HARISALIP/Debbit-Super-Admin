import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Businesses, Users, Telemetry, Sync health and Billing belong to the older debbit OS app. Their Edge Functions and tables live in
// that app's own Supabase project (debbit-os), not in Super Admin's, so here they would only show an Edge Function error.
// Set VITE_OLD_OS_FUNCTIONS=on (with those functions deployed to this project) to bring the pages back as they were.
export const oldOsConnected = import.meta.env.VITE_OLD_OS_FUNCTIONS === 'on'

export default function OldOsOnly({ title, children }: { title: string; children: ReactNode }) {
  if (oldOsConnected) return <>{children}</>
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>{title}</h1>
      <div className="card" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 640, borderLeft: '4px solid var(--amber, #d97706)' }}>
        <p style={{ margin: 0 }}>This page is for the older debbit OS app, which keeps its data in a different place. It is not connected to this Super Admin.</p>
        <p style={{ margin: '8px 0 0' }}>
          Your debbit Pro customers, their figures, notes and payments are under <Link to="/pro">Pro shops</Link>.
        </p>
      </div>
    </div>
  )
}
