import { IconSearch } from '@tabler/icons-react'
import { TextInput } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

/**
 * HelpSearchInput — controlled TextInput with an IconSearch left section.
 *
 * Debounce is NOT applied here — it's a page-level concern via
 * `useDebouncedValue(query, 150)` in HelpPage (CONTEXT D-08). This component
 * is a thin controlled wrapper so the search input can be independently
 * composed and re-used if needed.
 */

export type HelpSearchInputProps = {
  value: string
  onChange: (next: string) => void
}

export function HelpSearchInput({ value, onChange }: HelpSearchInputProps): React.JSX.Element {
  return (
    <TextInput
      placeholder="Search articles"
      leftSection={<IconSearch size={16} />}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      pendoId={PENDO_IDS.help.search}
    />
  )
}
