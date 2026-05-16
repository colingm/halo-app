---
status: diagnosed
trigger: "There was no seeded data on the Team page (Test 1, Phase 5 UAT — cold-start with pre-Phase-5 localStorage state)"
created: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Focus

hypothesis: Pre-Phase-5 `meta.seededAt` stamp (written by the old `tasksSeed.ts` tail) survives across boots and short-circuits the new `seedAll.ts` coordinator at Gate 1 (`meta.seededAt !== null → return`), so `seedTeammatesIfNeeded(workspaceId)` is never called and `K.teammates(workspaceId)` is never written. Team page reads an empty array → no Owner row, no faker teammates.
test: Read seedAll.ts Gate 1, teamSeed.ts gates, tasksSeed.ts (pre-Phase-5 commit 3b9bdc6) stamp behavior, migrations.ts boot path, and ResetDemoDataModal.tsx wipe behavior to compare cold-start vs reset+re-seed paths.
expecting: Confirm cold-start gate-short-circuit + no teammate-key migration; confirm reset path clears `halo:v1:meta` → new boot → DEFAULT_META.seededAt=null → seedAll runs to completion.
next_action: Diagnosis complete — return root cause to caller. No code changes (find_root_cause_only mode).

## Symptoms

expected: On first cold-start after a fresh sign-in, the Team page (`/app/team`) shows the Owner row (representing the signed-in visitor at index 0) plus 8–12 faker teammates below. `seedAll.ts` runs `seedTeammatesIfNeeded(workspaceId)` then `seedTasksIfNeeded(workspaceId)` then stamps `meta.seededAt`.
actual: "There was no seeded data on the Team page" — Team page is empty (no Owner row, no faker teammates) on cold-start when localStorage contains pre-Phase-5 state.
errors: None reported by user.
reproduction: Test 1 from `.planning/phases/05-team-help-polish/05-UAT.md`. Boot dev server, sign in with a workspace whose `halo:v1:meta` already has `seededAt` set (any pre-Phase-5 install), navigate to `/app/team`.
started: 2026-05-15, discovered during `/gsd-verify-work` for Phase 5.

Strong differential signal (Test 10 PASS):
- `Settings → Reset demo data → Confirm → re-register/sign-in → /app/team` works correctly — Owner row + faker teammates appear.
- Reset wipes ALL `halo:v*` keys (including `halo:v1:meta`), so the next boot sees `meta.seededAt === null` and `seedAll` runs to completion.
- This isolates the failure to the cold-start path against pre-existing localStorage; the seeder logic itself is correct.

## Eliminated

- hypothesis: "seedTeammatesIfNeeded has a bug — it generates an empty teammate array."
  evidence: `src/team/teamSeed.ts:128-132` generates 8–12 faker teammates and prepends the Owner row at index 0. The defensive `TeammatesArraySchema.safeParse` at line 72 throws on malformed output — silent-empty is not a possible failure mode here. Also disproved by Test 10 (PASS) — same code path produces the correct array when meta.seededAt starts as null.
  timestamp: 2026-05-15

- hypothesis: "TeamPage's listTeammates(workspaceId) read is broken."
  evidence: `src/routes/app/team/TeamPage.tsx:41-45` reads via the standard `listTeammates(workspaceId)` repo function — same call path used after a reset, which works. The read path is not the failure point.
  timestamp: 2026-05-15

- hypothesis: "Migration runner is writing seededAt=null and breaking idempotency on every boot."
  evidence: `src/storage/migrations.ts:64-69` returns no-op when `meta.schemaVersion === CURRENT_SCHEMA_VERSION && meta.appVersion === APP_VERSION` (both already match at HEAD). The spread on line 88-92 only sets schemaVersion + appVersion; it preserves the existing `seededAt`. No migration code touches `seededAt`. Therefore, a pre-existing `seededAt` survives across boots untouched.
  timestamp: 2026-05-15

## Evidence

- timestamp: 2026-05-15
  checked: src/seed/seedAll.ts (Phase 5 coordinator)
  found: "Lines 59-60: `const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META); if (meta.seededAt !== null) return`. This is the SINGLE idempotency gate — when `meta.seededAt` is non-null, the function returns BEFORE calling `seedTeammatesIfNeeded(workspaceId)` (line 64) and BEFORE the meta stamp on line 72."
  implication: "Any non-null `meta.seededAt` — regardless of who wrote it or when — causes seedAll to skip teammate seeding entirely. No fallback, no per-domain gate-check, no `K.teammates(workspaceId)` existence check."

- timestamp: 2026-05-15
  checked: src/team/teamSeed.ts (Phase 5 — own two-gate idempotency)
  found: "Lines 103-109: GATE 1 reads meta and short-circuits on `meta.seededAt !== null`. GATE 2 reads `listTeammates(workspaceId)` and short-circuits on `existing.length > 0`. Both gates are designed to be safe when called as a downstream from the coordinator — they are NOT designed to recover from a coordinator-level skip. The function is private to the coordinator (AppLayout calls only `seedDemoData`)."
  implication: "Even if seedTeammatesIfNeeded were called directly (it isn't), GATE 1 would still cause it to no-op. The teammate seeder cannot self-rescue from the pre-existing meta stamp."

- timestamp: 2026-05-15
  checked: git history of src/tasks/tasksSeed.ts at commit 3b9bdc6 (Phase 3 pre-Phase-5 state)
  found: "Line 187 of the pre-Phase-5 file: `writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })`. The Phase-3-era tasksSeed.ts stamped meta.seededAt at its own tail, immediately after writing tasks. Any user who installed/ran the app before Phase 5 (commits 55277b4 + 0077351) has a `halo:v1:meta` with non-null `seededAt` in localStorage."
  implication: "The historical stamp survives the Phase 5 upgrade. There is no migration step to clear it. New code reads it and short-circuits."

- timestamp: 2026-05-15
  checked: src/storage/migrations.ts (boot-time migration runner)
  found: "Lines 36-39: migrations registry is empty (no v1→v2 entry; CURRENT_SCHEMA_VERSION is still 1). Lines 88-92: post-migration write preserves the existing meta via spread (`...meta`), only overriding `schemaVersion` and `appVersion`. Lines 64-69: when version and appVersion both match (which they do at HEAD — schemaVersion=1, appVersion='0.1.0'), runMigrations returns no-op without touching seededAt."
  implication: "No migration path exists to clear or null-out a pre-Phase-5 `seededAt`. The stamp survives indefinitely until a manual reset."

- timestamp: 2026-05-15
  checked: src/settings/ResetDemoDataModal.tsx (Test 10 success path)
  found: "Lines 93-97: enumerates `localStorage.key(i)` for keys starting with `halo:v` and removes each — this includes `halo:v1:meta`. After reset + hard reload, `runMigrations` (migrations.ts:55-59) sees `peekRaw(K.meta()) === null` and writes DEFAULT_META with `seededAt: null`. The next AppLayout mount calls `seedDemoData(workspace.id)`, which now passes Gate 1 (seededAt is null) and runs both seeders."
  implication: "Test 10 succeeds precisely because the wipe includes `halo:v1:meta`, which re-opens the idempotency gate. This is the differential signal that isolates the bug to the meta-stamp persistence — not to the seeder logic."

- timestamp: 2026-05-15
  checked: src/routes/app/team/TeamPage.tsx
  found: "Lines 41-45: TeamPage's `teammates` useMemo reads exclusively from `listTeammates(workspaceId)`. No fallback, no client-side seeding trigger, no Owner-row synthesis if the array is empty. The page either shows TeamTable (if teammates.length>0) or TeamEmptyState (if teammates.length===0) at lines 79-89."
  implication: "When `K.teammates(workspaceId)` is missing/empty (because the coordinator never wrote it), the page falls into the TeamEmptyState branch — observable as 'no seeded data on the Team page' per the user's verbatim Test 1 report. The matched sub-symptom 'There is no Owner row on the Team page' (Test 7, sibling session `05-team-owner-row-missing.md`) is the same condition viewed through a different test lens."

- timestamp: 2026-05-15
  checked: src/storage/keys.ts (K.teammates key shape)
  found: "Line 54: `teammates: (workspaceId: string): string => 'halo:v${SCHEMA_VERSION}:teammates:${workspaceId}'`. The doc comment explicitly states 'no SCHEMA_VERSION bump because the key is additive'. The plan added the key WITHOUT bumping the version — meaning installs that predate the key have no v2 migration and no entry for that key."
  implication: "Confirmed: Phase 5 introduced K.teammates additively at v1 with no migration. Pre-existing v1 installs have NO teammate key AND a non-null meta.seededAt. The two facts together produce the cold-start failure."

## Resolution

root_cause: |
  Phase 5 D-12 moved the `meta.seededAt` stamp from `tasksSeed.ts` (Phase 3) to the new
  `seedAll.ts` coordinator (Phase 5). The coordinator uses `meta.seededAt !== null` as
  its SINGLE idempotency gate (src/seed/seedAll.ts:59-60). For users with pre-Phase-5
  localStorage state, `meta.seededAt` was already stamped by the old Phase 3 `tasksSeed.ts`
  tail (line 187 of commit 3b9bdc6). On cold start of the Phase 5 build, `seedAll`
  reads that pre-existing non-null `seededAt`, short-circuits at Gate 1, and never
  calls `seedTeammatesIfNeeded(workspaceId)`. `K.teammates(workspaceId)` therefore
  never exists in storage. `TeamPage.tsx` reads an empty array via `listTeammates`
  and renders the empty state — manifesting as "no seeded data on the Team page"
  (Test 1) and "no Owner row" (Test 7, sibling session 05-team-owner-row-missing.md).

  No migration exists to clear or null the pre-Phase-5 stamp: `migrations.ts` has
  no v1→v2 entry, `K.teammates` was added additively without a SCHEMA_VERSION bump
  (src/storage/keys.ts:54 doc comment), and `runMigrations` preserves existing
  `seededAt` across boots (migrations.ts:88-92 spreads `...meta`).

  The reset path (Test 10) succeeds because `ResetDemoDataModal.tsx:93-97` wipes
  all `halo:v*` keys including `halo:v1:meta` — re-opening Gate 1 for the next
  boot. This is the differential signal proving the seeder logic is correct and
  the failure is isolated to gate-state persistence.

fix:
verification:
files_changed: []
