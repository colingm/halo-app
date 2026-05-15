/**
 * Halo help — TypeScript types (Phase 5).
 *
 * Every type in this file is derived from a Zod schema in `./schemas` via
 * `z.infer`. Zod is the single source of truth — DO NOT hand-write parallel
 * type declarations here. If a field shape changes, edit the schema; the type
 * follows automatically.
 */

import type { z } from 'zod'
import type { HelpArticleSchema } from './schemas'

// ---------------------------------------------------------------------------
// Help article type — derived from the persistence schema
// ---------------------------------------------------------------------------

export type HelpArticle = z.infer<typeof HelpArticleSchema>
