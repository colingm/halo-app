# Phase 4: Core Pages (Lists, Settings, Reports) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 04-core-pages-lists-settings-reports
**Areas discussed:** Lists — table, sort & filter UX; Lists — task modal & destructive confirmations; Settings — tabs, dark mode, reset demo data; Reports — filters, chart, CSV shape

---

## Lists — table, sort & filter UX

### Q1: Which table library should Lists use? Reports already requires TanStack Table (REP-02 — not yet installed).

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Table v8 — share with Reports | Headless primitive — full control over markup means stable Pendo selectors. Sharing one table infra across Lists + Reports keeps the codebase coherent. | ✓ |
| Mantine `<Table>` for Lists, TanStack only on Reports | Lighter for the simple CRUD list (~40–60 rows). Cost: two table patterns + hand-rolled sort state. | |
| TanStack on both, thin `<TaskTable>` wrapper | Pre-bakes Halo conventions (PENDO_IDS on rows, Mantine-styled headers, sort-icon affordance). | |

**User's choice:** TanStack Table v8 — share with Reports.
**Notes:** One install, headless control suits Pendo targeting; ~60 rows means no virtualization needed.

### Q2: How should filter affordances surface on /app/lists? (Status / Priority / Assignee per LIST-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Top filter bar with Mantine `<Select>` per dimension | Three Selects + (no search). Familiar SaaS pattern; easy Pendo anchor. | ✓ |
| Inline column-header filter dropdowns (Notion / Linear style) | Each column header has a filter icon popover. More compact but harder for Pendo guides. | |
| Left-side filter sidebar with chips/checkboxes | Persistent sidebar. Heavy visual weight; oversized for ~60 tasks. | |

**User's choice:** Top filter bar.

### Q3: How should LIST-04 'mark complete/incomplete with single click' present?

| Option | Description | Selected |
|--------|-------------|----------|
| Leading `<Checkbox>` column | Fixed first column; click toggles status. Standard task-app pattern (Linear/Asana/Todoist). | ✓ |
| Status pill cycles on click | Single column does double duty; less discoverable. | |
| Trailing 'Mark complete' button | Most discoverable; visually heavy. | |

**User's choice:** Leading checkbox column.

### Q4: URL persistence for filter + sort state?

| Option | Description | Selected |
|--------|-------------|----------|
| Component state only (Phase 4) | useState in ListsPage; refresh resets to defaults. Mirrors Phase 3 D-20. | ✓ |
| URL search params (?status=todo&priority=high&sort=dueDate:asc) | Survives refresh + shareable. Adds `useSearchParams` plumbing. | |

**User's choice:** Component state only.

### Q5: Which columns + default sort?

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox / Title / Status / Priority / Assignee / Due / Actions — sort createdAt desc | Seven columns; trailing kebab = Edit + Delete. Default newest first. | ✓ |
| Same columns sort dueDate asc (overdue first) | Operationally useful; null dueDates create dead air. | |
| Drop Actions kebab, row-click opens edit modal | Where does Delete live? In modal footer. | |

**User's choice:** Seven columns; default sort createdAt desc; trailing Actions kebab.

### Q6: Empty-state strategy?

| Option | Description | Selected |
|--------|-------------|----------|
| Two distinct empty states | No-tasks-ever = hero CTA (guide anchor); filters-yield-zero = compact in-table + 'Clear filters' link. | ✓ |
| One generic 'No tasks to show' empty state | Simpler; loses guide-anchor opportunity LIST-08 calls out. | |

**User's choice:** Two distinct empty states.

---

## Lists — task modal & destructive confirmations

### Q1: How should the task editor surface? (LIST-02 + LIST-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Mantine `<Modal>` + shared `<TaskForm>` (create + edit) | RHF + Zod (Phase 2 pattern), TaskSchema. Mode-driven header. Familiar SaaS pattern. | ✓ |
| Mantine `<Drawer>` from the right (Linear-style) | More content room; new drawer pattern. v2 LIST2-03 would land here. | |
| Full-page routes /new + /:id/edit | Most accessible; pushes back on locked 'modal form' wording. | |

**User's choice:** Mantine `<Modal>` + shared `<TaskForm>`.

### Q2: Which fields should the form expose?

| Option | Description | Selected |
|--------|-------------|----------|
| All 7 user-editable fields with defaults preset | Title / Description / Status (default 'todo') / Priority (default 'medium') / Assignee / Due date. completedAt auto-managed. | ✓ |
| Required-only for create; full set in edit | Two divergent forms; harder Pendo guide consistency. | |
| All fields including manual completedAt | Power user — almost always wrong. | |

**User's choice:** All 7 fields with defaults.

### Q3: Assignee Select options source (no K.teammates store until Phase 5)?

| Option | Description | Selected |
|--------|-------------|----------|
| Derive distinct-assignee list from existing tasks | Dedupe `task.assignee` by id; always include current visitor. Forward-compatible: Phase 5 swaps source. | ✓ |
| Hand-rolled `fakeAssignees` constant scoped to Phase 4 | Throw away in Phase 5. Transient file. | |
| Self only (current visitor) | Loses LIST-07 filter-by-assignee value. | |

**User's choice:** Derive distinct from tasks; always include current visitor.

### Q4: LIST-05 delete confirmation flow?

| Option | Description | Selected |
|--------|-------------|----------|
| Nested confirm modal from row kebab + edit modal footer | One canonical destructive flow. Edit modal has 'Delete task' (red, left-aligned). | ✓ |
| Confirm only from row kebab | User mid-edit must close to delete. | |
| Toast with Undo, no confirm modal | Contradicts UI-03. | |

**User's choice:** Nested confirm modal from both surfaces.

### Q5: How should completedAt be set when status transitions?

| Option | Description | Selected |
|--------|-------------|----------|
| Repo-level invariant in `tasksRepo.updateTask` | Stamps on →done; clears on →other. UI doesn't think about it. Covers checkbox + modal. | ✓ |
| UI-level: caller passes completedAt explicitly | Fragile cross-call-site invariant. | |

**User's choice:** Repo-level invariant.

---

## Settings — tabs, dark mode, reset demo data

### Q1: How should Settings tabs be driven?

| Option | Description | Selected |
|--------|-------------|----------|
| URL search param `?tab=profile|workspace|preferences` | Honors Phase 3 D-16 deep-link; useSearchParams source of truth; back/forward navigates tabs. | ✓ |
| Component state, ignore `?tab=` param | Drops Phase 3 D-16. | |
| Path-based /app/settings/{profile|workspace|preferences} | Three sub-routes; needs router edits. | |

**User's choice:** URL search param `?tab=`.

### Q2: What lives in Preferences besides theme toggle (SET-04)?

| Option | Description | Selected |
|--------|-------------|----------|
| Just theme toggle for Phase 4 | Mantine useMantineColorScheme; no filler. | ✓ |
| Theme + Default landing page dropdown | Useful Pendo surface; router complexity. | |
| Theme + Density + Default landing page | Cross-page wiring for density; scope creep. | |

**User's choice:** Just theme toggle.

### Q3: How should Profile + Workspace saves persist?

| Option | Description | Selected |
|--------|-------------|----------|
| Extend authRepo with updateVisitor/updateWorkspace + setCurrent* | Mirrors tasksRepo pattern; topbar reflects changes instantly. RHF + Zod with existing schemas. | ✓ |
| Direct writeJSON bypass | Breaks repo ownership pattern. | |
| New settingsRepo.ts wrapper | Extra layer for no value. | |

**User's choice:** Extend authRepo + push to authStore.

### Q4: Edit-in-place per-tab Save / Cancel, or autosave per field?

| Option | Description | Selected |
|--------|-------------|----------|
| Form with Save/Cancel buttons per tab | RHF isDirty + Cancel resets. Single toast on save. Maps cleanly to Phase 6 PEN-04. | ✓ |
| Inline autosave per field | Ambiguous failure recovery; PEN-04 fires per field. | |

**User's choice:** Save/Cancel per tab.

### Q5: How should 'Reset demo data' (SET-06) execute?

| Option | Description | Selected |
|--------|-------------|----------|
| Modal → wipe `halo:v1:*` keys + signupDraft → hard reload to `/` | Re-runs boot sequence with clean state. | ✓ |
| Add 'Type RESET to confirm' input | Stripe/GitHub-style double-confirm; overkill for demo data. | |
| Two buttons: 'Reset & sign-out' vs 'Reset & re-seed' | Re-seeding without signed-in workspaceId is awkward; seeding happens on next sign-in anyway. | |

**User's choice:** Modal → wipe + hard reload.

### Q6: Where should Reset live?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom of Preferences in 'Danger zone' card with `c='red.7'` | GitHub-style danger zone; quarantined from theme toggle. | ✓ |
| Fourth tab 'Danger zone' | Premature; only one button. | |
| Sticky footer across all tabs | Higher chance of accidental click. | |

**User's choice:** Danger zone card at bottom of Preferences.

### Q7: How does dark mode wire?

| Option | Description | Selected |
|--------|-------------|----------|
| Mantine `useMantineColorScheme()` + existing `<ColorSchemeScript />` | No new Halo storage key (Mantine owns `mantine-color-scheme-value`). Charts/cards using `var(--mantine-color-*)` recolor for free. | ✓ |
| Custom `halo:v1:preferences:theme` + custom Provider | Halo-owned key; redundant with Mantine's built-in. | |

**User's choice:** Mantine built-in.

---

## Reports — filters, chart, CSV shape

### Q1: Which filter dimensions (REP-01 requires date range + at least one other)?

| Option | Description | Selected |
|--------|-------------|----------|
| Date range + Assignee + Status (three dimensions) | DatePickerInput range + Select + MultiSelect. Richer demo surface than Lists. | ✓ |
| Date range + Status only (two) | Minimum to satisfy REP-01. | |
| Date range + Assignee + Status + Priority (four) | Maximum; could feel busy. | |

**User's choice:** Three dimensions.

### Q2: REP-03 chart choice?

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked bar chart 'Tasks by status per day' | Distinct from Dashboard's area chart; reinforces 'Reports is its own page'. | ✓ |
| Reuse Dashboard's area chart, scoped to filters | Less work; visually identical to Dashboard. | |
| Two charts: stacked bar + small donut by assignee | More demo surface; feels like Dashboard v2. | |

**User's choice:** Stacked bar chart.

### Q3: REP-02 columns + row source?

| Option | Description | Selected |
|--------|-------------|----------|
| Title / Status / Priority / Assignee / Due / Completed at — rows = filtered tasks, sort createdAt desc | Six columns; read-only (edits live on Lists). | ✓ |
| Aggregate per-assignee summary (Total / Completed / Overdue / Rate) | More 'report'-like; harder to map to TaskSchema. | |
| Per-day breakdown (Date / Created / Completed / Open / Overdue) | Pairs with chart axis; many rows on 90d. | |

**User's choice:** Six columns over filtered tasks.

### Q4: CSV export shape?

| Option | Description | Selected |
|--------|-------------|----------|
| Visible columns + filename `halo-tasks-YYYY-MM-DD.csv` | Client Blob + RFC 4180 quoting; honors active filters. | ✓ |
| Export ALL Task fields regardless of visible | Drift between table and file. | |
| 'Choose columns' modal before export | Only 6 columns; premature. | |

**User's choice:** Visible columns; halo-tasks-YYYY-MM-DD.csv.

### Q5: Date range anchor — wall clock or Phase 3 nowRef?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse Phase 3 D-21 nowRef (max task timestamp); default [nowRef-30d, nowRef] | Demo never goes stale. Extract `computeNowRef` to shared `src/tasks/now-ref.ts`. | ✓ |
| Wall-clock new Date() anchor | Wall-clock months later hits empty data (Phase 3 D-21 problem). | |

**User's choice:** Reuse nowRef; extract to shared module.

---

## Claude's Discretion

- Toast notification copy ("Task saved" vs "Changes saved") — planner picks at compose time.
- Tabler icon picks (e.g., DangerZone, CSV export) — recommendations made, planner can substitute.
- Page-header vs table-card placement for the New Task button.
- Whether `<Modal>` / `<MenuTrigger>` / `<Tabs>` need `pendoId: PendoId` wrappers or forward via existing slot props.
- Whether to extract a shared `useTaskFilters()` hook (Lists vs Reports) or keep per-page state.
- Whether Reset demo data should also wipe Mantine's `mantine-color-scheme-value` for a "factory reset" feel.
- Default `<DatePickerInput type='range'>` UX nits (valueFormat, max-range cap).

## Deferred Ideas

- Kanban / Calendar / Task-detail slide-over (LIST2-01..03) — v2.
- Drag-to-reorder rows — no requirement covers it; v2.
- Workspace switcher (WS2-01) — v2.
- `pendo.identify` re-fire on Settings save (SET-05) — Phase 6.
- URL persistence for Lists filters — Phase 5 polish if needed.
- Density / default landing page preferences — gold-plating.
- "Type RESET to confirm" double-confirm — modal alone is sufficient.
- "Choose columns" CSV export picker — premature.
- Custom Halo theme storage key — Mantine's built-in covers it.
- Email field editable in Profile — sign-in key; rejected.
- Pagination / virtualization — not needed at v1 row counts.
- Real-time cross-tab updates — Out of Scope.
