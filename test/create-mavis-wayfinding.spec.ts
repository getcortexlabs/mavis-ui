import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { tabsProps } from '../packages/core/src/vue/props'
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
const types =
  'export type Place = { value: string; label: string }\nexport type Numbered = { value: number; label: string }\n'
const tsx = (view: string, members = '') =>
  `import { Show, useStore } from '@builder.io/mitosis'\nimport type { Numbered, Place } from './types'\n\nexport default function Home() {\n  const state = useStore({\n    places: [] as Place[],\n    numbered: [] as Numbered[],\n    tabs: [] as TabOption[],\n    names: ['a'],\n    active: undefined as string | undefined,\n    page: 1,\n    open: false,\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nimport type { TabOption } from '@getcortexlabs/mavis-core'\nconst tabs = ref<TabOption[]>([])\nconst active = ref<string | null>(null)\nconst page = ref(1)\nconst open = ref(false)\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
    await compile({ 'types.ts': types, ...files })
  } catch (error) {
    return (error as { diagnostics: { message: string }[] }).diagnostics
      .map((item) => item.message)
      .join('\n')
  }
  return ''
}
const inTsx = (view: string, members = '') => problems({ 'Home.lite.tsx': tsx(view, members) })
const inVue = (template: string, script = '') => problems({ 'Home.vue': vue(script, template) })
const panel = '{({ value }) => <MText>{value}</MText>}'

describe('the navigation components in both formats', () => {
  it.each([['tabs', 'Space']])(
    'reads the %s fixture into one model from TSX and from Vue',
    async (name, root) => {
      const fromTsx = await fixture(name, root)
      const fromVue = await fixture(`${name}Vue`, root)
      expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
      expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
      expect(fromVue.direct).toContain(`shared/${root}.vue`)
    },
  )

  it('takes only properties of the published contracts', () => {
    // value and onChange are the model of a source that keeps its own state.
    const contracts = {
      MTabs: [tabsProps, ['value', 'onChange']],
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

describe('MTabs', () => {
  it('passes the tabs as its own type and the panel as a function of the value', async () => {
    const { swift, vue: web, native } = await fixture('tabs', 'Space')
    const view = swift.get('Space.swift')!
    expect(view).toContain(
      'tabs: self.tabs.map { item in MavisTab(value: item.value, label: item.label, disabled: item.disabled ?? false) },',
    )
    expect(view).toMatch(
      /MavisTabs\(\n +label: "Your space",\n +tabs: .+\n +value: self\.active,\n +onChange: \{ \(value: String\) in\n +self\.choose\(value\)\n +\},\n +disabled: self\.locked,\n +panel: \{ \(value: String\) in\n/,
    )
    expect(view).toContain('keepAlive: true,')
    expect(view).toContain('.mavisIdentifier("space")')
    for (const output of [web, native]) {
      const file = output.get('Space.vue')!
      expect(file).toContain(
        '<MTabs id="space" label="Your space" :tabs="state.tabs" :modelValue="state.active ?? null" @update:modelValue="(choice) => ((value) => state.choose(value))(String(choice))" :disabled="state.locked">',
      )
      expect(file).toContain('<template #default="{ value }">')
      expect(file).toContain(':keepAlive="true"')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisTabs<Panel: View>: View {')
    expect(controls).toContain('.joltLayout(value: value, transition: Self.slide)')
    expect(controls).toContain('.id(active.value)')
  })

  it('takes any record with a value and a label, and leaves out what it does not have', async () => {
    const { swift, vue: web } = await compile({
      'types.ts': types,
      'Home.lite.tsx': tsx(
        `    <MTabs label="Places" tabs={state.places} value="home" width="50%" grow={1}>\n      {({ value: place }) => <MText>{place}</MText>}\n    </MTabs>`,
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain(
      'tabs: self.places.map { item in MavisTab(value: item.value, label: item.label) },',
    )
    expect(view).toContain('value: "home",\n')
    expect(view).toContain('panel: { (place: String) in\n')
    expect(view).toContain('.mavisItem(grow: 1.0, width: .fraction(0.5))')
    const file = web.get('Home.vue')!
    expect(file).toContain(':modelValue="\'home\'"')
    expect(file).toContain('<template #default="{ value: place }">')
  })

  it('says what the tabs, the value and the panel must be', async () => {
    // The checker reads the tabs against the contract before the compiler does.
    expect(
      await inTsx(`<MTabs label="x" tabs={state.numbered} value={state.active}>${panel}</MTabs>`),
    ).toMatch(/Types of property 'value' are incompatible/)
    expect(
      await inTsx(`<MTabs label="x" tabs={state.names} value={state.active}>${panel}</MTabs>`),
    ).toMatch(/Type 'string' is not assignable to type '\{ readonly value: string/)
    expect(await inTsx(`<MTabs label="x" tabs={state.tabs}>${panel}</MTabs>`)).toMatch(
      /Property 'value' is missing/,
    )
    expect(
      await inVue(
        '  <MTabs label="x" :tabs="tabs" v-slot="{ value }"><MText>{{ value }}</MText></MTabs>',
      ),
    ).toMatch(/MTabs needs v-model/)
    expect(
      await inTsx(`<MTabs label="x" tabs={state.tabs} value={state.page}>${panel}</MTabs>`),
    ).toMatch(/Type 'number' is not assignable to type 'string'/)
    expect(
      await inTsx(
        `<MTabs label="x" tabs={state.tabs} value={state.active}><MText>Hi</MText></MTabs>`,
      ),
    ).toMatch(/provides no match for the signature '\(props: \{ value: string; \}\): Element'/)
    expect(
      await inTsx(
        `<MTabs label="x" tabs={state.tabs} value={state.active}>{({ tab }) => <MText>Hi</MText>}</MTabs>`,
      ),
    ).toMatch(/Property 'tab' does not exist on type '\{ value: string; \}'/)
    expect(
      await inVue(
        '  <MTabs v-model="active" label="x" :tabs="tabs">\n    <template #default><MText>Hi</MText></template>\n  </MTabs>',
      ),
    ).toMatch(
      /The default slot of MTabs hands its content properties: take what you need, as v-slot="\{ item \}"/,
    )
    expect(
      await inVue(
        '  <MTabs v-model="page" label="x" :tabs="tabs" v-slot="{ value }"><MText>{{ value }}</MText></MTabs>',
      ),
    ).toMatch(/number/)
  })
})
