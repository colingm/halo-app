/**
 * Halo seed coordinator (Phase 5 D-11, D-12).
 *
 * Owns the orchestration of all per-domain seeders + the single `meta.seededAt`
 * stamp. Replaces direct `seedIfNeeded(workspaceId)` calls from AppLayout.
 *
 * Order matters (D-04): teammates first, then tasks. tasksSeed reads
 * K.teammates(workspaceId) to pick assignees from the just-seeded teammate list.
 * Stamping meta.seededAt AFTER both seeders succeed ensures neither seeder can
 * bypass the idempotency gate independently (D-12).
 *
 * Idempotency: short-circuits on `meta.seededAt !== null`. The stamp is
 * written here at the TAIL — moved out of tasksSeed.ts per D-12. This is
 * the SOLE writer of meta.seededAt in the seeding flow (migrations.ts owns
 * the migration-runner stamp separately and is not a seeder).
 *
 * Caller: src/routes/app/AppLayout.tsx — invokes seedDemoData(workspaceId)
 * once on first authenticated mount per workspace via useEffect keyed on
 * workspace?.id (D-11 — per-domain seeders with a single coordinator).
 */

import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import { seedTeammatesIfNeeded } from '../team/teamSeed'
import { seedIfNeeded as seedTasksIfNeeded } from '../tasks/tasksSeed'

// ---------------------------------------------------------------------------
// Default meta constant (mirrors tasksSeed.ts + teamSeed.ts shape)
// ---------------------------------------------------------------------------

const DEFAULT_META = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null as string | null,
  appVersion: APP_VERSION,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed all demo data for `workspaceId` if the workspace has not been seeded.
 *
 * Idempotent: calling this function multiple times for the same workspace
 * is safe — after the first successful call, `meta.seededAt` is non-null and
 * all subsequent calls return immediately without touching storage.
 *
 * Seeding order (D-04):
 *   1. seedTeammatesIfNeeded — writes K.teammates(workspaceId)
 *   2. seedTasksIfNeeded — reads K.teammates(workspaceId), picks assignees
 *   3. meta stamp — writes seededAt to K.meta() at the tail (D-12)
 *
 * @param workspaceId - The workspace ID from `useAuthStore`. Must be a non-empty
 *   string (nanoid format). NOT `.toString()`-coerced — it is already a string.
 */
export function seedDemoData(workspaceId: string): void {
  // Primary idempotency gate — single meta.seededAt for all seeders (D-12).
  // Per-domain seeders also read this flag but do not stamp it; the stamp
  // lives here exclusively.
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  if (meta.seededAt !== null) return

  // Step 1 (D-04 ordering): teammates BEFORE tasks. tasksSeed reads
  // K.teammates and maps Teammate → Assignee for the assignee field.
  seedTeammatesIfNeeded(workspaceId)

  // Step 2: tasks — picks assignees from the just-written teammates.
  seedTasksIfNeeded(workspaceId)

  // Step 3 (D-12): Stamp ONLY at the tail, after both seeders succeed.
  // This stamp was previously inside tasksSeed.ts — the surgical edit
  // moves it here so a single flag gates both domains.
  writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })
}
