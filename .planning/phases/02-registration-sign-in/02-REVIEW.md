---
phase: 02-registration-sign-in
reviewed: 2026-05-14T16:32:24Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - src/auth/__tests__/auth.schemas.smoke.ts
  - src/auth/__tests__/auth.smoke.ts
  - src/auth/__tests__/passwordHash.smoke.ts
  - src/auth/__tests__/wizardSession.smoke.ts
  - src/auth/AuthProvider.tsx
  - src/auth/authRepo.ts
  - src/auth/authStore.ts
  - src/auth/index.ts
  - src/auth/passwordHash.ts
  - src/auth/RequireAnon.tsx
  - src/auth/RequireAuth.tsx
  - src/auth/schemas.ts
  - src/auth/types.ts
  - src/auth/useAuth.ts
  - src/auth/wizardSession.ts
  - src/pendo/PENDO_IDS.ts
  - src/router.tsx
  - src/routes/public/SignInPage.tsx
  - src/routes/public/signup/SignupShell.tsx
  - src/routes/public/signup/Step1AccountPage.tsx
  - src/routes/public/signup/Step2DetailsPage.tsx
  - src/routes/public/signup/Step3CompanyPage.tsx
  - src/routes/public/signup/Step4PreferencesPage.tsx
  - src/storage/__tests__/storage.keys.smoke.ts
  - src/storage/keys.ts
  - src/storage/schemas.ts
  - src/ui/primitives/Button.tsx
  - src/ui/primitives/index.ts
  - src/ui/primitives/MultiSelect.tsx
  - src/ui/primitives/NumberInput.tsx
  - src/ui/primitives/Select.tsx
findings:
  critical: 2
  warning: 8
  info: 6
  total: 16
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-14T16:32:24Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Phase 2 ships a usable registration wizard + sign-in surface with thoughtful
defense-in-depth (Zod-validated reads on every storage hydration, generic
`invalid_credentials` to mitigate username enumeration, synchronous
module-init hydration so `RequireAuth` doesn't flash sign-in for a returning
user). The Zod schemas are tightly bound to the UI-SPEC copy table and the
smoke tests exercise the locked error strings — that scaffolding is solid.

That said, the wizard's draft-write paths leak plaintext password into
`sessionStorage` and propagate it through the merge/round-trip flow further
than the threat model claims, and Step 1's email-duplicate error message is
hard-coded in two locations that will drift apart on the next copy change.
Several warnings cluster around the Step 2/3/4 form-state plumbing: the
`as unknown as` and `Partial<X> as X` double-casts paper over real
`undefined`-handling holes that would otherwise be caught by the type
checker, and Mantine's NumberInput `''` → `Number('')` → `0` coercion lets a
cleared "Years of experience" field silently become `0` rather than the
schema-rejecting `undefined`.

The SHA-256-without-salt password storage is explicitly out of scope per the
project context, but I have flagged it once under Info for completeness.

## Critical Issues

### CR-01: Step 1 email-duplicate copy is duplicated as a string literal — guaranteed to drift

**File:** `src/routes/public/signup/Step1AccountPage.tsx:43, 88, 106`
**Issue:** A constant `EMAIL_DUPLICATE_MESSAGE = 'An account with this email already exists.'` is defined at line 43 and used at line 72 (`form.setError`) and again at line 88 (`isEmailDuplicate = emailErr === EMAIL_DUPLICATE_MESSAGE`). But the JSX at line 105–106 hard-codes the same string a second time:

```tsx
error={
  isEmailDuplicate ? (
    <span>
      An account with this email already exists.{' '}
      <Anchor ...>Sign in instead?</Anchor>
    </span>
  ) : ...
}
```

The render-side string is NOT sourced from the constant. The flow is: schema sets the constant as the manual error message → the page reads it back, compares to the constant to set `isEmailDuplicate`, then re-renders a DIFFERENT hand-typed copy of the same sentence beside the inline `<Anchor>`. Any future copy edit that updates `EMAIL_DUPLICATE_MESSAGE` (e.g. to match a UI-SPEC tweak) will leave the rendered text stale: `isEmailDuplicate` will become false (no string match), the error will fall through the ternary to `emailErr`, and the user will see the NEW copy as a plain string with no `Sign in instead?` anchor. The inline anchor (which is the whole point of UI-SPEC's "Sign in instead?" affordance) silently disappears.

This is a real correctness bug: the two strings are load-bearing and coupled, but the code doesn't enforce the coupling.
**Fix:** Use the constant in the JSX, so the two are guaranteed to stay in sync:

```tsx
error={
  isEmailDuplicate ? (
    <span>
      {EMAIL_DUPLICATE_MESSAGE}{' '}
      <Anchor href="/signin" pendoId={PENDO_IDS.signup.step1.signinAnchor}>
        Sign in instead?
      </Anchor>
    </span>
  ) : (
    emailErr
  )
}
```

---

### CR-02: Step 1 plaintext `password` is written verbatim into sessionStorage on Continue

**File:** `src/routes/public/signup/Step1AccountPage.tsx:83`
**Issue:** On step-1 submit the page calls `writeWizardDraftStep('step1', values)` where `values` includes the plaintext `password` field. That string lands in `sessionStorage[halo:v1:signup:draft]` and persists there until the wizard completes (and calls `clearWizardDraft`) — which can be minutes, or forever if the user abandons the flow before clicking "Create account". The Step 4 file header acknowledges this window ("plaintext password lives in sessionStorage until clearWizardDraft runs — mitigation of T-02-17") but the mitigation as written only ends at successful completion. The retention window is unbounded on abandonment / error.

The threat model treats this as acceptable ("Halo is a Pendo demo surface") and `sessionStorage` is tab-scoped, so this is mostly a privacy-of-the-current-tab concern rather than cross-user data leakage. Two practical problems remain:

1. If the user fails step 4 (Zod re-validation throws, write failure, etc.), the wizard explicitly does NOT clear the draft (Step 4 line 144 comment: "user can retry by clicking Create account again"). The plaintext password now lives in sessionStorage for the rest of the tab's lifetime, surviving navigation away from /signup/preferences. A subsequent click on the Pendo banner / landing page / `/signin` does NOT clear it.
2. The schema-validated read path in `wizardSession.ts` cheerfully re-validates and re-serializes the plaintext password on every step's read-merge-write. It's not encrypted, masked, or scrubbed at any boundary.

Given the "fake data" framing this is not a deploy blocker on its own, but the demo-app caveat in `authStore.ts` says "an attacker with DevTools can edit `halo:v1:session` to forge a session" — the symmetric problem is "an attacker with DevTools can read the plaintext password from `sessionStorage[halo:v1:signup:draft]` while the wizard is open." The wizard ALSO restores the plaintext password into RHF defaultValues every time Step 1 re-mounts (line 47–60), so a user who refreshes mid-wizard sees the plaintext re-populate the password field.

Promoted to BLOCKER because (a) the threat-model claim is wider than the code's actual behavior — failure paths and tab-lifetime abandonment do not clear the draft, and (b) the round-tripping of plaintext through `JSON.stringify` makes it trivially visible to any extension or DevTools observer.

**Fix:** Strip `password` from the values before writing to sessionStorage; reflow Step 4's completion handler to read the plaintext from RHF state on the final step instead.

```tsx
// Step1AccountPage.tsx — onSubmit
const { password: _omit, ...nonSecretValues } = values
writeWizardDraftStep('step1', nonSecretValues)
navigate('/signup/details')
```

This requires Step 4 completion to fetch the password from somewhere other than `freshDraft.step1.password`. The cleanest fix is to keep a tab-scoped in-memory ref (a Zustand slice, or `useRef` lifted into a context) that holds the plaintext for the duration of the wizard and is dropped on `clearWizardDraft()` / navigation away from `/signup/*`. The wizard draft on disk should hold only fields safe to round-trip.

If the project owners decide the current trade-off is acceptable for a demo, downgrade to WARNING and document the retention window precisely in the threat model — including the failure-path and abandonment cases — rather than leaving the Step 4 comment as the only mention.

## Warnings

### WR-01: NumberInput `onChange` coerces empty input to `0` / `NaN` and writes it to RHF state

**File:** `src/routes/public/signup/Step2DetailsPage.tsx:115-122`, `src/routes/public/signup/Step4PreferencesPage.tsx:185-192`
**Issue:** Both pages wire NumberInput as:

```tsx
value={form.watch('yearsExperience') ?? ''}
onChange={(value) =>
  form.setValue(
    'yearsExperience',
    typeof value === 'number' ? value : Number(value),
    { shouldValidate: false },
  )
}
```

Mantine's NumberInput passes `''` (empty string) when the field is cleared, and the page-level guard `typeof value === 'number'` falls through to `Number(value)`. `Number('') === 0` and `Number(undefined) === NaN`. Consequences:

- For Step 2 `yearsExperience` (`min(0)`): a cleared field becomes `0`, which silently passes the schema. The user's empty intent is lost — they get a `0` they never typed.
- For Step 4 `teamSize` (`min(1)`): a cleared field becomes `0`, which the schema rejects with the default `min` error, NOT the locked "Enter a number — 1 if it's just you." copy (that fires only on `undefined`, via the `{ message: ... }` argument to `z.number()`). The user sees a default Zod message instead of the UI-SPEC-locked one.
- For both: pasting non-numeric text (e.g., `"abc"`) produces `NaN`, written into RHF state. The schema's `.int()` will reject NaN, but the error path again won't be the locked message.

This is a real UI-SPEC contract break for the locked inline-validation copy.

**Fix:** Preserve `undefined` (not `0`) for empty / non-numeric input so the `z.number({ message: ... })` typecheck fires the locked copy:

```tsx
onChange={(value) => {
  if (value === '' || value === null || value === undefined) {
    form.setValue('yearsExperience', undefined as unknown as number, { shouldValidate: false })
    return
  }
  const n = typeof value === 'number' ? value : Number(value)
  form.setValue('yearsExperience', Number.isFinite(n) ? n : (undefined as unknown as number), {
    shouldValidate: false,
  })
}}
```

(Same pattern for `teamSize`.) The `undefined as unknown as number` is unsightly but matches RHF's "field not yet provided" idiom; the schema's `z.number({ message: "..." })` will then surface the locked copy.

---

### WR-02: Double type-casts (`as Partial<X> as X`, `as unknown as string[]`) silently bypass real type errors

**File:** `src/routes/public/signup/Step2DetailsPage.tsx:69, 100`, `src/routes/public/signup/Step3CompanyPage.tsx:88, 119, 134, 150`, `src/routes/public/signup/Step4PreferencesPage.tsx:85, 170, 200`
**Issue:** Three patterns repeat across the wizard:

```tsx
} as Partial<Step2Values> as Step2Values,   // defaultValues with `undefined`s
data={ROLE_OPTIONS as unknown as string[]}  // readonly tuple → mutable string[]
(value ?? '') as Step2Values['role']        // narrow `string` → enum union
```

Each double-cast erases a type error that points at a real concern:

1. `defaultValues: { role: undefined, yearsExperience: undefined, ... } as Partial<X> as X`. Step2Values has `role: 'Product' | ... | 'Other'` (non-optional), but the defaults contain `undefined`. The cast pretends those are valid `Step2Values`. If RHF ever shifts to validating defaultValues at mount, this silently breaks. More urgently, downstream `form.watch('role')` returns `'...' | undefined` at runtime even though TS thinks it can't be undefined.
2. `ROLE_OPTIONS as unknown as string[]`. The `as unknown` step exists only because Mantine's `data` prop typing rejects readonly tuples. Casting away the readonly-ness has no runtime effect, but the `as unknown` hop tells future readers "I gave up on the type check here" — it's a structural smell that should be a thin `data={[...ROLE_OPTIONS]}` (creates a mutable shallow copy) or a typed Mantine `data` shape (`{value, label}[]`).
3. `(value ?? '') as Step2Values['role']`. Mantine's `Select.onChange` gives `string | null`. The `?? ''` coerces null to empty string, then the cast pretends an empty string is a valid `RoleEnum` value. Zod will catch the mismatch at submit, but in the meantime `form.getValues().role` is `'' as 'Product' | ... | 'Other'` — a typed lie. If any downstream code (e.g., a future preview component reading `role` to render an icon) reads this value it WILL hit the empty string at runtime.

**Fix:** Replace the casts with truth:
- For `defaultValues`, declare the form type as `Partial<Step2Values>` and let RHF widen at submit, OR keep the schema-derived type and use `undefined as unknown as 'Product'` only at the per-field level so the holes are visible.
- For `data`, spread into a mutable array: `data={[...ROLE_OPTIONS]}` (and the readonly-tuple readonly-ness was already lost via the cast — no real type info preserved).
- For the enum cast, use a discriminating runtime check, or set the field to `undefined` when the user clears the Select (mirrors WR-01).

---

### WR-03: `findVisitorByEmail` / `findVisitorByUsername` are NOT re-checked at wizard completion — concurrent-tab race writes duplicates

**File:** `src/routes/public/signup/Step4PreferencesPage.tsx:88-117`
**Issue:** Step 1 checks email + username uniqueness at submit. Step 4's completion handler re-validates the prior steps' SHAPE with `step1Schema.parse(freshDraft.step1)`, but does NOT re-check uniqueness before calling `createVisitor`. A user who opens `/signup` in two tabs and proceeds through both wizards in parallel can complete both — the second `createVisitor` call appends a second visitor with the same email/username, no error surfaced. Both records persist; `findVisitorByEmail` will return the first match and silently shadow the second.

Demo-acceptable per project context, but worth flagging because: (a) the Step 4 file header claims defense-in-depth, and (b) the second tab's user lands authenticated to a workspace they actually own, while the first tab's same-email user finds they can no longer sign in with their password (it hashes to a different value than the duplicate that won the email lookup).
**Fix:** In the Step 4 try-block, before `createVisitor`, re-run the uniqueness checks; on collision, surface a generic "An account with this email already exists." Alert and abort. This is one extra `findVisitorByEmail(s1.email)` / `findVisitorByUsername(s1.username)` pair.

---

### WR-04: `createVisitor` read-then-write is non-atomic across tabs (last-write-wins clobber)

**File:** `src/auth/authRepo.ts:145-146`, `src/auth/authRepo.ts:166-167`
**Issue:** Both `createVisitor` and `createWorkspace` use a read-modify-write sequence:

```ts
const existing = listVisitors()
writeJSON(K.visitors(), [...existing, visitor])
```

If two tabs (or two `await`-spaced calls within the same tab) call `createVisitor` between the `await hashPassword` completion and the `writeJSON`, one tab's append overwrites the other's. The async `await hashPassword` makes this race window meaningful even in a single tab.

For a single-tab demo this is unlikely to fire, but it's worth flagging because the repo doc-comment claims "the repo's job is 'write this record'" without acknowledging the read-modify-write hazard. Storage-event-based reconciliation (the TODO in `authStore.ts` for cross-tab session sync) doesn't help here — that's a session-level concern, not a list-merge concern.
**Fix:** No clean fix is possible in `localStorage` without a lock primitive. The pragmatic mitigation is to expand the doc-comment to explicitly note "non-atomic; concurrent calls in the same or different tabs may drop records" so future maintainers know not to lean on this for any flow where data loss matters.

---

### WR-05: `hasStep` returns false for a step that contains only the value `0` (number)

**File:** `src/auth/wizardSession.ts:126-128`
**Issue:** The hasStep check is:

```ts
return Object.values(step).some(
  (v) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0),
)
```

The function treats `0` (number) as "present" — fine for `yearsExperience: 0` and `teamSize: 0`. But Step 4's gate at `/signup/preferences` only checks step1/step2/step3, so this case isn't exercised by the wizard's gate flow. Where it matters is if a future caller adds a Step 2 gate (`hasStep(draft, 'step2')` already happens at Step 3 line 74). If a user types nothing on Step 2, fills only `yearsExperience: 0` (because they tabbed through and the NumberInput coerced empty to `0` per WR-01), then clicks Back without entering Job title / Role / Location — `Object.values({yearsExperience: 0, jobTitle: '', role: undefined, location: ''}).some(predicate)` is `some(v => true || ...)` for `0`, so hasStep returns true. The user then deep-links back to /signup/company and gets through Step 2's gate even though nothing meaningful was filled.

Coupled with WR-01 this is a small but real path: cleared NumberInput → `0` written → hasStep returns true → gate is satisfied with junk data → Step 4 completion's `step2Schema.parse(...)` catches it, but the user has already navigated past the gate.

**Fix:** Either (a) keep NumberInput empty-state as `undefined` (the WR-01 fix), OR (b) tighten hasStep to ignore zero-valued numeric fields unless they were explicitly typed (but that requires distinguishing "user typed 0" from "field coerced to 0", which the current sessionStorage shape doesn't capture).

---

### WR-06: `pathToStepIndex` matches `/signup/details*` with `startsWith` — accidental sub-path matches

**File:** `src/routes/public/signup/SignupShell.tsx:57-63`
**Issue:** The pathname-to-step-index mapper uses `startsWith`:

```ts
if (pathname.startsWith('/signup/details')) return 1
if (pathname.startsWith('/signup/company')) return 2
if (pathname.startsWith('/signup/preferences')) return 3
```

This works today because router.tsx registers exactly those four child routes. But if a future plan adds a nested route — say `/signup/details/edit` or `/signup/company-confirm` — the Stepper highlight will jump to the wrong step (`/signup/company-confirm` matches `startsWith('/signup/company')` → step 2). Equality checks (`=== '/signup/details'`) would be safer.
**Fix:**

```ts
if (pathname === '/signup/details' || pathname === '/signup/details/') return 1
if (pathname === '/signup/company' || pathname === '/signup/company/') return 2
if (pathname === '/signup/preferences' || pathname === '/signup/preferences/') return 3
```

Or normalize trailing slashes once at the top of the function and use strict equality.

---

### WR-07: `verifyPassword` "constant-time" comparison has a redundant length-check tail and runs across a 64-char ASCII string

**File:** `src/auth/passwordHash.ts:50-70`
**Issue:** Two correctness/quality concerns in the verify routine:

1. Line 69: `return acc === 0 && actualHash.length === expectedHash.length`. The `actualHash.length === expectedHash.length` tail is dead code — line 61–63 already returns false if those differ, so by the time line 69 runs the lengths are guaranteed equal. The `&&` clause adds no information.
2. The claim in the doc comment ("True constant-time comparison is impossible in JS without WASM... but this explicit loop discourages timing-attack accidents introduced by `===` short-circuiting") is correct in spirit, but the practical risk model for this demo is "DevTools-equipped attacker," for whom timing-attack resistance is irrelevant. The loop is fine; the doc comment oversells its security value. For a demo this is harmless, but the over-claim invites future maintainers to assume a property the code doesn't provide.

**Fix:**

```ts
let acc = 0
for (let i = 0; i < actualHash.length; i++) {
  acc |= actualHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
}
return acc === 0
```

And trim the doc comment's timing-attack paragraph to "this loop avoids `===` short-circuiting; do not infer real timing-attack resistance from it."

---

### WR-08: `AuthProvider` recreates a fresh `value` object every render — context consumers will re-render unnecessarily on any auth-slice change

**File:** `src/auth/AuthProvider.tsx:73-82`
**Issue:** The Provider builds `const value: AuthContextValue = { ... }` inline on every render, so the reference identity changes on every commit. The file header explains this away with: "components reading the context subscribe to Zustand slices, and those slices only change when the underlying store fields change." That's true for components that ALSO call `useAuthStore(...)`, but any consumer that ONLY does `const { signOut } = useAuth()` will re-render on every Provider update (e.g. every time `currentVisitor` changes), even though `signOut` itself is stable.

This isn't a correctness bug today because nothing reads `signOut` from `useAuth()` in shippable Phase 2 code (`SignInPage.tsx` reaches into the store directly via `useAuthStore.getState()`). But the public surface advertises `useAuth().signOut()` and Phase 3 will use it from the top-bar; without memoization, that top-bar will re-render on every store update unrelated to the buttons it renders.
**Fix:** Wrap `value` in `useMemo` keyed on the subscribed slices:

```ts
const value = useMemo<AuthContextValue>(
  () => ({
    user: currentVisitor,
    currentVisitor,
    currentWorkspace,
    isAuthenticated,
    signInWithCredentials,
    signInFromVisitor,
    signOut,
  }),
  [currentVisitor, currentWorkspace, isAuthenticated, signInWithCredentials, signInFromVisitor, signOut],
)
```

The header's defense-of-no-useMemo is internally consistent but only valid for one specific consumer pattern. The current code closes off the alternate pattern silently.

## Info

### IN-01: SHA-256 without salt for password storage

**File:** `src/auth/passwordHash.ts:29-35`
**Issue:** `hashPassword` is unsalted SHA-256. This is acknowledged as intentional per project context (Halo is a demo, fake data, called out in PROJECT.md as fake). Flagging once for the record: do not adapt this routine for any production code path. A salted, slow KDF (Argon2id, scrypt, bcrypt) is mandatory for real password storage. The current code is rainbow-table-trivial for any password less than 12 characters.
**Fix:** None for Phase 2. If Halo ever ships a real backend (per CLAUDE.md's "Stack Patterns by Variant"), swap this module's implementation for a server-side KDF.

---

### IN-02: `async signOut` returning `Promise.resolve()` is redundant

**File:** `src/auth/authStore.ts:126-130`
**Issue:**

```ts
signOut: async () => {
  get().clearSession()
  clearWizardDraft()
  return Promise.resolve()
},
```

The `async` keyword already wraps the function's return as a Promise. `return Promise.resolve()` reduces to `return undefined as Promise<void>` and is no different from a bare `return`. Quality nit.
**Fix:** `signOut: async () => { get().clearSession(); clearWizardDraft() },`

---

### IN-03: `Step1AccountPage` reads sessionStorage on every render

**File:** `src/routes/public/signup/Step1AccountPage.tsx:47`
**Issue:** `const draft = readWizardDraft().step1 ?? {}` runs on every render — JSON.parse + Zod safeParse per re-render. RHF only consumes `defaultValues` on first mount (or on `reset()`), so the per-render reads after mount are wasted. Identical pattern at `Step2DetailsPage.tsx:51`, `Step3CompanyPage.tsx:70`, `Step4PreferencesPage.tsx:66` (those read the full draft, not just one step).
**Fix:** `const draft = useMemo(() => readWizardDraft(), [])` (read once at mount), or hoist into a parent that owns the wizard draft state. Trivial perf win, no behavior change.

---

### IN-04: `signup.step1.signinAnchor` is reused across Steps 1–4 — Pendo analytics cannot distinguish step-of-origin clicks

**File:** `src/routes/public/signup/SignupShell.tsx:85`, `src/routes/public/signup/Step1AccountPage.tsx:109`, `src/pendo/PENDO_IDS.ts:64`
**Issue:** The "Already have an account? Sign in" footer anchor in `SignupShell` uses `PENDO_IDS.signup.step1.signinAnchor` on every step. Step 1's inline "Sign in instead?" anchor uses the same ID. Funnel analysis in Phase 6 will conflate clicks across all four wizard steps and the inline-error spot. The shell's file header acknowledges this is intentional ("the registry intentionally defines only one signin-anchor under step1"), but it does limit future Pendo configurability.
**Fix:** No code change required for Phase 2. If Phase 6 needs per-step funnel distinction, the registry can grow `signup.stepN.signinAnchor` entries and the shell can switch on the active step. Capture this trade-off in a follow-up note rather than letting it ship as an undocumented limitation.

---

### IN-05: `as` casts inside test files use unsafe runtime polyfill installation

**File:** `src/auth/__tests__/auth.smoke.ts:44`, `src/auth/__tests__/wizardSession.smoke.ts:66-67`
**Issue:** The smoke tests install storage polyfills via `(globalThis as unknown as Record<string, unknown>)['localStorage'] = ...`. The `as unknown as Record<string, unknown>` hop bypasses the DOM lib's typed `localStorage` declaration. This is a deliberate test-only escape hatch (and tests are explicitly excluded from the production bundle), but it would be safer to use a proper Storage interface or `globalThis.localStorage = mock as unknown as Storage`. Cosmetic.
**Fix:** Acceptable as-is given the test-only scope and the file-level comments explaining the pattern.

---

### IN-06: `step2Schema.yearsExperience` and `step4Schema.teamSize` `min/max` errors are unlocked default Zod copy

**File:** `src/auth/schemas.ts:142-146, 187-191`
**Issue:** The doc comment at line 138 acknowledges this: "yearsExperience min/max use Zod's default messages — UI-SPEC does not lock out-of-range copy (NumberInput min/max props enforce client-side clamping anyway, so the schema check is a defense-in-depth fallback)." But coupled with WR-01 (cleared NumberInput coerces to 0 / NaN, bypassing the locked `{ message: ... }` typecheck), the user will encounter unlocked Zod default copy when the NumberInput is cleared and submitted. The doc comment's claim is true only if NumberInput's clearing-behavior matches the assumption — it doesn't.
**Fix:** Fix WR-01 first; once the cleared input correctly produces `undefined`, the `z.number({ message: "..." })` typecheck will fire the locked copy and `min`/`max` errors stay defense-in-depth-only. If keeping current onChange behavior, lock `min` and `max` copy explicitly:

```ts
yearsExperience: z
  .number({ message: "Enter a number — 0 if you're starting out." })
  .int({ message: "Enter a whole number." })
  .min(0, "Enter 0 or more.")
  .max(60, "That's a lot — try a smaller number."),
```

---

_Reviewed: 2026-05-14T16:32:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
