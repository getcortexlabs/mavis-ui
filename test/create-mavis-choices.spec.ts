import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { multiSelectProps } from '../packages/core/src/vue/configurator-props'
import { toggleMultiSelection } from '../packages/core/src/multi-select'
import { comboboxEmits, comboboxProps } from '../packages/core/src/vue/combobox'
import { comboboxMove } from '../packages/core/src/combobox'
import { transferListProps } from '../packages/core/src/vue/creative-props'
import { transferValues } from '../packages/core/src/creative-controls'
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
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    picked: [] as string[],\n    open: [] as string[],\n    one: undefined as string | undefined,\n    text: '',\n    count: 0,\n    off: false,\n    options: [{ value: 'a', label: 'A' }] as SelectOption[],\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nimport type { ChoiceOption } from '#mavis'\nconst picked = ref<string[]>([])\nconst text = ref('')\nconst count = ref(0)\nconst options: ChoiceOption[] = [{ value: 'a', label: 'A' }]\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
const problems = async (files: Record<string, string>) => {
  try {
    await compile(files)
  } catch (error) {
    return (error as { diagnostics: { file: string; line: number; message: string }[] }).diagnostics
      .map((item) => `${item.file}:${item.line}: ${item.message}`)
      .join('\n')
  }
  return ''
}
const controls = async () =>
  (await fixture('multiSelect', 'Guests')).swift.get('MavisControls.swift')!

describe('the choice fields in both formats', () => {
  it.each([
    ['multiSelect', 'Guests'],
    ['combobox', 'Trip'],
    ['comboboxKeys', 'Trip'],
    ['transferList', 'Team'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    // Each component's contract, the events it emits, and the names the portable sources give
    // the model value and the listeners.
    const contracts = {
      MMultiSelect: [
        multiSelectProps,
        ['update:modelValue'],
        { value: 'modelValue', onChange: 'update:modelValue' },
      ],
      MCombobox: [
        comboboxProps,
        Object.keys(comboboxEmits),
        {
          value: 'modelValue',
          onChange: 'update:modelValue',
          onQueryChange: 'update:query',
          onSelect: 'select',
          onFocus: 'focus',
          onBlur: 'blur',
        },
      ],
      MTransferList: [
        transferListProps,
        ['update:modelValue'],
        { value: 'modelValue', onChange: 'update:modelValue' },
      ],
    } as const
    for (const [name, [contract, emits, own]] of Object.entries(contracts)) {
      const names = own as Record<string, string>
      const known = [...Object.keys(contract), ...emits]
      expect(
        Object.keys(components[name].props).filter((prop) => !known.includes(names[prop] ?? prop)),
        name,
      ).toEqual([])
      // What is renamed for the Vue components is renamed to the contract's own name.
      for (const [from, to] of Object.entries(components[name].vue.rename ?? {}))
        expect(names[from], `${name}.${from}`).toBe(to)
    }
  })
})

describe('MMultiSelect', () => {
  it('passes the chosen values and the options, and takes the next list back', async () => {
    const { swift, vue: web, native } = await fixture('multiSelect', 'Guests')
    const view = swift.get('Guests.swift')!
    expect(view).toMatch(
      /MavisMultiSelect\(\n +label: "Guests",\n +values: self\.guests,\n +options: self\.people\.map \{ option in MavisChoice\(value: option\.value, label: option\.label, disabled: option\.disabled \?\? false\) \},\n +onChange: \{ \(value: \[String\]\) in\n +self\.guests = value\n +\},\n +maxSelected: 2\.0,\n +placeholder: "Choose guests",\n +helperText: "Up to two people",\n +disabled: self\.locked,\n +identifier: "guests"\n +\)/,
    )
    for (const output of [web, native])
      expect(output.get('Guests.vue')).toContain(
        '<MMultiSelect id="guests" label="Guests" :modelValue="state.guests" :options="state.people" @update:modelValue="(choices) => ((value) => state.guests = value)(choices.map(String))" :maxSelected="2" placeholder="Choose guests" helperText="Up to two people" :disabled="state.locked" />',
      )
  })

  it('writes every label and the layout of the field', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MRow>\n      <MMultiSelect label="Tags" value={state.picked} options={state.options} onChange={(value) => (state.picked = value)} searchLabel="Find" closeLabel="Close" emptyLabel="Nothing" removeLabel="Drop" error={state.text} readonly width="50%" grow={1} accessibilityHidden={state.off} />\n    </MRow>',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('searchLabel: "Find",')
    expect(view).toContain('closeLabel: "Close",')
    expect(view).toContain('emptyLabel: "Nothing",')
    expect(view).toContain('removeLabel: "Drop",')
    expect(view).toContain('error: self.text,')
    expect(view).toContain('readonly: true')
    expect(view).toContain('.accessibilityHidden(self.off)')
    expect(view).toContain('.mavisItem(grow: 1.0, width: .fraction(0.5))')
  })

  // The Mac decides the next list as toggleMultiSelection does for the Web.
  it('ports toggleMultiSelection', async () => {
    const runtime = await controls()
    expect(runtime).toContain('struct MavisMultiSelect: View {')
    expect(runtime).toContain(
      'guard !blocked, let option = options.first(where: { $0.value == value }), !option.disabled else { return }',
    )
    expect(runtime).toContain('onChange(values.filter { $0 != value })')
    expect(runtime).toContain('} else if !full {\n            onChange(values + [value])')
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disabled: true },
    ]
    const mac = (values: string[], value: string, max?: number) => {
      const option = options.find((each) => each.value === value)
      if (!option || option.disabled) return null
      if (values.includes(value)) return values.filter((each) => each !== value)
      return max !== undefined && values.length >= max ? null : [...values, value]
    }
    for (const [values, value, max] of [
      [[], 'a', undefined],
      [['a'], 'a', undefined],
      [['a'], 'b', 1],
      [['a'], 'b', 2],
      [['a'], 'c', undefined],
      [['a', 'b'], 'missing', undefined],
    ] as const)
      expect(mac([...values], value, max)).toEqual(
        toggleMultiSelection(options, values, value, max),
      )
  })

  it('opens its options in place and moves the chips through Jolt', async () => {
    const runtime = await controls()
    expect(runtime).toContain('MavisSelectionPanel(title: label, open: open && !blocked) {')
    expect(runtime).toContain('JoltPresence(open) {')
    expect(runtime).toContain('.joltLayout(value: values, transition: .spring(.smooth))')
    expect(runtime).toContain(
      '.accessibilityLabel(Text(verbatim: label + ": " + (chosen.isEmpty ? placeholder : chosen.map(\\.label).joined(separator: ", "))))',
    )
  })

  it('reads v-model and its own listener in a Vue file', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        'function keep(next: string[]) {\n  count.value = next.length\n}',
        '  <MColumn>\n    <MMultiSelect v-model="picked" label="Tags" :options="options" @update:model-value="keep" />\n  </MColumn>',
      ),
    })
    expect(swift.get('Home.swift')).toMatch(
      /onChange: \{ \(next: \[String\]\) in\n +self\.picked = next\n +self\.keep\(next\)\n +\}/,
    )
  })

  it.each([
    [
      '<MMultiSelect label="Tags" value={state.picked} options={state.options} onChange={(value) => (state.picked = value)} maxSelected={0} />',
      /maxSelected is a whole number, one or more\./,
    ],
    [
      '<MMultiSelect label="Tags" value={state.picked} options={state.options} onChange={(value) => (state.picked = value)} maxSelected={1.5} />',
      /maxSelected is a whole number, one or more\./,
    ],
    [
      '<MMultiSelect label="Tags" options={state.options} onChange={(value) => (state.picked = value)} />',
      /Home\.lite\.tsx:\d+: [^]*Property 'value' is missing/,
    ],
    [
      '<MMultiSelect label="Tags" value={state.picked} options={state.options} />',
      /Home\.lite\.tsx:\d+: [^]*Property 'onChange' is missing/,
    ],
    [
      '<MMultiSelect label="Tags" value={state.count} options={state.options} onChange={(value) => (state.picked = value)} />',
      /Home\.lite\.tsx:\d+: .*number/,
    ],
    [
      '<MMultiSelect label="Tags" value={state.picked} options={state.options} onChange={(value) => (state.picked = value)} tone="primary" />',
      /Home\.lite\.tsx:\d+: /,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('names what a Vue file is missing', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          '',
          '  <MColumn>\n    <MMultiSelect label="Tags" :options="options" />\n  </MColumn>',
        ),
      }),
    ).toMatch(/Home\.vue:\d+: MMultiSelect needs v-model\./)
  })
})

const city =
  'label="City" value={state.one} onChange={(value) => (state.one = value)} query={state.text} onQueryChange={(value) => (state.text = value)}'
const local = 'search={async (text) => state.options.filter((item) => item.label.includes(text))}'

describe('MCombobox', () => {
  it('passes the value, the query and a search that answers at once', async () => {
    const { swift, vue: web, native } = await fixture('comboboxKeys', 'Trip')
    const view = swift.get('Trip.swift')!
    expect(view).toContain('@FocusState private var mavisFocus: String?')
    expect(view).toMatch(
      /MavisCombobox\(\n +label: "City",\n +value: self\.city,\n +onChange: \{ \(value: String\?\) in\n +self\.city = value\n +\},\n +query: self\.query,\n +onQueryChange: \{ \(value: String\) in\n +self\.query = value\n +\},\n +search: \{ \(text: String\) -> \[MavisChoice\] in\n +self\.cities\.filter \{ \(item: SelectOption\) -> Bool in mavisIncludes\(item\.label\.lowercased\(\), text\.lowercased\(\)\) \}\.map \{ MavisChoice\(value: \$0\.value, label: \$0\.label, disabled: \$0\.disabled \?\? false\) \}\n +\},\n +focus: \$mavisFocus,\n +focusKey: "combobox1",/,
    )
    expect(view).toContain(
      'selectedOption: self.cities.first(where: { (item: SelectOption) -> Bool in (item.value == self.city) }).map { MavisChoice(',
    )
    expect(view).toContain(
      'initialResults: { (mavisPage: ComboboxSnapshot) in (mavisPage.query, mavisPage.options.map { MavisChoice(value: $0.value, label: $0.label, disabled: $0.disabled ?? false) }) }(ComboboxSnapshot(query: "l", options: ',
    )
    expect(view).toMatch(
      /onSelect: \{ mavisChoice in\n +let mavisSelect = \{ \(_: SelectOption\?\) in\n +self\.events \+= 1\.0\n +\}\n +mavisSelect\(mavisChoice\.map \{ SelectOption\(value: \$0\.value, label: \$0\.label, disabled: \$0\.disabled\) \}\)\n +\},\n +identifier: "city"/,
    )
    expect(swift.get('MavisTypes.swift')).toContain(
      'struct ComboboxSnapshot: Hashable {\n    var query: String\n    var options: [SelectOption]\n}',
    )
    for (const output of [web, native]) {
      const file = output.get('Trip.vue')!
      expect(file).toContain(
        ':modelValue="state.city ?? null" @update:modelValue="(choice) => ((value) => state.city = value)(choice === null ? undefined : String(choice))" :query="state.query" @update:query="(value) => state.query = value"',
      )
      expect(file).toContain(
        ':search="async (text) => state.cities.filter((item) => item.label.toLowerCase().includes(text.toLowerCase()))"',
      )
      expect(file).toContain(
        ":initialResults=\"{ query: 'l', options: state.cities.filter((item) => item.label.toLowerCase().includes('l')) }\"",
      )
      expect(file).toContain('@select="() => state.events += 1"')
    }
  })

  it('hands a listener the option that was chosen', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': tsx(
        `    <MCombobox ${city} search={(text) => Promise.resolve(state.options)} onSelect={(option) => (state.text = option?.label ?? '')} onFocus={() => (state.count += 1)} onBlur={() => (state.count -= 1)} clearable={false} minQueryLength={0} maxResults={5} debounce={120} />`,
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('search: { (text: String) -> [MavisChoice] in\n')
    expect(view).toContain('let mavisSelect = { (option: SelectOption?) in')
    expect(view).toContain('self.text = (option?.label ?? "")')
    expect(view).toMatch(/debounce: 120\.0,\n +minQueryLength: 0\.0,\n +maxResults: 5\.0,/)
    expect(view).toContain('clearable: false,')
    expect(view).toMatch(/onFocus: \{\n +self\.count \+= 1\.0\n +\},\n +onBlur: \{/)
    expect(web.get('Home.vue')).toContain(
      '@select="(option) => ((option) => state.text = (option?.label ?? \'\'))(option === null ? undefined : { ...option, value: String(option.value) })"',
    )
    expect(web.get('Home.vue')).toContain(':search="async (text) => state.options"')
  })

  // The Mac moves the highlight as comboboxMove does for the Web.
  it('ports the search policy and comboboxMove', async () => {
    const runtime = await controls()
    expect(runtime).toContain('struct MavisCombobox: View {')
    expect(runtime).toContain('if let cached, cached.query == query { return publish(cached) }')
    expect(runtime).toContain('guard Double(mavisTrim(query).utf16.count) >= minQueryLength else {')
    expect(runtime).toContain(
      'active = available[Swift.max(0, Swift.min(available.count - 1, index + direction))].value',
    )
    expect(runtime).toContain('case .escape where open: cancel()')
    expect(runtime).toContain(
      'MavisSelectionPanel(title: label, open: open && !disabled, spacing: 0, padding: 4) {',
    )
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ]
    const mac = (active: string | undefined, direction: 1 | -1) => {
      const available = options.filter((option) => !option.disabled)
      const index = available.findIndex((option) => option.value === active)
      if (index < 0) return (direction > 0 ? available[0] : available.at(-1))!.value
      return available[Math.max(0, Math.min(available.length - 1, index + direction))]!.value
    }
    for (const [active, direction] of [
      [undefined, 1],
      [undefined, -1],
      ['a', 1],
      ['c', 1],
      ['c', -1],
      ['a', -1],
      ['b', 1],
    ] as const)
      expect(`s:${mac(active, direction)}`).toBe(
        comboboxMove(options, active === undefined ? undefined : `s:${active}`, direction),
      )
  })

  it('reads v-model, v-model:query and a search written in the template', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        'const chosen = ref<string | null>(null)',
        '  <MColumn>\n    <MCombobox v-model="chosen" v-model:query="text" label="City" :search="async (typed) => options.filter((item) => item.label.includes(typed))" />\n  </MColumn>',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('@State private var chosen: String?')
    expect(view).toMatch(/onChange: \{ \(value: String\?\) in\n +self\.chosen = value\n +\}/)
    expect(view).toMatch(/onQueryChange: \{ \(value: String\) in\n +self\.text = value\n +\}/)
    expect(view).toContain('search: { (typed: String) -> [MavisChoice] in')
  })

  it.each([
    [
      `<MCombobox ${city} search={state.find} />`,
      'find(text: string) {\n      state.count += 1\n    },\n',
      /Home\.lite\.tsx:\d+: Type '\(text: string\) => void' is not assignable/,
    ],
    [
      `<MCombobox ${city} search={async (text, context) => state.options} />`,
      '',
      /search takes the query on the Mac: the context of a request belongs to a search that waits\. A search that waits for a service needs asynchronous functions on the Mac \(#340\)/,
    ],
    [
      `<MCombobox ${city} search={async (text) => { return state.options }} />`,
      '',
      /search returns the options as one expression: \(query\) => …, without braces\. A search that waits for a service needs asynchronous functions on the Mac \(#340\)/,
    ],
    [
      `<MCombobox ${city} search={async (text) => await Promise.resolve(state.options)} />`,
      '',
      /A search that waits for a service needs asynchronous functions on the Mac \(#340\)/,
    ],
    [
      `<MCombobox ${city} search={(text) => new Promise<SelectOption[]>(() => {})} />`,
      '',
      /search answers with a promise: write async \(query\) => options, or \(query\) => Promise\.resolve\(options\)\./,
    ],
    [
      `<MCombobox ${city} ${local} debounce={-1} />`,
      '',
      /debounce is a whole number from 0 to 60000\./,
    ],
    [
      `<MCombobox ${city} ${local} minQueryLength={1.5} />`,
      '',
      /minQueryLength is a whole number from 0 to 1000\./,
    ],
    [
      `<MCombobox ${city} ${local} maxResults={0} />`,
      '',
      /maxResults is a whole number from 1 to 100\./,
    ],
    [
      `<MCombobox label="City" value={state.one} onChange={(value) => (state.one = value)} ${local} />`,
      '',
      /Home\.lite\.tsx:\d+: [^]*query, onQueryChange/,
    ],
  ])('rejects %s', async (view, members, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`, `    ${members}`) })).toMatch(
      message,
    )
  })

  it('says a function that waits cannot be the search yet', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          'const chosen = ref<string | null>(null)\nasync function find(typed: string) {\n  return options\n}',
          '  <MColumn>\n    <MCombobox v-model="chosen" v-model:query="text" label="City" :search="find" />\n  </MColumn>',
        ),
      }),
    ).toMatch(/Home\.vue:\d+: An async function is not supported in shared screens for the Mac/)
  })

  it('names the v-model a Vue file is missing', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          'const chosen = ref<string | null>(null)',
          '  <MColumn>\n    <MCombobox v-model="chosen" label="City" :search="async () => options" />\n  </MColumn>',
        ),
      }),
    ).toMatch(/Home\.vue:\d+: MCombobox needs v-model:query\./)
  })
})

describe('MTransferList', () => {
  it('passes the options and the selected values, and takes the next list back', async () => {
    const { swift, vue: web, native } = await fixture('transferList', 'Team')
    const view = swift.get('Team.swift')!
    expect(view).toMatch(
      /MavisTransferList\(\n +label: "Team",\n +options: self\.people\.map \{ option in MavisChoice\(value: option\.value, label: option\.label, disabled: option\.disabled \?\? false\) \},\n +values: self\.team,\n +onChange: \{ \(value: \[String\]\) in\n +self\.choose\(value\)\n +\},\n +disabled: self\.locked,\n +availableLabel: "People",\n +selectedLabel: "Team members",\n +addLabel: "Add to team",\n +removeLabel: "Take off team",\n +emptyLabel: "Nobody here"\n +\)\n +\.mavisIdentifier\("team"\)/,
    )
    for (const output of [web, native])
      expect(output.get('Team.vue')).toContain(
        '<MTransferList id="team" label="Team" :options="state.people" :modelValue="state.team" @update:modelValue="(choices) => ((value) => state.choose(value))(choices.map(String))" :disabled="state.locked" availableLabel="People" selectedLabel="Team members" addLabel="Add to team" removeLabel="Take off team" emptyLabel="Nobody here" />',
      )
  })

  // The Mac decides the next value as transferValues does for the Web.
  it('ports transferValues and keeps what is checked through a move', async () => {
    const runtime = await controls()
    expect(runtime).toContain('struct MavisTransferList: View {')
    expect(runtime).toContain(
      'let moved = side(selected).filter { checked.contains($0.value) && !$0.disabled }.map(\\.value)',
    )
    expect(runtime).toContain('onChange(values.filter { !moved.contains($0) })')
    expect(runtime).toContain('onChange(values + moved.filter { !values.contains($0) })')
    expect(runtime).toContain('(!moving.contains(value) || next.contains(value) == leaving)')
    expect(runtime).toContain(
      'MavisStack(axis: .vertical, spacing: 16, align: .stretch, breakpoints: [MavisBreakpoint(at: 620, axis: .horizontal)]) {',
    )
    expect(runtime).toContain(
      '.joltLayout(value: animated ? values : [], transition: .spring(.smooth))',
    )
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disabled: true },
      { value: 'd', label: 'D' },
    ]
    const mac = (values: string[], checked: string[], selected: boolean) => {
      const moved = options
        .filter((option) => values.includes(option.value) === selected)
        .filter((option) => checked.includes(option.value) && !option.disabled)
        .map((option) => option.value)
      return selected
        ? values.filter((value) => !moved.includes(value))
        : [...values, ...moved.filter((value) => !values.includes(value))]
    }
    for (const [values, checked, selected] of [
      [['a'], ['b', 'd'], false],
      [['a'], ['b', 'c'], false],
      [['a', 'b'], ['a'], true],
      [['a', 'c'], ['a', 'c'], true],
      [['a'], ['a', 'b'], false],
      [[], [], false],
    ] as const) {
      const side = options
        .filter((option) => (values as readonly string[]).includes(option.value) === selected)
        .filter((option) => (checked as readonly string[]).includes(option.value))
        .map((option) => option.value)
      expect(mac([...values], [...checked], selected)).toEqual(
        transferValues(options, values, side, selected ? 'remove' : 'add'),
      )
    }
  })

  it('reads v-model in a Vue file', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        '',
        '  <MColumn>\n    <MTransferList v-model="picked" label="Tags" :options="options" :animated="false" search-label="Find" />\n  </MColumn>',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toMatch(/onChange: \{ \(value: \[String\]\) in\n +self\.picked = value\n +\}/)
    expect(view).toContain('animated: false,')
    expect(view).toContain('searchLabel: "Find"')
  })

  it.each([
    [
      '<MTransferList label="Tags" options={state.options} onChange={(value) => (state.picked = value)} />',
      /Home\.lite\.tsx:\d+: [^]*Property 'value' is missing/,
    ],
    [
      '<MTransferList label="Tags" options={state.options} value={state.picked} onChange={(value) => (state.picked = value)} maxSelected={2} />',
      /Home\.lite\.tsx:\d+: /,
    ],
    [
      '<MTransferList label="Tags" options={state.picked} value={state.picked} onChange={(value) => (state.picked = value)} />',
      /Home\.lite\.tsx:\d+: [^]*SelectOption/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })
})
