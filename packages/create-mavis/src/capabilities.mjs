import { desktopComponents } from '../templates/desktop/common/src/contract.mjs'
import { adapters } from './adapters.mjs'

/** Shape of `--capabilities --json`, for tools that read it. */
export const catalogVersion = 1
/** Version of mavis.config.json this creator writes. Older ones are migrated when read. */
export const schemaVersion = 2

/** Baseline pins; coordinated releases update Mavis after validating source templates with matching tarballs. */
export const versions = Object.freeze({
  mavis: '0.1.0-rc.15',
  jolt: '0.1.0-rc.17',
  vue: '3.5.44',
  nuxt: '4.6.3',
  vite: '6.4.5',
  vuePlugin: '5.2.4',
  typescript: '6.0.3',
  nodeTypes: '26.6.6',
  vueTsc: '3.3.13',
  nativeCore: '9.1.4',
  nativeVue: '3.1.3',
  android: '9.1.1',
  ios: '9.1.0',
  webpack: '5.0.39',
  webpackCore: '5.112.2',
  webpackCli: '6.0.1',
  router: '4.6.4',
  nativeRouter: '0.1.0',
  macosNodeApi: '0.5.0-beta.0',
  windowsNapi: '1.0.0-beta.20',
  esbuild: '0.25.12',
})

/** Tools a project needs. The creator and doctor check against these, not their own numbers. */
export const requirements = Object.freeze({
  node: '22.16',
  packageManagers: Object.freeze({ npm: null, pnpm: '10.26', yarn: null }),
  native: 'the NativeScript CLI, a JDK and the Android SDK; macOS and Xcode for iOS',
  macos: 'macOS 13.3+ on Apple Silicon, Node 22.23.3+; Xcode command line tools for packaging',
  windows: 'Windows 10 build 18362+ (x64/arm64), Node 22.23.3+ and Windows SDK Manifest Tool',
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
      hint: 'NativeScript AppKit (experimental)',
      toolkit: 'nativescript-appkit',
      adapter: 'vue-appkit',
      runtimes: ['appkit'],
      status: 'experimental',
    },
    windows: {
      label: 'Windows',
      hint: 'NativeScript XAML Islands (experimental)',
      toolkit: 'nativescript-xaml',
      adapter: 'vue-windows',
      status: 'experimental',
    },
  }),
  macosRuntimes: Object.freeze({
    appkit: { label: 'NativeScript AppKit', hint: 'Vue runs directly with native AppKit controls' },
  }),
  frameworks: Object.freeze({
    vue: { label: 'Vue', status: 'validated' },
    plain: {
      label: 'JavaScript / TypeScript',
      status: 'experimental',
      targets: ['native'],
      since: '0.1.0-rc.15',
    },
    react: {
      label: 'React',
      status: 'experimental',
      targets: ['native'],
      since: '0.1.0-rc.15',
      webIssue: issueOf('react-web'),
    },
    angular: {
      label: 'Angular',
      status: 'experimental',
      targets: ['native'],
      since: '0.1.0-rc.15',
      webIssue: issueOf('angular-web'),
    },
    svelte: {
      label: 'Svelte',
      status: 'experimental',
      targets: ['native'],
      since: '0.1.0-rc.15',
      webIssue: issueOf('svelte-web'),
    },
    solid: {
      label: 'Solid',
      status: 'experimental',
      targets: ['native'],
      since: '0.1.0-rc.15',
      webIssue: issueOf('solid-web'),
    },
  }),
  // How screens are written, and what runs: the components directly, or code generated from them.
  authoring: Object.freeze({
    native: {
      label: 'Direct framework components',
      mode: 'direct',
      execution: 'components',
      status: 'experimental',
    },
    vue: { label: 'Vue templates', mode: 'direct', execution: 'components', status: 'validated' },
    jsx: planned(167, 'React-style JSX compiled for Vue'),
  }),
  execution: Object.freeze({
    components: { label: 'Mavis components in the app', status: 'validated' },
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
      authoring: ['vue', 'native'],
      since: '0.1.0-alpha.6',
    },
    directory: {
      label: 'Search, details and editing',
      hint: 'Shared routes, forms and local persistence',
      authoring: ['vue'],
      since: '0.1.0-alpha.9',
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
const vueCombinations = [
  { targets: ['web'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
  { targets: ['native'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
  { targets: ['web', 'native'], authoring: 'vue', status: 'validated', since: '0.1.0-alpha.6' },
]

export const combinations = Object.freeze([
  ...['plain', 'react', 'angular', 'svelte', 'solid'].map((framework) => ({
    targets: ['native'],
    framework,
    authoring: 'native',
    status: 'experimental',
    since: '0.1.0-rc.15',
  })),
  ...vueCombinations,
  ...Array.from({ length: 15 }, (_, i) =>
    ['web', 'native', 'macos', 'windows'].filter((_, bit) => (i + 1) & (1 << bit)),
  )
    .filter((targets) => targets.includes('macos') || targets.includes('windows'))
    .map((targets) => ({
      targets,
      authoring: 'vue',
      macosRuntime: targets.includes('macos') ? 'appkit' : undefined,
      status: 'experimental',
      since: '0.1.0-rc.15',
    })),
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
      message: `Targets are a comma-separated list of web, native, macos and windows, for example --targets macos,windows.`,
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
  if (targets.includes('windows') || targets.includes('macos')) return 'desktop'
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
export function availabilityOf({
  targets,
  example,
  web,
  macosRuntime = 'appkit',
  framework = 'vue',
}) {
  const combination = combinations.find(
    (entry) =>
      entry.targets.join() === targets.join() &&
      (entry.framework ?? 'vue') === framework &&
      (!entry.macosRuntime || entry.macosRuntime === macosRuntime),
  )
  if (!combination) return 'repository'
  if (combination.since === null || catalog.examples[example].since === null) return 'repository'
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
      return [
        target,
        {
          toolkit,
          framework,
          runtime: target === 'macos' ? versions.macosNodeApi : versions.windowsNapi,
        },
      ]
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
  const macosRuntime = options.macosRuntime ?? options['macos-runtime'] ?? 'appkit'
  if (!catalog.macosRuntimes[macosRuntime])
    reject({
      code: 'unknown',
      option: '--macos-runtime',
      message: 'The macOS runtime is NativeScript AppKit.',
    })
  if ((options.macosRuntime || options['macos-runtime']) && !targets.includes('macos'))
    reject({
      code: 'incompatible',
      option: '--macos-runtime',
      message: '--macos-runtime requires the macos target.',
    })
  const target = layoutOf(targets, macosRuntime)
  const {
    name,
    web = 'vite',
    rendering = web === 'nuxt' ? 'ssr' : 'client',
    theme = 'mavis',
    framework = 'vue',
    authoring = framework !== 'vue' ? 'native' : 'vue',
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
      message: 'Example must be welcome or directory.',
    })
  if (familiar !== undefined && !catalog.familiar.includes(familiar))
    reject({
      code: 'unknown',
      option: '--familiar',
      message: `--familiar is one of ${catalog.familiar.join(', ')}. It only shapes the recommendation.`,
    })
  if (!catalog.frameworks[framework])
    reject({
      code: 'unknown',
      option: '--framework',
      message: 'Framework must be vue, plain, react, angular, svelte or solid.',
    })
  if (framework !== 'vue' && (targets.length !== 1 || targets[0] !== 'native'))
    reject({
      code: 'incompatible',
      option: '--framework',
      message: `${framework} currently has an iOS/Android starter only. Web, AppKit and Windows hosts use Vue.`,
      alternatives: [`--targets native --framework ${framework}`, '--framework vue'],
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
  if (framework !== 'vue') {
    if (example !== 'welcome' || authoring !== 'native')
      reject({
        code: 'incompatible',
        option: '--example',
        message:
          'Direct native framework starters provide the welcome example with framework components.',
        alternatives: ['--example welcome --authoring native'],
      })
    return describe({
      schemaVersion,
      name,
      targets,
      target: 'mobile',
      apps: appsOf({ targets, framework }),
      framework,
      authoring,
      mode: 'direct',
      execution: 'components',
      example,
      web: null,
      rendering: null,
      theme,
      packageManager,
      ...(familiar ? { familiar } : {}),
      experimental: 'direct-native-framework',
      versions,
    })
  }
  if (target === 'desktop') {
    if (authoring !== 'vue')
      reject({
        code: 'incompatible',
        option: '--authoring',
        message:
          'NativeScript desktop currently supports shared Vue with welcome or directory. Choose welcome or directory.',
        alternatives: ['--example welcome', '--example directory'],
      })
    return describe({
      schemaVersion,
      name,
      targets,
      target,
      ...(targets.includes('macos') ? { macosRuntime } : {}),
      apps: appsOf({
        targets,
        framework,
        web: hasWeb ? web : null,
        rendering: hasWeb ? rendering : null,
        macosRuntime,
      }),
      framework,
      authoring,
      mode: 'direct',
      execution: 'components',
      example,
      web: hasWeb ? web : null,
      rendering: hasWeb ? rendering : null,
      theme,
      packageManager,
      ...(familiar ? { familiar } : {}),
      experimental: 'nativescript-desktop',
      versions,
    })
  }
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
  return targets.length === 1 && targets[0] === 'native'
    ? `Coming from ${catalog.frameworks[familiar].label}: select --framework ${familiar} for its direct iOS/Android component subset, or Vue for the full native catalog.`
    : `These Web and desktop hosts use Vue. Direct ${catalog.frameworks[familiar].label} starters are available separately with --targets native --framework ${familiar}.`
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
  if (
    targets.includes('macos') &&
    (config.macosRuntime === 'swiftui' ||
      config.apps?.macos?.toolkit === 'swiftui' ||
      config.mode === 'portable' ||
      (!config.macosRuntime && !config.apps?.macos && !config.desktop))
  )
    throw new Error(
      'This project uses the archived SwiftUI target. Use its pinned creator or the archive/swiftui branch.',
    )
  const authoring = config.authoring ?? 'vue'
  const web = hasWeb ? (config.web ?? 'vite') : null
  const rendering = hasWeb ? (config.rendering ?? (web === 'nuxt' ? 'ssr' : 'client')) : null
  const macosRuntime = 'appkit'
  const { target: _target, ...rest } = config
  return {
    ...rest,
    schemaVersion,
    targets,
    apps: config.apps ?? appsOf({ targets, framework, web, rendering, macosRuntime }),
    ...(targets.includes('macos') ? { macosRuntime } : {}),
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
  return { ...migrated, target: layoutOf(migrated.targets, migrated.macosRuntime) }
}

/** The catalog as data: what `--capabilities --json` prints and CI reads. */
export function describeCapabilities() {
  const entries = (family) => Object.entries(family).map(([id, entry]) => ({ id, ...entry }))
  return {
    catalogVersion,
    schemaVersion,
    desktop: {
      contracts: desktopComponents,
      status: 'experimental',
      since: '0.1.0-rc.15',
      components: [
        'MScreen',
        'MColumn',
        'MRow',
        'MGrid',
        'MText',
        'MInput',
        'MButton',
        'MLink',
        'MCard',
        'MAlert',
        'MEmptyState',
        'MReveal',
      ],
      limits: [
        'Explicit property subset; unsupported properties fail at runtime.',
        'MRow uses equal-width columns; MGrid adapts to minColumnWidth.',
        'AppKit reveal: finite opacity through Jolt samples and Core Animation. Windows reveal: immediate visibility; no Jolt Windows driver.',
        'NativeScript Core iOS/Android components are not desktop controls.',
      ],
      macosRuntime: versions.macosNodeApi,
      windowsRuntime: versions.windowsNapi,
    },
    macosRuntimes: entries(catalog.macosRuntimes),
    creator: versions.mavis,
    migrations: {
      macos: {
        flag: '--add-macos',
        apply: '--write',
        status: 'experimental',
        since: '0.1.0-rc.15',
        hosts: ['vite', 'nuxt', 'nativescript'],
        preservesSources: true,
        runtimes: ['appkit'],
      },
    },
    combinations: combinations.map((combination) => ({
      ...combination,
      label: targetLabel(combination.targets),
      hosts: combination.targets.includes('web') ? available(catalog.hosts) : [],
      examples: Object.entries(catalog.examples)
        .filter(([, example]) => example.authoring.includes(combination.authoring))
        .map(([id]) => ({
          id,
          availability: availabilityOf({
            targets: combination.targets,
            example: id,
            macosRuntime: combination.macosRuntime,
            framework: combination.framework,
          }),
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
      `  --targets ${combination.targets.join(',').padEnd(18)} ${combination.label} · ${catalog.authoring[combination.authoring].label}${combination.framework ? ` · --framework ${combination.framework}` : ''}${combination.macosRuntime ? ` · --macos-runtime ${combination.macosRuntime}` : ''}`,
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
  lines.push(
    '',
    'NativeScript desktop · experimental subset',
    `  ${data.desktop.components.join(', ')}`,
    ...data.desktop.limits.map((limit) => `  ${limit}`),
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
