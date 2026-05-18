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
 *
 * Note on the two-pass collect-then-remove loop: collecting keys into an
 * array before removal is the CORRECT pattern for iterating over localStorage
 * while removing keys. Modifying localStorage during a `localStorage.key(i)`
 * forward iteration shifts indices and silently skips keys. The two-pass
 * approach is deliberately correct — do NOT "fix" it to a single-pass loop.
 *
 * UAT 2b contract clarification — halo:v1:meta after reset:
 *
 * At reset-confirm time, the two-pass scan-then-remove deletes EVERY key
 * whose name starts with `halo:v`, including `halo:v1:meta`. The
 * user-observable state at this exact moment (before the hard reload) is:
 * zero `halo:v1:*` keys remain in localStorage. The wipe contract is honored.
 *
 * Immediately after, `window.location.href = '/'` triggers a hard reload.
 * The reload re-runs the app boot sequence: `src/main.tsx` calls
 * `runMigrations()` (from `src/storage/migrations.ts`) BEFORE React mounts.
 * `runMigrations()` calls `peekRaw(K.meta())` — finds `null` — and writes
 * `DEFAULT_META = { schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }`
 * as the storage envelope's boot record. This is by design: the codec and
 * migration runner require meta to exist before any other key is read or
 * written.
 *
 * The post-reload `halo:v1:meta` contains NO user data (no tasks, no
 * visitors, no workspaces, no session). It is purely the schema-version
 * envelope: `{ schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }`.
 * The `seededAt: null` value means the app is in a fresh-boot state and
 * will re-run the fake-data seed on first authenticated workspace load.
 *
 * Future UAT runners who observe `halo:v1:meta` in localStorage after reset
 * should inspect its VALUE. If it is `{ schemaVersion: 1, seededAt: null,
 * appVersion: '0.1.0' }` with no embedded tasks/visitors/workspaces, the
 * reset contract is honored. Only a meta value with non-null `seededAt` OR
 * with embedded user data would indicate a true wipe failure.
 */

import { Modal, Group, Text } from '@mantine/core'
import { Button } from '../ui/primitives'
import { PENDO_IDS } from '../pendo/PENDO_IDS'
import { K } from '../storage/keys'
import { useAuthStore } from '../auth/authStore'

export type ResetDemoDataModalProps = {
  opened: boolean
  onClose: () => void
}

export function ResetDemoDataModal({ opened, onClose }: ResetDemoDataModalProps): React.JSX.Element {
  const handleReset = () => {
    // Track the reset event before wiping data.
    if (typeof pendo !== 'undefined') {
      const auth = useAuthStore.getState()
      pendo.track('demo_data_reset', {
        workspaceId: auth.currentWorkspace?.id ?? '',
        visitorId: auth.currentVisitor?.id ?? '',
      })
    }

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
    // At this exact moment: zero halo:v1:* keys remain in localStorage.
    // After the hard reload below, runMigrations() writes a fresh halo:v1:meta
    // boot record ({ schemaVersion: 1, seededAt: null, appVersion: '0.1.0' }).
    // That re-creation is expected and contains NO user data — see top-of-file
    // JSDoc for the full UAT 2b contract clarification.

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
      title="Reset demo data?"
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
