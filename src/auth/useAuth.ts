/**
 * useAuth — reads AuthContext; throws a developer-facing error if called outside
 * <AuthProvider>. This fail-fast pattern catches misuse immediately during development.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import type { AuthContextValue } from './AuthProvider'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
