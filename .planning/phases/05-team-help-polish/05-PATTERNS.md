# Phase 5: Team, Help & Polish — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 20 new / modified files
**Analogs found:** 18 / 20 (1 mixed-analog, 1 no-analog — static module)

---

## File Classification

| New/Modified File | Status | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|--------|------|-----------|----------------|---------------|
| `src/team/schemas.ts` | NEW | schema (Zod) | persistence-validate | `src/tasks/schemas.ts` | exact |
| `src/team/types.ts` | NEW | types (z.infer) | persistence-types | `src/tasks/types.ts` | exact |
| `src/team/teamsRepo.ts` | NEW | repo (CRUD) | localStorage R/M/W | `src/tasks/tasksRepo.ts` + `src/auth/authRepo.ts` (`updateVisitor`) | exact (composite) |
| `src/team/teamSeed.ts` | NEW | seed (faker idempotent) | localStorage one-shot write | `src/tasks/tasksSeed.ts` | exact (with surgical departures) |
| `src/team/components/TeamTable.tsx` | NEW | component (Mantine `<Table>`) | render-read | `src/tasks/components/TaskTable.tsx` (structural) — but TanStack-free | role-match (TanStack swapped for Mantine native per UI-SPEC) |
| `src/team/components/InviteTeammateModal.tsx` | NEW | component (RHF + Zod modal) | form submit → repo write | `src/tasks/components/TaskFormModal.tsx` | exact |
| `src/team/components/TeamEmptyState.tsx` | NEW | component (hero empty state) | render-only | `src/tasks/components/ListsEmptyState.tsx` | exact |
| `src/help/schemas.ts` | NEW | schema (Zod) | static validation | `src/tasks/schemas.ts` | exact (no persistence wrapper) |
| `src/help/types.ts` | NEW | types (z.infer) | static types | `src/tasks/types.ts` | exact |
| `src/help/helpArticles.ts` | NEW | static-data module (faker.seed pinned) | module-init synthesis | `src/tasks/tasksSeed.ts` (faker idiom) + NEW pattern (no localStorage) | partial — no direct analog for "static read-only module" |
| `src/help/components/HelpList.tsx` | NEW | component (grouped list render) | render-read | `src/dashboard/Dashboard.tsx` activity feed grouping + `src/tasks/components/TaskTable.tsx` Paper-wrap | role-match |
| `src/help/components/HelpSearchInput.tsx` | NEW | component (TextInput + debounce) | controlled input | `src/tasks/components/TaskFiltersBar.tsx` (filter pattern) + Mantine `useDebouncedValue` | role-match |
| `src/help/components/HelpNoResultsState.tsx` | NEW | component (compact empty state) | render-only | `src/tasks/components/FilteredEmptyState.tsx` | exact |
| `src/routes/app/help/HelpArticlePage.tsx` | NEW | route component (detail view with `useParams`) | read-only render | `src/routes/app/lists/ListsPage.tsx` (composer shape) + new `useParams` lookup | role-match |
| `src/seed/seedAll.ts` | NEW | coordinator (seed orchestration + stamp) | localStorage one-shot write | `src/tasks/tasksSeed.ts` (idempotency + stamp tail) | exact (recomposed) |
| `src/storage/keys.ts` | MODIFY | key registry | string builder add | self (`K.tasks(workspaceId)` line) | exact (additive) |
| `src/tasks/tasksSeed.ts` | MODIFY (surgical) | seed (faker idempotent) | localStorage one-shot write | self — minus stamp tail, plus teammate read | exact (surgical edit) |
| `src/tasks/assigneeOptions.ts` | MODIFY (source swap) | derivation helper | in-memory transform | self — swap `listTasks` for `listTeammates` | exact (one-line swap) |
| `src/pendo/PENDO_IDS.ts` | MODIFY | const registry | static const append | self (Phase 4 `lists`, `settings`, `reports` namespaces) | exact (additive append) |
| `src/router.tsx` | MODIFY | route registry | additive child route | self (nested children pattern from `signup`) | exact (additive) |
| `src/routes/app/AppLayout.tsx` | MODIFY (1-line) | layout coordinator | `useEffect` swap | self (line 81 — swap `seedIfNeeded` for `seedDemoData`) | exact (one-line edit) |
| `src/routes/app/team/TeamPage.tsx` | MODIFY (body replace) | route component (composer) | composer | `src/routes/app/lists/ListsPage.tsx` | exact |
| `src/routes/app/help/HelpPage.tsx` | MODIFY (body replace) | route component (composer) | composer | `src/routes/app/lists/ListsPage.tsx` | exact (simplified — no CRUD) |

---

## Pattern Assignments

### `src/team/schemas.ts` (schema, persistence-validate)

**Analog:** `src/tasks/schemas.ts`

**File-header docblock pattern** (`src/tasks/schemas.ts` lines 1-15):
```ts
/**
 * Halo team — Zod schemas (Phase 5).
 *
 * This module is the single source of truth for:
 *
 *   1. Team persistence schemas — `readWithSchema` reads against
 *      TeammatesArraySchema on every K.teammates(workspaceId) hydration.
 *   2. WorkspaceRoleEnum — distinct from `Visitor.role` (RoleEnum in
 *      src/auth/schemas.ts). Workspace permission role vs. functional role.
 *
 * Schema lock: every field shape in TeammateSchema is the Phase 5 TEAM
 * contract. Editing TeammateSchema is a deliberate cross-phase change.
 */
```

**Enum pattern** (`src/tasks/schemas.ts` lines 23-27 + Phase 5 D-02 spec):
```ts
import { z } from 'zod'

/** Workspace-permission role (distinct from functional Visitor.role). D-02 lock. */
export const WorkspaceRoleEnum = z.enum(['Owner', 'Admin', 'Member', 'Viewer'])

/** Teammate status — D-01: 'active' (seeded or accepted) or 'invited' (pending). */
export const TeammateStatusEnum = z.enum(['active', 'invited'])
```

**Object schema pattern** (`src/tasks/schemas.ts` lines 56-75):
```ts
export const TeammateSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string(),                       // may be empty (invited rows derive only firstName)
  email: z.string().email(),
  workspaceRole: WorkspaceRoleEnum,
  status: TeammateStatusEnum,
  lastActiveAt: z.iso.datetime().nullable(),  // null for invited rows
  invitedAt: z.iso.datetime().nullable(),     // non-null for invited; null for active
  avatar: z.string().nullable(),              // URL or null (planner picks faker.image.avatar() vs initials)
})

/** Array shape of `K.teammates(workspaceId)` localStorage value. */
export const TeammatesArraySchema = z.array(TeammateSchema)
```

**Form schema pattern** (`src/tasks/schemas.ts` lines 109-116 — `TaskFormSchema` pattern):
```ts
// Local to src/team/components/InviteTeammateModal.tsx per Phase 4 D-15 local-form-schema pattern.
// Note: D-03 dedup is a .superRefine that calls listTeammates at validation time.
export const InviteFormSchema = z.object({
  email: z.string().min(1, 'Enter an email.').email('Enter a valid email.'),
  workspaceRole: z.enum(['Admin', 'Member', 'Viewer'], { message: 'Pick a role.' }),
})
```

---

### `src/team/types.ts` (types, persistence-types)

**Analog:** `src/tasks/types.ts` (entire file, 37 lines)

**Pattern (verbatim mirror — every type derives via `z.infer`):**
```ts
import type { z } from 'zod'
import type {
  TeammateSchema,
  TeammateStatusEnum,
  WorkspaceRoleEnum,
} from './schemas'

export type Teammate = z.infer<typeof TeammateSchema>
export type TeammateStatus = z.infer<typeof TeammateStatusEnum>
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>
```

Locked rule (from `src/tasks/types.ts` lines 3-8): "Zod is the single source of truth — DO NOT hand-write parallel type declarations here."

---

### `src/team/teamsRepo.ts` (repo, localStorage R/M/W)

**Analog (primary):** `src/tasks/tasksRepo.ts`
**Analog (update pattern):** `src/auth/authRepo.ts` `updateVisitor` (lines 198-210)

**Imports pattern** (`src/tasks/tasksRepo.ts` lines 19-22):
```ts
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON } from '../storage'
import { TeammatesArraySchema } from './schemas'
import type { Teammate } from './types'
```

**Input shape pattern** (`src/tasks/tasksRepo.ts` lines 28-29):
```ts
/** Input to `createTeammate`. The repo fills `id`. */
export type CreateTeammateInput = Omit<Teammate, 'id'>
```

**Read helpers pattern** (`src/tasks/tasksRepo.ts` lines 48-56 — verbatim shape):
```ts
/** Return all persisted teammates for `workspaceId`. Falls through to `[]` on corrupt storage. */
export function listTeammates(workspaceId: string): Teammate[] {
  return readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [] as Teammate[])
}

/** Strict-equality lookup by teammate id. Returns `undefined` if no match. */
export function getTeammateById(workspaceId: string, id: string): Teammate | undefined {
  return listTeammates(workspaceId).find((t) => t.id === id)
}
```

**Case-insensitive email lookup pattern** (`src/auth/authRepo.ts` lines 85-88 — for D-03 dedupe `.superRefine`):
```ts
/** Case-insensitive lookup by email. Returns `undefined` if no match. */
export function findTeammateByEmail(workspaceId: string, email: string): Teammate | undefined {
  const needle = email.toLowerCase()
  return listTeammates(workspaceId).find((t) => t.email.toLowerCase() === needle)
}
```

**Create pattern** (`src/tasks/tasksRepo.ts` lines 70-87 — simpler since no completedAt invariant):
```ts
export function createTeammate(workspaceId: string, input: CreateTeammateInput): Teammate {
  const teammate: Teammate = {
    id: nanoid(),
    ...input,
  }
  const existing = listTeammates(workspaceId)
  writeJSON(K.teammates(workspaceId), [...existing, teammate])
  return teammate
}
```

**Update pattern** (`src/auth/authRepo.ts` lines 198-210 — preferred over `tasksRepo.updateTask` because no completedAt invariant complexity):
```ts
export function updateTeammate(
  workspaceId: string,
  id: string,
  patch: Partial<Omit<Teammate, 'id'>>,
): Teammate | undefined {
  const existing = listTeammates(workspaceId)
  const idx = existing.findIndex((t) => t.id === id)
  if (idx === -1) return undefined
  const updated: Teammate = { ...existing[idx], ...patch }
  const next = [...existing]
  next[idx] = updated
  writeJSON(K.teammates(workspaceId), next)
  return updated
}
```

**Delete pattern** (`src/tasks/tasksRepo.ts` lines 147-153 — required by CONTEXT D-01 even though Phase 5 ships no UI consumer per `<deferred>` "Remove member"):
```ts
export function deleteTeammate(workspaceId: string, id: string): boolean {
  const existing = listTeammates(workspaceId)
  const next = existing.filter((t) => t.id !== id)
  if (next.length === existing.length) return false
  writeJSON(K.teammates(workspaceId), next)
  return true
}
```

**Critical deviation from `tasksRepo`:** No `completedAt` / `prevStatus` invariant complexity. The teammate update is a pure shallow merge — closer to `authRepo.updateVisitor` than `tasksRepo.updateTask`.

---

### `src/team/teamSeed.ts` (seed, localStorage one-shot write)

**Analog:** `src/tasks/tasksSeed.ts`

**Imports pattern** (`src/tasks/tasksSeed.ts` lines 34-38):
```ts
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import { TeammatesArraySchema } from './schemas'
import { useAuthStore } from '../auth/authStore'      // NEW — for currentVisitor read per D-04
import type { Teammate } from './types'
```

**Default meta constant pattern** (`src/tasks/tasksSeed.ts` lines 44-48):
```ts
const DEFAULT_META = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null as string | null,
  appVersion: APP_VERSION,
}
```

**Idempotency gate pattern (CRITICAL — D-12 amendment removes stamp from tail)** — adapted from `src/tasks/tasksSeed.ts` lines 166-187:
```ts
export function seedTeammatesIfNeeded(workspaceId: string): void {
  // GATE 1: Primary idempotency check — meta.seededAt is the authoritative flag.
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  if (meta.seededAt !== null) return

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

  const teammates = ownerRow ? [ownerRow, ...fakerTeammates] : fakerTeammates

  // CRITICAL D-12: Write teammates, DO NOT stamp meta.seededAt here.
  // The seedAll.ts coordinator stamps after BOTH seeders succeed.
  writeJSON(K.teammates(workspaceId), teammates)
}
```

**Faker generator pattern** (`src/tasks/tasksSeed.ts` lines 68-150 — adapted; no weighted picks needed for teammates):
```ts
function generateTeammates(count: number): Teammate[] {
  const teammates: Teammate[] = Array.from({ length: count }, () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    return {
      id: nanoid(),
      firstName,
      lastName,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      workspaceRole: faker.helpers.arrayElement(['Admin', 'Member', 'Viewer']),  // Owner reserved
      status: 'active',
      lastActiveAt: faker.date.recent({ days: 30 }).toISOString(),
      invitedAt: null,
      avatar: faker.image.avatar(),  // planner discretion — initials fallback also acceptable
    } satisfies Teammate
  })

  // Defensive schema validation — fail loudly per tasksSeed lines 139-148.
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
```

**Critical departure from `tasksSeed.ts`:** This seeder DOES NOT stamp `meta.seededAt`. Per CONTEXT D-12, the stamp moves to `seedAll.ts` so a single stamp gates both seeders.

---

### `src/team/components/TeamTable.tsx` (component, Mantine native `<Table>`)

**Analog:** `src/tasks/components/TaskTable.tsx` (structural columns/cells idiom)
**Important deviation:** UI-SPEC §"Table library" lines 48-49 calls out Mantine's native `<Table>` as the recommended default for Phase 5 (8–12 teammates, no sortable columns required). TanStack is acceptable but not idiomatic for this surface. Pattern below uses Mantine native.

**Imports pattern** (`src/tasks/components/TaskTable.tsx` lines 45-71 + Phase 5-specific imports):
```ts
import { Paper, Table, Avatar, Badge, Text, Group } from '@mantine/core'
import { Select } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { formatRelative } from '../../dashboard/relative-time'
import { computeNowRef } from '../../tasks/now-ref'
import { listTasks } from '../../tasks/tasksRepo'
import type { Teammate, WorkspaceRole } from '../types'
```

**Paper wrap + Table pattern** (`src/tasks/components/TaskTable.tsx` lines 193-251):
```tsx
<Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}
       data-pendo-id={PENDO_IDS.team.table.container}>
  <Table className={classes.teamTable} verticalSpacing={0} horizontalSpacing={0}>
    <Table.Thead>
      <Table.Tr>
        <Table.Th className={classes.cell}><Text size="sm" fw={500} c="dimmed">Name</Text></Table.Th>
        <Table.Th className={classes.cell}><Text size="sm" fw={500} c="dimmed">Email</Text></Table.Th>
        <Table.Th className={classes.cell}><Text size="sm" fw={500} c="dimmed">Role</Text></Table.Th>
        <Table.Th className={classes.cell}><Text size="sm" fw={500} c="dimmed">Last active</Text></Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {orderedTeammates.map((t) => <TeamRow key={t.id} teammate={t} onRoleChange={onRoleChange} nowRef={nowRefIso} />)}
    </Table.Tbody>
  </Table>
</Paper>
```

**Avatar + name + Invited badge cell pattern** (UI-SPEC line 208 + Mantine):
```tsx
<Table.Td className={classes.cell}>
  <Group gap={8}>
    <Avatar size="sm" color="indigo" radius="xl" src={teammate.avatar ?? null}>
      {`${teammate.firstName[0] ?? ''}${teammate.lastName[0] ?? ''}`.toUpperCase()}
    </Avatar>
    <Text size="sm">{teammate.firstName} {teammate.lastName}</Text>
    {teammate.status === 'invited' && (
      <Badge color="yellow" variant="light" size="sm">Invited</Badge>
    )}
  </Group>
</Table.Td>
```

**Inline role-select pattern (D-05 + dynamic-list parameterization)** — based on UI-SPEC Mechanism A:
```tsx
<Select
  value={teammate.workspaceRole}
  data={teammate.workspaceRole === 'Owner'
    ? [{ value: 'Owner', label: 'Owner', disabled: true }]
    : [
        { value: 'Admin',  label: 'Admin'  },
        { value: 'Member', label: 'Member' },
        { value: 'Viewer', label: 'Viewer' },
      ]
  }
  disabled={teammate.workspaceRole === 'Owner'}
  onChange={(value) => onRoleChange(teammate.id, value as WorkspaceRole)}
  pendoId={PENDO_IDS.team.row.roleSelect}
  data-pendo-teammate-id={teammate.id}   // dynamic-list rule (CLAUDE.md)
  size="sm"
  w={140}
  allowDeselect={false}
/>
```

**Last-active cell pattern** (re-uses `src/dashboard/relative-time.ts` `formatRelative` + nowRef from tasks):
```tsx
<Text size="sm" c={teammate.lastActiveAt ? undefined : 'dimmed'}>
  {teammate.lastActiveAt ? formatRelative(teammate.lastActiveAt, nowRefIso) : '—'}
</Text>
```

**Cell padding via CSS module** (`src/tasks/components/TaskTable.tsx` lines 71, 28-30 — pattern note in docblock):
> "Cell padding lives in TaskTable.module.css using Mantine spacing CSS-vars (`var(--mantine-spacing-sm) var(--mantine-spacing-md)`) — no raw px values per UI-SPEC §Spacing."

Phase 5 mirrors: create `src/team/components/TeamTable.module.css` with the same `.cell { padding: var(--mantine-spacing-sm) var(--mantine-spacing-md); }` rule.

---

### `src/team/components/InviteTeammateModal.tsx` (component, RHF + Zod modal)

**Analog:** `src/tasks/components/TaskFormModal.tsx` (entire file)

**Imports pattern** (`src/tasks/components/TaskFormModal.tsx` lines 37-63 — adapted):
```ts
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, Stack, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import { TextInput, Select, Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import { createTeammate, listTeammates, findTeammateByEmail } from '../teamsRepo'
import type { WorkspaceRole } from '../types'
```

**Local-form-schema pattern** (UI-SPEC §RHF + Zod schema line 357 + Phase 4 D-15 idiom — TaskFormSchema lives in `schemas.ts`, but Phase 4 D-15 local-schema precedent applies):
```ts
// Local to this component (mirrors Phase 4 D-15). Includes .superRefine for dedupe per D-03.
const InviteFormSchema = z
  .object({
    email: z.string().min(1, 'Enter an email.').email('Enter a valid email.'),
    workspaceRole: z.enum(['Admin', 'Member', 'Viewer'], { message: 'Pick a role.' }),
  })
  .superRefine((data, ctx) => {
    if (findTeammateByEmail(workspaceId, data.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: `${data.email} is already a teammate.`,
      })
    }
  })

type InviteFormValues = z.infer<typeof InviteFormSchema>
```

**RHF setup pattern** (`src/tasks/components/TaskFormModal.tsx` lines 137-147):
```ts
const form = useForm<InviteFormValues>({
  resolver: zodResolver(InviteFormSchema),
  mode: 'onSubmit',
  defaultValues: { email: '', workspaceRole: 'Member' },
})
```

**Submit handler pattern** (`src/tasks/components/TaskFormModal.tsx` lines 188-210):
```ts
const onSubmit = form.handleSubmit((values) => {
  // D-03: derive firstName from email local-part (split on . or _, Title-Case each segment).
  const localPart = values.email.split('@')[0]
  const firstName = localPart
    .split(/[._]/)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
    .join(' ')

  createTeammate(workspaceId, {
    firstName,
    lastName: '',
    email: values.email.toLowerCase(),
    workspaceRole: values.workspaceRole,
    status: 'invited',
    lastActiveAt: null,
    invitedAt: new Date().toISOString(),
    avatar: null,
  })

  notifications.show({
    title: 'Invite sent',
    message: `Sent to ${values.email}`,
    color: 'green',
    icon: <IconCheck size={18} />,
    autoClose: 3000,
  })

  onSuccess()
  onClose()
})
```

**Modal markup pattern** (`src/tasks/components/TaskFormModal.tsx` lines 269-373):
```tsx
<Modal
  opened={opened}
  onClose={onClose}
  title="Invite teammate"
  size="md"
  centered
  keepMounted={false}
  data-pendo-id={PENDO_IDS.team.invite.modalContainer}
>
  <form onSubmit={onSubmit} noValidate>
    <Stack gap="md">
      <TextInput
        {...form.register('email')}
        label="Email"
        type="email"
        required
        error={form.formState.errors.email?.message}
        pendoId={PENDO_IDS.team.invite.modalEmail}
      />
      <Select
        label="Role"
        data={[
          { value: 'Admin',  label: 'Admin'  },
          { value: 'Member', label: 'Member' },
          { value: 'Viewer', label: 'Viewer' },
        ]}
        value={form.watch('workspaceRole') ?? null}
        onChange={(value) => {
          if (value && ['Admin', 'Member', 'Viewer'].includes(value)) {
            form.setValue('workspaceRole', value as WorkspaceRole, { shouldDirty: true })
          }
        }}
        allowDeselect={false}
        error={form.formState.errors.workspaceRole?.message}
        pendoId={PENDO_IDS.team.invite.modalRole}
      />
    </Stack>
    <Group justify="flex-end" mt="lg" gap="md">
      <Button variant="default" type="button"
              pendoId={PENDO_IDS.team.invite.modalCancel} onClick={onClose}>
        Cancel
      </Button>
      <Button variant="filled" type="submit"
              pendoId={PENDO_IDS.team.invite.modalSubmit}>
        Send invite
      </Button>
    </Group>
  </form>
</Modal>
```

---

### `src/team/components/TeamEmptyState.tsx` (component, hero empty state)

**Analog:** `src/tasks/components/ListsEmptyState.tsx` (entire 52-line file)

**Full markup pattern** (`src/tasks/components/ListsEmptyState.tsx` lines 25-51 — verbatim shape, copy + icon swapped):
```tsx
import { Center, Stack, Title, Text } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { Button } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type TeamEmptyStateProps = {
  workspaceName: string
  onInviteClick: () => void
}

export function TeamEmptyState({
  workspaceName,
  onInviteClick,
}: TeamEmptyStateProps): React.JSX.Element {
  return (
    <Center mih={400} data-pendo-id={PENDO_IDS.team.emptyState.container}>
      <Stack align="center" gap="md">
        <IconUsers size={64} stroke={1.2} color="var(--mantine-color-gray-4)" />
        <Title order={3}>No teammates yet</Title>
        <Text c="dimmed" ta="center" maw={420}>
          Invite your first teammate to start collaborating on {workspaceName}.
        </Text>
        <Button
          variant="filled"
          pendoId={PENDO_IDS.team.emptyState.cta}
          onClick={onInviteClick}
        >
          Invite teammate
        </Button>
      </Stack>
    </Center>
  )
}
```

Spacing tokens (`mih={400}`, `gap="md"`, `maw={420}`, icon `size={64}` `stroke={1.2}`) and structure are locked from the Lists hero state — do not modify.

---

### `src/help/schemas.ts` (schema, static validation)

**Analog:** `src/tasks/schemas.ts` (structurally identical; no localStorage array wrapper since `helpArticles.ts` is a static module — but the schema STILL exists per CONTEXT D-06 so the `.safeParse` in `generateHelpArticles` catches drift).

**Pattern:**
```ts
import { z } from 'zod'

export const HelpArticleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, hyphen-separated'),
  title: z.string().min(1),
  topic: z.string().min(1),                 // free-form per D-06 (NOT an enum — adding topics in v2 must not require a schema migration)
  summary: z.string().min(1),
  body: z.string().min(1),
  keywords: z.array(z.string()),
  updatedAt: z.iso.datetime(),
})

export const HelpArticlesArraySchema = z.array(HelpArticleSchema)
```

No `K.helpArticles()` storage key; `HelpArticlesArraySchema` is only used inside `generateHelpArticles` for defensive `.safeParse` validation (mirrors `tasksSeed.ts` line 139).

---

### `src/help/types.ts` (types, static types)

**Analog:** `src/tasks/types.ts`

**Pattern:**
```ts
import type { z } from 'zod'
import type { HelpArticleSchema } from './schemas'

export type HelpArticle = z.infer<typeof HelpArticleSchema>
```

---

### `src/help/helpArticles.ts` (static-data module, faker.seed pinned)

**Analog:** `src/tasks/tasksSeed.ts` (faker idiom + defensive validation) — but DEPARTS in three ways:
1. No `meta.seededAt` gating (no persistence at all).
2. `faker.seed(N)` IS called (CONTEXT D-09 explicitly requires reload-stability).
3. Module-init synthesis (top-level `const`) rather than `seedIfNeeded(workspaceId)` function.

**Imports pattern** (adapted from `src/tasks/tasksSeed.ts` lines 34-38):
```ts
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { HelpArticlesArraySchema } from './schemas'
import type { HelpArticle } from './types'
```

**Pattern (top-level const + faker.seed pinning per D-09):**
```ts
/**
 * Halo help articles — static module (Phase 5 D-09).
 *
 * faker.seed(N) pins the random state so users see identical articles every
 * reload. No localStorage persistence, no seedIfNeeded gating — this module
 * IS the source of truth for help content. UI-04 polish tradeoff: bodies are
 * lorem-ipsum (D-09 lock from <deferred>).
 */

const HELP_TOPICS = [
  'Getting Started', 'Tasks', 'Settings', 'Team', 'Reports', 'Account & Billing',
] as const  // <discretion> default per UI-SPEC line 799

function generateHelpArticles(): HelpArticle[] {
  faker.seed(42)  // D-09: pin seed for reload-stability
  const now = new Date().toISOString()

  const articles: HelpArticle[] = Array.from({ length: 10 }, () => {  // <discretion>: 8–10
    const title = faker.commerce.productName()
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return {
      id: nanoid(),
      slug,
      title,
      topic: faker.helpers.arrayElement(HELP_TOPICS),
      summary: faker.lorem.sentence(),
      body: faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n'),
      keywords: faker.helpers.arrayElements(
        ['invite', 'role', 'task', 'filter', 'export', 'dashboard', 'theme', 'reset', 'billing'],
        { min: 2, max: 4 },
      ),
      updatedAt: now,
    } satisfies HelpArticle
  })

  // Defensive validation — mirrors tasksSeed.ts lines 139-148.
  const parsed = HelpArticlesArraySchema.safeParse(articles)
  if (!parsed.success) {
    console.error('[halo:helpArticles] Generated articles failed schema validation', parsed.error.issues)
    throw new Error('[halo:helpArticles] Static article array does not match HelpArticlesArraySchema')
  }
  return parsed.data
}

export const HELP_ARTICLES: readonly HelpArticle[] = generateHelpArticles()

export function listHelpArticles(): readonly HelpArticle[] {
  return HELP_ARTICLES
}

export function getHelpArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}
```

---

### `src/help/components/HelpSearchInput.tsx` (component, controlled input)

**Analog:** `src/tasks/components/TaskFiltersBar.tsx` (filter Select pattern — but search uses `TextInput` + Mantine `useDebouncedValue` per D-08).

**Pattern:**
```tsx
import { IconSearch } from '@tabler/icons-react'
import { TextInput } from '../../ui/primitives'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type HelpSearchInputProps = {
  value: string
  onChange: (next: string) => void
}

export function HelpSearchInput({ value, onChange }: HelpSearchInputProps): React.JSX.Element {
  return (
    <TextInput
      placeholder="Search articles"
      leftSection={<IconSearch size={16} />}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      pendoId={PENDO_IDS.help.search}
    />
  )
}
```

The debounce lives in the parent `HelpPage` via `useDebouncedValue(query, 150)` from `@mantine/hooks` (CONTEXT D-08 + UI-SPEC line 49). The search input is a thin controlled wrapper — debounce is a page-level concern.

---

### `src/help/components/HelpList.tsx` (component, grouped list render)

**Analog:** Combined pattern — `src/dashboard/Dashboard.tsx` activity-feed grouping (Phase 3) + `src/tasks/components/TaskTable.tsx` Paper-wrap idiom.

**Pattern (per UI-SPEC lines 399-411):**
```tsx
import { Stack, Text, Anchor as MantineAnchor } from '@mantine/core'
import { Link } from 'react-router'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'
import type { HelpArticle } from '../types'

export type HelpListProps = {
  articles: readonly HelpArticle[]
}

type TopicGroup = { topic: string; articles: HelpArticle[] }

function groupByTopic(articles: readonly HelpArticle[]): TopicGroup[] {
  const map = new Map<string, HelpArticle[]>()
  for (const a of articles) {
    const arr = map.get(a.topic) ?? []
    arr.push(a)
    map.set(a.topic, arr)
  }
  return [...map.entries()].map(([topic, articles]) => ({ topic, articles }))
}

export function HelpList({ articles }: HelpListProps): React.JSX.Element {
  const groups = groupByTopic(articles)
  return (
    <Stack gap="xl">
      {groups.map((group) => (
        <Stack key={group.topic} gap="md">
          <Text size="sm" tt="uppercase" c="dimmed" fw={500}>
            {group.topic}
          </Text>
          <Stack gap="sm">
            {group.articles.map((article) => (
              <MantineAnchor
                key={article.id}
                component={Link}
                to={`/app/help/${article.slug}`}
                underline="hover"
                c="inherit"
                data-pendo-id={PENDO_IDS.help.article.row}
                data-pendo-article-slug={article.slug}   // dynamic-list rule per D-14
              >
                <Stack gap={4}>
                  <Text size="sm" fw={500}>{article.title}</Text>
                  <Text size="sm" c="dimmed">{article.summary}</Text>
                </Stack>
              </MantineAnchor>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
```

Note: Polymorphic `<Anchor component={Link}>` uses raw Mantine `Anchor` (same S3-exception pattern as `FilteredEmptyState.tsx` lines 27-43) — the Halo Anchor wrapper does not currently expose polymorphic typing. `data-pendo-id` flows from `PENDO_IDS.*`; no hand-typed string.

---

### `src/help/components/HelpNoResultsState.tsx` (component, compact empty state)

**Analog:** `src/tasks/components/FilteredEmptyState.tsx` (entire 46-line file — verbatim shape)

**Pattern** (mirrors `src/tasks/components/FilteredEmptyState.tsx` lines 22-44):
```tsx
import { Center, Stack, Text, Anchor as MantineAnchor } from '@mantine/core'
import { PENDO_IDS } from '../../pendo/PENDO_IDS'

export type HelpNoResultsStateProps = {
  query: string
  onClear: () => void
}

export function HelpNoResultsState({ query, onClear }: HelpNoResultsStateProps): React.JSX.Element {
  return (
    <Center py="xl" data-pendo-id={PENDO_IDS.help.noResults.container}>
      <Stack align="center" gap="sm">
        <Text c="dimmed">No articles match &quot;{query}&quot;. Try a different keyword.</Text>
        <MantineAnchor
          component="button"
          type="button"
          size="sm"
          data-pendo-id={PENDO_IDS.help.noResults.clearLink}
          onClick={onClear}
        >
          Clear search
        </MantineAnchor>
      </Stack>
    </Center>
  )
}
```

Inherits the "polymorphic `<Anchor component="button">` needs raw Mantine Anchor with explicit `data-pendo-id`" exception (FilteredEmptyState comment lines 27-32).

---

### `src/routes/app/help/HelpArticlePage.tsx` (NEW route component)

**Analog:** Combined — `src/routes/app/lists/ListsPage.tsx` (composer shape) + new `useParams` + not-found state mirroring `FilteredEmptyState` compact + `ListsEmptyState` hero patterns.

**Pattern:**
```tsx
import { Stack, Title, Text, Center, Anchor as MantineAnchor } from '@mantine/core'
import { Link, useParams } from 'react-router'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import { getHelpArticleBySlug } from '../../../help/helpArticles'

export function HelpArticlePage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getHelpArticleBySlug(slug) : undefined

  if (!article) {
    return (
      <Center mih={400}>
        <Stack align="center" gap="md">
          <Title order={3}>Article not found</Title>
          <Text c="dimmed" ta="center" maw={420}>
            We couldn&apos;t find a help article at this URL. It may have been moved or removed.
          </Text>
          <MantineAnchor
            component={Link}
            to="/app/help"
            data-pendo-id={PENDO_IDS.help.article.detailBackLink}
          >
            ← Back to Help
          </MantineAnchor>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="xl" maw={680}>
      <Stack gap={4}>
        <Text size="sm" c="dimmed">{article.topic}</Text>
        <Title order={3}>{article.title}</Title>
      </Stack>
      <Stack gap="md">
        {article.body.split('\n\n').map((paragraph, i) => (
          <Text key={i} size="md">{paragraph}</Text>
        ))}
      </Stack>
      <MantineAnchor
        component={Link}
        to="/app/help"
        data-pendo-id={PENDO_IDS.help.article.detailBackLink}
      >
        ← Back to Help
      </MantineAnchor>
    </Stack>
  )
}
```

`maw={680}` for readable line length per UI-SPEC line 501. Unicode `←` (`U+2190`) leading character per UI-SPEC line 503 — no Tabler icon.

---

### `src/seed/seedAll.ts` (NEW coordinator)

**Analog:** `src/tasks/tasksSeed.ts` lines 166-188 (idempotency + stamp tail) — recomposed as the OWNER of the stamp.

**Pattern:**
```ts
/**
 * Halo seed coordinator (Phase 5 D-11, D-12).
 *
 * Owns the orchestration of all per-domain seeders + the single `meta.seededAt`
 * stamp. Replaces direct `seedIfNeeded(workspaceId)` calls from AppLayout.
 *
 * Order matters (D-04): teammates first, then tasks (tasksSeed reads
 * K.teammates(workspaceId) to pick assignees from the just-seeded list).
 *
 * Idempotency: short-circuits on `meta.seededAt !== null`. The stamp is
 * written here at the TAIL — moved out of tasksSeed.ts per D-12.
 */

import { K, readWithSchema, writeJSON, MetaSchema, APP_VERSION, SCHEMA_VERSION } from '../storage'
import { seedTeammatesIfNeeded } from '../team/teamSeed'
import { seedIfNeeded as seedTasksIfNeeded } from '../tasks/tasksSeed'

const DEFAULT_META = {
  schemaVersion: SCHEMA_VERSION,
  seededAt: null as string | null,
  appVersion: APP_VERSION,
}

export function seedDemoData(workspaceId: string): void {
  // Primary idempotency gate — single meta.seededAt for both seeders per D-12.
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  if (meta.seededAt !== null) return

  // Order (D-04): teammates BEFORE tasks. tasksSeed reads K.teammates and
  // maps Teammate → Assignee for the assignee field.
  seedTeammatesIfNeeded(workspaceId)
  seedTasksIfNeeded(workspaceId)

  // Stamp ONLY at the tail, after both seeders succeed (D-12). This stamp
  // was previously inside tasksSeed.ts — the surgical edit moves it here.
  writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })
}
```

---

### `src/storage/keys.ts` (MODIFY — additive)

**Analog:** Self — line 50, `tasks: (workspaceId: string)` builder.

**Pattern (additive insertion in the `K` object — between `tasks` and `session` per alphabetical/related grouping):**
```ts
/** `halo:v1:teammates:{workspaceId}` — per-workspace teammate array (Phase 5 D-01).
 *  Pattern mirrors K.tasks; no SCHEMA_VERSION bump because the key is additive. */
teammates: (workspaceId: string): string => `halo:v${SCHEMA_VERSION}:teammates:${workspaceId}`,
```

No other edits to this file. No SCHEMA_VERSION bump (CONTEXT D-01).

---

### `src/tasks/tasksSeed.ts` (MODIFY — surgical, two changes)

**Analog:** Self (existing file). CONTEXT D-04 + D-12 specify two surgical changes:

**Change 1 (D-04 — read teammates before generating tasks):** Modify `generateTasks` to accept a `teammates: Teammate[]` parameter, then pick assignees from that array rather than minting fresh `nanoid` snapshots. Insert a teammate read into `seedIfNeeded` before `generateTasks(count)`:

```ts
// Top of seedIfNeeded, AFTER both gates and BEFORE generateTasks:
const teammates = readWithSchema(
  K.teammates(workspaceId),
  TeammatesArraySchema,
  [],  // defensive fallback per D-04 — should never be empty post-coordinator
)
// Map Teammate → Assignee shape (TaskSchema.AssigneeSchema = {id, name, avatar?}).
const assigneeCandidates: Assignee[] = teammates.length > 0
  ? teammates.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`.trim(),
      ...(t.avatar ? { avatar: t.avatar } : {}),
    }))
  : []  // tasksSeed falls back to minting fresh assignees per defensive fallback

const tasks = generateTasks(count, assigneeCandidates)
```

Inside `generateTasks` (around line 125-129), swap:
```ts
// BEFORE (existing):
assignee: {
  id: nanoid(),
  name: faker.person.fullName(),
  avatar: faker.image.avatar(),
},

// AFTER (D-04):
assignee: assigneeCandidates.length > 0
  ? faker.helpers.arrayElement(assigneeCandidates)
  : { id: nanoid(), name: faker.person.fullName(), avatar: faker.image.avatar() },
```

**Change 2 (D-12 — remove the meta.seededAt stamp from the tail):** Delete lines 167-187's final `writeJSON(K.meta(), { ...meta, seededAt: ... })` call, AND delete the `meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)` read above it. Keep the GATE 1 `if (meta.seededAt !== null) return` check, but re-derive `meta` locally inside that gate:

```ts
// AFTER (D-12 surgical edit):
export function seedIfNeeded(workspaceId: string): void {
  const meta = readWithSchema(K.meta(), MetaSchema, DEFAULT_META)
  if (meta.seededAt !== null) return                          // GATE 1 — read-only check, no stamp write here
  const existing = readWithSchema(K.tasks(workspaceId), TasksArraySchema, [])
  if (existing.length > 0) return                             // GATE 2 — unchanged

  const teammates = readWithSchema(K.teammates(workspaceId), TeammatesArraySchema, [])
  const assigneeCandidates: Assignee[] = /* see Change 1 */

  const count = faker.number.int({ min: 40, max: 60 })
  const tasks = generateTasks(count, assigneeCandidates)
  writeJSON(K.tasks(workspaceId), tasks)
  // DELETED: writeJSON(K.meta(), { ...meta, seededAt: new Date().toISOString() })
}
```

The stamp now lives in `seedAll.ts`.

---

### `src/tasks/assigneeOptions.ts` (MODIFY — one-line source swap)

**Analog:** Self (existing file). CONTEXT D-04 specifies a source swap that does NOT change the function signature.

**Change:** Replace the imports block and the data source — keep dedupe + sort + return shape identical.

```ts
// BEFORE (lines 20):
import { listTasks } from './tasksRepo'

// AFTER:
import { listTeammates } from '../team/teamsRepo'
import type { Teammate } from '../team/types'
```

```ts
// BEFORE (lines 36-39 — read tasks, walk task.assignee):
const byId = new Map<string, Assignee>()
for (const task of listTasks(workspaceId)) {
  byId.set(task.assignee.id, task.assignee)
}

// AFTER (D-04 — read teammates, map to Assignee shape):
const byId = new Map<string, Assignee>()
for (const t of listTeammates(workspaceId)) {
  byId.set(t.id, {
    id: t.id,
    name: `${t.firstName} ${t.lastName}`.trim(),
    ...(t.avatar ? { avatar: t.avatar } : {}),
  })
}
```

The visitor seed line (40-43) STAYS — the visitor's display name on `assigneeOptions` overrides any teammate-table row for self-assignment freshness. Sort + return shape unchanged. Consumers (Lists filter, TaskFormModal Assignee, Reports Assignee filter) need no edits per the existing file-header docblock lines 11-13.

---

### `src/pendo/PENDO_IDS.ts` (MODIFY — additive append)

**Analog:** Self — Phase 4 added `lists`, `settings`, `reports` namespaces (lines 161-251).

**Pattern (append two new namespaces between `reports` and the closing `} as const`):**

```ts
/** Phase 5 Team page targets — D-14. */
team: {
  header: {
    inviteButton: 'team.header.invite-button',
  },
  table: {
    container: 'team.table.container',
  },
  row: {
    // Dynamic-list parameterization: consumers add data-pendo-teammate-id={teammate.id}.
    roleSelect: 'team.row.role-select',
  },
  invite: {
    modalContainer: 'team.invite.modal-container',
    modalEmail:     'team.invite.modal-email',
    modalRole:      'team.invite.modal-role',
    modalCancel:    'team.invite.modal-cancel',
    modalSubmit:    'team.invite.modal-submit',
  },
  emptyState: {
    container: 'team.empty-state.container',
    cta:       'team.empty-state.cta',
  },
},

/** Phase 5 Help page targets — D-14. */
help: {
  search: 'help.search',
  topic: {
    container: 'help.topic.container',
  },
  article: {
    // Dynamic-list parameterization: consumers add data-pendo-article-slug={article.slug}.
    row:             'help.article.row',
    detailBackLink:  'help.article.detail-back-link',
  },
  emptyState: {
    container: 'help.empty-state.container',
  },
  noResults: {
    container: 'help.no-results.container',
    clearLink: 'help.no-results.clear-link',
  },
},
```

Also update the namespace growth-plan docblock (lines 13-19) to add the Phase 5 line — it ALREADY lists `Phase 5: team, help` (lines 18) so no change needed.

`PendoId` type derivation via `Leaves<typeof PENDO_IDS>` (line 22-26) updates automatically — no code change. **No `rc` namespace** (D-10 no-op).

---

### `src/router.tsx` (MODIFY — additive nested child)

**Analog:** Self — lines 84-93 (signup nested children pattern).

**Pattern (transform line 120 to nest a `:slug` child):**

```tsx
// BEFORE (line 120):
{ path: 'help',          Component: HelpPage },

// AFTER (D-07):
{
  path: 'help',
  Component: HelpPage,
  children: [
    { path: ':slug', Component: HelpArticlePage },
  ],
},
```

Add the import at the top of the file (alongside line 55's `HelpPage` import):
```ts
import { HelpArticlePage } from './routes/app/help/HelpArticlePage'
```

Per UI-SPEC line 840, a flat shape (sibling entries) is also acceptable; nested is preferred for semantic guide-targeting consistency. `RequireAuth` is inherited from the `/app` parent route — no guard change.

---

### `src/routes/app/AppLayout.tsx` (MODIFY — one-line swap)

**Analog:** Self — line 81.

**Pattern (CONTEXT D-11):**

```tsx
// BEFORE (line 28 + line 81):
import { seedIfNeeded } from '../../tasks'
// ...
useEffect(() => {
  if (workspace) seedIfNeeded(workspace.id)
}, [workspace?.id])

// AFTER:
import { seedDemoData } from '../../seed/seedAll'
// ...
useEffect(() => {
  if (workspace) seedDemoData(workspace.id)
}, [workspace?.id])
```

No other edits. Do not add help-anchor markup (D-10 no-op).

---

### `src/routes/app/team/TeamPage.tsx` (MODIFY — body replace)

**Analog:** `src/routes/app/lists/ListsPage.tsx` (composer shape — page header + table-or-empty + modal stacking)

**Pattern (composer):**
```tsx
import { useState, useMemo } from 'react'
import { Stack, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconUserPlus, IconCheck } from '@tabler/icons-react'
import { Navigate } from 'react-router'
import { Button } from '../../../ui/primitives'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import { useAuthStore } from '../../../auth/authStore'
import { listTeammates, updateTeammate } from '../../../team/teamsRepo'
import { TeamTable } from '../../../team/components/TeamTable'
import { TeamEmptyState } from '../../../team/components/TeamEmptyState'
import { InviteTeammateModal } from '../../../team/components/InviteTeammateModal'
import type { WorkspaceRole } from '../../../team/types'

export function TeamPage(): React.JSX.Element {
  const visitor = useAuthStore((s) => s.currentVisitor)
  const workspace = useAuthStore((s) => s.currentWorkspace)
  const workspaceId = workspace?.id

  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((k) => k + 1)
  const [inviteOpen, setInviteOpen] = useState(false)

  const teammates = useMemo(
    () => (workspaceId ? listTeammates(workspaceId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, refreshKey],
  )

  // Defensive narrowing — mirrors ListsPage line 100 belt-and-suspenders.
  if (!workspaceId || !visitor || !workspace) return <></>

  const handleRoleChange = (teammateId: string, nextRole: WorkspaceRole) => {
    updateTeammate(workspaceId, teammateId, { workspaceRole: nextRole })
    notifications.show({
      title: 'Role updated',
      message: '',
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 3000,
    })
    refresh()
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={3}>Team</Title>
        {teammates.length > 0 && (
          <Button
            variant="filled"
            leftSection={<IconUserPlus size={16} />}
            pendoId={PENDO_IDS.team.header.inviteButton}
            onClick={() => setInviteOpen(true)}
          >
            Invite teammate
          </Button>
        )}
      </Group>

      {teammates.length === 0 ? (
        <TeamEmptyState
          workspaceName={workspace.companyName}
          onInviteClick={() => setInviteOpen(true)}
        />
      ) : (
        <TeamTable
          teammates={teammates}
          onRoleChange={handleRoleChange}
        />
      )}

      <InviteTeammateModal
        opened={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={refresh}
        workspaceId={workspaceId}
      />
    </Stack>
  )
}
```

---

### `src/routes/app/help/HelpPage.tsx` (MODIFY — body replace)

**Analog:** `src/routes/app/lists/ListsPage.tsx` (composer shape, simplified — no CRUD, just search + render). Uses `Outlet` if planner picks nested route shape, OR renders the list directly if router uses flat siblings.

**Pattern (composer with debounced search):**
```tsx
import { useState, useMemo } from 'react'
import { Stack, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { listHelpArticles } from '../../../help/helpArticles'
import { HelpSearchInput } from '../../../help/components/HelpSearchInput'
import { HelpList } from '../../../help/components/HelpList'
import { HelpNoResultsState } from '../../../help/components/HelpNoResultsState'

export function HelpPage(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 150)  // D-08

  const allArticles = useMemo(() => listHelpArticles(), [])

  const filtered = useMemo(() => {
    if (debouncedQuery.trim() === '') return allArticles
    const needle = debouncedQuery.toLowerCase().trim()
    return allArticles.filter((a) => {
      const haystack = `${a.title} ${a.keywords.join(' ')} ${a.summary}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [allArticles, debouncedQuery])

  return (
    <Stack gap="lg">
      <Title order={3}>Help</Title>
      <HelpSearchInput value={query} onChange={setQuery} />
      {filtered.length === 0
        ? <HelpNoResultsState query={debouncedQuery} onClear={() => setQuery('')} />
        : <HelpList articles={filtered} />
      }
    </Stack>
  )
}
```

Note on nested-route rendering: If `router.tsx` uses the nested-child shape (D-07 preferred), `HelpArticlePage` is rendered as a SIBLING via the matched route — NOT inside `HelpPage`'s body (no `<Outlet />` needed because the child REPLACES the parent's element under React Router v7's default child-route resolution when `path: ':slug'` matches). Validate this at planning time; if behavior shows the list rendering above the detail, flatten the routes (UI-SPEC line 840 acknowledges either shape is valid).

---

## Shared Patterns

### Pattern A — PENDO_IDS registry as the only `data-pendo-id` source

**Source:** `src/pendo/PENDO_IDS.ts` (lines 1-12 docblock)
**Apply to:** Every interactive element in Phase 5 (Team Page, Invite modal, Help page, Help detail, Help search input)

**Rule:** No hand-typed `data-pendo-id` strings. Every wrapper consumes `pendoId={PENDO_IDS.<namespace>.<key>}`; every raw-Mantine escape (polymorphic Anchor, Modal container, Menu.Item, Table container) writes `data-pendo-id={PENDO_IDS.<namespace>.<key>}` — value still flows from the registry, no string literal.

**Excerpt** (`src/ui/primitives/Button.tsx` lines 29-31):
```tsx
export function Button({ pendoId, ...rest }: ButtonProps) {
  return <MantineButton data-pendo-id={pendoId} {...rest} />
}
```

---

### Pattern B — Dynamic-list parameterization (CLAUDE.md)

**Source:** `src/tasks/components/TaskTable.tsx` lines 112-118 (Checkbox `taskId` prop), lines 273-274 (kebab `data-pendo-task-id` direct DOM attr)
**Apply to:** Team row role-select, Help article rows

**Rule:** Repeated list-row elements carry BOTH `data-pendo-id={PENDO_IDS.<static-key>}` AND a dynamic per-row attribute (`data-pendo-teammate-id={teammate.id}` for Team rows, `data-pendo-article-slug={article.slug}` for Help rows). The static ID is for guide targeting "any row"; the dynamic attribute is for Session Replay per-row attribution.

**Excerpt** (`src/tasks/components/TaskTable.tsx` lines 270-278):
```tsx
<ActionIcon
  variant="subtle"
  color="gray"
  data-pendo-id={PENDO_IDS.lists.row.kebab}
  data-pendo-task-id={task.id}                  // <-- dynamic-list rule
  aria-label={`Actions for "${task.title}"`}
>
```

---

### Pattern C — Storage envelope (FND-04)

**Source:** `src/storage/codec.ts` (entire 77-line file)
**Apply to:** `teamsRepo` (every read goes through `readWithSchema`), `teamSeed` (read meta + read teammates defensively + write via `writeJSON`)

**Rule:** Direct `localStorage.*` calls are forbidden outside `src/storage/codec.ts`. The sole sanctioned exception in the codebase is `src/settings/ResetDemoDataModal.tsx` (documented exception for prefix-scan wipe).

**Excerpt** (`src/storage/codec.ts` lines 26-36):
```ts
export function readWithSchema<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}
```

---

### Pattern D — Toast notifications (`@mantine/notifications`)

**Source:** `src/tasks/components/TaskFormModal.tsx` lines 191-197 (create-task toast) + `src/routes/app/lists/ListsPage.tsx` lines 191-197 (delete-task toast)
**Apply to:** Invite teammate (`InviteTeammateModal.onSubmit`), Role updated (`TeamPage.handleRoleChange`)

**Excerpt** (`src/tasks/components/TaskFormModal.tsx` lines 191-197):
```ts
notifications.show({
  title: 'Task created',
  message: '',
  color: 'green',
  icon: <IconCheck size={18} />,
  autoClose: 3000,
})
```

Phase 5 mirrors with `title: 'Invite sent', message: \`Sent to ${email}\``  and `title: 'Role updated', message: ''`.

---

### Pattern E — RHF + Zod `mode: 'onSubmit'` (Phase 2 lock)

**Source:** `src/tasks/components/TaskFormModal.tsx` lines 137-147 + Phase 2 signup forms
**Apply to:** `InviteTeammateModal`

**Rule:**
- Resolver: `zodResolver(LocalFormSchema)` (Phase 4 D-15 local-schema pattern).
- Mode: `'onSubmit'`.
- Surface errors via Mantine `error={form.formState.errors.<field>?.message}` after first submit attempt.

**Excerpt** (`src/tasks/components/TaskFormModal.tsx` lines 137-147):
```ts
const form = useForm<TaskFormValues>({
  resolver: zodResolver(TaskFormSchema),
  mode: 'onSubmit',
  values: defaultValues,
})
```

---

### Pattern F — Refresh ticker (post-mutation re-read)

**Source:** `src/routes/app/lists/ListsPage.tsx` lines 65-77
**Apply to:** `TeamPage` (after invite create or role update, bump refreshKey → table re-reads via `useMemo`)

**Excerpt** (`src/routes/app/lists/ListsPage.tsx` lines 65-77):
```ts
const [refreshKey, setRefreshKey] = useState(0)
const refresh = () => setRefreshKey((k) => k + 1)

const allTasks = useMemo(
  () => (workspaceId ? listTasks(workspaceId) : []),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [workspaceId, refreshKey],
)
```

---

### Pattern G — Defensive narrowing for `currentVisitor` / `currentWorkspace`

**Source:** `src/routes/app/lists/ListsPage.tsx` line 100 + `src/routes/app/AppLayout.tsx` line 88
**Apply to:** `TeamPage`, `HelpPage`, `HelpArticlePage`

**Excerpt** (`src/routes/app/lists/ListsPage.tsx` line 100):
```ts
// Defensive narrowing — RequireAuth + AppLayout already gate this, but
// mirror Dashboard.tsx line 288's belt-and-suspenders pattern.
if (!workspaceId || !visitor || !workspace) return <></>
```

HelpPage and HelpArticlePage do NOT require visitor/workspace narrowing (help content is workspace-agnostic) — only TeamPage needs this.

---

### Pattern H — Per-feature module barrel exports

**Source:** `src/tasks/index.ts` (entire 21-line file)
**Apply to:** `src/team/index.ts` (NEW), optionally `src/help/index.ts`

**Excerpt** (`src/tasks/index.ts`):
```ts
export * from './schemas'
export * from './types'
export * from './tasksRepo'
export { seedIfNeeded } from './tasksSeed'
```

Phase 5 mirror for `src/team/index.ts`:
```ts
export * from './schemas'
export * from './types'
export * from './teamsRepo'
export { seedTeammatesIfNeeded } from './teamSeed'
```

---

### Pattern I — Idempotency gates (D-04 from tasksSeed)

**Source:** `src/tasks/tasksSeed.ts` lines 166-178 (two-gate pattern)
**Apply to:** `teamSeed.seedTeammatesIfNeeded`, `seedAll.seedDemoData`

**Rule:**
1. GATE 1: `if (meta.seededAt !== null) return` — primary authoritative gate.
2. GATE 2: `if (listX(workspaceId).length > 0) return` — defensive guard against external writes that bypassed the meta stamp.

The coordinator (`seedAll.ts`) uses only GATE 1 (it's not the writer of any single key — it just orchestrates).

---

## No Analog Found

| File | Role | Data Flow | Reason / Resolution |
|------|------|-----------|---------------------|
| `src/help/helpArticles.ts` | static-data module | module-init synthesis (no localStorage) | No prior "module-init static synthesized data" file exists in the codebase. `tasksSeed.ts` provides the faker idiom + defensive `.safeParse` validation, but every other faker consumer goes through `K.*` + `writeJSON`. Phase 5 establishes the pattern (see §"`src/help/helpArticles.ts`" above): top-level `export const HELP_ARTICLES = generateHelpArticles()` with `faker.seed(N)` pinning per D-09. |

(Otherwise: 19 / 20 files have a strong analog in the existing codebase.)

---

## Metadata

**Analog search scope:** `src/tasks/**`, `src/auth/**`, `src/storage/**`, `src/dashboard/**`, `src/routes/app/**`, `src/ui/primitives/**`, `src/pendo/**`, `src/settings/**`
**Files scanned:** ~80 source files
**Files read in full or in part for pattern extraction:** 21
**Pattern extraction date:** 2026-05-15
