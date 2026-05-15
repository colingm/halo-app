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
 * keepMounted={false} drops RHF state on close (mirrors TaskFormModal D-26 idiom).
 */

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Stack, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import { TextInput, Select, Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { createTeammate, findTeammateByEmail } from '../teamsRepo'
import type { WorkspaceRole } from '../types'

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

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(InviteFormSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', workspaceRole: 'Member' },
  })

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

    onSuccess()
    onClose()
  })

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Invite teammate</Title>}
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
              if (value && (['Admin', 'Member', 'Viewer'] as const).includes(value as WorkspaceRole)) {
                form.setValue('workspaceRole', value as WorkspaceRole, { shouldDirty: true })
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
