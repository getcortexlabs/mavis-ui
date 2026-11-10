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

describe('starters with shared TSX sources', () => {
  const combinations = [
    ['macos'],
    ['web', 'macos'],
    ['native', 'macos'],
    ['web', 'native', 'macos'],
  ] as const
  const cases = combinations.flatMap((targets) =>
    ['npm', 'pnpm', 'yarn'].map((packageManager) => [targets.join(','), packageManager]),
  )

  it.each(cases)('plans %s with %s', async (list, packageManager) => {
    const targets = list.split(',')
    const has = (target: string) => targets.includes(target)
    const { preset, files } = await projectFiles({
      name: 'first-light',
      targets: list,
      packageManager,
    })
    const config = JSON.parse(files.get('mavis.config.json'))
    expect(config).toMatchObject({ schemaVersion: 2, targets, authoring: 'mitosis' })
    expect(config.target).toBeUndefined()
    const pkg = JSON.parse(files.get('package.json'))
    expect(pkg.devDependencies.typescript).toBe('6.0.3')
    expect(pkg.dependencies['@getcortexlabs/mavis-core']).toBeDefined()
    expect(Object.keys(pkg.scripts).sort()).toEqual(
      [
        'generate',
        'build',
        ...(has('web') ? ['dev:web', 'build:web'] : []),
        ...(has('native') ? ['ios', 'android', 'build:native', 'install:apps'] : []),
        ...(has('macos') ? ['macos', 'build:macos'] : []),
      ].sort(),
    )
    for (const script of ['dev:web', 'ios', 'android', 'build:web', 'build:native'])
      if (pkg.scripts[script])
        expect(pkg.scripts[script]).toMatch(/^node scripts\/generate\.mjs && /)
    expect(files.has('apps/web/package.json')).toBe(has('web'))
    expect(files.has('apps/mobile/package.json')).toBe(has('native'))
    expect(files.has('apps/macos/Package.swift')).toBe(has('macos'))
    expect(files.has('scripts/macos.mjs')).toBe(has('macos'))
    expect(files.get('shared/Welcome.lite.tsx')).toContain(
      `Experimental · ${targets.map((t) => ({ web: 'Web', native: 'Native', macos: 'Mac' })[t]).join(' + ')}`,
    )
    expect(files.get('scripts/portable/index.mjs')).toContain(
      'export async function compileProject',
    )
    expect(files.get('scripts/generate.mjs')).toContain('config.targets')
    expect(files.get('tsconfig.json')).toContain('mavis-env.d.ts')
    if (has('web'))
      expect(files.get('apps/web/src/main.js')).toContain("from './generated/Welcome.vue'")
    if (has('native')) {
      expect(files.get('apps/mobile/src/App.vue')).toContain("from './generated/Welcome.vue'")
      expect(files.get('apps/mobile/tsconfig.json')).toContain('"include": ["src"]')
    }
    if (has('macos')) {
      expect(files.get('apps/macos/Package.swift')).toContain(
        '.package(url: "https://github.com/rafaelaugustos/jolt-swift.git", exact: "0.1.0-rc.13")',
      )
      expect(files.get('apps/macos/Sources/MavisDesktop/App.swift')).toContain(
        'WindowGroup("first-light")',
      )
    }
    expect(files.get('.gitignore')).toContain('apps/mobile/src/generated/')
    expect([...files.keys()].some((path) => path.includes('/generated/'))).toBe(false)
    const readme = files.get('README.md')
    expect(readme).toContain(`${packageManager} run generate`)
    for (const script of ['dev:web', 'ios', 'macos'])
      if (pkg.scripts[script]) expect(readme).toContain(`${packageManager} run ${script}`)
    expect(nextSteps(preset)).toContain(`cd first-light`)
    expect(sharedEntry(preset)).toBe('shared/Welcome.lite.tsx')
    expect(projectSummary(preset)).toContain('EXPERIMENTAL')
    expect(projectSummary(preset)).toContain('Shared TSX')
    expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
  })

  it('keeps --target names as aliases and records schema 2 for every project', async () => {
    const legacy = {
      web: ['web'],
      mobile: ['native'],
      both: ['web', 'native'],
      macos: ['web', 'macos'],
    }
    for (const [target, targets] of Object.entries(legacy)) {
      const { preset, files } = await projectFiles({ name: 'alias', target })
      expect(preset.targets).toEqual(targets)
      expect(JSON.parse(files.get('mavis.config.json'))).toMatchObject({
        schemaVersion: 2,
        targets,
      })
      expect((await projectFiles({ name: 'alias', targets: targets.join(',') })).files).toEqual(
        files,
      )
    }
    await expect(
      projectFiles({ name: 'mixed', target: 'both', targets: 'web,macos' }),
    ).rejects.toThrow('either --target or --targets')
    await expect(projectFiles({ name: 'unknown', targets: 'web,windows' })).rejects.toThrow(
      'web, native and macos',
    )
  })

  it('keeps the compiler out of ordinary presets and rejects unsupported combinations', async () => {
    for (const target of ['web', 'mobile', 'both']) {
      const { files } = await projectFiles({ name: 'regular', target })
      expect([...files.keys()].some((path) => path.includes('scripts/portable/'))).toBe(false)
    }
    for (const [options, message] of [
      [{ authoring: 'vue' }, 'With Mac, shared screens are TSX'],
      [{ web: 'nuxt' }, 'Nuxt'],
      [{ rendering: 'ssr' }, 'Nuxt'],
      [{ example: 'directory' }, 'directory example'],
    ] as const)
      await expect(
        projectFiles({ name: 'unsupported', targets: 'web,native,macos', ...options }),
      ).rejects.toThrow(message)
    await expect(
      projectFiles({ name: 'tsx', targets: 'web', authoring: 'mitosis' }),
    ).rejects.toThrow('Mac target')
  })
})

describe('portable compiler', () => {
  it('compiles the starter', async () => {
    const first = await compileProject(welcome(), { theme: 'midnight' })
    expect([...first.vue.keys()].sort()).toEqual(['Welcome.vue', 'types.ts'])
    expect([...first.swift.keys()].sort()).toEqual([
      'MavisControls.swift',
      'MavisRuntime.swift',
      'MavisTokens.swift',
      'MavisTypes.swift',
      'Welcome.swift',
    ])
    expect(first.swift.get('Welcome.swift')).toContain('@State private var sparks: Double')
    expect(first.swift.get('Welcome.swift')).toContain('self.sparks = (self.sparks + 1.0)')
    expect(first.vue.get('Welcome.vue')).toContain('state.sparks = (state.sparks + 1)')
    expect(first.environment).toContain("declare module '@builder.io/mitosis'")
  })

  it.each(fixtures)('compiles the %s fixture deterministically', async (name) => {
    const { files, root } = await fixture(name)
    const a = await compileProject(files, { root })
    const b = await compileProject(files, { root })
    expect([...a.vue]).toEqual([...b.vue])
    expect([...a.swift]).toEqual([...b.swift])
    for (const text of [...a.vue.values(), ...a.swift.values()])
      expect(text).not.toMatch(/undefined undefined|\[object Object\]/)
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
      /string \| undefined.*not assignable|not assignable/,
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

  it('compiles form fields, field references and keyed lists for both targets', async () => {
    const form = await fixture('form')
    const forms = await compileProject(form.files, { root: form.root })
    const vue = forms.vue.get('TaskForm.vue')
    expect(vue).toContain(
      ':modelValue="state.title" @update:modelValue="(value) => state.title = value"',
    )
    expect(vue).toContain('ref="titleRef"')
    expect(vue).toContain('titleRef.value?.focus()')
    expect(vue).toContain('@keydown.esc="() => state.discard()"')
    expect(vue).toContain(':modelValue="state.priority ?? null"')
    expect(forms.vue.has('runtime.ts')).toBe(false)
    const swift = forms.swift.get('TaskForm.swift')
    expect(swift).toContain('@FocusState private var mavisFocus: String?')
    expect(swift).toContain('self.mavisFocus = "titleRef"')
    expect(swift).toContain('if self.mavisFocus == "titleRef" { self.mavisFocus = nil }')
    expect(swift).toContain('MavisTextInput(')
    expect(swift).toContain('multiline: true')
    expect(swift).toContain('MavisChoice(value: option.value')
    expect(forms.swift.get('MavisControls.swift')).toContain('struct MavisSelect: View')
    expect(forms.swift.get('MavisControls.swift')).toContain('Toggle(sources: sources')

    const list = await fixture('inbox')
    const lists = await compileProject(list.files, { root: list.root })
    const inbox = lists.vue.get('Inbox.vue')
    expect(inbox).toContain("import { mavisKey, vMavisKeepFocus } from './runtime'")
    expect(inbox).toContain(
      '<MColumn role="group" gap="sm" padding="sm" accessibilityLabel="Tasks" tabindex="0"',
    )
    expect(inbox).toContain(
      '@keydown="(event) => mavisKey(event, (key) => state.step(key))" v-mavis-keep-focus>',
    )
    expect(lists.vue.get('runtime.ts')).toContain('moveBefore')
    const native = lists.swift.get('Inbox.swift')
    expect(native).toContain('mavisSorted(shown, { (a: Task, b: Task) -> Double in')
    expect(native).toContain('mavisBefore(a.title, b.title)')
    expect(native).toContain('mavisAt(self.tasks, index)')
    expect(native).toContain('if let task { return "Selected: \\(task.title)" }')
    expect(native).toContain('.onKeyPress(keys: [.upArrow, .downArrow, .leftArrow, .rightArrow])')
    expect(native).toContain('.focusable(interactions: .edit)')
    expect(lists.swift.get('TaskItem.swift')).toContain('onChange: { (_: Bool) in')

    // NativeScript gets the same screens without DOM attributes or hardware-key handlers.
    const nativeInbox = lists.native.get('Inbox.vue')
    expect(nativeInbox).not.toMatch(/tabindex|role="group"|mavisKey|@keydown/)
    expect(nativeInbox).toContain("import { vMavisKeepFocus } from './runtime'")
    expect(nativeInbox).toContain('accessibilityLabel="Tasks"')
    expect(lists.native.get('runtime.ts')).toContain("from '@nativescript/core'")
    expect(lists.native.get('runtime.ts')).not.toContain('document')
    expect(forms.native.get('TaskForm.vue')).not.toContain('@keydown.esc')
    expect(forms.native.has('runtime.ts')).toBe(false)
  })

  it('animates Show and keyed lists through Jolt on every target', async () => {
    const { files, root } = await fixture('motion')
    const { vue, native, swift } = await compileProject(files, { root })
    for (const output of [vue, native]) {
      const motion = output.get('Motion.vue')
      expect(motion).toContain('<MReveal :show="state.open" gap="md">')
      expect(motion).toContain('<MReveal :show="!state.open" gap="md">')
      expect(motion).toContain(
        'const mavisRows1 = useComponentLayout(() => state.cards.map((card) => card.id))',
      )
      expect(motion).toContain(':motionRegion="mavisRows1"')
    }
    const view = swift.get('Motion.swift')
    expect(view).toContain('import JoltSwiftUI')
    expect(view).toContain('JoltPresence(self.open) {')
    expect(view).toContain('JoltPresence(!self.open) {')
    expect(view).toContain('.joltLayout(value: self.cards.map(\\.id))')
    expect(swift.get('MavisTokens.swift')).toContain('.joltMotion(to: configuration.isPressed')
  })

  it.each([
    [
      '<Show when={state.open} else',
      '<MRow gap="sm"><Show when={state.open} else',
      /directly inside an MColumn/,
    ],
    [
      '<For each={state.cards} animate>',
      '<For each={state.cards} animate={state.open}>',
      /literal/,
    ],
  ] as const)('rejects motion source %s', async (from, to, message) => {
    const { files, root } = await fixture('motion')
    const text = files.get('shared/Motion.lite.tsx')!
    expect(text).toContain(from)
    let changed = text.replace(from, to)
    if (to.startsWith('<MRow'))
      changed = changed.replace(
        '      </Show>\n      <MColumn gap="sm">',
        '      </Show></MRow>\n      <MColumn gap="sm">',
      )
    await expect(
      compileProject(new Map(files).set('shared/Motion.lite.tsx', changed), { root }),
    ).rejects.toThrow(message)
  })

  it.each([
    ['notesRef.focus()', 'notesRef.select()', /does not exist on type 'MavisFieldRef'/],
    ['ref={notesRef}\n', '\n', /notesRef is not attached to an MInput/],
    ['ref={notesRef}\n', 'ref={titleRef}\n', /titleRef already belongs to another field/],
    [
      'rows={3}',
      'rows={3}\n        onSubmit={() => state.save()}',
      /onSubmit needs a single-line field/,
    ],
    ['maxLength={24}', 'maxLength={24}\n        rows={2}', /rows needs multiline/],
    [
      'maxLength={24}',
      'maxLength={24}\n        type={state.done ? "password" : "text"}',
      /must be written as a literal/,
    ],
    ['onChange={(value) => (state.notes = value)}', '', /MInput needs onChange|onChange/],
    [
      'onChange={(checked) => (state.done = checked)}',
      'onChange={(checked, again) => (state.done = checked)}',
      /receives 1 argument|Target signature/,
    ],
    [
      '<MColumn gap="md">',
      '<MColumn gap="md" onKeyDown={(key) => state.save()}>',
      /handles keys needs a label/,
    ],
  ] as const)('rejects form source %s → %s', async (from, to, message) => {
    const { files, root } = await fixture('form')
    const text = files.get('shared/TaskForm.lite.tsx')!
    expect(text).toContain(from)
    const changed = new Map(files).set('shared/TaskForm.lite.tsx', text.replace(from, to))
    const error = await compileProject(changed, { root }).then(
      () => undefined,
      (failure: Error) => failure,
    )
    expect(error, to).toBeInstanceOf(Error)
    expect(error!.message).toMatch(/shared\/TaskForm\.lite\.tsx:\d+:\d+:/)
    expect(error!.message).toMatch(message)
  })

  it('rejects a shared SelectOption and a field reference repeated in a list', async () => {
    const { files, root } = await fixture('form')
    const own = new Map(files)
      .set(
        'shared/types.ts',
        `${files.get('shared/types.ts')}export type SelectOption = { value: string; label: string }\n`,
      )
      .set(
        'shared/TaskForm.lite.tsx',
        files
          .get('shared/TaskForm.lite.tsx')!
          .replace(
            "import type { TaskDraft } from './types'",
            "import type { SelectOption, TaskDraft } from './types'",
          ),
      )
    await expect(compileProject(own, { root })).rejects.toThrow(
      /SelectOption is the Mavis option type/,
    )
    const list = await fixture('inbox')
    const row = list.files.get('shared/TaskItem.lite.tsx')!
    const inRow = new Map(list.files).set(
      'shared/Inbox.lite.tsx',
      list.files
        .get('shared/Inbox.lite.tsx')!
        .replace(
          "import { useStore, Show, For } from '@builder.io/mitosis'",
          "import { useStore, useRef, Show, For } from '@builder.io/mitosis'",
        )
        .replace(
          '  const state = useStore({',
          '  const rowRef = useRef<MavisFieldRef>(null)\n  const state = useStore({',
        )
        .replace(
          '<TaskItem',
          '<MInput label="Row" ref={rowRef} value={task.title} onChange={() => {}} />\n                <TaskItem',
        ),
    )
    expect(row).toContain('MInput')
    await expect(compileProject(inRow, { root: list.root })).rejects.toThrow(
      /Repeated rows cannot share one field reference|JSX expressions must have one parent/,
    )
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
