import { Center, Stack, Text, Anchor as MantineAnchor } from '@mantine/core'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

/**
 * HelpNoResultsState — compact in-flow no-results state for the Help search.
 *
 * Mirrors src/tasks/components/FilteredEmptyState.tsx verbatim shape.
 * Uses `py="xl"` (compact in-flow placement) NOT `mih={400}` (full-page hero).
 */

export type HelpNoResultsStateProps = {
  query: string
  onClear: () => void
}

export function HelpNoResultsState({
  query,
  onClear,
}: HelpNoResultsStateProps): React.JSX.Element {
  return (
    <Center py="xl" data-pendo-id={PENDO_IDS.help.noResults.container}>
      <Stack align="center" gap="sm">
        <Text c="dimmed" ta="center">
          No articles match &quot;{query}&quot;. Try a different keyword.
        </Text>
        {/*
         * S3 polymorphic-Anchor exception: raw Mantine Anchor with
         * component="button" and explicit data-pendo-id because the Halo
         * Anchor wrapper does not expose polymorphic `component` typing.
         * Value still flows from PENDO_IDS — no hand-typed string.
         * Mirrors FilteredEmptyState.tsx lines 27-32 precedent.
         */}
        <MantineAnchor
          component="button"
          type="button"
          size="sm"
          data-pendo-id={PENDO_IDS.help.noResults.clearLink}
          onClick={onClear}
        >
          Clear search
        </MantineAnchor>
      </Stack>
    </Center>
  )
}
