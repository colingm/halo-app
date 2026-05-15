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

export { Select } from './Select'
export type { SelectProps } from './Select'

export { MultiSelect } from './MultiSelect'
export type { MultiSelectProps } from './MultiSelect'

export { NumberInput } from './NumberInput'
export type { NumberInputProps } from './NumberInput'

export { NavLink } from './NavLink'
export type { NavLinkProps } from './NavLink'

export { Checkbox } from './Checkbox'
export type { CheckboxProps } from './Checkbox'

export { Textarea } from './Textarea'
export type { TextareaProps } from './Textarea'

export { DatePickerInput } from './DatePickerInput'
export type { DatePickerInputProps } from './DatePickerInput'
