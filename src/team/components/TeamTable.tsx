/**
 * Halo Team — Mantine native Table (Phase 5, plan 05-04).
 *
 * Four columns left → right per 05-UI-SPEC §"Team table":
 *   1. Name — Avatar (indigo, initials fallback) + full name + Invited badge
 *      when status==='invited' (yellow, light variant).
 *   2. Email — plain <Text size="sm">.
 *   3. Role — inline Select (Mechanism A per D-02: Owner row shows 'Owner'
 *      as a disabled option + disabled={true}; non-Owner rows offer
 *      Admin/Member/Viewer only). Carries data-pendo-teammate-id={t.id}
 *      for dynamic-list parameterization (CLAUDE.md + D-14).
 *   4. Last active — formatRelative relative-time string; '—' (dimmed) when
 *      lastActiveAt === null (invited rows).
 *
 * Render order (useMemo): Owner first, then status='active' sorted by firstName
 * asc, then status='invited' sorted by invitedAt desc (newest invite first).
 *
 * Cell padding lives in TeamTable.module.css using Mantine spacing CSS-vars —
 * no raw px values per UI-SPEC §Spacing.
 *
 * Wrapped in <Paper withBorder p={0} radius="md" overflow="hidden"> so the
 * border-radius clips the inner table corners cleanly.
 */

import { useMemo } from 'react'
import { Paper, Table, Avatar, Badge, Text, Group } from '@mantine/core'
import { Select } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { formatRelative } from '../../dashboard/relative-time'
import type { Teammate, WorkspaceRole } from '../types'
import classes from './TeamTable.module.css'

export type TeamTableProps = {
  teammates: Teammate[]
  onRoleChange: (teammateId: string, nextRole: WorkspaceRole) => void
}

export function TeamTable({ teammates, onRoleChange }: TeamTableProps): React.JSX.Element {
  // Use current time as nowRef for last-active relative formatting.
  // The team page is not anchored to task activity (unlike Dashboard/Reports).
  const nowRefIso = useMemo(() => new Date().toISOString(), [])

  // D-UI-SPEC §"Team table" render order:
  //   1. Owner row (workspaceRole === 'Owner') — always first.
  //   2. Active non-Owner rows sorted by firstName asc.
  //   3. Invited rows sorted by invitedAt desc (newest first).
  const orderedTeammates = useMemo<Teammate[]>(() => {
    const owner = teammates.filter((t) => t.workspaceRole === 'Owner')
    const active = teammates
      .filter((t) => t.workspaceRole !== 'Owner' && t.status === 'active')
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
    const invited = teammates
      .filter((t) => t.status === 'invited')
      .sort((a, b) => {
        const aAt = a.invitedAt ?? ''
        const bAt = b.invitedAt ?? ''
        return bAt.localeCompare(aAt)
      })
    return [...owner, ...active, ...invited]
  }, [teammates])

  return (
    <Paper
      withBorder
      p={0}
      radius="md"
      style={{ overflow: 'hidden' }}
      data-pendo-id={PENDO_IDS.team.table.container}
    >
      <Table
        className={classes.teamTable}
        verticalSpacing={0}
        horizontalSpacing={0}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={classes.cell}>
              <Text size="sm" fw={500} c="dimmed">Name</Text>
            </Table.Th>
            <Table.Th className={classes.cell}>
              <Text size="sm" fw={500} c="dimmed">Email</Text>
            </Table.Th>
            <Table.Th className={classes.cell}>
              <Text size="sm" fw={500} c="dimmed">Role</Text>
            </Table.Th>
            <Table.Th className={classes.cell}>
              <Text size="sm" fw={500} c="dimmed">Last active</Text>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orderedTeammates.map((t) => {
            const firstInitial = (t.firstName[0] ?? '').toUpperCase()
            const lastInitial = (t.lastName[0] ?? '').toUpperCase()
            const initials = firstInitial || lastInitial
              ? `${firstInitial}${lastInitial}`
              : (t.email[0] ?? '').toUpperCase()

            return (
              <Table.Tr key={t.id}>
                {/* Name cell: avatar + name + Invited badge */}
                <Table.Td className={classes.cell}>
                  <Group gap={8}>
                    <Avatar size="sm" color="indigo" radius="xl" src={t.avatar ?? null}>
                      {initials}
                    </Avatar>
                    <Text size="sm">{t.firstName} {t.lastName}</Text>
                    {t.status === 'invited' && (
                      <Badge color="yellow" variant="light" size="sm">Invited</Badge>
                    )}
                  </Group>
                </Table.Td>

                {/* Email cell */}
                <Table.Td className={classes.cell}>
                  <Text size="sm">{t.email}</Text>
                </Table.Td>

                {/* Role cell — Mechanism A (D-02): Owner row shows disabled 'Owner' option */}
                <Table.Td className={classes.cell}>
                  <Select
                    value={t.workspaceRole}
                    data={
                      t.workspaceRole === 'Owner'
                        ? [{ value: 'Owner', label: 'Owner', disabled: true }]
                        : [
                            { value: 'Admin', label: 'Admin' },
                            { value: 'Member', label: 'Member' },
                            { value: 'Viewer', label: 'Viewer' },
                          ]
                    }
                    disabled={t.workspaceRole === 'Owner'}
                    onChange={(value) => {
                      if (value && value !== t.workspaceRole) {
                        onRoleChange(t.id, value as WorkspaceRole)
                      }
                    }}
                    pendoId={PENDO_IDS.team.row.roleSelect}
                    data-pendo-teammate-id={t.id}
                    size="sm"
                    w={140}
                    allowDeselect={false}
                  />
                </Table.Td>

                {/* Last active cell */}
                <Table.Td className={classes.cell}>
                  <Text size="sm" c={t.lastActiveAt ? undefined : 'dimmed'}>
                    {t.lastActiveAt ? formatRelative(t.lastActiveAt, nowRefIso) : '—'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}
