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
export type ButtonProps = MantineButtonProps & {
  pendoId: PendoId
  children: React.ReactNode
}

export function Button({ pendoId, ...rest }: ButtonProps) {
  return <MantineButton data-pendo-id={pendoId} {...rest} />
}
