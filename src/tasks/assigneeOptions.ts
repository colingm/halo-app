/**
 * Halo assignee-options helper (D-10).
 *
 * Derives the list of selectable assignees for the Lists task modal's Assignee
 * Select and the Lists / Reports Assignee filter Selects. The set is scanned
 * from the current workspace's tasks (dedupe by Assignee.id) PLUS the current
 * visitor — so a user can assign tasks to themselves even before any tasks are
 * seeded.
 *
 * Forward-compatible: Phase 5 TEAM-01 introduces a canonical
 * `K.teammates(workspaceId)` store; that plan can swap this helper's data
 * source from "distinct from tasks" to `listTeammates(workspaceId)` without
 * changing the function signature or any caller.
 *
 * Callers that need an "All" entry (the Lists/Reports filter selects)
 * prepend `{ value: 'all', label: 'All' }` themselves — this helper returns
 * only real assignees.
 */

import { listTasks } from './tasksRepo'
import type { Assignee } from './types'
import type { Visitor } from '../auth/types'

/**
 * Returns the assignee options for `workspaceId` as `{ value, label }` pairs
 * suitable for direct use in a Mantine `<Select data={...} />`. Sorted by
 * `name` ascending (case-insensitive locale compare); deduped by Assignee.id.
 * The current visitor is always included — the visitor entry overwrites any
 * prior task-assignee with the same id so the displayed name reflects the
 * up-to-date profile.
 */
export function getAssigneeOptions(
  workspaceId: string,
  visitor: Visitor,
): Array<{ value: string; label: string }> {
  const byId = new Map<string, Assignee>()
  for (const task of listTasks(workspaceId)) {
    byId.set(task.assignee.id, task.assignee)
  }
  byId.set(visitor.id, {
    id: visitor.id,
    name: `${visitor.firstName} ${visitor.lastName}`,
  })
  return [...byId.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ value: a.id, label: a.name }))
}
