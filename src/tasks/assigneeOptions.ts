/**
 * Halo assignee-options helper (Phase 5 D-04 swap).
 *
 * Derives the list of selectable assignees for the Lists task modal's Assignee
 * Select and the Lists / Reports Assignee filter Selects. Data source is now
 * `listTeammates(workspaceId)` (D-04) — the teammate registry is the canonical
 * source of workspace members, replacing the previous derivation from task
 * assignee snapshots. Consumers (Lists filter, TaskFormModal Assignee, Reports
 * Assignee filter) are unchanged — function signature is identical.
 *
 * The current visitor is always included — the visitor entry overwrites any
 * teammate-table row with the same id so the displayed name reflects the
 * up-to-date profile.
 *
 * Callers that need an "All" entry (the Lists/Reports filter selects)
 * prepend `{ value: 'all', label: 'All' }` themselves — this helper returns
 * only real assignees.
 */

import { listTeammates } from '../team/teamsRepo'
import type { Assignee } from './types'
import type { Visitor } from '../auth/types'

/**
 * Returns the assignee options for `workspaceId` as `{ value, label }` pairs
 * suitable for direct use in a Mantine `<Select data={...} />`. Sorted by
 * `name` ascending (case-insensitive locale compare); deduped by Assignee.id.
 * The current visitor is always included — the visitor entry overwrites any
 * prior teammate-assignee with the same id so the displayed name reflects the
 * up-to-date profile.
 */
export function getAssigneeOptions(
  workspaceId: string,
  visitor: Visitor,
): Array<{ value: string; label: string }> {
  const byId = new Map<string, Assignee>()
  for (const t of listTeammates(workspaceId)) {
    byId.set(t.id, {
      id: t.id,
      name: `${t.firstName} ${t.lastName}`.trim(),
      ...(t.avatar ? { avatar: t.avatar } : {}),
    })
  }
  byId.set(visitor.id, {
    id: visitor.id,
    name: `${visitor.firstName} ${visitor.lastName}`,
  })
  return [...byId.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: a.name }))
}
