# Phase 5: Team, Help & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 05-team-help-polish
**Areas discussed:** Team data model & invite flow, Help content shape & navigation, Resource Center anchor (HELP-04), Seeding expansion + polish-audit scope

---

## Team data model & invite flow

### Q1 — How should teammates be modeled in the data layer?

| Option | Description | Selected |
|--------|-------------|----------|
| New TeammateSchema + teamsRepo + K.teammates(workspaceId) | New Zod schema, new repo, new per-workspace storage key; mirrors tasksRepo pattern; clean separation from Visitor. | ✓ |
| Reuse Visitor shape + extend authRepo | Treat teammates as Visitor records; one fewer module but muddies the 'Visitor = registered user' invariant. | |
| Derive from existing task assignees only | No persistence; can't satisfy TEAM-02/03 (role changes and invites need to persist). | |

**User's choice:** New TeammateSchema + teamsRepo + K.teammates(workspaceId)
**Notes:** Locked the per-feature module ownership pattern (Pattern S4) for teammates; mirrors Phase 3/4 conventions.

### Q2 — What happens after the user clicks 'Invite' in the modal?

| Option | Description | Selected |
|--------|-------------|----------|
| Append teammate immediately with status='invited' | Modal closes, toast confirms, new row appears with 'Invited' badge; strong Pendo demo surface. | ✓ |
| Toast-only — no list change | Strictest minimal reading; no visible state change post-invite. | |
| Append teammate as 'active' (no pending state) | Simplest list rendering but misses real-SaaS invite semantics. | |

**User's choice:** Append teammate immediately with status='invited'
**Notes:** Gives guides a visible target post-invite; matches real-SaaS invite UX.

### Q3 — How should existing task assignees reconcile with the new teammate list?

| Option | Description | Selected |
|--------|-------------|----------|
| Teammates seed first; tasks seed assigns FROM teammate list | Single source of truth; assignee filters reflect team; required ordering in coordinator. | ✓ |
| Teammates separate; tasks keep inline Assignee snapshots | Zero touch to tasksSeed; risk of visual mismatch (same person, different IDs across pages). | |
| Teammates derived FROM existing tasks (reverse direction) | Lazy-init teammates from assignees; awkward and brittle. | |

**User's choice:** Teammates seed first; tasks seed assigns FROM teammate list
**Notes:** Cascades to Phase 4 D-10's `assigneeOptions` source swap (`listTasks` → `listTeammates`). Surgical edit to existing `tasksSeed.ts`.

### Q4 — What role enum drives the Team page role column and the inline role dropdown?

| Option | Description | Selected |
|--------|-------------|----------|
| New WorkspaceRoleEnum: 'Owner' \| 'Admin' \| 'Member' \| 'Viewer' | Workspace-permission role; distinct from Visitor.role; sets up v2 persona guides. | ✓ |
| Reuse Visitor.role (RoleEnum: Product/Engineering/…) | One enum, less code; semantically wrong for a team page. | |
| Both — store workspaceRole AND keep functional role | Maximally real but over-engineered for v1. | |

**User's choice:** New WorkspaceRoleEnum: 'Owner' | 'Admin' | 'Member' | 'Viewer'
**Notes:** Owner is special-cased (cannot be demoted via inline dropdown); signed-in Visitor seeded as Owner.

### Continue check

| Option | Description | Selected |
|--------|-------------|----------|
| Next area | Move on to Help content & navigation. | ✓ |
| More questions | Keep digging on team count, avatar source, Owner-demotion gating, remove-member, duplicate-email handling. | |

**User's choice:** Next area

---

## Help content shape & navigation

### Q1 — What fields should the HelpArticleSchema carry?

| Option | Description | Selected |
|--------|-------------|----------|
| {id, slug, title, topic, summary, body, keywords[], updatedAt} | Covers list + search + detail + Pendo demos; topic stays free-form string for forward compat. | ✓ |
| Minimal: {id, slug, title, topic, body} | No summary/keywords/updatedAt; search over title only feels thin. | |
| Maximalist: above + author, category, tags, viewCount, helpfulYes/No | Full help-center clone; out of scope for v1. | |

**User's choice:** {id, slug, title, topic, summary, body, keywords[], updatedAt}

### Q2 — How does the user navigate from the article list to a detail view?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate route /app/help/:slug | Deep-linkable URLs; better Pendo funnel surface; refresh-stable; first router.tsx edit since Phase 3 D-01. | ✓ |
| Master-detail on one page (Drawer or two-column) | Zero router change; no deep-link URL. | |
| Modal popup on click | Simplest; weakest demo feel. | |

**User's choice:** Separate route /app/help/:slug
**Notes:** Locks the first router.tsx edit since Phase 3 — additive nested child route, not a structural change.

### Q3 — How should HELP-02 search behave?

| Option | Description | Selected |
|--------|-------------|----------|
| Live filter across title + keywords[] + summary, case-insensitive | Body excluded to avoid noise; debounce ~150ms; polished no-results state. | ✓ |
| Title-only, live filter | Simplest but feels thin. | |
| Title + keywords[] + body (full-text) | Too noisy without ranking. | |
| Explicit search button, not live | Feels dated in 2026. | |

**User's choice:** Live filter across title + keywords[] + summary, case-insensitive

### Q4 — How is article body content sourced for seeding?

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-curated, ~8–10 articles, plain-text or light markdown | Most demo-real; ~1 hour writing copy; passes UI-04 polish bar. | |
| Faker-generated lorem-ipsum bodies | Zero writing; obvious filler in detail view; HELP-02 keyword search is meaningless when keywords don't actually appear in body. | ✓ |
| Hybrid — curated titles+summaries, faker bodies | List looks real; detail still falls apart. | |

**User's choice:** Faker-generated lorem-ipsum bodies
**Notes:** Explicit speed-over-polish tradeoff in the article detail view. UI-04 polish in the detail view is deliberately weaker than hand-curated copy would deliver. Captured in CONTEXT.md `<specifics>`.

### Q5 (additional) — Should help articles be persisted in localStorage or live as a static module?

| Option | Description | Selected |
|--------|-------------|----------|
| Static module: src/help/helpArticles.ts exports the array | No persistence layer for read-only content; faker.seed(N) ensures reload-stability. | ✓ |
| Persisted per workspace: K.helpArticles(workspaceId) + helpRepo | Strictest reading of DATA-01; per-workspace unique content. | |
| Persisted globally: K.helpArticles() | Mid-ground; still adds key + module overhead. | |

**User's choice:** Static module: src/help/helpArticles.ts exports the array

### Continue check

| Option | Description | Selected |
|--------|-------------|----------|
| Next area | Move on to Resource Center anchor. | ✓ |
| More questions | Keep digging on article count, topic list, markdown rendering, TOC, related-articles. | |

**User's choice:** Next area

---

## Resource Center anchor (HELP-04)

### Q1 — Where does the Pendo Resource Center anchor live?

| Option | Description | Selected |
|--------|-------------|----------|
| Both: top-bar IconHelp button + floating '?' FAB pinned bottom-right | Two anchors with two pendo IDs; mounted in AppLayout for global reach. | |
| FAB only — floating '?' bottom-right of all /app/* routes | Single global anchor; pure RC convention. | |
| Top-bar IconHelp only | Clean chrome; misses RC convention. | |
| **Other (user free text)** | "I actually don't need to create an anchor, we will use a pendo badge activated resource center that creates its own FAB. So no work necessary here" | ✓ |

**User's choice:** No anchor markup needed — Pendo's badge-activated Resource Center injects its own FAB at runtime in Phase 6.
**Notes:** Collapses the entire area to a no-op. HELP-04 is satisfied by the existing side-nav Help link (`PENDO_IDS.nav.help`, Phase 3 D-04). Do NOT build a top-bar `IconHelp` button or floating `?` FAB.

---

## Seeding expansion + polish-audit scope

### Q1 — How should the new seeders (teammates) be organized relative to the existing tasksSeed.ts?

| Option | Description | Selected |
|--------|-------------|----------|
| Per-domain modules with a single seedAll() coordinator | New teamSeed.ts + seedAll.ts coordinator; AppLayout swaps to seedDemoData(workspaceId). Clean ownership; explicit ordering. | ✓ |
| Co-locate everything in tasksSeed.ts | Violates per-key co-ownership pattern (Phase 4 D-15 doctrine). | |
| Per-domain modules, no coordinator | AppLayout grows seeding orchestration responsibility. | |

**User's choice:** Per-domain modules with a single seedAll() coordinator

### Q2 — How is the meta.seededAt gate scoped?

| Option | Description | Selected |
|--------|-------------|----------|
| Single meta.seededAt gates everything | Matches FND-05 verbatim; no SCHEMA_VERSION bump; both seeders short-circuit on stamp. | ✓ |
| Per-domain stamps: meta.seededAt.{tasks, teammates} | Requires SCHEMA_VERSION bump + migration; over-engineered for v1. | |
| Separate keys: K.teamSeededAt() | Scatters seeding-state contract. | |

**User's choice:** Single meta.seededAt gates everything
**Notes:** seedDemoData() owns the stamp (after both seeders succeed); tasksSeed.ts gets a surgical edit to remove its tail stamp.

### Q3 — What does the polish-audit pass actually deliver?

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted polish + Markdown checklist artifact (05-DEMO-READY-AUDIT.md) | Concrete polish + durable audit artifact for Phase 6 prerequisite. | |
| Polish work only, no audit artifact — verification step is manual | Same polish work; verification via /gsd-verify-phase + UAT persistence. | ✓ |
| Audit artifact only — defer polish work to Phase 6 | Contradicts phase goal. | |

**User's choice:** Polish work only, no audit artifact — verification step is manual

### Q4 — How is the Pendo-readiness checklist from Success Criteria #5 verified at phase close?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual walk-through in /gsd-verify-phase, verifier agent reads code + UAT lists items | Leverages existing verify mechanism; no new test infra. | ✓ |
| Add an automated smoke test asserting Pendo-readiness contracts | Regression guard but requires new test framework (out of scope per CLAUDE.md). | |
| Both — manual now, automated test deferred | Best of both; deferred tests rarely get written. | |

**User's choice:** Manual walk-through in /gsd-verify-phase, verifier agent reads code + UAT lists items

---

## Final check

| Option | Description | Selected |
|--------|-------------|----------|
| I'm ready for context | Proceed to write CONTEXT.md and commit. | ✓ |
| Explore more gray areas | Surface 2–4 additional gray areas. | |

**User's choice:** I'm ready for context

---

## Claude's Discretion

- Exact Owner-demotion gating mechanism (disabled option vs static Badge for the owner row).
- Email-to-firstName derivation idiom on invite (split on '.'/'_' vs raw with Title-Case).
- Exact teammate count to seed (8, 10, or 8–12 via `faker.number.int`).
- Avatar source (`faker.image.avatar()` URL vs Mantine `<Avatar>` initials fallback).
- Exact help article count (≥8 per D-09; planner picks 8 or 10).
- Help topic set (recommend `Getting Started / Tasks / Settings / Team / Reports / Account & Billing`).
- Whether the no-search-results state includes a "Clear search" link.
- Markdown rendering vs plain-text paragraph splitting for article bodies.
- Exact toast copy ("Invite sent" vs "Sent invite to {email}" vs "{email} has been invited").
- Per-topic icon column on the help list (cosmetic).
- `useDebouncedValue` from @mantine/hooks vs hand-rolled `useEffect` + `setTimeout` for D-08 debounce.

## Deferred Ideas

- Hand-curated help article copy (rejected in favor of faker bodies; UI-04 detail-view polish accepted as weaker).
- "Remove member" affordance on Team page (not in TEAM-01..03; would require destructive confirmation modal).
- Top-bar `IconHelp` button (rejected per HELP-04 no-op).
- Floating `?` FAB / dedicated RC anchor markup (rejected per HELP-04 no-op — Pendo badge-activated RC injects its own).
- `DEMO-READY-AUDIT.md` Markdown checklist artifact (rejected; manual verification only).
- Automated Pendo-readiness smoke test (out of scope; no test framework established).
- Per-domain `meta.seededAt.{tasks, teammates}` stamps (rejected; single gate is sufficient).
- `K.helpArticles()` storage key + `helpRepo` + `helpSeed` (rejected; static module sufficient).
- `activitySeed.ts` (not needed; Phase 3 D-22 derivation pattern is sufficient).
- Workspace switcher in top bar (WS2-01, v2).
- Multiple seeded personas — admin/member/viewer (WS2-02, v2; D-02 lays the WorkspaceRoleEnum foundation).
- Markdown rendering for help bodies (v2 if hand-curated copy lands).
- "Was this helpful?" / view counts / related articles on help detail (v2).
- Per-topic icons on help list (cosmetic; planner discretion).
- Table-of-contents / breadcrumbs on help detail (v2).
- Granular RBAC enforcement (cosmetic per PROJECT.md).
- Real email send on invite (out of scope).
- URL persistence of help search query (`?q=invite`) (v2).
- Owner-demotion / Owner-transfer flow (v2 if multi-owner workspaces become a concept).
- Activity entity persistence (rejected; derivation pattern wins).
