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
import { createProgram } from '../program.mjs'
import { PortableError, assemble, failure } from '../model.mjs'
import { createReader } from './typescript.mjs'
import { tsx } from './tsx.mjs'
import { vue } from './vue.mjs'

export const frontends = [tsx, vue]

const formatOf = (path) => frontends.find((frontend) => path.endsWith(frontend.extension))
const typeFile = /^shared\/[a-z][A-Za-z0-9]*\.ts$/

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
  for (const path of files.keys()) {
    const format = formatOf(path)
    const named =
      format && /^shared\/[A-Z][A-Za-z0-9]*$/.test(path.slice(0, -format.extension.length))
    if (named || typeFile.test(path)) continue
    unread.add(path)
    problems.push({
      file: path,
      message: /\.ts$/.test(path)
        ? 'A .ts file holds shared record types, under a lowercase name without dashes such as types.ts. Modules with values (stores, services) do not reach the Mac yet.'
        : `Shared files are ${names} components, or lowercase .ts type files.`,
    })
  }
  const known = new Map([...files].filter(([path]) => !unread.has(path)))
  const lowered = new Map()
  const ambient = new Map()
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
  for (const path of [...known.keys()].sort()) {
    if (unread.has(path)) continue
    const format = formatOf(path)
    const source = lowered.get(path)
    const file = program.sourceFile(source?.file ?? path)
    if (!file) throw new PortableError(`${path}: Not found.`)
    attempt(path, () =>
      format
        ? opened.set(path, { format, ...format.open(reader, file, path, source) })
        : reader.readTypesFile(file),
    )
  }
  for (const [path, draft] of [...opened]) attempt(path, () => draft.link(find))
  for (const [path, draft] of [...opened]) attempt(path, () => draft.finish(find))
  // Content passed to a slot is checked against the view of the component it goes to.
  for (const { node, check } of reader.deferred) {
    const path = program.where(node).file
    if (!unread.has(path)) attempt(path, () => check(find))
  }
  return { read: [...opened.values()], records: reader.finish(), problems, waiting }
}

/**
 * The portable model of a project's shared files, and the front end each component came from.
 * Every file is read before failing, so the error lists each file's first problem.
 */
export async function readModel(files, theme, root) {
  const { read, records, problems } = await inspect(files, theme)
  if (problems.length) throw failure(problems)
  return {
    model: assemble(
      read.map((draft) => draft.component),
      records,
      root,
    ),
    formats: new Map(read.map((draft) => [draft.component.name, draft.format])),
  }
}
