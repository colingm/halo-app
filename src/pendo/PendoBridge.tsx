/**
 * PendoBridge — Phase 6 Pendo Install & Wiring.
 *
 * Initializes Pendo anonymously on mount, then calls pendo.identify()
 * whenever the auth state changes to provide visitor and account metadata.
 * On sign-out, re-initializes with an anonymous visitor so Pendo continues
 * tracking page-level analytics without a signed-in identity.
 *
 * Provider position in src/App.tsx is fixed per FND-07 — this file's body
 * is the only thing Phase 6 touches. App.tsx is not edited.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'

export function PendoBridge({ children }: { children: ReactNode }) {
  const { currentVisitor, currentWorkspace, isAuthenticated } = useAuth()
  const initializedRef = useRef(false)

  // Initialize Pendo anonymously on first mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    pendo.initialize({
      visitor: { id: '' },
    })
  }, [])

  // Identify with real visitor/account data when auth state changes
  useEffect(() => {
    if (!initializedRef.current) return

    if (isAuthenticated && currentVisitor && currentWorkspace) {
      pendo.identify({
        visitor: {
          id: currentVisitor.email,
          email: currentVisitor.email,
          full_name: `${currentVisitor.firstName} ${currentVisitor.lastName}`,
          firstName: currentVisitor.firstName,
          lastName: currentVisitor.lastName,
          username: currentVisitor.username,
          jobTitle: currentVisitor.jobTitle,
          role: currentVisitor.role,
          yearsExperience: currentVisitor.yearsExperience,
          location: currentVisitor.location,
          primaryUseCase: currentVisitor.primaryUseCase,
          teamSize: currentVisitor.teamSize,
          topGoals: currentVisitor.topGoals,
          createdAt: currentVisitor.createdAt,
        },
        account: {
          id: currentWorkspace.companyName,
          name: currentWorkspace.companyName,
          companyName: currentWorkspace.companyName,
          companySize: currentWorkspace.companySize,
          industry: currentWorkspace.industry,
          planTier: currentWorkspace.planTier,
          createdAt: currentWorkspace.createdAt,
        },
      })
    }
  }, [isAuthenticated, currentVisitor, currentWorkspace])

  return <>{children}</>
}
