// A front end reads one authoring format into the portable model (see model.mjs). The
// generators only ever see that model, so a format is added here and nowhere else:
//
//   name       what messages call the format
//   extension  the shared files it reads: a component Name is shared/Name + extension
//   direct     the targets that run its files as written; nothing is generated for those
//   prepare    for a format that is not TypeScript: async (files, theme) → { sources, ambient,
//              origins, problems }. sources is the TypeScript the checker reads for each file,
//              path → { file, text }, with where its positions come from (see createProgram);
//              problems lists what it cannot read, before a type is checked
//   open       (reader, sourceFile, path) → { component, link(find), finish(find) }: the
//              component's name and properties first, so that other files can use it; link
//              checks what it imports and finish reads the rest. find(path) is another file's
//              opened component. reader is the shared TypeScript reader (typescript.mjs)
import { componentName } from '../source-paths.mjs'
import { createProgram } from '../program.mjs'
import { PortableError, assemble, failure } from '../model.mjs'
import { createReader } from './typescript.mjs'
import { isModule, moduleProblems, openModule } from './modules.mjs'
import { isRouteTable, readNavigation } from '../navigation/routes.mjs'
import { storeAmbient } from './stores.mjs'
import { tsx } from './tsx.mjs'
import { vue } from './vue.mjs'

export const frontends = [tsx, vue]

const formatOf = (path) => frontends.find((frontend) => path.endsWith(frontend.extension))

/** Whether a file of a project's shared folder is a source the compiler reads. */
export const isShared = (name) =>
  Boolean(formatOf(name)) || (/\.ts$/.test(name) && !/\.d\.ts$/.test(name))

// A file that shows a component with problems of its own waits for those to be fixed.
class Unread extends Error {
  constructor(path) {
    super(path)
    this.path = path
  }
}

/**
 * Reads every shared file as far as it goes: the components that were read, each problem that
 * was found (the first of a file, or its type errors) and the files that wait for another one.
 */
export async function inspect(files, theme) {
  const names = frontends.map((frontend) => `Name${frontend.extension}`).join(' or ')
  const problems = []
  const unread = new Set()
  const waiting = new Map()
  // Every shared module, in one list: a file another reader takes leaves it here.
  const modules = new Set([...files.keys()].filter(isModule))
  // Modules that stay in the program for the files that import them, but are not read.
  const blocked = new Set()
  // The route table is navigation's: a .ts file that brings in screens is taken out here, before
  // anything reads modules, and read once the components are (navigation/routes.mjs).
  const tables = new Map([...files].filter(([path, text]) => isRouteTable(path, text)))
  files = new Map([...files].filter(([path]) => !tables.has(path)))
  for (const path of tables.keys()) modules.delete(path)
  for (const [path, text] of files) {
    const format = formatOf(path)
    const named = format && /^[A-Z][A-Za-z0-9]*$/.test(componentName(path))
    if (named) continue
    if (modules.has(path)) {
      const refused = moduleProblems(path, text)
      if (refused.length) {
        unread.add(path)
        blocked.add(path)
        problems.push(...refused)
      }
      continue
    }
    unread.add(path)
    problems.push({
      file: path,
      message: /\.ts$/.test(path)
        ? 'A .ts file is a shared module: name it in lowercase, such as types.ts or price-list.ts.'
        : `Shared files are ${names} components, or lowercase .ts modules.`,
    })
  }
  const known = new Map([...files].filter(([path]) => !unread.has(path) || blocked.has(path)))
  const lowered = new Map()
  const ambient = new Map([['shared/__mavis_stores__.d.ts', storeAmbient]])
  const origins = new Map()
  for (const frontend of frontends) {
    const own = new Map([...known].filter(([path]) => formatOf(path) === frontend))
    if (!own.size) continue
    const prepared = (await frontend.prepare?.(own, theme)) ?? {}
    for (const [path, source] of prepared.sources ?? []) {
      lowered.set(path, source)
      if (source.unread) unread.add(path)
    }
    for (const [file, text] of prepared.ambient ?? []) ambient.set(file, text)
    for (const [file, origin] of prepared.origins ?? []) origins.set(file, origin)
    problems.push(...(prepared.problems ?? []))
  }
  const program = createProgram(
    new Map(
      [...known].map(([path, text]) => {
        const source = lowered.get(path)
        return source ? [source.file, source.text] : [path, text]
      }),
    ),
    theme,
    { ambient, origins },
  )
  // A file that does not type-check is not read further; the others still are.
  for (const diagnostic of program.diagnostics) {
    if (!diagnostic.file) throw failure([...problems, ...program.diagnostics])
    if (blocked.has(diagnostic.file)) continue
    unread.add(diagnostic.file)
    problems.push(diagnostic)
  }

  const reader = createReader(program)
  const opened = new Map()
  const attempt = (path, task) => {
    try {
      task()
    } catch (error) {
      unread.add(path)
      opened.delete(path)
      if (error instanceof Unread) return waiting.set(path, error.path)
      if (!(error instanceof PortableError)) throw error
      problems.push(
        ...(error.diagnostics.length ? error.diagnostics : [{ message: error.message }]),
      )
    }
  }
  const find = (path) => {
    if (unread.has(path)) throw new Unread(path)
    return opened.get(path)
  }
  reader.setModules(find)
  // Modules first: what a component reads of them is known before it is read.
  const order = (paths) => [
    ...paths.filter((path) => modules.has(path)),
    ...paths.filter((path) => !modules.has(path)),
  ]
  for (const path of order([...known.keys()].sort())) {
    if (unread.has(path)) continue
    const format = formatOf(path)
    const source = lowered.get(path)
    const file = program.sourceFile(source?.file ?? path)
    if (!file) throw new PortableError(`${path}: Not found.`)
    attempt(path, () =>
      format
        ? opened.set(path, { format, ...format.open(reader, file, path, source) })
        : opened.set(path, openModule(reader, file, path)),
    )
  }
  for (const [path, draft] of [...opened]) attempt(path, () => draft.link(find))
  for (const [path, draft] of [...opened]) attempt(path, () => draft.finish(find))
  // Content passed to a slot is checked against the view of the component it goes to.
  for (const { node, check } of reader.deferred) {
    const path = program.where(node).file
    if (!unread.has(path)) attempt(path, () => check(find))
  }
  const navigation = readNavigation({ reader, tables, opened, unread, attempt, find })
  const read = [...opened.values()]
  return {
    read: read.filter((draft) => draft.component),
    modules: read.filter((draft) => draft.module).map((draft) => draft.module),
    navigation,
    records: reader.finish(),
    services: reader.services(),
    problems,
    waiting,
  }
}

/**
 * The portable model of a project's shared files, and the front end each component came from.
 * Every file is read before failing, so the error lists each file's first problem.
 */
export async function readModel(files, theme, root) {
  const { read, modules, navigation, records, services, problems } = await inspect(files, theme)
  if (problems.length) throw failure(problems)
  const model = assemble(
    read.map((draft) => draft.component),
    records,
    // With a route table the app opens the screen at /.
    navigation ? navigation.home : root,
    modules,
    services,
  )
  return {
    model: navigation ? { ...model, navigation } : model,
    formats: new Map(read.map((draft) => [draft.component.name, draft.format])),
  }
}
