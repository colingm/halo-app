/**
 * Halo task display labels (Phase 3).
 *
 * UI-layer mapping ONLY — do NOT add these to the Zod schemas. The schemas
 * own the wire/storage shape (snake_case for status, no labels); this module
 * owns the screen shape. Dashboard chart legends (Phase 3) and Phase 4
 * filter chips share this single source of truth.
 *
 * Record<TaskStatus, string> annotation forces exhaustiveness — if a future
 * phase adds a status to TaskStatusEnum, TypeScript flags the missing label
 * here at compile time (same discipline as z.infer in types.ts).
 */

import type { TaskStatus, TaskPriority } from './types'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
