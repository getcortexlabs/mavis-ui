import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships ESM.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const roots: string[] = []
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})
async function project(files: Map<string, string>) {
  const root = await mkdtemp(join(tmpdir(), 'mavis-roots-'))
  roots.push(root)
  for (const [name, text] of files) {
    await mkdir(dirname(join(root, name)), { recursive: true })
    await writeFile(join(root, name), text)
  }
  return root
}
const nested = (format: 'vue' | 'lite.tsx', root = 'shared') =>
  new Map([
    [`${root}/values/labels.ts`, "export const title = 'Nested source'"],
    [
      `${root}/values/caption.ts`,
      "import { title } from './labels'\nexport function caption(): string { return title }",
    ],
    [
      `${root}/components/Caption.${format}`,
      format === 'vue'
        ? `<script setup lang="ts">import { caption } from '../values/caption'\n</script><template><MText>{{ caption() }}</MText></template>`
        : `import { caption } from '../values/caption'\nexport default function Caption() { return <MText>{caption()}</MText> }`,
    ],
    [
      `${root}/screens/Home.${format}`,
      format === 'vue'
        ? `<script setup lang="ts">import Caption from '../components/Caption.vue'\n</script><template><MColumn><Caption /></MColumn></template>`
        : `import Caption from '../components/Caption.lite'\nexport default function Home() { return <MColumn><Caption /></MColumn> }`,
    ],
  ])

describe('configured shared source roots', () => {
  it.each(['vue', 'lite.tsx'] as const)(
    'reads nested %s files and emits imports and Swift names without moving sources',
    async (format) => {
      const files = nested(format)
      const root = await project(files)
      const read = await readShared(root)
      expect([...read.keys()].sort()).toEqual([...files.keys()].sort())
      const result = await compileProject(read, { root: `shared/screens/Home.${format}` })
      expect(
        result.model.components.map((component: { name: string }) => component.name).sort(),
      ).toEqual(['Caption', 'Home'])
      expect(result.swift.has('ValuesCaptionModule.swift')).toBe(true)
      expect(result.swift.get('Caption.swift')).toContain('ValuesCaptionModule.caption()')
      if (format === 'lite.tsx')
        expect(result.vue.get('Caption.vue')).toContain("from '#shared-ui/values/caption'")
      else expect(result.direct).toContain('shared/screens/Home.vue')
    },
  )

  it('preserves custom root paths for diagnostics and chooses only configured roots', async () => {
    const files = nested('vue', 'src/ui')
    files.set('server/secret.ts', 'export const secret = document.cookie')
    const root = await project(files)
    const read = await readShared(root, { roots: ['src/ui'] })
    expect(read.has('server/secret.ts')).toBe(false)
    const result = await compileProject(read, {
      root: 'src/ui/screens/Home.vue',
      sourceRoot: 'src/ui',
    })
    expect(result.direct).toContain('src/ui/screens/Home.vue')
    read.set(
      'src/ui/screens/Home.vue',
      '<script setup lang="ts">const x = document.title\n</script><template><MText>{{ x }}</MText></template>',
    )
    await expect(compileProject(read, { root: 'src/ui/screens/Home.vue' })).rejects.toThrow(
      'src/ui/screens/Home.vue:1:',
    )
  })

  it('resolves a route table beside nested screens and rejects duplicate Swift component names', async () => {
    const files = nested('vue')
    files.set(
      'shared/screens/Home.vue',
      files.get('shared/screens/Home.vue')!.replaceAll('MColumn', 'MScreen'),
    )
    files.set(
      'shared/routes.ts',
      "import Home from './screens/Home.vue'\nexport const routes = [{ path: '/', component: Home }]",
    )
    const result = await compileProject(files, { root: 'Home' })
    expect(result.model.navigation.home).toBe('Home')
    files.set('shared/other/Home.vue', '<template><MText>Duplicate</MText></template>')
    await expect(compileProject(files, { root: 'Home' })).rejects.toThrow('Home is already defined')
  })

  it('resolves nested stores and retains shared service contracts', async () => {
    const source = await readShared(new URL('./portable/notesVue', import.meta.url).pathname)
    const files = new Map<string, string>(
      [...source].map(([name, text]: [string, string]) =>
        name.endsWith('.ts')
          ? ['src/shared/stores/notes.ts', text]
          : ['src/shared/screens/Notes.vue', text.replace("'./notes'", "'../stores/notes'")],
      ),
    )
    const result = await compileProject(files, { root: 'src/shared/screens/Notes.vue' })
    expect(result.swift.has('MavisStores.swift')).toBe(true)
    expect(result.swift.get('Notes.swift')).toContain('NotesStore')
  })

  it('rejects escaping and linked roots before reading their contents', async () => {
    const root = await project(nested('vue'))
    await expect(readShared(root, { roots: ['../elsewhere'] })).rejects.toThrow(
      'inside the project',
    )
    await mkdir(join(root, 'nested'))
    await symlink(join(root, 'shared'), join(root, 'nested/link'))
    await expect(readShared(root, { roots: ['nested/link/screens'] })).rejects.toThrow('symlink')
    await expect(compileProject(nested('vue'), { root: 'shared/Unknown.vue' })).rejects.toThrow(
      'not in portability.roots',
    )
  })
})
