/**
 * AuthProvider — Phase 1 stub.
 *
 * Returns `{ user: null, signIn, signOut }` where:
 *   - `signIn` throws to fail loudly if accidentally called in Phase 1 (not yet implemented)
 *   - `signOut` is a silent no-op so future UI affordances can be wired safely
 *
 * Phase 2 replaces the BODY of this component with real localStorage-backed auth
 * (Zustand store, registration flow, session hydration). The provider POSITION in
 * src/App.tsx stays fixed — Phase 2 never needs to edit App.tsx.
 *
 * NOTE: The `User` type defined inline here will be promoted to src/auth/types.ts in
 * Phase 2. Downstream plans (05, 06) can import it from this file in the interim.
 */

import { createContext } from 'react'
import type { ReactNode } from 'react'

/** Inline placeholder — Phase 2 promotes this to src/auth/types.ts */
export type User = {
  id: string
  email: string
  name: string
}

export type AuthContextValue = {
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STUB_VALUE: AuthContextValue = {
  user: null,
  signIn: async (_email: string, _password: string) => {
    throw new Error(
      'AuthProvider stub: signIn is not implemented in Phase 1. ' +
        'Phase 2 replaces this stub with real localStorage-backed auth.',
    )
  },
  signOut: async () => {
    // no-op in Phase 1 — silent so future sign-out UI can be wired safely
  },
}

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  return <AuthContext.Provider value={STUB_VALUE}>{children}</AuthContext.Provider>
}

// Re-export context for useAuth hook
export { AuthContext }
