import React from 'react'
import { Anchor, Image, Stack, Text } from '@mantine/core'

/**
 * Phase 1 landing page — placeholder for the public index route `/`.
 *
 * Phase-specific notes:
 *   - Phase 2 adds real /signin and /signup routes. The Anchor links below are
 *     intentionally non-functional in Phase 1 — they confirm the Landing component
 *     is rendering as the index of `/` and provide visible placeholders.
 *   - Phase 1 uses Mantine's <Anchor> directly. Plan 06 (UI primitives) has not
 *     run yet in the wave order, so the wrapped primitive is not available here.
 */
export function Landing(): React.JSX.Element {
  return (
    <Stack gap="lg" pt="xl">
      <Image
        src="/halo-logo.png"
        alt="Halo"
        h={56}
        w="auto"
        fit="contain"
      />
      <Text c="dimmed" size="lg">
        A demo project and task management app. All data is fabricated and persisted only
        in your browser — safe to explore without entering real information.
      </Text>
      <Stack gap="xs">
        <Anchor href="/signin">Sign in (Phase 2)</Anchor>
        <Anchor href="/signup">Sign up (Phase 2)</Anchor>
      </Stack>
    </Stack>
  )
}
