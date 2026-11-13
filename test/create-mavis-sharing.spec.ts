import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const cli = resolve('packages/create-mavis/src/cli.mjs')
const temporary: string[] = []
async function temp() {
  const cwd = await realpath(await mkdtemp(join(tmpdir(), 'mavis-sharing-cli-')))
  temporary.push(cwd)
  return cwd
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((cwd) => rm(cwd, { recursive: true, force: true })))
})
const run = (cwd: string, args: string[]) =>
  execFileSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, NO_COLOR: '1', CI: 'true' },
  })
const hosts = [
  { host: 'web-vite', target: 'web', web: 'vite' },
  { host: 'web-nuxt', target: 'web', web: 'nuxt' },
  { host: 'both-vite', target: 'both', web: 'vite' },
  { host: 'both-nuxt', target: 'both', web: 'nuxt' },
  { host: 'mobile', target: 'mobile', web: 'vite' },
]
const cases = hosts.flatMap((host) =>
  ['welcome', 'directory'].flatMap((example) =>
    ['npm', 'pnpm', 'yarn'].map((packageManager) => ({ ...host, example, packageManager })),
  ),
)

describe('creator sharing and package managers', () => {
  // Each case starts two CLI processes; keep their deadline separate from fast unit tests.
  it.each(cases)(
    '$host / $example / $packageManager keeps instructions, entry and audit consistent',
    async ({ target, web, example, packageManager }) => {
      const cwd = await temp()
      const output = run(cwd, [
        'consumer',
        '--target',
        target,
        '--web',
        web,
        '--example',
        example,
        '--package-manager',
        packageManager,
        '--yes',
        '--no-install',
      ])
      const project = join(cwd, 'consumer')
      const config = JSON.parse(await readFile(join(project, 'mavis.config.json'), 'utf8'))
      expect(config).toMatchObject({ example, packageManager })
      const directory = target === 'both' ? 'shared' : web === 'nuxt' ? 'app/shared' : 'src/shared'
      const entry = `${directory}/${example === 'directory' ? 'Directory' : 'Welcome'}.vue`
      expect(output).toContain(`Make it yours: ${entry}`)
      expect(await readFile(join(project, entry), 'utf8')).toContain("from '#mavis'")
      const readme = await readFile(join(project, 'README.md'), 'utf8')
      expect(readme).toContain(entry)
      const setup = target === 'both' && packageManager !== 'yarn' ? 'run install:apps' : 'install'
      expect(readme).toContain(`${packageManager} ${setup}`)
      expect(readme).toContain(
        `${packageManager} run ${target === 'mobile' ? 'ios' : target === 'both' ? 'dev:web' : 'dev'}`,
      )
      if (target === 'both' && packageManager === 'yarn')
        expect(readme).toContain('yarn --cwd apps/mobile install')
      if (packageManager !== 'npm') expect(readme).not.toMatch(/\bnpx\b|(?<!p)npm (?:run|install)/)
      if (example === 'directory') {
        expect(readme).toContain('--check-portability')
        expect(readme).toContain('--fix-imports --write')
      }
      const audit = JSON.parse(run(project, ['--check-portability', '--json']))
      expect(audit.diagnostics).toEqual([])
      expect(audit.files).toContain(entry)
    },
    30_000,
  )

  // Five bounded CLI processes exercise preview, write and subsequent audit together.
  it('preserves JSON, path, preview and explicit-write migration through the CLI', async () => {
    const cwd = await temp()
    run(cwd, [
      'consumer',
      '--target',
      'both',
      '--example',
      'directory',
      '--package-manager',
      'pnpm',
      '--yes',
      '--no-install',
    ])
    const project = join(cwd, 'consumer')
    const target = join(project, 'shared/Extra.vue')
    const source =
      '<script setup>import { MButton } from "@getcortexlabs/mavis-web"</script><template><MButton text="Extra" /></template>'
    await writeFile(target, source)
    const audit = (extra: string[]) =>
      spawnSync(
        process.execPath,
        [cli, '--fix-imports', '--path', 'shared/Extra.vue', '--json', ...extra],
        { cwd: project, encoding: 'utf8', timeout: 10_000 },
      )
    const preview = audit([])
    expect(preview.status).toBe(1)
    const report = JSON.parse(preview.stdout)
    expect(report.fixes).toHaveLength(1)
    expect(report.written).toBe(false)
    expect(await readFile(target, 'utf8')).toBe(source)
    const applied = audit(['--write'])
    expect(JSON.parse(applied.stdout).written).toBe(true)
    expect(await readFile(target, 'utf8')).toContain('"#mavis"')
    expect(
      JSON.parse(run(project, ['--check-portability', '--path', 'shared/Extra.vue', '--json']))
        .diagnostics,
    ).toEqual([])
    const invalid = spawnSync(process.execPath, [cli, '--write'], {
      cwd: project,
      encoding: 'utf8',
      timeout: 10_000,
    })
    expect(invalid.status).toBe(1)
    expect(invalid.stderr).toContain('require --check-portability or --fix-imports')
  }, 60_000)
})
