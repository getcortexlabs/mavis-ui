import { versions as v } from './presets.mjs'
import { packageCommands } from './package-manager.mjs'

/** Opt-in build-time compiler; never installed by ordinary Vue/NativeScript starters. */
export async function macosFiles(preset, files, copyTemplate) {
  const commands = packageCommands(preset.packageManager)
  await copyTemplate(files, 'macos', '', {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    APPEARANCE: preset.theme === 'midnight' ? 'dark' : 'light',
    BACKGROUND: preset.theme === 'midnight' ? '#15121C' : '#FAF7FA',
  })
  files.set(
    'package.json',
    JSON.stringify(
      {
        name: preset.name,
        private: true,
        version: '0.0.0',
        type: 'module',
        engines: { node: '>=22.16' },
        scripts: {
          generate: 'node scripts/generate.mjs',
          'dev:web': 'node scripts/generate.mjs && vite',
          'build:web': 'node scripts/generate.mjs && vite build',
          'build:macos': 'node scripts/macos.mjs build',
          macos: 'node scripts/macos.mjs run',
        },
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
        ...(preset.packageManager === 'yarn'
          ? { resolutions: { vue: v.vue }, dependenciesMeta: { esbuild: { built: true } } }
          : {}),
      },
      null,
      2,
    ) + '\n',
  )
  files.set(
    'mavis.config.json',
    JSON.stringify(
      { ...preset, portability: { roots: ['shared'], mode: 'mitosis-swiftui-experimental' } },
      null,
      2,
    ) + '\n',
  )
  files.set(
    '.gitignore',
    'node_modules/\ndist/\nnative/.build/\n.yarn/\n.DS_Store\n*.log\nweb/generated/\nnative/Sources/MavisDesktop/Generated/\nmavis-env.d.ts\n',
  )
  if (preset.packageManager === 'pnpm')
    files.set(
      'pnpm-workspace.yaml',
      'packages: []\nnodeLinker: hoisted\nallowBuilds:\n  esbuild: true\n',
    )
  if (preset.packageManager === 'yarn') {
    files.set('.yarnrc.yml', 'nodeLinker: node-modules\n')
    files.set('yarn.lock', '')
  }
  files.set(
    'README.md',
    `# ${preset.name}

Experimental Mavis macOS + Web starter. **One shared source, two compiled interfaces.**
This is a small compiler experiment, not the complete Mavis SwiftUI renderer.

## Start

\`\`\`sh
${commands.install}
${commands.run('macos')}
# Or open the same screen on the Web:
${commands.run('dev:web')}
\`\`\`

The native app requires macOS 14+ and Xcode with command-line tools. It uses SwiftUI, not a WebView, NativeScript or a JavaScript runtime. Web/code generation also work on other operating systems. The generated app is unsigned for local development; signing/notarization and distribution are outside this experiment.

## Edit once

Screens live in **shared/**: each \`Name.lite.tsx\` exports one component, and lowercase \`.ts\` files hold shared record types. \`Welcome\` is the screen both apps open. Run \`${commands.run('generate')}\` after editing; the build and startup commands generate too. When the Web dev server is already running, generate again and Vite reloads. Rebuild or reopen the native app to see edits.

The Mavis portable compiler type-checks the sources with TypeScript, then writes Vue to web/generated/ and SwiftUI to native/Sources/MavisDesktop/Generated/. Both folders are replaced on every run; don't edit them. The sources use Mitosis's component format (\`useStore\`, \`Show\`, \`For\`), but Mitosis itself is not installed. native/Package.swift and App.swift own the Mac window. Each app keeps its own state; nothing is synchronized between them.

What the sources can use:
- MColumn/MRow (gap, padding), MText (variant, tone, text with values), MButton (text, variant, disabled, onClick).
- Components from other shared files, with typed properties and callback properties.
- useStore with strings, numbers, booleans, string unions, records and arrays (initial values can come from properties), getters with a return type, and actions with parameters.
- Comparisons, && || !, ternaries, arithmetic, template literals, ?. and ??; string trim, toLowerCase, toUpperCase, includes, startsWith, endsWith and length; array filter, map, find, findIndex, some, every, includes, slice, join and length; Math.min, max, floor, ceil, abs and round.
- In actions and event handlers: =, +=, -=, ++ and --, if/else, return, push, unshift and splice, and calls to other actions and callbacks.
- Show with else, and For with a key field.

Anything else fails generation with file:line:column before either output changes. Numbers behave like JavaScript numbers in both apps (Double in Swift) and show the same digits. Text comparison follows each platform's Unicode rules. Not available yet: inputs and forms, index access such as list[0], async work, effects, navigation, persistence and the other Mavis components. The general Vue portability auditor and add-target migrations are not this compiler.

Web buttons use Mavis/Jolt. Native button feedback uses SwiftUI and respects Reduce Motion; **the generated screens do not use Jolt yet** (JoltSwiftUI adoption: https://github.com/getcortexlabs/mavis-ui/issues/315). macOS uses the selected fixed starter theme; automatic appearance switching and exact typography parity are not promised.

Build Web: \`${commands.run('build:web')}\`. Build the local Mac app without opening it: \`${commands.run('build:macos')}\`. Output: dist/${preset.name}.app. Stop the app normally from its menu or with Cmd+Q. Commit the generated ${commands.lockfile} after installation.
`,
  )
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}
