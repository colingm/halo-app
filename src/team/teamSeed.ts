/**
 * Halo team seeder (Phase 5 D-04, D-11, D-12 — updated by Plan 07).
 *
 * Generates 8–12 faker teammates for the supplied workspace, gated on the
 * per-domain ledger entry `meta.seededDomains.teammates`. Called by the
 * seedAll.ts coordinator — NOT directly from AppLayout.
 *
 * Idempotency contract (mirrors tasksSeed.ts two-gate pattern):
 *   1. Read meta via readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
 *   2. If meta.seededDomains.teammates is set: skip (per-domain ledger written
 *      by seedAll coordinator — Plan 07).
 *   3. Else if listTeammates(workspaceId).length > 0: skip (defensive guard).
 *   4. Else: synthesize Owner row from currentVisitor (D-04), generate 8–12
 *      faker teammates, write combined array (Owner first per D-04).
 *
 * This seeder DOES NOT write meta — the seedAll coordinator (Plan 03 + Plan 07)
 * owns all meta writes including the per-domain seededDomains.teammates timestamp.
 *
 * Randomness:
 *   faker.seed(N) is intentionally NOT called — each workspace gets a unique
 *   variety of teammates, matching the tasksSeed.ts idiom (variety = more
 *   interesting demos).
 *
 * Per-key co-ownership (Pattern S4):
 *   teamSeed.ts is the deliberate co-owner of K.teammates(workspaceId) alongside
 *   teamsRepo.ts. teamSeed writes the initial array; teamsRepo owns all
 *   subsequent reads and mutations.
 */

import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import type { Meta } from '../storage'
import { TeammatesArraySchema } from './schemas'
import { useAuthStore } from '../auth/authStore'
import type { Teammate } from './types'

// ---------------------------------------------------------------------------
// Default meta constant (mirrors tasksSeed.ts shape)
// ---------------------------------------------------------------------------

const DEFAULT_META: Meta = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null,
  appVersion: APP_VERSION,
}

// ---------------------------------------------------------------------------
// Internal helper — faker teammate generator
// ---------------------------------------------------------------------------

function generateTeammates(count: number): Teammate[] {
  const teammates: Teammate[] = Array.from({ length: count }, () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    return {
      id: nanoid(),
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      // Owner role is reserved for the Visitor — faker batch only generates
      // Admin/Member/Viewer (D-04 lock).
      workspaceRole: faker.helpers.arrayElement(['Admin', 'Member', 'Viewer']),
      status: 'active',
      lastActiveAt: faker.date.recent({ days: 30 }).toISOString(),
      invitedAt: null,
      // faker.image.avatar() returns a URL; Mantine Avatar falls back to initials
      // if the URL fails to load. Using URL-based avatars for richer demos.
      avatar: faker.image.avatar(),
    } satisfies Teammate
  })

  // Defensive schema validation — fail loudly per tasksSeed.ts lines 139-148.
  const parsed = TeammatesArraySchema.safeParse(teammates)
  if (!parsed.success) {
    console.error(
      '[halo:teamSeed] Generated teammates failed TeammatesArraySchema validation',
      parsed.error.issues,
    )
    throw new Error('[halo:teamSeed] Seeded teammate array does not match TeammatesArraySchema')
  }
  return parsed.data
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed teammates for `workspaceId` if the workspace has not been seeded yet.
 *
 * Idempotent: calling this function multiple times for the same workspace
 * is safe — after the seedAll coordinator stamps meta.seededAt, all subsequent
 * calls return immediately without touching storage.
 *
 * CRITICAL (D-12): This function DOES NOT stamp meta.seededAt. That stamp
 * belongs to the seedAll.ts coordinator so a single stamp gates both seeders.
 *
 * @param workspaceId - The workspace ID from `useAuthStore`. Must be a non-empty
 *   string (nanoid format).
 */
export function seedTeammatesIfNeeded(workspaceId: string): void {
  // GATE 1: Per-domain idempotency check — coordinator owns the ledger write
  // (Plan 07). Do NOT check legacy meta.seededAt here; the coordinator's
  // legacy reconciliation owns that interpretation and only calls this function
  // when teammates have not been seeded.
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  if (meta.seededDomains?.teammates) return

  // GATE 2: Defensive check — protects against external writes that wrote
  // teammates but didn't stamp meta.seededAt (mirrors tasksSeed GATE 2).
  const existing = readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [])
  if (existing.length > 0) return

  // Build the Owner-Visitor row FIRST (D-04 — appears at top of table).
  const visitor = useAuthStore.getState().currentVisitor
  const ownerRow: Teammate | null = visitor
    ? {
        id: nanoid(),
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        email: visitor.email,
        workspaceRole: 'Owner',
        status: 'active',
        lastActiveAt: new Date().toISOString(),
        invitedAt: null,
        avatar: null,
      }
    : null

  // Faker-generated batch (8–12 per D-04 + <discretion>).
  const count = faker.number.int({ min: 8, max: 12 })
  const fakerTeammates = generateTeammates(count)

  // Owner row MUST be at index 0 (D-04 — appears at top of table).
  const teammates = ownerRow ? [ownerRow, ...fakerTeammates] : fakerTeammates

  // CRITICAL D-12 + Plan 07: Write teammates, DO NOT write meta here.
  // The seedAll.ts coordinator owns all meta writes including the per-domain
  // seededDomains.teammates timestamp (Plan 07).
  writeJSON(K.teammates(workspaceId), teammates)
}
