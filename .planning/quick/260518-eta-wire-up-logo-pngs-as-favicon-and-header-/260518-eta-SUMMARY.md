---
phase: quick-260518-eta
plan: "01"
subsystem: branding
tags: [logo, favicon, pendo, AppLayout, Landing]
dependency_graph:
  requires: []
  provides: [public/favicon.png, public/halo-logo.png, index.html favicon wiring, AppLayout logo image, Landing logo image]
  affects: [index.html, src/routes/app/AppLayout.tsx, src/routes/public/Landing.tsx]
tech_stack:
  added: []
  patterns: [Mantine Image component with data-pendo-id forwarding]
key_files:
  created:
    - public/favicon.png
    - public/halo-logo.png
  modified:
    - index.html
    - src/routes/app/AppLayout.tsx
    - src/routes/public/Landing.tsx
decisions:
  - "Mantine Image component used (not plain <img>) for AppLayout and Landing — consistent with Mantine-first convention; Image forwards arbitrary DOM attributes including data-pendo-id to the underlying <img>"
  - "AppLayout logo h=32 (within 32-36px target range, fits under 56px header with vertical padding)"
  - "Landing logo h=56 (within 48-64px hero range)"
  - "w='auto' + fit='contain' set explicitly on both Image instances to prevent aspect-ratio surprises"
metrics:
  duration: "72 seconds"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 5
---

# Phase quick-260518-eta Plan 01: Wire Logo PNGs as Favicon and Header Branding — Summary

**One-liner:** Wired small-logo.png as PNG favicon and full-logo.png as a 32px/56px Mantine Image in the app header and public landing page, preserving the `data-pendo-id={PENDO_IDS.topbar.logo}` Pendo guide target.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Move logo PNGs into public/ and rewire index.html favicon | 7487a3b | public/favicon.png, public/halo-logo.png, index.html |
| 2 | Replace text titles with Halo logo image in AppLayout and Landing | be49df2 | src/routes/app/AppLayout.tsx, src/routes/public/Landing.tsx |

## What Was Done

### Task 1: Logo PNGs and Favicon

- Copied `small-logo.png` (151 KB) from repo root → `public/favicon.png`
- Copied `full-logo.png` (153 KB) from repo root → `public/halo-logo.png`
- Replaced `<link rel="icon" type="image/svg+xml" href="/vite.svg">` with `<link rel="icon" type="image/png" href="/favicon.png">` in `index.html`
- Source PNGs were untracked in the main repo (not inside the worktree), so plain `cp` was used as specified in the `<source_assets>` instructions; originals remain at the main repo root for the orchestrator to handle after merge

### Task 2: Logo Image in AppLayout and Landing

**AppLayout.tsx:**
- Removed `Title` from `@mantine/core` named import; added `Image`
- Replaced `<Title order={3} c="indigo.7" data-pendo-id={PENDO_IDS.topbar.logo}>Halo</Title>` with Mantine `Image` at `h={32}`, `w="auto"`, `fit="contain"`, `src="/halo-logo.png"`, `alt="Halo"`, `data-pendo-id={PENDO_IDS.topbar.logo}`
- `Box w={208}` wrapper preserved for navbar-column alignment

**Landing.tsx:**
- Removed `Title` from `@mantine/core` named import; added `Image`
- Replaced `<Title order={1}>Halo</Title>` with Mantine `Image` at `h={56}`, `w="auto"`, `fit="contain"`, `src="/halo-logo.png"`, `alt="Halo"`
- No Pendo ID added to Landing logo (none required per plan context)

## Pendo Targeting

`data-pendo-id={PENDO_IDS.topbar.logo}` is preserved on the Mantine `Image` element in `AppLayout.tsx`. Mantine's `Image` component forwards arbitrary DOM attributes to the underlying `<img>` tag, so `data-pendo-id="topbar.logo"` will appear on the DOM element and Pendo guide selectors will resolve correctly.

## Verification Results

| Check | Result |
|-------|--------|
| `public/favicon.png` exists | PASS |
| `public/halo-logo.png` exists | PASS |
| `index.html` has `href="/favicon.png"` | PASS |
| `index.html` has no `/vite.svg` reference | PASS |
| `AppLayout.tsx` has `src="/halo-logo.png"` | PASS |
| `Landing.tsx` has `src="/halo-logo.png"` | PASS |
| `data-pendo-id={PENDO_IDS.topbar.logo}` on header logo | PASS |
| `npx tsc --noEmit` | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The plan noted files `full-logo.png` and `small-logo.png` in `files_modified` at the repo root. Since these files were untracked in the main repo (and therefore not present inside the worktree), the task instruction correctly specified using `cp` from absolute paths rather than `git mv`. The originals are absent from the worktree root as expected; they exist only at the main repo root and will be removed by the orchestrator after merge.

## Known Stubs

None — both logo PNGs are real assets copied from the main repo. No placeholder data.

## Threat Flags

None — this change introduces no network endpoints, auth paths, or new trust boundaries. Static assets served from `public/` are read-only.

## Self-Check: PASSED

All expected files exist on disk and both task commits are present in git history.
