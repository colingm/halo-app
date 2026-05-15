/**
 * Halo demo-data "now" anchor (D-22).
 *
 * Anchors "now" to the most recent task activity (createdAt / updatedAt /
 * completedAt) so the demo never goes stale even if the seed/clock falls
 * behind. Falls back to `new Date()` when the tasks array is empty.
 *
 * Originally inlined in `src/dashboard/Dashboard.tsx`; extracted in plan 04-02
 * so both the Dashboard (Phase 3) and the new ReportsPage (Phase 4) share a
 * single source of truth. Pure function, no I/O — same shape as
 * `src/dashboard/relative-time.ts`.
 *
 * D-22 lock — DO NOT inline a parallel computeNowRef in any consumer; import
 * from this module so the demo-non-staleness contract stays consistent across
 * surfaces.
 */

import type { Task } from './types'

/**
 * Returns max(task.createdAt, task.updatedAt, task.completedAt) across all
 * tasks as a Date. Defaults to `new Date()` when `tasks` is empty.
 *
 * @param tasks - The task list to anchor against.
 * @returns The "now" reference Date.
 */
export function computeNowRef(tasks: Task[]): Date {
  if (tasks.length === 0) return new Date()

  let maxMs = 0
  for (const task of tasks) {
    const candidates = [
      new Date(task.createdAt).getTime(),
      new Date(task.updatedAt).getTime(),
    ]
    if (task.completedAt !== null) {
      candidates.push(new Date(task.completedAt).getTime())
    }
    for (const ms of candidates) {
      if (!isNaN(ms) && ms > maxMs) maxMs = ms
    }
  }
  return new Date(maxMs)
}
