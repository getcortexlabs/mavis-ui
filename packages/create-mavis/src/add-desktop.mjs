import { lstat, readFile, readdir } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve, sep, dirname, extname } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { desktopHostFiles } from './desktop.mjs'
import { copyTemplate } from './scaffold.mjs'
import { migrateConfig, targetNames, versions } from './capabilities.mjs'
import { desktopComponents } from '../templates/desktop/common/src/contract.mjs'
import { packageCommands, detectPackageManager } from './package-manager.mjs'
import { applyMacos } from './add-macos.mjs'
const json = (value) => JSON.stringify(value, null, 2) + '\n'
const posix = (path) => path.split(sep).join('/')
async function safe(root, name) {
  const path = resolve(root, name),
    rel = relative(root, path)
  if (!rel || isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`))
    throw new Error('Desktop source paths must stay inside the project.')
  let current = root
  for (const part of rel.split(sep)) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Refusing symlink: ${name}`)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  return path
}

export async function planDesktop(options, cwd = process.cwd()) {
  const root = resolve(cwd),
    original = new Map(),
    files = new Map(),
    diagnostics = []
  const target = options.target
  if (!['macos', 'windows'].includes(target))
    throw new Error('Choose --add-macos or --add-windows.')
  const read = async (name) => {
    let value
    try {
      value = await readFile(await safe(root, name), 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    original.set(name, value)
    return value
  }
  const pkg = JSON.parse(await read('package.json'))
  const raw = await read('mavis.config.json')
  const prior = raw ? migrateConfig(JSON.parse(raw)) : {}
  if (prior.mode === 'portable' || prior.apps?.macos?.toolkit === 'swiftui')
    throw new Error(
      'This project uses the SwiftUI compiler. It is preserved; create a separate NativeScript desktop project or select --add-macos --macos-runtime swiftui.',
    )
  const manager =
    options.packageManager ??
    prior.packageManager ??
    pkg.packageManager?.split('@')[0] ??
    detectPackageManager()
  const commands = packageCommands(manager)
  const destination = `apps/${target}`
  const marker = `${destination}/mavis.host.json`
  const previous = await read(marker)
  if (previous) {
    const state = JSON.parse(previous)
    if (
      state.kind !== 'nativescript-desktop' ||
      state.target !== target ||
      (options.entry && state.entry !== options.entry)
    )
      throw new Error(`${destination} already belongs to another host configuration.`)
    return {
      root,
      original,
      files,
      destination,
      entry: state.entry,
      manager,
      diagnostics,
      alreadyAdded: true,
    }
  }
  try {
    await lstat(await safe(root, destination))
    throw new Error(`${destination} already exists; no files were changed.`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const manifests = [pkg]
  for (const name of [
    'apps/web/package.json',
    'apps/mobile/package.json',
    'apps/macos/package.json',
    'apps/windows/package.json',
  ]) {
    const value = await read(name)
    if (value) manifests.push(JSON.parse(value))
  }
  const dependencies = manifests.map((pkg) => ({ ...pkg.devDependencies, ...pkg.dependencies }))
  if (
    !dependencies.some(
      (dep) =>
        dep['@getcortexlabs/mavis-web'] ||
        dep['@getcortexlabs/mavis'] ||
        dep['@getcortexlabs/mavis-core'],
    )
  )
    throw new Error('Desktop adoption needs an existing Mavis Vue project.')
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
          `Align ${name} with this creator (${versions.mavis}) before adding desktop.`,
        )
  let roots = options.roots ?? prior.portability?.roots
  if (!roots) {
    roots = []
    for (const candidate of ['shared', 'src/shared', 'app/shared']) {
      try {
        if ((await lstat(await safe(root, candidate))).isDirectory()) roots.push(candidate)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
  }
  if (roots.length !== 1)
    throw new Error('Choose one --shared-root for the desktop entry and its shared imports.')
  const sourceRoot = roots[0]
  await safe(root, sourceRoot)
  const entry =
    options.entry ?? `${sourceRoot}/${prior.example === 'directory' ? 'Directory' : 'Welcome'}.vue`
  if (!entry.endsWith('.vue') || !(await read(entry)))
    throw new Error('Choose an existing Vue component with --entry path/to/App.vue.')
  const sources = new Map()
  const inspect = async (folder) => {
    for (const item of await readdir(await safe(root, folder), { withFileTypes: true })) {
      const name = posix(join(folder, item.name))
      await safe(root, name)
      if (item.isDirectory()) {
        if (!['node_modules', '.git', 'dist'].includes(item.name)) await inspect(name)
      } else if (/\.(vue|ts|js|mjs)$/.test(name)) sources.set(name, await read(name))
    }
  }
  await inspect(sourceRoot)
  const entryRelative = relative(resolve(root, sourceRoot), resolve(root, entry))
  if (entryRelative.startsWith('..') || isAbsolute(entryRelative))
    throw new Error('--entry must be inside --shared-root.')
  for (const [file, source] of sources) {
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]#mavis['"]/g))
      for (const name of match[1].split(',').map((name) => name.trim().split(/\s+as\s+/)[0]))
        if (!(name in desktopComponents))
          diagnostics.push(`${file}: ${name} is outside the NativeScript desktop subset.`)
    if (!file.endsWith('.vue')) continue
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length) throw errors[0]
    const visit = (node) => {
      if (node.type === 1) {
        const key = Object.keys(desktopComponents).find(
          (name) =>
            name === node.tag ||
            name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase()) === node.tag,
        )
        if (key) {
          const component = desktopComponents[key]
          const props = [
            'id',
            'key',
            'ref',
            'accessibilityLabel',
            ...component.props,
            ...(component[target] ?? []),
          ]
          for (const prop of node.props) {
            let name = prop.name
            if (prop.type === 7) {
              if (['if', 'else', 'else-if', 'for', 'once', 'memo'].includes(name)) continue
              if (name === 'model' && !prop.arg && !prop.modifiers.length) {
                name = 'modelValue'
              } else if (name === 'bind' && prop.arg?.isStatic) name = prop.arg.content
              else if (name === 'on' && prop.arg?.isStatic)
                name = 'on' + prop.arg.content[0].toUpperCase() + prop.arg.content.slice(1)
              else {
                diagnostics.push(
                  `${file}:${prop.loc.start.line}: dynamic bindings or directive v-${name} need an explicit desktop implementation.`,
                )
                continue
              }
            }
            if (!props.includes(name))
              diagnostics.push(
                `${file}:${prop.loc.start.line}: ${key}.${name} is outside the ${target} subset.`,
              )
          }
        } else if (/^m[-A-Z]/.test(node.tag))
          diagnostics.push(
            `${file}:${node.loc.start.line}: ${node.tag} is not implemented on desktop.`,
          )
      }
      for (const child of node.children ?? []) visit(child)
    }
    if (descriptor.template?.ast) visit(descriptor.template.ast)
  }
  if (diagnostics.length)
    throw new Error(
      `Desktop adoption cannot reuse these sources yet:\n${diagnostics.join('\n')}\nNo files changed. Keep the existing app and adapt a separate shared entry to the declared subset.`,
    )
  const name = String(prior.name ?? pkg.name ?? 'mavis-app')
    .replace(/^@[^/]+\//, '')
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 64)
  const directory =
    prior.example === 'directory' &&
    entry.endsWith('/Directory.vue') &&
    sources.has(`${sourceRoot}/routes.ts`)
  const preset = {
    name,
    theme: prior.theme ?? 'mavis',
    packageManager: manager,
    example: directory ? 'directory' : 'welcome',
  }
  const hostFiles = await desktopHostFiles(
    preset,
    target,
    copyTemplate,
    posix(relative(resolve(root, destination), resolve(root, sourceRoot))),
  )
  if (!directory) {
    hostFiles.set(
      'src/main.ts',
      `import { createHost } from '#desktop-host'\nimport { desktopRenderer } from './renderer'\nimport Entry from '#shared-ui/${posix(entryRelative)}'\nlet app\nconst host = createHost({ title: ${JSON.stringify(name)}, onClose() { app?.unmount() } })\napp = desktopRenderer(host).createApp(Entry)\n// Install application-specific providers and routing here before mounting.\nhost.setTheme(${JSON.stringify(preset.theme)} === 'midnight')\napp.mount(host.root)\nhost.show()\n`,
    )
    diagnostics.push(
      `Review ${destination}/src/main.ts to install any application-specific providers or router before mounting.`,
    )
  }
  hostFiles.set(
    'mavis.host.json',
    json({ schemaVersion: 1, kind: 'nativescript-desktop', target, entry }),
  )
  for (const [path, value] of hostFiles) {
    const file = posix(join(destination, path))
    if ((await read(file)) !== undefined) throw new Error(`Refusing to overwrite ${file}.`)
    files.set(file, value)
  }
  const scripts = {
    [target]: commands.run('dev', destination),
    [`build:${target}`]: commands.run('build', destination),
    [`package:${target}`]: commands.run('package', destination),
  }
  for (const [key, value] of Object.entries(scripts))
    if (pkg.scripts?.[key] && pkg.scripts[key] !== value)
      throw new Error(`The existing ${key} script conflicts with this host.`)
  files.set('package.json', json({ ...pkg, scripts: { ...pkg.scripts, ...scripts } }))
  const targets = targetNames.filter(
    (name) =>
      name === target ||
      prior.targets?.includes(name) ||
      (name === 'web' && dependencies.some((dep) => dep['@getcortexlabs/mavis-web'])) ||
      (name === 'native' && dependencies.some((dep) => dep['@getcortexlabs/mavis'])),
  )
  files.set(
    'mavis.config.json',
    json({
      ...prior,
      schemaVersion: 2,
      name,
      targets,
      framework: 'vue',
      authoring: 'vue',
      mode: 'direct',
      execution: 'components',
      packageManager: manager,
      ...(targets.includes('macos') ? { macosRuntime: 'appkit' } : {}),
      apps: {
        ...prior.apps,
        [target]: {
          toolkit: target === 'macos' ? 'nativescript-appkit' : 'nativescript-xaml',
          framework: 'vue',
          runtime: target === 'macos' ? versions.macosNodeApi : versions.windowsNapi,
        },
      },
      desktop: { ...prior.desktop, existing: true },
      versions: { ...prior.versions, ...versions },
    }),
  )
  return { root, original, files, destination, entry, manager, diagnostics, alreadyAdded: false }
}

export const applyDesktop = applyMacos
