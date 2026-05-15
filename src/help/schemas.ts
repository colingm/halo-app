/**
 * Halo help — Zod schemas (Phase 5).
 *
 * This module is the single source of truth for:
 *
 *   1. Help article shape — `HelpArticleSchema` defines the D-06 field contract.
 *   2. `HelpArticlesArraySchema` — consumed ONLY by the `.safeParse` defensive
 *      gate in `helpArticles.ts`. NOT used by `readWithSchema`.
 *
 * No K.helpArticles() storage key exists. HelpArticlesArraySchema is consumed
 * ONLY by the .safeParse defensive gate in helpArticles.ts. No readWithSchema
 * callsite anywhere.
 *
 * topic is z.string().min(1) — free-form, NOT z.enum — adding topics in v2
 * must not require a schema migration (D-06).
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Help article schema (D-06)
// ---------------------------------------------------------------------------

export const HelpArticleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, hyphen-separated'),
  title: z.string().min(1),
  /** Free-form topic string per D-06 — NOT a z.enum. Adding topics in v2 must
   *  not require a schema migration. */
  topic: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  keywords: z.array(z.string()),
  updatedAt: z.iso.datetime(),
})

// ---------------------------------------------------------------------------
// Array schema — used exclusively as a defensive safeParse gate in helpArticles.ts
// ---------------------------------------------------------------------------

export const HelpArticlesArraySchema = z.array(HelpArticleSchema)
