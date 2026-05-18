/**
 * Sign-in page (`/signin`).
 *
 * AUTH-09 (the sign-in flow itself) + the user-visible verification of AUTH-10
 * (refresh-survives-auth: after this page sets the session via the auth
 * store, refreshing `/app` stays signed-in — Plan 02-05's synchronous
 * hydration closes that loop) + the page-level invocation point of AUTH-11's
 * `signOut` (the handler ships in `authStore.ts`; the visible top-bar
 * Sign-out button is a Phase 3 surface per UI-SPEC's explicit deferral note
 * — Phase 2 verifies AUTH-11 end-to-end via `useAuthStore.getState().signOut()`
 * from the browser console).
 *
 * The form is RHF-controlled with `signinSchema` (Plan 02-02) as the resolver
 * — same email-validity + non-empty checks as the wizard but with the
 * locked sign-in-side password-empty copy `Enter your password.` (note the
 * different message from sign-up's `Enter a password.` — the schema owns
 * the copy split).
 *
 * On valid submit we call `useAuthStore.getState().signInWithCredentials(email,
 * password)` (Plan 02-05). The store-level action performs the
 * `findVisitorByEmail` + `verifyPassword` + `setSession` sequence and returns
 * a discriminated `{ ok: true } | { ok: false; reason: 'invalid_credentials' }`.
 *
 *   - On `{ ok: true }`: `navigate('/app', { replace: true })`.
 *   - On `{ ok: false }`: render the form-level `<Alert color="red"
 *     variant="light">` with the locked copy
 *     `Email and password don't match. Try again.` ABOVE the Paper. UI-SPEC
 *     explicitly forbids surfacing which credential is wrong — the generic
 *     form-level Alert mitigates username enumeration (threat T-02-45).
 *
 * SignInPage is NOT a child of `SignupShell` — it has its own Container and
 * is not part of the wizard (no Stepper, no draft state, no Back button).
 *
 * The page does NOT invoke any Pendo runtime API — Phase 6 retrofits the
 * agent's identify-on-success call onto the success branch. Every interactive
 * control sources `pendoId` from `PENDO_IDS.signin.*` (the typed `pendoId`
 * prop on the wrapped primitives enforces this at the type level).
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { Container, Stack, Paper, Title, Text, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { TextInput, PasswordInput, Button, Anchor } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { signinSchema, type SigninValues, useAuthStore } from '../../auth'

export function SignInPage(): React.JSX.Element {
  const navigate = useNavigate()
  // Discriminated local state for the form-level credential error. Cleared on
  // every new submit attempt so the user can retry without the prior Alert
  // sticking. Typed as a literal union (not string) so future contributors
  // can't accidentally surface a leaked error message through this slot —
  // mirrors the T-02-42-mitigation pattern Plan 02-09 used for `submitError`.
  const [credError, setCredError] = useState<null | 'invalid_credentials'>(null)

  const form = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: '', password: '' },
    // Validation fires on Sign-in click only, not on every keystroke — matches
    // the UI-SPEC "validates on submit" rhythm shared with the wizard pages.
    mode: 'onSubmit',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setCredError(null)
    const result = await useAuthStore
      .getState()
      .signInWithCredentials(values.email, values.password)
    if (result.ok) {
      if (typeof pendo !== 'undefined') {
        const auth = useAuthStore.getState()
        pendo.track('signin_completed', {
          visitorId: auth.currentVisitor?.id ?? '',
          workspaceId: auth.currentWorkspace?.id ?? '',
        })
      }
      navigate('/app', { replace: true })
      return
    }
    // result.ok === false; reason is 'invalid_credentials' for ALL failure
    // modes (Plan 02-05 collapses "user not found", "wrong password", and the
    // defensive "missing workspace" branch into one variant — username
    // enumeration mitigation T-02-45 at the API surface).
    if (typeof pendo !== 'undefined') {
      pendo.track('signin_failed', {
        failureReason: result.reason,
      })
    }
    setCredError(result.reason)
  })

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Welcome back</Title>
        {credError === 'invalid_credentials' && (
          <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
            Email and password don't match. Try again.
          </Alert>
        )}
        <Paper withBorder radius="md" p="xl">
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                {...form.register('email')}
                label="Email"
                placeholder="you@example.com"
                error={form.formState.errors.email?.message}
                pendoId={PENDO_IDS.signin.email}
              />
              <PasswordInput
                {...form.register('password')}
                label="Password"
                error={form.formState.errors.password?.message}
                pendoId={PENDO_IDS.signin.password}
              />
              {/*
                UI-SPEC: "The primary <Button> is fullWidth only on /signin
                (single-action page)." mt="xl" matches the wizard's
                last-field-to-action-row rhythm (32px).
              */}
              <Button
                type="submit"
                fullWidth
                loading={form.formState.isSubmitting}
                pendoId={PENDO_IDS.signin.submit}
                mt="xl"
              >Sign in</Button>
            </Stack>
          </form>
        </Paper>
        <Text size="sm" c="dimmed" ta="center">
          Don't have an account?{' '}
          <Anchor href="/signup" pendoId={PENDO_IDS.signin.signupAnchor}>Create one</Anchor>
        </Text>
      </Stack>
    </Container>
  )
}
