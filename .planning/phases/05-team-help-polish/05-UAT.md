---
status: complete
phase: 05-team-help-polish
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md]
started: 2026-05-15T23:49:33Z
updated: 2026-05-16T00:02:00Z
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
  status: failed
  reason: "User reported: There was no seeded data on the Team page"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Invite teammate modal opens with blank defaults on every reopen (form state resets between opens)"
  status: failed
  reason: "User reported: The \"Invite teammate\" popup kept the values from the previous invite if clicked multiple times without a full refresh"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Invite teammate modal renders valid HTML with no heading-nesting hydration errors in the console"
  status: failed
  reason: "User reported: Error appeared in console: \"In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error.\""
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Team page renders an Owner row representing the signed-in visitor at the top of the table"
  status: failed
  reason: "User reported: There is no Owner row on the Team page"
  severity: major
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
