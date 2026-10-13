import React from 'react'
import { Title, Text, Stack, Container } from '@mantine/core'
import { Button, TextInput, PasswordInput, Anchor } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

/**
 * Phase 1 smoke-render page — proves every UI primitive renders without
 * runtime error and that the `data-pendo-id` forwarding contract is working.
 *
 * To verify manually:
 *  1. Run `npm run dev` and visit http://localhost:5173/sandbox
 *  2. Open DevTools → Elements and confirm each primitive carries its
 *     `data-pendo-id` attribute.
 *  3. For PasswordInput: confirm `pendo-sr-ignore` is also present in
 *     the element's className.
 *
 * This route lives under PublicLayout and will be visible in Phase 5 polish
 * or gated behind a dev-only build flag if the team decides to hide it.
 */
export function PrimitivesSandbox(): React.JSX.Element {
  return (
    <Container
      size="sm"
      py="xl"
      data-pendo-id={PENDO_IDS.layout.publicLanding}
    >
      <Stack gap="md">
        <Title order={2}>Primitives Sandbox (Phase 1)</Title>

        <Text>
          This page exists to verify the <code>data-pendo-id</code> forwarding
          contract. Inspect each element in DevTools → Elements and confirm the{' '}
          <code>data-pendo-id</code> attribute matches the corresponding{' '}
          <code>PENDO_IDS.sandbox.*</code> value. For the PasswordInput also
          confirm the <code>pendo-sr-ignore</code> CSS class is present (PEN-09).
        </Text>

        <Button pendoId={PENDO_IDS.sandbox.primaryButton}>
          Primary action
        </Button>

        <TextInput
          pendoId={PENDO_IDS.sandbox.emailInput}
          label="Email"
          placeholder="you@example.com"
        />

        <PasswordInput
          pendoId={PENDO_IDS.sandbox.passwordInput}
          label="Password"
          placeholder="At least 8 characters"
        />

        <Anchor pendoId={PENDO_IDS.sandbox.signupAnchor} href={import.meta.env.BASE_URL}>
          Back to landing
        </Anchor>
      </Stack>
    </Container>
  )
}
