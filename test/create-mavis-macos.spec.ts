import { describe, expect, it } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
// @ts-expect-error The creator ships native ESM.
import { projectSummary, nextSteps, sharedEntry } from '../packages/create-mavis/src/ui.mjs'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const template = new URL('../packages/create-mavis/templates/macos/', import.meta.url).pathname
const source = await readFile(join(template, 'shared/Welcome.lite.tsx'), 'utf8')
const portable = new URL('./portable/', import.meta.url).pathname
const fixtures = (await readdir(portable)).sort()

const welcome = (text = source) => new Map([['shared/Welcome.lite.tsx', text]])
async function fixture(name: string) {
  const files: Map<string, string> = await readShared(join(portable, name))
  const { root } = JSON.parse(await readFile(join(portable, name, 'steps.json'), 'utf8'))
  return { files, root }
}

describe('experimental macOS starter', () => {
  it.each(['npm', 'pnpm', 'yarn'])(
    'plans the portable compiler and two hosts with %s instructions',
    async (packageManager) => {
      const { preset, files } = await projectFiles({
        name: 'first-light',
        target: 'macos',
        packageManager,
      })
      const pkg = JSON.parse(files.get('package.json'))
      expect(preset.authoring).toBe('mitosis')
      expect(pkg.devDependencies.typescript).toBe('6.0.3')
      expect(pkg.devDependencies['@builder.io/mitosis']).toBeUndefined()
      expect(files.get('shared/Welcome.lite.tsx')).toBe(source)
      expect(files.get('scripts/portable/index.mjs')).toContain(
        'export async function compileProject',
      )
      expect(files.get('scripts/generate.mjs')).toContain("theme: 'mavis'")
      expect(files.get('tsconfig.json')).toContain('mavis-env.d.ts')
      expect(files.get('web/main.js')).toContain("from './generated/Welcome.vue'")
      expect(files.get('.gitignore')).toContain('native/Sources/MavisDesktop/Generated/')
      expect(files.get('native/Sources/MavisDesktop/App.swift')).toContain(
        'WindowGroup("first-light")',
      )
      expect([...files.keys()].some((path) => path.includes('generated/'))).toBe(false)
      expect(files.get('README.md')).toContain(`${packageManager} run macos`)
      expect(files.get('README.md')).toContain(`${packageManager} run generate`)
      expect(nextSteps(preset)).toContain(`${packageManager} run dev:web`)
      expect(sharedEntry(preset)).toBe('shared/Welcome.lite.tsx')
      expect(projectSummary(preset)).toContain('EXPERIMENTAL')
      expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
    },
  )

  it('keeps the compiler out of ordinary presets and rejects unsupported combinations', async () => {
    for (const target of ['web', 'mobile', 'both']) {
      const { files } = await projectFiles({ name: 'regular', target })
      expect([...files.keys()].some((path) => path.includes('scripts/portable/'))).toBe(false)
    }
    for (const options of [
      { authoring: 'vue' },
      { web: 'nuxt' },
      { rendering: 'ssr' },
      { example: 'directory' },
    ]) {
      await expect(
        projectFiles({ name: 'unsupported', target: 'macos', ...options }),
      ).rejects.toThrow('Experimental macOS')
    }
  })
})

describe('portable compiler', () => {
  it('compiles the starter and every conformance fixture deterministically', async () => {
    const first = await compileProject(welcome(), { theme: 'midnight' })
    expect([...first.vue.keys()].sort()).toEqual(['Welcome.vue', 'types.ts'])
    expect([...first.swift.keys()].sort()).toEqual([
      'MavisRuntime.swift',
      'MavisTokens.swift',
      'MavisTypes.swift',
      'Welcome.swift',
    ])
    expect(first.swift.get('Welcome.swift')).toContain('@State private var sparks: Double')
    expect(first.swift.get('Welcome.swift')).toContain('self.sparks = (self.sparks + 1.0)')
    expect(first.vue.get('Welcome.vue')).toContain('state.sparks = (state.sparks + 1)')
    expect(first.environment).toContain("declare module '@builder.io/mitosis'")
    for (const name of fixtures) {
      const { files, root } = await fixture(name)
      const a = await compileProject(files, { root })
      const b = await compileProject(files, { root })
      expect([...a.vue], name).toEqual([...b.vue])
      expect([...a.swift], name).toEqual([...b.swift])
      for (const text of [...a.vue.values(), ...a.swift.values()])
        expect(text, name).not.toMatch(/undefined undefined|\[object Object\]/)
    }
  })

  it('keeps JavaScript semantics where Swift differs', async () => {
    const { files, root } = await fixture('words')
    const words = (await compileProject(files, { root })).swift.get('Words.swift')
    expect(words).toContain('.utf16.count')
    expect(words).toContain('mavisTrim(')
    expect(words).toContain('mavisString(')
    const list = await fixture('tasks')
    const tasks = await compileProject(list.files, { root: list.root })
    const swift = tasks.swift.get('Tasks.swift')
    expect(swift).toContain('mavisSplice(&self.tasks, -1.0, 1.0, [])')
    expect(swift).toContain('guard let task else { return }')
    expect(swift).toContain('ForEach(self.visible, id: \\.id)')
    expect(swift).toContain('mavisCopy(task)')
    expect(tasks.vue.get('Tasks.vue')).toContain(':key="task.id"')
    expect(tasks.swift.get('MavisRuntime.swift')).toContain('func mavisString(_ value: Double)')
  })

  it.each([
    ['<MColumn gap="xl">', '<MColumn gap="xl" class="hidden">', /Property 'class' does not exist/],
    ['<MColumn gap="xl">', '<MColumn gap={state.sparks > 1 ? "xl" : "sm"}>', /spacing token name/],
    [
      'state.sparks + 1',
      'fetch("/api")',
      /Cannot find name 'fetch'|not part of the portable subset/,
    ],
    ['state.sparks + 1', '"wrong type"', /not assignable|Expected number/],
    [
      '(state.sparks = state.sparks + 1)',
      '(console.log("lost"), 1)',
      /Cannot find name 'console'|not available/,
    ],
    ['const state =', 'console.log("lost"); const state =', /console|first statement/],
    ['sparks: 0', 'sparks: 0, body: 0', /reserved word/],
    ['sparks: 0', 'sparks: []', /never\[\]|element type|Unsupported type/],
    ['Welcome()', 'Welcome(props: { title?: string })', /Optional properties/],
    [
      '<MText variant="display">One idea.</MText>',
      '<div>Not portable</div>',
      /div|IntrinsicElements|primitives/,
    ],
    [
      '{state.sparks}</MText>',
      '{state.sparks.toFixed(2)}</MText>',
      /toFixed|not available|Only listed/,
    ],
    [
      'sparks: 0',
      'sparks: 0, list: ["a"] as string[], get first(): string { return state.list[0] }',
      /not part of the portable subset/,
    ],
    ['sparks: 0', 'sparks: 0, get same(): boolean { return 1 == 1 }', /Use === and !==/],
    ['sparks: 0', 'sparks: 0, async later() {}', /async|modifiers/],
    [
      'sparks: 0',
      'sparks: 0, get grow(): number { state.sparks = 1; return 1 }',
      /const declarations|only allowed in actions/,
    ],
  ] as const)('rejects %s → %s with a source location', async (from, to, message) => {
    expect(source).toContain(from)
    const error = await compileProject(welcome(source.replace(from, to))).then(
      () => undefined,
      (failure: Error) => failure,
    )
    expect(error, to).toBeInstanceOf(Error)
    expect(error!.message).toMatch(/shared\/Welcome\.lite\.tsx:\d+:\d+:/)
    expect(error!.message).toMatch(message)
  })

  it('rejects lists without a key field and unnamed record types', async () => {
    const { files, root } = await fixture('tasks')
    const tasks = files.get('shared/Tasks.lite.tsx')!
    const unkeyed = new Map(files).set(
      'shared/Tasks.lite.tsx',
      tasks.replace('key={task.id}', 'key={task.title + "x"}'),
    )
    await expect(compileProject(unkeyed, { root })).rejects.toThrow(/Use a field of task as key/)
    const anonymous = new Map(files).set(
      'shared/Tasks.lite.tsx',
      tasks.replace('next: 1,', 'next: 1, point: { x: 1 },'),
    )
    await expect(compileProject(anonymous, { root })).rejects.toThrow(/Declare a named record type/)
    const comparedRecords = new Map(files).set(
      'shared/Tasks.lite.tsx',
      tasks.replace("task.title === 'Ship'", 'task === state.tasks[0]'),
    )
    await expect(compileProject(comparedRecords, { root })).rejects.toThrow(
      /Tasks\.lite\.tsx:\d+:\d+:/,
    )
  })
})
