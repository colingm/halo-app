/**
 * Settings — Reset demo data modal (SET-06 + UI-03 + D-17).
 *
 * Destructive-action confirmation modal. Opening is owned by PreferencesTab
 * (via the Danger zone button); this component just renders the modal and
 * the reset handler.
 *
 * Reset sequence (D-17 lock):
 *
 *   1. Enumerate `localStorage` for keys starting with the `halo:v` prefix
 *      and remove each. This covers `halo:v1:visitors`, `halo:v1:workspaces`,
 *      `halo:v1:session`, `halo:v1:tasks:<workspaceId>`, `halo:v1:meta`, and
 *      any forward-compatible v-bumped keys.
 *
 *   2. Wipe the sessionStorage signup draft via `K.signupDraft()`. Wrapped
 *      in try/catch to absorb private-browsing sessionStorage throws
 *      (T-04-04-05 mitigation).
 *
 *   3. Do NOT remove Mantine's color-scheme localStorage key — theme
 *      preference survives reset per D-17 + D-26. Mantine owns that key;
 *      it is OUTSIDE the halo:v* envelope by design.
 *
 *   4. Hard reload to '/'. Window navigation (not React Router) is the
 *      deliberate choice — re-runs the boot sequence (Mantine init, codec
 *      hydration, auth store module-init) with clean state.
 *
 * No `notifications.show()` after reset — the hard reload destroys the JS
 * context before any toast could render (UI-SPEC §"Toast Notifications"
 * line 848 lock).
 *
 * FND-04 codec exception: bulk wipe by prefix requires enumerating
 * `localStorage.key(i)`, which `src/storage/codec.ts` does not expose
 * (codec's `removeKey()` is single-key only). Direct localStorage access
 * here is the SOLE caller-site exception in the codebase; documented
 * inline below.
 */

import { Modal, Group, Title, Text } from '@mantine/core'
import { Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { K } from '../storage/keys'

export type ResetDemoDataModalProps = {
  opened: boolean
  onClose: () => void
}

export function ResetDemoDataModal({ opened, onClose }: ResetDemoDataModalProps): React.JSX.Element {
  const handleReset = () => {
    // 1. Bulk-wipe halo:v* prefix keys from localStorage.
    //
    // Deliberate exception to FND-04 codec rule (S6): bulk wipe by prefix needs
    // to enumerate keys, which the codec does not expose. The codec's removeKey()
    // helper handles single keys; for prefix scan we call localStorage directly.
    //
    // Two-pass: collect keys first, then remove. Modifying localStorage during
    // a `localStorage.key(i)` iteration shifts indices and silently skips keys.
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('halo:v')) keysToRemove.push(key)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // 2. Wipe sessionStorage signup draft.
    // T-04-04-05 mitigation: private-browsing sessionStorage access can throw.
    // Failure here MUST NOT block the localStorage wipe + hard reload — by the
    // time we reach this point, the user's expectation is "reset is irreversible".
    try {
      sessionStorage.removeItem(K.signupDraft())
    } catch {
      // Swallow — private-browsing or quota-exceeded; the hard reload below
      // re-runs the auth hydration which self-heals stale drafts anyway.
    }

    // 3. Do NOT remove Mantine's color-scheme localStorage key (D-17 + D-26
    //    lock — theme preference survives reset). This is the ONLY localStorage
    //    key deliberately preserved across the reset because Mantine owns it
    //    and it lives outside the halo:v* envelope by design.

    // 4. Hard reload — re-runs boot sequence with clean state.
    window.location.href = '/'
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>Reset demo data?</Title>}
      size="sm"
      centered
    >
      <Text size="md">
        This will permanently delete all tasks, settings, and accounts in this browser,
        and sign you out. This cannot be undone.
      </Text>
      <Group justify="flex-end" mt="lg" gap="md">
        <Button
          variant="default"
          pendoId={PENDO_IDS.settings.dangerZone.confirmCancel}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color="red"
          variant="filled"
          pendoId={PENDO_IDS.settings.dangerZone.confirmButton}
          onClick={handleReset}
        >
          Reset demo data
        </Button>
      </Group>
    </Modal>
  )
}
