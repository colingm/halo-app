---
status: resolved
phase: 05-team-help-polish
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md]
started: 2026-05-15T23:49:33Z
updated: 2026-05-16T01:52:20Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Clear ephemeral state if you wish (fresh incognito or DevTools → Application → Clear storage). Run `npm run dev` and load the app. The dev server boots without errors, the app loads, sign-in works, and once signed in the Team page shows the Owner row plus 8–12 faker teammates (seedAll coordinator ran cleanly on first paint).
result: issue
reported: "There was no seeded data on the Team page. The \"Invite teammate\" popup kept the values from the previous invite if clicked multiple times without a full refresh"
severity: major

### 2. Typography Gestalt — Six-page consistency (UAT-01)
expected: Visit Dashboard → Lists → Reports → Settings → Team → Help in sequence, in BOTH light and dark mode. Font weight, size, line height, and heading hierarchy feel consistent across all six pages. No page reads as heavier or lighter than its siblings. Halo could pass for a real B2B SaaS in a screenshot.
result: pass

### 3. Team Page — Dark Mode Readability (UAT-02)
expected: Switch to dark mode (Settings → Preferences). Navigate to /app/team. Table cells, the yellow "Invited" badge, the Owner row, avatar initials, and the role Select all remain readable. No white-on-white or gray-on-gray collisions.
result: pass

### 4. Invite Teammate Modal — Dark Mode Recolor (UAT-03)
expected: In dark mode, click "Invite teammate". The modal background, email TextInput, role Select, and footer buttons all recolor cleanly. No raw light-mode colors leaking through.
result: issue
reported: "Error appeared in console: \"In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error.\""
severity: major

### 5. Help Page — Article Row Hover + Dark Mode (UAT-04)
expected: In dark mode, navigate to /app/help and hover over article rows. Hover state is visible (gray tint or anchor underline) WITHOUT an indigo tint on the row background. The no-results state text (after typing a non-matching query) is readable.
result: pass

### 6. Help Detail Page — Article Body Readability (UAT-05)
expected: Click any article row → /app/help/:slug. Body paragraphs render as distinct Text blocks with adequate spacing between them. The article looks like a real help-center article (even with faker lorem ipsum). Topic + title hierarchy is clear; back link works.
result: pass

### 7. Pendo DevTools Spot-Check — Team Row (UAT-06)
expected: Right-click a non-Owner row's role Select → Inspect. The Select's input carries data-pendo-id="team.row.role-select" AND data-pendo-teammate-id="<uuid>". The Owner row carries the same data-pendo-id with the Select disabled (Mechanism A).
result: issue
reported: "There is no Owner row on the Team page"
severity: major

### 8. Pendo DevTools Spot-Check — Help Article Row (UAT-07)
expected: Right-click a Help article row → Inspect. The element carries data-pendo-id="help.article.row" AND data-pendo-article-slug="<slug>".
result: pass

### 9. Pendo DevTools Spot-Check — PasswordInput Class (UAT-08)
expected: Sign out, go to sign-in. Right-click the password input → Inspect. The <input type="password"> element has a class list that contains "pendo-sr-ignore".
result: pass

### 10. Reset Demo Data — Re-seed Cycle (UAT-09)
expected: Settings → Preferences → "Reset demo data" → Confirm. Re-register or sign in. Navigate to /app/team — Owner row appears at top, faker teammates below. Open /app/lists — task assignees are drawn from the re-seeded teammate list (no ghost assignees from the prior seed).
result: pass
note: Reset+re-seed cycle works — this isolates Issues 1 and 7 to the cold-start path against pre-existing localStorage state (meta.seededAt already stamped before Phase 5 introduced teammate seeding).

### 11. Lists Form Reset on Reopen (UAT-10, Phase 4 carry-over)
expected: Sign in → Lists → click "New task" → type a title → submit. Click "New task" again. The form opens with blank defaults (no leftover title from the previous create).
result: pass

## Summary

total: 11
passed: 8
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Team page shows Owner row plus 8–12 faker teammates on first paint after a fresh sign-in (seedAll coordinator ran cleanly)"
  status: resolved
  reason: "User reported: There was no seeded data on the Team page"
  severity: major
  test: 1
  root_cause: "src/seed/seedAll.ts:60 uses a single global meta.seededAt gate (K.meta() = 'halo:v1:meta' — not workspace- or domain-scoped). Pre-Phase-5 installs have a non-null seededAt stamped by the old tasksSeed.ts tail; on cold start the coordinator short-circuits BEFORE seedTeammatesIfNeeded runs. K.teammates(workspaceId) never gets written. No migration nulls the stale stamp (migrations.ts:36-39 is empty, SCHEMA_VERSION still 1, K.teammates added additively at keys.ts:52-54). Test 10 passes because ResetDemoDataModal wipes halo:v* keys (including meta), re-opening Gate 1."
  artifacts:
    - path: "src/seed/seedAll.ts"
      issue: "Single global meta.seededAt gate at line 60 short-circuits before per-domain seeders"
    - path: "src/storage/keys.ts"
      issue: "K.meta() at line 36 is global, not domain-scoped; K.teammates added additively at 52-54 without SCHEMA_VERSION bump"
    - path: "src/storage/migrations.ts"
      issue: "Empty migration registry (line 36-39); no v1→v2 migration to reconcile pre-Phase-5 state"
  missing:
    - "Per-domain seeding ledger (e.g., meta.seededDomains: { tasks?: ts; teammates?: ts }) OR a SCHEMA_VERSION=2 migration nulling meta.seededAt once"
    - "seedAll should check per-domain state before invoking each seeder, not gate the whole coordinator on one global flag"
  debug_session: ".planning/debug/05-team-seed-missing-cold-start.md"
  shared_root_cause_with: "Gap 4 (test 7) — same fix resolves both"

- truth: "Invite teammate modal opens with blank defaults on every reopen (form state resets between opens)"
  status: resolved
  reason: "User reported: The \"Invite teammate\" popup kept the values from the previous invite if clicked multiple times without a full refresh"
  severity: major
  test: 1
  root_cause: "InviteTeammateModal initializes useForm once and never calls form.reset() between opens. TeamPage:91-96 renders <InviteTeammateModal> unconditionally (not gated on inviteOpen), so the useForm hook survives every open/submit/close cycle. The line-16 doc comment claiming keepMounted={false} drops RHF state is incorrect — keepMounted controls only Mantine's internal transitioned-content DOM, not the outer React component holding the hook. Phase 4 fixed the equivalent bug in TaskFormModal (CR-01, lines 149-165) with a prevOpenedRef + open-transition useEffect calling form.reset(defaultValues); Phase 5 ported the doc comment but not the fix."
  artifacts:
    - path: "src/team/components/InviteTeammateModal.tsx"
      issue: "Missing open-transition form.reset(defaultValues) effect; misleading doc comment at line 16; onSubmit at 73-102 never calls reset"
    - path: "src/tasks/components/TaskFormModal.tsx"
      issue: "Reference precedent at lines 149-165 — the established pattern that should have been ported"
  missing:
    - "Hoist inline defaultValues into a useMemo-stabilized object"
    - "Add prevOpenedRef + useEffect that calls form.reset(defaultValues) on the false→true opened transition (mirror TaskFormModal:158-165)"
    - "Correct the line-16 doc comment to reflect the actual reset mechanism"
  debug_session: ".planning/debug/05-invite-modal-state-leak.md"

- truth: "Invite teammate modal renders valid HTML with no heading-nesting hydration errors in the console"
  status: resolved
  reason: "User reported: Error appeared in console: \"In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error.\""
  severity: major
  test: 4
  root_cause: "InviteTeammateModal.tsx:108 passes title={<Title order={3}>Invite teammate</Title>} to Mantine's <Modal>. Mantine's ModalBaseTitle renders the title slot as <Box component='h2' /> — hard-coded, no prop to override. Result: <h2><h3>Invite teammate</h3></h2>. The Plan 04 SUMMARY's claim that this follows a 'Phase 4 modal-nesting fix' precedent is the opposite of reality — TaskFormModal:273 passes a plain string, as do ResetDemoDataModal:128 and DeleteConfirmModal:48. grep 'title={<' src/ returns exactly one match: InviteTeammateModal.tsx:108. Bug bounded to this single file."
  artifacts:
    - path: "src/team/components/InviteTeammateModal.tsx"
      issue: "Line 108 passes <Title order={3}> JSX to Modal title prop, wrapping h3 inside Mantine's hard-coded h2"
    - path: ".planning/phases/05-team-help-polish/05-04-SUMMARY.md"
      issue: "Line 52 'patterns-established' entry misstates the Phase 4 precedent; should be corrected"
  missing:
    - "Replace title={<Title order={3}>Invite teammate</Title>} with title=\"Invite teammate\""
    - "Remove unused Title import from @mantine/core on line 23"
    - "Correct the 05-04-SUMMARY.md patterns-established line so future modals follow the string-title precedent"
  debug_session: ".planning/debug/05-invite-modal-h3-in-h2.md"

- truth: "Team page renders an Owner row representing the signed-in visitor at the top of the table"
  status: resolved
  reason: "User reported: There is no Owner row on the Team page"
  severity: major
  test: 7
  root_cause: "SHARED root cause with Gap 1 (test 1) — same bug. The seedAll gate at src/seed/seedAll.ts:60 short-circuits before seedTeammatesIfNeeded runs, so the Owner row (constructed correctly at teamSeed.ts:112-125 from useAuthStore.getState().currentVisitor) never gets written. Visitor hydration timing is NOT the issue — authStore.ts:173 hydrateAuthFromStorage runs at module-init before React renders. TeamTable.tsx:47-60 sort/filter logic is innocent — if Owner row were in K.teammates, it would render. TeamPage.tsx:79 falls through to TeamEmptyState branch."
  artifacts:
    - path: "src/seed/seedAll.ts"
      issue: "Same gate as Gap 1 — line 60 short-circuits the coordinator before the Owner-row-bearing seeder runs"
    - path: "src/team/teamSeed.ts"
      issue: "Owner-row construction at 112-125 is correct (proven by Test 10 pass); cannot self-rescue from coordinator short-circuit"
  missing:
    - "Co-resolved by the fix for Gap 1 (per-domain seeding ledger OR schema migration nulling meta.seededAt)"
  debug_session: ".planning/debug/05-team-owner-row-missing.md"
  shared_root_cause_with: "Gap 1 (test 1) — same fix resolves both"
