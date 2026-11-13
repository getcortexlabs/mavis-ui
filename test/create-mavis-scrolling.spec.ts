import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { virtualListProps } from '../packages/core/src/vue/navigation-props'
import {
  collapsibleHeaderProps,
  refreshControlProps,
} from '../packages/core/src/vue/screen-component-props'
import { virtualWindow } from '../packages/core/src/collections'
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
const types = 'export type Stop = { id: string; name: string; order: number }\n'
const tsx = (view: string, members = '', before = '') =>
  `import { useRef, useStore } from '@builder.io/mitosis'\nimport type { Stop } from './types'\n\nexport default function Home() {\n${before}  const state = useStore({\n    stops: [] as Stop[],\n    names: ['a'],\n    count: 0,\n    offline: false,\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nimport type { Stop } from './types'\nconst stops = ref<Stop[]>([])\nconst count = ref(0)\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
const row = '{({ item }) => <MText>{item.name}</MText>}'

describe('the scrolling components in both formats', () => {
  it.each([
    ['list', 'Line'],
    ['header', 'Trip'],
    ['refresh', 'Daily'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    const contracts = {
      MVirtualList: [virtualListProps, ['ref']],
      MCollapsibleHeader: [collapsibleHeaderProps, ['onBack']],
      MRefreshControl: [refreshControlProps, ['onStateChange']],
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

describe('MVirtualList', () => {
  it.each([true, false])(
    'diagnoses animated=%s in TSX and Vue rather than ignoring it on Mac',
    async (animated) => {
      const diagnostic = /animated uses Jolt listChanges on Web and NativeScript/
      expect(
        await problems({
          'Home.lite.tsx': tsx(
            `<MVirtualList label="x" items={state.stops} rowHeight={40} height={200} animated={${animated}}>${row}</MVirtualList>`,
          ),
        }),
      ).toMatch(diagnostic)
      expect(
        await problems({
          'Home.vue': vue(
            '',
            `<MVirtualList label="x" :items="stops" :rowHeight="40" :height="200" :animated="${animated}"><template #default="{ item }"><MText :text="item.name" /></template></MVirtualList>`,
          ),
        }),
      ).toMatch(diagnostic)
    },
  )
  it('builds the rows in view by key and scrolls through a list reference', async () => {
    const { swift, vue: web, native } = await fixture('list', 'Line')
    const view = swift.get('Line.swift')!
    expect(view).toContain('@State private var lineRef = MavisListRequest()')
    expect(view).toContain(
      'self.lineRef = MavisListRequest(index: 19.0, serial: self.lineRef.serial + 1)',
    )
    expect(view).toMatch(
      /MavisVirtualList\(\n +label: "Stops on the line",\n +items: self\.stops,\n +key: \{ \$0\.id \},\n +rowHeight: 48\.0,\n +height: 240\.0,\n +overscan: 0\.0,\n +request: self\.lineRef,\n +empty: \{/,
    )
    expect(view).toContain('row: { (item: Stop, index: Double) in\n')
    expect(view).toContain('let itemKey = item.id')
    expect(view).toContain('initialIndex: 10.0,')
    expect(view).toContain('.mavisIdentifier("line")')
    for (const output of [web, native]) {
      const file = output.get('Line.vue')!
      expect(file).toContain('const lineRef = ref<{ scrollToIndex(index: number): void }>()')
      expect(file).toContain('lineRef.value?.scrollToIndex(19)')
      expect(file).toContain('<MVirtualList ref="lineRef" id="line" label="Stops on the line"')
      expect(file).toContain('<template #default="{ item, index, itemKey }">')
      expect(file).toContain('<template #empty>')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      'struct MavisVirtualList<Item: Hashable, Row: View, Empty: View>: View {',
    )
    expect(controls).toContain('JoltScrollView(progress: scroll) { rows }')
    expect(controls).toContain('struct MavisScroller: NSViewRepresentable {')
  })

  it('keys rows by a number field too', async () => {
    const { swift } = await compile({
      'types.ts': types,
      'Home.lite.tsx': tsx(
        `    <MVirtualList label="Stops" items={state.stops} itemKey="order" rowHeight={40} height={200}>\n      {({ item, itemKey }) => <MText>{\`\${itemKey}: \${item.name}\`}</MText>}\n    </MVirtualList>`,
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('key: { mavisString($0.order) },')
    expect(view).toContain('row: { (item: Stop, mavisIndex: Double) in\n')
    expect(view).toContain('let itemKey = item.order')
  })

  // The Mac decides which rows exist as virtualWindow does for the Web.
  it('ports virtualWindow', async () => {
    const { swift } = await fixture('list', 'Line')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      'let first = Swift.max(0, Int((offset / rowHeight).rounded(.down)) - extra)',
    )
    expect(controls).toContain(
      'let last = Swift.min(items.count, Int(((offset + height) / rowHeight).rounded(.up)) + extra)',
    )
    const mac = (
      count: number,
      rowHeight: number,
      height: number,
      offset: number,
      extra: number,
    ) => {
      const top = Math.min(Math.max(0, offset), Math.max(0, count * rowHeight - height))
      const first = Math.max(0, Math.floor(top / rowHeight) - extra)
      return [
        first,
        Math.max(first, Math.min(count, Math.ceil((top + height) / rowHeight) + extra)),
      ]
    }
    for (const [count, rowHeight, height, offset, extra] of [
      [30, 48, 240, 0, 0],
      [30, 48, 240, 912, 0],
      [30, 48, 240, 1008, 3],
      [30, 48, 240, 5000, 3],
      [3, 40, 120, 60, 2],
      [100, 33, 250, 417.5, 1],
    ] as const) {
      const { start, end } = virtualWindow(count, rowHeight, height, offset, extra)
      expect(mac(count, rowHeight, height, offset, extra)).toEqual([start, end])
    }
  })

  it.each([
    [
      '<MVirtualList label="x" items={state.names} rowHeight={40} height={200}>{({ index }) => <MText>{index}</MText>}</MVirtualList>',
      /takes a list of records/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} itemKey={state.offline ? 'id' : 'name'} rowHeight={40} height={200}>${row}</MVirtualList>`,
      /itemKey names a field of the items, written out/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} itemKey="missing" rowHeight={40} height={200}>${row}</MVirtualList>`,
      /not assignable|Every item needs the key missing/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} rowHeight={0} height={200}>${row}</MVirtualList>`,
      /rowHeight must be positive/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} rowHeight={40} height={200} overscan={1.5}>${row}</MVirtualList>`,
      /overscan is a whole number, zero or more/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} rowHeight={40} height={200} initialIndex={-1}>${row}</MVirtualList>`,
      /initialIndex is a whole number, zero or more/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} rowHeight={40} height={200}><MText>Row</MText></MVirtualList>`,
      /not assignable|takes its content as a function/,
    ],
    [
      `<MVirtualList label="x" items={state.stops} rowHeight={40} height={200}>{({ entry }) => <MText>Row</MText>}</MVirtualList>`,
      /does not exist|hands its content item, index, itemKey, not entry/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('keeps list and field references apart', async () => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          `    <MVirtualList ref={feedRef} label="x" items={state.stops} rowHeight={40} height={200}>${row}</MVirtualList>`,
          '',
          '  const feedRef = useRef<MavisFieldRef>(null)\n',
        ),
      }),
    ).toMatch(/is missing in type|not assignable|ref takes a list reference/)
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          `    <MColumn><MText>Hi</MText></MColumn>`,
          '',
          '  const feedRef = useRef<MavisListRef>(null)\n',
        ),
      }),
    ).toMatch(/feedRef is not attached to an MVirtualList with ref=\{feedRef\}/)
    expect(
      await problems({
        'Home.vue': vue(
          '',
          '  <MVirtualList label="x" :items="stops" :row-height="40" :height="200">\n    <template #default><MText>Row</MText></template>\n  </MVirtualList>',
        ),
      }),
    ).toMatch(
      /The default slot of MVirtualList hands its content properties: take what you need, as v-slot="\{ item \}"/,
    )
  })
})

describe('MCollapsibleHeader', () => {
  it('passes the header, its slots and the content to MavisCollapsibleHeader', async () => {
    const { swift, vue: web } = await fixture('header', 'Trip')
    const view = swift.get('Trip.swift')!
    expect(view).toMatch(
      /MavisCollapsibleHeader\(\n +title: "Above the everyday",\n +subtitle: "A slower kind of escape",\n +height: 360\.0,\n +expanded: 200\.0,\n +collapsed: 56\.0,\n +sectionHeight: 40\.0,\n +parallax: 0\.5,\n +back: true,\n +backLabel: "Back",\n +topLabel: "Back to top",\n +onBack: \{/,
    )
    for (const name of ['artwork', 'leading', 'actions', 'section', 'content'])
      expect(view).toMatch(new RegExp(`\\n +${name}: \\{\\n`))
    expect(web.get('Trip.vue')).toContain(
      '<MCollapsibleHeader id="trip" title="Above the everyday" subtitle="A slower kind of escape" :height="360" :expandedHeight="200" :collapsedHeight="56" :sectionHeight="40" :parallax="0.5" :back="true" backLabel="Back" topLabel="Back to top" @back="() => state.backs += 1">',
    )
    expect(web.get('Trip.vue')).toContain('<template #artwork>')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('\nimport Combine\nimport SwiftUI\nimport JoltSwiftUI\n')
    // Jolt reads the scroll and links the decoration; the collapse follows the offset itself.
    expect(controls).toContain('JoltScrollView(progress: scroll) {')
    expect(controls).toContain(
      '.joltScrollLinked(ranges.collapse, to: (try? JoltPose(y: range * parallax)) ?? .identity)',
    )
    expect(controls).toContain(
      '.joltScrollLinked(ranges.title, to: (try? JoltPose(opacity: 0)) ?? .identity)',
    )
    expect(controls).toContain('.offset(y: -collapsed)')
    expect(controls).toContain('.offset(y: expanded - collapsed)')
  })

  it.each([
    [
      '<MCollapsibleHeader title="x" expandedHeight={60}><MText>a</MText></MCollapsibleHeader>',
      /expandedHeight is above collapsedHeight/,
    ],
    [
      '<MCollapsibleHeader title="x" parallax={2}><MText>a</MText></MCollapsibleHeader>',
      /parallax is from 0 to 1/,
    ],
    [
      '<MCollapsibleHeader title="x" sectionHeight={-1}><MText>a</MText></MCollapsibleHeader>',
      /sectionHeight cannot be negative/,
    ],
    [
      '<MCollapsibleHeader title="x" image="https://example.com/a.png" slotArtwork={<MColumn />}><MText>a</MText></MCollapsibleHeader>',
      /image and the artwork slot draw in the same place/,
    ],
    [
      '<MCollapsibleHeader title="x" back slotLeading={<MText>a</MText>}><MText>a</MText></MCollapsibleHeader>',
      /back puts the back button where the leading slot goes/,
    ],
    [
      '<MCollapsibleHeader title="x" slotActions={<MButton text="Share" onClick={() => (state.count += 1)} />}><MText>a</MText></MCollapsibleHeader>',
      /MCollapsibleHeader's actions shows content only/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })
})

describe('MRefreshControl and functions that fail', () => {
  it('runs a function that can throw and shows what it did', async () => {
    const { swift, vue: web, native } = await fixture('refresh', 'Daily')
    const view = swift.get('Daily.swift')!
    expect(view).toContain(
      '    @MainActor private func reload(_ context: MavisRefreshContext) async throws {\n        if self.offline {\n            throw MavisFailure(message: "Offline")\n        }\n        if context.cancelled {\n            return\n        }\n        _ = context.commit {\n            self.edition += 1.0\n        }\n    }',
    )
    expect(view).toMatch(
      /refresh: \{ \(context: MavisRefreshContext\) in\n +try await self\.reload\(context\)\n +\},/,
    )
    expect(view).toContain('onStateChange: { (next: String) in')
    for (const output of [web, native]) {
      const file = output.get('Daily.vue')!
      expect(file).toContain("throw new Error('Offline')")
      expect(file).toContain(':refresh="(context) => state.reload(context)"')
      expect(file).toContain('async reload(context: RefreshContext): Promise<void> {')
      expect(file).toContain('await context.commit(() => {\n      state.edition += 1\n    })')
      expect(file).toContain('@stateChange="(next) => state.seen = next"')
    }
    expect(swift.get('MavisRuntime.swift')).toContain('struct MavisFailure: Error {')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('let refresh: (MavisRefreshContext) async throws -> Void')
    expect(controls).toContain('try await refresh(MavisRefreshContext { current == revision })')
    expect(controls).toContain('running = _Concurrency.Task { @MainActor in')
    expect(controls).toContain('.keyboardShortcut("r", modifiers: .command)')
  })

  it.each([
    [
      'a button calls it',
      tsx(
        '    <MButton text="Reload" onClick={() => state.reload()} />',
        "    reload() {\n      if (state.offline) throw new Error('Offline')\n      state.count += 1\n    },\n",
      ),
      /reload can fail, and onClick of MButton has no way to show it\. Pass it to MRefreshControl's refresh/,
    ],
    [
      'a button calls a function that calls it',
      tsx(
        '    <MButton text="Reload" onClick={() => state.again()} />',
        "    reload() {\n      throw new Error('Offline')\n    },\n    again() {\n      state.reload()\n    },\n",
      ),
      /again can fail, and onClick of MButton has no way to show it/,
    ],
    [
      'a handler throws',
      tsx('    <MButton text="Reload" onClick={() => { throw new Error(\'no\') }} />'),
      /Only a function of the component can fail/,
    ],
    [
      'it throws something else',
      tsx('    <MText>Hi</MText>', "    reload() {\n      throw 'Offline'\n    },\n"),
      /A function fails with throw new Error\('why'\)/,
    ],
  ])('rejects a failure nothing can show: %s', async (_, source, message) => {
    expect(await problems({ 'Home.lite.tsx': source })).toMatch(message)
  })

  it('lets a function that fails call another one', async () => {
    const { swift } = await compile({
      'types.ts': types,
      'Home.lite.tsx': tsx(
        '    <MRefreshControl label="Feed" refresh={() => state.again()}><MText>Hi</MText></MRefreshControl>',
        '    reload() {\n      if (state.offline) throw new Error(`Offline ${state.count}`)\n    },\n    again() {\n      state.reload()\n      state.count += 1\n    },\n',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('private func again() throws {\n        try self.reload()')
    expect(view).toContain('throw MavisFailure(message: "Offline \\(mavisString(self.count))")')
    expect(view).toMatch(/refresh: \{ \(_: MavisRefreshContext\) in\n +try self\.again\(\)\n +\},/)
  })

  it('hands refresh the context and nothing else', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          'function reload(times: number) {\n  count.value += times\n}',
          '  <MRefreshControl label="Feed" :refresh="reload"><MText>Hi</MText></MRefreshControl>',
        ),
      }),
    ).toMatch(/not assignable|refresh hands reload the refresh context and nothing else/)
  })
})
