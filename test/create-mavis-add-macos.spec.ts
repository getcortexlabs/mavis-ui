import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
// @ts-expect-error The creator ships ESM.
import { planMacos, applyMacos } from '../packages/create-mavis/src/add-macos.mjs'
// @ts-expect-error The creator ships ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships ESM.
import { versions } from '../packages/create-mavis/src/capabilities.mjs'
// @ts-expect-error The creator ships ESM.
import { checkMacVersions } from '../packages/create-mavis/src/doctor.mjs'
import * as compiler from '@getcortexlabs/mavis-compiler'
const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
async function put(root: string, name: string, value: string) {
  await mkdir(dirname(join(root, name)), { recursive: true })
  await writeFile(join(root, name), value)
}
async function existing(options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'mavis-add-mac-'))
  roots.push(root)
  const { files } = await projectFiles({
    name: 'studio',
    targets: 'web,native',
    web: 'nuxt',
    example: 'directory',
    ...options,
  })
  for (const [name, text] of files) await put(root, name, text)
  return { root, files }
}
const cli = join(import.meta.dirname, '../packages/create-mavis/src/cli.mjs')

describe('add a Mac host without moving an existing application', () => {
  it.each(['npm', 'pnpm', 'yarn'])(
    'previews and applies the Nuxt + native Directory with %s',
    async (packageManager) => {
      const { root, files } = await existing({ packageManager })
      const config = JSON.parse(files.get('mavis.config.json'))
      config.schemaVersion = 1
      config.target = 'both'
      delete config.targets
      await put(root, 'mavis.config.json', JSON.stringify(config))
      await put(root, 'package-lock.json', '{"untouched":true}')
      const original = await readFile(join(root, 'package.json'), 'utf8')
      const plan = await planMacos({}, root)
      expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(original)
      expect(plan.config).toMatchObject({
        schemaVersion: 2,
        targets: ['web', 'native', 'macos'],
        web: 'nuxt',
        rendering: 'ssr',
        portability: { generate: ['macos'], startup: [{ store: 'Directory', action: 'restore' }] },
      })
      expect(plan.config.target).toBeUndefined()
      expect(
        [...plan.files.keys()].some(
          (name: string) =>
            name.startsWith('shared/') ||
            name.startsWith('apps/web/') ||
            name.startsWith('apps/mobile/'),
        ),
      ).toBe(false)
      await applyMacos(plan)
      for (const [name, text] of files)
        if (name !== 'package.json' && name !== 'mavis.config.json')
          expect(await readFile(join(root, name), 'utf8'), name).toBe(text)
      expect(await readFile(join(root, 'package-lock.json'), 'utf8')).toBe('{"untouched":true}')
      expect(await readFile(join(root, 'apps/macos/Package.swift'), 'utf8')).toContain(
        `exact: "${versions.jolt}"`,
      )
      expect(
        await readFile(join(root, 'apps/macos/Sources/MavisDesktop/App.swift'), 'utf8'),
      ).toContain('MavisServices(directoryStorage: UserDefaultsDirectoryStorage())')
      expect((await planMacos({}, root)).alreadyAdded).toBe(true)
    },
  )

  it('the default CLI is a preview; --write generates only Mac from nested original Vue sources', async () => {
    const { root } = await existing({ targets: 'web', web: 'vite', example: 'welcome' })
    await rm(join(root, 'src/shared'), { recursive: true })
    await put(
      root,
      'src/shared/screens/Home.vue',
      '<template><MScreen><MText>Nested home</MText></MScreen></template>',
    )
    const args = [
      cli,
      '--add-macos',
      '--shared-root',
      'src/shared',
      '--entry',
      'src/shared/screens/Home.vue',
      '--json',
    ]
    const preview = JSON.parse(
      execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8' }),
    )
    expect(preview.applied).toBe(false)
    expect(await readdir(root)).not.toContain('apps')
    const written = JSON.parse(
      execFileSync(process.execPath, [...args, '--write'], { cwd: root, encoding: 'utf8' }),
    )
    expect(written.applied).toBe(true)
    await symlink(join(import.meta.dirname, '../node_modules'), join(root, 'node_modules'), 'dir')
    execFileSync(process.execPath, ['scripts/generate-macos.mjs'], { cwd: root })
    const swift = await readFile(
      join(root, 'apps/macos/Sources/MavisDesktop/Generated/Home.swift'),
      'utf8',
    )
    expect(swift).toContain('Nested home')
    expect(await readdir(join(root, 'apps'))).toEqual(['macos'])
    expect(await readFile(join(root, 'src/shared/screens/Home.vue'), 'utf8')).toContain(
      'Nested home',
    )
  })

  it('accepts configured app identity, icon and minimum dimensions', async () => {
    const { root } = await existing()
    const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
    config.macos = {
      name: 'Studio & Friends',
      bundleId: 'org.example.studio',
      minWidth: 920,
      minHeight: 680,
      icon: 'assets/App.icns',
    }
    await put(root, 'mavis.config.json', JSON.stringify(config))
    await put(root, 'assets/App.icns', 'icns-placeholder')
    const plan = await planMacos({}, root)
    expect(plan.config.macos).toEqual(config.macos)
    expect(plan.files.get('scripts/macos.mjs')).toContain('settings.bundleId')
    expect(plan.files.get('apps/macos/Sources/MavisDesktop/App.swift')).toContain(
      'MavisAppConfiguration.minWidth',
    )
    await applyMacos(plan)
    await symlink(join(import.meta.dirname, '../node_modules'), join(root, 'node_modules'), 'dir')
    execFileSync(process.execPath, ['scripts/generate-macos.mjs'], { cwd: root })
    expect(
      await readFile(
        join(root, 'apps/macos/Sources/MavisDesktop/Generated/MavisAppConfiguration.swift'),
        'utf8',
      ),
    ).toContain('static let minWidth: CGFloat = 920')
  })

  it('refuses host conflicts, source edits since planning and a mismatched Jolt pin', async () => {
    const { root } = await existing()
    const plan = await planMacos({}, root)
    await put(
      root,
      'shared/Directory.vue',
      (await readFile(join(root, 'shared/Directory.vue'), 'utf8')) + '\n<!-- edited -->',
    )
    await expect(applyMacos(plan)).rejects.toThrow('changed after the preview')
    expect(await readdir(join(root, 'apps'))).not.toContain('macos')
    await put(root, 'scripts/macos.mjs', '// owned by user')
    await expect(planMacos({}, root)).rejects.toThrow('File conflict')
    await rm(join(root, 'scripts/macos.mjs'))
    const pkg = JSON.parse(await readFile(join(root, 'apps/web/package.json'), 'utf8'))
    pkg.dependencies['@rafaelaugusto/jolt'] = '^' + versions.jolt
    await put(root, 'apps/web/package.json', JSON.stringify(pkg))
    await expect(planMacos({}, root)).rejects.toThrow('Pin every existing Jolt')
  })

  it('doctor reports installed compiler and cross-platform Jolt mismatches without probing SDKs', async () => {
    const { root } = await existing()
    const plan = await planMacos({}, root)
    await applyMacos(plan)
    expect(
      (await checkMacVersions(root, plan.config, compiler)).every(
        (result: { ok: boolean }) => result.ok,
      ),
    ).toBe(true)
    const swift = await readFile(join(root, 'apps/macos/Package.swift'), 'utf8')
    await put(root, 'apps/macos/Package.swift', swift.replace(versions.jolt, '0.1.0-rc.1'))
    expect(
      (await checkMacVersions(root, plan.config, compiler)).find(
        (result: { name: string }) => result.name === 'Jolt / SwiftUI version',
      ).ok,
    ).toBe(false)
  })

  it('rolls back a cancelled write and rejects symlink destinations', async () => {
    const { root } = await existing()
    const plan = await planMacos({}, root)
    const before = await readFile(join(root, 'package.json'), 'utf8')
    const signal = {
      throwIfAborted() {
        if (++this.count > 3) throw new Error('cancelled')
      },
      count: 0,
    }
    await expect(applyMacos(plan, { signal })).rejects.toThrow('cancelled')
    expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(before)
    expect(await readdir(join(root, 'apps'))).not.toContain('macos')
    await symlink(root, join(root, 'scripts'), 'dir')
    await expect(planMacos({}, root)).rejects.toThrow('symlink')
  })
})
