/**
 * Halo Team — Invite teammate modal (Phase 5, plan 05-04).
 *
 * RHF + Zod modal form for inviting a new teammate. Structurally mirrors
 * src/tasks/components/TaskFormModal.tsx but simpler — no edit mode, 2 fields
 * only (email + role). Uses Phase 4 D-15 local-form-schema pattern with
 * .superRefine for duplicate-email rejection (D-03).
 *
 * On valid submit:
 *   - Derives firstName from email local-part (split on '.' or '_', Title-Case).
 *   - Calls teamsRepo.createTeammate with status='invited'.
 *   - Emits green 'Invite sent' toast.
 *   - Calls onSuccess() (parent bumps refreshKey) and onClose().
 *
 * Owner is NOT in the role options (D-02 — Owner is not invitable).
 *
 * Form state reset on reopen is owned by the open-transition useEffect that
 * calls form.reset(defaultValues) on the false->true `opened` transition
 * (mirrors TaskFormModal.tsx CR-01 fix at lines 149-165). InviteTeammateModal
 * stays mounted by TeamPage across opens — useForm's internal state would
 * otherwise survive every open/submit/close cycle. The `keepMounted={false}`
 * on the inner Mantine <Modal> only controls Mantine's internal transitioned
 * DOM, NOT the outer React component holding the useForm hook; it is kept as
 * decorative (matches Mantine's default behavior anyway) but the actual
 * reset behavior comes from the useEffect.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Stack, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import { TextInput, Select, Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { createTeammate, findTeammateByEmail } from '../teamsRepo'

export type InviteTeammateModalProps = {
  opened: boolean
  onClose: () => void
  /** Parent bumps refreshKey after success so the table re-reads teammates. */
  onSuccess: () => void
  workspaceId: string
}

export function InviteTeammateModal({
  opened,
  onClose,
  onSuccess,
  workspaceId,
}: InviteTeammateModalProps): React.JSX.Element {
  // Local-form-schema per Phase 4 D-15. Defined inside useMemo so the closure
  // captures the current workspaceId for the .superRefine dedupe check (D-03).
  const InviteFormSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().min(1, 'Enter an email.').email('Enter a valid email.'),
          workspaceRole: z.enum(['Admin', 'Member', 'Viewer'], { message: 'Pick a role.' }),
        })
        .superRefine((data, ctx) => {
          if (findTeammateByEmail(workspaceId, data.email)) {
            ctx.addIssue({
              code: 'custom',
              path: ['email'],
              message: `${data.email} is already a teammate.`,
            })
          }
        }),
    [workspaceId],
  )

  type InviteFormValues = z.infer<typeof InviteFormSchema>

  const defaultValues: InviteFormValues = useMemo(() => ({ email: '', workspaceRole: 'Member' as const }), [])

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(InviteFormSchema),
    mode: 'onSubmit',
    defaultValues,
  })

  // Open-transition reset (Plan 08 — Gap 2 fix). Mirrors TaskFormModal.tsx CR-01:158-165. InviteTeammateModal stays mounted by TeamPage across opens, so useForm's internal state persists — this effect resets defaults on the false->true `opened` transition. No `mode === 'create'` guard: this modal has only one mode.
  const prevOpenedRef = useRef(opened)
  useEffect(() => {
    const wasClosed = !prevOpenedRef.current
    prevOpenedRef.current = opened
    if (opened && wasClosed) {
      form.reset(defaultValues)
    }
  }, [opened, form, defaultValues])

  const onSubmit = form.handleSubmit((values) => {
    // D-03: derive firstName from email local-part (split on . or _, Title-Case each segment).
    const localPart = values.email.split('@')[0]
    const firstName = localPart
      .split(/[._]/)
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
      .join(' ')

    createTeammate(workspaceId, {
      firstName,
      lastName: '',
      email: values.email.toLowerCase(),
      workspaceRole: values.workspaceRole,
      status: 'invited',
      lastActiveAt: null,
      invitedAt: new Date().toISOString(),
      avatar: null,
    })

    notifications.show({
      title: 'Invite sent',
      message: `Sent to ${values.email}`,
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 3000,
    })

    if (typeof pendo !== 'undefined') {
      pendo.track('teammate_invited', {
        teammateEmail: values.email.toLowerCase(),
        workspaceRole: values.workspaceRole,
        workspaceId,
      })
    }

    onSuccess()
    onClose()
  })

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Invite teammate"
      size="md"
      centered
      keepMounted={false}
      data-pendo-id={PENDO_IDS.team.invite.modalContainer}
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            {...form.register('email')}
            label="Email"
            type="email"
            required
            error={form.formState.errors.email?.message}
            pendoId={PENDO_IDS.team.invite.modalEmail}
          />
          <Select
            label="Role"
            data={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Member', label: 'Member' },
              { value: 'Viewer', label: 'Viewer' },
            ]}
            value={form.watch('workspaceRole') ?? null}
            onChange={(value) => {
              if (value === 'Admin' || value === 'Member' || value === 'Viewer') {
                form.setValue('workspaceRole', value, { shouldDirty: true })
              }
            }}
            allowDeselect={false}
            error={form.formState.errors.workspaceRole?.message}
            pendoId={PENDO_IDS.team.invite.modalRole}
          />
        </Stack>
        <Group justify="flex-end" mt="lg" gap="md">
          <Button
            variant="default"
            type="button"
            pendoId={PENDO_IDS.team.invite.modalCancel}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            type="submit"
            pendoId={PENDO_IDS.team.invite.modalSubmit}
          >
            Send invite
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
