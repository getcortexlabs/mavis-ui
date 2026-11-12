import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { accordionProps, listItemProps } from '../packages/core/src/vue/props'
import { timelineProps } from '../packages/core/src/vue/wayfinding-props'
import { dataTableProps, treeViewProps } from '../packages/core/src/vue/discovery-props'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname

type Output = {
  model: { components: { name: string; view: unknown }[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>): Promise<Output> =>
  compileProject(shared(files), { root: 'Home' })
const tsx = (view: string, members = '') =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    count: 0,\n    name: 'a',\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nconst count = ref(0)\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
const portableModel = ({ model }: Output) =>
  JSON.parse(
    JSON.stringify(model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
const swiftOf = ({ swift }: Output) =>
  [...swift].map(([name, text]) => [name, text.split('\n').slice(1).join('\n')])
const fixture = async (name: string, root: string): Promise<Output> =>
  compileProject(await readShared(join(portable, name)), { root })

describe('the list components in both formats', () => {
  it.each([
    ['rows', 'Team'],
    ['faq', 'Faq'],
    ['trail', 'Trail'],
    ['files', 'Files'],
    ['table', 'Library'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  // What a source writes differently from the contract: an event in place of a flag.
  it('takes only properties of the published contracts', () => {
    const contracts = {
      MListItem: [listItemProps, ['onClick']],
      MAccordion: [accordionProps, ['value', 'onChange']],
      MTimeline: [timelineProps, []],
      MTreeView: [treeViewProps, ['value', 'onChange', 'onExpandedChange', 'onLoad']],
      MDataTable: [dataTableProps, ['onSortChange', 'onSelectedChange']],
    } as const
    for (const [name, [contract, own]] of Object.entries(contracts)) {
      const accepted = Object.keys(components[name].props).filter(
        (prop) => !(own as readonly string[]).includes(prop),
      )
      expect(
        accepted.filter((prop) => !Object.keys(contract).includes(prop)),
        name,
      ).toEqual([])
    }
  })
})

describe('MListItem', () => {
  it('draws a row, and one button when it has an action', async () => {
    const { swift, vue: web, native } = await fixture('rows', 'Team')
    const view = swift.get('Team.swift')!
    expect(view).toMatch(
      /MavisListItem\(\n +title: "Marina Costa",\n +description: "Design, São Paulo",\n +leading: \{/,
    )
    expect(view).toContain('.mavisIdentifier("plain")')
    expect(view).toContain('.mavisItem(width: .points(220.0))')
    expect(view).toMatch(
      /Button\(action: \{\n +self\.opened = "Rui"\n +\}\) \{\n +MavisListItem\(\n +title: "Rui Tavares",\n +description: "Engineering",\n +arrow: true,/,
    )
    expect(view).toContain('.buttonStyle(MavisRowButtonStyle())')
    expect(view).toContain('.disabled(self.locked)')
    expect(view).toContain(
      '.accessibilityLabel(Text(verbatim: mavisListItemLabel("Ines Prado", "Support", "Open Ines Prado, away")))',
    )
    expect(view).toContain('.accessibilityIdentifier("mavis-card")')
    for (const output of [web, native]) {
      const file = output.get('Team.vue')!
      expect(file).toContain(
        '<MListItem title="Rui Tavares" description="Engineering" interactive @click="() => state.opened = \'Rui\'">',
      )
      expect(file).toContain('<template #leading>')
      expect(file).toContain('<template #trailing>')
      expect(file).toContain('<MListItem id="bare" title="Only a title" :grow="1" />')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisListItem<Leading: View, Trailing: View>: View {')
    expect(controls).toContain('MavisIcon("chevron-right", size: 16)')
    expect(controls).toContain('struct MavisRowButtonStyle: ButtonStyle {')
    // listItemLabel in the Mavis core.
    expect(controls).toContain(
      'return [mavisTrim(title), mavisTrim(description)].filter { !$0.isEmpty }.joined(separator: ". ")',
    )
  })

  it('keeps the id of a row that is a button, and hides it when asked', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MListItem id="open" title="Open" accessibilityHidden onClick={() => (state.count += 1)} />',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('.accessibilityIdentifier("open")')
    expect(view).toContain('.accessibilityHidden(true)')
    expect(view).toContain('mavisListItemLabel("Open", "", "")')
  })
})

describe('MAccordion', () => {
  it('opens the sections the screen lists and asks for a new list', async () => {
    const { swift, vue: web, native } = await fixture('faq', 'Faq')
    const view = swift.get('Faq.swift')!
    expect(view).toMatch(
      /MavisAccordion\(\n +label: "Order questions",\n +items: self\.questions,\n +entry: \{ MavisAccordionEntry\(value: \$0\.value, title: \$0\.title, description: \$0\.description \?\? "", icon: \$0\.icon \?\? "", disabled: \$0\.disabled \?\? false\) \},\n +expanded: self\.open,\n +onChange: \{ \(value: \[String\]\) in\n +self\.open = value\n +\}\n +\) \{ item in/,
    )
    // The body takes AccordionItem whatever the items are, as on the Web.
    expect(view).toContain(
      'items: self.topics.map { AccordionItem(value: $0.value, title: $0.title, description: nil, icon: nil, disabled: nil) },',
    )
    expect(view).toMatch(
      /multiple: true,\n +disabled: self\.frozen,\n +expandedLabel: "Open",\n +collapsedLabel: "Closed"\n/,
    )
    expect(view).toContain('.mavisIdentifier("answer-\\(item.value)")')
    for (const output of [web, native]) {
      const file = output.get('Faq.vue')!
      expect(file).toContain(
        '<MAccordion id="single" label="Order questions" :items="state.questions" :modelValue="state.open" @update:modelValue="(value) => state.open = value">',
      )
      expect(file).toContain('<template #default="{ item }">')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisAccordion<Item, Panel: View>: View {')
    // toggleAccordion in the Mavis core.
    expect(controls).toContain('guard !disabled, !section.disabled else { return }')
    expect(controls).toContain('onChange(expanded.filter { $0 != section.value })')
    expect(controls).toContain('onChange(multiple ? expanded + [section.value] : [section.value])')
    expect(controls).toContain('JoltPresence(open) {')
    expect(controls).toContain('MavisIcon(open ? "chevron-up" : "chevron-down", size: 16)')
  })

  it('reads the fields its items have, and shows headers without a body', async () => {
    const { swift, model } = await compile({
      'types.ts':
        'export type Part = { value: string; title: string; description: string; disabled?: boolean }\n',
      'Home.lite.tsx': tsx(
        '    <MAccordion id="parts" label="Parts" items={state.parts} accessibilityHidden grow={1} width="50%" />',
        '    parts: [] as Part[],\n',
      ).replace('import { useStore }', "import type { Part } from './types'\nimport { useStore }"),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('items: self.parts,')
    expect(view).toContain(
      'entry: { MavisAccordionEntry(value: $0.value, title: $0.title, description: $0.description, icon: "", disabled: $0.disabled ?? false) }',
    )
    expect(view).toContain(') { mavisItem in\n')
    expect(view).toContain('.mavisIdentifier("parts")')
    expect(view).toContain('.accessibilityHidden(true)')
    expect(view).toContain('.mavisItem(grow: 1.0, width: .fraction(0.5))')
    expect(JSON.stringify(model.records)).not.toContain('AccordionItem')
  })
})

describe('MTimeline', () => {
  it('shows the entries with their states and content', async () => {
    const { swift, vue: web, native, model } = await fixture('trail', 'Trail')
    const view = swift.get('Trail.swift')!
    expect(view).toMatch(
      /MavisTimeline\(\n +label: "Order activity",\n +items: self\.events,\n +entry: \{ MavisTimelineEntry\(key: \$0\.key, title: \$0\.title, description: \$0\.description \?\? "", time: \$0\.time \?\? "", status: \$0\.status \?\? "complete", icon: \$0\.icon \?\? ""\) \}\n +\) \{ item, mavisIndex in/,
    )
    // The content takes TimelineItem whatever the items are, as on the Web.
    expect(view).toContain(
      'items: self.stages.map { TimelineItem(key: $0.key, title: $0.title, description: nil, time: nil, status: $0.status, icon: nil) },',
    )
    expect(view).toContain(
      'statusLabels: MavisTimelineLabels(complete: "Feito", current: "Agora", upcoming: "Depois", error: "Erro")',
    )
    expect(view).toContain(') { item, index in\n')
    expect(view).toMatch(
      /items: self\.none,\n +entry: \{ MavisTimelineEntry\(key: \$0\.key, title: \$0\.title, description: "", time: "", status: \$0\.status, icon: ""\) \},\n +emptyLabel: "Nothing planned"\n +\) \{ mavisItem, mavisIndex in/,
    )
    expect(view).toContain('.mavisIdentifier("trail")')
    expect((model.records as { name: string }[]).map((record) => record.name)).toEqual([
      'TimelineItem',
      'Stage',
      'TimelineLabels',
    ])
    for (const output of [web, native]) {
      const file = output.get('Trail.vue')!
      expect(file).toContain('<MTimeline id="trail" label="Order activity" :items="state.events">')
      expect(file).toContain('<template #default="{ item, index }">')
      expect(file).toContain(
        ":statusLabels=\"{ complete: 'Feito', current: 'Agora', upcoming: 'Depois', error: 'Erro' }\"",
      )
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisTimeline<Item, Detail: View>: View {')
    expect(controls).toContain(
      'return entry.status == "complete" ? "check" : entry.status == "error" ? "circle-alert" : "circle-dot"',
    )
    expect(controls).toContain('.joltPreset(.fadeInUp, active: entered)')
    expect(controls).toContain(
      '.joltLayout(value: items.map { entry($0).key }, transition: .spring(.smooth))',
    )
  })

  it('reads statusLabels from a value of the screen', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MTimeline label="Steps" items={state.steps} statusLabels={state.labels} />',
        "    steps: [] as TimelineItem[],\n    labels: { complete: 'a', current: 'b', upcoming: 'c', error: 'd' } as TimelineLabels,\n",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'statusLabels: { let labels = self.labels; return MavisTimelineLabels(complete: labels.complete, current: labels.current, upcoming: labels.upcoming, error: labels.error) }()',
    )
  })
})

describe('MTreeView', () => {
  it('selects, opens and asks for the children of a branch', async () => {
    const { swift, vue: web, native, model } = await fixture('files', 'Files')
    const view = swift.get('Files.swift')!
    expect(view).toMatch(
      /MavisTree\(\n +label: "Files",\n +nodes: self\.nodes,\n +entry: \{ MavisTreeEntry\(key: \$0\.key, label: \$0\.label, disabled: \$0\.disabled \?\? false, hasChildren: \$0\.hasChildren \?\? false\) \},\n +children: \{ \$0\.children \},\n +selected: self\.selected,\n +onChange: \{ \(value: String\) in\n +self\.selected = value\n +\},\n +expanded: self\.open,\n +onExpandedChange: \{ \(value: \[String\]\) in\n +self\.open = value\n +\},\n +loadingKeys: self\.loading,\n +onLoad: \{ \(node: TreeNode\) in\n +self\.load\(node\)\n +\}\n +\)/,
    )
    expect(view).toContain('.mavisIdentifier("files")')
    expect(view).toMatch(/disabled: true,\n +emptyLabel: "Nothing archived"\n/)
    // A node holds its children: the record refers to itself.
    expect(swift.get('MavisTypes.swift')).toContain('var children: [TreeNode]?')
    expect(model.records).toEqual([
      {
        name: 'TreeNode',
        fields: [
          { name: 'key', type: { k: 'string' } },
          { name: 'label', type: { k: 'string' } },
          { name: 'disabled', type: { k: 'optional', of: { k: 'boolean' } } },
          {
            name: 'children',
            type: { k: 'optional', of: { k: 'array', of: { k: 'record', name: 'TreeNode' } } },
          },
          { name: 'hasChildren', type: { k: 'optional', of: { k: 'boolean' } } },
        ],
      },
    ])
    for (const output of [web, native]) {
      const file = output.get('Files.vue')!
      expect(file).toContain(
        '<MTreeView id="files" label="Files" :nodes="state.nodes" :modelValue="state.selected" @update:modelValue="(value) => state.selected = value" :expanded="state.open" @update:expanded="(value) => state.open = value" :loadingKeys="state.loading" @load="(node) => state.load(node)" />',
      )
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisTree<Node>: View {')
    // treeBranch and toggle in the Mavis core.
    expect(controls).toContain(
      'var branch: Bool { loaded ? !children.isEmpty : entry.hasChildren }',
    )
    expect(controls).toContain(
      'guard !disabled, !node.entry.disabled, node.branch, !loadingKeys.contains(key), open != isOpen else { return }',
    )
    expect(controls).toContain(
      'onExpandedChange(open ? expanded + [key] : expanded.filter { $0 != key })',
    )
    expect(controls).toContain(
      'if open, !node.loaded, let original = find(key, in: nodes) { onLoad(original) }',
    )
    expect(controls).toContain('JoltPresence(context.expanded.contains(node.entry.key)) {')
    expect(controls).toContain(
      '.joltMotion(to: open ? Self.opened : .identity, transition: .spring(.snappy))',
    )
    expect(controls).toContain('.onKeyPress(action: key)')
  })
})

describe('MDataTable', () => {
  it('sorts, selects and shows the fields its columns name', async () => {
    const { swift, vue: web, native } = await fixture('table', 'Library')
    const view = swift.get('Library.swift')!
    expect(view).toMatch(
      /MavisTable\(\n +label: "Library",\n +items: self\.ordered,\n +key: \{ \$0\.id \},\n +columns: self\.columns,\n +column: \{ MavisTableColumn\(key: \$0\.key, label: \$0\.label, sortable: \$0\.sortable \?\? false, width: \$0\.width, alignEnd: \$0\.align == "end"\) \},\n +text: \{ \(mavisRow: Book, mavisKey: String\) -> String in\n +switch mavisKey \{/,
    )
    // String(item[column.key] ?? '—') on the Web, for each field a cell can show.
    expect(view).toContain('case "title": return mavisRow.title')
    expect(view).toContain('case "pages": return mavisString(mavisRow.pages)')
    expect(view).toContain('case "note": return mavisRow.note ?? "—"')
    expect(view).toContain('case "lent": return String(mavisRow.lent)')
    expect(view).toContain('default: return "—"')
    expect(view).toContain(
      'sort: self.sort.map { MavisTableSort(key: $0.key, ascending: $0.direction == "ascending") },',
    )
    expect(view).toMatch(
      /onSortChange: \{ mavisSort in\n +\(\{ \(value: DataSort\?\) in\n +self\.sort = value\n +\}\)\(mavisSort\.map \{ DataSort\(key: \$0\.key, direction: \$0\.ascending \? "ascending" : "descending"\) \}\)\n +\}/,
    )
    expect(view).toContain('rowDisabled: { (item: Book) -> Bool in item.lent },')
    expect(view).toContain('rowLabel: { (item: Book) -> String in item.title },')
    expect(view).toContain(
      'cell: { (mavisItem: Book, mavisIndex: Double, mavisColumn: DataColumn) in\n                    MavisTableDefault()',
    )
    // The cell slot takes DataColumn whatever the columns are, as on the Web.
    expect(view).toContain(
      'columns: self.short.map { DataColumn(key: $0.key, label: $0.label, sortable: nil, width: $0.width, align: nil) },',
    )
    expect(view).toContain('cell: { (item: Book, index: Double, column: DataColumn) in')
    expect(view).toContain('.mavisIdentifier("mark-\\(item.id)")')
    expect(view).toContain(
      'column: { MavisTableColumn(key: $0.key, label: $0.label, sortable: false, width: $0.width, alignEnd: false) },',
    )
    for (const output of [web, native]) {
      const file = output.get('Library.vue')!
      expect(file).toContain(
        ':sort="state.sort" @update:sort="(sort) => ((value) => state.sort = value)(sort ?? undefined)" :selected="state.selected" @update:selected="(value) => state.selected = value"',
      )
      expect(file).toContain(':rowDisabled="(item) => item.lent" :rowLabel="(item) => item.title"')
      expect(file).toContain('<template #cell="{ item, column, index }">')
      expect(file).toContain('<template #actions>')
      expect(file).toContain('<template #footer>')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      'struct MavisTable<Item, Column, Cell: View, Actions: View, Empty: View, Footer: View>: View {',
    )
    // selectPage and nextDataSort in the Mavis core.
    expect(controls).toContain('let rest = selected.filter { !keys.contains($0) }')
    expect(controls).toContain('onSelectedChange(checked ? rest + keys : rest)')
    expect(controls).toContain(
      'onSortChange(sort?.ascending == true ? MavisTableSort(key: key, ascending: false) : nil)',
    )
    expect(controls).toContain('.joltLayout(value: items.map(key), transition: .spring(.smooth))')
    expect(controls).toContain('.joltShimmer(shimmer)')
  })

  it('keys its rows by another field and takes the key in a cell', async () => {
    const { swift } = await compile({
      'types.ts': 'export type Row = { code: string; name: string }\n',
      'Home.lite.tsx': tsx(
        '    <MDataTable\n      label="Rows"\n      items={state.rows}\n      itemKey="code"\n      columns={state.columns}\n      sort={{ key: \'name\', direction: \'ascending\' }}\n      slotCell={({ itemKey }) => <MText>{itemKey}</MText>}\n      slotEmpty={<MText>None</MText>}\n    />',
        '    rows: [] as Row[],\n    columns: [] as DataColumn[],\n',
      ).replace('import { useStore }', "import type { Row } from './types'\nimport { useStore }"),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('key: { $0.code },')
    expect(view).toContain(
      'sort: { MavisTableSort(key: $0.key, ascending: $0.direction == "ascending") }(DataSort(key: "name", direction: "ascending")),',
    )
    expect(view).toMatch(
      /cell: \{ \(mavisItem: Row, mavisIndex: Double, mavisColumn: DataColumn\) in\n +let itemKey = mavisItem\.code\n/,
    )
    expect(view).toMatch(/empty: \{\n +Text\(verbatim: "None"\)/)
  })
})

describe('what the list components cannot do on the Mac', () => {
  it.each([
    [
      "a column's value function",
      {
        'types.ts': 'export type Row = { id: string; name: string }\n',
        'Home.lite.tsx': tsx(
          "    <MDataTable label=\"a\" items={state.rows} columns={[{ key: 'name', label: 'Name', value: (row: Row) => row.name }]} />",
          '    rows: [] as Row[],\n',
        ).replace('import { useStore }', "import type { Row } from './types'\nimport { useStore }"),
      },
      "shared/Home.lite.tsx:11:46: A column's value function needs shared functions, which the Mac does not have yet (#340).",
    ],
    [
      'a key computed by a function',
      {
        'types.ts': 'export type Row = { id: string; name: string }\n',
        'Home.lite.tsx': tsx(
          '    <MDataTable label="a" items={state.rows} columns={state.columns} itemKey={state.name} />',
          '    rows: [] as Row[],\n    columns: [] as DataColumn[],\n',
        ).replace('import { useStore }', "import type { Row } from './types'\nimport { useStore }"),
      },
      'shared/Home.lite.tsx:12:',
    ],
    [
      'rows keyed by a number',
      {
        'types.ts': 'export type Row = { id: number; name: string }\n',
        'Home.lite.tsx': tsx(
          '    <MDataTable label="a" items={state.rows} columns={state.columns} />',
          '    rows: [] as Row[],\n    columns: [] as DataColumn[],\n',
        ).replace('import { useStore }', "import type { Row } from './types'\nimport { useStore }"),
      },
      'shared/Home.lite.tsx:12:5: Every row needs the key id, a string: the selected keys are strings on the Mac. Name another field with itemKey.',
    ],
    [
      'a row function with a body',
      {
        'types.ts': 'export type Row = { id: string; name: string }\n',
        'Home.lite.tsx': tsx(
          '    <MDataTable label="a" items={state.rows} columns={state.columns} rowLabel={(item) => { return item.name }} />',
          '    rows: [] as Row[],\n    columns: [] as DataColumn[],\n',
        ).replace('import { useStore }', "import type { Row } from './types'\nimport { useStore }"),
      },
      'Use a one-parameter arrow with an expression body, for example (task) => task.done.',
    ],
    [
      'the value of a cell in the cell slot',
      {
        'types.ts': 'export type Row = { id: string; name: string }\n',
        'Home.vue': vue(
          "import { MDataTable, MText, type DataColumn } from '#mavis'\nimport type { Row } from './types'\nconst rows = ref<Row[]>([])\nconst columns = ref<DataColumn[]>([])",
          '  <MDataTable label="a" :items="rows" :columns="columns">\n    <template #cell="{ value }"><MText>{{ value }}</MText></template>\n  </MDataTable>',
        ),
      },
      "shared/Home.vue:12:24: Property 'value' does not exist on type",
    ],
    [
      'a slot for one column in Vue',
      {
        'types.ts': 'export type Row = { id: string; name: string }\n',
        'Home.vue': vue(
          "import { MDataTable, MText, type DataColumn } from '#mavis'\nimport type { Row } from './types'\nconst rows = ref<Row[]>([])\nconst columns = ref<DataColumn[]>([])",
          '  <MDataTable label="a" :items="rows" :columns="columns">\n    <template #cell:name="{ item }"><MText>{{ item.name }}</MText></template>\n  </MDataTable>',
        ),
      },
      'shared/Home.vue:12:5: MDataTable has no slot cell:name; its slots are actions, cell, empty, footer.',
    ],
    [
      'tree nodes of another type',
      {
        'types.ts': 'export type Folder = { key: string; label: string }\n',
        'Home.lite.tsx': tsx(
          '    <MTreeView label="a" nodes={state.folders} />',
          '    folders: [] as Folder[],\n',
        ).replace(
          'import { useStore }',
          "import type { Folder } from './types'\nimport { useStore }",
        ),
      },
      'shared/Home.lite.tsx:11:26: MTreeView takes nodes of the Mavis type TreeNode: { key: string; label: string; disabled?: boolean; children?: TreeNode[]; hasChildren?: boolean }[].',
    ],
    [
      'a tree without a label',
      {
        'Home.lite.tsx': tsx(
          '    <MTreeView label="" nodes={state.nodes} />',
          '    nodes: [] as TreeNode[],\n',
        ),
      },
      'shared/Home.lite.tsx:10:16: MTreeView needs a label that is not empty.',
    ],
    [
      'a selected key that is not text',
      {
        'Home.lite.tsx': tsx(
          '    <MTreeView label="a" nodes={state.nodes} value={state.count} />',
          '    nodes: [] as TreeNode[],\n',
        ),
      },
      "shared/Home.lite.tsx:10:46: Type 'number' is not assignable to type 'string'.",
    ],
    [
      'a load handler that takes the wrong argument in Vue',
      {
        'Home.vue': vue(
          "import { MTreeView, type TreeNode } from '#mavis'\nconst nodes = ref<TreeNode[]>([])\nfunction load(key: number) {\n  count.value = key\n}",
          '  <MTreeView label="a" :nodes="nodes" @load="load" />',
        ),
      },
      'shared/Home.vue:12:',
    ],
    [
      'v-model:expanded on a value that is not a list in Vue',
      {
        'Home.vue': vue(
          "import { MTreeView, type TreeNode } from '#mavis'\nconst nodes = ref<TreeNode[]>([])",
          '  <MTreeView v-model:expanded="count" label="a" :nodes="nodes" />',
        ),
      },
      'shared/Home.vue:9:',
    ],
    [
      'a timeline without a label',
      {
        'Home.lite.tsx': tsx(
          '    <MTimeline label=" " items={state.steps} />',
          '    steps: [] as TimelineItem[],\n',
        ),
      },
      'shared/Home.lite.tsx:10:16: MTimeline needs a label that is not empty.',
    ],
    [
      'a status the timeline does not have',
      {
        'types.ts': 'export type Step = { key: string; title: string; status: string }\n',
        'Home.lite.tsx': tsx(
          '    <MTimeline label="a" items={state.steps} />',
          '    steps: [] as Step[],\n',
        ).replace(
          'import { useStore }',
          "import type { Step } from './types'\nimport { useStore }",
        ),
      },
      "Type 'string' is not assignable to type 'TimelineStatus | undefined'.",
    ],
    [
      'statusLabels with a label missing',
      {
        'Home.lite.tsx': tsx(
          '    <MTimeline label="a" items={state.steps} statusLabels={{ complete: \'a\' }} />',
          '    steps: [] as TimelineItem[],\n',
        ),
      },
      'shared/Home.lite.tsx:10:',
    ],
    [
      'a listener on a timeline in Vue',
      {
        'Home.vue': vue(
          "import { MTimeline, type TimelineItem } from '#mavis'\nconst steps = ref<TimelineItem[]>([])",
          '  <MTimeline label="a" :items="steps" @click="count += 1" />',
        ),
      },
      'shared/Home.vue:9:39: MTimeline does not take @click on the Mac.',
    ],
    [
      'accordion items that are not records',
      {
        'Home.lite.tsx': tsx(
          '    <MAccordion label="a" items={state.names} />',
          "    names: ['a'],\n",
        ),
      },
      "shared/Home.lite.tsx:10:27: Type 'string[]' is not assignable to type",
    ],
    [
      'accordion items without a title',
      {
        'types.ts': 'export type Part = { value: string }\n',
        'Home.lite.tsx': tsx(
          '    <MAccordion label="a" items={state.parts} />',
          '    parts: [] as Part[],\n',
        ).replace(
          'import { useStore }',
          "import type { Part } from './types'\nimport { useStore }",
        ),
      },
      "shared/Home.lite.tsx:11:27: Type 'Part[]' is not assignable to type",
    ],
    [
      'an accordion without a label',
      {
        'Home.lite.tsx': tsx(
          '    <MAccordion label="" items={state.parts} />',
          '    parts: [] as AccordionItem[],\n',
        ),
      },
      'shared/Home.lite.tsx:10:17: MAccordion needs a label that is not empty.',
    ],
    [
      'an accordion body that is not a function',
      {
        'Home.lite.tsx': tsx(
          '    <MAccordion label="a" items={state.parts}>\n      <MText>x</MText>\n    </MAccordion>',
          '    parts: [] as AccordionItem[],\n',
        ),
      },
      "shared/Home.lite.tsx:11:7: Type 'Element' is not assignable to type",
    ],
    [
      'a property the accordion body is not handed',
      {
        'Home.lite.tsx': tsx(
          '    <MAccordion label="a" items={state.parts}>\n      {({ row }) => <MText>x</MText>}\n    </MAccordion>',
          '    parts: [] as AccordionItem[],\n',
        ),
      },
      "shared/Home.lite.tsx:11:11: Property 'row' does not exist on type '{ item: AccordionItem; }'.",
    ],
    [
      'open values that are not a list',
      {
        'Home.lite.tsx': tsx(
          '    <MAccordion label="a" items={state.parts} value={state.name} />',
          '    parts: [] as AccordionItem[],\n',
        ),
      },
      "shared/Home.lite.tsx:10:47: Type 'string' is not assignable to type 'readonly string[]'.",
    ],
    [
      'accordion content without the item in Vue',
      {
        'Home.vue': vue(
          "import { MAccordion, MText, type AccordionItem } from '#mavis'\nconst parts = ref<AccordionItem[]>([])",
          '  <MAccordion label="a" :items="parts"><MText>x</MText></MAccordion>',
        ),
      },
      'shared/Home.vue:9:3: MAccordion takes no children; give its content as <template #default>.',
    ],
    [
      'a named v-model the accordion does not have',
      {
        'Home.vue': vue(
          "import { MAccordion, type AccordionItem } from '#mavis'\nconst parts = ref<AccordionItem[]>([])\nconst open = ref<string[]>([])",
          '  <MAccordion v-model:open="open" label="a" :items="parts" />',
        ),
      },
      'shared/Home.vue:10:15: MAccordion does not take v-model:open on the Mac.',
    ],
    [
      'an empty title',
      { 'Home.lite.tsx': tsx('    <MListItem title=" " />') },
      'shared/Home.lite.tsx:9:16: MListItem needs a title that is not empty.',
    ],
    [
      'a row without a title',
      { 'Home.lite.tsx': tsx('    <MListItem description="x" />') },
      'shared/Home.lite.tsx:9:6: ',
    ],
    [
      'children in a row',
      {
        'Home.lite.tsx': tsx('    <MListItem title="a">\n      <MText>x</MText>\n    </MListItem>'),
      },
      "shared/Home.lite.tsx:9:6: Type '{ children: Element; title: string; }' is not assignable",
    ],
    [
      'a button in a row that is a button',
      {
        'Home.lite.tsx': tsx(
          '    <MListItem\n      title="a"\n      onClick={() => (state.count += 1)}\n      slotTrailing={<MButton text="b" onClick={() => (state.count += 1)} />}\n    />',
        ),
      },
      'shared/Home.lite.tsx:9:5: An MListItem with an action is one button, so its trailing slot shows content only',
    ],
    [
      'an unknown slot',
      { 'Home.lite.tsx': tsx('    <MListItem title="a" slotFooter={<MText>x</MText>} />') },
      "Property 'slotFooter' does not exist on type",
    ],
    [
      'interactive without a listener in Vue',
      {
        'Home.vue': vue(
          "import { MListItem } from '#mavis'",
          '  <MListItem title="a" interactive />',
        ),
      },
      'shared/Home.vue:8:24: interactive needs @click.',
    ],
    [
      'a listener without interactive in Vue',
      {
        'Home.vue': vue(
          "import { MListItem } from '#mavis'",
          '  <MListItem title="a" @click="count += 1" />',
        ),
      },
      'shared/Home.vue:8:3: MListItem needs interactive to answer click.',
    ],
    [
      'content between the tags in Vue',
      {
        'Home.vue': vue(
          "import { MListItem, MText } from '#mavis'",
          '  <MListItem title="a"><MText>x</MText></MListItem>',
        ),
      },
      'shared/Home.vue:8:3: MListItem takes no children; give its content as <template #leading> or <template #trailing>.',
    ],
    [
      'a field in a row that is a button, in Vue',
      {
        'Home.vue': vue(
          "import { MInput, MListItem } from '#mavis'\nconst text = ref('')",
          '  <MListItem title="a" interactive @click="count += 1">\n    <template #leading><MInput v-model="text" label="b" /></template>\n  </MListItem>',
        ),
      },
      'An MListItem with an action is one button, so its leading slot shows content only',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const failure = await compile(files as Record<string, string>).then(
      () => undefined,
      (error: Error) => error,
    )
    expect(failure, 'generation must fail').toBeInstanceOf(Error)
    expect(failure!.message).toContain(message)
  })
})
