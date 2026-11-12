import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { listItemProps } from '../packages/core/src/vue/props'
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
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({\n    count: 0,\n    name: 'a',\n${members}  })\n  return (\n${view}\n  )\n}\n`
const vue = (script: string, template: string) =>
  `<script setup lang="ts">\nimport { ref } from 'vue'\nconst count = ref(0)\n${script}\n</script>\n\n<template>\n${template}\n</template>\n`
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

describe('the list components in both formats', () => {
  it.each([['rows', 'Team']])(
    'reads the %s fixture into one model from TSX and from Vue',
    async (name, root) => {
      const fromTsx = await fixture(name, root)
      const fromVue = await fixture(`${name}Vue`, root)
      expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
      expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
      expect(fromVue.direct).toEqual([`shared/${root}.vue`])
    },
  )

  // What a source writes differently from the contract: an event in place of a flag.
  it('takes only properties of the published contracts', () => {
    const contracts = {
      MListItem: [listItemProps, ['onClick']],
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

describe('MListItem', () => {
  it('draws a row, and one button when it has an action', async () => {
    const { swift, vue: web, native } = await fixture('rows', 'Team')
    const view = swift.get('Team.swift')!
    expect(view).toMatch(
      /MavisListItem\(\n +title: "Marina Costa",\n +description: "Design, São Paulo",\n +leading: \{/,
    )
    expect(view).toContain('.mavisIdentifier("plain")')
    expect(view).toContain('.mavisItem(width: .points(220.0))')
    expect(view).toMatch(
      /Button\(action: \{\n +self\.opened = "Rui"\n +\}\) \{\n +MavisListItem\(\n +title: "Rui Tavares",\n +description: "Engineering",\n +arrow: true,/,
    )
    expect(view).toContain('.buttonStyle(MavisRowButtonStyle())')
    expect(view).toContain('.disabled(self.locked)')
    expect(view).toContain(
      '.accessibilityLabel(Text(verbatim: mavisListItemLabel("Ines Prado", "Support", "Open Ines Prado, away")))',
    )
    expect(view).toContain('.accessibilityIdentifier("mavis-card")')
    for (const output of [web, native]) {
      const file = output.get('Team.vue')!
      expect(file).toContain(
        '<MListItem title="Rui Tavares" description="Engineering" interactive @click="() => state.opened = \'Rui\'">',
      )
      expect(file).toContain('<template #leading>')
      expect(file).toContain('<template #trailing>')
      expect(file).toContain('<MListItem id="bare" title="Only a title" :grow="1" />')
    }
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisListItem<Leading: View, Trailing: View>: View {')
    expect(controls).toContain('MavisIcon("chevron-right", size: 16)')
    expect(controls).toContain('struct MavisRowButtonStyle: ButtonStyle {')
    // listItemLabel in the Mavis core.
    expect(controls).toContain(
      'return [mavisTrim(title), mavisTrim(description)].filter { !$0.isEmpty }.joined(separator: ". ")',
    )
  })

  it('keeps the id of a row that is a button, and hides it when asked', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MListItem id="open" title="Open" accessibilityHidden onClick={() => (state.count += 1)} />',
      ),
    })
    const view = swift.get('Home.swift')!
    expect(view).toContain('.accessibilityIdentifier("open")')
    expect(view).toContain('.accessibilityHidden(true)')
    expect(view).toContain('mavisListItemLabel("Open", "", "")')
  })
})

describe('what the list components cannot do on the Mac', () => {
  it.each([
    [
      'an empty title',
      { 'Home.lite.tsx': tsx('    <MListItem title=" " />') },
      'shared/Home.lite.tsx:9:16: MListItem needs a title that is not empty.',
    ],
    [
      'a row without a title',
      { 'Home.lite.tsx': tsx('    <MListItem description="x" />') },
      'shared/Home.lite.tsx:9:6: ',
    ],
    [
      'children in a row',
      {
        'Home.lite.tsx': tsx('    <MListItem title="a">\n      <MText>x</MText>\n    </MListItem>'),
      },
      "shared/Home.lite.tsx:9:6: Type '{ children: Element; title: string; }' is not assignable",
    ],
    [
      'a button in a row that is a button',
      {
        'Home.lite.tsx': tsx(
          '    <MListItem\n      title="a"\n      onClick={() => (state.count += 1)}\n      slotTrailing={<MButton text="b" onClick={() => (state.count += 1)} />}\n    />',
        ),
      },
      'shared/Home.lite.tsx:9:5: An MListItem with an action is one button, so its trailing slot shows content only',
    ],
    [
      'an unknown slot',
      { 'Home.lite.tsx': tsx('    <MListItem title="a" slotFooter={<MText>x</MText>} />') },
      "Property 'slotFooter' does not exist on type",
    ],
    [
      'interactive without a listener in Vue',
      {
        'Home.vue': vue(
          "import { MListItem } from '#mavis'",
          '  <MListItem title="a" interactive />',
        ),
      },
      'shared/Home.vue:8:24: interactive needs @click.',
    ],
    [
      'a listener without interactive in Vue',
      {
        'Home.vue': vue(
          "import { MListItem } from '#mavis'",
          '  <MListItem title="a" @click="count += 1" />',
        ),
      },
      'shared/Home.vue:8:3: MListItem needs interactive to answer click.',
    ],
    [
      'content between the tags in Vue',
      {
        'Home.vue': vue(
          "import { MListItem, MText } from '#mavis'",
          '  <MListItem title="a"><MText>x</MText></MListItem>',
        ),
      },
      'shared/Home.vue:8:3: MListItem takes no children; give its content as <template #leading> or <template #trailing>.',
    ],
    [
      'a field in a row that is a button, in Vue',
      {
        'Home.vue': vue(
          "import { MInput, MListItem } from '#mavis'\nconst text = ref('')",
          '  <MListItem title="a" interactive @click="count += 1">\n    <template #leading><MInput v-model="text" label="b" /></template>\n  </MListItem>',
        ),
      },
      'An MListItem with an action is one button, so its leading slot shows content only',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const failure = await compile(files as Record<string, string>).then(
      () => undefined,
      (error: Error) => error,
    )
    expect(failure, 'generation must fail').toBeInstanceOf(Error)
    expect(failure!.message).toContain(message)
  })
})
