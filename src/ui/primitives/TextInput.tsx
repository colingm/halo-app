import { TextInput as MantineTextInput, type TextInputProps as MantineTextInputProps } from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo TextInput — wraps Mantine's TextInput and forwards the typed `pendoId`
 * prop as the `data-pendo-id` DOM attribute. The `pendoId` prop is REQUIRED:
 * TypeScript will flag any usage that omits it at compile time, enforcing the
 * PEN-07 convention that every interactive element carries a stable selector.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting and feature
 * adoption analytics. No Pendo runtime is invoked here — the attribute is
 * purely a markup contract.
 */
export type TextInputProps = MantineTextInputProps & {
  pendoId: PendoId
}

export function TextInput({ pendoId, ...rest }: TextInputProps) {
  return <MantineTextInput data-pendo-id={pendoId} {...rest} />
}
