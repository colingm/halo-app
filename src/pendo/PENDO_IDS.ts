/**
 * This is the ONLY source of `data-pendo-id` string values in the codebase.
 *
 * UI primitive wrappers (src/ui/primitives/*) accept `pendoId: PendoId` and
 * forward it as `data-pendo-id` to the DOM. Page-level code MUST reference
 * `PENDO_IDS.<namespace>.<id>` — never hand-type a string literal
 * `data-pendo-id` value.
 *
 * Phase 6's Pendo agent attaches to these attributes for guide targeting,
 * feature tagging, and track events. See docs/CONVENTIONS.md for the full
 * markup convention rules (PEN-07).
 *
 * Namespace growth plan:
 *   Phase 1: `layout`, `sandbox`
 *   Phase 2: `signup`, `signin`
 *   Phase 3: `nav`, `topbar`, `dashboard`
 *   Phase 4: `lists`, `settings`, `reports`
 *   Phase 5: `team`, `help`
 */

/** Derives a union of every leaf string value from a nested `as const` object. */
type Leaves<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? Leaves<T[keyof T]>
    : never

export const PENDO_IDS = {
  /** Phase 1 layout-level markers (PublicLayout + AppLayout). */
  layout: {
    publicDemoBanner: 'layout.public.demo-banner',
    publicLanding: 'layout.public.landing',
    appPlaceholder: 'layout.app.placeholder',
  },

  /**
   * Phase 1 sandbox smoke-render markers.
   * Used only by src/routes/public/PrimitivesSandbox.tsx — one per primitive
   * so the forwarding contract is end-to-end verifiable in DevTools.
   */
  sandbox: {
    primaryButton: 'sandbox.primary-button',
    emailInput: 'sandbox.email-input',
    passwordInput: 'sandbox.password-input',
    signupAnchor: 'sandbox.signup-anchor',
  },
} as const

/**
 * Union of every leaf string value in PENDO_IDS.
 * UI primitive `pendoId` props are typed as `PendoId` — TypeScript will flag
 * any hand-typed string that isn't in the registry.
 */
export type PendoId = Leaves<typeof PENDO_IDS>
