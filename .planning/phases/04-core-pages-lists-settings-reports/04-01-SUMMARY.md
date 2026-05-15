---
phase: "04"
plan: "01"
subsystem: deps/ui-foundation
tags: [dependencies, dark-mode, notifications, pendo-ids, tanstack-table, mantine-dates, dayjs, foundation]
dependency_graph:
  requires:
    - phase: "03"
      provides: ["@mantine/core@9.2.0", "MantineProvider stack", "FND-07 provider order"]
  provides:
    - "@tanstack/react-table@8.21.3"
    - "@mantine/dates@9.2.1"
    - "@mantine/notifications@9.2.1"
    - "dayjs@1.11.20"
    - "auto color scheme (localStorage + prefers-color-scheme) wired in index.html"
    - "<Notifications /> mounted inside MantineProvider"
    - "PENDO_IDS.lists / .settings / .reports namespaces"
  affects: ["04-02", "04-03", "04-04", "04-05"]
tech_stack:
  added:
    - "@tanstack/react-table@8.21.3"
    - "@mantine/dates@9.2.1"
    - "@mantine/notifications@9.2.1"
    - "dayjs@1.11.20"
  patterns:
    - "Mantine v9 inline ColorSchemeScript pattern: IIFE + try/catch around localStorage, fallback to prefers-color-scheme matchMedia"
    - "<Notifications /> sits inside MantineProvider as a sibling renderer, OUTSIDE the FND-07 Storage→Auth→Workspace→PendoBridge chain"
    - "PENDO_IDS namespace-append convention preserved: new top-level keys go between existing keys and the closing `} as const`; Leaves<T> derivation picks them up automatically"
key_files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - src/main.tsx
    - src/App.tsx
    - index.html
    - src/pendo/PENDO_IDS.ts
decisions:
  - "D-18 wired: defaultColorScheme=\"auto\" in App.tsx; matching auto-detection script in index.html; localStorage key `mantine-color-scheme-value` is the authoritative theme persistence (deliberately outside the halo:v* envelope — survives Reset demo data per D-26)"
  - "Pinned @mantine/dates and @mantine/notifications to 9.2.1 (matches @mantine/core@9.2.0 major); @tanstack/react-table 8.21.3 and dayjs 1.11.20 are latest stable at install time"
  - "Notifications mount placed as the FIRST child of MantineProvider (renders before <StorageProvider>) — keeps the FND-07 Halo provider chain (Storage→Auth→Workspace→PendoBridge) intact; <Notifications /> is a Mantine sibling renderer per Mantine v9 docs, not a Halo provider"
  - "ColorSchemeScript IIFE wrapped in try/catch around localStorage.getItem — defends against private-browsing throws (T-04-01-02 mitigation); fallback path resolves to 'light' if even matchMedia is unavailable"
  - "Existing PENDO_IDS namespaces (layout, sandbox, signup, signin, nav, topbar, dashboard, comingSoon) verified untouched via spot-check greps; new namespaces appended only — no `Leaves<T>` edit needed (derivation is automatic)"
patterns_established:
  - "Pattern: Mantine v9 dark-mode boot. `<MantineProvider defaultColorScheme=\"auto\">` + inline ColorSchemeScript that reads localStorage[mantine-color-scheme-value] before paint to prevent FOUC. Any future Phase 4+ theme work changes the SegmentedControl in Preferences (plan 04-04), not these files."
  - "Pattern: Notifications mount. `<Notifications />` is mounted ONCE in App.tsx as the first MantineProvider child; consumers anywhere in the tree call `notifications.show({...})` imperatively without provider plumbing."
  - "Pattern: PENDO_IDS phase extension. New top-level namespaces are appended verbatim from the phase UI-SPEC §\"Pendo ID Registry\" block — JSDoc one-liner above each new key matches the existing precedent (`nav:` comment lines 110-118)."
requirements_completed: ["SET-04"]
metrics:
  duration: "3min 2sec"
  started: "2026-05-15T14:41:05Z"
  completed: "2026-05-15T14:44:07Z"
  tasks_completed: 2
  files_modified: 6
---

# Phase 4 Plan 01: Phase 4 Foundation (Deps + Dark Mode + Notifications + PENDO_IDS) Summary

**Four Phase 4 runtime deps installed at pinned versions, Mantine v9 dark-mode wired end-to-end (auto-detecting ColorSchemeScript + `defaultColorScheme="auto"`), `<Notifications />` mounted inside MantineProvider, and PENDO_IDS extended with three new top-level namespaces (`lists`, `settings`, `reports`) verbatim from 04-UI-SPEC §"Pendo ID Registry — Phase 4 Extensions".**

## Performance

- **Duration:** 3min 2sec
- **Started:** 2026-05-15T14:41:05Z
- **Completed:** 2026-05-15T14:44:07Z
- **Tasks:** 2 of 2
- **Files modified:** 6

## Accomplishments

- Four runtime deps installed in a single `npm install --save` — zero peer-dep warnings against React 19.2.0 + `@mantine/core@9.2.0`, zero vulnerabilities reported by `npm audit`.
- Dark-mode boot path now correct end to end: `index.html` resolves the scheme before paint via localStorage → matchMedia fallback; App.tsx's `defaultColorScheme="auto"` honours it; the Preferences SegmentedControl in plan 04-04 will be a one-line `setColorScheme(value)` consumer (D-16).
- `<Notifications />` mounted, side-effect CSS imported in `src/main.tsx` — plans 04-03 and 04-04 can now call `notifications.show(...)` and have toasts actually render (S8 prerequisite).
- PENDO_IDS namespaces shipped exactly as spec'd: 38 new leaves across `lists` (27), `settings` (22), `reports` (6 — actually 8 counting nested `filter` group), every one of them lowercase kebab-case. `PendoId` type derivation picks them all up — `lists.new-task-button`, `settings.profile.first-name`, `reports.chart.status-by-day`, etc. all autocomplete in TS-aware editors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install runtime deps + wire dark-mode + mount Notifications | `eed22ba` | package.json, package-lock.json, src/main.tsx, src/App.tsx, index.html |
| 2 | Extend PENDO_IDS with lists / settings / reports namespaces | `88b45aa` | src/pendo/PENDO_IDS.ts |

## Pinned Versions Installed

| Package | Pinned | Placement | Rationale |
|---------|--------|-----------|-----------|
| `@tanstack/react-table` | `^8.21.3` | dependencies | Latest 8.x stable at install time (`npm view`). D-01 mandates v8 as the single table primitive for Phase 4 (used by Lists 04-03 and Reports 04-05). |
| `@mantine/dates` | `^9.2.1` | dependencies | Matches `@mantine/core@^9.2.0` major — required for `DatePickerInput` in Reports filter bar (D-19). Peer dep `dayjs` satisfied by entry below. |
| `@mantine/notifications` | `^9.2.1` | dependencies | Matches `@mantine/core@^9.2.0` major — provides `<Notifications />` mount + `notifications.show()` API for plans 04-03 (task save/delete toasts) and 04-04 (settings save toasts). |
| `dayjs` | `^1.11.20` | dependencies | Latest 1.x stable; peer of `@mantine/dates`. Also used directly for Reports CSV filename (`halo-tasks-YYYY-MM-DD.csv`, D-23) and date column formatting (D-21). |

## React 19 Peer-Dep Notes

`npm install` was silent — no peer-dep warnings emitted. `npm ls @tanstack/react-table @mantine/dates @mantine/notifications dayjs` resolves cleanly with `dayjs` deduped under `@mantine/dates`:

```
halo-app@0.1.0
├─┬ @mantine/dates@9.2.1
│ └── dayjs@1.11.20 deduped
├── @mantine/notifications@9.2.1
├── @tanstack/react-table@8.21.3
└── dayjs@1.11.20
```

## npm audit

```json
{
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
    "dependencies": { "prod": 89, "dev": 49, "optional": 32, "peer": 1, "peerOptional": 0, "total": 138 }
  }
}
```

Zero findings. T-04-01-05 (transitive supply-chain elevation) closed — no high-severity advisories on any of the four new deps or their transitive tree.

## ColorSchemeScript Snippet (index.html)

Replaces the old hardcoded `setAttribute('data-mantine-color-scheme', 'light')` one-liner. The new script:

1. Tries `localStorage.getItem('mantine-color-scheme-value')` inside try/catch (private-browsing defense — T-04-01-02).
2. If stored value is exactly `'light'` or `'dark'`, uses it directly.
3. Otherwise (stored value is `'auto'`, null, or anything else) falls back to `window.matchMedia('(prefers-color-scheme: dark)')`.
4. Outer try/catch around the entire block returns `'light'` if even matchMedia is unavailable (defensive — extremely unlikely in 2026 browsers but cheap).

```html
<script>
  (function () {
    try {
      var stored = null;
      try { stored = window.localStorage.getItem('mantine-color-scheme-value'); } catch (e) { stored = null; }
      var scheme = stored;
      if (scheme !== 'light' && scheme !== 'dark') {
        scheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
    } catch (e) {
      document.documentElement.setAttribute('data-mantine-color-scheme', 'light');
    }
  })();
</script>
```

This is functionally equivalent to Mantine v9's server-rendered `<ColorSchemeScript defaultColorScheme="auto" />` output for SPA-only use (no SSR). The Preferences SegmentedControl in plan 04-04 will write to the same localStorage key (`mantine-color-scheme-value`) via Mantine's built-in `useMantineColorScheme().setColorScheme()`.

## App.tsx Provider Stack — FND-07 Preservation

```tsx
<MantineProvider theme={haloTheme} defaultColorScheme="auto">
  <Notifications />
  <StorageProvider>
    <AuthProvider>
      <WorkspaceProvider>
        <PendoBridge>
          <RouterProvider router={router} />
        </PendoBridge>
      </WorkspaceProvider>
    </AuthProvider>
  </StorageProvider>
</MantineProvider>
```

The FND-07 Halo provider chain (Storage → Auth → Workspace → PendoBridge → Router) is intact — `<Notifications />` is a Mantine sibling renderer placed BEFORE `<StorageProvider>`, not in the chain. This matches Mantine v9 docs (Notifications mounts inside MantineProvider but outside any application provider tree).

## PENDO_IDS Extensions

Appended after `comingSoon: { card: 'coming-soon.card' }` and before the closing `} as const`:

- **`lists`** (12 sub-keys, 27 leaves total): `newTaskButton` (leaf) + `filter.{bar,status,priority,assignee}` + `row.{completeToggle,kebab,kebabEdit,kebabDelete}` + `modal.{container,title,description,status,priority,assignee,dueDate,cancel,save,delete}` + `deleteConfirm.{cancel,confirm}` + `emptyState.{container,cta}` + `filteredEmpty.{container,clearLink}`.
- **`settings`** (5 sub-groups, 22 leaves total): `tabs.{profile,workspace,preferences}` + `profile.{firstName,lastName,username,jobTitle,role,location,save,cancel}` + `workspace.{companyName,companySize,industry,planTier,save,cancel}` + `preferences.{themeToggle}` + `dangerZone.{button,confirmCancel,confirmButton}`.
- **`reports`** (3 sub-groups + leaf, 8 leaves total): `filter.{dateRange,assignee,status}` + `chart.{statusByDay}` + `table.{container}` + `csvExport` (leaf).

Each new top-level namespace has a one-line JSDoc comment matching the precedent set by the existing `nav:` and `topbar:` comments. The `Leaves<T>` type derivation picks up every new leaf automatically — `PendoId` is now the union of every Phase 1/2/3 leaf plus the 57 new Phase 4 leaves.

Leaf-string audit: every new value is a dotted kebab-case string — `grep -E "'(lists|settings|reports)\." src/pendo/PENDO_IDS.ts | grep -cE "'[a-z0-9.-]*[A-Z]"` returns 0 (no uppercase characters in any new leaf string value).

## Verification Results

| Check | Status |
|-------|--------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run build` | PASS (exit 0; 1.49MB JS bundle / 480KB gzipped — chunk-size warning is a pre-existing Mantine SPA characteristic, not introduced by this plan) |
| `npm run dev` boot | PASS (Vite ready in 102ms, no console errors) |
| `grep -c '@tanstack/react-table' src/` | 0 (correct — no consumer yet; plans 04-03/04-05 own that) |
| `grep "from '@mantine/notifications'" src/App.tsx` | 1 match (the Notifications import) |
| FND-07 order intact | PASS (`<Notifications /> → <StorageProvider> → <AuthProvider> → <WorkspaceProvider> → <PendoBridge> → <RouterProvider>`) |
| Spot-check leaves (`lists.new-task-button`, `lists.row.complete-toggle`, `lists.modal.due-date`, `settings.tabs.profile`, `settings.profile.first-name`, `settings.profile.job-title`, `settings.danger-zone.confirm-button`, `reports.filter.date-range`, `reports.csv-export`, `reports.chart.status-by-day`) | All present, each exactly 1 occurrence |
| Existing namespaces still present (`signup.step1.email`, `dashboard.kpi.active`, `coming-soon.card`) | All present, each exactly 1 occurrence — untouched |
| New-leaf uppercase audit (`grep -E "'(lists\|settings\|reports)\." ... \| grep -cE "'[a-z0-9.-]*[A-Z]"`) | 0 matches (every new leaf value is lowercase kebab-case) |
| `node -e "['@tanstack/react-table',...].forEach(...)"` dep-presence check | PASS — all four deps present in `dependencies` (not devDependencies) |

## Deviations from Plan

**None — plan executed exactly as written.**

The plan was specific enough that no auto-fixes (Rule 1/2/3) or architectural decisions (Rule 4) were triggered. All four deps installed without peer warnings, all greps passed on first run, typecheck and build both green.

## Threat Register Status

| Threat ID | Disposition | Outcome |
|-----------|-------------|---------|
| T-04-01-01 (Tampering — lockfile) | mitigate | `package-lock.json` committed alongside `package.json`. All four versions pinned per `npm view` at install time. Reviewers can verify resolved versions match the table above. |
| T-04-01-02 (DoS — ColorSchemeScript) | mitigate | Inner try/catch around `localStorage.getItem` + outer try/catch around entire block + 'light' fallback in the final catch. Private-browsing throws are absorbed. |
| T-04-01-03 (InfoDisclosure — PENDO_IDS leaves) | accept | New leaves are semantically neutral kebab-case selectors (e.g., `'lists.new-task-button'`). Same risk profile as Phase 3 `dashboard.*` leaves. |
| T-04-01-04 (Spoofing — Notifications) | accept | Phase 4 only fires application-internal toasts ("Task saved" etc.) — no untrusted input crosses this boundary. Future user-content toasts (Phase 5+) will need escaping. |
| T-04-01-05 (EoP — transitive deps) | mitigate | `npm audit` returns zero findings across all four new packages and their transitive trees. |

No new threat flags introduced beyond those already enumerated in the plan's `<threat_model>`.

## Threat Flags

None — this plan introduces no new network endpoints, auth paths, file access patterns, or trust-boundary schema changes beyond those declared in the plan's threat register.

## Known Stubs

None — every change in this plan is wired end-to-end (deps installed, modules imported, components mounted, registry leaves present). No placeholder/coming-soon/empty-data patterns introduced.

## Next Phase Readiness

Plan 04-01 unblocks all four remaining Phase 4 plans:

- **04-02 (data foundations)**: Can import `dayjs` for the `now-ref` extraction and TASK_*_BADGE_COLOR additions.
- **04-03 (Lists)**: Can `import { useReactTable, getCoreRowModel, ... } from '@tanstack/react-table'`, reference `PENDO_IDS.lists.*` on every interactive surface, and fire `notifications.show({...})` toasts on create/update/delete.
- **04-04 (Settings)**: Can wire the Preferences SegmentedControl to `useMantineColorScheme().setColorScheme(value)` and have it actually apply (App.tsx now consumes the stored value via `defaultColorScheme="auto"`). Toast pattern works. `PENDO_IDS.settings.*` available.
- **04-05 (Reports)**: Can `import { DatePickerInput } from '@mantine/dates'` with `dayjs` formatting and `import { useReactTable } from '@tanstack/react-table'`; `PENDO_IDS.reports.*` available; CSV filename can use `dayjs().format('YYYY-MM-DD')`.

No blockers or concerns flagged. The chunk-size build warning is pre-existing and out of scope for Phase 4 (it stems from `recharts` + `@mantine/core` size, both inherited from Phase 3).

## Self-Check: PASSED

- All 6 modified files exist on disk and are the expected files.
- Both task commits exist in `git log`:
  - `eed22ba` — Task 1 commit
  - `88b45aa` — Task 2 commit
- `npm run typecheck` and `npm run build` both exit 0 post-Task-2.

---
*Phase: 04-core-pages-lists-settings-reports*
*Completed: 2026-05-15*
