import type { ProCustomer, ProShopRow, ProSubscription } from '../types'
import { paidState } from './pro'

export type Attention = { level: 'red' | 'amber'; area: 'Paid' | 'Use' | 'Health' | 'Support' | 'AI' | 'Setup'; text: string }

const daysSince = (iso: string | null | undefined, now: number) => (iso ? (now - new Date(iso).getTime()) / 86400000 : null)

/**
 * What needs debbit's attention for one Pro shop, worst first. Built only from the read-only feed and Super Admin's own records:
 * nothing here asks or changes the shop. Thresholds are deliberately simple and visible here.
 */
export function attentionFor(row: ProShopRow, sub?: ProSubscription | null, card?: ProCustomer | null, now = Date.now()): Attention[] {
  const out: Attention[] = []
  const stage = card?.stage
  const watching = stage !== 'left' && stage !== 'paused'
  if (sub !== undefined) {
    const p = paidState(sub)
    if (p.rank === 0) out.push({ level: 'red', area: 'Paid', text: p.label })
    else if (p.rank === 2) out.push({ level: 'amber', area: 'Paid', text: p.label })
    else if (p.rank === 1 && watching) out.push({ level: 'amber', area: 'Paid', text: 'No plan or paid-until date set' })
  }
  const f = row.figures
  if (!f) { out.push({ level: 'red', area: 'Health', text: row.problem === 'no_reader' ? 'No admin reader on this site yet' : row.problem === 'reader_refused' ? 'The site refused the admin reader' : 'Site not reachable' }); return sort(out) }
  const h = f.health
  if (!h.scheduler_on) out.push({ level: 'red', area: 'Health', text: 'Scheduler is off: automatic jobs and emails stop' })
  const backup = daysSince(h.last_backup_at, now)
  if (backup === null) out.push({ level: 'red', area: 'Health', text: 'No backup found' })
  else if (backup > 2) out.push({ level: 'red', area: 'Health', text: `Last backup ${Math.floor(backup)} days ago` })
  if ((h.disk_used_percent ?? 0) >= 90) out.push({ level: 'red', area: 'Health', text: `Disk ${h.disk_used_percent}% full` })
  else if ((h.disk_used_percent ?? 0) >= 85) out.push({ level: 'amber', area: 'Health', text: `Disk ${h.disk_used_percent}% full` })
  if ((f.problems_7_days?.errors ?? 0) >= 20) out.push({ level: 'amber', area: 'Health', text: `${f.problems_7_days!.errors} errors logged this week` })
  if ((f.problems_7_days?.failed_emails ?? 0) > 0) out.push({ level: 'amber', area: 'Health', text: `${f.problems_7_days!.failed_emails} emails failed to send this week` })
  if (f.support?.waiting_for_debbit) out.push({ level: 'red', area: 'Support', text: `${f.support.waiting_for_debbit} support request${f.support.waiting_for_debbit === 1 ? '' : 's'} waiting for debbit` })
  if (watching && row.status === 'active') {
    const lastSale = daysSince(f.activity.last_sale_date, now)
    if (lastSale === null) out.push({ level: 'amber', area: 'Use', text: 'No sale recorded yet' })
    else if (lastSale > 7) out.push({ level: 'amber', area: 'Use', text: `No sale for ${Math.floor(lastSale)} days` })
    if (f.people.enabled > 0 && f.people.signed_in_last_7_days === 0) out.push({ level: 'amber', area: 'Use', text: 'Nobody signed in this week' })
    const o = f.setup?.opening
    if (o && !o.account_balances && !o.customer_balances && !o.supplier_balances && !o.opening_stock) out.push({ level: 'amber', area: 'Setup', text: 'No opening balances entered' })
  }
  if (f.ai_rules?.paused) out.push({ level: 'amber', area: 'AI', text: 'AI is paused by the owner' })
  if (row.gateway?.ai && card && card.ai_consent !== 'agreed') out.push({ level: 'red', area: 'AI', text: 'AI is on but the owner\'s consent is not recorded' })
  return sort(out)
}

const sort = (a: Attention[]) => a.sort((x, y) => (x.level === y.level ? 0 : x.level === 'red' ? -1 : 1))
