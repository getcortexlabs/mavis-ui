import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { frontends } from '../packages/create-mavis/templates/macos/scripts/portable/frontends/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { emitVue } from '../packages/create-mavis/templates/macos/scripts/portable/emit-vue.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { macPlatform } from '../packages/create-mavis/templates/macos/scripts/portable/frontends/vue-lower.mjs'
import { createPlatformContext } from '../packages/core/src/vue/platform.js'

const compiler = new URL(
  '../packages/create-mavis/templates/macos/scripts/portable/',
  import.meta.url,
).pathname
const portable = new URL('./portable/', import.meta.url).pathname

type Output = {
  model: { components: Record<string, unknown>[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>, root: string): Promise<Output> =>
  compileProject(shared(files), { root })
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`

// The model without where it was read from: the file of each component.
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])

async function expectSame(tsx: Record<string, string>, sfc: Record<string, string>, root: string) {
  const fromTsx = await compile(tsx, root)
  const fromVue = await compile(sfc, root)
  expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
  expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  return { fromTsx, fromVue }
}

describe('the front-end boundary', () => {
  it('keeps the generators unaware of the authoring formats', async () => {
    for (const file of ['emit-swift.mjs', 'swift-text.mjs', 'model.mjs', 'tree.mjs']) {
      const text = await readFile(join(compiler, file), 'utf8')
      expect(text, file).not.toMatch(/frontends\//)
      expect(text.match(/^import .*$/gm) ?? [], file).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/typescript|vue|tsx/)]),
      )
    }
    expect(frontends.map((frontend: { extension: string }) => frontend.extension)).toEqual([
      '.lite.tsx',
      '.vue',
    ])
  })

  it('reads the tasks fixture into one model from TSX and from Vue', async () => {
    const tsx: Map<string, string> = await readShared(join(portable, 'tasks'))
    const sfc: Map<string, string> = await readShared(join(portable, 'tasksVue'))
    expect([...sfc.keys()]).toEqual(['shared/TaskRow.vue', 'shared/Tasks.vue', 'shared/types.ts'])
    const fromTsx: Output = await compileProject(tsx, { root: 'Tasks' })
    const fromVue: Output = await compileProject(sfc, { root: 'Tasks' })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    // The Web and NativeScript run the Vue files as written: nothing is generated for them.
    expect([...fromVue.vue.keys()]).toEqual([])
    expect([...fromVue.native.keys()]).toEqual([])
    expect(fromVue.direct).toEqual(['shared/TaskRow.vue', 'shared/Tasks.vue'])
    expect(fromTsx.direct).toEqual([])
    expect([...fromTsx.vue.keys()]).toEqual(['TaskRow.vue', 'Tasks.vue', 'types.ts', 'runtime.ts'])
  })

  it('reads state, computed values, actions, properties and events alike', async () => {
    await expectSame(
      {
        'Counter.lite.tsx': `import { useStore, Show } from '@builder.io/mitosis'

export default function Counter(props: { title: string; onDone: (count: number) => void }) {
  const state = useStore({
    count: 0,
    get even(): boolean {
      return state.count % 2 === 0
    },
    add(step: number) {
      state.count += step
    },
  })
  return (
    <MColumn gap="md">
      <MText variant="title">
        {props.title}: {state.count}
      </MText>
      <Show when={state.even} animate>
        <MText tone="muted">Even</MText>
      </Show>
      <MRow gap="sm">
        <MButton text="Add" onClick={() => state.add(1)} />
        <MButton
          text="Reset"
          variant="secondary"
          disabled={state.count === 0}
          onClick={() => (state.count = 0)}
        />
        <MButton text="Done" variant="ghost" onClick={() => props.onDone(state.count)} />
      </MRow>
    </MColumn>
  )
}
`,
      },
      {
        'Counter.vue': vue(
          `import { computed, ref } from 'vue'
import { MButton, MColumn, MReveal, MRow, MText } from '#mavis'

defineProps<{ title: string }>()
const emit = defineEmits<{ done: [count: number] }>()
const count = ref(0)
const even = computed(() => count.value % 2 === 0)
function add(step: number) {
  count.value += step
}`,
          `  <m-column gap="md">
    <m-text variant="title">{{ title }}: {{ count }}</m-text>
    <m-reveal :show="even">
      <m-text tone="muted">Even</m-text>
    </m-reveal>
    <m-row gap="sm">
      <m-button text="Add" @click="add(1)" />
      <m-button text="Reset" variant="secondary" :disabled="count === 0" @click="count = 0" />
      <m-button text="Done" variant="ghost" @click="emit('done', count)" />
    </m-row>
  </m-column>`,
        ),
      },
      'Counter',
    )
  })

  it('reads v-model as a value with its change handler, and ref= as a field reference', async () => {
    const { fromVue } = await expectSame(
      {
        'Fields.lite.tsx': `import { useStore, useRef } from '@builder.io/mitosis'

export default function Fields() {
  const nameRef = useRef<MavisFieldRef>(null)
  const state = useStore({
    name: '',
    agree: false,
    size: undefined as string | undefined,
    sizes: [
      { value: 's', label: 'Small' },
      { value: 'l', label: 'Large' },
    ] as SelectOption[],
    reset() {
      state.name = ''
      state.agree = false
      state.size = undefined
      nameRef.focus()
    },
  })
  return (
    <MColumn gap="sm">
      <MInput
        label="Name"
        ref={nameRef}
        value={state.name}
        onChange={(value) => (state.name = value)}
        onSubmit={() => state.reset()}
      />
      <MCheckbox
        label="Agree"
        checked={state.agree}
        onChange={(value) => (state.agree = value)}
      />
      <MSelect
        label="Size"
        value={state.size}
        options={state.sizes}
        onChange={(value) => (state.size = value)}
      />
      <MButton text="Reset" onClick={() => state.reset()} />
    </MColumn>
  )
}
`,
      },
      {
        'Fields.vue': vue(
          `import { ref } from 'vue'
import { MButton, MCheckbox, MColumn, MInput, MSelect } from '#mavis'
import type { ChoiceOption, InputHandle } from '#mavis'

const nameRef = ref<InputHandle | null>(null)
const name = ref('')
const agree = ref(false)
const size = ref<string | null>(null)
const sizes: ChoiceOption[] = [
  { value: 's', label: 'Small' },
  { value: 'l', label: 'Large' },
]
function reset() {
  name.value = ''
  agree.value = false
  size.value = null
  nameRef.value?.focus()
}`,
          `  <MColumn gap="sm">
    <MInput ref="nameRef" v-model="name" label="Name" @submit="reset" />
    <MCheckbox v-model="agree" label="Agree" />
    <MSelect v-model="size" label="Size" :options="sizes" />
    <MButton text="Reset" @click="reset" />
  </MColumn>`,
        ),
      },
      'Fields',
    )
    const swift = fromVue.swift.get('Fields.swift')!
    expect(swift).toContain('@State private var size: String?')
    expect(swift).toContain('_size = State(initialValue: nil)')
    expect(swift).toContain('self.mavisFocus = "nameRef"')
  })

  it('reads v-if chains and v-for like Show and For', async () => {
    await expectSame(
      {
        'List.lite.tsx': `import { useStore, Show, For } from '@builder.io/mitosis'

export default function List() {
  const state = useStore({ items: ['a'] as string[] })
  return (
    <MColumn gap="sm">
      <Show
        when={state.items.length === 0}
        else={
          <Show
            when={state.items.length === 1}
            else={
              <For each={state.items}>
                {(item, index) => (
                  <MText key={item}>
                    {index}: {item}
                  </MText>
                )}
              </For>
            }
          >
            <MText>One item</MText>
          </Show>
        }
      >
        <MText>No items</MText>
      </Show>
      <MButton text="More" onClick={() => state.items.push('b')} />
    </MColumn>
  )
}
`,
      },
      {
        'List.vue': vue(
          `import { ref } from 'vue'
const items = ref<string[]>(['a'])`,
          `  <MColumn gap="sm">
    <MText v-if="items.length === 0">No items</MText>
    <!-- One is not a list. -->
    <MText v-else-if="items.length === 1">One item</MText>
    <template v-else>
      <MText v-for="(item, index) in items" :key="item">{{ index }}: {{ item }}</MText>
    </template>
    <MButton text="More" @click="items.push('b')" />
  </MColumn>`,
        ),
      },
      'List',
    )
  })

  it('answers useMavisPlatform() for the Mac and leaves the other branches out', async () => {
    expect(macPlatform).toEqual(createPlatformContext('macos'))
    const { fromVue } = await expectSame(
      {
        'Place.lite.tsx': `import { useStore } from '@builder.io/mitosis'

export default function Place() {
  const state = useStore({
    columns: 3,
    taps: 0,
    get place(): string {
      return 'Mac'
    },
    tap() {
      state.taps += 2
    },
  })
  return (
    <MGrid columns={state.columns} gap="md">
      <MText>{state.place}</MText>
      <MText>Wide layout</MText>
      <MText>Only here</MText>
      <MButton text="Tap" onClick={() => state.tap()} />
    </MGrid>
  )
}
`,
      },
      {
        'Place.vue': vue(
          `import { computed, ref } from 'vue'
import { MButton, MGrid, MPlatform, MText, useMavisPlatform } from '#mavis'

const { isMacOS, isWeb } = useMavisPlatform()
const host = useMavisPlatform()
const columns = isMacOS ? 3 : 1
const taps = ref(0)
const place = computed(() => (host.platform === 'macos' ? 'Mac' : host.isNative ? 'Phone' : 'Web'))
function tap() {
  if (host.isIOS || host.isAndroid) taps.value += 1
  else taps.value += 2
}`,
          `  <MGrid :columns="columns" gap="md">
    <MText>{{ place }}</MText>
    <MText v-if="isWeb">In a browser</MText>
    <StackLayout v-else-if="host.isNative"><Label text="NativeScript only" /></StackLayout>
    <MText v-else>Wide layout</MText>
    <MPlatform only="macos">
      <MText>Only here</MText>
      <template #fallback><div class="elsewhere">Elsewhere</div></template>
    </MPlatform>
    <MPlatform :only="['web', 'native']"><a href="/">Home</a></MPlatform>
    <MButton text="Tap" @click="tap" />
  </MGrid>`,
        ),
      },
      'Place',
    )
    const swift = fromVue.swift.get('Place.swift')!
    expect(swift).not.toMatch(/Phone|browser|NativeScript|Elsewhere|Home/)
    expect(swift).toContain('self.taps += 2.0')
  })
})

describe('the Vue subset', () => {
  it('gives properties their defaults, and events nobody listens to nowhere to go', async () => {
    const output = await compile(
      {
        'Badge.vue': vue(
          `const props = withDefaults(
  defineProps<{ title: string; count?: number; tone?: 'muted' | 'primary'; strong?: boolean; note?: string }>(),
  { count: 0, tone: 'muted' },
)
defineEmits<{ pick: [title: string, count: number]; clear: [] }>()`,
          `  <MRow gap="sm">
    <MText :tone="tone" :weight="strong ? 'bold' : 'normal'">{{ title }}: {{ props.count }}{{ note ?? '' }}</MText>
    <MButton :text="\`Pick \${title}\`" @click="$emit('pick', title, count)" />
    <MButton text="Clear" variant="ghost" @click="$emit('clear')" />
  </MRow>`,
        ),
        'Badges.vue': vue(
          `import { ref } from 'vue'
import Badge from './Badge.vue'
const picked = ref('')
const names = ref<string[]>(['Ana', 'Bo'])`,
          `  <MColumn gap="sm">
    <Badge v-for="(name, index) in names" :key="name" :title="name" :count="index" strong @pick="(title) => (picked = title)" @clear="names.splice(index, 1)" />
    <badge title="Fixed" tone="primary" />
    <MButton :disabled="!picked.trim()" @click="picked = ''">Forget {{ picked || 'nobody' }}</MButton>
  </MColumn>`,
        ),
      },
      'Badges',
    )
    const badge = output.swift.get('Badge.swift')!
    expect(badge).toContain(
      'init(title: String, count: Double = 0.0, tone: String = "muted", strong: Bool = false, note: String? = nil, onPick: @escaping (String, Double) -> Void, onClear: @escaping () -> Void) {',
    )
    expect(badge).toContain(
      'Text(verbatim: "\\(self.title): \\(mavisString(self.count))\\((self.note ?? ""))")',
    )
    expect(badge).toContain('self.onPick(self.title, self.count)')
    const badges = output.swift.get('Badges.swift')!
    expect(badges).toMatch(
      /Badge\(\n\s+title: name,\n\s+count: index,\n\s+strong: true,\n\s+onPick: \{ \(title: String, _: Double\) in\n\s+self\.picked = title\n\s+\},\n\s+onClear: \{\n\s+mavisSplice\(&self\.names, index, 1\.0, \[\]\)/,
    )
    expect(badges).toMatch(
      /Badge\(\n\s+title: "Fixed",\n\s+tone: "primary",\n\s+onPick: \{ \(_: String, _: Double\) in\n\n\s+\},/,
    )
    expect(badges).toContain(
      'Text(verbatim: "Forget \\(((self.picked != "") ? self.picked : "nobody"))")',
    )
    expect(badges).toContain('.disabled(!((mavisTrim(self.picked) != "")))')
    // The same model prints as a Vue component too: defaults become runtime props.
    const component = output.model.components.find((item) => item.name === 'Badge')
    const printed: string = emitVue(component, 'test')
    expect(printed).toContain('count: { type: Number, required: false, default: 0 },')
    expect(printed).toContain("tone: { type: String, required: false, default: 'muted' },")
    expect(printed).toContain('strong: { type: Boolean, required: false, default: false },')
    expect(printed).toContain('note: { type: String, required: false },')
  })

  it('reads $event, a listener beside v-model and a card that answers a click', async () => {
    const output = await compile(
      {
        'Note.vue': vue(
          `import { ref } from 'vue'
const text = ref('')
const edits = ref(0)
const last = ref('')
function edited() {
  edits.value++
}`,
          `  <MColumn gap="sm">
    <MInput v-model="text" label="Note" @update:model-value="edited" />
    <MInput :model-value="last" label="Last" @update:modelValue="last = $event.trim()" />
    <MCard interactive accessibility-label="Clear" gap="xs" @click="text = ''">
      <MText :text="text" />
    </MCard>
  </MColumn>`,
        ),
      },
      'Note',
    )
    const swift = output.swift.get('Note.swift')!
    expect(swift).toMatch(
      /onChange: \{ \(value: String\) in\n\s+self\.text = value\n\s+self\.edited\(\)\n/,
    )
    expect(swift).toMatch(/onChange: \{ \(event: String\) in\n\s+self\.last = mavisTrim\(event\)\n/)
    expect(swift).toContain('.accessibilityLabel(Text(verbatim: "Clear"))')
    expect(swift).toContain('Text(verbatim: self.text)')
  })

  it('treats null as a missing value, like undefined', async () => {
    const output = await compile(
      {
        'types.ts': 'export type Pick = { id: string; label: string | null }\n',
        'Picker.vue': vue(
          `import { computed, ref } from 'vue'
import type { Pick } from './types'
const picks = ref<Pick[]>([{ id: 'a', label: null }])
const chosen = ref<string | null>(null)
const current = computed(() => picks.value.find((pick) => pick.id === chosen.value))
const label = computed(() => (chosen.value === null ? 'None' : (current.value?.label ?? 'Unnamed')))`,
          `  <MColumn>
    <MText>{{ label }}</MText>
    <MText v-if="current">Found</MText>
    <MButton text="Clear" @click="chosen = null" />
  </MColumn>`,
        ),
      },
      'Picker',
    )
    const swift = output.swift.get('Picker.swift')!
    expect(output.swift.get('MavisTypes.swift')).toContain('var label: String?')
    expect(swift).toContain('@State private var chosen: String?')
    expect(swift).toContain('if (self.current != nil) {')
    expect(swift).toContain('self.chosen = nil')
  })
})

describe('what TypeScript narrows and the targets do not', () => {
  // TypeScript treats a member as present after a check; SwiftUI state stays optional, and would
  // print Optional("…"). The model keeps the declared type in both formats.
  it.each([
    [
      'TSX',
      {
        'Last.lite.tsx': `import { useStore } from '@builder.io/mitosis'

export default function Last() {
  const state = useStore({
    last: undefined as string | undefined,
    get status(): string {
      return state.last === undefined ? 'Nothing' : \`Last: \${state.last}\`
    },
  })
  return <MText>{state.status}</MText>
}
`,
      },
      'shared/Last.lite.tsx:7:62: This value may be missing in every target',
    ],
    [
      'Vue',
      {
        'Last.vue': vue(
          `import { computed, ref } from 'vue'
const last = ref<string | null>(null)
const status = computed(() => (last.value === null ? 'Nothing' : \`Last: \${last.value}\`))`,
          '  <MText>{{ status }}</MText>',
        ),
      },
      'shared/Last.vue:4:75: This value may be missing in every target',
    ],
  ])('keeps a checked member optional in %s', async (_format, files, message) => {
    await expect(compile(files, 'Last')).rejects.toThrow(message)
    const fixed = Object.fromEntries(
      Object.entries(files).map(([name, text]) => [
        name,
        text.replace(/\$\{(state\.last|last\.value)\}/, "${$1 ?? ''}"),
      ]),
    )
    const swift = (await compile(fixed, 'Last')).swift.get('Last.swift')!
    expect(swift).toContain('"Last: \\((self.last ?? ""))"')
  })
})

describe('the guide', () => {
  it.each([
    ['English', '../docs/guide/macos-experimental.md', '## Shared Vue files'],
    ['Portuguese', '../docs/pt-BR/guide/macos-experimental.md', '## Arquivos Vue compartilhados'],
  ])('shows Vue files that compile for the Mac (%s)', async (_language, page, heading) => {
    const guide = await readFile(new URL(page, import.meta.url), 'utf8')
    const section = guide.slice(guide.indexOf(heading))
    const [tasks, place] = [...section.matchAll(/```vue\n([\s\S]*?)```/g)].map((match) => match[1]!)
    const output = await compile(
      {
        'types.ts': 'export type Task = { id: string; title: string; done: boolean }\n',
        'TaskRow.vue': vue(
          `import type { Task } from './types'
defineProps<{ task: Task }>()
defineEmits<{ toggle: [id: string] }>()`,
          `  <MRow gap="sm">
    <MText>{{ task.title }}</MText>
    <MButton text="Toggle" @click="$emit('toggle', task.id)" />
  </MRow>`,
        ),
        'Tasks.vue': tasks!,
        'Place.vue': place!,
      },
      'Tasks',
    )
    const swift = output.swift.get('Tasks.swift')!
    expect(swift).toContain(
      'init(title: String, limit: Double = 5.0, onSaved: @escaping (Double) -> Void) {',
    )
    // The Mac's branch of :padding="isMacOS ? 'xl' : 'md'" is the xl token.
    expect(swift).toContain('.padding(32)')
    expect(output.swift.get('Place.swift')).toContain('MavisGrid(')
    expect(output.swift.get('Place.swift')).not.toMatch(/NativeScript|browser|navegador/)
    expect(output.direct).toEqual(['shared/Place.vue', 'shared/TaskRow.vue', 'shared/Tasks.vue'])
  })
})

describe('what a shared Vue file cannot use for the Mac', () => {
  const screen = (template: string, script = '') => ({ 'Screen.vue': vue(script, template) })
  const column = (inner: string) => `  <MColumn>\n${inner}\n  </MColumn>`

  it.each([
    [
      'v-html',
      screen(column('    <MText v-html="markup">x</MText>'), "const markup = '<b>x</b>'"),
      'shared/Screen.vue:7:12: v-html is not supported in shared screens for the Mac.',
    ],
    [
      'v-show',
      screen(column('    <MText v-show="true">x</MText>')),
      'shared/Screen.vue:7:12: v-show is not supported',
    ],
    [
      'an HTML element',
      screen(column('    <div>x</div>')),
      'shared/Screen.vue:7:5: <div> is an HTML element, which a shared screen cannot use on the Mac',
    ],
    [
      'a NativeScript view',
      screen(column('    <StackLayout />')),
      'shared/Screen.vue:7:5: <StackLayout> is a NativeScript view',
    ],
    [
      'a component the Mac has not got',
      screen(column('    <MScheduler />')),
      'shared/Screen.vue:7:5: MScheduler is not available on the Mac yet',
    ],
    [
      'class',
      screen(column('    <MText class="big">x</MText>')),
      'shared/Screen.vue:7:12: class is not supported in shared screens for the Mac: CSS does not reach the Mac',
    ],
    [':style', screen(column('    <MText :style="{}">x</MText>')), ':style is not supported'],
    [
      'v-bind with an object',
      screen(column('    <MText v-bind="{}">x</MText>')),
      'v-bind with an object is not supported',
    ],
    [
      'an event modifier',
      screen(
        column('    <MButton text="x" @click.stop="n = 1" />'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      '@click.stop is not supported in shared screens for the Mac: key and event modifiers are DOM behavior, which NativeScript does not run.',
    ],
    [
      'v-model modifiers',
      screen(
        column('    <MInput v-model.trim="n" label="x" />'),
        "import { ref } from 'vue'\nconst n = ref('')",
      ),
      'v-model.trim is not supported',
    ],
    [
      'a slot in a clickable card',
      screen(
        column(
          '    <MCard interactive accessibilityLabel="Open" @click="() => {}"><slot /></MCard>',
        ),
      ),
      'A card with onClick shows text only',
    ],
    [
      'a dynamic component',
      screen(column('    <component :is="x" />')),
      'A dynamic component (is) is not supported',
    ],
    [
      'v-if with v-for',
      screen(
        column('    <MText v-for="n in list" v-if="n" :key="n">x</MText>'),
        'const list = [1]',
      ),
      'v-if and v-for on one element',
    ],
    [
      'v-for without a key',
      screen(column('    <MText v-for="n in list">x</MText>'), 'const list = [1]'),
      'Give the repeated element a key, for example :key="task.id".',
    ],
    [
      'text outside MText',
      screen(column('    Hello')),
      'shared/Screen.vue:7:5: Put text inside MText.',
    ],
    [
      'two roots',
      screen('  <MText>a</MText>\n  <MText>b</MText>'),
      'A shared screen has one root element',
    ],
    [
      'a style block',
      {
        'Screen.vue': `${vue('', column('    <MText>x</MText>'))}<style scoped>\n.a { color: red }\n</style>\n`,
      },
      'shared/Screen.vue:10:1: <style> is not supported in shared screens for the Mac: CSS does not reach the Mac',
    ],
    [
      'a script without setup',
      {
        'Screen.vue':
          '<script lang="ts">\nexport default {}\n</script>\n<template>\n  <MText>x</MText>\n</template>\n',
      },
      'shared/Screen.vue:1:1: A <script> block without setup is not supported',
    ],
    [
      'JavaScript',
      {
        'Screen.vue':
          '<script setup>\nconst a = 1\n</script>\n<template>\n  <MText>x</MText>\n</template>\n',
      },
      'Shared screens for the Mac use <script setup lang="ts">.',
    ],
    [
      'the DOM in the script',
      screen(column('    <MText>x</MText>'), 'function go() {\n  document.title = "x"\n}'),
      'shared/Screen.vue:3:3: document is browser DOM access, which a shared screen cannot use on the Mac.',
    ],
    [
      'the DOM in the template',
      screen(column('    <MButton text="x" @click="window.close()" />')),
      'shared/Screen.vue:7:31: window is browser DOM access',
    ],
    [
      'NativeScript',
      screen(column('    <MText>x</MText>'), "import { isIOS } from '@nativescript/core'"),
      'shared/Screen.vue:2:1: @nativescript/core is NativeScript access, which a shared screen cannot use on the Mac.',
    ],
    [
      'watch',
      screen(
        column('    <MText>x</MText>'),
        "import { ref, watch } from 'vue'\nconst n = ref(0)\nwatch(n, () => {})",
      ),
      'shared/Screen.vue:2:15: watch from vue is not supported in shared screens for the Mac: effects are not part of the portable model yet.',
    ],
    [
      'a lifecycle hook',
      screen(
        column('    <MText>x</MText>'),
        "import { onMounted } from 'vue'\nonMounted(() => {})",
      ),
      'onMounted from vue is not supported in shared screens for the Mac: lifecycle hooks',
    ],
    [
      'the router',
      screen(column('    <MText>x</MText>'), "import { useRouter } from 'vue-router'"),
      'Navigation (vue-router) is not supported in shared screens for the Mac',
    ],
    [
      'a module that is not there',
      screen(column('    <MText>x</MText>'), "import { useDirectory } from './directory-store'"),
      "shared/Screen.vue:2:30: Cannot find module './directory-store'",
    ],
    [
      'a theme composable',
      screen(column('    <MText>x</MText>'), "import { useMavisTheme } from '#mavis'"),
      'useMavisTheme from #mavis is not available to shared screens on the Mac yet.',
    ],
    [
      'a TSX component',
      screen(column('    <MText>x</MText>'), "import Row from './Row.lite'"),
      './Row.lite is a TSX component',
    ],
    [
      'async work',
      screen(column('    <MText>x</MText>'), 'async function save() {}'),
      'An async function is not supported in shared screens for the Mac: async work does not reach the Mac yet.',
    ],
    [
      'let',
      screen(column('    <MText>x</MText>'), 'let count = 0'),
      'let and var at the top of the script is not supported',
    ],
    [
      'a function that returns a value',
      screen(column('    <MText>x</MText>'), 'function double(n: number) {\n  return n * 2\n}'),
      'shared/Screen.vue:2:10: double returns a value. A function changes state and returns nothing',
    ],
    [
      'a bare ref in the script',
      screen(
        column('    <MText>{{ b }}</MText>'),
        "import { computed, ref } from 'vue'\nconst a = ref(1)\nconst b = computed(() => a + 1)",
      ),
      'shared/Screen.vue:4:26: Operator',
    ],
    [
      'an initial value read from state',
      screen(
        column('    <MText>{{ b }}</MText>'),
        "import { ref } from 'vue'\nconst a = ref(1)\nconst b = ref(a.value)",
      ),
      'shared/Screen.vue:4:15: An initial value cannot read a',
    ],
    [
      'a constant that is changed',
      screen(column('    <MButton text="x" @click="list.push(2)" />'), 'const list = [1]'),
      'Only a ref and the fields of its value can be changed.',
    ],
    [
      'a function called for its value',
      screen(
        column('    <MText>{{ bump() }}</MText>'),
        "import { ref } from 'vue'\nconst n = ref(0)\nfunction bump() {\n  n.value++\n}",
      ),
      /shared\/Screen\.vue:11:15: Type 'void' is not assignable to type 'Element \| MavisText'/,
    ],
    [
      'null and undefined together',
      screen(
        column('    <MText>{{ a ?? "" }}</MText>'),
        "import { ref } from 'vue'\nconst a = ref<string | null | undefined>(null)",
      ),
      'string | null | undefined can be both null and undefined; use one for a missing value.',
    ],
    [
      'a number as a condition',
      screen(
        column('    <MText v-if="n">x</MText>'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      'shared/Screen.vue:8:18: A number is not a condition on every target; compare it, for example count > 0.',
    ],
    [
      'a type error in the template',
      screen(
        column('    <MButton text="x" variant="huge" @click="n = 1" />'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      /shared\/Screen\.vue:8:23: Type '"huge"' is not assignable/,
    ],
    [
      'a missing property',
      screen(column('    <MButton variant="ghost" />')),
      'shared/Screen.vue:7:5: MButton needs @click.',
    ],
    [
      'a field without its model',
      screen(column('    <MInput label="x" />')),
      'MInput needs v-model.',
    ],
    [
      'a card that listens without interactive',
      screen(
        column('    <MCard @click="n = 1"><MText>x</MText></MCard>'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      'MCard needs interactive to answer click.',
    ],
    [
      'a card that listens without a name',
      screen(
        column('    <MCard interactive @click="n = 1"><MText>x</MText></MCard>'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      'shared/Screen.vue:8:5: MCard needs accessibilityLabel with @click.',
    ],
    [
      'an unknown attribute',
      screen(
        column('    <MButton text="x" type="submit" @click="n = 1" />'),
        "import { ref } from 'vue'\nconst n = ref(0)",
      ),
      'shared/Screen.vue:8:23: MButton does not take type on the Mac. It supports',
    ],
    [
      'MReveal outside a column',
      screen('  <MRow>\n    <MReveal :show="true"><MText>x</MText></MReveal>\n  </MRow>'),
      'MReveal goes directly inside an MColumn, MStack or MCard.',
    ],
    [
      'v-model on a shared component',
      {
        ...screen(
          column('    <Row v-model="n" />'),
          "import { ref } from 'vue'\nimport Row from './Row.vue'\nconst n = ref('')",
        ),
        'Row.vue': vue('', '  <MText>x</MText>'),
      },
      'v-model on Row is not supported',
    ],
    [
      'children of a shared component without slots',
      {
        ...screen(column('    <Row><MText>x</MText></Row>'), "import Row from './Row.vue'"),
        'Row.vue': vue('', '  <MText>x</MText>'),
      },
      'shared/Screen.vue:7:10: Row has no slot default; it shows no slots.',
    ],
    [
      'an event with call signatures',
      screen(
        column('    <MText>x</MText>'),
        "defineEmits<{ (event: 'save', id: string): void }>()",
      ),
      'Declare events by name with their arguments: defineEmits<{ saved: [id: string] }>().',
    ],
    [
      'properties without types',
      screen(column('    <MText>x</MText>'), "defineProps(['title'])"),
      'Declare properties with their types: defineProps<{ title: string }>().',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const failure = await compile(files as Record<string, string>, 'Screen').then(
      () => undefined,
      (error: Error) => error,
    )
    expect(failure, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(failure!.message).toContain(message)
    else expect(failure!.message).toMatch(message)
    expect(failure!.message).toMatch(/^shared\/[A-Za-z]+\.vue:\d+:\d+: /)
  })

  it('reports each file once and still reads the files that are fine', async () => {
    const failure: Error & { diagnostics: { file: string; line: number; message: string }[] } =
      await compile(
        {
          'Good.vue': vue('', '  <MText>Fine</MText>'),
          'Bad.vue': vue('', '  <div>No</div>'),
          'Typed.vue': vue(
            "import { ref } from 'vue'\nconst n = ref(0)",
            '  <MText :tone="n">x</MText>',
          ),
          'Uses.vue': vue("import Bad from './Bad.vue'", '  <MColumn><Bad /></MColumn>'),
          'Screen.lite.tsx':
            'export default function Screen() {\n  return <MText>{nothing}</MText>\n}\n',
        },
        'Good',
      ).then(
        () => {
          throw new Error('generation must fail')
        },
        (error) => error,
      )
    expect(failure.diagnostics.map((item) => `${item.file}:${item.line}`)).toEqual([
      'shared/Bad.vue:6',
      'shared/Screen.lite.tsx:2',
      'shared/Typed.vue:7',
    ])
    expect(failure.message.split('\n')).toHaveLength(3)
  })
})
