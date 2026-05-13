# Architecture Research

**Domain:** Fake multi-tenant SaaS SPA (Pendo experimentation playground — "Halo")
**Researched:** 2026-05-13
**Confidence:** HIGH (Pendo integration patterns and SaaS SPA conventions are well-established; some MEDIUM-confidence detail on Pendo's internal SPA route detection since live docs were not reachable during research)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                                 │
├──────────────────────────────────────────────────────────────────────┤
│                      Pendo Snippet (global)                           │
│   pendo.initialize({ visitor, account })  ← called once after auth    │
│   pendo.identify({...})                   ← called on workspace swap  │
└──────────────────────────────────────────────────────────────────────┘
            ▲                                          ▲
            │ visitor + account metadata               │ DOM events,
            │                                          │ stable selectors
            │                                          │
┌───────────┴──────────────────────────────────────────┴───────────────┐
│                       Routing Layer                                   │
│   Public routes (/, /signup, /signin)   |  Protected routes (/app/*)  │
│   <PublicLayout/>                       |  <AppShell/>                │
└──────────────────────────────────────────────────────────────────────┘
            ▲                                          ▲
            │                                          │
┌───────────┴───────────────┐    ┌─────────────────────┴────────────────┐
│   Public Layout           │    │   Authenticated AppShell             │
│   • Marketing landing     │    │   ┌───────────┬──────────────────┐   │
│   • Multi-step signup     │    │   │ SideNav   │  Page outlet     │   │
│   • Sign-in form          │    │   │           │  • Dashboard     │   │
│                           │    │   │ (stable   │  • Tasks/Lists   │   │
│                           │    │   │  data-    │  • Reports       │   │
│                           │    │   │  pendo-   │  • Team          │   │
│                           │    │   │  id)      │  • Settings      │   │
│                           │    │   │           │  • Help          │   │
│                           │    │   └───────────┴──────────────────┘   │
│                           │    │   <TopBar> workspace switcher, user  │
└───────────────────────────┘    └──────────────────────────────────────┘
            ▲                                          ▲
            │                                          │
┌───────────┴──────────────────────────────────────────┴───────────────┐
│                     Application State (in-memory)                     │
│   AuthContext / SessionStore     WorkspaceContext      DataStores     │
│   currentVisitorId               currentWorkspaceId    tasks, reports │
│   currentAccountId               members, role         team, articles │
└──────────────────────────────────────────────────────────────────────┘
            ▲                                          ▲
            │ read on boot / write on mutation         │
            │                                          │
┌───────────┴──────────────────────────────────────────┴───────────────┐
│                  Persistence Layer (localStorage)                     │
│   halo:v1:visitors          halo:v1:accounts          halo:v1:session │
│   halo:v1:tasks:<accountId> halo:v1:team:<accountId>  halo:v1:reports │
│   halo:v1:meta              (schemaVersion, seededAt)                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Pendo Snippet** | Global analytics agent; identifies visitor+account; auto-detects DOM/route changes for page views | `<script>` in `index.html` (agent stub) + a thin `pendo-client.ts` wrapper module |
| **AuthProvider / SessionStore** | Holds `currentVisitorId`, `currentAccountId`, role; gates protected routes; triggers Pendo init on login | Context + reducer (React) or store (Svelte); hydrated from `halo:v1:session` on boot |
| **WorkspaceProvider** | Holds current workspace (= Pendo account); supports switching (re-fires `pendo.identify`) | Context/store; depends on AuthProvider |
| **Router** | Public vs protected route gating; renders correct layout; emits navigation events | `react-router` (data router) or SvelteKit-style routing |
| **PublicLayout** | Marketing/auth chrome (centered card, no sidenav); hosts signup flow + signin | Pure layout component, no auth dependencies |
| **AppShell** | Authenticated chrome: top bar, side nav, content outlet; injects `data-pendo-id` anchors | Layout component wrapping protected route outlet |
| **SideNav** | Persistent navigation between Dashboard/Tasks/Reports/Team/Settings/Help | Static config-driven nav with stable selectors |
| **Page modules** | Each page (Dashboard, Tasks, etc.) owns its own data hooks + presentational components | One folder per page; co-locates page-level components |
| **DataStores** | Per-domain CRUD over localStorage (`tasksStore`, `teamStore`, etc.) | Pure functions or stores; read/write namespaced keys |
| **Seeder** | On first registration/workspace creation, populates fake tasks/reports/team | Idempotent module gated by `meta.seededAt` |
| **PendoClient** | Wraps `pendo.initialize`, `pendo.identify`, `pendo.updateOptions`, `pendo.flushNow`; handles "agent not yet loaded" race | Singleton module with promise queue |

## Recommended Project Structure

```
src/
├── main.tsx                       # App entry, mounts <App/>
├── App.tsx                        # Top-level providers + Router
├── pendo/
│   ├── snippet.ts                 # Loads the pendo agent stub (or it lives in index.html)
│   ├── client.ts                  # initialize/identify/updateOptions wrapper
│   ├── metadata.ts                # buildVisitorMetadata(), buildAccountMetadata()
│   └── selectors.ts               # PENDO_IDS constants (string enum of data-pendo-id values)
├── auth/
│   ├── AuthProvider.tsx           # Session context + reducer
│   ├── useAuth.ts                 # Hook
│   ├── session-store.ts           # localStorage read/write for session
│   └── routes/
│       ├── RequireAuth.tsx        # Route guard for /app/*
│       └── RequireAnon.tsx        # Redirect away from /signin if logged in
├── workspace/
│   ├── WorkspaceProvider.tsx      # Current workspace + switch()
│   ├── workspaces-store.ts        # localStorage CRUD for accounts
│   └── visitors-store.ts          # localStorage CRUD for visitors
├── storage/
│   ├── keys.ts                    # Single source of truth for key names (halo:v1:*)
│   ├── codec.ts                   # JSON.parse/stringify + try/catch helpers
│   ├── schema.ts                  # TypeScript types for stored shapes
│   ├── migrations.ts              # v0 → v1 → v2 migrations keyed off meta.schemaVersion
│   └── seeder.ts                  # Idempotent seed of fake data on first account create
├── routes/
│   ├── public/
│   │   ├── PublicLayout.tsx       # Marketing chrome
│   │   ├── Landing.tsx
│   │   ├── signup/
│   │   │   ├── SignupFlow.tsx     # Multi-step wizard container
│   │   │   ├── steps/
│   │   │   │   ├── StepIdentity.tsx
│   │   │   │   ├── StepPersonal.tsx
│   │   │   │   ├── StepCompany.tsx
│   │   │   │   └── StepPreferences.tsx
│   │   │   └── signup-state.ts    # Wizard state machine
│   │   └── SignIn.tsx
│   └── app/
│       ├── AppShell.tsx           # SideNav + TopBar + <Outlet/>
│       ├── TopBar.tsx             # Workspace switcher + user menu
│       ├── SideNav.tsx            # Persistent left nav
│       ├── dashboard/             # Charts over fake task/project data
│       ├── tasks/                 # List CRUD + reorder
│       ├── reports/               # Tabular + filters + export
│       ├── team/                  # Invite + role mgmt (all fake)
│       ├── settings/              # Profile, company, prefs
│       └── help/                  # Searchable articles (RC anchor)
├── data/
│   ├── tasks-store.ts             # Task CRUD over localStorage
│   ├── reports-store.ts
│   ├── team-store.ts
│   ├── articles-store.ts          # Static help content
│   └── fixtures/
│       ├── tasks.fixtures.ts      # Seed templates
│       ├── reports.fixtures.ts
│       └── articles.fixtures.ts
├── ui/                            # Generic, app-agnostic components
│   ├── Button.tsx, Card.tsx, Modal.tsx, Form/*, Table.tsx, Chart/*
│   └── (or thin wrappers over chosen UI library)
└── lib/
    ├── id.ts                      # ULID/UUID helpers
    └── routing.ts                 # Route constants
```

### Structure Rationale

- **`pendo/` as a first-class top-level concern:** Pendo is the *point* of this app. Keeping the snippet wrapper, metadata builder, and stable-selector registry in one folder makes the integration auditable and prevents Pendo-specific logic from leaking into pages.
- **`auth/`, `workspace/`, `storage/` as siblings:** They have a strict dependency direction (storage ← workspace ← auth) and isolating them prevents circular imports and makes the boot sequence easy to reason about.
- **`routes/public/` vs `routes/app/`:** Hard separation of unauthenticated vs authenticated surface area. PublicLayout never imports AppShell (and vice versa), preventing accidental access to authenticated UI from the signup flow.
- **`data/` is per-domain:** Each domain store owns its localStorage key shape. No shared "uberstore" — keeps domain logic local and avoids the trap of one monolithic state blob that has to be rewritten when schemas drift.
- **`ui/` is generic:** Forces a discipline of dumb, reusable presentational components vs. domain-aware page components. Pages compose `ui/` primitives and add `data-pendo-id` attributes at the page level so Pendo selectors map to *features*, not generic atoms.

## Architectural Patterns

### Pattern 1: Deferred Pendo Initialization (post-auth)

**What:** The Pendo agent stub loads with the page, but `pendo.initialize({ visitor, account })` is *only* called after the user is authenticated (or has completed signup). Anonymous public-page views are either skipped or fire with an anonymous visitor.

**When to use:** Multi-tenant SaaS where you don't have visitor/account identity until login. This is the standard Pendo pattern.

**Trade-offs:**
- Pro: Visitor and account IDs are accurate from the first authenticated page view.
- Pro: No anonymous-to-known visitor stitching headaches.
- Con: Public marketing/signup pages produce no Pendo data unless you separately call `pendo.initialize` with `visitor.id = 'VISITOR-UNIQUE-ID'` / anonymous mode.
- Decision for Halo: Initialize anonymously on app boot so signup funnel is captured, then call `pendo.identify({...})` post-signup to re-bind to the real visitor + account.

**Example:**
```typescript
// src/pendo/client.ts
let initialized = false;

export async function initializePendo(opts?: { visitor?: Visitor; account?: Account }) {
  if (initialized) {
    return identifyPendo(opts);
  }
  window.pendo.initialize({
    visitor: opts?.visitor ?? { id: 'anonymous' },
    account: opts?.account ?? { id: 'anonymous' },
  });
  initialized = true;
}

export function identifyPendo({ visitor, account }: { visitor: Visitor; account: Account }) {
  window.pendo.identify({ visitor, account });
}
```

### Pattern 2: Provider Stack with Strict Dependency Order

**What:** A fixed provider hierarchy at the app root:
```
<StorageProvider>           // hydrates localStorage on mount
  <AuthProvider>            // depends on storage
    <WorkspaceProvider>     // depends on auth
      <PendoBridge>         // depends on auth + workspace, calls identify
        <Router>            // depends on auth (for guards)
```

**When to use:** Multi-tenant SPA where Pendo identity is derived from auth+workspace. Order matters because `WorkspaceProvider` cannot resolve before `AuthProvider`, and Pendo identify must wait for both.

**Trade-offs:**
- Pro: Deterministic boot; no race between "Pendo init" and "user logged in."
- Pro: Easy to reason about — each layer has one upstream dependency.
- Con: Slightly verbose. Acceptable for a demo app where clarity beats minimalism.

**Example:**
```tsx
// src/App.tsx
export default function App() {
  return (
    <StorageProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <PendoBridge>
            <RouterProvider router={router} />
          </PendoBridge>
        </WorkspaceProvider>
      </AuthProvider>
    </StorageProvider>
  );
}

// src/pendo/PendoBridge.tsx
export function PendoBridge({ children }: { children: ReactNode }) {
  const { visitor } = useAuth();
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (!visitor || !workspace) {
      initializePendo(); // anonymous
      return;
    }
    initializePendo({
      visitor: buildVisitorMetadata(visitor),
      account: buildAccountMetadata(workspace),
    });
  }, [visitor?.id, workspace?.id]);

  return <>{children}</>;
}
```

### Pattern 3: Namespaced, Versioned localStorage Schema

**What:** All keys follow `halo:v<schemaVersion>:<domain>[:scopeId]`. A `halo:v1:meta` key holds `{ schemaVersion, seededAt, appVersion }`. On boot, a migrations module compares stored `schemaVersion` to the current one and runs migrations.

**When to use:** Any frontend app whose schema will evolve. Cheap insurance against a single localStorage refactor breaking everyone's demo data.

**Trade-offs:**
- Pro: Refactor-friendly. v1 → v2 is a 10-line migration, not a "clear local storage" instruction in the README.
- Pro: Namespace prevents collisions if the same browser hosts another demo.
- Con: Slight ceremony on every read/write — mitigated by funneling through `storage/codec.ts`.

**Example:**
```typescript
// src/storage/keys.ts
export const SCHEMA_VERSION = 1;
const NS = 'halo';

export const K = {
  meta:       () => `${NS}:v${SCHEMA_VERSION}:meta`,
  session:    () => `${NS}:v${SCHEMA_VERSION}:session`,
  visitors:   () => `${NS}:v${SCHEMA_VERSION}:visitors`,
  accounts:   () => `${NS}:v${SCHEMA_VERSION}:accounts`,
  tasks:      (accountId: string) => `${NS}:v${SCHEMA_VERSION}:tasks:${accountId}`,
  team:       (accountId: string) => `${NS}:v${SCHEMA_VERSION}:team:${accountId}`,
  reports:    (accountId: string) => `${NS}:v${SCHEMA_VERSION}:reports:${accountId}`,
  prefs:      (visitorId: string) => `${NS}:v${SCHEMA_VERSION}:prefs:${visitorId}`,
} as const;
```

### Pattern 4: Stable Pendo Selectors via Centralized Registry

**What:** A `data-pendo-id` attribute is added to every Pendo-targetable element. Values are constants in `src/pendo/selectors.ts` so the attribute name *and* value are refactor-safe.

**When to use:** Any app where Pendo guides need stable anchors. Class names and IDs drift; a typed registry makes drift visible at the type level.

**Trade-offs:**
- Pro: Renaming a selector is a single-file edit that the type system propagates.
- Pro: Reviewing all Pendo-anchored UI is a single grep for `PENDO_IDS.`.
- Pro: Linter/eslint rule can ban raw `data-pendo-id="..."` strings to force registry use.
- Con: One extra import per page-level component.

**Example:**
```typescript
// src/pendo/selectors.ts
export const PENDO_IDS = {
  // Side nav
  navDashboard:     'nav-dashboard',
  navTasks:         'nav-tasks',
  navReports:       'nav-reports',
  navTeam:          'nav-team',
  navSettings:      'nav-settings',
  navHelp:          'nav-help',

  // Top bar
  workspaceSwitcher: 'topbar-workspace-switcher',
  userMenu:          'topbar-user-menu',

  // Signup funnel (becomes a Pendo funnel)
  signupStepIdentity:    'signup-step-identity',
  signupStepPersonal:    'signup-step-personal',
  signupStepCompany:     'signup-step-company',
  signupStepPreferences: 'signup-step-preferences',
  signupSubmit:          'signup-submit',

  // Tasks page
  tasksCreate:      'tasks-create',
  tasksRowEdit:     'tasks-row-edit',
  tasksRowDelete:   'tasks-row-delete',

  // Reports
  reportsExport:    'reports-export',
  reportsFilter:    'reports-filter',
} as const;

// Usage:
<button data-pendo-id={PENDO_IDS.tasksCreate} onClick={...}>New Task</button>
```

**Convention rules:**
- Attribute name: `data-pendo-id` (single attribute, no clashing schemes).
- Value format: `<area>-<element>` kebab-case (e.g., `tasks-create`, `signup-step-identity`).
- Apply to: every primary CTA, every nav item, every form submit, every row-level action, every modal close, every funnel step container.
- Do *not* apply to generic `ui/` primitives — apply at the *page* layer so the selector reflects feature intent, not widget type.

### Pattern 5: Pendo Route Signaling

**What:** Pendo's agent auto-detects page changes via DOM mutation observation, but SPA route changes that don't change the URL or DOM substantially can miss detection. For SPAs, the safe pattern is to explicitly notify Pendo on route change.

**When to use:** Always, for SPAs. The two practical signals:
1. `pendo.location.useBrowserUrl()` / `pendo.location.setUrl(url)` — tells Pendo what URL to associate with the current page.
2. `pendo.identify({...})` on workspace switch — also re-fires a "page" effectively, and rebinds account.

**Trade-offs:**
- Pro: Reliable page-view tracking even on routes that share a layout shell.
- Con: One small piece of glue between the router and Pendo. Cheap.

**Example:**
```typescript
// src/pendo/PendoRouteBridge.tsx
export function PendoRouteBridge() {
  const location = useLocation();
  useEffect(() => {
    if (window.pendo?.location?.setUrl) {
      window.pendo.location.setUrl(window.location.href);
    }
  }, [location.pathname, location.search]);
  return null;
}
```

Mount inside `<RouterProvider>` so it has access to the router context.

## Data Flow

### Registration → Pendo Initialization Flow

```
[Public landing /]
    ↓ user clicks "Sign up"
[SignupFlow /signup]
    ↓ Step 1: identity (email, password)         → wizard state
    ↓ Step 2: personal (name, role, avatar)      → wizard state
    ↓ Step 3: company (workspace name, size)     → wizard state
    ↓ Step 4: preferences (notifications, theme) → wizard state
    ↓ user clicks "Create account"
[SignupFlow.commit()]
    ↓ visitorsStore.create(visitor)              → halo:v1:visitors
    ↓ accountsStore.create(workspace)            → halo:v1:accounts
    ↓ seeder.seedIfEmpty(accountId)              → halo:v1:tasks/team/reports
    ↓ sessionStore.write({ visitorId, accountId }) → halo:v1:session
    ↓
[AuthProvider observes new session]
    ↓ state: { visitor, role: 'owner' }
[WorkspaceProvider observes accountId]
    ↓ state: { workspace }
[PendoBridge useEffect fires]
    ↓ pendo.identify({
    ↓   visitor: { id, email, fullName, role, signupAt, theme, notifications },
    ↓   account: { id, name, size, industry, plan: 'demo', createdAt },
    ↓ })
[Router redirects to /app/dashboard]
    ↓
[PendoRouteBridge fires pendo.location.setUrl()]
```

### App Hydration Flow (returning user)

```
[Page load]
    ↓
[StorageProvider mounts]
    ↓ reads halo:v1:meta → checks schemaVersion → runs migrations if needed
[AuthProvider mounts]
    ↓ reads halo:v1:session
    ↓ if session exists: reads halo:v1:visitors → finds matching visitor
    ↓ sets state { visitor } or null
[WorkspaceProvider mounts]
    ↓ reads halo:v1:accounts → finds account by session.accountId
[PendoBridge useEffect runs]
    ↓ if visitor && workspace: pendo.initialize({ visitor, account })
    ↓ else: pendo.initialize({ visitor: { id: 'anonymous' }, ... })
[Router renders]
    ↓ RequireAuth guard checks AuthProvider state
    ↓ redirects to /signin if no session
    ↓ otherwise renders AppShell + page
```

### Workspace Switch Flow

```
[User clicks TopBar workspace switcher]
    ↓
[WorkspaceProvider.switch(newAccountId)]
    ↓ sessionStore.write({ ...session, accountId: newAccountId })
    ↓ context state updates
[PendoBridge useEffect re-runs]
    ↓ pendo.identify({ visitor: <same>, account: <new> })
[Pages re-fetch data scoped to new accountId]
    ↓ useTasks() reads halo:v1:tasks:<newAccountId>
```

### State Management

```
                  ┌──────────────────────┐
                  │  localStorage (disk) │
                  └──────────┬───────────┘
                             │ read on mount / write on mutation
                             ▼
        ┌───────────────────────────────────────┐
        │      Domain stores (tasks, team...)   │
        │      Pure functions over localStorage │
        └───────────────────────┬───────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────┐
        │       Hooks (useTasks, useTeam)       │
        │       useSyncExternalStore-style      │
        └───────────────────────┬───────────────┘
                                │
                                ▼
                          [Components]
                                │ user action
                                ▼
                       [Hook mutation API]
                                │
                                ▼
                      [Store write → storage]
                                │
                                ▼
                   [Storage event → re-render]
```

Notes:
- For multi-tab consistency, subscribe to `window` `storage` events so a write in tab A re-renders tab B. (Demo-friendly party trick.)
- React: `useSyncExternalStore(subscribe, getSnapshot)` is the cleanest binding. Svelte: a writable store with `localStorage` reflection.

### Key Data Flows

1. **Signup → Pendo identify:** Multi-step wizard accumulates form state in memory; on commit, writes visitor + account + seeds in localStorage, updates session, which cascades through AuthProvider → WorkspaceProvider → PendoBridge → `pendo.identify`.
2. **Returning user hydration:** Storage → providers → PendoBridge fires `pendo.initialize` once with the rehydrated visitor + account. Pendo never sees an "unknown" state for an authenticated user.
3. **Route change → Pendo page view:** Router's `useLocation` change triggers `pendo.location.setUrl()` via `PendoRouteBridge`. Pendo's DOM observer also catches most changes; the explicit signal is a belt-and-suspenders backup.
4. **Workspace switch → Pendo re-identify:** Session update → WorkspaceProvider change → PendoBridge re-runs `pendo.identify` with the new account. Visitor remains stable; account changes — exactly the shape Pendo expects for multi-tenant accounts.
5. **Sign out → Pendo clear:** Session cleared → AuthProvider null → optional `pendo.clearSession()` (or rely on next-user identify to overwrite). Easiest: full page reload on signout to reset agent state.

## Suggested Build Order

This order minimizes rework. Each stage produces a runnable, demoable surface.

| Stage | What you build | Why now | Pendo touchpoint |
|-------|---------------|---------|------------------|
| **1. Foundation** | Vite scaffold, TypeScript, UI library, routing, design tokens, `ui/` primitives | Nothing else compiles without it. Lock in the look so later polish isn't a rewrite. | None yet — but reserve `data-pendo-id` slots in primitives' APIs |
| **2. Storage core** | `storage/keys.ts`, `codec.ts`, `schema.ts`, `migrations.ts`, `meta` bootstrapping | Every later module depends on it. Versioning from day one prevents painful reset-everyone's-data moments. | None |
| **3. Pendo scaffolding** | `pendo/client.ts` wrapper, snippet load in `index.html`, `selectors.ts` registry, `PendoBridge` (initialize anonymously), `PendoRouteBridge` | Build before auth so the bridge is already wired when the first identify happens. Anonymous init proves the snippet works. | `pendo.initialize` (anonymous) |
| **4. Auth + Workspace + Session** | AuthProvider, WorkspaceProvider, session-store, visitors-store, accounts-store, RequireAuth/RequireAnon guards | Required for any protected page. Build before the AppShell so the shell can assume auth context. | None directly — but PendoBridge now has real data when auth completes |
| **5. Signup flow** | Multi-step wizard, step components, signup-state, commit handler, seeder | First end-to-end Pendo demo: a multi-step funnel. Wire `data-pendo-id` on every step + submit. | First real `pendo.identify` fires here — verify visitor + account metadata in the Pendo dashboard before moving on |
| **6. Sign in** | SignIn page, fake email/password match against `halo:v1:visitors` | Cheap. Completes the auth surface. | Triggers `pendo.identify` on success |
| **7. App shell** | AppShell, TopBar, SideNav with stable selectors, workspace switcher, user menu | Now every page can plug into a real chrome. Stable selectors enable persistent in-app guides (welcome guide, what's-new banner). | `pendo.identify` on workspace switch; nav selectors stable |
| **8. Dashboard** | Charts, KPI cards over seeded data | First "real-looking" page; demonstrates feature adoption analytics on widget interactions | Track-event candidates: chart-filter, kpi-card-click |
| **9. Tasks (lists)** | Create/edit/reorder/delete, modal forms | Highest-interaction surface; ideal for Session Replay and feature adoption | Selectors on row actions, create CTA |
| **10. Reports** | Tabular + filters + export buttons | Funnel candidate: filter → view → export | Selectors on filter, export |
| **11. Team** | Invite, role mgmt (all fake) | Anchor for role-targeted guides | Selectors on invite, role-change |
| **12. Settings** | Profile, company, preferences | Demonstrates visitor/account metadata changes flowing back into Pendo (`pendo.updateOptions`) | `pendo.updateOptions({ visitor: {...updated} })` |
| **13. Help** | Searchable articles | Natural Resource Center anchor | Selectors on search, article-open |
| **14. Polish** | Empty states, loading states, microinteractions, demo-grade visual pass | Last because reordering doesn't invalidate it | Re-audit selector coverage |

## LocalStorage Schema (concrete)

### `halo:v1:meta`
```json
{
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "seededAt": "2026-05-13T12:00:00.000Z",
  "lastMigrationAt": "2026-05-13T12:00:00.000Z"
}
```

### `halo:v1:session`
```json
{
  "visitorId": "v_01HZX...",
  "accountId": "a_01HZX...",
  "signedInAt": "2026-05-13T12:00:00.000Z"
}
```
Single object, not an array. Null/absent = signed out.

### `halo:v1:visitors`
```json
{
  "v_01HZX...": {
    "id": "v_01HZX...",
    "email": "ada@example.com",
    "password": "plaintext-on-purpose",
    "fullName": "Ada Lovelace",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "role": "owner",
    "jobTitle": "Engineering Manager",
    "avatarUrl": "...",
    "preferences": {
      "theme": "light",
      "emailNotifications": true,
      "weeklyDigest": true
    },
    "createdAt": "2026-05-13T12:00:00.000Z",
    "lastSignInAt": "2026-05-13T12:00:00.000Z",
    "accountIds": ["a_01HZX..."]
  }
}
```
Keyed by visitor id for O(1) lookup. Multi-tenancy: a visitor may belong to multiple accounts.

### `halo:v1:accounts`
```json
{
  "a_01HZX...": {
    "id": "a_01HZX...",
    "name": "Babbage Industries",
    "slug": "babbage-industries",
    "size": "11-50",
    "industry": "Software",
    "plan": "demo",
    "createdAt": "2026-05-13T12:00:00.000Z",
    "ownerVisitorId": "v_01HZX...",
    "memberVisitorIds": ["v_01HZX...", "v_01HZX..."]
  }
}
```

### `halo:v1:tasks:<accountId>`
```json
[
  {
    "id": "t_01HZX...",
    "title": "Wire up Pendo snippet",
    "description": "...",
    "status": "in_progress",
    "priority": "high",
    "assigneeVisitorId": "v_01HZX...",
    "labels": ["pendo", "setup"],
    "dueAt": "2026-05-20T00:00:00.000Z",
    "createdAt": "2026-05-13T12:00:00.000Z",
    "updatedAt": "2026-05-13T12:00:00.000Z",
    "orderIndex": 0
  }
]
```
Array, scoped by account. Sortable via `orderIndex`.

### `halo:v1:team:<accountId>`
```json
[
  {
    "visitorId": "v_01HZX...",
    "role": "owner" | "admin" | "member" | "viewer",
    "invitedAt": "2026-05-13T12:00:00.000Z",
    "invitedByVisitorId": "v_01HZX...",
    "status": "active" | "pending"
  }
]
```

### `halo:v1:reports:<accountId>`
Mostly *derived* from tasks at read time. If you persist anything, persist *report definitions* (filter/group config), not aggregates:
```json
[
  {
    "id": "r_01HZX...",
    "name": "High-priority overdue",
    "filters": { "priority": ["high"], "status": ["overdue"] },
    "createdAt": "2026-05-13T12:00:00.000Z"
  }
]
```

### `halo:v1:prefs:<visitorId>` (optional)
Per-visitor UI state (collapsed nav, dismissed banners). Separate from the visitor profile because UI prefs change often and aren't part of Pendo metadata.

### Pendo metadata mapping

```typescript
// src/pendo/metadata.ts
export function buildVisitorMetadata(v: Visitor) {
  return {
    id: v.id,                    // REQUIRED
    email: v.email,
    full_name: v.fullName,
    role: v.role,
    job_title: v.jobTitle,
    theme: v.preferences.theme,
    email_notifications: v.preferences.emailNotifications,
    created_at: v.createdAt,
  };
}

export function buildAccountMetadata(a: Account) {
  return {
    id: a.id,                    // REQUIRED
    name: a.name,
    size: a.size,
    industry: a.industry,
    plan: a.plan,
    created_at: a.createdAt,
    member_count: a.memberVisitorIds.length,
  };
}
```

## Scaling Considerations

This is a single-browser demo app — "scale" means demo robustness, not user count.

| Concern | At demo scale | Mitigation |
|---------|---------------|------------|
| localStorage quota (~5MB) | Easy to hit if seed data balloons or reports are persisted as aggregates | Keep seeds compact; derive aggregates at read time |
| Multi-tab consistency | Two tabs open during a demo will diverge | Subscribe to `window`'s `storage` event in each domain hook |
| Schema drift across demo browsers | Old localStorage from a previous build crashes the app | `schemaVersion` + migrations; on unknown version, offer "reset demo data" UI affordance |
| Pendo agent load race | App boots before agent script downloads → `pendo.initialize` undefined | `pendo` snippet is the *async stub* that queues calls until the agent loads. The wrapper still guards `window.pendo` existence. |
| First-run empty state | Brand new browser → no fake data → demos look broken | Seeder runs on account creation; also expose a "reset & reseed" dev menu (gated to dev mode) |

### "Scaling" Priorities for the demo

1. **First friction:** A demo viewer hits a stale schema → blank app. Mitigate with `migrations.ts` + a "Reset demo data" button in Settings.
2. **Second friction:** Seed data feels thin → charts look empty. Mitigate by generating ~30 tasks, 5 team members, 10 reports on seed.
3. **Third friction:** Pendo doesn't show the visitor/account in the dashboard → suspicion the app is broken. Mitigate with a hidden `/__pendo-debug` route (dev only) that dumps the last identify payload.

## Anti-Patterns

### Anti-Pattern 1: Initializing Pendo before auth resolves

**What people do:** Call `pendo.initialize({ visitor: undefined, account: undefined })` in `main.tsx` synchronously.
**Why it's wrong:** Pendo treats this as anonymous and you cannot later "promote" the same session to a known visitor without `pendo.identify` — which is the right call but wastes the early page view if you don't structure for it. Worse, some teams call `pendo.initialize` *twice*, which is undefined behavior.
**Do this instead:** Call `initialize` exactly once, then `identify` on every visitor/account change. Use the `PendoBridge` provider pattern above.

### Anti-Pattern 2: Stuffing all state into one localStorage blob

**What people do:** `localStorage.setItem('halo-state', JSON.stringify(everything))`.
**Why it's wrong:** Every write rewrites the whole world. Migrations become rewrite-the-universe. Multi-account scoping is impossible without parsing the whole thing.
**Do this instead:** Namespaced, domain-scoped keys (`halo:v1:tasks:<accountId>`). One concern per key.

### Anti-Pattern 3: Coupling stable selectors to CSS class names

**What people do:** Use `.btn-primary` or `#submit-button` as Pendo anchors.
**Why it's wrong:** Class names change with restyles; ids collide; both break Pendo guides silently.
**Do this instead:** `data-pendo-id` attributes from a central registry. Refactors are visible to the type system.

### Anti-Pattern 4: Re-seeding fake data on every app boot

**What people do:** Idempotent seeder that always runs → silently overwrites user mutations between demos.
**Why it's wrong:** A demoer creates a task to show off CRUD, refreshes the page, the task is gone. Embarrassing.
**Do this instead:** Seed only when `halo:v1:meta.seededAt` is absent. Provide an explicit "reset" UI.

### Anti-Pattern 5: Putting Pendo selectors on `ui/` primitives

**What people do:** `<Button data-pendo-id="primary-btn">` baked into the `Button` component.
**Why it's wrong:** Every primary button in the app gets the same selector. Pendo can't tell "create task" from "save settings."
**Do this instead:** Apply `data-pendo-id` at the *page* layer where the button's intent is known. The `Button` component just forwards `data-*` props.

### Anti-Pattern 6: Forgetting the workspace dimension in Pendo metadata

**What people do:** `pendo.identify({ visitor: { id, email } })` and skip `account`.
**Why it's wrong:** Defeats the entire multi-tenant demonstration. Account-level segments, account-targeted guides, and B2B funnels all need `account.id`.
**Do this instead:** Always pass both. In Halo's case, this is the *point* of the multi-tenant model.

### Anti-Pattern 7: Missing the route-change signal in SPAs

**What people do:** Trust Pendo's DOM observer to detect all SPA navigations.
**Why it's wrong:** Routes that share the AppShell layout (e.g., `/app/tasks` → `/app/reports`) may not produce a DOM mutation Pendo recognizes as a page change.
**Do this instead:** Mount `PendoRouteBridge` inside the router context; call `pendo.location.setUrl(window.location.href)` on every `useLocation` change.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Pendo | Snippet stub in `index.html`; wrapper module in `src/pendo/client.ts`; provider bridge calls `initialize`/`identify` | Snippet API key is a configurable constant (per Out of Scope: no UI for it); guard all calls with `window.pendo?.` since the agent is async-loaded |
| (no others) | — | Per project constraints: no backend, no SSO, no payments |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `storage/` ↔ `auth/`, `workspace/`, `data/` | Synchronous function calls; storage is pure | Storage layer never imports providers — strict one-way dependency |
| `auth/` ↔ `workspace/` | Provider composition; workspace reads `useAuth()` | Workspace cannot mount without auth resolved |
| `pendo/` ↔ `auth/` + `workspace/` | `PendoBridge` reads from both via hooks; pendo never writes back | Bridge is the *only* place identify is called from app code |
| `routes/app/*` ↔ `data/*` | Pages call domain hooks (`useTasks`, etc.); hooks wrap stores | No direct localStorage access from page components |
| `ui/` ↔ everything | One-way: pages import `ui/`, never the reverse | `ui/` is dependency-free except for the chosen library |

## Sources

- Pendo developer documentation (snippet install, `pendo.initialize`, `pendo.identify`, `pendo.updateOptions`, `pendo.location`): based on prior knowledge of Pendo's public install guide; live verification was blocked in this environment, so confidence on the exact JS API surface is MEDIUM — the orchestrator may want to spot-check against `support.pendo.io/hc/en-us/articles/360031862272` before phase 3 lands.
- Pendo guide targeting / stable selectors: `data-pendo-id` attribute pattern is the Pendo-recommended approach for stable in-app guide anchors.
- React Router `react-router` v6+ data router patterns (route guards via wrapper components, `useLocation` for route-change effects).
- `useSyncExternalStore` (React 18) for external store subscription — standard pattern for localStorage-backed stores.
- ULID/UUID for stable id generation — domain-agnostic best practice.

---
*Architecture research for: fake multi-tenant SaaS SPA (Halo) instrumented for Pendo*
*Researched: 2026-05-13*
