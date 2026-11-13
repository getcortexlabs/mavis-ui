import { describe, expect, it } from 'vitest'
import { readFile, readdir, mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { startupPlan } from '../packages/create-mavis/templates/macos/scripts/portable/startup.mjs'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
const compile = (files: Record<string, string>, root = 'Home') =>
  compileProject(new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text])), {
    root,
  })

describe('the actual directory screens', () => {
  it('generates identical guarded views from the replay fixtures', async () => {
    const fixture = async (name: string) =>
      compileProject(await readShared(join(import.meta.dirname, 'portable', name)), {
        root: 'GuardedRecord',
      })
    const vue = await fixture('guardedRecordVue')
    const tsx = await fixture('guardedRecord')
    expect((vue.swift.get('GuardedRecord.swift') as string).split('\n').slice(1)).toEqual(
      (tsx.swift.get('GuardedRecord.swift') as string).split('\n').slice(1),
    )
  })

  it('compiles the complete routed example without rewriting the screens', async () => {
    const root = join(import.meta.dirname, '../packages/create-mavis/templates/directory/shared')
    const files = Object.fromEntries(
      await Promise.all(
        (await readdir(root)).map(async (name) => [name, await readFile(join(root, name), 'utf8')]),
      ),
    )
    const output = await compile(files, 'Directory')
    expect(output.swift.get('Directory.swift')).toContain(
      '.lowercased(with: Locale(identifier: "en"))',
    )
    expect(output.swift.get('Details.swift')).toContain('if let mavisValue = self.entry')
    expect(output.swift.get('Details.swift')).toContain('(mavisValue).name')
    expect(output.swift.get('Edit.swift')).toContain('EditMavisState')
  })

  it('narrows only the checked view branch and preserves the expression in generated Vue', async () => {
    const output = await compile({
      'Home.vue': `<script setup lang="ts">
import { computed, ref } from 'vue'
type Item = { id: string; name: string }
const items = ref<Item[]>([{ id: 'one', name: 'First' }])
const item = computed(() => items.value.find(value => value.id === 'one'))
</script><template><MColumn><MText v-if="item">{{ item.name }}</MText><MText v-else>Missing</MText></MColumn></template>`,
    })
    expect(output.swift.get('Home.swift')).toContain('if let mavisValue = self.item')
    const invalid = `<script setup lang="ts">import { ref } from 'vue'
type Item = { name: string }
const item = ref<Item | undefined>(undefined)
</script><template><MColumn><MText v-if="item">{{ item.name }}</MText><MText v-else>{{ item.name }}</MText></MColumn></template>`
    await expect(compile({ 'Home.vue': invalid })).rejects.toThrow()
  })

  it('shares the guarded branch model with TSX', async () => {
    const output = await compile({
      'Home.lite.tsx': `import { useStore, Show } from '@builder.io/mitosis'
type Item = { id: string; name: string }
export default function Home() {
  const state = useStore({ items: [{ id: 'one', name: 'First' }] as Item[], get item() { return state.items.find(value => value.id === 'one') } })
  return <MColumn><Show when={state.item !== undefined}><MText>{state.item!.name}</MText></Show></MColumn>
}`,
    })
    expect(output.swift.get('Home.swift')).toContain('if let mavisValue = self.item')
    expect(output.vue.get('Home.vue')).toContain('(state.item).name')
  })
})

describe('Directory with the Mac entry', () => {
  const targets = ['macos', 'web,macos', 'native,macos', 'web,native,macos']
  it.each(
    targets.flatMap((target) =>
      ['npm', 'pnpm', 'yarn'].map((packageManager) => [target, packageManager]),
    ),
  )('scaffolds %s with %s and preserves the shared source', async (targets, packageManager) => {
    const { preset, files } = await projectFiles({
      name: 'places',
      targets,
      packageManager,
      example: 'directory',
    })
    expect(preset).toMatchObject({
      authoring: 'vue',
      mode: 'portable',
      execution: 'generated',
      availability: 'repository',
    })
    const config = JSON.parse(files.get('mavis.config.json'))
    expect(config.portability).toMatchObject({
      entry: 'Directory',
      startup: [{ store: 'Directory', action: 'restore' }],
    })
    expect(files.get('shared/Directory.vue')).toBe(
      await readFile(
        join(
          import.meta.dirname,
          '../packages/create-mavis/templates/directory/shared/Directory.vue',
        ),
        'utf8',
      ),
    )
    expect(files.get('apps/macos/Sources/MavisDesktop/App.swift')).toContain(
      'MavisEntry(services: MavisServices(directoryStorage: UserDefaultsDirectoryStorage()))',
    )
    expect(files.get('apps/macos/Sources/MavisDesktop/DirectoryStorage.swift')).toContain(
      'mavis:directory',
    )
    expect(files.get('README.md')).toContain(`${packageManager} run generate`)
    expect(files.get('README.md')).toContain('Vue screens and typed stores')
    if (targets.includes('web')) {
      expect(
        JSON.parse(files.get('apps/web/package.json')).dependencies['vue-router'],
      ).toBeDefined()
      expect(files.get('apps/web/index.html')).toContain('/src/main.ts')
      expect(files.has('apps/web/src/main.js')).toBe(false)
      expect(files.get('apps/web/src/main.ts')).toContain('void directory.restore()')
    }
    if (targets.includes('native')) {
      expect(
        JSON.parse(files.get('apps/mobile/package.json')).dependencies['vue-router-ns'],
      ).toBeDefined()
      expect(files.get('apps/mobile/src/app.ts')).toContain('ApplicationSettings')
      expect(files.get('apps/mobile/src/app.ts')).toContain('void directory.restore()')
    }
    expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
  })

  it('runs the generated compiler and writes services, routes and identity scoped startup before any UI build', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mavis-directory-entry-'))
    try {
      const { files } = await projectFiles({
        name: 'places',
        targets: 'web,native,macos',
        example: 'directory',
      })
      for (const [name, content] of files) {
        const path = join(directory, name)
        await mkdir(dirname(path), { recursive: true })
        await writeFile(path, content)
      }
      await symlink(
        join(import.meta.dirname, '../node_modules'),
        join(directory, 'node_modules'),
        'dir',
      )
      execFileSync(process.execPath, ['scripts/generate.mjs'], { cwd: directory, stdio: 'pipe' })
      const generated = join(directory, 'apps/macos/Sources/MavisDesktop/Generated')
      const entry = await readFile(join(generated, 'MavisEntry.swift'), 'utf8')
      expect(entry).toContain('MavisEntryStartup(content: MavisNavigationHost())')
      expect(entry).toContain('.mavisServices(services)')
      expect(entry).toContain('@StateObject private var startup = MavisEntryStartupState()')
      expect(entry).toContain(
        'guard !started else { return }\n        started = true\n        start()',
      )
      expect(entry).toContain('await store0.restore()')
      expect(await readFile(join(generated, 'MavisNavigation.swift'), 'utf8')).toContain(
        'Details(id: id)',
      )
      expect(await readFile(join(generated, 'MavisStores.swift'), 'utf8')).toContain(
        'directoryStorage: any DirectoryStorage',
      )
      const config = JSON.parse(await readFile(join(directory, 'mavis.config.json'), 'utf8'))
      config.portability.startup.push({ store: 'Directory', action: 'restore' })
      await writeFile(join(directory, 'mavis.config.json'), JSON.stringify(config))
      expect(() =>
        execFileSync(process.execPath, ['scripts/generate.mjs'], { cwd: directory, stdio: 'pipe' }),
      ).toThrow()
      expect(await readFile(join(generated, 'MavisEntry.swift'), 'utf8')).toBe(entry)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)

  it('rejects startup actions whose values, arguments or errors have no owner', () => {
    const action = { name: 'restore', params: [], body: [] }
    const model = (overrides = {}) => ({
      modules: [
        {
          stores: [
            {
              name: 'Directory',
              actions: [{ ...action, ...overrides }],
              shares: [{ name: 'restore', kind: 'action' }],
            },
          ],
        },
      ],
    })
    const startup = [{ store: 'Directory', action: 'restore' }]
    expect(startupPlan(model(), startup)).toEqual([
      { store: 'Directory', action: 'restore', async: false },
    ])
    for (const override of [
      { params: [{ name: 'id' }] },
      { throws: true },
      { returns: { k: 'string' } },
    ])
      expect(() => startupPlan(model(override), startup)).toThrow('handle its own errors')
    for (const invalid of [
      null,
      {},
      [{ store: 'Missing', action: 'restore' }],
      [{ store: 'Directory', action: 'restore', extra: true }],
    ])
      expect(() => startupPlan(model(), invalid)).toThrow()
  })
})
