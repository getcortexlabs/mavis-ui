import { describe, expect, it } from 'vitest'
import {
  compileProject,
  checkShared,
  readShared,
  // @ts-expect-error The portable compiler ships JavaScript in the template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
import {
  resolveProjectThemes,
  themeColor,
  // @ts-expect-error The portable compiler ships JavaScript in the template.
} from '../packages/create-mavis/templates/macos/scripts/portable/themes.mjs'
import { mavis } from '../packages/core/src/theme/themes'
const module = `import { defineTheme, midnight } from '@getcortexlabs/mavis-core'
const space = { md: 21, lg: 27 }
export const light = defineTheme({name:'studio-light', space, colors:{primary:'#13579b88'}, radius:{md:7}, control:{md:{height:58,padding:23,fontSize:19}}, components:{card:{padding:11,radius:13},button:{paddingY:15,radius:9}}, motion:{pressScale:0.92}})
export const dark = defineTheme({name:'studio-dark',appearance:'dark',space:{md:29},colors:{primary:'rgba(1, 2, 3, 0.5)'}}, midnight)`
const sfc = `<script setup lang="ts">\nimport {light,dark} from './theme'\n</script><template><MThemeProvider :theme="light" :darkTheme="dark" appearance="system"><MColumn gap="md"><MText>Studio</MText><MCard><MText>Card</MText></MCard><MButton text="Hello" @click="()=>{}"/></MColumn></MThemeProvider></template>`
const tsx = `import { light, dark } from './theme'\nexport default function Home(){return <MThemeProvider theme={light} darkTheme={dark} appearance="system"><MColumn gap="md"><MText>Studio</MText><MCard><MText>Card</MText></MCard><MButton text="Hello" onClick={()=>{}}/></MColumn></MThemeProvider>}`
const config = { module: 'shared/theme.ts', export: 'light', dark: 'dark' }
const input = (source = sfc) =>
  new Map([
    ['shared/theme.ts', module],
    ['shared/Home' + (source === tsx ? '.lite.tsx' : '.vue'), source],
  ])
const plain = (result: any) =>
  JSON.parse(
    JSON.stringify(result.model, (key, value) =>
      key === 'path' ? undefined : value instanceof Map ? [...value.keys()] : value,
    ),
  )
describe('project themes for the Mac', () => {
  it('reads defineTheme data without executing the module, preserving the same core merge', async () => {
    const theme = await resolveProjectThemes(input(), config)
    expect(theme.space.md).toBe(21)
    expect(theme.space.xs).toBe(mavis.space.xs)
    expect(theme.control.md).toEqual({ height: 58, padding: 23, fontSize: 19 })
    expect(theme.__mavisProjectThemes.appearance).toBe('system')
    expect(theme.__mavisProjectThemes.modules.get('shared/theme.ts')).toContain('__mavisThemeKey')
  })
  it('accepts a project light/dark pair and equivalent provider imports in TSX and Vue', async () => {
    const a = await compileProject(input(tsx), { root: 'Home', theme: config }),
      b = await compileProject(input(), { root: 'Home', theme: config })
    expect(plain(a)).toEqual(plain(b))
    expect(a.swift.get('Home.swift').split('\n').slice(1)).toEqual(
      b.swift.get('Home.swift').split('\n').slice(1),
    )
    expect(a.vue.get('Home.vue')).toMatch(
      /import \{ dark as mavisTheme_project_\w+, light as mavisTheme_project_\w+ \} from '#shared-ui\/theme'/,
    )
    const tokens = a.swift.get('MavisTokens.swift'),
      controls = a.swift.get('MavisControls.swift')
    expect(tokens).toContain('0x8813579B')
    expect(tokens).toContain('0x80010203')
    expect(tokens).toContain('mode: .system')
    expect(tokens).toContain('MavisCardMetrics(padding: 11, radius: 13')
    expect(controls).toContain('self.paddingX ?? metrics.card.padding')
    expect(controls).toContain('self.radius ?? metrics.card.radius')
    expect(controls).toContain('case .md: return 58')
    expect(tokens).toContain('MavisMotionMetrics(pressScale: 0.92')
    expect(controls).toContain('transition: metrics.motion.press(pressed)')
    expect((await checkShared(input(), mavis)).every((file: any) => file.ready)).toBe(true)
  })
  it('preserves matching stateful scenes from TSX and original Vue while scoping every token family', async () => {
    const a = await compileProject(await readShared('test/portable/customThemes'), {
      root: 'Studio',
    })
    const b = await compileProject(await readShared('test/portable/customThemesVue'), {
      root: 'Studio',
    })
    expect(plain(a)).toEqual(plain(b))
    for (const name of ['Studio.swift', 'LocalCount.swift'])
      expect(a.swift.get(name).split('\n').slice(1)).toEqual(b.swift.get(name).split('\n').slice(1))
    expect(b.direct).toEqual(['shared/LocalCount.vue', 'shared/Studio.vue'])
    const tokens = a.swift.get('MavisTokens.swift')
    const controls = a.swift.get('MavisControls.swift')
    expect(tokens).toContain('MavisShadowSpec(x: 0, y: 3, blur: 10, spread: 2')
    expect(tokens).toContain('MavisControlSize(height: 64, fontSize: 21, padding: 25)')
    expect(tokens).toContain('MavisTypography(size: 22')
    expect(tokens).toContain('lineHeight: 1.4')
    expect(controls).toContain('@MavisMetric("radius.md")')
    expect(controls).toContain('metrics.motion.press(pressed)')
    expect(controls).toContain('mavisTheme.palette.metrics.input.font')
    expect(controls).toContain('mavisTheme.palette.metrics.motion.data')
    expect(controls).toContain('mavisTheme.palette.metrics.gap("md")')
    expect(controls).not.toMatch(/\bundefined\b|\bNaN\b/)
  })
  it('keeps scoped toast hosts in their provider and defers drag reconfiguration until Jolt settles', async () => {
    const a = await compileProject(await readShared('test/portable/themeMotion'), {
      root: 'ThemeMotion',
    })
    const b = await compileProject(await readShared('test/portable/themeMotionVue'), {
      root: 'ThemeMotion',
    })
    expect(plain(a)).toEqual(plain(b))
    const view = a.swift.get('ThemeMotion.swift')
    expect(view.split('\n').slice(1)).toEqual(b.swift.get('ThemeMotion.swift').split('\n').slice(1))
    expect(view).toContain('MavisToastSite(queue: self.toast')
    expect(view).not.toContain('.mavisToast(self.toast')
    const controls = a.swift.get('MavisControls.swift')
    expect(controls).toContain(
      'guard transition != model.transition, !model.dragging, model.position == .zero else { return }',
    )
    expect(controls).toContain('model.dispose()')
    expect(controls).toContain('queue.configure(motion)')
    expect(controls).toContain(
      'MavisToastItem(id: hostID, queue: queue, closeLabel: closeLabel, theme: theme)',
    )
  })
  it('binds newer date, motion and tour runtimes to scoped metrics without unbound fonts', async () => {
    const result = await compileProject(input(), { root: 'Home', theme: config })
    const controls = result.swift.get('MavisControls.swift') as string
    for (const name of [
      'MavisScheduler<Item: Equatable>',
      'MavisMarquee',
      'MavisTourTarget<Content: View>',
    ]) {
      const runtime = controls
        .slice(controls.indexOf(`struct ${name}: View {`))
        .split('\nstruct ')[0]
      expect(runtime, name).toContain('@Environment(\\.mavisTheme) private var mavisTheme')
      expect(runtime, name).toContain('mavisTheme.palette.metrics.gap(')
      expect(runtime, name).toContain('mavisTheme.palette.metrics.type(')
    }
    expect(controls).toContain(
      'model.update(next, moving: moving, transition: mavisTheme.palette.metrics.motion.tween(next))',
    )
    expect(controls).toContain('let duration: Double = show ?')
    expect(controls).toContain('@MavisMetric("radius.lg") var radius: Double = .nan')
    expect(controls.match(/\.mavisTypography\(variant\)/g)).toHaveLength(2)
  })
  it('preserves fractional motion timings as valid Double literals in the toast queue', async () => {
    const files = input()
    files.set(
      'shared/theme.ts',
      module.replace('pressScale:0.92', 'pressScale:0.92,enterDuration:180.5,exitDuration:120.25'),
    )
    const result = await compileProject(files, { root: 'Home', theme: config })
    const controls = result.swift.get('MavisControls.swift')
    expect(controls).toContain('private var enter: Double = 180.5')
    expect(controls).toContain('private var leave: Double = 160.25')
    expect(controls).not.toMatch(/\b\d+\.\d+\.0\b/)
  })
  it('emits the same shared runtime for a builtin scene when project theme modules are registered', async () => {
    const files = await readShared('test/portable/customThemes')
    const themeFile = files.get('shared/studio-theme.ts')
    const studio = await compileProject(files, { root: 'Studio' })
    const simple = await compileProject(
      new Map([
        ['shared/studio-theme.ts', themeFile],
        ['shared/Simple.lite.tsx', 'export default function Simple(){return <MText>Plain</MText>}'],
      ]),
      { root: 'Simple' },
    )
    for (const name of ['MavisTokens.swift', 'MavisControls.swift'])
      expect(simple.swift.get(name)).toBe(studio.swift.get(name))
  })
  it('keeps real project paths and imports from the configured shared alias', async () => {
    const files = new Map([
      ['src/shared/theme.ts', module],
      ['src/shared/Home.lite.tsx', tsx],
    ])
    const result = await compileProject(files, {
      root: 'src/shared/Home.lite.tsx',
      sourceRoot: 'src/shared',
      shared: '@shared',
      theme: { ...config, module: 'src/shared/theme.ts' },
    })
    expect(result.vue.get('Home.vue')).toContain("from '@shared/theme'")
  })
  it.each([
    ["export const light = defineTheme({name:'bad',space:{oops:3}})", 'Unknown theme token'],
    [
      "export const light = defineTheme({name:'bad',colors:{primary:'red'}})",
      'colors.primary: use',
    ],
    [
      "export const light = defineTheme({name:'bad',control:{md:{height:-1}}})",
      'must be finite and nonnegative',
    ],
    [
      "export const light = defineTheme({name:'bad',motion:{pressDuration:60001}})",
      'at most 60000 milliseconds',
    ],
    ["export const light = defineTheme({name: (() => 'executed')()})", 'executable expressions'],
    [
      "globalThis.leaked=true; export const light=defineTheme({name:'bad'})",
      'exported const defineTheme',
    ],
  ])(
    'reports unsupported theme definitions at their source location',
    async (definition, message) => {
      const files = new Map([
        ['shared/theme.ts', "import {defineTheme} from '@getcortexlabs/mavis-core'\n" + definition],
      ])
      await expect(
        resolveProjectThemes(files, { module: 'shared/theme.ts', export: 'light' }),
      ).rejects.toThrow(message)
      await expect(
        resolveProjectThemes(files, { module: 'shared/theme.ts', export: 'light' }),
      ).rejects.toThrow(/shared\/theme.ts:\d+:\d+/)
    },
  )
  it('reports an invalid theme through the portability auditor with source diagnostics', async () => {
    const files = input()
    files.set(
      'shared/theme.ts',
      "import { defineTheme } from '@getcortexlabs/mavis-core'\nexport const light=defineTheme({name:'invalid',colors:{primary:'red'}})",
    )
    const report = await checkShared(files, mavis)
    const theme = report.find((file: any) => file.file === 'shared/theme.ts')
    expect(theme.ready).toBe(false)
    expect(theme.problems[0]).toMatchObject({ line: 2 })
    expect(theme.problems[0].message).toContain('colors.primary')
  })
  it('supports alpha shadows and positive or negative spread when selected as the root theme', async () => {
    const files = await readShared('test/portable/customThemes')
    const result = await compileProject(files, {
      root: 'Studio',
      theme: { module: 'shared/studio-theme.ts', export: 'studioLight', dark: 'studioDark' },
    })
    expect(result.swift.get('MavisTokens.swift')).toContain('spread: 2, argb: ')
    expect(result.swift.get('MavisControls.swift')).toContain(
      '.mavisElevation(elevation ?? metrics.card.elevation, radius: radius)',
    )
  })
  it('rejects a light export as the dark side of a theme pair', async () => {
    await expect(resolveProjectThemes(input(), { ...config, dark: 'light' })).rejects.toThrow(
      'must export a dark theme',
    )
  })
  it.each([
    ['transparent', 0],
    ['#123', 0xff112233],
    ['#1234', 0x44112233],
    ['#12345678', 0x78123456],
    ['rgba(0, 128, 255, 0.5)', 0x800080ff],
  ])('resolves alpha color %s', (color, value) => expect(themeColor(color)).toBe(value))
})
