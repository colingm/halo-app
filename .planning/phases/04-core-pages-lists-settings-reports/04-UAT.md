---
status: complete
phase: 04-core-pages-lists-settings-reports
source:
  - 04-01-SUMMARY.md
  - 04-02-SUMMARY.md
  - 04-03-SUMMARY.md
  - 04-04-SUMMARY.md
  - 04-05-SUMMARY.md
  - 04-06-SUMMARY.md
  - 04-VERIFICATION.md (human_verification items)
started: 2026-05-15T17:25:00Z
updated: 2026-05-15T17:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Lists CRUD round-trip
expected: Sign in, navigate to /app/lists. Create a task via "New task" → toast appears + row visible. Edit it via kebab → row reflects update. Toggle the leading checkbox → status badge flips to Done; toggle again → flips back. Hard-refresh — all mutations survive. Delete via kebab → confirm modal opens → row removed + toast.
result: issue
reported: |
  - Error when clicking on "New task": In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error.
  - After creating a new task and then clicking "New task" again, the form is filled out with the values used the last time.
  - After clicking the leading checkbox on a "In Progress" item and then clicking it again to uncheck it, it sets the status to "To Do", not that big of a deal, if the fix is small let's fix it, if it is more involved, leave it alone
  - When clicking the "Delete task" button, I get the same <h3> cannot be a child of <h2> error
severity: major
sub_issues:
  - id: 1a
    summary: "<h3> cannot be child of <h2> hydration error on New task modal"
    severity: major
  - id: 1b
    summary: "New task modal re-opens with previous submission's field values (form not reset after successful create)"
    severity: major
  - id: 1c
    summary: "Checkbox un-toggle on in_progress task collapses to 'todo' instead of restoring 'in_progress' (user-permitted fix only if small)"
    severity: minor
  - id: 1d
    summary: "<h3> cannot be child of <h2> hydration error on Delete confirm modal"
    severity: major

### 2. Reset demo data round-trip
expected: Go to /app/settings?tab=preferences. Scroll to the "Danger zone" card → click "Reset demo data" → confirm in the modal. The page hard-reloads to / (public landing). DevTools → Application → Local Storage shows zero `halo:v1:*` keys remaining. The `mantine-color-scheme-value` localStorage key is preserved (theme survives). sessionStorage signup-draft is wiped.
result: issue
reported: |
  - When clicking "Reset demo data", error in console appeared: In HTML, <h3> cannot be a child of <h2>
  - After reseting, "halo:v1:meta" was the only thing in local storage
severity: major
sub_issues:
  - id: 2a
    summary: "<h3> cannot be child of <h2> hydration error on Reset demo data confirm modal (same root cause as 1a/1d — pervasive Mantine Modal title pattern)"
    severity: major
  - id: 2b
    summary: "halo:v1:meta key survives Reset demo data — either reset prefix filter missed it OR a boot-time module rewrote it post-reload (likely runMigrations / seed-gate). Contract says 'every halo:v1:* key' should be gone."
    severity: major

### 3. Theme toggle propagation
expected: Sign back in. Go to /app/settings?tab=preferences. Toggle the theme SegmentedControl between Light / Dark / System. On each toggle, the AppShell, Dashboard, Lists, Reports, and Settings itself all recolor immediately — no missed surfaces. Hard-refresh the page — preference persists (page boots in the chosen scheme, no flash of wrong theme).
result: pass

### 4. Reports CSV download
expected: Navigate to /app/reports. Click "Export CSV" (top-right). A file named `halo-tasks-YYYY-MM-DD.csv` (with today's date) downloads. Open it in a spreadsheet app (Excel / Numbers / Sheets / VS Code). Six columns are visible — Title / Status / Priority / Assignee / Due date / Completed at. Any title containing a comma or double-quote is correctly wrapped in quotes. Date columns render as YYYY-MM-DD.
result: pass

### 5. Reports timezone correctness (CR-01 + CR-02 regression)
expected: Confirm your system clock is set to a non-UTC timezone (e.g., Eastern, Pacific, Tokyo). On Lists, open the "New task" modal → set Due date to today (e.g., May 15, 2026) → Save. The new row's Due-date cell shows "May 15, 2026" (NOT "May 14, 2026"). Reopen the task in edit mode — the picker still shows May 15. Navigate to /app/reports. The same task's Due-date cell in the Reports table also shows "May 15, 2026". In the Reports filter bar, pick a 7-day date range that includes today. The number of rows in the table equals the number of bars-worth of tasks in the chart for that range (no rows-without-bars or bars-without-rows mismatch).
result: pass

### 6. Reports deselect-all-status survival (CR-03 regression)
expected: On /app/reports, the Status MultiSelect starts with all three statuses (To do / In progress / Done) selected. Click the X on each Status chip until the MultiSelect is empty. The Reports table CONTINUES to show all tasks (matching the active date range + assignee filter), not an empty "No tasks match these filters" state. The chart also shows bars for those tasks. Export CSV button is enabled. Re-select one or more statuses — the table filters down as expected.
result: pass

## Summary

total: 6
passed: 4
issues: 6
pending: 0
skipped: 0
blocked: 0
issues_by_severity:
  major: 4   # 1a, 1b, 1d, 2a
  minor: 2   # 1c (conditional), 2b (doc-only contract clarification)

## Gaps

- truth: "Clicking 'New task' on /app/lists opens a Mantine Modal without HTML nesting errors."
  status: failed
  reason: "User reported: Error when clicking on 'New task': In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error."
  severity: major
  test: 1
  sub_issue: 1a
  root_cause: "Mantine <Modal title={...}/> wraps the title slot in its own <h2> element; the project passes <Title order={3}>{...}</Title> as the title, producing <h2><h3>…</h3></h2> — invalid HTML and a React hydration warning."
  artifacts:
    - path: "src/tasks/components/TaskFormModal.tsx"
      line: 240
      issue: "title={<Title order={3}>{mode === 'create' ? 'New task' : 'Edit task'}</Title>}"
  missing:
    - "Drop the inner heading element. Pass the plain string (or a <Text fw={600}> if explicit weight is desired) as the title — Mantine's Modal already renders the title in an h2 wrapper with appropriate styling."

- truth: "After successfully creating a new task, clicking 'New task' again opens a clean form with default values (not the previous submission's values)."
  status: failed
  reason: "User reported: After creating a new task and then clicking 'New task' again, the form is filled out with the values used the last time."
  severity: major
  test: 1
  sub_issue: 1b
  root_cause: "TaskFormModal uses RHF `values: defaultValues` to drive its form state, but the modal component stays mounted across open/close cycles (parent ListsPage toggles `opened` rather than unmounting). After a successful create-mode submit, the form's internal dirty state is not reset — neither `form.reset()` nor a `key` prop change forces RHF to re-initialize from `defaultValues`."
  artifacts:
    - path: "src/tasks/components/TaskFormModal.tsx"
      line_range: "106-155"
      issue: "`onSubmit = form.handleSubmit((values) => { if (mode === 'create') createTask(...) })` does not call `form.reset(defaultValues)` after createTask succeeds, and the modal remains mounted across open/close."
  missing:
    - "Call `form.reset(defaultValues)` immediately after a successful create-mode submit (before/after closing the modal), OR add a `useEffect` that resets the form when `opened` transitions from false → true in create mode."
    - "Alternative: pass a changing `key={mode === 'create' ? createNonce : initialTask?.id}` to the Modal so create-mode reopens force a remount with a fresh RHF instance — slightly less surgical but eliminates the persistence entirely."

- truth: "Toggling the leading checkbox off a previously 'in_progress' task restores its prior status ('in_progress'), not 'todo'."
  status: failed
  reason: "User reported: After clicking the leading checkbox on a 'In Progress' item and then clicking it again to uncheck it, it sets the status to 'To Do', not that big of a deal, if the fix is small let's fix it, if it is more involved, leave it alone"
  severity: minor
  conditional: "Fix only if scope is small — user-permitted no-op if non-trivial."
  test: 1
  sub_issue: 1c
  root_cause: "ListsPage onToggleComplete is hard-coded as `status: nextDone ? 'done' : 'todo'` (src/routes/app/lists/ListsPage.tsx:148). When `nextDone === false`, the prior status (which may have been 'in_progress') is dropped — the off-target is always 'todo'."
  artifacts:
    - path: "src/routes/app/lists/ListsPage.tsx"
      line: 148
      issue: "`status: nextDone ? 'done' : 'todo'` — lossy off-target"
  missing:
    - "Small fix (recommended given user's 'small only' condition): extend `tasksRepo.updateTask` (or createTask) to stamp a `prevStatus: TaskStatus | null` field when transitioning into 'done', and read it back when transitioning out. Mirrors the D-09 `completedAt` invariant pattern. Net surface area: ~10 lines in tasksRepo + 1 line in ListsPage handler (pass `status: nextDone ? 'done' : task.prevStatus ?? 'todo'`). Touches Task schema + types — moderate but still within 'small'."
    - "Smaller fix (no schema change): track `lastNonDoneStatus[taskId]` in ListsPage component state (`useState<Record<string, TaskStatus>>`). Less robust across page reloads but zero persistence work. Net surface area: ~6 lines."
    - "If neither fix is acceptable in scope: skip per user's conditional permission and leave behavior as-is."

- truth: "Clicking the 'Delete task' button (kebab → Delete or modal footer 'Delete task') opens a Mantine confirm Modal without HTML nesting errors."
  status: failed
  reason: "User reported: When clicking the 'Delete task' button, I get the same <h3> cannot be a child of <h2> error"
  severity: major
  test: 1
  sub_issue: 1d
  root_cause: "Same pattern as 1a — DeleteConfirmModal passes `title={<Title order={3}>Delete this task?</Title>}` to Mantine <Modal>."
  artifacts:
    - path: "src/tasks/components/DeleteConfirmModal.tsx"
      line: 46
      issue: "title={<Title order={3}>Delete this task?</Title>}"
  missing:
    - "Same fix as 1a — drop the inner <Title order={3}>. Single PR can address 1a + 1d + 2a together."

- truth: "Clicking 'Reset demo data' on /app/settings?tab=preferences opens a Mantine confirm Modal without HTML nesting errors."
  status: failed
  reason: "User reported: When clicking 'Reset demo data', error in console appeared: In HTML, <h3> cannot be a child of <h2>"
  severity: major
  test: 2
  sub_issue: 2a
  root_cause: "Same pattern as 1a/1d — ResetDemoDataModal passes `title={<Title order={3}>Reset demo data?</Title>}` to Mantine <Modal>."
  artifacts:
    - path: "src/settings/ResetDemoDataModal.tsx"
      line: 89
      issue: "title={<Title order={3}>Reset demo data?</Title>}"
  missing:
    - "Same fix as 1a/1d — drop the inner <Title order={3}>. Plan should batch all three Modal title fixes into one task; verify no other Modal sites use the same pattern (grep `title={<Title` across src/)."

- truth: "After confirming Reset demo data, no `halo:v1:*` keys remain in localStorage."
  status: failed
  reason: "User reported: After reseting, 'halo:v1:meta' was the only thing in local storage"
  severity: minor
  reclassified_from: major
  test: 2
  sub_issue: 2b
  root_cause: "EXPECTED post-reload state — not a wipe failure. The reset DOES delete `halo:v1:meta` at confirm time (the prefix scan uses `halo:v` and matches the meta key). The page then hard-reloads to `/`; on boot, `src/main.tsx` calls `runMigrations()` which writes a fresh `halo:v1:meta` ({schemaVersion: 1, seededAt: null, appVersion: '0.1.0'}) via `writeJSON(K.meta(), DEFAULT_META)` (src/storage/migrations.ts:55-57). This is intentional — the storage envelope cannot boot without it. The user-observable contract (\"every halo:v1:* key is gone\") is true at the moment of reset but inevitably untrue post-reload."
  artifacts:
    - path: "src/storage/migrations.ts"
      line_range: "52-57"
      issue: "`runMigrations()` writes DEFAULT_META on boot when `peekRaw(K.meta())` returns null."
    - path: "src/main.tsx"
      line: "(early boot)"
      issue: "Calls `runMigrations()` before React mounts — happens immediately after the post-reset hard reload."
    - path: "src/settings/ResetDemoDataModal.tsx"
      line_range: "56-63"
      issue: "Two-pass scan-then-remove for `halo:v` prefix — works correctly for `halo:v1:meta`. Not the bug."
  missing:
    - "Doc-only fix (recommended, cheapest): Update CONTEXT.md D-17 and ResetDemoDataModal.tsx JSDoc to clarify the post-reload re-creation of `halo:v1:meta` with seededAt:null. The wipe IS complete at confirm; the freshly-rewritten meta is just the storage envelope's boot record."
    - "Alternative (heavier, not recommended): Lazy-create meta — defer `runMigrations()` until first storage write. Net effect: post-reset localStorage is empty until the user signs back in. Risk: breaks the boot-time schema-version check ordering. Probably not worth the surface area."
    - "Per user severity (\"the only thing was halo:v1:meta\") this is a contract-clarification issue, not a behavior bug. Downgrading from major to minor."
