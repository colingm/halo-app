/**
 * Halo auth store. Zustand store composing `src/auth/authRepo` +
 * `src/storage/codec` + `src/auth/wizardSession` into the user-identity state
 * machine. Hydrates synchronously at module-init level (NOT inside a React
 * effect hook) so route guards see a populated `isAuthenticated` value on
 * the very first render — AUTH-10 (refresh-survives-auth) depends on this
 * ordering.
 *
 * Why hand-rolled persistence instead of the persist middleware: Zustand's
 * persist middleware reads/writes synchronously to localStorage but doesn't
 * compose cleanly with the existing readWithSchema(K.session(), SessionSchema,
 * null) validation pattern used by every other persistent read in the app.
 * Rolling our own setSession / clearSession writes is simpler and keeps
 * codec usage uniform across the codebase (FND-04 — every persistent
 * access flows through the codec).
 *
 * Demo-app caveat (T-02-20): an attacker with DevTools can edit
 * `halo:v1:session` to forge a session pointer to any existing visitor. This
 * is explicitly acceptable per `.planning/PROJECT.md` "Out of Scope: Real
 * authentication" — Halo is a Pendo demo surface, not a production auth
 * contract. Do not treat any of this as security-grade.
 *
 * Phase boundary: this module owns the AUTH-10 (refresh persistence) and
 * AUTH-11 (sign-out clearing) requirements. End-to-end verification of
 * those requirements happens in Plans 02-09 (wizard completion) and 02-10
 * (sign-in page), which wire up the calling pages.
 */

import { create } from 'zustand'
import { K, readWithSchema, writeJSON, removeKey, SessionSchema } from '../storage'
import type { Visitor, Workspace, Session } from './types'
import {
  getVisitorById,
  getWorkspaceById,
  findVisitorByEmail,
  listWorkspaces,
} from './authRepo'
import { verifyPassword } from './passwordHash'
import { clearWizardDraft } from './wizardSession'

// TODO Phase 4+: subscribe to window.storage events for cross-tab session sync.
// Phase 2 UI-SPEC does not require multi-tab session revocation; Plan 01-03's
// SUMMARY reserves this slot.

/**
 * `signInWithCredentials` result. A single failure variant (no
 * "user not found" vs "wrong password" distinction) defends against
 * username enumeration via the API surface (T-02-21).
 */
export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' }

type AuthState = {
  currentVisitor: Visitor | null
  currentWorkspace: Workspace | null
  /** `currentVisitor !== null && currentWorkspace !== null`. Kept as an
   *  explicit slice so consumers can `useAuthStore((s) => s.isAuthenticated)`
   *  without re-deriving the boolean on every render. */
  isAuthenticated: boolean
  setSession: (visitor: Visitor, workspace: Workspace) => void
  clearSession: () => void
  signInWithCredentials: (email: string, password: string) => Promise<SignInResult>
  signInFromVisitor: (visitor: Visitor, workspace: Workspace) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentVisitor: null,
  currentWorkspace: null,
  isAuthenticated: false,

  setSession: (visitor, workspace) => {
    const session: Session = {
      visitorId: visitor.id,
      workspaceId: workspace.id,
      signedInAt: new Date().toISOString(),
    }
    writeJSON(K.session(), session)
    set({
      currentVisitor: visitor,
      currentWorkspace: workspace,
      isAuthenticated: true,
    })
  },

  clearSession: () => {
    removeKey(K.session())
    set({
      currentVisitor: null,
      currentWorkspace: null,
      isAuthenticated: false,
    })
  },

  signInWithCredentials: async (email, password) => {
    const visitor = findVisitorByEmail(email)
    if (visitor === undefined) {
      return { ok: false, reason: 'invalid_credentials' }
    }

    const passwordOk = await verifyPassword(password, visitor.passwordHash)
    if (!passwordOk) {
      return { ok: false, reason: 'invalid_credentials' }
    }

    // Phase 2 ships exactly one workspace per visitor — the one created at
    // signup. Phase 4+ may add multi-workspace; the sign-in path picks the
    // owner-workspace as the default sign-in context.
    const workspace = listWorkspaces().find((w) => w.ownerVisitorId === visitor.id)
    if (workspace === undefined) {
      // Defensive — the wizard always creates a workspace alongside the
      // visitor (Plan 02-09), so this should never trigger. Treat as a
      // sign-in failure rather than crash.
      return { ok: false, reason: 'invalid_credentials' }
    }

    get().setSession(visitor, workspace)
    return { ok: true }
  },

  signInFromVisitor: (visitor, workspace) => {
    get().setSession(visitor, workspace)
  },

  signOut: async () => {
    const visitor = get().currentVisitor
    const workspace = get().currentWorkspace
    if (typeof pendo !== 'undefined') {
      pendo.track('signout_completed', {
        visitorId: visitor?.id ?? '',
        workspaceId: workspace?.id ?? '',
      })
    }
    get().clearSession()
    clearWizardDraft()
    return Promise.resolve()
  },
}))

/**
 * Module-init hydration. Reads `halo:v1:session` through `readWithSchema`
 * (so a tampered or schema-invalid value falls through to `null`), then
 * resolves the referenced visitor + workspace via `authRepo`. On orphan
 * session (session points at records that no longer exist), self-heals by
 * removing the bad session key so the user lands signed-out cleanly.
 *
 * Runs ONCE at module load — see the bare call at the bottom of this file.
 * Not wrapped in a React effect hook because we need the store populated
 * BEFORE React first renders (so `RequireAuth` guards in Plan 02-06 don't
 * flash sign-in for a signed-in user). StrictMode's double-mount applies
 * to React effects; module-init code runs once.
 *
 * Exported so tests (and possibly a future `window.storage` listener) can
 * re-trigger hydration on demand.
 */
export function hydrateAuthFromStorage(): void {
  const session = readWithSchema<Session | null>(K.session(), SessionSchema, null)
  if (session === null) return

  const visitor = getVisitorById(session.visitorId)
  const workspace = getWorkspaceById(session.workspaceId)
  if (visitor === undefined || workspace === undefined) {
    // Orphan session — the pointer references records that no longer exist
    // (deleted, corrupt visitor array, or a stale demo state). Self-heal by
    // removing the bad session key; user boots signed-out.
    removeKey(K.session())
    return
  }

  useAuthStore.setState({
    currentVisitor: visitor,
    currentWorkspace: workspace,
    isAuthenticated: true,
  })
}

// Run once at module-init level — strictly NOT inside any function/component
// body. This executes when the module is first imported, which (via the
// AuthProvider → App.tsx import chain) happens before `createRoot().render()`.
hydrateAuthFromStorage()
