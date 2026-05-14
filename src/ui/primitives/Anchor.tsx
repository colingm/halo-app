import { Anchor as MantineAnchor, type AnchorProps as MantineAnchorProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo Anchor — wraps Mantine's Anchor and forwards the typed `pendoId` prop
 * as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and track
 * events. No Pendo runtime is invoked here — the attribute is purely a markup
 * contract.
 */
export type AnchorProps = MantineAnchorProps & {
  pendoId: PendoId
  children: React.ReactNode
}

export function Anchor({ pendoId, ...rest }: AnchorProps) {
  return <MantineAnchor data-pendo-id={pendoId} {...rest} />
}
