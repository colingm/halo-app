/**
 * Halo Reports — Hand-rolled CSV export (Phase 4, plan 04-05 Task 1.D).
 *
 * Implements REP-04 + D-23 + UI-SPEC §"CSV Export Contract" lines 773-811.
 *
 * Format:
 *   - Header row: `Title,Status,Priority,Assignee,Due date,Completed at`
 *   - Status / Priority cells use display labels from `src/tasks/labels.ts`
 *     (e.g. "To do", "In progress", "Done", "Low" .. "Urgent").
 *   - Assignee cell: `task.assignee?.name ?? ''` (empty string in CSV, NOT '—').
 *   - Date cells: `YYYY-MM-DD` (machine-readable ISO date) or empty string.
 *     Visual table displays `MMM D, YYYY` — CSV deliberately differs. Both
 *     formats use UTC-anchored dayjs (04-REVIEW.md CR-01, 04-06-PLAN.md Task B)
 *     so the rendered/exported date matches the calendar day the user picked,
 *     regardless of browser timezone. `dueDate` is stored as UTC midnight;
 *     `completedAt` is the `*.toISOString()` instant at status→done.
 *   - Line separator: `\r\n` (RFC 4180 canonical).
 *   - Quoting: hand-rolled RFC 4180 — wrap a field in "..." when it contains
 *     `,`, `\n`, or `"`; escape internal `"` by doubling. No CSV library.
 *
 * Download sequence:
 *   1. `new Blob([csv], { type: 'text/csv;charset=utf-8' })`
 *   2. Create object URL via the Blob API → ephemeral `<a download>` click → remove
 *   3. Revoke the object URL to release the Blob handle
 *
 * Filename pattern includes a browser-local ISO date (YYYY-MM-DD).
 *
 * Pure utility module — no React, no Mantine. Safe to import from anywhere.
 */

import dayjs from 'dayjs'
import type { Task } from '../tasks/types'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../tasks/labels'

/**
 * RFC 4180 quoter: wrap `value` in `"..."` iff it contains a comma, newline, or
 * double-quote. Escape internal double-quotes by doubling. Empty values are NOT
 * quoted — the empty cell is unambiguous in a comma-separated row.
 */
function quote(value: string): string {
  if (value !== '' && /[,\n"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Serialize an array of `Task`s to a CSV string per UI-SPEC §"CSV Export
 * Contract" (lines 793-805). Exported for testing / advanced callers; the
 * common path is `exportTasksToCsv` below.
 */
export function toCsv(rows: Task[]): string {
  const headers = ['Title', 'Status', 'Priority', 'Assignee', 'Due date', 'Completed at']
  const lines = rows.map((t) =>
    [
      quote(t.title),
      quote(TASK_STATUS_LABELS[t.status]),
      quote(TASK_PRIORITY_LABELS[t.priority]),
      quote(t.assignee?.name ?? ''),
      t.dueDate ? dayjs(t.dueDate).utc().format('YYYY-MM-DD') : '',
      t.completedAt ? dayjs(t.completedAt).utc().format('YYYY-MM-DD') : '',
    ].join(','),
  )
  return [headers.join(','), ...lines].join('\r\n')
}

/**
 * Build a CSV from `tasks` and trigger a client-side download via Blob +
 * object-URL. Filename includes a browser-local ISO date. No-ops if `tasks` is
 * empty would still write a header-only file — callers should guard with
 * `disabled={tasks.length === 0}` on the trigger button per D-23 (UI-SPEC
 * line 700).
 */
export function exportTasksToCsv(tasks: Task[]): void {
  const csv = toCsv(tasks)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `halo-tasks-${dayjs().format('YYYY-MM-DD')}.csv`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
