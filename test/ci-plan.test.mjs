import assert from 'node:assert/strict'
import { test } from 'node:test'
import { impactsOf, planChecks } from '../scripts/ci-plan.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const labels = (plan) => plan.browsers.include.map(({ label }) => label)
const jobs = (plan) =>
  ['browser', 'consumers', 'nuxt', 'performance', 'cli', 'macos'].filter((name) => plan[name])

test('documentation changes run only the documentation browser tests', () => {
  const plan = planChecks({
    files: [
      'docs/index.md',
      'docs/.vitepress/theme/DocsLayout.vue',
      'test/browser/docs-smoke.browser.ts',
      'playwright.site.config.ts',
      '.github/workflows/deploy.yml',
    ],
  })
  assert.deepEqual(jobs(plan), ['browser'])
  assert.equal(plan.pack, false)
  assert.deepEqual(labels(plan), ['chromium docs', 'changed specs (1)'])
  assert.equal(plan.browsers.include[0].filters, 'docs')
  assert.equal(plan.browsers.include[1].filters, 'test/browser/docs-smoke.browser.ts')
})

test('Web runtime changes keep every Chromium test and representative real CLI installs', () => {
  const plan = planChecks({ files: ['packages/web/src/components/MButton.ts'] })
  assert.deepEqual(jobs(plan), ['browser', 'consumers', 'nuxt', 'performance', 'cli'])
  assert.deepEqual(labels(plan), ['chromium 1/3', 'chromium 2/3', 'chromium 3/3'])
  assert.equal(plan.reasons.browser, 'packages/web/src/components/MButton.ts')
  assert.equal(plan.creators.include.length, 5)
  assert.deepEqual(
    new Set(plan.creators.include.map((row) => row.preset)),
    new Set(['web-vite', 'web-nuxt', 'both-vite', 'both-nuxt', 'mobile']),
  )
  assert.deepEqual(
    new Set(plan.creators.include.map((row) => row['package-manager'])),
    new Set(['npm', 'pnpm', 'yarn']),
  )
  assert.deepEqual(
    new Set(plan.creators.include.map((row) => row.example)),
    new Set(['welcome', 'directory']),
  )
})

test('NativeScript renderer changes skip the Web browser, Nuxt and performance jobs', () => {
  const plan = planChecks({ files: ['packages/nativescript/src/vue/components/MButton.ts'] })
  assert.deepEqual(jobs(plan), ['consumers', 'cli'])
  assert.equal(plan.pack, true)
})

test('CLI changes run real installs and the macOS starter, nothing that ignores the CLI', () => {
  const plan = planChecks({ files: ['packages/create-mavis/src/cli.mjs'] })
  assert.deepEqual(jobs(plan), ['cli', 'macos'])
  assert.equal(plan.creators.include.length, 5)
})

test('shared screens reach the Web catalog, native bundles and the Nuxt fixture', () => {
  assert.deepEqual(jobs(planChecks({ files: ['examples/catalog/shared/pages/Atlas.vue'] })), [
    'browser',
    'consumers',
    'nuxt',
  ])
  assert.deepEqual(
    jobs(planChecks({ files: ['examples/catalog/shared/checks/performance/run.ts'] })),
    ['browser', 'consumers', 'nuxt', 'performance'],
  )
  assert.deepEqual(jobs(planChecks({ files: ['examples/catalog/src/app.ts'] })), ['consumers'])
  assert.deepEqual(jobs(planChecks({ files: ['examples/catalog-web/src/main.ts'] })), [
    'browser',
    'nuxt',
    'performance',
  ])
})

test('a changed browser spec runs alone in every engine; a deleted one runs nothing', () => {
  const plan = planChecks({
    files: ['test/browser/tabs.browser.ts', 'test/browser/sheet.browser.ts'],
  })
  assert.deepEqual(jobs(plan), ['browser'])
  assert.deepEqual(plan.browsers.include, [
    {
      label: 'changed specs (2)',
      project: 'all',
      shard: '1/1',
      filters: 'test/browser/sheet.browser.ts test/browser/tabs.browser.ts',
    },
  ])
  const deleted = planChecks({ files: ['test/browser/old.browser.ts'], exists: () => false })
  assert.equal(deleted.browser, false)
  assert.equal(planChecks({ files: ['test/browser/helpers.ts'] }).browsers.include.length, 3)
})

test('harness changes select only their own job', () => {
  assert.deepEqual(jobs(planChecks({ files: ['scripts/check-nuxt-motion.mjs'] })), ['nuxt'])
  assert.deepEqual(jobs(planChecks({ files: ['test/consumers/nuxt/app/app.vue'] })), ['nuxt'])
  assert.deepEqual(jobs(planChecks({ files: ['test/consumers/Consumer.vue'] })), ['consumers'])
  assert.deepEqual(jobs(planChecks({ files: ['test/consumers/WebForms.vue'] })), [
    'browser',
    'consumers',
  ])
  assert.deepEqual(jobs(planChecks({ files: ['test/performance/report.ts'] })), ['performance'])
  assert.deepEqual(jobs(planChecks({ files: ['test/sharing/flow.browser.ts'] })), ['cli'])
  assert.deepEqual(jobs(planChecks({ files: ['scripts/check-macos-creator.mjs'] })), ['macos'])
  assert.deepEqual(jobs(planChecks({ files: ['test/portable/tasks/steps.json'] })), ['macos'])
  assert.deepEqual(jobs(planChecks({ files: ['scripts/check-portable-conformance.mjs'] })), [
    'macos',
  ])
})

test('unit tests, device protocols and release tooling need only the always-on checks', () => {
  const plan = planChecks({
    files: [
      'test/tabs.spec.ts',
      'test/types/components.vue',
      'test/native-tabs.md',
      'scripts/check-native-tabs.mjs',
      'CHANGELOG.md',
      '.github/workflows/release.yml',
      'scripts/publish-release.mjs',
    ],
  })
  assert.deepEqual(jobs(plan), [])
  assert.equal(plan.pack, false)
})

test('release branches and manual full runs preserve every engine and CLI combination', () => {
  for (const options of [{ headBranch: 'release/0.1.0-alpha.12' }, { full: true }]) {
    const plan = planChecks({ files: ['docs/index.md'], ...options })
    assert.equal(plan.full, true)
    assert.deepEqual(jobs(plan), ['browser', 'consumers', 'nuxt', 'performance', 'cli', 'macos'])
    assert.deepEqual(labels(plan), [
      'chromium 1/3',
      'chromium 2/3',
      'chromium 3/3',
      'webkit 1/3',
      'webkit 2/3',
      'webkit 3/3',
      'firefox-motion 1/1',
    ])
    assert.equal(new Set(plan.creators.include.map((row) => JSON.stringify(row))).size, 30)
    for (const preset of ['web-vite', 'web-nuxt', 'both-vite', 'both-nuxt', 'mobile']) {
      for (const manager of ['npm', 'pnpm', 'yarn']) {
        for (const example of ['welcome', 'directory']) {
          assert(
            plan.creators.include.some(
              (row) =>
                row.preset === preset &&
                row['package-manager'] === manager &&
                row.example === example,
            ),
          )
        }
      }
    }
  }
})

test('dependencies, CI, unknown paths, deleted sources and missing history keep every job', () => {
  for (const files of [
    [],
    ['docs/index.md', 'package-lock.json'],
    ['some-new-config'],
    ['packages/core/src/removed-file.ts'],
    ['.github/workflows/ci.yml'],
    ['scripts/ci-plan.mjs'],
  ]) {
    const plan = planChecks({ files, exists: () => false })
    assert.deepEqual(
      jobs(plan).filter((name) => name !== 'macos'),
      ['browser', 'consumers', 'nuxt', 'performance', 'cli'],
      JSON.stringify(files),
    )
    assert.equal(plan.browsers.include.length, 3, JSON.stringify(files))
  }
  assert.deepEqual(jobs(planChecks({ files: ['LICENSE'] })), ['consumers', 'nuxt', 'cli'])
})

test('every tracked file has an explicit rule', () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
  const everything = ['browser', 'consumers', 'nuxt', 'performance', 'cli']
  // Only these deliberately ask for every job; anything else reaching the
  // fallback means a new folder needs a rule in scripts/ci-plan.mjs.
  const complete =
    /^(package(-lock)?\.json|tsconfig\.json|\.github\/workflows\/ci\.yml|scripts\/ci-plan\.mjs|packages\/(core|web)\/.*)$/
  for (const file of files) {
    if (complete.test(file)) continue
    assert.notDeepEqual(impactsOf(file), everything, `${file} has no CI rule`)
  }
})

test('GitHub outputs use the branch diff, including a source file renamed into docs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mavis-ci-plan-'))
  const outputs = mkdtempSync(join(tmpdir(), 'mavis-ci-plan-output-'))
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim()
  const script = fileURLToPath(new URL('../scripts/ci-plan.mjs', import.meta.url))
  try {
    git('init', '--quiet', '--initial-branch', 'main')
    git('config', 'user.name', 'CI test')
    git('config', 'user.email', 'ci-test@example.invalid')
    mkdirSync(join(directory, 'packages/core'), { recursive: true })
    mkdirSync(join(directory, 'docs'))
    writeFileSync(join(directory, 'packages/core/source.ts'), 'export const example = 1\n')
    git('add', '.')
    git('commit', '--quiet', '-m', 'initial')
    const base = git('rev-parse', 'HEAD')
    git('switch', '--quiet', '-c', 'docs/example')
    writeFileSync(join(directory, 'docs/index.md'), '# Docs\n')
    git('add', '.')
    git('commit', '--quiet', '-m', 'docs')
    const run = (output, head = git('rev-parse', 'HEAD'), from = base) => {
      execFileSync(process.execPath, [script], {
        cwd: directory,
        env: {
          ...process.env,
          CI_BASE: from,
          CI_HEAD: head,
          CI_HEAD_BRANCH: 'docs/example',
          CI_FULL: 'false',
          GITHUB_OUTPUT: join(outputs, output),
          GITHUB_STEP_SUMMARY: join(outputs, 'summary'),
        },
      })
      return Object.fromEntries(
        readFileSync(join(outputs, output), 'utf8')
          .trim()
          .split('\n')
          .map((line) => {
            const separator = line.indexOf('=')
            return [line.slice(0, separator), JSON.parse(line.slice(separator + 1))]
          }),
      )
    }
    assert.equal(run('docs-output').consumers, false)

    // A newer runtime commit on main is not part of this branch's changes.
    const docsHead = git('rev-parse', 'HEAD')
    git('switch', '--quiet', 'main')
    writeFileSync(join(directory, 'packages/core/source.ts'), 'export const example = 2\n')
    git('commit', '--quiet', '-am', 'runtime on main')
    const behind = run('behind-output', docsHead, git('rev-parse', 'HEAD'))
    assert.equal(behind.consumers, false)
    assert.deepEqual(
      behind.browsers.include.map(({ label }) => label),
      ['chromium docs'],
    )

    git('switch', '--quiet', 'docs/example')
    renameSync(join(directory, 'packages/core/source.ts'), join(directory, 'docs/source.ts'))
    git('add', '.')
    git('commit', '--quiet', '-m', 'move source')
    const plan = run('rename-output')
    assert.equal(plan.consumers, true)
    assert.equal(plan.browsers.include.length, 3)
    assert.match(readFileSync(join(outputs, 'summary'), 'utf8'), /packages\/core\/source\.ts/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
    rmSync(outputs, { recursive: true, force: true })
  }
})

test('macOS starter checks run for releases and compiler changes, not unrelated docs', () => {
  assert.equal(planChecks({ files: ['docs/guide/macos-experimental.md'] }).macos, false)
  assert.equal(
    planChecks({ files: ['packages/create-mavis/templates/macos/shared/Welcome.lite.tsx'] }).macos,
    true,
  )
  assert.equal(planChecks({ files: ['packages/core/src/theme/themes.ts'] }).macos, true)
  for (const file of ['packages/compiler/index.d.ts', 'scripts/build-compiler.mjs']) {
    const checks = planChecks({ files: [file] })
    assert.equal(checks.macos, true, file)
    assert.equal(checks.cli, true, file)
    assert.equal(checks.pack, true, file)
  }
  for (const file of [
    'scripts/check-directory-startup.mjs',
    'test/portable-startup/DirectoryStartup.swift',
  ]) {
    assert.equal(planChecks({ files: [file] }).macos, true, file)
  }
  assert.equal(planChecks({ files: ['packages/web/src/components/MChip.ts'] }).macos, false)
  assert.equal(planChecks({ headBranch: 'release/0.1.0-rc.12.2' }).macos, true)
})

test('published Directory adoption selects the packed macOS consumer check', () => {
  for (const file of ['scripts/check-macos-adoption.mjs', 'scripts/lib/installed-artifact.mjs']) {
    const plan = planChecks({ files: [file] })
    assert.deepEqual(jobs(plan), ['macos'])
    assert.equal(plan.pack, true)
  }
})
