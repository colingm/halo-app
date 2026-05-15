# Halo

## What This Is

Halo is a fake multi-tenant SaaS project/task management app, built to demonstrate and experiment with the full Pendo product suite. It looks and behaves like a real SaaS — registration flow, side-nav layout, charts, lists, settings, reports, team management, and help — but every piece of data is fabricated and persisted only in browser local storage.

The audience is the builder (and other Pendo folks) who need a realistic, instrumentable app to exercise Pendo capabilities end-to-end without standing up a real product.

## Core Value

A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- [x] Multi-step registration flow capturing basic identity, personal details, company info, and onboarding preferences (becomes Pendo visitor + account metadata) — *Validated in Phase 2: registration-sign-in*
- [x] Fake email/password sign-in backed by local storage (no real auth, no backend) — *Validated in Phase 2: registration-sign-in*
- [x] Multi-tenant model: every visitor belongs to a workspace/company; Pendo init receives both visitor and account IDs — *Validated in Phase 2: registration-sign-in (visitor + workspace records wired; Pendo init wiring carries into Phase 3 shell)*
- [x] Authenticated SaaS shell with persistent side navigation across all pages — *Validated in Phase 3: authenticated-shell-dashboard (Mantine AppShell, 6 NavLinks, top bar with user menu + sign-out)*
- [x] Dashboard with charts/graphs over fabricated project/task data — *Validated in Phase 3: authenticated-shell-dashboard (Recharts SVG AreaChart + PieChart, 5 KPIs, 8-item activity timeline, empty state)*

### Active

<!-- Current scope. Building toward these. -->
- [ ] Lists page where users can create, edit, reorder, and delete items (interactive surface)
- [ ] Settings / profile page (edit identity, company info, preferences)
- [ ] Reports / analytics page (tabular data, filters, export buttons)
- [ ] Team / users page (invite teammates, role management — all fake)
- [ ] Help / docs page (searchable articles — good Resource Center anchor)
- [ ] SaaS-grade visual polish (clean UI library, branded, convincing demos)
- [ ] Stable DOM identifiers / data attributes on key interactive elements so Pendo guides can reliably target them
- [ ] Pendo Snippet wired in, initialized with visitor + account from the registration data

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real backend / database — fake app, local storage only is the whole point
- Real authentication or password security — fake app; storing email+password in local storage is intentional
- Real third-party integrations (OAuth, SSO, payments) — would distract from the Pendo demo surface
- Multi-device sync — local storage is per-browser; demos run in one browser session
- Mobile-native apps — SPA only
- Production deployment / CI / CD — local dev server is sufficient for demos
- Accessibility / i18n compliance — demo app, not a shipping product
- Pendo Snippet account/key management — leave the key as a configurable constant, don't build a settings UI for it

## Context

- **Audience:** Built by a Pendo employee (`colin.maxfield@pendo.io`) for internal Pendo experimentation and demos. Likely viewers are other Pendo employees, customers, and pre-sales engineers.
- **Pendo surface coverage:** All four major Pendo capability areas should be exercisable in this app: (1) event tracking & funnels, (2) guides & in-app messaging, (3) feature adoption analytics, (4) Session Replay & Listen.
- **Why a fake SaaS:** Real customer apps can't always be safely re-instrumented or shared in demos. A fake but convincing SaaS lets the user demonstrate Pendo against a familiar-looking surface.
- **Why project/task management:** Familiar vertical to most viewers, gives natural shape to lists (tasks), charts (velocity / status), reports (project performance), and team (collaborators).
- **Pendo-conscious construction:** Pages, forms, and interactions should be built with Pendo instrumentation in mind from day one — stable selectors, meaningful event names, multi-step flows that make good funnels, and varied interaction patterns that exercise replay.
- **Framework choice:** Open to React or Svelte — whichever has the strongest SaaS-UI + charting ecosystem in 2026. Will be settled in research/roadmap.

## Constraints

- **Tech stack**: Frontend-only SPA — no backend, no API server, no database. All persistence is `localStorage` (or `sessionStorage` where appropriate).
- **Tech stack**: Framework is React or Svelte, decided based on ecosystem fit for SaaS UI + charting.
- **Data**: All data is fabricated. Registration data is captured into local storage; charts/lists are seeded with fake data and mutated locally.
- **Pendo readiness**: Markup must include stable identifiers / data attributes on key UI so Pendo guides can target them reliably. Pendo Snippet must be initialized with visitor + account IDs from the registration flow.
- **Polish**: App must look like a real SaaS — clean component library, consistent layout, branded as "Halo." Plain/unstyled is not acceptable.
- **Scope discipline**: This is a demo surface, not a product. Resist adding features that don't serve a clear Pendo demo purpose.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build a fake SaaS instead of instrumenting an existing app | Avoids contamination of real customer/internal apps; lets Pendo features be exercised in a controlled surface | — Pending |
| Project/task management as the fake vertical | Familiar to most viewers; naturally yields lists, charts, reports, teams | — Pending |
| Multi-tenant (workspace) model | Lets Pendo init demonstrate both visitor and account IDs, which mirrors real customer setups | — Pending |
| Persist everything in local storage; no backend | Keeps the app fully client-side and trivially deployable; sufficient for a demo | — Pending |
| Brand the app as "Halo" | Matches the directory name; generic-enough fake SaaS brand | — Pending |
| SaaS-grade visual polish via a real UI library | Convincing demos require a real-looking surface | — Pending |
| Defer framework choice (React vs Svelte) to research | Decision driven by SaaS-UI + charting ecosystem fit in 2026 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 after Phase 3 (authenticated-shell-dashboard) completion*
