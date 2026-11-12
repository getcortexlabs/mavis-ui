import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { h, type VNode } from 'vue'
import { MSpan, inlineContent } from '@getcortexlabs/mavis-core/vue'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { runs } from '../packages/create-mavis/templates/macos/scripts/portable/components/text.mjs'

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
const tsx = (view: string) =>
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({ on: false, tone: 'primary' as 'primary' | 'muted' })\n  return (\n${view}\n  )\n}\n`
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

describe('MBox, MSpan and MSeparator in both formats', () => {
  it('reads the layers fixture into one model from TSX and from Vue', async () => {
    const fromTsx: Output = await compileProject(await readShared(join(portable, 'layers')), {
      root: 'Layers',
    })
    const fromVue: Output = await compileProject(await readShared(join(portable, 'layersVue')), {
      root: 'Layers',
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Layers.vue'])
  })

  it('writes runs as one SwiftUI Text and as MSpan in Vue', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await compile({
      'Home.lite.tsx': tsx(
        '    <MText as="h2">\n      Each cup <MSpan emphasis="em" tone="primary">tells a story</MSpan>,{\' \'}\n      <MSpan emphasis="strong">\n        brewed <MSpan weight="normal" tone="muted">slowly</MSpan>\n      </MSpan>\n      .\n    </MText>',
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      '(Text(verbatim: "Each cup ") + Text(verbatim: "tells a story").italic().foregroundStyle(MavisTokens.primary) + Text(verbatim: ", ") + Text(verbatim: "brewed ").fontWeight(.bold) + Text(verbatim: "slowly").fontWeight(.regular).foregroundStyle(MavisTokens.muted) + Text(verbatim: "."))',
    )
    const written =
      '<MText as="h2">Each cup <MSpan emphasis="em" tone="primary">tells a story</MSpan>, <MSpan emphasis="strong">brewed <MSpan weight="normal" tone="muted">slowly</MSpan></MSpan>.</MText>'
    expect(web.get('Home.vue')).toContain(written)
    expect(native.get('Home.vue')).toContain(written)
  })

  it('keeps a text without runs as one Text, and writes values and spaces Vue would change', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': tsx(
        "    <MColumn>\n      <MText>Plain</MText>\n      <MText>\n        Two{'  '}<MSpan tone={state.tone}>{state.on ? 'on' : 'off'}</MSpan>\n      </MText>\n    </MColumn>",
      ),
    })
    expect(swift.get('Home.swift')).toContain('Text(verbatim: "Plain")\n')
    expect(swift.get('Home.swift')).toContain(
      '(Text(verbatim: "Two  ") + Text(verbatim: (self.on ? "on" : "off")).foregroundStyle(MavisTokens.tone(self.tone)))',
    )
    expect(web.get('Home.vue')).toContain(
      "<MText>{{ 'Two  ' }}<MSpan :tone=\"state.tone\">{{ (state.on ? 'on' : 'off') }}</MSpan></MText>",
    )
  })

  it('lays layers out in MavisLayers and draws separators with MavisSeparator', async () => {
    const { swift } = await compileProject(await readShared(join(portable, 'layers')), {
      root: 'Layers',
    })
    const view = swift.get('Layers.swift')!
    expect(view).toContain('MavisLayers {')
    expect(view).toMatch(
      /MavisSeparator\(vertical: false, spacing: 8, inset: 16, id: "separator-auto"\)\n\s+\.mavisItem\(shrink: 0, align: \.stretch\)/,
    )
    expect(view).toMatch(
      /MavisSeparator\(vertical: false, length: 120\.0, id: "separator-fixed"\)\n\s+\.mavisItem\(shrink: 0, align: \.center\)/,
    )
    expect(view).toContain('MavisSeparator(vertical: true, spacing: 16, id: "separator-vertical")')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisLayers: Layout {')
    expect(controls).toContain('struct MavisSeparator: View {')
    expect(controls).toContain('.fill(MavisTokens.border)')
    expect(controls).toContain('var align: MavisAlign? = nil')
  })
})

describe('runs', () => {
  // The core's inlineContent decides runs on the Web and NativeScript: the compiler agrees.
  it('styles each run as the core does', () => {
    const tree = [
      'Each cup ',
      h(MSpan, { emphasis: 'em', tone: 'primary' }, { default: () => ['tells a story'] }),
      ', ',
      h(
        MSpan,
        { emphasis: 'strong' },
        {
          default: () => [
            'brewed ',
            h(MSpan, { weight: 'normal', tone: 'muted' }, { default: () => ['slowly'] }),
            h(MSpan, { emphasis: 'em', weight: '300' }, { default: () => [' and light'] }),
          ],
        },
      ),
    ] as unknown as VNode[]
    const span = (props: Record<string, unknown>, parts: unknown[]) => ({
      v: 'span',
      props: Object.fromEntries(Object.entries(props).map(([key, value]) => [key, { lit: value }])),
      parts,
    })
    const model = [
      'Each cup ',
      span({ emphasis: 'em', tone: 'primary' }, ['tells a story']),
      ', ',
      span({ emphasis: 'strong' }, [
        'brewed ',
        span({ weight: 'normal', tone: 'muted' }, ['slowly']),
        span({ emphasis: 'em', weight: '300' }, [' and light']),
      ]),
    ]
    const core = inlineContent(tree).map((run) => ({
      text: run.text,
      weight: run.weight,
      tone: run.tone,
      italic: run.italic ?? false,
    }))
    const compiled = (
      runs(model) as {
        style: { weight?: { lit: string }; tone?: { lit: string }; italic?: boolean }
        parts: string[]
      }[]
    ).map(({ style, parts }) => ({
      text: parts.join(''),
      weight: style.weight?.lit,
      tone: style.tone?.lit,
      italic: style.italic ?? false,
    }))
    expect(compiled).toEqual(core)
  })
})

describe('what the three cannot do on the Mac', () => {
  it.each([
    [
      'MSpan outside MText',
      { 'Home.lite.tsx': tsx('    <MColumn>\n      <MSpan>x</MSpan>\n    </MColumn>') },
      'shared/Home.lite.tsx:7:7: MSpan goes inside MText or another MSpan.',
    ],
    [
      'an MSpan with text and content',
      { 'Home.lite.tsx': tsx('    <MText>\n      <MSpan text="a">b</MSpan>\n    </MText>') },
      'shared/Home.lite.tsx:7:14: MSpan has text and content; use one.',
    ],
    [
      'an empty MSpan',
      { 'Home.lite.tsx': tsx('    <MText>\n      a<MSpan />\n    </MText>') },
      'shared/Home.lite.tsx:7:8: MSpan needs text.',
    ],
    [
      'emphasis from state',
      {
        'Home.lite.tsx': tsx(
          "    <MText>\n      <MSpan emphasis={state.on ? 'strong' : 'em'}>a</MSpan>\n    </MText>",
        ),
      },
      'shared/Home.lite.tsx:7:14: emphasis is written as a literal: strong or em.',
    ],
    [
      'a layer with its own width',
      {
        'Home.lite.tsx': tsx(
          '    <MBox>\n      <MColumn width={40}>\n        <MText>x</MText>\n      </MColumn>\n    </MBox>',
        ),
      },
      'shared/Home.lite.tsx:6:5: A layer of MBox with its own width or height sits at the top left on the Web and in the middle on NativeScript.',
    ],
    [
      'perspective on MBox',
      {
        'Home.lite.tsx': tsx('    <MBox perspective={600}>\n      <MText>x</MText>\n    </MBox>'),
      },
      'shared/Home.lite.tsx:6:11: perspective needs the Mavis motion API',
    ],
    [
      'motionRegion on MBox',
      {
        'Home.lite.tsx': tsx('    <MBox motionRegion={1}>\n      <MText>x</MText>\n    </MBox>'),
      },
      'shared/Home.lite.tsx:6:11: motionRegion needs the Mavis motion API',
    ],
    [
      'MSpan outside MText in Vue',
      {
        'Home.vue': vue(
          "import { MColumn, MSpan } from '#mavis'",
          '  <MColumn><m-span>x</m-span></MColumn>',
        ),
      },
      'shared/Home.vue:6:12: MSpan goes inside MText or another MSpan.',
    ],
    [
      'a listener on MSpan',
      {
        'Home.vue': vue(
          "import { MSpan, MText } from '#mavis'\nfunction go() {}",
          '  <MText><MSpan @click="go">x</MSpan></MText>',
        ),
      },
      'shared/Home.vue:7:17: MSpan takes text, weight, tone and emphasis.',
    ],
    [
      'a control inside MText',
      {
        'Home.vue': vue(
          "import { MButton, MText } from '#mavis'",
          '  <MText>a <MButton text="b" /></MText>',
        ),
      },
      'shared/Home.vue:6:12: MText contains text, {{ values }} and MSpan only.',
    ],
    [
      'a sized layer in Vue',
      {
        'Home.vue': vue(
          "import { MBox, MColumn, MText } from '#mavis'",
          '  <MBox><MColumn :height="40"><MText>x</MText></MColumn></MBox>',
        ),
      },
      'shared/Home.vue:6:3: A layer of MBox with its own width or height',
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

describe('the guide', () => {
  it.each([
    ['English', '../docs/guide/macos-experimental.md', '## Layers, runs and separators'],
    [
      'Portuguese',
      '../docs/pt-BR/guide/macos-experimental.md',
      '## Camadas, trechos e separadores',
    ],
  ])(
    'shows layers, runs and separators that compile for the Mac (%s)',
    async (_language, page, heading) => {
      const guide = await readFile(new URL(page, import.meta.url), 'utf8')
      const section = guide.slice(guide.indexOf(heading))
      const [example] = [...section.matchAll(/```tsx\n([\s\S]*?)```/g)].map((match) => match[1]!)
      const { swift } = await compile({ 'Home.lite.tsx': tsx(example!) })
      expect(swift.get('Home.swift')).toContain('MavisLayers {')
      expect(swift.get('Home.swift')).toContain('MavisSeparator(')
      expect(swift.get('Home.swift')).toMatch(/\(Text\(verbatim: .*\) \+ Text\(verbatim: /)
    },
  )
})
