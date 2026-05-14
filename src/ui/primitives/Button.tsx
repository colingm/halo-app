import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo Button — wraps Mantine's Button and forwards the typed `pendoId` prop
 * as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 */
/**
 * The Halo Button supports both Mantine props (variant, color, loading,
 * leftSection, etc.) AND the underlying `<button>` element's HTML attributes
 * (most importantly `type="submit"` so wrapped buttons participate in forms).
 * Mantine's polymorphic typing surfaces `type` via the runtime polymorphic
 * resolver, but the static intersection used here exposes the attribute set
 * directly — mirroring the Anchor wrapper's `React.AnchorHTMLAttributes`
 * intersection.
 */
export type ButtonProps = MantineButtonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MantineButtonProps> & {
    pendoId: PendoId
    children: React.ReactNode
  }

export function Button({ pendoId, ...rest }: ButtonProps) {
  return <MantineButton data-pendo-id={pendoId} {...rest} />
}
