# Project Research Summary

**Project:** Halo
**Domain:** Frontend-only fake multi-tenant SaaS SPA (project/task management vertical) built as a Pendo instrumentation playground
**Researched:** 2026-05-13
**Confidence:** HIGH (overall); MEDIUM on specific Pendo agent API call names and current selector-attribute conventions (verify against `support.pendo.io` at install time)

## Executive Summary

Halo is not a product — it is a **Pendo demo surface dressed as a B2B SaaS**. Every feature, file boundary, and naming convention is judged against a single question: "does this exercise one of Pendo's four pillars (events/funnels, guides, feature adoption, Session Replay)?" Research across all four streams converges on the same picture: the app is small in surface area but disproportionately demanding on three cross-cutting contracts — **stable DOM selectors, a clean Pendo identity lifecycle, and a versioned localStorage envelope** — that must be locked in *before* any page is built. Getting those wrong at the foundation level is what kills these kinds of demos.

The recommended stack is decisively **React 18 + Vite + TypeScript + Mantine + Recharts + Zustand + React Hook Form + Zod**, with React Router v6 (data router) for routing. React wins over Svelte unambiguously here because the load-bearing requirement is "SaaS-grade polish with deep charting + form ecosystems," not framework ergonomics — and Mantine is the highest-velocity path to that polish. Recharts is preferred over canvas chart libraries specifically because **Session Replay and Pendo guides cannot meaningfully target canvas elements** — SVG is non-negotiable. LocalStorage is hand-rolled behind a versioned, namespaced repo pattern (`halo:v1:<domain>[:scopeId]`), with Zod validation on every read and `zustand/middleware/persist` only for the auth/UI store itself.

The dominant risk is not technical — it is **scope creep into real product features** (drag-and-drop Kanban, rich-text comments, real auth, file uploads) that don't increase Pendo demo surface. Mitigation is procedural: every roadmap phase must produce at least one new Pendo-demoable surface, and the out-of-scope list in `PROJECT.md` must be treated as load-bearing. The secondary risks are all variants of **Pendo identity drift** (initializing before a visitor exists, stale identity after sign-out, missing route signals on SPA navigation, mid-session metadata not reaching Pendo) — these are mechanical, well-understood failure modes whose prevention lives in a single `PendoBridge` provider component and a centralized `PENDO_IDS` selector registry.

## Key Findings

### Recommended Stack

The stack is **opinionated, settled, and not a close call**. React is preferred over Svelte because Halo's whole reason for existing is polished SaaS UI + charting + Pendo selectability — three areas where React's ecosystem is materially deeper. Mantine (over shadcn/ui, Chakra, MUI, Ant) gives the fastest path to "looks like a real B2B SaaS out of the box" with AppShell, forms, tables, modals, and notifications all included. Recharts (SVG-rendered) is mandatory over Chart.js (canvas) because Pendo guides and Session Replay both require DOM-targetable chart elements.

**Core technologies (working baseline — confirmed against STACK.md):**

- **React 18.3.x** (or 19.x if stable at install) — UI framework; deepest SaaS-UI + charting ecosystem; matches Pendo's customer base
- **TypeScript 5.4+** — required to make `data-pendo-id` patterns enforceable via typed prop unions
- **Vite 5.x** — fast HMR, zero-config TS+JSX; the default modern SPA toolchain
- **React Router 6.x** (data router APIs) — History API routing (NOT hash routing; Pendo needs real URLs); nested routes match the SaaS shell pattern
- **Mantine 7.x** — primary UI library; AppShell + forms + tables + notifications + `@mantine/charts` (Recharts wrapper)
- **Recharts 2.x** — SVG charting (mandatory for Pendo demos); use directly or via `@mantine/charts`
- **Zustand 4.x** — global state (auth, current workspace, UI prefs); with `zustand/middleware/persist` for the store itself
- **React Hook Form 7.x + Zod 3.x + `@hookform/resolvers`** — the canonical trio for multi-step registration with validation; Zod doubles as the localStorage-read validator
- **@tanstack/react-table 8.x** — headless tables on Reports page; gives full control over markup for stable Pendo selectors
- **nanoid 5.x + @faker-js/faker 8.x + dayjs 1.x** — IDs, seed data, date formatting

**Explicit "do not use":** CRA (deprecated), Next.js (SSR conflicts with no-backend), Formik (maintenance mode), Chart.js / Highcharts / canvas-based charts (Pendo can't target them), CSS-in-JS runtime libs as primary styling (hashed classes break selectors), unversioned localStorage keys, and any pattern that calls `pendo.initialize` more than once per page load.

**Version pin note:** STACK.md research ran without network access; library *selection* is HIGH confidence but specific version lines should be re-verified via `npm view <pkg> version` at install time.

### Expected Features

Features map directly onto the **four Pendo pillars**. A feature that doesn't exercise at least two pillars is, for this project, an anti-feature regardless of how "real" it would feel.

**Must have (v1 — table stakes, all four pillars covered):**

- **Multi-step registration (4 distinct URLs: `/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`)** — the canonical multi-step funnel demo; each step a distinct route so Pendo can build a page-based funnel
- **Email/password sign-in + sign-out** — fake but realistic; gateway for `pendo.identify` and identity reset
- **Authenticated AppShell** — persistent side nav + top bar + workspace switcher + user menu; every nav item gets a stable selector and is a guide-anchor target
- **Dashboard** — 4–6 stat cards + 2 SVG charts + time-range selector + activity feed + empty state (empty state is the highest-value guide anchor)
- **Lists page (List view, full CRUD)** — create / edit / complete / delete / sort / filter; the highest-frequency-event surface
- **Settings** — tabbed (Profile / Workspace / Preferences) — saves flow back to `pendo.identify` to demonstrate metadata sync
- **Reports** — date range + filter + table + 1 chart + CSV export (CSV export is a classic B2B adoption KPI)
- **Team / Users** — member list + invite modal + role dropdown; surfaces account-scoped guides
- **Help / Docs** — searchable articles + 1 detail page; natural home for a Pendo Resource Center anchor
- **Cross-cutting:** Pendo Snippet wired in with visitor + account, stable `data-pendo-id` attributes on every interactive element, toast feedback + confirmation modals, empty states with CTAs

**Should have (v1.x — substantial demo-surface uplift, second pass):**

- **Board view + drag-and-drop on Lists** — the marquee Session Replay demo
- **Workspace switcher with 2–3 seeded workspaces** — multi-tenant Pendo demo (account ID actually changes mid-session)
- **Calendar view on Lists** — third view-mode adoption metric
- **Command-bar (Cmd+K)** — high-velocity event generator
- **Notifications bell + panel** — badge guide-anchor surface
- **Task detail slide-over with comments + @-mentions** — varied interactions for replay
- **Theme toggle** — clean binary feature-adoption metric
- **Keyboard-shortcut cheatsheet (`?` key)** — power-user feature; cheatsheet itself is a guide anchor

**Defer / Anti-features (v2+ or never):**

- **Anti-features (never build):** real auth (bcrypt/JWT/OAuth/SSO), real payments, real email, real-time collab (WebSockets/CRDTs), mobile-native, multi-device sync, i18n/RTL, WCAG compliance pass, real file uploads, real search index, Gantt charts/dependencies, time tracking, workflow automation, AI assistant, integration marketplace, granular RBAC enforcement (cosmetic role labels only), audit log page, custom domains, API key management UI, Pendo Snippet settings UI
- **Defer to v2 only if a specific demo need appears:** multiple seeded personas (admin/member/viewer) for role-based guide targeting, a "long-time user" vs "new user" account for cohort-segmentation demos

### Architecture Approach

The architecture is a **strict provider stack** wrapping a **public-vs-protected route split**, with **per-domain localStorage stores** behind a versioned namespace. The defining structural constraint is that Pendo identity is derived from `auth + workspace`, so providers must mount in dependency order: `StorageProvider → AuthProvider → WorkspaceProvider → PendoBridge → Router`. Pendo identity changes flow through exactly one place (`PendoBridge`) — Pendo calls are never sprinkled across feature code. The `pendo/` folder is a first-class top-level concern (snippet wrapper, metadata builders, `PENDO_IDS` registry, route bridge).

**Major components:**

1. **Pendo layer (`src/pendo/`)** — Snippet stub in `index.html`; `client.ts` wrapper around `initialize` / `identify` / `updateOptions` / `location.setUrl`; `metadata.ts` builders for visitor + account; `selectors.ts` typed registry of every `data-pendo-id` value used in the app; `PendoBridge` provider that reads auth + workspace and emits the right Pendo call; `PendoRouteBridge` that fires `pendo.location.setUrl()` on every `useLocation` change.
2. **Identity layer (`src/auth/` + `src/workspace/`)** — `AuthProvider` holds `currentVisitor`; `WorkspaceProvider` holds `currentWorkspace`; both hydrate from localStorage on boot and are the sole inputs to Pendo identity; `RequireAuth` / `RequireAnon` route guards.
3. **Storage layer (`src/storage/`)** — `keys.ts` as single source of truth for namespaced keys (`halo:v1:<domain>[:scopeId]`); `codec.ts` for safe JSON parse with try/catch; `migrations.ts` for `schemaVersion` upgrades; `seeder.ts` idempotent (gated by `meta.seededAt`) so demoer mutations aren't clobbered on reload.
4. **Routing layer (`src/routes/`)** — Hard split between `public/` (PublicLayout: landing, multi-step signup, signin) and `app/` (AppShell: SideNav + TopBar + page outlet). PublicLayout never imports AppShell and vice versa.
5. **Page modules (`src/routes/app/<page>/`)** — Each page owns its data hooks (`useTasks`, `useTeam`) which wrap pure domain stores in `src/data/`; pages apply `data-pendo-id` from the registry; no page touches `localStorage` directly.
6. **UI primitives (`src/ui/`)** — Generic, dependency-light wrappers over Mantine; forward `data-pendo-id` but never bake one in (selectors are applied at the page layer where intent is known).

### Critical Pitfalls

The top five risks all fall into two categories: **Pendo identity lifecycle** and **selector/storage discipline**.

1. **Pendo identity drift across the auth lifecycle** (pitfalls 1, 2, 9 combined) — Calling `pendo.initialize` with `null`/`undefined` visitor IDs glues authenticated sessions to a broken anonymous shadow; failing to re-identify on sign-out → sign-in-as-different-user attributes B's events to A; mid-session metadata updates (name change, workspace rename) silently never reach Pendo. **Prevention:** anonymous `initialize` at boot, `identify` on sign-in / registration-complete, `identify` again on workspace switch and any Settings save, `pendo.clearSession()` (or hard reload) on sign-out. All of it flows through a single `PendoBridge` effect keyed on `[visitor?.id, workspace?.id]` plus a `syncPendoMetadata()` call from the Settings save handler.

2. **Flaky guide selectors** — Targeting hashed CSS class names or nth-child paths breaks guides on every UI library bump or DOM restructure. **Prevention:** every interactive element gets `data-pendo-id="<area>-<element>"` from a centralized `PENDO_IDS` constant registry. Applied at the page layer, not on `ui/` primitives. Lock Mantine version (no `^` ranges).

3. **SPA route changes not seen by Pendo** — Routes that share the AppShell layout (`/app/tasks` → `/app/reports`) may not produce a DOM mutation Pendo recognizes; all events bucket on the landing URL. **Prevention:** mount `PendoRouteBridge` inside the router context, fire `pendo.location.setUrl(window.location.href)` on every `useLocation` change; verify in Network tab that a new Pendo `data?...` request fires on each nav click.

4. **Multi-step registration as one URL** — A single `/register` URL with internal step state makes funnel building impossible — Pendo sees one page that converts or doesn't, and refresh/back wipes form state. **Prevention:** each step gets its own route; in-progress state persisted to **sessionStorage** (not localStorage — shouldn't survive tab close); anonymous Pendo visitor ID captured before step 1 so the funnel has continuity through to `identify`.

5. **localStorage schema with no version field** — First breaking schema change wipes every existing demo user; "works on my machine" failures. **Prevention:** every key follows `halo:v<schemaVersion>:<domain>[:scopeId]`; `halo:v1:meta` holds `{ schemaVersion, seededAt, appVersion }`; migration runner on boot; Zod-validated reads with try/catch fallback to defaults; visible "Reset demo data" button in Settings.

Honorable mentions: scope creep (mitigated by gating every phase on Pendo-demoable surface), canvas charts (solved by Recharts pick), plaintext passwords (SHA-256 hash via `crypto.subtle.digest` plus a "demo only" banner), Pendo API key in source (use `import.meta.env.VITE_PENDO_API_KEY` and gitignore `.env`).

## Implications for Roadmap

The user has chosen **Coarse granularity** (~4–6 phases). Research converges on this exact phase structure: build cross-cutting foundations *before* any page, build the canonical multi-step funnel demo *before* the authenticated shell (so first Pendo identify is real and verified), then layer pages by demo-priority.

### Phase 1: Foundation & Cross-Cutting Contracts

**Rationale:** Three contracts must exist before any page is built because retrofitting them is far more expensive than installing them upfront: (a) the `data-pendo-id` naming convention + centralized `PENDO_IDS` registry, (b) the namespaced/versioned localStorage envelope + migration runner, (c) the provider stack ordering with anonymous Pendo init at boot. Skipping this phase guarantees a painful retrofit later.

**Delivers:** Vite + React + TS + Mantine scaffold; routing skeleton (public vs `/app/*` split); `storage/` module (keys, codec, schema, migrations, meta bootstrap); `pendo/` module (snippet in `index.html`, `client.ts` wrapper, `PENDO_IDS` registry stub, `PendoBridge` calling anonymous `initialize` at boot, `PendoRouteBridge`); `auth/` + `workspace/` provider shells (empty state); `ui/` primitive wrappers that forward `data-pendo-id`; `.env` + `.env.example` for Pendo API key; visible "Demo data only" banner.

### Phase 2: Multi-Step Registration + Anonymous→Identified Funnel

**Rationale:** Registration is the canonical Pendo funnel demo and the first place a real `pendo.identify` fires with real visitor + account metadata. Building it before the authenticated shell lets us verify in the Pendo dashboard that the anonymous→identified handoff works end-to-end before building anything that depends on it.

**Delivers:** Four signup routes (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`) — each its own URL; React Hook Form + Zod per step; sessionStorage-backed wizard state; commit handler that writes visitor + account to localStorage, seeds fake data (gated by `meta.seededAt`), updates session, triggers `pendo.identify` via PendoBridge; SignIn page with fake email/password match (SHA-256 hashed); Sign-out path with `pendo.clearSession()` or hard reload.

### Phase 3: Authenticated Shell + Dashboard

**Rationale:** Once identity flows correctly, build the chrome that every other page lives in. The Dashboard ships in this phase because (a) it's where users land post-registration and need a non-empty home, (b) it exercises Recharts (SVG charting verification), (c) stat-card empty states and quick-action buttons are the highest-value guide anchors.

**Delivers:** AppShell (Mantine AppShell — SideNav + TopBar + Outlet); SideNav items with `PENDO_IDS.nav*` selectors; TopBar with user menu; (deferred to P2: workspace switcher); Dashboard with 4–6 stat cards, 2 SVG charts (Recharts via `@mantine/charts`), time-range selector, activity feed, empty state; route guards (`RequireAuth` redirects to `/signin`).

### Phase 4: Core Interactive Pages (Lists + Settings + Reports)

**Rationale:** These three pages produce the bulk of Halo's per-pillar event coverage. Lists is the highest-frequency-event surface (task CRUD, sort, filter, complete) and the primary Session Replay subject. Settings is where `pendo.updateOptions` / `pendo.identify` re-fires on metadata changes. Reports is where filter combinations + CSV export round out the Feature Adoption pillar. By end of Phase 4, all four Pendo pillars are exercised at v1 baseline.

**Delivers:** Lists page (List view only — Board/Calendar deferred to P2): create/edit/complete/delete/sort/filter with modal forms, stable per-row selectors, toast feedback, confirm modals; Settings page tabs (Profile / Workspace / Preferences with theme toggle) with `syncPendoMetadata()` on save; Reports page (date range + filter + TanStack Table + 1 SVG chart + CSV export via client-side blob).

### Phase 5: Remaining Pages + Pendo-Coverage Completion (Team + Help)

**Rationale:** Team and Help are lower-frequency but each has a unique Pendo demo role: Team surfaces account-scoped guides (role dropdown, invite modal — `Invite Sent` is a canonical adoption + virality event), and Help is the explicit Resource Center anchor. Bundling them lets the milestone be "all four pillars now have content on every page; v1 demo-ready."

**Delivers:** Team page (member list, invite modal, role dropdown — all fake, "invite sent" toast); Help page (searchable static article list, 1 detail page, floating "?" help bubble as Resource Center anchor placeholder); cross-page polish pass (empty states with CTAs on every page that has one, toast system uniformity, confirm-modal styling consistency); selector-coverage audit; "Looks Done But Isn't" checklist walked end-to-end.

### Phase 6 (optional — only if v1 lands with budget remaining): P2 Demo-Surface Uplift

**Rationale:** Strictly post-v1. Each item here pushes a specific pillar from "covered" to "demo-worthy."

**Delivers (menu, ranked by leverage):** Board view + drag-and-drop on Lists (marquee Replay demo); Workspace switcher with 2–3 seeded workspaces (multi-tenant Pendo demo); Command-bar (Cmd+K); Notifications bell + panel; Task detail slide-over with comments + @-mentions; Calendar view on Lists; Keyboard-shortcut cheatsheet.

### Research Flags

- **Phase 1 (Foundation):** Verify current Pendo agent API surface against `support.pendo.io` — specifically the snippet template, the SPA route-tracking API (`pendo.location.setUrl` vs `pendo.pageLoad` vs automatic), and the Session Replay mask attribute name. A 30-minute live doc check at phase start is sufficient.
- **Phase 2 (Registration + Pendo identify):** Verify `pendo.identify` vs `pendo.initialize` semantics for the anonymous→identified transition, and the supported sign-out reset API (`pendo.clearSession()` vs alternative).
- **Phase 6 (P2 — only if reached):** Drag-and-drop library choice (dnd-kit vs alternatives) against current React 18/19 compatibility.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Library selection (React, Mantine, Recharts, RHF+Zod, Zustand) is unambiguous for this exact use case. Version pins are MEDIUM — re-check via `npm view` at install time. |
| Features | HIGH | Project/task SaaS conventions (Asana/Linear/ClickUp/Notion patterns) are stable. Pendo pillar → feature mapping is HIGH for table stakes. |
| Architecture | HIGH | Provider stack, namespaced localStorage, centralized selector registry, and post-auth Pendo init are standard. MEDIUM only on specific Pendo agent JS API call signatures — verify in Phase 1. |
| Pitfalls | HIGH | Pitfalls 1–4 and 9–11 are well-established Pendo + SPA failure modes; 6–8 are standard web platform behaviors. Remediation strategies are correct regardless of version-specific API name shifts. |

**Overall confidence:** HIGH

### Gaps to Address

- **Pendo agent API call names** — handled by a 30-minute Phase 1 spot-check against `support.pendo.io`. All Pendo calls live in one file (`pendo/client.ts`), so a name change is a 5-line edit.
- **Stack version pins** — `npm view <pkg> version` at install time during Phase 1 scaffold; pin exact versions in `package.json`.
- **Pendo subscription / API key** — Phase 1 sets up `.env` + `.env.example`; user provides their own demo subscription key.
- **In-app onboarding checklist vs Pendo Resource Center checklist** — recommendation is to let Pendo own the checklist (skip in-app version entirely); defer to Phase 5 / P2 if demo feedback says otherwise.

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` (2026-05-13) — stack selection, Pendo integration patterns, localStorage repo pattern, version compatibility matrix, "what NOT to use" list
- `.planning/research/FEATURES.md` (2026-05-13) — Pendo-pillar feature mapping, table stakes/differentiators/anti-features, 4-step registration breakdown, MVP definition, feature prioritization matrix
- `.planning/research/ARCHITECTURE.md` (2026-05-13) — provider stack ordering, recommended project structure, five architectural patterns, data flow diagrams, concrete localStorage schemas, anti-patterns
- `.planning/research/PITFALLS.md` (2026-05-13) — 15 critical pitfalls with phase-mapping, technical debt patterns, integration gotchas, "Looks Done But Isn't" checklist, recovery strategies
- `.planning/PROJECT.md` (2026-05-13) — authoritative on scope, constraints, out-of-scope items

### Secondary (MEDIUM confidence)

- Pendo support documentation (`support.pendo.io`) — install script, `pendo.initialize` / `pendo.identify` / `pendo.updateOptions` / `pendo.location` APIs, guide targeting best practices, Session Replay masking — spot-check at Phase 1 start
- React Router v6 data router patterns — well-established React patterns
- Project/task management SaaS conventions (Asana, Linear, ClickUp, Notion, Jira)

### Tertiary (LOW confidence — needs validation at install time)

- Specific npm package version numbers in STACK.md
- Specific Pendo agent JS API signatures (`pendo.clearSession`, `pendo.location.setUrl` vs `pendo.pageLoad`, current Session Replay mask attribute name)

---
*Research completed: 2026-05-13*
*Ready for roadmap: yes*
