/**
 * Halo Lists — Task create/edit modal (Phase 4, plan 04-03 Task 1.C).
 *
 * Single shared component for BOTH `mode='create'` and `mode='edit'` per D-07.
 * Uses RHF + Zod via `zodResolver(TaskFormSchema)` (mode='onSubmit', Phase 2
 * locked rhythm). On valid submit:
 *
 *   - create: `tasksRepo.createTask(workspaceId, { ...values, completedAt: null })`
 *     → fires `notifications.show({ title: 'Task created', color: 'green' })`.
 *   - edit:   `tasksRepo.updateTask(workspaceId, initialTask.id, values)`
 *     → fires `notifications.show({ title: 'Changes saved', color: 'green' })`.
 *
 * Then calls `onSuccess()` (parent bumps refreshKey) and `onClose()`.
 *
 * The completedAt invariant is owned by `tasksRepo.updateTask` (D-09) — this
 * form NEVER touches `completedAt`. Even if the user moves status to/from
 * 'done' via the modal, the repo handles the timestamp.
 *
 * Field order locked to UI-SPEC §"Task form modal" lines 326-356: Title /
 * Description / (Status + Priority side-by-side) / (Assignee + Due date
 * side-by-side). Modal footer: edit-mode "Delete task" left-aligned + Discard
 * + Create task / Save changes right-aligned. Save is disabled when edit form
 * is not dirty.
 *
 * Delete-from-edit-modal flow: clicking the left "Delete task" calls
 * `onClose()` FIRST (closes this edit modal), THEN `onRequestDelete?.(task)`
 * (parent opens the delete confirm modal) — modal-on-modal stacking avoided
 * per D-11.
 *
 * Mantine v9 DatePickerInput's onChange returns `DateStringValue` (a
 * `YYYY-MM-DD` string) for `type='default'`. We round-trip it through
 * `new Date(value).toISOString()` so the value stored in the form (and
 * eventually in localStorage via the repo) is a full ISO datetime matching
 * `TaskSchema.dueDate: z.iso.datetime().nullable()`.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, Stack, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import {
  TextInput,
  Textarea,
  Select,
  DatePickerInput,
  Button,
} from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import {
  TaskFormSchema,
  TaskStatusEnum,
  TaskPriorityEnum,
} from '../schemas'
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '../labels'
import type { Task, TaskFormValues, Assignee } from '../types'
import { createTask, updateTask } from '../tasksRepo'
import { getAssigneeOptions } from '../assigneeOptions'
import type { Visitor } from '../../auth/types'

export type TaskFormModalProps = {
  opened: boolean
  onClose: () => void
  /** Parent bumps refreshKey after success so the table re-reads tasks. */
  onSuccess: () => void
  /**
   * Edit mode only: clicking the left "Delete task" closes this modal and
   * asks the parent to open the delete-confirm. Parent owns the second modal
   * to avoid modal-on-modal stacking (D-11).
   */
  onRequestDelete?: (task: Task) => void
  workspaceId: string
  visitor: Visitor
  mode: 'create' | 'edit'
  /** Required when `mode='edit'`. */
  initialTask?: Task
}

const STATUS_OPTIONS = TaskStatusEnum.options.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s],
}))
const PRIORITY_OPTIONS = TaskPriorityEnum.options.map((p) => ({
  value: p,
  label: TASK_PRIORITY_LABELS[p],
}))

export function TaskFormModal({
  opened,
  onClose,
  onSuccess,
  onRequestDelete,
  workspaceId,
  visitor,
  mode,
  initialTask,
}: TaskFormModalProps): React.JSX.Element {
  const defaultAssignee: Assignee = {
    id: visitor.id,
    name: `${visitor.firstName} ${visitor.lastName}`,
  }

  // Wrap defaultValues in useMemo so the `form.reset(defaultValues)` call in the
  // create-mode open-transition effect (below) receives a stable reference and
  // the effect's dep array is honest. Without useMemo, every render produces a
  // new object identity → the effect would re-run on every render rather than
  // only on the false→true open transition for create mode.
  const defaultValues: TaskFormValues = useMemo(
    () =>
      mode === 'edit' && initialTask
        ? {
            title: initialTask.title,
            description: initialTask.description,
            status: initialTask.status,
            priority: initialTask.priority,
            assignee: initialTask.assignee,
            dueDate: initialTask.dueDate,
          }
        : {
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            assignee: defaultAssignee,
            dueDate: null,
          },
    // defaultAssignee is derived from visitor.{id,firstName,lastName}; list its
    // primitives directly so the memo is stable when visitor identity doesn't
    // change but its container reference does.
    [mode, initialTask, visitor.id, visitor.firstName, visitor.lastName],
  )

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    mode: 'onSubmit',
    // Reset across opens / mode flips: RHF holds the values across renders, so
    // when the parent flips `initialTask`, the next open needs the new defaults.
    // RHF's `values` prop drives controlled re-defaulting on edit-mode
    // initialTask flips. It does NOT close the create-mode reopen defect
    // (CR-01) because create-mode defaultValues is structurally identical
    // across opens — handled by the explicit reset effect below.
    values: defaultValues,
  })

  // CR-01 fix: explicit RHF reset on the false→true open transition for create
  // mode. `TaskFormModal` stays mounted across the parent's create/edit cycles,
  // so `useForm`'s internal ref preserves previously-submitted values. The
  // `values: defaultValues` bridge above won't rescue create-mode reopens
  // because RHF's deep-equality short-circuits when create-mode defaultValues
  // is structurally identical to the previously-seen value. Tracking the prior
  // `opened` value via a ref lets us reset ONLY on the transition (not on
  // every render while open), and only for create mode (edit mode is driven
  // by the `values` prop on initialTask flips).
  const prevOpenedRef = useRef(opened)
  useEffect(() => {
    const wasClosed = !prevOpenedRef.current
    prevOpenedRef.current = opened
    if (opened && wasClosed && mode === 'create') {
      form.reset(defaultValues)
    }
  }, [opened, mode, form, defaultValues])

  // Available assignees for this workspace, plus the current visitor. Built
  // as a Map<id, Assignee> so the form can resolve the selected id back to a
  // full Assignee snapshot before submit.
  const assigneeOptions = [
    ...getAssigneeOptions(workspaceId, visitor),
  ]
  const assigneeById = new Map<string, Assignee>()
  // Seed from the visitor (canonical name).
  assigneeById.set(visitor.id, defaultAssignee)
  // If editing, the existing assignee may not be in the workspace tasks
  // (rare — the seeded set should cover this). Seed it so the form can
  // round-trip even an "exotic" assignee.
  if (initialTask) {
    assigneeById.set(initialTask.assignee.id, initialTask.assignee)
  }
  for (const opt of assigneeOptions) {
    if (!assigneeById.has(opt.value)) {
      assigneeById.set(opt.value, { id: opt.value, name: opt.label })
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    if (mode === 'create') {
      createTask(workspaceId, { ...values, completedAt: null })
      notifications.show({
        title: 'Task created',
        message: '',
        color: 'green',
        icon: <IconCheck size={18} />,
        autoClose: 3000,
      })
      if (typeof pendo !== 'undefined') {
        pendo.track('task_created', {
          status: values.status,
          priority: values.priority,
          hasAssignee: Boolean(values.assignee?.id),
          hasDueDate: values.dueDate !== null,
          hasDescription: values.description.length > 0,
        })
      }
    } else if (initialTask) {
      const changedFields = (Object.keys(values) as (keyof typeof values)[])
        .filter((k) => JSON.stringify(values[k]) !== JSON.stringify((initialTask as Record<string, unknown>)[k]))
      updateTask(workspaceId, initialTask.id, values)
      notifications.show({
        title: 'Changes saved',
        message: '',
        color: 'green',
        icon: <IconCheck size={18} />,
        autoClose: 3000,
      })
      if (typeof pendo !== 'undefined') {
        pendo.track('task_updated', {
          taskId: initialTask.id,
          fieldsChanged: changedFields.join(', '),
          newStatus: values.status,
          newPriority: values.priority,
          hasAssignee: Boolean(values.assignee?.id),
          hasDueDate: values.dueDate !== null,
        })
      }
    }
    onSuccess()
    onClose()
  })

  // Select-string narrowing — mirrors Step3CompanyPage's idiom for Mantine
  // <Select>'s `string | null` return type. We assert membership against the
  // Zod enum's `.options` to avoid `as` casts that hide type drift.
  const handleStatusChange = (value: string | null) => {
    if (value === null) return
    const allowed = TaskStatusEnum.options as readonly string[]
    if (allowed.includes(value)) {
      form.setValue('status', value as TaskFormValues['status'], {
        shouldValidate: false,
        shouldDirty: true,
      })
    }
  }

  const handlePriorityChange = (value: string | null) => {
    if (value === null) return
    const allowed = TaskPriorityEnum.options as readonly string[]
    if (allowed.includes(value)) {
      form.setValue('priority', value as TaskFormValues['priority'], {
        shouldValidate: false,
        shouldDirty: true,
      })
    }
  }

  const handleAssigneeChange = (value: string | null) => {
    if (value === null) return
    const assignee = assigneeById.get(value)
    if (assignee) {
      form.setValue('assignee', assignee, {
        shouldValidate: false,
        shouldDirty: true,
      })
    }
  }

  // Mantine v9 DatePickerInput returns DateStringValue (YYYY-MM-DD) for
  // type='default'. We convert to full ISO datetime so it matches
  // `TaskSchema.dueDate: z.iso.datetime().nullable()`.
  const handleDueDateChange = (value: string | null) => {
    if (value === null) {
      form.setValue('dueDate', null, { shouldValidate: false, shouldDirty: true })
      return
    }
    // value is "YYYY-MM-DD"; new Date() interprets as midnight UTC and
    // .toISOString() yields a valid z.iso.datetime() string.
    const iso = new Date(value).toISOString()
    form.setValue('dueDate', iso, { shouldValidate: false, shouldDirty: true })
  }

  const currentDueDate = form.watch('dueDate')
  // Display value is the date portion of the ISO string (YYYY-MM-DD) —
  // matches Mantine v9 DatePickerInput's controlled `value` shape.
  const dueDateValue: string | null = currentDueDate
    ? currentDueDate.slice(0, 10)
    : null

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'New task' : 'Edit task'}
      size="md"
      centered
      keepMounted={false}
      data-pendo-id={PENDO_IDS.lists.modal.container}
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            {...form.register('title')}
            label="Title"
            required
            error={form.formState.errors.title?.message}
            pendoId={PENDO_IDS.lists.modal.title}
          />
          <Textarea
            {...form.register('description')}
            label="Description"
            rows={3}
            error={form.formState.errors.description?.message}
            pendoId={PENDO_IDS.lists.modal.description}
          />
          <Group gap="md" grow>
            <Select
              label="Status"
              data={STATUS_OPTIONS}
              value={form.watch('status') ?? null}
              onChange={handleStatusChange}
              clearable={false}
              error={form.formState.errors.status?.message}
              pendoId={PENDO_IDS.lists.modal.status}
            />
            <Select
              label="Priority"
              data={PRIORITY_OPTIONS}
              value={form.watch('priority') ?? null}
              onChange={handlePriorityChange}
              clearable={false}
              error={form.formState.errors.priority?.message}
              pendoId={PENDO_IDS.lists.modal.priority}
            />
          </Group>
          <Group gap="md" grow>
            <Select
              label="Assignee"
              data={assigneeOptions}
              value={form.watch('assignee')?.id ?? null}
              onChange={handleAssigneeChange}
              clearable={false}
              error={(form.formState.errors.assignee as { message?: string } | undefined)?.message}
              pendoId={PENDO_IDS.lists.modal.assignee}
            />
            <DatePickerInput
              label="Due date"
              clearable
              value={dueDateValue}
              onChange={handleDueDateChange}
              error={form.formState.errors.dueDate?.message}
              pendoId={PENDO_IDS.lists.modal.dueDate}
            />
          </Group>
        </Stack>
        <Group justify="space-between" mt="lg">
          {mode === 'edit' && initialTask ? (
            <Button
              color="red"
              variant="subtle"
              type="button"
              pendoId={PENDO_IDS.lists.modal.delete}
              onClick={() => {
                // Close THIS modal first, then ask parent to open delete confirm
                // — modal-on-modal stacking avoided per D-11.
                onClose()
                onRequestDelete?.(initialTask)
              }}
            >
              Delete task
            </Button>
          ) : (
            <span />
          )}
          <Group gap="md" ml="auto">
            <Button
              variant="default"
              type="button"
              pendoId={PENDO_IDS.lists.modal.cancel}
              onClick={onClose}
            >
              Discard
            </Button>
            <Button
              variant="filled"
              type="submit"
              disabled={mode === 'edit' && !form.formState.isDirty}
              pendoId={PENDO_IDS.lists.modal.save}
            >
              {mode === 'create' ? 'Create task' : 'Save changes'}
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  )
}
