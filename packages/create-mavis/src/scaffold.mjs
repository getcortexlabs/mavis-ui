import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { directoryReadme } from './reference.mjs'
import { resolvePreset, versions as v } from './presets.mjs'
import { packageCommands, runInstall } from './package-manager.mjs'

const templates = fileURLToPath(new URL('../templates/', import.meta.url))
const json = (value) => `${JSON.stringify(value, null, 2)}\n`

async function copyTemplate(files, source, destination, replacements) {
  for (const entry of await readdir(join(templates, source), { withFileTypes: true })) {
    const from = join(source, entry.name),
      to = join(destination, entry.name.replace(/^_gitignore$/, '.gitignore'))
    if (entry.isDirectory()) await copyTemplate(files, from, to, replacements)
    else {
      let content = await readFile(join(templates, from), 'utf8')
      for (const [key, value] of Object.entries(replacements))
        content = content.replaceAll(`__MAVIS_${key}__`, value)
      files.set(to, content)
    }
  }
}

export async function projectFiles(options) {
  const preset = resolvePreset(options)
  const files = new Map()
  const shared = preset.target === 'both'
  const directory = preset.example === 'directory'
  const commands = packageCommands(preset.packageManager)
  const buildPolicy = (native) => ({
    esbuild: true,
    ...(native
      ? { '@nativescript/core': true, '@parcel/watcher': true, 'core-js-pure': false }
      : preset.web === 'nuxt'
        ? { 'unrs-resolver': true }
        : {}),
  })
  const yarnBuilds = (native) =>
    preset.packageManager === 'yarn'
      ? {
          dependenciesMeta: Object.fromEntries(
            Object.entries(buildPolicy(native)).map(([name, built]) => [name, { built }]),
          ),
        }
      : {}
  const replacements = {
    NAME: preset.name,
    APPID: preset.name.replaceAll('-', ''),
    THEME: preset.theme,
    APPEARANCE: preset.theme === 'midnight' ? 'dark' : 'light',
    SHARED: '#shared-ui',
    SHARED_ROOT: shared ? '../../shared' : preset.web === 'nuxt' ? './app/shared' : './src/shared',
  }
  await copyTemplate(
    files,
    directory ? 'directory/shared' : 'shared',
    shared ? 'shared' : preset.web === 'nuxt' ? 'app/shared' : 'src/shared',
    replacements,
  )
  const webDir = shared ? 'apps/web' : ''
  const mobileDir = shared ? 'apps/mobile' : ''
  const common = { private: true, version: '0.0.0', engines: { node: '>=22.16' } }
  const dependencies = { '@getcortexlabs/mavis-core': v.mavis, '@rafaelaugusto/jolt': v.jolt }
  if (preset.target !== 'mobile') {
    await copyTemplate(files, preset.web, webDir, {
      ...replacements,
      SHARED: '#shared-ui',
    })
    if (directory) await copyTemplate(files, `directory/${preset.web}`, webDir, replacements)
    const scripts =
      preset.web === 'vite'
        ? { dev: 'vite', build: 'vue-tsc --noEmit && vite build', preview: 'vite preview' }
        : {
            dev: 'nuxt dev',
            build: 'nuxt build',
            generate: 'nuxt generate',
            preview: 'nuxt preview',
            typecheck: 'nuxt typecheck',
            postinstall: 'nuxt prepare',
          }
    files.set(
      join(webDir, 'package.json'),
      json({
        ...common,
        name: `${preset.name}${shared ? '-web' : ''}`,
        ...yarnBuilds(false),
        type: 'module',
        scripts,
        dependencies: {
          ...dependencies,
          '@getcortexlabs/mavis-web': v.mavis,
          vue: v.vue,
          ...(directory && preset.web === 'vite' ? { 'vue-router': v.router } : {}),
          ...(preset.web === 'nuxt' ? { nuxt: v.nuxt } : {}),
        },
        devDependencies: {
          typescript: v.typescript,
          'vue-tsc': v.vueTsc,
          '@types/node': v.nodeTypes,
          ...(preset.web === 'vite' ? { vite: v.vite, '@vitejs/plugin-vue': v.vuePlugin } : {}),
        },
      }),
    )
  }
  if (preset.target !== 'web') {
    await copyTemplate(files, 'mobile', mobileDir, {
      ...replacements,
      SHARED_ROOT: shared ? '../../shared' : './src/shared',
      SHARED: '#shared-ui',
    })
    if (directory) await copyTemplate(files, 'directory/mobile', mobileDir, replacements)
    files.set(
      join(mobileDir, 'package.json'),
      json({
        ...common,
        name: `${preset.name}${shared ? '-mobile' : ''}`,
        ...yarnBuilds(true),
        main: 'src/app.ts',
        scripts: {
          android: 'ns run android',
          ios: 'ns run ios',
          typecheck: 'vue-tsc --noEmit',
          'bundle:android': 'webpack --env android',
          'bundle:ios': 'webpack --env ios',
        },
        dependencies: {
          ...dependencies,
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
  if (shared)
    files.set(
      'package.json',
      json({
        ...common,
        name: preset.name,
        ...yarnBuilds(false),
        ...(preset.packageManager !== 'pnpm' ? { workspaces: ['apps/web'] } : {}),
        scripts: {
          'dev:web': commands.run('dev', 'apps/web'),
          'build:web': commands.run(preset.rendering === 'ssg' ? 'generate' : 'build', 'apps/web'),
          android: commands.run('android', 'apps/mobile'),
          ios: commands.run('ios', 'apps/mobile'),
          'install:apps': `${commands.install} && ${commands.installAt('apps/mobile')}`,
        },
      }),
    )
  if (preset.packageManager === 'pnpm') {
    const config = (native, workspace = false) =>
      `${workspace ? 'packages:\n  - apps/web\n' : 'packages: []\n'}nodeLinker: hoisted\n${native ? 'sideEffectsCache: false\n' : ''}allowBuilds:\n${Object.entries(
        buildPolicy(native),
      )
        .map(([name, allowed]) => `  ${JSON.stringify(name)}: ${allowed}\n`)
        .join('')}`
    files.set('pnpm-workspace.yaml', config(preset.target === 'mobile', shared))
    if (shared) files.set('apps/mobile/pnpm-workspace.yaml', config(true))
  }
  if (preset.packageManager === 'yarn') {
    files.set('.yarnrc.yml', 'nodeLinker: node-modules\n')
    // An empty lockfile marks a separate Yarn project, including before its first install.
    files.set('yarn.lock', '')
    if (shared) files.set('apps/mobile/yarn.lock', '')
  }
  const sharedDir = shared ? 'shared' : preset.web === 'nuxt' ? 'app/shared' : 'src/shared'
  files.set(
    'mavis.config.json',
    json({ ...preset, portability: { roots: [sharedDir], alias: '#mavis', allowImports: [] } }),
  )
  files.set(
    '.gitignore',
    'node_modules/\n.npm/\n.pnpm-store/\n.yarn/\ndist/\n.nuxt/\n.output/\nplatforms/\nhooks/\n.DS_Store\n*.log\n',
  )
  const location = shared
    ? '`shared/Welcome.vue`'
    : preset.web === 'nuxt'
      ? '`app/shared/Welcome.vue`'
      : '`src/shared/Welcome.vue`'
  files.set(
    'README.md',
    [
      `# ${preset.name}`,
      `A Mavis ${shared ? 'NativeScript + Web' : preset.target} application using Vue templates.`,
      '## Start',
      [
        '```sh',
        commands.setup(shared),
        preset.target === 'mobile'
          ? commands.run('ios')
          : shared
            ? commands.run('dev:web')
            : commands.run('dev'),
        ...(preset.target !== 'web'
          ? [commands.run('android'), ...(shared ? [commands.run('ios')] : [])]
          : []),
        '```',
      ].join('\n'),
      `Edit ${location}. Its state and components are shared; each host provides the save service. The included service is a local demo and does not send data to a server.`,
      ...(preset.target !== 'web'
        ? [
            'Mobile requires the NativeScript CLI and the selected platform SDK. iOS builds require macOS/Xcode; Android requires a JDK and Android SDK. Run \`ns doctor\` inside the mobile app directory.',
          ]
        : []),
      ...(preset.web === 'nuxt'
        ? [
            `Nuxt server rendering: \`${commands.run('build')}\`. Static output: \`${commands.run('generate')}\`. ${shared ? 'Run these inside apps/web. ' : ''}The initial appearance is deterministic during hydration; device appearance is applied after mount.`,
          ]
        : []),
      ...(shared
        ? [
            `The native and DOM renderers have separate dependency trees so each uses its own Vue runtime. After the initial setup above, reinstall both from the root with \`${commands.run('install:apps')}\`.`,
          ]
        : []),
      ...(preset.packageManager === 'pnpm'
        ? [
            'Use pnpm 10.26 or newer. The generated pnpm-workspace.yaml files configure project boundaries, a hoisted node_modules layout and the build scripts needed by the starter. This also lets shared imports, Vite deduplication and native tools resolve their dependencies.',
          ]
        : []),
      ...(preset.packageManager === 'yarn'
        ? [
            'Yarn Classic and modern Yarn use node_modules. The initial yarn.lock files mark project boundaries; Yarn fills them during installation. dependenciesMeta allows the starter build scripts. If Yarn reports a recently published dependency as quarantined, retry after its configured minimum package age has elapsed.',
          ]
        : []),
      `Dependencies are pinned in package.json. Commit ${shared ? 'both generated lockfiles' : 'the generated ' + commands.lockfile}. Mavis and Jolt are prereleases; see https://mavis-ui.getcortexlabs.com/ for current contracts.`,
    ].join('\n\n') + '\n',
  )
  if (directory) files.set('README.md', directoryReadme(preset, sharedDir))
  return { preset, files: new Map([...files].sort(([a], [b]) => a.localeCompare(b))) }
}

export async function scaffold(options, cwd = process.cwd()) {
  options.signal?.throwIfAborted()
  const plan = await projectFiles(options)
  const destination = resolve(cwd, plan.preset.name)
  if (existsSync(destination))
    throw new Error(
      `Destination already exists: ${destination}. Choose a new directory; existing files are never overwritten.`,
    )
  if (options.dryRun) return { ...plan, destination }
  const staging = await mkdtemp(join(cwd, '.mavis-create-'))
  try {
    for (const [file, contents] of plan.files) {
      options.signal?.throwIfAborted()
      const output = resolve(staging, file)
      if (relative(staging, output).startsWith(`..${sep}`))
        throw new Error('Invalid template path.')
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, contents, { flag: 'wx' })
    }
    // The parent remains owned by the user; never merge into an existing destination.
    options.signal?.throwIfAborted()
    await mkdir(destination)
    const written = []
    try {
      for (const entry of await readdir(staging)) {
        options.signal?.throwIfAborted()
        await rename(join(staging, entry), join(destination, entry))
        written.push(entry)
      }
    } catch (error) {
      for (const entry of written)
        await rm(join(destination, entry), { recursive: true, force: true })
      // Leave anything independently added to the directory alone.
      await rmdir(destination).catch(() => {})
      throw error
    }
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
  return { ...plan, destination }
}

export async function installProject(plan, { signal, onProgress } = {}) {
  const directories = plan.preset.target === 'both' ? ['', 'apps/mobile'] : ['']
  for (const directory of directories) {
    const cwd = join(plan.destination, directory)
    onProgress?.(directory || '.')
    try {
      await runInstall(plan.preset.packageManager ?? 'npm', cwd, signal)
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error(
        `${error.message}\nProject files were preserved. Retry with ${packageCommands(plan.preset.packageManager).install} in ${cwd}.`,
      )
    }
  }
}
