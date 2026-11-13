import { afterAll, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  compileProject,
  isScreen,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'

const portable = new URL('./portable/', import.meta.url).pathname
const root = new URL('..', import.meta.url).pathname

type Output = {
  model: { components: { name: string; view: unknown }[]; records: unknown[] }
  vue: Map<string, string>
  native: Map<string, string>
  swift: Map<string, string>
  direct: string[]
}
const shared = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([name, text]) => [`shared/${name}`, text]))
const compile = (files: Record<string, string>, root = 'Home'): Promise<Output> =>
  compileProject(shared(files), { root })
const tsx = (view: string, imports = '') =>
  `${imports}export default function Home() {\n  return (\n${view}\n  )\n}\n`
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

describe('MScreen in both formats', () => {
  it('reads the screen fixture into one model from TSX and from Vue', async () => {
    const fromTsx: Output = await compileProject(await readShared(join(portable, 'screen')), {
      root: 'Screen',
    })
    const fromVue: Output = await compileProject(await readShared(join(portable, 'screenVue')), {
      root: 'Screen',
    })
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Screen.vue'])
    const [screen] = fromTsx.model.components
    expect(isScreen(screen!.view)).toBe(true)
    expect(screen!.view).toMatchObject({
      v: 'element',
      tag: 'MScreen',
      slots: [{ name: 'overlay', params: [], body: [{ v: 'element', tag: 'MColumn' }] }],
    })
  })

  it('makes the screen a window filling MavisScreen with the overlay over it', async () => {
    const { swift, vue: web } = await compileProject(await readShared(join(portable, 'screen')), {
      root: 'Screen',
    })
    const view = swift.get('Screen.swift')!
    expect(view).toMatch(/MavisScreen\(scroll: true\) \{\n {12}MavisColumn\(spacing: 16\) \{/)
    expect(view).toMatch(/\n {8}\} overlay: \{\n {12}MavisColumn\(spacing: 0\) \{/)
    expect(view).toMatch(/\n {8}\}\n {12}\.mavisIdentifier\("screen"\)\n {4}\}/)
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisScreen<Content: View, Overlay: View>: View {')
    expect(controls).toContain('ScrollView(.vertical) {')
    expect(controls).toContain('.allowsHitTesting(false)')
    expect(controls).toContain('.background(MavisTokens.background)')
    expect(controls).toContain('extension MavisScreen where Overlay == EmptyView {')
    expect(web.get('Screen.vue')).toMatch(
      /<MScreen id="screen" :scroll="true">\n {4}<template #overlay>\n {6}<MColumn id="screen-overlay" padding="md">/,
    )
  })

  it('writes a screen without scroll or overlay as MavisScreen alone', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': tsx(
        '    <MScreen dismissKeyboard={false}>\n      <MText>Hi</MText>\n    </MScreen>',
      ),
    })
    expect(swift.get('Home.swift')).toMatch(/ {8}MavisScreen \{\n {12}Text\(verbatim: "Hi"\)/)
    expect(swift.get('Home.swift')).not.toContain('overlay')
    // Nothing to put away on the Mac; the Web and NativeScript still get it.
    expect(swift.get('Home.swift')).not.toContain('dismissKeyboard')
    expect(web.get('Home.vue')).toContain('<MScreen :dismissKeyboard="false">')
  })

  it('tells a screen from a view without MScreen', async () => {
    const { model } = await compile({
      'Home.lite.tsx': tsx('    <MColumn>\n      <MText>Hi</MText>\n    </MColumn>'),
    })
    expect(isScreen(model.components[0]!.view)).toBe(false)
  })
})

describe('where MScreen can be', () => {
  const vueScreen = (template: string, script = "import { MScreen, MText } from '#mavis'") =>
    vue(script, template)
  const button = "import { MButton, MScreen, MText } from '#mavis'\nfunction go() {}"

  it.each([
    [
      'inside another MScreen',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen>\n      <MScreen><MText>x</MText></MScreen>\n    </MScreen>',
        ),
      },
      'shared/Home.lite.tsx:4:7: MScreen cannot sit inside another MScreen: a view is one screen.',
    ],
    [
      'in the overlay of another MScreen',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen slotOverlay={<MScreen><MText>x</MText></MScreen>}>\n      <MText>x</MText>\n    </MScreen>',
        ),
      },
      'shared/Home.lite.tsx:3:27: MScreen cannot sit inside another MScreen',
    ],
    [
      'inside a column',
      {
        'Home.lite.tsx': tsx(
          '    <MColumn>\n      <MScreen><MText>x</MText></MScreen>\n    </MColumn>',
        ),
      },
      "shared/Home.lite.tsx:4:7: MScreen is a whole screen: make it the root of the component's view, not content of MColumn.",
    ],
    [
      'inside Show',
      {
        'Home.lite.tsx': tsx(
          '    <Show when={true}>\n      <MScreen><MText>x</MText></MScreen>\n    </Show>',
          "import { Show } from '@builder.io/mitosis'\n",
        ),
      },
      "shared/Home.lite.tsx:5:7: MScreen is the root of the component's view; show or repeat what is inside it instead.",
    ],
    [
      'a screen component shown by another one',
      {
        'Home.lite.tsx': tsx(
          '    <MColumn>\n      <Inner />\n    </MColumn>',
          "import Inner from './Inner.lite'\n",
        ),
        'Inner.lite.tsx':
          'export default function Inner() {\n  return <MScreen><MText>in</MText></MScreen>\n}\n',
      },
      'shared/Home.lite.tsx:5:7: Inner is a screen (its view is an MScreen), so Home cannot show it: the app opens a screen.',
    ],
    [
      'a button in the overlay',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen slotOverlay={<MButton text="Go" onClick={() => {}} />}>\n      <MText>x</MText>\n    </MScreen>',
        ),
      },
      "shared/Home.lite.tsx:3:5: MScreen's overlay shows content only: the Web and the Mac let the pointer through it",
    ],
    [
      'a component with a button in the overlay',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen slotOverlay={<Bar />}>\n      <MText>x</MText>\n    </MScreen>',
          "import Bar from './Bar.lite'\n",
        ),
        'Bar.lite.tsx':
          'export default function Bar() {\n  return <MRow><MButton text="Go" onClick={() => {}} /></MRow>\n}\n',
      },
      "shared/Home.lite.tsx:4:5: MScreen's overlay shows content only",
    ],
    [
      'motionRegion',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen motionRegion={1}>\n      <MText>x</MText>\n    </MScreen>',
        ),
      },
      'shared/Home.lite.tsx:3:14: motionRegion needs the Mavis motion API, which the Mac does not have yet.',
    ],
    [
      'motionScroll',
      {
        'Home.lite.tsx': tsx(
          '    <MScreen motionScroll={1}>\n      <MText>x</MText>\n    </MScreen>',
        ),
      },
      'shared/Home.lite.tsx:3:14: motionScroll needs the Mavis motion API',
    ],
    [
      'a screen in a Vue column',
      {
        'Home.vue': vueScreen(
          '  <MColumn>\n    <m-screen><MText>x</MText></m-screen>\n  </MColumn>',
          "import { MColumn, MScreen, MText } from '#mavis'",
        ),
      },
      "shared/Home.vue:7:5: MScreen is a whole screen: make it the root of the component's view, not content of MColumn.",
    ],
    [
      'a screen under v-if',
      {
        'Home.vue': vueScreen(
          '  <MScreen v-if="shown"><MText>x</MText></MScreen>\n  <MText v-else>y</MText>',
          "import { ref } from 'vue'\nimport { MScreen, MText } from '#mavis'\nconst shown = ref(true)",
        ),
      },
      "shared/Home.vue:8:3: MScreen is the root of the component's view",
    ],
    [
      'a screen passed to a slot',
      {
        'Home.vue': vueScreen(
          '  <Box><MScreen><MText>x</MText></MScreen></Box>',
          "import { MScreen, MText } from '#mavis'\nimport Box from './Box.vue'",
        ),
        'Box.vue': vue("import { MColumn } from '#mavis'", '  <MColumn><slot /></MColumn>'),
      },
      "shared/Home.vue:7:8: MScreen cannot be content for a slot: a screen is the root of its own component's view.",
    ],
    [
      'a Vue screen component shown by another one',
      {
        'Home.vue': vue(
          "import { MColumn } from '#mavis'\nimport Inner from './Inner.vue'",
          '  <MColumn><Inner /></MColumn>',
        ),
        'Inner.vue': vueScreen('  <MScreen><MText>x</MText></MScreen>'),
      },
      'shared/Home.vue:7:12: Inner is a screen (its view is an MScreen), so Home cannot show it',
    ],
    [
      'a button in a Vue overlay',
      {
        'Home.vue': vueScreen(
          '  <MScreen>\n    <template #overlay><MButton text="Go" @click="go" /></template>\n    <MText>x</MText>\n  </MScreen>',
          button,
        ),
      },
      "shared/Home.vue:7:3: MScreen's overlay shows content only",
    ],
    [
      'v-slot on MScreen',
      { 'Home.vue': vueScreen('  <MScreen v-slot="{ a }"><MText>x</MText></MScreen>') },
      'shared/Home.vue:6:12: MScreen hands its content nothing: drop v-slot, and give the overlay as <template #overlay> inside MScreen.',
    ],
    [
      'a slot MScreen does not have',
      {
        'Home.vue': vueScreen(
          '  <MScreen>\n    <template #header><MText>x</MText></template>\n  </MScreen>',
        ),
      },
      'shared/Home.vue:7:5: MScreen has no slot header; its slots are overlay.',
    ],
    [
      'properties on the overlay',
      {
        'Home.vue': vueScreen(
          '  <MScreen>\n    <template #overlay="{ top }"><MText>x</MText></template>\n  </MScreen>',
        ),
      },
      'shared/Home.vue:7:25: The overlay slot of MScreen hands its content nothing; drop ="{ top }".',
    ],
    [
      'the content as #default',
      {
        'Home.vue': vueScreen(
          '  <MScreen>\n    <template #default><MText>x</MText></template>\n  </MScreen>',
        ),
      },
      'shared/Home.vue:7:5: Put the content of MScreen directly inside it, without <template #default>.',
    ],
    [
      'motionRegion in a Vue file',
      { 'Home.vue': vueScreen('  <MScreen :motionRegion="1"><MText>x</MText></MScreen>') },
      'shared/Home.vue:6:12: motionRegion needs the Mavis motion API',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const failure = await compile(files as Record<string, string>).then(
      () => undefined,
      (error: Error) => error,
    )
    expect(failure, 'generation must fail').toBeInstanceOf(Error)
    expect(failure!.message).toContain(message)
  })

  it('takes an overlay of a component that shows content only', async () => {
    const { swift } = await compile({
      'Home.lite.tsx': tsx(
        '    <MScreen slotOverlay={<Bar />}>\n      <MText>x</MText>\n    </MScreen>',
        "import Bar from './Bar.lite'\n",
      ),
      'Bar.lite.tsx':
        'export default function Bar() {\n  return <MRow><MText>Title</MText></MRow>\n}\n',
    })
    expect(swift.get('Home.swift')).toMatch(/\} overlay: \{\n {12}Bar\(\)/)
  })
})

describe('the guide', () => {
  it.each([
    ['English', '../docs/guide/macos-experimental.md', '## Screens'],
    ['Portuguese', '../docs/pt-BR/guide/macos-experimental.md', '## Telas'],
  ])('shows a screen that compiles for the Mac (%s)', async (_language, page, heading) => {
    const guide = await readFile(new URL(page, import.meta.url), 'utf8')
    const section = guide.slice(guide.indexOf(heading))
    const [example] = [...section.matchAll(/```tsx\n([\s\S]*?)```/g)].map((match) => match[1]!)
    const { swift } = await compile({ 'Home.lite.tsx': tsx(example!) })
    expect(swift.get('Home.swift')).toContain('MavisScreen(scroll: true) {')
  })
})

describe('the starter opens the entry', () => {
  const made: string[] = []
  afterAll(() => Promise.all(made.map((folder) => rm(folder, { recursive: true, force: true }))))

  // A project with the starter's scripts, inside the checkout so they find its packages.
  async function generate(sources: Record<string, string>) {
    await mkdir(join(root, 'artifacts'), { recursive: true })
    const project = await mkdtemp(join(root, 'artifacts/screen-entry-'))
    made.push(project)
    await cp(
      join(root, 'packages/create-mavis/templates/macos/scripts'),
      join(project, 'scripts'),
      {
        recursive: true,
      },
    )
    await mkdir(join(project, 'shared'))
    for (const [name, text] of Object.entries(sources))
      await writeFile(join(project, 'shared', name), text)
    await writeFile(
      join(project, 'mavis.config.json'),
      JSON.stringify({
        theme: 'mavis',
        targets: ['web', 'native', 'macos'],
        portability: { entry: 'Home' },
      }),
    )
    execFileSync(process.execPath, ['scripts/generate.mjs'], { cwd: project, stdio: 'pipe' })
    const read = (path: string) => readFile(join(project, path), 'utf8')
    return {
      web: await read('apps/web/src/generated/entry.ts'),
      native: await read('apps/mobile/src/generated/entry.ts'),
      mac: await read('apps/macos/Sources/MavisDesktop/Generated/MavisEntry.swift'),
    }
  }

  it('as it is when it is a screen', async () => {
    const entry = await generate({
      'Home.vue': vue(
        "import { MScreen, MText } from '#mavis'",
        '  <MScreen><MText>Hi</MText></MScreen>',
      ),
    })
    expect(entry.web).toContain(
      "export { default } from '#shared-ui/Home.vue'\nexport const screen = true\n",
    )
    expect(entry.native).toContain('export const screen = true')
    expect(entry.mac).toContain(
      'struct MavisEntry: View {\n    var body: some View {\n        Home()\n',
    )
  })

  it('on the page around it when it is not', async () => {
    const entry = await generate({
      'Home.lite.tsx': tsx('    <MColumn>\n      <MText>Hi</MText>\n    </MColumn>'),
    })
    expect(entry.web).toContain(
      "export { default } from './Home.vue'\nexport const screen = false\n",
    )
    expect(entry.mac).toContain('        MavisPage { Home() }\n')
  })
})
