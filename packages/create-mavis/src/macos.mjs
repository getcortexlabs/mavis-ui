import { versions as v, configOf, targetLabel } from './presets.mjs'
import { packageCommands } from './package-manager.mjs'
import { joltSwift } from '../templates/macos/scripts/portable/emit-swift.mjs'

const json = (value) => `${JSON.stringify(value, null, 2)}\n`

/**
 * Combinations with Mac: shared TSX sources compiled into Vue for the Web, Vue for
 * NativeScript and SwiftUI for macOS. Projects without Mac keep Vue templates.
 */
export async function macosFiles(preset, files, copyTemplate) {
  const { targets } = preset
  const web = targets.includes('web')
  const native = targets.includes('native')
  const mac = targets.includes('macos')
  const commands = packageCommands(preset.packageManager)
  const tasks = preset.example === 'tasks'
  // The screen every app opens. Tasks is a list beside its detail, so it gets a wider page.
  const entry = tasks ? 'Tasks' : 'Welcome'
  const hosts = [
    web && 'Vue on the Web',
    native && 'NativeScript on iOS and Android',
    mac && 'SwiftUI on the Mac',
  ].filter(Boolean)
  const replacements = {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    APPEARANCE: preset.theme === 'midnight' ? 'dark' : 'light',
    BACKGROUND: preset.theme === 'midnight' ? '#15121C' : '#FAF7FA',
    TARGETS: targetLabel(targets),
    HOSTS: hosts.join(' · '),
    JOLT_SWIFT: joltSwift.version,
    WEB_WIDTH: tasks ? '1120px' : '760px',
    MAC_WIDTH: tasks ? '1120' : '820',
    MAC_MIN_WIDTH: tasks ? '760' : '640',
    MAC_DEFAULT_WIDTH: tasks ? '1180' : '860',
    SHARED: '#shared-ui',
    SHARED_ROOT: '../../shared',
  }
  await copyTemplate(files, 'macos/root', '', replacements)
  await copyTemplate(
    files,
    tasks ? 'macos/examples/tasks/shared' : 'macos/shared',
    'shared',
    replacements,
  )
  await copyTemplate(files, 'macos/scripts', 'scripts', replacements)
  if (!mac) files.delete('scripts/macos.mjs')

  const common = { private: true, version: '0.0.0', engines: { node: '>=22.16' } }
  const generate = 'node scripts/generate.mjs'
  const builds = []
  const scripts = { generate }
  if (web) {
    await copyTemplate(files, 'macos/web', 'apps/web', replacements)
    scripts['dev:web'] = `${generate} && ${commands.run('dev', 'apps/web')}`
    scripts['build:web'] = `${generate} && ${commands.run('build', 'apps/web')}`
    builds.push('build:web')
    files.set(
      'apps/web/package.json',
      json({
        ...common,
        name: `${preset.name}-web`,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: {
          '@getcortexlabs/mavis-core': v.mavis,
          '@getcortexlabs/mavis-web': v.mavis,
          '@rafaelaugusto/jolt': v.jolt,
          vue: v.vue,
        },
        devDependencies: {
          typescript: v.typescript,
          vite: v.vite,
          '@vitejs/plugin-vue': v.vuePlugin,
        },
      }),
    )
  }
  if (native) {
    await copyTemplate(files, 'mobile', 'apps/mobile', replacements)
    await copyTemplate(files, 'macos/mobile', 'apps/mobile', replacements)
    // The generated screens are the app's shared code; the TSX sources stay out of vue-tsc.
    files.set(
      'apps/mobile/tsconfig.json',
      files
        .get('apps/mobile/tsconfig.json')
        .replace('"include": ["src", "../../shared"]', '"include": ["src"]'),
    )
    scripts.ios = `${generate} && ${commands.run('ios', 'apps/mobile')}`
    scripts.android = `${generate} && ${commands.run('android', 'apps/mobile')}`
    scripts['build:native'] =
      `${generate} && ${commands.run('bundle:android', 'apps/mobile')} && ${commands.run('bundle:ios', 'apps/mobile')}`
    scripts['install:apps'] = `${commands.install} && ${commands.installAt('apps/mobile')}`
    builds.push('build:native')
    files.set(
      'apps/mobile/package.json',
      json({
        ...common,
        name: `${preset.name}-mobile`,
        ...(preset.packageManager === 'yarn'
          ? {
              dependenciesMeta: {
                esbuild: { built: true },
                '@nativescript/core': { built: true },
                '@parcel/watcher': { built: true },
                'core-js-pure': { built: false },
              },
            }
          : {}),
        main: 'src/app.ts',
        scripts: {
          android: 'ns run android',
          ios: 'ns run ios',
          typecheck: 'vue-tsc --noEmit',
          'bundle:android': 'webpack --env android',
          'bundle:ios': 'webpack --env ios',
        },
        dependencies: {
          '@getcortexlabs/mavis-core': v.mavis,
          '@rafaelaugusto/jolt': v.jolt,
          '@getcortexlabs/mavis': v.mavis,
          '@nativescript/core': v.nativeCore,
          'nativescript-vue': v.nativeVue,
        },
        devDependencies: {
          '@nativescript/android': v.android,
          '@nativescript/ios': v.ios,
          '@nativescript/webpack': v.webpack,
          webpack: v.webpackCore,
          'webpack-cli': v.webpackCli,
          typescript: v.typescript,
          'vue-tsc': v.vueTsc,
        },
      }),
    )
  }
  if (mac) {
    await copyTemplate(files, 'macos/native', 'apps/macos', replacements)
    scripts.macos = 'node scripts/macos.mjs run'
    scripts['build:macos'] = 'node scripts/macos.mjs build'
    builds.push('build:macos')
  }
  scripts.build = builds.map((name) => commands.run(name)).join(' && ')

  files.set(
    'package.json',
    json({
      ...common,
      name: preset.name,
      type: 'module',
      ...(web && preset.packageManager !== 'pnpm' ? { workspaces: ['apps/web'] } : {}),
      ...(web && preset.packageManager === 'yarn'
        ? {
            resolutions: { vue: v.vue, '@vue/runtime-core': v.vue },
            dependenciesMeta: { esbuild: { built: true } },
          }
        : {}),
      scripts,
      // The compiler reads theme tokens from Mavis core, type-checks with TypeScript and parses
      // shared Vue files with Vue's own compiler.
      dependencies: { '@getcortexlabs/mavis-core': v.mavis },
      devDependencies: { typescript: v.typescript, '@vue/compiler-sfc': v.vue },
    }),
  )
  files.set(
    'mavis.config.json',
    json({
      ...configOf(preset),
      portability: { roots: ['shared'], mode: 'shared-tsx-experimental', entry },
    }),
  )
  files.set(
    '.gitignore',
    [
      'node_modules/',
      '.npm/',
      '.pnpm-store/',
      '.yarn/',
      'dist/',
      'platforms/',
      'hooks/',
      'apps/macos/.build/',
      'apps/web/src/generated/',
      'apps/web/public/~/',
      'apps/mobile/src/generated/',
      'apps/macos/Sources/MavisDesktop/Generated/',
      'mavis-env.d.ts',
      '.DS_Store',
      '*.log',
      '',
    ].join('\n'),
  )
  if (preset.packageManager === 'pnpm') {
    files.set(
      'pnpm-workspace.yaml',
      `packages:${web ? '\n  - apps/web' : ' []'}\nnodeLinker: hoisted\nallowBuilds:\n  esbuild: true\n`,
    )
    if (native)
      files.set(
        'apps/mobile/pnpm-workspace.yaml',
        'packages: []\nnodeLinker: hoisted\nsideEffectsCache: false\nallowBuilds:\n  "esbuild": true\n  "@nativescript/core": true\n  "@parcel/watcher": true\n  "core-js-pure": false\n',
      )
  }
  if (preset.packageManager === 'yarn') {
    files.set('.yarnrc.yml', 'nodeLinker: node-modules\n')
    // An empty lockfile marks a separate Yarn project, including before its first install.
    files.set('yarn.lock', '')
    if (native) files.set('apps/mobile/yarn.lock', '')
  }
  files.set('README.md', readme(preset, commands, { web, native, mac, entry }))
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}

function readme(preset, commands, { web, native, mac, entry }) {
  const start = [
    native ? commands.setup(true) : commands.install,
    ...(web ? [commands.run('dev:web')] : []),
    ...(native ? [commands.run('ios'), commands.run('android')] : []),
    ...(mac ? [commands.run('macos')] : []),
  ]
  const folders = [
    web && '- apps/web: Vue + Vite with Mavis Web. Generated screens in apps/web/src/generated/.',
    native &&
      '- apps/mobile: NativeScript-Vue for iOS and Android with Mavis. Generated screens in apps/mobile/src/generated/.',
    mac &&
      '- apps/macos: a SwiftUI app (Swift package) with JoltSwiftUI. Generated views in apps/macos/Sources/MavisDesktop/Generated/.',
  ].filter(Boolean)
  const hosts = [
    native &&
      `Native needs the NativeScript CLI and the platform SDK: Xcode on macOS for iOS, a JDK and the Android SDK for Android. Run \`ns doctor\` in apps/mobile. It has its own dependency tree; reinstall both from the root with \`${commands.run('install:apps')}\`.`,
    mac &&
      'The Mac app needs macOS 14+ and Xcode with command-line tools. It uses SwiftUI, not a WebView or a JavaScript runtime. The first build downloads JoltSwiftUI (rafaelaugustos/jolt-swift). The app is unsigned, for local development.',
    'Code generation and the Web also work on Linux and Windows.',
  ].filter(Boolean)
  return `# ${preset.name}

Mavis ${targetLabel(preset.targets)} project, experimental. **One shared source, compiled for each target.**
This is a compiler experiment for a subset of Mavis, not a complete renderer for every component.

## Start

\`\`\`sh
${start.join('\n')}
\`\`\`

${hosts.join(' ')}

## Edit once

Screens live in **shared/**: each \`Name.lite.tsx\` exports one component, and lowercase \`.ts\` files hold shared record types. \`${entry}\` is the screen every app opens (\`portability.entry\` in mavis.config.json). Run \`${commands.run('generate')}\` after editing; the start and build commands generate first. The Mavis compiler type-checks the sources with TypeScript, then writes each target's files:

${folders.join('\n')}

Generated folders are replaced on every run and kept out of Git; don't edit them. The sources use Mitosis's component format (\`useStore\`, \`useRef\`, \`Show\`, \`For\`), but Mitosis itself is not installed. Each app keeps its own state.

A screen can also be a Vue file, \`shared/Name.vue\`, next to the TSX ones: the Web and NativeScript apps run it as written, importing Mavis from \`#mavis\`, and the Mac gets SwiftUI generated from it. It uses \`<script setup lang="ts">\` with \`ref\`, \`computed\`, functions, \`defineProps\`, \`withDefaults\`, \`defineEmits\` and \`useMavisPlatform()\`, and a template of the same primitives with \`v-if\`, \`v-for\`, \`v-model\` and \`MReveal\`. A Vue file shows other Vue files, and a TSX file other TSX files. The guide lists the subset: https://mavis-ui.getcortexlabs.com/guide/macos-experimental#shared-vue-files

What the sources can use:
- MScreen at the root of a screen's view (scroll, an \`overlay\` slot of content that stays over it: \`slotOverlay\` in TSX, \`<template #overlay>\` in Vue): the screen fills each window on the theme background. A screen without one gets a scrolling page around it. The app opens a screen; no component shows one inside it.
- MColumn/MRow (gap, justify, align, wrap, label, onKeyDown for arrow keys), MStack (the same, with direction and responsive breakpoints written in place, such as \`[{ at: 640, direction: 'row' }]\`: they change the stack at its content width), MGrid (gap, columns, minColumnWidth: as many equal columns as fit), MCard (gap, elevation, tone; with onClick and a label the whole card is one button that shows text only, and disabled turns it off), MText (variant, tone, weight, align, as for headings, wrap, text with values and MSpan runs with weight, tone and emphasis), MBox (layers in one area, each filling it, the last on top), MSeparator (orientation, length, spacing, inset), MThemeProvider (theme and darkTheme: mavis or midnight from @getcortexlabs/mavis-core, appearance system, light or dark: the subtree draws in that theme), MPlatform (only, and slotFallback for the other targets: the Mac keeps only its branch), MMasonry (items with an id, minColumnWidth, columns, gap, animated, emptyLabel, label, and slotItem with { item, index, width }), MResizablePanels (value and onChange, onResize, min, max, step, snap, orientation, direction, height, collapsible, disabled, the panel and button labels, slotPrimary and slotSecondary: the divider follows the pointer and the keyboard), MVirtualList (items, itemKey, rowHeight, height, overscan, initialIndex, emptyLabel, label, the row as a function of { item, index, itemKey }, slotEmpty, and ref with useRef<MavisListRef> for scrollToIndex: only the rows in view exist), MCollapsibleHeader (title, subtitle, image, height, expandedHeight, collapsedHeight, sectionHeight, parallax, back with onBack, backLabel, topLabel, slotArtwork, slotLeading, slotActions, slotSection: the header collapses as its content scrolls), MRefreshControl (label, refresh, height, disabled, the labels, onStateChange: the button and Command-R run refresh, a function that finishes at once or fails with throw new Error), MButton (text, variant primary/secondary/ghost, size, disabled, loading with loadingText and loadingIndicator, onClick, shortcut such as \`mod+k\`, \`mod+1\` or \`F5\`: Command on the Mac, Control or Command on the Web, nothing on touch).
- The box properties of the Mavis contracts on MColumn, MRow, MStack, MGrid, MBox and MCard: padding, paddingX, paddingY (a spacing token or a number), radius, backgroundColor (a hex color), width and height (a number, a share such as "50%" or "auto"), grow and shrink. MText and MButton take grow and shrink. Every primitive takes id and accessibilityHidden, and all but the fields accessibilityLabel. A column stretches its children and a row centers them unless align says otherwise; on the Mac both are laid out by the same flexbox rules as on the Web.
- Feedback and status: MBadge (text or a number, size sm/md, tone neutral, primary, accent, success, warning or danger: a pill as wide as its text), MProgress (label, value kept from 0 to max, indeterminate with indeterminateLabel, size sm/md/lg, tone, width, grow and shrink: the bar grows through Jolt, and an indeterminate bar rests in the middle of its track), MSkeleton (width, height, radius, grow and shrink, animated, effect: a block of the border color nobody reads; effect="shimmer" sweeps Jolt's highlight over it, and the default pulse stays still on the Mac for now), MAlert (title, description, tone info, success, warning or error, dismissible with closeLabel and onClose, width, grow and shrink, and an \`actions\` slot: \`slotActions\` in TSX, \`<template #actions>\` in Vue), MEmptyState (title, description, icon, tone primary or accent, compact, titleAs, width, grow and shrink, and the \`illustration\` and \`actions\` slots: the illustration is decoration, so controls go in the actions).
- Form fields with value plus a change handler: MInput (label, placeholder, helperText, error, type text/email/password, multiline, rows, maxLength, disabled, readonly, onSubmit on Return, onEscape), MCheckbox (label, checked, indeterminate, helperText, disabled) and MSelect (label, value that may be undefined, options of SelectOption, placeholder, helperText, error, disabled). \`const titleRef = useRef<MavisFieldRef>(null)\` with \`ref={titleRef}\` on an MInput lets actions call \`titleRef.focus()\` and \`titleRef.blur()\`.
- MIcon (name, size sm, md, lg or a number of points, tone, label): an icon of the Lucide font every app carries, by the same names on each target; the Mac app has the font in its resources. With a label the icon is an image of that name; without one it is decoration. MButton and MInput take icon and trailingIcon by the same names; a button with an icon and no text needs accessibilityLabel.
- MListItem (title, description, slotLeading and slotTrailing, width, grow, shrink): a row on the theme's surface; with onClick the whole row is one button named by its title and description or by accessibilityLabel, with an arrow where slotTrailing would be, and disabled turns it off.
- MAccordion (label, items with value and title and optionally description, icon and disabled, value and onChange for the open values, multiple, disabled, expandedLabel, collapsedLabel, and the body of an open section as a function of { item }): a header asks for a new list of open values; the body exists while its section is open.
- MImage (src, alt, aspectRatio, fit cover or contain, radius, width and height, backgroundColor, loadingLabel, errorLabel, onLoad and onError with the source): a box that keeps its place while the picture loads and when it fails. src is an https:// URL, a data: URI or a picture of shared/assets written ~/assets/name.png; generate copies that folder into each app.
- MIcon (name, size sm, md, lg or a number of points, tone, label): an icon of the Lucide font every app carries, by the same names on each target; the Mac app has the font in its resources. With a label the icon is an image of that name; without one it is decoration.
- MSheet (open with onUpdateOpen, or v-model:open in a Vue file, title or accessibilityLabel, dismissible, fullscreen, closeLabel, padding, gap, align, onClose with its reason): content in a layer over the screen. The Mac draws it in the window as the Web does, a scrim and a panel at the bottom that Jolt moves; the close button, Escape, the scrim and a drag of the handle ask to close it, and it closes when open turns false.
- Components from other shared files, with typed properties, callback properties and slots: \`props.children\` and \`props.slotHeader\` (JSX.Element), with \`??\` for fallback content, or a function such as \`slotRow?: (props: { task: Task }) => JSX.Element\` for a scoped slot.
- useStore with strings, numbers, booleans, string unions, records and arrays (initial values can come from properties), getters with a return type, and actions with parameters.
- Comparisons, && || !, ternaries, arithmetic, template literals, ?. and ??; string trim, toLowerCase, toUpperCase, includes, startsWith, endsWith and length; array filter, map, find, findIndex, some, every, includes, slice, join, toSorted, length and list[index] (which may be undefined); Math.min, max, floor, ceil, abs and round.
- In actions and event handlers: =, +=, -=, ++ and --, if/else, return, push, unshift and splice, and calls to other actions and callbacks.
- Show with else, and For with a key field. \`<Show when={…} animate>\` reveals and hides its content, and \`<For each={…} animate>\` animates rows that enter, leave or move.

Anything else fails generation with file:line:column before any output changes. Numbers behave like JavaScript numbers in every app (Double in Swift).

## Motion

Buttons and cards press, animated Show content enters and leaves, and animated lists move through Jolt on every target: Mavis Web and Mavis on NativeScript run Jolt, and the Mac uses JoltSwiftUI. Reduce Motion is respected everywhere. Not available yet: async work, effects, navigation, persistence and the other Mavis components.

## Build

\`${commands.run('build')}\` builds every target${mac ? `; the Mac app goes to dist/${preset.name}.app` : ''}.${native ? ' build:native bundles the NativeScript JavaScript for Android and iOS; use the NativeScript CLI for installable apps.' : ''} Commit the generated ${native ? 'lockfiles' : commands.lockfile} after installation.
`
}
