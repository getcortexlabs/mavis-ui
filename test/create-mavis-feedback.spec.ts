import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
import { componentProps } from '../packages/core/src/vue/component-props'

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
const tsx = (view: string, store = "on: false, count: 3, tone: 'primary' as MavisBadgeTone") =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({ ${store} })\n  return (\n${view}\n  )\n}\n`
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
const failure = (files: Record<string, string>) =>
  compile(files).then(
    () => undefined,
    (error: Error) => error,
  )

// The same screen in both formats: one model, one SwiftUI, and the Vue file runs as written.
async function bothFormats(fixture: string, root: string) {
  const fromTsx: Output = await compileProject(await readShared(join(portable, fixture)), { root })
  const fromVue: Output = await compileProject(await readShared(join(portable, `${fixture}Vue`)), {
    root,
  })
  expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
  expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  expect(fromVue.direct).toEqual([`shared/${root}.vue`])
  return fromTsx
}

describe('feedback components and the published contracts', () => {
  // What the portable sources name themselves instead of taking it from a contract.
  const own: Record<string, string[]> = {
    MBadge: [],
  }

  it.each(Object.keys(own))('%s takes only properties of its contract', (name) => {
    const contract = Object.keys(componentProps[name as keyof typeof componentProps])
    const accepted = Object.keys(components[name].props).filter(
      (prop) => !own[name]!.includes(prop),
    )
    expect(accepted.filter((prop) => !contract.includes(prop))).toEqual([])
  })
})

describe('MBadge', () => {
  it('reads the badge fixture into one model from TSX and from Vue', async () => {
    const { swift, vue: web, native } = await bothFormats('badge', 'Badges')
    for (const output of [web, native]) {
      const view = output.get('Badges.vue')!
      expect(view).toContain('<MBadge id="neutral" text="Draft" />')
      expect(view).toContain('<MBadge id="unread" :text="state.unread" :tone="state.tone" />')
      expect(view).toContain('<MBadge id="small" :text="11" size="sm" tone="accent" />')
      expect(view).toContain(
        '<MBadge id="named" text="3" size="sm" accessibilityLabel="3 replies" />',
      )
    }
    const view = swift.get('Badges.swift')!
    expect(view).toContain('MavisBadge(text: "Draft")\n')
    expect(view).toContain(
      'MavisBadge(text: mavisString(self.unread), tone: MavisBadgeTone(self.tone))',
    )
    expect(view).toContain('MavisBadge(text: mavisString(11.0), size: .sm, tone: .accent)')
    expect(view).toMatch(
      /MavisBadge\(text: "3", size: \.sm\)\n\s+\.accessibilityLabel\(Text\(verbatim: "3 replies"\)\)\n\s+\.accessibilityIdentifier\("named"\)\n\s+\.mavisItem\(align: \.start\)/,
    )
  })

  it('draws the pill from theme colors, as wide as its text', async () => {
    const { swift } = await compile({ 'Home.lite.tsx': tsx('    <MBadge text="New" />') })
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisBadge: View {')
    expect(controls).toContain('struct MavisFitted: Layout {')
    expect(controls).toContain(
      'self == .primary ? MavisTokens.primarySoft : self == .accent ? MavisTokens.accentSoft : MavisTokens.elevated',
    )
    expect(controls).toContain('.background(tone.background, in: Capsule())')
    expect(controls).not.toMatch(/MavisBadge[^]*Color\(red:/)
  })

  it.each([
    [
      'a badge without text',
      { 'Home.lite.tsx': tsx('    <MBadge tone="primary" />') },
      "Property 'text' is missing in type '{ tone: \"primary\"; }'",
    ],
    [
      'a condition as text',
      { 'Home.lite.tsx': tsx('    <MBadge text={state.on} />') },
      "shared/Home.lite.tsx:6:13: Type 'boolean' is not assignable to type 'string | number'.",
    ],
    [
      'a tone the contract does not have',
      { 'Home.lite.tsx': tsx('    <MBadge text="New" tone="muted" />') },
      'shared/Home.lite.tsx:6:24: Type \'"muted"\' is not assignable',
    ],
    [
      'content inside a badge',
      { 'Home.lite.tsx': tsx('    <MBadge text="New">\n      <MText>x</MText>\n    </MBadge>') },
      "shared/Home.lite.tsx:6:6: Type '{ children: Element; text: string; }' is not assignable",
    ],
    [
      'a property of another component',
      { 'Home.lite.tsx': tsx('    <MBadge text="New" grow={1} />') },
      'shared/Home.lite.tsx:6:24:',
    ],
    [
      'a badge without text in Vue',
      { 'Home.vue': vue("import { MBadge } from '#mavis'", '  <MBadge tone="primary" />') },
      'shared/Home.vue:6:3: MBadge needs text.',
    ],
    [
      'content inside a badge in Vue',
      { 'Home.vue': vue("import { MBadge } from '#mavis'", '  <MBadge text="New">x</MBadge>') },
      'shared/Home.vue:6:3: MBadge takes no children; use its properties.',
    ],
    [
      'a listener on a badge',
      {
        'Home.vue': vue(
          "import { MBadge } from '#mavis'\nfunction go() {}",
          '  <MBadge text="New" @click="go" />',
        ),
      },
      'shared/Home.vue:7:22: MBadge does not take @click on the Mac.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    expect(error!.message).toContain(message)
  })
})
