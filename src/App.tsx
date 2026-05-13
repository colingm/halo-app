import React from 'react'
import {
  MantineProvider,
  Container,
  Stack,
  Title,
  Text,
} from '@mantine/core'
import { haloTheme } from './theme'

/**
 * App root.
 *
 * MantineProvider wraps everything so downstream plans (Plan 04: provider stack,
 * Plan 06: UI primitives) can use Mantine components and hooks without additional setup.
 *
 * Plan 04 will insert StorageProvider / AuthProvider / WorkspaceProvider / PendoBridge /
 * RouterProvider between MantineProvider and the page body (RESEARCH.md Pattern 1).
 * This file is intentionally thin to make that refactor straightforward.
 */
export default function App(): React.JSX.Element {
  return (
    <MantineProvider theme={haloTheme} defaultColorScheme="light">
      <Container size="md" py="xl">
        <Stack gap="md">
          <Title order={1}>Halo</Title>
          <Text>
            Phase 1 scaffold — Mantine, providers, router, and primitives arrive in later plans.
          </Text>
        </Stack>
      </Container>
    </MantineProvider>
  )
}
