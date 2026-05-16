---
status: partial
phase: 05-team-help-polish
source: [05-VERIFICATION.md]
started: 2026-05-15T22:00:00Z
updated: 2026-05-15T22:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Cold-start against pre-Phase-5 localStorage — team page populates without Reset
expected: Set `halo:v1:meta` to `{schemaVersion:1,seededAt:'2026-01-01T00:00:00.000Z',appVersion:'0.1.0'}` in DevTools, remove any `halo:v1:teammates:*` key, hard-refresh, sign in. `/app/team` shows Owner row + 8–12 teammates. `halo:v1:meta` now contains `seededDomains` with both `tasks` and `teammates` entries.
result: [pending]

### 2. Invite teammate modal — blank defaults on every reopen after submit
expected: Submit an invite. Reopen the modal. Email is blank, role is Member. No leftover values from previous invite.
result: [pending]

### 3. Invite teammate modal — blank defaults on every reopen after cancel
expected: Fill email + role, then click Cancel (or Escape). Reopen the modal. Fields are blank.
result: [pending]

### 4. No h3-in-h2 console error when opening Invite teammate modal
expected: DevTools Console shows NO message containing `In HTML, <h3> cannot be a child of <h2>`.
result: [pending]

### 5. Typography gestalt — UAT-01
expected: Dashboard / Lists / Reports / Settings / Team / Help look visually uniform in both light and dark mode.
result: [pending]

### 6. Team page dark mode cell + badge readability — UAT-02
expected: Table cells, Invited badge, Owner row, avatar initials, role Select all readable in dark mode.
result: [pending]

### 7. Invite teammate modal dark mode recolor — UAT-03
expected: Modal background, TextInput, Select, footer buttons recolor cleanly in dark mode.
result: [pending]

### 8. Help page article row hover + dark mode — UAT-04
expected: Hover state visible without indigo tint on row background. No-results text readable.
result: [pending]

### 9. Help detail page article body readability — UAT-05
expected: Body paragraphs render as distinct blocks with adequate spacing. Looks like a real help article.
result: [pending]

### 10. Pendo DevTools spot-check — Team row — UAT-06
expected: Role Select carries `data-pendo-id='team.row.role-select'` AND `data-pendo-teammate-id='<uuid>'`.
result: [pending]

### 11. Pendo DevTools spot-check — Help article row — UAT-07
expected: Element carries `data-pendo-id='help.article.row'` AND `data-pendo-article-slug='<slug>'`.
result: [pending]

### 12. Pendo DevTools spot-check — PasswordInput class — UAT-08
expected: The `<input type='password'>` DOM element has class containing `pendo-sr-ignore`.
result: [pending]

### 13. Reset demo data re-seed cycle — UAT-09
expected: Settings → Reset → re-sign-in → `/app/team` shows Owner + teammates; `/app/lists` shows tasks with team assignees.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps
