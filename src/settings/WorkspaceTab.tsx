/**
 * Settings — Workspace tab (SET-03).
 *
 * RHF + Zod form over `WorkspaceSchema.pick(...)` for the four user-editable
 * Workspace fields: companyName, companySize, industry, planTier.
 *
 * D-14 lock: ownerVisitorId is NOT editable — workspace ownership is set once
 * at wizard completion and is not a Settings-editable concept (no workspace
 * transfer UX in Phase 4). `authRepo.updateWorkspace`'s patch type structurally
 * Omits ownerVisitorId, id, createdAt — TypeScript blocks accidental UI
 * plumbing exposing those fields.
 *
 * Submit flow mirrors ProfileTab:
 *   1. `authRepo.updateWorkspace(workspace.id, values)` writes through the codec.
 *   2. `useAuthStore.setState({ currentWorkspace: updated })` propagates the
 *      new workspace across every subscriber — the top-bar workspace-name
 *      display recolors instantly without a refresh.
 *   3. `notifications.show({ title: 'Workspace saved' })` toasts confirmation.
 *   4. `form.reset(values)` re-bases isDirty to false.
 *
 * SET-05 (pendo.identify/account update on save) deferred to Phase 6 per
 * CONTEXT.md. The onSubmit success branch is structured so Phase 6 can drop
 * in the pendo.identify (or pendo.updateOptions for account) call alongside
 * notifications.show without restructuring.
 *
 * Three Select option arrays are locked-string-equal to the Step3CompanyPage
 * arrays (the Zod enum check is strict-equal against the same strings:
 * en-dash in company sizes, "Retail / e-commerce" spacing, etc.). Phase 5
 * may hoist these into a shared module if the count of consumers grows;
 * Phase 4 redeclares locally with this note.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Stack, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { TextInput, Select, Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import {
  WorkspaceSchema,
  updateWorkspace,
  useAuthStore,
} from '../auth'

// Strict-equal to the Step3CompanyPage / CompanySizeEnum literal sets. Phase 5
// may hoist these to a shared options module; Phase 4 redeclares locally
// rather than creating a new shared module just for Settings (scope discipline
// per CLAUDE.md).
const COMPANY_SIZE_OPTIONS = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'] as const

const INDUSTRY_OPTIONS = [
  'Software',
  'Financial services',
  'Healthcare',
  'Retail / e-commerce',
  'Manufacturing',
  'Education',
  'Other',
] as const

const PLAN_OPTIONS = ['Free', 'Pro', 'Enterprise'] as const

/**
 * Workspace form schema derived from WorkspaceSchema via `.pick()`. The four
 * fields here are the canonical SET-03 set. Defined locally for the same
 * reason as ProfileTab's ProfileFormSchema.
 */
const WorkspaceFormSchema = WorkspaceSchema.pick({
  companyName: true,
  companySize: true,
  industry: true,
  planTier: true,
})

type WorkspaceFormValues = z.infer<typeof WorkspaceFormSchema>

export function WorkspaceTab(): React.JSX.Element | null {
  const workspace = useAuthStore((s) => s.currentWorkspace)

  if (!workspace) return null

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(WorkspaceFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      companyName: workspace.companyName,
      companySize: workspace.companySize,
      industry: workspace.industry,
      planTier: workspace.planTier,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    const updated = updateWorkspace(workspace.id, values)
    if (updated) {
      useAuthStore.setState({ currentWorkspace: updated })
      notifications.show({
        title: 'Workspace saved',
        message: '',
        color: 'green',
        icon: <IconCheck size={18} />,
        autoClose: 3000,
      })
      const dirtyFields = Object.keys(form.formState.dirtyFields)
      if (typeof pendo !== 'undefined') {
        pendo.track('workspace_updated', {
          fieldsChanged: dirtyFields.join(', '),
          companyName: values.companyName,
          companySize: values.companySize,
          industry: values.industry,
          planTier: values.planTier,
          previousPlanTier: workspace.planTier,
        })
      }
      form.reset(values)
    } else {
      notifications.show({
        title: 'Something went wrong',
        message: 'Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
        autoClose: 5000,
      })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="md" maw={480}>
        <TextInput
          {...form.register('companyName')}
          label="Company name"
          error={form.formState.errors.companyName?.message}
          pendoId={PENDO_IDS.settings.workspace.companyName}
        />
        <Group gap="md" grow>
          <Select
            label="Company size"
            placeholder="Select team size"
            data={[...COMPANY_SIZE_OPTIONS]}
            value={form.watch('companySize') ?? null}
            onChange={(value) => {
              if (value === null) {
                form.setValue(
                  'companySize',
                  undefined as unknown as WorkspaceFormValues['companySize'],
                  { shouldValidate: false, shouldDirty: true },
                )
                return
              }
              const isKnown = (COMPANY_SIZE_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'companySize',
                isKnown
                  ? (value as WorkspaceFormValues['companySize'])
                  : (undefined as unknown as WorkspaceFormValues['companySize']),
                { shouldValidate: false, shouldDirty: true },
              )
            }}
            error={form.formState.errors.companySize?.message}
            pendoId={PENDO_IDS.settings.workspace.companySize}
          />
          <Select
            label="Industry"
            placeholder="Select an industry"
            data={[...INDUSTRY_OPTIONS]}
            value={form.watch('industry') ?? null}
            onChange={(value) => {
              if (value === null) {
                form.setValue(
                  'industry',
                  undefined as unknown as WorkspaceFormValues['industry'],
                  { shouldValidate: false, shouldDirty: true },
                )
                return
              }
              const isKnown = (INDUSTRY_OPTIONS as readonly string[]).includes(value)
              form.setValue(
                'industry',
                isKnown
                  ? (value as WorkspaceFormValues['industry'])
                  : (undefined as unknown as WorkspaceFormValues['industry']),
                { shouldValidate: false, shouldDirty: true },
              )
            }}
            error={form.formState.errors.industry?.message}
            pendoId={PENDO_IDS.settings.workspace.industry}
          />
        </Group>
        <Select
          label="Plan"
          placeholder="Choose a plan"
          data={[...PLAN_OPTIONS]}
          value={form.watch('planTier') ?? null}
          onChange={(value) => {
            if (value === null) {
              form.setValue(
                'planTier',
                undefined as unknown as WorkspaceFormValues['planTier'],
                { shouldValidate: false, shouldDirty: true },
              )
              return
            }
            const isKnown = (PLAN_OPTIONS as readonly string[]).includes(value)
            form.setValue(
              'planTier',
              isKnown
                ? (value as WorkspaceFormValues['planTier'])
                : (undefined as unknown as WorkspaceFormValues['planTier']),
              { shouldValidate: false, shouldDirty: true },
            )
          }}
          error={form.formState.errors.planTier?.message}
          pendoId={PENDO_IDS.settings.workspace.planTier}
        />
        <Group gap="md" mt="lg">
          <Button
            type="button"
            variant="default"
            pendoId={PENDO_IDS.settings.workspace.cancel}
            onClick={() => form.reset()}
          >
            Discard changes
          </Button>
          <Button
            type="submit"
            variant="filled"
            disabled={!form.formState.isDirty}
            pendoId={PENDO_IDS.settings.workspace.save}
          >
            Save workspace
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// Compile-time canaries — keep local option arrays in lockstep with the
// persistence enums via WorkspaceFormValues type derivations.
type _CompanySizeOption = WorkspaceFormValues['companySize']
type _IndustryOption = WorkspaceFormValues['industry']
type _PlanTierOption = WorkspaceFormValues['planTier']
const _COMPANY_SIZE_TYPECHECK: readonly _CompanySizeOption[] = COMPANY_SIZE_OPTIONS
const _INDUSTRY_TYPECHECK: readonly _IndustryOption[] = INDUSTRY_OPTIONS
const _PLAN_TYPECHECK: readonly _PlanTierOption[] = PLAN_OPTIONS
void _COMPANY_SIZE_TYPECHECK
void _INDUSTRY_TYPECHECK
void _PLAN_TYPECHECK
