import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Package managers and Vue examples come from the creator's catalog, so a new one is covered
// here without a second list. The module has no dependencies; this job runs before npm ci.
const { catalog } = await import(
  new URL('../packages/create-mavis/src/capabilities.mjs', import.meta.url)
)
const presets = ['web-vite', 'web-nuxt', 'both-vite', 'both-nuxt', 'mobile']
const managers = [...catalog.packageManagers]
const examples = Object.keys(catalog.examples).filter((example) =>
  catalog.examples[example].authoring.includes('vue'),
)
const representativeCreators = [
  { preset: 'web-vite', 'package-manager': 'npm', example: 'welcome' },
  { preset: 'web-nuxt', 'package-manager': 'pnpm', example: 'directory' },
  { preset: 'both-vite', 'package-manager': 'yarn', example: 'directory' },
  { preset: 'both-nuxt', 'package-manager': 'npm', example: 'welcome' },
  { preset: 'mobile', 'package-manager': 'yarn', example: 'welcome' },
]
const macosDelivery = [
  { label: 'welcome', check: 'creator', targets: 'macos', example: 'welcome' },
  { label: 'tasks', check: 'creator', targets: 'macos', example: 'tasks' },
  { label: 'directory-startup', check: 'startup' },
  { label: 'directory-adoption', check: 'adoption' },
]

// Formatting, types, the unit/SSR suite and the docs build run for every change,
// so a rule only lists the slower jobs that can observe the file.
const everything = ['browser', 'consumers', 'nuxt', 'performance', 'cli']
const spec = /^test\/browser\/[a-z0-9-]+\.browser\.ts$/

// First match wins. A path without a rule keeps every job, so a new folder is
// never skipped by accident; add a rule once its consumers are known.
const rules = [
  [
    /^(package(-lock)?\.json|tsconfig\.json|\.github\/workflows\/ci\.yml|scripts\/ci-plan\.mjs)$/,
    everything,
  ],
  [/^packages\/(core|web)\//, everything],
  [/^packages\/nativescript\//, ['consumers', 'cli']],
  [/^packages\/create-mavis\//, ['cli']],
  [/^(packages\/compiler\/|scripts\/build-compiler\.mjs$)/, ['cli']],
  // The performance workload lives with the shared screens.
  [
    /^examples\/catalog\/shared\/checks\/performance\//,
    ['browser', 'consumers', 'nuxt', 'performance'],
  ],
  // Shared screens are built into the Web catalog, the native bundles and the Nuxt fixture.
  [/^examples\/catalog\/shared\//, ['browser', 'consumers', 'nuxt']],
  [/^examples\/catalog-web\//, ['browser', 'nuxt', 'performance']],
  [/^examples\/catalog\//, ['consumers']],
  [
    /^(docs\/|README\.md$|\.github\/workflows\/deploy\.yml$|playwright\.site\.config\.ts$)/,
    ['docs'],
  ],
  [spec, (file) => [`spec:${file}`]],
  // Also compiled into the native catalog's layout probe.
  [/^test\/layout-contract\.ts$/, ['browser', 'consumers']],
  // Also served by the Web catalog at /checks/forms.
  [/^test\/consumers\/WebForms\.vue$/, ['browser', 'consumers']],
  [/^(test\/browser\/|test\/fixtures\/|playwright\.config\.ts$)/, ['browser']],
  [
    /^(test\/consumers\/nuxt\/|test\/ssr\/|scripts\/check-(nuxt|core)-[a-z-]+\.mjs$|playwright\.nuxt-[a-z-]+\.config\.mjs$)/,
    ['nuxt'],
  ],
  [
    /^(test\/consumers\/|scripts\/check-(package-consumers|consumer-web|modular-consumer)\.mjs$)/,
    ['consumers'],
  ],
  // Every packed consumer installs these tarballs; the packer compares LICENSE files.
  [/^(scripts\/pack-release\.mjs|LICENSE)$/, ['consumers', 'nuxt', 'cli']],
  [
    /^(test\/sharing\/|scripts\/(check-project-creator|check-creator-workspaces|serve-sharing-static)\.mjs$|scripts\/check-creator-terminal\.py$|playwright\.sharing(-nuxt)?\.config\.ts$)/,
    ['cli'],
  ],
  // Selected by `macosInputs` below: the macOS starter and the portable compiler's conformance corpus.
  [
    /^(scripts\/check-(macos-creator|macos-adoption|portable-conformance|directory-startup)\.mjs|scripts\/portable-(host|keys|native-runner|selection)\.mjs|scripts\/lib\/installed-artifact\.mjs|test\/(portable|portable-startup)\/.*)$/,
    [],
  ],
  [/^scripts\/verify-parity(\.test)?\.mjs$/, []],
  [/^scripts\/check-chart-browser(\.test)?\.mjs$/, []],
  // Runtime inventory generators are compared with their committed outputs by unit tests.
  [/^scripts\/sync-(creator-adapters|macos-capabilities)\.mjs$/, []],
  // The NativeScript replay of the same corpus runs on simulators by hand.
  [/^test\/portable-native\//, []],
  [
    /^(test\/performance\/|scripts\/(check-web-performance|compare-performance)\.mjs$)/,
    ['performance'],
  ],
  // Unit, contract and type tests; the planner and release tests run in `plan`.
  [
    /^(test\/[^/]+\.(spec\.ts|test\.mjs)|test\/(renderer|native-vue)\.ts|test\/types\/.*|test\/tsconfig[^/]*\.json|vitest\.config\.ts|\.github\/workflows\/release\.yml|scripts\/publish-release\.mjs)$/,
    [],
  ],
  // Simulator/device protocols and generators are run by hand, never by hosted CI.
  [
    /^(test\/native\/.*|test\/[^/]+\.md|scripts\/check-native-[a-z0-9-]+\.(mjs|py)|scripts\/(prepare-sharing-native|generate-icons|generate-app-icons)\.mjs|playwright\.expressive\.config\.ts)$/,
    [],
  ],
  [
    /^(CHANGELOG\.md|ASSETS\.md|CONTRIBUTING\.md|\.github\/ISSUE_TEMPLATE\/.*|\.gitignore|\.prettierrc\.json|\.prettierignore)$/,
    [],
  ],
]

const macosInputs = new Set([
  'packages/core/src/contracts.ts',
  'packages/core/src/vue/props.ts',
  'scripts/check-macos-creator.mjs',
  'scripts/check-portable-conformance.mjs',
  'scripts/portable-host.mjs',
  'scripts/portable-keys.mjs',
  'scripts/portable-native-runner.mjs',
  'scripts/portable-selection.mjs',
  'scripts/build-compiler.mjs',
  'scripts/check-directory-startup.mjs',
  'scripts/check-macos-adoption.mjs',
  'scripts/lib/installed-artifact.mjs',
  'scripts/ci-plan.mjs',
  '.github/workflows/ci.yml',
  'test/create-mavis-macos.spec.ts',
  'test/create-mavis-macos-props.spec.ts',
  'test/create-mavis-vue.spec.ts',
  'test/create-mavis-slots.spec.ts',
  // The layout relations the Web and Mac runners share with the NativeScript probe.
  'test/portable-native/layout.ts',
])

export function impactsOf(file) {
  for (const [pattern, impacts] of rules) {
    if (pattern.test(file)) return typeof impacts === 'function' ? impacts(file) : impacts
  }
  return everything
}

function shards(project, count) {
  return Array.from({ length: count }, (_, index) => ({
    label: `${project} ${index + 1}/${count}`,
    project,
    shard: `${index + 1}/${count}`,
    filters: '',
  }))
}

// Deleted spec files have nothing left to run; every other deleted path still
// selects the jobs that used to depend on it.
export function planChecks({
  files = [],
  full = false,
  headBranch = '',
  exists = () => true,
} = {}) {
  full ||= headBranch.startsWith('release/')
  const reasons = new Map()
  const select = (impact, file) => {
    if (!reasons.has(impact)) reasons.set(impact, file)
  }
  if (files.length === 0) for (const impact of everything) select(impact, '(no diff)')
  for (const file of files) {
    for (const impact of impactsOf(file)) {
      if (!impact.startsWith('spec:') || exists(file)) select(impact, file)
    }
  }
  const selected = (impact) => full || reasons.has(impact)
  const specs = [...reasons.keys()]
    .filter((impact) => impact.startsWith('spec:'))
    .map((impact) => impact.slice('spec:'.length))
    .sort()

  let browsers = []
  if (full)
    browsers = [...shards('chromium', 3), ...shards('webkit', 3), ...shards('firefox-motion', 1)]
  else if (selected('browser')) browsers = shards('chromium', 3)
  else {
    if (selected('docs'))
      browsers.push({ label: 'chromium docs', project: 'chromium', shard: '1/1', filters: 'docs' })
    // A test-only change usually targets an engine-specific failure, so run the
    // changed files in every configured engine rather than in Chromium alone.
    if (specs.length)
      browsers.push({
        label: `changed specs (${specs.length})`,
        project: 'all',
        shard: '1/1',
        filters: specs.join(' '),
      })
  }

  const cli = selected('cli')
  const consumers = selected('consumers')
  const nuxt = selected('nuxt')
  const macos =
    full ||
    files.length === 0 ||
    files.some(
      (file) =>
        /^(packages\/(create-mavis|compiler)\/|packages\/core\/src\/theme\/|test\/(portable|portable-startup)\/)/.test(
          file,
        ) || macosInputs.has(file),
    )
  const creators = !cli
    ? []
    : full
      ? presets.flatMap((preset) =>
          managers.flatMap((manager) =>
            examples.map((example) => ({ preset, 'package-manager': manager, example })),
          ),
        )
      : representativeCreators
  return {
    full,
    browser: browsers.length > 0,
    browsers: { include: browsers },
    consumers,
    nuxt,
    performance: selected('performance'),
    cli,
    creators: { include: creators },
    macos,
    macos_delivery: {
      include: !macos
        ? []
        : [
            ...macosDelivery,
            ...(full
              ? ['web,macos', 'native,macos', 'web,native,macos'].map((targets) => ({
                  label: targets.replaceAll(',', '-'),
                  check: 'creator',
                  targets,
                  example: 'welcome',
                }))
              : []),
          ],
    },
    macos_ui: {
      include: !macos
        ? []
        : full
          ? Array.from({ length: 8 }, (_, index) => ({
              label: `full ${index + 1}/8`,
              scope: 'full',
              shard: `${index + 1}/8`,
              timeout: 30,
            }))
          : [{ label: 'smoke', scope: 'smoke', shard: '1/1', timeout: 15 }],
    },
    pack: consumers || nuxt || cli || macos,
    reasons: Object.fromEntries(reasons),
  }
}

export function summarize(plan, fileCount) {
  const because = (impact) =>
    plan.full ? 'full run' : plan.reasons[impact] ? `\`${plan.reasons[impact]}\`` : ''
  const row = (name, enabled, detail) => `| ${name} | ${enabled ? 'yes' : '—'} | ${detail} |`
  const browsers = plan.browsers.include.map(({ label }) => label).join(', ')
  const browserReason = plan.reasons.browser
    ? because('browser')
    : plan.full
      ? 'full run'
      : 'changed docs or browser specs'
  return [
    `Mode: **${plan.full ? 'full (release branch or manual run)' : 'changed files'}** (${fileCount} file(s) in the diff).`,
    '',
    '| Check | Runs | Selected by |',
    '| --- | --- | --- |',
    row('Format, types, unit/SSR, docs build', true, 'every change'),
    row(`Browser: ${browsers || 'none'}`, plan.browser, plan.browser ? browserReason : ''),
    row('Packed Web and NativeScript consumers', plan.consumers, because('consumers')),
    row('Nuxt SSR and static', plan.nuxt, because('nuxt')),
    row('Web performance', plan.performance, because('performance')),
    row(`CLI installs (${plan.creators.include.length})`, plan.cli, because('cli')),
    row(
      'macOS packed delivery',
      plan.macos,
      plan.macos && !plan.full ? 'creator, shared theme or contracts' : '',
    ),
    row('macOS full source compilation (no UI)', plan.macos, 'parallel with package/docs build'),
    row(
      'macOS UI',
      plan.macos,
      !plan.macos
        ? ''
        : plan.full
          ? 'complete corpus, 8 shards'
          : 'representative smoke only; full parity requires a full run',
    ),
    '',
    'A path without a rule in `scripts/ci-plan.mjs` keeps every job. See test/ci.md.',
    '',
  ].join('\n')
}

// A selected job being skipped is not a pass. In particular, a failed prerequisite
// must not turn its skipped dependants green at the stable branch-protection gate.
export function checkFailures(results) {
  const selectedBy = {
    browser: 'browser',
    consumers: 'consumers',
    nuxt: 'nuxt',
    performance: 'performance',
    creator: 'cli',
    'macos-web': 'macos',
    'macos-compile': 'macos',
    'macos-delivery': 'macos',
    macos: 'macos',
  }
  const required = new Set(['plan', 'verify', 'build'])
  const failures = []
  for (const flag of new Set(Object.values(selectedBy))) {
    const value = results.plan?.outputs?.[flag]
    if (value !== 'true' && value !== 'false') failures.push(`plan: missing/invalid ${flag}`)
  }
  for (const [job, flag] of Object.entries(selectedBy)) {
    if (results.plan?.outputs?.[flag] === 'true') required.add(job)
  }
  for (const name of new Set([...Object.keys(results), ...required])) {
    const result = results[name]?.result
    if (result !== 'success' && (required.has(name) || result !== 'skipped'))
      failures.push(`${name}: ${result ?? 'missing'}`)
  }
  return failures
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  process.argv.includes('--check-results')
) {
  const results = JSON.parse(process.env.CI_CHECK_RESULTS)
  for (const [name, { result }] of Object.entries(results)) console.log(`${name}: ${result}`)
  const failures = checkFailures(results)
  if (failures.length) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  }
} else if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let files = []
  const { CI_BASE, CI_HEAD, CI_HEAD_BRANCH, CI_FULL, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } =
    process.env
  if (CI_BASE && CI_HEAD && !/^0+$/.test(CI_BASE)) {
    try {
      // Three dots: what this branch changed since it left the base, not newer
      // base commits that the branch has not merged yet.
      files = execFileSync(
        'git',
        ['diff', '--no-renames', '--name-only', '-z', `${CI_BASE}...${CI_HEAD}`, '--'],
        { encoding: 'utf8' },
      )
        .split('\0')
        .filter(Boolean)
    } catch {
      console.warn('Diff unavailable; keeping every check.')
    }
  }
  const plan = planChecks({
    files,
    full: CI_FULL === 'true',
    headBranch: CI_HEAD_BRANCH,
    exists: existsSync,
  })
  console.log(JSON.stringify(plan, null, 2))
  if (GITHUB_OUTPUT) {
    for (const [name, value] of Object.entries(plan)) {
      appendFileSync(GITHUB_OUTPUT, `${name}=${JSON.stringify(value)}\n`)
    }
  }
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, summarize(plan, files.length))
}
