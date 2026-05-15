import {
  Textarea as MantineTextarea,
  type TextareaProps as MantineTextareaProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo Textarea — wraps Mantine's Textarea and forwards the typed `pendoId`
 * prop as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 */
export type TextareaProps = MantineTextareaProps & {
  pendoId: PendoId
}

export function Textarea({ pendoId, ...rest }: TextareaProps) {
  return <MantineTextarea data-pendo-id={pendoId} {...rest} />
}
