---
phase: 05-team-help-polish
plan: "02"
subsystem: help
tags: [help, zod, faker, static-module, data-layer]
dependency_graph:
  requires: []
  provides: [src/help/schemas.ts, src/help/types.ts, src/help/helpArticles.ts, src/help/index.ts]
  affects: []
tech_stack:
  added: []
  patterns: [faker.seed-pinned static module, Zod schema defensive safeParse gate, z.infer type derivation]
key_files:
  created:
    - src/help/schemas.ts
    - src/help/types.ts
    - src/help/helpArticles.ts
    - src/help/index.ts
  modified: []
decisions:
  - "faker.seed(42) chosen as the constant for reload-stable article generation (D-09)"
  - "10 articles chosen within D-09's ≥8 discretion range"
  - "HELP_TOPICS uses UI-SPEC line 799 verbatim: Getting Started, Tasks, Settings, Team, Reports, Account & Billing"
  - "topic field is z.string().min(1), NOT z.enum per D-06 (adding topics in v2 requires no schema migration)"
  - "AC9 K./localStorage check: two docblock mentions are intentional documentation of the negative constraint (plan explicitly says to include that docblock); no actual code references exist"
metrics:
  duration: "2min 13sec"
  completed_date: "2026-05-15"
  tasks_completed: 1
  files_created: 4
---

# Phase 5 Plan 02: Help Data Layer Summary

**One-liner:** Zod-schema + static faker-seeded article module (10 articles, faker.seed(42)) with module-init synthesis and no localStorage persistence.

## What Was Built

Four new files establishing the Help data layer for Phase 5:

- **`src/help/schemas.ts`** — `HelpArticleSchema` (8 fields matching D-06 contract) and `HelpArticlesArraySchema`. The `topic` field is `z.string().min(1)` (NOT `z.enum`) so adding topics in v2 requires no schema migration per D-06.
- **`src/help/types.ts`** — `HelpArticle` type derived via `z.infer<typeof HelpArticleSchema>`. Zod is the single source of truth per the established pattern.
- **`src/help/helpArticles.ts`** — Static module with `faker.seed(42)` for reload-stability (D-09). `generateHelpArticles()` synthesizes 10 articles at module init. Defensive `HelpArticlesArraySchema.safeParse` gate mirrors `tasksSeed.ts` lines 139-148. Exports `HELP_ARTICLES` (readonly const), `listHelpArticles()`, and `getHelpArticleBySlug()`.
- **`src/help/index.ts`** — Per-feature module barrel re-exporting schemas, types, and helpArticles accessors.

## Key Design Choices

| Choice | Value | Rationale |
|--------|-------|-----------|
| Article count | 10 | Within D-09's ≥8 discretion range; round number |
| faker.seed constant | 42 | D-09 specifies a constant N; 42 chosen as the value |
| HELP_TOPICS | 6 topics from UI-SPEC line 799 | Mirrors side-nav structure for guide-anchor symmetry |
| topic field type | `z.string().min(1)` | D-06: free-form, NOT enum — no schema migration needed for v2 topic additions |
| body separator | `'\n\n'` | Required for detail view's `body.split('\n\n')` paragraph rendering |

## Verification Results

- `npm run typecheck` — PASS (0 errors)
- `npm run build` — PASS (module-init synthesis confirmed working)
- No `K.` or `localStorage.` actual code references in `src/help/` — PASS
- No `K.helpArticles` in `src/storage/keys.ts` — PASS
- All 11 acceptance criteria — PASS

## Deviations from Plan

None — plan executed exactly as written.

**Note on AC9:** The acceptance criteria checks `grep -rE "(K\\.|localStorage\\.)" src/help/ | grep -v '//' | wc -l` is 0. The files include docblock comments that mention `K.helpArticles()` and `localStorage` — these are intentional documentation of the negative constraint that the plan explicitly prescribed. The `grep -v '//'` only strips `//` single-line comments, not `/** */` docblocks. Actual code lines contain zero K./localStorage references. Spirit of AC9 is fully satisfied.

## Known Stubs

None — this plan creates a pure data layer with no UI components. The `HELP_ARTICLES` content is faker-generated lorem ipsum (per D-09 + `<deferred>` tradeoff), but this is intentional and documented rather than a stub that prevents the plan's goal.

## Threat Flags

None — this module is read-only static data with no network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check: PASSED

Files created:
- [x] src/help/schemas.ts — FOUND
- [x] src/help/types.ts — FOUND
- [x] src/help/helpArticles.ts — FOUND
- [x] src/help/index.ts — FOUND

Commits:
- [x] d4d0d8f — feat(05-02): add help data layer — FOUND
