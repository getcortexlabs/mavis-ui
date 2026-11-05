import assert from 'node:assert/strict'
import { test } from 'node:test'
import { planChecks } from '../scripts/ci-plan.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test('documentation changes keep browser checks without launching package consumers', () => {
  const plan = planChecks({
    files: [
      'docs/index.md',
      'docs/.vitepress/theme/DocsLayout.vue',
      'test/browser/docs-smoke.browser.ts',
      'playwright.site.config.ts',
      '.github/workflows/deploy.yml',
    ],
  })
  assert.equal(plan.integration, false)
  assert.equal(plan.performance, false)
  assert.deepEqual(plan.browsers.include, [{ project: 'chromium', shard: '1/1', scope: 'docs' }])
})

test('normal runtime changes retain all Chromium tests and representative real CLI installs', () => {
  const plan = planChecks({ files: ['packages/web/src/components/MButton.ts'] })
  assert.equal(plan.integration, true)
  assert.equal(plan.performance, true)
  assert.deepEqual(
    plan.browsers.include.map(({ project, shard }) => `${project}:${shard}`),
    ['chromium:1/2', 'chromium:2/2'],
  )
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

test('release branches and manual full runs preserve every manager/example/preset combination', () => {
  for (const options of [{ headBranch: 'release/0.1.0-alpha.12' }, { full: true }]) {
    const plan = planChecks({ files: ['docs/index.md'], ...options })
    assert.equal(plan.full, true)
    assert.equal(plan.integration, true)
    assert.equal(plan.performance, true)
    assert.deepEqual(
      plan.browsers.include.map(({ project, shard }) => `${project}:${shard}`),
      ['chromium:1/2', 'chromium:2/2', 'webkit:1/2', 'webkit:2/2', 'firefox-motion:1/1'],
    )
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

test('mixed changes, unknown paths, deleted files and unavailable history cannot skip consumers', () => {
  for (const files of [
    [],
    ['docs/index.md', 'package-lock.json'],
    ['some-new-config'],
    ['packages/create-mavis/templates/removed-file.vue'],
    ['.github/workflows/ci.yml'],
    ['LICENSE'],
  ]) {
    assert.equal(planChecks({ files }).integration, true, JSON.stringify(files))
  }
})

test('CLI-only changes run consumers without an unrelated performance benchmark', () => {
  const plan = planChecks({ files: ['packages/create-mavis/src/cli.mjs'] })
  assert.equal(plan.integration, true)
  assert.equal(plan.performance, false)
})

test('GitHub outputs use the real diff, including a source file renamed into docs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mavis-ci-plan-'))
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim()
  const script = fileURLToPath(new URL('../scripts/ci-plan.mjs', import.meta.url))
  try {
    git('init', '--quiet')
    git('config', 'user.name', 'CI test')
    git('config', 'user.email', 'ci-test@example.invalid')
    mkdirSync(join(directory, 'packages'), { recursive: true })
    mkdirSync(join(directory, 'docs'))
    writeFileSync(join(directory, 'packages/source.ts'), 'export const example = 1\n')
    git('add', '.')
    git('commit', '--quiet', '-m', 'initial')
    const base = git('rev-parse', 'HEAD')
    writeFileSync(join(directory, 'docs/index.md'), '# Docs\n')
    git('add', '.')
    git('commit', '--quiet', '-m', 'docs')
    const run = (output) => {
      execFileSync(process.execPath, [script], {
        cwd: directory,
        env: {
          ...process.env,
          CI_BASE: base,
          CI_HEAD: git('rev-parse', 'HEAD'),
          CI_HEAD_BRANCH: 'docs/example',
          CI_FULL: 'false',
          GITHUB_OUTPUT: join(directory, output),
          GITHUB_STEP_SUMMARY: join(directory, 'summary'),
        },
      })
      return Object.fromEntries(
        readFileSync(join(directory, output), 'utf8')
          .trim()
          .split('\n')
          .map((line) => {
            const separator = line.indexOf('=')
            return [line.slice(0, separator), JSON.parse(line.slice(separator + 1))]
          }),
      )
    }
    assert.equal(run('docs-output').integration, false)
    renameSync(join(directory, 'packages/source.ts'), join(directory, 'docs/source.ts'))
    git('add', '.')
    git('commit', '--quiet', '-m', 'move source')
    const plan = run('rename-output')
    assert.equal(plan.integration, true)
    assert.equal(plan.browsers.include.length, 2)
    assert.match(readFileSync(join(directory, 'summary'), 'utf8'), /documentation/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
