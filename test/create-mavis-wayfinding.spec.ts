import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { linkProps, tabsProps } from '../packages/core/src/vue/props'
import { appBarProps, tabBarProps } from '../packages/core/src/vue/navigation-props'
import { breadcrumbProps, navigationRailProps } from '../packages/core/src/vue/wayfinding-props'
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
  'export type Place = { value: string; label: string }\nexport type InvalidChoice = { value: boolean; label: string }\n'
const tsx = (view: string, members = '') =>
  `import { Show, useStore } from '@builder.io/mitosis'\nimport type { InvalidChoice, Place } from './types'\n\nexport default function Home() {\n  const state = useStore({\n    places: [] as Place[],\n    invalidChoices: [] as InvalidChoice[],\n    tabs: [] as TabOption[],\n    crumbs: [] as BreadcrumbItem[],\n    spots: [] as NavigationItem[],\n    groups: [] as NavigationGroup[],\n    names: ['a'],\n    active: undefined as string | undefined,\n    page: 1,\n    open: false,\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nimport type { NavigationGroup, TabOption } from '@getcortexlabs/mavis-core'\nconst tabs = ref<TabOption[]>([])\nconst groups = ref<NavigationGroup[]>([])\nconst active = ref<string | null>(null)\nconst page = ref(1)\nconst open = ref(false)\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
    ['breadcrumb', 'Trail'],
    ['appBar', 'Shelf'],
    ['tabBar', 'Dock'],
    ['rail', 'Desk'],
    ['link', 'Links'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toContain(`shared/${root}.vue`)
  })

  it('takes only properties of the published contracts', () => {
    // value and onChange are the model of a source that keeps its own state; the others are
    // the events each contract emits.
    const contracts = {
      MTabs: [tabsProps, ['value', 'onChange']],
      MSteps: [stepsProps, ['value', 'onChange']],
      MPagination: [paginationProps, ['value', 'onChange']],
      MBreadcrumb: [breadcrumbProps, ['onError']],
      MAppBar: [appBarProps, ['onBack', 'onError']],
      MTabBar: [tabBarProps, ['value', 'onError']],
      MNavigationRail: [navigationRailProps, ['value', 'onCollapse', 'onError']],
      MLink: [linkProps, ['onClick', 'onError']],
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
      'tabs: self.tabs.map { item in MavisTab(value: mavisChoice(item.value), label: item.label, disabled: item.disabled ?? false) },',
    )
    expect(view).toMatch(
      /MavisTabs\(\n +label: "Your space",\n +tabs: .+\n +value: self\.active,\n +onChange: \{ \(value: MavisChoiceValue\) in\n +self\.choose\(value\)\n +\},\n +disabled: self\.locked,\n +panel: \{ \(value: MavisChoiceValue\) in\n/,
    )
    expect(view).toContain('keepAlive: true,')
    expect(view).toContain('.mavisIdentifier("space")')
    for (const output of [web, native]) {
      const file = output.get('Space.vue')!
      expect(file).toContain(
        '<MTabs id="space" label="Your space" :tabs="state.tabs" :modelValue="state.active ?? null" @update:modelValue="(choice) => ((value) => state.choose(value))(choice)" :disabled="state.locked">',
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
      'tabs: self.places.map { item in MavisTab(value: mavisChoice(item.value), label: item.label) },',
    )
    expect(view).toContain('value: MavisChoiceValue.text("home"),\n')
    expect(view).toContain('panel: { (place: MavisChoiceValue) in\n')
    expect(view).toContain('.mavisItem(grow: 1.0, width: .fraction(0.5))')
    const file = web.get('Home.vue')!
    expect(file).toContain(':modelValue="\'home\'"')
    expect(file).toContain('<template #default="{ value: place }">')
  })

  it('says what the tabs, the value and the panel must be', async () => {
    // The checker reads the tabs against the contract before the compiler does.
    expect(
      await inTsx(
        `<MTabs label="x" tabs={state.invalidChoices} value={state.active}>${panel}</MTabs>`,
      ),
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
      await inTsx(`<MTabs label="x" tabs={state.tabs} value={state.open}>${panel}</MTabs>`),
    ).toMatch(/Type 'boolean' is not assignable/)
    expect(
      await inTsx(
        `<MTabs label="x" tabs={state.tabs} value={state.active}><MText>Hi</MText></MTabs>`,
      ),
    ).toMatch(
      /provides no match for the signature '\(props: \{ value: string \| number; \}\): Element'/,
    )
    expect(
      await inTsx(
        `<MTabs label="x" tabs={state.tabs} value={state.active}>{({ tab }) => <MText>Hi</MText>}</MTabs>`,
      ),
    ).toMatch(/Property 'tab' does not exist on type '\{ value: string \| number; \}'/)
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
      /MavisSteps\(\n +label: "Checkout",\n +steps: self\.steps\.map \{ item in MavisStep\(value: mavisChoice\(item\.value\), label: item\.label, disabled: item\.disabled \?\? false, status: item\.status \?\? ""\) \},\n +value: self\.current,\n +onChange: \{ \(value: MavisChoiceValue\) in\n +self\.go\(value\)\n +\},\n +loading: self\.busy\n +\)/,
    )
    expect(view).toContain(
      'StepOption(value: MavisChoiceValue.text("address"), label: "Address", helperText: nil, disabled: nil, status: (self.failed ? "error" : "pending"))',
    )
    for (const output of [web, native])
      expect(output.get('Checkout.vue')!).toContain(
        '<MSteps label="Checkout" :steps="state.steps" :modelValue="state.current ?? null" @update:modelValue="(choice) => ((value) => state.go(value))(choice)" :loading="state.busy" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSteps: View {')
    expect(controls).toContain('.joined(separator: " · ")')
    expect(controls).toContain(
      '.accessibilityLabel(Text(verbatim: state.isEmpty ? name : name + ". " + state))',
    )
  })

  it('checks the steps against the contract', async () => {
    expect(
      await inTsx('<MSteps label="x" steps={state.invalidChoices} value={state.active} />'),
    ).toMatch(/Types of property 'value' are incompatible/)
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

describe('MLink', () => {
  it('hands the destination to navigate, and says when a link opens a new window', async () => {
    const { swift, vue: web, native } = await fixture('link', 'Links')
    const view = swift.get('Links.swift')!
    expect(view).toMatch(
      /MavisLink\(\n +text: "Documentation",\n +href: "https:\/\/mavis\.example\/docs",\n +navigate: \{ \(href: String\) in\n +self\.go\(href\)\n +\},\n +onClick: \{\n +self\.clicks = \(self\.clicks \+ 1\.0\)\n +\}\n +\)\n +\.accessibilityIdentifier\("docs"\)/,
    )
    expect(view).toMatch(
      /disabled: self\.off,\n +inline: true\n +\)\n +\.accessibilityIdentifier\("guide"\)/,
    )
    for (const output of [web, native]) {
      const file = output.get('Links.vue')!
      expect(file).toContain(
        '<MLink id="docs" href="https://mavis.example/docs" text="Documentation" :navigate="(href) => state.go(href)" @click="() => state.clicks = (state.clicks + 1)" />',
      )
      expect(file).toContain(':inline="true"')
    }
    const other = await compile({
      'types.ts': types,
      'Home.lite.tsx': tsx(
        '    <MLink href="https://mavis.example" text="Site" target="_blank" rel="author" accessibilityLabel="The site" grow={1} onError={() => (state.open = true)} />',
      ),
    })
    const link = other.swift.get('Home.swift')!
    expect(link).toMatch(
      /MavisLink\(\n +text: "Site",\n +href: "https:\/\/mavis\.example",\n +blank: true,\n +onError: \{\n +self\.open = true\n +\}\n +\)\n +\.accessibilityLabel\(Text\(verbatim: "The site"\)\)\n +\.mavisItem\(grow: 1\.0\)/,
    )
    expect(other.vue.get('Home.vue')!).toContain('target="_blank" rel="author"')
    const controls = other.swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisWayfinding {')
    expect(controls).toContain('if let navigate, !blank {')
    expect(controls).toContain('.accessibilityAddTraits(.isLink)')
  })

  it('requires a route table or an explicit navigate callback for app destinations', async () => {
    expect(await inTsx('<MLink href="/account" text="Account" />')).toMatch(
      /\/account is a screen of the app, and this project has no route table: add shared\/routes\.ts/,
    )
    expect(await inVue('  <MLink href="settings/profile">Profile</MLink>')).toMatch(
      /settings\/profile is a screen of the app, and this project has no route table/,
    )
    expect(
      await inTsx(
        '<MLink href="/account" text="Account" navigate={(href) => (state.open = true)} />',
      ),
    ).toBe('')
    expect(await inTsx('<MLink href="mailto:hello@mavis.example" text="Write" />')).toBe('')
    expect(await inTsx('<MLink href=" " text="Nowhere" />')).toMatch(
      /href is where the link goes: it cannot be empty/,
    )
    expect(await inTsx('<MLink href="javascript:alert(1)" text="Run" />')).toMatch(
      /A link goes to a place, not to code/,
    )
    expect(await inTsx('<MLink href="https://mavis.example" text="Site" target="_top" />')).toMatch(
      /"_top"' is not assignable/,
    )
    expect(
      await inTsx(
        '<MLink href="/a" text="A" navigate={(href) => state.leave()} />',
        "    leave() {\n      throw new Error('no')\n    },\n",
      ),
    ).toMatch(/leave can fail, and navigate of MLink has no way to show it/)
    expect(await inVue('  <MLink href="https://mavis.example" text="Site">Site</MLink>')).toMatch(
      /MLink has text and content; use one/,
    )
    expect(await inVue('  <MLink href="https://mavis.example" />')).toMatch(/MLink needs text/)
    expect(
      await inVue(
        '  <MLink href="/a" text="A" :navigate="count" />',
        'function count(times: number) {\n  page.value = times\n}',
      ),
    ).toMatch(/not assignable/)
  })
})

describe('MBreadcrumb', () => {
  it('passes the path as its own type', async () => {
    const { swift, vue: web, native } = await fixture('breadcrumb', 'Trail')
    const view = swift.get('Trail.swift')!
    expect(view).toMatch(
      /MavisBreadcrumb\(\n +items: self\.shown\.map \{ item in MavisCrumb\(key: item\.key, label: item\.label, href: item\.href\) \},\n +maxItems: 2\.0,\n +expandLabel: "Show the whole path"\n +\)\n +\.mavisIdentifier\("trail"\)/,
    )
    for (const output of [web, native])
      expect(output.get('Trail.vue')!).toContain(
        '<MBreadcrumb id="trail" :items="state.shown" :maxItems="2" expandLabel="Show the whole path" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisBreadcrumb: View {')
    // breadcrumbParts in the Mavis core: the first place, the button, and the last maxItems - 1.
    expect(controls).toContain(
      'return [items[0], nil] + items[(items.count - most + 1)...].map { Optional($0) }',
    )
    expect(controls).toContain('.onChange(of: items.map(\\.key)) { _, _ in expanded = false }')
  })

  it('checks maxItems and the path', async () => {
    expect(await inTsx('<MBreadcrumb items={state.crumbs} maxItems={1} />')).toMatch(
      /maxItems is a whole number, 2 or more/,
    )
    expect(await inTsx('<MBreadcrumb label="Path" />')).toMatch(/Property 'items' is missing/)
    expect(await inTsx('<MBreadcrumb items={state.places} />')).toMatch(
      /Property 'key' is missing in type 'Place'/,
    )
    expect(await inVue('  <MBreadcrumb label="Path" />')).toMatch(/MBreadcrumb needs items/)
    expect(
      await inTsx(
        '<MBreadcrumb items={state.crumbs} onError={() => state.leave()} />',
        "    leave() {\n      throw new Error('no')\n    },\n",
      ),
    ).toMatch(/leave can fail, and onError of MBreadcrumb has no way to show it/)
  })
})

describe('MAppBar', () => {
  it('puts the slots around the title and runs navigateBack before back', async () => {
    const { swift, vue: web, native } = await fixture('appBar', 'Shelf')
    const view = swift.get('Shelf.swift')!
    expect(view).toMatch(
      /MavisAppBar\(\n +title: "Library",\n +subtitle: "Left \\\(mavisString\(self\.left\)\) times",\n +back: true,\n +backLabel: "Back to shelves",\n +navigateBack: \{\n +self\.leave\(\)\n +\},\n +onBack: \{\n +self\.told = \(self\.told \+ 1\.0\)\n +\},\n +leading: \{\n +MavisIcon\(/,
    )
    expect(view).toMatch(/actions: \{\n +Button\(action: \{\n +self\.saved = true/)
    expect(view).toMatch(
      /MavisAppBar\(\n +title: "Plain",\n +leading: \{\n +EmptyView\(\)\n +\},\n +actions: \{\n +EmptyView\(\)\n +\}\n +\)\n +\.mavisIdentifier\("plain"\)\n +\.mavisItem\(shrink: 0\)/,
    )
    for (const output of [web, native]) {
      const file = output.get('Shelf.vue')!
      expect(file).toContain(
        ':back="true" backLabel="Back to shelves" :navigateBack="() => state.leave()" @back="() => state.told = (state.told + 1)">',
      )
      expect(file).toContain('<template #leading>')
      expect(file).toContain('<template #actions>')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisAppBar<Leading: View, Actions: View>: View {')
    expect(controls).toMatch(
      /if let navigateBack \{ navigateBack\(\) \} else \{ navigation.back\(\) \}\n +onBack\(\)/,
    )
    expect(controls).toContain('.accessibilityHeading(.h1)')
  })

  it('needs navigateBack or a route table for the back button', async () => {
    expect(await inTsx('<MAppBar title="Library" back />')).toMatch(
      /MAppBar back needs navigateBack or a route table: add shared\/routes\.ts/,
    )
    expect(await inVue('  <MAppBar title="Library" :back="open" />')).toMatch(
      /MAppBar back needs navigateBack or a route table/,
    )
    expect(await inTsx('<MAppBar title="Library" back={false} />')).toBe('')
    expect(
      await inTsx('<MAppBar title="Library" back navigateBack={() => (state.open = true)} />'),
    ).toBe('')
    expect(await inTsx('<MAppBar subtitle="x" />')).toMatch(/Property 'title' is missing/)
    expect(await inVue('  <MAppBar title="x"><MText>Hi</MText></MAppBar>')).toMatch(
      /MAppBar takes no children; give its content as <template #leading> or <template #actions>/,
    )
    expect(
      await inVue('  <MAppBar title="x"><template #footer><MText>Hi</MText></template></MAppBar>'),
    ).toMatch(/MAppBar has no slot footer; its slots are leading, actions/)
    expect(
      await inVue(
        '  <MAppBar title="x" back :navigate-back="leave" />',
        "function leave() {\n  throw new Error('no')\n}",
      ),
    ).toMatch(/leave can fail, and navigateBack of MAppBar has no way to show it/)
  })
})

describe('MTabBar', () => {
  it('passes the destinations as its own type and the current one from the source', async () => {
    const { swift, vue: web, native } = await fixture('tabBar', 'Dock')
    const view = swift.get('Dock.swift')!
    expect(view).toMatch(
      /MavisTabBar\(\n +label: "Main navigation",\n +items: self\.places\.map \{ item in MavisDestination\(value: mavisChoice\(item\.value\), label: item\.label, href: item\.href, icon: item\.icon, badge: item\.badge, disabled: item\.disabled \?\? false\) \},\n +value: self\.route,\n +disabled: self\.off\n +\)\n +\.mavisIdentifier\("dock"\)\n +\.mavisItem\(shrink: 0\)/,
    )
    for (const output of [web, native])
      expect(output.get('Dock.vue')!).toContain(
        '<MTabBar id="dock" label="Main navigation" :items="state.places" :modelValue="state.route ?? null" :disabled="state.off" />',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisTabBar: View {')
    expect(controls).toContain(
      '.buttonStyle(MavisButtonStyle(variant: current ? .primary : .ghost))',
    )
    expect(controls).toContain('.joltSharedLayout("current", in: selection)')
    expect(controls).toContain('if !wayfinding.follow(item.href, with: openURL) { onError() }')
  })

  it('reads destinations as data, and has no value of its own to change', async () => {
    expect(await inTsx('<MTabBar items={state.spots} />')).toMatch(/Property 'label' is missing/)
    expect(await inTsx('<MTabBar label="Main" items={state.places} />')).toMatch(
      /Property 'href' is missing in type 'Place'/,
    )
    // A destination's own navigate is a function, which a record does not hold on the Mac.
    expect(
      await inTsx(
        '<MTabBar label="Main" items={state.spots} />',
        "    get made(): NavigationItem[] {\n      return [{ value: 'a', label: 'A', href: '/a', navigate: () => {} }]\n    },\n",
      ),
    ).toMatch(/'navigate' does not exist in type 'NavigationItem'/)
    expect(
      await inTsx(
        '<MTabBar label="Main" items={state.spots} />',
        "    get made(): NavigationItem[] {\n      return [{ value: 'a', label: 'A', href: '/a', badge: 3 }]\n    },\n",
      ),
    ).toMatch(/Type 'number' is not assignable to type 'string'/)
    expect(await inVue('  <MTabBar v-model="active" label="Main" :items="[]" />')).toMatch(
      /MTabBar does not take v-model on the Mac/,
    )
    expect(await inVue('  <MTabBar label="Main" />')).toMatch(/MTabBar needs items/)
    expect(
      await inTsx('<MTabBar label="Main" items={state.spots}><MText>Hi</MText></MTabBar>'),
    ).toMatch(/children/)
  })
})

describe('MNavigationRail', () => {
  it('passes the groups with their destinations, and the slots as functions of collapsed', async () => {
    const { swift, vue: web, native } = await fixture('rail', 'Desk')
    const view = swift.get('Desk.swift')!
    expect(view).toContain(
      'groups: self.groups.map { item in MavisDestinationGroup(key: item.key, label: item.label, items: item.items.map { inner1 in MavisDestination(value: mavisChoice(inner1.value), label: inner1.label, href: inner1.href, icon: inner1.icon, badge: inner1.badge, disabled: inner1.disabled ?? false) }) },',
    )
    expect(view).toMatch(
      /value: self\.route,\n +collapsed: self\.narrow,\n +onCollapse: \{ \(value: Bool\) in\n +self\.narrow = value\n +\},\n +header: \{ \(collapsed: Bool\) in\n +Text\(verbatim: \(collapsed \? "M" : "Mavis"\)\)/,
    )
    expect(view).toMatch(
      /footer: \{ \(collapsed: Bool\) in\n +Text\(verbatim: \(collapsed \? "R" : "Rafael"\)\)/,
    )
    expect(view).toContain('.mavisIdentifier("rail")')
    for (const output of [web, native]) {
      const file = output.get('Desk.vue')!
      expect(file).toContain(
        '<MNavigationRail id="rail" label="Desk" :groups="state.groups" :modelValue="state.route ?? null" :collapsed="state.narrow" @update:collapsed="(value) => state.narrow = value">',
      )
      expect(file).toContain('<template #header="{ collapsed }">')
      expect(file).toContain('<template #footer="{ collapsed }">')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisNavigationRail<Header: View, Footer: View>: View {')
    expect(controls).toContain('.frame(width: collapsed ? 80 : 256, alignment: .topLeading)')
    expect(controls).toContain('.joltLayout(value: collapsed, transition: .spring(.smooth))')
    expect(controls).toContain(
      '.buttonStyle(MavisButtonStyle(variant: current ? .secondary : .ghost))',
    )
  })

  it('leaves a slot out, and takes a rail that cannot collapse', async () => {
    const { swift } = await compile({
      'types.ts': types,
      'Home.lite.tsx': tsx(
        '    <MNavigationRail label="Desk" groups={state.groups} collapsible={false} collapseLabel="Fold" expandLabel="Unfold" slotFooter={({ collapsed: small }) => <MText>{small ? "s" : "wide"}</MText>} onError={() => (state.open = true)} />',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toMatch(
      /collapsible: false,\n +collapseLabel: "Fold",\n +expandLabel: "Unfold",\n +onError: \{\n +self\.open = true\n +\},\n +header: \{ \(_: Bool\) in\n +EmptyView\(\)\n +\},\n +footer: \{ \(small: Bool\) in\n/,
    )
  })

  it('takes collapsed as v-model:collapsed, or as :collapsed with a listener', async () => {
    const rail = (attributes: string, script = '') =>
      compile({
        'types.ts': types,
        'Home.vue': vue(
          script,
          `  <MNavigationRail label="Desk" :groups="groups" ${attributes} />`,
        ),
      })
    const bound = (await rail('v-model:collapsed="open"')).swift.get('Home.swift')!
    expect(bound).toMatch(
      /collapsed: self\.open,\n +onCollapse: \{ \(value: Bool\) in\n +self\.open = value\n +\},/,
    )
    const heard = (
      await rail(
        ':collapsed="open" @update:collapsed="fold"',
        'function fold(collapsed: boolean) {\n  open.value = collapsed\n}',
      )
    ).swift.get('Home.swift')!
    expect(heard).toMatch(
      /collapsed: self\.open,\n +onCollapse: \{ \(collapsed: Bool\) in\n +self\.fold\(collapsed\)\n +\},/,
    )
    // The model first, then the listener beside it.
    const both = (
      await rail('v-model:collapsed="open" @update:collapsed="page = page + 1"')
    ).swift.get('Home.swift')!
    expect(both).toMatch(
      /onCollapse: \{ \(value: Bool\) in\n +self\.open = value\n +self\.page = \(self\.page \+ 1\.0\)\n +\},/,
    )
    expect(
      await inVue('  <MNavigationRail v-model:collapsed="page" label="Desk" :groups="[]" />'),
    ).toMatch(/boolean/)
    expect(
      await inVue('  <MNavigationRail v-model:value="active" label="Desk" :groups="[]" />'),
    ).toMatch(/MNavigationRail does not take v-model:value on the Mac/)
  })

  it('says how its slots and its collapsed state are written', async () => {
    expect(
      await inVue(
        '  <MNavigationRail label="Desk" :groups="[]">\n    <template #header><MText>Mavis</MText></template>\n  </MNavigationRail>',
      ),
    ).toMatch(
      /The header slot of MNavigationRail hands its content properties: take what you need, as #header="\{ item \}"/,
    )
    expect(
      await inVue(
        '  <MNavigationRail label="Desk" :groups="[]">\n    <template #sidebar><MText>Mavis</MText></template>\n  </MNavigationRail>',
      ),
    ).toMatch(/MNavigationRail has no slot sidebar; its slots are header, footer/)
    expect(
      await inTsx(
        '<MNavigationRail label="Desk" groups={state.groups} slotHeader={<MText>Mavis</MText>} />',
      ),
    ).toMatch(/not assignable to type '\(props: \{ collapsed: boolean; \}\) => Element'/)
    expect(await inTsx('<MNavigationRail label="Desk" groups={state.spots} />')).toMatch(
      /Type 'NavigationItem' is missing the following properties from type .*: key, items/,
    )
    expect(await inVue('  <MNavigationRail :groups="[]" />')).toMatch(/MNavigationRail needs label/)
  })
})
