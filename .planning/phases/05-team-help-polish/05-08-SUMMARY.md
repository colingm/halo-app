---
phase: 05-team-help-polish
plan: 08
subsystem: ui
tags: [react, mantine, react-hook-form, zod, modal, bug-fix, gap-closure]

# Dependency graph
requires:
  - phase: 05-04
    provides: InviteTeammateModal component (original implementation with state-leak and h3-in-h2 bugs)

provides:
  - InviteTeammateModal with CR-01 open-transition reset pattern (Gap 2 closed)
  - InviteTeammateModal with plain string title prop (Gap 3 closed)

affects: [phase-06-pendo-install]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "InviteTeammateModal: prevOpenedRef + open-transition useEffect calling form.reset(defaultValues) on false->true opened transition (mirrors TaskFormModal CR-01)"
    - "defaultValues hoisted into useMemo with empty dep array for stable reference in useEffect deps"
    - "Modal title as plain string — Mantine ModalBaseTitle wraps title slot in <h2>; passing string produces valid <h2>; passing <Title order={3}> produces invalid <h2><h3>"

key-files:
  modified:
    - src/team/components/InviteTeammateModal.tsx
    - .planning/phases/05-team-help-polish/05-04-SUMMARY.md

key-decisions:
  - "Bundle Gaps 2+3 in one plan: both bugs live in the same file (InviteTeammateModal.tsx), have surgical fixes, and keeping them in a single plan avoids two near-trivial commits for ~30 lines of edits in one file"
  - "Drop mode === 'create' guard from CR-01 port: InviteTeammateModal has only one mode, no guard needed"
  - "defaultValues useMemo with empty dep array: invite form defaults are constants (no mode flip, no edit-mode initialTask), so [] is honest and keeps effect dep array stable"
  - "Keep keepMounted={false} as decorative: removing it is out of scope for this gap closure; it is harmless and documents intent"

# Metrics
duration: ~7min
completed: 2026-05-16T01:33:59Z
---

# Phase 5 Plan 08: InviteTeammateModal Cleanup Summary

**Gap 2 + Gap 3 closed: CR-01 open-transition reset pattern ported, h3-in-h2 heading nesting eliminated, doc comment corrected, unused Title import removed, 05-04-SUMMARY patterns entry corrected**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-05-16T01:26:00Z
- **Completed:** 2026-05-16T01:33:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- **Gap 2 (form state leak) closed:** Added `prevOpenedRef` + open-transition `useEffect` calling `form.reset(defaultValues)` on the `false->true` `opened` transition. Mirrors `TaskFormModal.tsx` CR-01 fix at lines 149-165, minus the `mode === 'create'` guard (InviteTeammateModal has only one mode). `defaultValues` is now hoisted into a `useMemo` with empty dep array so the effect's dep array is honest and the reset fires only on the transition, not every render.
- **Gap 3 (h3-in-h2 React 19 hydration error) closed:** Changed `title={<Title order={3}>Invite teammate</Title>}` to `title="Invite teammate"`. Mantine's `ModalBaseTitle` renders the title slot as `<Box component="h2">` unconditionally; passing a plain string produces valid `<h2>Invite teammate</h2>`; the `<Title order={3}>` JSX was producing invalid `<h2><h3>...</h3></h2>` that React 19 flagged at hydration.
- **Unused import removed:** `Title` removed from the `@mantine/core` import; remaining imports (`Modal, Stack, Group`) are all still in use.
- **React imports updated:** `useEffect` and `useRef` added alongside the existing `useMemo`.
- **Doc comment corrected:** Line 16's misleading "keepMounted={false} drops RHF state on close" claim replaced with an accurate description of the actual reset mechanism (the open-transition useEffect).
- **05-04-SUMMARY.md corrected:** `patterns-established` line 52 updated from the mistaken `"Modal title as <Title order={3}> JSX element (not string prop) per Phase 4 modal-nesting fix"` to the accurate plain-string rule with full rationale and Phase 4 precedent references.

## Task Commits

Each task was committed atomically:

1. **Task 1: Port CR-01 reset pattern + fix h3-in-h2 + cleanup unused import + doc comment** - `604c980` (fix)
2. **Task 2: Correct 05-04-SUMMARY patterns-established modal-title entry** - `77b90c7` (docs)

## Files Modified

- `src/team/components/InviteTeammateModal.tsx` — Five surgical edits:
  1. React imports: `import { useMemo }` → `import { useEffect, useMemo, useRef }`
  2. Mantine imports: `Modal, Stack, Group, Title` → `Modal, Stack, Group` (Title removed)
  3. Added `const defaultValues: InviteFormValues = useMemo(() => ({ email: '', workspaceRole: 'Member' as const }), [])` and updated `useForm` to use it
  4. Added `prevOpenedRef` + open-transition `useEffect` (CR-01 port)
  5. Changed `title={<Title order={3}>Invite teammate</Title>}` → `title="Invite teammate"`
  6. File-header doc comment: replaced keepMounted misconception with accurate reset-mechanism description
- `.planning/phases/05-team-help-polish/05-04-SUMMARY.md` — One-line correction: `patterns-established[1]` entry updated to describe the plain-string modal-title rule

## Exact Line-Range Change Summary (InviteTeammateModal.tsx)

| Edit | Before | After |
|------|--------|-------|
| React import (line 19) | `import { useMemo } from 'react'` | `import { useEffect, useMemo, useRef } from 'react'` |
| Mantine import (line 23) | `Modal, Stack, Group, Title` | `Modal, Stack, Group` |
| defaultValues binding (new, before useForm) | *(absent)* | `const defaultValues: InviteFormValues = useMemo(() => ({ email: '', workspaceRole: 'Member' as const }), [])` |
| useForm defaultValues (line 70) | `defaultValues: { email: '', workspaceRole: 'Member' }` | `defaultValues` (reference to memoized binding) |
| CR-01 reset effect (new, after useForm) | *(absent)* | `prevOpenedRef + useEffect → form.reset(defaultValues)` |
| Modal title prop (line 108) | `title={<Title order={3}>Invite teammate</Title>}` | `title="Invite teammate"` |
| File-header doc comment (line 16) | `keepMounted={false} drops RHF state on close...` | Accurate description of useEffect-driven reset |

## Preserved Behavior (No Regressions)

- **InviteFormSchema + .superRefine dedupe (D-03):** Preserved verbatim — `useMemo([workspaceId])` wrapping the schema is untouched.
- **onSubmit handler:** firstName derivation, `createTeammate` call, toast copy `'Invite sent — Sent to {email}'` — all unchanged.
- **PENDO_IDS wiring:** `PENDO_IDS.team.invite.modalContainer`, `.modalEmail`, `.modalRole`, `.modalCancel`, `.modalSubmit` — all preserved.
- **Cancel + Send invite Button layout:** `<Group justify="flex-end">` — untouched.
- **TextInput / Select markup:** Unchanged.
- **`keepMounted={false}`:** Retained as decorative (Mantine's default behavior; matches intent documentation; out of scope for this gap closure).

## Deviations from Plan

None — plan executed exactly as written. All five edits applied to `InviteTeammateModal.tsx` and the `05-04-SUMMARY.md` one-line correction match the plan specification verbatim.

## Known Stubs

None — no hardcoded empty values or placeholder text introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The fix is purely a form lifecycle change (when RHF state resets) and a DOM shape change (title slot). The InviteFormSchema validation + .superRefine + createTeammate call are all verbatim from Plan 04.

## Self-Check

- [x] `src/team/components/InviteTeammateModal.tsx` — modified and committed (604c980)
- [x] `.planning/phases/05-team-help-polish/05-04-SUMMARY.md` — modified and committed (77b90c7)
- [x] `npm run typecheck` exits 0
- [x] `npm run build` exits 0
- [x] `prevOpenedRef` present (3 occurrences: declaration + 2 `.current` accesses)
- [x] `form.reset(defaultValues)` present (2 occurrences: call + in comment)
- [x] `title="Invite teammate"` present (1 match)
- [x] No `<Title order={3}>` JSX in title prop (0 matches)
- [x] `Title` not imported from `@mantine/core` (0 matches)
- [x] Old 05-04-SUMMARY patterns entry gone (0 matches)
- [x] New 05-04-SUMMARY entry present (1 match)

## Self-Check: PASSED
