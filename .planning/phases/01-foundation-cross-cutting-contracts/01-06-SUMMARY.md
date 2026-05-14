---
phase: 01-foundation-cross-cutting-contracts
plan: "06"
subsystem: pendo-markup
tags: [pendo, data-pendo-id, primitives, PENDO_IDS, session-replay, conventions]

# Dependency graph
requires:
  - phase: 01-05
    provides: Router with PublicLayout + /sandbox child-route extension point
  - phase: 01-02
    provides: Mantine 9 installed + haloTheme wired; primitive wrappers use Mantine components
provides:
  - src/pendo/PENDO_IDS.ts — nested as const registry + PendoId derived union type
  - src/ui/primitives/Button.tsx — Mantine Button wrapper with required pendoId: PendoId prop
  - src/ui/primitives/TextInput.tsx — Mantine TextInput wrapper with required pendoId: PendoId prop
  - src/ui/primitives/PasswordInput.tsx — Mantine PasswordInput wrapper with pendoId + .pendo-sr-ignore class (PEN-09)
  - src/ui/primitives/Anchor.tsx — Mantine Anchor wrapper with pendoId; AnchorProps extends React.AnchorHTMLAttributes for href support
  - src/ui/primitives/index.ts — barrel export of all four primitives + Props types
  - src/routes/public/PrimitivesSandbox.tsx — smoke-render page at /sandbox; verifies forwarding contract end-to-end
  - src/router.tsx — /sandbox route registered as PublicLayout child
  - docs/CONVENTIONS.md — PEN-07 registry rule, PEN-08 SVG-only charts, PEN-09 masked inputs
affects:
  - phase-2 (builds signup forms using these primitives + adds signup.*/signin.* PENDO_IDS namespaces)
  - phase-3 (AppShell nav uses nav.*/topbar.* PENDO_IDS namespaces; SVG-charts convention from CONVENTIONS.md enforced)
  - phase-6 (Pendo agent install discovers data-pendo-id attributes already in DOM; no primitive changes needed)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nested as const PENDO_IDS registry + Leaves<T> helper + PendoId derived union type"
    - "UI primitive wrappers require pendoId: PendoId prop — TypeScript enforces at compile time"
    - "PasswordInput applies .pendo-sr-ignore via className composition (NOT data-pendo-mask attribute)"
    - "Mantine's polymorphic Anchor requires AnchorProps & React.AnchorHTMLAttributes<HTMLAnchorElement> to expose href"

key-files:
  created:
    - src/pendo/PENDO_IDS.ts
    - src/ui/primitives/Button.tsx
    - src/ui/primitives/TextInput.tsx
    - src/ui/primitives/PasswordInput.tsx
    - src/ui/primitives/Anchor.tsx
    - src/ui/primitives/index.ts
    - src/routes/public/PrimitivesSandbox.tsx
    - docs/CONVENTIONS.md
  modified:
    - src/router.tsx

key-decisions:
  - "PENDO_IDS uses Leaves<T> helper to derive PendoId union — keeps union in sync with registry automatically"
  - "PasswordInput uses .pendo-sr-ignore CSS class (not data-pendo-mask attribute) per Pendo SDK 2.324 verified source"
  - "Mantine Anchor is polymorphic — AnchorProps type extended with React.AnchorHTMLAttributes to allow href + other <a> props"
  - "PrimitivesSandbox return type uses React.JSX.Element (not bare JSX.Element) since tsconfig has jsx:react-jsx with strict mode"

patterns-established:
  - "All interactive elements in Halo carry data-pendo-id sourced from PENDO_IDS — never hand-typed strings"
  - "Phase N adds its own PENDO_IDS namespace (signup.*, nav.*, lists.*, etc.) without editing Phase 1 code"
  - "PasswordInput primitive is the only path to session-replay masking — Phase 2 inherits automatically"

requirements-completed:
  - PEN-07
  - PEN-08
  - PEN-09

# Metrics
duration: ~8min
completed: 2026-05-14
---

# Phase 01 Plan 06: PENDO_IDS Registry + UI Primitives + Sandbox + Conventions Summary

**PENDO_IDS nested as const registry with Leaves-derived PendoId union, four Mantine-wrapped primitives forwarding typed data-pendo-id, PasswordInput applying .pendo-sr-ignore, /sandbox smoke-render route, and CONVENTIONS.md documenting PEN-07/08/09**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-14T13:41:43Z
- **Completed:** 2026-05-14T13:50:00Z
- **Tasks:** 2 auto + 1 human-verify checkpoint
- **Files modified:** 9

## Accomplishments

- Built `src/pendo/PENDO_IDS.ts` with `layout.*` and `sandbox.*` namespaces; Leaves<T> helper derives PendoId union at compile time — adding new IDs to the registry automatically widens the union
- Four Mantine primitive wrappers created; `pendoId: PendoId` is a required prop on all four — TypeScript flags missing props at compile time (PEN-07 enforced by the type system, not just convention)
- `PasswordInput` applies `.pendo-sr-ignore` class via className composition (belt-and-suspenders alongside Pendo's auto-masking of `input[type=password]`) — Phase 2's first real password field inherits this automatically
- `PrimitivesSandbox` at `/sandbox` renders all four primitives with real `PENDO_IDS.sandbox.*` values — the data-pendo-id forwarding contract is end-to-end verifiable in DevTools without any runtime Pendo wiring
- `docs/CONVENTIONS.md` establishes three Phase 1 markup contracts: PENDO_IDS registry rule (PEN-07), SVG-only charts (PEN-08), masked password inputs (PEN-09)
- No `window.pendo`, `pendo.initialize`, or `VITE_PENDO_API_KEY` references anywhere in primitives or registry
- `tsc --noEmit` and `npm run build` both pass

## Task Commits

1. **Task 1: PENDO_IDS registry + four primitives + CONVENTIONS.md** — `6178e93` (feat)
2. **Task 2: PrimitivesSandbox + /sandbox route** — `b0e4da8` (feat)
3. **Task 3: Human verification (checkpoint)** — approved; all four primitives carry data-pendo-id values; PasswordInput root has pendo-sr-ignore class; console clean

## Files Created/Modified

- `src/pendo/PENDO_IDS.ts` — `PENDO_IDS` nested `as const` with `layout.*` and `sandbox.*` namespaces; `Leaves<T>` helper; `PendoId` derived union exported
- `src/ui/primitives/Button.tsx` — Mantine Button wrapper; `pendoId: PendoId` required; forwards `data-pendo-id`
- `src/ui/primitives/TextInput.tsx` — Mantine TextInput wrapper; `pendoId: PendoId` required; forwards `data-pendo-id`
- `src/ui/primitives/PasswordInput.tsx` — Mantine PasswordInput wrapper; forwards `data-pendo-id`; applies `.pendo-sr-ignore` via className composition
- `src/ui/primitives/Anchor.tsx` — Mantine Anchor wrapper; `pendoId: PendoId` required; `AnchorProps` extended with `React.AnchorHTMLAttributes<HTMLAnchorElement>` to allow `href` (Mantine Anchor is polymorphic)
- `src/ui/primitives/index.ts` — barrel re-exports all four primitives and their `*Props` types
- `src/routes/public/PrimitivesSandbox.tsx` — smoke-render page at `/sandbox`; renders one of each primitive; `data-pendo-id` forwarding contract verifiable in DevTools
- `src/router.tsx` — added `path: 'sandbox'` child under PublicLayout; updated JSDoc
- `docs/CONVENTIONS.md` — documents PEN-07, PEN-08, PEN-09 for future developers

## PENDO_IDS Phase 1 Namespace Reference

```ts
PENDO_IDS.layout.publicDemoBanner  // 'layout.public.demo-banner'
PENDO_IDS.layout.publicLanding     // 'layout.public.landing'
PENDO_IDS.layout.appPlaceholder    // 'layout.app.placeholder'
PENDO_IDS.sandbox.primaryButton    // 'sandbox.primary-button'
PENDO_IDS.sandbox.emailInput       // 'sandbox.email-input'
PENDO_IDS.sandbox.passwordInput    // 'sandbox.password-input'
PENDO_IDS.sandbox.signupAnchor     // 'sandbox.signup-anchor'
```

Phase 2 adds: `signup.*`, `signin.*`
Phase 3 adds: `nav.*`, `topbar.*`, `dashboard.*`
Phase 4 adds: `lists.*`, `settings.*`, `reports.*`
Phase 5 adds: `team.*`, `help.*`

## Primitive Shape Reference (for Phase 2+)

```ts
// All four require pendoId: PendoId — TypeScript will flag missing prop
type ButtonProps = MantineButtonProps & { pendoId: PendoId; children: ReactNode }
type TextInputProps = MantineTextInputProps & { pendoId: PendoId }
type PasswordInputProps = MantinePasswordInputProps & { pendoId: PendoId }
// AnchorProps also extends React.AnchorHTMLAttributes<HTMLAnchorElement> for href support
type AnchorProps = MantineAnchorProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { pendoId: PendoId; children: ReactNode }
```

## Session Replay Masking Details (PEN-09)

`PasswordInput` applies `.pendo-sr-ignore` class via:
```ts
const cls = ['pendo-sr-ignore', className].filter(Boolean).join(' ')
return <MantinePasswordInput data-pendo-id={pendoId} className={cls} {...rest} />
```

This is the **className composition approach** (NOT `data-pendo-mask` attribute). Rationale from RESEARCH.md: `.pendo-sr-ignore` is the current convention verified from Pendo Web SDK 2.324.0's `dist/replay.js`. The `data-pendo-mask` attribute was a legacy approach. In Phase 1 the class is inert; Phase 6's Pendo agent reads it.

## Decisions Made

- `PasswordInput` applies `.pendo-sr-ignore` CSS class (NOT `data-pendo-mask` attribute) per RESEARCH.md verification of Pendo SDK 2.324.0
- `AnchorProps` extended with `React.AnchorHTMLAttributes<HTMLAnchorElement>` because Mantine's Anchor is a PolymorphicFactory and native `<a>` attributes (like `href`) are not in `MantineAnchorProps` directly
- `PrimitivesSandbox` uses `React.JSX.Element` return type (not bare `JSX.Element`) because TypeScript 6 with `jsx: react-jsx` requires the qualified namespace form in strict mode
- Phase 1 `/sandbox` route ships in the main route map (not behind a dev-only build flag) for verifiability; Phase 5 can gate it if desired

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mantine Anchor polymorphic type requires AnchorHTMLAttributes extension**
- **Found during:** Task 2 (tsc --noEmit)
- **Issue:** Mantine's `AnchorProps` interface does not include `href` because Anchor is a PolymorphicFactory (default `'a'`) — native element attributes are passed through the spread but are not in the TypeScript type
- **Fix:** Extended `AnchorProps` with `React.AnchorHTMLAttributes<HTMLAnchorElement>` to include `href` and other `<a>` attributes
- **Files modified:** `src/ui/primitives/Anchor.tsx`
- **Commit:** b0e4da8

**2. [Rule 1 - Bug] JSX.Element return type requires qualified namespace in TypeScript 6 strict mode**
- **Found during:** Task 2 (tsc --noEmit)
- **Issue:** `JSX.Element` is not a valid unqualified reference when `jsx: react-jsx` is set in tsconfig; TypeScript 6 requires `React.JSX.Element` or just omitting the return type annotation
- **Fix:** Changed return type to `React.JSX.Element` and added `import React from 'react'` to PrimitivesSandbox.tsx
- **Files modified:** `src/routes/public/PrimitivesSandbox.tsx`
- **Commit:** b0e4da8

## Verification — /sandbox Route

Visit `http://localhost:5173/sandbox` after `npm run dev` to verify:
- Page renders with Title, description text, Button, TextInput, PasswordInput, Anchor
- DevTools → Elements: each primitive carries its `data-pendo-id` attribute
- PasswordInput: `pendo-sr-ignore` class present on the rendered element
- Console: zero errors
- Visit `http://localhost:5173/` to confirm Plan 05 routes still work

## Known Stubs

None. All four primitives are fully wired. The sandbox page uses real `PENDO_IDS.sandbox.*` values — no hardcoded strings, no placeholder data.

## Threat Flags

None. This plan introduces no network endpoints, auth paths, file access patterns, or schema changes. All changes are compile-time type contracts and DOM attribute markup.

## Self-Check: PASSED

Files created:
- src/pendo/PENDO_IDS.ts — FOUND
- src/ui/primitives/Button.tsx — FOUND
- src/ui/primitives/TextInput.tsx — FOUND
- src/ui/primitives/PasswordInput.tsx — FOUND
- src/ui/primitives/Anchor.tsx — FOUND
- src/ui/primitives/index.ts — FOUND
- src/routes/public/PrimitivesSandbox.tsx — FOUND
- docs/CONVENTIONS.md — FOUND

Files modified:
- src/router.tsx — FOUND (contains path: 'sandbox')

Commits:
- 6178e93 — feat(01-06): PENDO_IDS registry + four UI primitive wrappers + CONVENTIONS.md
- b0e4da8 — feat(01-06): PrimitivesSandbox page + /sandbox route under PublicLayout
