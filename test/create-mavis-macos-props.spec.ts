import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
import { componentProps } from '../packages/core/src/vue/props'

const portable = new URL('./portable/', import.meta.url).pathname

async function fixture(name: string) {
  const { root } = JSON.parse(await readFile(join(portable, name, 'steps.json'), 'utf8'))
  const files: Map<string, string> = await readShared(join(portable, name))
  return { files, root: root as string, file: `shared/${root}.lite.tsx` }
}

describe('portable primitives and the published contracts', () => {
  // What the portable sources name themselves instead of taking it from a contract: the content
  // of a field (value, checked, onChange), events as on… handlers, a stack's and a card's label
  // (accessibilityLabel), a card's tone, a button's shortcut and a field's ref.
  const own: Record<string, string[]> = {
    MColumn: ['label', 'onKeyDown'],
    MRow: ['label', 'onKeyDown'],
    MGrid: [],
    MCard: ['label', 'tone', 'onClick'],
    MText: [],
    MButton: ['onClick', 'shortcut'],
    MInput: ['value', 'onChange', 'onSubmit', 'onEscape', 'ref'],
    MCheckbox: ['checked', 'onChange'],
    MSelect: ['value', 'onChange'],
  }

  it.each(Object.keys(own))('%s takes only properties of its contract', (name) => {
    const contract = Object.keys(componentProps[name as keyof typeof componentProps])
    const accepted = Object.keys(components[name].props).filter(
      (prop) => !own[name]!.includes(prop),
    )
    expect(accepted.filter((prop) => !contract.includes(prop))).toEqual([])
  })

  it('gives every component a declaration and a SwiftUI view', () => {
    for (const [name, definition] of Object.entries<Record<string, unknown>>(components)) {
      // A list is generic over its items.
      expect(definition.declaration, name).toMatch(new RegExp(`^declare function ${name}(<T>)?\\(`))
      // A run of text is part of its MText's view.
      if (!definition.inline) expect(definition.swift, name).toBeTypeOf('function')
    }
  })
})

describe('layout properties', () => {
  it('passes them to the Mavis components and lays them out with MavisFlex on the Mac', async () => {
    const { files, root } = await fixture('layout')
    const { vue, native, swift } = await compileProject(files, { root })
    for (const output of [vue, native]) {
      const view = output.get('Layout.vue')!
      expect(view).toContain('<MColumn id="page" gap="md" :width="300">')
      expect(view).toContain('<MRow id="wrap" gap="sm" :width="200" :wrap="true">')
      expect(view).toContain(
        '<MColumn id="columnCenter" :width="200" align="center" :gap="12" backgroundColor="#F1ECFF">',
      )
      expect(view).toContain(
        '<MColumn id="half" width="50%" height="50%" backgroundColor="#C8B6FF" />',
      )
      expect(view).toContain(
        '<MColumn id="axes" :width="200" paddingX="lg" paddingY="xs" :radius="6" backgroundColor="#F1ECFF">',
      )
      expect(view).toContain('<MColumn id="k1" :width="120" :height="24" :shrink="0"')
      expect(view).toMatch(
        /<MRow id="justify" gap="sm" :width="240" :justify="\(\(state\.step === 0\) \? 'start'/,
      )
    }
    const view = swift.get('Layout.swift')!
    expect(view).toContain('MavisColumn(spacing: 16) {')
    expect(view).toContain('MavisRow(spacing: 8, wrap: true) {')
    expect(view).toContain('MavisColumn(spacing: 12.0, align: .center) {')
    expect(view).toContain('MavisColumn(spacing: 0, justify: .end, align: .end) {')
    expect(view).toMatch(
      /MavisRow\(spacing: 8, justify: MavisJustify\(\(\(self\.step == 0\.0\) \? "start"/,
    )
    expect(view).toContain('.mavisItem(width: .fraction(0.5), height: .fraction(0.5))')
    expect(view).toContain('.mavisItem(shrink: 0.0, width: .points(120.0), height: .points(24.0))')
    expect(view).toContain('.mavisItem(grow: 3.0, height: .points(24.0))')
    // auto is the default: nothing to tell the stack.
    expect(view).toContain(
      '.mavisIdentifier("auto")\n                    .mavisItem(height: .points(20.0))',
    )
    expect(view).toContain(
      [
        '                .padding(16)',
        '                .background(mavisColor("#F1ECFF"), in: RoundedRectangle(cornerRadius: 16))',
        '                .mavisIdentifier("padded")',
        '                .mavisItem(width: .points(200.0))',
      ].join('\n'),
    )
    expect(view).toContain(
      [
        '                .padding(.horizontal, 24)',
        '                .padding(.vertical, 4)',
        '                .background(mavisColor("#F1ECFF"), in: RoundedRectangle(cornerRadius: 6.0))',
      ].join('\n'),
    )
    expect(view).not.toMatch(/\bVStack\(|\bHStack\(/)
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisFlex: Layout {')
    expect(controls).toContain('var align: MavisAlign = .stretch')
    expect(controls).toContain('var align: MavisAlign = .center')
    expect(controls.match(/struct MavisFlex: Layout/g)).toHaveLength(1)
    // A container's id is two corner points, and only in a test run: an element over the
    // container would take the accessibility hit test from the controls inside it.
    expect(controls).toContain(
      'ProcessInfo.processInfo.environment["MAVIS_TEST_IDENTIFIERS"] == "1"',
    )
    expect(controls).toMatch(
      /if mavisTestIdentifiers \{\n +content\n +\.background\(alignment: \.topLeading\) \{ corner \}\n +\.background\(alignment: \.bottomTrailing\) \{ corner \}\n +\} else \{\n +content\n/,
    )
    expect(controls).toContain('Color.clear.frame(width: 1, height: 1).accessibilityElement()')
    expect(controls.match(/Color\.clear\.frame/g)).toHaveLength(1)
  })

  it.each([
    ['gap="md" width={300}', 'gap={-4} width={300}', /gap cannot be negative/],
    [
      'gap="md" width={300}',
      "gap={state.step > 1 ? 'md' : 'sm'} width={300}",
      /gap takes a spacing token name or a number/,
    ],
    ['gap="md" width={300}', 'gap="huge" width={300}', /not assignable/],
    ['id="k1" width={120}', 'id="k1" width={-120}', /width cannot be negative/],
    [
      'id="k1" width={120}',
      `id="k1" width={state.step > 1 ? '50%' : 'auto'}`,
      /width takes a number, or a literal such as "50%" or "auto"/,
    ],
    ['width="50%"', 'width="half"', /not assignable/],
    ['height="50%"', 'height="50"', /not assignable/],
    ['shrink={0}', 'shrink={-1}', /shrink cannot be negative/],
    ['grow={3}', 'grow="3"', /not assignable/],
    ['radius="md"', 'radius="huge"', /not assignable/],
    ['radius={6}', 'radius={-6}', /radius cannot be negative/],
    ['paddingX="lg"', 'paddingX="wide"', /not assignable/],
    [
      'id="half" width="50%" height="50%" backgroundColor="#C8B6FF"',
      'id="half" width="50%" height="50%" backgroundColor="lavender"',
      /backgroundColor takes a hex color/,
    ],
    ['align="end"', 'align="baseline"', /not assignable/],
    ['justify="end"', 'justify="evenly"', /not assignable/],
    ['gap="sm" width={200} wrap>', 'gap="sm" width={200} wrap="yes">', /not assignable/],
    [
      'id="columnDefault" width={200}',
      'id="columnDefault" label="Box" accessibilityLabel="Box" width={200}',
      /label and accessibilityLabel name the same thing/,
    ],
    ['id="columnDefault"', 'testId="columnDefault"', /Property 'testId' does not exist/],
    [
      'id="columnDefault"',
      'id="columnDefault" verticalAlignment="top"',
      /Property 'verticalAlignment' does not exist/,
    ],
  ] as const)('rejects %s → %s with a source location', async (from, to, message) => {
    const { files, root, file } = await fixture('layout')
    const text = files.get(file)!
    expect(text).toContain(from)
    const error = await compileProject(new Map(files).set(file, text.replace(from, to)), {
      root,
    }).then(
      () => undefined,
      (failure: Error) => failure,
    )
    expect(error, to).toBeInstanceOf(Error)
    expect(error!.message).toMatch(/shared\/Layout\.lite\.tsx:\d+:\d+:/)
    expect(error!.message).toMatch(message)
  })
})

describe('text, button, card and grid properties', () => {
  it('compiles them for every target', async () => {
    const { files, root } = await fixture('controls')
    const { vue, native, swift } = await compileProject(files, { root })
    for (const output of [vue, native]) {
      const view = output.get('Controls.vue')!
      expect(view).toContain('<MText id="title" as="h1" variant="title">Controls</MText>')
      expect(view).toContain('<MText as="h2" variant="heading" weight="bold">Texts</MText>')
      expect(view).toContain('<MText :accessibilityHidden="true">Decoration</MText>')
      expect(view).toContain('<MText id="count" :accessibilityLabel="`Count: ${state.count}`">')
      expect(view).toContain('<MText id="single" :wrap="false">')
      expect(view).toContain('<MText id="grows" :grow="1">Grows</MText>')
      expect(view).toContain('<MButton id="large" size="lg" variant="ghost" text="Large"')
      expect(view).toContain(
        ':loading="state.saving" loadingText="Saving…" loadingIndicator="dots"',
      )
      expect(view).toContain('<MButton text="Wait" :loading="true"')
      expect(view).toContain(
        '<MCard accessibilityLabel="Locked card" :disabled="state.locked" elevation="sm" interactive @click=',
      )
      expect(view).toContain(
        '<MCard id="one" :width="120" :shrink="0" paddingX="md" paddingY="xs" radius="sm">',
      )
      expect(view).toContain(
        '<MGrid id="grid" :width="220" :columns="2" gap="sm" padding="sm" radius="sm" backgroundColor="#F1ECFF" accessibilityLabel="Pair">',
      )
      expect(view).toContain('<MCheckbox id="shadow" label="Shadow"')
      expect(view).not.toContain('shortcut=')
    }
    const web = vue.get('Controls.vue')!
    expect(web).toContain("{ key: '1', run: () => state.add(1) },")
    expect(web).toContain("{ key: 'F2', mod: false, run: () => state.add(5) },")
    expect(vue.get('runtime.ts')).toContain('(shortcut.mod ?? true) === mod')
    expect(native.get('Controls.vue')).not.toContain('useMavisShortcuts')

    const view = swift.get('Controls.swift')!
    expect(view).toContain(
      [
        '.accessibilityAddTraits(.isHeader)',
        '.accessibilityHeading(.h1)',
        '.accessibilityIdentifier("title")',
      ]
        .map((line) => `                ${line}`)
        .join('\n'),
    )
    expect(view).toContain('.fontWeight(.bold)')
    expect(view).toContain('.fontWeight(MavisTokens.weight((self.locked ? "400" : "700")))')
    // as="p" on a large variant: not a heading.
    expect(view).toMatch(
      /Text\(verbatim: "Large, not a heading"\)(?:\n +\.(?!accessibilityAddTraits).*)*\n +Mavis/,
    )
    expect(view).toContain(
      '.accessibilityLabel(Text(verbatim: "Count: \\(mavisString(self.count))"))',
    )
    expect(view).toContain('.accessibilityHidden(true)')
    expect(view).toContain('.multilineTextAlignment(MavisTextAlign.center.text)')
    expect(view).toContain('.frame(maxWidth: .infinity, alignment: MavisTextAlign.center.frame)')
    expect(view).toContain(
      '.multilineTextAlignment(MavisTextAlign((self.locked ? "right" : "left")).text)',
    )
    expect(view).toContain('.lineLimit(1)')
    expect(view).toContain('.buttonStyle(MavisButtonStyle(variant: .ghost, size: .lg))')
    expect(view).toContain('.buttonStyle(MavisButtonStyle())')
    expect(view).toContain('.keyboardShortcut(KeyEquivalent("1"), modifiers: .command)')
    expect(view).toContain('.keyboardShortcut(mavisFunctionKey(2), modifiers: [])')
    expect(view).toContain(
      'MavisButtonLabel(text: "Save", loading: self.saving, loadingText: "Saving…", indicator: .dots, variant: MavisButtonVariant((self.saving ? "secondary" : "primary")), size: MavisButtonSize((self.saving ? "sm" : "md")))',
    )
    expect(view).toContain('.disabled(self.saving)')
    expect(view).toContain(
      'MavisButtonLabel(text: "Wait", loading: true, variant: .primary, size: .md)',
    )
    expect(view).toContain('.accessibilityLabel(Text(verbatim: "Add one"))')
    expect(view).toContain(
      'MavisCard(tone: AnyShapeStyle(MavisTokens.surface), paddingX: 16, paddingY: 4, radius: 10, spacing: 0) {',
    )
    expect(view).toContain(
      'MavisCard(tone: AnyShapeStyle(mavisColor("#FFFFFF")), paddingX: 8, paddingY: 8, radius: 4.0, spacing: 0, elevation: (self.locked ? "none" : "md")) {',
    )
    expect(view).toContain(
      [
        '.buttonStyle(MavisCardButtonStyle())',
        '.disabled(self.locked)',
        '.accessibilityLabel(Text(verbatim: "Locked card"))',
        '.accessibilityIdentifier("mavis-card")',
      ]
        .map((line) => `                ${line}`)
        .join('\n'),
    )
    expect(view).toContain(
      [
        '.environment(\\.mavisInFlex, false)',
        '.padding(8)',
        '.background(mavisColor("#F1ECFF"), in: RoundedRectangle(cornerRadius: 10))',
        '.accessibilityElement(children: .contain)',
        '.accessibilityLabel(Text(verbatim: "Pair"))',
        '.mavisIdentifier("grid")',
        '.mavisItem(width: .points(220.0))',
      ]
        .map((line) => `                ${line}`)
        .join('\n'),
    )
    expect(view).toContain(
      'id: "shadow"\n            )\n                .accessibilityHidden(true)',
    )

    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisButtonStyle: ButtonStyle {')
    expect(controls).toContain('JoltLoaderView(loader)')
    expect(controls).toContain('case .sm: return 44')
    expect(controls).toContain('case "md": return (Color(red:')
    expect(swift.get('MavisTokens.swift')).toContain(
      'static func weight(_ name: String) -> Font.Weight',
    )
  })

  it.each([
    ['as="h1"', "as={state.locked ? 'h1' : 'h2'}", /as is written as a literal/],
    ['as="h2"', 'as="h7"', /not assignable/],
    ['weight="bold"', 'weight="heavy"', /not assignable/],
    ['align="center"', 'align="justify"', /not assignable/],
    ['wrap={false}', 'wrap={false} lineClamp={2}', /Property 'lineClamp' does not exist/],
    ['wrap={false}', 'wrap={false} selectable', /Property 'selectable' does not exist/],
    ['size="lg"', 'size="xl"', /not assignable/],
    ['variant="ghost"', 'variant="destructive"', /not assignable/],
    ['loadingIndicator="dots"', 'loadingIndicator="spinner"', /not assignable/],
    ['loadingText="Saving…"', 'loadingText={3}', /not assignable/],
    ['shortcut="mod+1"', 'shortcut="1"', /not assignable/],
    ['shortcut="F2"', 'shortcut="F13"', /not assignable/],
    ['shortcut="F2"', 'shortcut="mod+1"', /mod\+1 is already used/],
    ['shortcut="F2"', 'icon="plus"', /Property 'icon' does not exist/],
    ['shortcut="F2"', 'href="/next"', /\/next is a screen of the app, and this project has no route table/],
    ['elevation="sm"', 'elevation="xl"', /not assignable/],
    [
      'elevation="sm"\n        onClick={() => state.add(50)}',
      'elevation="sm"',
      /disabled is for a card with onClick/,
    ],
    [
      'backgroundColor="#FFFFFF"',
      'backgroundColor="#FFFFFF"\n          tone="surface"',
      /tone and backgroundColor both paint the card/,
    ],
    [
      'accessibilityLabel="Locked card"',
      'accessibilityLabel="Locked card"\n        label="Locked"',
      /label and accessibilityLabel name the same thing/,
    ],
    ['accessibilityLabel="Locked card"', '', /A card with onClick needs a label/],
    ['id="shadow"', 'id="shadow"\n        accessibilityLabel="Shade"', /does not exist/],
    ['columns={2}', 'columns={2}\n        span={2}', /Property 'span' does not exist/],
  ] as const)('rejects %s → %s with a source location', async (from, to, message) => {
    const { files, root, file } = await fixture('controls')
    const text = files.get(file)!
    expect(text).toContain(from)
    const error = await compileProject(new Map(files).set(file, text.replace(from, to)), {
      root,
    }).then(
      () => undefined,
      (failure: Error) => failure,
    )
    expect(error, to).toBeInstanceOf(Error)
    expect(error!.message).toMatch(/shared\/Controls\.lite\.tsx:\d+:\d+:/)
    expect(error!.message).toMatch(message)
  })

  it('puts a field id on its control', async () => {
    const { files, root } = await fixture('form')
    const { vue, swift } = await compileProject(files, { root })
    expect(vue.get('TaskForm.vue')).toContain('<MInput id="title" label="Title" ref="titleRef"')
    expect(swift.get('TaskForm.swift')).toMatch(/onEscape: \{[^}]*\},\n +id: "title"\n/)
    const controls = swift.get('MavisControls.swift')!
    expect(controls.match(/^ +\.accessibilityIdentifier\(id\)$/gm)).toHaveLength(3)
  })
})
