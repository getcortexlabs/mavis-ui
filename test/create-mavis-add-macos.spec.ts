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

async function asPublishedDirectory(root: string) {
  for (const name of [
    'directory-store.ts',
    'Edit.vue',
    'Directory.vue',
    'Details.vue',
    'routes.ts',
  ])
    await put(
      root,
      `shared/${name}`,
      await readFile(
        join(
          import.meta.dirname,
          'fixtures/directory-rc13/shared',
          name === 'routes.ts' ? name + '.txt' : name,
        ),
        'utf8',
      ),
    )
  for (const [host, source, destination, adapter] of [
    ['web', 'nuxt/app/plugins/mavis.ts', 'app/plugins/mavis.ts', 'app/utils/directory-storage.ts'],
    ['mobile', 'mobile/src/app.ts', 'src/app.ts', 'src/directory-storage.ts'],
  ]) {
    const legacy = await readFile(
      join(import.meta.dirname, 'fixtures/directory-rc13', source! + '.txt'),
      'utf8',
    )
    await put(
      root,
      `apps/${host}/${destination}`,
      legacy
        .replaceAll('__MAVIS_SHARED__', '#shared-ui')
        .replaceAll('__MAVIS_APPEARANCE__', 'light'),
    )
    await rm(join(root, `apps/${host}/${adapter}`))
  }
}

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

  it('previews the same assets and source root that generation uses with multiple roots', async () => {
    const { root } = await existing({ targets: 'web', web: 'vite', example: 'welcome' })
    await rm(join(root, 'src/shared'), { recursive: true })
    await mkdir(join(root, 'src/design'))
    await put(root, 'src/shared/assets/logo.png', 'fixture-image')
    await put(
      root,
      'src/shared/Home.vue',
      '<template><MScreen><MImage src="~/assets/logo.png" alt="Studio" /></MScreen></template>',
    )
    const config = JSON.parse(await readFile(join(root, 'mavis.config.json'), 'utf8'))
    config.portability = {
      roots: ['src/design', 'src/shared'],
      sourceRoot: 'src/shared',
      entry: 'src/shared/Home.vue',
    }
    await put(root, 'mavis.config.json', JSON.stringify(config))
    const plan = await planMacos({}, root)
    expect(plan.config.portability.sourceRoot).toBe('src/shared')
    await applyMacos(plan)
    await symlink(join(import.meta.dirname, '../node_modules'), join(root, 'node_modules'), 'dir')
    execFileSync(process.execPath, ['scripts/generate-macos.mjs'], { cwd: root })
    expect(
      await readFile(
        join(root, 'apps/macos/Sources/MavisDesktop/Generated/Assets/logo.png'),
        'utf8',
      ),
    ).toBe('fixture-image')
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

  it('offers an explicit byte-matched migration for the actual published RC.13 Directory sources', async () => {
    const { root } = await existing()
    await asPublishedDirectory(root)
    const original = await readFile(join(root, 'shared/directory-store.ts'), 'utf8')
    await expect(planMacos({}, root)).rejects.toThrow('--migrate-directory')
    const preview = await planMacos({ migrateDirectory: true }, root)
    expect(await readFile(join(root, 'shared/directory-store.ts'), 'utf8')).toBe(original)
    expect(preview.migration.map((diff: { file: string }) => diff.file).sort()).toEqual([
      'apps/mobile/src/app.ts',
      'apps/mobile/src/directory-storage.ts',
      'apps/web/app/plugins/mavis.ts',
      'apps/web/app/utils/directory-storage.ts',
      'shared/Edit.vue',
      'shared/directory-store.ts',
    ])
    expect(
      preview.migration.find((diff: { file: string }) => diff.file === 'shared/directory-store.ts')
        .before,
    ).toBe(original)
    expect(
      preview.migration.find((diff: { file: string }) => diff.file === 'shared/directory-store.ts')
        .after,
    ).toContain('rename(id: string, name: string)')
    await applyMacos(preview)
    await symlink(join(import.meta.dirname, '../node_modules'), join(root, 'node_modules'), 'dir')
    execFileSync(process.execPath, ['scripts/generate-macos.mjs'], { cwd: root })
    expect(
      await readFile(
        join(root, 'apps/macos/Sources/MavisDesktop/Generated/MavisStores.swift'),
        'utf8',
      ),
    ).toContain('protocol DirectoryStorage')
    expect(await readFile(join(root, 'apps/web/app/plugins/mavis.ts'), 'utf8')).toContain(
      'onNuxtReady',
    )
    expect((await planMacos({ migrateDirectory: true }, root)).alreadyAdded).toBe(true)
  })

  it('never rewrites a customized legacy store or partially migrates an added consumer', async () => {
    const { root } = await existing()
    const source = await readFile(
      join(import.meta.dirname, 'fixtures/directory-rc13/shared/directory-store.ts'),
      'utf8',
    )
    await put(root, 'shared/directory-store.ts', source + '\n// project customization\n')
    await expect(planMacos({ migrateDirectory: true }, root)).rejects.toThrow(
      'differs from the published RC.13 template',
    )
    expect(await readFile(join(root, 'shared/directory-store.ts'), 'utf8')).toContain(
      'project customization',
    )
    expect(await readdir(join(root, 'apps'))).not.toContain('macos')
    await asPublishedDirectory(root)
    await put(
      root,
      'apps/web/app/other.ts',
      "import { createDirectory } from '#shared-ui/directory-store'\nexport const extra = createDirectory",
    )
    await expect(planMacos({ migrateDirectory: true }, root)).rejects.toThrow('additional consumer')
    expect(await readFile(join(root, 'shared/directory-store.ts'), 'utf8')).toBe(source)
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
