/**
 * Signup wizard — Step 2 (About you).
 *
 * AUTH-03 + step-2 half of AUTH-06. Captures Job title / Role / Years of
 * experience / Location. Renders the locked UI-SPEC heading `A bit about you`.
 *
 * Gates entry on `hasStep(draft, 'step1')` — deep-linking without prior
 * step-1 completion silently redirects to `/signup`. On valid submit,
 * advances to `/signup/company`. Back navigates to `/signup`, persisting
 * current values (even invalid) into the draft per UI-SPEC's
 * `Back does NOT re-validate.` rule.
 *
 * Mirrors Plan 02-07's Step1AccountPage shape: RHF + zodResolver(step2Schema)
 * + sessionStorage rehydration + wrapped Mantine primitives + PENDO_IDS leaves.
 * Step 2 differs by adding a Back button (variant="default", no color prop —
 * renders gray per UI-SPEC `Color > Forbidden uses of indigo`).
 *
 * The bottom-of-form `Sign in` footer anchor is rendered by `SignupShell` for
 * every step — DO NOT re-render it here.
 *
 * No `pendo.*` runtime is invoked; `data-pendo-id` markup is inert until
 * Phase 6 retrofits the agent.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router'
import { Stack, Group, Title } from '@mantine/core'
import { TextInput, Select, NumberInput, Button } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import {
  step2Schema,
  type Step2Values,
  readWizardDraft,
  writeWizardDraftStep,
  hasStep,
} from '../../../auth'

const ROLE_OPTIONS = [
  'Product',
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Other',
] as const

export function Step2DetailsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const draft = readWizardDraft()

  // Gate: must have completed step 1 first. Deep-linking to /signup/details
  // without step-1 data redirects silently to the wizard root.
  if (!hasStep(draft, 'step1')) {
    return <Navigate to="/signup" replace />
  }

  const form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    // Validation fires on Continue click — matches UI-SPEC "validates on Next" rhythm.
    mode: 'onSubmit',
    defaultValues: {
      jobTitle: '',
      role: undefined,
      yearsExperience: undefined,
      location: '',
      ...(draft.step2 ?? {}),
    } as Partial<Step2Values> as Step2Values,
  })

  const onSubmit = form.handleSubmit((values) => {
    writeWizardDraftStep('step2', values)
    navigate('/signup/company')
  })

  const onBack = () => {
    // Per UI-SPEC: Back persists current values (even invalid) into the draft,
    // then navigates. This is `Back does NOT re-validate` — typed but
    // unsubmitted input is preserved across step navigation.
    writeWizardDraftStep('step2', form.getValues() as Partial<Step2Values>)
    navigate('/signup')
  }

  return (
    <Stack gap="md">
      <Title order={2}>A bit about you</Title>
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            {...form.register('jobTitle')}
            label="Job title"
            placeholder="Senior product manager"
            error={form.formState.errors.jobTitle?.message}
            pendoId={PENDO_IDS.signup.step2.jobTitle}
          />
          <Select
            label="Role"
            placeholder="Select your role"
            data={ROLE_OPTIONS as unknown as string[]}
            value={form.watch('role') ?? null}
            onChange={(value) =>
              form.setValue('role', (value ?? '') as Step2Values['role'], {
                shouldValidate: false,
              })
            }
            error={form.formState.errors.role?.message}
            pendoId={PENDO_IDS.signup.step2.role}
          />
          <NumberInput
            label="Years of experience"
            placeholder="5"
            min={0}
            max={60}
            value={form.watch('yearsExperience') ?? ''}
            onChange={(value) =>
              form.setValue(
                'yearsExperience',
                typeof value === 'number' ? value : Number(value),
                { shouldValidate: false },
              )
            }
            error={form.formState.errors.yearsExperience?.message}
            pendoId={PENDO_IDS.signup.step2.yearsExperience}
          />
          <TextInput
            {...form.register('location')}
            label="Location"
            placeholder="Berlin, Germany"
            error={form.formState.errors.location?.message}
            pendoId={PENDO_IDS.signup.step2.location}
          />
          <Group justify="space-between" mt="xl">
            <Button
              type="button"
              variant="default"
              onClick={onBack}
              pendoId={PENDO_IDS.signup.step2.back}
            >Back</Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              pendoId={PENDO_IDS.signup.step2.submit}
            >Continue</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
