/**
 * Halo Reports — Read-only TanStack Table (Phase 4, plan 04-05 Task 1.C).
 *
 * Six columns per UI-SPEC §"Reports TanStack Table" lines 744-756 + D-21:
 *
 *   1. Title         — `<Text size="sm">{task.title}</Text>` (sortable)
 *   2. Status        — `<Badge color={TASK_STATUS_BADGE_COLOR[...]}>` (sortable)
 *   3. Priority      — `<Badge color={TASK_PRIORITY_BADGE_COLOR[...]}>` (sortable)
 *   4. Assignee      — `<Text size="sm">{task.assignee?.name ?? '—'}</Text>` (sortable)
 *   5. Due date      — `dayjs(value).utc().format('MMM D, YYYY')` or '—' (sortable)
 *   6. Completed at  — `dayjs(value).utc().format('MMM D, YYYY')` or '—' (sortable)
 *
 * Both date cells are UTC-anchored (04-REVIEW.md CR-01, 04-06-PLAN.md Task B).
 * `dueDate` is stored as `*.toISOString()` of a UTC-midnight Date so the read
 * formatter must format in UTC to render the picked calendar day. `completedAt`
 * is an instant (`new Date().toISOString()` at status→done); rendering it in
 * UTC gives cross-column consistency with `dueDate` and matches the CSV column
 * convention. Trade-off: a "completed at" instant in UTC is slightly less
 * natural than local time, but internal consistency wins for this demo.
 *
 * No actions column (Reports is read-only — edits live on Lists per D-21).
 * No leading checkbox (no per-row mutation).
 *
 * Default sort: `createdAt` desc. Implemented as pre-sort of the input slice +
 * empty initial `SortingState` — mirrors `src/tasks/components/TaskTable.tsx`
 * three-state click cycle (asc → desc → clear → default presorted order).
 *
 * Cell padding shared with TaskTable.module.css (sm vertical / md horizontal).
 * Wrapped in `<Paper withBorder p={0} radius="md" overflow="hidden">` with the
 * Reports table-container pendo target so guides can hit the table as a unit.
 *
 * Empty state (filters yield zero): inline `<Center py="xl">` with dimmed copy
 * "No tasks match these filters." — no clear-filters anchor per UI-SPEC line 769
 * (filters are individually clearable via each control's own behavior).
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
  Center,
} from '@mantine/core'
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_BADGE_COLOR,
  TASK_PRIORITY_BADGE_COLOR,
} from '../tasks/labels'
import type { Task } from '../tasks/types'
import classes from '../tasks/components/TaskTable.module.css'

export type ReportsTableProps = {
  /** Already filtered + pre-sorted (createdAt desc) tasks. */
  tasks: Task[]
}

const helper = createColumnHelper<Task>()

export function ReportsTable({ tasks }: ReportsTableProps): React.JSX.Element {
  // Default order: createdAt desc. TanStack sees an empty sorting array; this
  // presorted slice IS the default. When a header is clicked, TanStack's sorted
  // row model takes over (three-state asc → desc → clear → default).
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
      helper.accessor('title', {
        header: 'Title',
        cell: (info) => <Text size="sm">{info.getValue()}</Text>,
      }),
      helper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          return (
            <Badge color={TASK_STATUS_BADGE_COLOR[status]} variant="light" size="sm">
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
            <Badge color={TASK_PRIORITY_BADGE_COLOR[priority]} variant="light" size="sm">
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
              {value ? dayjs(value as string).utc().format('MMM D, YYYY') : '—'}
            </Text>
          )
        },
      }),
      helper.accessor('completedAt', {
        header: 'Completed at',
        cell: (info) => {
          const value = info.getValue()
          return (
            <Text size="sm">
              {value ? dayjs(value as string).utc().format('MMM D, YYYY') : '—'}
            </Text>
          )
        },
      }),
    ],
    [],
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
    <Paper
      withBorder
      p={0}
      radius="md"
      data-pendo-id={PENDO_IDS.reports.table.container}
      style={{ overflow: 'hidden' }}
    >
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
          {tasks.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Center py="xl">
                  <Text c="dimmed">No tasks match these filters.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id} className={classes.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}
