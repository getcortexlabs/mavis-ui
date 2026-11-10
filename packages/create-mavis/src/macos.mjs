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
          '@builder.io/mitosis': v.mitosis,
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
    'node_modules/\ndist/\nnative/.build/\n.yarn/\n.DS_Store\n*.log\n*.generated.vue\n*.generated.swift\n',
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

Edit **shared/Welcome.lite.tsx**, then run \`${commands.run('generate')}\`. The build and startup commands also generate automatically. When the Web dev server is already running, run generate after editing the shared source; Vite then reloads the generated Vue file. Rebuild/reopen the native app to see edits.

Mitosis ${v.mitosis} parses the source and generates Vue and SwiftUI. The local build adapter maps four Mavis primitives and reads the selected theme tokens from mavis-core. Generated files in web/ and native/Sources/MavisDesktop/ are replaceable outputs, not sources to edit. native/Package.swift and App.swift own the Mac window. Each host has its own local state; state is not synchronized between processes.

Supported subset:
- MColumn/MRow: gap and padding spacing tokens.
- MText: one text literal or state binding, typography variant and color tone.
- MButton: text, primary/secondary variant, and onClick with one local state assignment.
- useStore: string, boolean or non-negative integer literals; actions assign same-type literals or increment an integer.

Unsupported syntax/properties fail generation with a diagnostic. Existing .vue files, all other Mavis components, Nuxt, iOS/Android output, arbitrary TypeScript, props, loops, effects, async services, navigation and persistence are not included. The general Vue portability auditor and add-target migrations are not this compiler. Run \`${commands.run('generate')}\` to check both outputs.

Web buttons use Mavis/Jolt. Native button feedback uses SwiftUI and respects Reduce Motion; **the generated screens do not use Jolt yet** (JoltSwiftUI adoption: https://github.com/getcortexlabs/mavis-ui/issues/315). macOS uses the selected fixed starter theme; automatic appearance switching and exact typography parity are not promised.

Build Web: \`${commands.run('build:web')}\`. Build the local Mac app without opening it: \`${commands.run('build:macos')}\`. Output: dist/${preset.name}.app. Stop the app normally from its menu or with Cmd+Q. Commit the generated ${commands.lockfile} after installation.
`,
  )
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}
