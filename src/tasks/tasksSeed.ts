/**
 * Halo tasks seeder (Phase 5 D-12 amendment — pure data writer; updated Plan 07).
 *
 * Per Phase 5 D-12, the meta stamp moves to src/seed/seedAll.ts which is the
 * single owner of meta writes after both seeders complete. tasksSeed is a pure
 * data writer (writeJSON to K.tasks only).
 *
 * Generates ~40-60 faker tasks for the supplied workspace, picking assignees
 * from the just-seeded teammate list (D-04). Gated on the per-domain ledger
 * plus a legacy-compat fallback, plus a defensive tasks-existence check.
 *
 * Idempotency contract (D-04 + D-12 + Plan 07):
 *   1. Read meta via readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
 *   2. If meta.seededDomains.tasks is set: skip (per-domain ledger — Plan 07).
 *   3. Legacy compat: if meta.seededDomains is absent AND meta.seededAt is set,
 *      treat as tasks-already-seeded (pre-Phase-5 installs stamped seededAt at
 *      the Phase 3 tasksSeed tail — Plan 07 preserves existing task data via
 *      this fallback).
 *   4. Else if listTasks(workspaceId).length > 0: skip (defensive guard;
 *      protects against DevTools / external writes that wrote tasks without
 *      updating meta).
 *   5. Else: read teammates, map to Assignee candidates, generate tasks,
 *      writeJSON(K.tasks(workspaceId), tasks). DO NOT stamp meta.seededAt
 *      here — DO NOT stamp meta.seededAt here — that stamp belongs to the
 *      seedAll.ts coordinator (D-12 + Plan 07; the coordinator now owns
 *      per-domain seededDomains writes).
 *
 * Caller: src/seed/seedAll.ts — invoked as seedTasksIfNeeded() after
 * seedTeammatesIfNeeded(). AppLayout now calls seedDemoData() (the
 * coordinator) instead of seedIfNeeded() directly (D-11).
 *
 * Per-key co-ownership (Pattern S4):
 *   tasksSeed.ts is the deliberate co-owner of K.tasks(workspaceId) alongside
 *   tasksRepo.ts. tasksSeed writes the initial array; tasksRepo owns all
 *   subsequent reads and mutations. All other files must go through tasksRepo.
 *
 * Randomness:
 *   faker.seed(N) is intentionally NOT called — each fresh workspace receives
 *   a unique variety of tasks, which makes demos more interesting and avoids
 *   the same set of names/titles appearing on every install.
 */

import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import type { Meta } from '../storage'
import { TasksArraySchema } from './schemas'
import { TeammatesArraySchema } from '../team/schemas'
import type { Task, TaskStatus, TaskPriority, Assignee } from './types'

// ---------------------------------------------------------------------------
// Default meta constant (mirrors migrations.ts DEFAULT_META shape)
// ---------------------------------------------------------------------------

const DEFAULT_META: Meta = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null,
  appVersion: APP_VERSION,
}

// ---------------------------------------------------------------------------
// Internal helper — weighted random pick from options
// ---------------------------------------------------------------------------

function weightedPick<T>(options: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < options.length; i++) {
    r -= weights[i]
    if (r <= 0) return options[i]
  }
  return options[options.length - 1]
}

// ---------------------------------------------------------------------------
// Task generator with D-05 date distribution
// ---------------------------------------------------------------------------

function generateTasks(count: number, assigneeCandidates: Assignee[]): Task[] {
  const now = new Date()

  const tasks: Task[] = Array.from({ length: count }, () => {
    // createdAt: spread across last 90 days (D-05)
    const createdAt = faker.date.recent({ days: 90, refDate: now })

    // status: ~55% done, ~25% in_progress, ~20% todo (D-05 + D-17 donut chart shape)
    const status = weightedPick<TaskStatus>(
      ['done', 'in_progress', 'todo'],
      [55, 25, 20],
    )

    // completedAt: set for 'done' tasks only, between createdAt and now (D-05)
    const completedAt: string | null =
      status === 'done'
        ? faker.date.between({ from: createdAt, to: now }).toISOString()
        : null

    // updatedAt: >= createdAt, within 0–14 days of createdAt (drives Timeline events D-22)
    const updatedAtBase = faker.date.between({
      from: createdAt,
      to: new Date(Math.min(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000, now.getTime())),
    })
    const updatedAt = updatedAtBase.toISOString()

    // dueDate: ~80% of tasks have a dueDate, with ~15% in the past (drives Overdue KPI D-17)
    let dueDate: string | null = null
    const hasDueDate = Math.random() < 0.8
    if (hasDueDate) {
      const isPastDue = status !== 'done' && Math.random() < (0.15 / 0.8)
      if (isPastDue) {
        // Past-due: 1–30 days before now
        const daysAgo = faker.number.int({ min: 1, max: 30 })
        dueDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
      } else {
        // Future or same-period: within ±60 days of createdAt, but after now for active tasks
        const offsetDays = faker.number.int({ min: 1, max: 60 })
        dueDate = new Date(createdAt.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // priority: mild bias toward 'medium' (uniform-ish; medium slightly favored)
    const priority = weightedPick<TaskPriority>(
      ['low', 'medium', 'high', 'urgent'],
      [20, 35, 30, 15],
    )

    // description: ~70% have a paragraph, ~30% empty string
    const description = Math.random() < 0.7 ? faker.lorem.paragraph() : ''

    return {
      id: nanoid(),
      title: faker.hacker.phrase(),
      description,
      status,
      priority,
      assignee: assigneeCandidates.length > 0
        ? faker.helpers.arrayElement(assigneeCandidates)
        : { id: nanoid(), name: faker.person.fullName(), avatar: faker.image.avatar() },
      createdAt: createdAt.toISOString(),
      updatedAt,
      dueDate,
      completedAt,
    } satisfies Task
  })

  // Defensive schema validation — fail loudly at seed time rather than silently
  // producing a corrupt blob that `listTasks` would discard as [] (T-03-03-01).
  const parsed = TasksArraySchema.safeParse(tasks)
  if (!parsed.success) {
    console.error(
      '[halo:tasksSeed] Generated tasks failed TasksArraySchema validation — ' +
        'check for schema drift between tasksSeed.ts and schemas.ts.',
      parsed.error.issues,
    )
    throw new Error('[halo:tasksSeed] Seeded task array does not match TasksArraySchema')
  }

  return parsed.data
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed tasks for `workspaceId` if the workspace has not been seeded yet.
 *
 * Idempotent: calling this function multiple times for the same workspace
 * is safe — after the first successful call, `meta.seededAt` is non-null and
 * all subsequent calls return immediately without touching storage.
 *
 * @param workspaceId - The workspace ID from `useAuthStore`. Must be a non-empty
 *   string (nanoid format). NOT `.toString()`-coerced — it is already a string.
 */
export function seedIfNeeded(workspaceId: string): void {
  // Read current meta (falls through to DEFAULT_META if corrupt or absent).
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)

  // GATE 1a: Per-domain ledger check (Plan 07) — coordinator sets this entry
  // after a successful seed run; fastest path for already-seeded installs.
  if (meta.seededDomains?.tasks) return

  // GATE 1b: Legacy-compat fallback — pre-Phase-5 installs (Phase 3 tasksSeed
  // tail at commit 3b9bdc6) stamped meta.seededAt before per-domain ledgering
  // existed. Treat non-null seededAt with absent seededDomains as evidence the
  // task domain was already seeded — preserves existing task data (Plan 07).
  if (meta.seededAt !== null && meta.seededDomains === undefined) return

  // GATE 2: Defensive check — if tasks exist without seededAt, skip seeding
  // instead of overwriting. This protects against DevTools edits / external
  // writes that wrote tasks but did not stamp meta.seededAt (T-03-03-02).
  const existing = readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])
  if (existing.length > 0) return

  // Read teammates seeded by seedTeammatesIfNeeded (D-04 ordering). The
  // coordinator runs teammates first so this read should return a non-empty
  // array. Defensive fallback: if empty (e.g. isolated call), tasks still
  // seed but with minted assignees (D-04 defensive).
  const teammates = readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [])
  const assigneeCandidates: Assignee[] = teammates.map((t) => ({
    id: t.id,
    name: `${t.firstName} ${t.lastName}`.trim(),
    ...(t.avatar ? { avatar: t.avatar } : {}),
  }))

  // Generate 40–60 tasks with D-05 date distribution.
  const count = faker.number.int({ min: 40, max: 60 })
  const tasks = generateTasks(count, assigneeCandidates)

  // Write tasks only. DO NOT stamp meta.seededAt here — the seedAll.ts
  // coordinator stamps after BOTH seeders succeed (D-12). A crash between
  // this write and the coordinator's stamp leaves tasks without a stamp,
  // which is recoverable via GATE 2 on the next mount.
  writeJSON(K.tasks(workspaceId), tasks)
}
