/**
 * Halo help — module barrel (Phase 5).
 *
 * Re-exports all public types, schemas, and accessor functions from the
 * help data layer. Consumers import from 'src/help' instead of individual
 * modules.
 */

export * from './schemas'
export * from './types'
export { HELP_ARTICLES, listHelpArticles, getHelpArticleBySlug } from './helpArticles'
