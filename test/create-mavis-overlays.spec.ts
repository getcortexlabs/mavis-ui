import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { dialogProps, sheetProps } from '../packages/core/src/vue/props'
import { popoverProps, menuProps } from '../packages/core/src/vue/navigation-props'
import { tourProps, tourTargetProps } from '../packages/core/src/vue/creative-props'
import { speedDialProps } from '../packages/core/src/vue/screen-component-props'
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
type Diagnostic = { file: string; line?: number; column?: number; message: string }
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>): Promise<Output> =>
  compileProject(shared(files), { root: 'Home' })
const tsx = (view: string, members = '') =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    open: false,\n    name: 'Trip',\n    reason: 'none',\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (template: string, script = '') =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nconst open = ref(false)\nconst name = ref('Trip')\nconst reason = ref('none')\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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
const diagnostics = async (files: Record<string, string>): Promise<Diagnostic[]> => {
  try {
    await compile(files)
  } catch (error) {
    return (error as { diagnostics: Diagnostic[] }).diagnostics
  }
  return []
}
const problems = async (files: Record<string, string>) =>
  (await diagnostics(files)).map((item) => item.message).join('\n')
const inTsx = (view: string, members = '') => problems({ 'Home.lite.tsx': tsx(view, members) })
const inVue = (template: string, script = '') => problems({ 'Home.vue': vue(template, script) })

describe('the overlays in both formats', () => {
  it.each([
    ['sheet', 'Trip'],
    ['dialog', 'Booking'],
    ['popover', 'Filters'],
    ['menu', 'Actions'],
    ['speedDial', 'Create'],
    ['tour', 'Guide'],
  ])('reads the %s fixture into one model from TSX and from Vue', async (name, root) => {
    const fromTsx = await fixture(name, root)
    const fromVue = await fixture(`${name}Vue`, root)
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  })

  it('takes only properties of the published contracts', () => {
    const contracts = {
      MSheet: [sheetProps, ['onUpdateOpen', 'onClose']],
      MDialog: [dialogProps, ['onUpdateOpen', 'onConfirm', 'onClose']],
      MPopover: [popoverProps, ['onUpdateOpen', 'onOpened', 'onClose']],
      MMenu: [menuProps, ['onUpdateOpen', 'onSelect', 'onClose']],
      MSpeedDial: [speedDialProps, ['onUpdateOpen', 'onSelect', 'onClose']],
      MTour: [tourProps, ['value', 'onChange', 'onFinish', 'onMissing']],
      MTourTarget: [tourTargetProps, []],
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

  it('draws every overlay in a layer the window hosts', async () => {
    const { swift } = await fixture('sheet', 'Trip')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisLayerKey: PreferenceKey {')
    expect(controls).toContain('func mavisLayers() -> some View {')
    expect(controls).toContain('.overlayPreferenceValue(MavisLayerKey.self) { layers in')
    // Under a modal layer what is below is inert, and a layer written in a layer opens over it.
    expect(controls).toContain('.disabled(modal >= level)')
    expect(controls).toMatch(
      /\.accessibilityElement\(children: \.contain\)\n +\.accessibilityHidden\(modal >= level\)/,
    )
    expect(controls).toContain('ForEach(layers.filter { $0.level == level }) { layer in')
    expect(controls).toContain('.environment(\\.mavisLayerLevel, level + 1)')
    expect(controls).toContain('.modifier(MavisLayerHost(level: 4))')
    // The place a layer is written at is no child of a stack or a grid.
    expect(controls).toContain('.layoutValue(key: MavisAbsentKey.self, value: true)')
    expect(controls).toContain('let subviews = all.filter { !$0[MavisAbsentKey.self] }')
    expect(controls.match(/!\$0\[MavisAbsentKey\.self\]/g)!.length).toBeGreaterThanOrEqual(4)
  })
})

describe('MSheet', () => {
  it('opens a controlled sheet with its name, options and reasons', async () => {
    const { swift, vue: web, native } = await fixture('sheet', 'Trip')
    const view = swift.get('Trip.swift')!
    expect(view).toMatch(
      /MavisSheet\(\n +open: self\.search,\n +title: "Search flights",\n +closeLabel: "Close search",\n +gap: 16,\n +id: "search",\n +onUpdateOpen: \{ \(value: Bool\) in\n +if !self\.locked \{\n +self\.search = value\n +\}\n +\},\n +onClose: \{ \(next: String\) in\n +self\.reason = next\n +\},\n +content: \{/,
    )
    expect(view).toMatch(
      /MavisSheet\(\n +open: self\.terms,\n +label: "Terms of the trip",\n +dismissible: false,\n +fullscreen: true,\n +gap: 16,/,
    )
    for (const output of [web, native]) {
      const file = output.get('Trip.vue')!
      expect(file).toContain('<MSheet id="search" :open="state.search" @update:open="(value) => {')
      expect(file).toContain(
        '@close="(next) => state.reason = next" title="Search flights" closeLabel="Close search" gap="md">',
      )
      expect(file).toContain(
        '<MSheet :open="state.terms" @update:open="(value) => state.terms = value"',
      )
      expect(file).toContain(
        'accessibilityLabel="Terms of the trip" :dismissible="false" :fullscreen="true" gap="md">',
      )
    }
  })

  it('moves the panel with Jolt and asks the source to close', async () => {
    const { swift } = await fixture('sheet', 'Trip')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisSheet<Content: View>: View {')
    expect(controls).toContain('JoltSheetModel(snaps: [fullscreen ? .fraction(1) : .content])')
    expect(controls).toContain('model.endDrag(velocity: event.velocity.height)')
    for (const reason of ['button', 'backdrop', 'escape', 'swipe'])
      expect(controls).toContain(`request("${reason}")`)
    expect(controls).toContain('if closing == nil { onClose("program") }')
    expect(controls).toContain('.keyboardShortcut(.cancelAction)')
    // The Web's panel: 560 wide at most, on the surface, rounded at the top by the theme.
    expect(controls).toContain(
      'let width = options.fullscreen ? proxy.size.width : Swift.min(560, proxy.size.width)',
    )
    expect(controls).toContain('.background(MavisTokens.surface, in: shape)')
    expect(controls).toContain('MavisIcon("x", size: 16)')
    // In a window that is not on screen Jolt's clock has no display: the panel settles at once.
    expect(controls).toContain('private var still: Bool { reduceMotion || !window.onScreen }')
  })

  it('reads v-model:open as open with its update', async () => {
    const view =
      '<MSheet open={state.open} onUpdateOpen={(value) => (state.open = value)} title="Filters">\n  <MText>Pick</MText>\n</MSheet>'
    const fromTsx = await compile({
      'Home.lite.tsx': tsx(`    <MColumn>\n${view}\n    </MColumn>`),
    })
    const fromVue = await compile({
      'Home.vue': vue(
        '  <MColumn>\n    <m-sheet v-model:open="open" title="Filters"><MText>Pick</MText></m-sheet>\n  </MColumn>',
      ),
    })
    const sheet = (output: Output) =>
      (portableModel(output).components[0].view.children as { tag: string }[])[0]
    expect(sheet(fromVue)).toEqual(sheet(fromTsx))
    expect(fromTsx.swift.get('Home.swift')).toContain('open: self.open,')
    // A listener beside the model runs after it.
    const both = await compile({
      'Home.vue': vue(
        '  <MColumn>\n    <MSheet v-model:open="open" title="Filters" @update:open="(value) => (reason = value ? \'opened\' : \'closed\')" />\n  </MColumn>',
      ),
    })
    expect(both.swift.get('Home.swift')).toMatch(
      /onUpdateOpen: \{ \(value: Bool\) in\n +self\.open = value\n +self\.reason = \(value \? "opened" : "closed"\)\n +\}/,
    )
  })

  it('needs a name, as the contract does', async () => {
    expect(await inTsx('    <MSheet open={state.open} />')).toMatch(/title|accessibilityLabel/)
    expect(await inVue('  <MSheet :open="open" />')).toMatch(/title|accessibilityLabel/)
    for (const blank of ['title="  "', 'title="" accessibilityLabel=" "'])
      expect(await inTsx(`    <MSheet open={state.open} ${blank} />`)).toContain(
        'MSheet needs a title, or an accessibilityLabel when it shows no heading',
      )
    expect(
      await inTsx('    <MSheet open={state.open} title="" accessibilityLabel="Filters" />'),
    ).toBe('')
    expect(await inTsx('    <MSheet open={state.open} title={state.name} />')).toBe('')
  })

  it('says where a sheet is wrong', async () => {
    const found = await diagnostics({
      'Home.vue': vue('  <MColumn>\n    <MSheet :open="open" title="  " />\n  </MColumn>'),
    })
    expect(found).toEqual([
      expect.objectContaining({ file: 'shared/Home.vue', line: 11, column: 26 }),
    ])
  })

  it('rejects what the Mac cannot keep', async () => {
    expect(
      await inVue('  <MSheet :open="open" title="Filters" @opened="open = true" />'),
    ).toContain('MSheet does not take @opened on the Mac.')
    expect(await inVue('  <MSheet v-model="open" title="Filters" />')).toContain(
      'MSheet does not take v-model on the Mac.',
    )
    expect(await inVue('  <MSheet v-model:title="name" :open="open" />')).toContain(
      'MSheet does not take v-model:title on the Mac.',
    )
    expect(
      await inVue('  <MSheet v-model:open="open" v-model:open="open" title="Filters" />'),
    ).not.toBe('')
    expect(await inVue('  <MColumn v-model:open="open" />')).toContain(
      'MColumn does not take v-model:open on the Mac.',
    )
    expect(
      await inTsx('    <MSheet open={state.open} title="Filters" align="middle" />'),
    ).toContain('"middle"')
    expect(
      await inTsx('    <MSheet open={state.open} title="Filters" returnFocus={() => null} />'),
    ).not.toBe('')
    // Overlay content can live alongside the independent interactive card surface.
    expect(
      await inTsx(
        '    <MCard label="Trip" onClick={() => (state.open = true)}>\n      <MSheet open={state.open} title="Filters" />\n    </MCard>',
      ),
    ).toBe('')
    expect(
      await inTsx(
        '    <MSheet open={state.open} title="Filters" onClose={() => state.fail()} />',
        "    fail() {\n      throw new Error('no')\n    },\n",
      ),
    ).toContain('fail can fail, and onClose of MSheet has no way to show it.')
  })
})

describe('MDialog', () => {
  it('asks with a confirm and a cancel action', async () => {
    const { swift, vue: web, native } = await fixture('dialog', 'Booking')
    const view = swift.get('Booking.swift')!
    expect(view).toMatch(
      /MavisDialog\(\n +open: self\.confirm,\n +title: "Confirm booking\?",\n +description: "You will be charged now\.",\n +confirmLabel: "Book now",\n +cancelLabel: "Not yet",\n +onUpdateOpen: \{ \(value: Bool\) in\n +self\.confirm = value\n +\},\n +onConfirm: \{\n +self\.status = "booked"\n +self\.confirm = false\n +\},\n +onClose: \{ \(next: String\) in/,
    )
    expect(view).toMatch(
      /confirmLabel: "Delete",\n +loadingLabel: "Deleting…",\n +danger: true,\n +loading: self\.removing,\n +dismissible: false,/,
    )
    for (const output of [web, native]) {
      const file = output.get('Booking.vue')!
      expect(file).toContain(
        '<MDialog :open="state.confirm" @update:open="(value) => state.confirm = value" @close="(next) => state.reason = next" @confirm="() => {',
      )
      expect(file).toContain(
        'title="Delete this trip?" description="This cannot be undone." confirmLabel="Delete" loadingLabel="Deleting…" tone="danger" :loading="state.removing" :dismissible="false" />',
      )
    }
  })

  it('keeps the contract of a controlled dialog', async () => {
    const { swift } = await fixture('dialog', 'Booking')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisDialog: View {')
    // Cancel always asks; Escape and the scrim only when the dialog is dismissible; nothing while loading.
    expect(controls).toContain(
      'guard open, requested == nil, !loading, reason == "cancel" || dismissible else { return }',
    )
    for (const reason of ['cancel', 'backdrop', 'escape'])
      expect(controls).toContain(`request("${reason}")`)
    expect(controls).toContain('if !next, requested == nil { onClose("program") }')
    expect(controls).toContain('guard open, !loading, requested == nil else { return }')
    // Return confirms, except a dangerous action; Escape is the cancel action.
    expect(controls).toContain('.keyboardShortcut(danger ? nil : .defaultAction)')
    expect(controls).toContain(
      'MavisButtonLabel(text: confirmLabel, loading: loading, loadingText: loadingLabel)',
    )
    expect(controls).toContain('theme.recolored([.primary: .danger, .onPrimary: .surface])')
    expect(controls).toContain('MavisIcon(danger ? "triangle-alert" : "circle-check", size: 24)')
    expect(controls).toContain(
      'JoltPresence(open, enter: MavisLayerMotion.enter, leave: MavisLayerMotion.leave) {',
    )
    expect(controls).toContain(
      'JoltPreset.fadeInUp.recipe((try? JoltPresetParameters(distance: 8, duration: 180)) ?? .none)',
    )
  })

  it('reads a tone that changes, and ignores the Web drag presentation', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        "    <MDialog open={state.open} title=\"Leave?\" interactive tone={state.open ? 'danger' : 'default'} />",
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('danger: (self.open ? "danger" : "default") == "danger"')
    expect(view).not.toContain('interactive')
  })

  it('rejects a dialog the other targets would refuse', async () => {
    expect(await inTsx('    <MDialog open={state.open} />')).toContain('title')
    expect(await inVue('  <MDialog :open="open" />')).toContain('MDialog needs title.')
    expect(await inTsx('    <MDialog open={state.open} title=" " />')).toContain(
      'title cannot be blank',
    )
    for (const key of ['confirmLabel', 'cancelLabel', 'loadingLabel'])
      expect(
        await inTsx(`    <MDialog open={state.open} title="Leave?" ${key}=" " />`),
        key,
      ).toContain(`${key} cannot be blank`)
    expect(
      await inTsx('    <MDialog open={state.open} title="Leave?" tone="warning" />'),
    ).toContain('"warning"')
    expect(
      await inTsx(
        '    <MDialog open={state.open} title="Leave?">\n      <MText>More</MText>\n    </MDialog>',
      ),
    ).toContain("Property 'children' does not exist")
    expect(
      await inVue('  <MDialog :open="open" title="Leave?"><MText>More</MText></MDialog>'),
    ).toContain('MDialog takes no children; use its properties.')
    expect(
      await inVue('  <MDialog :open="open" title="Leave?" @opened="open = true" />'),
    ).toContain('MDialog does not take @opened on the Mac.')
    expect(
      await inTsx(
        '    <MDialog open={state.open} title="Leave?" onConfirm={() => state.fail()} />',
        "    fail() {\n      throw new Error('no')\n    },\n",
      ),
    ).toContain('fail can fail, and onConfirm of MDialog has no way to show it.')
  })
})

describe('anchored overlays', () => {
  it.each([
    ['label="Filters"', 'label=" "', /label cannot be blank/],
    ['triggerLabel="Open"', 'triggerLabel=" "', /triggerLabel cannot be blank/],
    ['width={280}', 'width={0}', /width must be positive/],
    ['placement="bottom-start"', 'placement="left"', /not assignable/],
    ['icon="plus"', 'icon="pluss"', /not assignable/],
  ])('rejects invalid %s at its source', async (before, after, expected) => {
    const markup =
      '<MPopover label="Filters" triggerLabel="Open" width={280} placement="bottom-start" icon="plus"><MText>Body</MText></MPopover>'
    expect(await inTsx(`    <MColumn>${markup.replace(before, after)}</MColumn>`)).toMatch(expected)
  })

  it('keeps the model update before a listener next to v-model:open', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        '<MPopover v-model:open="open" label="Filters" trigger-label="Open" @update:open="(value) => (reason = value ? \'opened\' : \'closed\')"><MText>Body</MText></MPopover>',
      ),
    })
    expect(swift.get('Home.swift')).toMatch(
      /self\.open = value\n +self\.reason = \(value \? "opened" : "closed"\)/,
    )
  })

  it('types both menu selection arguments and preserves the selected record', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        '<MMenu label="Actions" trigger-label="Open" :items="items" @select="(value, item) => { name = value; reason = item.label ?? \'none\' }" />',
        "import type { MenuItem } from '@getcortexlabs/mavis-core'\nconst items = ref<MenuItem[]>([{ value: 'edit', label: 'Edit' }])",
      ),
    })
    expect(swift.get('Home.swift')).toMatch(
      /onSelect: \{ \(value: String, item: MenuItem\) in\n +self\.name = value\n +self\.reason = \(item.label \?\? "none"\)/,
    )
  })
})

it.runIf(process.platform === 'darwin')(
  'places the Swift anchored panel like the shared geometry, including RTL and small viewports',
  async () => {
    const { execFileSync } = await import('node:child_process')
    const { mkdtempSync, writeFileSync } = await import('node:fs')
    const { tmpdir } = await import('node:os')
    const { placePopover } = await import('../packages/core/src/popover')
    const { swift } = await fixture('popover', 'Filters')
    const controls = swift.get('MavisControls.swift')!
    const source = controls.slice(
      controls.indexOf('func mavisPlacePopover('),
      controls.indexOf('/// The presses of the pointer'),
    )
    const cases = [
      {
        anchor: { x: 12, y: 12, width: 40, height: 44 },
        panel: { width: 280, height: 160 },
        viewport: { x: 0, y: 0, width: 800, height: 600 },
      },
      {
        anchor: { x: 720, y: 540, width: 70, height: 44 },
        panel: { width: 280, height: 160 },
        viewport: { x: 0, y: 0, width: 800, height: 600 },
      },
      {
        anchor: { x: -20, y: -10, width: 70, height: 44 },
        panel: { width: 260, height: 200 },
        viewport: { x: 0, y: 0, width: 320, height: 180 },
      },
    ]
    const variants = cases.flatMap((sample) =>
      (['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const).flatMap((placement) =>
        [false, true].map((rtl) => ({ ...sample, placement, rtl })),
      ),
    )
    const calls = variants.map(
      ({ anchor: a, panel: p, viewport: v, placement, rtl }, index) =>
        `let p${index} = mavisPlacePopover(anchor: CGRect(x: ${a.x}, y: ${a.y}, width: ${a.width}, height: ${a.height}), panel: CGSize(width: ${p.width}, height: ${p.height}), viewport: CGSize(width: ${v.width}, height: ${v.height}), placement: "${placement}", rtl: ${rtl})`,
    )
    const folder = mkdtempSync(join(tmpdir(), 'mavis-popover-geometry-'))
    const program = variants
      .map((_, index) => `${calls[index]}\nprint("\\(p${index}.x),\\(p${index}.y)")`)
      .join('\n')
    writeFileSync(
      join(folder, 'main.swift'),
      `import Foundation\nimport CoreGraphics\n${source}\n${program}\n`,
    )
    execFileSync('swiftc', ['main.swift', '-o', 'geometry'], { cwd: folder, stdio: 'pipe' })
    const points = execFileSync(join(folder, 'geometry'), { encoding: 'utf8' })
      .trim()
      .split('\n')
      .map((line) => line.split(',').map(Number))
    expect(points).toEqual(
      variants.map(({ anchor, panel, viewport, placement, rtl }) => {
        const point = placePopover(anchor, panel, viewport, placement, rtl)
        return [point.x, point.y]
      }),
    )
  },
)

describe('MCommandPalette', () => {
  it('reads equivalent command screens, their controlled query and selection', async () => {
    const a = await fixture('commands', 'Commands')
    const b = await fixture('commandsVue', 'Commands')
    expect(portableModel(a)).toEqual(portableModel(b))
    expect(swiftOf(a)).toEqual(swiftOf(b))
    expect(a.swift.get('Commands.swift')).toContain('MavisCommandPalette(')
    expect(a.vue.get('Commands.vue')).toContain('@update:query')
  })
  it('rejects blank command headings and a non-string query', async () => {
    await expect(
      compile({ 'Home.lite.tsx': tsx('<MCommandPalette label=" " items={[]} />') }),
    ).rejects.toThrow('cannot be blank')
    await expect(
      compile({
        'Home.lite.tsx': tsx('<MCommandPalette label="Commands" items={[]} query={12} />'),
      }),
    ).rejects.toThrow()
  })
})

describe('MTour', () => {
  it('uses the public step contract and preserves optional and scoped content', async () => {
    const output = await fixture('tour', 'Guide')
    const web = output.vue.get('Guide.vue')!
    expect(web).toContain(':modelValue="state.step ?? null"')
    expect(web).toContain('<MTourTarget name="last">')
    expect(web).toContain('First active')
    const swift = output.swift.get('Guide.swift')!
    expect(swift).toContain('MavisTourTarget(')
    expect(swift).toContain('content: { active in')
    expect(swift).toContain('content: { _ in')
    expect(swift).toContain('self.missing = name')
  })
  it('rejects malformed steps in both authoring formats', async () => {
    expect(
      await inTsx(
        '<MTour label="Guide" steps={state.items} />',
        'items: [{ id: "one", title: "One" }],',
      ),
    ).toContain('description')
    expect(
      await inVue(
        '<MTour label="Guide" :steps="items" />',
        'const items = ref([{ id: "one", title: "One" }])',
      ),
    ).toContain('description')
  })
  it('rejects unknown target slot fields rather than emitting a broken screen', async () => {
    expect(
      await inTsx(
        '<MTourTarget name="one">{({ missing }) => <MText>{missing}</MText>}</MTourTarget>',
      ),
    ).toContain('missing')
    expect(
      await inVue(
        '<MTourTarget name="one" v-slot="{ missing }"><MText>{{ missing }}</MText></MTourTarget>',
      ),
    ).toContain('missing')
  })
})
