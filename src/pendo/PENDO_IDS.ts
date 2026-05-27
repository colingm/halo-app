/**
 * This is the ONLY source of `data-pendo-id` string values in the codebase.
 *
 * UI primitive wrappers (src/ui/primitives/*) accept `pendoId: PendoId` and
 * forward it as `data-pendo-id` to the DOM. Page-level code MUST reference
 * `PENDO_IDS.<namespace>.<id>` — never hand-type a string literal
 * `data-pendo-id` value.
 *
 * Phase 6's Pendo agent attaches to these attributes for guide targeting,
 * feature tagging, and track events. See docs/CONVENTIONS.md for the full
 * markup convention rules (PEN-07).
 *
 * Namespace growth plan:
 *   Phase 1: `layout`, `sandbox`
 *   Phase 2 (landed): `signup`, `signin`
 *   Phase 3: `nav`, `topbar`, `dashboard`, `comingSoon`
 *   Phase 4: `lists`, `settings`, `reports`
 *   Phase 5: `team`, `help`
 */

/** Derives a union of every leaf string value from a nested `as const` object. */
type Leaves<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? Leaves<T[keyof T]>
    : never

export const PENDO_IDS = {
  /** Phase 1 layout-level markers (PublicLayout + AppLayout). */
  layout: {
    publicDemoBanner: 'layout.public.demo-banner',
    publicLanding: 'layout.public.landing',
  },

  /**
   * Phase 1 sandbox smoke-render markers.
   * Used only by src/routes/public/PrimitivesSandbox.tsx — one per primitive
   * so the forwarding contract is end-to-end verifiable in DevTools.
   */
  sandbox: {
    primaryButton: 'sandbox.primary-button',
    emailInput: 'sandbox.email-input',
    passwordInput: 'sandbox.password-input',
    signupAnchor: 'sandbox.signup-anchor',
  },

  /**
   * Phase 2 signup wizard markers (four-URL flow + stepper).
   * Step labels in the registry are `step1`..`step4` so the registry
   * structure mirrors the wizard's narrative order regardless of the URL
   * slug (`/signup`, `/signup/details`, `/signup/company`, `/signup/preferences`).
   * `signup.step4.submit` is the funnel-conversion target for Phase 6.
   */
  signup: {
    /** Step 1: Account (/signup) */
    step1: {
      email: 'signup.step1.email',
      password: 'signup.step1.password',
      firstName: 'signup.step1.first-name',
      lastName: 'signup.step1.last-name',
      username: 'signup.step1.username',
      submit: 'signup.step1.submit',
      signinAnchor: 'signup.step1.signin-anchor',
    },
    /** Step 2: About you (/signup/details) */
    step2: {
      jobTitle: 'signup.step2.job-title',
      role: 'signup.step2.role',
      yearsExperience: 'signup.step2.years-experience',
      location: 'signup.step2.location',
      back: 'signup.step2.back',
      submit: 'signup.step2.submit',
    },
    /** Step 3: Company (/signup/company) */
    step3: {
      companyName: 'signup.step3.company-name',
      companySize: 'signup.step3.company-size',
      industry: 'signup.step3.industry',
      planTier: 'signup.step3.plan-tier',
      back: 'signup.step3.back',
      submit: 'signup.step3.submit',
    },
    /** Step 4: Setup (/signup/preferences) — final step, funnel conversion target. */
    step4: {
      useCase: 'signup.step4.use-case',
      teamSize: 'signup.step4.team-size',
      goals: 'signup.step4.goals',
      back: 'signup.step4.back',
      submit: 'signup.step4.submit',
    },
    /**
     * The wizard <Stepper> container. Sub-targeting individual step circles
     * is done via Mantine's aria-* attributes, not per-step data-pendo-id —
     * stepper internals re-render on navigation and should not carry IDs.
     */
    stepper: 'signup.stepper',
  },

  /**
   * Phase 2 sign-in markers (/signin).
   * `signin.submit` is the funnel-conversion target for Phase 6.
   */
  signin: {
    email: 'signin.email',
    password: 'signin.password',
    submit: 'signin.submit',
    signupAnchor: 'signin.signup-anchor',
  },

  /** Phase 3 side-nav targets. */
  nav: {
    dashboard: 'nav.dashboard',
    lists:     'nav.lists',
    reports:   'nav.reports',
    team:      'nav.team',
    settings:  'nav.settings',
    help:      'nav.help',
    about:     'nav.about',
  },

  /** Phase 3 top-bar + user-menu targets. */
  topbar: {
    logo:          'topbar.logo',
    workspaceName: 'topbar.workspace-name',
    userMenu: {
      button:   'topbar.user-menu.button',
      profile:  'topbar.user-menu.profile',
      settings: 'topbar.user-menu.settings',
      signout:  'topbar.user-menu.sign-out',
    },
  },

  /** Phase 3 dashboard widget targets (KPIs, charts, activity, empty state). */
  dashboard: {
    timeRange: 'dashboard.time-range',
    kpi: {
      active:           'dashboard.kpi.active',
      completedInRange: 'dashboard.kpi.completed-in-range',
      overdue:          'dashboard.kpi.overdue',
      completionRate:   'dashboard.kpi.completion-rate',
      avgCycleTime:     'dashboard.kpi.avg-cycle-time',
    },
    chart: {
      completedPerDay: 'dashboard.chart.completed-per-day',
      byStatus:        'dashboard.chart.by-status',
    },
    activity: {
      container: 'dashboard.activity.container',
      item:      'dashboard.activity.item',
    },
    emptyState: {
      container: 'dashboard.empty-state.container',
      cta:       'dashboard.empty-state.cta',
    },
  },

  /** Phase 3 shared placeholder-card target — single ID across all five placeholder routes. */
  comingSoon: {
    card: 'coming-soon.card',
  },

  /** Phase 4 Lists page targets (task table + filters + modals + empty states + row-level dynamic IDs). */
  lists: {
    newTaskButton: 'lists.new-task-button',
    filter: {
      bar:      'lists.filter.bar',
      status:   'lists.filter.status',
      priority: 'lists.filter.priority',
      assignee: 'lists.filter.assignee',
    },
    row: {
      completeToggle: 'lists.row.complete-toggle',
      kebab:          'lists.row.kebab',
      kebabEdit:      'lists.row.kebab-edit',
      kebabDelete:    'lists.row.kebab-delete',
    },
    modal: {
      container:   'lists.modal.container',
      title:       'lists.modal.title',
      description: 'lists.modal.description',
      status:      'lists.modal.status',
      priority:    'lists.modal.priority',
      assignee:    'lists.modal.assignee',
      dueDate:     'lists.modal.due-date',
      cancel:      'lists.modal.cancel',
      save:        'lists.modal.save',
      delete:      'lists.modal.delete',
    },
    deleteConfirm: {
      cancel:  'lists.delete-confirm.cancel',
      confirm: 'lists.delete-confirm.confirm',
    },
    emptyState: {
      container: 'lists.empty-state.container',
      cta:       'lists.empty-state.cta',
    },
    filteredEmpty: {
      container: 'lists.filtered-empty.container',
      clearLink: 'lists.filtered-empty.clear-link',
    },
  },

  /** Phase 4 Settings page targets (three tabs + profile/workspace forms + theme toggle + danger zone). */
  settings: {
    tabs: {
      profile:     'settings.tabs.profile',
      workspace:   'settings.tabs.workspace',
      preferences: 'settings.tabs.preferences',
    },
    profile: {
      firstName: 'settings.profile.first-name',
      lastName:  'settings.profile.last-name',
      username:  'settings.profile.username',
      jobTitle:  'settings.profile.job-title',
      role:      'settings.profile.role',
      location:  'settings.profile.location',
      save:      'settings.profile.save',
      cancel:    'settings.profile.cancel',
    },
    workspace: {
      companyName: 'settings.workspace.company-name',
      companySize: 'settings.workspace.company-size',
      industry:    'settings.workspace.industry',
      planTier:    'settings.workspace.plan-tier',
      save:        'settings.workspace.save',
      cancel:      'settings.workspace.cancel',
    },
    preferences: {
      themeToggle: 'settings.preferences.theme-toggle',
    },
    dangerZone: {
      button:        'settings.danger-zone.button',
      confirmCancel: 'settings.danger-zone.confirm-cancel',
      confirmButton: 'settings.danger-zone.confirm-button',
    },
  },

  /** Phase 4 Reports page targets (filter bar + stacked-bar chart + read-only table + CSV export). */
  reports: {
    filter: {
      dateRange: 'reports.filter.date-range',
      assignee:  'reports.filter.assignee',
      status:    'reports.filter.status',
    },
    chart: {
      statusByDay: 'reports.chart.status-by-day',
    },
    table: {
      container: 'reports.table.container',
    },
    csvExport: 'reports.csv-export',
  },

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

  /** About page targets — nav link + feedback form. */
  about: {
    container: 'about.container',
    feedback: {
      category: 'about.feedback.category',
      subject:  'about.feedback.subject',
      message:  'about.feedback.message',
      submit:   'about.feedback.submit',
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
      row:            'help.article.row',
      detailBackLink: 'help.article.detail-back-link',
    },
    emptyState: {
      container: 'help.empty-state.container',
    },
    noResults: {
      container: 'help.no-results.container',
      clearLink: 'help.no-results.clear-link',
    },
  },
} as const

/**
 * Union of every leaf string value in PENDO_IDS.
 * UI primitive `pendoId` props are typed as `PendoId` — TypeScript will flag
 * any hand-typed string that isn't in the registry.
 */
export type PendoId = Leaves<typeof PENDO_IDS>
