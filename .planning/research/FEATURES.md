# Feature Research

**Domain:** Fake multi-tenant SaaS (project/task management vertical) built as a Pendo instrumentation playground
**Researched:** 2026-05-13
**Confidence:** HIGH for canonical SaaS UX patterns and PROJECT.md-constrained anti-features; MEDIUM for specific Pendo-capability mappings (training-data-based, but Pendo's four pillars — events/funnels, guides, feature adoption, replay — are stable and well-documented)

## Framing: This Is a Pendo Surface, Not a Product

The "users" of Halo are Pendo instrumentation demos. Every feature decision is judged against:

1. **Events:** Does this generate distinct, named, instrumentable events (clicks, form submits, navigations)?
2. **Funnels:** Does this create a multi-step flow worth measuring as a funnel?
3. **Guides:** Does this surface offer stable, target-able anchors for guides, tooltips, lightboxes, and Resource Center walks?
4. **Feature Adoption:** Does this feature have a clear "used / not used" signal that can be tracked over time across visitors and accounts?
5. **Session Replay:** Does this generate varied, visually interesting interactions (forms, drag/drop, modals, hover states, error states) worth replaying?

A feature that doesn't exercise at least 2 of these pillars is, for this project, an anti-feature regardless of how "real" it would feel.

---

## Feature Landscape

### Table Stakes (Demo Doesn't Feel Real Without These)

Features users assume exist in a project/task SaaS. Missing them = app reads as a toy, Pendo demos lose credibility, and key Pendo capabilities have nothing to instrument.

#### Registration & Onboarding

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Multi-step registration (4 steps) | Multi-step funnels are *the* canonical Pendo funnel demo | MEDIUM | Funnels, Events, Replay | Each step = a named page event; drop-off between steps = funnel. See dedicated registration step breakdown below. |
| Email + password sign-in form | Anchors auth identity; entry point for return visitors | LOW | Events, Replay | Track `Sign In Submitted` / `Sign In Failed` / `Sign In Succeeded` |
| Sign-out action in side nav / user menu | Every SaaS has it; users hunt for it | LOW | Events | Generates `Session Ended` event |
| "Forgot password" link (fake, dead-end or modal) | Visual completeness; users don't trust auth forms without it | LOW | Guides | Good anchor for a "this is a demo" guide; no logic needed |
| First-login onboarding tour trigger | Justifies a Pendo guide; shows up immediately after registration funnel completes | LOW | Guides, Feature Adoption | The *first* place a Pendo guide naturally fires |
| Workspace creation as part of registration | Multi-tenancy requires it; Pendo init needs an `account` ID | LOW | Events, Account metadata | Captures company name → becomes Pendo account |
| Invite teammates step (optional/skippable) | Standard B2B SaaS onboarding pattern; great funnel branch | LOW | Funnels (skip vs complete) | Skip vs complete = adoption signal |

#### Authenticated SaaS Shell

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Persistent left side navigation | Standard SaaS chrome; every page lives inside it | LOW | Events (nav clicks), Guides (anchor) | Each nav item is a click event + a guide anchor target |
| Top bar with workspace switcher, search, notifications, user avatar | Pattern users recognize from Linear/Asana/Jira | MEDIUM | Events, Guides | Each control is a Pendo feature; notification bell is a great badge-style guide anchor |
| User avatar menu (profile, settings, sign out, help) | Standard B2B SaaS pattern | LOW | Events | Each menu item = named event |
| Global search (fake — filters seeded data) | Every modern SaaS has command-bar or search | MEDIUM | Events, Replay | Search submit event with query property |
| Notifications panel (fake activity feed) | Common in collaboration tools | MEDIUM | Events, Guides | Bell badge is a high-signal guide-target |
| Breadcrumbs or page title bar | Orientation in multi-page apps | LOW | Events (page view) | Helps with Pendo page tagging |
| Responsive collapse of side nav | Real SaaS supports it; replays look weird without | LOW | Replay | Generates varied viewport interactions |

#### Dashboard

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| 4-6 stat cards (total tasks, completed this week, overdue, team velocity) | Every PM tool opens with these | LOW | Events (card click), Feature Adoption (dashboard viewed) | Cards are clickable → drill-down events |
| Time-range selector (Today / 7d / 30d / Quarter) | Standard chart control; great for replays | LOW | Events | Each change = event with `range` property |
| At least one bar chart (tasks by status or by assignee) | Charts are visual proof of "real SaaS" | MEDIUM | Events (hover/click), Replay | Hover tooltips show well in replays |
| At least one line chart (velocity over time or completion trend) | Same | MEDIUM | Events, Replay | Same |
| At least one donut/pie chart (status breakdown) | Variety of chart types looks more real | MEDIUM | Events, Replay | Same |
| Recent activity feed | Common dashboard element; great content surface for guides | LOW | Guides | Anchor for "look what your team did today" guide |
| Quick-action buttons ("New task," "Invite teammate," "Create report") | Every dashboard has them; drives navigation | LOW | Events, Funnels | Each click = funnel entry into another flow |
| Empty state for new accounts | Onboarding moment; perfect spot for a guide | LOW | Guides, Feature Adoption | Trigger guide when state is empty |

#### Lists Page (Tasks / Projects)

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Create new item (modal or inline) | Core interaction of any list app | LOW | Events, Funnels, Feature Adoption | `Task Created` is the foundational adoption metric |
| Edit item (title, description, assignee, due date, status, priority) | Core | MEDIUM | Events, Replay | Multi-field form = great replay content |
| Delete item (with confirm modal) | Core | LOW | Events, Replay | Confirm modal = guide anchor |
| Mark complete (checkbox / toggle) | The signature interaction of task apps | LOW | Events, Feature Adoption | Highest-frequency event in the app |
| Sort by column (name, due date, status, assignee, priority) | Table stakes for any list view | MEDIUM | Events | Each sort = event with `sort_field` property |
| Filter by status / assignee / priority / tag | Standard | MEDIUM | Events, Funnels | Filter usage = adoption signal |
| Bulk select + bulk actions | Common in PM tools | MEDIUM | Events, Replay | Multi-select interactions look impressive in replays |
| Multiple view modes (List / Board / Calendar) | Modern PM tools (Asana, ClickUp, Linear) all have this | HIGH | Events, Feature Adoption | View toggling = clear adoption metric |
| Drag-and-drop reordering | Pattern users expect in board view | HIGH | Events, Replay | Drag interactions are *the* replay showcase |
| Task detail view (slide-over panel or dedicated route) | Standard | MEDIUM | Events, Guides | Side panel is a classic guide-anchor surface |

#### Settings / Profile

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Profile tab: name, email, avatar, role, timezone | Universal | LOW | Events | Each save = event |
| Workspace/company tab: name, industry, size | Multi-tenant SaaS standard | LOW | Events | Updates account metadata |
| Preferences tab: theme, notifications, default view, density | Standard | LOW | Events, Feature Adoption | Theme toggle is a fun adoption metric |
| Tabbed layout (Profile / Workspace / Preferences / Billing-fake / Security-fake) | Universal pattern | LOW | Events (tab switches), Guides | Each tab is a named page state |
| Save / Discard pattern with toast confirmation | Users expect feedback on save | LOW | Replay | Toast is great replay content |
| Danger zone section (delete account — fake, just opens modal) | Common in real SaaS | LOW | Guides | Modal is a guide anchor target |

#### Reports / Analytics

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Date range picker | Universal in reporting UI | LOW | Events | Range change = event |
| Filters (project, assignee, status, tag) | Standard | MEDIUM | Events | Filter combinations = good event property variety |
| Data table with sortable columns | Standard | MEDIUM | Events, Replay | |
| At least one chart (could be richer than dashboard charts) | Reports without charts feel thin | MEDIUM | Events, Replay | |
| Export CSV button (fake — generates client-side CSV or just toasts) | "Export" is a high-value Pendo event for B2B | LOW | Events, Feature Adoption | `Report Exported` is a classic adoption KPI |
| Save / favorite report (fake list of saved views) | Common in mature analytics UIs | MEDIUM | Events, Feature Adoption | Save = adoption signal |
| Switch between report types (overview / by team / by project) | Multiple report dimensions = more page states | MEDIUM | Events, Guides | Each report type = named state |

#### Team / Users Page

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Member list with avatar, name, email, role, status | Universal | LOW | Events | |
| Invite member modal (email + role) | Universal in B2B SaaS | LOW | Events, Funnels | `Invite Sent` = key adoption + virality event |
| Role management (Owner / Admin / Member / Viewer dropdown) | Common in B2B SaaS | LOW | Events | Each change = event |
| Remove member (with confirm modal) | Universal | LOW | Events, Replay | |
| Pending invites section | Common pattern | LOW | Guides | Anchor for "resend invite" guide |
| Search/filter members | Standard for lists > 10 | LOW | Events | |
| Per-member detail view or popover | Common pattern | LOW | Guides | |

#### Help / Docs

| Feature | Why Expected | Complexity | Pendo Capability | Notes |
|---------|--------------|------------|------------------|-------|
| Searchable article list (10-20 fake articles) | Help pages without search look broken | MEDIUM | Events, Guides (Resource Center) | Each search = event; this page is the natural home for Pendo's Resource Center |
| Categorized article browse (Getting Started, Tasks, Reports, etc.) | Standard help-center pattern | LOW | Events | Category click = event |
| Article detail page with fake content | So clicks have a destination | LOW | Events (article viewed) | Article-viewed event = content adoption metric |
| "Contact support" button (fake — opens modal or mailto) | Universal | LOW | Events, Guides | Anchor for a "use our chatbot instead" guide |
| Visible "Resource Center" trigger (e.g. floating help bubble) | This is literally a Pendo product surface | LOW | Guides (Resource Center) | The defining Pendo anchor for this page |

---

### Differentiators (Excellent Pendo Demo Material)

Features beyond table stakes that *substantially* increase Pendo demo surface area. These are where Halo earns its keep as a demo app.

| Feature | Value Proposition | Complexity | Pendo Capability | Notes |
|---------|-------------------|------------|------------------|-------|
| **Multiple Lists view modes (List / Board / Calendar / Timeline)** | Drag-and-drop on Board + view-switching = the *single best* feature-adoption + replay combo in the app | HIGH | Adoption (view used), Events (view changed), Replay (drag) | This is the marquee Pendo demo on the Lists page |
| **Workspace switcher in top bar (2-3 seeded workspaces)** | Demonstrates multi-tenant Pendo init: account ID actually changes mid-session | MEDIUM | Account metadata, Events | Hard to demo Pendo's account-level filters without this |
| **In-app notification bell with unread badge** | Badge counts are textbook Pendo guide-anchor surfaces; opening panel = page-event | MEDIUM | Events, Guides | |
| **Command-bar (Cmd+K) global search/action launcher** | Modern SaaS hallmark (Linear, Notion, Superhuman); generates rapid varied events | HIGH | Events, Replay | Excellent replay content; every command = named event |
| **Empty states with illustrations + CTAs across all pages** | Empty states are *the* highest-value guide-attachment spot; every new account hits them | LOW | Guides, Feature Adoption | Trigger guides conditionally on empty state |
| **Onboarding checklist widget (5-7 fake steps, persists across sessions)** | Mirrors Pendo Checklists product literally; one-to-one mapping to a Pendo Resource Center checklist | MEDIUM | Guides (Checklists), Adoption | Steps map to first-time user actions; great parallel demo |
| **"What's new" / changelog modal on login** | Native surface for Pendo announcement guides | LOW | Guides (lightbox/modal) | Trigger via Pendo, not built-in |
| **Toggleable "new feature" UI labels (NEW badge on nav items)** | Mimics common SaaS pattern; great anchor for guided feature-tour | LOW | Guides | |
| **Theme toggle (light/dark)** | Concrete, binary adoption metric; visually distinct in replays | LOW | Adoption, Replay | |
| **Density toggle (comfortable/compact lists)** | Same as theme — clean adoption signal | LOW | Adoption | |
| **Toast/snackbar feedback system** | Real SaaS feedback; replay looks more "alive" | LOW | Replay | |
| **Slide-over / drawer panels (task detail, settings sub-pages)** | Modern SaaS pattern; distinct DOM state for Pendo to detect | MEDIUM | Guides, Events | Side panels are excellent guide anchors |
| **Inline error states on forms (validation messages)** | Forms with no errors don't replay well; errors are useful Pendo signals | LOW | Events (error tracked), Replay | `Form Validation Failed` = useful signal |
| **Confirmation modals with destructive-action styling** | Pattern users expect; modals are top-tier guide anchors | LOW | Guides, Replay | |
| **Keyboard shortcuts with discoverable cheatsheet (? key)** | Power-user feature; cheatsheet itself is a great guide anchor | MEDIUM | Guides, Adoption (shortcut used) | |
| **Persistent filter / view state (URL or localStorage)** | Real SaaS does this; means a Pendo segment can target users in specific views | MEDIUM | Adoption | |
| **"Last updated" / "Created by" metadata on tasks** | Cheap to add, makes app feel real, supports good replays | LOW | Replay | |
| **Tag/label system on tasks (colored chips)** | Common PM feature; colored UI replays well | MEDIUM | Events, Replay | |
| **Comments thread on task detail (fake, single-user)** | Collaboration feel; thread of inputs = good replay | MEDIUM | Events, Replay | |
| **@-mention picker in comments** | Pattern users expect in modern PM tools; picker is a guide anchor | MEDIUM | Events, Guides | |
| **CSV export action across Reports + Lists** | High-signal B2B event; trivially fake with client-side blob | LOW | Adoption, Events | |
| **Help-center article "Was this helpful?" widget** | Mirrors Pendo's NPS/feedback widget — a Pendo product itself | LOW | Events, Guides (poll) | |

---

### Anti-Features (Do NOT Build — Wastes Time, Doesn't Serve Pendo Demo)

Features that sound natural for a project/task SaaS but actively hurt the project's goals.

| Feature | Why It Sounds Good | Why It's Problematic | Alternative |
|---------|---------------------|----------------------|-------------|
| Real authentication (bcrypt, JWT, refresh tokens) | "Auth is fundamental" | PROJECT.md explicitly out-of-scope; storing plaintext email+password in localStorage is *intentional*; real auth = days of work for zero Pendo demo value | Fake check against localStorage records; trust the UI flow |
| OAuth / SSO / social login | "Real SaaS has it" | Requires real provider credentials, real redirects, real secrets; out-of-scope | Optional: a *fake* "Continue with Google" button that goes nowhere (visual completeness only) |
| Payment / billing flow | "B2B SaaS has billing" | Stripe integration = real money path; out-of-scope; doesn't add unique Pendo surface beyond what registration already provides | A fake "Billing" tab in Settings showing a static seeded plan |
| Real email sending (invites, password reset) | "Invites need email" | Requires email service; out-of-scope; doesn't add Pendo surface | Invite "succeeds" with a toast; show pending invite in UI |
| Real-time collaboration (live cursors, presence) | "Modern PM tools have it" | WebSockets / CRDTs = enormous complexity; needs backend; no Pendo capability genuinely requires it | Skip entirely; or fake presence dots that never move |
| Mobile-native apps | "Coverage" | Out-of-scope in PROJECT.md; SPA-only; doubles surface for no Pendo value | Responsive web; don't ship native |
| Multi-device sync | "Real SaaS does this" | Requires backend; out-of-scope; localStorage is per-browser by design | Document the limitation; demos run in one browser |
| Internationalization / RTL | "Production quality" | Out-of-scope; doesn't exercise any Pendo capability uniquely | English-only |
| Full WCAG accessibility compliance | "Inclusion" | Out-of-scope for a demo; can still write *reasonable* markup but don't chase compliance | Use the chosen component library's defaults; don't audit |
| Real file uploads / attachments on tasks | "Tasks have files" | Needs storage; fake uploads to localStorage will choke on size | Skip; or fake "Attach file" button that toasts "demo only" |
| Real search index (Algolia / Elastic / Lunr) | "Search must be fast" | Overkill for seeded data; trivial filter is enough | Client-side string-includes filter; fake delay if you want |
| Project Gantt charts / dependencies | "Enterprise PM has it" | Custom rendering complexity (date math, dependency lines); minimal incremental Pendo surface over Board view | Stop at Board + Calendar; skip Gantt |
| Time tracking / timers | "PM tools have timers" | Setup interval, persistence, edge cases; adds little unique Pendo surface beyond a "Start timer" event | Skip; or a single fake "Start timer" button on task detail with a toast |
| Workflow automation / rules engine | "Modern PM has it" | Implementing a rule UI is a project unto itself | Skip; mention as "Roadmap" in fake settings |
| AI assistant / chat | "2026 SaaS has AI" | Real AI = API costs + key management; fake AI = uncanny | Skip; or one static "Suggested next task" widget |
| Integration marketplace | "Real SaaS integrates" | Many fake icons that go nowhere = visible disappointment when demo viewer clicks them | One "Integrations" settings tab listing a few logos with "Coming soon" |
| Granular permissions / ACL system | "Enterprise needs RBAC" | Real RBAC implementation is large; not visible in screenshots; doesn't exercise unique Pendo capability | A role dropdown that changes a visible label only — the *display* is what matters |
| Audit log page | "Compliance" | Static list of fake events isn't interactive; consumes time | Activity feed on Dashboard is sufficient |
| Custom domain / branded subdomain | "Multi-tenant SaaS does this" | Routing complexity; doesn't change Pendo surface | Use a single domain; workspace switching is enough |
| API keys / developer page | "Real SaaS exposes APIs" | No real API exists; building a fake API key UI is busywork | Skip; or one static fake API key in Settings (read-only) |
| Login throttling / captcha | "Security" | Out-of-scope (no real auth); friction = bad demo | Skip |
| Pendo Snippet settings UI | "Configurable Pendo" | PROJECT.md explicit: leave the key as a constant | Hardcode the key as a configurable constant in source |

---

## Registration Flow — Detailed Step Breakdown

This is the **single most important Pendo demo surface** in the app (the canonical multi-step funnel). Per PROJECT.md, the flow has 4 steps. Each step submission must fire a named Pendo event so the whole flow forms a funnel.

### Step 1: Identity (account creation)

**Purpose:** Establish credentials and visitor ID.

**Fields:**
- Email (required, basic format validation)
- Password (required, basic length validation; show/hide toggle)
- Confirm password (required, must match)
- Terms-of-service checkbox (required, links to a fake `/terms` route or modal)

**UI elements:** Inline error states per field; "Continue" primary button (disabled until valid); "Already have an account? Sign in" secondary link.

**Pendo events:** `Registration Step 1 Viewed`, `Registration Step 1 Submitted`, `Registration Step 1 Validation Failed` (with `field` property).

### Step 2: Personal Details

**Purpose:** Populate Pendo visitor metadata.

**Fields:**
- First name (required)
- Last name (required)
- Job title (optional, free text or select)
- Role/department (select: Engineering, Product, Design, Marketing, Sales, Operations, Other)
- Avatar (optional — file picker that just shows initials fallback; or skip with a "skip for now" link)

**UI elements:** "Back" + "Continue" buttons; progress indicator showing 2/4.

**Pendo events:** `Registration Step 2 Viewed`, `Registration Step 2 Submitted` (with `role` property as a useful segmentation dimension).

### Step 3: Company / Workspace

**Purpose:** Establish multi-tenant account; populate Pendo account metadata.

**Fields:**
- Company name (required) — becomes workspace name
- Company size (select: 1-10, 11-50, 51-200, 201-1000, 1000+)
- Industry (select: Software, Marketing, Education, Healthcare, Financial Services, Other)
- Workspace URL slug (auto-generated from company name, editable)

**UI elements:** "Back" + "Continue" buttons; progress 3/4.

**Pendo events:** `Registration Step 3 Viewed`, `Registration Step 3 Submitted` (with `company_size` and `industry` properties — these become account-level Pendo metadata, perfect for filter/segment demos).

### Step 4: Onboarding Preferences

**Purpose:** Light personalization; finishes the funnel; triggers first authenticated page view.

**Fields:**
- "What will you use Halo for?" (multi-select: Personal tasks, Team projects, Client work, Roadmap planning, Bug tracking, Other)
- "How did you hear about us?" (single select: Search, Friend, Twitter/X, LinkedIn, Other) — populates a useful attribution dimension
- "Invite teammates" (optional sub-form: 0-3 email inputs; skippable with explicit "Skip for now" button)
- Final "Create workspace" CTA

**UI elements:** "Back" + "Create workspace"; progress 4/4; small note: "You can change these later in Settings."

**Pendo events:** `Registration Step 4 Viewed`, `Registration Step 4 Submitted`, `Registration Completed` (the funnel-completion event), and conditionally `Invite Sent` × N for each teammate emailed, or `Invites Skipped` if the user explicitly skips.

### Post-registration

Land the user on Dashboard with the empty state visible — primed for a Pendo onboarding guide / Resource Center checklist to fire.

**Pendo events:** `Dashboard Viewed` (first session), `Onboarding Checklist Viewed`.

---

## Feature Dependencies

```
Multi-step Registration
    └──establishes──> Visitor ID (Pendo init)
    └──establishes──> Account/Workspace ID (Pendo init)
                                └──required-by──> Workspace Switcher
                                └──required-by──> Team / Users page
                                └──required-by──> Pendo account-scoped guides

Sign-in form
    └──requires──> Registration (to have credentials in localStorage)

Authenticated SaaS Shell (side nav + top bar)
    └──wraps──> Dashboard, Lists, Settings, Reports, Team, Help
    └──requires──> Sign-in or registration completion
    └──hosts──> Workspace switcher, Notifications, User menu, Global search

Dashboard charts
    └──requires──> Seeded task/project data
    └──enhances──> Drill-down navigation (cards → Lists / Reports)

Lists page
    └──provides──> Task data consumed by Dashboard + Reports
    └──Board view requires──> Drag-and-drop library
    └──Calendar view requires──> Date math + grid layout

Reports page
    └──requires──> Same data model as Lists
    └──CSV export enhances──> Reports + Lists

Team / Users page
    └──requires──> Workspace model from Registration Step 3
    └──Invite flow enhances──> Registration Step 4 (shared component)

Settings
    └──reads/writes──> Profile from Registration Step 2
    └──reads/writes──> Workspace info from Registration Step 3
    └──reads/writes──> Preferences (theme, density)

Help / Docs
    └──hosts──> Pendo Resource Center anchor
    └──independent──> No data dependency on rest of app

Onboarding Checklist widget
    └──enhances──> Dashboard (lives there)
    └──requires──> Stable selectors on the actions it references (New Task, Invite, etc.)

Pendo Snippet
    └──requires──> Visitor + Account IDs from Registration / Sign-in
    └──requires──> Stable data attributes on every interactive element
    └──enables──> All four Pendo pillars across all pages
```

### Dependency Notes

- **Registration → Pendo init:** Pendo cannot be initialized with meaningful IDs until the user has completed registration (or signed back in). Decide: do you init Pendo anonymously on the marketing/landing page and then identify on registration complete? Or only init post-auth? This is a roadmap decision — recommend initializing anonymously so the unauth funnel itself is measurable, then `pendo.identify()` on registration complete.
- **Workspace model is foundational:** Several features (workspace switcher, team page, account-scoped guides, settings → workspace tab) depend on a workspace existing. The registration step that creates it is therefore non-optional.
- **Stable selectors are a cross-cutting dependency:** Every guide-anchorable feature listed above requires stable `data-pendo` (or similar) attributes on its DOM. This isn't a feature — it's a markup contract. Flag for roadmap as a cross-cutting concern.
- **Onboarding Checklist conflicts with Pendo Checklists:** If you build an in-app onboarding checklist, you'll demo Pendo's Checklists product *alongside* yours, not *through* yours. Consider building only the surface (the widget shell) and letting Pendo control the content — or skip the in-app version entirely and rely on Pendo's Resource Center checklist. Recommend the latter for purity.

---

## MVP Definition

### Launch With (v1) — Demo-Ready

Minimum viable surface to demo all four Pendo pillars convincingly.

- [ ] **Multi-step registration (all 4 steps)** — the core funnel demo; non-negotiable
- [ ] **Sign in / sign out** — return-visitor path
- [ ] **Authenticated shell** — side nav + top bar + user menu — wraps everything
- [ ] **Dashboard** — 4 stat cards + 2 charts + time-range selector + 1 quick-action button + activity feed + empty state
- [ ] **Lists page** — List view only; create / edit / complete / delete / sort / filter — covers the highest-frequency event
- [ ] **Settings** — Profile tab + Workspace tab + Preferences tab (theme toggle)
- [ ] **Reports** — date range + filter + table + 1 chart + CSV export
- [ ] **Team / Users page** — member list + invite modal + role dropdown
- [ ] **Help / Docs** — searchable article list + 1 article detail + Resource Center anchor
- [ ] **Pendo Snippet wired in** — initialized with visitor + account from registration
- [ ] **Stable data attributes** on all interactive elements
- [ ] **Toast feedback** + **confirmation modals** for varied replay content
- [ ] **Empty states** on Dashboard + Lists + Team (best guide-anchor surfaces)

### Add After Validation (v1.x) — Increases Demo Surface

- [ ] **Board view + drag-and-drop** on Lists — the marquee replay demo
- [ ] **Workspace switcher** with 2-3 seeded workspaces — multi-tenant Pendo demo
- [ ] **Calendar view** on Lists — third view-mode adoption metric
- [ ] **Command-bar (Cmd+K)** — high-velocity event generator
- [ ] **Notifications bell + panel** — badge guide anchor
- [ ] **Onboarding checklist widget** (or delegate fully to Pendo Resource Center)
- [ ] **Task detail slide-over** with comments and @-mentions
- [ ] **Tag/label system** on tasks
- [ ] **Keyboard shortcuts cheatsheet (`?` key)**
- [ ] **"What's new" modal trigger** on login (let Pendo populate content)
- [ ] **Help center "Was this helpful?" widget** (parallels Pendo poll)

### Future Consideration (v2+) — Only If Specific Demo Need Arises

- [ ] Multiple seeded user personas (admin / member / viewer) for role-based guide targeting
- [ ] Seeded "long-time user" account vs "new user" account for cohort-segmentation demos
- [ ] A second fake product (e.g., a separate "Halo Docs" app) to demo Pendo cross-app — only if needed
- [ ] In-app product tour authored entirely in source (no — let Pendo do this; this is an anti-feature)

---

## Feature Prioritization Matrix

| Feature | Demo Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Multi-step registration (4 steps) | HIGH | MEDIUM | P1 |
| Sign in / sign out | HIGH | LOW | P1 |
| Side nav + top bar shell | HIGH | LOW | P1 |
| Dashboard with charts | HIGH | MEDIUM | P1 |
| Lists page (List view, CRUD) | HIGH | MEDIUM | P1 |
| Settings (tabs + preferences) | MEDIUM | LOW | P1 |
| Reports page | MEDIUM | MEDIUM | P1 |
| Team page + invite modal | HIGH | LOW | P1 |
| Help page + Resource Center anchor | HIGH | LOW | P1 |
| Stable data attributes | HIGH (cross-cutting) | LOW | P1 |
| Toast + confirm modal system | MEDIUM | LOW | P1 |
| Empty states with CTAs | HIGH | LOW | P1 |
| Board view + drag-and-drop | HIGH | HIGH | P2 |
| Workspace switcher | HIGH | MEDIUM | P2 |
| Command-bar (Cmd+K) | MEDIUM | HIGH | P2 |
| Notifications bell + panel | MEDIUM | MEDIUM | P2 |
| Task detail slide-over + comments | MEDIUM | MEDIUM | P2 |
| Calendar view | MEDIUM | MEDIUM | P2 |
| Tag/label system | MEDIUM | MEDIUM | P2 |
| Theme toggle | LOW (charm) | LOW | P2 |
| Density toggle | LOW (charm) | LOW | P3 |
| Keyboard shortcuts + cheatsheet | LOW | MEDIUM | P3 |
| "What's new" modal | LOW (Pendo can do it) | LOW | P3 |
| Gantt view | LOW | HIGH | NO (anti-feature) |
| Real-time collaboration | LOW | HIGH | NO (anti-feature) |
| Real file uploads | LOW | MEDIUM | NO (anti-feature) |

**Priority key:**
- P1: Required for v1 — without this, demo doesn't cover all four Pendo pillars
- P2: Substantially increases demo surface; add post-v1
- P3: Charm features; add as time permits
- NO: Anti-feature — do not build

---

## Pendo Capability Coverage Check

Confirming v1 MVP exercises all four Pendo pillars:

| Pendo Pillar | v1 Coverage |
|--------------|-------------|
| **Events & Funnels** | Registration funnel (4 steps), sign-in event, every nav click, every CRUD on Lists, every Settings save, Report export — covered |
| **Guides & In-App Messaging** | Empty states (Dashboard, Lists, Team), confirmation modals, toast surfaces, Help page Resource Center, user-avatar menu, stat cards, "Invite teammate" CTA — covered |
| **Feature Adoption** | Task created (high-frequency), report exported, invite sent, theme toggled, preferences changed — covered. Strengthened by P2 adds (view-mode toggle, command-bar usage) |
| **Session Replay** | Multi-step registration forms (with validation errors), CRUD modals, sort/filter interactions, toast appearances, confirmation modals — covered. Strengthened substantially by P2 drag-and-drop |

v1 covers all four pillars at a baseline level. P2 features push from "covered" to "demo-worthy."

---

## Competitor Feature Analysis

Comparing canonical project/task management products that Halo should *feel* like (without copying any specific one). All HIGH confidence — these are well-known product patterns.

| Feature | Asana | Linear | ClickUp | Notion | Halo's Approach |
|---------|-------|--------|---------|--------|------------------|
| Multi-step registration | Yes (workspace + role + invite) | Yes (simpler, 2-3 steps) | Yes (long, 5+ steps) | Yes | Match Asana's depth — 4 steps |
| Side nav | Yes | Yes | Yes | Yes | Yes — persistent, collapsible |
| List/Board view | Yes | Yes (issues + cycle) | Yes (15+ views) | Yes (database) | List in v1; Board in P2 |
| Calendar view | Yes | No | Yes | Yes | P2 |
| Gantt / Timeline | Yes | No | Yes | No | NO (anti-feature) |
| Command palette | No | Yes | Yes | Yes | P2 |
| Dashboard with charts | Yes | Limited | Yes | Limited | Yes — central to Pendo demo |
| Reports | Yes | Insights | Yes | No | Yes |
| Team management | Yes | Yes | Yes | Yes | Yes |
| In-app help / docs | Yes | Yes | Yes | Yes | Yes — also our Resource Center anchor |
| Onboarding checklist | Yes | Yes | Yes | Yes | Let Pendo own this (or thin in-app shell only) |
| Real-time collab | Yes | Yes | Yes | Yes | NO (anti-feature — backend required) |
| Native mobile | Yes | Yes | Yes | Yes | NO (out of scope) |
| AI assistant | Yes | Yes | Yes | Yes | NO (anti-feature) |

**Synthesis:** Halo should look "Asana-like-but-simpler" in structure (multi-step onboarding, dashboard, lists, reports, team, help) with "Linear-like" polish (clean shell, command palette, modern empty states). Skip the heavyweight collaboration/AI/Gantt features that real competitors invest in but contribute nothing unique to a Pendo demo.

---

## Sources

- **PROJECT.md (Halo, 2026-05-13):** Authoritative on scope, constraints, and out-of-scope items. HIGH confidence.
- **Pendo capability model (events/funnels, guides, feature adoption, session replay):** Stable, well-documented public capability areas. MEDIUM-HIGH confidence — specific event-naming conventions and guide-anchor mechanics are based on training data and may have evolved; verify against current Pendo docs when implementing the Snippet wire-in (this is a research flag for the implementation phase, not a blocker for feature scoping).
- **Project/task management SaaS conventions (Asana, Linear, ClickUp, Notion, Jira):** Canonical product patterns; HIGH confidence on shape/structure (these patterns have been stable for years).
- **B2B SaaS onboarding patterns (multi-step registration, workspace creation, invite flow):** Standard pattern across the category; HIGH confidence.

### Research Flags for Implementation Phase

- Verify current Pendo Snippet initialization API (`pendo.initialize` vs `pendo.identify` ordering) against live docs before wiring — MEDIUM confidence in the specifics.
- Verify current Pendo guide-anchoring selector strategy (data attributes vs CSS classes vs Pendo's auto-tagging) — recommend `data-pendo="..."` attributes as a portable default, but cross-check Pendo's current "best practices for instrumented apps" guidance.
- Verify Resource Center current setup mechanics (snippet flag vs config) for the Help page anchor.

---

*Feature research for: fake project/task management SaaS as Pendo demo surface*
*Researched: 2026-05-13*
