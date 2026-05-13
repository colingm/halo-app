/**
 * StorageProvider — thin Context wrapper exposing the storage module's public API.
 *
 * PURPOSE (Phase 1): This component satisfies FND-07's provider-stack ordering
 * requirement. The real storage work (runMigrations, first-boot write) has already
 * executed synchronously in main.tsx before React mounts. StorageProvider simply
 * makes the codec helpers available via useStorage() for any component that needs
 * them, and reserves the provider slot for Phase 2+ features (e.g. multi-tab
 * window.storage event listeners per RESEARCH.md Pitfall 8).
 *
 * DO NOT call runMigrations() here. It was already called in main.tsx.
 */

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { K, readWithSchema, writeJSON, removeKey } from './index'

type StorageContextValue = {
  K: typeof K
  readWithSchema: typeof readWithSchema
  writeJSON: typeof writeJSON
  removeKey: typeof removeKey
}

const StorageContext = createContext<StorageContextValue | null>(null)

const STORAGE_VALUE: StorageContextValue = {
  K,
  readWithSchema,
  writeJSON,
  removeKey,
}

export function StorageProvider({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <StorageContext.Provider value={STORAGE_VALUE}>
      {children}
    </StorageContext.Provider>
  )
}

/**
 * Returns the storage codec helpers (K, readWithSchema, writeJSON, removeKey).
 * Must be used inside a <StorageProvider>.
 */
export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext)
  if (ctx === null) {
    throw new Error('useStorage must be used inside <StorageProvider>')
  }
  return ctx
}
