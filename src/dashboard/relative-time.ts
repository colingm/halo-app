/**
 * Halo relative-time formatting (Phase 3 dashboard activity feed).
 * Produces strings like '2h ago', 'Yesterday', '3d ago' from an ISO-8601
 * input relative to a `nowRef` ISO-8601 input. Pure function, no dayjs
 * dependency — dayjs is in the recommended stack but not yet installed
 * (CLAUDE.md Recommended Stack section), and the activity feed only needs
 * 4 buckets.
 */

/**
 * Formats an ISO-8601 timestamp as a human-readable relative string.
 *
 * Buckets:
 *   < 1 minute  → 'Just now'
 *   < 1 hour    → '{N}m ago'
 *   < 1 day     → '{N}h ago'
 *   < 2 days    → 'Yesterday'
 *   ≥ 2 days    → '{N}d ago'
 *
 * Returns '—' (em-dash) if either input is not a valid date string (NaN).
 * Never throws. Future timestamps (deltaMs < 0) clamp to 'Just now'.
 *
 * @param isoTimestamp - ISO-8601 timestamp string to format
 * @param nowRefIso    - ISO-8601 reference "now" string
 */
export function formatRelative(isoTimestamp: string, nowRefIso: string): string {
  const tsMs = new Date(isoTimestamp).getTime()
  const nowMs = new Date(nowRefIso).getTime()

  if (isNaN(tsMs) || isNaN(nowMs)) {
    return '—'
  }

  const deltaMs = Math.max(0, nowMs - tsMs)

  if (deltaMs < 60_000) {
    return 'Just now'
  }

  if (deltaMs < 3_600_000) {
    return `${Math.floor(deltaMs / 60_000)}m ago`
  }

  if (deltaMs < 86_400_000) {
    return `${Math.floor(deltaMs / 3_600_000)}h ago`
  }

  if (deltaMs < 172_800_000) {
    return 'Yesterday'
  }

  return `${Math.floor(deltaMs / 86_400_000)}d ago`
}
