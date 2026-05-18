/**
 * HelpPage — composer for /app/help (Phase 5, HELP-01, HELP-02, D-08).
 *
 * Lists all help articles grouped by topic. Includes a live-debounced search
 * input (150ms via @mantine/hooks useDebouncedValue per D-08) that filters
 * articles by title + keywords + summary (body is NOT searched per D-08).
 *
 * Search behavior:
 *   - Empty query: render all articles via HelpList (topic-grouped).
 *   - Non-empty query with matches: render filtered articles via HelpList.
 *   - Non-empty query with zero matches: render HelpNoResultsState.
 *
 * No CRUD — Help content is static (D-09 static module, no localStorage key).
 *
 * Router note (D-07): HelpArticlePage is mounted as a flat sibling route
 * (/app/help/:slug) NOT a nested child, because this component has no
 * <Outlet /> — nesting would show both the list and detail simultaneously.
 * The flat sibling shape is explicitly accepted per UI-SPEC line 840.
 */

import { useState, useMemo, useEffect } from 'react'
import { Stack, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { listHelpArticles } from '../../../help/helpArticles'
import { HelpSearchInput } from '../../../help/components/HelpSearchInput'
import { HelpList } from '../../../help/components/HelpList'
import { HelpNoResultsState } from '../../../help/components/HelpNoResultsState'

export function HelpPage(): React.JSX.Element {
  const [query, setQuery] = useState('')
  // D-08: 150ms debounce — second element (cancel fn) is intentionally unused.
  const [debouncedQuery] = useDebouncedValue(query, 150)

  // Read once at mount — static module is reload-stable via faker.seed(42) (D-09).
  const allArticles = useMemo(() => listHelpArticles(), [])

  const filtered = useMemo(() => {
    if (debouncedQuery.trim() === '') return allArticles
    const needle = debouncedQuery.toLowerCase().trim()
    return allArticles.filter((a) => {
      // D-08: match over title + keywords joined + summary; body is NOT searched.
      const haystack = `${a.title} ${a.keywords.join(' ')} ${a.summary}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [allArticles, debouncedQuery])

  // Track meaningful help searches (non-empty, after debounce settles).
  useEffect(() => {
    if (debouncedQuery.trim() === '') return
    if (typeof pendo !== 'undefined') {
      pendo.track('help_searched', {
        query: debouncedQuery.trim(),
        resultsCount: filtered.length,
        hasResults: filtered.length > 0,
      })
    }
  }, [debouncedQuery, filtered.length])

  return (
    <Stack gap="lg">
      <Title order={3}>Help</Title>
      <HelpSearchInput value={query} onChange={setQuery} />
      {filtered.length === 0 && debouncedQuery.trim() !== ''
        ? <HelpNoResultsState query={debouncedQuery} onClear={() => setQuery('')} />
        : <HelpList articles={filtered} />
      }
    </Stack>
  )
}
