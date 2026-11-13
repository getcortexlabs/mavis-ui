// A shared module: a lowercase .ts file beside the components, with the types, constants and
// functions they share. Its functions compute values and change nothing, so the same file runs
// on the Web and NativeScript as written and reaches the Mac as Swift.
import ts from 'typescript'
import { contractImports } from '../contract-types.mjs'
import { T, moduleNames } from '../model.mjs'
import { accessorOf, isStore, keyOf, openStore } from './stores.mjs'

// What a module takes from vue: the pieces a store is made of.
const vueNames = ['ref', 'computed', 'readonly', 'inject', 'InjectionKey', 'Ref', 'ComputedRef']

const moduleFile = /^shared\/[a-z][A-Za-z0-9]*(?:-[a-z0-9]+)*\.ts$/
const what =
  'A shared module declares types, constants (export const) and functions that compute a value (export function).'

/** Whether a path of the shared folder is a module. */
export const isModule = (path) => moduleFile.test(path)

/** Why a module cannot import that, or undefined when it can. */
function importProblem(statement) {
  const from = statement.moduleSpecifier.text
  const allowed = contractImports().get(from)
  if (allowed) {
    const clause = statement.importClause
    const named = clause?.namedBindings
    if (
      !clause?.name &&
      named &&
      ts.isNamedImports(named) &&
      named.elements.length &&
      named.elements.every(
        (element) =>
          (clause.isTypeOnly || element.isTypeOnly) &&
          allowed.includes((element.propertyName ?? element.name).text),
      )
    )
      return undefined
    return `${from} only provides named type-only host contracts to shared modules: ${allowed.join(', ')}.`
  }
  if (from === 'vue') {
    const named = statement.importClause?.namedBindings
    const other =
      named && ts.isNamedImports(named) && !statement.importClause.name
        ? named.elements.find(
            (element) => !vueNames.includes((element.propertyName ?? element.name).text),
          )
        : statement
    if (!other) return undefined
    return ts.isImportSpecifier(other)
      ? `${(other.propertyName ?? other.name).text} from vue does not reach the Mac in a shared module: a store is made of ref, computed, readonly and inject (#340 tracks effects).`
      : 'Import what a store needs from vue by name: ref, computed, readonly, inject.'
  }
  if (/\.(vue|lite|lite\.tsx)$/.test(from))
    return `${from} is a component: a shared module holds values and functions. A table of routes reaches the Mac with navigation (#341).`
  if (!from.startsWith('./') || from.slice(2).includes('/'))
    return `${from} is not available to a shared module on the Mac: it imports other modules of the shared folder, as ./name.`
}

/**
 * What stops a module before its types are checked: imports from outside the shared modules,
 * as [{ file, line, column, message }].
 */
export function moduleProblems(path, text) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  return file.statements.flatMap((statement) => {
    const message = ts.isImportDeclaration(statement) && importProblem(statement)
    if (!message) return []
    const { line, character } = file.getLineAndCharacterOfPosition(statement.getStart(file))
    return [{ file: path, line: line + 1, column: character + 1, message }]
  })
}

/** Whether statements leave through a return on every path. */
const returns = (statements) => {
  const last = statements.at(-1)
  if (!last) return false
  if (last.s === 'return') return true
  if (last.s === 'if' || last.s === 'iflet') return returns(last.then) && returns(last.else)
  return false
}

/**
 * Opens one module: what it declares first, from the checker's types, so that every other file
 * can use it; finish reads its values and bodies.
 */
export function openModule(reader, file, path) {
  const { checker, fail, checkName, mapType, typeOf } = reader
  reader.lenient.add(file.fileName)
  const { name } = moduleNames(path.slice('shared/'.length, -'.ts'.length))
  const module = { name, path, constants: [], functions: [], stores: [] }
  const members = new Map()
  const imports = []
  const pending = []
  // Keys by name, each with the function that makes the store it carries.
  const keys = new Map()
  const drafts = []
  const accessors = []
  const dialect = {
    nullish: true,
    truthy: true,
    name(node) {
      fail(
        node,
        `${node.text} is not available here. A module reads its own constants and functions, the ones it imports from other modules, parameters and locals.`,
      )
    },
    member() {},
    target(node) {
      fail(node, 'A module has no state to change: its functions compute values.')
    },
    effect() {},
    unknownEffect(node) {
      fail(node, 'A function of a module computes a value and changes nothing: return the result.')
    },
  }
  const within = (mode) => reader.scope(module, members, mode, dialect)
  const declare = (node, memberName, entry) => {
    checkName(node, memberName, entry.kind === 'function' ? 'Function' : 'Constant')
    if (members.has(memberName)) fail(node, `${memberName} is already declared in this module.`)
    members.set(memberName, { module: name, name: memberName, ...entry })
  }
  const exported = (statement) =>
    Boolean(statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))

  function constant(statement, declaration) {
    if (!ts.isIdentifier(declaration.name))
      fail(declaration, 'Declare one constant by name: export const name = value.')
    if (!declaration.initializer) fail(declaration, 'Give this constant a value.')
    const initial = declaration.initializer
    const carried = keyOf(declaration, checker)
    if (carried) return keys.set(declaration.name.text, carried)
    if (ts.isArrowFunction(initial) || ts.isFunctionExpression(initial))
      return callable(declaration.name, initial, exported(statement))
    // [...] as const satisfies readonly Stay[] is a list of Stay.
    let typed = initial
    while (ts.isParenthesizedExpression(typed)) typed = typed.expression
    const type = declaration.type
      ? typeOf(declaration.name)
      : ts.isSatisfiesExpression(typed)
        ? mapType(checker.getTypeFromTypeNode(typed.type), typed.type)
        : typeOf(declaration.name)
    if (type.k === 'function' || type.k === 'void')
      fail(declaration, 'A constant holds a value; declare a function with export function.')
    const entry = { name: declaration.name.text, type, init: null, exported: exported(statement) }
    declare(declaration.name, entry.name, { kind: 'constant', type })
    module.constants.push(entry)
    pending.push(() => (entry.init = reader.expr(initial, within('initializer'), type)))
  }

  function callable(nameNode, fn, isExported) {
    if (fn.asteriskToken || fn.typeParameters)
      fail(nameNode, 'A function of a module is a plain function: no generics or generators.')
    if (!fn.body) fail(nameNode, 'Give this function a body.')
    const keyed = file.statements.some(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (declaration) => keyOf(declaration, checker) === nameNode.text,
        ),
    )
    if (isStore(fn, keyed)) {
      const draft = openStore(reader, module, nameNode, fn, isExported)
      drafts.push(draft)
      module.stores.push(draft.store)
      reader.stores.set(draft.store.name, draft.store)
      return
    }
    const key = accessorOf(fn)
    if (key) return accessors.push({ node: nameNode, key })
    if (fn.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword))
      fail(
        nameNode,
        'An async function belongs to a store or a component: a function of a module computes a value.',
      )
    const params = fn.parameters.map((parameter) => {
      if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken)
        fail(
          parameter,
          'Function parameters are simple typed names; one that can be left out is name?: type.',
        )
      if (!parameter.type) fail(parameter, 'Give each function parameter a type.')
      checkName(parameter, parameter.name.text, 'Parameter')
      const type = typeOf(parameter.name)
      if (type.k === 'function') fail(parameter, 'A parameter is a value, not a function.')
      return {
        name: parameter.name.text,
        type: parameter.questionToken && type.k !== 'optional' ? T.optional(type) : type,
      }
    })
    const optional = params.findIndex((param) => param.type.k === 'optional')
    if (optional >= 0 && params.slice(optional).some((param) => param.type.k !== 'optional'))
      fail(fn.parameters[optional], 'Parameters that can be left out come last.')
    const result = mapType(
      checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(fn)),
      nameNode,
    )
    if (result.k === 'void')
      fail(
        nameNode,
        `${nameNode.text} returns nothing. A function of a module computes a value: return it.`,
      )
    const entry = { name: nameNode.text, params, returns: result, body: [], exported: isExported }
    declare(nameNode, entry.name, { kind: 'function', params, returns: result })
    module.functions.push(entry)
    pending.push(() => {
      const ctx = { ...within('function'), returns: result }
      params.forEach((param) => ctx.locals.set(param.name, param.type))
      entry.body = ts.isBlock(fn.body)
        ? reader.block(fn.body, ctx)
        : [{ s: 'return', value: reader.expr(fn.body, ctx, result) }]
      if (returns(entry.body)) return
      if (result.k !== 'optional')
        fail(nameNode, `End ${entry.name} with a return: every path gives a value.`)
      entry.body.push({ s: 'return', value: { e: 'undefined', type: result } })
    })
  }

  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const from = statement.moduleSpecifier.text
      const clause = statement.importClause
      const named = clause?.namedBindings
      const refused = importProblem(statement)
      if (refused) fail(statement, refused)
      if (from === 'vue') continue
      if (clause?.isTypeOnly) continue
      if (!clause || clause.name || !named || !ts.isNamedImports(named))
        fail(statement, `Import what you use from ${from} by name: import { name } from '${from}'.`)
      if (named.elements.every((element) => element.isTypeOnly)) continue
      imports.push({ node: statement, path: `shared/${from.slice(2).replace(/\.ts$/, '')}.ts` })
      continue
    }
    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) continue
    if (ts.isVariableStatement(statement)) {
      if (!(statement.declarationList.flags & ts.NodeFlags.Const))
        fail(
          statement,
          'A module has no state of its own: declare constants with const. State belongs to a component.',
        )
      for (const declaration of statement.declarationList.declarations)
        constant(statement, declaration)
      continue
    }
    if (ts.isFunctionDeclaration(statement)) {
      if (
        !statement.name ||
        statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
      )
        fail(statement, 'Export functions by name: export function name(…).')
      callable(statement.name, statement, exported(statement))
      continue
    }
    fail(statement, what)
  }

  // use…(): the store its key carries, for the components that call it.
  for (const { node, key } of accessors) {
    const factory = keys.get(key)
    const store = module.stores.find((each) => each.factory === factory)
    if (!store)
      fail(
        node,
        `${node.text} hands out ${key}, which carries no store of this module: declare const ${key}: InjectionKey<ReturnType<typeof create…>> = Symbol('…').`,
      )
    declare(node, node.text, { kind: 'accessor', store: store.name })
    store.accessor = node.text
    store.key = key
  }
  for (const store of module.stores)
    if (!store.accessor)
      fail(
        file,
        `Give ${store.factory} a key and a function that hands the store to components: export const key: InjectionKey<ReturnType<typeof ${store.factory}>> = Symbol('…') and export function use…() { const store = inject(key); if (!store) throw new Error('…'); return store }.`,
      )

  return {
    module,
    members,
    link(find) {
      for (const { node, path: other } of imports)
        if (!isModule(other) || !find(other)?.module)
          fail(node, `${other} is not a module of the shared folder.`)
    },
    finish() {
      for (const draft of drafts) draft.finish()
      for (const task of pending) task()
    },
  }
}
