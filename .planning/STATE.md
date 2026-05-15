---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 5 context gathered
last_updated: "2026-05-15T20:21:52.372Z"
last_activity: 2026-05-15 -- Phase 05 execution started
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 35
  completed_plans: 29
  percent: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-13)

**Core value:** A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.
**Current focus:** Phase 05 — Team, Help & Polish

## Current Position

Phase: 05 (Team, Help & Polish) — EXECUTING
Plan: 1 of 6
Status: Executing Phase 05
Last activity: 2026-05-15 -- Phase 05 execution started

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 23
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |
| 2 | 10 | - | - |
| 03 | 6 | - | - |
| 04 | 7 | - | - |

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
| Phase 02 P09 | 6min | 1 tasks | 1 files |
| Phase 02 P10 | 4min | 1 tasks | 1 files |
| Phase 03 P01 | 1min | 2 tasks | 3 files |
| Phase 03-authenticated-shell-dashboard P03 | 2m | 2 tasks | 2 files |
| Phase 03 P06 | 20min | 2 tasks | 2 files |
| Phase 03-authenticated-shell-dashboard P05 | 3 | 2 tasks | 3 files |
| Phase 04 P01 | 3min 2sec | 2 tasks | 6 files |
| Phase 04 P02 | 4min 49sec | 2 tasks | 13 files |
| Phase 04 PP03 | 11min 26sec | 2 tasks | 8 files |
| Phase 04 P04 | 5min 38sec | 2 tasks | 5 files |
| Phase 04 PP05 | 7min 8sec | 2 tasks tasks | 6 files files |
| Phase 04-core-pages-lists-settings-reports P04-06 | 15min | 5 tasks | 6 files |
| Phase 04 P07 | 8min | 4 tasks | 6 files |

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
- [Phase ?]: Phase 02-09: 7-step wizard completion sequence locked — readWizardDraft+parse defense-in-depth → createVisitor (hashes internally) → createWorkspace → useAuthStore.signInFromVisitor → clearWizardDraft → navigate('/app',{replace:true}); any throw routes to single generic Alert path
- [Phase ?]: Phase 02-09: MultiSelect 3-cap is belt-and-suspenders — Mantine maxValues={3} (UI hint, disables further selection) + Zod .max(3,'Pick up to three.') (validation surfaces locked copy if UI is bypassed)
- [Phase ?]: Phase 02-09: submitError state typed as literal union (null | 'generic_failure') not string — narrows surface at TYPE level so future contributors can't accidentally render leaked error strings (T-02-42 information-disclosure mitigation lives in the type)
- [Phase ?]: Phase 02-09: Plan task marked tdd=true but project has no test framework installed (CLAUDE.md: Vitest optional, not installed). Phase 2 pattern (02-07/02-08 also tdd=true) treats grep+typecheck+build as static contract; manual wizard walk verifies behavior. No RED/GREEN commits in git history for this plan, mirroring Phase 2 precedent.
- [Phase ?]: Phase 02-10: credError local state typed as null | 'invalid_credentials' literal union — narrows Alert content at type level; mirrors Plan 02-09 submitError T-02-42 mitigation pattern
- [Phase ?]: Phase 02-10: Direct useAuthStore.getState().signInWithCredentials call from submit handler (no hook subscription in page body) — one-shot store action; RequireAnon from Plan 02-06 handles already-signed-in case via store subscription
- [Phase ?]: Phase 02-10: Sign-in password-empty error 'Enter your password.' owned by Plan 02-02 signinSchema (distinct from step1Schema's 'Enter a password.'); page does not override schema-level copy — UI-SPEC single source of truth
- [Phase ?]: Phase 02-10: AUTH-11 visible Sign-out button deferred to Phase 3 per UI-SPEC; Phase 2 verifies handler end-to-end via useAuthStore.getState().signOut() console invocation (clears halo:v1:session + in-memory store + halo:v1:signup:draft). All 12 AUTH-* requirements addressed across plans 02-01..10
- [Phase ?]: Phase 03-06: Moved all hooks before early returns (Rules of Hooks compliance); tasks useMemo guards workspaceId with ternary fallback to []
- [Phase ?]: Phase 03-06: recharts 3.8.1 compatible with plan specs - same AreaChart/PieChart API as 2.x; no migration needed
- [Phase ?]: Phase 04-01: defaultColorScheme="auto" + Mantine v9 inline ColorSchemeScript wires real dark-mode boot (localStorage[mantine-color-scheme-value] + prefers-color-scheme fallback); Preferences SegmentedControl in 04-04 will be a one-line useMantineColorScheme().setColorScheme() consumer
- [Phase ?]: Phase 04-01: Pinned @mantine/dates 9.2.1 + @mantine/notifications 9.2.1 (matching @mantine/core@9.2.0 major), @tanstack/react-table 8.21.3 (D-01 single-table-primitive), dayjs 1.11.20 (peer + D-21/D-23 consumer); zero peer warnings against React 19, zero npm audit findings
- [Phase ?]: Phase 04-01: <Notifications /> mounted as FIRST child of MantineProvider (before StorageProvider) — sibling renderer per Mantine v9 docs, NOT a Halo provider; FND-07 Storage->Auth->Workspace->PendoBridge chain preserved verbatim
- [Phase ?]: Phase 04-01: PENDO_IDS lists/settings/reports namespaces appended verbatim from 04-UI-SPEC lines 886-972; 57 new leaves; Leaves<T> derivation picks them up automatically; existing namespaces (layout, sandbox, signup, signin, nav, topbar, dashboard, comingSoon) untouched
- [Phase ?]: Phase 04-02: tasksRepo.updateTask owns the completedAt invariant (D-09) — status→done stamps now-ISO, off-done clears null; UI code never touches completedAt. createTask gains symmetric stamping when input.status==='done' and completedAt is null.
- [Phase ?]: Phase 04-02: authRepo.updateVisitor / updateWorkspace use structural Omit<> on patch types (passwordHash, ownerVisitorId, id, createdAt excluded) — T-04-02-01 mitigation lives in the type system per Phase 2 T-02-42 precedent. Neither stamps updatedAt because VisitorSchema / WorkspaceSchema have no updatedAt field.
- [Phase ?]: Phase 04-02: TaskFormSchema uses raw z.enum([...], { message: '...' }) at the form level instead of reusing persistence enums TaskStatusEnum/TaskPriorityEnum — persistence enums stay message-less so corrupt-storage Zod errors don't surface user-facing copy. Form schema co-located with TaskSchema in src/tasks/schemas.ts (mirrors auth/schemas.ts step1..step4 co-location with VisitorSchema).
- [Phase ?]: Phase 04-02: computeNowRef extracted from Dashboard.tsx into src/tasks/now-ref.ts (D-22) — shared between Dashboard (Phase 3) and ReportsPage (Phase 4). Dashboard imports directly from '../tasks/now-ref' mirroring its existing direct-module-import precedent for formatRelative.
- [Phase ?]: Phase 04-02: Checkbox primitive wrapper forwards BOTH pendoId (required → data-pendo-id) and optional taskId (→ data-pendo-task-id) — implements CLAUDE.md dynamic-list parameterization rule for the Lists row complete-toggle. Multi-prop forwarding shape modeled on PasswordInput.tsx.
- [Phase ?]: Phase 04-03: TaskTable uses presorted input (createdAt desc) + empty initial SortingState — three-state header click cycle (asc → desc → clear → return to default presorted order)
- [Phase ?]: Phase 04-03: TaskFormModal uses RHF controlled 'values' prop so flipping mode/initialTask between create and edit opens cleanly re-defaults the form
- [Phase ?]: Phase 04-03: Mantine v9 DatePickerInput returns DateStringValue (YYYY-MM-DD); form bridges via new Date(value).toISOString() so persisted dueDate matches z.iso.datetime(). Display value uses currentDueDate.slice(0,10)
- [Phase ?]: Phase 04-03: FilteredEmptyState uses raw Mantine <Anchor component='button'> with explicit data-pendo-id — Halo wrapper doesn't expose Mantine polymorphic 'component' prop. S3 exception, value still from PENDO_IDS
- [Phase ?]: Phase 04-03: D-11 modal-on-modal avoidance — TaskFormModal Delete button calls onClose() FIRST then onRequestDelete?.(task); parent setDeleteTarget opens DeleteConfirmModal next tick. React batches so only one modal visible at a time
- [Phase ?]: Phase 04-04: Settings form schemas (ProfileFormSchema, WorkspaceFormSchema) defined locally inside each tab module — single-consumer form-only .pick() lenses stay local; src/auth/schemas.ts co-location pattern is for schemas that are both form-step and persistence
- [Phase ?]: Phase 04-04: SettingsPage parseTab(rawTab) extracted as a named whitelist function over VALID_TABS — T-04-04-02 tampering mitigation lives in the named function, not an inlined ternary
- [Phase ?]: Phase 04-04: Reset handler uses two-pass collect-then-remove over localStorage.key(i) (modifying during iteration shifts indices); sessionStorage.removeItem wrapped in try/catch (T-04-04-05 private-browsing mitigation)
- [Phase ?]: Phase 04-04: SET-05 deferral marker comments placed in ProfileTab.tsx + WorkspaceTab.tsx onSubmit success branches — Phase 6 greps 'SET-05 deferred to Phase 6' to find both call sites in one command
- [Phase ?]: Phase 04-04: Compile-time canary blocks (_ROLE_OPTIONS_TYPECHECK etc.) typed against form-values inferred types lock local Select option arrays to upstream Zod enums — Phase 5 enum extension that forgets to update local options fails at typecheck
- [Phase ?]: Phase 04-05: ReportsPage composes ReportsFiltersBar + ReportsChart + ReportsTable + Export CSV button; filteredTasks useMemo runs ANDed predicate (createdAt range / assignee.id / status includes()) + presort createdAt desc so TanStack default ordering matches without re-sort
- [Phase ?]: Phase 04-05: Made src/ui/primitives/DatePickerInput.tsx generic over Mantine DatePickerType (defaulted to 'default' for backwards compat) — Reports type='range' callers now narrow value/onChange tuple shape correctly; Lists TaskFormModal type='default' callers unaffected (Rule 3 fix)
- [Phase ?]: Phase 04-05: ReportsChart resolves all colors via useMantineTheme() + useComputedColorScheme — indigo[6]->indigo[4] swap for in_progress in dark scheme; zero hardcoded hex in src/reports/ (verified by grep); D-18 dark-mode contract satisfied end-to-end
- [Phase ?]: Phase 04-05: Hand-rolled RFC 4180 CSV in src/reports/csvExport.ts — quoter handles comma/newline/double-quote (doubled-escape); no library; Blob+URL.createObjectURL+ephemeral <a download>+URL.revokeObjectURL sequence; filename halo-tasks-YYYY-MM-DD.csv via dayjs(); empty assignee renders as empty string in CSV body (not em-dash)
- [Phase ?]: Phase 04-05: ReportsTable shares TaskTable.module.css cell-padding module rather than duplicating — plan task body authorizes 'pick whichever is simpler'; both tables sit under the same UI-SPEC Spacing rule (var(--mantine-spacing-sm) var(--mantine-spacing-md))
- [Phase ?]: Phase 04-05: Empty status filter (deselect-all-three Status options) is a deliberate empty-state trigger — filteredTasks predicate returns false when statusFilter.length===0; chart shows empty buckets, table shows compact 'No tasks match these filters' state, Export CSV disabled
- [Phase ?]: Phase 04-07: keepMounted={false} chosen for TaskFormModal create-mode reset — one-line fix, no useEffect timing risk, RHF cleanup implicit on unmount
- [Phase ?]: Phase 04-07: prevStatus field added as TaskStatusEnum.optional().nullable() — no SCHEMA_VERSION bump per D-26; additive+backwards-compatible with legacy tasks
- [Phase ?]: Phase 04-07: UAT 2b resolved as doc-only fix — two-pass collect-then-remove in ResetDemoDataModal was already correct; planning_context live-mutation framing was a misread

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

Last session: 2026-05-15T19:25:20.557Z
Stopped at: Phase 5 context gathered
Resume file: .planning/phases/05-team-help-polish/05-CONTEXT.md
