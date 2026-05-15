/**
 * Halo auth repo (Plan 02-03).
 *
 * CRUD over the `halo:v1:visitors` and `halo:v1:workspaces` localStorage
 * arrays. Every read goes through `readWithSchema` so a corrupt or tampered
 * value falls through to `[]` rather than crashing the app
 * (CLAUDE.md: "untrusted data on disk"). No direct localStorage calls — the
 * storage codec is the only sanctioned accessor (FND-04).
 *
 * Contract notes:
 *   - `createVisitor` does NOT enforce email/username uniqueness. The page
 *     handler in 02-09 checks via `findVisitorByEmail` / `findVisitorByUsername`
 *     BEFORE calling `createVisitor` and surfaces the locked UI-SPEC errors.
 *     The repo's job is "write this record" — uniqueness is a UX concern.
 *   - `createVisitor` accepts a plaintext `password` and hashes it before
 *     persistence. The returned `Visitor` and the persisted record have no
 *     `password` field; `VisitorSchema` enforces the `passwordHash` shape.
 *   - Errors from `writeJSON` (e.g. QuotaExceededError) are swallowed by the
 *     codec; the repo neither retries nor surfaces failure.
 *   - **Non-atomic read-modify-write (WR-04):** Both `createVisitor` and
 *     `createWorkspace` do `listX() → spread → writeJSON([...existing, x])`.
 *     localStorage offers no lock primitive, so two concurrent calls — across
 *     tabs OR `await`-spaced within a single tab (the `await hashPassword`
 *     window in `createVisitor` is the realistic intra-tab gap) — can drop
 *     records. Last-write-wins clobber. Do NOT lean on this repo for any
 *     flow where data loss on race matters; storage-event reconciliation
 *     (the auth-store cross-tab session sync TODO) does not help here
 *     because that is a session-level concern, not a list-merge concern.
 */

import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { VisitorsArraySchema, WorkspacesArraySchema } from './schemas'
import type { Visitor, Workspace } from './types'
import { hashPassword } from './passwordHash'

// ---------------------------------------------------------------------------
// Input shapes — explicit so TypeScript catches accidental plaintext leaks
// ---------------------------------------------------------------------------

/**
 * Plaintext-password input to `createVisitor`. The `password` field is
 * hashed by the repo and is NEVER persisted or returned in the resulting
 * `Visitor` (which only carries `passwordHash`).
 */
export type CreateVisitorInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
  jobTitle: string
  role: Visitor['role']
  yearsExperience: number
  location: string
  primaryUseCase: Visitor['primaryUseCase']
  teamSize: number
  topGoals: Visitor['topGoals']
}

/** Input to `createWorkspace`. The repo fills `id` and `createdAt`. */
export type CreateWorkspaceInput = {
  ownerVisitorId: string
  companyName: string
  companySize: Workspace['companySize']
  industry: Workspace['industry']
  planTier: Workspace['planTier']
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/** Return all persisted visitors. Falls through to `[]` on corrupt / schema-invalid storage. */
export function listVisitors(): Visitor[] {
  return readWithSchema(K.visitors(), VisitorsArraySchema, [] as Visitor[])
}

/** Return all persisted workspaces. Falls through to `[]` on corrupt / schema-invalid storage. */
export function listWorkspaces(): Workspace[] {
  return readWithSchema(K.workspaces(), WorkspacesArraySchema, [] as Workspace[])
}

/** Case-insensitive lookup by email. Returns `undefined` if no match. */
export function findVisitorByEmail(email: string): Visitor | undefined {
  const needle = email.toLowerCase()
  return listVisitors().find((v) => v.email.toLowerCase() === needle)
}

/** Case-insensitive lookup by username. Returns `undefined` if no match. */
export function findVisitorByUsername(username: string): Visitor | undefined {
  const needle = username.toLowerCase()
  return listVisitors().find((v) => v.username.toLowerCase() === needle)
}

/** Strict-equality lookup by visitor id. Returns `undefined` if no match. */
export function getVisitorById(id: string): Visitor | undefined {
  return listVisitors().find((v) => v.id === id)
}

/** Strict-equality lookup by workspace id. Returns `undefined` if no match. */
export function getWorkspaceById(id: string): Workspace | undefined {
  return listWorkspaces().find((w) => w.id === id)
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Hash `input.password` and persist a new `Visitor` record to `K.visitors()`.
 *
 * Returns the newly-created `Visitor`. The plaintext `password` is consumed
 * to compute `passwordHash` and is NEVER copied to the returned object or to
 * the stored array. TypeScript enforces this because the destructure below
 * discards `password` and the resulting record's type is `Visitor`, which has
 * no `password` field per `VisitorSchema`.
 */
export async function createVisitor(input: CreateVisitorInput): Promise<Visitor> {
  const {
    password,
    email,
    firstName,
    lastName,
    username,
    jobTitle,
    role,
    yearsExperience,
    location,
    primaryUseCase,
    teamSize,
    topGoals,
  } = input

  const passwordHash = await hashPassword(password)

  const visitor: Visitor = {
    id: nanoid(),
    email,
    passwordHash,
    firstName,
    lastName,
    username,
    jobTitle,
    role,
    yearsExperience,
    location,
    primaryUseCase,
    teamSize,
    topGoals,
    createdAt: new Date().toISOString(),
  }

  const existing = listVisitors()
  writeJSON(K.visitors(), [...existing, visitor])

  return visitor
}

/**
 * Persist a new `Workspace` record to `K.workspaces()`. Synchronous (no
 * hashing involved). Returns the newly-created `Workspace`.
 */
export function createWorkspace(input: CreateWorkspaceInput): Workspace {
  const workspace: Workspace = {
    id: nanoid(),
    ownerVisitorId: input.ownerVisitorId,
    companyName: input.companyName,
    companySize: input.companySize,
    industry: input.industry,
    planTier: input.planTier,
    createdAt: new Date().toISOString(),
  }

  const existing = listWorkspaces()
  writeJSON(K.workspaces(), [...existing, workspace])

  return workspace
}

/**
 * Apply `patch` to an existing visitor by id. Returns the updated `Visitor`, or
 * `undefined` if no visitor with the given id exists.
 *
 * Defense per D-15: `passwordHash` is structurally omitted from the patch type so
 * Settings UI cannot accidentally expose it. The `crypto.subtle.digest` hash is
 * owned exclusively by `createVisitor` (Phase 2 D-09). `id` and `createdAt` are
 * also immutable for invariant reasons (Zustand session keys against `id`).
 *
 * Pattern mirrors `tasksRepo.updateTask` cross-module: read array via the existing
 * `listVisitors` (which routes through `readWithSchema` per FND-04) → find index →
 * spread patch → writeJSON → return updated record. Visitor has no `updatedAt`
 * field per `VisitorSchema`, so unlike `updateTask` there is no timestamp stamp.
 *
 * Non-atomic read-modify-write — same WR-04 caveat as `createVisitor`. Two
 * concurrent tabs can clobber updates; acceptable for the single-user demo surface.
 */
export function updateVisitor(
  id: string,
  patch: Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>,
): Visitor | undefined {
  const existing = listVisitors()
  const idx = existing.findIndex((v) => v.id === id)
  if (idx === -1) return undefined
  const updated: Visitor = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.visitors(), next)
  return updated
}

/**
 * Apply `patch` to an existing workspace by id. Returns the updated `Workspace`,
 * or `undefined` if no workspace with the given id exists.
 *
 * Defense per D-15: `ownerVisitorId` is structurally omitted from the patch type
 * — workspace ownership is set once at creation time by the wizard and is not a
 * Settings-editable field (Phase 4 has no workspace transfer UX). `id` and
 * `createdAt` are immutable for the same reasons as `updateVisitor`.
 *
 * Pattern mirrors `tasksRepo.updateTask` cross-module: read array via the existing
 * `listWorkspaces` (which routes through `readWithSchema` per FND-04) → find index →
 * spread patch → writeJSON → return updated record. Workspace has no `updatedAt`
 * field per `WorkspaceSchema`, so there is no timestamp stamp.
 */
export function updateWorkspace(
  id: string,
  patch: Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>,
): Workspace | undefined {
  const existing = listWorkspaces()
  const idx = existing.findIndex((w) => w.id === id)
  if (idx === -1) return undefined
  const updated: Workspace = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.workspaces(), next)
  return updated
}
