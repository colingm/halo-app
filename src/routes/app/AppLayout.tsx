import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router'
import {
  AppShell,
  Group,
  Stack,
  Box,
  Title,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
} from '@mantine/core'
import {
  IconLayoutDashboard,
  IconChecklist,
  IconChartBar,
  IconUsers,
  IconSettings,
  IconHelpCircle,
  IconChevronDown,
  IconUser,
  IconLogout,
} from '@tabler/icons-react'
import { NavLink } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { useAuthStore } from '../../auth'
import { seedDemoData } from '../../seed/seedAll'

/**
 * Active-route detection helper (per D-12 and UI-SPEC §"Navbar contents").
 *
 * Split rationale:
 *   - Dashboard ('/app'): strict equality only — '/app/lists' must NOT activate
 *     the Dashboard link. The index route has no path suffix, so any non-exact
 *     match would incorrectly highlight Dashboard on every sub-route.
 *   - All other targets: startsWith — forward-compat for Phase 4+ detail routes
 *     (e.g. '/app/lists/:id'). "Lists" stays highlighted when the user is on a
 *     task-detail page. This is the KEY DEVIATION from SignupShell's strict-equality
 *     approach (which uses equality because signup steps are lateral peers, not
 *     hierarchical parents of deeper routes).
 */
function isNavActive(
  pathname: string,
  target:
    | '/app'
    | '/app/lists'
    | '/app/reports'
    | '/app/team'
    | '/app/settings'
    | '/app/help',
): boolean {
  if (target === '/app') return pathname === '/app'
  return pathname.startsWith(target)
}

/**
 * Authenticated application shell — Phase 3 Mantine AppShell implementation.
 *
 * Delivers SHELL-01 (AppShell), SHELL-03 (user menu + sign-out), SHELL-04
 * (deep-link survives refresh — structurally satisfied by createBrowserRouter +
 * Vite SPA fallback from Phase 1).
 *
 * Phase 6 will mount <PendoRouteBridge /> here to report SPA route changes to
 * Pendo. Phase 3 deliberately does not include it.
 */
export function AppLayout(): React.JSX.Element {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const visitor = useAuthStore((s) => s.currentVisitor)
  const workspace = useAuthStore((s) => s.currentWorkspace)

  /**
   * Phase 3 D-04: seeding is gated on meta.seededAt; subsequent mounts are
   * no-ops. Module-init invocation (per authStore.ts pattern) is NOT used here
   * because the workspaceId is only known after auth hydration completes —
   * render-time keyed effect is the deliberate exception (see PATTERNS.md
   * §"Pattern S2").
   */
  useEffect(() => {
    if (workspace) seedDemoData(workspace.id)
  }, [workspace?.id])

  // Defensive narrowing — RequireAuth (Phase 2 lock) already redirects
  // unauthenticated users before AppLayout mounts. This Navigate is
  // belt-and-suspenders for TypeScript narrowing: it ensures visitor and
  // workspace are non-null for all subsequent JSX references.
  if (!visitor || !workspace) return <Navigate to="/signin" replace />

  const initials = `${visitor.firstName[0] ?? ''}${visitor.lastName[0] ?? ''}`.toUpperCase()

  const handleSignOut = async () => {
    // Navigate first so RequireAuth doesn't intercept the synchronous
    // isAuthenticated:false flush from signOut() and bounce through /signin.
    navigate('/', { replace: true })
    await useAuthStore.getState().signOut()
  }

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      header={{ height: 56 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Left: wordmark aligned to navbar column width */}
          <Box w={208}>
            <Title order={3} c="indigo.7" data-pendo-id={PENDO_IDS.topbar.logo}>
              Halo
            </Title>
          </Box>
          {/* Right: workspace name + user menu trigger */}
          <Group gap="md">
            <Text size="sm" c="dimmed" data-pendo-id={PENDO_IDS.topbar.workspaceName}>
              {workspace.companyName}
            </Text>
            <Menu>
              <Menu.Target>
                <UnstyledButton data-pendo-id={PENDO_IDS.topbar.userMenu.button}>
                  <Group gap={8}>
                    <Avatar size="sm" color="indigo" radius="xl">
                      {initials}
                    </Avatar>
                    <Text size="sm" fw={500}>
                      {visitor.firstName} {visitor.lastName}
                    </Text>
                    <IconChevronDown size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUser size={16} />}
                  data-pendo-id={PENDO_IDS.topbar.userMenu.profile}
                  onClick={() => navigate('/app/settings?tab=profile')}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  data-pendo-id={PENDO_IDS.topbar.userMenu.settings}
                  onClick={() => navigate('/app/settings')}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  data-pendo-id={PENDO_IDS.topbar.userMenu.signout}
                  onClick={handleSignOut}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={8}>
          <NavLink
            pendoId={PENDO_IDS.nav.dashboard}
            label="Dashboard"
            leftSection={<IconLayoutDashboard size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app')}
            variant="light"
            onClick={() => navigate('/app')}
          />
          <NavLink
            pendoId={PENDO_IDS.nav.lists}
            label="Lists"
            leftSection={<IconChecklist size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app/lists')}
            variant="light"
            onClick={() => navigate('/app/lists')}
          />
          <NavLink
            pendoId={PENDO_IDS.nav.reports}
            label="Reports"
            leftSection={<IconChartBar size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app/reports')}
            variant="light"
            onClick={() => navigate('/app/reports')}
          />
          <NavLink
            pendoId={PENDO_IDS.nav.team}
            label="Team"
            leftSection={<IconUsers size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app/team')}
            variant="light"
            onClick={() => navigate('/app/team')}
          />
          <NavLink
            pendoId={PENDO_IDS.nav.settings}
            label="Settings"
            leftSection={<IconSettings size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app/settings')}
            variant="light"
            onClick={() => navigate('/app/settings')}
          />
          <NavLink
            pendoId={PENDO_IDS.nav.help}
            label="Help"
            leftSection={<IconHelpCircle size={18} stroke={1.6} />}
            active={isNavActive(pathname, '/app/help')}
            variant="light"
            onClick={() => navigate('/app/help')}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
