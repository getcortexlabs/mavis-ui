import { lstat, mkdir, mkdtemp, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { projectFiles } from './scaffold.mjs'
import { versions } from './presets.mjs'
import { checkPortability } from './portability.mjs'
import { detectPackageManager, packageCommands } from './package-manager.mjs'

const json = (value) => JSON.stringify(value, null, 2) + '\n'
const posix = (path) => path.split(sep).join('/')
async function optional(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
async function safePath(root, name) {
  const path = resolve(root, name),
    rel = relative(root, path)
  if (!rel || isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`))
    throw new Error('Paths must stay inside the existing project.')
  let current = root
  for (const part of rel.split(sep)) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Refusing symlink: ${current}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return path
}

/** Add an isolated host; the original application is never treated as a template. */
export async function planTarget(options, cwd = process.cwd()) {
  const root = resolve(cwd)
  const packageFile = await safePath(root, 'package.json')
  const original = await readFile(packageFile, 'utf8'),
    pkg = JSON.parse(original)
  const deps = { ...pkg.devDependencies, ...pkg.dependencies }
  const target = options.target
  if (!['mobile', 'web'].includes(target)) throw new Error('Choose --add-native or --add-web.')
  const source = deps.nuxt
    ? 'nuxt'
    : deps.vite && deps.vue
      ? 'vite'
      : deps['nativescript-vue'] && deps['@nativescript/core']
        ? 'mobile'
        : null
  if (!source || (target === 'mobile' ? source === 'mobile' : source !== 'mobile'))
    throw new Error(
      target === 'mobile'
        ? '--add-native needs an existing Vue + Vite or Nuxt package.'
        : '--add-web needs an existing NativeScript-Vue package.',
    )
  // A root workspace can later absorb the new renderer during root installation.
  // Work inside a concrete host package instead of changing workspace ownership.
  const workspace = await optional(join(root, 'pnpm-workspace.yaml'))
  if (
    pkg.workspaces?.length ||
    pkg.workspaces?.packages?.length ||
    (workspace && !/^packages:\s*\[\s*\]/m.test(workspace))
  )
    throw new Error(
      'Run this command inside a standalone host package; a workspace root needs an explicit isolation plan.',
    )
  const mavis = deps[target === 'mobile' ? '@getcortexlabs/mavis-web' : '@getcortexlabs/mavis']
  if (!mavis || ![versions.mavis, `^${versions.mavis}`, `~${versions.mavis}`].includes(mavis))
    throw new Error(
      `This creator supports Mavis ${versions.mavis}. Align the existing renderer first; no dependencies were changed.`,
    )
  const locks = []
  for (const [name, file] of [
    ['npm', 'package-lock.json'],
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
  ])
    if ((await optional(join(root, file))) !== undefined) locks.push(name)
  const declaredManager = pkg.packageManager?.split('@')[0]
  if (!options.packageManager && !declaredManager && locks.length > 1)
    throw new Error('Multiple lockfiles found. Choose --package-manager npm, pnpm or yarn.')
  const manager =
    options.packageManager ??
    declaredManager ??
    locks[0] ??
    (workspace !== undefined ? 'pnpm' : undefined) ??
    detectPackageManager()
  const commands = packageCommands(manager)
  const host = target === 'mobile' ? 'mobile' : (options.web ?? 'vite')
  const rendering =
    host === 'mobile' ? null : (options.rendering ?? (host === 'nuxt' ? 'ssr' : 'client'))
  const destination = `apps/${target}`
  await safePath(root, destination)
  const screen = options.screen ? posix(relative(root, await safePath(root, options.screen))) : null
  if (screen && !screen.endsWith('.vue'))
    throw new Error('--screen must name an existing .vue file.')
  if (options.screenRoot && !['screen', 'content'].includes(options.screenRoot))
    throw new Error('--screen-root must be screen or content.')
  const metadataPath = join(root, destination, 'mavis.host.json')
  const existing = await optional(metadataPath)
  if (existing) {
    const state = JSON.parse(existing)
    if (
      state.schemaVersion !== 1 ||
      state.source !== source ||
      state.host !== host ||
      state.manager !== manager ||
      state.rendering !== rendering ||
      state.screen !== screen ||
      state.requestedScreenRoot !== (options.screenRoot ?? null)
    )
      throw new Error(
        `${destination} was added with different choices. Existing files are preserved.`,
      )
    for (const [name, value] of Object.entries(state.scripts))
      if (pkg.scripts?.[name] !== value)
        throw new Error(
          `Existing script ${name} changed. Resolve it explicitly; host files are preserved.`,
        )
    return {
      root,
      destination,
      host,
      manager,
      screen,
      files: new Map(),
      scripts: state.scripts,
      alreadyAdded: true,
      diagnostics: [],
    }
  }
  try {
    await lstat(join(root, destination))
    throw new Error(`${destination} already exists. No files were changed.`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const name = (pkg.name ?? 'mavis-app')
    .replace(/^@[^/]+\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 48)
  const generated = await projectFiles({
    name: /^[a-z]/.test(name) ? name : `app-${name}`,
    target,
    web: host === 'mobile' ? 'vite' : host,
    rendering: options.rendering,
    packageManager: manager,
  })
  const files = generated.files
  const native = target === 'mobile'
  if (native) {
    const file = 'webpack.config.js'
    files.set(
      file,
      files
        .get(file)
        .replace(
          "    config.resolve.alias.set('vue$'",
          () =>
            "    for (const [name, entry] of Object.entries({ '@getcortexlabs/mavis-core$': 'index.js', '@getcortexlabs/mavis-core/vue$': 'vue/index.js', '@getcortexlabs/mavis-core/experimental$': 'experimental.js' }))\n      config.resolve.alias.set(name, resolve(__dirname, 'node_modules/@getcortexlabs/mavis-core/dist', entry))\n    config.resolve.alias.set('vue$'",
        ),
    )
  } else if (host === 'vite') {
    const file = 'vite.config.ts'
    files.set(
      file,
      files.get(file).replace("dedupe: ['vue'", "dedupe: ['@getcortexlabs/mavis-core', 'vue'"),
    )
  } else {
    const file = 'nuxt.config.ts'
    files.set(
      file,
      files
        .get(file)
        .replace(
          '  devtools:',
          "  vite: { resolve: { dedupe: ['vue', '@vue/runtime-core', '@vue/reactivity', '@vue/shared', '@getcortexlabs/mavis-core'] } },\n  devtools:",
        ),
    )
  }
  const scripts = native
    ? {
        'install:mobile': commands.installAt(destination),
        ios: commands.run('ios', destination),
        android: commands.run('android', destination),
      }
    : {
        'install:web': commands.installAt(destination),
        'dev:web': commands.run('dev', destination),
        'build:web': commands.run(
          generated.preset.rendering === 'ssg' ? 'generate' : 'build',
          destination,
        ),
        'preview:web': commands.run('preview', destination),
      }
  for (const [name, value] of Object.entries(scripts))
    if (pkg.scripts?.[name] !== undefined && pkg.scripts[name] !== value)
      throw new Error(
        `Script conflict: ${name}. Rename the existing script explicitly before adding this target.`,
      )
  const manifest = JSON.parse(files.get('package.json'))
  manifest.name += native ? '-mobile' : '-web'
  for (const name of [
    '@getcortexlabs/mavis-core',
    native ? '@getcortexlabs/mavis' : '@getcortexlabs/mavis-web',
  ])
    manifest.dependencies[name] = mavis
  manifest.dependencies['@rafaelaugusto/jolt'] = deps['@rafaelaugusto/jolt'] ?? versions.jolt
  files.set('package.json', json(manifest))
  if (manager === 'npm') files.set('.npmrc', 'workspaces=false\n')
  let diagnostics = [],
    screenRoot = null
  if (screen) {
    const input = await readFile(join(root, screen), 'utf8')
    const { descriptor, errors } = parse(input, { filename: screen })
    if (errors.length || !descriptor.template || descriptor.template.src)
      throw new Error('The selected screen must contain a valid inline Vue template.')
    const roots = descriptor.template.ast?.children.filter((node) => node.type === 1) ?? []
    screenRoot =
      options.screenRoot ??
      (roots.length === 1 && ['MScreen', 'm-screen'].includes(roots[0].tag) ? 'screen' : 'content')
    if (roots.some((node) => ['Frame', 'Page'].includes(node.tag)))
      throw new Error('Select shared content or an MScreen, not a native Frame/Page entry.')
    diagnostics = (await checkPortability(root, { path: screen })).diagnostics
    const entry = native
      ? 'src/App.vue'
      : host === 'nuxt'
        ? 'app/app.vue'
        : 'src/ExistingScreen.vue'
    const screenImport = posix(
      relative(dirname(join(root, destination, entry)), join(root, screen)),
    )
    const view =
      screenRoot === 'screen'
        ? '<ExistingScreen />'
        : '<MScreen scroll><ExistingScreen /></MScreen>'
    files.set(
      entry,
      `<script setup lang="ts">\nimport ExistingScreen from ${JSON.stringify(screenImport.startsWith('.') ? screenImport : './' + screenImport)}\n</script>\n<template>${native ? `<Frame>${view}</Frame>` : view}</template>\n`,
    )
    if (native)
      files.set(
        'src/app.ts',
        "import { createApp } from 'nativescript-vue'\nimport { createMavis } from '@getcortexlabs/mavis/vue'\nimport App from './App.vue'\ncreateApp(App).use(createMavis()).start()\n",
      )
    if (host === 'vite')
      files.set(
        'src/main.ts',
        "import { createApp } from 'vue'\nimport { createMavis } from '@getcortexlabs/mavis-web'\nimport App from './ExistingScreen.vue'\nimport '@getcortexlabs/mavis-web/style.css'\nimport './style.css'\ncreateApp(App).use(createMavis()).mount('#app')\n",
      )
    // Explicit type resolution for source files outside this host's dependency tree.
    if (host === 'nuxt') {
      const paths = { vue: 'vue' }
      for (const [name, entry] of Object.entries({
        '@getcortexlabs/mavis-core': 'index.d.ts',
        '@getcortexlabs/mavis-core/vue': 'vue/index.d.ts',
        '@getcortexlabs/mavis-core/experimental': 'experimental.d.ts',
      }))
        paths[name] = `@getcortexlabs/mavis-core/dist/${entry}`
      const entries = Object.entries(paths)
        .map(
          ([name, entry]) =>
            `${JSON.stringify(name)}: [fileURLToPath(new URL(${JSON.stringify('./node_modules/' + entry)}, import.meta.url))]`,
        )
        .join(', ')
      files.set(
        'nuxt.config.ts',
        files
          .get('nuxt.config.ts')
          .replace(
            '  devtools:',
            () =>
              `  typescript: { tsConfig: { compilerOptions: { paths: { ${entries} } } } },\n  devtools:`,
          ),
      )
    } else {
      const config = JSON.parse(files.get('tsconfig.json'))
      config.compilerOptions.paths.vue = [
        native ? './node_modules/nativescript-vue' : './node_modules/vue',
      ]
      for (const [name, entry] of Object.entries({
        '@getcortexlabs/mavis-core': 'index.d.ts',
        '@getcortexlabs/mavis-core/vue': 'vue/index.d.ts',
        '@getcortexlabs/mavis-core/experimental': 'experimental.d.ts',
      }))
        config.compilerOptions.paths[name] = [
          `./node_modules/@getcortexlabs/mavis-core/dist/${entry}`,
        ]
      config.include = [
        'src',
        posix(relative(join(root, destination), join(root, screen))),
        ...(host === 'vite' ? ['vite.config.ts'] : []),
      ]
      files.set('tsconfig.json', json(config))
    }
  }
  const state = {
    schemaVersion: 1,
    rendering,
    source,
    host,
    manager,
    screen,
    screenRoot,
    requestedScreenRoot: options.screenRoot ?? null,
    scripts,
  }
  files.set('mavis.host.json', json(state))
  files.set(
    'README.md',
    `# ${native ? 'NativeScript' : host === 'nuxt' ? 'Nuxt' : 'Vue + Vite'} host\n\nAdded to the existing ${source} application. Original sources, Web/native configuration and lockfiles stay in place.\n\nFrom the repository root:\n\n\`\`\`sh\n${commands.run(native ? 'install:mobile' : 'install:web')}\n${commands.run(native ? 'ios' : 'dev:web')}\n${native ? commands.run('android') : commands.run('build:web')}\n\`\`\`\n\n${screen ? `Entry: \`${screen}\` (${screenRoot}). The host imports this file; it does not copy it. Run the creator with \`--check-portability --path ${JSON.stringify(screen)}\` from the original project root. Configure app-owned services, routes and aliases used by that screen in this host.` : `Start with \`${destination}/${host === 'nuxt' ? 'app' : 'src'}/shared/Welcome.vue\`, then import a portable screen from the existing application in the host entry.`}\n\n${native ? 'NativeScript CLI, Android SDK/JDK and macOS/Xcode for iOS are required. Run `ns doctor` inside this directory. The Frame owns one MScreen/Page; use `--screen-root screen` for a component that already owns MScreen, or `content` to wrap it.' : 'The Web renderer has its own Vue runtime. Device services and native-only components need Web adapters. Nuxt SSR must not execute browser globals during setup.'}\n\nNative and Web dependencies are installed separately. Do not add this host to a workspace that hoists both Vue runtimes. No existing screen, router, service or import is migrated automatically. Review portability findings before considering a selected screen ready for the new platform.\n`,
  )
  return {
    root,
    destination,
    host,
    manager,
    screen,
    files,
    scripts,
    original,
    packageFile,
    diagnostics,
    preset: generated.preset,
    alreadyAdded: false,
  }
}

export async function applyTarget(plan, { signal } = {}) {
  if (plan.alreadyAdded) return
  signal?.throwIfAborted()
  const target = await safePath(plan.root, plan.destination)
  const staging = await mkdtemp(join(plan.root, '.mavis-add-'))
  let created = false
  const written = []
  try {
    for (const [file, content] of plan.files) {
      signal?.throwIfAborted()
      const output = join(staging, 'host', file)
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, content, { flag: 'wx' })
    }
    const pkg = JSON.parse(plan.original)
    pkg.scripts = { ...pkg.scripts, ...plan.scripts }
    await writeFile(join(staging, 'package.json'), json(pkg), { flag: 'wx' })
    if ((await readFile(plan.packageFile, 'utf8')) !== plan.original)
      throw new Error('package.json changed after planning. Run the command again.')
    await mkdir(dirname(target), { recursive: true })
    await mkdir(target)
    created = true
    for (const file of plan.files.keys()) {
      signal?.throwIfAborted()
      await mkdir(dirname(join(target, file)), { recursive: true })
      await safePath(plan.root, join(plan.destination, file))
      await writeFile(join(target, file), plan.files.get(file), { flag: 'wx' })
      written.push(file)
    }
    signal?.throwIfAborted()
    if ((await readFile(plan.packageFile, 'utf8')) !== plan.original)
      throw new Error('package.json changed during creation. Run the command again.')
    await rename(join(staging, 'package.json'), plan.packageFile)
  } catch (error) {
    if (created) {
      for (const file of written.reverse()) {
        const path = join(target, file)
        if ((await optional(path)) === plan.files.get(file)) await rm(path)
        for (let folder = dirname(path); folder.startsWith(target); folder = dirname(folder))
          await rmdir(folder).catch(() => {})
      }
      await rmdir(target).catch(() => {})
    }
    throw error
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}
