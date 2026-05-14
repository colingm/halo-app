/**
 * Halo tasks barrel.
 *
 * Single import target for the Phase 3 tasks surface — schemas, types,
 * the repo (Phase 3 reads, Phase 4 writers), the display-label map,
 * and the idempotent seeder.
 *
 * Convention: `export *` for schemas / types / repo / labels where the
 * file IS the surface; named re-export for the seeder which has a single
 * intended entry point (`seedIfNeeded` called from AppLayout's useEffect
 * in Plan 03-05 — never at module-init time because workspaceId is
 * render-time data).
 */
export * from './schemas'
export * from './types'
export * from './tasksRepo'
export * from './labels'
export { seedIfNeeded } from './tasksSeed'
