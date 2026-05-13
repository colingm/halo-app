/**
 * useWorkspace — reads WorkspaceContext; throws a developer-facing error if called
 * outside <WorkspaceProvider>. This fail-fast pattern catches misuse immediately
 * during development.
 */

import { useContext } from 'react'
import { WorkspaceContext } from './WorkspaceProvider'
import type { WorkspaceContextValue } from './WorkspaceProvider'

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (ctx === null) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  }
  return ctx
}
