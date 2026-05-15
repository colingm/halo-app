/**
 * Halo team — Zod schemas (Phase 5).
 *
 * This module is the single source of truth for:
 *
 *   1. Team persistence schemas — `readWithSchema` reads against
 *      TeammatesArraySchema on every K.teammates(workspaceId) hydration.
 *   2. WorkspaceRoleEnum — distinct from `Visitor.role` (RoleEnum in
 *      src/auth/schemas.ts). Workspace permission role vs. functional role.
 *
 * Schema lock: every field shape in TeammateSchema is the Phase 5 TEAM
 * contract. Editing TeammateSchema is a deliberate cross-phase change.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums — declared once, reused across teammate schema + UI components
// ---------------------------------------------------------------------------

/** Workspace-permission role (distinct from functional Visitor.role). D-02 lock. */
export const WorkspaceRoleEnum = z.enum(['Owner', 'Admin', 'Member', 'Viewer'])

/** Teammate status — D-01: 'active' (seeded or accepted) or 'invited' (pending). */
export const TeammateStatusEnum = z.enum(['active', 'invited'])

// ---------------------------------------------------------------------------
// Teammate persistence schema
// ---------------------------------------------------------------------------

/**
 * Teammate record stored at `K.teammates(workspaceId)`.
 *
 * Field notes:
 *   - `lastName` may be empty string — invited rows derive only firstName from email local-part.
 *   - `lastActiveAt` is null for invited rows (not yet active).
 *   - `invitedAt` is non-null for invited rows, null for active rows.
 *   - `avatar` may be null — falls back to Mantine Avatar initials.
 */
export const TeammateSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string(),                        // may be empty (invited rows derive only firstName)
  email: z.string().email(),
  workspaceRole: WorkspaceRoleEnum,
  status: TeammateStatusEnum,
  lastActiveAt: z.iso.datetime().nullable(),   // null for invited rows
  invitedAt: z.iso.datetime().nullable(),      // non-null for invited; null for active
  avatar: z.string().nullable(),               // URL or null (Mantine Avatar initials fallback)
})

// ---------------------------------------------------------------------------
// Array schema — multi-record localStorage entry
// ---------------------------------------------------------------------------

/** Array shape of `K.teammates(workspaceId)` localStorage value. */
export const TeammatesArraySchema = z.array(TeammateSchema)
