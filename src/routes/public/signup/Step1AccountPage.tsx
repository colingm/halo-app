import { Title, Stack, Text } from '@mantine/core'

/**
 * Step 1 of the signup wizard — Account (/signup).
 * Plan 02-06 placeholder body; Plan 02-07 replaces this with the RHF + Zod
 * form (email, password, first name, last name, username) per Phase 2 UI-SPEC.
 * The file path is stable so 02-07 only swaps the body.
 */
export function Step1AccountPage(): React.JSX.Element {
  return (
    <Stack gap="md">
      <Title order={2}>Create your Halo account</Title>
      <Text c="dimmed">
        Step 1 placeholder — Plan 02-07 wires the email / password / name / username form.
      </Text>
    </Stack>
  )
}
