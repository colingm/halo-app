---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-06-PLAN.md (route guards + signup shell + five placeholder pages + router wiring)
last_updated: "2026-05-14T15:55:37.223Z"
last_activity: 2026-05-14
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 16
  completed_plans: 14
  percent: 88
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-13)

**Core value:** A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.
**Current focus:** Phase 02 — registration-sign-in

## Current Position

Phase: 02 (registration-sign-in) — EXECUTING
Plan: 9 of 10
Status: Ready to execute
Last activity: 2026-05-14

Progress: [█████████░] 88%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01 P02 | 8min | - tasks | - files |
| Phase 01 P01-03 | 8min | 3 tasks | 10 files |
| Phase 01 P04 | 16min | 3 tasks | 7 files |
| Phase Phase 01 PPlan 05 | 15min | - tasks | - files |
| Phase 01 P06 | 8 | 2 tasks | 9 files |
| Phase 01 P06 | 8 | 3 tasks | 9 files |
| Phase 02 P01 | 2min | 2 tasks | 5 files |
| Phase 02 P02 | 25min | 2 tasks | 6 files |
| Phase Phase 02 PP03 | 4min | 2 tasks tasks | 5 files files |
| Phase 02 P04 | 4min | 1 tasks | 2 files |
| Phase 02 P05 | 4min | 2 tasks | 3 files |
| Phase Phase 02 PP06 | 7min | 2 tasks | 10 files |
| Phase 02 P07 | 6min | 1 tasks | 4 files |
| Phase 02 P08 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Init: React 18 + Vite + TypeScript + Mantine 7 + Recharts + Zustand + RHF/Zod stack settled (see research/STACK.md). Phase-1 researcher updated to React 19 + Mantine 9 + Router 7 + Zod 4 + Zustand 5 + Vite 8 (CLAUDE.md explicitly allowed "or 19.x if stable"; Mantine 9 forces React 19).
- Init: Horizontal-layers project mode chosen — selector registry and versioned localStorage envelope land in Phase 1 before any page is built
- Init: Multi-step registration ships as four distinct URLs (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`)
- 2026-05-13: User decision — defer all Pendo *runtime* (PEN-01..06) to a new end-of-milestone Phase 6 ("Pendo Install & Wiring"). Phases 1–5 build a Pendo-*ready* app (selector registry, `data-pendo-id` markup contract, SVG-only charting convention, masked-input primitive with `.pendo-sr-ignore` class) without any live Pendo wiring. Provider stack reserves the `PendoBridge` slot as a no-op pass-through stub.
- [Phase ?]: FND-07 satisfied: provider stack assembled as thin Phase 1 stubs (Storage→Auth→Workspace→PendoBridge); each phase replaces provider body without touching App.tsx
- [Phase ?]: 01-05: react-router@7.15 installed (unified react-router package); two-layout route split (/ PublicLayout + /app AppLayout); DemoBanner on public layout only; Phase 6 PendoRouteBridge slot reserved via TODO comments
- [Phase ?]: PasswordInput applies .pendo-sr-ignore CSS class (NOT data-pendo-mask attribute) per Pendo SDK 2.324.0 verified source
- [Phase 02-01]: Kept multi-line type-alias shape on new primitives (mirrors Phase 1 TextInput.tsx canonical); Task 2 single-line AC regex documented as plan-internal inconsistency in 02-01-SUMMARY Deviations
- [Phase 02-01]: signup.* PENDO_IDS organized by step number (step1..step4) not URL slug — registry mirrors wizard narrative regardless of URL choices
- [Phase ?]: Phase 02-02: Zod 4 idiomatic z.iso.datetime + chained z.string().min(1, msg).email(msg) preferred over deprecated z.string().datetime() (only chained form attaches distinct empty-vs-malformed messages)
- [Phase ?]: Phase 02-02: User = Visitor as structural type alias (not interface re-export); AuthProvider keeps its inline narrower User until Plan 02-05 rewrites it — types coexist safely
- [Phase ?]: Phase 02-02: Form-step + signin schemas not re-exported through storage barrel; uniqueness + credential-mismatch errors are page-handler concerns, not Zod refinements
- [Phase ?]: Phase 02-03: authRepo enforces zero direct localStorage.* — every read goes through readWithSchema(K.x(), XSchema, []) so corrupt/tampered values fall through to [] (FND-04 compliance, smoke-asserted)
- [Phase ?]: Phase 02-03: createVisitor returns Visitor with only passwordHash — TypeScript-enforced via explicit destructure + Visitor return type; smoke asserts no plaintext in returned record nor in stored JSON
- [Phase ?]: Phase 02-03: nanoid@^5.1.11 pinned; supplies Visitor.id and Workspace.id (locks CLAUDE.md 'nanoid for Pendo visitor+account IDs' contract for Phase 6 PendoBridge)
- [Phase ?]: Phase 02-04: wizardSession.ts is the sole accessor of sessionStorage[K.signupDraft()] — mirrors localStorage codec's never-throw + safeParse-or-fallback contract for the sessionStorage backend
- [Phase ?]: Phase 02-04: writeWizardDraftStep generic param named Step (not K) to avoid shadowing the imported K storage-key-builder — TypeScript silent-shadow trap caught at design time
- [Phase ?]: Phase 02-04: hasStep is a pure predicate (no I/O) treating '' and [] as 'not provided' so a tabbed-through empty step doesn't trip the Wave 3 deep-link gate; callers pass in a pre-read draft
- [Phase ?]: Phase 02-05: Zustand 5.0.13 chosen over 4.5.x; React 19 / Mantine 9 / Zustand 5 line consistent with Phase 1 stack update
- [Phase ?]: Phase 02-05: Hand-rolled setSession/clearSession over zustand persist middleware to keep FND-04 codec uniformity (readWithSchema for hydration, writeJSON/removeKey for writes)
- [Phase ?]: Phase 02-05: Module-init hydrateAuthFromStorage() call ensures route guards see isAuthenticated on first render (AUTH-10 ordering invariant); mirrors Plan 01-03's runMigrations() placement
- [Phase ?]: Phase 02-05: Single 'invalid_credentials' failure variant in signInWithCredentials defends against username enumeration via API surface (T-02-21)
- [Phase ?]: Phase 02-05: Orphan-session self-heal during hydration removes bad session keys pointing at missing visitors/workspaces (defensive against DevTools edits / stale demo state)
- [Phase ?]: Phase 02-06: Route guards subscribe directly to useAuthStore (single-slice selector) rather than useAuth() — removes AuthProvider-ordering dependency and limits re-renders to isAuthenticated boolean flips
- [Phase ?]: Phase 02-06: RequireAnon explicitly skips / and /sandbox — signed-in users can still visit the public landing and primitive sandbox per UI-SPEC
- [Phase ?]: Phase 02-06: Phase 2 ships zero ?next= return-URL surface (T-02-26 mitigate-by-avoidance); future-phase contract documented in RequireAuth.tsx JSDoc
- [Phase ?]: Phase 02-06: SignupShell Stepper active index derived from useLocation().pathname not form state — refresh on /signup/company always shows step 3 highlighted
- [Phase ?]: Phase 02-06: One PENDO_IDS.signup.step1.signinAnchor reused across all four signup steps — the registry intentionally defines exactly one signin-anchor
- [Phase ?]: Phase 02-06: /app uses two-level RequireAuth → pathless AppLayout → AppPlaceholder route nesting so AppLayout contributes its Outlet without claiming a URL segment
- [Phase ?]: Phase 02-07: @hookform/resolvers@^5.2.2 chosen over plan's literal ^3/^4 — resolvers@5 ships first-class Zod 4 typing via zod/v4/core; @3/@4 reference Zod 3 types only. Plan explicitly authorizes 'pin whatever works against Zod 4.4.3'.
- [Phase ?]: Phase 02-07: src/ui/primitives/Button.tsx typed props extended with React.ButtonHTMLAttributes<HTMLButtonElement> so type='submit' type-checks. Mirrors Anchor wrapper's HTML-attrs pattern. Mantine Button polymorphic typing surfaces button attrs at runtime but not statically — needed for <form onSubmit> participation.
- [Phase ?]: Phase 02-07: Duplicate-email error uses a string-compare against EMAIL_DUPLICATE_MESSAGE rather than a parallel form-state flag — keeps conditional inline <Anchor>Sign in instead?</Anchor> render branchable from form.formState alone; locked message text becomes load-bearing and is documented explicitly.
- [Phase ?]: Phase 02-07: RHF useForm mode 'onSubmit' (not onBlur/onChange) — UI-SPEC explicitly locks 'validates on Next' rhythm. Per-keystroke validation rejected by the rhythm spec.
- [Phase ?]: Phase 02-08: RHF + Mantine controlled-input bridge for Select/NumberInput uses form.watch + form.setValue (not Controller) — shorter, mirrors plan reference snippet verbatim
- [Phase ?]: Phase 02-08: defaultValues typed via 'as Partial<StepNValues> as StepNValues' double cast — canonical RHF + Zod-strict-mode escape when spreading partial sessionStorage slice into RHF's DeepPartial-strict TFieldValues
- [Phase ?]: Phase 02-08: Step-gate Navigate placed in page body, not React Router loader — keeps Plan 02-06's router config free of per-step gate logic; replace=true on Navigate so browser back doesn't bounce user into gated page
- [Phase ?]: Phase 02-08: Step 3 prior-step gate redirects to /signup (wizard root) on EITHER step1 OR step2 miss — not partial recovery to /signup/details. SessionStorage retention ensures re-entering at /signup resumes from the missing step
- [Phase ?]: Phase 02-08: Back button styled variant=default (gray-bordered) over variant=subtle — UI-SPEC permits either; default reads as 'secondary button' (more conventional wizard Back affordance) vs subtle's tertiary ghost-button feel

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Verify current Pendo agent API surface against `support.pendo.io` at phase start — specifically snippet template, SPA route-tracking API (`pendo.location.setUrl` vs `pendo.pageLoad`), and Session Replay mask attribute name
- Phase 1: Pin exact npm package versions via `npm view <pkg> version` at install time (stack research ran without network access)

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-14T15:55:04.911Z
Stopped at: Completed 02-06-PLAN.md (route guards + signup shell + five placeholder pages + router wiring)
Resume file: None
