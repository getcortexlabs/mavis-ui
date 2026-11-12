import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  inspectSource,
  checkPortability,
  formatMacReadiness,
  // @ts-expect-error The CLI ships native JavaScript.
} from '../packages/create-mavis/src/portability.mjs'
// @ts-expect-error The CLI ships native JavaScript.
import { scaffold, projectFiles } from '../packages/create-mavis/src/scaffold.mjs'

// @ts-expect-error The CLI ships native JavaScript.
import { components as portableComponents } from '../packages/create-mavis/src/shared-api.mjs'
import { componentNames } from '../packages/core/src/capabilities.js'

describe('portability audit and import migration', () => {
  it('keeps import migration aligned with every supported shared component', () => {
    expect([...portableComponents].sort()).toEqual([...componentNames].sort())
  })
  it.each(['ts', 'mts', 'cts'])(
    'parses valid .%s generics and angle-bracket assertions as TypeScript',
    (extension) => {
      const source =
        'export const identity = <T>(value: T): T => value\nconst value = <number>1\nexport const browser = () => document.title\n'
      const result = inspectSource(source, `valid.${extension}`)
      expect(result.diagnostics.filter((item: { code: string }) => item.code === 'parse')).toEqual(
        [],
      )
      expect(
        result.diagnostics.filter((item: { code: string }) => item.code === 'browser-global'),
      ).toHaveLength(1)
    },
  )
  it('honors Vue script language while preserving TSX/JSX and real syntax errors', () => {
    const source =
      '<script setup lang="ts">const identity = <T>(value: T) => value; const one = <number>1</script><template><MText>{{ identity(one) }}</MText></template>'
    expect(inspectSource(source, 'Valid.vue').diagnostics).toEqual([])
    for (const [file, code] of [
      ['valid.tsx', 'export const view = <MText>Hello</MText>'],
      ['valid.jsx', 'export const view = <MText>Hello</MText>'],
    ])
      expect(
        inspectSource(code, file).diagnostics.filter(
          (item: { code: string }) => item.code === 'parse',
        ),
      ).toEqual([])
    expect(
      inspectSource('const broken = (', 'Invalid.ts').diagnostics.some(
        (item: { code: string }) => item.code === 'parse',
      ),
    ).toBe(true)
    expect(
      inspectSource(
        '<script setup lang="tsx">const identity = <T>(value: T) => value</script>',
        'Invalid.vue',
      ).diagnostics.some((item: { code: string }) => item.code === 'parse'),
    ).toBe(true)
  })
  it('finds browser dependencies, HTML, CSS and router imports without scanning strings/comments as code', () => {
    const source = `<script setup lang="ts">\nimport { MButton as Button } from '@getcortexlabs/mavis-web'\nimport { useRouter } from 'vue-router'\nconst text = 'document.body' // window.location\nfunction local(window: { title: string }) { return window.title }\ndocument.title = text\nconst value = globalThis.localStorage.getItem('x')\n</script>\n<template><div class="box"><Button @click.stop="local" /></div></template>\n<style scoped>.box { display: grid }</style>`
    const result = inspectSource(source, 'Screen.vue')
    expect(
      result.diagnostics.filter((d: { code: string }) => d.code === 'browser-global'),
    ).toHaveLength(2)
    expect(result.diagnostics.map((d: { code: string }) => d.code)).toEqual(
      expect.arrayContaining([
        'renderer-import',
        'platform-import',
        'element',
        'styling',
        'css',
        'dom-directive',
      ]),
    )
    expect(result.edits).toHaveLength(1)
    expect(
      result.diagnostics.find((d: { code: string }) => d.code === 'renderer-import').line,
    ).toBe(2)
  })
  it('checks template expressions while respecting script-local browser-like names', () => {
    const global = inspectSource(
      '<template><MText>{{ document.title }}</MText></template>',
      'Screen.vue',
    )
    expect(global.diagnostics.map((item: { code: string }) => item.code)).toContain(
      'browser-global',
    )
    const local = inspectSource(
      '<script setup>const document = { title: "Local data" }</script><template><MText>{{ document.title }}</MText></template>',
      'Screen.vue',
    )
    expect(local.diagnostics).toEqual([])
  })
  it('does not migrate mixed Web-only exports, default imports, namespaces or re-exports', () => {
    for (const statement of [
      "import { MButton, useMavisTokens } from '@getcortexlabs/mavis-web'",
      "import * as Mavis from '@getcortexlabs/mavis-web'",
      "import Mavis from '@getcortexlabs/mavis-web'",
      "export { MButton } from '@getcortexlabs/mavis-web'",
    ])
      expect(inspectSource(statement, 'screen.ts').edits).toEqual([])
  })
  it('generates the same reference screens for Vite, Nuxt and mobile with host aliases and no audit findings', async () => {
    const plans = await Promise.all(
      ['vite', 'nuxt'].map((web) =>
        projectFiles({ name: 'reference', target: 'both', web, example: 'directory' }),
      ),
    )
    const shared = (plan: { files: Map<string, string> }) =>
      [...plan.files].filter(([path]) => path.startsWith('shared/'))
    expect(shared(plans[0])).toEqual(shared(plans[1]))
    for (const [file, source] of shared(plans[0]))
      expect(inspectSource(source, file).diagnostics, file).toEqual([])
    for (const plan of plans) {
      expect(plan.files.get('apps/mobile/webpack.config.js')).toContain('#mavis$')
      expect(plan.files.get('apps/mobile/tsconfig.json')).toContain('#mavis')
      for (const source of plan.files.values()) expect(source).not.toContain('__MAVIS_')
    }
  })
  it('follows local dependencies, previews then migrates only safe imports, and refuses symlinks', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'mavis-portability-'))
    try {
      const plan = await scaffold({ name: 'reference', target: 'both', example: 'directory' }, temp)
      const root = plan.destination
      const target = join(root, 'shared/Extra.ts')
      const source =
        "import { MButton as Button } from '@getcortexlabs/mavis-web'\nimport './helper'\nexport { Button }\n"
      await writeFile(target, source)
      await writeFile(join(root, 'shared/helper.ts'), 'export const value = () => document.title\n')
      const preview = await checkPortability(root, { path: 'shared/Extra.ts', fixImports: true })
      expect(preview.files).toContain('shared/helper.ts')
      expect(preview.fixes).toHaveLength(1)
      expect(await readFile(target, 'utf8')).toBe(source)
      const applied = await checkPortability(root, {
        path: 'shared/Extra.ts',
        fixImports: true,
        write: true,
      })
      expect(applied.written).toBe(true)
      expect(await readFile(target, 'utf8')).toContain("import { MButton as Button } from '#mavis'")
      expect(applied.diagnostics.map((d: { code: string }) => d.code)).toContain('browser-global')
      await symlink(join(root, 'shared/helper.ts'), join(root, 'shared/linked.ts'))
      await expect(checkPortability(root)).rejects.toThrow('symlink')
      await expect(checkPortability(root, { path: '../' })).rejects.toThrow('inside')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
  it('says which shared files are ready for the Mac target, and why the others are not', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'mavis-mac-ready-'))
    type Readiness = {
      checked: boolean
      files: { file: string; ready: boolean; problems: { line?: number; message: string }[] }[]
    }
    const summary = ({ files }: Readiness) =>
      files.map((item) => [item.file, item.ready, item.problems[0]?.message ?? ''])
    try {
      // The reference screens run on the Web and NativeScript today; the Mac is not there yet.
      const directory = await scaffold(
        { name: 'reference', target: 'both', example: 'directory' },
        temp,
      )
      const reference = await checkPortability(directory.destination)
      expect(reference.diagnostics).toEqual([])
      expect(reference.macos.checked).toBe(true)
      expect(summary(reference.macos)).toEqual([
        [
          'shared/Details.vue',
          false,
          expect.stringContaining('MButton does not take href on the Mac'),
        ],
        [
          'shared/directory-store.ts',
          false,
          expect.stringContaining(
            'A store declares state with ref, values with computed and functions',
          ),
        ],
        [
          'shared/Directory.vue',
          false,
          expect.stringContaining('MCard does not take href on the Mac'),
        ],
        [
          'shared/Edit.vue',
          false,
          expect.stringContaining(
            'It uses shared/directory-store.ts, which is not ready for the Mac',
          ),
        ],
        [
          'shared/routes.ts',
          false,
          expect.stringContaining('reaches the Mac with navigation (#341)'),
        ],
      ])
      expect(reference.macos.files[2].problems[0]).toMatchObject({
        line: expect.any(Number),
        column: expect.any(Number),
      })
      expect(formatMacReadiness(reference.macos)).toContain(
        'Mac target (experimental): 0 of 5 shared files are ready to compile.',
      )

      // A project with a Mac target reads both formats with the compiler it ships.
      const mac = await scaffold({ name: 'light', targets: 'web,macos' }, temp)
      const shared = join(mac.destination, 'shared')
      const sfc = (script: string, template: string) =>
        `<script setup lang="ts">\n${script}\n</script>\n<template>\n${template}\n</template>\n`
      await writeFile(
        join(shared, 'Good.vue'),
        sfc(
          "import { ref } from 'vue'\nimport { MText } from '#mavis'\nconst n = ref(0)",
          '  <MText>{{ n }}</MText>',
        ),
      )
      await writeFile(
        join(shared, 'Bad.vue'),
        sfc("import Good from './Good.vue'", '  <div><Good /></div>'),
      )
      await writeFile(
        join(shared, 'Uses.vue'),
        sfc("import Bad from './Bad.vue'", '  <MColumn><Bad /></MColumn>'),
      )
      const checked = await checkPortability(mac.destination)
      expect(checked.files).toEqual(['shared/Bad.vue', 'shared/Good.vue', 'shared/Uses.vue'])
      expect(checked.diagnostics.map((item: { code: string }) => item.code)).toEqual(['element'])
      expect(summary(checked.macos)).toEqual([
        [
          'shared/Bad.vue',
          false,
          expect.stringContaining(
            '<div> is an HTML element, which a shared screen cannot use on the Mac',
          ),
        ],
        ['shared/Good.vue', true, ''],
        ['shared/Uses.vue', false, 'It shows shared/Bad.vue, which is not ready for the Mac.'],
        ['shared/Welcome.lite.tsx', true, ''],
      ])
      expect(formatMacReadiness(checked.macos)).toMatch(
        /2 of 4 shared files are ready to compile\.\n  not ready  shared\/Bad\.vue\n {13}5:3 <div> is an HTML element/,
      )
      const one = await checkPortability(mac.destination, { path: 'shared/Good.vue' })
      expect(summary(one.macos)).toEqual([['shared/Good.vue', true, '']])
      await expect(checkPortability(mac.destination, { fixImports: true })).rejects.toThrow(
        'Import migrations are not supported',
      )
      expect(formatMacReadiness({ checked: false, reason: 'Install first.' })).toBe(
        'Mac target (experimental): not checked. Install first.',
      )
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
  it('requires alias configuration before writing and does not rewrite syntax errors', async () => {
    const temp = await mkdtemp(join(tmpdir(), 'mavis-migration-'))
    try {
      await mkdir(join(temp, 'src/shared'), { recursive: true })
      const file = join(temp, 'src/shared/a.ts')
      await writeFile(file, "import { MButton } from '@getcortexlabs/mavis-web'\n")
      await expect(checkPortability(temp, { fixImports: true, write: true })).rejects.toThrow(
        'alias',
      )
      expect(await readFile(file, 'utf8')).toContain('mavis-web')
      const plan = await scaffold({ name: 'broken' }, temp)
      await writeFile(
        join(plan.destination, 'src/shared/broken.ts'),
        "import { MButton } from '@getcortexlabs/mavis-web'; const broken = (",
      )
      await expect(
        checkPortability(plan.destination, { fixImports: true, write: true }),
      ).rejects.toThrow('syntax')
    } finally {
      await rm(temp, { recursive: true, force: true })
    }
  })
})
