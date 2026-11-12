// The portable model: what every front end produces and the generators read. Nothing here
// knows an authoring format.
//
//   model      { records, modules, components }
//   record     { name, fields: [{ name, type }] }
//   module     { name, path, constants, functions }: a shared .ts file, by its file name
//     constants  [{ name, type, init, exported }]
//     functions  [{ name, params: [{ name, type }], returns, body, exported }]: they compute a
//                value and change nothing; body ends every path with { s: 'return', value }
//   component  { name, path, imports, props, slots, state, getters, actions, refs, view }
//     imports  Map of the shared components it shows: name → path
//     props    [{ name, type, default? }]; a function type is a callback the parent listens to
//     slots    [{ name, params: [{ name, type }] }]: content the parent can pass, 'default' last;
//              params are what a scoped slot hands that content
//     state    [{ name, type, init }]
//     getters  [{ name, type, locals, expr }]
//     actions  [{ name, params: [{ name, type }], body, async?, throws? }]; an async one can
//              wait: { s: 'action', await: true } for another async action, { s: 'commit', ref,
//              body, into? } for a refresh context's commit; { s: 'try', body, catch, finally }
//     refs     [{ name }], fields an action can move focus to
//   view       element | text | show | for | component | slot (tree.mjs walks them)
//     component  { v, name, props, slots: [{ name, params, body }], keyed }: params are the
//                slot's params in their order, by the name the content gives them
//                ({ param, name, type, unused? })
//     slot       { v, name, args: [{ name, value }], fallback }: where the parent's content goes;
//                fallback shows when the parent passed none
//   type       T below; expressions carry theirs as { e, type, ... } and statements are { s, ... }
//     { e: 'const', module, name } reads a module's constant and { e: 'invoke', module, name,
//     args } calls one of its functions; module is the module's name

export class PortableError extends Error {
  /** diagnostics: [{ file, line?, column?, message }], one per place that has to change. */
  constructor(message, diagnostics = []) {
    super(message)
    this.diagnostics = diagnostics
  }
}

const place = ({ file, line, column }) => (line ? `${file}:${line}:${column}` : file)

/**
 * What a shared module is called in each output, from its file: shared/price-list.ts is the
 * module price-list, PriceListModule in Swift and mavisPriceList where generated Vue imports it.
 */
export function moduleNames(name) {
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return { name, swift: `${pascal}Module`, js: `mavis${pascal}` }
}

/** One error for everything that was found, each as file:line:column: message. */
export const failure = (diagnostics) =>
  new PortableError(
    diagnostics
      .map((item) => (item.file ? `${place(item)}: ${item.message}` : item.message))
      .join('\n'),
    diagnostics,
  )

/** Types the generators understand. Numbers are JavaScript numbers, Double in Swift. */
export const T = {
  string: { k: 'string' },
  number: { k: 'number' },
  boolean: { k: 'boolean' },
  void: { k: 'void' },
  record: (name) => ({ k: 'record', name }),
  array: (of) => ({ k: 'array', of }),
  optional: (of) => ({ k: 'optional', of }),
  fn: (params) => ({ k: 'function', params }),
  /** What MRefreshControl hands the function it runs: cancelled, signal.aborted and commit. */
  refresh: { k: 'refresh' },
}
export const sameType = (a, b) => JSON.stringify(a) === JSON.stringify(b)
export const primitive = (type) => ['string', 'number', 'boolean'].includes(type.k)
export const describe = (type) =>
  type.k === 'record'
    ? type.name
    : type.k === 'array'
      ? `${describe(type.of)}[]`
      : type.k === 'optional'
        ? `${describe(type.of)} | undefined`
        : type.k === 'function'
          ? `(${type.params.map(describe).join(', ')}) => void`
          : type.k

// Swift keywords that cannot name a declaration, plus SwiftUI names a View member would shadow.
const swiftReserved = new Set(
  'associatedtype class deinit enum extension fileprivate func import init inout internal let operator private precedencegroup protocol public rethrows static struct subscript typealias var break case catch continue default defer do else fallthrough for guard if in repeat return throw switch where while Any as await false is nil self Self super throws true try body View State Binding Text Button Color Font Double String Bool Int Array Optional ForEach VStack HStack EmptyView'.split(
    ' ',
  ),
)
const jsReserved = new Set(['state', 'props', 'undefined', 'Math'])

/** Why a name cannot be declared in every generated target, or undefined when it can. */
export function nameProblem(name) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) return 'needs a simple letters-and-digits name.'
  if (swiftReserved.has(name) || jsReserved.has(name) || /^mavis/i.test(name))
    return 'collides with a reserved word in a generated target.'
}

/** Why a slot cannot have this name, or undefined when it can. */
export function slotProblem(name) {
  if (name !== 'default') return nameProblem(name)
}

/** The components and records of every front end as one model, with the rules they share. */
export function assemble(components, records, root, modules = []) {
  const paths = new Map()
  for (const component of components) {
    const other = paths.get(component.name)
    if (other)
      throw failure([
        { file: component.path, message: `${component.name} is already defined by ${other}.` },
      ])
    paths.set(component.name, component.path)
  }
  if (!paths.has(root))
    throw failure([
      {
        file: `shared/${root}`,
        message: `The root component ${root} is missing; add shared/${root}.lite.tsx or shared/${root}.vue.`,
      },
    ])
  for (const record of records)
    if (paths.has(record.name))
      throw new PortableError(`${record.name} is both a record type and a component; rename one.`)
  const taken = new Map([...paths, ...records.map((record) => [record.name, 'a record type'])])
  for (const module of modules) {
    const { swift } = moduleNames(module.name)
    if (taken.has(swift))
      throw failure([
        {
          file: module.path,
          message: `This module is ${swift} on the Mac, the name ${taken.get(swift)} already has; rename one.`,
        },
      ])
    taken.set(swift, module.path)
  }
  return { records, modules, components }
}
