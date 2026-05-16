---
status: diagnosed
trigger: "UAT Test 4 (Phase 5): Error appeared in console: \"In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error.\" when opening the Invite teammate modal on /app/team."
created: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Focus

hypothesis: InviteTeammateModal passes `<Title order={3}>` (renders `<h3>`) as the Mantine `<Modal>` `title` prop, which Mantine wraps inside its `ModalBaseTitle` `<h2>` slot, producing the invalid `<h2><h3>...</h3></h2>` heading nesting.
test: (a) Read InviteTeammateModal.tsx and confirm `title={<Title order={3}>Invite teammate</Title>}`. (b) Inspect Mantine source for ModalBaseTitle to confirm it renders an `<h2>`. (c) Compare to TaskFormModal precedent for the correct pattern.
expecting: (a) Literal `<Title order={3}>` JSX passed as title — confirmed. (b) Mantine source `<Box component="h2">` — confirmed. (c) TaskFormModal passes plain string — confirmed.
next_action: Return ROOT CAUSE FOUND block (diagnosis-only mode).

## Symptoms

expected: The InviteTeammateModal renders valid HTML with no heading-nesting hydration errors in the dev console.
actual: "In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error." appears in the browser console as soon as the modal mounts.
errors: "In HTML, <h3> cannot be a child of <h2>. This will cause a hydration error."
reproduction: Run dev server. Sign in. Navigate to /app/team. Click "Invite teammate". Observe the error in the browser console.
started: Discovered during /gsd-verify-work for Phase 5 (2026-05-15). Introduced by Phase 5 Plan 04 (commit c497a9e, "feat: PENDO_IDS team namespace + TeamEmptyState + InviteTeammateModal").

## Eliminated

(none — primary hypothesis confirmed on first test)

## Evidence

- timestamp: 2026-05-15T00:00:00Z
  checked: src/team/components/InviteTeammateModal.tsx:108
  found: "Modal opening passes `title={<Title order={3}>Invite teammate</Title>}` — a Mantine `<Title order={3}>` JSX element (renders an `<h3>`) is being given as the `title` prop."
  implication: The element rendered for the title slot is itself an `<h3>`. Whatever wrapper Mantine puts around the title slot becomes the parent of this `<h3>`.

- timestamp: 2026-05-15T00:00:00Z
  checked: node_modules/@mantine/core/esm/components/ModalBase/ModalBaseTitle.mjs (source map exposes original ModalBaseTitle.tsx)
  found: "`ModalBaseTitle` renders `<Box component=\"h2\" className={...} id={id} {...others} />`. The Modal title slot is hard-coded to `<h2>`."
  implication: Mantine v7+ always wraps the `title` prop's content inside an `<h2>`. There is no prop on `<Modal>` to change the heading level of the title slot. Therefore passing an `<h3>` as the title's content guarantees an `<h2><h3>` nesting.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/tasks/components/TaskFormModal.tsx:273
  found: "`title={mode === 'create' ? 'New task' : 'Edit task'}` — a plain string."
  implication: The precedent that Plan 04's SUMMARY claims to follow ("Modal title as `<Title order={3}>` JSX element (not string prop) per Phase 4 modal-nesting fix") is the opposite of what the Phase 4 modal actually does. TaskFormModal passes a string, which Mantine renders correctly as `<h2>New task</h2>`. The Plan 04 SUMMARY misstates the Phase 4 precedent and the InviteTeammateModal implementation embodies that misstatement.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/settings/ResetDemoDataModal.tsx:128 and src/tasks/components/DeleteConfirmModal.tsx:48
  found: "Both pass plain strings: `title=\"Reset demo data?\"` and `title=\"Delete this task?\"` respectively."
  implication: All other modals in the codebase follow the string-title pattern. InviteTeammateModal is the lone deviation introducing the invalid heading nesting.

- timestamp: 2026-05-15T00:00:00Z
  checked: grep `title={<` across src
  found: "Only one match: src/team/components/InviteTeammateModal.tsx:108."
  implication: The bug surface is bounded to this single file. Fixing this one Modal eliminates the entire class of error in the current codebase.

## Resolution

root_cause: "InviteTeammateModal.tsx:108 passes a `<Title order={3}>Invite teammate</Title>` JSX element as the Mantine `<Modal>` `title` prop. Mantine's `ModalBaseTitle` component unconditionally wraps the title slot in `<Box component=\"h2\">` (verified in node_modules/@mantine/core/esm/components/ModalBase/ModalBaseTitle.mjs — original source `<Box component=\"h2\" ... />`). The resulting DOM is `<h2 class=\"...ModalTitle\"><h3 class=\"...Title\">Invite teammate</h3></h2>`, which React 19 flags at hydration as 'In HTML, <h3> cannot be a child of <h2>.' The Plan 04 SUMMARY's claim that this pattern matches a 'Phase 4 modal-nesting fix' is incorrect — TaskFormModal (the Phase 4 precedent) passes a plain string, not a `<Title>` element."
fix: ""
verification: ""
files_changed: []
