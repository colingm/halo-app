# Roadmap: Halo

## Overview

Halo is built in six phases. Phases 1–5 build the app shell, auth flows, and feature surface — all of them **Pendo-ready** (markup, selector registry, SVG-only charting convention, masked-input primitive), but with no live Pendo runtime. Phase 6 then wires the Pendo agent into the prepared surface: install the snippet, initialize anonymously, fire identify on registration/sign-in, clear on sign-out, sync metadata on workspace/profile changes, and emit setUrl on route changes. This sequencing matches "build the app first, then install Pendo," and keeps Phases 1–5 free of any Pendo runtime dependency.

- Phase 1 lands the versioned localStorage envelope, the provider stack, the `data-pendo-id` selector registry + UI primitive wrappers, the masked-input primitive, and the public/`/app` route split — all the markup/storage contracts a future Pendo install will plug into.
- Phase 2 builds the multi-step registration funnel and sign-in/sign-out flows.
- Phase 3 ships the authenticated AppShell and Dashboard, giving every subsequent page a chrome to live in.
- Phase 4 delivers the three core interactive pages (Lists, Settings, Reports).
- Phase 5 closes coverage with Team and Help (Resource Center anchor), cross-page polish, idempotent seeding, and a final "Looks Done But Isn't" audit.
- Phase 6 wires the Pendo agent end-to-end on top of the prepared surface.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Cross-Cutting Contracts** - Scaffold + provider stack + versioned localStorage + `PENDO_IDS` selector registry + UI primitive wrappers + masked-input primitive + public/`/app` route split (Pendo-ready markup, no Pendo runtime)
- [x] **Phase 2: Registration & Sign-In** - Four-URL signup wizard + sign-in/sign-out + RequireAuth/RequireAnon guards (completed 2026-05-14)
- [ ] **Phase 3: Authenticated Shell & Dashboard** - AppShell (side nav + top bar + user menu) + post-sign-in Dashboard with stat cards, SVG charts, time range, and activity feed
- [ ] **Phase 4: Core Pages (Lists, Settings, Reports)** - Task CRUD, settings tabs, reports with CSV export
- [ ] **Phase 5: Team, Help & Polish** - Team invite/role flows, searchable Help with Resource Center anchor, cross-page polish, idempotent seeding, demo-ready audit
- [ ] **Phase 6: Pendo Install & Wiring** - Install Pendo snippet + initialize anonymously at boot + identify on registration/sign-in + clear on sign-out + sync metadata on workspace/profile changes + setUrl on route changes

## Phase Details

### Phase 1: Foundation & Cross-Cutting Contracts
**Goal**: A runnable Halo skeleton has every cross-cutting storage, routing, and Pendo-markup contract installed *before* any page is built — retrofitting these later is far more expensive than installing them upfront. The Pendo *runtime* (snippet, initialize, setUrl) is intentionally deferred to Phase 6; Phase 1 only installs the *markup affordances* Pendo will plug into.
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, PEN-07, PEN-08, PEN-09
**Success Criteria** (what must be TRUE):
  1. `npm run dev` boots a Halo-branded Mantine-themed app at a History-API URL with no console errors, a visible public layout, and a "Demo data only — never enter real credentials" banner
  2. The provider stack mounts in the order `Storage → Auth → Workspace → PendoBridge → Router` (PendoBridge is a no-op pass-through stub in this phase — the slot is reserved for Phase 6)
  3. The `PENDO_IDS` TypeScript registry exists and is the only source of `data-pendo-id` values; the UI primitive wrappers (`Button`, `Anchor`, `TextInput`, `PasswordInput`, etc.) forward `data-pendo-id` to the DOM without baking values in
  4. The `PasswordInput` primitive applies the `.pendo-sr-ignore` class (Session Replay masking affordance — inert without Pendo)
  5. The `halo:v1:meta` key is created on first boot with `{ schemaVersion, seededAt, appVersion }`, every storage read is Zod-validated with a safe fallback, and the boot-time migration runner can register migrations for future schema bumps
**Plans**: 6 plans
Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Vite + React 19 + TypeScript scaffold (FND-01)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Mantine 9 + Halo theme + ColorSchemeScript (FND-02)
- [x] 01-03-PLAN.md — Versioned localStorage envelope + Zod safe-read + migration runner + meta key (FND-04, FND-05)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-04-PLAN.md — Provider stack (Storage → Auth → Workspace → PendoBridge-stub → Router slot) (FND-07)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-05-PLAN.md — React Router 7 + public/`/app` route split + DemoBanner (FND-03, FND-06)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 01-06-PLAN.md — PENDO_IDS registry + UI primitive wrappers + masked PasswordInput + conventions doc + sandbox smoke-render (PEN-07, PEN-08, PEN-09)

### Phase 2: Registration & Sign-In
**Goal**: A four-step registration wizard (each step at its own URL), plus sign-in/sign-out, plus route guards — all functionally complete without any live Pendo wiring. Phase 6 will retrofit identify/clearSession calls onto the same flows.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10, AUTH-11, AUTH-12
**Success Criteria** (what must be TRUE):
  1. A new user can complete a four-step signup at `/signup`, `/signup/details`, `/signup/company`, `/signup/preferences` — each step lives at its own URL, browser back/forward/refresh work, and invalid input blocks advance with inline RHF + Zod errors
  2. On completing step 4, a visitor + workspace record is written to localStorage (with the password SHA-256 hashed via `crypto.subtle.digest`), the user is signed in, and redirected into the authenticated area
  3. A returning user can sign in at `/signin` with their email + password and the authenticated session is restored on browser refresh from localStorage
  4. Sign-out from anywhere clears the in-memory session and returns the user to the public landing; a fresh sign-in never inherits stale state from the prior session
  5. The `RequireAuth` guard redirects unauthenticated users from `/app/*` to `/signin`, and the `RequireAnon` guard redirects authenticated users away from `/signup*` / `/signin` to `/app`
**Plans**: TBD
**UI hint**: yes

### Phase 3: Authenticated Shell & Dashboard
**Goal**: Every authenticated route lives in a real SaaS chrome (Mantine AppShell with persistent side nav + top bar + user menu), and the post-sign-in landing is a believable Dashboard that proves SVG charting and empty-state guide anchors work.
**Depends on**: Phase 2
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. After sign-in the user lands on a Dashboard route inside a Mantine AppShell with a persistent left side nav (Dashboard, Lists, Reports, Team, Settings, Help — active route visually indicated) and a top bar showing the workspace name and a user menu (Profile / Settings / Sign Out)
  2. Refreshing on any `/app/*` route deep-links back to that exact route (no fallback to root)
  3. The Dashboard shows 4–6 KPI stat cards computed from seeded task data, a recent-activity feed, and a friendly empty state when no tasks exist
  4. The Dashboard renders at least two Recharts SVG charts (one bar/area + one pie/donut) — every chart is SVG, no canvas anywhere — and a time-range selector (7 / 30 / 90 days) re-filters all stats and charts
  5. Every side-nav item, top-bar control, and user-menu item carries a stable `data-pendo-id` from the `PENDO_IDS` registry
**Plans**: TBD
**UI hint**: yes

### Phase 4: Core Pages (Lists, Settings, Reports)
**Goal**: The three highest-leverage interactive pages ship — Lists (task CRUD), Settings (profile/workspace/preferences), and Reports (filtered task data with SVG chart + CSV export). Settings save handlers persist to localStorage; Pendo metadata sync (PEN-04) is added in Phase 6.
**Depends on**: Phase 3
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04, LIST-05, LIST-06, LIST-07, LIST-08, LIST-09, SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, REP-01, REP-02, REP-03, REP-04
**Success Criteria** (what must be TRUE):
  1. At `/app/lists` the user can create, edit, mark complete/incomplete, and delete tasks via modal forms and inline controls; sort by any visible column; filter by status, priority, and assignee; see a friendly empty state when no tasks exist; and every mutation persists to localStorage and survives refresh
  2. At `/app/settings` the user can edit Profile (name, username, job title, role, location), Workspace (company name, size, industry, plan tier), and Preferences (including a light/dark theme toggle) across three tabs; every save persists to localStorage
  3. A "Reset demo data" button in Settings (with a destructive-action confirmation modal) clears every `halo:v1:*` key and reloads the app to the public landing
  4. At `/app/reports` the user can filter task data by date range and at least one other dimension (assignee or status), view the filtered data in a TanStack Table with at least 5 columns and at least one SVG chart, and click "Export CSV" to download the filtered table as a client-side CSV blob
  5. Every interactive element on Lists, Settings, and Reports carries a stable `data-pendo-id` from the `PENDO_IDS` registry
**Plans**: TBD
**UI hint**: yes

### Phase 5: Team, Help & Polish
**Goal**: Team and Help pages complete the v1 surface (account-scoped guides on Team, Pendo Resource Center anchor on Help), demo data seeds idempotently, and a final cross-page polish + "Looks Done But Isn't" audit confirms Halo is demo-ready.
**Depends on**: Phase 4
**Requirements**: TEAM-01, TEAM-02, TEAM-03, HELP-01, HELP-02, HELP-03, HELP-04, DATA-01, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. At `/app/team` the user sees a list of seeded team members for the current workspace (name, email, role, last-active); can open an "Invite teammate" modal, fill in email + role, click Invite, and see the modal close with an "Invite sent" toast (no real email); and can change a teammate's role inline via a dropdown that persists to localStorage
  2. At `/app/help` the user can search at least six seeded articles by title/keyword (grouped by topic), click any article to open a detail view with body content, and click a persistent help anchor (a "?" floating button or top-bar help icon) suitable for the Pendo Resource Center to attach to
  3. On first sign-in for a brand-new workspace, faker-seeded tasks, team members, activity, and help articles populate the app; subsequent reloads do not clobber user mutations (idempotency gated by `meta.seededAt`)
  4. Every page that can be empty shows a polished empty state with a primary CTA (good guide anchors), every meaningful action (create/save/delete/invite) shows a toast, and every destructive action (delete task, reset demo data, remove member) shows a confirmation modal
  5. A manual "could this pass for a real B2B SaaS in a screenshot?" audit passes — consistent spacing/typography/color across all pages — and the Pendo-readiness checklist (routes deep-link, Replay-mask class on password inputs, no canvas charts, every interactive element has a `data-pendo-id` from the registry) is walked end-to-end and signed off
**Plans**: TBD
**UI hint**: yes

### Phase 6: Pendo Install & Wiring
**Goal**: Install the Pendo agent into the prepared markup surface and wire the identity lifecycle end-to-end. The snippet loads in `<head>`, `pendo.initialize` fires anonymously at boot, `pendo.identify` fires on registration/sign-in, `clearSession` fires on sign-out, metadata syncs on workspace/profile changes, and `setUrl` fires on every SPA route change.
**Depends on**: Phase 5
**Requirements**: PEN-01, PEN-02, PEN-03, PEN-04, PEN-05, PEN-06
**Success Criteria** (what must be TRUE):
  1. The Pendo Snippet is loaded synchronously in `<head>` of `index.html` before the React bundle; the API key is read from `import.meta.env.VITE_PENDO_API_KEY` (with `.env.example` checked into git, `.env` gitignored); the app boots cleanly when the key is absent (warn in console, skip init — never crash)
  2. On first load, `pendo.initialize` is called exactly once with an anonymous visitor ID; the anonymous ID is persisted to `halo:v1:pendo:anonId` and reused on subsequent reloads so `window.pendo.getVisitorId()` returns a stable anonymous ID across reloads (anonymous-to-known continuity for the registration funnel)
  3. On successful registration (end of signup wizard) and on sign-in, `pendo.identify` fires exactly once with visitor metadata (id, email, name, role, etc.) and account metadata (workspace id, company name, size, industry, plan tier); on workspace switch or profile/workspace settings save, `pendo.identify` (or `updateOptions`) re-fires with the updated metadata
  4. On sign-out, `pendo.clearSession()` (or a hard reload) resets Pendo identity so a fresh sign-in never inherits stale identity from the prior session
  5. Every SPA route change emits `pendo.location.setUrl(window.location.href)` via a `PendoRouteBridge` component mounted inside both `PublicLayout` and `AppLayout`; verifiable in the Network tab
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Cross-Cutting Contracts | 3/6 | In Progress|  |
| 2. Registration & Sign-In | 10/10 | Complete    | 2026-05-14 |
| 3. Authenticated Shell & Dashboard | 0/TBD | Not started | - |
| 4. Core Pages (Lists, Settings, Reports) | 0/TBD | Not started | - |
| 5. Team, Help & Polish | 0/TBD | Not started | - |
| 6. Pendo Install & Wiring | 0/TBD | Not started | - |
