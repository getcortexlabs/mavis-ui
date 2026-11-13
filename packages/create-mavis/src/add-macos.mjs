import { lstat, mkdir, readFile, readdir, rename, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import {
  compileProject,
  joltSwift,
  macAppSettings,
  startupPlan,
  readAssets,
  readShared,
} from '@getcortexlabs/mavis-compiler'
import { migrateConfig, versions } from './capabilities.mjs'
import { detectPackageManager, packageCommands } from './package-manager.mjs'

const json = (value) => JSON.stringify(value, null, 2) + '\n'
const templates = new URL('../templates/', import.meta.url)
async function optional(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
async function safe(root, name) {
  if (
    typeof name !== 'string' ||
    !name ||
    isAbsolute(name) ||
    name.includes('\\') ||
    name.split('/').includes('..')
  )
    throw new Error('Mac target paths must stay inside the project.')
  let current = root
  for (const part of name.split('/').filter((part) => part && part !== '.')) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Refusing symlink: ${name}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return current
}
async function copy(files, folder, destination, replace) {
  const source = new URL(folder + '/', templates)
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory())
      await copy(files, `${folder}/${entry.name}`, `${destination}/${entry.name}`, replace)
    else {
      const data = await readFile(new URL(entry.name, source))
      files.set(
        `${destination}/${entry.name}`,
        /\.(ttf|icns)$/.test(entry.name) ? data : replace(data.toString('utf8')),
      )
    }
  }
}
const exact = (value) => typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value)

/** Preview adding a native SwiftUI host. Existing Web/native files are never rewritten. */
export async function planMacos(options = {}, cwd = process.cwd()) {
  const root = resolve(cwd)
  const original = new Map()
  const read = async (name) => {
    const text = await optional(await safe(root, name))
    original.set(name, text)
    return text
  }
  const pkg = JSON.parse(await read('package.json'))
  const recorded = await read('mavis.config.json')
  const prior = recorded ? migrateConfig(JSON.parse(recorded)) : {}
  const manifests = [pkg]
  for (const path of ['apps/web/package.json', 'apps/mobile/package.json']) {
    const text = await read(path)
    if (text) manifests.push(JSON.parse(text))
  }
  const dependencies = manifests.map((manifest) => ({
    ...manifest.devDependencies,
    ...manifest.dependencies,
  }))
  const web = dependencies.find((dep) => dep['@getcortexlabs/mavis-web'])
  const native = dependencies.find((dep) => dep['@getcortexlabs/mavis'])
  if (!web && !native)
    throw new Error('--add-macos needs an existing Mavis Vue/Vite, Nuxt or NativeScript project.')
  for (const dep of dependencies)
    for (const name of [
      '@getcortexlabs/mavis-core',
      '@getcortexlabs/mavis-web',
      '@getcortexlabs/mavis',
    ])
      if (
        dep[name] &&
        ![versions.mavis, `^${versions.mavis}`, `~${versions.mavis}`].includes(dep[name])
      )
        throw new Error(
          `Align ${name} with this creator (${versions.mavis}) before adding Mac. No dependencies were changed.`,
        )
  const jolts = [
    ...new Set(
      dependencies.flatMap((dep) =>
        dep['@rafaelaugusto/jolt'] ? [dep['@rafaelaugusto/jolt']] : [],
      ),
    ),
  ]
  const jolt = jolts[0] ?? prior.versions?.jolt
  if (jolts.length > 1 || !exact(jolt) || jolt !== joltSwift.version)
    throw new Error(
      `Pin every existing Jolt dependency to ${joltSwift.version}, the SwiftUI version supported by this compiler. Current: ${jolts.join(', ') || jolt || 'missing'}.`,
    )
  const manager =
    options.packageManager ??
    prior.packageManager ??
    pkg.packageManager?.split('@')[0] ??
    detectPackageManager()
  const commands = packageCommands(manager)
  const knownRoots = options.roots ?? prior.portability?.roots
  let roots = knownRoots
  if (!roots) {
    roots = []
    for (const candidate of ['shared', 'src/shared', 'app/shared']) {
      try {
        if ((await lstat(await safe(root, candidate))).isDirectory()) roots.push(candidate)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    if (roots.length !== 1)
      throw new Error(
        'Choose --shared-root path (or comma-separated roots) to select existing shared sources.',
      )
  }
  const sources = await readShared(root, { roots })
  for (const [name, text] of sources) original.set(name, text)
  let entry = options.entry ?? prior.portability?.entry
  if (!entry) {
    const preferred =
      prior.example === 'directory'
        ? 'Directory.vue'
        : prior.example === 'tasks'
          ? 'Tasks.lite.tsx'
          : 'Welcome.vue'
    entry = [...sources.keys()].find((name) => name.endsWith('/' + preferred))
    if (!entry)
      throw new Error('Choose --entry path/to/Screen.vue (or .lite.tsx); no screen was changed.')
  }
  const settings = macAppSettings(
    prior.macos,
    pkg.name?.replace(/^@[^/]+\//, '') ?? prior.name ?? 'Mavis',
  )
  if (settings.icon) await readFile(await safe(root, settings.icon))
  const host = web ? (web.nuxt ? 'nuxt' : 'vite') : null
  if (
    web &&
    prior.rendering &&
    !(host === 'nuxt' ? ['ssr', 'ssg'] : ['client']).includes(prior.rendering)
  )
    throw new Error('The recorded Web rendering mode does not match the existing host.')
  const targets = [web && 'web', native && 'native', 'macos'].filter(Boolean)
  const config = {
    ...prior,
    schemaVersion: 2,
    name: prior.name ?? pkg.name ?? 'mavis-app',
    targets,
    apps: {
      ...prior.apps,
      ...(web
        ? {
            web: {
              toolkit: 'mavis-web',
              framework: 'vue',
              host,
              rendering: prior.rendering ?? (host === 'nuxt' ? 'ssr' : 'client'),
            },
          }
        : {}),
      ...(native
        ? { native: { toolkit: 'nativescript', framework: 'vue', platforms: ['ios', 'android'] } }
        : {}),
      macos: { toolkit: 'swiftui', framework: null },
    },
    framework: 'vue',
    authoring: prior.authoring ?? (String(entry).endsWith('.lite.tsx') ? 'mitosis' : 'vue'),
    mode: 'portable',
    execution: 'generated',
    web: host,
    rendering: web ? (prior.rendering ?? (host === 'nuxt' ? 'ssr' : 'client')) : null,
    theme: prior.theme ?? 'mavis',
    example: prior.example ?? 'welcome',
    packageManager: manager,
    versions: { ...prior.versions, mavis: versions.mavis, compiler: versions.mavis, jolt },
    macos: settings,
    portability: { ...prior.portability, roots, entry, generate: ['macos'], existing: true },
  }
  const assets = await readAssets(root, {
    folder: config.portability.assets ?? `${roots[0]}/assets`,
  })
  // Preview proves source compilation before touching an existing project.
  const compiled = await compileProject(sources, {
    root: entry,
    theme: config.theme,
    assets,
    sourceRoot: roots[0],
    destinations: config.portability.destinations,
  })
  const metadataFile = 'apps/macos/mavis.host.json'
  const metadata = await read(metadataFile)
  if (metadata) {
    const state = JSON.parse(metadata)
    if (
      state.generator !== 'create-mavis' ||
      JSON.stringify(prior.portability?.roots) !== JSON.stringify(roots) ||
      prior.portability?.entry !== entry
    )
      throw new Error(
        'Mac is already configured with different source choices. Edit mavis.config.json explicitly; existing files were preserved.',
      )
    return {
      root,
      manager,
      entry,
      roots,
      files: new Map(),
      original,
      config,
      alreadyAdded: true,
      components: compiled.model.components.length,
    }
  }
  try {
    await lstat(await safe(root, 'apps/macos'))
    throw new Error('apps/macos already exists. Existing files were preserved.')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const scripts = {
    'generate:macos': 'node scripts/generate-macos.mjs',
    macos: 'node scripts/macos.mjs run',
    'build:macos': 'node scripts/macos.mjs build',
  }
  for (const [name, command] of Object.entries(scripts))
    if (pkg.scripts?.[name] && pkg.scripts[name] !== command)
      throw new Error(`Script conflict: ${name}. Existing scripts were preserved.`)
  const files = new Map()
  const replace = (text) =>
    text
      .replaceAll('__MAVIS_NAME__', settings.name)
      .replaceAll('__MAVIS_APPID__', 'app')
      .replaceAll('__MAVIS_APPEARANCE__', config.theme === 'midnight' ? 'dark' : 'light')
      .replaceAll('__MAVIS_MAC_MIN_WIDTH__', String(settings.minWidth))
      .replaceAll('__MAVIS_MAC_DEFAULT_WIDTH__', String(Math.max(860, settings.minWidth)))
      .replaceAll('__MAVIS_MAC_WIDTH__', '1120')
      .replaceAll('__MAVIS_JOLT_SWIFT__', jolt)
  await copy(files, 'macos/native', 'apps/macos', replace)
  const appPath = 'apps/macos/Sources/MavisDesktop/App.swift'
  let app = files
    .get(appPath)
    .replace(/WindowGroup\(".*"\)/, 'WindowGroup(MavisAppConfiguration.name)')
    .replace(
      '.frame(minWidth: ' + settings.minWidth + ', minHeight: 640)',
      '.frame(minWidth: MavisAppConfiguration.minWidth, minHeight: MavisAppConfiguration.minHeight)',
    )
  const directory =
    compiled.model.services.length === 1 &&
    compiled.model.services[0].name === 'DirectoryStorage' &&
    compiled.model.modules.some((module) =>
      module.stores.some((store) => store.name === 'Directory'),
    )
  if (compiled.model.services.length && !directory)
    throw new Error(
      `The shared entry needs host services: ${compiled.model.services.map((service) => service.name).join(', ')}. Add their Swift implementations explicitly before generation; --add-macos cannot invent their behavior.`,
    )
  if (directory) {
    await copy(files, 'directory/macos', 'apps/macos/Sources/MavisDesktop', replace)
    app = app.replace(
      'MavisEntry()',
      'MavisEntry(services: MavisServices(directoryStorage: UserDefaultsDirectoryStorage()))',
    )
    if (!config.portability.startup)
      config.portability.startup = [{ store: 'Directory', action: 'restore' }]
  }
  startupPlan(compiled.model, config.portability.startup)
  files.set(appPath, app)
  const wrapper = await readFile(new URL('macos/scripts/generate.mjs', templates), 'utf8')
  files.set('scripts/generate-macos.mjs', wrapper)
  const launcher = await readFile(new URL('macos/scripts/macos.mjs', templates), 'utf8')
  files.set(
    'scripts/macos.mjs',
    replace(launcher).replace("['scripts/generate.mjs']", "['scripts/generate-macos.mjs']"),
  )
  files.set(
    metadataFile,
    json({ schemaVersion: 1, generator: 'create-mavis', compiler: versions.mavis }),
  )
  files.set(
    'apps/macos/README.md',
    `# ${settings.name} for Mac\n\nThis SwiftUI target reads existing shared sources (${roots.join(', ')}), starting at \`${entry}\`. Web and NativeScript sources, routes and build configuration remain in place.\n\n\`\`\`sh\n${commands.install}\n${commands.run('generate:macos')}\n${commands.run('build:macos')}\n${commands.run('macos')}\n\`\`\`\n\nThe compiler is a pinned package; update it with Mavis. \`mavis.config.json\` controls the source roots/entry and \`macos.name\`, \`bundleId\`, \`icon\` (.icns), \`minWidth\` and \`minHeight\`. Configure app-owned services in \`Sources/MavisDesktop/App.swift\`. ${directory ? 'Directory uses the same JSON array and mavis:directory key in UserDefaults; restore runs once after mounting each entry identity.' : ''}\n\nRequires macOS 14+ and Xcode. This builds an unsigned development app. Developer ID signing, provisioning and notarization are separate distribution steps; no credentials or signing settings are generated.\n`,
  )
  pkg.scripts = { ...pkg.scripts, ...scripts }
  pkg.devDependencies = { ...pkg.devDependencies, '@getcortexlabs/mavis-compiler': versions.mavis }
  files.set('package.json', json(pkg))
  files.set('mavis.config.json', json(config))
  for (const name of files.keys()) {
    if (original.has(name)) continue
    if ((await read(name)) !== undefined)
      throw new Error(`File conflict: ${name}. Existing files were preserved.`)
  }
  return {
    root,
    manager,
    entry,
    roots,
    files,
    original,
    config,
    alreadyAdded: false,
    components: compiled.model.components.length,
  }
}

/** Optimistic transaction: refuse concurrent edits; roll back only bytes written by this plan. */
export async function applyMacos(plan, { signal } = {}) {
  if (plan.alreadyAdded) return
  const written = []
  try {
    for (const [name, expected] of plan.original) {
      if ((await optional(await safe(plan.root, name))) !== expected)
        throw new Error(`${name} changed after the preview. Run --add-macos again.`)
    }
    for (const [name, data] of plan.files) {
      signal?.throwIfAborted()
      const path = await safe(plan.root, name)
      await mkdir(dirname(path), { recursive: true })
      if (plan.original.get(name) === undefined) await writeFile(path, data, { flag: 'wx' })
      else {
        if ((await optional(path)) !== plan.original.get(name))
          throw new Error(`${name} changed during creation.`)
        const staging = `${path}.mavis-${process.pid}.tmp`
        try {
          await writeFile(staging, data, { flag: 'wx' })
          await rename(staging, path)
        } finally {
          await rm(staging, { force: true })
        }
      }
      written.push(name)
    }
  } catch (error) {
    for (const name of written.reverse()) {
      const path = join(plan.root, name)
      const current = await readFile(path).catch(() => null)
      if (!current?.equals(Buffer.from(plan.files.get(name)))) continue
      const prior = plan.original.get(name)
      if (prior === undefined) await rm(path)
      else await writeFile(path, prior)
      for (let folder = dirname(path); folder !== plan.root; folder = dirname(folder))
        await rmdir(folder).catch(() => {})
    }
    throw error
  }
}
