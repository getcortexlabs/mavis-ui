import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stackLayout } from '@getcortexlabs/mavis-core'
import {
  compileProject,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

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
  `import { useStore } from '@builder.io/mitosis'\n\nexport default function Home() {\n  const state = useStore({ wide: false, at: 640 })\n  return (\n${view}\n  )\n}\n`
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

describe('MStack in both formats', () => {
  it('reads the stack fixture into one model from TSX and from Vue', async () => {
    const fromTsx: Output = await compileProject(await readShared(join(portable, 'stack')), {
      root: 'Stack',
    })
    const fromVue: Output = await compileProject(await readShared(join(portable, 'stackVue')), {
      root: 'Stack',
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Stack.vue'])
  })

  it('writes the breakpoints in ascending order for SwiftUI and for Vue', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await compile({
      'Home.lite.tsx': tsx(
        "    <MStack gap=\"sm\" padding=\"lg\" responsive={[{ at: 1000, gap: 'xl', align: 'center' }, { at: 640, direction: 'row', gap: 12, wrap: true }]}>\n      <MText>A</MText>\n    </MStack>",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisStack(spacing: 8, breakpoints: [MavisBreakpoint(at: 640.0, axis: .horizontal, spacing: 12.0, wrap: true), MavisBreakpoint(at: 1000.0, spacing: 32, align: .center)]) {',
    )
    const written =
      ":responsive=\"[{ at: 640, direction: 'row', gap: 12, wrap: true }, { at: 1000, gap: 'xl', align: 'center' }]\""
    expect(web.get('Home.vue')).toContain(written)
    expect(native.get('Home.vue')).toContain(written)
  })

  it('takes a direction, also from state, and stretches its children in a row', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        "    <MStack direction={state.wide ? 'row' : 'column'}>\n      <MText>A</MText>\n    </MStack>",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisStack(axis: ((self.wide ? "row" : "column") == "row" ? .horizontal : .vertical), spacing: 0) {',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisStack<Content: View>: View {')
    expect(controls).toMatch(/struct MavisStack[\s\S]*?var align: MavisAlign = \.stretch/)
    expect(controls).toContain('func resolved(at width: CGFloat?) -> MavisFlex {')
  })

  it('reads a choice between written breakpoints by the platform', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import { MStack, MText, useMavisPlatform } from '#mavis'\nconst { isMacOS } = useMavisPlatform()",
        "  <MStack :responsive=\"isMacOS ? [{ at: 700, direction: 'row' }] : { at: 500, direction: 'row' }\"><MText>x</MText></MStack>",
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'breakpoints: [MavisBreakpoint(at: 700.0, axis: .horizontal)]',
    )
  })

  it('keeps an independent reveal column and keyed rows inside a responsive stack', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import { ref } from 'vue'\nimport { MReveal, MStack, MText } from '#mavis'\nconst shown = ref(true)\nconst items = ['a', 'b']",
        '  <MStack :responsive="{ at: 500, direction: \'row\' }">\n    <MReveal :show="shown"><MText>a</MText></MReveal>\n    <MText v-for="item in items" :key="item">{{ item }}</MText>\n  </MStack>',
      ),
    })
    expect(swift.get('Home.swift')).toContain('MavisReveal(show: self.shown) {')
    expect(swift.get('Home.swift')).toContain('MavisColumn(spacing: 0)')
    expect(swift.get('Home.swift')).toContain('ForEach')
    expect(swift.get('Home.swift')).toContain('MavisBreakpoint(at: 500.0, axis: .horizontal)')
  })
})

describe('what responsive cannot be on the Mac', () => {
  const written = 'On the Mac, responsive is read when the screen is compiled'
  it.each([
    [
      'breakpoints from state',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={state.wide ? [{ at: 1, direction: 'row' }] : []}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      `shared/Home.lite.tsx:6:25: ${written}: write the breakpoints here`,
    ],
    [
      'a width from state',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={{ at: state.at, direction: 'row' }}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      `shared/Home.lite.tsx:6:31: ${written}`,
    ],
    [
      'two breakpoints at one width',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={[{ at: 640, direction: 'row' }, { at: 640, gap: 'lg' }]}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      'shared/Home.lite.tsx:6:57: Two breakpoints are at 640; give each its own width.',
    ],
    [
      'a width of zero',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={{ at: 0, direction: 'row' }}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      'shared/Home.lite.tsx:6:31: A breakpoint is at a positive content width.',
    ],
    [
      'a negative gap',
      {
        'Home.lite.tsx': tsx(
          '    <MStack responsive={{ at: 3, gap: -1 }}>\n      <MText>x</MText>\n    </MStack>',
        ),
      },
      'shared/Home.lite.tsx:6:39: gap cannot be negative.',
    ],
    [
      'an unknown direction',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={{ at: 3, direction: 'diagonal' }}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      'shared/Home.lite.tsx:6:13: Type \'{ at: number; direction: "diagonal"; }\' is not assignable',
    ],
    [
      'a key a breakpoint does not have',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={{ at: 3, color: 'red' } as unknown as MavisBreakpoint}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      'shared/Home.lite.tsx:6:34: A breakpoint sets at, direction, gap, align, justify and wrap.',
    ],
    [
      'a direction the type check does not see',
      {
        'Home.lite.tsx': tsx(
          "    <MStack responsive={{ at: 3, direction: 'diagonal' } as unknown as MavisBreakpoint}>\n      <MText>x</MText>\n    </MStack>",
        ),
      },
      'shared/Home.lite.tsx:6:45: direction is row or column.',
    ],
    [
      'breakpoints in a Vue script constant',
      {
        'Home.vue': vue(
          "import { MStack, MText } from '#mavis'\nconst points = [{ at: 640, direction: 'row' as const }]",
          '  <MStack :responsive="points"><MText>x</MText></MStack>',
        ),
      },
      `shared/Home.vue:7:24: ${written}: write the breakpoints in the attribute`,
    ],
    [
      'a Vue breakpoint from a ref',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MStack, MText } from '#mavis'\nconst at = ref(640)",
          '  <MStack :responsive="{ at, direction: \'row\' }"><MText>x</MText></MStack>',
        ),
      },
      `shared/Home.vue:8:26: ${written}`,
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

describe('the rule', () => {
  // What the compiler keeps of a source's breakpoints resolves as the source's own list does.
  it('keeps every breakpoint stackLayout reads, in ascending order', async () => {
    const written = [
      { at: 900, direction: 'column', justify: 'between' },
      { at: 300, direction: 'row', wrap: true },
      { at: 600, gap: 12, align: 'end' },
    ] as const
    const { model } = await compile({
      'Home.lite.tsx': tsx(
        `    <MStack direction="row" gap={4} responsive={${JSON.stringify(written)}}>\n      <MText>x</MText>\n    </MStack>`,
      ),
    })
    const kept = (model.components[0]!.view as { props: { responsive: { lit: object[] } } }).props
      .responsive.lit
    const base = { direction: 'row', gap: 4 } as const
    for (const width of [undefined, 1, 300, 599, 600, 899, 900, 2000])
      expect(stackLayout(base, kept as never, width)).toEqual(
        stackLayout(base, written as never, width),
      )
    expect(kept.map((point) => (point as { at: number }).at)).toEqual([300, 600, 900])
  })
})

describe('the guide', () => {
  it.each([
    ['English', '../docs/guide/macos-experimental.md', '## Responsive stacks'],
    ['Portuguese', '../docs/pt-BR/guide/macos-experimental.md', '## Stacks responsivos'],
  ])('shows a stack that compiles for the Mac (%s)', async (_language, page, heading) => {
    const guide = await readFile(new URL(page, import.meta.url), 'utf8')
    const section = guide.slice(guide.indexOf(heading))
    const [example] = [...section.matchAll(/```tsx\n([\s\S]*?)```/g)].map((match) => match[1]!)
    const { swift } = await compile({ 'Home.lite.tsx': tsx(example!) })
    expect(swift.get('Home.swift')).toContain(
      'breakpoints: [MavisBreakpoint(at: 640.0, axis: .horizontal, spacing: 24), MavisBreakpoint(at: 1000.0, spacing: 32, align: .center)]',
    )
  })
})
