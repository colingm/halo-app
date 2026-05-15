/**
 * Halo team — TypeScript types (Phase 5).
 *
 * Every type in this file is derived from a Zod schema in `./schemas` via
 * `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel
 * type declarations here. If a field shape changes, edit the schema; the type
 * follows automatically.
 */

import type { z } from 'zod'
import type {
  TeammateSchema,
  TeammateStatusEnum,
  WorkspaceRoleEnum,
} from './schemas'

// ---------------------------------------------------------------------------
// Persistence record types — what lives in localStorage
// ---------------------------------------------------------------------------

export type Teammate = z.infer<typeof TeammateSchema>
export type TeammateStatus = z.infer<typeof TeammateStatusEnum>
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>
