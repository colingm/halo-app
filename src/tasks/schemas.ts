/**
 * Halo tasks — Zod schemas (Phase 3).
 *
 * This module is the single source of truth for:
 *
 *   1. Task persistence schemas — `readWithSchema` reads against TasksArraySchema
 *      on every K.tasks(workspaceId) hydration.
 *   2. Status / priority enums — reused by Phase 4's filter UI (LIST-07) and
 *      Phase 3's dashboard label map (src/tasks/labels.ts).
 *   3. Assignee snapshot — embedded shape; Phase 5 TEAM-01 introduces the
 *      canonical K.teammates(workspaceId) store and may rewrite this slot.
 *
 * Schema lock: every field shape in TaskSchema is the Phase 4 LIST contract.
 * Editing TaskSchema is a deliberate cross-phase change, not a refactor.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Enums — declared once, reused across task schema + label map
// ---------------------------------------------------------------------------

/** Status options on Task forms + the persisted Task record. */
export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done'])

/** Priority options on Task forms + the persisted Task record. */
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

// ---------------------------------------------------------------------------
// Embedded sub-schemas
// ---------------------------------------------------------------------------

/**
 * Assignee snapshot embedded in Task. Phase 5 TEAM-01 introduces the canonical
 * K.teammates(workspaceId) store; until then the embedded `name`/`avatar` is the
 * source of truth and `id` is forward-compatible with the future teammates store.
 */
export const AssigneeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
})

// ---------------------------------------------------------------------------
// Task persistence schema
// ---------------------------------------------------------------------------

/**
 * Task record stored at `K.tasks(workspaceId)`.
 *
 * Field notes:
 *   - `description` may be empty string (not min(1)) — tasks may have no description.
 *   - `dueDate` and `completedAt` are nullable ISO datetimes (null = not set).
 *   - `createdAt` / `updatedAt` use `z.iso.datetime()` (Zod 4 idiom — Zod 3's string().datetime() is NOT used).
 */
export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  assignee: AssigneeSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  dueDate: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
})

// ---------------------------------------------------------------------------
// Array schema — multi-record localStorage entry
// ---------------------------------------------------------------------------

/** Array shape of `K.tasks(workspaceId)` localStorage value. */
export const TasksArraySchema = z.array(TaskSchema)

// ---------------------------------------------------------------------------
// Task form schema (D-08) — Phase 4 Lists create/edit modal
// ---------------------------------------------------------------------------

/**
 * RHF form schema for the Phase 4 task create/edit modal (D-08).
 *
 * The 6 user-editable fields: title, description, status, priority, assignee,
 * dueDate. System-managed fields (`id`, `createdAt`, `updatedAt`) and the
 * repo-owned `completedAt` (D-09) are NOT included — `tasksRepo.createTask` /
 * `updateTask` fill those automatically.
 *
 * Field-level error copy locked to 04-UI-SPEC §"Inline Validation Errors (Task
 * Form)" (lines 856-863):
 *
 *   - Title empty → "Enter a task title."
 *   - Status empty / invalid → "Pick a status."
 *   - Priority empty / invalid → "Pick a priority."
 *   - Due date invalid → "Enter a valid date."
 *
 * Description, Assignee, and Due date are optional — no error on empty. The
 * TaskStatusEnum / TaskPriorityEnum re-wraps with form-specific error messages
 * (the persistence enums are deliberately message-less so corrupt storage
 * messages are not user-facing copy).
 */
export const TaskFormSchema = z.object({
  title: z.string().min(1, 'Enter a task title.'),
  description: z.string(),
  status: z.enum(['todo', 'in_progress', 'done'], { message: 'Pick a status.' }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Pick a priority.' }),
  assignee: AssigneeSchema,
  dueDate: z.iso.datetime({ message: 'Enter a valid date.' }).nullable(),
})
