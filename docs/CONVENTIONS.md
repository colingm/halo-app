# Halo Markup Conventions

Three Phase 1 conventions for keeping Halo instrumentable with Pendo.

---

## 1. PENDO_IDS registry — the only source of `data-pendo-id` values (PEN-07)

Every interactive element on every page MUST carry a stable `data-pendo-id`
attribute sourced from `src/pendo/PENDO_IDS.ts`. Page code never hand-types
a `data-pendo-id="..."` string literal. Instead, use the typed `pendoId` prop
on the primitive wrappers in `src/ui/primitives/`:

```tsx
// Correct — type-safe, refactor-safe
<Button pendoId={PENDO_IDS.signup.submitStep1}>Continue</Button>

// WRONG — hand-typed string, no compile-time safety
<button data-pendo-id="signup.submit-step-1">Continue</button>
```

Phase 6's Pendo agent reads `data-pendo-id` attributes for guide targeting,
feature adoption tagging, and track events. Keeping values stable across
releases is the whole point — changes to any PENDO_IDS leaf require a
considered rename, not a casual edit.

To add new IDs: add a leaf to the relevant namespace in PENDO_IDS.ts. Phase 2
adds `signup.*` and `signin.*`; Phase 3 adds `nav.*`, `topbar.*`, `dashboard.*`;
Phase 4 adds `lists.*`, `settings.*`, `reports.*`; Phase 5 adds `team.*`, `help.*`.

---

## 2. No canvas-backed charts — SVG only (PEN-08)

All charts in Halo MUST render to SVG. The Pendo agent cannot target individual
elements inside a `<canvas>` — a canvas chart looks like a flat image to the
agent, making guide targeting impossible and Session Replay unintelligible.

**Approved chart libraries:**
- Recharts (Phase 3+ default — SVG-rendered, React-native API)
- Visx (SVG; more code per chart — use only for bespoke viz)
- Nivo (SVG)
- ECharts in SVG rendering mode

**Prohibited:**
- Chart.js — canvas-only; the `<canvas>` element is opaque to Pendo
- Highcharts — commercial license restrictions; canvas-default
- Direct `<canvas>` rendering
- Any library whose primary output is `<canvas>` unless SVG mode is explicitly
  enabled and verified

Phase 3 will install Recharts. This convention exists now so no Phase reaches
for Chart.js first.

---

## 3. Masked password inputs — `.pendo-sr-ignore` class (PEN-09)

Sensitive form fields MUST use `<PasswordInput>` from `src/ui/primitives/`
(not Mantine's `PasswordInput` directly). The primitive automatically applies
the CSS class `pendo-sr-ignore` via `className` composition.

Pendo Session Replay (when wired in Phase 6) treats elements with class
`.pendo-sr-ignore` as block-from-recording. Additionally, Pendo auto-masks
`input[type=password]`, `input[type=email]`, and `input[type=tel]` by default —
the class is explicit belt-and-suspenders.

Phase 2 will be the first phase to render password fields (signup wizard).
Because the `PasswordInput` primitive is in place now, Phase 2 inherits the
masking automatically with no additional wiring. Phase 6 installs the Pendo
agent that reads the class; in Phase 1 the class is inert.

**Do not** apply `.pendo-sr-ignore` manually to arbitrary elements — it should
only flow from the `PasswordInput` primitive. If a future phase needs to mask
a non-password field, add a new primitive variant rather than scattering the
class string across page code.
