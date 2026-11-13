import { versions as v, configOf, targetLabel } from './presets.mjs'
import { packageCommands } from './package-manager.mjs'
import { joltSwift } from '@getcortexlabs/mavis-compiler'

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
  const directory = preset.example === 'directory'
  const nuxt = preset.web === 'nuxt'
  // The screen every app opens. Tasks is a list beside its detail, so it gets a wider page.
  const entry = directory ? 'Directory' : tasks ? 'Tasks' : 'Welcome'
  const hosts = [
    web && (nuxt ? `Nuxt (${preset.rendering}) on the Web` : 'Vue on the Web'),
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
    directory ? 'directory/shared' : tasks ? 'macos/examples/tasks/shared' : 'macos/shared',
    'shared',
    replacements,
  )
  await copyTemplate(files, 'macos/scripts', 'scripts', replacements)
  for (const path of files.keys()) if (path.startsWith('scripts/portable/')) files.delete(path)
  if (!mac) {
    files.delete('scripts/macos.mjs')
    files.delete('scripts/macos-manifest.mjs')
  }

  const common = { private: true, version: '0.0.0', engines: { node: '>=22.16' } }
  const generate = 'node scripts/generate.mjs'
  const builds = []
  const scripts = { generate }
  if (web) {
    await copyTemplate(files, nuxt ? 'nuxt' : 'macos/web', 'apps/web', replacements)
    if (nuxt && !directory) {
      await copyTemplate(files, 'macos/web/src', 'apps/web/app', replacements)
      files.set('apps/web/app/assets/main.css', files.get('apps/web/app/style.css'))
      for (const name of ['main.js', 'mavis.js', 'style.css']) files.delete(`apps/web/app/${name}`)
      files.set(
        'apps/web/app/app.vue',
        `<script setup lang="ts">
import Root, { screen } from './generated/entry'
</script>
<template><Root v-if="screen" /><main v-else class="mavis-page"><Root /></main></template>
`,
      )
    }
    if (directory) {
      await copyTemplate(files, `directory/${nuxt ? 'nuxt' : 'vite'}`, 'apps/web', replacements)
      await copyTemplate(
        files,
        'directory/host',
        `apps/web/${nuxt ? 'app/utils' : 'src'}`,
        replacements,
      )
      if (!nuxt) {
        files.delete('apps/web/src/main.js')
        files.set(
          'apps/web/index.html',
          files.get('apps/web/index.html').replace('/src/main.js', '/src/main.ts'),
        )
      }
    }
    scripts['dev:web'] = `${generate} && ${commands.run('dev', 'apps/web')}`
    scripts['build:web'] =
      `${generate} && ${commands.run(nuxt && preset.rendering === 'ssg' ? 'generate' : 'build', 'apps/web')}`
    builds.push('build:web')
    files.set(
      'apps/web/package.json',
      json({
        ...common,
        name: `${preset.name}-web`,
        type: 'module',
        scripts: nuxt
          ? {
              dev: 'nuxt dev',
              build: 'nuxt build',
              generate: 'nuxt generate',
              preview: 'nuxt preview',
              typecheck: 'nuxt typecheck',
              postinstall: 'nuxt prepare',
            }
          : { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: {
          '@getcortexlabs/mavis-core': v.mavis,
          '@getcortexlabs/mavis-web': v.mavis,
          '@rafaelaugusto/jolt': v.jolt,
          vue: v.vue,
          '@vue/runtime-core': v.vue,
          ...(nuxt ? { nuxt: v.nuxt } : {}),
          ...(directory && !nuxt ? { 'vue-router': v.router } : {}),
        },
        devDependencies: {
          typescript: v.typescript,
          'vue-tsc': v.vueTsc,
          '@types/node': v.nodeTypes,
          ...(!nuxt ? { vite: v.vite, '@vitejs/plugin-vue': v.vuePlugin } : {}),
        },
      }),
    )
  }
  if (native) {
    await copyTemplate(files, 'mobile', 'apps/mobile', replacements)
    await copyTemplate(files, 'macos/mobile', 'apps/mobile', replacements)
    if (directory) {
      await copyTemplate(files, 'directory/mobile', 'apps/mobile', replacements)
      await copyTemplate(files, 'directory/host', 'apps/mobile/src', replacements)
    }
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
          ...(directory ? { 'vue-router-ns': v.nativeRouter } : {}),
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
    if (directory) {
      await copyTemplate(files, 'directory/macos', 'apps/macos/Sources/MavisDesktop', replacements)
      const app = 'apps/macos/Sources/MavisDesktop/App.swift'
      files.set(
        app,
        files
          .get(app)
          .replace(
            'MavisEntry()',
            'MavisEntry(services: MavisServices(directoryStorage: UserDefaultsDirectoryStorage()))',
          ),
      )
    }
    scripts.macos = 'node scripts/macos.mjs run'
    scripts['build:macos'] = 'node scripts/macos.mjs build'
    builds.push('build:macos')
  }
  // The generated theme module tracks configuration edits without rewriting app hosts.
  for (const path of [
    web &&
      (nuxt
        ? 'apps/web/app/plugins/mavis.ts'
        : directory
          ? 'apps/web/src/main.ts'
          : 'apps/web/src/main.js'),
    native && 'apps/mobile/src/app.ts',
  ].filter(Boolean)) {
    const nuxtHost = path.includes('/plugins/')
    let source = files
      .get(path)
      .replace(/, mavis, midnight/g, '')
      .replace(/^import \{ mavis, midnight \} from '@getcortexlabs\/mavis-core'\n/m, '')
      .replace(/^  (?:mavis|midnight),\n/gm, '')
      .replace(/theme: mavis/g, 'theme: appTheme')
      .replace(/darkTheme: midnight/g, 'darkTheme: appDarkTheme')
    if (nuxtHost)
      source = source
        .replace(/: '(?:light|dark)',\n/, ": appAppearance === 'dark' ? 'dark' : 'light',\n")
        .replace(/: 'system'/g, ': appAppearance')
    else source = source.replace(/appearance: '(?:light|dark)'/g, 'appearance: appAppearance')
    files.set(
      path,
      `import { appTheme, appDarkTheme, appAppearance } from '${nuxtHost ? '../' : './'}generated/theme'\n${source}`,
    )
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
            dependenciesMeta: {
              esbuild: { built: true },
              ...(nuxt ? { 'unrs-resolver': { built: true } } : {}),
            },
          }
        : {}),
      scripts,
      // The compiler reads theme tokens from Mavis core, type-checks with TypeScript and parses
      // shared Vue files with Vue's own compiler.
      dependencies: { '@getcortexlabs/mavis-core': v.mavis },
      devDependencies: { '@getcortexlabs/mavis-compiler': v.mavis, typescript: v.typescript },
    }),
  )
  files.set(
    'mavis.config.json',
    json({
      ...configOf(preset),
      macos: {
        name: preset.name,
        bundleId: `com.mavis.${preset.name.replaceAll('-', '')}`,
        minWidth: tasks ? 760 : 640,
        minHeight: 640,
      },
      portability: {
        roots: ['shared'],
        mode: directory ? 'shared-vue-experimental' : 'shared-tsx-experimental',
        entry,
        ...(directory ? { startup: [{ store: 'Directory', action: 'restore' }] } : {}),
      },
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
      '.nuxt/',
      '.output/',
      'apps/web/app/generated/',
      'platforms/',
      'hooks/',
      'apps/macos/.build/',
      'apps/web/src/generated/',
      'apps/web/app/generated/',
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
      `packages:${web ? '\n  - apps/web' : ' []'}\nnodeLinker: hoisted\nallowBuilds:\n  esbuild: true\n${nuxt ? '  "unrs-resolver": true\n' : ''}`,
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
  const directory = preset.example === 'directory'
  const start = [
    native ? commands.setup(true) : commands.install,
    ...(web ? [commands.run('dev:web')] : []),
    ...(native ? [commands.run('ios'), commands.run('android')] : []),
    ...(mac ? [commands.run('macos')] : []),
  ]
  const folders = [
    web &&
      (preset.web === 'nuxt'
        ? `- apps/web: Nuxt (${preset.rendering}) with Mavis Web. Generated screens in apps/web/app/generated/.`
        : '- apps/web: Vue + Vite with Mavis Web. Generated screens in apps/web/src/generated/.'),
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

Screens live in **shared/**: ${directory ? 'Vue screens and typed stores are the same files on every target.' : 'each `Name.lite.tsx` exports one component, and lowercase `.ts` files hold shared types, values, calculations and stores.'} \`${entry}\` is the screen every app opens (\`portability.entry\` in mavis.config.json). Run \`${commands.run('generate')}\` after editing; the start and build commands generate first. The Mavis compiler type-checks the sources with TypeScript, then writes each target's files:

${folders.join('\n')}

Generated folders are replaced on every run and kept out of Git; don't edit them. ${directory ? 'The directory uses shared Vue screens, a typed store and one route table. Host adapters persist the same `mavis:directory` JSON array in localStorage, ApplicationSettings and UserDefaults. App.swift only supplies the storage implementation; the generated entry creates its store.' : 'The sources use Mitosis’s component format (`useStore`, `useRef`, `Show`, `For`), but Mitosis itself is not installed.'} Each app keeps its own state.

${directory ? 'On Mac, `portability.startup` lists the shared store actions to run after the entry first appears. The generated entry owns this startup once per window identity, across renders and route changes. Startup actions take no arguments, return no value and handle their own errors. This setting is Mac-only; Web and NativeScript keep their bootstrap in `apps/web/src/main.ts` and `apps/mobile/src/app.ts`, after the router/app is ready. For Nuxt the bootstrap is in `apps/web/app/plugins/mavis.ts` and restore waits for hydration.\n\n' : ''}A screen can also be a Vue file, \`shared/Name.vue\`, next to the TSX ones: the Web and NativeScript apps run it as written, importing Mavis from \`#mavis\`, and the Mac gets SwiftUI generated from it. It uses \`<script setup lang="ts">\` with \`ref\`, \`computed\`, functions, \`defineProps\`, \`withDefaults\`, \`defineEmits\` and \`useMavisPlatform()\`, and a template of the same primitives with \`v-if\`, \`v-for\`, \`v-model\` and \`MReveal\`. A Vue file shows other Vue files, and a TSX file other TSX files. The guide lists the subset: https://mavis-ui.getcortexlabs.com/guide/macos-experimental#shared-vue-files

What the shared sources can use:
- Vue SFC and TSX components, typed props and callbacks, slots, composition, conditional content and keyed lists. Unsupported syntax reports file:line:column before generation replaces any output.
- Shared typed modules, pure calculations, optional records, and app stores built with Vue ref/computed/readonly and injection. The Mac generates observable stores and receives typed services from its host.
- Async store actions and callbacks, loading/error state, scalar watchers, mount/unmount hooks and explicit cancellation cleanup. Shared code must declare cancellation and stale-result guards; hiding a view is not automatically an unmount.
- A shared route table and navigation actions, including parameters and deep links, with generated native navigation on the Mac.
- Built-in and statically declared custom themes, scoped providers, responsive layout and the supported component families. Each component still has explicit limits; matching a component name does not imply every prop or browser API is portable.

Read the [Mac guide and supported subset](https://mavis-ui.getcortexlabs.com/guide/macos-experimental) and the [component capability matrix](https://mavis-ui.getcortexlabs.com/guide/macos-capabilities), inspect \`create-mavis --capabilities\`, and run \`create-mavis --check-portability\` from the project before adopting code. Network access, persistence, platform formatting, clipboard and opening URLs belong to typed host services. There is no JavaScript runtime or WebView in the generated Mac app.

## Motion

Buttons and cards press, animated Show content enters and leaves, and animated lists move through Jolt on every target: Mavis Web and Mavis on NativeScript run Jolt, and the Mac uses JoltSwiftUI. Motion uses the shared contracts and the current Jolt integration for each target. Components and explicit motion surfaces/regions own and dispose their presentation resources. Consult the Mac guide for platform-specific motion limits and Reduce Motion behavior.

## Build

\`${commands.run('build')}\` builds every target${mac ? `; the Mac app goes to dist/${preset.name}.app` : ''}.${native ? ' build:native bundles the NativeScript JavaScript for Android and iOS; use the NativeScript CLI for installable apps.' : ''} Commit the generated ${native ? 'lockfiles' : commands.lockfile} after installation.
`
}
