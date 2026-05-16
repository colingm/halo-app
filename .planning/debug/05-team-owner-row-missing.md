---
status: diagnosed
trigger: "There is no Owner row on the Team page (Test 7, UAT 05)"
created: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Focus

hypothesis: Same root cause as the broader "no seeded data on Team page" gap — seedAll's primary idempotency gate (`meta.seededAt !== null`) short-circuits on the cold-start path because `K.meta()` is a GLOBAL key (not workspace-scoped) and was stamped by Phase 3's tasksSeed before Phase 5 introduced teammate seeding. The Owner row code itself is functional (Test 10 reset+re-seed proved it), but the entire seedTeammatesIfNeeded() function is never invoked, so Owner row construction never happens.
test: Confirmed via code reading (seedAll.ts:59-60, teamSeed.ts:103-104, keys.ts:36)
expecting: Diagnosis complete — single root cause for both Test 1 and Test 7 gaps
next_action: Return ROOT CAUSE FOUND block

## Symptoms

expected: Team page renders Owner row representing signed-in visitor at top of /app/team table. teamSeed.ts reads useAuthStore.getState().currentVisitor and adds Owner-Visitor row first, then 8-12 faker teammates with non-Owner roles.
actual: "There is no Owner row on the Team page" (Test 7 UAT report)
errors: none reported in user input
reproduction: Test 7 — sign in with pre-existing localStorage state, navigate to /app/team — Owner row missing
started: Discovered 2026-05-15 during /gsd-verify-work for Phase 5

Related signals:
- Test 1 also failed with "no seeded data on the Team page" (broader gap)
- Test 10 (reset + re-seed) passed — Owner row appeared after fresh reset
- Failure is specific to cold-start path against pre-existing localStorage

## Eliminated

- hypothesis: TeamTable rendering/sort bug — Owner row exists in K.teammates but the component hides or misorders it
  evidence: TeamTable.tsx:47-60 sorts Owner first; TeamPage.tsx:79 falls back to EmptyState only when teammates.length === 0. Component is structurally correct.
  timestamp: 2026-05-15

- hypothesis: visitor-not-hydrated race — seedDemoData runs from AppLayout useEffect before useAuthStore.getState().currentVisitor is populated, so the Owner row conditional (teamSeed.ts:113) takes the null branch while faker rows still seed
  evidence: authStore.ts:173 invokes hydrateAuthFromStorage() at MODULE-INIT level (before React renders). AppLayout's useEffect cannot fire before module-init code completes. Additionally, even if visitor WERE null, faker rows would still be written; the Test 1 report says NO seeded data at all, which is incompatible with a partial seed.
  timestamp: 2026-05-15

- hypothesis: separate bug from the broader "no seeded data" gap
  evidence: Both failures trace to the exact same line (seedAll.ts:60 — the meta.seededAt gate). Test 10's note in the UAT confirms the shared cold-start failure mode. Tests 1 and 7 are two symptoms of one bug.
  timestamp: 2026-05-15

## Evidence

- checked: src/storage/keys.ts:34-36
  found: `K.meta()` returns `halo:v1:meta` — a GLOBAL key (no workspaceId qualifier). One stamp gates ALL workspaces and ALL domain seeders forever.
  implication: Any prior seedAll run (or Phase 3 tasksSeed when it still owned the stamp) stamps meta.seededAt permanently. Phase 5's teammate seeder will never run against pre-existing storage with that stamp set.

- checked: src/seed/seedAll.ts:55-72
  found: Primary gate is `if (meta.seededAt !== null) return` at line 60, BEFORE either domain seeder is invoked. Both seedTeammatesIfNeeded (line 64) and seedTasksIfNeeded (line 67) are short-circuited together.
  implication: When the cold-start path encounters a pre-Phase-5 stamped meta, BOTH seeders are skipped. No Owner row, no faker teammates, no fresh tasks. This explains why Test 1 ("no seeded data on the Team page") and Test 7 ("no Owner row") share a single failure mode.

- checked: src/team/teamSeed.ts:100-137
  found: seedTeammatesIfNeeded() has its own meta gate at lines 103-104 (`if (meta.seededAt !== null) return`) BEFORE the Owner-row construction block (lines 112-125). Owner row uses `useAuthStore.getState().currentVisitor` synchronously — visitor IS hydrated at module-init in authStore.ts:173 well before AppLayout's useEffect fires, so the visitor-null race (hypothesis 2) is NOT the cause.
  implication: The function is structurally correct. It just never runs on the cold-start path because of the upstream gate.

- checked: src/auth/authStore.ts:149-173
  found: hydrateAuthFromStorage() runs at MODULE-INIT level (bare call at line 173). It populates currentVisitor + currentWorkspace synchronously before any React render. AppLayout.tsx:80-82's useEffect fires AFTER hydration is complete.
  implication: Hypothesis 2 (visitor-not-hydrated race) is ELIMINATED. Visitor is guaranteed present when seedDemoData runs.

- checked: src/team/components/TeamTable.tsx:47-60
  found: orderedTeammates useMemo filters by `workspaceRole === 'Owner'` first, then active non-Owner, then invited. If Owner row exists in K.teammates, it WOULD render first. The component has no defensive code that hides Owner — if the data is absent, the component does its job correctly (renders nothing for that bucket).
  implication: Hypothesis 3 (TeamTable rendering/sort bug) is ELIMINATED. The component is innocent.

- checked: src/routes/app/team/TeamPage.tsx:41-49
  found: teammates = listTeammates(workspaceId) via useMemo. When K.teammates(workspaceId) is empty, `teammates.length === 0` is true and the TeamEmptyState branch (line 79) renders — NOT the TeamTable.
  implication: Test 7 user actually saw the EmptyState, but reported it as "no Owner row" because they expected the table with Owner + teammates. Both reports (Test 1 "no seeded data" and Test 7 "no Owner row") describe the same underlying state: K.teammates(workspaceId) is an empty array, which causes the empty-state render path.

- checked: 05-UAT.md tests 1 + 7 + 10
  found: Test 1 (cold start) failed, Test 7 (cold start) failed, Test 10 (reset + re-seed) PASSED. Test 10's "Reset demo data" path must clear meta.seededAt (or the entire meta key), which is why a fresh sign-in afterwards exercises the seeder cleanly.
  implication: This is conclusive proof that the seeder logic itself works; the failure is exclusively on the cold-start-with-existing-meta path. UAT Test 10's note explicitly says: "Reset+re-seed cycle works — this isolates Issues 1 and 7 to the cold-start path against pre-existing localStorage state (meta.seededAt already stamped before Phase 5 introduced teammate seeding)." The UAT author already pointed at the root cause.

## Resolution

root_cause: SHARED with the broader "no seeded data on Team page" gap. The seedAll coordinator (src/seed/seedAll.ts:55-72) uses a single GLOBAL `meta.seededAt` flag as its primary idempotency gate at line 60. `K.meta()` (src/storage/keys.ts:36) returns `halo:v1:meta` with no workspace qualifier and no domain qualifier — one stamp gates everything forever. On any system that ran Phase 3 (which previously owned the meta.seededAt stamp inside tasksSeed.ts) before Phase 5 introduced teammate seeding, `meta.seededAt` is already non-null. When AppLayout's useEffect (src/routes/app/AppLayout.tsx:80-82) calls seedDemoData(workspace.id), the gate at seedAll.ts:60 short-circuits before seedTeammatesIfNeeded is ever invoked. K.teammates(workspaceId) remains empty, TeamPage falls through to the TeamEmptyState branch (TeamPage.tsx:79), and the user sees no Owner row and no teammates. Test 7's "no Owner row" and Test 1's "no seeded data on the Team page" are two reports of the same empty-state render.
fix: (not applied — diagnose-only mode)
verification: (not applied — diagnose-only mode)
files_changed: []
