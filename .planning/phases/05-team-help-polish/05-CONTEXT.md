# Phase 5: Team, Help & Polish - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new pages (Team and Help) complete the v1 surface inside the existing Mantine AppShell, demo-data seeding expands to cover teammates (tasks already seeded; help articles are a static module — see D-09), and a targeted cross-page polish pass + manual "Looks Done But Isn't" walk-through confirms Halo is demo-ready for Phase 6's Pendo install. Two new `PENDO_IDS` namespaces (`team`, `help`) extend the registry. No new Pendo runtime — Phase 6 owns all `pendo.*` calls.

**In scope (Phase 5 ships):**
- **Team** at `/app/team` (TEAM-01..03): new `TeammateSchema` + `teamsRepo` + `K.teammates(workspaceId)` storage key; table listing teammates with `{name, email, role (WorkspaceRoleEnum), status, lastActiveAt}`; "Invite teammate" modal (Mantine `<Modal size='md'>`) collecting email + role → appends a new teammate row with `status='invited'`, toast "Invite sent to {email}"; inline role-change dropdown on each row that persists via `teamsRepo.updateTeammate`. Owner role cannot be demoted via the dropdown (UI gating — show 'Owner' as disabled option for the owner row, or omit Owner from non-owner dropdowns).
- **Help** at `/app/help` (HELP-01..04): static module `src/help/helpArticles.ts` exporting a faker-seeded array (with `faker.seed(N)` for reload-stability) of ≥6 articles grouped by `topic`; live-filtered search bar (~150ms debounce) over `title + keywords[] + summary`, case-insensitive; no-search-results polished empty state; deep-link route `/app/help/:slug` for detail view; first router.tsx edit since Phase 3 D-01 lock — additive nested child route under `/app/help`.
- **HELP-04 anchor:** **No new anchor markup.** Pendo's badge-activated Resource Center injects its own FAB at runtime in Phase 6. The strict reading of HELP-04 ("a stable anchor suitable for the Pendo Resource Center to attach to") is satisfied by the existing side-nav `Help` link (`PENDO_IDS.nav.help`, Phase 3 D-04). Do NOT build a top-bar `IconHelp` button or floating `?` FAB.
- **Seeding expansion (DATA-01):** new `src/team/teamSeed.ts` (mirrors `tasksSeed.ts` pattern, exports `seedTeammatesIfNeeded(workspaceId)`) generates 8–12 teammates. New coordinator `src/seed/seedAll.ts` exports `seedDemoData(workspaceId)` that calls `seedTeammatesIfNeeded` then `seedIfNeeded` (tasksSeed) in order. AppLayout swaps its current `seedIfNeeded(workspaceId)` call for `seedDemoData(workspaceId)`. Single `meta.seededAt` gates both seeders — no SCHEMA_VERSION bump.
- **`tasksSeed.ts` amendment (D-04 reconciliation with Phase 4 D-10):** the existing seeder is amended so generated tasks pick `assignee` records FROM the teammate list (the just-seeded `K.teammates(workspaceId)` array) rather than minting fresh `{id, name, avatar}` snapshots. `src/tasks/assigneeOptions.ts` (Phase 4 D-10) swaps its source from `listTasks(workspaceId)` to `listTeammates(workspaceId)`. Lists + Reports assignee filters now reflect the team list, which makes guide demos against assignee filters consistent.
- **`PENDO_IDS` extensions:** new `team` and `help` namespaces — every interactive control on the two pages carries an ID from the registry (PEN-07). New primitive wrappers added only if needed (most Phase 4 primitives — Button, TextInput, Select, Modal/MenuTrigger forwarding patterns — cover Phase 5's surfaces).
- **Polish work (UI-01..04):** new empty states for Team ("No teammates yet" + primary CTA "Invite teammate") and Help no-search-results ("No articles match '{query}'. Try a different keyword."); audit + polish Reports filtered-empty state (verify Phase 4 implementation, polish if needed); toast/confirm completeness audit across `/app/*` (verify every save/create/delete/invite path emits `notifications.show`; add missing); typography/color/spacing pass across all pages.
- **Pendo-readiness verification (Success Criteria #5):** manual walk-through via `/gsd-verify-phase` — verifier agent does goal-backward analysis (no canvas anywhere, `.pendo-sr-ignore` on `PasswordInput`, every interactive Phase 5 element references `PENDO_IDS`, every `/app/*` route deep-links cleanly). User-eye items persist as UAT entries (per the Phase 4 commit 5195b3b precedent).

**Out of scope (deferred — see `<deferred>`):**
- Hand-curated help article copy — bodies are faker-generated `lorem.paragraphs()`; titles/summaries/keywords also faker-generated. Deliberate tradeoff in favor of speed; UI-04 polish in the article detail view is accepted as slightly weaker than hand-written copy would deliver. (`<deferred>`)
- "Remove member" affordance on Team — not in TEAM-01..03; deliberately omitted (no destructive flow added on Team page). (`<deferred>`)
- Floating `?` FAB / top-bar `IconHelp` button — collapsed to no-op per HELP-04 resolution above.
- `DEMO-READY-AUDIT.md` Markdown checklist artifact — user opted for manual walk-through only. No file.
- Automated Pendo-readiness smoke test (no-canvas / registry coverage / route deep-link) — out of scope (project hasn't established a test framework per CLAUDE.md "Vitest only if/when tests are added"); deferred to v2 polish.
- "Was this helpful?" / view counts / related articles on help detail — v2.
- Table-of-contents / breadcrumbs / per-topic icons on help — v2.
- Markdown rendering for article bodies — plain-text paragraphs are sufficient given faker bodies.
- Workspace-permission gating (Viewer can't invite, Member can't delete, etc.) — roles are cosmetic in v1 per PROJECT.md "Out of Scope" ("Granular RBAC enforcement").
- Per-domain `meta.seededAt.{tasks, teammates}` stamps — single gate is sufficient for v1; v2 would migrate if a new domain seeds incrementally.
- Activity entity persistence — Dashboard activity timeline is derived from task `updatedAt` (Phase 3 D-22); no separate `K.activity()` key, no `activitySeed.ts`.

</domain>

<decisions>
## Implementation Decisions

### Team — data model, invite flow, role enum

- **D-01:** **New `TeammateSchema` + `teamsRepo` + `K.teammates(workspaceId)` storage key.** Schema fields: `{ id: string (nanoid), firstName: string, lastName: string, email: string (Zod .email()), workspaceRole: WorkspaceRoleEnum, status: 'active' | 'invited', lastActiveAt: string | null (ISO), invitedAt: string | null (ISO), avatar: string | null }`. `src/team/schemas.ts` owns Zod definitions (mirrors `src/tasks/schemas.ts`); `src/team/types.ts` derives types via `z.infer`; `src/team/teamsRepo.ts` exports `listTeammates(workspaceId)`, `getTeammateById(workspaceId, id)`, `createTeammate(workspaceId, input)`, `updateTeammate(workspaceId, id, patch)`, `deleteTeammate(workspaceId, id)` mirroring the `tasksRepo` shape (read-modify-write through `readWithSchema` + `writeJSON` per FND-04). `K.teammates(workspaceId)` is added to `src/storage/keys.ts` as `halo:v1:teammates:${workspaceId}`. **No SCHEMA_VERSION bump** — this is a pure additive key, parallel to how `K.tasks(workspaceId)` was added in Phase 3. The strict per-key co-ownership pattern (Phase 4 D-15) is preserved: `teamsRepo` and `teamSeed` are the only owners of `K.teammates(workspaceId)`.
- **D-02:** **`WorkspaceRoleEnum`: `'Owner' | 'Admin' | 'Member' | 'Viewer'`.** Distinct from the functional `Visitor.role` (Product/Engineering/Design/Marketing/Sales/Operations/Other) captured at signup. The signed-in Visitor's teammate record is seeded as `'Owner'`. UI gating: the Owner row's inline role-change dropdown either shows `'Owner'` as a disabled option (planner picks the Mantine `Select` mechanism — `data` items with `disabled: true`, or filter the options array conditionally per row), or the dropdown for the Owner row is replaced with a static `<Badge>Owner</Badge>`. Either path is acceptable; the locked behavior is "Owner cannot be demoted via the table dropdown in v1". Non-Owner rows' dropdowns offer `Admin / Member / Viewer` only (Owner not in the demote-to options).
- **D-03:** **Invite-teammate flow appends a row with `status='invited'`.** Modal triggered by a primary button on the Team page header (`<Button color="indigo">+ Invite teammate</Button>`). Modal contents: `<TextInput>` for email (RHF + Zod `email()` validator, required, lowercase-normalized on submit) + `<Select>` for role (Admin / Member / Viewer; Owner not invitable). On submit: `teamsRepo.createTeammate(workspaceId, { email, workspaceRole, status: 'invited', invitedAt: new Date().toISOString(), lastActiveAt: null, firstName: emailLocalPart (capitalized), lastName: '', avatar: null })` — `firstName` derived from email local-part (e.g., `alex.chen@acme.com` → `Alex.Chen`) so the row label has some signal before the (fake) acceptance flow. Modal closes, `notifications.show({ title: 'Invite sent', message: 'Sent to {email}' })`. New row appears immediately with an `'Invited'` Mantine `<Badge color="yellow" variant="light">` next to the name and a muted lastActive cell. Pendo demos can target the new-row attributes for guide attachment. Duplicate-email handling: if `teamsRepo.listTeammates` already contains a record with the same email (case-insensitive), the Zod refine on the form rejects with "{email} is already a teammate."
- **D-04:** **Teammate seeding runs first; tasks seeding picks assignees FROM the teammate list.** Order: `seedTeammatesIfNeeded(workspaceId)` → `seedIfNeeded` (tasksSeed). `teamSeed` generates 8–12 teammates via `faker` (per-call random; not `faker.seed`-pinned — variety across workspaces is a feature per the existing tasksSeed comment). The signed-in Visitor is also persisted as a teammate (status='active', workspaceRole='Owner', firstName/lastName/email from `useAuthStore.getState().currentVisitor`); seeded BEFORE the faker-generated batch so the Visitor row appears at the top of the list. `tasksSeed.ts` is amended (Phase 3 lock — surgical extension): after reading the just-seeded teammates via `readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [])`, the task generator picks `assignee` from that array (mapping `{id, firstName + ' ' + lastName, avatar}` into the existing `Assignee` shape) rather than minting fresh snapshots. Defensive fallback: if the teammate read returns `[]` (shouldn't happen post-coordinator but defends against ordering bugs), tasksSeed falls back to its current behavior. `src/tasks/assigneeOptions.ts` (Phase 4 D-10) swaps source from `listTasks(workspaceId)` to `listTeammates(workspaceId)`, dedupes by `teammate.id`, sorts by name asc — Lists + Reports filter and Modal Assignee select now reflect the team list.
- **D-05:** **Inline role change (TEAM-03) persists immediately.** The role cell on each non-Owner row renders a Mantine `<Select>` (compact variant, no label). `onChange` calls `teamsRepo.updateTeammate(workspaceId, teammate.id, { workspaceRole: newRole })`; on success, optimistic React state update + `notifications.show({ message: 'Role updated' })`. No confirmation modal — role changes are cheap and reversible (mirrors the Phase 4 D-04 single-click checkbox toggle precedent for low-stakes mutations). `PENDO_IDS.team.row.roleSelect` plus `data-pendo-teammate-id={teammate.id}` per the dynamic-list parameterization rule.

### Help — schema, navigation, search, persistence

- **D-06:** **`HelpArticleSchema` fields:** `{ id: string (nanoid or stable string), slug: string (URL-safe, lowercase, hyphen-separated), title: string, topic: string (free-form, not Zod-enum'd — adding topics in v2 must not require a schema migration), summary: string (one sentence), body: string (plain-text paragraphs separated by '\n\n'), keywords: string[], updatedAt: string (ISO) }`. `src/help/schemas.ts` owns the Zod schema; `src/help/types.ts` exports the derived TypeScript type. No persistence schema for "user-mutable help state" (no per-user article saved-status / view-count / rating in v1).
- **D-07:** **Deep-link route `/app/help/:slug`** for the detail view. **This is the first `router.tsx` edit since Phase 3 D-01's lock.** Edit is additive: under the existing `/app/help` route, add a nested child route at path `:slug` rendering a new `HelpArticlePage` component (lives at `src/routes/app/help/HelpArticlePage.tsx`). The parent `/app/help` route continues to render the list page. Browser back/forward and refresh both work. If a user lands on `/app/help/:slug` for a slug that doesn't exist in `helpArticles`, render a small "Article not found" state with an `<Anchor>` link back to `/app/help` (mirrors the Phase 4 filter-empty pattern; not a router-level 404).
- **D-08:** **HELP-02 live search** is debounced (~150ms via a small `useDebouncedValue` hook from `@mantine/hooks` if installed, or a one-off `useEffect` + `setTimeout`) over `title + keywords[] + summary`, case-insensitive, whitespace-tolerant. Body is NOT searched (search ranking starts mattering; topic-grouping is the navigational pattern for body content). Matching is substring (no fuzzy / Levenshtein). No-results state: polished `<Center>` empty state with copy "No articles match \"{query}\". Try a different keyword." + secondary `<Anchor>` "Clear search". The search input lives at the top of the list page in a Mantine `<TextInput>` with a `<IconSearch>` left section. `PENDO_IDS.help.search` on the input.
- **D-09:** **Static module persistence — `src/help/helpArticles.ts`** exports a top-level `export const HELP_ARTICLES: HelpArticle[] = generateHelpArticles()` where `generateHelpArticles` calls `faker.seed(N)` (constant `N`, e.g., `42`) at the top to pin the faker state, then generates ≥8 articles. All fields (titles, summaries, keywords, bodies) are faker-generated. `body` uses `faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n')`. **No `K.helpArticles()` storage key**, no `helpRepo`, no `helpSeed`, no seeding gate for help content. The article array is reload-stable via the seed, so users see the same articles every reload (matches the "no edit-article UI" reality). `listHelpArticles()` is a one-liner that returns `HELP_ARTICLES`; `getHelpArticleBySlug(slug)` is a `.find()` lookup. The strict reading of DATA-01 ("seeded via @faker-js/faker for tasks, team members, activity, and help articles") is satisfied by the faker-generation; localStorage persistence is not required for read-only content with no mutation paths. **Tradeoff captured:** UI-04 polish in the article detail view is deliberately weaker than hand-written copy would deliver; user accepted this in exchange for zero copy-writing effort.

### Resource Center anchor (HELP-04) — no-op

- **D-10:** **No anchor markup added in Phase 5.** Pendo's badge-activated Resource Center injects its own FAB at runtime in Phase 6 (the Pendo subscriptionconfigures the RC mode in the Pendo admin UI; the agent creates the DOM element on agent boot). The Phase 6 Pendo install therefore satisfies HELP-04's deeper intent without Halo-side markup. The strict reading of HELP-04 ("a stable anchor suitable for the Pendo Resource Center to attach to") is satisfied by the existing side-nav `Help` link (`PENDO_IDS.nav.help`, established in Phase 3 D-04) — that link is registry-typed, stable across renders, and globally reachable on every `/app/*` route. **Do NOT build a top-bar `IconHelp` button or a floating `?` FAB.** No new `PENDO_IDS` entries under a hypothetical `rc` namespace. The Phase 5 verifier should confirm `PENDO_IDS.nav.help` continues to exist and routes to `/app/help`.

### Seeding architecture & gate

- **D-11:** **Per-domain seeders with a single coordinator.** New `src/team/teamSeed.ts` exporting `seedTeammatesIfNeeded(workspaceId): void` (mirrors the `tasksSeed.ts` shape — same idempotency guard pattern checking `meta.seededAt` + defensive `listTeammates(workspaceId).length > 0` fallback). New `src/seed/seedAll.ts` exporting `seedDemoData(workspaceId): void` that calls `seedTeammatesIfNeeded(workspaceId)` then `seedIfNeeded(workspaceId)` (tasksSeed) **in that order** (teammates must exist before tasks read the teammate list per D-04). AppLayout's existing `useEffect` swaps `seedIfNeeded(workspaceId)` for `seedDemoData(workspaceId)`. Help articles do NOT participate in seeding (D-09 static module); no `helpSeed.ts` exists. Activity is derived from task `updatedAt` (Phase 3 D-22) — no `activitySeed.ts` either.
- **D-12:** **Single `meta.seededAt` gates everything; no SCHEMA_VERSION bump.** On first sign-in: if `meta.seededAt` is null, `seedDemoData(workspaceId)` runs both seeders in sequence, then stamps `meta.seededAt = new Date().toISOString()` AT THE END (after both seeders succeed). If `meta.seededAt` is non-null, both seeders short-circuit immediately. **Stamping happens in the coordinator `seedDemoData`**, NOT inside each seeder — moves the stamp responsibility out of `tasksSeed.ts` (which currently stamps at its tail) and into `seedAll.ts`. This is a one-line surgical change to `tasksSeed.ts`: remove the `writeJSON(K.meta(), { ...meta, seededAt: ... })` at the end (and the meta read above it that's only there to drive the stamp); the in-line idempotency guard (`meta.seededAt !== null` short-circuit) stays. `seedDemoData` now owns both the orchestration and the stamping. `teamSeed.ts` follows the same idiom — short-circuit on `meta.seededAt !== null`, do not stamp. No `MetaSchema` change required; no SCHEMA_VERSION bump; no new migration entry.
- **D-13:** **Reset demo data (Phase 4 D-17) compatibility.** The existing Reset flow enumerates `Object.keys(localStorage)` for `halo:v*` matches and removes each. The new `K.teammates(workspaceId)` key (`halo:v1:teammates:${workspaceId}`) matches the prefix and is cleared automatically. No edit to Reset code is required. Validation step: after reset, on next sign-in, `seedDemoData` runs both seeders fresh (matches Phase 4 D-17's "re-seed on next sign-in via FND-05" assertion).

### `PENDO_IDS` extensions (Phase 5)

- **D-14:** **Two new namespaces in `src/pendo/PENDO_IDS.ts`:**
  - `team: { header: { inviteButton }, table: { container }, row: { roleSelect, kebab? }, invite: { modalEmail, modalRole, modalSubmit, modalCancel }, emptyState: { container, cta } }` — covers Team page interactive surfaces. The `row.roleSelect` element receives `data-pendo-teammate-id={teammate.id}` per CLAUDE.md dynamic-list rule.
  - `help: { search, topic: { container }, article: { row, detailBackLink }, emptyState: { container }, noResults: { container, clearLink } }` — covers Help list, detail, and empty/no-results states. The `article.row` element receives `data-pendo-article-slug={article.slug}` so Session Replay attributes per-article clicks.
- **D-15:** **Leaf-string convention unchanged.** Dotted, kebab-case (e.g., `'team.row.role-select'`, `'help.article.detail-back-link'`). The hand-typed-string ban (CONVENTIONS.md §1) continues to apply — every consumer references `PENDO_IDS.<namespace>.<key>`. The `Leaves<typeof PENDO_IDS>` type derivation in the registry picks up the new namespaces automatically; no `PendoId` type definition change.

### Polish work & Pendo-readiness verification

- **D-16:** **Polish scope (UI-01..04):**
  - **UI-01 (empty states):** Lists already has two (Phase 4 D-06). Dashboard has one (Phase 3 DASH-04). Reports filtered-empty state is verified — polish only if Phase 4 didn't already land it. **NEW:** Team empty state ("No teammates yet" + primary CTA `<Button>Invite teammate</Button>` opening the invite modal); Help no-search-results state (covered in D-08). Help-with-no-articles state never triggers because the static module guarantees ≥8 articles, but a "All articles" header is still rendered so the topic-grouped list isn't visually bare.
  - **UI-02 (toasts):** Verify every save/create/delete/invite path emits `notifications.show`. Phase 5 adds: invite-teammate toast (D-03), role-change toast (D-05). Audit existing pages for gaps (likely none, given Phase 2/3/4 precedent).
  - **UI-03 (destructive confirms):** Phase 5 introduces NO new destructive flows ("Remove member" is out of scope per `<deferred>`). No new confirmation modals.
  - **UI-04 (visual polish pass):** Walk Dashboard / Lists / Settings / Reports / Team / Help and fix any spacing/typography/color inconsistencies. Follow the Phase 3 UI-SPEC typography contract (4 sizes + 2 weights; `<Title order={2}>` for big numbers; `<Text size="sm">` for labels; no raw pixel CSS values; no `fw={700}`). All new `<Paper>` surfaces use `withBorder`, not `shadow`.
- **D-17:** **No `DEMO-READY-AUDIT.md` artifact.** Verification is manual via `/gsd-verify-phase`. The verifier agent performs the Success Criteria #5 checklist: (a) grep for `<canvas>` usage anywhere in `src/` — must be zero; (b) confirm `.pendo-sr-ignore` is applied by `src/ui/primitives/PasswordInput.tsx` and any `<input type="password">` consumers; (c) confirm every Phase 5 interactive element references `PENDO_IDS.<namespace>.<key>` (no hand-typed `data-pendo-id` strings); (d) confirm every `/app/*` route (including the new `/app/help/:slug`) refreshes cleanly without falling back to root. User-eye items the verifier cannot conclude (typography pass, "could this pass for a real B2B SaaS in a screenshot?") persist as UAT entries in `VERIFICATION.md` per the Phase 4 commit `5195b3b` precedent.

### Claude's Discretion

- Exact Owner-demotion gating mechanism (disabled-option in the dropdown vs static `<Badge>Owner</Badge>` for the owner row) — planner picks at compose time; both satisfy D-02.
- Whether `firstName` derivation from email local-part on invite (D-03) uses `'.'`/`'_'`-split + Title-Case or just raw-with-Title-Case — planner picks; both satisfy the "row label has some signal" requirement.
- Whether the teammate count to seed is exactly 8, 10, or somewhere in 8–12 — planner picks (the existing tasksSeed uses 40–60 via `faker.number.int`; matching that idiom for teammates is fine).
- Avatar source for seeded teammates — `faker.image.avatar()` (URL-based fake avatar) or Mantine `<Avatar>` initials fallback derived from name. Either works; consider hardware/network behavior in demos (faker.image.avatar URLs are remote; consider cacheability). Planner picks.
- Exact number of help articles (≥6 required; D-09 says ≥8; planner picks 8 or 10).
- Exact help topic set — recommend `'Getting Started' | 'Tasks' | 'Settings' | 'Team' | 'Reports' | 'Account & Billing'` to mirror the side-nav structure for guide-anchor symmetry; planner can adjust.
- Whether the no-search-results state has a "Clear search" link or just instructs the user to clear themselves; D-08 specifies the link, planner can drop if it feels redundant.
- Markdown rendering vs plain-text paragraph rendering for article bodies — plain-text paragraph splitting on `'\n\n'` is sufficient given faker bodies have no real markdown structure; if planner wants to be future-proof, a tiny markdown subset (paragraphs + headings + lists via `marked` or a 30-line manual renderer) is acceptable but not required.
- Exact toast copy ("Invite sent" vs "Sent invite to {email}" vs "{email} has been invited") — follows the Phase 2/3/4 precedent; planner picks at compose time.
- Whether to add a per-topic icon column on the help list (cosmetic) — D-09 doesn't require it; planner discretion.
- Whether the `useDebouncedValue` hook (Mantine) is preferred over a one-off `useEffect` + `setTimeout` for D-08's debounce — Mantine has it bundled in `@mantine/hooks` (verify availability); planner picks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-level locks
- `CLAUDE.md` — Technology stack (Mantine 9 / Recharts SVG / TanStack Table 8.x / dayjs / nanoid / @faker-js/faker), Pendo integration patterns (dynamic-list parameterization `data-pendo-id` + `data-pendo-<entity>-id={x.id}`), "What NOT to Use" list (Chart.js / canvas / hash-routing / Formik / CSS-in-JS class targeting), no test framework requirement
- `.planning/PROJECT.md` — Core value, Out of Scope (esp. "Real email", "Real backend", "Granular RBAC enforcement", "In-app product tour / onboarding checklist", "Pendo Snippet settings UI"), Key Decisions table
- `.planning/REQUIREMENTS.md` §"Team / Users" (TEAM-01..03), §"Help / Docs" (HELP-01..04), §"Seed Data & Polish" (DATA-01, UI-01..04). Inherited contracts: FND-04 (`readWithSchema` envelope), FND-05 (`meta.seededAt` gating), PEN-07 (PENDO_IDS), PEN-08 (SVG-only charts — not directly relevant to Phase 5 but stays in force), UI-03 (destructive actions show confirmation modal — Phase 5 adds no new destructive flows)
- `.planning/STATE.md` — Decisions list (esp. Phase 02-* RHF + Zod patterns; Phase 03-* tasksRepo + tasksSeed lock; Phase 04-* table/modal/confirm/toast patterns; Phase 04 `?tab=` URL deep-link pattern)
- `.planning/ROADMAP.md` §"Phase 5" — Goal + Success Criteria #1–5 are the verification anchors; §"Phase 6" documents the Pendo runtime contract that Phase 5 must NOT prematurely call

### Phase 4 context (DO inherit verbatim)
- `.planning/phases/04-core-pages-lists-settings-reports/04-CONTEXT.md` — D-04 (dynamic-list parameterization precedent), D-06 (two empty states pattern — full-page vs in-table), D-07 (`<TaskFormModal>` create/edit dual-mode), D-08 (RHF + Zod resolver `mode: 'onSubmit'`), D-09 (repo-owned invariants), D-10 (`assigneeOptions` — Phase 5 swaps source to teammates per D-04 above), D-15 (`authRepo.updateVisitor/updateWorkspace` pattern → mirrored by `teamsRepo.updateTeammate`), D-17 (Reset demo data — automatically clears new `halo:v1:teammates:*` keys), D-24 (PENDO_IDS namespace structure)
- `.planning/phases/03-authenticated-shell-dashboard/03-CONTEXT.md` — D-04 (`PENDO_IDS.nav.help` already established as the HELP-04 anchor), D-22 (Dashboard activity derived from task updatedAt — no separate Activity entity in Phase 5)
- `.planning/phases/02-registration-sign-in/02-CONTEXT.md` — RHF + Zod precedent for the invite-teammate form

### Markup conventions & Pendo readiness
- `docs/CONVENTIONS.md` §1 — PENDO_IDS is the only source of `data-pendo-id` (hand-typed string ban; Phase 5 extends with `team` and `help` namespaces)
- `docs/CONVENTIONS.md` §2 — SVG-only chart rule (Phase 5 ships no new charts; stays in force)
- `docs/CONVENTIONS.md` §3 — `.pendo-sr-ignore` policy (Phase 5 ships no new password fields; stays in force, verified during D-17 audit)
- `src/pendo/PENDO_IDS.ts` — Registry to extend with `team` and `help` namespaces. Existing namespaces (`layout`, `sandbox`, `signup`, `signin`, `nav`, `topbar`, `dashboard`, `comingSoon`, `lists`, `settings`, `reports`) are NOT touched.
- `src/ui/primitives/` (entire dir) — Wrapper contract (`pendoId: PendoId` required, forwarded to DOM as `data-pendo-id`). Phase 5 likely needs NO new wrappers — Button / TextInput / Select / Modal-forwarding / Anchor cover the Team and Help interactive surfaces. Confirm during planning.

### Data layer (Phase 2/3/4 lock — DO inherit)
- `src/auth/authStore.ts` — `useAuthStore` selectors: `currentVisitor` (used by `teamSeed` to seed the Visitor-as-Owner teammate record), `currentWorkspace`. No setState calls from Phase 5.
- `src/auth/schemas.ts` — `RoleEnum` (functional Visitor role; Phase 5 does NOT reuse for workspaceRole — D-02). `VisitorSchema`, `WorkspaceSchema` are read-only for Phase 5.
- `src/auth/types.ts` — `Visitor` (read for seeding the Owner-Visitor teammate).
- `src/tasks/schemas.ts` — `TaskSchema`, `AssigneeSchema` (Phase 5 task seeder amendment maps `Teammate` to `Assignee` shape per D-04).
- `src/tasks/tasksRepo.ts` — Untouched in Phase 5.
- `src/tasks/tasksSeed.ts` — **Surgical amendment (D-04, D-12):** (a) before generating tasks, read just-seeded `K.teammates(workspaceId)` and map to `Assignee` shape for picking; (b) remove the `meta.seededAt` stamp at the tail (moves to `seedAll.ts`). The in-line idempotency guard (`meta.seededAt !== null` short-circuit at the top) stays.
- `src/tasks/assigneeOptions.ts` (Phase 4 D-10) — Source swap from `listTasks(workspaceId)` to `listTeammates(workspaceId)`. Shape unchanged.

### Storage envelope (FND-04 / FND-05)
- `src/storage/keys.ts` — **Add `teammates: (workspaceId: string): string => \`halo:v${SCHEMA_VERSION}:teammates:${workspaceId}\``** to the `K` object. Pattern mirrors `K.tasks(workspaceId)`. No SCHEMA_VERSION bump.
- `src/storage/codec.ts` — `readWithSchema`, `writeJSON`, `removeKey`. All Phase 5 storage I/O routes through these helpers.
- `src/storage/schemas.ts` — `MetaSchema` is NOT changed (single-stamp gate per D-12).
- `src/storage/migrations.ts` — No new migration entry.

### Router & layouts (Phase 1/2/3/4 lock)
- `src/router.tsx` — **First edit since Phase 3 D-01 lock.** Add a nested child route `:slug` under the existing `/app/help` route rendering `HelpArticlePage`. The parent `/app/help` continues to render the list. Confirm `RequireAuth` still wraps the parent (it does — route hierarchy inherits guards).
- `src/routes/app/AppLayout.tsx` — **Swap `seedIfNeeded(workspaceId)` for `seedDemoData(workspaceId)`** in the existing `useEffect`. No other changes. Do not add help-anchor markup (HELP-04 no-op per D-10).
- `src/routes/app/team/TeamPage.tsx` — Body replaced. Composes the new Team UI (table + invite modal + empty state). Suggested layout: `src/team/{TeamTable, InviteTeammateModal, TeamEmptyState}.tsx`.
- `src/routes/app/help/HelpPage.tsx` — Body replaced with the article list (grouped by topic) + search input + no-search-results state. Suggested layout: `src/help/{HelpList, HelpSearchInput, HelpNoResultsState}.tsx` plus the existing helpArticles.ts data module.
- `src/routes/app/help/HelpArticlePage.tsx` — **NEW file.** Detail view rendered at `/app/help/:slug`. Reads `slug` via `useParams`, looks up `getHelpArticleBySlug(slug)`, renders title + topic + body + "Back to Help" anchor. Article-not-found state renders if lookup misses.
- `src/routes/app/{lists,reports,settings,dashboard}` — UNTOUCHED in Phase 5 (Phase 4 owns these). Polish-pass typography/spacing tweaks may touch them.

### Mantine integration (verify peer-deps if installing new packages)
- `@mantine/hooks` — `useDebouncedValue` for D-08 search debounce, if package is already installed (likely yes; Phase 4 D-19's `DatePickerInput` pulled `@mantine/dates` which transitively often includes hooks). Verify at planning time.
- Mantine 9 `<Modal>`, `<Tabs>`, `<Select>`, `<TextInput>`, `<Badge>`, `<Avatar>`, `<Paper>` — all used by Phase 5; no new package installs expected.
- `@mantine/notifications` — verified mounted in `src/App.tsx`. Phase 5 reuses for invite + role-change toasts.

### Pendo readiness (verification anchors for D-17)
- `src/pendo/PENDO_IDS.ts` `Leaves<typeof PENDO_IDS>` — Picks up new `team` and `help` namespaces automatically; `PendoId` type updates without code change.
- `src/ui/primitives/PasswordInput.tsx` (Phase 1 PEN-09) — `.pendo-sr-ignore` class application; Phase 5 audit verifies the class still lands on the rendered DOM `<input>` (no regressions from Phase 4 changes).
- Verifier should grep `src/` for `data-pendo-id="` (hand-typed) — must be zero outside `PENDO_IDS.ts` itself. Grep for `<canvas` — must be zero.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/tasks/tasksRepo.ts`** — Shape to mirror for `src/team/teamsRepo.ts` (read-modify-write through `readWithSchema` + `writeJSON`; CRUD function signatures).
- **`src/tasks/tasksSeed.ts`** — Shape to mirror for `src/team/teamSeed.ts` (faker + nanoid + Zod-validated final array + `meta.seededAt` short-circuit at top). Will be surgically amended in Phase 5 per D-04 + D-12.
- **`src/tasks/assigneeOptions.ts`** (Phase 4 D-10) — Single-file source swap from `listTasks` to `listTeammates`; consumers (Lists filters, TaskFormModal Assignee select, Reports Assignee filter) need no edits.
- **`src/auth/authRepo.ts`** — `updateVisitor` / `updateWorkspace` pattern (Phase 4 D-15) is the template for `teamsRepo.updateTeammate` (used by inline role change in D-05).
- **`src/auth/authStore.ts`** `useAuthStore.getState().currentVisitor` — Read by `teamSeed` to seed the Visitor-as-Owner teammate record (D-04).
- **`src/auth/schemas.ts`** `RoleEnum` — NOT reused for workspaceRole (D-02 explicitly chooses a new enum). Functional Visitor role and workspace permission role are different concepts.
- **`src/storage/keys.ts`** `K` object — Add `teammates(workspaceId)` builder (D-01); no SCHEMA_VERSION bump.
- **`src/ui/primitives/*`** (Button, TextInput, Select, Anchor, Checkbox, etc.) — All carry `pendoId: PendoId`. Phase 5 reuses verbatim; no new wrappers expected.
- **`src/dashboard/relative-time.ts`** — Likely useful for "last active 2 hours ago" cell rendering on the Team table (verify the helper's API at plan time).
- **`@mantine/notifications` `notifications.show`** — Verified mounted in `src/App.tsx`. Reuse for invite + role-change toasts (D-03, D-05).
- **`nanoid`** + **`@faker-js/faker`** — Already runtime deps (Phase 3 install). Reuse for teammate seeding and help-article static generation.

### Established Patterns
- **Schemas-as-source-of-truth** (Zod first, types derived via `z.infer`). `TeammateSchema` and `TeammatesArraySchema` live in `src/team/schemas.ts`; `Teammate` type derives via `z.infer`. Same in `src/help/schemas.ts`.
- **Per-storage-key feature module ownership** (Pattern S4 from Phase 3) — One repo + one seeder per persistent collection. `teamsRepo` and `teamSeed` are the only owners of `K.teammates(workspaceId)`. `helpArticles.ts` owns the static help array (no localStorage key, so no co-ownership concern).
- **Wrapped-with-`pendoId` primitives** — Required prop on every interactive wrapper, typed as `Leaves<typeof PENDO_IDS>`. TypeScript flags hand-typed strings at compile time. Phase 5 extends the registry; the `PendoId` type updates automatically.
- **RHF + Zod resolver + `mode: 'onSubmit'`** — Phase 2/4 precedent. The invite-teammate modal form inherits this exactly.
- **Two-level pathless layout + nested children** (Phase 2/3 `router.tsx` shape) — Phase 5 adds ONE nested child `:slug` under `/app/help`. Surgical, additive.
- **Module-init hydration** (`src/auth/authStore.ts`) — Selectors return populated values on first render. Team and Help pages read `currentWorkspace?.id` without loading-state plumbing.
- **`<Paper withBorder p="md" radius="md">` surface pattern** — Phase 3/4 lock. All Phase 5 surfaces (team table card, help article list cards, search input wrapper, detail page body card) use this.
- **Toast pattern** — `notifications.show({ title?, message, color? })`. Phase 5 uses for invite + role-change.
- **Two empty-state grammar** (Phase 4 D-06) — Full-page hero `<Center mih={400}>` for "no data yet" (Team page); compact in-place state for "filter/search yields zero" (Help no-search-results).

### Integration Points
- **`src/router.tsx`** — Single edit: add nested `:slug` child under existing `/app/help` route (D-07). First router edit since Phase 3 D-01.
- **`src/routes/app/AppLayout.tsx`** — Single edit: swap `seedIfNeeded(workspaceId)` for `seedDemoData(workspaceId)` (D-11). No other changes.
- **`src/routes/app/team/TeamPage.tsx`** — Body replaced. Composes `<TeamTable>` + `<InviteTeammateModal>` + `<TeamEmptyState>`. Suggested module layout: `src/team/components/{TeamTable, InviteTeammateModal, TeamEmptyState}.tsx`.
- **`src/routes/app/help/HelpPage.tsx`** — Body replaced. Composes `<HelpSearchInput>` + topic-grouped article list + `<HelpNoResultsState>`. Suggested module layout: `src/help/components/{HelpList, HelpSearchInput, HelpNoResultsState}.tsx`.
- **`src/routes/app/help/HelpArticlePage.tsx`** — NEW file (D-07). Detail view; reads `:slug` from `useParams`.
- **`src/storage/keys.ts`** — Add `K.teammates(workspaceId)` builder.
- **`src/tasks/tasksSeed.ts`** — Surgical amendment per D-04 + D-12 (pick assignees from teammates; remove final `meta.seededAt` stamp).
- **`src/tasks/assigneeOptions.ts`** — Source swap from `listTasks` to `listTeammates` (D-04).
- **`src/pendo/PENDO_IDS.ts`** — Two new namespaces appended (D-14).
- **`package.json`** — No new runtime deps expected. Verify `@mantine/hooks` availability at plan time (for `useDebouncedValue`).
- **New directories created by Phase 5:** `src/team/`, `src/team/components/`, `src/help/`, `src/help/components/`, `src/seed/`. Mirrors the per-feature module convention from Phase 4 (`src/tasks/components/`, `src/settings/`, `src/reports/`).

</code_context>

<specifics>
## Specific Ideas

- From the user (HELP-04 discussion): "I actually don't need to create an anchor, we will use a pendo badge activated resource center that creates its own FAB. So no work necessary here." — captured in D-10. The Pendo Resource Center's "badge-activated" mode is configured in the Pendo admin UI (subscription-level setting); the agent injects its own FAB at runtime in Phase 6. No Halo-side anchor markup is needed; the existing `PENDO_IDS.nav.help` link satisfies HELP-04 verbatim.
- From the user (Help body content): "Faker-generated lorem-ipsum bodies" — explicit tradeoff in favor of speed over polish in the article detail view. UI-04 polish in the detail view is weaker than hand-curated copy would deliver; user accepted this. All article fields (title/summary/keywords/body) are faker-generated. (`<deferred>` documents the rejected hand-curated option.)
- From the user (polish-audit deliverable): "Polish work only, no audit artifact — verification step is manual" — no `DEMO-READY-AUDIT.md` file; `/gsd-verify-phase` handles the Success Criteria #5 walk-through with UAT persistence per the Phase 4 commit `5195b3b` precedent (D-17).
- From CLAUDE.md (dynamic-list parameterization): D-05 (team role-select rows) and D-14 (article rows) both apply the `data-pendo-<entity>-id={x.id}` rule — teammates use `data-pendo-teammate-id`, articles use `data-pendo-article-slug`.
- From Phase 3 D-04 (existing nav.help registry entry): HELP-04's "stable anchor" requirement is satisfied without any new markup; the side-nav Help link is the anchor (D-10).
- From Phase 4 D-17 (Reset demo data): the existing `halo:v*` prefix sweep automatically clears the new `K.teammates(workspaceId)` key (D-13); no Reset-code edit required.
- From CLAUDE.md "What NOT to Use" → canvas charts: stays in force; Phase 5 ships no charts but the D-17 verifier greps for `<canvas` as a regression guard.

</specifics>

<deferred>
## Deferred Ideas

- **Hand-curated help article copy** — Considered, rejected in favor of faker generation; UI-04 polish in the article detail view is the accepted tradeoff. A v2 polish phase could swap `helpArticles.ts` to a hand-written static array without any schema or route changes.
- **"Remove member" affordance on Team page** — Not in TEAM-01..03; deliberately deferred. Would require a destructive confirmation modal (UI-03 pattern) and a `deleteTeammate` repo call. v2.
- **Top-bar `IconHelp` button** and **floating `?` FAB** — Both rejected per D-10 (Pendo badge-activated RC injects its own FAB at runtime).
- **`DEMO-READY-AUDIT.md` Markdown checklist artifact** — Rejected per D-17 in favor of manual verifier walk-through.
- **Automated Pendo-readiness smoke test** (no-canvas / registry coverage / route deep-link Vitest or Playwright) — Out of scope; project hasn't established a test framework per CLAUDE.md ("Vitest — only if/when tests are added"). v2 polish.
- **Per-domain `meta.seededAt.{tasks, teammates}` stamps** — Rejected (D-12); single gate is sufficient and avoids a SCHEMA_VERSION bump.
- **`K.helpArticles()` storage key + `helpRepo` + `helpSeed`** — Rejected (D-09); static module is sufficient for read-only content.
- **`activitySeed.ts`** — Not needed; Dashboard activity is derived from task `updatedAt` (Phase 3 D-22).
- **Workspace switcher in top bar** (WS2-01) — v2.
- **Multiple seeded personas (admin / member / viewer)** (WS2-02) — Partially enabled by D-02 `WorkspaceRoleEnum` foundation; v2 will add the persona-switcher UI.
- **Markdown rendering for help article bodies** — Plain-text paragraph rendering is sufficient given faker bodies. v2 if hand-curated bodies want richer formatting.
- **"Was this helpful?" / view counts / related articles** on help detail — v2.
- **Per-topic icons in help list** — Cosmetic; planner discretion in D-09 / Claude's Discretion; v2 if not added.
- **Table-of-contents / breadcrumbs on help detail** — v2.
- **Granular RBAC enforcement** (Viewer can't invite, etc.) — Roles cosmetic per PROJECT.md "Out of Scope".
- **Real email send on invite** — Out of Scope per PROJECT.md ("Real email").
- **Pendo-RC anchor markup variations** (FAB, IconHelp, both) — All collapsed to no-op (D-10).
- **URL persistence of help search query** (`?q=invite`) — Component state suffices for v1; Phase 5 polish could add if a guide demo wants shareable URLs. v2.
- **Owner-demotion flow** — Explicitly gated by D-02; v2 would add Owner transfer if multi-owner workspaces become a concept.
- **Activity entity persistence** — Rejected (Phase 3 D-22 derivation pattern is sufficient).

</deferred>

---

*Phase: 05-team-help-polish*
*Context gathered: 2026-05-15*
