import { configOf, versions as v } from './capabilities.mjs'
import { packageCommands } from './package-manager.mjs'
const json = (value) => JSON.stringify(value, null, 2) + '\n'
const angular = Object.fromEntries(
  ['animations', 'common', 'compiler', 'core', 'forms', 'router', 'platform-browser'].map(
    (name) => [`@angular/${name}`, '22.3.0'],
  ),
)
export const nativeFrameworkDependencies = Object.freeze({
  plain: {},
  react: { react: '18.3.1', 'react-nativescript': '5.0.0' },
  angular: { ...angular, '@nativescript/angular': '22.0.2', rxjs: '7.8.2' },
  svelte: { svelte: '4.2.20', '@nativescript-community/svelte-native': '1.0.32' },
  solid: {
    'solid-js': '2.0.0',
    '@nativescript-community/solid-js': '2.0.1',
    '@solidjs/universal': '2.0.0',
    dominative: '0.1.3',
  },
})
export async function nativeFrameworkFiles(preset, copyTemplate) {
  const files = new Map(),
    framework = preset.framework
  const replacements = {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    FRAMEWORK: framework,
  }
  await copyTemplate(files, 'native-framework/common', '', replacements)
  await copyTemplate(files, `native-framework/${framework}`, 'src', replacements)
  await copyTemplate(files, 'mobile/App_Resources', 'App_Resources', replacements)
  const peers = nativeFrameworkDependencies[framework]
  const overrides =
    framework === 'react'
      ? { 'react-nativescript': { '@nativescript/core': '$@nativescript/core' } }
      : framework === 'svelte'
        ? {
            '@nativescript-community/svelte-native': {
              '@nativescript/core': '$@nativescript/core',
            },
            '@rafaelaugusto/jolt': { svelte: '$svelte' },
          }
        : framework === 'solid'
          ? { '@rafaelaugusto/jolt': { 'solid-js': '$solid-js' } }
          : {}
  const extensions = Object.fromEntries(
    Object.entries(overrides).map(([name, deps]) => [
      name,
      {
        peerDependencies: Object.fromEntries(
          Object.entries(deps).map(([dep, version]) => [
            dep,
            version.startsWith('$') ? (peers[dep] ?? v.nativeCore) : version,
          ]),
        ),
      },
    ]),
  )
  files.set(
    'package.json',
    json({
      name: preset.name,
      private: true,
      version: '0.0.0',
      main: 'src/app.ts',
      engines: { node: '>=22.23.3' },
      scripts: {
        ios: 'ns run ios',
        android: 'ns run android',
        'bundle:ios': 'webpack --env ios',
        'bundle:android': 'webpack --env android',
        typecheck:
          framework === 'svelte' ? 'svelte-check --tsconfig ./tsconfig.json' : 'tsc --noEmit',
      },
      dependencies: {
        '@getcortexlabs/mavis': v.mavis,
        '@getcortexlabs/mavis-core': v.mavis,
        '@nativescript/core': v.nativeCore,
        '@rafaelaugusto/jolt': v.jolt,
        ...(framework === 'plain'
          ? {}
          : { [`@getcortexlabs/mavis-${framework}-nativescript`]: v.mavis }),
        ...peers,
      },
      devDependencies: {
        '@nativescript/android': v.android,
        '@nativescript/ios': v.ios,
        '@nativescript/types': '9.1.1',
        '@nativescript/webpack': v.webpack,
        webpack: v.webpackCore,
        'webpack-cli': v.webpackCli,
        typescript: v.typescript,
        ...(framework === 'react' ? { '@types/react': '18.3.31' } : {}),
        ...(framework === 'svelte' ? { 'svelte-loader': '3.2.4', 'svelte-check': '3.8.6' } : {}),
      },
      overrides,
      ...(preset.packageManager === 'yarn'
        ? {
            resolutions: Object.fromEntries(
              Object.entries(overrides).flatMap(([owner, deps]) =>
                Object.entries(deps).map(([dep]) => [
                  `${owner}/${dep}`,
                  peers[dep] ?? v.nativeCore,
                ]),
              ),
            ),
            dependenciesMeta: {
              '@nativescript/core': { built: true },
              '@parcel/watcher': { built: true },
              'core-js-pure': { built: false },
            },
          }
        : {}),
    }),
  )
  if (preset.packageManager === 'pnpm')
    files.set(
      'pnpm-workspace.yaml',
      `packages: []\nnodeLinker: hoisted\nsideEffectsCache: false\nallowBuilds:\n  '@nativescript/core': true\n  '@parcel/watcher': true\n  core-js-pure: false\n  svelte-preprocess: false\npackageExtensions: ${JSON.stringify(extensions)}\n`,
    )
  if (preset.packageManager === 'yarn') {
    files.set('yarn.lock', '')
    files.set(
      '.yarnrc.yml',
      `nodeLinker: node-modules\npackageExtensions: ${JSON.stringify(extensions)}\n`,
    )
  }
  files.set('.gitignore', 'node_modules/\nplatforms/\nhooks/\n.npm/\n.pnpm-store/\n.yarn/\n*.log\n')
  files.set('mavis.config.json', json(configOf(preset)))
  const commands = packageCommands(preset.packageManager)
  files.set(
    'README.md',
    `# ${preset.name}\n\nDirect ${framework === 'plain' ? 'JavaScript/TypeScript' : framework} components on NativeScript iOS and Android.\n\n\`\`\`sh\n${commands.install}\n${commands.run('ios')}\n${commands.run('android')}\n\`\`\`\n\nEdit \`src/${framework === 'svelte' ? 'Welcome.svelte' : 'screen.ts'}\`. The screen uses its framework's state and lifecycle and renders native views directly. No Vue runtime is installed. \`src/model.ts\` supplies the starting themes and a scoped motion example.\n\nRequires Node 22.23.3+, NativeScript CLI, a JDK and Android SDK; iOS builds need macOS/Xcode. Run \`ns doctor\` and \`${commands.run('typecheck')}\`.\n\nThis starter supports MBox, MRow, MColumn, MText, MButton and MInput. The full Vue component catalog is a different adapter. Rich MText children, arbitrary MButton slots and some effects are not implemented in the direct adapters; see the Mavis native adapter guide. Web, Mac and Windows creator hosts currently use Vue and cannot be combined with this framework preset.\n\nDependencies are pinned. Core 9 and Jolt prerelease peer overrides are explicit in the package-manager configuration; the selected framework is the only one installed. Commit the generated lockfile. ${framework === 'svelte' ? 'Svelte Native 1.0.32 still uses the tested custom-event and bootstrap ownership workarounds in Mavis; upstream adoption is tracked in Mavis #380 and #381.' : ''}\n`,
  )
  return { preset, files }
}
