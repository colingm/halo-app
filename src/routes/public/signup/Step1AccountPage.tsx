/**
 * Signup wizard — Step 1 (Account).
 *
 * AUTH-02 (step 1 capture) and the step-1 half of AUTH-06 (RHF + Zod inline
 * errors). Mounted at `/signup` inside the `SignupShell` layout (Plan 02-06).
 *
 * The form is RHF-controlled with `step1Schema` as the resolver. On valid
 * submit the page checks email + username uniqueness against `authRepo`; if
 * either field collides with an existing visitor we set a manual RHF error
 * with the UI-SPEC-locked copy and stay on `/signup`. Otherwise we persist
 * the step-1 slice into the sessionStorage wizard draft and navigate to
 * `/signup/details`.
 *
 * Uniqueness errors surface as inline Mantine errors (`error=` slot). The
 * email-collision message embeds an inline `<Anchor>Sign in instead?</Anchor>`
 * pointing at `/signin` — rendered as JSX through Mantine's ReactNode-capable
 * `error` prop, not via `dangerouslySetInnerHTML`.
 *
 * Every interactive control carries a `data-pendo-id` from
 * `PENDO_IDS.signup.step1.*` — the typed `pendoId` prop on the wrapped
 * primitives enforces this at the type level. No Pendo runtime is invoked
 * here (Phase 6 retrofits the agent).
 *
 * The bottom-of-form "Sign in" footer anchor is rendered by `SignupShell`
 * for every step — DO NOT re-render it here.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { Stack, Group, Title, Text } from '@mantine/core'
import { TextInput, PasswordInput, Button, Anchor } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import {
  step1Schema,
  type Step1Values,
  findVisitorByEmail,
  findVisitorByUsername,
  readWizardDraft,
  writeWizardDraftStep,
} from '../../../auth'

const EMAIL_DUPLICATE_MESSAGE = 'An account with this email already exists.'

export function Step1AccountPage(): React.JSX.Element {
  const navigate = useNavigate()
  const draft = readWizardDraft().step1 ?? {}
  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    // Validation fires on Next click only, not on every keystroke — matches the
    // UI-SPEC "validates on Next" behavior (Phase 2 form-field rhythm).
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      username: '',
      ...draft,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    // Uniqueness checks run AFTER Zod schema validation has passed — these are
    // page-handler concerns, not schema refinements (cf. Plan 02-02 notes).
    const emailDup = findVisitorByEmail(values.email)
    if (emailDup) {
      // The inline `<Anchor>Sign in instead?</Anchor>` anchor cannot be embedded
      // inside a plain-string message. We set a string-only message here and
      // render the anchor conditionally on the field below via an isDuplicate
      // boolean check against the locked copy.
      form.setError('email', { type: 'manual', message: EMAIL_DUPLICATE_MESSAGE })
      return
    }
    const usernameDup = findVisitorByUsername(values.username)
    if (usernameDup) {
      form.setError('username', {
        type: 'manual',
        message: 'That username is taken — try another.',
      })
      return
    }
    writeWizardDraftStep('step1', values)
    navigate('/signup/details')
  })

  const emailErr = form.formState.errors.email?.message
  const isEmailDuplicate = emailErr === EMAIL_DUPLICATE_MESSAGE

  return (
    <Stack gap="md">
      <Title order={2}>Create your Halo account</Title>
      <Text c="dimmed">
        Welcome to Halo. Tell us who you are and we'll get your workspace ready.
      </Text>
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            {...form.register('email')}
            label="Email"
            placeholder="you@example.com"
            description="We'll use this for sign-in. No real emails ever leave your browser."
            error={
              isEmailDuplicate ? (
                <span>
                  An account with this email already exists.{' '}
                  <Anchor
                    href="/signin"
                    pendoId={PENDO_IDS.signup.step1.signinAnchor}
                  >
                    Sign in instead?
                  </Anchor>
                </span>
              ) : (
                emailErr
              )
            }
            pendoId={PENDO_IDS.signup.step1.email}
          />
          <PasswordInput
            {...form.register('password')}
            label="Password"
            placeholder="At least 8 characters"
            description="Hashed locally and stored in your browser — there is no server."
            error={form.formState.errors.password?.message}
            pendoId={PENDO_IDS.signup.step1.password}
          />
          <TextInput
            {...form.register('firstName')}
            label="First name"
            placeholder="Ada"
            error={form.formState.errors.firstName?.message}
            pendoId={PENDO_IDS.signup.step1.firstName}
          />
          <TextInput
            {...form.register('lastName')}
            label="Last name"
            placeholder="Lovelace"
            error={form.formState.errors.lastName?.message}
            pendoId={PENDO_IDS.signup.step1.lastName}
          />
          <TextInput
            {...form.register('username')}
            label="Username"
            placeholder="ada"
            description="Visible on your profile and team page."
            error={form.formState.errors.username?.message}
            pendoId={PENDO_IDS.signup.step1.username}
          />
          {/* Step 1 has NO Back button per UI-SPEC "Page CTAs" table. */}
          <Group justify="flex-end" mt="xl">
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              pendoId={PENDO_IDS.signup.step1.submit}
            >Continue</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
