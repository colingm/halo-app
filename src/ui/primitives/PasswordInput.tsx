/**
 * PEN-09: Pendo Session Replay treats elements with class `.pendo-sr-ignore`
 * as block-from-recording (verified verbatim from Pendo Web SDK 2.324.0's
 * dist/replay.js). For password inputs Pendo also auto-masks by
 * `input[type=password]` — the class is belt-and-suspenders. Phase 6 will
 * install the Pendo agent that reads this class; in Phase 1 the class is
 * inert and purely a markup convention.
 */
import {
  PasswordInput as MantinePasswordInput,
  type PasswordInputProps as MantinePasswordInputProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

export type PasswordInputProps = MantinePasswordInputProps & {
  pendoId: PendoId
}

export function PasswordInput({ pendoId, className, ...rest }: PasswordInputProps) {
  const cls = ['pendo-sr-ignore', className].filter(Boolean).join(' ')
  return <MantinePasswordInput data-pendo-id={pendoId} className={cls} {...rest} />
}
