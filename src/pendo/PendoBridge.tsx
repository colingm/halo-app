/**
 * PendoBridge — PHASE 1 STUB.
 *
 * This component is a no-op pass-through reserved for FND-07's provider-stack
 * ordering. The real Pendo wiring is implemented in Phase 6 ("Pendo Install &
 * Wiring"). Do NOT add `window.pendo` references, `import.meta.env.VITE_PENDO_API_KEY`
 * lookups, or anonymous ID generation in this file before Phase 6.
 *
 * Phase 6 replaces the BODY of this component with:
 *   - Pendo snippet loader (script injection)
 *   - `pendo.initialize` with anonymous visitor ID (from K.pendoAnonId() + nanoid)
 *   - `pendo.identify` wired to auth state changes via useAuth()
 *   - `pendo.clearSession` wired to sign-out
 *   - `pendo.location.setUrl` wired to React Router route changes
 *
 * The provider POSITION in src/App.tsx stays fixed — Phase 6 never needs to
 * edit App.tsx.
 */

import type { ReactNode } from 'react'

export function PendoBridge({ children }: { children: ReactNode }) {
  return <>{children}</>
}
