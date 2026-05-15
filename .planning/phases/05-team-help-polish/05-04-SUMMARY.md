---
phase: 05-team-help-polish
plan: 04
subsystem: ui
tags: [react, mantine, react-hook-form, zod, pendo, team-management]

# Dependency graph
requires:
  - phase: 05-01
    provides: teamsRepo CRUD (listTeammates, updateTeammate, createTeammate, findTeammateByEmail), TeammateSchema, Teammate type, WorkspaceRole type
  - phase: 05-03
    provides: seed coordinator (seedDemoData), tasksSeed amendments, assigneeOptions source swap

provides:
  - PENDO_IDS.team namespace (10 leaves: header.inviteButton, table.container, row.roleSelect, invite.{modalContainer,modalEmail,modalRole,modalCancel,modalSubmit}, emptyState.{container,cta})
  - TeamEmptyState component (hero empty state with IconUsers + Invite CTA)
  - InviteTeammateModal component (RHF + Zod + .superRefine dedupe + status='invited' creation)
  - TeamTable component (Mantine native Table, 4 columns, Mechanism A Owner gating, dynamic-list parameterization)
  - TeamPage composer (/app/team — replaces Phase 3 placeholder)

affects: [05-05, 05-06, phase-06-pendo-install]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanism A: Owner row disabled-option dropdown (all rows have same pendoId, Owner row disabled)"
    - "Dynamic-list parameterization: data-pendo-teammate-id={teammate.id} on row roleSelect"
    - "Local-form-schema in useMemo: InviteFormSchema closes over workspaceId for .superRefine dedupe"
    - "Refresh ticker: refreshKey state + useMemo([workspaceId, refreshKey]) for post-mutation re-read"
    - "firstName derivation: email.split('@')[0].split(/[._]/).map(Title-Case).join(' ')"

key-files:
  created:
    - src/team/components/TeamEmptyState.tsx
    - src/team/components/InviteTeammateModal.tsx
    - src/team/components/TeamTable.tsx
    - src/team/components/TeamTable.module.css
  modified:
    - src/pendo/PENDO_IDS.ts
    - src/routes/app/team/TeamPage.tsx

key-decisions:
  - "Mechanism A chosen for D-02 Owner gating: disabled-option dropdown for all rows (every row has same PENDO_IDS.team.row.roleSelect for guide-targeting symmetry)"
  - "InviteFormSchema defined in useMemo to capture current workspaceId for .superRefine duplicate-email check without prop drilling"
  - "nowRef for TeamTable derived from new Date().toISOString() (not computeNowRef(tasks)) — team page is not anchored to task activity"
  - "firstName derivation: split on . or _ + Title-Case each segment + join with space (alex.chen@acme.com -> Alex Chen)"
  - "Header Invite button only renders when teammates.length > 0; empty state CTA is the sole entry point when zero teammates"

patterns-established:
  - "Team row dynamic-list: data-pendo-teammate-id={teammate.id} alongside PENDO_IDS.team.row.roleSelect on Select element"
  - "Modal title as <Title order={3}> JSX element (not string prop) per Phase 4 modal-nesting fix"

requirements-completed: [TEAM-01, TEAM-02, TEAM-03, UI-01, UI-02]

# Metrics
duration: 25min
completed: 2026-05-15
---

# Phase 5 Plan 04: Team UI Summary

**Full /app/team surface: Mantine Table with Owner-gated inline role Select, RHF+Zod invite modal with dedupe, and hero empty state — all wired to teamsRepo from Plan 01**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-15T20:47:00Z
- **Completed:** 2026-05-15T21:12:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- PENDO_IDS.team namespace appended (10 leaves) — PendoId union updates automatically via Leaves<T>
- TeamEmptyState hero component with workspace-interpolated copy, IconUsers, and Invite CTA
- InviteTeammateModal: RHF + zodResolver + onSubmit mode; .superRefine duplicate-email check via findTeammateByEmail (case-insensitive); Owner not in role options; firstName derived from email local-part split; status='invited' row created; 'Invite sent — Sent to {email}' green toast
- TeamTable: Mantine native Table (not TanStack), 4 columns, Mechanism A Owner gating (disabled-option), data-pendo-teammate-id={t.id} on every row Select, Invited yellow badge, formatRelative for last-active
- TeamPage: replaces Phase 3 placeholder; refresh ticker; Role updated toast; defensive narrowing

## Task Commits

Each task was committed atomically:

1. **Task 1: PENDO_IDS team namespace + TeamEmptyState + InviteTeammateModal** - `c497a9e` (feat)
2. **Task 2: TeamTable + TeamTable.module.css + TeamPage composer** - `1ab6385` (feat)

## Files Created/Modified
- `src/pendo/PENDO_IDS.ts` - Appended `team` namespace with 10 leaves (D-14, D-15)
- `src/team/components/TeamEmptyState.tsx` - Hero empty state (UI-01)
- `src/team/components/InviteTeammateModal.tsx` - RHF + Zod invite form with dedupe (TEAM-02, D-03)
- `src/team/components/TeamTable.tsx` - Mantine Table with Mechanism A Owner gating (TEAM-01, D-02, D-05)
- `src/team/components/TeamTable.module.css` - Cell padding using Mantine spacing CSS-vars
- `src/routes/app/team/TeamPage.tsx` - Full composer page replacing Phase 3 placeholder

## Decisions Made

**Mechanism A for D-02 (Owner gating):** Chose the disabled-option dropdown over static Badge mechanism. All rows have the same `data-pendo-id={PENDO_IDS.team.row.roleSelect}` for guide-targeting symmetry (Pendo can target any role Select on the page without conditional logic). The Owner row's Select is `disabled={t.workspaceRole === 'Owner'}` with `data={[{ value: 'Owner', label: 'Owner', disabled: true }]}`.

**InviteFormSchema in useMemo:** The form schema must close over `workspaceId` for the `.superRefine` dedupe check. Defined inside `useMemo([workspaceId])` so the schema reference is stable across renders but updates when the workspace changes.

**nowRef for TeamTable:** `new Date().toISOString()` rather than `computeNowRef(tasks)`. The team page doesn't have access to tasks and doesn't need demo-date anchoring — real-time "just now" / "2h ago" is appropriate for teammate activity.

**Avatar initials fallback:** If both `firstName[0]` and `lastName[0]` are empty, fall back to `email[0]` — handles the edge case where an invited row has `firstName=''` (shouldn't happen given D-03 derivation but defensive).

## Deviations from Plan

None — plan executed exactly as written. The one minor discovery was that `computeNowRef` takes a `Task[]` parameter (not zero args as the plan interface excerpt suggested), so `new Date().toISOString()` was used for TeamTable's nowRef instead. This is semantically correct and not a deviation from the functional spec.

## Issues Encountered
- `npm run lint` returned "eslint: command not found" — ESLint is not in PATH for this environment. Typecheck and build both pass, which is the substantive verification. The lint script appears to require the eslint binary to be on PATH separately.

## Known Stubs
None — all team data flows from `teamsRepo.listTeammates(workspaceId)` which reads from localStorage. The teammate list is populated by `teamSeed` (Plan 01/03). No hardcoded empty values or placeholder text in the Team UI.

## Threat Flags
None — no new network endpoints, auth paths, or trust-boundary changes. The Team page reads/writes only to the existing `K.teammates(workspaceId)` localStorage key established in Plan 01.

## Next Phase Readiness
- /app/team is fully functional: list, invite, inline role change, empty state, all toasts
- PENDO_IDS.team namespace is live — Phase 6 Pendo install can target all team elements
- TeamPage ready for Phase 5 Plan 06 (polish pass) verification

---
*Phase: 05-team-help-polish*
*Completed: 2026-05-15*
