import { createTheme } from '@mantine/core'
import type { MantineThemeOverride } from '@mantine/core'

/**
 * Halo brand theme for Mantine 9.
 *
 * primaryColor: 'indigo' — Mantine's built-in indigo palette; modern B2B SaaS look
 * fontFamily: Inter with system-font fallback chain (no @fontsource/inter needed — deferred to Phase 5 polish)
 * defaultRadius: 'md' — standard rounded corners that look professional without being extreme
 *
 * Consumed by:
 *  - src/App.tsx (MantineProvider theme prop)
 *  - Plan 04 provider stack (MantineProvider already wraps the tree)
 *  - Plan 06 UI primitives (theme is live; no further wiring needed)
 */
export const haloTheme: MantineThemeOverride = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
})
