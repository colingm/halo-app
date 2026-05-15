/**
 * Halo tasks repo (Phase 3 — owner of K.tasks(workspaceId)).
 *
 * CRUD over the `halo:v1:tasks:{workspaceId}` localStorage array. Every read
 * goes through `readWithSchema` so a corrupt or tampered value falls through
 * to `[]` rather than crashing the app (FND-04). No direct localStorage calls
 * — the storage codec is the only sanctioned accessor.
 *
 * Contract notes:
 *   - Phase 3 only CALLS `listTasks` (for the Dashboard). The other methods
 *     are stubbed/exported now so Phase 4 doesn't have to extend the repo
 *     signature.
 *   - `createTask` accepts a `partial` (no id/createdAt/updatedAt) and the
 *     repo fills `id` (nanoid), `createdAt`, `updatedAt = createdAt`.
 *   - Non-atomic read-modify-write — same WR-04 caveat as authRepo. Two
 *     concurrent tabs can drop a task; acceptable for a demo surface.
 */

import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { TasksArraySchema } from './schemas'
import type { Task } from './types'

// ---------------------------------------------------------------------------
// Input shape — explicit so TypeScript catches accidental field omissions
// ---------------------------------------------------------------------------

/** Input to `createTask`. The repo fills `id`, `createdAt`, and `updatedAt`. */
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/** Return all persisted tasks for `workspaceId`. Falls through to `[]` on corrupt / schema-invalid storage. */
export function listTasks(workspaceId: string): Task[] {
  return readWithSchema(K.tasks(workspaceId), TasksArraySchema, [] as Task[])
}

/** Strict-equality lookup by task id. Returns `undefined` if no match. */
export function getTaskById(workspaceId: string, id: string): Task | undefined {
  return listTasks(workspaceId).find((t) => t.id === id)
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Persist a new `Task` record to `K.tasks(workspaceId)`. Returns the newly-created `Task`.
 * The repo fills `id` (nanoid), `createdAt`, and `updatedAt` automatically.
 *
 * D-09 invariant (symmetry with `updateTask`): if `input.status === 'done'` and the
 * caller did not supply a `completedAt`, the repo stamps `completedAt` with `now`.
 * UI code creating a task in the "done" state never has to think about the timestamp.
 */
export function createTask(workspaceId: string, input: CreateTaskInput): Task {
  const now = new Date().toISOString()
  const stamped: CreateTaskInput =
    input.status === 'done' && input.completedAt == null
      ? { ...input, completedAt: now }
      : input
  const task: Task = {
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
    ...stamped,
  }
  const existing = listTasks(workspaceId)
  writeJSON(K.tasks(workspaceId), [...existing, task])
  return task
}

/**
 * Apply `patch` to an existing task by id. Returns the updated `Task`, or
 * `undefined` if no task with the given id exists.
 *
 * D-09 invariant — `completedAt` is owned by the repo:
 *   - When `patch.status === 'done'` and the existing task was not already 'done',
 *     stamp `completedAt = now` (overrides any value the caller passed).
 *   - When `patch.status` moves OFF 'done' (existing was 'done', patch is something
 *     else), clear `completedAt = null` (overrides any value the caller passed).
 *   - Otherwise leave `completedAt` alone (the caller may still patch it explicitly
 *     for back-fill scenarios, but the common UI path — checkbox toggle, modal save —
 *     never touches it).
 *
 * UI code (Lists checkbox, TaskFormModal, future drag-and-drop) MUST NOT manage
 * `completedAt` itself — this invariant is the single source of truth.
 */
export function updateTask(
  workspaceId: string,
  id: string,
  patch: Partial<Omit<Task, 'id' | 'createdAt'>>,
): Task | undefined {
  const existing = listTasks(workspaceId)
  const idx = existing.findIndex((t) => t.id === id)
  if (idx === -1) return undefined

  // D-09: clone the patch locally before stamping completedAt so we never mutate
  // the caller's object.
  const stamped: Partial<Omit<Task, 'id' | 'createdAt'>> = { ...patch }
  const prevStatus = existing[idx].status
  if (stamped.status !== undefined) {
    if (stamped.status === 'done' && prevStatus !== 'done') {
      stamped.completedAt = new Date().toISOString()
    } else if (stamped.status !== 'done' && prevStatus === 'done') {
      stamped.completedAt = null
    }
  }

  const updated: Task = { ...existing[idx], ...stamped, updatedAt: new Date().toISOString() }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.tasks(workspaceId), next)
  return updated
}

/**
 * Remove a task by id. Returns `true` if a task was found and removed,
 * `false` if no task with the given id exists.
 */
export function deleteTask(workspaceId: string, id: string): boolean {
  const existing = listTasks(workspaceId)
  const next = existing.filter((t) => t.id !== id)
  if (next.length === existing.length) return false
  writeJSON(K.tasks(workspaceId), next)
  return true
}
