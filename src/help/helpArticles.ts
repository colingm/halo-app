/**
 * Halo help articles — static module (Phase 5 D-09).
 *
 * Static module — no K.* key, no seedIfNeeded gate, no localStorage
 * persistence. faker.seed(42) pins randomness so users see identical articles
 * every reload. UI-04 polish in detail view deliberately weaker than
 * hand-curated copy (tradeoff accepted in 05-CONTEXT <deferred>).
 *
 * Module-init synthesis: HELP_ARTICLES is synthesized at module load time via
 * generateHelpArticles(). Article count is 10 (planner chose 10 within D-09's
 * "≥8" + discretion range). faker.seed(N=42) is the chosen constant.
 *
 * Caller: listHelpArticles() / getHelpArticleBySlug() — one-liner accessors
 * used by HelpPage (list view) and HelpArticlePage (detail view).
 */

import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { HelpArticlesArraySchema } from './schemas'
import type { HelpArticle } from './types'

// ---------------------------------------------------------------------------
// Topic set — mirrors the side-nav structure for guide-anchor symmetry.
// Planner exercising <discretion> to use this list verbatim per UI-SPEC line 799.
// ---------------------------------------------------------------------------

const HELP_TOPICS = [
  'Getting Started',
  'Tasks',
  'Settings',
  'Team',
  'Reports',
  'Account & Billing',
] as const

// ---------------------------------------------------------------------------
// Private generator — called once at module init
// ---------------------------------------------------------------------------

function generateHelpArticles(): HelpArticle[] {
  // D-09: pin seed for reload-stability — N=42 chosen constant
  faker.seed(42)

  // Compute once at function top — same updatedAt for all articles is
  // acceptable; body content is faker, not historical.
  const now = new Date().toISOString()

  const articles: HelpArticle[] = Array.from({ length: 10 }, () => {
    // planner chose 10 within D-09's "≥8" + discretion range
    const title = faker.commerce.productName()
    // Derive slug from title: lowercase, replace non-alphanumeric with '-',
    // trim leading/trailing hyphens.
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return {
      id: nanoid(),
      slug,
      title,
      topic: faker.helpers.arrayElement(HELP_TOPICS),
      summary: faker.lorem.sentence(),
      // paragraph separator MUST be '\n\n' so the detail view's
      // body.split('\n\n') renders correctly (D-09)
      body: faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n'),
      keywords: faker.helpers.arrayElements(
        ['invite', 'role', 'task', 'filter', 'export', 'dashboard', 'theme', 'reset', 'billing'],
        { min: 2, max: 4 },
      ),
      updatedAt: now,
    } satisfies HelpArticle
  })

  // Defensive schema validation gate — mirrors tasksSeed.ts lines 139-148.
  const parsed = HelpArticlesArraySchema.safeParse(articles)
  if (!parsed.success) {
    console.error(
      '[halo:helpArticles] Generated articles failed schema validation',
      parsed.error.issues,
    )
    throw new Error('[halo:helpArticles] Static article array does not match HelpArticlesArraySchema')
  }

  return parsed.data
}

// ---------------------------------------------------------------------------
// Module-init synthesis (D-09) — called once when the module is first imported
// ---------------------------------------------------------------------------

export const HELP_ARTICLES: readonly HelpArticle[] = generateHelpArticles()

// ---------------------------------------------------------------------------
// Accessor API
// ---------------------------------------------------------------------------

/** Returns all help articles. One-liner returning the module-init const. */
export function listHelpArticles(): readonly HelpArticle[] {
  return HELP_ARTICLES
}

/** Returns a single help article by slug, or `undefined` if not found. */
export function getHelpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}
