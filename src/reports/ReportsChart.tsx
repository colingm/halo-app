/**
 * Halo Reports — Stacked bar chart (Phase 4, plan 04-05 Task 1.B).
 *
 * Recharts `<BarChart>` with three `<Bar stackId="status">` rendered per day
 * across the selected date range per UI-SPEC §"Reports page" lines 707-740 +
 * D-20. Tick density per UI-SPEC §"X-axis tick density" lines 732-736:
 *
 *   - ≤14 days: one tick per day (every bucket labelled)
 *   - 15-31 days: every 3 days
 *   - 32+ days:  every 10 days
 *
 * Stack order (bottom → top): To do → In progress → Done. Top bar carries
 * `radius={[4, 4, 0, 0]}` for rounded corners.
 *
 * Color resolution per D-18 + UI-SPEC §"Dark mode color contract" lines 138-152:
 * every color flows through `useMantineTheme()` so light + dark schemes resolve
 * cleanly. In dark scheme, in_progress uses `indigo[4]` (better contrast on a
 * dark surface) — swapped via `useComputedColorScheme()`. No hardcoded hex.
 *
 * data-pendo-id on the outer Paper-wrapping div, NEVER on Recharts <Bar> / <rect>
 * SVG children (PEN-08 — mirrors Dashboard.tsx line 361).
 *
 * Timezone convention: the bucket axis (`start`/`end`/`today`) and the
 * createdAt match key BOTH use `dayjs.utc(...)` so the chart agrees with the
 * ReportsPage date-range predicate (also UTC, post 04-06-PLAN.md Task C) on
 * which calendar day a task belongs to. Dashboard.tsx uses native
 * `Date.getUTCFullYear()`/`getUTCMonth()`/`getUTCDate()` for the same reason —
 * the two helpers are not unified because Dashboard's logic is localized to
 * one function and Reports already uses dayjs throughout.
 */

import { Paper, Text, useMantineTheme, useComputedColorScheme } from '@mantine/core'
import dayjs from 'dayjs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import type { Task } from '../tasks/types'

export type ReportsChartProps = {
  /** Already-filtered tasks — parent owns filtering. */
  tasks: Task[]
  /** Active date range; if either bound is null the chart falls back to a 30-day window. */
  dateRange: [Date | null, Date | null]
}

type DayBucket = {
  date: string // 'MMM D' display label
  ymd: string // 'YYYY-MM-DD' (used as sort/match key)
  todo: number
  in_progress: number
  done: number
}

export function ReportsChart({ tasks, dateRange }: ReportsChartProps): React.JSX.Element {
  const theme = useMantineTheme()
  const computed = useComputedColorScheme('light')

  // Theme-resolved colors per D-18 / UI-SPEC lines 138-152.
  const colorTodo = theme.colors.indigo[3]
  const colorInProgress = computed === 'dark' ? theme.colors.indigo[4] : theme.colors.indigo[6]
  const colorDone = theme.colors.gray[5]
  const colorGrid = theme.colors.gray[2]

  // Resolve effective window in UTC so bucket boundaries match the ReportsPage
  // date-range predicate (which also runs in UTC after 04-06-PLAN.md Task C).
  // This keeps the chart bars and the table rows in agreement on "what day a
  // task belongs to," even on a browser west of UTC. See 04-REVIEW.md CR-02
  // and Dashboard.tsx for the existing UTC convention.
  const today = dayjs.utc()
  const start = dateRange[0] ? dayjs.utc(dateRange[0]) : today.subtract(30, 'day')
  const end = dateRange[1] ? dayjs.utc(dateRange[1]) : today
  const dayCount = Math.max(end.diff(start, 'day') + 1, 1)

  // Build day buckets across the selected range. Match by YYYY-MM-DD to avoid
  // timezone drift on createdAt comparisons.
  const dayBuckets: DayBucket[] = Array.from({ length: dayCount }, (_, i) => {
    const day = start.add(i, 'day')
    const ymd = day.format('YYYY-MM-DD')
    // UTC-anchored match key — `t.createdAt` is an ISO instant; we treat it as
    // UTC for bucket assignment so the chart agrees with the ReportsPage
    // date-range predicate (also UTC) after 04-06-PLAN.md Task C.
    const dayTasks = tasks.filter((t) => dayjs.utc(t.createdAt).format('YYYY-MM-DD') === ymd)
    return {
      date: day.format('MMM D'),
      ymd,
      todo: dayTasks.filter((t) => t.status === 'todo').length,
      in_progress: dayTasks.filter((t) => t.status === 'in_progress').length,
      done: dayTasks.filter((t) => t.status === 'done').length,
    }
  })

  // Tick density per D-20 / UI-SPEC lines 732-736.
  let tickStep = 1
  if (dayCount > 14 && dayCount <= 31) tickStep = 3
  else if (dayCount > 31) tickStep = 10
  const ticks = dayBuckets.filter((_, i) => i % tickStep === 0).map((b) => b.date)

  return (
    <Paper withBorder p="md" radius="md">
      <div data-pendo-id={PENDO_IDS.reports.chart.statusByDay}>
        <Text fw={600} mb="md">
          Tasks by status per day
        </Text>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dayBuckets} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={colorGrid} vertical={false} />
            <XAxis dataKey="date" ticks={ticks} tick={{ fontSize: 14 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 14 }} />
            <Bar dataKey="todo" stackId="status" name="To do" fill={colorTodo} />
            <Bar
              dataKey="in_progress"
              stackId="status"
              name="In progress"
              fill={colorInProgress}
            />
            <Bar
              dataKey="done"
              stackId="status"
              name="Done"
              fill={colorDone}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  )
}
