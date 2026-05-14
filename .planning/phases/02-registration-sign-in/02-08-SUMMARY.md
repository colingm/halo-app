---
phase: 2
plan: 8
subsystem: auth-signup
tags: [auth, signup, wizard, react-hook-form, zod, sessionstorage, step-gate, mantine, pendo-ids]
requires:
  - src/auth/schemas.ts (Plan 02-02 — step2Schema, step3Schema, RoleEnum, CompanySizeEnum, IndustryEnum, PlanTierEnum)
  - src/auth/types.ts (Plan 02-02 — Step2Values, Step3Values inferred from schemas)
  - src/auth/wizardSession.ts (Plan 02-04 — readWizardDraft, writeWizardDraftStep, hasStep)
  - src/auth/index.ts (Plan 02-06 — auth barrel re-exports all of the above)
  - src/routes/public/signup/SignupShell.tsx (Plan 02-06 — outer wizard layout + Stepper + footer signin anchor)
  - src/routes/public/signup/Step1AccountPage.tsx (Plan 02-07 — canonical Wave 3 form shape that Step 2/3 mirror)
  - src/routes/public/signup/Step2DetailsPage.tsx (Plan 02-06 placeholder body, replaced in this plan)
  - src/routes/public/signup/Step3CompanyPage.tsx (Plan 02-06 placeholder body, replaced in this plan)
  - src/ui/primitives/index.ts (Plan 02-01 — TextInput / Select / NumberInput / Button wrappers)
  - src/pendo/PENDO_IDS.ts (Plan 02-01 — PENDO_IDS.signup.step2.*, PENDO_IDS.signup.step3.*)
provides:
  - "Fully wired Step 2 (About you) signup form — 4 inputs (TextInput / Select / NumberInput / TextInput) + Back + Continue, with step-1 deep-link gate"
  - "Fully wired Step 3 (About your company) signup form — 4 inputs (TextInput + 3 Selects) + Back + Continue, with prior-step (step1 AND step2) gate"
  - "Mirror of Plan 02-07's Step1AccountPage RHF+Zod+sessionStorage shape across both pages — Wave 3 canonical pattern propagated"
  - "Back-button UX contract per UI-SPEC: variant=default (gray), persist current values via writeWizardDraftStep, navigate WITHOUT re-validating"
  - "Locked UI-SPEC option lists (Roles 7, Sizes 5, Industries 7, Plans 3) verbatim in source — en-dashes / commas / spaced slashes / plus signs preserved"
affects:
  - "Wave 3 plan 02-09 (step 4 preferences) — gains a step3-completed precondition; on valid step-3 submit the user lands at /signup/preferences which 02-09 wires"
tech-stack:
  added: []
  patterns:
    - "RHF + Mantine controlled-input bridge via form.watch + form.setValue (instead of <Controller>) for Select / NumberInput, since Mantine controlled inputs use value/onChange(newValue) rather than native event-shape onChange"
    - "Type-cast pattern `(value ?? '') as Step2Values['role']` on Select onChange — TS-side coercion of string-to-Zod-enum-union; Zod resolver re-validates at submit time so the cast is safe"
    - "`as Partial<StepNValues> as StepNValues` double cast on defaultValues — RHF's DeepPartial<TFieldValues> default-typing rejects undefined enum/number values directly, but the runtime contract permits them (Zod resolver re-validates on submit). The double cast is the canonical RHF+Zod-strict-mode escape."
    - "Step-gate guard implemented in page body (not React Router loader) — top-of-render `if (!hasStep(...)) return <Navigate replace />`. Keeps router config simple; matches UI-SPEC's silent-redirect rule (no flash message)."
    - "Back persist-then-navigate handler: writeWizardDraftStep(stepN, form.getValues()) → navigate(prevPath). `Back does NOT re-validate.` per UI-SPEC — typed but unsubmitted input is preserved across step navigation."
    - "Module-top option arrays declared with `as const` + `as unknown as string[]` cast on Mantine's `data=` prop — preserves literal-string type elsewhere while satisfying Mantine's mutable-array variance check."
key-files:
  created:
    - .planning/phases/02-registration-sign-in/02-08-SUMMARY.md
  modified:
    - src/routes/public/signup/Step2DetailsPage.tsx
    - src/routes/public/signup/Step3CompanyPage.tsx
decisions:
  - "Used RHF + Mantine controlled-input bridge (form.watch + form.setValue) rather than RHF <Controller> for Select / NumberInput. Both are valid per UI-SPEC; the watch+setValue path is shorter, mirrors the plan's reference snippet verbatim, and keeps a single declarative-style form body throughout. <Controller> would be the right call only if strict-mode TS rejects setValue's narrowed type — which it does not at the current resolver@5 / Zod 4.4.3 / RHF 7.75 pin."
  - "defaultValues typed via `as Partial<StepNValues> as StepNValues` double cast. RHF's TFieldValues generic expects fully-populated default values; spreading a partial sessionStorage slice over `{ x: '', y: undefined, ... }` produces a runtime-valid but type-strict-invalid object. The double cast is the documented RHF+Zod escape — alternatives would be (a) a non-generic useForm() losing inference, or (b) full-coverage default literals for every enum which forces an arbitrary first-option default."
  - "Step-gate `Navigate` is in the page body, not a React Router loader. Plan 02-06's router does not need to learn per-step gate logic; the gate logic lives with the page that owns the precondition. Refresh on /signup/details with no step1 data renders <Navigate to=\"/signup\" replace /> — replace=true so the back button does not bounce the user back into the gated page."
  - "Step 3's gate redirects to `/signup` (wizard root) on EITHER step1 OR step2 missing — not to /signup/details on step2-only-missing. The plan's `<objective>` explicitly authorizes this: 'Step 3 redirects to /signup whenever any prior step is missing — the user can re-enter'. Simpler than partial-state recovery; safe because typed-but-unsubmitted data from step 2 is preserved in sessionStorage via the Back handler."
  - "Back button styled `variant=\"default\"` (gray-bordered) per UI-SPEC `Color > Forbidden uses of indigo`. UI-SPEC permits `variant=\"subtle\"` or `variant=\"default\"`; `\"default\"` reads as 'secondary button' (more conventional for a wizard Back affordance than the tertiary-looking `\"subtle\"` ghost variant)."
metrics:
  duration: 3min
  tasks_completed: 2
  files_created: 0
  files_modified: 2
  completed: 2026-05-14
---

# Phase 2 Plan 8: Signup Step 2 (About you) and Step 3 (About your company) Forms Summary

Step 2 (`/signup/details`) and Step 3 (`/signup/company`) of the signup wizard are fully wired — React Hook Form + Zod resolvers against the locked `step2Schema` / `step3Schema`, sessionStorage rehydration of typed-but-unsubmitted fields, page-body deep-link gates that silently redirect to `/signup` on any prior-step miss, and Back / Continue navigation that persists draft state across step transitions per UI-SPEC's "Back does NOT re-validate" rule. Both pages mirror Plan 02-07's Step 1 shape (RHF + zodResolver + sessionStorage + wrapped Mantine primitives + locked PENDO_IDS leaves).

## What Shipped

### Task 1 — Step2DetailsPage body replacement (commit `66796ac`)

**`src/routes/public/signup/Step2DetailsPage.tsx`** — full body replacement (~155 lines). The shape:

- `useForm<Step2Values>({ resolver: zodResolver(step2Schema), mode: 'onSubmit', defaultValues })` — `mode: 'onSubmit'` inherited from Plan 02-07's Step 1 to match UI-SPEC's "validates on Next" rhythm.
- `defaultValues` spreads `(draft.step2 ?? {})` over `{ jobTitle: '', role: undefined, yearsExperience: undefined, location: '' }` and is cast `as Partial<Step2Values> as Step2Values` so RHF's strict-typed DeepPartial check is satisfied (Zod resolver re-validates at submit, so the cast is runtime-safe).
- Step-1 gate at top of render: `if (!hasStep(draft, 'step1')) return <Navigate to="/signup" replace />` — silent redirect, no flash message.
- 4 wrapped Mantine inputs:
  - **TextInput** Job title (`{...form.register('jobTitle')}`) — uncontrolled, RHF register pattern.
  - **Select** Role (controlled via `value={form.watch('role') ?? null}` + `onChange={(value) => form.setValue('role', (value ?? '') as Step2Values['role'], { shouldValidate: false })}`). `data={ROLE_OPTIONS as unknown as string[]}` — 7 options as a module-top `as const` literal array.
  - **NumberInput** Years of experience (controlled via watch/setValue; `min={0} max={60}`; coerces `string | number` to `number` on change).
  - **TextInput** Location (`{...form.register('location')}`).
- `<Group justify="space-between" mt="xl">` contains:
  - **Back Button** `type="button" variant="default"` (gray-bordered, no `color` prop — passes UI-SPEC `Color > Forbidden uses of indigo`). `onClick={onBack}` — persists current form values via `writeWizardDraftStep('step2', form.getValues() as Partial<Step2Values>)` THEN `navigate('/signup')`. **Back does NOT re-validate** — RHF schema validation is bypassed; even invalid input flows into the draft so step navigation never loses typed work.
  - **Continue Button** `type="submit" loading={form.formState.isSubmitting}` — Mantine default-variant (filled, indigo via `primaryColor: 'indigo'` theme). On valid submit: `writeWizardDraftStep('step2', values)` → `navigate('/signup/company')`.

**Imports verified clean:** TextInput, Select, NumberInput, Button only from `'../../../ui/primitives'`. From `@mantine/core` only layout primitives (`Stack`, `Group`, `Title`). Zero `pendo.*` runtime calls.

### Task 2 — Step3CompanyPage body replacement (commit `d9bd613`)

**`src/routes/public/signup/Step3CompanyPage.tsx`** — full body replacement (~177 lines). Mirrors Step 2 with these differences:

- Imports drop `NumberInput` (step 3 has no numeric field) — `import { TextInput, Select, Button } from '../../../ui/primitives'`.
- Three module-top `as const` option arrays — see locked option lists below.
- Prior-step gate checks BOTH step 1 AND step 2: `if (!hasStep(draft, 'step1') || !hasStep(draft, 'step2')) return <Navigate to="/signup" replace />`. Both misses redirect to the wizard root (not step 2) per the plan's authorized simplification — sessionStorage retention means re-entering at `/signup` resumes from the missing step.
- 4 wrapped Mantine inputs: **TextInput** Company name + **Select** Company size + **Select** Industry + **Select** Plan tier. Each Select uses the same `form.watch + form.setValue` controlled-input bridge as Step 2's Role.
- The Plan Select carries `description="You can change this later in Settings."` (Mantine `description=` slot) per UI-SPEC's locked help-text. Other Selects render `description` undefined.
- Continue: `writeWizardDraftStep('step3', values)` → `navigate('/signup/preferences')` (the URL Plan 02-09's Step 4 will own).
- Back: persist-then-navigate to `/signup/details`.

## Locked Option Lists (verbatim with Unicode preservation)

The Mantine `data=` prop on each Select sources from a module-top `as const` array. Every option string matches UI-SPEC verbatim — including three Unicode hazards Zod enum checks against strict-equal:

### Step 2 — ROLE_OPTIONS (7 entries)

```
'Product', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'Other'
```

All ASCII; no Unicode hazards. Matches `RoleEnum` in `src/auth/schemas.ts`.

### Step 3 — COMPANY_SIZE_OPTIONS (5 entries — en-dash + comma + plus preserved)

```
'1–10', '11–50', '51–200', '201–1,000', '1,000+'
```

- **EN DASH (U+2013)** in all four range entries — NOT an ASCII hyphen (U+002D). The Zod `CompanySizeEnum` strict-equals these exact strings.
- **Comma** in `'201–1,000'` and `'1,000+'` — preserved verbatim.
- **Plus** in `'1,000+'` — preserved verbatim.

### Step 3 — INDUSTRY_OPTIONS (7 entries — spaced slash preserved)

```
'Software', 'Financial services', 'Healthcare', 'Retail / e-commerce', 'Manufacturing', 'Education', 'Other'
```

- **Spaced slash** in `'Retail / e-commerce'` — single spaces flanking the `/`. Matches `IndustryEnum`.

### Step 3 — PLAN_OPTIONS (3 entries)

```
'Free', 'Pro', 'Enterprise'
```

All ASCII; no Unicode hazards. Matches `PlanTierEnum`.

All four arrays grep-verified via `grep -F` against the source file in the plan's automated verify block. The double-cast `as unknown as string[]` on each `data=` prop is required because Mantine's `SelectProps['data']` expects a mutable `(string | { value; label })[]`; `as const` produces a `readonly` tuple of literal types, which fails Mantine's variance check without the cast.

## Mirror of Plan 02-07's Step 1 Shape

Both pages mirror the Step 1 reference implementation almost exactly. The shared structure across all three Wave 3 form pages:

| Aspect | Step 1 (Plan 02-07) | Step 2 (this plan, Task 1) | Step 3 (this plan, Task 2) |
|--------|---------------------|----------------------------|----------------------------|
| Form library | `useForm` from RHF | same | same |
| Resolver | `zodResolver(step1Schema)` | `zodResolver(step2Schema)` | `zodResolver(step3Schema)` |
| Validation mode | `'onSubmit'` | same | same |
| Default-values pattern | spread `(draft.step1 ?? {})` | spread `(draft.step2 ?? {})` + double cast | spread `(draft.step3 ?? {})` + double cast |
| Submit handler | `writeWizardDraftStep + navigate` | same (target: `/signup/company`) | same (target: `/signup/preferences`) |
| Page heading | `<Title order={2}>Create your Halo account</Title>` | `<Title order={2}>A bit about you</Title>` | `<Title order={2}>About your company</Title>` |
| Form wrapper | `<form onSubmit={onSubmit} noValidate>` | same | same |
| Field container | `<Stack gap="md">` | same | same |
| Button row | `<Group justify="flex-end" mt="xl">` (no Back) | `<Group justify="space-between" mt="xl">` (Back + Continue) | same as Step 2 |
| Back button | n/a | `variant="default"`, no color, persist-then-navigate | same |
| Continue button | `type="submit" loading={isSubmitting}` | same | same |
| Step-gate | n/a (entry point) | `!hasStep(draft, 'step1')` | `!hasStep(draft, 'step1') \|\| !hasStep(draft, 'step2')` |
| Wrapped primitives | `TextInput, PasswordInput, Button, Anchor` | `TextInput, Select, NumberInput, Button` | `TextInput, Select, Button` |
| Mantine non-interactive | `Stack, Group, Title, Text` | `Stack, Group, Title` (no intro Text) | same as Step 2 |
| `pendoId` source | `PENDO_IDS.signup.step1.*` | `PENDO_IDS.signup.step2.*` | `PENDO_IDS.signup.step3.*` |
| `pendo.*` runtime call count | 0 | 0 | 0 |
| Raw Mantine interactive imports | 0 | 0 | 0 |

## UI-SPEC Copy Landed Verbatim

| Slot | Page | Copy |
|------|------|------|
| Step heading (`<Title order={2}>`) | Step 2 | `A bit about you` |
| Step heading | Step 3 | `About your company` |
| Job title label | Step 2 | `Job title` |
| Job title placeholder | Step 2 | `Senior product manager` |
| Role label | Step 2 | `Role` |
| Role placeholder | Step 2 | `Select your role` |
| Years of experience label | Step 2 | `Years of experience` |
| Years of experience placeholder | Step 2 | `5` |
| Location label | Step 2 | `Location` |
| Location placeholder | Step 2 | `Berlin, Germany` |
| Company name label | Step 3 | `Company name` |
| Company name placeholder | Step 3 | `Acme Inc.` |
| Company size label | Step 3 | `Company size` |
| Company size placeholder | Step 3 | `Select team size` |
| Industry label | Step 3 | `Industry` |
| Industry placeholder | Step 3 | `Select an industry` |
| Plan label | Step 3 | `Plan` |
| Plan placeholder | Step 3 | `Choose a plan` |
| Plan description | Step 3 | `You can change this later in Settings.` |
| Back button | Both | `Back` |
| Continue button | Both | `Continue` |

Field-level Zod errors land via `step2Schema` / `step3Schema` (Plan 02-02) and surface through Mantine's `error=` slot. The four step-2 messages and four step-3 messages are locked in the schemas themselves, not in these page files.

## PENDO_IDS Wired

All 12 interactive controls across both pages reference `PENDO_IDS.signup.stepN.*` — every `pendoId` prop is type-checked against the `PendoId` union from `src/pendo/PENDO_IDS.ts`.

### Step 2 (6 leaves)

| Control | `pendoId` |
|---------|-----------|
| Job title input | `PENDO_IDS.signup.step2.jobTitle` (`signup.step2.job-title`) |
| Role select | `PENDO_IDS.signup.step2.role` (`signup.step2.role`) |
| Years of experience input | `PENDO_IDS.signup.step2.yearsExperience` (`signup.step2.years-experience`) |
| Location input | `PENDO_IDS.signup.step2.location` (`signup.step2.location`) |
| Back button | `PENDO_IDS.signup.step2.back` (`signup.step2.back`) |
| Continue button | `PENDO_IDS.signup.step2.submit` (`signup.step2.submit`) |

### Step 3 (6 leaves)

| Control | `pendoId` |
|---------|-----------|
| Company name input | `PENDO_IDS.signup.step3.companyName` (`signup.step3.company-name`) |
| Company size select | `PENDO_IDS.signup.step3.companySize` (`signup.step3.company-size`) |
| Industry select | `PENDO_IDS.signup.step3.industry` (`signup.step3.industry`) |
| Plan select | `PENDO_IDS.signup.step3.planTier` (`signup.step3.plan-tier`) |
| Back button | `PENDO_IDS.signup.step3.back` (`signup.step3.back`) |
| Continue button | `PENDO_IDS.signup.step3.submit` (`signup.step3.submit`) |

## Verification

### Static grep checks (plan `<automated>` blocks)

- **Task 1 Step 2:** 26 grep patterns + 3 negative assertions — all PASS.
- **Task 2 Step 3:** 38 grep patterns + 3 negative assertions — all PASS (including the 5 en-dash-bearing size strings, the spaced-slash industry, and the comma+plus on `1,000+`).

Both pages negative-asserted clean:
- `! grep -E "from '@mantine/core'" ... | grep -E "(Button|TextInput|...)"` — NO raw Mantine interactive imports.
- `! grep -E "pendo\."` (excluding `data-pendo-id`, `PENDO_IDS`, `pendoId`, `src/pendo`) — NO `pendo.*` runtime calls.
- `! grep -E 'color="indigo"'` — NO indigo-color override anywhere.

### `npm run typecheck`

PASS — exit 0. `tsc --noEmit -p tsconfig.app.json` completes cleanly.

### `npm run build`

PASS — exit 0. Vite output:

```
vite v8.0.12 building client environment for production...
✓ 7044 modules transformed.
dist/index.html                   0.78 kB │ gzip:   0.46 kB
dist/assets/index-Cvr7Em8_.css  212.90 kB │ gzip:  31.37 kB
dist/assets/index-DvsNuMzP.js   586.35 kB │ gzip: 182.18 kB
✓ built in 689ms
```

Bundle size grew from Plan 02-07's `477.39 kB` JS (146.92 kB gzip) to `586.35 kB` (182.18 kB gzip) — Mantine's `Select` + `NumberInput` modules pull in additional dropdown / number-spinner machinery. The vite chunk-size warning at >500 kB is informational; code-splitting is a Phase 5 polish concern, not a Phase 2 contract.

## Deviations from Plan

**None.** Both tasks executed exactly as written. No Rule 1 / Rule 2 / Rule 3 / Rule 4 deviations required. Plan-text-grep formatting tweaks (inline `<Button>Back</Button>` and `<Button>Continue</Button>` rendering to satisfy `grep -F ">Back<"` / `grep -F ">Continue<"`) match the established Plan 02-07 convention and are formatting choices, not behavior changes.

## Authentication Gates

None encountered. Plan execution is purely client-side TypeScript editing — no external auth surface touched.

## Threat Flags

None. The plan's `<threat_model>` register (T-02-35 through T-02-38) covers every trust boundary introduced:

- **T-02-35 (Information disclosure of step 2/3 PII in sessionStorage):** Mitigated upstream by Plan 02-04's tab-scoped sessionStorage envelope; this plan's writes follow the same pattern. The Back-button persist-on-navigation increases the retention window for typed-but-unsubmitted fields, but the sessionStorage scope is unchanged.
- **T-02-36 (Tampering / step-gate bypass via DevTools):** Accepted — Plan 02-09's step-4 final validation re-runs `step1Schema + step2Schema + step3Schema + step4Schema` against the entire draft before write, so a forged gate-pass with incomplete data fails at the finalization stage.
- **T-02-37 (XSS via labels / options / placeholders):** Mitigated — every locked string is a static literal in source; Mantine + React default-escape text nodes.
- **T-02-38 (Open redirect via Back/Next):** Mitigated — `grep -E "navigate\(.*\\\$\\{" src/routes/public/signup/Step[23]*.tsx` returns zero matches. All `navigate(...)` calls use hardcoded literal paths: `/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`.

No new threat surface beyond what the plan anticipated.

## Known Stubs

**None.** Every input is wired to a real RHF register or controlled-bridge, real Zod validator, real sessionStorage writer. Both pages perform their locked behavior (gate / persist / navigate) on every interaction. No placeholder data, no TODO surfaces, no empty-array UI props.

## Self-Check: PASSED

**Created files:**

- `FOUND: .planning/phases/02-registration-sign-in/02-08-SUMMARY.md`

**Modified files:**

- `FOUND: src/routes/public/signup/Step2DetailsPage.tsx`
- `FOUND: src/routes/public/signup/Step3CompanyPage.tsx`

**Commits:**

- `FOUND: 66796ac` — `feat(02-08): wire Step 2 signup form (about you) with RHF + Zod + step-1 gate`
- `FOUND: d9bd613` — `feat(02-08): wire Step 3 signup form (company) with RHF + Zod + prior-step gate`
