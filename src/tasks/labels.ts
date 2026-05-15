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

// ---------------------------------------------------------------------------
// Badge color maps (D-02) — Phase 4 status + priority chip rendering
// ---------------------------------------------------------------------------

/**
 * Mantine color tokens for status badges across Lists, Reports, and the
 * Dashboard activity feed (D-02; 04-UI-SPEC color table lines 109-115).
 * Matches the Phase 3 donut segment colors so the status story is consistent
 * everywhere a task status renders.
 *
 * Record<TaskStatus, string> annotation enforces exhaustiveness — if a new
 * status is added to TaskStatusEnum, TypeScript flags the missing map entry
 * at compile time (same discipline as TASK_STATUS_LABELS above).
 */
export const TASK_STATUS_BADGE_COLOR: Record<TaskStatus, string> = {
  todo: 'indigo.3',
  in_progress: 'indigo.6',
  done: 'gray.5',
}

/**
 * Mantine color tokens for priority badges across Lists and Reports (D-02;
 * 04-UI-SPEC color table lines 112-115). Low → gray, Medium → yellow, High →
 * orange, Urgent → red is the standard severity-escalation gradient.
 *
 * Record<TaskPriority, string> annotation enforces exhaustiveness — same
 * discipline as TASK_PRIORITY_LABELS above.
 */
export const TASK_PRIORITY_BADGE_COLOR: Record<TaskPriority, string> = {
  low: 'gray.5',
  medium: 'yellow.5',
  high: 'orange.5',
  urgent: 'red.6',
}
