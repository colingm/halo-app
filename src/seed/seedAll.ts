/**
 * Halo seed coordinator (Phase 5 D-11, D-12 — updated by Plan 07).
 *
 * Owns the orchestration of all per-domain seeders + the per-domain ledger
 * writes in `meta.seededDomains`. Replaces direct `seedIfNeeded(workspaceId)`
 * calls from AppLayout.
 *
 * Order matters (D-04): teammates first, then tasks. tasksSeed reads
 * K.teammates(workspaceId) to pick assignees from the just-seeded teammate list.
 *
 * Idempotency: per-domain gates check `meta.seededDomains.{tasks,teammates}`
 * independently. The coordinator never short-circuits at the top — it always
 * reads meta, reconciles the effective ledger, calls only the seeders whose
 * domain entry is absent, then writes the merged meta record.
 *
 * Legacy reconciliation (Plan 07 — UAT Gaps 1 + 4):
 *   Pre-Phase-5 installs have `meta.seededAt` stamped by the old tasksSeed.ts
 *   tail (commit 3b9bdc6) but no `meta.seededDomains`. On cold-start the
 *   coordinator interprets this as `{ tasks: <legacy stamp> }`, leaving
 *   `teammates` unset so the next boot runs the teammate seeder while
 *   preserving existing task data. After seeding, the coordinator writes the
 *   full per-domain ledger so the legacy->new upgrade happens in one boot.
 *
 * D-12 update: per-domain ledger replaces the single global gate. Legacy
 *   `meta.seededAt` becomes a read-only fallback for backward-compat.
 *   D-12 originally specified "a single global stamp gates both seeders" —
 *   that proved insufficient when Phase 5 added a second seed domain. Plan 07
 *   deliberately revises D-12; this docblock is the traceability record.
 *
 * This is the SOLE writer of meta in the seeding flow (migrations.ts owns
 * the migration-runner writes separately and is not a seeder).
 *
 * Caller: src/routes/app/AppLayout.tsx — invokes seedDemoData(workspaceId)
 * once on first authenticated mount per workspace via useEffect keyed on
 * workspace?.id (D-11 — per-domain seeders with a single coordinator).
 */

import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import type { Meta } from '../storage'
import { seedTeammatesIfNeeded } from '../team/teamSeed'
import { seedIfNeeded as seedTasksIfNeeded } from '../tasks/tasksSeed'

// ---------------------------------------------------------------------------
// Default meta constant (mirrors tasksSeed.ts + teamSeed.ts shape)
// ---------------------------------------------------------------------------

const DEFAULT_META: Meta = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null,
  appVersion: APP_VERSION,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed all demo data for `workspaceId` if the workspace has not been seeded.
 *
 * Idempotent: per-domain gates check `meta.seededDomains.{teammates,tasks}`
 * independently. After both domains are recorded, repeated calls write back
 * equivalent meta — harmless no-op.
 *
 * Seeding order (D-04):
 *   1. seedTeammatesIfNeeded — writes K.teammates(workspaceId)
 *   2. seedTasksIfNeeded — reads K.teammates(workspaceId), picks assignees
 *   3. meta merge — writes seededDomains (+ legacy seededAt) to K.meta()
 *
 * Legacy reconciliation (Plan 07 — UAT Gaps 1 + 4):
 *   A pre-Phase-5 install has `meta.seededAt` set but no `seededDomains`.
 *   The coordinator maps that as `{ tasks: meta.seededAt }` so existing
 *   tasks are preserved while teammates domain is left unset (runs this boot).
 *
 * @param workspaceId - The workspace ID from `useAuthStore`. Must be a non-empty
 *   string (nanoid format). NOT `.toString()`-coerced — it is already a string.
 */
export function seedDemoData(workspaceId: string): void {
  // Read current meta (falls through to DEFAULT_META if corrupt or absent).
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)

  // Step 1: Compute effective per-domain ledger by reconciling legacy state.
  //
  //   - New shape (seededDomains present): copy verbatim into a fresh local
  //     object so we can mutate it without aliasing the readWithSchema result.
  //   - Legacy shape (seededAt set, seededDomains absent): interpret as
  //     { tasks: <legacy stamp> } — tasks were seeded by the Phase 3
  //     tasksSeed.ts tail; teammates is intentionally left unset so this
  //     boot runs the teammate seeder while preserving existing task data.
  //   - Fresh install (seededAt null, no seededDomains): start with {}.
  let effectiveDomains: { tasks?: string; teammates?: string } =
    meta.seededDomains != null
      ? { ...meta.seededDomains }
      : meta.seededAt !== null
        ? { tasks: meta.seededAt }
        : {}

  // Step 2 (D-04 ordering): teammates BEFORE tasks. tasksSeed reads
  // K.teammates and maps Teammate → Assignee for the assignee field.
  if (!effectiveDomains.teammates) {
    seedTeammatesIfNeeded(workspaceId)
    effectiveDomains.teammates = new Date().toISOString()
  }

  // Step 3: tasks — picks assignees from the just-written teammates.
  if (!effectiveDomains.tasks) {
    seedTasksIfNeeded(workspaceId)
    effectiveDomains.tasks = new Date().toISOString()
  }

  // Step 4: Persist the merged meta record. Preserve the legacy seededAt
  // value if present (read-only backward-compat field — external readers or
  // debugging sessions may inspect it). Fall back to the first domain stamp
  // if seededAt was previously null (fresh install path).
  const newSeededAt =
    meta.seededAt ?? effectiveDomains.teammates ?? effectiveDomains.tasks ?? null
  writeJSON(K.meta(), { ...meta, seededAt: newSeededAt, seededDomains: effectiveDomains })
}
