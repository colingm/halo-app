---
phase: 03-authenticated-shell-dashboard
plan: "06"
subsystem: dashboard
tags:
  - recharts
  - svg-charts
  - kpi
  - timeline
  - pendo-anchors
  - empty-state
dependency_graph:
  requires:
    - 03-02 (Task type + listTasks)
    - 03-03 (seedIfNeeded — tasks are seeded before Dashboard reads)
    - 03-04 (PENDO_IDS.dashboard.* leaves)
    - 03-05 (AppLayout mounts Dashboard at /app index)
  provides:
    - src/dashboard/Dashboard.tsx (DASH-01..06 requirements)
    - src/dashboard/relative-time.ts (formatRelative helper)
  affects:
    - Phase 6 Pendo guide targeting (emptyState.container as guide-anchor surface)
    - Phase 4 (Dashboard reads listTasks — Task schema is now load-bearing)
tech_stack:
  added:
    - recharts@3.8.1 (AreaChart + PieChart SVG charts — confirmed SVG, no canvas)
  patterns:
    - Pure helper functions above component for testability
    - All hooks called before early returns (Rules of Hooks compliance)
    - data-pendo-id on Paper wrappers only, never on Recharts SVG children (PEN-08)
    - nowRef anchor pattern (D-21) — max event timestamp drives time-window math
key_files:
  created:
    - src/dashboard/relative-time.ts
    - src/dashboard/Dashboard.tsx
  modified: []
decisions:
  - "Moved all useState/useMemo calls before early returns to comply with Rules of Hooks (workspaceId guard + tasks.length === 0 guard). Tasks memoized as [] when workspaceId is undefined."
  - "Used recharts 3.x API (same components as 2.x — AreaChart, PieChart, Cell, Label, Legend, Tooltip, XAxis, YAxis, CartesianGrid, Area, ResponsiveContainer all confirmed in package type exports)"
  - "KPI card pendoId prop typed as string (not PendoId) — caller always passes PENDO_IDS.* registry values; TypeScript enforces at call site"
  - "Day buckets use UTC date arithmetic (getUTCFullYear/Month/Date) for consistent YYYY-MM-DD keys across timezones"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_created: 2
---

# Phase 03 Plan 06: Dashboard Page Summary

**One-liner:** SVG-only Recharts dashboard with 5 KPI cards, AreaChart + PieChart donut, 8-item Timeline, and empty-state guide anchor — all wired to the PENDO_IDS.dashboard.* registry.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/dashboard/relative-time.ts | 12fd9ad | src/dashboard/relative-time.ts |
| 2 | Create src/dashboard/Dashboard.tsx | 3fbc886 | src/dashboard/Dashboard.tsx |

## PENDO_IDS Leaves — All 12 Dashboard Leaves Referenced

| PENDO_IDS Key | Leaf Value | JSX Element |
|---------------|------------|-------------|
| `dashboard.timeRange` | `'dashboard.time-range'` | `<SegmentedControl data-pendo-id={...}>` |
| `dashboard.kpi.active` | `'dashboard.kpi.active'` | `<Paper data-pendo-id={...}>` (KpiCard) |
| `dashboard.kpi.completedInRange` | `'dashboard.kpi.completed-in-range'` | `<Paper data-pendo-id={...}>` (KpiCard) |
| `dashboard.kpi.overdue` | `'dashboard.kpi.overdue'` | `<Paper data-pendo-id={...}>` (KpiCard) |
| `dashboard.kpi.completionRate` | `'dashboard.kpi.completion-rate'` | `<Paper data-pendo-id={...}>` (KpiCard) |
| `dashboard.kpi.avgCycleTime` | `'dashboard.kpi.avg-cycle-time'` | `<Paper data-pendo-id={...}>` (KpiCard) |
| `dashboard.chart.completedPerDay` | `'dashboard.chart.completed-per-day'` | `<Paper withBorder data-pendo-id={...}>` (wraps AreaChart) |
| `dashboard.chart.byStatus` | `'dashboard.chart.by-status'` | `<Paper withBorder data-pendo-id={...}>` (wraps PieChart) |
| `dashboard.activity.container` | `'dashboard.activity.container'` | `<Paper withBorder data-pendo-id={...}>` (wraps Timeline) |
| `dashboard.activity.item` | `'dashboard.activity.item'` | `<Timeline.Item data-pendo-id={...} data-pendo-task-id={task.id}>` |
| `dashboard.emptyState.container` | `'dashboard.empty-state.container'` | `<Center mih={400} data-pendo-id={...}>` |
| `dashboard.emptyState.cta` | `'dashboard.empty-state.cta'` | `<Button pendoId={...}>Go to Lists</Button>` |

Note: data-pendo-id on chart wrappers (`<Paper>`) only — NEVER on `<AreaChart>`, `<Area>`, `<PieChart>`, `<Pie>`, `<Cell>` per PEN-08 + CLAUDE.md chart-wrapper rule.

## KPI Formula Table (D-17 Implementation)

| KPI | Label | Formula | "—" Fallback Condition |
|-----|-------|---------|------------------------|
| Active tasks | `Active tasks` | `tasks.filter(t => t.status !== 'done').length` | Never (always a number) |
| Completed in range | `Completed in range` | `tasks.filter(t => t.completedAt !== null && new Date(t.completedAt) >= rangeStart && new Date(t.completedAt) <= nowRef).length` | Never (always a number) |
| Overdue | `Overdue` | `tasks.filter(t => t.status !== 'done' && t.dueDate !== null && new Date(t.dueDate) < nowRef).length` | Never (always a number) |
| Completion rate | `Completion rate` | `completedInRange / (completedInRange + createdInRange still open) * 100` → `"42%"` | Denominator === 0 |
| Avg cycle time | `Avg cycle time` | `mean((completedAt - createdAt) / 86_400_000)` for tasks completed in range → `"2.3d"` | No completed-in-range tasks |

## Canvas Verification

`grep -c "canvas" src/dashboard/Dashboard.tsx` → **0**

No canvas elements anywhere. All Recharts output is SVG (`<svg>` with `<rect>` and `<path>` children). PEN-08 mandate satisfied.

## Populated-State vs Empty-State

**Populated state** (tasks.length > 0):
- Stack with `gap="xl"` containing: SegmentedControl (top-right) → 5 KPI Paper cards → 2-column SimpleGrid with AreaChart Paper + PieChart Paper → Recent activity Paper with Timeline (8 items).
- SegmentedControl defaults to '30' (30-day range); changing to '7' or '90' re-filters Completed in range, Completion rate, Avg cycle time, and area chart day buckets. Active tasks, Overdue, and donut chart are time-range-independent per D-17/D-19.

**Empty state** (tasks.length === 0):
- `<Center mih={400} data-pendo-id="dashboard.empty-state.container">` wrapping Stack with: `<IconClipboardCheck size={64} stroke={1.2}>` → `<Title order={3}>No tasks yet</Title>` → dimmed body text → `<Button variant="filled" pendoId="dashboard.empty-state.cta">Go to Lists</Button>`.
- The `<Center>` is the Phase 6 guide-anchor target (DASH-06).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React Rules of Hooks violation — hooks after early return**
- **Found during:** Task 2 implementation
- **Issue:** Plan's component body draft called `useState` and `useMemo` *after* the `if (!workspaceId) return <></>` early return guard. React requires all hooks to be called before any conditional returns.
- **Fix:** Restructured component to call all hooks (useState, useMemo ×5) before any early returns. `tasks` useMemo uses `workspaceId ? listTasks(workspaceId) : []` to handle the null workspaceId case without a conditional hook call.
- **Files modified:** src/dashboard/Dashboard.tsx
- **Commit:** 3fbc886

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Dashboard reads only from `listTasks(workspaceId)` (already-existing localStorage path established in Plan 03-02). The `data-pendo-id` DOM attributes on chart wrappers are intentional public surface per the plan's threat register (T-03-06-02 accepted for Recharts SVG output → public DOM).

## Self-Check: PASSED
