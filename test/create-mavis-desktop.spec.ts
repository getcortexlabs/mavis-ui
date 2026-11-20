import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
// @ts-expect-error Native ESM creator.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error Native ESM creator.
import { resolvePreset, normalizeConfig } from '../packages/create-mavis/src/capabilities.mjs'
// @ts-expect-error Native ESM creator.
import { planDesktop, applyDesktop } from '../packages/create-mavis/src/add-desktop.mjs'
const temporary: string[] = []
afterEach(async () => {
  for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true })
})
async function existing() {
  const root = await mkdtemp(join(tmpdir(), 'mavis-desktop-adopt-'))
  temporary.push(root)
  const { files } = await projectFiles({ name: 'places', targets: ['web'], example: 'directory' })
  for (const [path, content] of files) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
  return root
}
describe('NativeScript desktop creator', () => {
  it('defaults new Mac projects to AppKit and preserves old SwiftUI configurations', () => {
    expect(resolvePreset({ name: 'app', targets: 'macos,windows' })).toMatchObject({
      target: 'desktop',
      authoring: 'vue',
      macosRuntime: 'appkit',
    })
    expect(resolvePreset({ name: 'app', target: 'macos' })).toMatchObject({
      target: 'macos',
      macosRuntime: 'swiftui',
    })
    expect(
      normalizeConfig({ schemaVersion: 2, targets: ['macos'], authoring: 'vue' }),
    ).toMatchObject({ target: 'macos', macosRuntime: 'swiftui' })
    expect(() =>
      resolvePreset({ name: 'app', targets: 'macos,windows', macosRuntime: 'swiftui' }),
    ).toThrow('Create the SwiftUI app separately')
  })
  it.each(['npm', 'pnpm', 'yarn'])(
    'isolates both native runtimes with %s and includes every generated entry',
    async (packageManager) => {
      for (const example of ['welcome', 'directory']) {
        const { preset, files } = await projectFiles({
          name: 'studio',
          targets: 'web,native,macos,windows',
          packageManager,
          example,
        })
        expect(preset.mode).toBe('direct')
        for (const target of ['macos', 'windows']) {
          const pkg = JSON.parse(files.get(`apps/${target}/package.json`))
          expect(pkg.os).toEqual([target === 'macos' ? 'darwin' : 'win32'])
          expect(pkg.dependencies).toHaveProperty(
            target === 'macos' ? '@nativescript/macos-node-api' : '@nativescript/windows-napi',
          )
          expect(pkg.dependencies).not.toHaveProperty(
            target === 'macos' ? '@nativescript/windows-napi' : '@nativescript/macos-node-api',
          )
          expect(files.get(`apps/${target}/src/main.ts`)).toContain('#shared-ui/')
          expect(files.get(`apps/${target}/package.mjs`)).toBeDefined()
        }
        expect(
          [...files.values()].every((value) => typeof value === 'string' || Buffer.isBuffer(value)),
        ).toBe(true)
        expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
        expect([...files.keys()].some((path) => path.includes('\\'))).toBe(false)
        expect(JSON.parse(files.get('package.json')).scripts).toHaveProperty('package:windows')
        expect(files.get('scripts/install-apps.mjs')).toContain(
          'host.platform !== process.platform',
        )
      }
    },
  )
  it.each(['macos', 'windows'])(
    'adopts Directory on %s without rewriting shared sources, and is idempotent',
    async (target) => {
      const root = await existing(),
        original = await readFile(join(root, 'src/shared/Directory.vue'), 'utf8')
      const plan = await planDesktop({ target }, root)
      expect(plan.files.has(`apps/${target}/src/main.ts`)).toBe(true)
      expect(plan.files.has('src/shared/Directory.vue')).toBe(false)
      await applyDesktop(plan)
      expect(await readFile(join(root, 'src/shared/Directory.vue'), 'utf8')).toBe(original)
      expect((await planDesktop({ target }, root)).alreadyAdded).toBe(true)
    },
  )
  it('rejects unsupported components and concurrent source edits before applying', async () => {
    const root = await existing()
    const entry = join(root, 'src/shared/Directory.vue')
    const plan = await planDesktop({ target: 'windows' }, root)
    await writeFile(entry, '<template><MButton icon="plus">Unsupported</MButton></template>')
    await expect(applyDesktop(plan)).rejects.toThrow('changed after the preview')
    await expect(planDesktop({ target: 'windows' }, root)).rejects.toThrow('MButton.icon')
  })
  it('rolls back cancellation and refuses a symlink destination', async () => {
    const root = await existing()
    const plan = await planDesktop({ target: 'windows' }, root)
    const controller = new AbortController()
    controller.abort()
    await expect(applyDesktop(plan, { signal: controller.signal })).rejects.toThrow()
    await expect(readFile(join(root, 'apps/windows/package.json'))).rejects.toHaveProperty(
      'code',
      'ENOENT',
    )
    await mkdir(join(root, 'apps'), { recursive: true })
    await symlink(tmpdir(), join(root, 'apps/windows'))
    await expect(planDesktop({ target: 'windows' }, root)).rejects.toThrow('symlink')
  })
})

describe('direct native framework creator', () => {
  it.each(['plain', 'react', 'angular', 'svelte', 'solid'])(
    'generates only the %s adapter and keeps platform constraints explicit',
    async (framework) => {
      const { files, preset } = await projectFiles({ name: 'phone', targets: 'native', framework })
      const pkg = JSON.parse(files.get('package.json'))
      expect(preset.apps.native.framework).toBe(framework)
      expect(files.get('src/screen.ts')).toBeDefined()
      for (const name of ['vue', 'nativescript-vue', '@getcortexlabs/mavis-web'])
        expect(pkg.dependencies).not.toHaveProperty(name)
      for (const other of ['react', 'angular', 'svelte', 'solid'].filter(
        (other) => other !== framework,
      ))
        expect(pkg.dependencies).not.toHaveProperty(`@getcortexlabs/mavis-${other}-nativescript`)
      expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
      expect(() => resolvePreset({ name: 'app', targets: 'windows', framework })).toThrow(
        'iOS/Android starter only',
      )
    },
  )
})
