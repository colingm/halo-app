/**
 * Storage keys + barrel smoke test (Phase 2 Plan 02 Task 2).
 *
 * Verifies:
 *
 *   1. Four new K builders (`visitors`, `workspaces`, `session`, `signupDraft`)
 *      return the correctly-versioned key strings, alongside the existing
 *      `meta` and `pendoAnonId` builders.
 *   2. `src/storage/schemas.ts` re-exports the auth persistence schemas
 *      (`VisitorSchema`, `WorkspaceSchema`, `SessionSchema`, `SignupDraftSchema`,
 *      `VisitorsArraySchema`, `WorkspacesArraySchema`) so the storage barrel
 *      transparently exposes them.
 *   3. Step / sign-in form schemas are NOT reachable through the storage
 *      barrel — those are auth-feature concerns.
 *
 * Run via:
 *   npx tsx src/storage/__tests__/storage.keys.smoke.ts
 *
 * Exit 0 on all assertions passing. Exit 1 on any assertion failure.
 */

import { K, SCHEMA_VERSION, APP_VERSION } from '../keys'
import * as storageBarrel from '../index'

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`)
    passed++
  } else {
    console.error(`  FAIL: ${message}`)
    failed++
  }
}

// ---------------------------------------------------------------------------
// Test: K builders return correctly-versioned keys
// ---------------------------------------------------------------------------

console.log('\nTest: K key-builder outputs')
assert(SCHEMA_VERSION === 1, `SCHEMA_VERSION is 1 (got ${SCHEMA_VERSION})`)
assert(APP_VERSION === '0.1.0', `APP_VERSION is '0.1.0' (got '${APP_VERSION}')`)
assert(K.meta() === 'halo:v1:meta', `K.meta() === 'halo:v1:meta' (got '${K.meta()}')`)
assert(
  K.pendoAnonId() === 'halo:v1:pendo:anonId',
  `K.pendoAnonId() === 'halo:v1:pendo:anonId' (got '${K.pendoAnonId()}')`,
)
assert(K.visitors() === 'halo:v1:visitors', `K.visitors() === 'halo:v1:visitors' (got '${K.visitors()}')`)
assert(
  K.workspaces() === 'halo:v1:workspaces',
  `K.workspaces() === 'halo:v1:workspaces' (got '${K.workspaces()}')`,
)
assert(K.session() === 'halo:v1:session', `K.session() === 'halo:v1:session' (got '${K.session()}')`)
assert(
  K.signupDraft() === 'halo:v1:signup:draft',
  `K.signupDraft() === 'halo:v1:signup:draft' (got '${K.signupDraft()}')`,
)

// ---------------------------------------------------------------------------
// Test: Storage barrel exposes auth persistence schemas
// ---------------------------------------------------------------------------

console.log('\nTest: storage barrel re-exports auth persistence schemas')
const barrel = storageBarrel as Record<string, unknown>
for (const name of [
  'VisitorSchema',
  'WorkspaceSchema',
  'SessionSchema',
  'SignupDraftSchema',
  'VisitorsArraySchema',
  'WorkspacesArraySchema',
]) {
  assert(
    typeof barrel[name] === 'object' && barrel[name] !== null,
    `storage barrel exports ${name}`,
  )
}

// ---------------------------------------------------------------------------
// Test: Storage barrel does NOT re-export form-step schemas
// ---------------------------------------------------------------------------

console.log('\nTest: storage barrel does NOT leak form-step / sign-in schemas')
for (const name of ['step1Schema', 'step2Schema', 'step3Schema', 'step4Schema', 'signinSchema']) {
  assert(
    barrel[name] === undefined,
    `storage barrel does NOT export ${name} (form schemas live in src/auth/schemas.ts)`,
  )
}

// ---------------------------------------------------------------------------
// Test: Existing storage barrel exports remain reachable
// ---------------------------------------------------------------------------

console.log('\nTest: existing storage barrel exports remain reachable')
assert(typeof barrel.K === 'object' && barrel.K !== null, 'storage barrel exports K')
assert(typeof barrel.readWithSchema === 'function', 'storage barrel exports readWithSchema')
assert(typeof barrel.writeJSON === 'function', 'storage barrel exports writeJSON')
assert(typeof barrel.MetaSchema === 'object' && barrel.MetaSchema !== null, 'storage barrel exports MetaSchema')
assert(typeof barrel.AnonIdSchema === 'object' && barrel.AnonIdSchema !== null, 'storage barrel exports AnonIdSchema')
assert(typeof barrel.runMigrations === 'function', 'storage barrel exports runMigrations')

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`storage keys smoke: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.error('storage keys smoke: FAILED')
  process.exit(1)
} else {
  console.log('storage keys smoke: OK')
  process.exit(0)
}
