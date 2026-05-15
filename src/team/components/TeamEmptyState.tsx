/**
 * Halo Team — Hero empty state (Phase 5, plan 05-04).
 *
 * Renders when `listTeammates(workspaceId).length === 0` (UI-01). Layout mirrors
 * src/tasks/components/ListsEmptyState.tsx (exact analog) with icon swapped to
 * IconUsers + copy updated per 05-UI-SPEC §"Team empty state".
 *
 * Carries `data-pendo-id={PENDO_IDS.team.emptyState.container}` on the outer
 * <Center> and `PENDO_IDS.team.emptyState.cta` on the Button — guide-anchor
 * surfaces for Phase 6.
 */

import { Center, Stack, Title, Text } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type TeamEmptyStateProps = {
  workspaceName: string
  onInviteClick: () => void
}

export function TeamEmptyState({
  workspaceName,
  onInviteClick,
}: TeamEmptyStateProps): React.JSX.Element {
  return (
    <Center mih={400} data-pendo-id={PENDO_IDS.team.emptyState.container}>
      <Stack align="center" gap="md">
        <IconUsers size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />
        <Title order={3}>No teammates yet</Title>
        <Text c="dimmed" ta="center" maw={420}>
          Invite your first teammate to start collaborating on {workspaceName}.
        </Text>
        <Button
          variant="filled"
          pendoId={PENDO_IDS.team.emptyState.cta}
          onClick={onInviteClick}
        >
          Invite teammate
        </Button>
      </Stack>
    </Center>
  )
}
