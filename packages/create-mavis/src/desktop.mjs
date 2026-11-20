import { posix } from 'node:path'
const { join } = posix
import { configOf, versions as v } from './capabilities.mjs'
import { packageCommands } from './package-manager.mjs'
const json = (value) => JSON.stringify(value, null, 2) + '\n'

/** Every desktop host owns its runtime dependencies; shared Vue never imports an OS bridge. */
export async function desktopFiles(preset, copyTemplate, projectFiles) {
  // Reuse the existing web/mobile hosts and their shared import configuration.
  const base = await projectFiles({
    ...preset,
    targets: ['web', 'native'],
    target: undefined,
    macosRuntime: undefined,
    'macos-runtime': undefined,
    web: preset.web ?? 'vite',
    rendering: preset.rendering ?? 'client',
  })
  const files = base.files
  for (const [prefix, target] of [
    ['apps/web/', 'web'],
    ['apps/mobile/', 'native'],
  ])
    if (!preset.targets.includes(target))
      for (const path of files.keys()) if (path.startsWith(prefix)) files.delete(path)
  if (preset.example === 'welcome') {
    await copyTemplate(files, 'desktop/welcome', '.desktop-welcome', { NAME: preset.name })
    files.set('shared/Welcome.vue', files.get('.desktop-welcome/Welcome.vue'))
    for (const path of files.keys()) if (path.startsWith('.desktop-welcome/')) files.delete(path)
  }
  const commands = packageCommands(preset.packageManager)
  const root = JSON.parse(files.get('package.json'))
  if (!preset.targets.includes('web')) delete root.workspaces
  for (const script of ['dev:web', 'build:web'])
    if (!preset.targets.includes('web')) delete root.scripts[script]
  for (const script of ['ios', 'android'])
    if (!preset.targets.includes('native')) delete root.scripts[script]
  root.engines.node = '>=22.23.3'
  root.scripts['install:apps'] = 'node scripts/install-apps.mjs'
  const hosts = []
  for (const target of ['macos', 'windows']) {
    if (!preset.targets.includes(target)) continue
    hosts.push({ directory: `apps/${target}`, platform: target === 'macos' ? 'darwin' : 'win32' })
    const generated = await desktopHostFiles(preset, target, copyTemplate)
    for (const [path, source] of generated) files.set(join(`apps/${target}`, path), source)
    root.scripts[target] = commands.run('dev', `apps/${target}`)
    root.scripts[`build:${target}`] = commands.run('build', `apps/${target}`)
    root.scripts[`package:${target}`] = commands.run('package', `apps/${target}`)
  }
  if (preset.targets.includes('native')) hosts.unshift({ directory: 'apps/mobile' })
  files.set(
    'scripts/install-apps.mjs',
    `import { spawnSync } from 'node:child_process'\nimport { dirname, resolve } from 'node:path'\nimport { fileURLToPath } from 'node:url'\nconst root = resolve(dirname(fileURLToPath(import.meta.url)), '..')\nconst hosts = ${json([{ directory: '.' }, ...hosts])}\nfor (const host of hosts) {\n  if (host.platform && host.platform !== process.platform) { console.log('Install ' + host.directory + ' on ' + host.platform + '.'); continue }\n  const result = spawnSync(${JSON.stringify(preset.packageManager)}, ['install'], { cwd: resolve(root, host.directory), stdio: 'inherit', shell: process.platform === 'win32' })\n  if (result.error) throw result.error\n  if (result.status !== 0) process.exit(result.status ?? 1)\n}\n`,
  )
  files.set('package.json', json(root))
  if (preset.packageManager === 'pnpm' && !preset.targets.includes('web'))
    files.set(
      'pnpm-workspace.yaml',
      files.get('pnpm-workspace.yaml').replace('packages:\n  - apps/web', 'packages: []'),
    )
  files.set(
    'mavis.config.json',
    json({
      ...configOf(preset),
      portability: { roots: ['shared'], alias: '#mavis', allowImports: [] },
    }),
  )
  files.set('.gitignore', files.get('.gitignore') + '.mavis/\nartifacts/\n')
  files.set(
    'README.md',
    `# ${preset.name}\n\nShared Vue screens with NativeScript desktop hosts. This is an experimental component subset.\n\n## Start\n\n\`\`\`sh\n${commands.run('install:apps')}\n${preset.targets
      .filter((t) => ['macos', 'windows'].includes(t))
      .map((t) => commands.run(t))
      .join(
        '\n',
      )}\n\`\`\`\n\nThe setup command installs desktop dependencies only on their matching OS. Run Mac commands on macOS and Windows commands on Windows. ${preset.targets.includes('web') ? `Web: \`${commands.run('dev:web')}\`.` : ''} ${preset.targets.includes('native') ? `Mobile: \`${commands.run('ios')}\` or \`${commands.run('android')}\`, with NativeScript CLI and platform SDKs.` : ''}\n\nEdit \`shared/${preset.example === 'directory' ? 'Directory' : 'Welcome'}.vue\`. State, Vue logic and screens stay shared. Each host supplies native controls and local storage.\n\n## Desktop requirements and packaging\n\nMac: macOS 13.3+, Apple Silicon, Node 22.23.3+ and Xcode command line tools for packaging. Windows: Windows 10 build 18362+ on x64/arm64, Node 22.23.3+ and Windows SDK (mt.exe). Set MAVIS_MT only if the SDK is installed outside its usual location. The launcher prepares a project-local copy of Node with the XAML compatibility manifest; it never changes the system installation.\n\n${preset.targets
      .filter((t) => ['macos', 'windows'].includes(t))
      .map(
        (t) =>
          `- \`${commands.run('build:' + t)}\`: bundle the Vue source.\n- \`${commands.run('package:' + t)}\`: package on ${t === 'macos' ? 'macOS as an ad-hoc signed .app (not notarized)' : 'Windows as an unsigned portable folder (not an installer)'}. Output: \`apps/${t}/artifacts/\`.`,
      )
      .join(
        '\n',
      )}\n\nPackaged apps include Node and the NativeScript runtime. They do not need a globally installed Node or a development server. For distribution, add your own signing and installer/notarization workflow.\n\n## Current component contract\n\nMScreen, MColumn, MRow, MGrid, MText, MInput, MButton, MLink, MCard, MAlert, MEmptyState and MReveal. See \`apps/*/src/host.mjs\` for accepted properties; unsupported properties produce an error. MRow divides space evenly; MGrid adapts to minColumnWidth. NativeScript Core mobile widgets are not desktop controls. Existing Mavis components outside this subset require a desktop implementation.\n\nAppKit uses native menus and a Jolt-sampled finite opacity reveal driven by Core Animation. Windows uses XAML controls; reveal changes visibility immediately while a Jolt Windows driver is unavailable. The built-in themes are supported; arbitrary theme overrides and motion recipes are outside this starter's contract.\n\nDesktop storage stays under the user's application-data directory, in \`${preset.name}\`. Nothing is sent to a server. Commit generated lockfiles. SwiftUI remains available with \`--macos-runtime swiftui\` when creating a separate project.\n`,
  )
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}

export async function desktopHostFiles(preset, target, copyTemplate, sharedRoot = '../../shared') {
  const files = new Map()
  const replacements = {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    SHARED: '#shared-ui',
    SHARED_ROOT: sharedRoot,
    STORAGE_FILE: preset.example === 'directory' ? 'directory.json' : 'project.txt',
  }
  await copyTemplate(files, 'desktop/common', '', replacements)
  await copyTemplate(files, `desktop/${target}`, '', replacements)
  await copyTemplate(files, `desktop/${preset.example}`, '.entry', replacements)
  files.set('src/main.ts', files.get('.entry/main.ts'))
  for (const path of files.keys()) if (path.startsWith('.entry/')) files.delete(path)
  if (preset.example === 'directory')
    await copyTemplate(files, 'directory/host', 'src', replacements)
  const runtime = target === 'macos' ? '@nativescript/macos-node-api' : '@nativescript/windows-napi'
  files.set(
    'package.json',
    json({
      name: `${preset.name}-${target}`,
      private: true,
      version: '0.0.0',
      type: 'module',
      engines: { node: '>=22.23.3' },
      os: [target === 'macos' ? 'darwin' : 'win32'],
      cpu: target === 'macos' ? ['arm64'] : ['x64', 'arm64'],
      scripts: {
        build: 'node build.mjs',
        dev: 'node build.mjs && node launch.mjs',
        start: 'node launch.mjs',
        package: 'node build.mjs && node package.mjs',
      },
      dependencies: {
        [runtime]: target === 'macos' ? v.macosNodeApi : v.windowsNapi,
        '@getcortexlabs/mavis-core': v.mavis,
        '@rafaelaugusto/jolt': v.jolt,
        vue: v.vue,
        'vue-router': v.router,
      },
      devDependencies: { esbuild: v.esbuild, '@vue/compiler-sfc': v.vue },
      ...(preset.packageManager === 'yarn'
        ? { dependenciesMeta: { esbuild: { built: true } } }
        : {}),
    }),
  )
  if (preset.packageManager === 'pnpm')
    files.set(
      'pnpm-workspace.yaml',
      'packages: []\nnodeLinker: hoisted\nallowBuilds:\n  esbuild: true\n',
    )
  if (preset.packageManager === 'yarn') {
    files.set('yarn.lock', '')
    files.set('.yarnrc.yml', 'nodeLinker: node-modules\n')
  }
  return files
}
