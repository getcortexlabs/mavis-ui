import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname

type Output = {
  model: { components: { name: string; slots: unknown[] }[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>, root = 'Screen'): Promise<Output> =>
  compileProject(shared(files), { root })
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
const types = 'export type Task = { id: string; title: string; done: boolean }\n'

// The model without where each component was read from.
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])

describe('slots across the front-end boundary', () => {
  it('reads the slots fixture into one model from TSX and from Vue', async () => {
    const fromTsx: Output = await compileProject(await readShared(join(portable, 'slots')), {
      root: 'Slots',
    })
    const fromVue: Output = await compileProject(await readShared(join(portable, 'slotsVue')), {
      root: 'Slots',
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    const panel = portableModel(fromVue).components.find(
      (component: { name: string }) => component.name === 'Panel',
    )
    // Named slots where the view shows them first, the default slot last.
    expect(panel.slots).toEqual([
      { name: 'header', params: [] },
      { name: 'footer', params: [] },
      { name: 'default', params: [] },
    ])
    expect(fromVue.direct).toEqual(['shared/Panel.vue', 'shared/Slots.vue', 'shared/TaskList.vue'])
  })

  it('reads a default scoped slot from a children function and from v-slot', async () => {
    const names = {
      tsx: `import { For } from '@builder.io/mitosis'

export default function Names(props: {
  names: string[]
  children?: (props: { label: string; first: boolean }) => JSX.Element
}) {
  return (
    <MColumn gap="xs">
      <For each={props.names}>
        {(name, index) => (
          <MRow key={name}>
            {props.children?.({ label: name, first: index === 0 }) ?? <MText>{name}</MText>}
          </MRow>
        )}
      </For>
    </MColumn>
  )
}
`,
      vue: vue(
        'defineProps<{ names: string[] }>()\ndefineSlots<{ default?(props: { label: string; first: boolean }): unknown }>()',
        `  <MColumn gap="xs">
    <MRow v-for="(name, index) in names" :key="name">
      <slot :label="name" :first="index === 0"><MText>{{ name }}</MText></slot>
    </MRow>
  </MColumn>`,
      ),
    }
    const fromTsx = await compile({
      'Names.lite.tsx': names.tsx,
      'Screen.lite.tsx': `import { useStore } from '@builder.io/mitosis'
import Names from './Names.lite'

export default function Screen() {
  const state = useStore({ names: ['Ana', 'Bo'] as string[] })
  return (
    <MColumn gap="md">
      <Names names={state.names}>
        {({ label: person, first }) => <MText weight={first ? 'bold' : 'normal'}>Hi {person}</MText>}
      </Names>
      <Names names={state.names} />
    </MColumn>
  )
}
`,
    })
    const fromVue = await compile({
      'Names.vue': names.vue,
      'Screen.vue': vue(
        "import { ref } from 'vue'\nimport Names from './Names.vue'\nconst names = ref<string[]>(['Ana', 'Bo'])",
        `  <MColumn gap="md">
    <Names v-slot="{ label: person, first }" :names="names">
      <MText :weight="first ? 'bold' : 'normal'">Hi {{ person }}</MText>
    </Names>
    <Names :names="names" />
  </MColumn>`,
      ),
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.swift.get('Screen.swift')).toContain(
      'content: { (person: String, first: Bool) in',
    )
    expect(fromTsx.vue.get('Screen.vue')).toContain(
      '<template #default="{ label: person, first }">',
    )
  })
})

describe('slots in the generated code', () => {
  it('makes each slot a SwiftUI view with a default, shown or replaced by its fallback', async () => {
    const { swift } = await compileProject(await readShared(join(portable, 'slots')), {
      root: 'Slots',
    })
    const panel = swift.get('Panel.swift')!
    expect(panel).toContain('struct Panel<Header: View, Footer: View, Content: View>: View {')
    expect(panel).toContain('    let header: () -> Header')
    expect(panel).toContain(
      '        @ViewBuilder header: @escaping () -> Header = { MavisNoSlot() },',
    )
    expect(panel).toMatch(
      /if Header\.self == MavisNoSlot\.self \{\n\s+Text\(verbatim: self\.title\)[\s\S]*\} else \{\n\s+self\.header\(\)\n/,
    )
    expect(panel).toMatch(/\n\s+self\.content\(\)\n\s+self\.footer\(\)\n/)
    const list = swift.get('TaskList.swift')!
    expect(list).toContain(
      '        @ViewBuilder row: @escaping (Task, Double) -> Row = { _, _ in MavisNoSlot() },',
    )
    expect(list).toContain('self.row(task, (index + 1.0))')
    const screen = swift.get('Slots.swift')!
    // Every slot by its label; one left out takes its default.
    expect(screen).toMatch(/Panel\(\n\s+name: "plain",\n\s+title: "Plain panel"\n\s+\)/)
    expect(screen).toMatch(/footer: \{\n[\s\S]*?\},\n\s+content: \{\n/)
    expect(screen).toContain('row: { (task: Task, position: Double) in')
    expect(swift.get('MavisSlots.swift')).toContain('struct MavisNoSlot: View {')
    // Projects without slots are generated as before.
    const tasks = await compileProject(await readShared(join(portable, 'tasks')), { root: 'Tasks' })
    expect(tasks.swift.has('MavisSlots.swift')).toBe(false)
    expect(tasks.swift.get('TaskRow.swift')).toContain('struct TaskRow: View {')
  })

  it('prints a TSX component with slots as Vue with <slot>, <template #name> and defineSlots', async () => {
    const { vue: web, native } = await compileProject(await readShared(join(portable, 'slots')), {
      root: 'Slots',
    })
    for (const output of [web, native]) {
      const list = output.get('TaskList.vue')!
      expect(list).toContain(
        'defineSlots<{\n  row?: (props: { task: Task; position: number }) => unknown\n  empty?: () => unknown\n}>()',
      )
      expect(list).toContain('<slot name="row" :task="task" :position="(index + 1)">')
      expect(output.get('Panel.vue')).toMatch(/<slot \/>\n\s+<slot name="footer" \/>/)
      const screen = output.get('Slots.vue')!
      expect(screen).toContain('<template #row="{ task, position }">')
      expect(screen).toMatch(/<Panel :name="'custom'" :title="'Unused'">\n\s+<template #header>/)
      expect(screen).toContain(`<Panel :name="'plain'" :title="'Plain panel'" />`)
    }
  })
})

describe('names that are taken in Swift', () => {
  it('gives a slot another closure name when a member has its name, and labels content with it', async () => {
    const { swift } = await compile({
      'Card.vue': vue(
        "import { ref } from 'vue'\nconst footer = ref('x')\nconst content = ref('y')",
        '  <MColumn><MText>{{ footer }} {{ content }}</MText><slot name="footer" /><slot /></MColumn>',
      ),
      'Screen.vue': vue(
        "import Card from './Card.vue'",
        '  <Card><MText>Body</MText><template #footer><MText>Foot</MText></template></Card>',
      ),
    })
    const card = swift.get('Card.swift')!
    expect(card).toContain('let footerSlot: () -> Footer')
    expect(card).toContain('let contentSlot: () -> Content')
    expect(card).toContain('self.footerSlot()')
    expect(swift.get('Screen.swift')).toMatch(/footerSlot: \{[\s\S]*contentSlot: \{/)
  })

  it('gives a slot another view type when the component uses its name', async () => {
    const { swift } = await compile({
      'types.ts': 'export type Header = { text: string }\n',
      'Row.vue': vue('', '  <MText>row</MText>'),
      'Screen.vue': vue(
        "import type { Header } from './types'\nimport Row from './Row.vue'\ndefineProps<{ info: Header }>()",
        '  <MColumn><MText>{{ info.text }}</MText><Row /><slot name="header" /><slot name="row" /><slot name="text" /></MColumn>',
      ),
    })
    // Header is a record, Row a component and Text the SwiftUI view this file draws with.
    expect(swift.get('Screen.swift')).toContain(
      'struct Screen<HeaderContent: View, RowContent: View, TextContent: View>: View {',
    )
  })
})

describe('the guide', () => {
  it.each([
    ['English', '../docs/guide/macos-experimental.md'],
    ['Portuguese', '../docs/pt-BR/guide/macos-experimental.md'],
  ])('shows slots that compile for the Mac (%s)', async (_language, page) => {
    const guide = await readFile(new URL(page, import.meta.url), 'utf8')
    const section = guide.slice(guide.indexOf('### Slots'))
    const [panel, list, parent] = [...section.matchAll(/```vue\n([\s\S]*?)```/g)].map((match) =>
      match[1]!.replace(/^<!--.*-->\n/, ''),
    )
    const { swift } = await compile({
      'types.ts': types,
      'Panel.vue': panel!,
      'TaskList.vue': list!,
      'Screen.vue': vue(
        `import { ref } from 'vue'
import { MButton, MColumn, MText } from '#mavis'
import type { Task } from './types'
import Panel from './Panel.vue'
import TaskList from './TaskList.vue'
const tasks = ref<Task[]>([])
function finish(id: string) {
  tasks.value = tasks.value.filter((task) => task.id !== id)
}`,
        `  <MColumn>\n${parent}  </MColumn>`,
      ),
    })
    expect(swift.get('Panel.swift')).toContain(
      'struct Panel<Header: View, Footer: View, Content: View>: View {',
    )
    expect(swift.get('Screen.swift')).toContain('row: { (task: Task, position: Double) in')
  })
})

describe('what slots cannot do on the Mac', () => {
  const card = vue(
    'defineProps<{ title: string }>()',
    '  <MColumn gap="sm">\n    <slot name="header"><MText>{{ title }}</MText></slot>\n    <slot />\n  </MColumn>',
  )
  const list = vue(
    "import type { Task } from './types'\ndefineProps<{ tasks: Task[] }>()\ndefineSlots<{ row(props: { task: Task }): unknown }>()",
    '  <MColumn>\n    <MRow v-for="task in tasks" :key="task.id"><slot name="row" :task="task" /></MRow>\n  </MColumn>',
  )
  const using = (script: string, template: string, extra: Record<string, string> = {}) => ({
    ...extra,
    'Screen.vue': vue(script, template),
  })
  const withCard = (template: string, script = '') =>
    using(`import Card from './Card.vue'\n${script}`, template, { 'Card.vue': card })
  const withList = (template: string, script = '') =>
    using(
      `import { ref } from 'vue'\nimport type { Task } from './types'\nimport List from './List.vue'\nconst tasks = ref<Task[]>([])\n${script}`,
      template,
      { 'types.ts': types, 'List.vue': list },
    )
  const tsxCard =
    'export default function Card(props: { children?: JSX.Element; slotHeader?: JSX.Element }) {\n  return <MColumn>{props.slotHeader ?? <MText>Fallback</MText>}{props.children}</MColumn>\n}\n'

  it.each([
    [
      'a dynamic slot name in the parent',
      withCard(
        '  <Card title="x"><template #[which]><MText>x</MText></template></Card>',
        "const which = 'header'",
      ),
      'shared/Screen.vue:7:29: A dynamic slot name is not supported in shared screens for the Mac',
    ],
    [
      'a dynamic slot name in the child',
      using("const which = 'a'", '  <MColumn><slot :name="which" /></MColumn>'),
      'shared/Screen.vue:6:18: :name on <slot> is not supported in shared screens for the Mac: Vue reads it as a dynamic slot name',
    ],
    [
      '$slots',
      using(
        '',
        '  <MColumn>\n    <MText v-if="$slots.default">x</MText>\n    <slot />\n  </MColumn>',
      ),
      'shared/Screen.vue:7:18: $slots is not supported in shared screens for the Mac: a component cannot ask which slots it was given on the Mac yet',
    ],
    [
      'useSlots',
      using("import { useSlots } from 'vue'", '  <MText>x</MText>'),
      'shared/Screen.vue:2:10: useSlots from vue is not supported in shared screens for the Mac',
    ],
    [
      'keeping what defineSlots returns',
      using('const slots = defineSlots<{ default(): unknown }>()', '  <MColumn><slot /></MColumn>'),
      'shared/Screen.vue:2:15: Call defineSlots<{ … }>() on its own',
    ],
    [
      'a scoped slot without defineSlots',
      using(
        "import { ref } from 'vue'\nconst n = ref(1)",
        '  <MColumn><slot :count="n" /></MColumn>',
      ),
      'shared/Screen.vue:7:12: The slot default hands its content count: declare what it hands with defineSlots',
    ],
    [
      'a slot defineSlots does not list',
      using('defineSlots<{ header(): unknown }>()', '  <MColumn><slot name="footer" /></MColumn>'),
      'shared/Screen.vue:6:12: The slot footer is not declared in defineSlots.',
    ],
    [
      'a slot name with a dash',
      using('', '  <MColumn><slot name="header-title" /></MColumn>'),
      'shared/Screen.vue:6:18: Name a slot with letters and digits, for example headerTitle',
    ],
    [
      'a slot property called name',
      using(
        'defineSlots<{ default(props: { name: string }): unknown }>()',
        '  <MColumn><slot name="default" /></MColumn>',
      ),
      'A slot cannot hand its content a property called name',
    ],
    [
      'content for a slot the component does not have',
      withCard('  <Card title="x"><template #footer><MText>x</MText></template></Card>'),
      'shared/Screen.vue:7:19: Card has no slot footer; its slots are header, default.',
    ],
    [
      'taking properties from a slot that hands none',
      withCard('  <Card title="x"><template #header="{ item }"><MText>x</MText></template></Card>'),
      'shared/Screen.vue:7:38: The slot header of Card hands its content nothing; drop ="{ item }".',
    ],
    [
      'not taking a scoped slot apart',
      withList(
        '  <List :tasks="tasks"><template #row="props"><MText>{{ props.task.title }}</MText></template></List>',
      ),
      `shared/Screen.vue:10:40: Take the slot's properties apart by name, for example #row="{ item }".`,
    ],
    [
      'a property the slot does not hand',
      withList(
        '  <List :tasks="tasks"><template #row="{ item }"><MText>x</MText></template></List>',
      ),
      "shared/Screen.vue:10:42: Property 'item' does not exist on type '{ task: Task; }'.",
    ],
    [
      'a slot without a property it declares',
      using(
        "import type { Task } from './types'\ndefineProps<{ task: Task }>()\ndefineSlots<{ row(props: { task: Task; position: number }): unknown }>()",
        '  <MColumn><slot name="row" :task="task" /></MColumn>',
        { 'types.ts': types },
      ),
      'shared/Screen.vue:8:12: Give the slot row its property position: every target hands it over.',
    ],
    [
      'a slot property of the wrong type',
      using(
        "import type { Task } from './types'\ndefineProps<{ task: Task }>()\ndefineSlots<{ row(props: { task: Task }): unknown }>()",
        '  <MColumn><slot name="row" :task="task.title" /></MColumn>',
        { 'types.ts': types },
      ),
      'shared/Screen.vue:8:36: Expected Task, found string.',
    ],
    [
      'content that may render nothing where the slot has a fallback',
      withCard(
        '  <Card title="x"><template #header><MText v-if="on">x</MText></template></Card>',
        "import { ref } from 'vue'\nconst on = ref(false)",
      ),
      'shared/Screen.vue:8:19: Card shows its own content for header when it gets none, and the Web and NativeScript show it as well when the content passed renders nothing',
    ],
    [
      'a field in content a list repeats',
      withList(
        '  <List :tasks="tasks"><template #row="{ task }"><MInput v-model="note" :label="task.title" /></template></List>',
        "const note = ref('')",
      ),
      'shared/Screen.vue:10:24: List shows row more than once, so an MInput in this content would be repeated',
    ],
    [
      "a slot's <template> shown only sometimes",
      withCard(
        '  <Card title="x"><template v-if="on" #header><MText>a</MText></template></Card>',
        "import { ref } from 'vue'\nconst on = ref(true)",
      ),
      "shared/Screen.vue:8:29: v-if on a slot's <template> is not supported in shared screens for the Mac",
    ],
    [
      'the same slot filled twice',
      withCard(
        '  <Card title="x"><template #header><MText>a</MText></template><template #header><MText>b</MText></template></Card>',
      ),
      'shared/Screen.vue:7:64: Card gets content for header twice.',
    ],
    [
      'v-slot on the component beside <template #name>',
      withCard('  <Card title="x" v-slot><template #header><MText>a</MText></template></Card>'),
      'shared/Screen.vue:7:26: v-slot on Card fills its default slot',
    ],
    [
      'v-slot on a primitive',
      using('', '  <MColumn v-slot="{ a }"><MText>x</MText></MColumn>'),
      'shared/Screen.vue:6:12: v-slot goes on a shared component, or on a <template> directly inside one',
    ],
    [
      '<template #name> outside a component',
      using('', '  <MColumn><template #header><MText>x</MText></template></MColumn>'),
      'shared/Screen.vue:6:12: <template #…> goes directly inside the shared component whose slot it fills.',
    ],
    [
      'a slot in a text',
      using('', '  <MText><slot /></MText>'),
      'shared/Screen.vue:6:10: MText contains text and {{ values }} only.',
    ],
    [
      'MReveal directly in content',
      withCard('  <Card title="x"><MReveal :show="true"><MText>x</MText></MReveal></Card>'),
      'shared/Screen.vue:7:19: MReveal goes directly inside an MColumn, MStack or MCard.',
    ],
    [
      'TSX: a slot shown inside a text',
      {
        'Screen.lite.tsx':
          'export default function Screen(props: { children?: JSX.Element }) {\n  return <MText>{props.children}</MText>\n}\n',
      },
      'shared/Screen.lite.tsx:2:17:',
    ],
    [
      'TSX: a slot read as a value',
      {
        'Screen.lite.tsx':
          "import { Show } from '@builder.io/mitosis'\nexport default function Screen(props: { slotHeader?: JSX.Element }) {\n  return <MColumn><Show when={props.slotHeader !== undefined}><MText>x</MText></Show></MColumn>\n}\n",
      },
      'shared/Screen.lite.tsx:3:31: slotHeader is a slot: show it among the elements, for example {props.slotHeader}.',
    ],
    [
      'TSX: a slot that is not JSX',
      {
        'Screen.lite.tsx':
          'export default function Screen(props: { slotHeader?: string }) {\n  return <MColumn>{props.slotHeader}</MColumn>\n}\n',
      },
      'shared/Screen.lite.tsx:1:41: slotHeader is a slot: type it JSX.Element, or a function',
    ],
    [
      'TSX: a scoped slot shown without its properties',
      {
        'types.ts': types,
        'Screen.lite.tsx':
          "import type { Task } from './types'\nexport default function Screen(props: { slotRow?: (props: { task: Task }) => JSX.Element }) {\n  return <MColumn>{props.slotRow}</MColumn>\n}\n",
      },
      'shared/Screen.lite.tsx:3:20: The slot row hands its content task: show it as {props.slotRow?.({ task: … })}.',
    ],
    [
      'TSX: a shortcut in content',
      {
        'Card.lite.tsx': tsxCard,
        'Screen.lite.tsx':
          'import Card from \'./Card.lite\'\nexport default function Screen() {\n  return (\n    <Card>\n      <MButton text="Go" shortcut="mod+k" onClick={() => {}} />\n    </Card>\n  )\n}\n',
      },
      'shared/Screen.lite.tsx:5:26: A button with a shortcut stays on screen; keep it out of content passed to a component.',
    ],
    [
      'TSX: content that may render nothing where the slot has a fallback',
      {
        'Card.lite.tsx': tsxCard,
        'Screen.lite.tsx':
          "import { useStore, Show } from '@builder.io/mitosis'\nimport Card from './Card.lite'\nexport default function Screen() {\n  const state = useStore({ on: false })\n  return <Card slotHeader={<Show when={state.on}><MText>x</MText></Show>} />\n}\n",
      },
      'shared/Screen.lite.tsx:5:16: Card shows its own content for header when it gets none',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const failure = await compile(files as Record<string, string>).then(
      () => undefined,
      (error: Error) => error,
    )
    expect(failure, 'generation must fail').toBeInstanceOf(Error)
    expect(failure!.message).toContain(message)
    expect(failure!.message).toMatch(/^shared\/[A-Za-z]+\.(vue|lite\.tsx):\d+:\d+: /)
  })

  it('reports only the component whose own slot is wrong, not the parents that wait for it', async () => {
    const failure: Error & { diagnostics: { file: string }[] } = await compile({
      'Names.vue': vue(
        'defineProps<{ names: string[] }>()\ndefineSlots<{ default?(props: { label: string }): unknown }>()',
        '  <MColumn><MRow v-for="name in names" :key="name"><slot :name="name" /></MRow></MColumn>',
      ),
      'Screen.vue': vue(
        "import Names from './Names.vue'",
        '  <Names v-slot="{ label }" :names="[]"><MText>{{ label }}</MText></Names>',
      ),
    }).then(
      () => {
        throw new Error('generation must fail')
      },
      (error) => error,
    )
    expect(failure.diagnostics.map((item) => item.file)).toEqual(['shared/Names.vue'])
  })
})
