/**
 * Barrel export for all Halo UI primitive wrappers.
 *
 * Every primitive requires a `pendoId: PendoId` prop that is forwarded to the
 * rendered DOM as `data-pendo-id`. Import from this file — never from the
 * individual primitive modules directly.
 *
 * Usage:
 *   import { Button, TextInput, PasswordInput, Anchor } from 'src/ui/primitives'
 *   import type { ButtonProps } from 'src/ui/primitives'
 */
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { TextInput } from './TextInput'
export type { TextInputProps } from './TextInput'

export { PasswordInput } from './PasswordInput'
export type { PasswordInputProps } from './PasswordInput'

export { Anchor } from './Anchor'
export type { AnchorProps } from './Anchor'
