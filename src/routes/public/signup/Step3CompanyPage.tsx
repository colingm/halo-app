import { Title, Stack, Text } from '@mantine/core'

/**
 * Step 3 of the signup wizard — Company (/signup/company).
 * Plan 02-06 placeholder body; Plan 02-08 replaces this with the RHF + Zod
 * form (company name, size, industry, plan tier) per Phase 2 UI-SPEC.
 */
export function Step3CompanyPage(): React.JSX.Element {
  return (
    <Stack gap="md">
      <Title order={2}>About your company</Title>
      <Text c="dimmed">
        Step 3 placeholder — Plan 02-08 wires the company name / size / industry / plan form.
      </Text>
    </Stack>
  )
}
