/**
 * Signup wizard — Step 4 (Setup) + wizard completion.
 *
 * AUTH-05 + the visible-flow half of AUTH-08 + step-4 half of AUTH-06.
 * Captures Primary use case / Team size / Top goals (multi-select capped at 3).
 *
 * On valid submit, performs the locked 7-step completion:
 *   1. re-validate prior steps (defense in depth — step1Schema/step2Schema/step3Schema)
 *   2. createVisitor (hashes password internally via authRepo)
 *   3. createWorkspace
 *   4. signInFromVisitor (writes session + updates store)
 *   5. clearWizardDraft
 *   6. navigate('/app', {replace:true})
 *
 * On failure, surfaces a form-level Alert with locked copy
 * `Something went wrong — please try again.` — wizard draft is NOT cleared on
 * failure so the user can retry. Plaintext password lives in sessionStorage
 * until clearWizardDraft runs — mitigation of T-02-17 from the threat model.
 *
 * No `pendo.*` runtime is invoked; `data-pendo-id` markup is inert until
 * Phase 6 retrofits the agent.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router'
import { Stack, Group, Title, Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { Select, NumberInput, MultiSelect, Button } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  type Step4Values,
  createVisitor,
  createWorkspace,
  useAuthStore,
  readWizardDraft,
  writeWizardDraftStep,
  clearWizardDraft,
  hasStep,
} from '../../../auth'

const USE_CASE_OPTIONS = [
  'Project management',
  'Task tracking',
  'Team coordination',
  'Personal productivity',
  'Just exploring',
] as const

const GOAL_OPTIONS = [
  'Ship faster',
  'Better visibility',
  'Less context switching',
  'Cleaner reporting',
  'Onboard the team',
  'Replace another tool',
] as const

export function Step4PreferencesPage(): React.JSX.Element {
  const navigate = useNavigate()
  const draft = readWizardDraft()

  // Gate: all three prior steps must be complete. Any miss → silent redirect
  // to wizard root per UI-SPEC "Error state — invalid step entry" rule.
  if (!hasStep(draft, 'step1') || !hasStep(draft, 'step2') || !hasStep(draft, 'step3')) {
    return <Navigate to="/signup" replace />
  }

  const [submitError, setSubmitError] = useState<null | 'generic_failure'>(null)

  const form = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    // Validation fires on Create account click — matches UI-SPEC "validates on Next" rhythm.
    mode: 'onSubmit',
    defaultValues: {
      primaryUseCase: undefined,
      teamSize: undefined,
      topGoals: [],
      ...(draft.step4 ?? {}),
    } as Partial<Step4Values> as Step4Values,
  })

  const onSubmit = form.handleSubmit(async (step4Values) => {
    setSubmitError(null)
    try {
      // Defense in depth — re-read the draft and re-validate every prior step
      // before write. Catches the race where a user opens DevTools mid-wizard
      // and tampers with sessionStorage between mount and submit (T-02-39).
      // .parse(...) (not .safeParse) throws on schema mismatch; the catch
      // surfaces the generic Alert rather than writing half-data.
      const freshDraft = readWizardDraft()
      const s1 = step1Schema.parse(freshDraft.step1)
      const s2 = step2Schema.parse(freshDraft.step2)
      const s3 = step3Schema.parse(freshDraft.step3)

      // Create the visitor — authRepo.createVisitor hashes the password
      // internally (Plan 02-03's contract). Returned Visitor has only
      // passwordHash; plaintext is never copied to the returned record.
      const visitor = await createVisitor({
        email: s1.email,
        password: s1.password,
        firstName: s1.firstName,
        lastName: s1.lastName,
        username: s1.username,
        jobTitle: s2.jobTitle,
        role: s2.role,
        yearsExperience: s2.yearsExperience,
        location: s2.location,
        primaryUseCase: step4Values.primaryUseCase,
        teamSize: step4Values.teamSize,
        topGoals: step4Values.topGoals,
      })

      // Create the workspace owned by the new visitor (synchronous).
      const workspace = createWorkspace({
        ownerVisitorId: visitor.id,
        companyName: s3.companyName,
        companySize: s3.companySize,
        industry: s3.industry,
        planTier: s3.planTier,
      })

      // Sign the user in — Plan 02-05's signInFromVisitor writes
      // halo:v1:session and updates the in-memory store atomically.
      useAuthStore.getState().signInFromVisitor(visitor, workspace)

      // Clear the wizard draft — the plaintext-password retention window
      // (T-02-17) ends here. sessionStorage[halo:v1:signup:draft] is removed.
      clearWizardDraft()

      // Redirect into the authenticated area. replace:true so the back button
      // from /app does not return to /signup/preferences.
      navigate('/app', { replace: true })
    } catch (err) {
      // Defense-in-depth Zod failure OR authRepo write failure OR an unexpected
      // throw inside signInFromVisitor. Either way, show the locked Alert copy
      // and stay on /signup/preferences. The wizard draft is intentionally NOT
      // cleared on failure — user can retry by clicking Create account again.
      console.error('[signup] completion failed:', err)
      setSubmitError('generic_failure')
    }
  })

  const onBack = () => {
    // Per UI-SPEC: Back persists current values (even invalid) into the draft,
    // then navigates. `Back does NOT re-validate` — typed but unsubmitted input
    // is preserved across step navigation.
    writeWizardDraftStep('step4', form.getValues() as Partial<Step4Values>)
    navigate('/signup/company')
  }

  return (
    <Stack gap="md">
      <Title order={2}>Set up your workspace</Title>
      {submitError === 'generic_failure' && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          Something went wrong — please try again.
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <Select
            label="What will you use Halo for?"
            placeholder="Pick what fits best"
            data={USE_CASE_OPTIONS as unknown as string[]}
            value={form.watch('primaryUseCase') ?? null}
            onChange={(value) =>
              form.setValue('primaryUseCase', (value ?? '') as Step4Values['primaryUseCase'], {
                shouldValidate: false,
              })
            }
            error={form.formState.errors.primaryUseCase?.message}
            pendoId={PENDO_IDS.signup.step4.useCase}
          />
          <NumberInput
            label="How many people on your team?"
            placeholder="5"
            min={1}
            max={10000}
            value={form.watch('teamSize') ?? ''}
            onChange={(value) =>
              form.setValue(
                'teamSize',
                typeof value === 'number' ? value : Number(value),
                { shouldValidate: false },
              )
            }
            error={form.formState.errors.teamSize?.message}
            pendoId={PENDO_IDS.signup.step4.teamSize}
          />
          <MultiSelect
            label="What are you hoping to get out of Halo?"
            placeholder="Pick up to three"
            description="Select up to three."
            data={GOAL_OPTIONS as unknown as string[]}
            value={form.watch('topGoals') ?? []}
            onChange={(values) =>
              form.setValue('topGoals', values as Step4Values['topGoals'], {
                shouldValidate: false,
              })
            }
            error={form.formState.errors.topGoals?.message}
            maxValues={3}
            pendoId={PENDO_IDS.signup.step4.goals}
          />
          <Group justify="space-between" mt="xl">
            <Button
              type="button"
              variant="default"
              onClick={onBack}
              pendoId={PENDO_IDS.signup.step4.back}
            >Back</Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              pendoId={PENDO_IDS.signup.step4.submit}
            >Create account</Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
