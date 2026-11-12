import { ProAiWork } from '../types'

// Plain names for debbit's AI team and what happened to its work (AI audit log outcomes and task states).
export const WORKER_TEXT: Record<string, string> = {
  'ai:assistant': 'Ask debbit', 'ai:collections': 'Collections', 'ai:bank': 'Bank matching',
  'ai:reader': 'Bill reader', 'ai:bookkeeper': 'Bookkeeper', 'ai:purchasing': 'Purchasing',
}
export const OUTCOME_COLUMNS: { key: string; label: string; hint: string }[] = [
  { key: 'allowed', label: 'Allowed', hint: 'reads and drafts the rules allowed' },
  { key: 'approval_required', label: 'Sent for approval', hint: 'prepared work a person must approve' },
  { key: 'approved', label: 'Approved', hint: 'approved by a person' },
  { key: 'executed', label: 'Done', hint: 'carried out in ERPNext after approval' },
  { key: 'denied', label: 'Blocked', hint: 'stopped by the rules' },
  { key: 'failed', label: 'Failed', hint: 'tried and failed' },
]
export const JOB_STATUS_TEXT: Record<string, string> = {
  queued: 'Queued', running: 'Running', held: 'Held', waiting: 'Waiting', waiting_approval: 'Waiting for approval',
  done: 'Done', handed_over: 'Handed to a person', failed: 'Failed', stopped: 'Stopped',
}

/** Adds several shops' AI work together (for the all-shops Usage page). */
export function addWork(list: (ProAiWork | null | undefined)[]): ProAiWork | null {
  const seen = list.filter((w): w is ProAiWork => !!w)
  if (!seen.length) return null
  const out: ProAiWork = { month: seen[0].month, workers: {}, last_action_at: null, jobs: {}, waiting_approval: 0, approvals: { given: 0, used: 0 } }
  for (const w of seen) {
    for (const [actor, outcomes] of Object.entries(w.workers)) {
      const into = (out.workers[actor] ??= {})
      for (const [k, n] of Object.entries(outcomes)) into[k] = (into[k] ?? 0) + n
    }
    for (const [job, j] of Object.entries(w.jobs)) {
      const into = (out.jobs[job] ??= { statuses: {}, cost_usd: 0, steps: 0 })
      for (const [k, n] of Object.entries(j.statuses)) into.statuses[k] = (into.statuses[k] ?? 0) + n
      into.cost_usd += j.cost_usd; into.steps += j.steps
    }
    out.waiting_approval += w.waiting_approval
    out.approvals.given += w.approvals.given; out.approvals.used += w.approvals.used
    if (w.last_action_at && (!out.last_action_at || w.last_action_at > out.last_action_at)) out.last_action_at = w.last_action_at
  }
  return out
}
