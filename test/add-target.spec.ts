import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { Script } from 'node:vm'
// @ts-expect-error The creator ships JavaScript.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships JavaScript.
import { planTarget, applyTarget } from '../packages/create-mavis/src/add-target.mjs'

const temporary: string[] = []
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
async function fixture(host = 'vite', manager = 'npm') {
  const root = await mkdtemp(join(tmpdir(), 'mavis-adopt-'))
  temporary.push(root)
  const { files } = await projectFiles({
    name: 'existing-app',
    target: host === 'mobile' ? 'mobile' : 'web',
    web: host === 'mobile' ? 'vite' : host,
    packageManager: manager,
  })
  for (const [file, content] of files as Map<string, string>) {
    await mkdir(dirname(join(root, file)), { recursive: true })
    await writeFile(join(root, file), content)
  }
  const lock = { npm: 'package-lock.json', pnpm: 'pnpm-lock.yaml', yarn: 'yarn.lock' }[manager]!
  await writeFile(join(root, lock), 'original lockfile\n')
  files.set(lock, 'original lockfile\n')
  return { root, files: files as Map<string, string> }
}

describe('adopting another renderer in an existing application', () => {
  it.each(
    ['npm', 'pnpm', 'yarn'].flatMap((manager) =>
      ['vite', 'nuxt'].map((host) => ({ manager, host })),
    ),
  )(
    'adds native to $host with $manager and preserves existing application files',
    async ({ host, manager }) => {
      const { root, files } = await fixture(host, manager)
      const plan = await planTarget({ target: 'mobile' }, root)
      expect(plan.manager).toBe(manager)
      expect(() => new Script(plan.files.get('webpack.config.js'))).not.toThrow()
      expect(await readdir(root)).not.toContain('apps')
      await applyTarget(plan)
      for (const [file, original] of files)
        if (file !== 'package.json')
          expect(await readFile(join(root, file), 'utf8'), file).toBe(original)
      const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
      expect(pkg.scripts.build).toBe(JSON.parse(files.get('package.json')!).scripts.build)
      expect(pkg.scripts.ios).toContain(manager)
      const mobile = JSON.parse(await readFile(join(root, 'apps/mobile/package.json'), 'utf8'))
      expect(mobile.dependencies['nativescript-vue']).toBeDefined()
      expect(mobile.dependencies['@getcortexlabs/mavis-web']).toBeUndefined()
      await writeFile(join(root, 'apps/mobile/src/App.vue'), 'my custom native app')
      const repeated = await planTarget({ target: 'mobile' }, root)
      expect(repeated.alreadyAdded).toBe(true)
      await applyTarget(repeated)
      expect(await readFile(join(root, 'apps/mobile/src/App.vue'), 'utf8')).toBe(
        'my custom native app',
      )
    },
  )

  it.each(
    ['npm', 'pnpm', 'yarn'].flatMap((manager) => ['vite', 'nuxt'].map((web) => ({ manager, web }))),
  )(
    'adds $web to NativeScript with $manager without mixing renderer dependencies',
    async ({ web, manager }) => {
      const { root, files } = await fixture('mobile', manager)
      const plan = await planTarget({ target: 'web', web }, root)
      await applyTarget(plan)
      for (const [file, original] of files)
        if (file !== 'package.json') expect(await readFile(join(root, file), 'utf8')).toBe(original)
      const pkg = JSON.parse(await readFile(join(root, 'apps/web/package.json'), 'utf8'))
      expect(pkg.dependencies['@getcortexlabs/mavis-web']).toBeDefined()
      expect(pkg.dependencies['nativescript-vue']).toBeUndefined()
      expect(pkg.dependencies['@nativescript/core']).toBeUndefined()
      expect(await readFile(join(root, 'apps/web/README.md'), 'utf8')).toContain(
        `${manager} run dev:web`,
      )
    },
  )

  it.each(['MScreen', 'MColumn'])(
    'imports an existing %s screen once and reports local browser dependencies',
    async (tag) => {
      const { root } = await fixture()
      const source = `<script setup lang="ts">import './browser'</script><template><${tag}><MText>Existing</MText></${tag}></template>`
      await writeFile(join(root, 'src/Existing.vue'), source)
      await writeFile(join(root, 'src/browser.ts'), 'export const title = () => document.title')
      const plan = await planTarget({ target: 'mobile', screen: 'src/Existing.vue' }, root)
      expect(
        plan.diagnostics.some((item: { code: string }) => item.code === 'browser-global'),
      ).toBe(true)
      expect(plan.files.get('src/App.vue')).toContain('../../../src/Existing.vue')
      expect(plan.files.get('src/App.vue')).toContain(
        tag === 'MScreen' ? '<Frame><ExistingScreen /></Frame>' : '<Frame><MScreen scroll>',
      )
      await applyTarget(plan)
      expect(await readFile(join(root, 'src/Existing.vue'), 'utf8')).toBe(source)
    },
  )

  it('refuses conflicts, outside paths, symlinks and stale plans before changing application files', async () => {
    const { root, files } = await fixture()
    await expect(planTarget({ target: 'mobile', screen: '../outside.vue' }, root)).rejects.toThrow(
      'inside',
    )
    await symlink(join(root, 'src/shared/Welcome.vue'), join(root, 'src/Link.vue'))
    await expect(planTarget({ target: 'mobile', screen: 'src/Link.vue' }, root)).rejects.toThrow(
      'symlink',
    )
    const plan = await planTarget({ target: 'mobile' }, root)
    const changed = JSON.parse(files.get('package.json')!)
    changed.scripts.ios = 'custom-ios'
    await writeFile(join(root, 'package.json'), JSON.stringify(changed))
    await expect(applyTarget(plan)).rejects.toThrow('changed after planning')
    await expect(planTarget({ target: 'mobile' }, root)).rejects.toThrow('Script conflict')
    expect(await readdir(root)).not.toContain('apps')
    expect((await readdir(root)).some((name) => name.startsWith('.mavis-add-'))).toBe(false)
  })

  it('detects a pnpm host before its first install and retains its build allowlist', async () => {
    const { root } = await fixture('vite', 'pnpm')
    await rm(join(root, 'pnpm-lock.yaml'))
    const plan = await planTarget({ target: 'mobile' }, root)
    expect(plan.manager).toBe('pnpm')
    expect(plan.files.get('pnpm-workspace.yaml')).toContain('@nativescript/core')
    expect(plan.scripts.ios).toContain('pnpm')
  })

  it('CLI dry-run is read-only and exposes target, files, scripts and diagnostics as JSON', async () => {
    const { root, files } = await fixture('nuxt', 'pnpm')
    const cli = join(process.cwd(), 'packages/create-mavis/src/cli.mjs')
    const result = spawnSync(process.execPath, [cli, '--add-native', '--dry-run', '--json'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      host: 'mobile',
      manager: 'pnpm',
      directory: 'apps/mobile',
    })
    expect(await readdir(root)).not.toContain('apps')
    expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(files.get('package.json'))
  })
})
