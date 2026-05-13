# Pitfalls Research

**Domain:** Fake multi-tenant SaaS SPA (Halo) for Pendo experimentation — frontend-only, localStorage persistence, instrumented for events, guides, feature adoption, Session Replay
**Researched:** 2026-05-13
**Confidence:** MEDIUM-HIGH (Pendo API surface and SPA/localStorage failure modes are well-established; external doc verification unavailable in this session — confirm Pendo agent version-specific behaviors against current Pendo support articles before locking each phase)

---

## Critical Pitfalls

### Pitfall 1: Calling `pendo.initialize()` before a visitor ID exists, then never re-identifying

**What goes wrong:**
The Pendo snippet is dropped in `index.html` and `pendo.initialize({ visitor: { id: '...' } })` fires immediately on first paint — before the user has signed up or signed in. Halo registration is a multi-step flow, so on first page load there is no real visitor or account yet. The app either (a) skips `initialize` entirely until login, breaking the marketing-funnel use case and losing pre-auth events, or (b) initializes with `null`/`undefined`/an empty string and Pendo stamps that into the visitor record, then never updates it after login — every authenticated session is glued to a broken anonymous shadow visitor.

**Why it happens:**
Builders treat `pendo.initialize` like Google Analytics — fire-and-forget at boot. They miss that Pendo has a distinct lifecycle: anonymous visitor first, then `pendo.identify()` (or a fresh `initialize`) once you know who the user is. Halo's multi-step registration makes the gap obvious: the user spends 3-5 steps as "someone we don't know yet" before becoming a real visitor + account.

**How to avoid:**
- On first load (no stored auth), call `pendo.initialize()` with an **anonymous visitor** — either omit `visitor.id` entirely (Pendo agent generates one and persists it in its own cookie/localStorage), or use a deterministic anonymous ID like `anon-<uuid>` stored in localStorage so the same browser stays the same anonymous visitor across reloads.
- On successful sign-in / completed registration, call `pendo.identify({ visitor: { id, email, ... }, account: { id, ... } })` to upgrade the anonymous visitor to a real one. Pendo will stitch the anonymous history to the identified visitor.
- Never pass `null`, `undefined`, empty string, or the literal string `"undefined"` as `visitor.id`. Validate before the call.

**Warning signs:**
- Pendo dashboard shows hundreds of visitors with IDs like `null`, `undefined`, or auto-generated anon strings that should have been upgraded.
- Funnel from "registration step 1 → signed in" shows zero conversions because the two halves are different visitor IDs.
- `pendo.getVisitorId()` in the console returns something different than expected after login.

**Phase to address:**
Pendo wiring phase (the one that integrates the snippet) — but the contract must be defined in the auth/registration phase, because that phase owns the moment the visitor becomes "real."

---

### Pitfall 2: Stale identity after sign-out / sign-in as a different user

**What goes wrong:**
User A signs out, User B signs in on the same browser. The page does a client-side route change (not a full page reload), so the Pendo agent — which was initialized for User A — keeps running with User A's `visitor.id` and `account.id`. Every event B fires is attributed to A. In Session Replay, B's session shows up under A's name. Account-level metadata (User B's company) never updates.

**Why it happens:**
SPAs don't naturally reload on auth changes. Builders assume `pendo.identify()` after sign-in will "just work," but they forget the sign-out path. Worse, some patterns call `pendo.initialize` a second time mid-session, which the agent may treat as a no-op or warn about depending on the agent version.

**How to avoid:**
- On sign-out, choose one of these explicitly and document the choice:
  1. **Hard reload to `/`** — simplest, guarantees a clean Pendo init. Acceptable for Halo because demos benefit from a clean reset.
  2. **`pendo.clearSession()` followed by re-init as anonymous** — keeps the SPA feel but resets visitor identity. Verify with current Pendo docs that `clearSession` is the supported API for the agent version you ship.
- On sign-in after sign-out (or sign-in as a different user), call `pendo.identify({ visitor, account })` with the new IDs. If the agent is already initialized for someone else, `identify` is the right call (not `initialize` again).
- Treat the auth state and the Pendo identity as a single derived value — whenever `currentUser` changes in app state, push the change to Pendo in the same effect.

**Warning signs:**
- Session Replay sessions list shows the same visitor ID for back-to-back sessions that were clearly different users.
- `pendo.getVisitorId()` after sign-in-as-B still returns A's ID.
- Account metadata on a visitor record is from their previous workspace.

**Phase to address:**
Auth phase (defines sign-out semantics) and Pendo wiring phase (implements the agent calls).

---

### Pitfall 3: Pendo not seeing SPA route changes — events all bucket on the landing URL

**What goes wrong:**
Halo is a side-nav SPA. The user navigates Dashboard → Lists → Reports → Settings without a full reload. Pendo's default page-tracking heuristics may not fire on `pushState` / `replaceState` depending on agent config, or they fire but all events get attributed to the first URL because location wasn't refreshed in time. Page Tagging in Pendo Subscription UI then has nothing meaningful to tag, and feature/page analytics are useless.

**Why it happens:**
The Pendo install script's default behavior around SPA route changes has varied across agent versions and depends on subscription settings (e.g., "Use Hash" / "Listen for History API events"). Builders enable Pendo, click around, see *some* events flow in, and assume it's all working — without checking that page transitions are actually being recorded as distinct page loads.

**How to avoid:**
- Pick a router-aware integration pattern and apply it on every route change:
  - In React Router: subscribe to the location change and call `pendo.location.useHash()` is not the right call here — instead, the modern pattern is to let Pendo auto-detect History API changes, but **explicitly verify** in the network tab that a new `data?...` request fires on every route change. If it doesn't, fall back to calling `pendo.pageLoad()` (or the current equivalent in your agent version) manually on each route transition.
  - In SvelteKit: hook into `afterNavigate` from `$app/navigation` and trigger the same.
- Set up Pendo Page Tagging in the Subscription early — even tag one page like `/dashboard` — and watch for that page to start receiving views. If it doesn't, the route signal is broken.
- Use unique, stable URL patterns per page (`/dashboard`, `/lists/:id`, `/reports`, `/settings`, `/team`, `/help`). Avoid stuffing everything behind `/#` hash routes unless you've consciously enabled hash mode in Pendo.
- Confirm against current Pendo docs (Capture events in single-page applications) which exact API your installed agent version uses — Pendo has shipped multiple SPA helpers over the years (`pendo.location.setUrl`, `pendo.pageLoad`, automatic History API listener).

**Warning signs:**
- Pendo Analytics shows one page accounting for 95%+ of views.
- All events are attributed to the entry URL even though the user clearly clicked through multiple pages.
- Feature usage in feature-adoption analytics looks identical regardless of which page hosts the feature.

**Phase to address:**
Router/shell phase (sets the navigation pattern) and Pendo wiring phase (installs the listener).

---

### Pitfall 4: Selectors that aren't stable enough for guides — guides go flaky on every redeploy

**What goes wrong:**
Halo's UI library (whatever React/Svelte component kit is chosen) generates hashed CSS class names like `css-1a2b3c4`, or wraps interactive elements in deeply nested divs whose structure changes when the library updates. Guides built against these selectors target the right element on day one and fall off on day two. Pre-sales demos break live in front of customers.

**Why it happens:**
Builders tag for Pendo *after* the UI is built and pick whatever selector Pendo's auto-tagging suggests — usually a class chain or nth-child path. Both are fragile. Hashed class names rotate. nth-child breaks when an item is added or removed. Component libraries restructure their internal DOM between minor versions.

**How to avoid:**
- Add a stable `data-pendo` attribute (or `data-testid` re-used for Pendo) to every interactive element that any guide, feature, or track event will target: nav links, primary CTAs, form fields, list rows, settings toggles, chart elements where possible.
- Naming convention: `data-pendo="<page>-<region>-<element>"` e.g. `data-pendo="dashboard-stat-card-active-projects"`, `data-pendo="lists-row-action-delete"`. Document the convention in a single file.
- When tagging features/guides in Pendo, prefer `[data-pendo="..."]` selectors. Treat hashed class selectors as a smell that means "the markup wasn't designed for Pendo."
- For UI library components that don't accept arbitrary attributes on the root, wrap them in a `<span data-pendo="...">...</span>` or use the library's `slotProps` / `inputProps` / `forwardedAs` mechanism.
- Lock the UI library version (no `^` ranges) and only bump deliberately, with a tagging-regression check.

**Warning signs:**
- Guides that worked yesterday don't activate today, despite no code change in your repo (transitive dep bumped the UI lib).
- The element picker in Pendo highlights three different elements when you click the "same" thing across sessions.
- The selector Pendo's Visual Design Studio shows is mostly class hashes and nth-child indices.

**Phase to address:**
Foundation phase (decide the `data-pendo` convention before any UI is built) and every page-building phase (apply the convention as a definition-of-done item).

---

### Pitfall 5: Storing email + password in localStorage in a way that looks like a real auth flow

**What goes wrong:**
Halo is a fake app, so storing a "password" in localStorage is explicitly in scope. But the obvious implementation — `localStorage.setItem('users', JSON.stringify([{ email, password: 'plaintext' }]))` — produces two failure modes: (1) anyone who screenshots devtools during a demo sees a plaintext password and the audience now distrusts the demo, (2) if the project is ever cloned or screen-recorded and pushed publicly, it looks like a real app that mishandles credentials, which is a bad look for a Pendo employee's repo.

**Why it happens:**
Builders think "it's fake, who cares" and skip even the cosmetic protections. Or they over-engineer and reach for `bcrypt` in the browser, which is wasted complexity for a demo.

**How to avoid:**
- Hash with a cheap one-way function before storing — even `SHA-256` via `crypto.subtle.digest` is enough. Don't store the plaintext password anywhere, even briefly.
- Add a visible banner / footer note: "Demo app — no real authentication. Data is stored in your browser only." This both protects the demo's credibility and prevents misleading anyone.
- Never accept a real-looking corporate email + password combo as if it were a real login — the registration form should accept any email and any password.
- Don't reuse this pattern in any documentation example or README snippet that could be lifted into a real app.

**Warning signs:**
- Devtools → Application → Local Storage shows a plaintext password during a demo.
- A reviewer says "wait, you're storing passwords in plain text?" — at that point the demo is over, the audience is now thinking about your security choices, not Pendo.

**Phase to address:**
Auth phase.

---

### Pitfall 6: localStorage schema with no version field — first breaking change wipes every existing demo user

**What goes wrong:**
v1 of Halo stores users as `{ email, password, name }`. v2 splits `name` into `firstName` and `lastName`. v3 adds `workspaceId`. Every redeploy that ships a schema change either (a) crashes on read because the old shape doesn't match what the code expects, or (b) silently treats the old data as new, producing `undefined` workspace IDs that get sent to Pendo as account ID `undefined`.

**Why it happens:**
LocalStorage feels free and unversioned, so builders skip the migration step they would never skip with a real database. Each demo browser has its own version of the data, and you can't run a centralized migration.

**How to avoid:**
- Every top-level localStorage key gets a versioned envelope: `{ version: 3, data: {...} }`. Or use a single root key `halo:state` with `{ version, ...slices }`.
- On app boot, read the version, run any necessary migration functions (`v1 -> v2`, `v2 -> v3`, ...), then write the upgraded shape back. Migrations are pure functions, easy to test.
- On version-unknown / corrupt JSON / quota error, show a "Reset demo" button that clears localStorage and reloads. Better than a white screen mid-demo.
- Use a tiny wrapper (Zustand's `persist` middleware, or a hand-rolled `loadState`/`saveState` pair) — never call `localStorage.setItem` directly from feature code.

**Warning signs:**
- "It works on my machine but breaks on yours" — different browsers have different schema versions.
- Random `Cannot read property X of undefined` errors that only happen on returning users.
- After a redeploy, a colleague says the demo is broken; their fix is "I cleared localStorage."

**Phase to address:**
Foundation / persistence phase (define the envelope and migration runner before any persisted data exists).

---

### Pitfall 7: Hitting localStorage quota mid-demo because seeded data is too generous

**What goes wrong:**
To make charts look impressive, the seed generates 500 projects × 50 tasks × 20 comments. Serialized to JSON, this blows past the ~5MB per-origin localStorage quota in some browsers (Safari is the usual offender). Saves silently fail or throw `QuotaExceededError`. The UI shows stale data, or a write that the user just made disappears on reload.

**Why it happens:**
LocalStorage has no warning system. Writes either succeed or throw. Builders don't measure size during development, and Chrome's quota is generous enough to mask the problem until someone runs the demo in Safari.

**How to avoid:**
- Keep seeded data modest — dozens of projects, hundreds of tasks total, not thousands. Charts look real with realistic-but-bounded data.
- Wrap all localStorage writes in try/catch. On `QuotaExceededError`, surface a non-blocking toast: "Storage full — reset demo to continue." Don't swallow it silently.
- Optionally measure on boot: `new Blob([JSON.stringify(state)]).size` and warn if over ~3MB (leaves headroom for Pendo's own localStorage usage and the user's interactions).
- For genuinely large fake datasets (e.g., reports with thousands of rows), generate them in-memory at runtime from a seed rather than persisting them.

**Warning signs:**
- Edits don't persist across reload, but no error appears in the console (Chrome) or a `QuotaExceededError` appears (Safari).
- Application → Storage in devtools shows usage near the quota limit.
- The demo works in Chrome and fails in Safari.

**Phase to address:**
Foundation / seed-data phase.

---

### Pitfall 8: Two browser tabs of Halo open at once — they fight each other

**What goes wrong:**
Demo person opens `/dashboard` in one tab, then opens `/settings` in another to show off settings. Both tabs have an in-memory store hydrated from localStorage. Tab 2 edits the workspace name. Tab 1 still shows the old name, and when Tab 1 next saves anything (e.g., reorders a list), it overwrites Tab 2's change with its stale in-memory state.

**Why it happens:**
LocalStorage is shared across tabs of the same origin, but in-memory app state isn't. Without a `storage` event listener, each tab is unaware of the other. Builders rarely test the two-tab case because they only opened one tab during dev.

**How to avoid:**
- Subscribe to `window.addEventListener('storage', ...)` and on relevant key changes, either (a) re-hydrate the affected slice of state, or (b) show a banner "This workspace was updated in another tab — reload to see latest" and disable writes until reload.
- For Halo's demo purpose, option (b) is fine and obvious — the demo isn't expected to support concurrent editing.
- Document the single-tab recommendation in the help / README.

**Warning signs:**
- Demo person says "wait, where did my change go?" — the change went to Tab 2 and Tab 1's next save clobbered it.
- Two tabs show different visitor IDs in Pendo because both initialized differently.

**Phase to address:**
Foundation / persistence phase (storage-event listener); Pendo wiring phase (visitor ID across tabs).

---

### Pitfall 9: Mid-session metadata updates that never reach Pendo

**What goes wrong:**
User edits their name on the Settings page from "Colin" to "Colin M." The local state updates, the UI re-renders, but Pendo still has "Colin" attached to the visitor. Same for workspace name changes, role changes, plan changes. The whole point of Halo as a Pendo demo is to exercise metadata flows, and the metadata silently drifts from what the app shows.

**Why it happens:**
Pendo metadata is set once at `initialize` / `identify` and developers forget there's a separate API call required to update it later. The form's `onSubmit` handler updates app state but not Pendo.

**How to avoid:**
- After any successful write that changes a value Pendo cares about (visitor name/email/role, account name/plan/size), call `pendo.identify({ visitor: { ... }, account: { ... } })` with the updated fields. Pendo merges, so you can pass only the changed fields plus the IDs.
- Centralize this: a `syncPendoMetadata(state)` function called from a single effect that subscribes to the relevant slice of state. Don't sprinkle `pendo.identify` calls across feature code.
- Build a tiny "Pendo Debug" panel (only visible in dev) that shows the current `pendo.getVisitorId()`, `pendo.getAccountId()`, and last-set metadata — makes drift obvious during testing.

**Warning signs:**
- Settings page shows "Colin M." but Pendo's visitor record still says "Colin."
- Custom field metadata in Pendo never changes despite the user editing it in the app.

**Phase to address:**
Settings phase + Pendo wiring phase.

---

### Pitfall 10: Multi-step registration with no history-state model — back button and refresh break the funnel

**What goes wrong:**
The 4-step registration is implemented as a single `/register` URL with an internal `step` state variable. The browser back button takes the user out of registration entirely (back to landing) instead of to the previous step. Refresh on step 3 drops them back to step 1 with all input lost. From Pendo's funnel-building perspective, this is fatal: there's nothing to build a funnel against because every step lives at the same URL, and the user paths in Pendo show a single registration page view that converts or doesn't.

**Why it happens:**
Multi-step forms feel like "one logical thing" so builders make them one route. They worry that distinct routes would feel jarring. They forget that Pendo funnels typically depend on either distinct page views or distinct named events at each step.

**How to avoid:**
- Either give each step its own URL (`/register/identity`, `/register/personal`, `/register/company`, `/register/preferences`) — best for Pendo, lets you build a page-based funnel, supports back/forward/refresh natively. **Recommended for Halo.**
- Or keep one URL but fire an explicit `pendo.track('registration_step_2_viewed')` event on each step entry, and build the funnel from track events. Acceptable but requires persisting in-progress form state to sessionStorage to survive refresh.
- Persist in-progress registration to sessionStorage (not localStorage — registration shouldn't survive a tab close) so refresh in the middle doesn't lose data either way.
- On step 1, capture an anonymous visitor ID so the in-progress registration is attributable in Pendo even before sign-up completes.

**Warning signs:**
- Refreshing on step 3 sends the user back to step 1.
- Browser back from step 3 navigates to the homepage instead of step 2.
- In Pendo funnel builder, the registration steps aren't visible as distinct stages.

**Phase to address:**
Registration / auth phase.

---

### Pitfall 11: Side-nav SPA without deep-linking — every refresh dumps the user back to dashboard

**What goes wrong:**
The shell renders different pages by swapping a state variable rather than changing the URL, or it uses hash routing that Pendo's page tagging doesn't recognize. Refresh in the middle of `/reports` lands on `/dashboard`. Sharing a link to a specific report doesn't work (not that anyone would share it — it's a fake app — but it breaks the demo's realism). Pendo page analytics sees one URL.

**Why it happens:**
Builders prototype with a "tab" mental model rather than a "route" mental model. Or they reach for a quick router setup that defaults to hash routes without realizing Pendo needs to know about it.

**How to avoid:**
- Use a real router with History API URLs (`react-router-dom`, `@tanstack/router`, SvelteKit) from day one. Don't ship the tab-state hack.
- Every page is a route. Side-nav active state is computed from `location.pathname`, not from an internal "selected tab" variable.
- Configure your dev server (Vite) and any hosting target to fall back to `index.html` for unknown paths so direct deep-link entry works.
- Same `data-pendo` convention applies to nav items: `data-pendo="nav-dashboard"`, `data-pendo="nav-lists"`, etc.

**Warning signs:**
- Refreshing on a non-home page 404s or lands you back on home.
- The URL bar never changes as the user navigates.
- The browser back button doesn't move backward through pages.

**Phase to address:**
Shell / router phase.

---

### Pitfall 12: Canvas-based charts that Session Replay can't show meaningfully and guides can't target

**What goes wrong:**
A chart library that renders to `<canvas>` (Chart.js without the SVG plugin, some Highcharts modes, ECharts default) produces zero queryable DOM inside the chart. Pendo guides can target the wrapping div, but not "the bar for May." Session Replay shows the rendered pixels but no DOM interactions inside the chart — hovers, tooltip activations, click-on-segment events are invisible to event tracking. Replays of canvas charts can also be heavier (more frequent canvas snapshots) and depending on agent settings may or may not capture canvas content faithfully.

**Why it happens:**
Builders pick the chart library on feature richness or default look, not on Pendo-friendliness. Canvas is a common default because it scales better with thousands of data points — which Halo doesn't have.

**How to avoid:**
- Prefer **SVG-based** charting libraries: Recharts (React), Visx (React), LayerCake (Svelte), D3-driven custom SVG, Chart.js with the `svg-chartjs` adapter. Confirm framework fit in `STACK.md`.
- For each chart, make the legend, axis labels, and any interactive controls (range pickers, segment toggles) regular DOM elements outside the canvas/SVG so they're guide-targetable and event-trackable.
- If a canvas chart is unavoidable for a specific viz, wrap it with a DOM overlay of `data-pendo`-tagged "hotspots" for the segments you want to track.
- Verify in Pendo Session Replay early — record a session with a chart on screen and confirm it's intelligible at playback.

**Warning signs:**
- In Replay, charts appear as a black box or look out of sync with the rest of the page.
- You can't build a guide that points at a specific chart element.
- Replay file size is suspiciously large on chart-heavy pages.

**Phase to address:**
Stack / charting phase (library choice); Dashboard / Reports phases (apply the SVG-DOM-overlay pattern).

---

### Pitfall 13: PII or sensitive-looking values flowing into Pendo metadata and Session Replay

**What goes wrong:**
Halo is a fake app, but the registration form captures email, name, company, phone. If these are passed verbatim to `pendo.identify` and Session Replay captures the form field values, the demo accidentally exfiltrates real-looking data to the Pendo subscription used for the demo. If real Pendo employees, customers, or test users register with their actual email/company, those identifiers end up in the analytics. Future colleagues see this and reasonably ask: "wait, is this PII or fake?"

**Why it happens:**
The demo's seed data is fake, but registration is open-ended — anyone can type anything. Builders don't think of Pendo's data plane as a sink for whatever the user types.

**How to avoid:**
- Add Pendo Session Replay masking attributes (`data-pendo-mask` or equivalent — check current Pendo Replay docs for the exact attribute name in your agent version) to password fields and any sensitive-looking inputs by default. Verify masking is working before any external demo.
- In `pendo.identify`, prefer hashed or pseudonymous visitor IDs (e.g., `hash(email)` rather than raw email) if you suspect real emails will be entered. For internal-only Halo use, raw values are fine but documented.
- Add a visible "demo data only" banner on the registration form: "Use fake credentials — this app is a Pendo demo surface, not a real service."
- Confirm with Pendo's privacy / data residency docs which fields are stored and where, before any external customer demo.

**Warning signs:**
- A Pendo visitor record contains a real email of a real Pendo customer.
- Session Replay shows a typed-out password (mask wasn't applied).
- A colleague's company name from a one-off demo run appears in Pendo's account list.

**Phase to address:**
Auth / registration phase + Pendo wiring phase.

---

### Pitfall 14: Scope creep — building real product features that distract from the Pendo demo

**What goes wrong:**
Builder gets excited and ships a real-feeling Kanban view, drag-and-drop reordering with animations, rich-text comments, file uploads (to data URLs in localStorage), a full role-permission matrix. Each took a week. None of them serve the Pendo demo any better than a static list with a few buttons would have. The roadmap balloons. The Pendo-instrumentation work — the actual point of the project — slips.

**Why it happens:**
Halo's hook is "look like a real SaaS" so any feature that increases realism feels justified. The Pendo-demo purpose is abstract ("exercise the full Pendo suite") and concrete product features are easier to specify and ship. Builder rewards their own engineering taste over the project's stated goal.

**How to avoid:**
- Every feature passes the "what Pendo capability does this exercise?" test. If the answer is "none — it just looks nice" the feature is a no.
- Out-of-scope list in `PROJECT.md` is honored — no real OAuth, no real backend, no real third-party integrations. Treat that list as load-bearing.
- The roadmap prioritizes Pendo-readiness over product depth: a thin set of pages with rich instrumentation beats a deep set of pages with shallow instrumentation.
- After each milestone, audit: did this milestone add new Pendo demoable surface, or did it just polish existing surface?

**Warning signs:**
- The roadmap has a "drag-and-drop reordering" task with no corresponding Pendo demo story.
- Pendo wiring is in "Phase 6" and you're shipping Phase 4 enhancements.
- A pre-sales engineer would shrug at the latest milestone because nothing new is demoable in Pendo.

**Phase to address:**
Every phase — scope discipline is a transition check, not a one-time decision.

---

### Pitfall 15: Pendo snippet API key hardcoded in the repo, then accidentally shared publicly

**What goes wrong:**
The Pendo snippet template includes an API key (subscription key) inline: `pendo.initialize({ apiKey: 'abc123' })`. Builder hardcodes it in `index.html` or a constant. Repo gets shared with a customer, pushed to a public GitHub, or screenshared. Customer is now sending their own usage data to your Pendo subscription, or vice versa. The key is rotatable but it's a friction event.

**Why it happens:**
The project is "frontend-only, no secrets" so builders don't reach for `.env`. The Pendo key is technically not a secret (it's in every visitor's page source) but it shouldn't be in a shared repo without thought.

**How to avoid:**
- Read the Pendo key from `import.meta.env.VITE_PENDO_API_KEY` (Vite) or equivalent. Ship a `.env.example` with a placeholder. Add `.env` to `.gitignore`.
- For the demo's convenience, allow a hardcoded fallback to a "demo" subscription key, but document it.
- If sharing the repo externally, instruct viewers to use their own subscription key.

**Warning signs:**
- The repo contains a literal Pendo API key string.
- A customer demo accidentally writes events into the wrong subscription.

**Phase to address:**
Pendo wiring phase.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Direct `localStorage.setItem` calls in feature code | Quick to write | Schema migrations become impossible; every key has its own format | Never — wrap in a tiny persistence module from day one |
| Single `/register` URL with internal step state | Feels like one cohesive form | Funnels break, back/refresh break, no Pendo page distinction per step | Never — split into routes or fire explicit step events |
| Hashed CSS class selectors for Pendo tagging | Fast to set up via auto-tagger | Every UI lib update breaks every guide | Never for production demos; acceptable in throwaway exploration |
| `pendo.initialize` called once at boot with a real ID hardcoded for testing | Easy local testing | Forgets to switch to dynamic identification; ships with test ID | Only inside a dev-mode guard |
| Storing plaintext passwords in localStorage | Two lines of code | Looks bad in any screenshot or repo share | Never — at minimum hash via Web Crypto |
| Canvas charts because the library default | Chart looks fine immediately | Replay and guides are crippled on every chart-heavy page | Only when wrapped with DOM hotspot overlays |
| No `version` field in persisted state | Faster initial build | First schema change wipes or corrupts every demo user's data | Never |
| Hardcoded Pendo API key | One less env-var setup step | Shows up in screenshares; cross-contaminates subscriptions on repo share | Only in private dev branches, never on `main` |
| Skipping `storage` event listener | One fewer effect to write | Two-tab demos clobber each other silently | Acceptable if a "one tab only" notice is shown prominently |
| Faking auth without a sign-out path | One screen less to design | Sign-out / sign-in-as-someone-else cases produce stale Pendo identity | Never — sign-out must exist and must reset Pendo cleanly |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Pendo snippet** | Place snippet inside `<body>` or after app JS; init runs after the agent loader hasn't | Place the snippet in `<head>` per Pendo install docs so the agent is ready before the app's `initialize` call |
| **Pendo `initialize` in SPA** | Call once at boot with the first user's ID and never again | Initialize anonymous; `identify` on login; `identify` again on metadata change; reset on logout |
| **Pendo route tracking** | Assume auto-detection works; never verify | Verify a new `data?...` request fires on every route change. If not, call the SPA page-load API explicitly per the agent version's docs |
| **Pendo guide selectors** | Auto-tag via the Visual Design Studio against hashed classes | Tag against `[data-pendo="..."]` attributes that the codebase owns |
| **Pendo Session Replay** | Leave default masking — sensitive inputs leak into replays | Add Pendo's mask attribute (verify current attribute name in docs) to password / sensitive fields; verify in a recorded session |
| **Pendo feature adoption** | Tag features only on the page where they live; ignore cross-page features | Tag features by interaction class (e.g., "any delete action") via consistent `data-pendo` naming |
| **localStorage** | Write objects with `JSON.stringify(obj)` and read with `JSON.parse` with no try/catch | Wrap reads in try/catch; on parse failure, fall back to defaults; log to console; offer "Reset demo" |
| **localStorage across tabs** | Assume in-memory state is authoritative | Listen to `storage` event; reconcile or warn |
| **Vite env vars** | Use `process.env.PENDO_KEY` (Node-style) — undefined in browser | Use `import.meta.env.VITE_PENDO_API_KEY` and prefix with `VITE_` |
| **React Router / SvelteKit** | Use hash routing by default | Use History API routing so URLs are real and Pendo page-tagging works |
| **UI library theming** | Bump UI lib minor version → DOM restructure → broken guides | Pin UI lib version; bump deliberately with a guide-regression smoke test |

---

## Performance Traps

Halo is a demo with one user per browser, so most "scale" issues don't apply. The ones that do:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Oversized seed dataset | Slow initial load; localStorage near quota; charts lag | Bound seed: ~50 projects, ~500 tasks max, generated, not persisted in full | At Safari's ~5MB localStorage cap |
| Re-serializing entire app state on every keystroke | Sluggish form input; localStorage thrash | Debounce persistence (e.g., 250ms) or persist per-slice on commit, not per-keystroke | When state > 100KB and user types fast |
| Pendo agent loading synchronously in `<head>` and blocking first paint | Slow time-to-interactive on the registration page | Use Pendo's async install pattern (the official snippet is async by default — don't remove the `async`) | Always — keep the snippet as-shipped by Pendo |
| Re-rendering the whole app on every Pendo identify | UI jank during login | Don't drive React/Svelte state from Pendo callbacks; treat Pendo as a sink, not a source | When `identify` is called in a render path |
| Session Replay capturing canvas-heavy dashboards | Replay file size balloons; capture is partial | Prefer SVG charts; if canvas, accept partial replay fidelity for those areas | On chart-heavy pages |
| Infinite re-identification loop | Pendo identify called every render; subscription bills suspiciously high | Only call `identify` inside an effect that depends on identity-changing state | When `identify` is called in render |

---

## Security Mistakes

Domain-specific. General OWASP web security is out of scope for a no-backend demo.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Plaintext passwords in localStorage | Devtools screenshot embarrassment; misleading impression of a real service | Hash via `crypto.subtle.digest('SHA-256', ...)`; banner "demo, no real auth" |
| No XSS-safe handling of fake user-entered data (names with `<script>`) | A demo viewer types `<img onerror=alert(1)>` as their name and breaks the demo | Always render user-entered strings as text, never as HTML; React/Svelte do this by default — don't reach for `dangerouslySetInnerHTML` / `{@html}` |
| Hardcoded Pendo API key in public repo | Cross-subscription contamination; key rotation needed | `.env` + `.env.example`; `.gitignore` `.env` |
| Real PII (emails, company names) flowing to Pendo from registration | Pendo subscription stores data you don't want there | Mask inputs in Session Replay; "demo data only" banner on registration; pseudonymous visitor IDs if needed |
| Pendo Resource Center surfacing markdown/HTML that pulls in third-party scripts | Demo loads unexpected code from external CDN | Resource Center content authored entirely within Pendo's UI, not pulled from external URLs |
| Local "role" check that's only enforced in the UI | Anyone editing localStorage becomes "admin" | Acceptable for Halo — demo only. Document explicitly: "all roles are cosmetic; no security guarantee." |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| First-load Pendo guide fires before the user has any context | User dismisses without reading; guide analytics are misleading | Gate the welcome guide behind an account-age check (e.g., `daysSinceCreated < 1`) or a track-event trigger |
| Side-nav with no active state | User loses orientation across page transitions | Compute active state from `location.pathname`; highlight the current item |
| Multi-step registration with no progress indicator | User abandons because they don't know how many steps remain | "Step 2 of 4" indicator; visual progress bar; consistent with each step's distinct URL |
| Refresh kills in-flight form data | User retypes everything; abandons | Persist in-progress forms to sessionStorage during the flow; clear on completion |
| "Demo data only" but no visible disclaimer | Viewer wonders if data is real; trust erodes | Persistent footer or banner: "Demo. Local-storage only." |
| Empty state on Lists / Reports the first time you sign up | Page looks broken | Seed every new account with believable starter data on first login |
| "Saved!" toast on every keystroke | Notification fatigue | Persist silently; show a toast only on explicit save actions (e.g., settings) |
| Sign-out button hidden in a sub-menu | Demo person can't find it on stage | Sign-out visible in the top bar or user menu, one click from anywhere |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces. Run this before declaring any phase done.

- [ ] **Registration:** Has each step its own URL? Does back/forward work? Does refresh on step 3 land on step 3 with state preserved (or at least step 1 with a clear message)?
- [ ] **Sign-in / Sign-out:** Does signing out then signing in as a different user produce a fresh Pendo visitor + account ID? Verify in `pendo.getVisitorId()` and `pendo.getAccountId()`.
- [ ] **Pendo init:** Is `initialize` called with an anonymous ID before login, then `identify` called with the real ID on login? Verify by registering a new user and watching the Pendo network calls.
- [ ] **Route tracking:** Does every page transition fire a Pendo `data?...` request? Verify in the Network tab clicking through the side nav.
- [ ] **Metadata sync:** Edit your name on Settings — does the Pendo visitor record update? Edit workspace name — does the account record update?
- [ ] **Stable selectors:** Does every interactive element have a `data-pendo` attribute? Spot-check by running `document.querySelectorAll('[data-pendo]').length` and compare to expectations.
- [ ] **Guide targetability:** Pick three elements at random across pages and confirm Pendo's Visual Design Studio resolves them via `[data-pendo="..."]`, not via class hash.
- [ ] **Session Replay masking:** Record a session, type a fake password, watch replay — is the field masked?
- [ ] **Schema versioning:** Open a previous-version localStorage state in the current build — does migration run? Does it survive a corrupt JSON value gracefully?
- [ ] **Multi-tab:** Open Halo in two tabs, edit workspace name in tab 2, switch back to tab 1 — does tab 1 reflect the change or warn?
- [ ] **localStorage quota:** Run the seed and check `JSON.stringify(state).length` is well under 3MB.
- [ ] **Pendo API key:** Is it loaded from env, not hardcoded? Is `.env` in `.gitignore`?
- [ ] **Canvas vs SVG charts:** For each chart, can a Pendo guide target a meaningful element? Does Replay render the chart intelligibly?
- [ ] **Deep linking:** Refresh `/reports?from=2026-01-01` — does it land there with the filter applied?
- [ ] **Demo-data banner:** Is there a visible "demo data only" disclaimer somewhere persistent?

---

## Recovery Strategies

When pitfalls occur despite prevention.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pendo identity glued to `null` visitor ID for weeks | MEDIUM | Add an `identify` call on next login with the real ID; the broken visitor records remain in Pendo as orphans but new data flows correctly; optionally hide test/null visitors via a Pendo segment |
| Guides broken after UI lib bump | LOW–MEDIUM | Roll back UI lib pin; add `data-pendo` to the affected elements; re-target the guides in Pendo Visual Design Studio |
| LocalStorage quota hit during demo | LOW | "Reset demo" button; clears localStorage and re-seeds; demo continues |
| LocalStorage schema mismatch crash | LOW | Wrap reads in try/catch with reset fallback; ship the migration runner that should have been there |
| Stale identity after sign-out | LOW | Add `pendo.clearSession()` or hard-reload on sign-out; ship; orphan records in Pendo are cosmetic |
| Canvas chart unreviewable in Replay | MEDIUM | Replace the library on that one page with an SVG alternative; keep other charts as-is if the trade-off is fine |
| Hardcoded API key in shared repo | MEDIUM | Rotate the Pendo subscription key; migrate to env-loaded key; check git history hasn't preserved the old key in commits — if so, force-push history rewrite or accept it as low-value (Pendo keys aren't secret but rotate anyway) |
| Real PII in Pendo visitor records | MEDIUM–HIGH | Delete affected visitor records via Pendo's data deletion tools; switch to hashed visitor IDs going forward; document in repo README |
| Funnel doesn't work because registration is one URL | MEDIUM | Split into routes (preferred) or add explicit per-step `pendo.track` events (faster); rebuild the funnel in Pendo against the new signals |
| Two-tab clobbering | LOW | Add `storage` event listener + reconciliation, or display a "use one tab" warning |

---

## Pitfall-to-Phase Mapping

How the roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. `pendo.initialize` before visitor exists | Pendo wiring phase (contract defined in auth phase) | Network tab: first init has anonymous ID; post-login `identify` has real ID |
| 2. Stale identity after sign-out / sign-in | Auth phase + Pendo wiring phase | Sign out, sign in as B, check `pendo.getVisitorId()` returns B |
| 3. SPA route changes not seen by Pendo | Shell / router phase + Pendo wiring phase | Network tab: every nav click fires a Pendo page event |
| 4. Flaky guide selectors | Foundation phase (define `data-pendo` convention) + every page-building phase | `document.querySelectorAll('[data-pendo]').length` >= expected count per page |
| 5. Plaintext passwords in localStorage | Auth phase | Devtools → Application → Local Storage shows no plaintext; banner visible |
| 6. localStorage schema with no version | Foundation / persistence phase | Migration runner exists; tested on stale v1 state; corrupt JSON handled |
| 7. localStorage quota exhaustion | Foundation / seed-data phase | `JSON.stringify(state).length` under 3MB; quota error handled with toast |
| 8. Multi-tab state divergence | Foundation / persistence phase + Pendo wiring phase | `storage` event listener active; verified in two-tab smoke test |
| 9. Mid-session metadata not synced to Pendo | Settings phase + Pendo wiring phase | Edit name → `pendo.identify` fires with updated value; visible in Pendo within minutes |
| 10. Multi-step registration funnel broken | Registration / auth phase | Each step has its own URL; back/forward/refresh work; Pendo funnel resolves all four steps |
| 11. Side-nav SPA without deep-linking | Shell / router phase | Refresh on any non-home page lands on that page; URL changes on every nav |
| 12. Canvas charts unreviewable in Replay & guides | Stack phase (library choice) + Dashboard/Reports phases | Each chart has SVG output or DOM hotspot overlay; Replay smoke test passes |
| 13. PII / sensitive data flowing to Pendo | Auth / registration phase + Pendo wiring phase | Replay masking verified; visitor IDs are hashed or demonstrably fake |
| 14. Scope creep into real product features | Every phase | Each phase's milestone has at least one new Pendo demoable surface |
| 15. Hardcoded Pendo API key | Pendo wiring phase | Key loaded from `import.meta.env`; `.env.example` in repo; `.env` gitignored |

---

## Sources

- Pendo support / installation docs — referenced from prior integration experience; **verify against current Pendo support articles for the specific agent version Halo ships with**, especially:
  - "Installation script" / install-snippet placement and async behavior
  - "Capture events in single-page applications" — confirm whether automatic History API detection is on by default in current agent versions and what the explicit fallback API is (`pendo.pageLoad`, `pendo.location.setUrl`, or current equivalent)
  - "Tag features" / Visual Design Studio — confirm current best practice for stable selectors
  - "Session Replay" — confirm the current mask attribute name (`data-pendo-mask` vs alternative) and default masking behavior
  - "Pendo JS API" — confirm `pendo.identify`, `pendo.clearSession`, `pendo.getVisitorId`, `pendo.getAccountId` signatures
- MDN — `Window.localStorage`, `StorageEvent`, `QuotaExceededError`, `crypto.subtle.digest`
- Web Storage spec — per-origin quota behavior (~5MB practical floor, varies by browser; Safari most restrictive)
- React Router / SvelteKit routing docs — History API vs hash routing implications
- Personal/known integration experience: SPA + analytics-vendor identity lifecycle is a recurring class of bug across Pendo, Amplitude, Mixpanel, Segment, FullStory — the failure modes (stale identity, missing route events, flaky selectors) are vendor-agnostic and well-documented in this domain

**Confidence note:** Pitfalls 1–4 and 9–11 are HIGH confidence — they reflect well-established failure modes of Pendo + SPA integrations and SPA routing. Pitfalls 6–8 (localStorage quota, schema, multi-tab) are HIGH confidence — these are standard web platform behaviors. Pitfalls 12–13 (canvas/Replay, PII handling) are MEDIUM confidence pending verification against current Pendo Session Replay docs — specific attribute names and default behaviors have changed across agent versions. The remediation strategies (use SVG, mask sensitive fields) are correct regardless of API specifics.

---
*Pitfalls research for: Halo — fake multi-tenant SaaS SPA for Pendo experimentation*
*Researched: 2026-05-13*
