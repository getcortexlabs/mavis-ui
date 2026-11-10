import { packageManagers } from './package-manager.mjs'

/** Baseline pins; coordinated releases update Mavis after validating source templates with matching tarballs. */
export const versions = Object.freeze({
  mavis: '0.1.0-rc.12.2',
  jolt: '0.1.0-rc.13',
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

export function validateProjectName(name) {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(name ?? ''))
    return 'Use a project name of 1–64 lowercase letters, numbers or hyphens, starting with a letter.'
}

/** Where an app runs: Web (Vue), Native (NativeScript iOS/Android) and Mac (SwiftUI). */
export const targetNames = Object.freeze(['web', 'native', 'macos'])

// --target values from earlier versions; macos was the Web + Mac starter.
const legacyTargets = Object.freeze({
  web: ['web'],
  mobile: ['native'],
  both: ['web', 'native'],
  macos: ['web', 'macos'],
})

export function parseTargets(value) {
  const list = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
  const unknown = list.filter((name) => !targetNames.includes(name))
  if (unknown.length || !list.length)
    throw new Error(
      `Targets are a comma-separated list of web, native and macos, for example --targets web,native,macos.`,
    )
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
  return targets.map((name) => ({ web: 'Web', native: 'Native', macos: 'Mac' })[name]).join(' + ')
}

/** The targets an options object asks for: --targets, the older --target, or Web. */
export function chosenTargets(options) {
  if (options.targets !== undefined) return parseTargets(options.targets)
  return [...(legacyTargets[options.target ?? 'web'] ?? [])]
}

export function resolvePreset(options) {
  let targets
  if (options.targets !== undefined) {
    targets = parseTargets(options.targets)
    if (options.target !== undefined && legacyTargets[options.target]?.join() !== targets.join())
      throw new Error('Use either --target or --targets, not both with different values.')
  } else {
    if (options.target !== undefined && !legacyTargets[options.target])
      throw new Error(
        'Target must be mobile, web, both or macos; or use --targets web,native,macos.',
      )
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
    authoring = mac ? 'mitosis' : 'vue',
    example = 'welcome',
    packageManager = 'npm',
  } = options
  const invalidName = validateProjectName(name)
  if (invalidName) throw new Error(invalidName)
  if (!packageManagers.includes(packageManager))
    throw new Error('Package manager must be npm, pnpm or yarn.')
  if (!['welcome', 'directory'].includes(example))
    throw new Error('Example must be welcome or directory.')
  if (framework !== 'vue')
    throw new Error(
      'This creator currently supports Vue. Other framework adapters are tracked in Mavis #145 and #35–39.',
    )
  if (!['mavis', 'midnight'].includes(theme)) throw new Error('Theme must be mavis or midnight.')
  const hasWeb = targets.includes('web')
  if (mac) {
    if (authoring !== 'mitosis')
      throw new Error(
        'With Mac, shared screens are TSX sources compiled for every target; Vue templates are for projects without Mac.',
      )
    if (hasWeb && (web !== 'vite' || rendering !== 'client'))
      throw new Error(
        'With Mac, the Web app uses Vue + Vite. The shared-source compiler does not support Nuxt rendering yet.',
      )
    if (example !== 'welcome')
      throw new Error(
        'With Mac, the welcome example is available. The directory example uses Vue routes that the compiler does not support.',
      )
    return Object.freeze({
      schemaVersion: 2,
      name,
      targets,
      target,
      framework,
      authoring,
      example,
      web: hasWeb ? web : null,
      rendering: hasWeb ? rendering : null,
      theme,
      packageManager,
      experimental: 'shared-tsx',
      versions,
    })
  }
  if (authoring === 'mitosis')
    throw new Error(
      'Shared TSX sources come with the Mac target (--targets web,native,macos). Without Mac, use Vue templates.',
    )
  if (authoring !== 'vue')
    throw new Error(
      'Portable JSX/React-style authoring for Vue is planned in Mavis #167; use Vue templates in this version.',
    )
  if (!['vite', 'nuxt'].includes(web))
    throw new Error('Web host must be vite or nuxt. React/Next are not available yet.')
  if (!hasWeb && (web !== 'vite' || rendering !== 'client'))
    throw new Error('A project without Web has no Web rendering mode.')
  if (
    (web === 'vite' && rendering !== 'client') ||
    (web === 'nuxt' && !['ssr', 'ssg'].includes(rendering))
  )
    throw new Error('Choose client rendering for Vite or ssr/ssg for Nuxt.')
  return Object.freeze({
    schemaVersion: 2,
    name,
    targets,
    target,
    framework,
    authoring,
    example,
    web: hasWeb ? web : null,
    rendering: hasWeb ? rendering : null,
    theme,
    packageManager,
    versions,
  })
}

/** A project's config with targets, from schema 2 or the schema 1 target field. */
export function normalizeConfig(config) {
  if (!config || (config.targets === undefined && config.target === undefined)) return config
  const targets = projectTargets(config)
  return { ...config, targets, target: layoutOf(targets) }
}

/** What mavis.config.json records: targets instead of the internal layout name. */
export function configOf(preset) {
  const { target: _layout, ...config } = preset
  return config
}
