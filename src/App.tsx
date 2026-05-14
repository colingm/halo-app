import React from 'react'
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from 'react-router'
import { haloTheme } from './theme'
import { router } from './router'
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
 *   - Plan 05 (Router): DONE — RouterProvider is now the child of PendoBridge
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
              <RouterProvider router={router} />
            </PendoBridge>
          </WorkspaceProvider>
        </AuthProvider>
      </StorageProvider>
    </MantineProvider>
  )
}
