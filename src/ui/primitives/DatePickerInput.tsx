import {
  DatePickerInput as MantineDatePickerInput,
  type DatePickerInputProps as MantineDatePickerInputProps,
} from '@mantine/dates'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo DatePickerInput — wraps `@mantine/dates` DatePickerInput and forwards
 * the typed `pendoId` prop as the `data-pendo-id` DOM attribute. The `pendoId`
 * prop is REQUIRED: TypeScript will flag any usage that omits it at compile
 * time, enforcing the PEN-07 convention that every interactive element
 * carries a stable selector.
 *
 * The wrapper passes through Mantine's `type` prop ('default' | 'multiple' |
 * 'range') unchanged — both the Phase 4 Task form's `type='default'` (single
 * due-date) and the Reports filter's `type='range'` flow through the same
 * wrapper. Requires the `dayjs` peer dependency, installed in plan 04-01.
 *
 * Phase 6's Pendo agent reads `data-pendo-id` for guide targeting; no Pendo
 * runtime is invoked here.
 */
export type DatePickerInputProps = MantineDatePickerInputProps & {
  pendoId: PendoId
}

export function DatePickerInput({ pendoId, ...rest }: DatePickerInputProps) {
  return <MantineDatePickerInput data-pendo-id={pendoId} {...rest} />
}
