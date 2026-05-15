/**
 * Storage key builders for the Halo localStorage envelope.
 *
 * All persistent localStorage keys must be constructed via the `K` object.
 * Do NOT use raw string literals for keys outside this module.
 *
 * Namespace schema: `halo:v{SCHEMA_VERSION}:{domain}[:{qualifier}]`
 */

/** Current schema version — bump this when a breaking localStorage shape change ships.
 *  The migration runner in `migrations.ts` must have a handler registered for each
 *  source version before bumping. */
export const SCHEMA_VERSION = 1

/** Application version — keep in sync with package.json `version` field.
 *  Updated during Phase 5 polish. */
export const APP_VERSION = '0.1.0'

/**
 * Namespaced key builders.
 *
 * Keys are functions (even zero-argument ones) so the API stays uniform when
 * scoped keys like `tasks(accountId)` are added in Phase 4.
 *
 * Phase 2+ extends this object — do NOT add keys outside this file.
 *
 * Storage-backend note:
 *   Every key in `K` is consumed against `localStorage` EXCEPT `K.signupDraft()`,
 *   which Plan 02-04 writes to `sessionStorage` (per UI-SPEC AUTH-07 — wizard
 *   draft state must clear when the browser session ends so abandoned signups
 *   don't leak between users on shared machines). The key builder itself is
 *   storage-agnostic; the consumer module decides which backend reads/writes.
 */
export const K = {
  /** `halo:v1:meta` — boot-time schema version + seed timestamp record */
  meta: (): string => `halo:v${SCHEMA_VERSION}:meta`,

  /** `halo:v1:pendo:anonId` — anonymous Pendo visitor ID (set in Phase 6) */
  pendoAnonId: (): string => `halo:v${SCHEMA_VERSION}:pendo:anonId`,

  /** `halo:v1:visitors` — array of registered Visitor records (Plan 02-03 owns the repo). */
  visitors: (): string => `halo:v${SCHEMA_VERSION}:visitors`,

  /** `halo:v1:workspaces` — array of Workspace records, one per registered visitor (Plan 02-03). */
  workspaces: (): string => `halo:v${SCHEMA_VERSION}:workspaces`,

  /** `halo:v1:tasks:{workspaceId}` — per-workspace task array (Phase 3 seeder + Phase 4 CRUD).
   *  Each workspace has its own bucket so the key namespace is forward-compatible with
   *  multi-workspace switching (v2). */
  tasks: (workspaceId: string): string => `halo:v${SCHEMA_VERSION}:tasks:${workspaceId}`,

  /** `halo:v1:teammates:{workspaceId}` — per-workspace teammate array (Phase 5 D-01).
   *  Pattern mirrors K.tasks; no SCHEMA_VERSION bump because the key is additive. */
  teammates: (workspaceId: string): string => `halo:v${SCHEMA_VERSION}:teammates:${workspaceId}`,

  /** `halo:v1:session` — current Session record (visitorId + workspaceId + signedInAt). */
  session: (): string => `halo:v${SCHEMA_VERSION}:session`,

  /** `halo:v1:signup:draft` — wizard partial draft. Lives in `sessionStorage`, NOT `localStorage`
   *  (see file-level "Storage-backend note" above). Cleared on signup completion / sign-out. */
  signupDraft: (): string => `halo:v${SCHEMA_VERSION}:signup:draft`,
} as const
