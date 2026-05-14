import { Container, Stack, Paper, Title, Text } from '@mantine/core'

/**
 * /signin — Phase 2 sign-in page. Plan 02-06 placeholder body; Plan 02-10
 * replaces this with the RHF + Zod sign-in form per UI-SPEC. SignInPage owns
 * its OWN Container + Paper (not a child of SignupShell — sign-in is not
 * part of the wizard, no Stepper, no draft state).
 */
export function SignInPage(): React.JSX.Element {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Welcome back</Title>
        <Paper withBorder radius="md" p="xl">
          <Text c="dimmed">
            Plan 02-10 wires the email / password / Sign in form.
          </Text>
        </Paper>
      </Stack>
    </Container>
  )
}
