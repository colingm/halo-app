import { Title, Stack, Text } from '@mantine/core'

/**
 * Step 4 of the signup wizard — Setup (/signup/preferences).
 * Plan 02-06 placeholder body; Plan 02-09 replaces this with the RHF + Zod
 * form (primary use case, team size, top goals) per Phase 2 UI-SPEC.
 * Step 4 submit is the funnel-conversion target for Phase 6.
 */
export function Step4PreferencesPage(): React.JSX.Element {
  return (
    <Stack gap="md">
      <Title order={2}>Set up your workspace</Title>
      <Text c="dimmed">
        Step 4 placeholder — Plan 02-09 wires the use-case / team-size / goals form.
      </Text>
    </Stack>
  )
}
