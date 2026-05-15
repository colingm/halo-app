/**
 * Halo team barrel.
 *
 * Single import target for the Phase 5 team surface — schemas, types,
 * the repo (CRUD), and the idempotent seeder.
 *
 * Convention: `export *` for schemas / types / repo where the file IS the
 * surface; named re-export for the seeder which has a single intended entry
 * point (`seedTeammatesIfNeeded` called from seedAll coordinator — never at
 * module-init time because workspaceId is render-time data).
 */
export * from './schemas'
export * from './types'
export * from './teamsRepo'
export { seedTeammatesIfNeeded } from './teamSeed'
