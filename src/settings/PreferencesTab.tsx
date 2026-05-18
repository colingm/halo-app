/**
 * Settings — Preferences tab (SET-04 + Danger zone trigger for SET-06).
 *
 * Two stacked sections:
 *
 *   1. Theme toggle. A Mantine `<SegmentedControl>` bound to
 *      `useMantineColorScheme()` with Light / Dark / System segments.
 *      Persistence is owned by Mantine — writes to localStorage key
 *      `mantine-color-scheme-value`, which is OUTSIDE the halo:v* envelope
 *      so it survives Reset demo data (D-16 + D-26 locks).
 *
 *   2. Danger zone. A bordered `<Paper>` with a red title + body copy +
 *      outline-red "Reset demo data" button that opens
 *      `ResetDemoDataModal`. The destructive flow is gated by the modal —
 *      no inline confirm. UI-03 + D-17 + SET-06.
 *
 * Plan 04-01 wired the boot path (`defaultColorScheme="auto"` in App.tsx +
 * the inline ColorSchemeScript in index.html) so changing the segment
 * here propagates instantly through every Mantine surface that uses
 * `var(--mantine-color-*)` tokens — the AppShell, Dashboard, Lists,
 * Reports, and Settings itself.
 */

import { useState } from 'react'
import { Stack, Group, Paper, Title, Text, Box, SegmentedControl, useMantineColorScheme } from '@mantine/core'
import { IconSun, IconMoon, IconDeviceLaptop, IconAlertTriangle } from '@tabler/icons-react'
import { Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { ResetDemoDataModal } from './ResetDemoDataModal'

type ColorScheme = 'light' | 'dark' | 'auto'

export function PreferencesTab(): React.JSX.Element {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <Stack gap="xl">
      {/* Theme toggle — Light / Dark / System SegmentedControl */}
      <Stack gap="sm">
        <Text size="sm" fw={500}>Theme</Text>
        <SegmentedControl
          data={[
            { value: 'light', label: <Group gap={8} wrap="nowrap"><IconSun size={14} />Light</Group> },
            { value: 'dark', label: <Group gap={8} wrap="nowrap"><IconMoon size={14} />Dark</Group> },
            { value: 'auto', label: <Group gap={8} wrap="nowrap"><IconDeviceLaptop size={14} />System</Group> },
          ]}
          value={colorScheme}
          onChange={(v) => {
            const previousTheme = colorScheme
            setColorScheme(v as ColorScheme)
            if (typeof pendo !== 'undefined') {
              pendo.track('theme_changed', {
                newTheme: v,
                previousTheme,
              })
            }
          }}
          data-pendo-id={PENDO_IDS.settings.preferences.themeToggle}
        />
      </Stack>

      {/* Danger zone card (D-17 + UI-03) */}
      <Paper withBorder p="lg" radius="md" mt="xl">
        <Stack gap="md">
          <Title order={3} c="red.7">Danger zone</Title>
          <Text size="md">
            Reset all demo data for this workspace. This will permanently delete all tasks,
            settings, and accounts in this browser, and sign you out.
          </Text>
          <Box>
            <Button
              color="red"
              variant="outline"
              leftSection={<IconAlertTriangle size={16} />}
              pendoId={PENDO_IDS.settings.dangerZone.button}
              onClick={() => setResetOpen(true)}
            >
              Reset demo data
            </Button>
          </Box>
        </Stack>
      </Paper>

      <ResetDemoDataModal opened={resetOpen} onClose={() => setResetOpen(false)} />
    </Stack>
  )
}
