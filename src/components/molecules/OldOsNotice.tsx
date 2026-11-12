import { ReactNode } from 'react'

// Businesses, Users, Telemetry, Sync health and Billing first served the older debbit OS app, whose Edge Functions and tables live in
// that app's own Supabase project (debbit-os), not in Super Admin's. Here they show debbit Pro instead (pages/ProViews), read through
// the same read-only Pro feed as Pro shops. Set VITE_OLD_OS_FUNCTIONS=on (with those functions deployed) to bring the old pages back.
export const oldOsConnected = import.meta.env.VITE_OLD_OS_FUNCTIONS === 'on'

export default function OldOsOr({ pro, children }: { pro: ReactNode; children: ReactNode }) {
  return <>{oldOsConnected ? children : pro}</>
}
