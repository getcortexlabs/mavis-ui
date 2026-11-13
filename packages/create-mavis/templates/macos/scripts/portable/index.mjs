import { createHash } from 'node:crypto'
import { readdir, readFile, lstat } from 'node:fs/promises'
import { join, relative, sep, resolve, isAbsolute, posix } from 'node:path'
import { componentName } from './source-paths.mjs'
import { prelude } from './program.mjs'
import { PortableError, failure } from './model.mjs'
import { inspect, isShared, readModel } from './frontends/index.mjs'
import { isScreen } from './components/index.mjs'
import { checkAssets } from './components/assets.mjs'
import {
  emitVue,
  emitVueNativeRuntime,
  emitVueRuntime,
  emitVueTypes,
  usesRuntime,
} from './emit-vue.mjs'
import { SwiftEmitter, runtime, slotRuntime, themeTokens } from './emit-swift.mjs'
import { moduleNames } from './model.mjs'
import { emitNavigation, emitRoutes } from './navigation/emit.mjs'
import { valueRuntime } from './values-swift.mjs'
import { swiftStores } from './stores-swift.mjs'
import { lifetimeRuntime, ownsLifetime } from './lifetime-swift.mjs'

export { PortableError, isScreen }
export const compilerName = 'Mavis portable compiler (experimental)'

const sha = (text) => createHash('sha256').update(text).digest('hex')

/** Components and modules, recursively, from explicitly selected project folders. */
export async function readShared(projectRoot, { roots = ['shared'] } = {}) {
  if (
    !Array.isArray(roots) ||
    !roots.length ||
    roots.some((root) => typeof root !== 'string' || !root)
  )
    throw new PortableError('portability.roots must contain project-relative directories.')
  const files = new Map(),
    root = resolve(projectRoot)
  async function visit(path) {
    if ((await lstat(path)).isSymbolicLink())
      throw new PortableError(`Shared sources cannot follow a symlink: ${relative(root, path)}.`)
    for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (entry.name.startsWith('.') || ['node_modules', 'assets'].includes(entry.name)) continue
      const absolute = join(path, entry.name),
        name = relative(root, absolute).split(sep).join('/')
      if (entry.isSymbolicLink())
        throw new PortableError(`Shared sources cannot follow a symlink: ${name}.`)
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile() && isShared(name)) files.set(name, await readFile(absolute, 'utf8'))
    }
  }
  for (const directory of roots) {
    if (isAbsolute(directory) || directory.includes('\\') || directory.split('/').includes('..'))
      throw new PortableError('portability.roots must stay inside the project.')
    const path = resolve(root, directory),
      rel = relative(root, path)
    if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`))
      throw new PortableError('portability.roots must stay inside the project.')
    // Check every ancestor, not only the final source folder.
    let current = root
    for (const part of rel.split(sep).filter(Boolean)) {
      current = join(current, part)
      if ((await lstat(current)).isSymbolicLink())
        throw new PortableError(
          `Shared sources cannot follow a symlink: ${relative(root, current)}.`,
        )
    }
    await visit(path)
  }
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * The files of a project's shared/assets folder, by their path inside it: the pictures a screen
 * names ~/assets/name.png. Each app carries a copy.
 */
export async function readAssets(projectRoot) {
  const folder = join(projectRoot, 'shared', 'assets')
  const entries = await readdir(folder, { recursive: true, withFileTypes: true }).catch(() => [])
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => relative(folder, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort()
}

/**
 * Whether each shared file can be compiled for the Mac, and why not: its problems as
 * { line, column, message }, or the file it shows that has problems of its own. `theme` is a
 * Mavis theme object; nothing is generated.
 */
export async function checkShared(files, theme) {
  const { problems, waiting } = await inspect(files, theme)
  return [...files.keys()].sort().map((file) => {
    const own = problems
      .filter((problem) => problem.file === file)
      .map(({ line, column, message }) => ({ line, column, message }))
    if (waiting.has(file))
      own.push({
        message: `It ${/\.ts$/.test(waiting.get(file)) ? 'uses' : 'shows'} ${waiting.get(file)}, which is not ready for the Mac.`,
      })
    return { file, ready: !own.length, problems: own }
  })
}

/**
 * Checks the shared sources and produces Vue for the Web (vue) and NativeScript (native) and
 * SwiftUI files. Nothing is written
 * here; callers replace generated files only after the whole project compiled.
 *
 * files: Map<'shared/Name.lite.tsx' | 'shared/Name.vue' | 'shared/name.ts', source text>
 *
 * A shared module (name.ts) runs on the Web and NativeScript as written; generated Vue imports
 * it from `shared`, the alias both hosts give the shared folder.
 *
 * A component whose format already runs on a target (a Vue file on the Web and NativeScript)
 * gets no file there; `direct` lists those sources so the hosts import them as written.
 *
 * assets: the files of shared/assets, as readAssets lists them. With it, a source that names a
 * file the folder does not have fails where it is written.
 */
export async function compileProject(
  files,
  {
    theme = 'mavis',
    root = 'Welcome',
    namespace,
    shared = '#shared-ui',
    sourceRoot = 'shared',
    destinations,
    assets,
  } = {},
) {
  const core = await import('@getcortexlabs/mavis-core')
  if (!['mavis', 'midnight'].includes(theme)) throw new PortableError('Unknown starter theme.')
  const tokenTheme = core[theme]
  if (/[/\\]|\.(vue|lite\.tsx)$/.test(root)) {
    if (!files.has(root))
      throw new PortableError(`The configured entry ${root} is not in portability.roots.`)
    root = componentName(root)
  }
  const { model, formats } = await readModel(files, tokenTheme, root)
  const modulePaths = new Map(
    model.modules.map((module) => [
      module.name,
      posix.relative(sourceRoot, module.path).replace(/\.ts$/, ''),
    ]),
  )
  if (assets) checkAssets(model, assets)
  const runsAsWritten = (component, target) =>
    Boolean(formats.get(component.name).direct?.includes(target))
  const generated = (target) =>
    model.components.filter((component) => !runsAsWritten(component, target))

  const header = (path) =>
    `Generated by the ${compilerName} from ${path} (sha256 ${sha(files.get(path))}). Do not edit.`
  const typesHeader = `Generated by the ${compilerName}; types from ${[...files.keys()].sort().join(', ')}. Do not edit.`
  const vue = new Map()
  const native = new Map()
  const swift = new Map()
  const swiftEmitter = new SwiftEmitter(model)
  const {
    tokens,
    source: tokenSource,
    controls,
  } = themeTokens(tokenTheme, {
    mavis: core.mavis,
    midnight: core.midnight,
  })
  for (const component of model.components) {
    if (!runsAsWritten(component, 'web'))
      vue.set(
        `${component.name}.vue`,
        emitVue(component, header(component.path), { shared, modulePaths }),
      )
    if (!runsAsWritten(component, 'native'))
      native.set(
        `${component.name}.vue`,
        emitVue(component, header(component.path), { target: 'native', shared, modulePaths }),
      )
    swift.set(
      `${component.name}.swift`,
      swiftEmitter.component(component, tokens, header(component.path), namespace),
    )
  }
  if (generated('web').length) vue.set('types.ts', emitVueTypes(model.records, typesHeader))
  if (generated('native').length) native.set('types.ts', emitVueTypes(model.records, typesHeader))
  if (generated('web').some((component) => usesRuntime(component.view)))
    vue.set('runtime.ts', emitVueRuntime(`Generated by the ${compilerName}. Do not edit.`))
  if (generated('native').some((component) => usesRuntime(component.view, 'native')))
    native.set(
      'runtime.ts',
      emitVueNativeRuntime(`Generated by the ${compilerName} for NativeScript. Do not edit.`),
    )
  swift.set('MavisTypes.swift', swiftEmitter.types(model.records, typesHeader, namespace))
  // A module with values is a Swift file of its own; one with types only leaves no trace.
  for (const module of model.modules)
    if (module.constants.length || module.functions.length)
      swift.set(
        `${moduleNames(module.name).swift}.swift`,
        swiftEmitter.module(module, header(module.path), namespace),
      )
  // The route table: the Mac's navigation, and for hosts whose screens are generated the same
  // table with those files. Screens that run as written keep the table as written too.
  const { navigation } = model
  if (navigation) {
    swift.set(
      'MavisNavigation.swift',
      emitNavigation(
        navigation,
        model,
        swiftEmitter,
        header(navigation.path),
        namespace,
        destinations,
      ),
    )
    const opened = [...new Set(navigation.routes.map((route) => route.component))]
    for (const [target, output] of [
      ['web', vue],
      ['native', native],
    ]) {
      const written = opened.filter((name) => formats.get(name).direct?.includes(target))
      if (written.length && written.length < opened.length)
        throw failure([
          {
            file: navigation.path,
            message: `A route table opens screens of one format: ${written.join(', ')} run as written, and the others are generated.`,
          },
        ])
      if (!written.length) output.set('routes.ts', emitRoutes(navigation, header(navigation.path)))
    }
  }
  const stores = swiftStores(
    swiftEmitter,
    model,
    `Generated by the ${compilerName} from the stores of the shared modules. Do not edit.`,
    namespace,
  )
  if (stores) swift.set('MavisStores.swift', stores)
  if (model.components.some(ownsLifetime)) swift.set('MavisLifetime.swift', lifetimeRuntime)
  swift.set('MavisRuntime.swift', `// Generated by the ${compilerName}. Do not edit.\n${runtime}`)
  swift.set(
    'MavisValues.swift',
    `// Generated by the ${compilerName}. Do not edit.\n${valueRuntime}`,
  )
  if (model.components.some((component) => component.slots.length))
    swift.set(
      'MavisSlots.swift',
      `// Generated by the ${compilerName}. Do not edit.\n${slotRuntime}`,
    )
  swift.set(
    'MavisControls.swift',
    `// Generated by the ${compilerName} for the ${theme} theme. Do not edit.\n${controls}`,
  )
  swift.set(
    'MavisTokens.swift',
    `// Generated by the ${compilerName} for the ${theme} theme. Do not edit.\n${tokenSource}`,
  )
  const direct = model.components
    .filter((component) => formats.get(component.name).direct?.length)
    .map((component) => component.path)
  // Ambient types so editors check shared/ the same way (see tsconfig.json).
  return { model, vue, native, swift, direct, environment: prelude(tokenTheme) }
}
