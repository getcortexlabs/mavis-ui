import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { tabsProps } from '../packages/core/src/vue/props'
import { paginationProps, stepsProps } from '../packages/core/src/vue/workflow-props'
import { pagination } from '../packages/core/src/navigation'
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
  it.each([
    ['tabs', 'Space'],
    ['steps', 'Checkout'],
    ['pagination', 'Results'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toContain(`shared/${root}.vue`)
  })

  it('takes only properties of the published contracts', () => {
    // value and onChange are the model of a source that keeps its own state.
    const contracts = {
      MTabs: [tabsProps, ['value', 'onChange']],
      MSteps: [stepsProps, ['value', 'onChange']],
      MPagination: [paginationProps, ['value', 'onChange']],
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

describe('MSteps', () => {
  it('passes the steps as its own type, with the state each one is in', async () => {
    const { swift, vue: web, native } = await fixture('steps', 'Checkout')
    const view = swift.get('Checkout.swift')!
    expect(view).toMatch(
      /MavisSteps\(\n +label: "Checkout",\n +steps: self\.steps\.map \{ item in MavisStep\(value: item\.value, label: item\.label, disabled: item\.disabled \?\? false, status: item\.status \?\? ""\) \},\n +value: self\.current,\n +onChange: \{ \(value: String\) in\n +self\.go\(value\)\n +\},\n +loading: self\.busy\n +\)/,
    )
    expect(view).toContain(
      'StepOption(value: "address", label: "Address", helperText: nil, disabled: nil, status: (self.failed ? "error" : "pending"))',
    )
    for (const output of [web, native])
      expect(output.get('Checkout.vue')!).toContain(
        '<MSteps label="Checkout" :steps="state.steps" :modelValue="state.current ?? null" @update:modelValue="(choice) => ((value) => state.go(value))(String(choice))" :loading="state.busy" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSteps: View {')
    expect(controls).toContain('.joined(separator: " · ")')
    expect(controls).toContain(
      '.accessibilityLabel(Text(verbatim: state.isEmpty ? name : name + ". " + state))',
    )
  })

  it('checks the steps against the contract', async () => {
    expect(await inTsx('<MSteps label="x" steps={state.numbered} value={state.active} />')).toMatch(
      /Types of property 'value' are incompatible/,
    )
    expect(await inTsx('<MSteps label="x" steps={state.places} />')).toMatch(
      /Property 'value' is missing/,
    )
    expect(await inTsx('<MSteps steps={state.places} value="a" />')).toMatch(
      /Property 'label' is missing/,
    )
    expect(
      await inTsx('<MSteps label="x" steps={state.places} value="a"><MText>Hi</MText></MSteps>'),
    ).toMatch(/children/)
    expect(await inVue('  <MSteps label="x" :steps="tabs" />')).toMatch(/MSteps needs v-model/)
    expect(await inVue('  <MSteps v-model="active" label="x" :steps="tabs" id="flow" />')).toMatch(
      /MSteps does not take id on the Mac/,
    )
  })
})

describe('MPagination', () => {
  it('passes the page, the total and the labels', async () => {
    const { swift, vue: web, native } = await fixture('pagination', 'Results')
    const view = swift.get('Results.swift')!
    expect(view).toMatch(
      /MavisPagination\(\n +total: self\.total,\n +value: self\.page,\n +onChange: \{ \(value: Double\) in\n +self\.page = value\n +\},\n +pageSize: 10\.0,\n +statusText: "Page \\\(mavisString\(self\.page\)\) of \\\(mavisString\(self\.total\)\) results",\n +loading: self\.busy\n +\)/,
    )
    expect(view).toMatch(
      /MavisPagination\(\n +total: 45\.0,\n +pageSize: 10\.0,\n +siblingCount: 0\.0,\n +previousLabel: "Back",\n +nextLabel: "On"\n +\)/,
    )
    for (const output of [web, native]) {
      const file = output.get('Results.vue')!
      expect(file).toContain(
        '<MPagination :total="state.total" :pageSize="10" :modelValue="state.page" @update:modelValue="(value) => state.page = value"',
      )
      expect(file).toContain(
        '<MPagination :total="45" :pageSize="10" :siblingCount="0" previousLabel="Back" nextLabel="On" />',
      )
    }
  })

  // The Mac lists the pages as pagination in the Mavis core does for the Web.
  it('ports pagination', async () => {
    const { swift } = await fixture('pagination', 'Results')
    const controls = swift.get('MavisControls.swift')!
    for (const line of [
      'let count = Int((total / pageSize).rounded(.up))',
      'let anchor = Swift.min(page, count)',
      'if before != 0, value - before == 2 {',
      'items.append(.gap("\\(before)-\\(value)"))',
      'outOfRange = page > Swift.max(1, count)',
      'previous = count > 0 && page > 1 ? Swift.min(page - 1, count) : nil',
      'next = page < count ? page + 1 : nil',
    ])
      expect(controls).toContain(line)
    // What those lines compute, for the pages the fixture walks through.
    expect(pagination(95, 10, 4).items.map((item) => ('page' in item ? item.page : '…'))).toEqual([
      1,
      2,
      3,
      4,
      5,
      '…',
      10,
    ])
    expect(pagination(25, 10, 8)).toMatchObject({ count: 3, outOfRange: true, previous: 3 })
    expect(pagination(0, 10, 2)).toMatchObject({ count: 0, items: [], previous: null, next: null })
  })

  it('checks a literal page, total and page size while generating', async () => {
    expect(await inTsx('<MPagination total={-1} />')).toMatch(
      /total is a whole number, zero or more/,
    )
    expect(await inTsx('<MPagination total={2.5} />')).toMatch(
      /total is a whole number, zero or more/,
    )
    expect(await inTsx('<MPagination total={10} pageSize={0} />')).toMatch(
      /pageSize is a whole number, 1 or more/,
    )
    expect(await inTsx('<MPagination total={10} value={0} />')).toMatch(
      /value is a whole page, from 1/,
    )
    expect(await inTsx('<MPagination total={10} siblingCount={3} />')).toMatch(
      /Type '3' is not assignable to type/,
    )
    expect(await inTsx('<MPagination value={state.page} />')).toMatch(/Property 'total' is missing/)
    expect(await inVue('  <MPagination v-model="page" />')).toMatch(/MPagination needs total/)
    expect(await inVue('  <MPagination v-model="active" :total="3" />')).toMatch(/number/)
  })
})
