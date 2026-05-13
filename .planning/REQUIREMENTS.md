# Requirements: Halo

**Defined:** 2026-05-13
**Core Value:** A convincing, multi-page SaaS surface that a Pendo customer or pre-sales engineer can install Pendo into and exercise track events & funnels, guides & in-app messaging, feature adoption analytics, and Session Replay & Listen — all without a backend.

## v1 Requirements

### Foundation (cross-cutting)

- [ ] **FND-01**: Vite + React 18 + TypeScript scaffold runs locally via `npm run dev`
- [ ] **FND-02**: Mantine 7 is wired in with a Halo-branded theme (color, font, AppShell baseline) so every page looks like a real SaaS
- [ ] **FND-03**: React Router 6 is configured with History API routing (no hash routes); a hard split exists between a public layout and an authenticated `/app/*` layout
- [ ] **FND-04**: All persistent data lives in `localStorage` behind a namespaced versioned key scheme (`halo:v1:<domain>[:scopeId]`); every read is Zod-validated and falls back safely on parse failure
- [ ] **FND-05**: A `halo:v1:meta` key stores `{ schemaVersion, seededAt, appVersion }` and a boot-time migration runner upgrades older schemas
- [ ] **FND-06**: A visible "Demo data only — never enter real credentials" banner appears on the public layout
- [ ] **FND-07**: Provider stack mounts in the order `Storage → Auth → Workspace → PendoBridge → Router`; sign-in / sign-out / workspace-change flow is the *only* trigger for Pendo identity changes

### Pendo Integration (cross-cutting)

- [ ] **PEN-01**: The Pendo Snippet is loaded synchronously in `<head>` of `index.html` before the React bundle; the API key is read from `import.meta.env.VITE_PENDO_API_KEY` (with a `.env.example` checked into git)
- [ ] **PEN-02**: `pendo.initialize` is called exactly once at app boot with an anonymous visitor ID, so the registration funnel is measurable end-to-end
- [ ] **PEN-03**: `pendo.identify` is called on successful registration and on sign-in, with visitor metadata (id, email, name, role, etc.) and account metadata (workspace id, company name, size, industry, plan tier)
- [ ] **PEN-04**: `pendo.identify` is re-called whenever workspace switches or profile/workspace settings change, so metadata stays in sync
- [ ] **PEN-05**: Sign-out resets Pendo identity (via `pendo.clearSession()` or a hard reload) and never leaves stale identity attached to the next session
- [ ] **PEN-06**: Every SPA route change emits `pendo.location.setUrl(window.location.href)` so Pendo sees same-shell navigations
- [ ] **PEN-07**: A centralized `PENDO_IDS` TypeScript registry is the *only* source of `data-pendo-id` values; every interactive element on every page carries one
- [ ] **PEN-08**: Every chart is rendered as SVG (Recharts) — no canvas-backed charts anywhere — so Pendo guides and Session Replay can target chart elements
- [ ] **PEN-09**: Sensitive fields (password inputs) carry a Session-Replay mask attribute so they never appear in replays

### Authentication & Registration

- [ ] **AUTH-01**: User can sign up via a multi-step wizard, each step at its own URL: `/signup` (identity), `/signup/details` (personal details), `/signup/company` (company info), `/signup/preferences` (onboarding preferences)
- [ ] **AUTH-02**: Step 1 captures basic identity: email, password, first name, last name, username
- [ ] **AUTH-03**: Step 2 captures personal details: job title, role, years of experience, location
- [ ] **AUTH-04**: Step 3 captures company info: company name, company size, industry, plan tier (free / pro / enterprise)
- [ ] **AUTH-05**: Step 4 captures onboarding preferences: primary use case, team size, top goals (multi-select)
- [ ] **AUTH-06**: Each step is validated with React Hook Form + Zod; invalid input blocks advance and shows inline errors
- [ ] **AUTH-07**: Wizard state persists to `sessionStorage` so browser refresh / back / forward mid-flow doesn't lose progress; clears on completion or sign-out
- [ ] **AUTH-08**: On wizard completion, a visitor + workspace record is written to `localStorage`, the password is hashed (SHA-256 via `crypto.subtle.digest`) before storage, and the user is signed in
- [ ] **AUTH-09**: User can sign in with email and password on a `/signin` page; password match is performed against the stored SHA-256 hash
- [ ] **AUTH-10**: Authenticated session persists across browser refresh (auth state hydrated from localStorage on boot)
- [ ] **AUTH-11**: User can sign out from the top-bar user menu; sign-out clears the in-memory session, resets Pendo, and returns the user to the public landing
- [ ] **AUTH-12**: A `RequireAuth` route guard redirects unauthenticated users from `/app/*` to `/signin`; a `RequireAnon` guard redirects authenticated users away from signup/signin to `/app`

### App Shell & Navigation

- [ ] **SHELL-01**: Authenticated routes render inside a Mantine AppShell with a persistent left side nav and a top bar
- [ ] **SHELL-02**: Side nav links to: Dashboard, Lists, Reports, Team, Settings, Help; active route is visually indicated
- [ ] **SHELL-03**: Top bar shows the current workspace name and a user-menu button (avatar + name); menu contains Profile, Settings, Sign Out
- [ ] **SHELL-04**: Deep-linking works — refreshing on any `/app/*` route lands on that route (no fallback to root)

### Dashboard

- [ ] **DASH-01**: The dashboard route `/app` (or `/app/dashboard`) is the post-sign-in landing page
- [ ] **DASH-02**: Dashboard shows 4–6 KPI stat cards computed from seeded task data (e.g., active tasks, completed this week, overdue, completion rate)
- [ ] **DASH-03**: Dashboard shows at least one bar/area chart (tasks completed over time) and one pie/donut chart (tasks by status or by assignee), both rendered with Recharts (SVG)
- [ ] **DASH-04**: Dashboard has a time-range selector (e.g., last 7 / 30 / 90 days) that re-filters all charts and stats
- [ ] **DASH-05**: Dashboard shows a recent-activity feed (most-recent task changes from seeded data)
- [ ] **DASH-06**: Dashboard renders a friendly empty state when there are no tasks (good guide-anchor surface)

### Lists (Tasks)

- [ ] **LIST-01**: User can view a list of tasks at `/app/lists` (or `/app/tasks`) in a List view
- [ ] **LIST-02**: User can create a new task via a modal form with at minimum: title, description, status, priority, due date, assignee
- [ ] **LIST-03**: User can edit an existing task via the same modal form
- [ ] **LIST-04**: User can mark a task complete / incomplete with a single click on the row
- [ ] **LIST-05**: User can delete a task with a confirmation modal
- [ ] **LIST-06**: User can sort the list by any visible column
- [ ] **LIST-07**: User can filter the list by status, priority, and assignee
- [ ] **LIST-08**: List has a friendly empty state when no tasks exist (good guide-anchor surface)
- [ ] **LIST-09**: All task mutations persist to localStorage and survive refresh

### Settings

- [ ] **SET-01**: Settings page at `/app/settings` has tabs for Profile, Workspace, and Preferences
- [ ] **SET-02**: Profile tab lets the user edit name, username, job title, role, location; saves persist to localStorage
- [ ] **SET-03**: Workspace tab lets the user edit company name, size, industry, plan tier; saves persist to localStorage
- [ ] **SET-04**: Preferences tab includes at least a theme toggle (light/dark via Mantine color scheme)
- [ ] **SET-05**: Any save action in Settings triggers `pendo.identify` (or equivalent metadata sync) so Pendo sees updated visitor/account fields
- [ ] **SET-06**: Settings includes a "Reset demo data" button that clears `halo:v1:*` keys (with confirmation) and reloads the app to the public landing

### Reports

- [ ] **REP-01**: Reports page at `/app/reports` lets the user filter task data by date range and at least one other dimension (e.g., assignee or status)
- [ ] **REP-02**: Reports page shows a TanStack Table over the filtered task data with at least 5 columns
- [ ] **REP-03**: Reports page shows at least one SVG chart computed from the filtered data
- [ ] **REP-04**: Reports page has an "Export CSV" button that downloads the current filtered table as a CSV (client-side blob)

### Team / Users

- [ ] **TEAM-01**: Team page at `/app/team` lists seeded team members for the current workspace with name, email, role, and last-active
- [ ] **TEAM-02**: User can open an "Invite teammate" modal, fill in email + role, and click Invite; the modal closes and a toast confirms "Invite sent" (no real email)
- [ ] **TEAM-03**: User can change a teammate's role via an inline role dropdown; the change persists to localStorage

### Help / Docs

- [ ] **HELP-01**: Help page at `/app/help` lists at least 6 seeded articles grouped by topic
- [ ] **HELP-02**: User can search articles by title/keyword via an input on the help page
- [ ] **HELP-03**: Clicking an article opens a detail view with body content
- [ ] **HELP-04**: The help page includes a stable anchor (e.g., a "?" floating button or a help icon in the top bar) suitable for the Pendo Resource Center to attach to

### Seed Data & Polish

- [ ] **DATA-01**: On first sign-in for a workspace, fake data is seeded via `@faker-js/faker` for tasks, team members, activity, and help articles; seeding is idempotent (gated by `meta.seededAt`) so user mutations are not clobbered on reload
- [ ] **UI-01**: Every page that can be empty has a polished empty state with a primary CTA (good guide-anchor surface)
- [ ] **UI-02**: Toast notifications confirm meaningful actions (create / save / delete / invite)
- [ ] **UI-03**: Destructive actions (delete task, reset demo data) show a confirmation modal
- [ ] **UI-04**: Visual polish pass: consistent spacing, typography, color usage; passes a manual "could this pass for a real B2B SaaS in a screenshot?" check

## v2 Requirements

Deferred to a future milestone — substantial demo-surface uplift after v1 lands.

### Lists views

- **LIST2-01**: Board (Kanban) view on Lists with drag-and-drop between status columns (marquee Session Replay demo)
- **LIST2-02**: Calendar view on Lists grouped by due date
- **LIST2-03**: Task detail slide-over with comments and @-mentions

### Multi-tenant demos

- **WS2-01**: Workspace switcher in the top bar with 2–3 seeded workspaces; switching triggers `pendo.identify` with the new account
- **WS2-02**: Multiple seeded user personas (admin / member / viewer) for role-based guide targeting

### Power-user surfaces

- **UX2-01**: Command-bar (Cmd+K) with quick-actions across pages
- **UX2-02**: Notifications bell + slide-out panel in the top bar
- **UX2-03**: Keyboard-shortcut cheatsheet on `?`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real backend / database / API server | Fake app, localStorage only — the whole point |
| Real authentication (bcrypt / JWT / OAuth / SSO / 2FA) | Demo app; SHA-256 hash + localStorage is intentional |
| Real email (verification, password reset, invites) | Demo app; toasts are sufficient |
| Real payments / billing | Plan tier is a captured field, not a transactable one |
| Real-time collaboration (WebSockets, CRDTs) | Out of scope for a single-browser demo |
| Multi-device sync | localStorage is per-browser; demos run in one browser session |
| Mobile-native apps | SPA only |
| Production deployment / CI / CD | Local dev server is sufficient |
| Accessibility (WCAG) compliance pass | Demo app, not a shipping product |
| Internationalization / RTL | Demo app, English only |
| Real file uploads | Fake avatars only (initials or seeded images) |
| Real search index | Help search is in-memory over seeded articles |
| Gantt charts / task dependencies / time tracking | Outside the Pendo-demo surface |
| Workflow automation / AI assistant / integration marketplace | Scope creep |
| Granular RBAC enforcement | Role labels are cosmetic; no actual permission gating |
| Audit log / API key management UI | Distract from the Pendo demo |
| In-app product tour / onboarding checklist | Let Pendo Resource Center own this surface |
| Pendo Snippet settings UI / Pendo API key management UI | Key is a build-time env var, not a runtime setting |
| Canvas-backed charts (Chart.js, Highcharts, etc.) | Pendo guides and Session Replay can't target canvas |
| Next.js / SSR | Conflicts with no-backend demo model |
| Hash-based routing | Pendo needs real URLs for funnel analytics |

## Traceability

Mapping of requirements to phases. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 → FND-07 | Phase 1 | Pending |
| PEN-01, PEN-02, PEN-06, PEN-07, PEN-08, PEN-09 | Phase 1 | Pending |
| AUTH-01 → AUTH-12 | Phase 2 | Pending |
| PEN-03 (registration identify) | Phase 2 | Pending |
| SHELL-01 → SHELL-04 | Phase 3 | Pending |
| DASH-01 → DASH-06 | Phase 3 | Pending |
| LIST-01 → LIST-09 | Phase 4 | Pending |
| SET-01 → SET-06 | Phase 4 | Pending |
| REP-01 → REP-04 | Phase 4 | Pending |
| PEN-04, PEN-05 (settings identify, sign-out reset) | Phase 4 | Pending |
| TEAM-01 → TEAM-03 | Phase 5 | Pending |
| HELP-01 → HELP-04 | Phase 5 | Pending |
| DATA-01, UI-01, UI-02, UI-03, UI-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0 ✓

*(Traceability will be re-validated by the roadmapper. Some PEN-* and cross-cutting items may shift across phases when the roadmapper writes ROADMAP.md.)*

---
*Requirements defined: 2026-05-13*
*Last updated: 2026-05-13 after initial definition*
