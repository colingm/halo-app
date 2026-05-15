import {
  Checkbox as MantineCheckbox,
  type CheckboxProps as MantineCheckboxProps,
} from '@mantine/core'
import type { PendoId } from '../../pendo/PENDO_IDS'

/**
 * Halo Checkbox — wraps Mantine's Checkbox and forwards two stable selectors:
 *
 *   1. `pendoId` → `data-pendo-id` (REQUIRED) — the static guide-targetable
 *      class, e.g. `lists.row.complete-toggle`. TypeScript flags any usage
 *      that omits it, enforcing the PEN-07 stable-selector convention.
 *   2. `taskId` → `data-pendo-task-id` (OPTIONAL) — the dynamic per-row
 *      identifier, e.g. the Task.id. Implements CLAUDE.md's dynamic-list
 *      parameterization rule ("Pendo can target the class of rows, and
 *      Session Replay still captures the specific row interacted with").
 *
 * When `taskId` is undefined React omits the attribute entirely (default
 * React behavior for `data-* = {undefined}`), so the wrapper is safe to use
 * outside list contexts too (e.g. a form-level "I agree" checkbox).
 *
 * Mantine v9 Checkbox forwards `...rest` (including data-* attributes) to the
 * root container element which Pendo can target; the underlying input is a
 * descendant. Both placements are guide-targetable.
 */
export type CheckboxProps = MantineCheckboxProps & {
  pendoId: PendoId
  taskId?: string
}

export function Checkbox({ pendoId, taskId, ...rest }: CheckboxProps) {
  return <MantineCheckbox data-pendo-id={pendoId} data-pendo-task-id={taskId} {...rest} />
}
