---
phase: 2
plan: 6
subsystem: auth-routing
tags: [auth, routing, route-guards, signup-wizard, signin, react-router]
requires:
  - src/auth/authStore.ts (Plan 02-05)
  - src/auth/AuthProvider.tsx (Plan 02-05)
  - src/auth/useAuth.ts (Plan 02-05)
  - src/auth/authRepo.ts (Plan 02-03)
  - src/auth/wizardSession.ts (Plan 02-04)
  - src/auth/passwordHash.ts (Plan 02-03)
  - src/auth/schemas.ts (Plan 02-02)
  - src/auth/types.ts (Plan 02-02)
  - src/pendo/PENDO_IDS.ts (Plan 02-01)
  - src/ui/primitives/index.ts (Plan 02-01)
  - src/routes/public/PublicLayout.tsx (Plan 01-05)
  - src/routes/app/AppLayout.tsx (Plan 01-05)
provides:
  - "RequireAuth route guard (redirects to /signin when signed-out)"
  - "RequireAnon route guard (redirects to /app when signed-in)"
  - "src/auth barrel — single import target for Wave 3 page plans"
  - "SignupShell layout — Container + Stepper + Paper + Outlet"
  - "Five placeholder page files at stable paths Wave 3 replaces by body only"
  - "Five registered routes: /signup, /signup/details, /signup/company, /signup/preferences, /signin"
  - "RequireAuth wrap on /app/*"
affects:
  - src/router.tsx (extended with five new public routes + guard wrappers)
tech-stack:
  added: []
  patterns:
    - "Route-guard wrapper-route pattern: { Component: RequireAuth, children: [...] } — React Router v7 idiom for declarative auth boundaries"
    - "Pathless layout route: AppLayout sits under RequireAuth as a wrapper without a `path` key so its <Outlet /> still mounts the index child"
    - "Single-slice Zustand selector for guard subscription: useAuthStore((s) => s.isAuthenticated) — re-renders only when the boolean flips"
    - "Pathname-driven Stepper active index via useLocation() — visual stays in sync with URL regardless of form state"
key-files:
  created:
    - src/auth/RequireAuth.tsx
    - src/auth/RequireAnon.tsx
    - src/auth/index.ts
    - src/routes/public/signup/SignupShell.tsx
    - src/routes/public/signup/Step1AccountPage.tsx
    - src/routes/public/signup/Step2DetailsPage.tsx
    - src/routes/public/signup/Step3CompanyPage.tsx
    - src/routes/public/signup/Step4PreferencesPage.tsx
    - src/routes/public/SignInPage.tsx
  modified:
    - src/router.tsx
decisions:
  - "Guards subscribe directly to useAuthStore (not via useAuth()) so they work regardless of AuthProvider mount ordering"
  - "RequireAnon does NOT wrap / or /sandbox — signed-in users may still visit the public landing and the primitives sandbox"
  - "Phase 2 explicitly ships zero `?next=` return-URL surface (T-02-26 mitigate-by-avoidance) — any future addition must validate the supplied path starts with /app/"
  - "Auth barrel includes `export * from './schemas'` and `export * from './types'` (file IS the surface); curated named exports for everything else"
  - "Stepper carries one data-pendo-id at the container root; per-step circles are NOT tagged (Mantine re-renders internals)"
  - "SignInPage owns its own Container + Paper (NOT a child of SignupShell) — sign-in is not part of the wizard"
metrics:
  duration: 7min
  tasks_completed: 2
  files_created: 9
  files_modified: 1
  completed: 2026-05-14
---

# Phase 2 Plan 6: Route Guards and Router Wiring Summary

`RequireAuth` and `RequireAnon` route guards plus the `src/auth` barrel land the auth-routing seam; `SignupShell` + five placeholder pages + a router extension complete the Phase 2 routing surface so Wave 3 only fills in page bodies.

## What Shipped

### Task 1 — Route guards and auth barrel (commit `7c5e902`)

Two route-guard components and a single-source barrel:

- **`src/auth/RequireAuth.tsx`** — `<Navigate to="/signin" replace />` when `isAuthenticated === false`; `<Outlet />` (or children) otherwise. Single-slice subscription to `useAuthStore((s) => s.isAuthenticated)`. No `useLocation`, no `?next=` query-string handling — Phase 2 explicitly defers return-URL preservation. Inline JSDoc explains the future-phase contract: any added return-URL parameter MUST validate `/app/` prefix to defend against open-redirect.
- **`src/auth/RequireAnon.tsx`** — mirror of `RequireAuth` with `<Navigate to="/app" replace />` and the inverse condition.
- **`src/auth/index.ts`** — re-exports `AuthProvider`, `AuthContext`, `AuthContextValue`, `useAuth`, `useAuthStore`, `hydrateAuthFromStorage`, `SignInResult`, `RequireAuth`, `RequireAnon`, `hashPassword`, `verifyPassword`, `readWizardDraft`, `writeWizardDraftStep`, `clearWizardDraft`, `hasStep`, plus `export * from './authRepo' | './schemas' | './types'`. Wave 3 page plans import everything via `from '../../auth'`.

### Task 2 — SignupShell + five placeholders + router wiring (commit `c58e768`)

- **`src/routes/public/signup/SignupShell.tsx`** — Mantine `<Container size="sm" py="xl">` with a vertical `<Stack gap="lg">` containing:
  1. `<Title order={1}>Create your Halo account</Title>` (rendered only on the `/signup` index — UI-SPEC: "On steps 2–4 the Display title is replaced by the Stepper as page identity")
  2. `<Stepper active={pathToStepIndex(pathname)} data-pendo-id={PENDO_IDS.signup.stepper}>` with four `<Stepper.Step label="…">` entries (`Account`, `About you`, `Company`, `Setup`)
  3. `<Paper withBorder radius="md" p="xl">` wrapping the `<Outlet />` so each child step renders inside the form card
  4. Trailing `<Text size="sm" c="dimmed" ta="center">Already have an account? <Anchor>Sign in</Anchor></Text>` — the Anchor uses `PENDO_IDS.signup.step1.signinAnchor` across all four steps (the registry defines exactly one signin-anchor under step1).

  `pathToStepIndex(pathname)` is a pure local helper: `'/signup' | '/signup/' → 0`, `startsWith('/signup/details') → 1`, etc. Defaults to `0` on unknown paths (defensive — unreachable in practice).

- **Five placeholder page files** at the stable paths Wave 3 plans will replace:

| Plan | File | `<Title order={2}>` (locked verbatim) | Wave 3 owner |
|------|------|---------------------------------------|---------------|
| 02-06 | `src/routes/public/signup/Step1AccountPage.tsx` | `Create your Halo account` | Plan 02-07 |
| 02-06 | `src/routes/public/signup/Step2DetailsPage.tsx` | `A bit about you` | Plan 02-08 |
| 02-06 | `src/routes/public/signup/Step3CompanyPage.tsx` | `About your company` | Plan 02-08 |
| 02-06 | `src/routes/public/signup/Step4PreferencesPage.tsx` | `Set up your workspace` | Plan 02-09 |
| 02-06 | `src/routes/public/SignInPage.tsx` | `Welcome back` (rendered as `<Title order={1}>`; SignInPage owns its own Container + Paper) | Plan 02-10 |

  Each step page is 17–22 lines (placeholder body + 4-line JSDoc); SignInPage is 22 lines.

- **`src/router.tsx`** — preserved the two top-level routes (`/` PublicLayout, `/app` AppLayout) and extended:

  ```tsx
  // Under '/' (PublicLayout) — RequireAnon wrapper-route:
  {
    Component: RequireAnon,
    children: [
      {
        path: 'signup',
        Component: SignupShell,
        children: [
          { index: true, Component: Step1AccountPage },
          { path: 'details', Component: Step2DetailsPage },
          { path: 'company', Component: Step3CompanyPage },
          { path: 'preferences', Component: Step4PreferencesPage },
        ],
      },
      { path: 'signin', Component: SignInPage },
    ],
  }

  // /app — RequireAuth wraps an AppLayout pathless layout-route:
  {
    path: '/app',
    Component: RequireAuth,
    children: [
      {
        Component: AppLayout,
        children: [{ index: true, Component: AppPlaceholder }],
      },
    ],
  }
  ```

  `/` (Landing) and `/sandbox` remain DIRECT children of PublicLayout — NOT inside the `RequireAnon` wrapper — so signed-in users can still visit them per UI-SPEC.

## Key Decisions

- **Direct store subscription in guards.** `RequireAuth` / `RequireAnon` read `useAuthStore((s) => s.isAuthenticated)` instead of `useAuth()`. Eliminates one indirection and removes any AuthProvider-mount-ordering ambiguity. The AuthProvider stays for `useAuth()` consumers (legacy + ergonomic), but guards don't depend on it.
- **Single-slice selector.** Selecting just the `isAuthenticated` boolean means unrelated store changes (e.g., swapping `currentVisitor` after a fresh sign-in) don't re-render the guard — only the boolean flip does. Mitigates T-02-29.
- **No `?next=` surface.** Phase 2 ships zero return-URL handling. Threat T-02-26 dispositioned `mitigate (by avoidance)`. The JSDoc on `RequireAuth.tsx` carries the future-phase contract.
- **`RequireAnon` skips `/` and `/sandbox`.** UI-SPEC explicitly excludes the public landing and primitive sandbox from the signed-in redirect — they remain reachable as `/` (Landing) and `/sandbox` (PrimitivesSandbox) for everyone.
- **Pathless layout route under `RequireAuth`.** `/app/*` mounts as `RequireAuth → (no-path) AppLayout → AppPlaceholder`. Lets `AppLayout` contribute its shell `<Outlet />` without claiming a URL segment that would conflict with `path: '/app'`.
- **One shared `signin-anchor` PENDO_ID for all four steps.** The "Already have an account? Sign in" anchor at the bottom of the shell uses `PENDO_IDS.signup.step1.signinAnchor` across `/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`. The registry defines exactly one signin-anchor (under step1) — this is intentional; per-step IDs would be a registry change, not a shell change.

## Deviations from Plan

**1. [Rule 1 — Doc copy] `next` keyword in JSDoc tripped the locked AC grep.**

- **Found during:** Task 1 verification gate.
- **Issue:** The locked acceptance criterion runs `grep -E "useLocation|next" src/auth/RequireAuth.tsx src/auth/RequireAnon.tsx` and asserts no matches. My initial JSDoc explained the `?next=` deferral using the literal word "next" three times, which made the grep light up even though no code references `useLocation` or `next`.
- **Fix:** Paraphrased the JSDoc to say "return-URL query parameter" / "supplied value" without using the literal "next". The defensive future-phase contract is preserved (the doc still spells out the `/app/` prefix requirement and the threat-register reference).
- **Files modified:** `src/auth/RequireAuth.tsx`
- **Commit:** `7c5e902` (the fix was applied before the Task 1 commit landed).

**2. [Rule 1 — Doc copy] `SignInPage.tsx` JSDoc pushed it over the 25-line cap.**

- **Found during:** Task 2 verification gate (`wc -l`).
- **Issue:** Locked AC says each placeholder page file must be under 25 lines (`wc -l`); my first draft of `SignInPage.tsx` was 28 lines because of an 11-line JSDoc explaining the layout choice.
- **Fix:** Compressed the JSDoc from a 4-paragraph explanation to a 4-line summary — same load-bearing facts (placeholder until 02-10, owns own Container + Paper, not a SignupShell child). Final file is 22 lines.
- **Files modified:** `src/routes/public/SignInPage.tsx`
- **Commit:** `c58e768` (fix applied before the Task 2 commit landed).

No other deviations. No Rule 2 (missing critical) or Rule 3 (blocking) findings. No Rule 4 (architectural) decisions encountered. No authentication gates needed.

## TDD Gate Compliance

Plan task frontmatter is `tdd="true"` for both tasks. The Halo project's existing TDD convention (Phase 1 + Phase 2 Plans 02-01..05) uses `tsx`-run `*.smoke.ts` scripts under `src/<module>/__tests__/` for **pure-logic** modules only (`passwordHash`, `wizardSession`, `authRepo`, `schemas`). React component files (provider, guards, page shells) are exercised through the locked CLI gate (`npm run typecheck && npm run build`) plus the executor-manual `npm run dev` behavior checklist — not via Node smoke scripts (no React rendering harness is installed).

Plan 02-06 ships only React components, not pure-logic modules: `RequireAuth.tsx`, `RequireAnon.tsx`, `SignupShell.tsx`, five page placeholders, `router.tsx`. Following the same convention as Plan 02-05 (which also ships a React component — `AuthProvider.tsx` — and has no test file), no `*.smoke.ts` was added. The acceptance gate is met by: typecheck (passes), build (passes), source-level grep AC (passes), and behavioral verification documented in the plan's "Behavior (executor-only manual)" checklist.

## Verification Results

- `npm run typecheck` — exits 0 (both Task 1 and Task 2 boundaries).
- `npm run build` — exits 0; production bundle now ~446KB (was ~437KB pre-plan; +9KB for the five page placeholders + shell + guards).
- All source-level grep ACs pass: `Navigate, Outlet` imports from `'react-router'`; `useAuthStore((s) => s.isAuthenticated)` selector; `to="/signin"` / `to="/app"`; `replace`; barrel exports for all 11 logical surface items; SignupShell uses `useLocation`, `<Stepper>`, `data-pendo-id={PENDO_IDS.signup.stepper}`, `<Container size="sm">`; router registers all five new paths (`signup` / `details` / `company` / `preferences` / `signin`) wrapped in `RequireAnon`; `/app` wrapped in `RequireAuth`.
- `src/App.tsx` byte-for-byte unchanged (`git diff --name-only HEAD -- src/App.tsx | wc -l` returns 0).
- Page-file line counts: 18, 17, 17, 18, 22 (all under 25).

Behavioral verification (executor-only manual, per plan) — listed for the orchestrator's record; full visual sign-off happens in the UI checker:

- `/signup` (signed-out): DemoBanner → `<Title order={1}>Create your Halo account</Title>` → Stepper `active={0}` → Paper with Step1 placeholder body.
- `/signup/details`: no Display title; Stepper `active={1}`; `<Title order={2}>A bit about you</Title>`.
- `/signup/company`: Stepper `active={2}`; `<Title order={2}>About your company</Title>`.
- `/signup/preferences`: Stepper `active={3}`; `<Title order={2}>Set up your workspace</Title>`.
- `/signin`: `<Title order={1}>Welcome back</Title>` in a Paper; no Stepper.
- `/app` (signed-out): silent redirect to `/signin`.
- `/signup` (signed-in): silent redirect to `/app`.
- `/sandbox` and `/`: reachable regardless of auth state.

## Routes Now Reachable

After this plan, every URL listed in AUTH-01 is a registered route and every redirect listed in AUTH-12 is in place:

| Path | Component chain | Guard | Phase 2 owner |
|------|-----------------|-------|----------------|
| `/` | PublicLayout → Landing | (none) | Phase 1 |
| `/sandbox` | PublicLayout → PrimitivesSandbox | (none) | Phase 1 |
| `/signup` | PublicLayout → RequireAnon → SignupShell → Step1AccountPage | RequireAnon | Plan 02-07 (Wave 3) |
| `/signup/details` | PublicLayout → RequireAnon → SignupShell → Step2DetailsPage | RequireAnon | Plan 02-08 (Wave 3) |
| `/signup/company` | PublicLayout → RequireAnon → SignupShell → Step3CompanyPage | RequireAnon | Plan 02-08 (Wave 3) |
| `/signup/preferences` | PublicLayout → RequireAnon → SignupShell → Step4PreferencesPage | RequireAnon | Plan 02-09 (Wave 3) |
| `/signin` | PublicLayout → RequireAnon → SignInPage | RequireAnon | Plan 02-10 (Wave 3) |
| `/app` | RequireAuth → AppLayout → AppPlaceholder | RequireAuth | Phase 3 |

## Self-Check

- [x] FOUND: `src/auth/RequireAuth.tsx`
- [x] FOUND: `src/auth/RequireAnon.tsx`
- [x] FOUND: `src/auth/index.ts`
- [x] FOUND: `src/routes/public/signup/SignupShell.tsx`
- [x] FOUND: `src/routes/public/signup/Step1AccountPage.tsx`
- [x] FOUND: `src/routes/public/signup/Step2DetailsPage.tsx`
- [x] FOUND: `src/routes/public/signup/Step3CompanyPage.tsx`
- [x] FOUND: `src/routes/public/signup/Step4PreferencesPage.tsx`
- [x] FOUND: `src/routes/public/SignInPage.tsx`
- [x] MODIFIED: `src/router.tsx`
- [x] FOUND: commit `7c5e902` (Task 1)
- [x] FOUND: commit `c58e768` (Task 2)

## Self-Check: PASSED
