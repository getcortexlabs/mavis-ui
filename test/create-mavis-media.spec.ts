import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { avatarSizes, iconSizes as coreSizes, icons } from '@getcortexlabs/mavis-core'
// @ts-expect-error The creator ships native ESM.
import { projectFiles } from '../packages/create-mavis/src/scaffold.mjs'
import {
  compileProject,
  readAssets,
  readShared,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/index.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { components } from '../packages/create-mavis/templates/macos/scripts/portable/components/index.mjs'
import {
  iconSizes,
  swiftGlyph,
  swiftIcon,
  // @ts-expect-error The compiler ships in the experimental template.
} from '../packages/create-mavis/templates/macos/scripts/portable/components/icon.mjs'
// @ts-expect-error The compiler ships in the experimental template.
import { iconGlyphs } from '../packages/create-mavis/templates/macos/scripts/portable/components/icon-glyphs.mjs'
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
const compile = (files: Record<string, string>, assets?: string[]): Promise<Output> =>
  compileProject(shared(files), { root: 'Home', assets })
const tsx = (view: string, store = "on: false, symbol: 'plus' as MavisIconName, points: 32") =>
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
const pair = async (name: string, root: string) => {
  const fromTsx: Output = await compileProject(await readShared(join(portable, name)), { root })
  const fromVue: Output = await compileProject(await readShared(join(portable, `${name}Vue`)), {
    root,
  })
  return { fromTsx, fromVue }
}
/** Generated Swift without its indentation, to compare a view with its modifiers. */
const flat = (text: string) => text.replace(/\n\s+/g, '\n')
const failure = (files: Record<string, string>, assets?: string[]) =>
  compile(files, assets).then(
    () => undefined,
    (error: Error) => error,
  )

describe('the contracts', () => {
  // What a source names itself instead of taking it from the contract: events as on… handlers
  // and the content of a control (value, onChange).
  const own: Record<string, string[]> = {
    MIcon: [],
    MImage: ['onLoad', 'onError'],
    MAvatar: [],
    MGradientBackground: [],
    MCarousel: ['value', 'onChange'],
    MImageCompare: ['value', 'onChange'],
    MImageViewer: ['value', 'onChange', 'onUpdateOpen', 'onClose', 'onError'],
    MImageCropper: ['value', 'onChange', 'onExport', 'onLoad', 'onError'],
  }

  it.each(Object.keys(own))('%s takes only properties of its contract', (name) => {
    const contract = Object.keys(componentProps[name as keyof typeof componentProps])
    const accepted = Object.keys(components[name].props).filter(
      (prop) => !own[name]!.includes(prop),
    )
    expect(accepted.filter((prop) => !contract.includes(prop))).toEqual([])
  })
})

describe('MIcon', () => {
  it('knows every icon and size of the core', () => {
    expect(iconGlyphs).toEqual(icons)
    expect(iconSizes).toEqual(coreSizes)
    expect(swiftGlyph('search')).toBe(`"\\u{${icons.search.toString(16)}}"`)
    expect(() => swiftGlyph('serch')).toThrow('Unknown icon serch.')
  })

  it('reads the icons fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('icons', 'Icons')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Icons.vue'])
  })

  it('draws a glyph of the Lucide font in the tone, at the size', async () => {
    const { swift } = await pair('icons', 'Icons').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('Icons.swift')!)
    expect(view).toContain(
      `MavisIcon(glyph: ${swiftGlyph('search')}, size: 20.0)\n.foregroundStyle(MavisTokens.muted)\n.mavisIdentifier("search")\n.mavisItem(shrink: 0)`,
    )
    expect(view).toContain(`MavisIcon(glyph: ${swiftGlyph('star')}, size: 16.0)`)
    expect(view).toContain(`MavisIcon(glyph: ${swiftGlyph('star')}, size: 24.0)`)
    expect(view).toContain(
      `MavisIcon(glyph: ${swiftGlyph('star')}, size: MavisIcons.size(self.scale))`,
    )
    expect(view).toContain(`MavisIcon(glyph: ${swiftGlyph('star')}, size: self.points)`)
    expect(view).toContain(
      'MavisIcon(self.symbol, size: 48.0)\n.foregroundStyle(MavisTokens.tone(self.tone))',
    )
    // An icon with a label is an image that carries its id; one without is decoration.
    expect(view).toContain(
      '.foregroundStyle(MavisTokens.success)\n.mavisIconLabel((self.saved ? "Saved" : "Not saved"))\n.accessibilityIdentifier("status")',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisIcon: View {')
    expect(controls).toContain('.font(.custom(MavisIconFont.name, fixedSize: max(0, size)))')
    expect(controls).toContain('CTFontManagerRegisterFontsForURL(font as CFURL, .process, nil)')
    expect(controls).toContain(` search ${icons.search.toString(16)} `)
    expect(controls).toContain('case "sm": return 16')
  })

  it('passes its properties to the Mavis component on the Web and NativeScript', async () => {
    const { vue: web, native } = await compile({
      'Home.lite.tsx': tsx(
        '    <MRow>\n      <MIcon id="mark" name="circle-check" size="lg" tone="success" label="Done" />\n      <MIcon name={state.symbol} size={state.points} systemName="plus.circle" />\n    </MRow>',
      ),
    })
    for (const output of [web, native]) {
      expect(output.get('Home.vue')).toContain(
        '<MIcon id="mark" name="circle-check" size="lg" tone="success" label="Done" />',
      )
      expect(output.get('Home.vue')).toContain(
        '<MIcon :name="state.symbol" :size="state.points" systemName="plus.circle" />',
      )
    }
  })

  it('is what other components draw an icon with', () => {
    const emit = { expr: () => 'self.symbol' }
    expect(swiftIcon('search')).toBe(`MavisIcon(glyph: ${swiftGlyph('search')}, size: 20.0)`)
    expect(swiftIcon({ lit: 'x' }, 16)).toBe(`MavisIcon(glyph: ${swiftGlyph('x')}, size: 16.0)`)
    expect(swiftIcon({ expr: {} }, 'size.icon', emit)).toBe(
      'MavisIcon(self.symbol, size: size.icon)',
    )
  })

  it('ships the font with the Mac app of the starter', async () => {
    const { files } = await projectFiles({ name: 'first-light', targets: 'web,macos' })
    const font = files.get('apps/macos/Sources/MavisDesktop/Fonts/lucide.ttf')
    expect(
      Buffer.compare(
        font,
        await readFile(new URL('../packages/nativescript/fonts/lucide.ttf', import.meta.url)),
      ),
    ).toBe(0)
    expect(files.get('apps/macos/Sources/MavisDesktop/Fonts/LICENSE')).toContain('ISC License')
    expect(files.get('apps/macos/Package.swift')).toContain(
      'resources: [.copy("Fonts"), .copy("Generated/Assets")]',
    )
    const web = await projectFiles({ name: 'first-light', targets: 'web,native' })
    expect([...web.files.keys()].filter((file: string) => file.endsWith('.ttf'))).toEqual([])
  })

  it.each([
    [
      'an icon the font does not have',
      { 'Home.lite.tsx': tsx('    <MIcon name="serch" />') },
      /shared\/Home\.lite\.tsx:6:12: Type '"serch"' is not assignable to type/,
    ],
    [
      'an icon without a name',
      { 'Home.lite.tsx': tsx('    <MIcon tone="muted" />') },
      /shared\/Home\.lite\.tsx:6:6: [^]*Property 'name' is missing/,
    ],
    [
      'a size that is not one of the names',
      { 'Home.lite.tsx': tsx('    <MIcon name="plus" size="xl" />') },
      /shared\/Home\.lite\.tsx:6:24: Type '"xl"' is not assignable to type 'MavisIconSize/,
    ],
    [
      'a size of zero',
      { 'Home.lite.tsx': tsx('    <MIcon name="plus" size={0} />') },
      'shared/Home.lite.tsx:6:24: size is a positive number of points.',
    ],
    [
      'a size that is a name or a number',
      {
        'Home.lite.tsx': tsx('    <MIcon name="plus" size={state.on ? \'sm\' : 32} />'),
      },
      'shared/Home.lite.tsx:6:24: size is sm, md, lg or a number of points. A value that can be either is not supported: use one kind.',
    ],
    [
      'motionSurface',
      { 'Home.lite.tsx': tsx('    <MIcon name="plus" motionSurface={1} />') },
      'shared/Home.lite.tsx:6:24: motionSurface needs the Mavis motion API, which the Mac does not have yet (#354).',
    ],
    [
      'content inside an icon',
      {
        'Home.lite.tsx': tsx('    <MIcon name="plus">\n      <MText>x</MText>\n    </MIcon>'),
      },
      /shared\/Home\.lite\.tsx:6:6: [^]*Property 'children' does not exist/,
    ],
    [
      'an unknown icon in a Vue file',
      {
        'Home.vue': vue("import { MIcon } from '#mavis'", '  <MIcon name="serch" />'),
      },
      /shared\/Home\.vue:6:10: Type '"serch"' is not assignable to type/,
    ],
    [
      'a size of the wrong name in a Vue file',
      {
        'Home.vue': vue("import { MIcon } from '#mavis'", '  <m-icon name="plus" size="xl" />'),
      },
      /shared\/Home\.vue:6:23: /,
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('icons on MButton and MInput', () => {
  it('reads the icon controls fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('iconControls', 'Toolbar')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('puts the glyphs in the label of a button and inside the box of a field', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await pair('iconControls', 'Toolbar').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('Toolbar.swift')!)
    expect(view).toContain(
      `MavisButtonLabel(text: "", icon: ${swiftGlyph('plus')}, variant: .primary, size: .lg)\n}\n.buttonStyle(MavisButtonStyle(size: .lg, iconOnly: true))\n.accessibilityLabel(Text(verbatim: "Add one"))`,
    )
    expect(view).toContain(
      'MavisButtonLabel(text: "", icon: MavisIcons.glyph(self.symbol), variant: .secondary, size: .sm)',
    )
    expect(view).toContain(
      `MavisButtonLabel(text: "Next", trailingIcon: ${swiftGlyph('arrow-right')}, variant: .secondary, size: .md)\n}\n.buttonStyle(MavisButtonStyle(variant: .secondary))`,
    )
    expect(view).toContain(
      `MavisButtonLabel(text: "Save", icon: ${swiftGlyph('save')}, trailingIcon: ${swiftGlyph('chevron-down')}, loading: self.saving, loadingText: "Saving", indicator: .ring, variant: .primary, size: .md)`,
    )
    // A button without icons keeps its plain text.
    expect(view).toContain(
      'Text(verbatim: "Next")\n}\n.buttonStyle(MavisButtonStyle(variant: .ghost))',
    )
    expect(view).toContain(`icon: ${swiftGlyph('search')},\ntrailingIcon: ${swiftGlyph('mic')}`)
    expect(view).toContain('trailingIcon: MavisIcons.glyph(self.symbol)')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      '.padding(.horizontal, iconOnly ? ((size.height - size.indicator) / 2).rounded() : size.padding)',
    )
    expect(controls).toContain('if !icon.isEmpty { MavisIcon(glyph: icon, size: size.indicator) }')
    expect(controls).toContain('.padding(.leading, icon.isEmpty ? 0 : 30)')
    expect(controls).toContain(
      '.foregroundStyle(error.isEmpty ? MavisTokens.muted : MavisTokens.danger)',
    )
    for (const output of [web, native]) {
      const screen = output.get('Toolbar.vue')!
      expect(screen).toContain(
        '<MButton id="only-lg" icon="plus" size="lg" accessibilityLabel="Add one" @click="() => state.added += 1" />',
      )
      expect(screen).toContain(':icon="state.symbol"')
      expect(screen).toContain('icon="search" trailingIcon="mic"')
    }
  })

  it.each([
    [
      'a button without text or an icon',
      { 'Home.lite.tsx': tsx('    <MButton variant="ghost" onClick={() => (state.on = true)} />') },
      'shared/Home.lite.tsx:6:5: MButton needs text.',
    ],
    [
      'a button with an icon and no name',
      { 'Home.lite.tsx': tsx('    <MButton icon="plus" onClick={() => (state.on = true)} />') },
      'shared/Home.lite.tsx:6:5: An MButton with an icon and no text needs accessibilityLabel: its name.',
    ],
    [
      'an icon the font does not have on a button',
      {
        'Home.lite.tsx': tsx(
          '    <MButton text="Add" trailingIcon="pluss" onClick={() => (state.on = true)} />',
        ),
      },
      /shared\/Home\.lite\.tsx:6:25: Type '"pluss"' is not assignable to type/,
    ],
    [
      'an icon the font does not have on a field',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MInput } from '#mavis'\nconst text = ref('')",
          '  <MInput v-model="text" label="Search" icon="serch" />',
        ),
      },
      /shared\/Home\.vue:8:41: Type '"serch"' is not assignable to type/,
    ],
    [
      'a button with an icon and no name in a Vue file',
      {
        'Home.vue': vue(
          "import { ref } from 'vue'\nimport { MButton } from '#mavis'\nconst on = ref(false)",
          '  <MButton icon="plus" @click="on = true" />',
        ),
      },
      'shared/Home.vue:8:3: An MButton with an icon and no text needs accessibilityLabel: its name.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MImage', () => {
  it('reads the images fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('images', 'Gallery')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('keeps a box of the ratio and loads the picture into it', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await pair('images', 'Gallery').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('Gallery.swift')!)
    expect(view).toMatch(
      /MavisImage\(src: self\.picture, alt: "A swatch of color", onLoad: \{ \(src: String\) in\nself\.loaded = src\n\}\)\n\.mavisIdentifier\("photo"\)\n\.mavisItem\(width: \.fraction\(1\.0\)\)/,
    )
    expect(view).toContain(
      'MavisImage(src: "~/assets/gallery-wide.png", alt: "Twice as wide as tall, all of it showing", aspectRatio: 1.0, fit: .contain, radius: 0, background: mavisColor("#F4E9FF"))',
    )
    expect(view).toContain('aspectRatio: 2.0, radius: 40.0)')
    // A height of its own replaces the ratio.
    expect(view).toMatch(
      /alt: "From a data URI", aspectRatio: nil, radius: 0\)\n\.mavisIdentifier\("fixed"\)\n\.mavisItem\(width: \.points\(120\.0\), height: \.points\(90\.0\)\)/,
    )
    expect(view).toContain(
      'loadingLabel: "Loading the picture", errorLabel: "No picture", onError: {',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisImage: View {')
    expect(controls).toContain('MavisBundle.url("Assets/" + name, name)')
    expect(controls).toContain('URLSession.shared.data(from: url)')
    expect(controls).toContain('.task(id: src) { await load() }')
    expect(controls).toContain('JoltPresence(picture != nil, enter: JoltPreset.fadeIn.recipe())')
    for (const output of [web, native]) {
      const screen = output.get('Gallery.vue')!
      expect(screen).toContain(
        '<MImage id="photo" :src="state.picture" alt="A swatch of color" @load="(src) => state.loaded = src" />',
      )
      expect(screen).toContain(
        'src="~/assets/gallery-wide.png" alt="Twice as wide as tall, all of it showing" :aspectRatio="1" fit="contain" radius="none" backgroundColor="#F4E9FF"',
      )
    }
  })

  it('takes the hints of the Web image and leaves them to the Web', async () => {
    const { swift, vue: web } = await compile({
      'Home.lite.tsx': tsx(
        '    <MImage src="https://example.com/a.webp" srcset="https://example.com/a.webp 320w" sizes="100vw" loading="lazy" decoding="async" fetchpriority="low" alt="A landscape" />',
      ),
    })
    expect(swift.get('Home.swift')).toContain(
      'MavisImage(src: "https://example.com/a.webp", alt: "A landscape")',
    )
    expect(web.get('Home.vue')).toContain(
      'srcset="https://example.com/a.webp 320w" sizes="100vw" loading="lazy" decoding="async" fetchpriority="low"',
    )
  })

  it('lists the pictures of shared/assets and misses the ones a source names', async () => {
    const assets: string[] = await readAssets(join(portable, 'images'))
    expect(assets).toEqual(['gallery-blue.png', 'gallery-green.png', 'gallery-wide.png'])
    expect(await readAssets(join(portable, 'icons'))).toEqual([])
    const files = {
      'Home.lite.tsx': tsx('    <MImage src="~/assets/gallery-red.png" alt="Red" />'),
    }
    const error = await failure(files, assets)
    expect(error!.message).toBe('shared/Home.lite.tsx:6:13: shared/assets has no gallery-red.png.')
    // Without the list nothing is known about the folder.
    expect(await failure(files)).toBeUndefined()
    expect(
      await failure(
        { 'Home.lite.tsx': tsx('    <MImage src="~/assets/gallery-blue.png" alt="Blue" />') },
        assets,
      ),
    ).toBeUndefined()
  })

  it.each([
    [
      'a picture from a path of one platform',
      { 'Home.lite.tsx': tsx('    <MImage src="/images/hero.png" alt="Hero" />') },
      'shared/Home.lite.tsx:6:13: src is an https:// URL, a data: URI or a file of shared/assets written ~/assets/name.png.',
    ],
    [
      'a picture without alt',
      { 'Home.lite.tsx': tsx('    <MImage src="~/assets/a.png" />') },
      /shared\/Home\.lite\.tsx:6:6: [^]*Property 'alt' is missing/,
    ],
    [
      'a ratio of zero',
      { 'Home.lite.tsx': tsx('    <MImage src="~/assets/a.png" alt="A" aspectRatio={0} />') },
      'shared/Home.lite.tsx:6:42: aspectRatio is a positive number, the width over the height.',
    ],
    [
      'a fit the contract does not have',
      { 'Home.lite.tsx': tsx('    <MImage src="~/assets/a.png" alt="A" fit="fill" />') },
      /shared\/Home\.lite\.tsx:6:42: Type '"fill"' is not assignable/,
    ],
    [
      'motionSurface on a picture',
      { 'Home.lite.tsx': tsx('    <MImage src="~/assets/a.png" alt="A" motionSurface={1} />') },
      'shared/Home.lite.tsx:6:42: motionSurface needs the Mavis motion API, which the Mac does not have yet (#354). Leave it out of a shared MImage for now.',
    ],
    [
      'padding on a picture',
      { 'Home.lite.tsx': tsx('    <MImage src="~/assets/a.png" alt="A" padding="md" />') },
      /shared\/Home\.lite\.tsx:6:42: [^]*Property 'padding' does not exist/,
    ],
    [
      'a picture from a relative path in a Vue file',
      {
        'Home.vue': vue(
          "import { MImage } from '#mavis'",
          '  <m-image src="./hero.png" alt="Hero" />',
        ),
      },
      'shared/Home.vue:6:12: src is an https:// URL, a data: URI or a file of shared/assets written ~/assets/name.png.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MAvatar', () => {
  it('reads the avatars fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('avatars', 'People')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('shows the picture, the initials or a figure at the sizes of the core', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await pair('avatars', 'People').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('People.swift')!)
    expect(view).toContain(
      'MavisAvatar(name: "Ada Lovelace", size: .sm)\n.mavisIdentifier("size-sm")\n.mavisItem(shrink: 0, align: .start)',
    )
    expect(view).toContain('MavisAvatar(size: .xl, label: "Someone new")')
    expect(view).toContain(
      'MavisAvatar(name: self.person, size: MavisAvatarSize(self.size), square: self.shape == "square")',
    )
    expect(view).toContain('MavisAvatar(src: self.picture, name: self.person, size: .lg)')
    expect(view).toContain('MavisAvatar(name: "Zé", size: .lg, square: true)')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('func mavisInitials(_ name: String) -> String {')
    for (const [name, points] of Object.entries(avatarSizes))
      expect(controls).toContain(`case .${name}: return ${points}`)
    expect(controls).toContain(
      `MavisIcon(glyph: ${swiftGlyph('user-round')}, size: mavisRound(side * 0.46))`,
    )
    expect(controls).toContain('.font(.system(size: mavisRound(side * 0.34), weight: .semibold))')
    expect(controls).toContain('.background(MavisTokens.primarySoft)')
    for (const output of [web, native])
      expect(output.get('People.vue')).toContain(
        '<MAvatar id="size-changes" :name="state.person" :size="state.size" :shape="state.shape" />',
      )
  })

  it.each([
    [
      'a size the contract does not have',
      { 'Home.lite.tsx': tsx('    <MAvatar name="Ada" size="xxl" />') },
      /shared\/Home\.lite\.tsx:6:25: Type '"xxl"' is not assignable/,
    ],
    [
      'a picture from a path of one platform',
      { 'Home.lite.tsx': tsx('    <MAvatar name="Ada" src="res://ada" />') },
      'shared/Home.lite.tsx:6:25: src is an https:// URL, a data: URI or a file of shared/assets written ~/assets/name.png.',
    ],
    [
      'content inside an avatar',
      {
        'Home.vue': vue(
          "import { MAvatar, MText } from '#mavis'",
          '  <MAvatar name="Ada"><MText>x</MText></MAvatar>',
        ),
      },
      /shared\/Home\.vue:6:3: /,
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MGradientBackground', () => {
  it('reads the gradient fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('gradient', 'Backdrop')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it("paints Jolt's gradient behind layers of content", async () => {
    const {
      swift,
      vue: web,
      native,
    } = await compile({
      'Home.lite.tsx': tsx(
        '    <MGradientBackground id="sky" colors={state.palette} angle={90} active={state.on} animated={false} duration={2000} height={160} radius={state.corner}>\n      <MColumn padding="md">\n        <MText>Over it</MText>\n      </MColumn>\n    </MGradientBackground>',
        "on: false, palette: ['#102030', '#405060'], corner: 'sm' as 'sm' | 'full'",
      ),
    })
    const view = flat(swift.get('Home.swift')!)
    expect(view).toContain(
      'MavisGradientBackground(colors: self.palette, angle: 90.0, animated: false, active: self.on, duration: 2000.0, height: 160.0, radius: MavisGradientModel.radius(self.corner)) {\nMavisColumn(',
    )
    expect(view).toContain('}\n.mavisIdentifier("sky")\n.mavisItem(width: .fraction(1.0))')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('Color.clear.joltGradient(paint, in: shape)')
    expect(controls).toContain('paint = try? JoltGradient(colors: sources, angle: .value(angle))')
    expect(controls).toContain('JoltColorValue(progress, from: $0, to: $1)')
    // A half turn in two quarters: Jolt's tweens last a minute at most.
    expect(controls).toContain(
      'JoltTransition.cubicBezier(milliseconds: quarter, points: [0, 0, 1, 1])',
    )
    expect(controls).toContain('JoltTransition.tween(milliseconds: 432.0, ease: .easeOut)')
    expect(controls).toContain('struct MavisMotionReader<Content: View>: View {')
    for (const output of [web, native])
      expect(output.get('Home.vue')).toContain(
        '<MGradientBackground id="sky" :colors="state.palette" :angle="90" :active="state.on" :animated="false" :duration="2000" :height="160" :radius="state.corner">',
      )
  })

  it.each([
    [
      'one color',
      { 'Home.lite.tsx': tsx("    <MGradientBackground colors={['#102030']} />") },
      'shared/Home.lite.tsx:6:26: colors takes 2 to 8 colors, each six hex digits such as "#9C5270".',
    ],
    [
      'a color that is not six hex digits',
      { 'Home.lite.tsx': tsx("    <MGradientBackground colors={['#102030', 'teal']} />") },
      'shared/Home.lite.tsx:6:46: teal is not six hex digits.',
    ],
    [
      'a height the contract refuses',
      { 'Home.lite.tsx': tsx('    <MGradientBackground height={20} />') },
      'shared/Home.lite.tsx:6:26: height is between 40 and 1600.',
    ],
    [
      'a duration the contract refuses',
      { 'Home.lite.tsx': tsx('    <MGradientBackground active duration={500} />') },
      'shared/Home.lite.tsx:6:33: duration is between 1000 and 120000.',
    ],
    [
      'a radius that is not a token',
      { 'Home.lite.tsx': tsx('    <MGradientBackground radius={12} />') },
      /shared\/Home\.lite\.tsx:6:26: Type 'number' is not assignable/,
    ],
    [
      'a layer with its own height',
      {
        'Home.vue': vue(
          "import { MColumn, MGradientBackground, MText } from '#mavis'",
          '  <MGradientBackground><MColumn :height="40"><MText>x</MText></MColumn></MGradientBackground>',
        ),
      },
      'shared/Home.vue:6:3: A layer of MBox with its own width or height',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MCarousel', () => {
  const story = { 'types.ts': 'export type Story = { id: string; order: number; title: string }\n' }
  const stories = (carousel: string, store = '') =>
    `import { useStore } from '@builder.io/mitosis'\nimport type { Story } from './types'\n\nexport default function Home() {\n  const state = useStore({ current: undefined as string | undefined, stories: [] as Story[]${store} })\n  return (\n${carousel}\n  )\n}\n`

  it('reads the carousel fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('carousel', 'Stories')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('shows the slide in view between its label and its controls', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await pair('carousel', 'Stories').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('Stories.swift')!)
    expect(view).toContain(
      'MavisCarousel(\nlabel: "Stories",\nitems: self.stories,\nkey: { $0.id },\nvalue: self.current,\nonChange: { (value: String) in\nself.current = value\n},\ndisabled: self.locked,\nloop: self.looping,\nempty: {\nText(verbatim: "Nothing to read yet")',
    )
    expect(view).toContain('slide: { (item: Story, index: Double) in\nMavisColumn(spacing: 8) {')
    expect(view).toContain(')\n.mavisIdentifier("stories")')
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain(
      'struct MavisCarousel<Item: Hashable, Slide: View, Empty: View>: View {',
    )
    expect(controls).toContain('.joltDrag(drag)')
    expect(controls).toContain(
      '.joltMotion(to: entered || from == 0 ? .identity : MavisCarouselDrag.enter(from), transition: MavisCarouselDrag.settle)',
    )
    expect(controls).toContain('JoltTransition.spring(milliseconds: 324, bounce: 0)')
    expect(controls).toContain('.onKeyPress(action: key)')
    expect(controls).toContain(
      `arrow(${swiftGlyph('arrow-left')}, previousLabel, off: !loop && index == 0, -1)`,
    )
    for (const output of [web, native]) {
      const screen = output.get('Stories.vue')!
      expect(screen).toContain(
        '<MCarousel id="stories" label="Stories" :items="state.stories" :modelValue="state.current" @update:modelValue="(value) => state.current = value" :loop="state.looping" :disabled="state.locked">',
      )
      expect(screen).toContain('<template #empty>')
      expect(screen).toContain('<template #default="{ item, index }">')
    }
  })

  it.each([
    [
      'a list that is not records',
      {
        'Home.lite.tsx': tsx(
          "    <MCarousel label=\"Stories\" items={['a', 'b']} value={state.symbol} onChange={(next) => (state.on = next === 'a')}>\n      {() => <MText>x</MText>}\n    </MCarousel>",
        ),
      },
      'shared/Home.lite.tsx:6:32: MCarousel takes a list of records, such as { id: string; title: string }[].',
    ],
    [
      'a key that is a number',
      {
        ...story,
        'Home.lite.tsx': stories(
          '    <MCarousel label="Stories" items={state.stories} itemKey="order" value={state.current} onChange={(next) => (state.current = next)}>\n      {({ item }) => <MText>{item.title}</MText>}\n    </MCarousel>',
        ),
      },
      'shared/Home.lite.tsx:7:54: Every slide needs the key order, a string: name another field with itemKey.',
    ],
    [
      'a carousel that nothing listens to',
      {
        ...story,
        'Home.lite.tsx': stories(
          '    <MCarousel label="Stories" items={state.stories} value={state.current}>\n      {({ item }) => <MText>{item.title}</MText>}\n    </MCarousel>',
        ),
      },
      /shared\/Home\.lite\.tsx:7:6: [^]*Property 'onChange' is missing/,
    ],
    [
      'a slide with a size of its own',
      {
        ...story,
        'Home.lite.tsx': stories(
          '    <MCarousel label="Stories" items={state.stories} value={state.current} onChange={(next) => (state.current = next)}>\n      {({ item }) => (\n        <MColumn height={120}>\n          <MText>{item.title}</MText>\n        </MColumn>\n      )}\n    </MCarousel>',
        ),
      },
      'shared/Home.lite.tsx:7:5: A slide of MCarousel fills it: content with its own width or height sits at the top left on the Web and in the middle on NativeScript.',
    ],
    [
      'slides that are not a function of the item',
      {
        ...story,
        'Home.lite.tsx': stories(
          '    <MCarousel label="Stories" items={state.stories} value={state.current} onChange={(next) => (state.current = next)}>\n      <MText>x</MText>\n    </MCarousel>',
        ),
      },
      /shared\/Home\.lite\.tsx:8:7: /,
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MImageCompare', () => {
  it('reads the compare fixture into one model from TSX and from Vue', async () => {
    const { fromTsx, fromVue } = await pair('compare', 'Retouch')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
  })

  it('reveals one picture over the other up to a divider', async () => {
    const {
      swift,
      vue: web,
      native,
    } = await pair('compare', 'Retouch').then(({ fromTsx }) => fromTsx)
    const view = flat(swift.get('Retouch.swift')!)
    expect(view).toContain(
      'MavisImageCompare(\nlabel: "Photo comparison",\nbefore: "~/assets/compare-before.png",\nafter: "~/assets/compare-after.png",\nvalue: self.position,\nonChange: { (value: Double) in\nself.position = value\n},\nbeforeLabel: "Original",\nafterLabel: "Edited",\nstep: 5.0,\naspectRatio: 2.0,\nvertical: (self.upright ? "vertical" : "horizontal") == "vertical"\n)\n.mavisItem(width: .fraction(1.0))',
    )
    const controls = swift.get('MavisControls.swift')!
    expect(controls).toContain('struct MavisImageCompare: View {')
    expect(controls).toContain('try? shown.animate(to: next, transition: Self.settle)')
    expect(controls).toContain('JoltTransition.spring(milliseconds: 340, bounce: 0.08)')
    expect(controls).toContain('.onKeyPress(action: key)')
    expect(controls).toContain(
      'let next = Swift.min(100, Swift.max(0, mavisRound(wanted / step) * step))',
    )
    for (const output of [web, native])
      expect(output.get('Retouch.vue')).toContain(
        '<MImageCompare label="Photo comparison" before="~/assets/compare-before.png" after="~/assets/compare-after.png" beforeLabel="Original" afterLabel="Edited" :modelValue="state.position" @update:modelValue="(value) => state.position = value" :step="5" :aspectRatio="2" :orientation="(state.upright ? \'vertical\' : \'horizontal\')" />',
      )
  })

  const compare = (rest: string) =>
    tsx(
      `    <MImageCompare label="Photos" before="~/assets/a.png" after="~/assets/b.png" ${rest} />`,
    )
  it.each([
    [
      'a comparison nothing listens to',
      { 'Home.lite.tsx': compare('value={state.points}') },
      /shared\/Home\.lite\.tsx:6:6: [^]*Property 'onChange' is missing/,
    ],
    [
      'a step of zero',
      {
        'Home.lite.tsx': compare(
          'value={state.points} onChange={(value) => (state.points = value)} step={0}',
        ),
      },
      'shared/Home.lite.tsx:6:148: step is a positive number.',
    ],
    [
      'an orientation the contract does not have',
      {
        'Home.lite.tsx': compare(
          'value={state.points} onChange={(value) => (state.points = value)} orientation="diagonal"',
        ),
      },
      /shared\/Home\.lite\.tsx:6:148: Type '"diagonal"' is not assignable/,
    ],
    [
      'a picture from a path of one platform',
      {
        'Home.lite.tsx': tsx(
          '    <MImageCompare label="Photos" before="/a.png" after="~/assets/b.png" value={state.points} onChange={(value) => (state.points = value)} />',
        ),
      },
      'shared/Home.lite.tsx:6:35: before is an https:// URL, a data: URI or a file of shared/assets written ~/assets/name.png.',
    ],
    [
      'a comparison inside a card that is a button',
      {
        'Home.lite.tsx': tsx(
          `    <MCard label="Open" onClick={() => (state.on = true)}>\n      <MImageCompare label="Photos" before="~/assets/a.png" after="~/assets/b.png" value={state.points} onChange={(value) => (state.points = value)} />\n    </MCard>`,
        ),
      },
      'shared/Home.lite.tsx:6:5: A card with onClick shows text only; put buttons and fields outside it.',
    ],
  ])('fails on %s', async (_name, files, message) => {
    const error = await failure(files as Record<string, string>)
    expect(error, 'generation must fail').toBeInstanceOf(Error)
    if (typeof message === 'string') expect(error!.message).toContain(message)
    else expect(error!.message).toMatch(message)
  })
})

describe('MImageCropper', () => {
  it('reads crop editing and export from the same TSX and Vue source', async () => {
    const { fromTsx, fromVue } = await pair('cropper', 'Cover')
    expect(portableModel(fromVue)).toEqual(portableModel(fromTsx))
    expect(swiftOf(fromVue)).toEqual(swiftOf(fromTsx))
    expect(fromVue.direct).toEqual(['shared/Cover.vue'])
  })

  it('preserves the image crop type beside v-model', async () => {
    const { swift } = await compile({
      'Home.vue': vue(
        "import { ref } from 'vue'\nimport type { ImageCrop } from '@getcortexlabs/mavis-core'\nconst crop = ref<ImageCrop | null>(null)\nconst rotation = ref(0)",
        '<MImageCropper label="Cover" src="https://example.com/cover.png" v-model="crop" @update:model-value="(value) => (rotation = value.rotation)" />',
      ),
    })
    expect(swift.get('Home.swift')).toContain('self.rotation = value.rotation')
  })

  it.each([0, -1, 11])('rejects aspect ratio %s', async (aspect) => {
    const result = await failure({
      'Home.lite.tsx': tsx(
        `<MImageCropper label="Cover" src="https://example.com/cover.png" value={state.crop} onChange={(value) => (state.crop = value)} aspectRatio={${aspect}} />`,
        'crop: undefined as ImageCrop | undefined',
      ),
    })
    expect(result?.message).toMatch(/aspectRatio/)
  })
})

describe('MImageViewer', () => {
  it('preserves controlled selection and opening in Vue and TSX', async () => {
    const { fromTsx, fromVue } = await pair('viewer', 'Photos')
    expect(fromVue.swift.get('Photos.swift')).toContain('MavisImageViewer(')
    expect(fromTsx.swift.get('Photos.swift')).toContain('MavisImageViewer(')
    expect(fromTsx.vue.get('Photos.vue')).toContain('@update:open=')
    expect(fromVue.direct).toEqual(['shared/Photos.vue'])
    const controls = fromVue.swift.get('MavisControls.swift')!
    expect(controls).toContain('JoltGestureModel(')
    expect(controls).toContain('.joltSharedLayout(image.key, in: photos')
    expect(controls).toContain('guard !_Concurrency.Task.isCancelled else { return }')
    expect(controls).toContain('.onDisappear { motion.dispose() }')
  })

  it.each([0, -1, 101])('diagnoses unsupported zoom bound %s', async (maxZoom) => {
    const result = await failure({
      'Home.lite.tsx': tsx(
        `<MImageViewer label="Photos" images={state.images} maxZoom={${maxZoom}} />`,
        'images: [] as ViewerImage[]',
      ),
    })
    expect(result?.message).toMatch(/maxZoom/)
  })
})
