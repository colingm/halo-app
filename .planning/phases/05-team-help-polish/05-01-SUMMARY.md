---
phase: 05-team-help-polish
plan: "01"
subsystem: team-data-layer
tags: [team, schemas, repo, seed, storage, zod, faker]
dependency_graph:
  requires: [FND-04, FND-05, Phase3-tasksSeed-pattern]
  provides: [TeammateSchema, teamsRepo, teamSeed, K.teammates]
  affects: [05-02-teamsRepo-consumers, 05-03-seedAll, 05-04-TeamUI]
tech_stack:
  added: []
  patterns: [Zod-first-types, readWithSchema-FND04, two-gate-idempotency, faker-batch-seeder]
key_files:
  created:
    - src/team/schemas.ts
    - src/team/types.ts
    - src/team/teamsRepo.ts
    - src/team/teamSeed.ts
    - src/team/index.ts
  modified:
    - src/storage/keys.ts
decisions:
  - "WorkspaceRoleEnum uses Owner/Admin/Member/Viewer — deliberately NOT reusing auth/schemas.ts RoleEnum (D-02)"
  - "Avatar source: faker.image.avatar() URL-based for richer demo experience (D-04 planner discretion)"
  - "Faker batch range: 8-12 teammates per D-04 (matches 05-CONTEXT.md discretion item)"
  - "meta.seededAt stamp deliberately absent from teamSeed — seedAll.ts coordinator owns stamp (D-12)"
  - "K.teammates additive — no SCHEMA_VERSION bump (D-01)"
metrics:
  duration: "189s (~3 min)"
  completed: "2026-05-15"
  tasks: 2
  files: 6
---

# Phase 5 Plan 01: Team Data Layer Summary

Team data layer with Zod schemas, derived types, CRUD repo, idempotent seeder, storage key, and module barrel establishing the foundation for Phase 5's Team UI (Plan 04).

## What Was Built

**Task 1: Schemas, types, K.teammates, module barrel**
- `src/team/schemas.ts` — `WorkspaceRoleEnum` (Owner/Admin/Member/Viewer per D-02), `TeammateStatusEnum` (active/invited), `TeammateSchema` (9 fields per D-01), `TeammatesArraySchema`
- `src/team/types.ts` — `Teammate`, `TeammateStatus`, `WorkspaceRole` derived via `z.infer` (no hand-written types)
- `src/storage/keys.ts` — `K.teammates(workspaceId)` builder added additively (no SCHEMA_VERSION bump)
- `src/team/index.ts` — Module barrel (re-exports schemas + types; teamsRepo + teamSeed added in Task 2)

**Task 2: teamsRepo CRUD + teamSeed idempotent seeder + barrel updates**
- `src/team/teamsRepo.ts` — Full CRUD: `listTeammates`, `getTeammateById`, `findTeammateByEmail` (case-insensitive per D-03), `createTeammate`, `updateTeammate` (pure shallow merge per authRepo pattern), `deleteTeammate` (exported per D-01, UI deferred)
- `src/team/teamSeed.ts` — Two-gate idempotent seeder: Owner-Visitor row first (from `useAuthStore.getState().currentVisitor`), 8-12 faker teammates (Admin/Member/Viewer only). Does NOT stamp `meta.seededAt` per D-12.
- `src/team/index.ts` — Updated barrel with teamsRepo and `seedTeammatesIfNeeded` exports

## Decisions Made

1. **WorkspaceRoleEnum distinct from RoleEnum** — `src/auth/schemas.ts` `RoleEnum` is the functional Visitor role (Product/Engineering/Design/etc). `WorkspaceRoleEnum` is the permission role (Owner/Admin/Member/Viewer). D-02 deliberately keeps these separate — no reuse.

2. **Avatar source: `faker.image.avatar()` URLs** — Chosen over Mantine `<Avatar>` initials-only approach per D-04 planner discretion. URL-based avatars are richer for demo purposes; Mantine Avatar naturally falls back to initials if the URL fails.

3. **Faker batch: 8-12 teammates** — Uses `faker.number.int({ min: 8, max: 12 })` per D-04 + 05-CONTEXT.md discretion. No `faker.seed()` call so each workspace gets unique variety (matches tasksSeed.ts idiom).

4. **No `meta.seededAt` stamp in teamSeed** — Per D-12, the stamp responsibility moves to `seedAll.ts` (Plan 03). The seeder uses both idempotency gates (meta check + defensive `existing.length > 0`) but writes only the teammate array — never the meta key.

5. **`updateTeammate` as pure shallow merge** — Closer to `authRepo.updateVisitor` than `tasksRepo.updateTask`. No `completedAt`-like invariant complexity for teammate updates. Owner-demotion gating is a UI concern (D-02), not a repo concern.

## Interface Exported to Downstream Plans

**Plan 03 (seedAll coordinator):**
```typescript
import { seedTeammatesIfNeeded } from '../team/teamSeed'
// Calls seedTeammatesIfNeeded(workspaceId) before seedTasksIfNeeded
// Then stamps meta.seededAt
```

**Plan 04 (Team UI):**
```typescript
import { listTeammates, createTeammate, updateTeammate, findTeammateByEmail } from '../team/teamsRepo'
import type { Teammate, WorkspaceRole } from '../team/types'
// TeammatesArraySchema available for any direct reads
```

**Plan 02 tasks (assignee options swap):**
```typescript
import { listTeammates } from '../team/teamsRepo'
import type { Teammate } from '../team/types'
// src/tasks/assigneeOptions.ts swaps source from listTasks → listTeammates
```

## Deviations from Plan

None — plan executed exactly as written.

The `npm run lint` script references an `eslint` binary that is not installed in this project (no `node_modules/.bin/eslint`, no `eslint.config.js`). This is a pre-existing project configuration gap, not introduced by this plan. TypeScript typecheck (`npm run typecheck`) passes cleanly. FND-04 compliance verified via manual grep (zero `localStorage.` calls in `src/team/`).

## Threat Flags

None. This plan creates a data layer with no network endpoints, no auth paths, and no new trust boundaries. All storage routes through the existing FND-04 codec. The `findTeammateByEmail` case-insensitive lookup defends against D-03 duplicate-invite issues.

## Known Stubs

None. `teamsRepo` and `teamSeed` are fully implemented data-layer modules with no placeholder logic.

## Self-Check: PASSED

Files created/exist:
- src/team/schemas.ts: EXISTS
- src/team/types.ts: EXISTS
- src/team/teamsRepo.ts: EXISTS
- src/team/teamSeed.ts: EXISTS
- src/team/index.ts: EXISTS
- src/storage/keys.ts: MODIFIED (K.teammates added)

Commits:
- 5006a78: feat(05-01): establish team schemas, types, K.teammates, and module barrel
- 27717e4: feat(05-01): add teamsRepo CRUD, teamSeed, and complete module barrel
