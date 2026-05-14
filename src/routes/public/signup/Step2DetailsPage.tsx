import { Title, Stack, Text } from '@mantine/core'

/**
 * Step 2 of the signup wizard — About you (/signup/details).
 * Plan 02-06 placeholder body; Plan 02-08 replaces this with the RHF + Zod
 * form (job title, role, years of experience, location) per Phase 2 UI-SPEC.
 */
export function Step2DetailsPage(): React.JSX.Element {
  return (
    <Stack gap="md">
      <Title order={2}>A bit about you</Title>
      <Text c="dimmed">
        Step 2 placeholder — Plan 02-08 wires the job title / role / years / location form.
      </Text>
    </Stack>
  )
}
