# Phase 4: Core Pages (Lists, Settings, Reports) - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Three highest-leverage interactive pages ship inside the Phase 3 AppShell — Lists (task CRUD with sort & filter), Settings (Profile / Workspace / Preferences tabs + theme toggle + reset demo data), and Reports (filtered TanStack table + SVG chart + CSV export). Every interactive element extends the `PENDO_IDS` registry under three new namespaces (`lists`, `settings`, `reports`). SET-05's `pendo.identify` metadata sync is deferred to Phase 6 per ROADMAP §"Phase 4" preamble.

**In scope (Phase 4 ships):**
- **Lists** at `/app/lists`: TanStack Table v8 over `listTasks(workspaceId)`; leading checkbox column for one-click status toggle; row kebab → Edit / Delete; create+edit via shared Mantine `<Modal>` + `<TaskForm>` (RHF + Zod, locked TaskSchema); delete confirm modal (one canonical destructive flow); top filter bar (Status + Priority + Assignee `<Select>`s); column-header sort; default sort `createdAt` desc; two distinct empty states (no-tasks-ever vs filters-yield-zero).
- **Settings** at `/app/settings`: three URL-tab-driven panels (`?tab=profile|workspace|preferences`, default `profile`); Profile + Workspace forms with Save/Cancel + `useAuthStore.setState` propagation; Preferences = light/dark/system theme toggle bound to Mantine `useMantineColorScheme()` (no halo storage key); "Danger zone" bordered card at the bottom of Preferences with Reset demo data confirmation modal → wipe halo:v1:* localStorage + sessionStorage signup draft → hard reload to `/`.
- **Reports** at `/app/reports`: three filter dimensions (Date range = `DatePickerInput type='range'` anchored to nowRef, Assignee `<Select>`, Status `<MultiSelect>`); read-only TanStack Table with 6 columns over filtered tasks; one Recharts stacked bar chart "Tasks by status per day"; Export CSV button writing the visible-columns CSV blob with `halo-tasks-YYYY-MM-DD.csv` filename.
- **Repo extensions (Phase 4 ships):**
  - `tasksRepo`: `updateTask` enforces the `completedAt` invariant (stamped when status→done, cleared when status→other); behavior is repo-owned, not UI-owned.
  - `authRepo`: adds `updateVisitor(id, patch)` and `updateWorkspace(id, patch)` mirroring the tasksRepo update pattern. Settings save handlers call these + push the result back into `useAuthStore`.
- **PENDO_IDS extensions:** new `lists`, `settings`, `reports` namespaces — every interactive control on the three pages carries an ID from the registry (PEN-07). New primitive wrappers added as needed (e.g., `Textarea.tsx`, `DatePickerInput.tsx`, `Checkbox.tsx`, `Modal.tsx`/`MenuTrigger.tsx` — planner decides which need the `pendoId` wrapper vs which can forward via existing `<Menu.Target>`-style props).
- **New runtime deps:** `@tanstack/react-table` (^8.x) — pin via `npm view` at install time. Mantine `@mantine/dates` + `dayjs` peer (for `DatePickerInput`) if not already installed.

**Out of scope (deferred — see `<deferred>`):**
- Kanban / board view on Lists (LIST2-01, v2).
- Calendar view on Lists (LIST2-02, v2).
- Task detail slide-over with comments + @-mentions (LIST2-03, v2).
- Drag-to-reorder rows (no LIST-* requirement covers this — PROJECT.md mention is decorative).
- Workspace switcher in top bar (WS2-01, v2).
- `pendo.identify` re-fire on Settings save (SET-05) — Phase 6 owns Pendo runtime.
- Real email send on Settings (no requirement).
- Pagination / virtualization on Lists or Reports (≤60 seeded rows; not needed at v1 scale).
- URL persistence of Lists filters (`?status=todo&priority=high`) — deferred to Phase 5 polish if needed; component state suffices for v1.
- "Default landing page" / density toggle in Preferences (gold-plating; theme toggle is the only Phase 4 preference).
- Stripe-style "Type RESET to confirm" double-confirm (modal alone is sufficient).
- "Choose columns" picker before CSV export (visible columns are the contract).

</domain>

<decisions>
## Implementation Decisions

### Lists — table, sort & filter UX

- **D-01:** **TanStack Table v8** is the single table primitive for Phase 4 — used by both Lists and Reports. Install `@tanstack/react-table` (^8.x) as a runtime dep (pin via `npm view` at install time per Phase 1 blocker). Choosing TanStack for Lists (in addition to the REP-02-mandated Reports use) keeps one table infrastructure across the phase; headless markup keeps `data-pendo-id` placement stable per CLAUDE.md "What NOT to Use > CSS-in-JS class targeting" rationale. No virtualization in Phase 4 (≤60 rows).
- **D-02:** **Lists columns** (left → right): leading `Checkbox` (no header label) → `Title` → `Status` → `Priority` → `Assignee` → `Due date` → trailing `Actions` (kebab `<Menu>` with Edit + Delete). Seven columns total. Default sort: `createdAt` desc (newest first; mirrors the Phase 3 D-05 seeded data spread). Column headers are click-to-sort (single arrow icon affordance, ascending/descending toggle, third click clears to default). Status + Priority cells render Mantine `<Badge>` styled per `src/tasks/labels.ts` mapping (don't duplicate label copy in page code).
- **D-03:** **Filter affordances** live in a top filter bar above the table: a `<Group>` of three Mantine `<Select>` controls — Status (All / To do / In progress / Done) + Priority (All / Low / Medium / High / Urgent) + Assignee (All / `<each distinct assignee from existing tasks>`). "All" is the default for each (renders ALL options unfiltered). Selects are `clearable={false}` — "All" is the cleared state. No search input in v1 (LIST-01..09 do not require one).
- **D-04:** **Single-click status toggle (LIST-04)** is the leading `Checkbox` column. `checked = task.status === 'done'`. `onChange` calls `tasksRepo.updateTask(workspaceId, task.id, { status: checked ? 'todo' : 'done' })` — the repo's completedAt invariant (D-09 below) handles the timestamp. Checkbox row carries `data-pendo-id={PENDO_IDS.lists.row.completeToggle}` plus `data-pendo-task-id={task.id}` per the CLAUDE.md dynamic-list parameterization rule.
- **D-05:** **Filter + sort state is component-state only** (`useState` in `ListsPage`). No URL persistence in Phase 4 — refresh resets to defaults (status=All, priority=All, assignee=All, sort=createdAt desc). Mirrors Phase 3 D-20's component-state choice for the dashboard time-range. Phase 5 polish may add `?status=todo&priority=high&sort=...` if a guide demo calls for shareable URLs.
- **D-06:** **Two distinct empty states.** When `listTasks(workspaceId).length === 0`: full-page hero (`<Center mih={400}>` + clipboard icon + `<Title order={3}>` "No tasks yet" + body copy mentioning the workspace name + primary `<Button>` "Create your first task" that opens the create modal). Carries `data-pendo-id={PENDO_IDS.lists.emptyState.container}` + `.cta` — this is the LIST-08 guide-anchor surface. When the unfiltered list has tasks but the filter combination yields zero rows: compact in-table state ("No tasks match these filters" + `<Anchor>` "Clear filters" link that resets all three Selects to "All"). Different intent — don't conflate. Both states share the same Phase 3 Dashboard empty-state visual grammar.

### Lists — task modal & destructive confirmations

- **D-07:** **One shared `<TaskFormModal>` component** at `src/tasks/TaskFormModal.tsx` opens in either `mode='create'` (defaults preset) or `mode='edit'` (`initialValues` from the row). Built on Mantine `<Modal opened size="md" centered>`. Header text driven by mode ("New task" / "Edit task"). Inherits Phase 2's RHF + Zod pattern: `useForm({ resolver: zodResolver(TaskFormSchema), defaultValues, mode: 'onSubmit' })`. Submit handler calls `tasksRepo.createTask` or `tasksRepo.updateTask`, closes the modal, and fires a Mantine notifications toast ("Task created" / "Task saved").
- **D-08:** **Form fields** (all 7 user-editable Task fields, defaults preset): Title (`TextInput`, required), Description (`Textarea`, optional, rows=3), Status (`Select`, default `'todo'` on create), Priority (`Select`, default `'medium'`), Assignee (`Select`, options derived from existing tasks per D-10 below), Due date (`DatePickerInput`, optional / clearable). `completedAt` is NOT a form field — it derives from `status` via D-09. `id`, `createdAt`, `updatedAt` are system-managed.
- **D-09:** **`completedAt` is a repo-level invariant** owned by `tasksRepo.updateTask`. When `patch.status === 'done'` and the existing task was not already `'done'`, the repo stamps `completedAt = new Date().toISOString()`. When `patch.status` moves OFF `'done'`, the repo sets `completedAt = null`. Touching the same value in `createTask` when `input.status === 'done'` keeps the invariant symmetric. UI code (checkbox toggle, modal save, future drag-and-drop) never thinks about `completedAt`.
- **D-10:** **Assignee `<Select>` options** are derived from existing tasks: scan `listTasks(workspaceId)`, dedupe `task.assignee` by `id`, sort by `name` asc. Always include the current visitor (`useAuthStore.getState().currentVisitor`) mapped to an `Assignee` snapshot (`{ id, name: firstName + ' ' + lastName, avatar: undefined }`) so a user can assign to themselves even before any tasks are seeded. Forward-compatible: Phase 5 TEAM-01 swaps the source from "distinct from tasks" to `listTeammates(workspaceId)` without changing the form. Place this helper at `src/tasks/assigneeOptions.ts` to share between the modal and the Lists/Reports Assignee filters.
- **D-11:** **Delete confirmation (LIST-05)** is a small Mantine `<Modal opened size="sm">` triggered from TWO places — (a) row kebab → "Delete" and (b) edit modal footer's destructive "Delete task" button (left-aligned, `color="red"` variant). One canonical destructive flow. Modal title "Delete this task?", body shows the task title in quotes ("Delete "<i>{task.title}</i>"? This cannot be undone."), footer Cancel + `color="red"` "Delete task" button. Triggered from edit modal: closes the edit modal first, then opens delete confirm (modal-on-modal stacking avoided). Toast confirms "Task deleted".

### Settings — tabs, dark mode, reset demo data

- **D-12:** **Three tabs driven by `?tab=profile|workspace|preferences`** via `useSearchParams()`. Tab click calls `setSearchParams({ tab: <new> }, { replace: false })` so browser back/forward navigates tabs naturally. Default tab when `?tab=` is absent or invalid = `profile`. Honors Phase 3 D-16's user-menu deep-link wiring (`/app/settings?tab=profile`). Mantine `<Tabs value={tab} onChange={(v) => setSearchParams({ tab: v })}>` with three `<Tabs.Panel>`s.
- **D-13:** **Profile tab** edits Visitor fields (per SET-02): name (firstName + lastName), username, jobTitle, role, location. Email is NOT editable (Visitor.email is the key the SHA-256 sign-in flow keys against — changing it would orphan the session). Renders as RHF form with one `<Save>` button + `<Cancel>` button. `isDirty` drives Save's `disabled` state. `defaultValues` come from `useAuthStore(s => s.currentVisitor)`. On submit: call `authRepo.updateVisitor(currentVisitor.id, values)` → `useAuthStore.setState({ currentVisitor: updated })` → Mantine notifications toast "Profile saved". Reuses primitives (`TextInput`, `Select`) with `pendoId` from `PENDO_IDS.settings.profile.*`.
- **D-14:** **Workspace tab** edits Workspace fields (per SET-03): companyName, companySize, industry, planTier. Same save flow as D-13 but against `authRepo.updateWorkspace`. After save, `useAuthStore.setState({ currentWorkspace: updated })` causes the Phase 3 top-bar workspace-name display to recolor instantly (no refresh). Toast "Workspace saved". `PENDO_IDS.settings.workspace.*`.
- **D-15:** **`authRepo` extensions:** add `updateVisitor(id: string, patch: Partial<Omit<Visitor, 'id' | 'passwordHash' | 'createdAt'>>): Visitor | undefined` and `updateWorkspace(id: string, patch: Partial<Omit<Workspace, 'id' | 'ownerVisitorId' | 'createdAt'>>): Workspace | undefined`. Pattern mirrors `tasksRepo.updateTask`. All writes go through `writeJSON(K.visitors(), nextArray)` / `K.workspaces()` — Visitor.passwordHash and Workspace.ownerVisitorId are deliberately not patchable (defense against accidental UI plumbing exposing those fields). Reads use `readWithSchema(K.visitors(), VisitorsArraySchema, [])` per FND-04.
- **D-16:** **Preferences tab** contents (Phase 4 only): a single `<SegmentedControl>` bound to Mantine's `useMantineColorScheme()` with three options: Light / Dark / System. `setColorScheme(value)` persists via Mantine's built-in localStorage (key `mantine-color-scheme-value` — NOT a `halo:v1:*` key, deliberately outside the Halo envelope so it survives Reset demo data). Mantine's `<ColorSchemeScript />` (added in Phase 1 FND-02) handles flash-of-incorrect-theme on boot. No new Halo storage key. `PENDO_IDS.settings.preferences.themeToggle`.
- **D-17:** **Reset demo data** lives at the bottom of the Preferences tab inside a `<Paper withBorder p="lg" radius="md">` "Danger zone" card — `<Title order={4} c="red.7">Danger zone</Title>` + body copy + `<Button color="red" variant="outline">Reset demo data</Button>`. Visually quarantined from the theme toggle by spacing (`mt="xl"`). Clicking the button opens a separate confirm `<Modal size="sm">`: title "Reset demo data?", body "This will permanently delete all tasks, settings, and accounts in this browser, and sign you out. This cannot be undone.", footer Cancel + `color="red"` "Reset demo data" button. On confirm: enumerate `Object.keys(localStorage)` for keys with prefix `halo:v` and `localStorage.removeItem` each one; `sessionStorage.removeItem(K.signupDraft())`; then `window.location.href = '/'` (hard reload — re-runs the boot sequence with clean state, including `meta.seededAt = null` regeneration on next sign-in). `PENDO_IDS.settings.dangerZone.{button,confirmButton,cancelButton}`.
- **D-18:** **Dark mode wiring (SET-04).** Phase 4 verifies Phase 1 wired `<ColorSchemeScript defaultColorScheme="auto" />` in `index.html` and `MantineProvider` reads `defaultColorScheme="auto"` from `theme.ts`. If absent, Plan 04-X adds them. Phase 3's AppShell + KPI cards + Recharts charts all reference `var(--mantine-color-*)` tokens — they recolor automatically. Verification step in the Phase 4 plan: manually toggle theme on the Dashboard + Lists + Reports + Settings pages and confirm no light-only hardcoded colors leak through (especially Recharts stroke/fill props that use named tokens like `'indigo.6'` — verify Mantine theme function resolves those for both schemes; if `indigo.6` is the same hex in light + dark, dark contrast may be poor, in which case use CSS-var resolution `style={{ stroke: 'var(--mantine-color-indigo-4)' }}` per scheme).

### Reports — filters, chart, CSV shape

- **D-19:** **Filter dimensions (REP-01)** are three: (a) Date range — Mantine `DatePickerInput type="range"` from `@mantine/dates`; default range `[nowRef - 30d, nowRef]` (where `nowRef` = D-22 below); user can pick any range; clear returns to default. (b) Assignee — Mantine `<Select>` (single-pick), options = All + distinct assignees (shared `src/tasks/assigneeOptions.ts` helper from D-10). (c) Status — Mantine `<MultiSelect>` with options All / To do / In progress / Done; default = all three selected (i.e., no status filtering). Filter bar renders in a `<Group>` above the chart + table.
- **D-20:** **Chart (REP-03)** is a single Recharts `<BarChart>` with `<Bar stackId="status">` per status: To do (`indigo.3`), In progress (`indigo.6`), Done (`gray.5`) — same color order as the Phase 3 D-19 donut for visual consistency. X axis: day buckets across the selected date range (one tick per day at ≤14 days, every 3 days at 30 days, every 10 days at 90 days). Y axis: task count per day, summed across statuses. Wrapped in `<Paper withBorder p="md" radius="md">` with title `<Text fw={600}>Tasks by status per day</Text>` and `data-pendo-id={PENDO_IDS.reports.chart.statusByDay}` on the wrapping div (per CLAUDE.md chart-wrapper rule).
- **D-21:** **TanStack Table (REP-02)** has 6 read-only columns: Title / Status / Priority / Assignee / Due date / Completed at. Rows = the FILTERED task list (after Date + Assignee + Status filters apply). Default sort `createdAt` desc (createdAt is not a visible column but drives the default ordering). No actions column — Reports is for viewing; edits live on Lists. Date columns format via `dayjs` ("May 14, 2026") with `'—'` when null. Wrapped in `<Paper withBorder p="md">` for visual consistency with the chart.
- **D-22:** **`nowRef` is shared with the Dashboard** to keep the demo non-stale. Extract the `computeNowRef` helper currently inlined in `src/dashboard/Dashboard.tsx` into a new module — recommend `src/tasks/now-ref.ts` (the helper is task-data-anchored, not dashboard-specific). Both Dashboard.tsx and the new `ReportsPage.tsx` import from there. The default date range filter on Reports anchors to `nowRef`; the date picker itself accepts any range (no clamp to nowRef-bound).
- **D-23:** **CSV export (REP-04)** writes the visible TanStack table columns (Title / Status / Priority / Assignee.name / Due date / Completed at) honoring the active filters. RFC 4180 quoting (double-quote fields containing commas, newlines, or quotes; escape internal quotes by doubling). Header row uses the same display labels as the table column headers (via `src/tasks/labels.ts` for Status / Priority). Filename: `halo-tasks-YYYY-MM-DD.csv` where `YYYY-MM-DD` = `dayjs().format('YYYY-MM-DD')` (browser local). Implementation: hand-roll the CSV string, `new Blob([csv], { type: 'text/csv;charset=utf-8' })`, `URL.createObjectURL`, ephemeral `<a download={filename}>` click, then `URL.revokeObjectURL`. No CSV library dependency. `PENDO_IDS.reports.csvExport`.

### PENDO_IDS extensions (Phase 4)

- **D-24:** Three new namespaces in `src/pendo/PENDO_IDS.ts`:
  - `lists: { newTaskButton, row: { completeToggle, kebab, kebabEdit, kebabDelete }, filter: { status, priority, assignee, clear }, modal: { title, description, status, priority, assignee, dueDate, cancel, save, delete }, deleteConfirm: { cancel, confirm }, emptyState: { container, cta }, filteredEmpty: { container, clearLink } }` — covers all interactive surfaces in Lists.
  - `settings: { tabs: { profile, workspace, preferences }, profile: { firstName, lastName, username, jobTitle, role, location, save, cancel }, workspace: { companyName, companySize, industry, planTier, save, cancel }, preferences: { themeToggle }, dangerZone: { button, confirmCancel, confirmButton } }`.
  - `reports: { filter: { dateRange, assignee, status }, chart: { statusByDay }, table: { container }, csvExport }`.
- **D-25:** Leaf string convention unchanged from Phase 1/2/3: dotted, kebab-case (e.g., `'lists.row.complete-toggle'`, `'settings.tabs.profile'`). The hand-typed-string ban (CONVENTIONS.md §1) continues to apply — every consumer references `PENDO_IDS.<namespace>.<key>`. New primitive wrappers as needed for `Checkbox`, `Textarea`, `DatePickerInput`, and `Modal` — planner decides at compose time which actually need the `pendoId: PendoId` required-prop wrapper vs. which can forward `data-pendo-id` via existing slot props (Mantine `<Modal.Body>` etc.); either path is acceptable as long as the attribute lands on the actual interactive DOM node.

### Storage / repo extensions (no SCHEMA_VERSION bump)

- **D-26:** Phase 4 does NOT bump `SCHEMA_VERSION` (still `1`). All Phase 4 storage operations target existing keys (`K.tasks(workspaceId)`, `K.visitors()`, `K.workspaces()`); no new key builders. The `updateVisitor` / `updateWorkspace` additions to `authRepo` are pure code additions over the same v1 schema. Mantine's color-scheme key (`mantine-color-scheme-value`) is deliberately outside the Halo envelope. Reset demo data wipes only `halo:v*` prefixed keys + `K.signupDraft()` — the Mantine theme key survives (acceptable: theme is a UI preference, not demo data).

### Claude's Discretion

- Exact toast notification copy for save/create/delete actions (e.g., "Task saved" vs "Changes saved"). Planner writes the copy at compose time aligned to Phase 2/3 toast precedent.
- Tabler icon picks where multiple choices apply (e.g., DangerZone icon, CSV export icon — recommended `IconAlertTriangle`, `IconDownload` but planner can substitute).
- Whether the Lists New Task button lives in a top-right of the table card, or top-right of the page header. Recommend page header for guide anchoring symmetry with future actions.
- Whether `<Modal>` and `<MenuTrigger>` need the `pendoId: PendoId` required-prop wrapper, or whether `data-pendo-id` is forwarded via existing Mantine slot props. Either path is acceptable as long as the attribute lands on the actual interactive DOM node.
- Whether to extract a `useTaskFilters()` hook for Lists vs. inlining the filter state — depends on whether Reports' filter logic ends up structurally similar (likely yes — opportunistic to share via a shared `useTaskFilters` or per-page `useState` is fine, planner's call).
- Mantine color-scheme key (`mantine-color-scheme-value`) survival across Reset demo data — current spec keeps it (Mantine owns the key, Halo's reset wipes only `halo:v*`); planner may explicitly delete it during reset if a stronger "factory reset" feel is desired. Either way, document the decision in the plan.
- Default `<DatePickerInput type="range">` UX (max range cap, valueFormat) — planner picks sensible defaults; the locked behavior is the `[nowRef - 30d, nowRef]` default value.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level locks
- `CLAUDE.md` — Technology stack (TanStack Table 8.x for Reports; dayjs for dates), Pendo integration patterns ("dynamic lists parameterize `data-pendo-id` + `data-pendo-item-id={task.id}`"), "What NOT to Use" list (Chart.js / canvas / hash-routing / Formik / CSS-in-JS targeting), Recharts SVG mandate
- `.planning/PROJECT.md` — Core value, Out of Scope items (esp. "Real email", "Real backend", "Pendo Snippet settings UI"), Key Decisions table
- `.planning/REQUIREMENTS.md` §"Lists (Tasks)", §"Settings", §"Reports" — LIST-01..09, SET-01..06, REP-01..04 (Phase 4 owns these). Inherited contracts: FND-04 (`readWithSchema` envelope), PEN-07 (PENDO_IDS), PEN-08 (SVG-only charts), UI-03 (destructive actions show confirmation modal)
- `.planning/STATE.md` — Decisions list (esp. Phase 02-* RHF + Zod patterns; Phase 03-* AppShell + tasksRepo lock; Phase 02-05 `crypto.subtle.digest` + Zustand 5)
- `.planning/ROADMAP.md` §"Phase 4" — Goal + Success Criteria are the verification anchors; §"Phase 5" + §"Phase 6" document the contracts Phase 4 must NOT break (esp. SET-05 pendo.identify deferred to Phase 6)
- `.planning/phases/03-authenticated-shell-dashboard/03-CONTEXT.md` — D-06..D-10 (Task schema lock + tasksRepo signature), D-21 (nowRef anchor), D-16 (user-menu `?tab=profile` deep-link)

### Markup conventions & Pendo readiness
- `docs/CONVENTIONS.md` §1 — PENDO_IDS is the only source of `data-pendo-id` (hand-typed string ban)
- `docs/CONVENTIONS.md` §2 — SVG-only chart rule; Recharts approved; canvas forbidden
- `docs/CONVENTIONS.md` §3 — `.pendo-sr-ignore` policy (irrelevant to Phase 4 — no password fields here, but stays in force)
- `src/pendo/PENDO_IDS.ts` — Registry to extend with `lists`, `settings`, `reports` namespaces. Existing namespaces (`layout`, `sandbox`, `signup`, `signin`, `nav`, `topbar`, `dashboard`, `comingSoon`) are NOT touched.
- `src/ui/primitives/` (entire dir) — Wrapper contract (`pendoId: PendoId` required, forwarded to DOM as `data-pendo-id`). Phase 4 adds new wrappers as needed: candidates are `Textarea.tsx`, `DatePickerInput.tsx`, `Checkbox.tsx`, possibly `Modal.tsx` / `MenuTrigger.tsx` / `Tabs.tsx`. Planner decides.

### Phase 3 UI-SPEC (DO inherit)
- `.planning/phases/03-authenticated-shell-dashboard/03-UI-SPEC.md` §"Design System" (Mantine 9 + Tabler icons + Recharts; `xs` spacing token NOT used → use `gap={8}` numeric for icon-to-label gaps; raw pixel CSS values forbidden), §"Typography" (4 sizes + 2 weights; no `fw={700}` except `fw={500}` for emphasis; `<Title order={2}>` for big numeric values, `<Text size="sm">` for labels), §"Color" (indigo accent reserved — Phase 4 adds NO new indigo surfaces beyond what's already specified). Inherit the AppShell shadow exception; Phase 4's new `<Paper withBorder>` surfaces follow the `withBorder` (not `shadow`) convention.
- `.planning/phases/02-registration-sign-in/02-UI-SPEC.md` §"Inline validation errors" (Zod schema-driven error copy; Phase 4 task form errors should follow same idiom — short, sentence-case, period-terminated)

### Task data layer (Phase 3 lock)
- `src/tasks/schemas.ts` — `TaskSchema`, `TasksArraySchema`, `TaskStatusEnum`, `TaskPriorityEnum`, `AssigneeSchema`. PHASE 4 INHERITS VERBATIM. Form-level schema (`TaskFormSchema`) for the create/edit modal lives in `src/tasks/schemas.ts` too (alongside, not replacing — same module ownership as `src/auth/schemas.ts` step1..step4 form schemas alongside VisitorSchema).
- `src/tasks/types.ts` — `Task`, `TaskStatus`, `TaskPriority`, `Assignee` types. Editing requires schema-first change in `schemas.ts`.
- `src/tasks/tasksRepo.ts` — `listTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask` (D-10). Phase 4 EXTENDS `updateTask` with the `completedAt` invariant (D-09) — this is the single behavioral change to the repo; signatures stay the same. Phase 4 also USES `createTask` and `deleteTask` for the first time.
- `src/tasks/labels.ts` — `TASK_STATUS_LABELS` + `TASK_PRIORITY_LABELS`. Phase 4 status `<Badge>` color mapping should live here too (e.g., `TASK_STATUS_BADGE_COLORS`), not inline in the page.
- `src/tasks/tasksSeed.ts` — Faker seeder, gated by `meta.seededAt`. Phase 4 doesn't edit but should verify a fresh sign-in still seeds correctly after the `completedAt` invariant lands (ensure the seeder produces records consistent with the invariant).

### Auth / workspace state (Phase 2 lock)
- `src/auth/authStore.ts` — `useAuthStore` selectors: `currentVisitor`, `currentWorkspace`, `isAuthenticated`, `signOut`. Phase 4 Settings save handlers call `useAuthStore.setState({ currentVisitor / currentWorkspace })` after `authRepo.updateVisitor / .updateWorkspace`.
- `src/auth/authRepo.ts` — Phase 4 ADDS `updateVisitor` + `updateWorkspace` (D-15). Existing read/create helpers untouched. Both new functions consume `readWithSchema(K.visitors(), VisitorsArraySchema, [])` etc. per FND-04.
- `src/auth/schemas.ts` — `VisitorSchema`, `WorkspaceSchema`. Profile/Workspace form fields derive validators from per-field picks (e.g., `VisitorSchema.pick({ firstName: true, lastName: true, ... })`). Email is NOT in the Profile form (D-13).
- `src/auth/types.ts` — `Visitor`, `Workspace`, `Role`, `CompanySize`, `Industry`, `PlanTier` unions; Settings form `<Select>` options derive from these.

### Storage envelope (FND-04)
- `src/storage/keys.ts` — `K.visitors()`, `K.workspaces()`, `K.tasks(workspaceId)`, `K.signupDraft()`, `K.meta()`. Phase 4 adds NO new keys. Reset demo data enumerates `Object.keys(localStorage)` for `halo:v` prefix matches.
- `src/storage/codec.ts` — `readWithSchema`, `writeJSON`, `removeKey`. All Phase 4 storage I/O routes through here.
- `src/storage/schemas.ts` — `MetaSchema`. Phase 4 does NOT bump `SCHEMA_VERSION`.

### Router & layouts (Phase 1/2/3 lock)
- `src/router.tsx` — Phase 4 does NOT edit router.tsx (per Phase 3 D-01 placeholder pattern). The three placeholder pages get their bodies replaced in place. `?tab=profile` is consumed inside `SettingsPage.tsx`, not via a route param.
- `src/routes/app/lists/ListsPage.tsx` — Body replaced with real Lists UI. Filename, export name unchanged.
- `src/routes/app/settings/SettingsPage.tsx` — Body replaced. Reads `?tab=` via `useSearchParams()`.
- `src/routes/app/reports/ReportsPage.tsx` — Body replaced.
- `src/routes/app/team/TeamPage.tsx` + `src/routes/app/help/HelpPage.tsx` — UNTOUCHED in Phase 4 (Phase 5 owns these).
- `src/routes/app/AppLayout.tsx` — UNTOUCHED.

### Recharts integration (Phase 3 install)
- `recharts` 3.8.1 already installed (Phase 3). `<BarChart>` + `<Bar stackId>` for the stacked-by-status chart (D-20). Wrap in `<Paper>` with `data-pendo-id`; never on individual `<rect>` paths.

### TanStack Table integration (Phase 4 install)
- `@tanstack/react-table` ^8.x — verify latest at install time per Phase 1 blocker. React 19 compatibility check required (peer-dep warnings → document and proceed only if runtime smoke renders correctly).
- TanStack docs (`https://tanstack.com/table/v8/docs`) — `useReactTable`, `getCoreRowModel`, `getSortedRowModel`, `flexRender`, column definition idioms.

### Mantine dates / dayjs (verify install)
- `@mantine/dates` for `<DatePickerInput type='range'>` (D-19). May not be installed yet — verify and add. Requires `dayjs` peer.
- `dayjs` for CSV filename + date column formatting (D-21, D-23). May not be installed yet — verify and add.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/tasks/tasksRepo.ts`** — `createTask`, `updateTask`, `deleteTask`, `listTasks`, `getTaskById` already exist and are typed. Phase 4 extends `updateTask` with the completedAt invariant (D-09) but does NOT change signatures. The `CreateTaskInput` type is the contract for the create modal.
- **`src/tasks/schemas.ts`** — `TaskSchema`, enums, `AssigneeSchema` locked. Phase 4 adds `TaskFormSchema` (subset for the form: omits id/createdAt/updatedAt/completedAt) at the same file — mirrors the auth schemas pattern of co-locating form schemas with persistence schemas.
- **`src/tasks/labels.ts`** — `TASK_STATUS_LABELS` + `TASK_PRIORITY_LABELS`. Phase 4 adds `TASK_STATUS_BADGE_COLOR` (mapping status enum → Mantine color token) so badges in Lists + Reports + Dashboard timeline share the same color story.
- **`src/dashboard/Dashboard.tsx` `computeNowRef`** — Extract to `src/tasks/now-ref.ts` (D-22) and have Dashboard import from there. Reports imports from the same module. No behavior change in the Dashboard; pure refactor + re-export.
- **`src/auth/authRepo.ts`** — Existing repo pattern (read-modify-write through codec). Phase 4 adds `updateVisitor` / `updateWorkspace` following the same shape.
- **`src/auth/authStore.ts`** — `useAuthStore.setState` already supports patches; Settings handlers call `setState({ currentVisitor: updated })` directly.
- **`src/ui/primitives/{Button,Anchor,TextInput,Select,MultiSelect,PasswordInput,NumberInput,NavLink}.tsx`** — All carry `pendoId: PendoId`. Phase 4 adds new wrappers in this dir as needed (Checkbox, Textarea, DatePickerInput; possibly Modal/MenuTrigger/Tabs).
- **`@tabler/icons-react` 3.44.0** — Already installed. Phase 4 picks: `IconPlus` (New task), `IconDotsVertical` (kebab), `IconPencil` / `IconTrash` (kebab items), `IconChecklist` (Lists empty state — already used in ListsPage placeholder), `IconAlertTriangle` (Danger zone), `IconDownload` (CSV export), `IconSun` / `IconMoon` / `IconDeviceLaptop` (theme toggle segments).
- **`useMantineColorScheme()` + `useComputedColorScheme()`** — Built into Mantine 9. Phase 3 was light-only; Phase 4's Settings Preferences tab is the first consumer. ColorSchemeScript wiring from Phase 1 needs verification but should already exist.

### Established Patterns
- **Schemas-as-source-of-truth** (`src/auth/schemas.ts` co-locating step + persistence schemas; `src/tasks/schemas.ts` mirroring this). `TaskFormSchema` lives alongside `TaskSchema` in the same file.
- **Per-storage-key feature module ownership** — One module per persistent collection. tasksRepo owns `K.tasks(workspaceId)`; authRepo owns `K.visitors()` + `K.workspaces()`. Phase 4 does NOT create a new repo; it extends authRepo.
- **Wrapped-with-`pendoId` primitives** — Required prop on every interactive wrapper, typed as `Leaves<typeof PENDO_IDS>`. TypeScript flags hand-typed strings at compile time. Phase 4 extends the registry; the `PendoId` type updates automatically.
- **RHF + Zod resolver + `mode: 'onSubmit'`** — Phase 2 wizard precedent. TaskForm + Profile + Workspace forms inherit this exactly.
- **Two-level pathless layout** (Phase 2/3 `router.tsx` lock) — Phase 4 makes no router changes. Page bodies are swapped in place inside existing route files.
- **Module-init hydration** (`src/auth/authStore.ts`) — Selectors return populated values on first render. Settings + Lists + Reports read `currentWorkspace?.id` without loading-state plumbing.
- **`<Paper withBorder p="md" radius="md">` surface pattern** — Phase 2/3 lock. All Phase 4 surfaces (filter bar, table wrapper, chart wrapper, Danger zone) use this pattern.
- **Toast pattern** — Phase 2 set the precedent with `notifications.show(...)` from Mantine `@mantine/notifications` (verify the package is installed and the `<Notifications />` mount is in `App.tsx`; if not, Phase 4 adds the install + mount).

### Integration Points
- **`src/App.tsx`** — UNTOUCHED unless `@mantine/notifications` mount needs to be added. Provider stack stays FND-07-locked.
- **`src/router.tsx`** — UNTOUCHED (per Phase 3 D-01 placeholder convention).
- **`src/routes/app/lists/ListsPage.tsx`** — Body replaced. Composes the new sub-components (`TaskTable`, `TaskFiltersBar`, `TaskFormModal`, `DeleteConfirmModal`, `ListsEmptyState`, `FilteredEmptyState`) from a new `src/tasks/` subdir layout. Suggested layout: `src/tasks/components/{TaskTable,TaskFiltersBar,TaskFormModal,DeleteConfirmModal}.tsx`.
- **`src/routes/app/settings/SettingsPage.tsx`** — Body replaced. Composes `<Tabs>` + `<ProfileTab>` + `<WorkspaceTab>` + `<PreferencesTab>` (which contains the Danger zone). Suggested layout: `src/settings/{ProfileTab,WorkspaceTab,PreferencesTab,ResetDemoDataModal}.tsx`.
- **`src/routes/app/reports/ReportsPage.tsx`** — Body replaced. Composes `<ReportsFiltersBar>` + `<ReportsChart>` + `<ReportsTable>` + an export-CSV button. Suggested layout: `src/reports/{ReportsFiltersBar,ReportsChart,ReportsTable,csvExport.ts}.tsx`.
- **`src/auth/authRepo.ts`** — `updateVisitor` + `updateWorkspace` added (D-15).
- **`src/tasks/tasksRepo.ts`** — `updateTask` gains the `completedAt` invariant (D-09). Tests/smoke should verify both transitions (→done stamps, →other clears).
- **`src/tasks/now-ref.ts`** — NEW module. Extracted from `Dashboard.tsx`'s `computeNowRef`. Dashboard imports from here after the extraction (no behavior change).
- **`src/pendo/PENDO_IDS.ts`** — Three new namespaces appended; `Leaves` type derivation is automatic.
- **`package.json`** — Three potential new runtime deps to verify: `@tanstack/react-table`, `@mantine/dates`, `dayjs`, plus `@mantine/notifications` if not already installed. Pin exact versions via `npm view` at install time.
- **New directories created by Phase 4:** `src/tasks/components/`, `src/settings/`, `src/reports/`. Mirrors the per-feature module convention from Phase 2 (`src/auth/`) and Phase 3 (`src/tasks/`, `src/dashboard/`).

</code_context>

<specifics>
## Specific Ideas

- From CLAUDE.md (dynamic-list parameterization): "For dynamic lists (tasks, team members), parameterize: `data-pendo-id='lists.row.complete'` plus `data-pendo-item-id={task.id}`" — applies to the leading-checkbox column rows AND the kebab-menu rows on Lists (D-04). The static `data-pendo-id` is the targetable class; the per-row `data-pendo-task-id` keeps Session Replay attributable.
- From Phase 3 D-21 (now-ref anchor) — Phase 4 Reports inherits the same demo-non-staleness anchor (D-22). Extracting `computeNowRef` into `src/tasks/now-ref.ts` is the canonical shared-module move.
- From Phase 2 destructive-action precedent (sign-out has NO confirm modal because it's reversible) — Phase 4 introduces TWO genuinely destructive flows (delete task, reset demo data). Both get confirm modals (UI-03 from Phase 5 polish already forecasts this rule).
- From Phase 2 D-09 (`crypto.subtle.digest` for password hashing) — Phase 4 must NOT expose Visitor.passwordHash through any Settings form field (D-15). The `Omit` type on `updateVisitor`'s patch arg structurally enforces this.
- From CLAUDE.md "What NOT to Use" → "CSS-in-JS at runtime as primary styling system": ListsPage table styling stays in Mantine-prop-driven styling and component-scoped CSS modules (if used). No styled-components / emotion class targeting.

</specifics>

<deferred>
## Deferred Ideas

- **Kanban board view on Lists** (LIST2-01) — v2 capability with drag-and-drop between status columns (marquee Session Replay demo).
- **Calendar view on Lists** (LIST2-02) — v2.
- **Task detail slide-over with comments + @-mentions** (LIST2-03) — v2.
- **Drag-to-reorder rows on Lists** — No LIST-* requirement covers it; PROJECT.md "reorder" mention is decorative. v2.
- **Workspace switcher in top bar** (WS2-01) — v2.
- **`pendo.identify` re-fire on Settings save** (SET-05 / PEN-04) — Phase 6 owns Pendo runtime.
- **URL persistence of Lists filters** (`?status=todo&priority=high&sort=...`) — Phase 5 polish if needed.
- **"Default landing page" preference** — Considered for Preferences tab; rejected as gold-plating (no consumer in app yet).
- **"Density" preference (Comfortable / Compact)** — v2.
- **Stripe-style "Type RESET to confirm" double-confirm** — Rejected; modal is sufficient (D-17).
- **"Choose columns" CSV export picker** — Rejected; visible columns are the contract (D-23).
- **Custom Halo storage key for theme** (`halo:v1:preferences:theme`) — Rejected; Mantine's built-in `mantine-color-scheme-value` covers it (D-16).
- **Stripe-style status pill cycle UX** for status toggle — Rejected in favor of leading checkbox (D-04).
- **Pagination / row virtualization** — Not needed at v1 row counts.
- **Real-time updates across tabs** — Out of Scope (multi-device / multi-tab sync per PROJECT.md).
- **Email field editable in Profile tab** — Rejected; Visitor.email is the sign-in key (D-13).
- **Two destructive variants ("Reset & sign out" vs "Reset & re-seed")** — Rejected; seeding happens on next sign-in via FND-05 anyway (D-17).
- **Fourth "Danger zone" tab in Settings** — Rejected as premature; Danger zone card inside Preferences is sufficient (D-17).

</deferred>

---

*Phase: 04-core-pages-lists-settings-reports*
*Context gathered: 2026-05-15*
