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
  const { root, shared } = JSON.parse(await readFile(join(portable, name, 'steps.json'), 'utf8'))
  // readShared takes the folder that contains shared/.
  const files: Map<string, string> = await readShared(
    join(portable, name, shared ?? 'shared', '..'),
  )
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

  it.each(combinations.map((targets) => targets.join(',')))(
    'plans the Tasks example for %s',
    async (list) => {
      const has = (target: string) => list.split(',').includes(target)
      const { preset, files } = await projectFiles({
        name: 'studio',
        targets: list,
        example: 'tasks',
      })
      const config = JSON.parse(files.get('mavis.config.json'))
      expect(config).toMatchObject({ example: 'tasks', portability: { entry: 'Tasks' } })
      expect([...files.keys()].filter((path) => path.startsWith('shared/'))).toEqual([
        'shared/TaskDetail.lite.tsx',
        'shared/TaskRow.lite.tsx',
        'shared/Tasks.lite.tsx',
        'shared/types.ts',
      ])
      expect(files.get('scripts/generate.mjs')).toContain("config.portability?.entry ?? 'Welcome'")
      if (has('web')) {
        expect(files.get('apps/web/src/main.js')).toContain("from './generated/Tasks.vue'")
        expect(files.get('apps/web/src/style.css')).toContain('max-width: 1120px')
      }
      if (has('native'))
        expect(files.get('apps/mobile/src/App.vue')).toContain("from './generated/Tasks.vue'")
      const app = files.get('apps/macos/Sources/MavisDesktop/App.swift')
      expect(app).toContain('Tasks()')
      expect(app).toContain('.frame(minWidth: 760, minHeight: 640)')
      expect(files.get('README.md')).toContain('`Tasks` is the screen every app opens')
      expect(sharedEntry(preset)).toBe('shared/Tasks.lite.tsx')
      expect(projectSummary(preset)).toContain('Example   Tasks')
      expect([...files.values()].join('\n')).not.toMatch(/__MAVIS_[A-Z_]+__/)
      // The example compiles as created, for both themes.
      const shared = new Map([...files].filter(([path]) => path.startsWith('shared/'))) as Map<
        string,
        string
      >
      for (const theme of ['mavis', 'midnight'])
        await expect(compileProject(shared, { theme, root: 'Tasks' })).resolves.toBeDefined()
    },
  )

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
    for (const target of ['web', 'mobile', 'both'])
      await expect(projectFiles({ name: 'tasks', target, example: 'tasks' })).rejects.toThrow(
        'comes with the Mac target',
      )
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

  it('writes expressions into templates without HTML entities', async () => {
    // vue-tsc reads expressions from the file, so && must stay JavaScript. Quotes and
    // ampersands inside strings become JavaScript escapes: the Vue compiler would decode &amp;.
    const text = source
      .replace(
        'text="Add a spark"',
        `text={state.sparks > 0 && state.sparks < 9 ? 'Say "more" & &amp;' : 'Add a spark'}`,
      )
      .replace('One idea.', 'Fish &amp; "chips" && more')
    const { vue, native } = await compileProject(welcome(text))
    for (const output of [vue, native]) {
      const view = output.get('Welcome.vue')!
      expect(view).toContain(
        `:text="(((state.sparks > 0) && (state.sparks < 9)) ? 'Say \\x22more\\x22 \\x26 \\x26amp;' : 'Add a spark')"`,
      )
      expect(view).toContain('{{ `Fish \\x26amp; "chips" \\x26\\x26 more` }}')
      expect(view).not.toMatch(/&amp;|&quot;/)
    }
    for (const name of fixtures) {
      const { files, root } = await fixture(name)
      const outputs = await compileProject(files, { root })
      for (const [file, generated] of [...outputs.vue, ...outputs.native])
        if (file.endsWith('.vue'))
          expect(generated).not.toMatch(/ (?:[:@][\w.:-]+|v-[a-z-]+)="[^"]*&(?:amp|quot);/)
    }
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

  it('lays out grids and cards and registers shortcuts where a keyboard exists', async () => {
    const { files, root } = await fixture('tasksExample')
    const { vue, native, swift } = await compileProject(files, { root })
    const web = vue.get('Tasks.vue')!
    expect(web).toContain('<MGrid gap="lg" :columns="2" :minColumnWidth="320">')
    expect(web).toContain("{ key: 'k', run: () => state.compose() },")
    expect(web).toContain(
      "{ key: 'Enter', disabled: () => !state.hasCurrent, run: () => state.toggle() },",
    )
    expect(web).not.toContain('shortcut=')
    expect(vue.get('runtime.ts')).toContain("document.addEventListener('keydown', listen, true)")
    const mobile = native.get('Tasks.vue')!
    expect(mobile).toContain('<MGrid gap="lg" :columns="2" :minColumnWidth="320">')
    expect(mobile).not.toMatch(/useMavisShortcuts|shortcut=/)
    expect(native.get('runtime.ts')).not.toContain('useMavisShortcuts')
    for (const output of [vue, native]) {
      const row = output.get('TaskRow.vue')!
      expect(row).toContain('interactive @click="() => props.onSelect(props.task.id)"')
      expect(row).toContain(':accessibilityLabel="`${props.task.title}, ')
      expect(row).toContain(
        ":backgroundColor=\"mavisTheme.colors[(props.selected ? 'primarySoft' : 'surface') as keyof typeof mavisTheme.colors]\"",
      )
      expect(row).toContain('<MReveal :show="props.task.done" gap="xs">')
    }
    // MSelect reports string or number choices; the source's handler takes the string.
    for (const output of [vue, native])
      expect(output.get('TaskDetail.vue')).toContain(
        '@update:modelValue="(choice) => ((value) => props.onPriority(value))(String(choice))"',
      )
    const view = swift.get('Tasks.swift')!
    expect(view).toContain('MavisGrid(minColumnWidth: 320.0, columns: 2.0, spacing: 24) {')
    expect(view).toContain('.keyboardShortcut(KeyEquivalent("k"), modifiers: .command)')
    expect(view).toContain('.keyboardShortcut(.return, modifiers: .command)')
    const row = swift.get('TaskRow.swift')!
    expect(row).toContain('.buttonStyle(MavisCardButtonStyle())')
    expect(row).toContain('.accessibilityIdentifier("mavis-card")')
    expect(row).toContain('JoltPresence(self.task.done) {')
    // Each grid cell is a group, so assistive technology reads column by column.
    expect(view).toMatch(
      /MavisGrid\(.*\) \{\n +Group \{\n[\s\S]*?\n +\}\n +\.accessibilityElement\(children: \.contain\)\n +Group \{/,
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisGrid: Layout {')
    // Borders only draw: a hit-testable stroke takes clicks on a two-row field's middle line.
    expect(controls.match(/\.strokeBorder\(.*\)\.allowsHitTesting\(false\)\)/g)).toHaveLength(2)
    expect(controls.match(/\.strokeBorder\(/g)).toHaveLength(2)
    expect(controls).toContain('.joltMotion(to: configuration.isPressed && isEnabled')
  })

  it.each([
    ['shortcut="mod+k"', `shortcut={state.submitted ? 'mod+k' : 'mod+j'}`, /literal/],
    ['shortcut="mod+k"', 'shortcut="k"', /not assignable/],
    ['shortcut="mod+k"', 'shortcut="mod+d"', /mod\+d is already used/],
    [
      '<MButton text="Add task" onClick={() => state.add()} />',
      '<Show when={state.submitted}><MButton text="Add task" shortcut="mod+s" onClick={() => state.add()} /></Show>',
      /stays on screen/,
    ],
    [
      '<MGrid gap="lg" columns={2} minColumnWidth={320}>',
      '<MGrid gap="lg" columns={2} minColumnWidth="wide">',
      /not assignable/,
    ],
  ] as const)('rejects Tasks source %s', async (from, to, message) => {
    const { files, root } = await fixture('tasksExample')
    const text = files.get('shared/Tasks.lite.tsx')!
    expect(text).toContain(from)
    await expect(
      compileProject(new Map(files).set('shared/Tasks.lite.tsx', text.replace(from, to)), { root }),
    ).rejects.toThrow(message)
  })

  it.each([
    ['      label={`', '      title={`', /Property 'title' does not exist|needs a label/],
    [
      '      <MText tone={props.task.done',
      '      <MButton text="Open" onClick={() => props.onSelect(props.task.id)} />\n      <MText tone={props.task.done',
      /shows text only/,
    ],
    [
      '      onClick={() => props.onSelect(props.task.id)}\n',
      '      onClick={() => props.onSelect(props.task.id)}\n      shortcut="mod+j"\n',
      /Property 'shortcut' does not exist/,
    ],
  ] as const)('rejects card source %s', async (from, to, message) => {
    const { files, root } = await fixture('tasksExample')
    const text = files.get('shared/TaskRow.lite.tsx')!
    expect(text).toContain(from)
    await expect(
      compileProject(new Map(files).set('shared/TaskRow.lite.tsx', text.replace(from, to)), {
        root,
      }),
    ).rejects.toThrow(message)
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
