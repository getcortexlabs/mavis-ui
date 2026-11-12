import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { themeProviderProps } from '../packages/core/src/vue/theme-provider'
import { platformProps } from '../packages/core/src/vue/platform'
import { masonryProps } from '../packages/core/src/vue/advanced-props'
import { resizablePanelsProps } from '../packages/core/src/vue/interactive-props'
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
const tsx = (view: string, imports = '') =>
  `import { useStore } from '@builder.io/mitosis'\n${imports}\n\nexport default function Home() {\n  const state = useStore({ on: false, split: 40, mode: 'dark' as 'light' | 'dark', pins: [] as MasonryItem[] })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
    return (error as { diagnostics: { message: string }[] }).diagnostics
      .map((item) => item.message)
      .join('\n')
  }
  return ''
}

describe('the four components in both formats', () => {
  it.each([
    ['masonry', 'Board'],
    ['panels', 'Panels'],
    ['panelsKeys', 'Keys'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  // The Vue file keeps the branch the Mac does not show for the Web and NativeScript, which run
  // it as written; the Mac gets the same SwiftUI from both.
  it('generates the same SwiftUI for the scopes fixture from TSX and from Vue', async () => {
    const fromTsx = await fixture('scopes', 'Scopes')
    const fromVue = await fixture('scopesVue', 'Scopes')
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Scopes.vue'])
  })

  it('takes only properties of the published contracts', () => {
    const contracts = {
      MThemeProvider: [themeProviderProps, []],
      MPlatform: [platformProps, []],
      MMasonry: [masonryProps, []],
      MResizablePanels: [resizablePanelsProps, ['value', 'onChange', 'onResize']],
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

describe('MThemeProvider', () => {
  it('scopes a theme through the SwiftUI environment and keeps the provider in Vue', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await compile({
      'Home.lite.tsx': tsx(
        '    <MColumn>\n      <MThemeProvider theme={midnight} appearance={state.mode}>\n        <MCard><MText>Night</MText></MCard>\n      </MThemeProvider>\n      <MThemeProvider theme={mavis} darkTheme={midnight} appearance="system">\n        <MText>Either</MText>\n      </MThemeProvider>\n    </MColumn>',
        "import { mavis, midnight } from '@getcortexlabs/mavis-core'",
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain(
      'MavisThemeProvider(theme: .midnight, appearance: MavisAppearanceMode(self.mode)) {',
    )
    expect(view).toContain(
      'MavisThemeProvider(theme: .mavis, darkTheme: .midnight, appearance: .system) {',
    )
    for (const output of [web, native]) {
      const file = output.get('Home.vue')!
      expect(file).toContain("import { mavis, midnight } from '@getcortexlabs/mavis-core'")
      expect(file).toContain('<MThemeProvider :theme="midnight" :appearance="state.mode">')
      expect(file).toContain(
        '<MThemeProvider :theme="mavis" :darkTheme="midnight" appearance="system">',
      )
    }
    const tokens = swift.get('MavisTokens.swift')!
    expect(tokens).toContain('struct MavisColor: ShapeStyle {')
    expect(tokens).toContain('static let surface = MavisColor(.surface)')
    expect(tokens).toContain('static let mavis = MavisPalette(name: "mavis", appearance: .light')
    expect(tokens).toContain(
      'static let midnight = MavisPalette(name: "midnight", appearance: .dark',
    )
    expect(tokens).toContain(
      'static let root = MavisThemeScope(light: .mavis, dark: .midnight, mode: .light, palette: .mavis)',
    )
    expect(tokens).not.toContain('static let colorScheme')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisThemeProvider<Content: View>: View {')
    expect(controls).toContain('Group { content() }')
    // System controls take the appearance of the theme where they are drawn.
    expect(controls).not.toContain('MavisTokens.colorScheme')
    expect(controls.match(/\.mavisColorScheme\(\)/g)).toHaveLength(3)
  })

  it('starts the Mac in the theme it is generated for, with both themes registered', async () => {
    const { swift } = await compileProject(
      shared({ 'Home.lite.tsx': tsx('    <MText>Hi</MText>') }),
      { root: 'Home', theme: 'midnight' },
    )
    expect(swift.get('MavisTokens.swift')).toContain(
      'static let root = MavisThemeScope(light: .mavis, dark: .midnight, mode: .dark, palette: .midnight)',
    )
  })

  it.each([
    [
      'TSX',
      {
        'Home.lite.tsx': tsx(
          '    <MText>Hi</MText>',
          "import { defineTheme } from '@getcortexlabs/mavis-core'",
        ),
      },
      /defineTheme makes a theme the Mac cannot read yet[\s\S]*#342/,
    ],
    [
      'Vue',
      {
        'Home.vue': vue(
          "import { defineTheme } from '@getcortexlabs/mavis-core'",
          '  <MText>Hi</MText>',
        ),
      },
      /defineTheme makes a theme the Mac cannot read yet[\s\S]*#342/,
    ],
    [
      'TSX',
      {
        'Home.lite.tsx': tsx(
          "    <MThemeProvider theme={'midnight' as never}><MText>Hi</MText></MThemeProvider>",
        ),
      },
      /theme takes a theme Mavis exports, mavis or midnight, imported from @getcortexlabs\/mavis-core\. .*#342/,
    ],
    [
      'Vue',
      {
        'Home.vue': vue(
          "import { mavis } from '@getcortexlabs/mavis-core'",
          '  <MThemeProvider :dark-theme="mavis"><MText>Hi</MText></MThemeProvider>',
        ),
      },
      /not assignable/,
    ],
    [
      'TSX',
      {
        'Home.lite.tsx': tsx(
          '    <MThemeProvider appearance="dusk"><MText>Hi</MText></MThemeProvider>',
        ),
      },
      /not assignable/,
    ],
    [
      'TSX',
      {
        'Home.lite.tsx': tsx(
          '    <MText>Hi</MText>',
          "import { resolveSpace } from '@getcortexlabs/mavis-core'",
        ),
      },
      /has no exported member 'resolveSpace'/,
    ],
  ])('rejects what the Mac cannot resolve while generating (%s)', async (_, files, message) => {
    expect(await problems(files)).toMatch(message)
  })
})

describe('MPlatform', () => {
  it('keeps both branches for the Web and NativeScript and gives the Mac its own', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await compile({
      'Home.lite.tsx': tsx(
        "    <MColumn>\n      <MPlatform only=\"macos\" slotFallback={<MText>Elsewhere</MText>}>\n        <MText>Desk</MText>\n      </MPlatform>\n      <MPlatform only={['web', 'native']} slotFallback={<MText>Mac fallback</MText>}>\n        <MText>Touch or web</MText>\n      </MPlatform>\n    </MColumn>",
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('Text(verbatim: "Desk")')
    expect(view).toContain('Text(verbatim: "Mac fallback")')
    expect(view).not.toContain('Elsewhere')
    expect(view).not.toContain('Touch or web')
    for (const output of [web, native]) {
      const file = output.get('Home.vue')!
      expect(file).toContain(
        '<MPlatform only="macos">\n      <template #fallback>\n        <MText>Elsewhere</MText>\n      </template>\n      <MText>Desk</MText>\n    </MPlatform>',
      )
      expect(file).toContain("<MPlatform :only=\"['web', 'native']\">")
      expect(file).toContain('<MText>Touch or web</MText>')
    }
  })

  it.each([
    ['TSX', { 'Home.lite.tsx': tsx('    <MPlatform only="mac"><MText>a</MText></MPlatform>') }],
    [
      'Vue',
      {
        'Home.vue': vue(
          '',
          "  <MColumn>\n    <m-platform :only=\"['web', 'mac']\"><MText>a</MText></m-platform>\n  </MColumn>",
        ),
      },
    ],
  ])('type-checks only against the targets (%s)', async (_, files) => {
    expect(await problems(files)).toMatch(/not assignable to type 'MavisPlatformTarget/)
  })
})

describe('MMasonry', () => {
  it('places items with MavisMasonry and hands the slot the masonry item', async () => {
    const { swift, vue: web } = await fixture('masonry', 'Board')
    const view = swift.get('Board.swift')!
    expect(view).toContain(
      'MavisMasonry(label: "Pinned trees", items: self.pins.map { MasonryItem(id: $0.id, estimatedHeight: nil) }, id: \\.id, minColumnWidth: 120.0, columns: 2.0, gap: 16, emptyLabel: "Nothing pinned") { (item: MasonryItem, index: Double, mavisWidth: Double) in',
    )
    expect(view).toContain('.mavisIdentifier("board")')
    expect(swift.get('MavisTypes.swift')).toContain('struct MasonryItem: Hashable {')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisMasonryLayout: Layout {')
    expect(controls).toContain('.accessibilitySortPriority(Double(items.count - entry.index))')
    expect(controls).toContain('.joltLayout(value: animated ? items.map { $0[keyPath: id] } : []')
    expect(web.get('Board.vue')).toContain('<template #item="{ item, index }">')
  })

  it.each([
    [
      '<MMasonry label="x" items={[{ title: \'a\' }]} />',
      /does not exist in type '\{ readonly id: string/,
    ],
    [
      '<MMasonry label="x" items={state.pins} minColumnWidth={30} />',
      /minColumnWidth is at least 40/,
    ],
    [
      '<MMasonry label="x" items={state.pins} columns={13} />',
      /columns is a whole number from 1 to 12/,
    ],
    [
      '<MMasonry label="x" items={state.pins} slotItem={({ entry }) => <MText>a</MText>} />',
      /does not exist|hands its content item, index, width, not entry/,
    ],
    [
      '<MMasonry label="x" items={state.pins} slotItem={<MText>a</MText>} />',
      /not assignable|slotItem as \(\{ item \}\)/,
    ],
  ])('rejects %s', async (view, message) => {
    expect(await problems({ 'Home.lite.tsx': tsx(`    ${view}`) })).toMatch(message)
  })

  it('takes its item content as a template that takes the slot properties apart', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          '',
          '  <MMasonry label="x" :items="[{ id: \'a\' }]">\n    <template #item><MText>a</MText></template>\n  </MMasonry>',
        ),
      }),
    ).toMatch(/hands its content properties: take what you need, as #item="\{ item \}"/)
    expect(
      await problems({
        'Home.vue': vue(
          '',
          '  <MMasonry label="x" :items="[]">\n    <MText>a</MText>\n  </MMasonry>',
        ),
      }),
    ).toMatch(/MMasonry takes no children; give its content as <template #item>/)
  })
})

describe('MResizablePanels', () => {
  it('passes the value and its events and names the divider for tests', async () => {
    const { swift, vue: web, native } = await fixture('panels', 'Panels')
    const view = swift.get('Panels.swift')!
    expect(view).toContain('MavisPanels(\n')
    expect(view).toContain('label: "Workspace split",')
    expect(view).toContain('value: self.split,')
    expect(view).toContain('self.choose(value)')
    expect(view).toContain('vertical: true,')
    expect(view).toContain('step: 5.0,')
    expect(view).toMatch(/primary: \{\n[\s\S]*?\n +\},\n +secondary: \{/)
    for (const output of [web, native])
      expect(output.get('Panels.vue')).toContain(
        '<MResizablePanels id="workspace" label="Workspace split" :modelValue="state.split" @update:modelValue="(value) => state.choose(value)"',
      )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisPanels<Primary: View, Secondary: View>: View {')
    expect(controls).toContain('.accessibilityAdjustableAction { direction in')
    expect(controls).toContain('.accessibilityIdentifier("mavis-divider:" + label)')
    expect(controls).toContain('.joltLayout(value: origin == nil ? current : -1')
  })

  it.each([
    ['min={90}', /min is below max/],
    ['min={-1}', /min is a share of the panels, from 0 to 100/],
    ['step={0}', /step must be positive/],
    ['orientation="diagonal"', /not assignable/],
    ["snap={['a']}", /not assignable/],
  ])('rejects %s', async (props, message) => {
    expect(
      await problems({
        'Home.lite.tsx': tsx(
          `    <MResizablePanels label="Split" value={state.split} onChange={(value) => (state.split = value)} ${props} />`,
        ),
      }),
    ).toMatch(message)
  })

  it('hands its events a number', async () => {
    expect(
      await problems({
        'Home.vue': vue(
          "import { ref } from 'vue'\nconst text = ref('')",
          '  <MResizablePanels label="Split" :model-value="40" @update:model-value="(value: string) => (text = value)" />',
        ),
      }),
    ).toMatch(/not assignable/)
  })
})
