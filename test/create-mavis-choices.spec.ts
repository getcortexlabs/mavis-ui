import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { multiSelectProps } from '../packages/core/src/vue/configurator-props'
import { toggleMultiSelection } from '../packages/core/src/multi-select'
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
  it.each([['multiSelect', 'Guests']])(
    'reads the %s fixture into one model from TSX and from Vue',
    async (name, root) => {
      const fromTsx = await fixture(name, root)
      const fromVue = await fixture(`${name}Vue`, root)
      expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
      expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
      expect(fromVue.direct).toEqual([`shared/${root}.vue`])
    },
  )

  it('takes only properties of the published contracts', () => {
    const contracts = {
      MMultiSelect: [multiSelectProps, { value: 'modelValue', onChange: 'update:modelValue' }],
    } as const
    for (const [name, [contract, own]] of Object.entries(contracts)) {
      const names = own as Record<string, string>
      const accepted = Object.keys(components[name].props).filter((prop) => !(prop in names))
      expect(
        accepted.filter((prop) => !Object.keys(contract).includes(prop)),
        name,
      ).toEqual([])
      expect(components[name].vue.rename, name).toMatchObject(
        Object.fromEntries(Object.entries(names).filter(([, to]) => !to.startsWith('@'))),
      )
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
