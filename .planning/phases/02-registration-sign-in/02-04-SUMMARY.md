---
phase: 2
plan: 4
subsystem: auth
tags: [auth, wizard, sessionStorage, signup-draft, zod, never-throw, tdd]
requires:
  - 02-02 (SignupDraftSchema + SignupDraft type + K.signupDraft() key)
  - 01-03 (storage barrel exposes K builder)
provides:
  - src/auth/wizardSession.ts (readWizardDraft, writeWizardDraftStep, clearWizardDraft, hasStep)
  - src/auth/__tests__/wizardSession.smoke.ts (13 logical assertions, 15 PASS lines)
affects:
  - 02-05 (auth store signOut() will call clearWizardDraft())
  - 02-07 (Step 1 page calls writeWizardDraftStep('step1', form.values) on submit)
  - 02-08 (Step 2/3 pages call writeWizardDraftStep + hasStep gate)
  - 02-09 (Step 4 page calls writeWizardDraftStep + final clearWizardDraft on submit)
tech-stack:
  added: []
  patterns:
    - "sessionStorage twin of the localStorage codec: same try/catch/never-throw contract, same SafeParse-or-fallback shape, different backend"
    - "Read-merge-write per-step draft updates so writing step N preserves steps 1..N-1 (last-write-wins per field inside a step)"
    - "Pure hasStep predicate (no I/O) so step-page-mount gates can deep-link-check without a second sessionStorage hit"
    - "Generic param named Step to avoid shadowing the imported K storage-key-builder"
key-files:
  created:
    - src/auth/wizardSession.ts
    - src/auth/__tests__/wizardSession.smoke.ts
  modified: []
decisions:
  - "Backend is sessionStorage (NOT localStorage) — UI-SPEC AUTH-07 locks tab-scoped storage so partial PII clears on tab close and never leaks across tabs"
  - "readWizardDraft swallows ALL three failure modes (storage-access throw, JSON.parse throw, Zod schema mismatch) → returns {} — mirrors the storage codec never-throw contract"
  - "writeWizardDraftStep does read-merge-write so each step submission preserves all prior steps' fields and the partial-update-within-a-step semantics are last-write-wins per field"
  - "hasStep is a pure function (no I/O) — callers pass in a previously-read draft so a single readWizardDraft() can fuel multiple gate checks per render"
  - "hasStep treats '' and [] as 'not provided' so a user who tabbed through an empty step doesn't trip the deep-link gate"
  - "Generic param is named Step (not K) to avoid shadowing the imported K key-builder — TypeScript would silently shadow; the rename is intentional"
metrics:
  duration: 8min
  completed: 2026-05-14
---

# Phase 2 Plan 04: wizard-sessionstorage-draft Summary

The sessionStorage-backed wizard-draft module AUTH-07 mandates: every step submission writes its validated form values into `sessionStorage[K.signupDraft()]`, every step page reads the merged draft on mount, and refresh/back/forward mid-wizard restores the partial state. This module is the ONLY accessor of `sessionStorage[K.signupDraft()]` in the codebase.

## What Shipped

### `src/auth/wizardSession.ts` — 4 exported functions

| Function | Signature | Behavior |
|---|---|---|
| `readWizardDraft` | `() => SignupDraft` | `sessionStorage.getItem(K.signupDraft())` inside try/catch → JSON.parse inside try/catch → `SignupDraftSchema.safeParse(...)`. Returns `{}` on any failure (missing key, storage throw, parse throw, schema mismatch). Never throws. |
| `writeWizardDraftStep` | `<Step extends keyof SignupDraft>(stepKey: Step, partial: SignupDraft[Step]) => void` | Reads current draft, builds `{ ...current, [stepKey]: { ...(current[stepKey] ?? {}), ...(partial ?? {}) } }`, `JSON.stringify` + `sessionStorage.setItem` inside try/catch. Logs-and-swallows on quota/private-mode write failure. Never throws. |
| `clearWizardDraft` | `() => void` | `sessionStorage.removeItem(K.signupDraft())` inside try/catch. Never throws. |
| `hasStep` | `<Step extends keyof SignupDraft>(draft: SignupDraft, stepKey: Step) => boolean` | Pure predicate. `true` iff `draft[stepKey]` is defined AND `Object.values(draft[stepKey]).some(v => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))`. Does NOT touch sessionStorage. |

**Storage backend discipline:** Every line that names `sessionStorage` is in this single file. No other Phase 2 source file calls `sessionStorage.*` — verified via `grep -rE "sessionStorage\." src --include='*.ts' --include='*.tsx'` returning ONLY hits inside `src/auth/wizardSession.ts` and the smoke test (which installs the polyfill).

**No localStorage leak:** Zero `localStorage.*` references in this file — verified via `! grep -E "localStorage\." src/auth/wizardSession.ts` (exit 1, no match).

**Key sourcing:** The literal key string `'halo:v1:signup:draft'` is never typed inside `wizardSession.ts` — every read/write site calls `K.signupDraft()`. The only hand-typed literals live in (a) the key builder definition in `src/storage/keys.ts`, and (b) the pre-existing `src/storage/__tests__/storage.keys.smoke.ts` (a Plan 02-02 fixture that asserts the builder returns that exact literal).

### `src/auth/__tests__/wizardSession.smoke.ts` — 13 assertions, 15 PASS lines

1. Fresh `readWizardDraft()` on empty sessionStorage returns `{}`
2. After `writeWizardDraftStep('step1', { email: 'a@b.co' })`, raw `sessionStorage[K.signupDraft()]` is non-null (Test 2a) AND parses as JSON (Test 2b)
3. `readWizardDraft()` after that write returns `{ step1: { email: 'a@b.co' } }`
4. Second `writeWizardDraftStep('step1', { firstName: 'Ada' })` MERGES — result is `{ step1: { email: 'a@b.co', firstName: 'Ada' } }`
5. `writeWizardDraftStep('step2', { jobTitle: 'Dev' })` preserves step1 — result is `{ step1: {…}, step2: { jobTitle: 'Dev' } }`
6. `clearWizardDraft()` sets raw value to null (Test 6a) AND subsequent read returns `{}` (Test 6b)
7. `sessionStorage[K.signupDraft()] = 'not-json'` → `readWizardDraft()` returns `{}` (corrupt-JSON fallback)
8. `sessionStorage[K.signupDraft()] = JSON.stringify({ step1: 'invalid-shape' })` → `readWizardDraft()` returns `{}` (Zod fallback)
9. `hasStep({ step1: { email: 'a@b.co' } }, 'step1') === true`
10. `hasStep({}, 'step1') === false`
11. `hasStep({ step1: {} }, 'step1') === false` (empty object — no fields filled)
12. `hasStep({ step1: { email: '' } }, 'step1') === false` (empty string treated as not provided)
13. `hasStep({ step4: { topGoals: [] } }, 'step4') === false` (empty array treated as not provided)

Run via `npx tsx src/auth/__tests__/wizardSession.smoke.ts` → `wizardSession smoke: 15 passed, 0 failed`. Exit 0.

The smoke installs an in-memory `sessionStorage` polyfill AND an in-memory `localStorage` polyfill before any module import — the storage barrel pulls localStorage transitively even though `wizardSession.ts` never calls it, so both polyfills are belt-and-suspenders safe.

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| File presence | `test -f src/auth/wizardSession.ts && test -f src/auth/__tests__/wizardSession.smoke.ts` | both FOUND |
| Imports use barrel + relative paths | `grep -E "import \{ K \} from '../storage'" && grep -E "import \{ SignupDraftSchema \} from './schemas'" && grep -E "import type \{ SignupDraft \} from './types'"` | all 3 match |
| Four exports present | `grep -E "export function (readWizardDraft\|writeWizardDraftStep\|clearWizardDraft\|hasStep)"` | 4 matches |
| sessionStorage referenced in this file | `grep -E "sessionStorage" src/auth/wizardSession.ts` | matches |
| Zero `localStorage.*` in this file | `! grep -E "localStorage\." src/auth/wizardSession.ts` | exit 1, no match |
| K.signupDraft() used (no hand-typed key) | `grep -E "K\.signupDraft\(\)" src/auth/wizardSession.ts` | 3 call-site matches (read / write / remove) |
| Zod safeParse on every read | `grep -c "SignupDraftSchema\.safeParse" src/auth/wizardSession.ts` | 1 (called inside `readWizardDraft`) |
| Generic param is `Step` (not shadowing `K`) | `grep -E "Step extends keyof SignupDraft" src/auth/wizardSession.ts` | 2 matches (writeWizardDraftStep + hasStep) |
| Other src files calling sessionStorage.* | `grep -rE "sessionStorage\." src --include='*.ts' --include='*.tsx' \| grep -v wizardSession.ts \| grep -v __tests__` | no matches |
| Typecheck (browser tsc, excludes `src/**/__tests__`) | `npm run typecheck` | Exit 0 |
| Production build | `npm run build` | Exit 0, built in 480ms |
| Smoke test (Node, via tsx) | `npx tsx src/auth/__tests__/wizardSession.smoke.ts` | 15 PASS / 0 FAIL, exit 0 |

## Commits

| Hash | Type | Description |
|---|---|---|
| `a68f60c` | test | add failing smoke for wizardSession (13 assertions) — RED |
| `bc49450` | feat | add wizardSession sessionStorage draft module (AUTH-07) — GREEN |

## TDD Gate Compliance

Task 1 (`tdd="true"`) followed RED → GREEN:
- **RED** (`a68f60c`): smoke test added first; verified failing with `ERR_MODULE_NOT_FOUND` (module not yet present)
- **GREEN** (`bc49450`): `wizardSession.ts` implemented to satisfy all 13 assertions; final run reports `15 passed, 0 failed` (15 PASS lines reflect Test 2 and Test 6 each carrying two assertions)

No REFACTOR commit needed — the implementation was minimal and clean on first GREEN.

## must_haves Truths Reconciliation

| Truth | Reconciled |
|---|---|
| Wizard draft lives in `sessionStorage` (not `localStorage`) under key `halo:v1:signup:draft` | All call sites are `sessionStorage.*` + `K.signupDraft()`; zero `localStorage.*` in this file (smoke Test 1, plus grep AC) |
| Saving `{ step1: { email: 'a@b.co' } }` then reading back returns the same shape; file is the ONLY module touching `sessionStorage[K.signupDraft()]` | Smoke Test 2 + Test 3 confirm round-trip; `grep -rE "sessionStorage\." src --include='*.ts' --include='*.tsx'` shows only wizardSession.ts and the smoke test (allowed — the smoke installs the polyfill) |
| Reading a missing draft returns `{}`; corrupt-JSON value returns `{}` and never throws | Smoke Test 1 (missing key) + Test 7 (corrupt JSON) |
| `clearWizardDraft()` removes the entry; subsequent read returns `{}` | Smoke Test 6 (raw value null + read returns {}) |
| Saving step N data preserves other steps' data (partial updates merge) | Smoke Test 4 (merge within step1) + Test 5 (step1 preserved on step2 write) |

## Deviations from Plan

**1. [Rule 1 - AC text fix] JSDoc comment phrasing tripped the `! grep -E "localStorage\\." …` AC**

- **Found during:** Task 1 GREEN verification
- **Issue:** Original file-header JSDoc explained the contrast with the localStorage codec with the literal phrase `` calls `localStorage.getItem` directly`` — which `grep -E "localStorage\\."` matched (literal `localStorage.` substring inside a comment). The acceptance criterion is "zero `localStorage.*` calls" — the matched text was a comment, not a call. But the literal regex test is what the plan ships, so the comment was rephrased to "targets the localStorage backend directly. localStorage and sessionStorage share an API shape..." so the regex returns zero matches while keeping the docstring informative.
- **Fix:** One-line JSDoc rewording in `src/auth/wizardSession.ts` (file-level header). No behavioral change.
- **Files modified:** `src/auth/wizardSession.ts` (comment only, pre-commit)
- **Commit:** `bc49450` (the rewording was made before the GREEN commit; not a separate commit)

**2. [AC literal-vs-intent — documented, not fixed] `'halo:v1:signup:draft'` literal in pre-existing `storage.keys.smoke.ts`**

- **Found during:** AC self-check (`grep -RE "'halo:v1:signup:draft'" src`)
- **Issue:** The plan AC says "the only allowed place is `src/storage/keys.ts`" — but `src/storage/__tests__/storage.keys.smoke.ts` (shipped in Plan 02-02) also contains the literal, twice, as the expected-value side of an assertion `K.signupDraft() === 'halo:v1:signup:draft'`. This is the correct shape for a key-builder unit test (the test asserts the builder returns the expected literal — it must hand-type the expected value).
- **Decision:** Not fixed. The fixture was shipped by Plan 02-02; modifying it is out of scope per the executor's SCOPE BOUNDARY rule ("Only auto-fix issues DIRECTLY caused by the current task's changes"). The AC's intent — "no production-code module hand-types the key" — is fully satisfied: every non-test, non-key-definition reference uses `K.signupDraft()`.
- **Files modified:** none
- **Commit:** n/a

**3. [Off-by-one PASS-line count vs assertion count]**

- **Issue:** Plan said "Run at least 10 assertions" / "13 assertions" but two of the conceptual tests (Test 2 and Test 6) carry two `assert()` calls each — Test 2 asserts both `raw !== null` AND `JSON.parse(raw)` succeeds; Test 6 asserts both `removeItem` cleared the raw value AND the subsequent read returns `{}`. Run output reports `15 passed, 0 failed`.
- **Resolution:** Documented here. 13 logical tests / 15 PASS lines. Plan's "at least 10" lower bound is comfortably satisfied.

## Threat-Model Reconciliation

The plan's `<threat_model>` lists T-02-15 / T-02-16 / T-02-17 (mitigate) and T-02-18 (accept):

- **T-02-15 (Information disclosure / shared-machine PII retention) — mitigated.** sessionStorage is tab-scoped and clears on tab close. The smoke test verifies `clearWizardDraft()` empties storage (Test 6); Plan 02-05's `signOut()` and Plan 02-09's wizard-completion handler are the two ongoing callers — both consumers are scheduled in subsequent plans of the same wave / dependency chain. The module is now in place for them.
- **T-02-16 (Tampering with sessionStorage value) — mitigated.** Every read goes through `SignupDraftSchema.safeParse`; smoke Test 7 (corrupt JSON) and Test 8 (schema-invalid JSON) confirm both attack shapes fall through to `{}`.
- **T-02-17 (Password held in wizard draft briefly) — mitigated as designed.** This module ships the storage primitive; UI-SPEC AUTH-07 + AUTH-08 lock the per-step plaintext-password retention contract. The plan flagged the future enhancement of overwriting `draft.step1.password = ''` before final clear in Plan 02-09's submit handler; that decision is preserved here for the Plan 02-09 executor.
- **T-02-18 (Quota exhaustion) — accepted.** A signup draft is a few hundred bytes; sessionStorage quota is 5MB. The write path still wraps `setItem` in a try/catch that logs-and-swallows on `QuotaExceededError` (defense-in-depth even though the trigger is implausible at this size).

## Pendo Considerations

- No `pendo.*` calls added. wizardSession is pure data layer — no React, no router, no Pendo SDK surface.
- The wizard draft holds the *input* data that Plan 02-09 will harvest into `Visitor` + `Workspace` records, which Phase 6 PendoBridge then identifies on. This plan unblocks that chain by giving step pages a writer they can call on every submit.

## Self-Check: PASSED

- `src/auth/wizardSession.ts` — FOUND
- `src/auth/__tests__/wizardSession.smoke.ts` — FOUND
- Commit `a68f60c` (RED) — FOUND in `git log --all`
- Commit `bc49450` (GREEN) — FOUND in `git log --all`
- All 13 logical assertions PASS; 0 failures
- `npm run typecheck` exit 0
- `npm run build` exit 0
