---
phase: 04-core-pages-lists-settings-reports
verified: 2026-05-15T15:44:30Z
status: gaps_found
score: 5/5 success criteria observable in code; 18/19 PLAN requirements satisfied (SET-05 deferred to Phase 6 per CONTEXT D-XX); 3 BLOCKER date-handling defects from 04-REVIEW.md remain unaddressed
overrides_applied: 0
re_verification:
  previous_status: null
  previous_score: null
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "At /app/reports the date filter and chart bucketing agree on which day a task belongs to, and dueDate displays the day the user actually picked."
    status: failed
    reason: |
      Three BLOCKER findings from the standalone code review (04-REVIEW.md CR-01,
      CR-02, CR-03) describe user-visible date-handling defects that compromise
      Success Criterion #4 ("the user can filter task data by date range ...
      view in TanStack Table"). The Phase 4 success criteria are written as
      observable behaviors; if a user west of UTC picks a dueDate and sees the
      previous day rendered in the Lists table and CSV export, the SC is not
      observably met. Similarly, the ReportsChart bucketing and ReportsPage
      date-range filter use mismatched timezone conventions, so tasks can drop
      off the chart while remaining in the table for the same filter — REP-01
      and REP-02 disagree on the underlying filter semantics.

      CR-03 (deselect-all → silent empty state with no recovery affordance) is
      a smaller behavioral gap: the user can reach a dead-end without any
      "Clear filters" anchor on the Reports empty state, in contrast to the
      Lists FilteredEmptyState which provides one.

      Note: the verify instructions explicitly state these REVIEW findings are
      advisory "unless they directly invalidate a success criterion." CR-01 and
      CR-02 directly invalidate SC #4 (filter + table observability) and SC #1
      (Lists CRUD persistence as users see it — the persisted dueDate prints
      wrong in the table). CR-03 invalidates SC #4's "user can filter ... view
      in TanStack Table" because the user can be stranded with no rows + no
      recovery.
    artifacts:
      - path: "src/tasks/components/TaskFormModal.tsx"
        issue: "handleDueDateChange writes `new Date('YYYY-MM-DD').toISOString()` which serializes UTC midnight; subsequent local-time display shifts the day west of UTC (CR-01)."
      - path: "src/tasks/components/TaskTable.tsx"
        issue: "Due date cell uses `dayjs(value).format('MMM D, YYYY')` (local time) — pairs with UTC-anchored ISO from write side to render the wrong day (CR-01)."
      - path: "src/reports/ReportsTable.tsx"
        issue: "Due-date AND Completed-at cells use local-time `dayjs(value).format(...)` (CR-01)."
      - path: "src/reports/csvExport.ts"
        issue: "CSV serializer uses `dayjs(t.dueDate).format('YYYY-MM-DD')` (local time) — same off-by-one (CR-01)."
      - path: "src/reports/ReportsChart.tsx"
        issue: "Day-bucket key `dayjs(t.createdAt).format('YYYY-MM-DD')` is local time (CR-02)."
      - path: "src/routes/app/reports/ReportsPage.tsx"
        issue: "Date-range filter uses local-time `.startOf('day')`/`.endOf('day')` while the date inputs round-trip through UTC midnight, producing filter-vs-chart disagreement (CR-02). Status filter line 86 returns false when statusFilter.length===0 with no recovery affordance (CR-03)."
      - path: "src/reports/ReportsTable.tsx"
        issue: "Empty-state row has no Clear-filters anchor (CR-03 partner finding)."
    missing:
      - "UTC-anchored read formatting (e.g., `dayjs(value).utc().format('MMM D, YYYY')` with `dayjs.extend(utc)` at boot) at every dueDate/completedAt render site."
      - "Aligned timezone convention in ReportsChart bucketing and ReportsPage date-range predicate (suggest UTC to match Dashboard.tsx)."
      - "Either treat empty statusFilter as `match-all` (smallest change, matches Lists `All` sentinel idiom) or surface a Clear-filters affordance in the Reports empty state."
deferred:
  - truth: "Pendo identify (or metadata update) fires when Profile/Workspace settings are saved (SET-05)."
    addressed_in: "Phase 6"
    evidence: |
      ROADMAP §"Phase 6: Pendo Install & Wiring" success criterion #3 explicitly
      states: "On successful registration (end of signup wizard) and on sign-in,
      `pendo.identify` fires exactly once with visitor metadata ...; on workspace
      switch or profile/workspace settings save, `pendo.identify` (or
      `updateOptions`) re-fires with the updated metadata."

      CONTEXT.md "Out of scope (deferred — see <deferred>)" includes
      "`pendo.identify` re-fire on Settings save (SET-05) — Phase 6 owns Pendo
      runtime."

      Deferral markers in code (verified by grep):
        - src/settings/ProfileTab.tsx — "SET-05 (pendo.identify on save) deferred to Phase 6 per CONTEXT.md"
        - src/settings/WorkspaceTab.tsx — "SET-05 deferred to Phase 6 — pendo.identify (or pendo.updateOptions ...)"
human_verification:
  - test: "Lists CRUD round-trip in browser"
    expected: "Sign in, navigate to /app/lists; create a task → toast appears + row visible; edit it → row reflects update; toggle checkbox → status badge flips to Done; refresh page → mutation survives; delete → confirm modal opens → row removed."
    why_human: "Requires running dev server with an authenticated session; localStorage persistence + Mantine modal animations + toast notifications cannot be observed by static grep. The smoke matrix recorded in 04-03-SUMMARY.md presumes a human did this."
  - test: "Reset demo data round-trip"
    expected: "Settings → Preferences → Danger zone → Reset demo data → confirm; page reloads to /, the user is signed out, halo:v1:* keys are gone from localStorage, mantine-color-scheme-value survives, sessionStorage signup draft is wiped."
    why_human: "Requires live dev session, DevTools localStorage inspection across the hard reload, and verification that the Mantine theme key was preserved."
  - test: "Theme toggle propagation"
    expected: "Settings → Preferences → toggle Light/Dark/System → AppShell, Dashboard, Lists, Reports, Settings itself all recolor immediately; reload page → preference persists via mantine-color-scheme-value localStorage key."
    why_human: "Visual confirmation across multiple pages; static grep cannot verify Mantine CSS-var resolution actually paints the dark surface."
  - test: "Reports CSV download cross-browser"
    expected: "Reports → Export CSV → file `halo-tasks-YYYY-MM-DD.csv` downloads in Chrome; opening in Excel/Numbers/Sheets shows the 6 columns, RFC 4180 quoting on commas/quotes, dates as YYYY-MM-DD, filename matches today's date."
    why_human: "Requires Blob + URL.createObjectURL execution in a live browser plus opening the result in a spreadsheet to verify quoting behavior under real consumer software."
  - test: "Reports date-range timezone correctness (regression for CR-01/CR-02 fix)"
    expected: "On a machine in any non-UTC timezone, pick a due date of 'May 15, 2026' on a task → save → reopen task in edit modal → picker shows May 15 → Lists table cell shows 'May 15, 2026' (not May 14). On Reports, filter dateRange to a 7-day window → chart bar count + table row count match for that range."
    why_human: "CR-01/CR-02 cannot be reproduced without (a) a non-UTC timezone on the running machine and (b) interactive date picking; both blockers are behavioral defects only observable via live user flow."
---

# Phase 4: Core Pages (Lists, Settings, Reports) Verification Report

**Phase Goal:** "The three highest-leverage interactive pages ship — Lists (task CRUD), Settings (profile/workspace/preferences), and Reports (filtered task data with SVG chart + CSV export). Settings save handlers persist to localStorage; Pendo metadata sync (PEN-04) is added in Phase 6."

**Verified:** 2026-05-15T15:44:30Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Lists page supports full CRUD + sort by column + filter by status/priority/assignee + friendly empty state + persistence | VERIFIED (with CR-01 caveat on dueDate display) | `src/routes/app/lists/ListsPage.tsx` composes `TaskTable` (TanStack v8 with 7 columns + per-column sort), `TaskFiltersBar` (3 Selects), `TaskFormModal` (RHF + Zod via `zodResolver(TaskFormSchema)`), `DeleteConfirmModal`, `ListsEmptyState` + `FilteredEmptyState`. Wiring traced: TaskFormModal → `createTask`/`updateTask`, leading checkbox → `updateTask`, DeleteConfirmModal → `deleteTask`. Persistence routes through `tasksRepo` → `writeJSON(K.tasks(workspaceId))` (`src/tasks/tasksRepo.ts`). |
| 2 | Settings page edits Profile / Workspace / Preferences across three tabs; saves persist to localStorage | VERIFIED | `src/routes/app/settings/SettingsPage.tsx` reads `?tab=` via `useSearchParams`; whitelist defaults to `'profile'`. ProfileTab + WorkspaceTab use RHF + `zodResolver(VisitorSchema.pick(...))` / `WorkspaceSchema.pick(...)`; submit calls `updateVisitor` / `updateWorkspace` then `useAuthStore.setState({ currentVisitor / currentWorkspace })`. Repo write path: `authRepo.ts` → `writeJSON(K.visitors())`, `writeJSON(K.workspaces())`. |
| 3 | "Reset demo data" button in Settings with destructive confirmation clears every `halo:v1:*` key and reloads to public landing | VERIFIED | `src/settings/ResetDemoDataModal.tsx`: scans `localStorage.key(i)` for `halo:v` prefix, removes each; wraps `sessionStorage.removeItem(K.signupDraft())` in try/catch; deliberately does NOT touch `mantine-color-scheme-value`; `window.location.href = '/'`. PreferencesTab renders Danger zone Paper + button that opens the modal. |
| 4 | Reports lets the user filter task data by date range + at least one other dimension, shows TanStack Table ≥5 columns + ≥1 SVG chart, exports filtered CSV via client-side Blob | VERIFIED (with CR-01/CR-02/CR-03 caveats) | `src/routes/app/reports/ReportsPage.tsx` composes `ReportsFiltersBar` (DatePickerInput range + Assignee Select + Status MultiSelect), `ReportsChart` (Recharts BarChart, SVG), `ReportsTable` (TanStack v8 with 6 read-only columns: Title/Status/Priority/Assignee/Due date/Completed at), Export CSV button → `exportTasksToCsv(filteredTasks)` → hand-rolled RFC 4180 quoter → Blob + `URL.createObjectURL` + ephemeral `<a download>` + `revokeObjectURL`. Filename `halo-tasks-${dayjs().format('YYYY-MM-DD')}.csv`. Date-handling defects flagged separately in gaps. |
| 5 | Every interactive element on Lists / Settings / Reports carries a stable `data-pendo-id` from the `PENDO_IDS` registry | VERIFIED | `src/pendo/PENDO_IDS.ts` exposes `lists.*`, `settings.*`, `reports.*` namespaces (verified leaf strings match 04-UI-SPEC). Every wrapped primitive (`Button`, `TextInput`, `Select`, `MultiSelect`, `Textarea`, `Checkbox`, `DatePickerInput`) requires `pendoId: PendoId`. Audit: `grep -rE 'data-pendo-id="[a-z][^"]*"' src/routes/app/{lists,settings,reports}/ src/tasks/components/ src/settings/ src/reports/` returns 0 hand-typed strings. The direct `data-pendo-id={...}` attribute appears only on Mantine slot components (`<Tabs.Tab>`, `<Menu.Item>`, `<ActionIcon>`, `<SegmentedControl>`, polymorphic `<Anchor>`) where the value is still sourced from `PENDO_IDS.*`. |

**Score:** 5/5 truths verified at the page-composition level. Two truths (#1, #4) carry caveats from the standalone code review's BLOCKER findings on date handling.

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | SET-05: Pendo identify / metadata-sync on Settings save | Phase 6 | ROADMAP Phase 6 SC #3: "...on workspace switch or profile/workspace settings save, `pendo.identify` (or `updateOptions`) re-fires with the updated metadata." CONTEXT.md explicitly defers. Deferral markers present at both call sites in code. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | `@tanstack/react-table`, `@mantine/dates`, `@mantine/notifications`, `dayjs` deps installed | VERIFIED | All four present at pinned versions (`^8.21.3`, `^9.2.1`, `^9.2.1`, `^1.11.20`). |
| `src/App.tsx` | `defaultColorScheme="auto"` + `<Notifications />` mounted inside MantineProvider | VERIFIED | Both present and inside the FND-07 provider chain. |
| `index.html` | Real ColorSchemeScript reads `mantine-color-scheme-value` + falls back to `prefers-color-scheme` | VERIFIED | Inline IIFE script present; wraps localStorage in try/catch. |
| `src/pendo/PENDO_IDS.ts` | `lists`, `settings`, `reports` namespaces with all leaves from 04-UI-SPEC | VERIFIED | All expected leaves present including `'lists.modal.due-date'`, `'settings.profile.first-name'`, `'reports.chart.status-by-day'`, `'reports.csv-export'`. |
| `src/tasks/tasksRepo.ts` | `completedAt` invariant in `updateTask` + `createTask` symmetry | VERIFIED | `stamped.completedAt = new Date().toISOString()` on status→done and `stamped.completedAt = null` on status off-done. createTask stamps when `input.status === 'done' && input.completedAt == null`. |
| `src/auth/authRepo.ts` | `updateVisitor` + `updateWorkspace` with immutable-field omits | VERIFIED | Both exported; `Omit<Visitor, 'id' \| 'passwordHash' \| 'createdAt'>`, `Omit<Workspace, 'id' \| 'ownerVisitorId' \| 'createdAt'>` enforced structurally. |
| `src/tasks/schemas.ts` | `TaskFormSchema` | VERIFIED | Exported with six user-editable fields. |
| `src/tasks/labels.ts` | `TASK_STATUS_BADGE_COLOR` + `TASK_PRIORITY_BADGE_COLOR` | VERIFIED | Both exported with `Record<TaskStatus, string>` / `Record<TaskPriority, string>` exhaustive typing. |
| `src/tasks/now-ref.ts` | `computeNowRef` extracted as shared module | VERIFIED | Exported; Dashboard.tsx imports it (no inline duplicate). |
| `src/tasks/assigneeOptions.ts` | `getAssigneeOptions` helper | VERIFIED | Exported; consumed by TaskFiltersBar, TaskFormModal, ReportsFiltersBar. |
| `src/ui/primitives/{Checkbox,Textarea,DatePickerInput}.tsx` | Wrapped primitives with `pendoId: PendoId` | VERIFIED | All three present and exported via barrel; Checkbox additionally forwards `taskId`. |
| `src/routes/app/lists/ListsPage.tsx` | Real Lists page composer | VERIFIED | Full composer with state, modal orchestration, repo wiring. |
| `src/tasks/components/TaskTable.tsx` | TanStack Table v8 with 7 columns + sort | VERIFIED | All seven columns present (leading Checkbox / Title / Status / Priority / Assignee / Due date / trailing Actions). Per-column sort via `getCanSort` / `toggleSorting`. |
| `src/tasks/components/TaskFiltersBar.tsx` | Three Selects | VERIFIED | Status / Priority / Assignee, `clearable={false}`, default 'all'. |
| `src/tasks/components/TaskFormModal.tsx` | Shared create/edit modal | VERIFIED | Single component with `mode: 'create' \| 'edit'`. Uses `zodResolver(TaskFormSchema)`; Save disabled in edit mode iff not dirty. |
| `src/tasks/components/DeleteConfirmModal.tsx` | Destructive confirmation | VERIFIED | size="sm", color="red" Confirm. |
| `src/tasks/components/ListsEmptyState.tsx` + `FilteredEmptyState.tsx` | Two distinct empty states | VERIFIED | Hero (IconChecklist, company-name body) + compact in-table (Clear filters anchor). |
| `src/routes/app/settings/SettingsPage.tsx` | URL-driven 3-tab composer | VERIFIED | `useSearchParams` + whitelist; replace: false. |
| `src/settings/{ProfileTab,WorkspaceTab,PreferencesTab,ResetDemoDataModal}.tsx` | Four Settings sub-components | VERIFIED | All present with their documented contracts. |
| `src/routes/app/reports/ReportsPage.tsx` | Reports composer | VERIFIED | Filter state + filteredTasks memo + chart + table + CSV button. |
| `src/reports/{ReportsFiltersBar,ReportsChart,ReportsTable,csvExport}.{tsx,ts}` | Four Reports sub-components | VERIFIED | All present; csvExport is a pure utility module. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| TaskFormModal submit | tasksRepo.createTask / updateTask | RHF onSubmit | WIRED | `createTask(workspaceId, { ...values, completedAt: null })` and `updateTask(workspaceId, initialTask.id, values)` confirmed. |
| TaskTable Checkbox onChange | tasksRepo.updateTask | onToggleComplete callback | WIRED | `updateTask(workspaceId, task.id, { status: nextDone ? 'done' : 'todo' })` confirmed in ListsPage. |
| TaskFormModal | TaskFormSchema | zodResolver | WIRED | `useForm({ resolver: zodResolver(TaskFormSchema), ... })` confirmed. |
| ListsPage CRUD success | @mantine/notifications | notifications.show | WIRED | Three call sites confirmed: 'Task created' / 'Changes saved' (TaskFormModal) + 'Task deleted' (ListsPage). |
| ProfileTab submit | authRepo.updateVisitor + Zustand setState | onSubmit | WIRED | `updateVisitor(visitor.id, values)` + `useAuthStore.setState({ currentVisitor: updated })` confirmed. |
| WorkspaceTab submit | authRepo.updateWorkspace + Zustand setState | onSubmit | WIRED | `updateWorkspace(workspace.id, values)` + `useAuthStore.setState({ currentWorkspace: updated })` confirmed. |
| PreferencesTab SegmentedControl | useMantineColorScheme | value + onChange | WIRED | `{ colorScheme, setColorScheme } = useMantineColorScheme()`; SegmentedControl bound to both. |
| ResetDemoDataModal handleReset | window.location.href = '/' | hard reload | WIRED | Confirmed; preceded by halo:v* bulk wipe + sessionStorage signup-draft removal. |
| SettingsPage | react-router useSearchParams | ?tab= URL state | WIRED | `useSearchParams` from `'react-router'` imported and consumed. |
| ReportsPage | src/tasks/now-ref | computeNowRef import | WIRED | `import { computeNowRef } from '../../../tasks/now-ref'` confirmed; default dateRange uses it. |
| ReportsChart | useMantineTheme + useComputedColorScheme | theme-resolved colors | WIRED | Both hooks invoked; chart fills use `theme.colors.indigo[3/4/6]` / `theme.colors.gray[5/2]`. |
| csvExport | Blob + URL.createObjectURL | client-side download | WIRED | Full sequence (Blob → createObjectURL → ephemeral `<a>` → click → removeChild → revokeObjectURL). |
| ReportsFiltersBar Assignee | getAssigneeOptions | shared helper | WIRED | `[{ value: 'all', label: 'All' }, ...getAssigneeOptions(workspaceId, visitor)]`. |
| ReportsPage filtered memo | tasksRepo.listTasks | read filtered set | WIRED | `workspaceId ? listTasks(workspaceId) : []` inside useMemo. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| ListsPage.tsx | `allTasks` | `listTasks(workspaceId)` → `readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])` (`tasksRepo.ts`) | Yes — reads from localStorage; Phase 3 seeded ~60 tasks via `seedIfNeeded`. CRUD mutations flow back through `writeJSON`. | FLOWING |
| ProfileTab.tsx | `visitor` (form defaultValues) | `useAuthStore((s) => s.currentVisitor)` — Zustand store populated at auth-hydrate boot | Yes — store is hydrated from `K.visitors()` codec read at module init (Phase 2 lock). Saves write back via `updateVisitor` → `writeJSON(K.visitors(), next)` + `useAuthStore.setState`. | FLOWING |
| WorkspaceTab.tsx | `workspace` | `useAuthStore((s) => s.currentWorkspace)` | Yes — same hydration + write-back pattern as Profile. | FLOWING |
| PreferencesTab.tsx | `colorScheme` | `useMantineColorScheme()` — reads `localStorage[mantine-color-scheme-value]` via Mantine's provider | Yes — Mantine v9 persistence path; verified by `index.html`'s inline ColorSchemeScript reading the same key. | FLOWING |
| ReportsPage.tsx | `allTasks` | `listTasks(workspaceId)` (same source as ListsPage) | Yes | FLOWING |
| ReportsChart.tsx | `dayBuckets` | Computed from `tasks` prop (ReportsPage filtered slice) using `dayjs(t.createdAt).format('YYYY-MM-DD')` keys | Yes — but the local-time format key disagrees with the UTC-anchored dateRange filter (CR-02). Data flows; but the BUCKET assignment is timezone-incorrect. | FLOWING (with CR-02 timezone defect — flagged in gaps) |
| ReportsTable.tsx | `presorted` | Pre-sorted clone of `tasks` prop | Yes | FLOWING |
| csvExport.ts | `csv` string | Generated from `tasks` parameter via hand-rolled RFC 4180 serializer; smoke-tested the quoter against comma / quote / newline inputs and confirmed correct quoting | Yes — generates real CSV from real filtered data | FLOWING (CSV dueDate format inherits CR-01 if dueDate stored UTC-midnight + formatted local-time) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles | `npm run typecheck` | exit 0 (no errors) | PASS |
| Production build succeeds | `npm run build` | exit 0 (1,667 KB JS / 238 KB CSS produced) | PASS |
| Router wires the three pages | `grep -E "ListsPage\|SettingsPage\|ReportsPage" src/router.tsx` | All three Components present and imported | PASS |
| CSV RFC 4180 quoter behaves correctly | `node -e` smoke with `quote('plain')`, `quote('Foo, Bar')`, `quote('Foo "quoted" Bar')`, `quote('Foo\\nBar')`, `quote('')` | plain → unquoted; comma/quote/newline → wrapped; double-quote doubled; empty stays empty | PASS |
| No hand-typed `data-pendo-id` strings | `grep -rE 'data-pendo-id="[a-z][^"]*"' src/routes/app/{lists,settings,reports}/ src/{tasks/components,settings,reports}/` | 0 matches | PASS |
| No hardcoded chart fill hex | `grep -rE 'fill="#[0-9a-fA-F]{3,6}"' src/reports/ src/routes/app/reports/` | 0 matches | PASS |
| SET-05 deferral markers in code | `grep -E "SET-05" src/settings/{ProfileTab,WorkspaceTab}.tsx` | Both files have JSDoc + inline marker | PASS |
| tasksRepo writes through codec | `grep -E "writeJSON\(K\.tasks" src/tasks/tasksRepo.ts` | 3 call sites (create, update, delete) | PASS |
| Dev server boot | Live `npm run dev` smoke | SKIPPED — requires foreground server; static evidence sufficient for compile/build | SKIP |

### Probe Execution

No phase-declared probes for Phase 4; conventional `scripts/*/tests/probe-*.sh` not present in this codebase.

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| (none) | — | — | N/A |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LIST-01 | 04-03 | User can view a list of tasks at /app/lists in a List view | SATISFIED | ListsPage.tsx renders TaskTable when `allTasks.length > 0`. Router wires `/app/lists` → ListsPage. |
| LIST-02 | 04-03 | User can create a new task via a modal form with title, description, status, priority, due date, assignee | SATISFIED | TaskFormModal `mode='create'` opens from "New task" or empty-state CTA; six form fields confirmed. |
| LIST-03 | 04-03 | User can edit an existing task via the same modal form | SATISFIED | Same component with `mode='edit'`; opened from row kebab → Edit. Save disabled until dirty. |
| LIST-04 | 04-02, 04-03 | User can mark a task complete / incomplete with a single click on the row | SATISFIED | Leading Checkbox column; `onToggleComplete` → `updateTask({ status })`; repo owns `completedAt` invariant. |
| LIST-05 | 04-03 | User can delete a task with a confirmation modal | SATISFIED | DeleteConfirmModal triggered from row kebab AND edit-modal "Delete task" button (closes edit, then opens confirm). |
| LIST-06 | 04-03 | User can sort the list by any visible column | SATISFIED | TanStack `getSortedRowModel`; per-column header click via `toggleSorting()`; default sort `createdAt` desc applied via pre-sort. |
| LIST-07 | 04-03 | User can filter the list by status, priority, and assignee | SATISFIED | TaskFiltersBar with three Selects; ListsPage AND-filters in useMemo. |
| LIST-08 | 04-03 | List has a friendly empty state when no tasks exist | SATISFIED | ListsEmptyState renders when `allTasks.length === 0` with company-name body + CTA. |
| LIST-09 | 04-03 | All task mutations persist to localStorage and survive refresh | SATISFIED | All CRUD routes through `tasksRepo` → `writeJSON(K.tasks(workspaceId), ...)`. Persistence is structural via FND-04 codec. |
| SET-01 | 04-04 | Settings page at /app/settings has tabs for Profile, Workspace, and Preferences | SATISFIED | SettingsPage.tsx renders three `<Tabs.Tab>` + panels; URL-driven via `useSearchParams`. |
| SET-02 | 04-02, 04-04 | Profile tab lets the user edit name, username, job title, role, location | SATISFIED | ProfileTab uses `VisitorSchema.pick(...)` for 6 fields; `updateVisitor` + Zustand sync. Email NOT editable (D-13). |
| SET-03 | 04-02, 04-04 | Workspace tab lets the user edit company name, size, industry, plan tier | SATISFIED | WorkspaceTab uses `WorkspaceSchema.pick(...)` for 4 fields; `updateWorkspace` + Zustand sync. |
| SET-04 | 04-01, 04-04 | Preferences tab includes at least a theme toggle (light/dark via Mantine color scheme) | SATISFIED | SegmentedControl bound to `useMantineColorScheme()`; Light/Dark/System. Plan 04-01 wired the boot path (App.tsx + index.html). |
| SET-05 | 04-04 (deferred) | Any save action in Settings triggers `pendo.identify` | DEFERRED to Phase 6 | CONTEXT.md and ROADMAP both explicitly defer; deferral markers present in code at both call sites. |
| SET-06 | 04-04 | Settings includes a "Reset demo data" button that clears halo:v1:* keys (with confirmation) and reloads to public landing | SATISFIED | ResetDemoDataModal enumerates `localStorage.key(i)` for `halo:v` prefix; removes each; preserves `mantine-color-scheme-value`; `window.location.href = '/'`. |
| REP-01 | 04-05 | Reports page lets the user filter task data by date range and at least one other dimension | SATISFIED (with CR-02 timezone defect) | ReportsFiltersBar = DatePickerInput range + Assignee Select + Status MultiSelect. Filter is wired but timezone-inconsistent with chart bucketing — flagged. |
| REP-02 | 04-05 | Reports page shows a TanStack Table over filtered task data with at least 5 columns | SATISFIED | ReportsTable has 6 read-only columns (Title / Status / Priority / Assignee / Due date / Completed at). |
| REP-03 | 04-05 | Reports page shows at least one SVG chart computed from the filtered data | SATISFIED | ReportsChart = Recharts stacked BarChart (SVG); theme-resolved colors. |
| REP-04 | 04-05 | Reports page has an "Export CSV" button that downloads the current filtered table as a CSV (client-side blob) | SATISFIED | Export CSV button → `exportTasksToCsv(filteredTasks)` → Blob + `URL.createObjectURL` + ephemeral `<a download>` + revokeObjectURL. RFC 4180 quoting smoke-passed. |

**Coverage summary:** 18 of 19 Phase 4 requirements SATISFIED in code; SET-05 explicitly and correctly DEFERRED to Phase 6 with markers in place. No requirements ORPHANED.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD / FIXME / XXX markers in any phase-4 file | — | The "placeholder" string matches in code are: (a) JSDoc references to the Phase 3 "D-01 placeholder convention" (documentary), and (b) Mantine `placeholder=` props for Select inputs ("Select a role", "Select team size", etc.) — both legitimate. No actual stub indicators. |

### Human Verification Required

See `human_verification:` block in frontmatter. Summary:

1. **Lists CRUD round-trip** — sign-in, create/edit/toggle/delete, refresh-persistence smoke.
2. **Reset demo data round-trip** — full destructive flow including post-reload localStorage inspection.
3. **Theme toggle propagation** — visual confirmation across all four authed pages + persistence reload.
4. **Reports CSV download cross-browser** — open downloaded CSV in a spreadsheet and confirm RFC 4180 quoting.
5. **Reports date-range timezone correctness** — regression test for the CR-01/CR-02 fix once landed.

### Gaps Summary

The PHASE GOAL is largely achieved at the page-composition and wiring level: all three pages exist, all 19 Phase 4 requirements except SET-05 (formally deferred) have substantive implementations, and every key link traces from UI to repo to localStorage. TypeScript and Vite build pass.

However, three BLOCKER findings from the standalone code review (04-REVIEW.md CR-01, CR-02, CR-03) describe user-visible defects that compromise the observable correctness of Success Criteria #1 (Lists table dueDate rendering) and #4 (Reports filter + table + chart consistency). Per the verify-work instructions, REVIEW findings are advisory "unless they directly invalidate a success criterion" — CR-01 and CR-02 do invalidate them at the observability level:

- **CR-01:** Stored dueDate is UTC midnight; displayed via local-time `dayjs(...).format(...)`. For any user west of UTC, the picked date renders as the previous day in Lists table + Reports table + CSV export. The user-visible behavior contradicts SC #1's "every mutation persists to localStorage and survives refresh" — the persistence is correct but the rendered surface lies about it.
- **CR-02:** ReportsChart day-bucket keys are local time; ReportsPage date-range filter operates on a UTC-midnight Date with local-time `.startOf('day')`. Chart bars and table rows can disagree about which tasks are in the same filter window — SC #4 demands a coherent filter view, this couples two inconsistent views.
- **CR-03:** Smaller blocker — deselect-all on the Status MultiSelect strands the user with no recovery affordance. SC #4 requires the user can "filter ... view in TanStack Table" — when stranded, there is no table to view and no path back.

Recommended fix path (per CR-01 / CR-02 / CR-03 suggested patches in 04-REVIEW.md):

1. `dayjs.extend(utc)` at app boot, then use `dayjs(value).utc().format('MMM D, YYYY')` at every dueDate/completedAt render site (TaskTable, ReportsTable, csvExport).
2. Apply UTC throughout the Reports filter chain: `dayjs.utc(t.createdAt)` in both the ReportsPage predicate and the ReportsChart bucket key. Dashboard.tsx already uses explicit UTC via `getUTCFullYear()` etc. — make Reports consistent.
3. Either treat `statusFilter.length === 0` as "match all" (smallest change, matches the Lists `All` sentinel idiom and the file's own comment claim that the default "is equivalent to no status filter") OR add a Clear-filters affordance to the Reports empty state.

The four warning-tier findings (WR-01..WR-04) and remaining six (WR-05..WR-09, IN-01..IN-05) are not phase-goal blockers — they're code-quality improvements that should be tracked but do not invalidate any SC.

---

_Verified: 2026-05-15T15:44:30Z_
_Verifier: Claude (gsd-verifier)_
