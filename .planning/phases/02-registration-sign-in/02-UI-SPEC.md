---
phase: 2
slug: registration-sign-in
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-05-14
reviewed_at: 2026-05-14
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for the four-URL signup wizard (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`), `/signin`, sign-out, and the `RequireAuth` / `RequireAnon` route guards. All client-only; no Pendo runtime (Phase 6 retrofits).

This contract inherits 100% of its primitives, tokens, and markup conventions from Phase 1. Phase 2 adds the `signup.*` and `signin.*` namespaces to `PENDO_IDS` and the screens themselves — it MUST NOT re-define theme tokens, redesign the `DemoBanner`, or fork the four `src/ui/primitives/*` wrappers.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **none** — Mantine 9 is locked by CLAUDE.md and Phase 1; shadcn is explicitly NOT used (project locked to a component library, not a primitives + Tailwind path) |
| Preset | not applicable |
| Component library | **Mantine 9.2.0** (`@mantine/core`, `@mantine/hooks`) — already installed and wired via `MantineProvider theme={haloTheme}` in `src/App.tsx`. Phase 2 components used: `Stepper`, `Paper`, `Title`, `Text`, `Stack`, `Group`, `Divider`, `Select`, `MultiSelect`, `NumberInput`, `Notification`, `Alert`, `Loader`. **All interactive primitives MUST go through `src/ui/primitives/*` (the wrapped `Button` / `TextInput` / `PasswordInput` / `Anchor`); raw `@mantine/core` `Button`/`TextInput`/`PasswordInput`/`Anchor` are FORBIDDEN in page code** — they bypass the typed `pendoId: PendoId` requirement and violate PEN-07. Phase 2 may need a new wrapped primitive for `Select` / `MultiSelect` if those carry `data-pendo-id`; see "New primitives" below. |
| Icon library | **`@tabler/icons-react` 3.44.0** — Mantine's canonical icon library, already installed. Phase 2 icon use is minimal: `IconArrowRight` (Next CTA), `IconArrowLeft` (Back), `IconCheck` (step-complete), `IconAlertCircle` (form error toast), `IconEye`/`IconEyeOff` (Mantine's `PasswordInput` provides these natively — do not re-implement). Icon size: 16px inside buttons, 18px standalone. |
| Font | **Inter** with system fallback chain: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — locked in `src/theme.ts`. `@fontsource/inter` is **NOT** installed; system fallback renders cleanly. Phase 2 MUST NOT install a webfont or change the font family. |

**New primitives needed in Phase 2** — added under `src/ui/primitives/` so the typed `pendoId` requirement extends to every Phase 2 control:

| Primitive | Wraps | Why needed | New `pendoId` examples |
|-----------|-------|------------|------------------------|
| `Select` | `@mantine/core` `Select` | Role, company size, industry, plan tier dropdowns | `signup.company.industry`, `signup.preferences.use-case` |
| `MultiSelect` | `@mantine/core` `MultiSelect` | "Top goals" multi-select on Step 4 | `signup.preferences.goals` |
| `NumberInput` | `@mantine/core` `NumberInput` | Years of experience, team size | `signup.details.years-experience`, `signup.preferences.team-size` |

These wrappers follow the existing pattern (`pendoId: PendoId` required; forwards `data-pendo-id`; nothing else). They live in `src/ui/primitives/`, are exported from the barrel `src/ui/primitives/index.ts`, and are otherwise transparent. Do NOT add styling, validation, or icon defaults to the wrappers — those live on the page.

---

## Spacing Scale

Halo inherits Mantine 9's default named spacing tokens (verified from `@mantine/core/esm/core/MantineProvider/default-theme.mjs`). These are the **only** spacing values Phase 2 components reference — pages use Mantine's `gap="md"` / `p="lg"` / `py="xl"` props, never raw pixel values.

| Mantine token | Pixel value | Usage in Phase 2 |
|---------------|-------------|------------------|
| `xs` | **10px** | Inline icon gap (button left-icon ↔ label) |
| `sm` | **12px** | Field-to-field gap in `<Stack gap="sm">` inside a fieldset; help-text top-margin under inputs |
| `md` | **16px** | Default form-field stack gap (`<Stack gap="md">`); inner padding of `<Paper p="md">` for nested cards |
| `lg` | **20px** | Card-to-card gap; vertical padding of `<Container py="lg">` on signup/signin pages |
| `xl` | **32px** | Outer page top-padding (`pt="xl"`); section break between Stepper bar and form body |

**Exceptions:** Mantine's `xs` (10px) and `sm` (12px) are NOT multiples of 4. This deviation from the GSD 4-multiple recommendation is **accepted** because:
1. The project is locked to Mantine 9 per CLAUDE.md ("Use as the base for everything"); overriding the entire spacing scale would fork the design system and create more visual drift than it solves.
2. Mantine's scale is consistent across every page in the app — Phase 2 alignment with Phase 3/4/5 matters more than alignment with the GSD recipe.
3. The values 10/12 only appear via the `xs`/`sm` tokens; no Phase 2 page uses raw pixel values.

**Hard-coded pixel values are FORBIDDEN in Phase 2 markup.** Every spacing prop on every Mantine component must reference a token (`gap="md"`, `p="lg"`, `mt="xl"`). The single exception is icon `size={16}` / `size={18}` props on `@tabler/icons-react` icons — Tabler icons accept a pixel number, not a token.

**Form-field rhythm** (locked for all four wizard steps + `/signin`):
- Field label → input: Mantine default (no override)
- Input → help text: Mantine default (no override)
- Field → next field: `<Stack gap="md">` (16px)
- Field group → next group (e.g. Name → Job): `<Stack gap="lg">` (20px) with optional `<Divider />` between
- Last field → wizard nav row (Back / Next): `<Stack gap="xl">` (32px)

---

## Typography

Halo inherits Mantine 9's typography tokens (verified from `@mantine/core/esm/core/MantineProvider/default-theme.mjs`). Phase 2 uses **four** roles — Display, Heading, Body, Label — with **two** font weights (regular 400, semibold 600). The `<Title order={N}>` and `<Text size="…">` Mantine APIs are the only way to apply these.

| Role | Mantine API | Size | Weight | Line Height | Where used |
|------|-------------|------|--------|-------------|-----------|
| Display | `<Title order={1}>` | **34px** (Mantine default `headings.sizes.h1`) | **600** (Mantine default heading weight) | 1.3 | Page-level title on `/signin` and the wizard root (`/signup`) — one per page |
| Heading | `<Title order={2}>` | **26px** | **600** | 1.35 | Step heading per wizard step ("Tell us about yourself", "About your company", etc.) — one per step |
| Body | `<Text size="md">` (default) | **16px** | **400** | 1.55 | Form intro paragraphs, help text, secondary copy. Default Mantine `Text` body — do not override `size` for body copy. |
| Label | `<Text size="sm" fw={600}>` and Mantine input `label=` prop | **14px** | **400** for input labels (Mantine's `Input.Label` default); **600** for section sub-headings ("Personal details" above a fieldset) | 1.45 | All form labels (delivered automatically by Mantine when you pass `label="Email"` to `TextInput`); section sub-headings rendered as `<Text size="sm" fw={600} c="dimmed" tt="uppercase">` |

**Lockdown rules:**

1. Do **not** introduce a 5th font size. If a piece of copy doesn't fit into Display/Heading/Body/Label, rewrite the copy, don't add a size.
2. Do **not** introduce a 3rd weight. Mantine's default heading weight is 600 and body weight is 400 — these are the only two Phase 2 may use. Reject `fw={700}` (bold) in Phase 2 page code.
3. Body line-height is Mantine's `md` = **1.55** (effectively 1.5 — this is intentional). Headings use Mantine's per-level `lineHeight` (1.3 for h1, 1.35 for h2). Page code never overrides line-height.
4. The literal demo-banner text `Demo data only — never enter real credentials` is FND-06 — Phase 2 must NOT alter, shorten, or restyle it.

**Step heading copy (locked — verbatim):**

| Wizard URL | `<Title order={2}>` copy |
|------------|---------------------------|
| `/signup` | `Create your Halo account` |
| `/signup/details` | `A bit about you` |
| `/signup/company` | `About your company` |
| `/signup/preferences` | `Set up your workspace` |
| `/signin` | `Welcome back` |

---

## Color

Halo's locked palette is **indigo on light neutral** — Mantine's built-in `indigo` palette as `primaryColor` (set in `src/theme.ts`) plus Mantine's default `gray` neutrals. Phase 2 introduces **zero** new color tokens. Every color reference in page code uses Mantine's named tokens (`c="indigo.6"`, `color="indigo"`, `c="dimmed"`, `c="red.6"`) — raw hex values are FORBIDDEN.

The 60 / 30 / 10 recipe maps to Mantine tokens as follows:

| Role | Mantine token | Approximate hex (Mantine 9) | Usage |
|------|---------------|-----------------------------|-------|
| **Dominant (60%)** | Body background — Mantine `--mantine-color-body` (light scheme) | **`#ffffff`** | Page background of every public route; background of every wizard step card surface area outside of `<Paper>` |
| **Secondary (30%)** | `<Paper withBorder>` surface — Mantine `--mantine-color-gray-0` with `gray.3` border | Surface **`#f8f9fa`**, border **`#dee2e6`** | The single `<Paper withBorder p="xl" radius="md">` that wraps each wizard step's form fields. Also the `<Paper>` wrapping the `/signin` form. No other Paper or Card surfaces on Phase 2 pages. |
| **Accent (10%)** | `indigo.6` (Mantine indigo primary shade — already the theme's `primaryColor`) | **`#4263eb`** | **RESERVED for the primary submit/advance CTAs only** — see "Accent reserved for" below |
| **Destructive** | `red.6` (Mantine red) | **`#fa5252`** | Inline form error messages (auto-applied by Mantine when `error=` prop on inputs); the sign-out confirmation if any (Phase 2 has no destructive confirmation flow — sign-out is a one-click action with no modal) |
| **Muted text** | `c="dimmed"` (Mantine gray.6 in light scheme) | **`#868e96`** | Help text under inputs, intro paragraphs, "or" divider label between primary CTA and "Already have an account?" anchor |
| **Banner accent** | `color="orange"` (Mantine orange) | **`#fd7e14`** | The PERSISTENT `DemoBanner` at the top of every public route — locked in Phase 1; Phase 2 MUST NOT restyle, recolor, or relocate the banner |

**Accent (indigo.6) reserved for — exhaustive list. NOTHING ELSE in Phase 2 may use indigo:**

1. The primary submit/advance button on each wizard step (`Continue`, `Continue`, `Continue`, `Create account`) — exactly one per step, full-width on mobile breakpoints, `variant="filled" color="indigo"` (which is the Mantine default for `primaryColor='indigo'`, so just `<Button>` with no `color` prop suffices).
2. The primary submit button on `/signin` (`Sign in`) — same treatment.
3. The active step indicator in the Mantine `<Stepper>` component — Mantine `<Stepper>` automatically uses `primaryColor='indigo'` for the active/complete states; no override needed.
4. Inline text links in body copy (`Mantine <Anchor>` defaults to `primaryColor` underlined on hover) — specifically the "Already have an account? Sign in" link on `/signup` and "Don't have an account? Create one" on `/signin`.

**Forbidden uses of indigo (the accent rule):**
- The Back button on wizard steps 2-4 must be `variant="subtle"` or `variant="default"` with NO `color` prop (renders gray). It is secondary navigation — not the action.
- Form labels never carry color.
- Help text never carries color (uses `c="dimmed"`).
- Step heading and page Display titles never carry color (default body text color).
- The `DemoBanner` is orange — not indigo — by design (Phase 1 lock).
- No background-color tinting (`bg="indigo.0"`, etc.) anywhere in Phase 2.

**Light / dark color scheme:** Phase 2 is **light scheme only**. The theme toggle is a Phase 4 setting (SET-04). Phase 2 must NOT add a color-scheme toggle and must NOT use `useComputedColorScheme` — every page renders in `defaultColorScheme="light"` as set in `src/App.tsx`.

---

## Layout

Locked layout rules for Phase 2 pages. These are the load-bearing visual decisions — the executor implements these literally, not as suggestions.

### Wizard shell (all four `/signup*` routes)

```
┌─────────────────────────────────────────────────────┐
│ DemoBanner (orange, full-width, from Phase 1)       │  ← FND-06, do not touch
├─────────────────────────────────────────────────────┤
│                                                     │
│  Container size="sm" py="xl"                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ Title order={1}: "Create your Halo account"   │ │
│  │   (rendered ONCE — only on the /signup index) │ │
│  │   On /signup/details, /signup/company,        │ │
│  │   /signup/preferences the Display title is    │ │
│  │   replaced by the Stepper as the page         │ │
│  │   identity — no Display heading on steps 2–4. │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Stepper active={n} (Mantine <Stepper>):       │ │
│  │   1. Account  2. About you  3. Company  4. Setup │
│  │   — Step labels visible at sm breakpoint+;    │ │
│  │     icon-only at xs (Mantine handles).        │ │
│  │   — Use Stepper.Step for each, no Stepper.    │ │
│  │     Completed slot (we route, not tabbify).   │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Paper withBorder radius="md" p="xl":          │ │
│  │   ┌─────────────────────────────────────────┐ │ │
│  │   │ Title order={2}: step heading           │ │ │
│  │   │   (e.g. "A bit about you")              │ │ │
│  │   │ Text c="dimmed": one-line intro         │ │ │
│  │   │ ── gap="lg" ──                          │ │ │
│  │   │ Stack gap="md": form fields             │ │ │
│  │   │ ── gap="xl" ──                          │ │ │
│  │   │ Group justify="space-between":          │ │ │
│  │   │   ┌────────┐                    ┌─────┐ │ │ │
│  │   │   │ Back   │                    │ Next│ │ │ │
│  │   │   │ subtle │                    │indigo│ │ │
│  │   │   └────────┘                    └─────┘ │ │ │
│  │   │   (Back hidden / disabled on /signup    │ │ │
│  │   │    step 1 — no prior step)              │ │ │
│  │   └─────────────────────────────────────────┘ │ │
│  │ ── gap="md" ──                                │ │
│  │ Text size="sm" c="dimmed" ta="center":        │ │
│  │   "Already have an account? <Anchor>Sign in</Anchor>" │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Container size:** Mantine `<Container size="sm">` — caps the form width at 576px on desktop. Form fields breathe without stretching across 1920px monitors. Do NOT use `size="lg"` (the public-layout default from Phase 1) for the wizard — override locally per page.
- **Paper:** `<Paper withBorder radius="md" p="xl">` — the form card. `withBorder` (gray.3 border) + `radius="md"` (8px) gives a subtle SaaS-card look without shadows. Do NOT add `shadow="sm"` / `shadow="md"` — the project uses borders, not shadows, for surface separation in Phase 2. Phase 3+ may introduce shadows for the AppShell.
- **Stepper:** Mantine `<Stepper>` is the single source of truth for which step is active. The `active` prop is derived from `useLocation().pathname` (NOT from form state) — refreshing on `/signup/company` lands the user on step 3 with the Stepper highlighted, even if step 1's data is missing from sessionStorage (in which case the executor's logic redirects them back to step 1 — but the visual is still step 3 until that redirect runs).
- **Step labels (verbatim):** `1. Account` / `2. About you` / `3. Company` / `4. Setup` — short, two-word maximum. These render under each step circle on the Stepper.

### Sign-in page (`/signin`)

```
┌─────────────────────────────────────────────────────┐
│ DemoBanner                                          │
├─────────────────────────────────────────────────────┤
│  Container size="sm" py="xl"                        │
│  ┌───────────────────────────────────────────────┐ │
│  │ Title order={1}: "Welcome back"               │ │
│  │ ── gap="lg" ──                                │ │
│  │ Paper withBorder radius="md" p="xl":          │ │
│  │   Stack gap="md":                             │ │
│  │     TextInput (Email)                         │ │
│  │     PasswordInput (Password)                  │ │
│  │     ── gap="xl" ──                            │ │
│  │     Button (full-width, indigo): "Sign in"    │ │
│  │ ── gap="md" ──                                │ │
│  │ Text size="sm" c="dimmed" ta="center":        │ │
│  │   "Don't have an account? <Anchor>Create one</Anchor>" │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Single `<Paper>` containing two inputs + a full-width submit button. No "Forgot password?" link — explicitly out of scope per phase boundary.
- The primary `<Button>` is `fullWidth` only on `/signin` (single-action page). On wizard steps the Next button is fixed-width inside a `<Group justify="space-between">`.

### Loading / submitting state

- Primary `<Button>` toggles `loading={isSubmitting}` (Mantine renders an inline spinner + disables click). No full-page overlay, no separate `<Loader />` component, no skeleton state.
- Sign-up step 4 submit can take longer (SHA-256 hash + `localStorage` write). Button stays in `loading` state until redirect fires — typical < 100ms.

### Mobile breakpoint behavior

Wizard and sign-in pages collapse cleanly at `xs` (< 576px):
- `<Container size="sm">` collapses to full-width with Mantine's default padding.
- `<Stepper>` switches to icon-only mode (Mantine handles this automatically with `breakpoint` prop — set `breakpoint="sm"`).
- The Back/Next `<Group justify="space-between">` remains horizontal — Phase 2 explicitly does NOT stack these vertically on mobile, because the wizard layout reads more obviously as a flow with them side-by-side.

---

## Copywriting Contract

Every literal string a Phase 2 page renders is locked here. Executor MUST use these strings verbatim; if a string isn't here, copy it from the closest analogous row and propose it back in the SUMMARY for ratification.

### Page CTAs

| Page | Primary CTA (button text) | Secondary CTA | Notes |
|------|---------------------------|---------------|-------|
| `/signup` (step 1: Account) | `Continue` | none — first step has no Back | First-step CTA stays "Continue", not "Get started" — the user has already clicked "Sign up" to get here |
| `/signup/details` (step 2: About you) | `Continue` | `Back` (subtle/default variant, no color) | |
| `/signup/company` (step 3: Company) | `Continue` | `Back` | |
| `/signup/preferences` (step 4: Setup) | `Create account` | `Back` | Different label on the final step — signals commitment |
| `/signin` | `Sign in` | none | Plus a "Don't have an account? <Anchor>Create one</Anchor>" line below the Paper |
| Top-bar user menu (deferred to Phase 3) | `Sign out` | n/a | Phase 2 wires the `signOut()` handler in `AuthProvider`; Phase 3 surfaces the button |

### Field labels (verbatim — Mantine `label=` prop on each input)

| Step | Field | Label | Placeholder | Help text (Mantine `description=`) |
|------|-------|-------|-------------|------------------------------------|
| 1. Account | Email | `Email` | `you@example.com` | `We'll use this for sign-in. No real emails ever leave your browser.` |
| 1. Account | Password | `Password` | `At least 8 characters` | `Hashed locally and stored in your browser — there is no server.` |
| 1. Account | First name | `First name` | `Ada` | (none) |
| 1. Account | Last name | `Last name` | `Lovelace` | (none) |
| 1. Account | Username | `Username` | `ada` | `Visible on your profile and team page.` |
| 2. About you | Job title | `Job title` | `Senior product manager` | (none) |
| 2. About you | Role | `Role` (Select) | `Select your role` | (none) — options: `Product`, `Engineering`, `Design`, `Marketing`, `Sales`, `Operations`, `Other` |
| 2. About you | Years of experience | `Years of experience` (NumberInput) | `5` | (none) — min 0, max 60 |
| 2. About you | Location | `Location` | `Berlin, Germany` | (none) |
| 3. Company | Company name | `Company name` | `Acme Inc.` | (none) |
| 3. Company | Company size | `Company size` (Select) | `Select team size` | (none) — options: `1–10`, `11–50`, `51–200`, `201–1,000`, `1,000+` |
| 3. Company | Industry | `Industry` (Select) | `Select an industry` | (none) — options: `Software`, `Financial services`, `Healthcare`, `Retail / e-commerce`, `Manufacturing`, `Education`, `Other` |
| 3. Company | Plan tier | `Plan` (Select) | `Choose a plan` | `You can change this later in Settings.` — options: `Free`, `Pro`, `Enterprise` |
| 4. Setup | Primary use case | `What will you use Halo for?` (Select) | `Pick what fits best` | (none) — options: `Project management`, `Task tracking`, `Team coordination`, `Personal productivity`, `Just exploring` |
| 4. Setup | Team size | `How many people on your team?` (NumberInput) | `5` | (none) — min 1, max 10000 |
| 4. Setup | Top goals | `What are you hoping to get out of Halo?` (MultiSelect) | `Pick up to three` | `Select up to three.` — options: `Ship faster`, `Better visibility`, `Less context switching`, `Cleaner reporting`, `Onboard the team`, `Replace another tool` |
| /signin | Email | `Email` | `you@example.com` | (none) |
| /signin | Password | `Password` | (empty) | (none) — no help text on sign-in (returning user) |

### Inline validation errors (Zod messages — surfaced via Mantine `error=` prop on each input)

| Field | Trigger | Error copy (verbatim) |
|-------|---------|----------------------|
| Email | Empty | `Enter your email.` |
| Email | Not a valid email | `That doesn't look like an email — try again.` |
| Email (signup) | Already registered | `An account with this email already exists. Sign in instead?` (the "Sign in instead?" is an inline `<Anchor>` to `/signin`) |
| Password (signup) | Empty | `Enter a password.` |
| Password (signup) | < 8 chars | `Password must be at least 8 characters.` |
| Password (signin) | Empty | `Enter your password.` |
| Password (signin) | Doesn't match stored hash | `Email and password don't match. Try again.` (rendered as a form-level Alert above the Paper, NOT inline on the password field — sign-in pages don't reveal which credential is wrong) |
| First name | Empty | `Tell us your first name.` |
| Last name | Empty | `Tell us your last name.` |
| Username | Empty | `Pick a username.` |
| Username | Invalid chars | `Use letters, numbers, hyphens, and underscores only.` |
| Username | Already taken (registered to another visitor) | `That username is taken — try another.` |
| Job title | Empty | `What's your job title?` |
| Role | Empty | `Pick the closest role.` |
| Years of experience | Empty | `Enter a number — 0 if you're starting out.` |
| Location | Empty | `Where are you based?` |
| Company name | Empty | `What's your company called?` |
| Company size | Empty | `Pick your company size.` |
| Industry | Empty | `Pick the closest industry.` |
| Plan tier | Empty | `Choose a plan.` |
| Primary use case | Empty | `Pick one to continue.` |
| Team size | Empty | `Enter a number — 1 if it's just you.` |
| Top goals | Empty | `Pick at least one goal.` |
| Top goals | More than 3 selected | `Pick up to three.` (matches the description copy) |

### State copy

| State | Where | Copy |
|-------|-------|------|
| Empty state | n/a | Phase 2 has **no** empty states — every page renders a form, never a list. Empty states appear in Phase 3 (Dashboard) and Phase 4 (Lists). |
| Error state — form submit failure | Form-level `<Alert color="red" variant="light">` above the Paper | `Something went wrong — please try again.` (only used as a catch-all if a `localStorage` write fails; the hash + write path has no other failure mode at this scale) |
| Error state — invalid step entry | n/a | If a user deep-links to `/signup/company` without completing step 1, the executor's logic redirects to `/signup` — no error message is shown (visible redirect itself is the signal). |
| Loading state | Inline on the primary `<Button>` (`loading` prop) | n/a — the spinner is the copy. The button label does NOT change to "Signing in…" / "Creating…" — Mantine's spinner inside the button is the standard visual cue and replacing the label causes layout shift. |
| Sign-out (post-action) | n/a | Phase 2 does NOT toast on sign-out — the redirect to `/` is the confirmation. Phase 5 polish may add a toast retroactively (UI-02 covers this in Phase 5). |
| Sign-up complete (post-action) | n/a | Phase 2 does NOT toast on sign-up completion — the redirect to `/app` is the confirmation. (Same as sign-out — toast added in Phase 5 polish.) |
| Guard redirect — RequireAuth | n/a | Silent redirect to `/signin` — no flash message. The destination page already says "Welcome back" which is the implicit "you need to sign in" signal. |
| Guard redirect — RequireAnon | n/a | Silent redirect to `/app` — no flash. |

### Confirmation copy

| Action | Confirmation modal? | Copy |
|--------|--------------------|------|
| Sign out | **No** — single-click, no modal. Phase 2 boundary explicitly allows sign-out to be a one-click action; signing out only clears in-memory + localStorage session, no data destruction. | n/a |
| Cancel signup mid-flow | **No** — the user clicking the Halo logo or browser back beyond `/signup` is a normal flow exit. SessionStorage retains progress so re-entering at `/signup` resumes the wizard. There is no "Are you sure you want to cancel?" prompt. | n/a |
| Sign up (final step submit) | **No** modal — the user pressing `Create account` is the confirmation. | n/a |

### Anchor copy (Mantine `<Anchor>` via wrapped primitive)

| Where | Anchor copy | Destination |
|-------|-------------|-------------|
| `/signup` (and steps 2-4) | `Sign in` | `/signin` (rendered after the trailing "Already have an account?" sentence — `<Text>` plus inline `<Anchor>`) |
| `/signin` | `Create one` | `/signup` (rendered after the trailing "Don't have an account?" sentence) |
| Email-already-exists error message | `Sign in instead?` | `/signin` (inline within the Zod error string for that field) |

---

## Registry Safety

Halo does not use shadcn or any third-party component registry. There is no per-block safety gate to run.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (none — Mantine 9 native components only) | n/a | not applicable |
| (no third-party registries declared) | n/a | not applicable |

**Why no shadcn:** CLAUDE.md locks the UI library to Mantine 9 and the project's "What NOT to Use" table explicitly says CSS-in-JS at runtime is forbidden (which is a Mantine-vs-shadcn signal); the registry-vetting gate doesn't apply because no third-party code enters the source tree.

---

## PENDO_IDS Additions (Phase 2)

Phase 2 extends `src/pendo/PENDO_IDS.ts` with two new namespaces: `signup` and `signin`. **Every interactive element on every Phase 2 page MUST carry a `pendoId` referenced from this registry** — the wrapped primitives (`Button`, `TextInput`, `PasswordInput`, `Anchor`, plus new `Select` / `MultiSelect` / `NumberInput`) enforce this at the type level.

Required additions to `PENDO_IDS` (planner converts into the actual TS edit; executor implements):

```ts
PENDO_IDS.signup = {
  // Step 1: Account (/signup)
  step1: {
    email: 'signup.step1.email',
    password: 'signup.step1.password',
    firstName: 'signup.step1.first-name',
    lastName: 'signup.step1.last-name',
    username: 'signup.step1.username',
    submit: 'signup.step1.submit',         // "Continue" button
    signinAnchor: 'signup.step1.signin-anchor',
  },
  // Step 2: About you (/signup/details)
  step2: {
    jobTitle: 'signup.step2.job-title',
    role: 'signup.step2.role',
    yearsExperience: 'signup.step2.years-experience',
    location: 'signup.step2.location',
    back: 'signup.step2.back',
    submit: 'signup.step2.submit',         // "Continue"
  },
  // Step 3: Company (/signup/company)
  step3: {
    companyName: 'signup.step3.company-name',
    companySize: 'signup.step3.company-size',
    industry: 'signup.step3.industry',
    planTier: 'signup.step3.plan-tier',
    back: 'signup.step3.back',
    submit: 'signup.step3.submit',         // "Continue"
  },
  // Step 4: Setup (/signup/preferences)
  step4: {
    useCase: 'signup.step4.use-case',
    teamSize: 'signup.step4.team-size',
    goals: 'signup.step4.goals',
    back: 'signup.step4.back',
    submit: 'signup.step4.submit',         // "Create account" — FUNNEL CONVERSION TARGET
  },
  // Cross-step
  stepper: 'signup.stepper',                // The <Stepper> container; sub-targeting via aria-step
}

PENDO_IDS.signin = {
  email: 'signin.email',
  password: 'signin.password',
  submit: 'signin.submit',                  // "Sign in" — FUNNEL CONVERSION TARGET
  signupAnchor: 'signin.signup-anchor',     // "Create one"
}
```

**Phase 6 wiring note (informational — NOT Phase 2's work):** the `signup.step4.submit` and `signin.submit` `data-pendo-id` values are the funnel-conversion targets for the Pendo registration-funnel demo. They are stable strings — once Phase 2 ships, do NOT rename them. The `signup.stepper` ID anchors the Pendo agent for any step-position telemetry Phase 6 may want; sub-targeting individual step circles uses Mantine's `aria-` attributes rather than per-step `data-pendo-id` (per CLAUDE.md, "don't try to target individual chart bars — they're recomputed on every render" — same principle applies to Stepper internals).

---

## Interaction Contracts

These are the non-visual behavioral contracts the visual contract depends on. The executor implements them; the UI checker verifies the visual surface matches.

### Wizard navigation (per AUTH-01, AUTH-06, AUTH-07)

- Each of the four wizard URLs is a **separate route** (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`) — NOT a single-page tab UI. Browser Back / Forward / Refresh / direct-link must all land on the correct step.
- The Mantine `<Stepper>` `active` prop is derived from the URL pathname, NOT from form state. Implementation hint for the planner: a small `pathToStepIndex()` helper inside `src/auth/signup/SignupShell.tsx`.
- Wizard state (the partial form data collected so far) lives in `sessionStorage` under `halo:v1:signup:draft` (planner adds this key to `K` and a Zod schema for it). Cleared on completion (step 4 submit) or sign-out. Refreshing mid-flow restores the partial state.
- Clicking `Next` (Continue / Create account): RHF validates with Zod, on success writes the step's slice into the sessionStorage draft, then `navigate(nextStepPath)`. On validation failure, RHF surfaces inline errors and stays on the current URL.
- Clicking `Back`: writes the current step's slice into the draft (so the user doesn't lose typed but unsubmitted fields when stepping back), then `navigate(prevStepPath)`. Back does NOT re-validate.
- Deep-linking to `/signup/company` without completing step 1: the SignupShell (or step-3 loader) detects missing draft fields and redirects to `/signup` silently. No flash message; the page change is the signal.

### Auth state + persistence (per AUTH-08, AUTH-09, AUTH-10, AUTH-11)

- On step-4 submit:
  1. Hash password via `crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))` → hex string.
  2. Build `Visitor` record (with `nanoid` `id`) and `Workspace` record (with `nanoid` `id`) — full Zod schemas added to `src/storage/schemas.ts`.
  3. Write to `localStorage` under `halo:v1:visitors` (array) and `halo:v1:workspaces` (array). Planner adds `K.visitors()` and `K.workspaces()` to `keys.ts`.
  4. Write the session under `halo:v1:session` — `{ visitorId, workspaceId, signedInAt }`. Planner adds `K.session()`.
  5. Update `AuthProvider`'s in-memory state (Zustand store).
  6. Clear `halo:v1:signup:draft` (sessionStorage).
  7. `navigate('/app', { replace: true })`.
- On sign-in submit:
  1. Look up visitor by email in `halo:v1:visitors`.
  2. Hash the entered password; compare to stored hash. On mismatch → form-level Alert error (see Copywriting Contract).
  3. On match → write `halo:v1:session`, update Zustand store, `navigate('/app', { replace: true })`.
- On app boot, `AuthProvider` hydrates from `halo:v1:session` via `readWithSchema` — if a session exists, the user is signed in across refresh.
- On sign-out (`signOut()` from `useAuth()`):
  1. Clear in-memory Zustand auth state.
  2. Remove `halo:v1:session` from localStorage.
  3. `navigate('/', { replace: true })`.
  4. **Do NOT clear** `halo:v1:visitors` or `halo:v1:workspaces` — the user can sign back in.

### Route guards (per AUTH-12)

- `<RequireAuth>` wraps `<AppLayout>` in `src/router.tsx`. If `useAuth().user` is null, returns `<Navigate to="/signin" replace />`.
- `<RequireAnon>` wraps the public auth routes (`/signup`, `/signup/*`, `/signin`). If `useAuth().user` is non-null, returns `<Navigate to="/app" replace />`.
- The public index `/` and `/sandbox` are NOT wrapped in `<RequireAnon>` — signed-in users can still visit the public landing.

### Pendo runtime — explicitly out of scope

Phase 2 must NOT:
- Call `pendo.initialize`, `pendo.identify`, `pendo.clearSession`, `pendo.location.setUrl`, or any other `window.pendo.*` method.
- Add the Pendo snippet to `index.html`.
- Read `import.meta.env.VITE_PENDO_API_KEY`.
- Modify `src/pendo/PendoBridge.tsx`'s body (it remains a pure pass-through stub).

All `data-pendo-id` attributes Phase 2 adds are inert markup — Phase 6 retrofits the runtime that reads them.

---

## What Phase 2 Does NOT Touch

Hard out-of-scope list for the executor:

- **AppShell, side nav, top bar, user menu UI** — Phase 3 builds these. Phase 2's post-signup redirect lands on `/app`, which renders the existing Phase 1 `AppLayout` placeholder ("Authenticated area (Phase 3)" text). That is correct.
- **Toast notifications** — `@mantine/notifications` is NOT installed yet. Phase 5 polish (UI-02) installs it and adds toasts retroactively. Phase 2 must not install it.
- **Theme toggle** — Phase 4 (SET-04). Phase 2 is light-scheme only.
- **Forgot password / password reset / SSO / social login** — explicitly out of scope per phase boundary and REQUIREMENTS.md.
- **Real email verification** — explicit "Out of Scope" line in REQUIREMENTS.md.
- **Seed-data generation** — Phase 5 (DATA-01). Phase 2 creates one visitor + one workspace per registration; no `@faker-js/faker` calls in Phase 2.
- **AppLayout polish** — the Phase 1 placeholder stays. Phase 3 replaces it.

---

## Pre-population Sources

For checker traceability — every value in this UI-SPEC was sourced from upstream artifacts or locked defaults, not from new user questions in a Phase-2 design discussion (none was held — the Phase 1 + CLAUDE.md context is sufficient).

| Section | Source |
|---------|--------|
| Design System: Mantine 9 | CLAUDE.md ("UI library: Mantine") + Phase 1 Plan 02 (`@mantine/core@9.2.0` installed) |
| Design System: shadcn = none | CLAUDE.md + `components.json` absent from repo |
| Design System: icons | Phase 1 Plan 02 (`@tabler/icons-react@3.44.0` installed) |
| Design System: font Inter | `src/theme.ts` (already locked) |
| Spacing scale | Mantine 9 default theme (verified from `node_modules/@mantine/core/esm/.../default-theme.mjs`) |
| Typography sizes / weights | Mantine 9 default theme + Mantine `<Title order={N}>` API conventions |
| Color: indigo primary | `src/theme.ts` (`primaryColor: 'indigo'`) |
| Color: 60/30/10 mapping | Derived from Mantine indigo palette + Mantine gray neutrals (standard Mantine SaaS pattern) |
| PENDO_IDS additions | Phase 1 Plan 06 SUMMARY ("Phase 2 adds: `signup.*`, `signin.*`") + CLAUDE.md ("data-pendo-id contract") |
| Wizard URL structure | REQUIREMENTS.md AUTH-01 (verbatim URLs) |
| Field list per step | REQUIREMENTS.md AUTH-02 through AUTH-05 (verbatim fields) |
| Session storage of draft | REQUIREMENTS.md AUTH-07 |
| Password hashing | REQUIREMENTS.md AUTH-08 (SHA-256 via `crypto.subtle.digest`) |
| Route guards | REQUIREMENTS.md AUTH-12 |
| Phase 6 deferral | STATE.md "2026-05-13: User decision — defer all Pendo runtime ... to Phase 6" |
| No toasts in Phase 2 | ROADMAP.md Phase 5 covers UI-02 (toasts); REQUIREMENTS.md does not require them for AUTH-* |
| No theme toggle in Phase 2 | REQUIREMENTS.md SET-04 is Phase 4 scope |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
