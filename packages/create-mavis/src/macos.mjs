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
    SHARED: '#shared-ui',
    SHARED_ROOT: '../../shared',
  }
  await copyTemplate(files, 'macos/root', '', replacements)
  await copyTemplate(files, 'macos/shared', 'shared', replacements)
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
      // The compiler reads theme tokens from Mavis core and type-checks with TypeScript.
      dependencies: { '@getcortexlabs/mavis-core': v.mavis },
      devDependencies: { typescript: v.typescript },
    }),
  )
  files.set(
    'mavis.config.json',
    json({
      ...configOf(preset),
      portability: { roots: ['shared'], mode: 'shared-tsx-experimental' },
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
  files.set('README.md', readme(preset, commands, { web, native, mac }))
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}

function readme(preset, commands, { web, native, mac }) {
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

Screens live in **shared/**: each \`Name.lite.tsx\` exports one component, and lowercase \`.ts\` files hold shared record types. \`Welcome\` is the screen every app opens. Run \`${commands.run('generate')}\` after editing; the start and build commands generate first. The Mavis compiler type-checks the sources with TypeScript, then writes each target's files:

${folders.join('\n')}

Generated folders are replaced on every run and kept out of Git; don't edit them. The sources use Mitosis's component format (\`useStore\`, \`useRef\`, \`Show\`, \`For\`), but Mitosis itself is not installed. Each app keeps its own state.

What the sources can use:
- MColumn/MRow (gap, padding, label, onKeyDown for arrow keys), MText (variant, tone, text with values), MButton (text, variant, disabled, onClick).
- Form fields with value plus a change handler: MInput (label, placeholder, helperText, error, type text/email/password, multiline, rows, maxLength, disabled, readonly, onSubmit on Return, onEscape), MCheckbox (label, checked, indeterminate, helperText, disabled) and MSelect (label, value that may be undefined, options of SelectOption, placeholder, helperText, error, disabled). \`const titleRef = useRef<MavisFieldRef>(null)\` with \`ref={titleRef}\` on an MInput lets actions call \`titleRef.focus()\` and \`titleRef.blur()\`.
- Components from other shared files, with typed properties and callback properties.
- useStore with strings, numbers, booleans, string unions, records and arrays (initial values can come from properties), getters with a return type, and actions with parameters.
- Comparisons, && || !, ternaries, arithmetic, template literals, ?. and ??; string trim, toLowerCase, toUpperCase, includes, startsWith, endsWith and length; array filter, map, find, findIndex, some, every, includes, slice, join, toSorted, length and list[index] (which may be undefined); Math.min, max, floor, ceil, abs and round.
- In actions and event handlers: =, +=, -=, ++ and --, if/else, return, push, unshift and splice, and calls to other actions and callbacks.
- Show with else, and For with a key field. \`<Show when={…} animate>\` reveals and hides its content, and \`<For each={…} animate>\` animates rows that enter, leave or move.

Anything else fails generation with file:line:column before any output changes. Numbers behave like JavaScript numbers in every app (Double in Swift).

## Motion

Buttons press, animated Show content enters and leaves, and animated lists move through Jolt on every target: Mavis Web and Mavis on NativeScript run Jolt, and the Mac uses JoltSwiftUI. Reduce Motion is respected everywhere. Not available yet: async work, effects, navigation, persistence and the other Mavis components.

## Build

\`${commands.run('build')}\` builds every target${mac ? `; the Mac app goes to dist/${preset.name}.app` : ''}.${native ? ' build:native bundles the NativeScript JavaScript for Android and iOS; use the NativeScript CLI for installable apps.' : ''} Commit the generated ${native ? 'lockfiles' : commands.lockfile} after installation.
`
}
