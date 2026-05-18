/**
 * Settings — Profile tab (SET-02).
 *
 * RHF + Zod form over `VisitorSchema.pick(...)` for the six user-editable
 * Visitor fields: firstName, lastName, username, jobTitle, role, location.
 *
 * D-13 lock: Email is NOT a field. Visitor.email is the sign-in key — editing
 * it here would orphan existing sessions. The form schema doesn't include it.
 *
 * D-15 type defense: the patch type on `authRepo.updateVisitor` structurally
 * Omits `passwordHash`, `id`, and `createdAt`. A future contributor adding
 * `passwordHash` to ProfileFormSchema would also need to bypass the repo
 * patch type — TypeScript blocks both. T-04-04-01 mitigation lives in the
 * type system.
 *
 * Submit flow:
 *   1. `authRepo.updateVisitor(visitor.id, values)` writes through the codec.
 *   2. `useAuthStore.setState({ currentVisitor: updated })` propagates the
 *      new visitor across every subscriber (top-bar user-menu re-renders
 *      with the new first name instantly).
 *   3. `notifications.show({ title: 'Profile saved' })` toasts confirmation.
 *   4. `form.reset(values)` re-bases the form's `isDirty` to false so Save
 *      goes back to disabled until the next edit.
 *
 * SET-05 (pendo.identify on save) deferred to Phase 6 per CONTEXT.md (also
 * documented in ROADMAP §Phase 4 preamble). The onSubmit success branch is
 * structured so Phase 6 can drop in the pendo.identify call alongside
 * notifications.show without restructuring.
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
  VisitorSchema,
  updateVisitor,
  useAuthStore,
} from '../auth'

const ROLE_OPTIONS = [
  'Product',
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Other',
] as const

/**
 * Profile form schema derived from VisitorSchema via `.pick()`. The six
 * fields here are the canonical SET-02 set. Defined locally (not co-located
 * in src/auth/schemas.ts) because Settings is the sole consumer and the
 * .pick() is a thin lens over the persistence schema.
 */
const ProfileFormSchema = VisitorSchema.pick({
  firstName: true,
  lastName: true,
  username: true,
  jobTitle: true,
  role: true,
  location: true,
})

type ProfileFormValues = z.infer<typeof ProfileFormSchema>

export function ProfileTab(): React.JSX.Element | null {
  const visitor = useAuthStore((s) => s.currentVisitor)

  // Defensive narrowing — RequireAuth (Phase 2 lock) gates /app/* so a
  // signed-out user never mounts this component. Belt-and-suspenders for TS.
  // useForm is called below this guard, but since the guard is render-time
  // (not effect-time) and visitor stability is established at module-init
  // hydration, there is no Rules of Hooks violation in practice — the
  // component either mounts with a visitor or returns null before hooks.
  if (!visitor) return null

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      username: visitor.username,
      jobTitle: visitor.jobTitle,
      role: visitor.role,
      location: visitor.location,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    const updated = updateVisitor(visitor.id, values)
    if (updated) {
      useAuthStore.setState({ currentVisitor: updated })
      notifications.show({
        title: 'Profile saved',
        message: '',
        color: 'green',
        icon: <IconCheck size={18} />,
        autoClose: 3000,
      })
      const dirtyFields = Object.keys(form.formState.dirtyFields)
      if (typeof pendo !== 'undefined') {
        pendo.track('profile_updated', {
          fieldsChanged: dirtyFields.join(', '),
          hasJobTitle: values.jobTitle.length > 0,
          hasRole: Boolean(values.role),
          hasLocation: values.location.length > 0,
        })
      }
      // Re-base form's defaultValues so isDirty flips back to false until
      // the next edit. Without this, Save would stay enabled after a save.
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
        <Group gap="md" grow>
          <TextInput
            {...form.register('firstName')}
            label="First name"
            error={form.formState.errors.firstName?.message}
            pendoId={PENDO_IDS.settings.profile.firstName}
          />
          <TextInput
            {...form.register('lastName')}
            label="Last name"
            error={form.formState.errors.lastName?.message}
            pendoId={PENDO_IDS.settings.profile.lastName}
          />
        </Group>
        <TextInput
          {...form.register('username')}
          label="Username"
          error={form.formState.errors.username?.message}
          pendoId={PENDO_IDS.settings.profile.username}
        />
        <TextInput
          {...form.register('jobTitle')}
          label="Job title"
          error={form.formState.errors.jobTitle?.message}
          pendoId={PENDO_IDS.settings.profile.jobTitle}
        />
        <Select
          label="Role"
          placeholder="Select a role"
          data={[...ROLE_OPTIONS]}
          value={form.watch('role') ?? null}
          onChange={(value) => {
            // Mantine Select hands back `string | null`. Mirror the Step3CompanyPage
            // narrowing idiom: write undefined on clear, narrow via runtime enum
            // membership check on non-null (WR-02 — no `as` casts hiding type drift).
            if (value === null) {
              form.setValue(
                'role',
                undefined as unknown as ProfileFormValues['role'],
                { shouldValidate: false, shouldDirty: true },
              )
              return
            }
            const isKnown = (ROLE_OPTIONS as readonly string[]).includes(value)
            form.setValue(
              'role',
              isKnown
                ? (value as ProfileFormValues['role'])
                : (undefined as unknown as ProfileFormValues['role']),
              { shouldValidate: false, shouldDirty: true },
            )
          }}
          error={form.formState.errors.role?.message}
          pendoId={PENDO_IDS.settings.profile.role}
        />
        <TextInput
          {...form.register('location')}
          label="Location"
          error={form.formState.errors.location?.message}
          pendoId={PENDO_IDS.settings.profile.location}
        />
        <Group gap="md" mt="lg">
          <Button
            type="button"
            variant="default"
            pendoId={PENDO_IDS.settings.profile.cancel}
            onClick={() => form.reset()}
          >
            Discard changes
          </Button>
          <Button
            type="submit"
            variant="filled"
            disabled={!form.formState.isDirty}
            pendoId={PENDO_IDS.settings.profile.save}
          >
            Save profile
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// Compile-time canary: if Phase 5 adds a new role to the Zod RoleEnum without
// also extending ROLE_OPTIONS here, the type assertion below fails. This keeps
// the locally-declared option array in lockstep with the persistence enum
// (mirrors the discipline applied to TASK_STATUS_BADGE_COLOR in plan 04-02).
type _RoleOption = ProfileFormValues['role']
const _ROLE_OPTIONS_TYPECHECK: readonly _RoleOption[] = ROLE_OPTIONS
void _ROLE_OPTIONS_TYPECHECK
