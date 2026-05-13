import React from 'react'
import {
  MantineProvider,
  Container,
  Stack,
  Title,
  Text,
} from '@mantine/core'
import { haloTheme } from './theme'
import { StorageProvider } from './storage/StorageProvider'
import { AuthProvider } from './auth/AuthProvider'
import { WorkspaceProvider } from './workspace/WorkspaceProvider'
import { PendoBridge } from './pendo/PendoBridge'

/**
 * App root — provider stack assembled per FND-07 ordering.
 *
 * Stack order (outermost → innermost):
 *   MantineProvider → StorageProvider → AuthProvider → WorkspaceProvider → PendoBridge → <children>
 *
 * Each inner provider may safely consume services from providers above it in the tree.
 *
 * Downstream plan integration notes:
 *   - Plan 05 (Router): replaces the Container placeholder body inside PendoBridge
 *     with RouterProvider
 *   - Phase 2 (Auth): replaces AuthProvider body with real Zustand-backed auth; App.tsx unchanged
 *   - Phase 4 (Workspace): replaces WorkspaceProvider body with real persistence; App.tsx unchanged
 *   - Phase 6 (Pendo): replaces PendoBridge body with snippet load + pendo.initialize; App.tsx unchanged
 */
export default function App(): React.JSX.Element {
  return (
    <MantineProvider theme={haloTheme} defaultColorScheme="light">
      <StorageProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <PendoBridge>
              {/* Plan 05 replaces this with <RouterProvider router={router} /> */}
              <Container size="md" py="xl">
                <Stack gap="md">
                  <Title order={1}>Halo</Title>
                  <Text>
                    Phase 1 scaffold — provider stack wired; router and page tree arrive in Plan 05.
                  </Text>
                </Stack>
              </Container>
            </PendoBridge>
          </WorkspaceProvider>
        </AuthProvider>
      </StorageProvider>
    </MantineProvider>
  )
}
