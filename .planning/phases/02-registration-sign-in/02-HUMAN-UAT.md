---
status: partial
phase: 02-registration-sign-in
source: [02-VERIFICATION.md]
started: 2026-05-14T18:05:00Z
updated: 2026-05-14T18:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-end signup wizard completion in a real browser
expected: Each step lives at its own URL (/signup, /signup/details, /signup/company, /signup/preferences). After Step 1 Continue, DevTools sessionStorage panel shows `halo:v1:signup:draft` value contains `step1` slice WITHOUT a `password` field. Stepper visual updates to match current step. After "Create account" on Step 4: redirected to /app; localStorage has new `halo:v1:visitors` + `halo:v1:workspaces` + `halo:v1:session` entries; `halo:v1:signup:draft` removed from sessionStorage. Persisted Visitor's `passwordHash` is a 64-char hex string, NOT plaintext.
result: [pending]

### 2. Refresh-mid-wizard password re-entry behavior
expected: On Step 2/3/4 with prior steps completed, refreshing the browser clears the in-memory plaintext password; user must re-enter Step 1 because completion requires `getWizardPassword()` to return non-null. On Step 4 without the in-memory password, "Create account" triggers the generic failure Alert.
result: [pending]

### 3. Browser back/forward navigation through wizard steps preserves typed input
expected: Type partial values on Step 2, click "Back" without submitting, then "Continue" from Step 1 again — Step 2's previously typed-but-unsubmitted values are restored (per UI-SPEC `Back does NOT re-validate` rule).
result: [pending]

### 4. Stepper visual highlight matches current /signup/* URL
expected: Navigating to each of /signup, /signup/details, /signup/company, /signup/preferences directly highlights the matching Stepper indicator (1/2/3/4).
result: [pending]

### 5. RequireAuth flash-of-signin check on refresh of /app
expected: Sign in, then hard-refresh on /app (Cmd+Shift+R / Ctrl+Shift+F5) — no visual flash of /signin before /app renders (synchronous module-init `hydrateAuthFromStorage()` populates store before React first paints).
result: [pending]

### 6. Sign-out flow end-to-end via DevTools console
expected: While signed-in, run `useAuthStore.getState().signOut()` in DevTools console — localStorage `halo:v1:session` removed; sessionStorage `halo:v1:signup:draft` removed; visiting /app redirects to /signin. (Top-bar Sign-out button is deferred to Phase 3 per UI-SPEC.)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
