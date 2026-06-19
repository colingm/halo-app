/**
 * Halo route map — two top-level branches: `/` (public) and `/app`
 * (authenticated shell).
 *
 * Phase 1 wired the bare shell:
 *   - `/`            → PublicLayout (DemoBanner + Container) → Landing
 *   - `/sandbox`     → PrimitivesSandbox (under PublicLayout)
 *   - `/app`         → AppLayout (Phase 3 replaced placeholder with Dashboard)
 *
 * Phase 2 added the following routes:
 *   - `/signup`               → SignupShell → Step1AccountPage      (index)
 *   - `/signup/details`       → SignupShell → Step2DetailsPage
 *   - `/signup/company`       → SignupShell → Step3CompanyPage
 *   - `/signup/preferences`   → SignupShell → Step4PreferencesPage
 *   - `/signin`               → SignInPage
 *
 * Phase 3 replaces the Phase 1 index with a real Dashboard and adds
 * five named children under AppLayout — the full authenticated route tree:
 *   - `/app`          → AppLayout → Dashboard (index)
 *   - `/app/lists`    → AppLayout → ListsPage
 *   - `/app/reports`  → AppLayout → ReportsPage
 *   - `/app/team`     → AppLayout → TeamPage
 *   - `/app/settings` → AppLayout → SettingsPage
 *   - `/app/help`     → AppLayout → HelpPage
 * AppPlaceholder.tsx has been deleted (replaced by Dashboard).
 *
 * The five new public routes are children of a `<RequireAnon>` wrapper-route
 * — signed-in users are redirected to `/app`. The `/` and `/sandbox` routes
 * are INTENTIONALLY NOT wrapped: per UI-SPEC, signed-in users can still
 * visit the public landing and primitive sandbox.
 *
 * `/app` is wrapped in `<RequireAuth>` — signed-out users are redirected to
 * `/signin` silently (no flash message per UI-SPEC's Guard-redirect copy).
 * AppLayout sits as a pathless intermediate layout-route so its `<Outlet />`
 * still mounts the index child.
 *
 * Phase 6 — NOT Phase 3 — adds PendoRouteBridge mounts inside PublicLayout
 * and AppLayout. Phase 3 deliberately does not include it.
 *
 * FND-03: History API routing (createBrowserRouter, NOT createHashRouter).
 * The Vite dev server's default SPA fallback serves index.html on every
 * path, so refreshing on `/app/reports` works without server-side
 * routing logic.
 */
import { createBrowserRouter } from 'react-router'
import { PublicLayout } from './routes/public/PublicLayout'
import { Landing } from './routes/public/Landing'
import { PrimitivesSandbox } from './routes/public/PrimitivesSandbox'
import { AppLayout } from './routes/app/AppLayout'
import { Dashboard } from './dashboard/Dashboard'
import { ListsPage } from './routes/app/lists/ListsPage'
import { ReportsPage } from './routes/app/reports/ReportsPage'
import { TeamPage } from './routes/app/team/TeamPage'
import { SettingsPage } from './routes/app/settings/SettingsPage'
import { HelpPage } from './routes/app/help/HelpPage'
import { HelpArticlePage } from './routes/app/help/HelpArticlePage'
import { AboutPage } from './routes/app/about/AboutPage'
import { RequireAuth, RequireAnon } from './auth'
import { SignupShell } from './routes/public/signup/SignupShell'
import { Step1AccountPage } from './routes/public/signup/Step1AccountPage'
import { Step2DetailsPage } from './routes/public/signup/Step2DetailsPage'
import { Step3CompanyPage } from './routes/public/signup/Step3CompanyPage'
import { Step4PreferencesPage } from './routes/public/signup/Step4PreferencesPage'
import { SignInPage } from './routes/public/SignInPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: PublicLayout,
    children: [
      {
        index: true,
        Component: Landing,
      },
      {
        path: 'sandbox',
        Component: PrimitivesSandbox,
      },
      {
        // RequireAnon wrapper-route — renders <Outlet /> when signed-out,
        // <Navigate to="/app" replace /> when signed-in. All five Phase 2
        // public routes (signup wizard + sign-in) live as children of this
        // wrapper so the guard is applied once.
        Component: RequireAnon,
        children: [
          {
            path: 'signup',
            Component: SignupShell,
            children: [
              { index: true, Component: Step1AccountPage },
              { path: 'details', Component: Step2DetailsPage },
              { path: 'company', Component: Step3CompanyPage },
              { path: 'preferences', Component: Step4PreferencesPage },
            ],
          },
          {
            path: 'signin',
            Component: SignInPage,
          },
        ],
      },
    ],
  },
  {
    path: '/app',
    // RequireAuth wraps the entire /app/* segment. When signed-out,
    // <Navigate to="/signin" replace /> fires before AppLayout mounts.
    Component: RequireAuth,
    children: [
      {
        // Pathless layout route — AppLayout is the visual shell (Mantine
        // AppShell + side nav + top bar), but contributes no path segment.
        // Its <Outlet /> renders the matching child: Dashboard for the index,
        // or the appropriate placeholder page for named children.
        Component: AppLayout,
        children: [
          { index: true,           Component: Dashboard },
          { path: 'lists',         Component: ListsPage },
          { path: 'reports',       Component: ReportsPage },
          { path: 'team',          Component: TeamPage },
          { path: 'settings',      Component: SettingsPage },
          { path: 'help',          Component: HelpPage },
          // D-07: First router.tsx edit since Phase 3 D-01 lock — flat sibling
          // shape used (not nested child) because HelpPage has no <Outlet />;
          // nesting would render the list above the detail simultaneously.
          // UI-SPEC line 840 explicitly accepts either nested or flat sibling shape.
          { path: 'help/:slug',   Component: HelpArticlePage },
          { path: 'about',        Component: AboutPage },
        ],
      },
    ],
  },
])
