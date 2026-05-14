/**
 * SignupShell — Phase 2 signup wizard layout.
 *
 * Renders the Mantine `<Stepper>` plus a `<Paper>` whose child is the active
 * step page mounted via `<Outlet />`. The Stepper's `active` index is derived
 * from `useLocation().pathname` — NOT from form state — per Phase 2 UI-SPEC.
 * This means the visual is always in sync with the URL: a refresh on
 * `/signup/company` lands the user on step 3 with the Stepper highlighted,
 * even if step 1's data is missing from sessionStorage (in which case the
 * step page's own deep-link logic will redirect back to /signup).
 *
 * The page-level `<Title order={1}>Create your Halo account</Title>` is
 * rendered ONLY on the `/signup` index path. UI-SPEC: "On /signup/details,
 * /signup/company, /signup/preferences the Display title is replaced by the
 * Stepper as the page identity — no Display heading on steps 2–4." Each
 * step page renders its own `<Title order={2}>` step heading.
 *
 * The shell ALSO renders the "Already have an account? Sign in" anchor row
 * at the bottom of the Container — UI-SPEC's Anchor copy table lists this
 * row for `/signup (and steps 2-4)`, so the shell hosts it once for all
 * four step routes. The Anchor uses the `signup.step1.signinAnchor` PENDO_IDS
 * entry across all four steps (the registry intentionally defines only one
 * signin-anchor under step1).
 *
 * Layout decisions (locked by UI-SPEC "Layout > Wizard shell"):
 *   - Container size="sm" py="xl" — overrides PublicLayout's size="lg"
 *     default so form width caps at 576px on desktop.
 *   - Paper withBorder radius="md" p="xl" — borders, not shadows, per the
 *     Phase 2 surface-separation rule.
 *   - Stepper labels: short two-word maximum, matching UI-SPEC "Account",
 *     "About you", "Company", "Setup".
 *   - The Stepper carries data-pendo-id="signup.stepper" sourced from
 *     PENDO_IDS — funnel-conversion anchor for Phase 6.
 *
 * The shell does NOT render a Back/Next button group — those belong INSIDE
 * each step page (rendered by `<Outlet />`) because the Next button's
 * `onClick` validates that step's form. The UI-SPEC ASCII diagram places
 * them inside the Paper, i.e. inside the step page.
 *
 * Stability contract: this shell is a Phase 2 scaffold that survives Wave 3.
 * Step plans (02-07..09) replace the BODIES of their respective StepNXPage
 * files — they MUST NOT modify this shell. If a step plan needs to change
 * the shell, it's a planning bug.
 */

import { Outlet, useLocation } from 'react-router'
import { Container, Stepper, Paper, Title, Stack, Text } from '@mantine/core'
import { Anchor } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'

/**
 * Maps the current `pathname` to the Stepper's `active` index (0..3).
 * Defaults to 0 on unknown paths — unreachable in practice because
 * `src/router.tsx` only registers the four matching paths, but the
 * fallback keeps the Stepper from ever rendering an undefined index.
 */
function pathToStepIndex(pathname: string): number {
  // WR-06: strict equality (with optional trailing-slash variant), NOT
  // startsWith. A future nested route like /signup/details/edit or
  // /signup/company-confirm would silently match the wrong step under
  // startsWith and highlight the wrong Stepper position.
  if (pathname === '/signup' || pathname === '/signup/') return 0
  if (pathname === '/signup/details' || pathname === '/signup/details/') return 1
  if (pathname === '/signup/company' || pathname === '/signup/company/') return 2
  if (pathname === '/signup/preferences' || pathname === '/signup/preferences/') return 3
  return 0
}

export function SignupShell(): React.JSX.Element {
  const { pathname } = useLocation()
  const active = pathToStepIndex(pathname)
  const isIndex = pathname === '/signup' || pathname === '/signup/'

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {isIndex && <Title order={1}>Create your Halo account</Title>}
        <Stepper active={active} data-pendo-id={PENDO_IDS.signup.stepper}>
          <Stepper.Step label="Account" />
          <Stepper.Step label="About you" />
          <Stepper.Step label="Company" />
          <Stepper.Step label="Setup" />
        </Stepper>
        <Paper withBorder radius="md" p="xl">
          <Outlet />
        </Paper>
        <Text size="sm" c="dimmed" ta="center">
          Already have an account?{' '}
          <Anchor href="/signin" pendoId={PENDO_IDS.signup.step1.signinAnchor}>
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}
