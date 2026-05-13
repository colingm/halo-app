/**
 * WorkspaceProvider — Phase 1 stub.
 *
 * Returns `{ workspace: null, switchWorkspace }` where `switchWorkspace` is a
 * silent no-op. Phase 4's Settings page will be the first real consumer.
 *
 * Phase 4 replaces the BODY of this component with real multi-workspace state
 * (Zustand store, localStorage persistence, workspace hydration on sign-in).
 * The provider POSITION in src/App.tsx stays fixed — Phase 4 never needs to
 * edit App.tsx.
 *
 * NOTE: The `Workspace` type defined inline here will be promoted to
 * src/workspace/types.ts in Phase 4. Downstream plans can import it from this
 * file in the interim.
 */

import { createContext } from 'react'
import type { ReactNode } from 'react'

/** Inline placeholder — Phase 4 promotes this to src/workspace/types.ts */
export type Workspace = {
  id: string
  name: string
}

export type WorkspaceContextValue = {
  workspace: Workspace | null
  switchWorkspace: (workspaceId: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const STUB_VALUE: WorkspaceContextValue = {
  workspace: null,
  switchWorkspace: async (_workspaceId: string) => {
    // no-op in Phase 1 — Phase 4 replaces with real workspace-switching logic
  },
}

export function WorkspaceProvider({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <WorkspaceContext.Provider value={STUB_VALUE}>{children}</WorkspaceContext.Provider>
  )
}

// Re-export context for useWorkspace hook
export { WorkspaceContext }
