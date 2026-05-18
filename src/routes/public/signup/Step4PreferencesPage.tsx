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
  findVisitorByEmail,
  findVisitorByUsername,
  useAuthStore,
  readWizardDraft,
  writeWizardDraftStep,
  clearWizardDraft,
  hasStep,
  getWizardPassword,
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

  // WR-03: completion can fail for three reasons now —
  //   - 'generic_failure': Zod re-validation throw, write failure, or
  //     unexpected exception inside signInFromVisitor (existing behavior)
  //   - 'duplicate_email': a parallel tab beat this one to createVisitor
  //     between Step-1's uniqueness check and Step-4's submit
  //   - 'duplicate_username': same race, but on the username field
  const [submitError, setSubmitError] = useState<
    null | 'generic_failure' | 'duplicate_email' | 'duplicate_username'
  >(null)

  const form = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    // Validation fires on Create account click — matches UI-SPEC "validates on Next" rhythm.
    mode: 'onSubmit',
    defaultValues: {
      // Non-optional fields start undefined at form mount — surface the hole
      // locally via per-field casts rather than `Partial<X> as X` double-casts
      // that hide every other field's mismatch (WR-02).
      primaryUseCase: undefined as unknown as Step4Values['primaryUseCase'],
      teamSize: undefined as unknown as number,
      topGoals: [],
      ...(draft.step4 ?? {}),
    },
  })

  const onSubmit = form.handleSubmit(async (step4Values) => {
    setSubmitError(null)
    try {
      // Defense in depth — re-read the draft and re-validate every prior step
      // before write. Catches the race where a user opens DevTools mid-wizard
      // and tampers with sessionStorage between mount and submit (T-02-39).
      // .parse(...) (not .safeParse) throws on schema mismatch; the catch
      // surfaces the generic Alert rather than writing half-data.
      //
      // CR-02 mitigation: the on-disk draft NO LONGER carries `password` —
      // the plaintext lives only in `getWizardPassword()` (tab-scoped, in
      // memory). Inject it back into the step-1 payload before parsing so
      // step1Schema still enforces the same shape it always did.
      const freshDraft = readWizardDraft()
      const plaintextPassword = getWizardPassword()
      if (plaintextPassword === null) {
        // No password in memory means the user refreshed mid-wizard or
        // deep-linked here without going through Step 1 in this tab. The
        // hasStep gate above caught the deep-link case; treat the refresh
        // case as a generic failure (the user will be redirected to /signup
        // on the next mount by the gate).
        throw new Error('wizard password not in memory')
      }
      const s1 = step1Schema.parse({ ...freshDraft.step1, password: plaintextPassword })
      const s2 = step2Schema.parse(freshDraft.step2)
      const s3 = step3Schema.parse(freshDraft.step3)

      // WR-03: re-check email + username uniqueness immediately before
      // createVisitor. Step 1's check is still the primary surface (inline
      // anchor + locked copy on the email field), but a parallel-tab race
      // can complete a second wizard with the same credentials between
      // Step 1's check and Step 4's submit — without this re-check the
      // duplicate would write a second visitor that findVisitorByEmail
      // silently shadows. Surface as a form-level Alert and abort.
      if (findVisitorByEmail(s1.email)) {
        setSubmitError('duplicate_email')
        return
      }
      if (findVisitorByUsername(s1.username)) {
        setSubmitError('duplicate_username')
        return
      }

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

      // Track signup completion before navigating away.
      if (typeof pendo !== 'undefined') {
        pendo.track('signup_completed', {
          primaryUseCase: step4Values.primaryUseCase,
          teamSize: step4Values.teamSize,
          topGoals: step4Values.topGoals.join(', '),
          planTier: s3.planTier,
          companySize: s3.companySize,
          industry: s3.industry,
          role: s2.role,
          jobTitle: s2.jobTitle,
        })
      }

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
      {submitError === 'duplicate_email' && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          An account with this email already exists.
        </Alert>
      )}
      {submitError === 'duplicate_username' && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
          That username is taken — try another.
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <Select
            label="What will you use Halo for?"
            placeholder="Pick what fits best"
            data={[...USE_CASE_OPTIONS]}
            value={form.watch('primaryUseCase') ?? null}
            onChange={(value) => {
              // Mantine's Select hands back `string | null`. On clear (null)
              // write undefined so the schema's enum mismatch fires the
              // locked "Pick one to continue." copy. Narrow non-null via
              // runtime enum-membership check (WR-02).
              if (value === null) {
                form.setValue(
                  'primaryUseCase',
                  undefined as unknown as Step4Values['primaryUseCase'],
                  { shouldValidate: false },
                )
                return
              }
              const isKnown = (USE_CASE_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'primaryUseCase',
                isKnown
                  ? (value as Step4Values['primaryUseCase'])
                  : (undefined as unknown as Step4Values['primaryUseCase']),
                { shouldValidate: false },
              )
            }}
            error={form.formState.errors.primaryUseCase?.message}
            pendoId={PENDO_IDS.signup.step4.useCase}
          />
          <NumberInput
            label="How many people on your team?"
            placeholder="5"
            min={1}
            max={10000}
            value={form.watch('teamSize') ?? ''}
            onChange={(value) => {
              // Mantine's NumberInput hands back '' (empty string) when the
              // user clears the field. Coercing '' → Number('') → 0 would
              // silently write a value the user never typed AND would surface
              // an unlocked Zod min(1) message instead of the locked
              // "Enter a number — 1 if it's just you." copy. Preserve
              // `undefined` so z.number({message}) fires the locked copy.
              if (value === '' || value === null || value === undefined) {
                form.setValue(
                  'teamSize',
                  undefined as unknown as number,
                  { shouldValidate: false },
                )
                return
              }
              const n = typeof value === 'number' ? value : Number(value)
              form.setValue(
                'teamSize',
                Number.isFinite(n) ? n : (undefined as unknown as number),
                { shouldValidate: false },
              )
            }}
            error={form.formState.errors.teamSize?.message}
            pendoId={PENDO_IDS.signup.step4.teamSize}
          />
          <MultiSelect
            label="What are you hoping to get out of Halo?"
            placeholder="Pick up to three"
            description="Select up to three."
            data={[...GOAL_OPTIONS]}
            value={form.watch('topGoals') ?? []}
            onChange={(values) => {
              // Mantine's MultiSelect hands back `string[]`. Filter to known
              // enum values so an unexpected string (creatable variant, paste)
              // can't sneak past TS into RHF state. Zod re-validates at
              // submit either way — this is defense in depth (WR-02).
              const filtered = values.filter((v): v is Step4Values['topGoals'][number] =>
                (GOAL_OPTIONS as readonly string[]).includes(v),
              )
              form.setValue('topGoals', filtered, { shouldValidate: false })
            }}
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
