/**
 * Halo tasks — TypeScript types (Phase 3).
 *
 * Every type in this file is derived from a Zod schema in `./schemas` via
 * `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel
 * type declarations here. If a field shape changes, edit the schema; the type
 * follows automatically.
 */

import type { z } from 'zod'
import type {
  TaskSchema,
  TaskStatusEnum,
  TaskPriorityEnum,
  AssigneeSchema,
} from './schemas'

// ---------------------------------------------------------------------------
// Persistence record types — what lives in localStorage
// ---------------------------------------------------------------------------

export type Task = z.infer<typeof TaskSchema>
export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type TaskPriority = z.infer<typeof TaskPriorityEnum>
export type Assignee = z.infer<typeof AssigneeSchema>
