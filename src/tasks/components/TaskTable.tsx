/**
 * Halo Lists — TanStack Table v8 (Phase 4, plan 04-03 Task 1.A).
 *
 * Seven columns left → right per 04-UI-SPEC §"TanStack Table (Lists)":
 *
 *   1. Leading Checkbox (no header label) — wraps the Halo Checkbox primitive
 *      with `pendoId={PENDO_IDS.lists.row.completeToggle}` AND
 *      `taskId={task.id}` (CLAUDE.md dynamic-list parameterization rule).
 *      onChange routes through `onToggleComplete` (parent calls tasksRepo).
 *   2. Title — sortable, plain `<Text size="sm">`.
 *   3. Status — sortable, `<Badge color={TASK_STATUS_BADGE_COLOR[...]}>`.
 *   4. Priority — sortable, `<Badge color={TASK_PRIORITY_BADGE_COLOR[...]}>`.
 *   5. Assignee — sortable, plain `<Text size="sm">`.
 *   6. Due date — sortable, UTC-anchored: `value ? dayjs(v).utc().format('MMM D, YYYY') : '—'`
 *      (the stored dueDate is `*.toISOString()` UTC midnight; we render the
 *      calendar day the user picked, independent of browser timezone.
 *      See 04-REVIEW.md CR-01 and 04-06-PLAN.md Task B.)
 *   7. Trailing Actions (no header label) — Mantine `<Menu>` kebab with
 *      Edit + Delete items. The `<ActionIcon>` trigger AND each `<Menu.Item>`
 *      carry `data-pendo-id` + `data-pendo-task-id`.
 *
 * Default sort = `createdAt` desc (newest first). `createdAt` is NOT a visible
 * column; we pre-sort the input `tasks` array and pass an empty initial sort
 * state to TanStack. Once the user clicks any sortable header, TanStack owns
 * the order. Three-state click cycle (asc → desc → clear → default order).
 *
 * Cell padding lives in TaskTable.module.css using Mantine spacing CSS-vars
 * (`var(--mantine-spacing-sm) var(--mantine-spacing-md)`) — no raw px values
 * per UI-SPEC §Spacing.
 *
 * Wrapped in `<Paper withBorder p={0} radius="md" overflow="hidden">` so the
 * border-radius clips the inner table corners cleanly.
 */

import {
  useReactTable,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Paper,
  Table,
  Badge,
  Text,
  Group,
  UnstyledButton,
  ActionIcon,
  Menu,
} from '@mantine/core'
import {
  IconChevronUp,
  IconChevronDown,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react'
import { Checkbox } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_BADGE_COLOR,
  TASK_PRIORITY_BADGE_COLOR,
} from '../labels'
import type { Task } from '../types'
import classes from './TaskTable.module.css'

export type TaskTableProps = {
  /** Already filtered tasks — parent owns the filter logic. */
  tasks: Task[]
  workspaceId: string
  /** Open the edit modal for `task`. */
  onEdit: (task: Task) => void
  /** Open the delete confirm for `task`. */
  onDelete: (task: Task) => void
  /** Status toggle: parent invokes `tasksRepo.updateTask({ status })`. */
  onToggleComplete: (task: Task, nextDone: boolean) => void
}

const helper = createColumnHelper<Task>()

export function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskTableProps): React.JSX.Element {
  // Default order: createdAt desc (newest first). TanStack sees an empty
  // sorting array; this presorted slice IS the default. When a header is
  // clicked, TanStack's sorted row model takes over.
  const presorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [tasks],
  )

  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => [
      helper.display({
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.status === 'done'}
            onChange={(e) => onToggleComplete(row.original, e.currentTarget.checked)}
            pendoId={PENDO_IDS.lists.row.completeToggle}
            taskId={row.original.id}
            aria-label={`Mark "${row.original.title}" complete`}
          />
        ),
        enableSorting: false,
      }),
      helper.accessor('title', {
        header: 'Title',
        cell: (info) => <Text size="sm">{info.getValue()}</Text>,
      }),
      helper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <Badge
              color={TASK_STATUS_BADGE_COLOR[status]}
              variant="light"
              size="sm"
            >
              {TASK_STATUS_LABELS[status]}
            </Badge>
          )
        },
      }),
      helper.accessor('priority', {
        header: 'Priority',
        cell: (info) => {
          const priority = info.getValue()
          return (
            <Badge
              color={TASK_PRIORITY_BADGE_COLOR[priority]}
              variant="light"
              size="sm"
            >
              {TASK_PRIORITY_LABELS[priority]}
            </Badge>
          )
        },
      }),
      helper.accessor((row) => row.assignee?.name ?? '—', {
        id: 'assignee',
        header: 'Assignee',
        cell: (info) => <Text size="sm">{info.getValue()}</Text>,
      }),
      helper.accessor('dueDate', {
        header: 'Due date',
        cell: (info) => {
          const value = info.getValue()
          return (
            <Text size="sm">
              {value ? dayjs(value).utc().format('MMM D, YYYY') : '—'}
            </Text>
          )
        },
      }),
      helper.display({
        id: 'actions',
        header: () => null,
        cell: ({ row }) => (
          <KebabMenu task={row.original} onEdit={onEdit} onDelete={onDelete} />
        ),
        enableSorting: false,
      }),
    ],
    [onEdit, onDelete, onToggleComplete],
  )

  const table = useReactTable({
    data: presorted,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
      <Table className={classes.taskTable} verticalSpacing={0} horizontalSpacing={0}>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const label = flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )
                if (!canSort) {
                  return (
                    <Table.Th key={header.id} className={classes.cell}>
                      <Text size="sm" fw={500} c="dimmed">
                        {label}
                      </Text>
                    </Table.Th>
                  )
                }
                return (
                  <Table.Th key={header.id} className={classes.cell}>
                    <UnstyledButton
                      onClick={() => header.column.toggleSorting()}
                      className={classes.headerButton}
                    >
                      <Group gap={6} wrap="nowrap">
                        <Text size="sm" fw={500} c={sorted ? 'indigo.6' : undefined}>
                          {label}
                        </Text>
                        {sorted === 'asc' ? (
                          <IconChevronUp size={14} color="var(--mantine-color-indigo-6)" />
                        ) : sorted === 'desc' ? (
                          <IconChevronDown size={14} color="var(--mantine-color-indigo-6)" />
                        ) : null}
                      </Group>
                    </UnstyledButton>
                  </Table.Th>
                )
              })}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Td key={cell.id} className={classes.cell}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}

// ---------------------------------------------------------------------------
// Row kebab — local component, file-private. Edit + Delete items.
// ---------------------------------------------------------------------------

function KebabMenu({
  task,
  onEdit,
  onDelete,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}): React.JSX.Element {
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          data-pendo-id={PENDO_IDS.lists.row.kebab}
          data-pendo-task-id={task.id}
          aria-label={`Actions for "${task.title}"`}
        >
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconPencil size={16} />}
          data-pendo-id={PENDO_IDS.lists.row.kebabEdit}
          data-pendo-task-id={task.id}
          onClick={() => onEdit(task)}
        >
          Edit
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash size={16} />}
          color="red"
          data-pendo-id={PENDO_IDS.lists.row.kebabDelete}
          data-pendo-task-id={task.id}
          onClick={() => onDelete(task)}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
