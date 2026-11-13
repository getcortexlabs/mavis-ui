import { adapters } from './adapters.mjs'
import { macosCapabilities } from './macos-capabilities.generated.mjs'

/** Shape of `--capabilities --json`, for tools that read it. */
export const catalogVersion = 1
/** Version of mavis.config.json this creator writes. Older ones are migrated when read. */
export const schemaVersion = 2

/** Baseline pins; coordinated releases update Mavis after validating source templates with matching tarballs. */
export const versions = Object.freeze({
  mavis: '0.1.0-rc.13',
  jolt: '0.1.0-rc.15',
  vue: '3.5.44',
  nuxt: '4.6.3',
  vite: '6.4.5',
  vuePlugin: '5.2.4',
  typescript: '6.0.3',
  nodeTypes: '26.6.6',
  vueTsc: '3.3.13',
  nativeCore: '9.1.3',
  nativeVue: '3.1.3',
  android: '9.1.1',
  ios: '9.1.0',
  webpack: '5.0.39',
  webpackCore: '5.112.2',
  webpackCli: '6.0.1',
  router: '4.6.4',
  nativeRouter: '0.1.0-rc.4',
})

/** Tools a project needs. The creator and doctor check against these, not their own numbers. */
export const requirements = Object.freeze({
  node: '22.16',
  packageManagers: Object.freeze({ npm: null, pnpm: '10.26', yarn: null }),
  native: 'the NativeScript CLI, a JDK and the Android SDK; macOS and Xcode for iOS',
  macos: 'macOS 14+ and Xcode',
})

const issueOf = (id) => adapters.planned.find((adapter) => adapter.id === id)?.issue
const planned = (issue, label) => Object.freeze({ label, status: 'planned', issue })

/**
 * Everything a project can be made of. `status` is validated, experimental or planned;
 * `since` is the first published creator with it, or null while it only exists in the
 * repository. Frameworks and hosts that are not built yet come from Mavis core's capabilities.
 */
export const catalog = Object.freeze({
  targets: Object.freeze({
    web: {
      label: 'Web',
      hint: 'Vue in the browser',
      toolkit: 'mavis-web',
      adapter: 'vue-web',
      status: 'validated',
    },
    native: {
      label: 'Native',
      hint: 'iOS and Android apps with NativeScript',
      toolkit: 'nativescript',
      adapter: 'vue-nativescript',
      platforms: ['ios', 'android'],
      status: 'validated',
    },
    macos: {
      label: 'Mac',
      hint: 'A SwiftUI app · shared Vue or TSX (experimental)',
      toolkit: 'swiftui',
      adapter: 'macos-swiftui',
      status: 'experimental',
    },
  }),
  frameworks: Object.freeze({
    vue: { label: 'Vue', status: 'validated' },
    react: planned(issueOf('react-web'), 'React'),
    angular: planned(issueOf('angular-web'), 'Angular'),
    svelte: planned(issueOf('svelte-web'), 'Svelte'),
    solid: planned(issueOf('solid-web'), 'Solid'),
  }),
  // How screens are written, and what runs: the components directly, or code generated from them.
  authoring: Object.freeze({
    vue: { label: 'Vue templates', mode: 'direct', execution: 'components', status: 'validated' },
    mitosis: {
      label: 'Shared TSX',
      mode: 'portable',
      execution: 'generated',
      status: 'experimental',
    },
    jsx: planned(167, 'React-style JSX compiled for Vue'),
  }),
  execution: Object.freeze({
    components: { label: 'Mavis components in the app', status: 'validated' },
    generated: { label: 'Code generated for each target', status: 'experimental' },
    sdui: planned(173, 'Screens delivered as data'),
  }),
  hosts: Object.freeze({
    vite: {
      label: 'Vue + Vite',
      hint: 'A client-side app, ready to build on',
      rendering: ['client'],
      status: 'validated',
    },
    nuxt: {
      label: 'Nuxt',
      hint: 'Server rendering or a static website',
      rendering: ['ssr', 'ssg'],
      status: 'validated',
      portableSince: null,
    },
    next: planned(issueOf('next'), 'Next.js'),
  }),
  rendering: Object.freeze({
    client: { label: 'Client rendering' },
    ssr: { label: 'Server rendering', hint: 'Render pages on each request' },
    ssg: { label: 'Static generation', hint: 'Build pages ahead of time' },
  }),
  examples: Object.freeze({
    welcome: {
      label: 'Basic project',
      hint: 'One shared screen to build on',
      authoring: ['vue', 'mitosis'],
      since: '0.1.0-alpha.6',
    },
    directory: {
      label: 'Search, details and editing',
      hint: 'Shared routes, forms and local persistence',
      authoring: ['vue'],
      portableAuthoring: 'vue',
      portableSince: null,
      since: '0.1.0-alpha.9',
    },
    tasks: {
      label: 'Tasks',
      hint: 'List and detail, forms, shortcuts and motion from one source',
      authoring: ['mitosis'],
      since: '0.1.0-rc.13',
    },
  }),
  themes: Object.freeze({
    mavis: { label: 'Mavis', hint: 'Light, warm and soft' },
    midnight: { label: 'Midnight', hint: 'Dark, calm and crisp' },
  }),
  packageManagers: Object.freeze(['npm', 'pnpm', 'yarn']),
  // What a developer already knows. It only shapes the recommendation, never what runs.
  familiar: Object.freeze(['vue', 'react', 'angular', 'svelte', 'solid', 'other']),
})

/** The combinations of targets the creator scaffolds, and how each has been validated. */
export const combinations = Object.freeze([
  { targets: ['web'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
  { targets: ['native'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
  { targets: ['web', 'native'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
  { targets: ['macos'], authoring: 'mitosis', status: 'experimental', since: '0.1.0-rc.13' },
  {
    targets: ['web', 'macos'],
    authoring: 'mitosis',
    status: 'experimental',
    since: '0.1.0-rc.12.2',
  },
  {
    targets: ['native', 'macos'],
    authoring: 'mitosis',
    status: 'experimental',
    since: '0.1.0-rc.13',
  },
  {
    targets: ['web', 'native', 'macos'],
    authoring: 'mitosis',
    status: 'experimental',
    since: '0.1.0-rc.13',
  },
])

export const targetNames = Object.freeze(Object.keys(catalog.targets))

// --target values from earlier versions; macos was the Web + Mac starter.
const legacyTargets = Object.freeze({
  web: ['web'],
  mobile: ['native'],
  both: ['web', 'native'],
  macos: ['web', 'macos'],
})

/** A choice that cannot be created, with what to do instead. Nothing is written when it is thrown. */
export class ProjectError extends Error {
  constructor(problem) {
    super(
      [
        problem.message,
        ...(problem.issue
          ? [`Tracked in https://github.com/getcortexlabs/mavis-ui/issues/${problem.issue}.`]
          : []),
        ...(problem.alternatives?.length ? [`Available: ${problem.alternatives.join(', ')}.`] : []),
      ].join('\n'),
    )
    this.name = 'ProjectError'
    this.problem = Object.freeze({ ...problem })
  }
}
const reject = (problem) => {
  throw new ProjectError(problem)
}
const available = (family) =>
  Object.entries(family)
    .filter(([, entry]) => entry.status !== 'planned')
    .map(([name]) => name)

export function validateProjectName(name) {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(name ?? ''))
    return 'Use a project name of 1–64 lowercase letters, numbers or hyphens, starting with a letter.'
}

export function parseTargets(value) {
  const list = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
  const unknown = list.filter((name) => !targetNames.includes(name))
  if (unknown.length || !list.length)
    reject({
      code: 'unknown',
      option: '--targets',
      message: `Targets are a comma-separated list of web, native and macos, for example --targets web,native,macos.`,
    })
  return targetNames.filter((name) => list.includes(name))
}

/** Targets of a project's mavis.config.json, schema 2 or the schema 1 target field. */
export function projectTargets(config) {
  if (Array.isArray(config.targets)) return parseTargets(config.targets)
  const legacy = legacyTargets[config.target]
  if (!legacy) throw new Error('mavis.config.json has no valid targets.')
  return [...legacy]
}

// The scaffold each combination uses. Combinations with Mac share TSX sources.
export function layoutOf(targets) {
  if (targets.includes('macos')) return 'macos'
  if (targets.length === 2) return 'both'
  return targets[0] === 'native' ? 'mobile' : 'web'
}

export function targetLabel(targets) {
  return targets.map((name) => catalog.targets[name].label).join(' + ')
}

/** The targets an options object asks for: --targets, the older --target, or Web. */
export function chosenTargets(options) {
  if (options.targets !== undefined) return parseTargets(options.targets)
  return [...(legacyTargets[options.target ?? 'web'] ?? [])]
}

/** Published and validated, published as an experiment, or only in the repository so far. */
export function availabilityOf({ targets, example, web }) {
  const combination = combinations.find((entry) => entry.targets.join() === targets.join())
  if (
    combination.since === null ||
    catalog.examples[example].since === null ||
    (targets.includes('macos') && catalog.examples[example].portableSince === null) ||
    (targets.includes('macos') && web && catalog.hosts[web]?.portableSince === null)
  )
    return 'repository'
  return combination.status === 'validated' ? 'published' : 'published-experimental'
}
const availabilityLabels = {
  published: 'published and validated',
  'published-experimental': 'published, experimental',
  repository: 'in the repository; ships with the next release',
}
export const availabilityLabel = (availability) => availabilityLabels[availability]

// One entry per target: what renders it and how. Vue runs the Web and Native apps today.
function appsOf({ targets, framework, web, rendering }) {
  return Object.fromEntries(
    targets.map((target) => {
      const { toolkit, platforms } = catalog.targets[target]
      if (target === 'web') return [target, { toolkit, framework, host: web, rendering }]
      if (target === 'native') return [target, { toolkit, framework, platforms: [...platforms] }]
      return [target, { toolkit, framework: null }]
    }),
  )
}

/**
 * Checks a set of choices against the catalog and returns the project to create. Choices are
 * never changed to make them fit: what cannot be created is rejected with the reason, the
 * issue that tracks it when it is planned, and what is available instead.
 */
export function resolvePreset(options) {
  let targets
  if (options.targets !== undefined) {
    targets = parseTargets(options.targets)
    if (options.target !== undefined && legacyTargets[options.target]?.join() !== targets.join())
      reject({
        code: 'conflict',
        option: '--target',
        message: 'Use either --target or --targets, not both with different values.',
      })
  } else {
    if (options.target !== undefined && !legacyTargets[options.target])
      reject({
        code: 'unknown',
        option: '--target',
        message: 'Target must be mobile, web, both or macos; or use --targets web,native,macos.',
      })
    targets = [...legacyTargets[options.target ?? 'web']]
  }
  const target = layoutOf(targets)
  const mac = target === 'macos'
  const {
    name,
    web = 'vite',
    rendering = web === 'nuxt' ? 'ssr' : 'client',
    theme = 'mavis',
    framework = 'vue',
    authoring = mac && options.example !== 'directory' ? 'mitosis' : 'vue',
    example = 'welcome',
    packageManager = 'npm',
    familiar,
  } = options
  const invalidName = validateProjectName(name)
  if (invalidName) reject({ code: 'invalid', option: 'name', message: invalidName })
  if (!catalog.packageManagers.includes(packageManager))
    reject({
      code: 'unknown',
      option: '--package-manager',
      message: 'Package manager must be npm, pnpm or yarn.',
    })
  if (!catalog.examples[example])
    reject({
      code: 'unknown',
      option: '--example',
      message: 'Example must be welcome, directory or tasks.',
    })
  if (familiar !== undefined && !catalog.familiar.includes(familiar))
    reject({
      code: 'unknown',
      option: '--familiar',
      message: `--familiar is one of ${catalog.familiar.join(', ')}. It only shapes the recommendation.`,
    })
  if (framework !== 'vue')
    reject({
      code: catalog.frameworks[framework] ? 'planned' : 'unknown',
      option: '--framework',
      message:
        'This creator currently supports Vue. Other framework adapters are tracked in Mavis #145 and #35–39.',
      issue: catalog.frameworks[framework]?.issue,
      alternatives: available(catalog.frameworks).map((name) => `--framework ${name}`),
    })
  if (!catalog.themes[theme])
    reject({ code: 'unknown', option: '--theme', message: 'Theme must be mavis or midnight.' })
  const hasWeb = targets.includes('web')
  const describe = (preset) =>
    Object.freeze({
      ...preset,
      availability: availabilityOf(preset),
    })
  if (!catalog.hosts[web] || catalog.hosts[web].status === 'planned')
    reject({
      code: catalog.hosts[web] ? 'planned' : 'unknown',
      option: '--web',
      message: 'Web host must be vite or nuxt. React/Next are not available yet.',
      issue: catalog.hosts[web]?.issue,
      alternatives: available(catalog.hosts).map((host) => `--web ${host}`),
    })
  if (!hasWeb && (web !== 'vite' || rendering !== 'client'))
    reject({
      code: 'incompatible',
      option: web !== 'vite' ? '--web' : '--rendering',
      message: 'A project without Web has no Web rendering mode.',
      alternatives: [`--targets web,${targets.join(',')}`],
    })
  if (!catalog.hosts[web].rendering.includes(rendering))
    reject({
      code: 'incompatible',
      option: '--rendering',
      message: 'Choose client rendering for Vite or ssr/ssg for Nuxt.',
      alternatives: catalog.hosts[web].rendering.map((mode) => `--rendering ${mode}`),
    })
  if (mac) {
    const portableAuthoring = catalog.examples[example].portableAuthoring ?? 'mitosis'
    if (authoring !== portableAuthoring)
      reject({
        code: 'incompatible',
        option: '--authoring',
        message: `With Mac, ${example} uses ${portableAuthoring === 'vue' ? 'shared Vue screens compiled to SwiftUI' : 'shared TSX sources compiled for every target'}. Choose --example directory for shared Vue.`,
        alternatives: [
          `--authoring ${portableAuthoring}`,
          `--targets ${targets.filter((t) => t !== 'macos').join(',') || 'web'}`,
        ],
      })
    if (!catalog.examples[example].authoring.includes(portableAuthoring))
      reject({
        code: 'incompatible',
        option: '--example',
        message: `The ${example} example does not provide shared ${portableAuthoring} sources for Mac.`,
        alternatives: ['--example welcome', '--example directory', '--example tasks'],
      })
    return describe({
      schemaVersion,
      name,
      targets,
      target,
      apps: appsOf({
        targets,
        framework,
        web: hasWeb ? web : null,
        rendering: hasWeb ? rendering : null,
      }),
      framework,
      authoring,
      mode: 'portable',
      execution: 'generated',
      example,
      web: hasWeb ? web : null,
      rendering: hasWeb ? rendering : null,
      theme,
      packageManager,
      ...(familiar ? { familiar } : {}),
      experimental: 'shared-tsx',
      versions,
    })
  }
  if (authoring === 'mitosis')
    reject({
      code: 'incompatible',
      option: '--authoring',
      message:
        'Shared TSX sources come with the Mac target (--targets web,native,macos). Without Mac, use Vue templates.',
      alternatives: ['--authoring vue', `--targets ${[...targets, 'macos'].join(',')}`],
    })
  if (!catalog.examples[example].authoring.includes('vue'))
    reject({
      code: 'incompatible',
      option: '--example',
      message:
        'The tasks example is written as shared TSX and comes with the Mac target, for example --targets web,native,macos --example tasks.',
      alternatives: [
        '--example welcome',
        '--example directory',
        `--targets ${[...targets, 'macos'].join(',')}`,
      ],
    })
  if (authoring !== 'vue')
    reject({
      code: catalog.authoring[authoring] ? 'planned' : 'unknown',
      option: '--authoring',
      message:
        'Portable JSX/React-style authoring for Vue is planned in Mavis #167; use Vue templates in this version.',
      issue: catalog.authoring.jsx.issue,
      alternatives: ['--authoring vue'],
    })
  return describe({
    schemaVersion,
    name,
    targets,
    target,
    apps: appsOf({
      targets,
      framework,
      web: hasWeb ? web : null,
      rendering: hasWeb ? rendering : null,
    }),
    framework,
    authoring,
    mode: catalog.authoring[authoring].mode,
    execution: catalog.authoring[authoring].execution,
    example,
    web: hasWeb ? web : null,
    rendering: hasWeb ? rendering : null,
    theme,
    packageManager,
    ...(familiar ? { familiar } : {}),
    versions,
  })
}

/** The same check without throwing: the project, or the problem with its alternatives. */
export function checkProject(options) {
  try {
    return { ok: true, preset: resolvePreset(options) }
  } catch (error) {
    if (!(error instanceof ProjectError)) throw error
    return { ok: false, problem: error.problem, message: error.message }
  }
}

/** What someone coming from another framework should pick. Advice only: nothing is preselected. */
export function recommendation(familiar, targets) {
  if (!familiar || familiar === 'vue' || familiar === 'other') return undefined
  const mac = targets.includes('macos')
  if (familiar === 'react')
    return mac
      ? 'Coming from React: shared TSX screens read like function components with a store. They are compiled to Vue for the Web and Native; React itself is not running.'
      : `Coming from React: screens here are Vue templates and Vue runs them. A React adapter is tracked in #${catalog.frameworks.react.issue}; shared TSX, which reads closer to React, comes with the Mac target.`
  return `Coming from ${catalog.frameworks[familiar].label}: Vue runs the Web and Native apps today. A ${catalog.frameworks[familiar].label} adapter is tracked in #${catalog.frameworks[familiar].issue}.`
}

/** What mavis.config.json records: targets instead of the internal layout name. */
export function configOf(preset) {
  const { target: _layout, availability: _availability, ...config } = preset
  return config
}

/**
 * A project's config in the current shape, whatever creator wrote it. Schema 1 had one
 * `target`; early schema 2 files have no `apps`, `mode` or `execution`.
 */
export function migrateConfig(config) {
  if (!config || (config.targets === undefined && config.target === undefined)) return config
  if (Number(config.schemaVersion) > schemaVersion)
    throw new Error(
      `This project was created by a newer creator (configuration schema ${config.schemaVersion}). Update @getcortexlabs/create-mavis.`,
    )
  const targets = projectTargets(config)
  const hasWeb = targets.includes('web')
  const framework = config.framework ?? 'vue'
  const authoring = config.authoring ?? (targets.includes('macos') ? 'mitosis' : 'vue')
  const web = hasWeb ? (config.web ?? 'vite') : null
  const rendering = hasWeb ? (config.rendering ?? (web === 'nuxt' ? 'ssr' : 'client')) : null
  const { target: _target, ...rest } = config
  return {
    ...rest,
    schemaVersion,
    targets,
    apps: config.apps ?? appsOf({ targets, framework, web, rendering }),
    framework,
    authoring,
    mode: config.mode ?? catalog.authoring[authoring]?.mode ?? 'direct',
    execution: config.execution ?? catalog.authoring[authoring]?.execution ?? 'components',
    web,
    rendering,
  }
}

/** A migrated config plus the internal layout name the scaffold and doctor branch on. */
export function normalizeConfig(config) {
  const migrated = migrateConfig(config)
  if (!migrated?.targets) return migrated
  return { ...migrated, target: layoutOf(migrated.targets) }
}

/** The catalog as data: what `--capabilities --json` prints and CI reads. */
export function describeCapabilities() {
  const entries = (family) => Object.entries(family).map(([id, entry]) => ({ id, ...entry }))
  return {
    catalogVersion,
    schemaVersion,
    macos: macosCapabilities,
    creator: versions.mavis,
    migrations: {
      macos: {
        flag: '--add-macos',
        apply: '--write',
        status: 'experimental',
        since: null,
        hosts: ['vite', 'nuxt', 'nativescript'],
        preservesSources: true,
        compiler: '@getcortexlabs/mavis-compiler',
      },
    },
    combinations: combinations.map((combination) => ({
      ...combination,
      label: targetLabel(combination.targets),
      hosts: combination.targets.includes('web') ? available(catalog.hosts) : [],
      examples: Object.entries(catalog.examples)
        .filter(
          ([, example]) =>
            example.authoring.includes(combination.authoring) ||
            (combination.targets.includes('macos') && example.portableAuthoring),
        )
        .map(([id]) => ({
          id,
          availability: availabilityOf({ targets: combination.targets, example: id }),
        })),
    })),
    targets: entries(catalog.targets),
    frameworks: entries(catalog.frameworks),
    authoring: entries(catalog.authoring),
    execution: entries(catalog.execution),
    hosts: entries(catalog.hosts),
    examples: entries(catalog.examples),
    themes: Object.keys(catalog.themes),
    packageManagers: [...catalog.packageManagers],
    requirements,
    versions,
    planned: [...adapters.planned],
    research: [...adapters.research],
  }
}

/** The same catalog for people: what can be created now, and what is planned with its issue. */
export function formatCapabilities() {
  const data = describeCapabilities()
  const issue = (number) => `https://github.com/getcortexlabs/mavis-ui/issues/${number}`
  const lines = ['What this creator can scaffold', '']
  for (const combination of data.combinations) {
    lines.push(
      `  --targets ${combination.targets.join(',').padEnd(18)} ${combination.label} · ${catalog.authoring[combination.authoring].label}`,
    )
    if (combination.hosts.length)
      lines.push(
        `      Web: ${combination.hosts.map((host) => `${host} (${catalog.hosts[host].rendering.join('/')})`).join(', ')}`,
      )
    for (const example of combination.examples)
      lines.push(
        `      --example ${example.id.padEnd(10)} ${availabilityLabel(example.availability)}`,
      )
  }
  lines.push('', 'Mac components · experimental source inventory (not runtime validation)')
  for (const [name, component] of Object.entries(data.macos.components)) {
    lines.push(
      `  ${name}: ${component.status} · ${component.props.length} Vue props · #${component.issue}`,
    )
    for (const limit of component.limits) lines.push(`      ${limit.en}`)
    if (component.rejectedProps.length)
      lines.push(`      Rejected props: ${component.rejectedProps.join(', ')}`)
  }
  lines.push(
    '  Exact props, events and slots: --capabilities --json. Validate your sources with --check-portability.',
  )
  lines.push(
    '',
    `Themes: ${data.themes.join(', ')} · Package managers: ${data.packageManagers.join(', ')}`,
    `Needs Node.js ${requirements.node}+${requirements.packageManagers.pnpm ? `, pnpm ${requirements.packageManagers.pnpm}+ when used` : ''}.`,
    `Native needs ${requirements.native}. Mac needs ${requirements.macos}.`,
    `Pins: Mavis ${versions.mavis}, Jolt ${versions.jolt}, Vue ${versions.vue}, Nuxt ${versions.nuxt}, NativeScript ${versions.nativeCore}.`,
    '',
    'Not available yet',
    '',
  )
  for (const [family, flag] of [
    ['frameworks', '--framework'],
    ['hosts', '--web'],
    ['authoring', '--authoring'],
    ['execution', 'execution'],
  ])
    for (const entry of data[family].filter((item) => item.status === 'planned'))
      lines.push(`  ${`${flag} ${entry.id}`.padEnd(22)} ${entry.label} · ${issue(entry.issue)}`)
  lines.push(
    '',
    '--familiar vue|react|angular|svelte|solid|other tells the creator what you already know.',
    'It changes the advice, never the framework that runs.',
  )
  return lines.join('\n')
}
