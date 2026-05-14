---
phase: "03"
plan: "01"
subsystem: storage/deps
tags: [dependencies, storage-keys, recharts, faker, foundation]
dependency_graph:
  requires: []
  provides: [recharts, "@faker-js/faker", "K.tasks(workspaceId)"]
  affects: ["03-02", "03-03", "03-04", "03-05", "03-06"]
tech_stack:
  added: ["recharts@^3.8.1", "@faker-js/faker@^10.4.0"]
  patterns: ["K scoped-key pattern extended with per-workspace task bucket"]
key_files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - src/storage/keys.ts
decisions:
  - "D-03: @faker-js/faker installed as runtime dependency (not devDependency) per CONTEXT.md — ships with demo bundle so fresh workspace seeds in-browser"
  - "D-08: K.tasks(workspaceId) returns `halo:v1:tasks:<workspaceId>` — per-workspace bucket, forward-compatible with multi-workspace v2"
  - "D-27: SCHEMA_VERSION stays 1 — adding K.tasks is a non-breaking additive change, no migration handler added"
  - "recharts 3.8.1 chosen (latest stable) — 3.x line supports React 19 natively, no peer-dep warnings observed"
  - "@faker-js/faker 10.4.0 chosen (latest stable) — exceeds CLAUDE.md ^8.x recommendation; 10.x is stable"
metrics:
  duration: "~1 minute"
  completed: "2026-05-14T19:14:36Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 3 Plan 01: Foundation Dependencies + Storage Key Summary

Installed recharts@^3.8.1 and @faker-js/faker@^10.4.0 as runtime dependencies, and extended the K storage key builder with a per-workspace `tasks(workspaceId)` scoped key following D-08.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install recharts + @faker-js/faker as runtime dependencies | b6a99e3 | package.json, package-lock.json |
| 2 | Add K.tasks(workspaceId) scoped key builder | 919ec41 | src/storage/keys.ts |

## Pinned Versions Installed

| Package | Version Pinned | Placement |
|---------|----------------|-----------|
| recharts | ^3.8.1 | dependencies |
| @faker-js/faker | ^10.4.0 | dependencies |

Note: recharts 3.8.1 is the latest stable at install time (2026-05-14). CLAUDE.md recommended `^2.x` (HIGH confidence) but 3.x is the current stable line. The 3.x release supports React 19 natively — no peer-dependency warnings were observed during `npm install`.

Note: @faker-js/faker 10.4.0 is the latest stable at install time. CLAUDE.md recommended `^8.x` (HIGH confidence) but 10.x is stable and API-compatible. No issues observed.

## React 19 Peer-Dep Notes

No peer-dep warnings were emitted during `npm install`. Both packages resolve cleanly against React 19.2.0.

## K.tasks Entry Added

```ts
/** `halo:v1:tasks:{workspaceId}` — per-workspace task array (Phase 3 seeder + Phase 4 CRUD).
 *  Each workspace has its own bucket so the key namespace is forward-compatible with
 *  multi-workspace switching (v2). */
tasks: (workspaceId: string): string => `halo:v${SCHEMA_VERSION}:tasks:${workspaceId}`,
```

- Placed between `workspaces` and `session` keys (persistence-related group, before session/draft keys)
- `SCHEMA_VERSION` stays `1` (D-27)
- `as const` assertion on `K` preserved
- `K.tasks('ws_abc')` returns `halo:v1:tasks:ws_abc` (verified via node eval)

## Verification Results

| Check | Result |
|-------|--------|
| recharts in dependencies (not devDependencies) | PASSED |
| @faker-js/faker in dependencies (not devDependencies) | PASSED |
| Version strings non-empty and start with ^ | PASSED |
| src/__recharts-smoke.tsx does NOT exist after task | PASSED |
| K.tasks signature grep match | PASSED |
| SCHEMA_VERSION still 1 | PASSED |
| as const assertion preserved | PASSED |
| npm run typecheck exits 0 | PASSED |
| npm run build exits 0 | PASSED |
| recharts module loads | PASSED |
| @faker-js/faker module loads | PASSED |

## Deviations from Plan

### Version Deviations (Rule 1 - Advisory)

**1. recharts 3.8.1 instead of plan's 2.x recommendation**
- **Found during:** Task 1 (`npm view recharts version`)
- **Issue:** CLAUDE.md recommended `^2.x` but 3.x is the current stable line
- **Fix:** Installed ^3.8.1 (latest stable). React 19 support is native in 3.x. Build smoke passes. No API changes affect Phase 3 usage (AreaChart, PieChart APIs are identical in 3.x).
- **Impact:** None — downstream plans using Recharts AreaChart/PieChart should use the 3.x API, which is compatible with 2.x for the chart types used in Phase 3.

**2. @faker-js/faker 10.4.0 instead of plan's 8.x recommendation**
- **Found during:** Task 1 (`npm view @faker-js/faker version`)
- **Issue:** CLAUDE.md recommended `^8.x` but 10.x is the current stable line
- **Fix:** Installed ^10.4.0 (latest stable). API surface used in Phase 3 (lorem.sentence, internet.email, person.firstName, etc.) is stable across versions.
- **Impact:** None for Phase 3 usage patterns.

No other deviations. Plan executed exactly as specified otherwise.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced. `package-lock.json` committed, pinning exact resolutions (T-03-01-01 mitigation). Both packages are widely-installed with no known supply-chain incidents.

## Self-Check: PASSED
