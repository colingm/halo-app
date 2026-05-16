---
status: resolved
trigger: "The \"Invite teammate\" popup kept the values from the previous invite if clicked multiple times without a full refresh."
created: 2026-05-15T00:00:00Z
updated: 2026-05-16T01:52:42Z
---

## Current Focus

hypothesis: InviteTeammateModal's `useForm` hook retains values across open/close cycles because the InviteTeammateModal component itself remains mounted by TeamPage. The `keepMounted={false}` on the inner Mantine `<Modal>` only unmounts the DOM content, NOT the surrounding React component or its `useForm` hook. No `reset()` is called on submit success or modal close, and there is no false→true open-transition reset effect like the one Phase 4 added to TaskFormModal (CR-01 fix, lines 149-165).
test: Static analysis of InviteTeammateModal.tsx + TeamPage.tsx + comparison to TaskFormModal.tsx (Phase 4 precedent).
expecting: Confirmed — exactly the same defect class as Phase 4 CR-01, fix already exists as a copy-paste-ready pattern.
next_action: Return ROOT CAUSE FOUND diagnosis. No code changes (find_root_cause_only mode).

## Symptoms

expected: Modal opens with blank defaults on every reopen (email: '', workspaceRole: 'Member'). After successful invite submission OR cancel, next click of "Invite teammate" should show empty email field and the default role.
actual: "The \"Invite teammate\" popup kept the values from the previous invite if clicked multiple times without a full refresh."
errors: (none — silent state leak, no error message)
reproduction: Test 1 in `.planning/phases/05-team-help-polish/05-UAT.md`. Sign in → navigate to `/app/team` → click "Invite teammate" → fill email + role → submit (or cancel) → click "Invite teammate" again → previous values still present.
started: Phase 5 (plan 05-04), Wave 4 commit c497a9e — the InviteTeammateModal landed without the open-transition reset effect that Phase 4 added to TaskFormModal.

## Eliminated

(none — first hypothesis was immediately confirmed by static analysis; no alternate hypotheses needed testing.)

## Evidence

- timestamp: 2026-05-15T00:00:00Z
  checked: src/team/components/InviteTeammateModal.tsx lines 67-71 — `useForm` setup
  found: `useForm` is initialized once with `defaultValues: { email: '', workspaceRole: 'Member' }`. RHF persists these as the "initial" defaults, but the running form state (the actual field values) is held in an internal ref that is NOT touched by anything other than user input, `reset()`, or the `values` prop.
  implication: The form state survives across all renders as long as the `useForm` hook stays mounted. Default values are only applied on mount, not on subsequent re-opens.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/team/components/InviteTeammateModal.tsx lines 73-102 — `onSubmit` handler
  found: After a successful submit the handler calls `notifications.show(...)`, `onSuccess()`, and `onClose()`. It does NOT call `form.reset()`. There is no other reset call anywhere in the file (no useEffect, no onClose wrapper, nothing).
  implication: Submitted values persist in RHF state after submit. Clicking "Invite teammate" again surfaces them.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/team/components/InviteTeammateModal.tsx line 111 — Mantine Modal `keepMounted={false}`
  found: The doc comment on line 16 claims "keepMounted={false} drops RHF state on close (mirrors TaskFormModal D-26 idiom)." This is INCORRECT. The author appears to have misunderstood what `keepMounted` does.
  implication: This is a load-bearing misconception in the file's design. `keepMounted` controls Mantine's INTERNAL transition node mount lifecycle (the modal's content node), but `InviteTeammateModal` (the outer React component holding the `useForm` hook) is rendered unconditionally by TeamPage and stays mounted regardless. The `useForm` hook lives on the OUTER component, not inside Mantine's transitioned content, so `keepMounted` has zero effect on RHF state.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/routes/app/team/TeamPage.tsx lines 91-96 — modal rendering
  found: TeamPage renders `<InviteTeammateModal opened={inviteOpen} ... />` UNCONDITIONALLY (not gated on `inviteOpen`). The `opened` prop just toggles Mantine's internal visibility — the React component itself is mounted from first render of TeamPage and stays mounted for the page's entire lifetime.
  implication: `InviteTeammateModal` is mounted exactly once per TeamPage visit. The `useForm` hook inside it is created exactly once and retains its values until the user navigates away from /app/team (full route change/unmount).

- timestamp: 2026-05-15T00:00:00Z
  checked: node_modules/@mantine/core/esm/components/Modal/Modal.mjs line 24 + ModalRoot.mjs line 23
  found: Both Mantine `<Modal>` and `<Modal.Root>` use `keepMounted: false` as default. Setting it explicitly is a no-op vs the default.
  implication: The explicit `keepMounted={false}` in InviteTeammateModal line 111 is decorative — it documents intent but provides no actual reset behavior beyond Mantine's default DOM-unmount of the modal's transitioned content.

- timestamp: 2026-05-15T00:00:00Z
  checked: src/tasks/components/TaskFormModal.tsx lines 149-165 — Phase 4 CR-01 fix
  found: TaskFormModal solves this exact class of bug with an explicit open-transition reset effect:
  ```
  const prevOpenedRef = useRef(opened)
  useEffect(() => {
    const wasClosed = !prevOpenedRef.current
    prevOpenedRef.current = opened
    if (opened && wasClosed && mode === 'create') {
      form.reset(defaultValues)
    }
  }, [opened, mode, form, defaultValues])
  ```
  The comment block on lines 149-157 explicitly calls out why `keepMounted={false}` and the `values: defaultValues` prop are BOTH insufficient on their own.
  implication: The pattern needed to fix InviteTeammateModal already exists, is documented as a deliberate fix for a structurally identical defect (Phase 4 CR-01), and was simply not ported to the new modal. This is the canonical drop-in fix.

- timestamp: 2026-05-15T00:00:00Z
  checked: Cross-reference of InviteTeammateModal doc comment line 16 vs actual behavior
  found: The file's own doc comment incorrectly claims the `keepMounted={false}` idiom drops RHF state. The Phase 4 TaskFormModal comment (lines 149-157) explicitly contradicts this — Phase 4 learned that `keepMounted={false}` alone does NOT solve the reopen problem (that's what CR-01 was).
  implication: The Phase 5 author copied the `keepMounted={false}` line from TaskFormModal but missed the accompanying `prevOpenedRef` + open-transition `form.reset()` effect that is the actual fix. The doc comment locked in the misconception.

## Resolution

root_cause: |
  `InviteTeammateModal` initializes `useForm` once and never calls `form.reset()` between modal opens. The component is rendered unconditionally by `TeamPage` (TeamPage.tsx lines 91-96), so it stays mounted across the entire TeamPage lifetime — the `useForm` hook's internal state survives across every open/submit/close cycle. Mantine `<Modal>`'s `keepMounted={false}` (InviteTeammateModal.tsx line 111) only controls Mantine's internal transitioned-content DOM lifecycle, NOT the React component holding the `useForm` hook, so it provides zero reset behavior despite the doc comment on line 16 claiming it does.

  The fix Phase 4 added to `TaskFormModal` (CR-01, lines 149-165) — a `prevOpenedRef`-tracked false→true open-transition `useEffect` that calls `form.reset(defaultValues)` — was not ported to `InviteTeammateModal`.

fix: (deferred — diagnosis only per find_root_cause_only mode)
verification: (deferred)
files_changed: []
