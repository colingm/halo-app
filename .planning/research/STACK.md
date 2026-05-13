# Stack Research

**Domain:** Frontend-only fake-SaaS SPA (project/task management vertical), purpose-built as a Pendo instrumentation playground
**Researched:** 2026-05-13
**Confidence:** MEDIUM-HIGH (training-data driven; WebSearch/WebFetch/Bash were unavailable in this research session — version numbers should be re-verified at `npm install` time, but library *choices* are well-established in the ecosystem)

> Confidence caveat: this session could not reach Context7, WebSearch, or WebFetch, so version numbers below are stated as the latest known-stable lines from training data and labeled with confidence per row. The roadmap step that installs these should pin versions from the actual registry at install time. Library *selection* (the load-bearing part of this doc) is HIGH confidence — these are the de facto standards for this exact use case.

---

## Framework Decision: React (not Svelte)

**Recommendation: React 18.x (or 19.x if stable at install time).**

This is the load-bearing decision for the rest of the stack, so it deserves its own section.

### Why React wins for *this* project

Halo's whole reason for existing is **Pendo instrumentation**. That reframes the framework question from generic "which is better DX?" to **"which framework has the deepest SaaS-UI + analytics ecosystem in 2026?"** Once framed that way, React is the clear pick:

1. **SaaS UI component libraries.** The serious "looks like a real SaaS out of the box" libraries — Mantine, shadcn/ui, Chakra UI, Ant Design, MUI — are all React-first. Svelte's equivalents (Skeleton, Flowbite-Svelte, shadcn-svelte) are real and improving but materially thinner, especially for dense SaaS surfaces (data tables, multi-step forms, command palettes, complex filters). Halo explicitly demands SaaS-grade polish — this is exactly where React's ecosystem advantage shows up.

2. **Charting.** Recharts, Visx, Nivo, Tremor, and Apache ECharts all have first-class React bindings; Tremor in particular is *literally a "SaaS dashboard" library*. Svelte charting is mostly LayerCake + raw D3 (more code to write) or wrappers around Chart.js/ECharts (workable but a step less idiomatic).

3. **Pendo familiarity and demo audience.** The viewers of this app are Pendo employees, customers, and pre-sales engineers. Most of them work in React shops, most Pendo customer apps are React, and Pendo's own docs and examples skew React. A React Halo is a more relatable demo surface.

4. **Pendo guide targeting is framework-agnostic, but DOM stability is not.** Pendo guides target CSS selectors / data attributes on rendered DOM. Both frameworks can produce stable selectors, but React's JSX makes it cheap to sprinkle `data-pendo-id` props everywhere and have them flow through component composition (e.g. a `<Button data-pendo-id="lists.create">` Button component that forwards data attributes). The Svelte equivalent works too but requires more `$$restProps` forwarding discipline in every leaf component.

5. **Form ecosystem.** Multi-step registration with validation maps directly onto React Hook Form + Zod, an extremely well-trodden combo. Svelte equivalents (Felte, Superforms, sveltekit-superforms) are good but more fragmented.

6. **LLM-assisted development.** Honest practical point for a one-person demo project: React code is overrepresented in LLM training data, so AI-assisted scaffolding is faster and more correct in React than in Svelte 5 (whose runes API shifted the surface area recently).

### When Svelte *would* be the right call (and isn't here)

- If bundle size were a hard constraint (it isn't — this is a demo running locally).
- If the app were content-driven SSR/SSG (it isn't — it's a client-only SPA).
- If reactivity ergonomics were the dominant value (they aren't — SaaS-shell polish is).

### Confidence

**HIGH** on the React-over-Svelte decision for this specific project. The combination of SaaS-UI ecosystem depth, charting library breadth, demo-audience familiarity, and the centrality of polished SaaS UI components in the requirements makes this a clear-cut call rather than a close one.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **React** | 18.3.x (or 19.x if stable) | UI framework | De facto SaaS frontend standard; deepest component + charting ecosystem; matches Pendo's customer base | HIGH |
| **TypeScript** | 5.4+ | Type safety | Catches the kinds of bugs that ruin demo days; required to make `data-pendo-id` patterns enforceable via component props | HIGH |
| **Vite** | 5.x | Build tool / dev server | Fast HMR, zero-config TS+JSX, the default modern SPA toolchain. No reason to deviate. | HIGH |
| **React Router** | 6.x (data router APIs) | Client-side routing | Standard for React SPAs; nested routes match the SaaS "shell + page" layout perfectly; loaders integrate cleanly with localStorage seeding | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Mantine** | 7.x | UI component library (primary recommendation) | Use as the base for *everything* — AppShell for the side-nav layout, forms, tables, modals, notifications, charts wrapper. Most "complete SaaS in a box" of the major React libs. | HIGH |
| **shadcn/ui + Tailwind** | latest | Alternative UI approach | Use *instead of* Mantine if you want to own component source and prefer Tailwind-first styling. Trade-off: more polish work, more flexibility. | HIGH |
| **Recharts** | 2.x | Charting (primary recommendation) | Bar / line / area / pie out of the box; SVG-rendered (selectable, Pendo-targetable); React-native API. Best balance of variety + simplicity for this project. | HIGH |
| **Tremor** | 3.x | Alternative charting + dashboard primitives | Consider if Mantine is *not* chosen — Tremor pairs well with shadcn/Tailwind and gives you dashboard cards + KPIs as components, not just raw charts. | MEDIUM |
| **React Hook Form** | 7.x | Form state + validation | Multi-step registration; minimal re-renders; integrates cleanly with Zod | HIGH |
| **Zod** | 3.x | Schema validation | Pairs with RHF via `@hookform/resolvers/zod`; also good for validating localStorage reads (untrusted data on disk) | HIGH |
| **Zustand** | 4.x | Lightweight global state | Auth/session, current workspace, sidebar collapsed state, theme. Don't reach for Redux — Zustand is the right size. | HIGH |
| **TanStack Table** | 8.x | Headless table primitives | Reports page (sortable, filterable tabular data with export buttons). Headless = full control over markup = stable Pendo selectors. | HIGH |
| **dayjs** | 1.x | Date formatting | Smaller than moment, simpler API than date-fns for this scope. (date-fns is also fine — pick one and stick.) | MEDIUM |
| **clsx** or **tailwind-merge** | latest | Class composition | Only if going the shadcn/Tailwind route. Skip if using Mantine. | HIGH |
| **nanoid** | 5.x | ID generation | Generating stable IDs for tasks, lists, workspaces in localStorage seed/CRUD. Don't roll your own. | HIGH |
| **@faker-js/faker** | 8.x | Fake data seeding | Realistic-looking task titles, user names, project names for demos. Critical for "looks like a real SaaS" feel. | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vite** | Dev server + build | `npm create vite@latest halo-app -- --template react-ts` is the starting line |
| **ESLint** | Linting | Use `eslint-plugin-react-hooks` + `@typescript-eslint`; skip a11y plugin per project Out-of-Scope (a11y is explicitly deferred) |
| **Prettier** | Formatting | Default config is fine for a demo; don't bikeshed |
| **Vitest** (optional) | Testing | Only if/when tests are added — not required for a demo-surface project |

---

## Installation

```bash
# Scaffold
npm create vite@latest halo-app -- --template react-ts
cd halo-app

# Routing + state
npm install react-router-dom zustand

# UI library (pick ONE — Mantine recommended)
npm install @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/dates @mantine/charts @tabler/icons-react
# ...OR the shadcn/Tailwind path (run separately, not both):
# npm install -D tailwindcss postcss autoprefixer
# npx tailwindcss init -p
# npx shadcn@latest init
# (then `npx shadcn@latest add button card table dialog ...` as needed)

# Charts (skip @mantine/charts above if going Recharts directly)
npm install recharts

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Tables (reports page)
npm install @tanstack/react-table

# Utilities
npm install nanoid dayjs @faker-js/faker
```

> **Decision point at scaffold time:** Mantine *or* shadcn+Tailwind, not both. Mantine is the lower-effort path to SaaS polish. Shadcn is the lower-effort path to *custom-looking* SaaS polish. For Halo's "convincing fake SaaS" goal where speed matters more than visual differentiation, **Mantine is the primary recommendation.**

---

## Pendo Integration

This is the part most generic stack docs get wrong — Pendo integration in a React SPA has specific shape that needs to be locked in from day one.

### Snippet placement

The Pendo install script goes in `index.html`, **synchronously**, in the `<head>`, before the React bundle loads. The snippet itself is the standard async loader Pendo provides (it stubs `window.pendo` immediately, then fetches the agent in the background) — so it does *not* block first paint but it *is* guaranteed to exist by the time React mounts.

```html
<!-- index.html, in <head>, BEFORE the React script tag -->
<script>
  (function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track'];for(w=0,x=v.length;w<x;++w)(function(m){
      o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
  })('YOUR_API_KEY_HERE');
</script>
```

Keep `YOUR_API_KEY_HERE` as a single configurable constant. Per the project's Out-of-Scope, do NOT build a settings UI for the API key — a `const PENDO_API_KEY = '...'` in a config module that's injected into the snippet at build time is correct.

### When to call `pendo.initialize`

In a SaaS-shaped SPA there are **two distinct lifecycle moments**:

1. **App mount, user not signed in.** Call `pendo.initialize({ visitor: { id: 'VISITOR-UNIQUE-ID' } })` with an anonymous visitor ID (e.g. a `nanoid` persisted in localStorage on first load). This lets you measure pre-sign-up traffic, registration funnels, and Session Replay across the registration flow.

2. **Post sign-in / post sign-up.** Call `pendo.identify({ visitor: { id, email, ...metadata }, account: { id: workspaceId, name, ...metadata } })` to associate the anonymous visitor with the now-known user + workspace.

In React, the right home for this is a top-level `PendoProvider` component (or just a hook called inside the auth context provider). Conceptually:

```tsx
// src/pendo/PendoProvider.tsx
import { useEffect } from 'react';
import { useAuth } from '@/auth';

declare global { interface Window { pendo: any } }

export function PendoProvider({ children }: { children: React.ReactNode }) {
  const { user, workspace } = useAuth(); // from Zustand

  useEffect(() => {
    if (!window.pendo) return;
    if (user && workspace) {
      window.pendo.identify({
        visitor: { id: user.id, email: user.email, full_name: user.name, role: user.role },
        account: { id: workspace.id, name: workspace.name, plan: workspace.plan },
      });
    } else {
      // anonymous bootstrap
      window.pendo.initialize({
        visitor: { id: getOrCreateAnonId() },
      });
    }
  }, [user?.id, workspace?.id]);

  return <>{children}</>;
}
```

Key rules:

- **Call `initialize` exactly once per page load.** Subsequent identity changes go through `identify` or `updateOptions`, not another `initialize`.
- **Visitor + account IDs must be strings.** Generate them with `nanoid` at registration time and persist them in the localStorage user/workspace records.
- **React Router SPA route changes** are auto-detected by Pendo via History API hooks — no manual `pageLoad` calls needed unless you want explicit page boundaries. Document this assumption explicitly in code.

### Stable selectors for Pendo guides

Pendo guides target CSS selectors. The single biggest mistake in Pendo-instrumented SPAs is targeting on **brittle selectors** — auto-generated class hashes (CSS-in-JS, Tailwind utility class strings, Mantine's hashed class names), DOM positions (`nav > div > button:nth-child(3)`), or text content (`button:contains('Save')`, which breaks under i18n even though we're not localizing).

**The pattern Halo should adopt from line one:**

```tsx
// Every meaningful interactive element gets a stable, hierarchical data attribute
<Button data-pendo-id="registration.step-2.submit">Next</Button>
<Button data-pendo-id="lists.create-task">+ New Task</Button>
<Button data-pendo-id="settings.profile.save">Save changes</Button>
<a data-pendo-id="nav.dashboard" href="/dashboard">Dashboard</a>
```

Pendo guides then target `[data-pendo-id="lists.create-task"]` — unbreakable under CSS refactors, library upgrades, or class hash changes.

**Naming convention:**

```
<page-or-feature>.<subarea>.<element>
e.g. nav.sidebar.help
     dashboard.charts.velocity
     reports.filters.date-range
     lists.row.<task-id>.complete   // dynamic per-row
     team.invite.email-input
```

**Implementation strategy:**

- Build a thin wrapper around Mantine's `Button`, `TextInput`, `Anchor`, etc. that accepts `data-pendo-id` as a required prop (or a typed enum) and forwards it to the underlying DOM. Optional but recommended: a TypeScript union type listing every valid ID so refactors are catchable.
- For chart elements (where Recharts renders SVG `<rect>` / `<path>` per data point), wrap charts in a container `<div data-pendo-id="dashboard.charts.velocity">` and rely on stable axis labels for sub-targeting. Don't try to target individual chart bars — they're recomputed on every render.
- For dynamic lists (tasks, team members), parameterize: `data-pendo-id="lists.row.complete"` plus `data-pendo-item-id={task.id}` — Pendo can target the class of rows, and Session Replay still captures the specific row interacted with.

### Page Categorization

Pendo auto-tracks pages by URL. The router structure should reflect Pendo "page" boundaries:

```
/                      → marketing/landing (probably skip)
/signup                → registration step 1
/signup/details        → registration step 2 (good funnel boundary)
/signup/company        → registration step 3
/signup/preferences    → registration step 4
/signin                → sign-in
/app                   → authenticated shell (redirect to /app/dashboard)
/app/dashboard         → dashboard
/app/lists             → lists
/app/reports           → reports
/app/team              → team
/app/settings          → settings
/app/help              → help
```

The `/signup/<step>` URL structure makes the registration funnel a clean, out-of-the-box Pendo funnel definition.

### Confidence

**HIGH** on snippet placement, initialize/identify lifecycle, and data-attribute strategy — these are well-established Pendo patterns.

---

## LocalStorage Persistence Pattern

The app is single-browser, no sync, no backend. LocalStorage is the entire persistence layer.

**Recommendation: hand-rolled, NOT a library.** Hear me out.

The candidates considered:

| Option | Verdict |
|--------|---------|
| Hand-rolled `JSON.stringify` + `JSON.parse` behind a typed module | **Recommended** — total surface area is ~50 lines, zero deps, full control |
| `zustand/middleware/persist` | Excellent for the *Zustand store itself* (auth, UI prefs). Use it for that. |
| `idb-keyval` / Dexie / IndexedDB | Overkill — data volumes are trivial (a few hundred fake tasks max) |
| `localforage` | Adds async API surface for no benefit at this scale |

**The pattern:**

```ts
// src/storage/repo.ts
import { z } from 'zod';

const TaskSchema = z.object({ id: z.string(), title: z.string(), /* ... */ });
type Task = z.infer<typeof TaskSchema>;

const KEY = 'halo.tasks.v1';  // version the key — schema migrations later become trivial

export const tasksRepo = {
  list(): Task[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try { return z.array(TaskSchema).parse(JSON.parse(raw)); }
    catch { return []; } // corrupted data → reset, don't crash the demo
  },
  save(tasks: Task[]) { localStorage.setItem(KEY, JSON.stringify(tasks)); },
  // create / update / delete are list() → mutate → save()
};
```

**Key rules:**

1. **Version every key** (`halo.tasks.v1`, `halo.user.v1`, `halo.workspace.v1`). When the schema changes, bump to v2 and write a migration — never silently break old localStorage in a way that bricks a demo.
2. **Validate reads with Zod.** LocalStorage is "untrusted input" in the sense that older code may have written different shapes. Parse, don't trust.
3. **Use `zustand/middleware/persist` for the Zustand store** (auth/session, UI prefs) — it handles serialization and hydration cleanly.
4. **Don't store the Pendo API key in localStorage.** It's a compile-time constant.
5. **Seed on first run.** When `tasksRepo.list()` returns empty and the user has just signed up, seed ~30 fake tasks with `@faker-js/faker` so the dashboard charts have shape immediately. Critical for "looks like a real SaaS" feel — empty states are demo-killers.

### Confidence

**HIGH** — this is the standard pattern for client-only SPAs of this scope.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **React** | Svelte 5 | If a future variant of this project is content/marketing-heavy with SSR; or if the developer is specifically practicing Svelte. For this Halo, no. |
| **Mantine** | shadcn/ui + Tailwind | If you want to own component source code, prefer utility-first styling, or want the app to look more visually distinctive. Higher polish-effort budget. |
| **Mantine** | Chakra UI v3 | Valid but smaller dashboard-specific surface than Mantine. Pick Mantine over Chakra for *this* project. |
| **Mantine** | MUI (Material UI) | MUI works but Material design language reads as "Google product" not "modern SaaS." Mantine looks more like a real B2B SaaS. |
| **Mantine** | Ant Design | Reads as "enterprise Chinese SaaS." Fine if that's the vibe; Mantine is more neutral. |
| **Recharts** | Apache ECharts (`echarts-for-react`) | If you need exotic chart types (gauges, radar, sankey, treemap, geo). For dashboard basics, Recharts wins on API ergonomics. |
| **Recharts** | Visx / Nivo | Both excellent but more code per chart. Use if you want to demonstrate bespoke visualizations. |
| **Recharts** | Tremor | Strong contender if you go shadcn/Tailwind — Tremor is specifically built for dashboards and is shadcn-aesthetic-compatible. With Mantine, stick with Recharts (or `@mantine/charts` which is a Recharts wrapper). |
| **Zustand** | Redux Toolkit | Overkill for this scope. Redux is for large teams needing time-travel debugging and middleware ecosystems. |
| **Zustand** | Jotai / Valtio | Both are fine choices. Zustand has the broadest community familiarity, which matters for a demo project that other people might read. |
| **Zustand** | React Context only | Workable for *just* auth, but you'll want a real store as soon as you need persistence middleware and selective subscriptions for the lists page. |
| **React Hook Form** | Formik | Formik is in maintenance mode; RHF is the active standard. Don't use Formik in 2026. |
| **React Hook Form** | TanStack Form | New, promising, but smaller community. Pick RHF for stability. |
| **React Router** | TanStack Router | Genuinely good and type-safe. React Router has the wider community/familiarity. Either works. |
| **Hand-rolled localStorage** | Dexie / IndexedDB | Only if data volume grows beyond ~5MB or you need indexing. For a few hundred fake tasks, localStorage is correct. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App (CRA)** | Officially deprecated; no longer maintained | Vite |
| **Next.js** | This is a client-only SPA, not an SSR app; Next.js adds a server runtime that doesn't fit "no backend" constraint | Vite + React Router |
| **Formik** | Maintenance mode for several years | React Hook Form |
| **Redux (classic) / Redux Saga** | Way too much ceremony for this scope; saga is rarely the right tool now | Zustand (or Redux Toolkit if you genuinely need it, which you don't here) |
| **moment.js** | Mutable API, large bundle, in maintenance mode | dayjs or date-fns |
| **Chart.js (vanilla)** | Renders to canvas — Pendo *cannot* target individual chart elements in a canvas, and Session Replay captures canvas as a flat image. SVG-based charting is materially better for Pendo demos. | Recharts (SVG) or Visx (SVG) |
| **Highcharts** | Commercial license restrictions; overkill | Recharts |
| **react-router v5** | Old API; v6 data-router APIs are materially better | react-router-dom v6 (or 7 if stable) |
| **CSS-in-JS at runtime (Emotion, styled-components) as the *primary* styling system** | Class-name hashes change between builds, which breaks Pendo selectors if you ever try to target on class. Use data attributes anyway — but also prefer libraries (Mantine, Tailwind) whose stable structures don't tempt you to target classes in the first place. | Mantine's styles API (resolved at build time) or Tailwind |
| **localStorage without versioned keys** | A schema change silently corrupts old demo state | Versioned keys (`halo.tasks.v1`) + Zod-validated reads |
| **Targeting Pendo guides on auto-generated CSS classes** | They break on the next build | Always target `[data-pendo-id="..."]` |
| **Initializing Pendo inside `useEffect` of every route component** | Causes multiple `initialize` calls, breaks Session Replay | Initialize once at app root; use `identify` for subsequent identity changes |

---

## Stack Patterns by Variant

**If the project later needs server-side persistence (it shouldn't, per Out-of-Scope):**
- Add a thin BFF (e.g. an Express server or Cloudflare Worker) behind the existing `tasksRepo` interface.
- Because the repo module is the only thing that touches `localStorage`, swapping in a fetch-based implementation is a contained change.
- This is *why* the repo pattern is recommended over scattered direct `localStorage` calls.

**If demo audiences want to share state across devices (also out of scope):**
- Same — swap repo implementations. The pattern survives.

**If the polish-effort budget is high and visual differentiation matters:**
- Take the shadcn/ui + Tailwind + Tremor path instead of Mantine.
- Expect 2–3x more component work but a more distinctive look.

**If a Pendo-side requirement appears that specifically needs Web Components / Shadow DOM:**
- Don't. Pendo's agent targets light DOM. If shadow DOM ever comes up, that's a red flag, not a feature.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 18.x | react-router-dom 6.x | Stable, well-trodden pairing |
| React 18.x | Mantine 7.x | Mantine 7 requires React 18; do not use Mantine 6 (older API) |
| React 18.x | Recharts 2.x | Stable |
| React 18.x | React Hook Form 7.x + Zod 3.x + @hookform/resolvers 3.x | The canonical trio |
| Vite 5.x | React 18 plugin (`@vitejs/plugin-react`) | Default for React-TS template |
| Zustand 4.x | `zustand/middleware/persist` for localStorage | Included in the package; no separate install |
| TypeScript 5.x | All above | All libraries above ship types |

> If React 19 has shipped stable by the time you install: all libraries above either already support it or have it in flight. Re-verify Mantine and Recharts specifically against React 19 at install time.

---

## Sources

This research session ran without network access (WebSearch / WebFetch / Bash were all denied), so all claims here are sourced from training data and labeled with confidence per row. Recommended verification at install time:

- React / Vite / TypeScript versions — `npm view <pkg> version` and `react.dev` / `vitejs.dev` release notes
- Mantine — `mantine.dev` (verify v7 is still current line)
- Recharts — `recharts.org` and GitHub releases (verify v2 line and React 18+ support)
- React Hook Form — `react-hook-form.com`
- Zustand — `github.com/pmndrs/zustand` (verify v4 line)
- **Pendo install / initialize patterns** — `support.pendo.io` "Installing the Pendo install script" and "Initializing the Pendo install script" articles (these are the canonical references for snippet placement, initialize vs identify, and visitor/account ID shape). Verify the snippet code in this doc against the current Pendo article — Pendo occasionally updates the loader.
- **Pendo guide targeting** — `support.pendo.io` "Best practices for guide targeting" / "Using CSS selectors in guides" articles. Verify the data-attribute pattern recommendation is still current Pendo guidance.

---
*Stack research for: Fake-SaaS SPA (Pendo instrumentation playground)*
*Researched: 2026-05-13*
