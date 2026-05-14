import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Stack,
  Group,
  SimpleGrid,
  Paper,
  Text,
  Title,
  Timeline,
  SegmentedControl,
  Center,
} from '@mantine/core'
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconClipboardCheck,
} from '@tabler/icons-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
  Legend,
} from 'recharts'
import { Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { useAuthStore } from '../auth'
import { listTasks, TASK_STATUS_LABELS } from '../tasks'
import type { Task } from '../tasks'
import { formatRelative } from './relative-time'

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

type Range = '7' | '30' | '90'
type DayBucket = { date: string; count: number }
type StatusSlice = { name: string; value: number; status: 'todo' | 'in_progress' | 'done' }

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Computes the "now" reference anchor (D-21).
 * Returns max(task.createdAt, task.updatedAt, task.completedAt) across all
 * tasks; defaults to new Date() when the tasks array is empty.
 */
function computeNowRef(tasks: Task[]): Date {
  if (tasks.length === 0) return new Date()

  let maxMs = 0
  for (const task of tasks) {
    const candidates = [
      new Date(task.createdAt).getTime(),
      new Date(task.updatedAt).getTime(),
    ]
    if (task.completedAt !== null) {
      candidates.push(new Date(task.completedAt).getTime())
    }
    for (const ms of candidates) {
      if (!isNaN(ms) && ms > maxMs) maxMs = ms
    }
  }
  return new Date(maxMs)
}

/**
 * Computes the start of the selected time window.
 */
function rangeStartFor(nowRef: Date, range: Range): Date {
  return new Date(nowRef.getTime() - parseInt(range, 10) * 86_400_000)
}

/**
 * Computes the 5 KPI values (D-17).
 */
function computeKpis(
  tasks: Task[],
  nowRef: Date,
  range: Range,
): {
  active: number
  completedInRange: number
  overdue: number
  completionRate: string
  avgCycleTime: string
} {
  const rangeStart = rangeStartFor(nowRef, range)

  const active = tasks.filter((t) => t.status !== 'done').length

  const completedInRange = tasks.filter(
    (t) =>
      t.completedAt !== null &&
      new Date(t.completedAt) >= rangeStart &&
      new Date(t.completedAt) <= nowRef,
  ).length

  const overdue = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.dueDate !== null &&
      new Date(t.dueDate) < nowRef,
  ).length

  const createdInRangeStillOpen = tasks.filter(
    (t) =>
      new Date(t.createdAt) >= rangeStart &&
      new Date(t.createdAt) <= nowRef &&
      t.status !== 'done',
  ).length
  const completionRateDenominator = completedInRange + createdInRangeStillOpen
  const completionRate =
    completionRateDenominator === 0
      ? '—'
      : `${Math.round((completedInRange / completionRateDenominator) * 100)}%`

  const cycleTasksInRange = tasks.filter(
    (t) =>
      t.completedAt !== null && new Date(t.completedAt) >= rangeStart,
  )
  const avgCycleTime =
    cycleTasksInRange.length === 0
      ? '—'
      : `${(
          cycleTasksInRange.reduce((sum, t) => {
            const completedMs = new Date(t.completedAt as string).getTime()
            const createdMs = new Date(t.createdAt).getTime()
            return sum + (completedMs - createdMs) / 86_400_000
          }, 0) / cycleTasksInRange.length
        ).toFixed(1)}d`

  return { active, completedInRange, overdue, completionRate, avgCycleTime }
}

/**
 * Produces one DayBucket per day in the selected window (D-18).
 * Date format: 'YYYY-MM-DD' (sortable; Recharts displays it on the X axis).
 */
function computeDayBuckets(tasks: Task[], nowRef: Date, range: Range): DayBucket[] {
  const rangeStart = rangeStartFor(nowRef, range)
  const windowDays = parseInt(range, 10)
  const buckets: DayBucket[] = []

  for (let i = 0; i < windowDays; i++) {
    const dayStart = new Date(rangeStart.getTime() + i * 86_400_000)
    const dayEnd = new Date(dayStart.getTime() + 86_400_000)

    // Format as YYYY-MM-DD
    const y = dayStart.getUTCFullYear()
    const m = String(dayStart.getUTCMonth() + 1).padStart(2, '0')
    const d = String(dayStart.getUTCDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    const count = tasks.filter(
      (t) =>
        t.completedAt !== null &&
        new Date(t.completedAt) >= dayStart &&
        new Date(t.completedAt) < dayEnd,
    ).length

    buckets.push({ date: dateStr, count })
  }

  return buckets
}

/**
 * Produces the three status slices for the donut chart (D-19).
 * Always emits all three slices (even if value === 0) for consistent rendering.
 */
function computeStatusSlices(tasks: Task[]): StatusSlice[] {
  return [
    {
      name: TASK_STATUS_LABELS.todo,
      value: tasks.filter((t) => t.status === 'todo').length,
      status: 'todo',
    },
    {
      name: TASK_STATUS_LABELS.in_progress,
      value: tasks.filter((t) => t.status === 'in_progress').length,
      status: 'in_progress',
    },
    {
      name: TASK_STATUS_LABELS.done,
      value: tasks.filter((t) => t.status === 'done').length,
      status: 'done',
    },
  ]
}

/**
 * Produces the 8 most recent task events for the timeline (D-22).
 */
function computeRecentEvents(
  tasks: Task[],
): Array<{ task: Task; verb: 'created' | 'updated' | 'completed'; eventAt: string }> {
  const events = tasks.map((task) => {
    const createdMs = new Date(task.createdAt).getTime()
    const updatedMs = new Date(task.updatedAt).getTime()
    const completedMs =
      task.completedAt !== null ? new Date(task.completedAt).getTime() : -Infinity

    const maxMs = Math.max(createdMs, updatedMs, completedMs)

    let verb: 'created' | 'updated' | 'completed'
    let eventAt: string

    if (task.completedAt !== null && completedMs === maxMs) {
      verb = 'completed'
      eventAt = task.completedAt
    } else if (updatedMs > createdMs) {
      verb = 'updated'
      eventAt = task.updatedAt
    } else {
      verb = 'created'
      eventAt = task.createdAt
    }

    return { task, verb, eventAt }
  })

  return events
    .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime())
    .slice(0, 8)
}

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

type KpiCardProps = { pendoId: string; label: string; value: string }

function KpiCard({ pendoId, label, value }: KpiCardProps): React.JSX.Element {
  return (
    <Paper withBorder p="md" radius="md" data-pendo-id={pendoId}>
      <Text size="sm" c="dimmed" tt="uppercase" mb="sm">
        {label}
      </Text>
      <Title order={2}>{value}</Title>
    </Paper>
  )
}

function eventIconColor(verb: 'created' | 'updated' | 'completed'): {
  icon: React.ReactNode
  color: string
} {
  if (verb === 'completed') return { icon: <IconCheck size={14} />, color: 'green.6' }
  if (verb === 'updated') return { icon: <IconEdit size={14} />, color: 'gray.6' }
  return { icon: <IconPlus size={14} />, color: 'indigo.6' }
}

function EmptyState({ onCta }: { onCta: () => void }): React.JSX.Element {
  return (
    <Center mih={400} data-pendo-id={PENDO_IDS.dashboard.emptyState.container}>
      <Stack align="center" gap="md">
        <IconClipboardCheck size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />
        <Title order={3}>No tasks yet</Title>
        <Text c="dimmed" ta="center" maw={420}>
          Looks like your workspace is fresh. Head over to Lists to create your first task and see
          this dashboard come to life.
        </Text>
        <Button variant="filled" pendoId={PENDO_IDS.dashboard.emptyState.cta} onClick={onCta}>
          Go to Lists
        </Button>
      </Stack>
    </Center>
  )
}

// ---------------------------------------------------------------------------
// Dashboard page component
// ---------------------------------------------------------------------------

export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const workspaceId = useAuthStore((s) => s.currentWorkspace?.id)
  const [range, setRange] = useState<Range>('30')

  // Single read — Phase 3 is read-only
  const tasks = useMemo(
    () => (workspaceId ? listTasks(workspaceId) : []),
    [workspaceId],
  )

  const nowRef = useMemo(() => computeNowRef(tasks), [tasks])
  const kpis = useMemo(() => computeKpis(tasks, nowRef, range), [tasks, nowRef, range])
  const dayBuckets = useMemo(
    () => computeDayBuckets(tasks, nowRef, range),
    [tasks, nowRef, range],
  )
  const statusSlices = useMemo(() => computeStatusSlices(tasks), [tasks])
  const recentEvents = useMemo(() => computeRecentEvents(tasks), [tasks])

  // RequireAuth + AppLayout already gate this; belt-and-suspenders
  if (!workspaceId) return <></>

  // Empty state branch (D-23)
  if (tasks.length === 0) {
    return <EmptyState onCta={() => navigate('/app/lists')} />
  }

  return (
    <Stack gap="xl">
      {/* Time-range control — top-right aligned (D-20) */}
      <Group justify="flex-end">
        <SegmentedControl
          data={[
            { value: '7', label: '7d' },
            { value: '30', label: '30d' },
            { value: '90', label: '90d' },
          ]}
          value={range}
          onChange={(v) => setRange(v as Range)}
          data-pendo-id={PENDO_IDS.dashboard.timeRange}
        />
      </Group>

      {/* KPI cards — PRIMARY VISUAL ANCHOR (D-17) */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
        <KpiCard
          pendoId={PENDO_IDS.dashboard.kpi.active}
          label="Active tasks"
          value={kpis.active.toString()}
        />
        <KpiCard
          pendoId={PENDO_IDS.dashboard.kpi.completedInRange}
          label="Completed in range"
          value={kpis.completedInRange.toString()}
        />
        <KpiCard
          pendoId={PENDO_IDS.dashboard.kpi.overdue}
          label="Overdue"
          value={kpis.overdue.toString()}
        />
        <KpiCard
          pendoId={PENDO_IDS.dashboard.kpi.completionRate}
          label="Completion rate"
          value={kpis.completionRate}
        />
        <KpiCard
          pendoId={PENDO_IDS.dashboard.kpi.avgCycleTime}
          label="Avg cycle time"
          value={kpis.avgCycleTime}
        />
      </SimpleGrid>

      {/* Charts row (D-18, D-19) */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Area chart — data-pendo-id on the outer Paper, never on Recharts SVG children (PEN-08) */}
        <Paper
          withBorder
          p="md"
          radius="md"
          data-pendo-id={PENDO_IDS.dashboard.chart.completedPerDay}
        >
          <Text fw={600} mb="md">
            Completed per day
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dayBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-2)" />
              <XAxis dataKey="date" tick={{ fontSize: 14 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b5bdb"
                fill="#4263eb"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>

        {/* Donut chart — data-pendo-id on the outer Paper, never on Recharts SVG children (PEN-08) */}
        <Paper
          withBorder
          p="md"
          radius="md"
          data-pendo-id={PENDO_IDS.dashboard.chart.byStatus}
        >
          <Text fw={600} mb="md">
            Tasks by status
          </Text>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusSlices}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                <Cell fill="#a5b4fc" /> {/* indigo.3 — To do */}
                <Cell fill="#4263eb" /> {/* indigo.6 — In progress */}
                <Cell fill="#adb5bd" /> {/* gray.5 — Done */}
                <Label
                  value={tasks.length}
                  position="center"
                  style={{ fontSize: 16, fontWeight: 600 }}
                />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </SimpleGrid>

      {/* Recent activity timeline (D-22) */}
      <Paper
        withBorder
        p="md"
        radius="md"
        data-pendo-id={PENDO_IDS.dashboard.activity.container}
      >
        <Text fw={600} mb="lg">
          Recent activity
        </Text>
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {recentEvents.map(({ task, verb, eventAt }) => {
            const { icon, color } = eventIconColor(verb)
            return (
              <Timeline.Item
                key={task.id}
                bullet={icon}
                color={color}
                title={
                  <Text size="sm">
                    {task.assignee.name} {verb} &quot;{task.title}&quot;
                  </Text>
                }
                data-pendo-id={PENDO_IDS.dashboard.activity.item}
                data-pendo-task-id={task.id}
              >
                <Text size="sm" c="dimmed">
                  {formatRelative(eventAt, nowRef.toISOString())}
                </Text>
              </Timeline.Item>
            )
          })}
        </Timeline>
      </Paper>
    </Stack>
  )
}
