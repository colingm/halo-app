---
phase: 05-team-help-polish
plan: "03"
subsystem: seed
tags: [seed, coordinator, teammates, tasks, assignees, idempotency]
dependency_graph:
  requires: ["05-01"]
  provides: ["seedAll coordinator", "D-04 assignee sourcing", "D-12 single meta stamp"]
  affects: ["src/seed/seedAll.ts", "src/tasks/tasksSeed.ts", "src/tasks/assigneeOptions.ts", "src/routes/app/AppLayout.tsx"]
tech_stack:
  added: ["src/seed/ directory (new seed coordinator module)"]
  patterns: ["Coordinator pattern — seedAll orchestrates per-domain seeders", "Single meta.seededAt stamp owned by coordinator (D-12)", "Teammate-to-Assignee mapping for task seeding (D-04)"]
key_files:
  created:
    - path: src/seed/seedAll.ts
      role: Idempotent seed coordinator — orchestrates team + tasks seeders, stamps meta.seededAt exactly once at tail
  modified:
    - path: src/tasks/tasksSeed.ts
      change: "Two surgical edits: (1) reads K.teammates and maps Teammate→Assignee before generateTasks (D-04); (2) removes meta stamp tail — pure data writer now (D-12)"
    - path: src/tasks/assigneeOptions.ts
      change: "Source swap: listTasks→listTeammates as data source; function signature and consumers unchanged (D-04)"
    - path: src/routes/app/AppLayout.tsx
      change: "One-line swap: seedIfNeeded import+call replaced with seedDemoData from seed/seedAll (D-11)"
decisions:
  - "seedAll owns the single meta.seededAt stamp (D-12) — moves out of tasksSeed so both seeders are gated by the same flag"
  - "Teammate→Assignee mapping uses conditional avatar spread so AssigneeSchema.avatar (optional URL) is never set to null (D-04)"
  - "assigneeOptions.ts source swap preserves the visitor override line — visitor entry always wins for self-assignment freshness"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  files_changed: 4
  files_created: 1
---

# Phase 5 Plan 03: Seed Coordinator Summary

**One-liner:** Seed coordinator (`src/seed/seedAll.ts`) orchestrates teammates-before-tasks seeding, stamps `meta.seededAt` exactly once, and AppLayout now calls `seedDemoData` instead of `seedIfNeeded`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | tasksSeed surgical amendments + assigneeOptions source swap | 55277b4 | src/tasks/tasksSeed.ts, src/tasks/assigneeOptions.ts |
| 2 | seedAll coordinator + AppLayout call-site swap | 0077351 | src/seed/seedAll.ts (NEW), src/routes/app/AppLayout.tsx |

## What Was Built

### Task 1: tasksSeed surgical amendments + assigneeOptions source swap

**tasksSeed.ts — two surgical changes:**

Change 1 (D-04 — assignees from teammates):
- Added `import { TeammatesArraySchema } from '../team/schemas'` and updated types import to include `Assignee`
- Changed `generateTasks(count: number)` signature to `generateTasks(count: number, assigneeCandidates: Assignee[])`
- Replaced the minted-assignee literal with: `assignee: assigneeCandidates.length > 0 ? faker.helpers.arrayElement(assigneeCandidates) : { id: nanoid(), name: faker.person.fullName(), avatar: faker.image.avatar() }`
- Inside `seedIfNeeded`, added teammate read + Teammate→Assignee mapping AFTER both gates, BEFORE generateTasks
- Avatar conditional spread: `...(t.avatar ? { avatar: t.avatar } : {})` — preserves AssigneeSchema's `avatar?: string.url()` (optional, not nullable)

Change 2 (D-12 — remove meta stamp from tail):
- Deleted the `writeJSON(K.meta(), { ...meta, seededAt: ... })` line from `seedIfNeeded`
- Updated file docblock: `tasksSeed is now a pure data writer (writeJSON to K.tasks only)`
- GATE 1 (`meta.seededAt !== null`) and GATE 2 (`existing.length > 0`) both preserved — they read meta for idempotency but no longer write it

**assigneeOptions.ts — one-line source swap (D-04):**
- Removed `import { listTasks } from './tasksRepo'`
- Added `import { listTeammates } from '../team/teamsRepo'`
- Replaced `for (const task of listTasks(workspaceId)) { byId.set(task.assignee.id, task.assignee) }` with `for (const t of listTeammates(workspaceId)) { byId.set(t.id, { id: t.id, name: ..., ...(avatar) }) }`
- Visitor override line preserved: `byId.set(visitor.id, { id: visitor.id, name: ... })`
- Sort + return shape (`value: a.id, label: a.name`) unchanged — consumers untouched

### Task 2: seedAll coordinator + AppLayout call-site swap

**src/seed/seedAll.ts (NEW):**
- File-header docblock explains D-11 + D-12 rationale
- Imports: `K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION` from `../storage`; `seedTeammatesIfNeeded` from `../team/teamSeed`; `seedIfNeeded as seedTasksIfNeeded` from `../tasks/tasksSeed`
- `DEFAULT_META` constant mirrors existing shape in tasksSeed.ts + teamSeed.ts
- `export function seedDemoData(workspaceId: string): void`:
  - GATE 1: `readWithSchema(K.meta(), MetaSchema, DEFAULT_META)` → if `meta.seededAt !== null` return
  - Step 1: `seedTeammatesIfNeeded(workspaceId)` — D-04 ordering
  - Step 2: `seedTasksIfNeeded(workspaceId)` — reads just-seeded teammates
  - Tail: `writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })` — sole writer

**AppLayout.tsx — one-line swap:**
- `import { seedIfNeeded } from '../../tasks'` → `import { seedDemoData } from '../../seed/seedAll'`
- `seedIfNeeded(workspace.id)` → `seedDemoData(workspace.id)` in the existing useEffect
- `[workspace?.id]` dependency array unchanged
- No other changes; no help-anchor markup added (D-10 no-op satisfied)

## Deleted Lines from tasksSeed.ts

The removed tail stamp (previously lines 186-187):
```typescript
// REMOVED (D-12):
writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })
```

This line now lives exclusively in `src/seed/seedAll.ts` line 72.

## New Directory: src/seed/

Rationale: the coordinator sits above the per-domain modules (`tasks/`, `team/`). Placing it in `src/seed/` rather than either domain keeps the dependency graph acyclic: `seed/seedAll.ts → team/teamSeed.ts` and `seed/seedAll.ts → tasks/tasksSeed.ts`, never the reverse.

## Defensive Fallback Behavior

The D-04 defensive fallback in tasksSeed.ts handles the case where `K.teammates(workspaceId)` returns an empty array:
- **Normal path (post-coordinator):** `assigneeCandidates` has 9–13 entries (Owner + 8–12 faker teammates) → `faker.helpers.arrayElement(assigneeCandidates)` picks from the list
- **Fallback path (isolated call or race):** `assigneeCandidates` is `[]` → `{ id: nanoid(), name: faker.person.fullName(), avatar: faker.image.avatar() }` mints fresh assignees

The coordinator ordering (`seedTeammatesIfNeeded` before `seedTasksIfNeeded`) ensures the normal path is always taken in practice.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All four files modified are infrastructure/seed logic, not UI surfaces with placeholder data.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced by this plan.

## Self-Check: PASSED

Files verified:
- `src/seed/seedAll.ts` exists: FOUND
- `src/tasks/tasksSeed.ts` has `readWithSchema(K.teammates`: FOUND
- `src/tasks/tasksSeed.ts` has NO `writeJSON(K.meta`: CONFIRMED (0 matches)
- `src/tasks/assigneeOptions.ts` imports `listTeammates`: FOUND
- `src/routes/app/AppLayout.tsx` calls `seedDemoData`: FOUND

Commits verified:
- 55277b4: feat(05-03): tasksSeed picks assignees from teammates; assigneeOptions swaps source
- 0077351: feat(05-03): add seedAll coordinator; AppLayout swaps to seedDemoData

Build: `npm run build` exits 0 (7863 modules transformed)
Typecheck: `npm run typecheck` exits 0
