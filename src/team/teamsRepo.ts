/**
 * Halo teams repo (Phase 5 — owner of K.teammates(workspaceId)).
 *
 * CRUD over the `halo:v1:teammates:{workspaceId}` localStorage array. Every read
 * goes through `readWithSchema` so a corrupt or tampered value falls through
 * to `[]` rather than crashing the app (FND-04). No direct localStorage calls
 * — the storage codec is the only sanctioned accessor.
 *
 * Contract notes:
 *   - Per-key co-ownership (Pattern S4): teamsRepo.ts is the co-owner of
 *     K.teammates(workspaceId) alongside teamSeed.ts. teamSeed writes the initial
 *     array; teamsRepo owns all subsequent reads and mutations.
 *   - `updateTeammate` is a pure shallow merge — no completedAt-like invariants
 *     (closer to authRepo.updateVisitor than tasksRepo.updateTask).
 *   - `deleteTeammate` is exported per D-01 even though Phase 5 ships no UI
 *     consumer ("Remove member" is deferred per <deferred>).
 *   - Non-atomic read-modify-write — same WR-04 caveat as tasksRepo. Two
 *     concurrent tabs can drop a teammate; acceptable for a demo surface.
 */

import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { TeammatesArraySchema } from './schemas'
import type { Teammate } from './types'

// ---------------------------------------------------------------------------
// Input shape — explicit so TypeScript catches accidental field omissions
// ---------------------------------------------------------------------------

/** Input to `createTeammate`. The repo fills `id`. */
export type CreateTeammateInput = Omit<Teammate, 'id'>

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/** Return all persisted teammates for `workspaceId`. Falls through to `[]` on corrupt storage. */
export function listTeammates(workspaceId: string): Teammate[] {
  return readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [] as Teammate[])
}

/** Strict-equality lookup by teammate id. Returns `undefined` if no match. */
export function getTeammateById(workspaceId: string, id: string): Teammate | undefined {
  return listTeammates(workspaceId).find((t) => t.id === id)
}

/**
 * Case-insensitive lookup by email. Returns `undefined` if no match.
 * Used by InviteTeammateModal's D-03 duplicate-email .superRefine to prevent
 * re-inviting an existing teammate.
 */
export function findTeammateByEmail(workspaceId: string, email: string): Teammate | undefined {
  const needle = email.toLowerCase()
  return listTeammates(workspaceId).find((t) => t.email.toLowerCase() === needle)
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Persist a new `Teammate` record to `K.teammates(workspaceId)`. Returns the
 * newly-created `Teammate`. The repo fills `id` (nanoid) automatically.
 */
export function createTeammate(workspaceId: string, input: CreateTeammateInput): Teammate {
  const teammate: Teammate = {
    id: nanoid(),
    ...input,
  }
  const existing = listTeammates(workspaceId)
  writeJSON(K.teammates(workspaceId), [...existing, teammate])
  return teammate
}

/**
 * Apply `patch` to an existing teammate by id. Returns the updated `Teammate`,
 * or `undefined` if no teammate with the given id exists.
 *
 * Pure shallow merge — no completedAt-like invariant complexity. The role-change
 * flow (D-05) and invite-accept flow use this for simple field updates.
 *
 * UI code MUST NOT demote the Owner row — the Owner gating is enforced at the
 * UI layer (D-02); the repo accepts any valid WorkspaceRole patch.
 */
export function updateTeammate(
  workspaceId: string,
  id: string,
  patch: Partial<Omit<Teammate, 'id'>>,
): Teammate | undefined {
  const existing = listTeammates(workspaceId)
  const idx = existing.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: Teammate = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.teammates(workspaceId), next)
  return updated
}

/**
 * Remove a teammate by id. Returns `true` if a teammate was found and removed,
 * `false` if no teammate with the given id exists.
 *
 * Exported per D-01 even though Phase 5 ships no UI consumer ("Remove member"
 * is deferred — see <deferred> in 05-CONTEXT.md).
 */
export function deleteTeammate(workspaceId: string, id: string): boolean {
  const existing = listTeammates(workspaceId)
  const next = existing.filter((t) => t.id !== id)
  if (next.length === existing.length) return false
  writeJSON(K.teammates(workspaceId), next)
  return true
}
