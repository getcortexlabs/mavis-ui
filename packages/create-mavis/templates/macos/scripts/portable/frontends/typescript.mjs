// What front ends whose expressions are TypeScript share: named record types, and the
// expressions, statements and Mavis primitives the checker's nodes become in the model. Each
// scope carries a dialect that says how its format names a component's own members:
//
//   name(node, ctx)          what a bare identifier is, or a failure
//   member(node, ctx)        what a property access is when it names a member
//   target(node, ctx)        { name, fields, type } of the state an assignment changes
//   effect(node, ctx)        the statement a call is when it runs an action, callback or field
//   unknownEffect(node, ctx) fails for any other call statement
//   call(node, ctx)          optional: fails for a call an expression cannot make
//   nullish                  null is a missing value, as undefined is
//   truthy                   text and optional values can stand where a condition is expected
//   constants                some names are known while generating (see reader.constant)
import ts from 'typescript'
import { preludePath } from '../program.mjs'
import { components as primitives, isScreen } from '../components/index.mjs'
import { T, describe, failure, nameProblem, primitive, sameType, slotProblem } from '../model.mjs'
import { children, walk } from '../tree.mjs'

// Record types the ambient declarations provide, such as SelectOption, and what each one is.
const builtInRecords = Object.assign(
  {},
  ...Object.values(primitives).map((definition) => definition.records ?? {}),
)

const stringMethods = {
  trim: [[], T.string],
  toLowerCase: [[], T.string],
  toUpperCase: [[], T.string],
  includes: [[T.string], T.boolean],
  startsWith: [[T.string], T.boolean],
  endsWith: [[T.string], T.boolean],
}
const mathFunctions = { min: 2, max: 2, floor: 1, ceil: 1, abs: 1, round: 1 }

const fixed = (e) => e.e === 'lit' && e.fixed
const constant = (value) => ({
  e: 'lit',
  value,
  type: typeof value === 'string' ? T.string : T.boolean,
  fixed: true,
})

export function createReader({ checker, sourceFile, relative, where }) {
  const records = new Map()
  // Files whose format writes null for a missing value.
  const lenient = new Set()
  const fail = (node, message) => {
    throw failure([{ ...where(node), message }])
  }
  const isNull = (node) => node.kind === ts.SyntaxKind.NullKeyword
  const isUndefined = (node) => ts.isIdentifier(node) && node.text === 'undefined'

  function mapType(type, node, options = {}) {
    const nullish = options.nullish ?? lenient.has(node.getSourceFile().fileName)
    const allowFunction = options.allowFunction ?? false
    if (type.flags & ts.TypeFlags.Union) {
      const missing = (part) =>
        part.flags & ts.TypeFlags.Undefined || (nullish && part.flags & ts.TypeFlags.Null)
      if (
        nullish &&
        type.types.some((part) => part.flags & ts.TypeFlags.Null) &&
        type.types.some((part) => part.flags & ts.TypeFlags.Undefined)
      )
        fail(
          node,
          `${checker.typeToString(type)} can be both null and undefined; use one for a missing value.`,
        )
      const parts = type.types.filter((part) => !missing(part))
      const optional = parts.length !== type.types.length
      let inner
      if (parts.every((part) => part.flags & ts.TypeFlags.StringLike)) inner = T.string
      else if (parts.every((part) => part.flags & ts.TypeFlags.BooleanLike)) inner = T.boolean
      else if (parts.every((part) => part.flags & ts.TypeFlags.NumberLike)) inner = T.number
      else if (parts.length === 1) inner = mapType(parts[0], node, { allowFunction, nullish })
      else fail(node, `Unsupported union type ${checker.typeToString(type)}.`)
      return optional ? T.optional(inner) : inner
    }
    if (type.flags & ts.TypeFlags.StringLike) return T.string
    if (type.flags & ts.TypeFlags.NumberLike) return T.number
    if (type.flags & ts.TypeFlags.BooleanLike) return T.boolean
    if (type.flags & ts.TypeFlags.Void) return T.void
    if (checker.isArrayType(type))
      return T.array(mapType(checker.getTypeArguments(type)[0], node, { nullish }))
    if (type.flags & ts.TypeFlags.Object) {
      const signatures = type.getCallSignatures()
      if (signatures.length) {
        if (!allowFunction) fail(node, 'Functions can only be component callback properties.')
        if (signatures.length !== 1) fail(node, 'Callback properties need exactly one signature.')
        const [signature] = signatures
        if (!(signature.getReturnType().flags & ts.TypeFlags.Void))
          fail(node, 'Callback properties must return void.')
        return T.fn(
          signature.parameters.map((parameter) =>
            mapType(checker.getTypeOfSymbolAtLocation(parameter, node), node, { nullish }),
          ),
        )
      }
      const symbol = type.aliasSymbol ?? type.getSymbol()
      const declaration = symbol?.declarations?.[0]
      const named =
        declaration &&
        (ts.isTypeAliasDeclaration(declaration) ||
          ts.isInterfaceDeclaration(declaration) ||
          (ts.isTypeLiteralNode(declaration) && ts.isTypeAliasDeclaration(declaration.parent)))
      if (!named || !relative(declaration.getSourceFile().fileName).startsWith('shared/'))
        fail(
          node,
          `Declare a named record type for ${checker.typeToString(type)}, for example type Task = { id: string }.`,
        )
      const name = ts.isTypeLiteralNode(declaration) ? declaration.parent.name.text : symbol.name
      registerRecord(name, type, declaration, nullish)
      return T.record(name)
    }
    fail(node, `Unsupported type ${checker.typeToString(type)}.`)
  }

  function registerRecord(name, type, declaration, nullish) {
    const builtIn = relative(declaration.getSourceFile().fileName) === preludePath
    if (builtInRecords[name] && !builtIn)
      fail(declaration, `${name} is ${builtInRecords[name]}; give yours another name.`)
    if (records.has(name)) {
      if (records.get(name).declaration !== declaration)
        fail(declaration, `Record type ${name} is declared more than once.`)
      return
    }
    checkName(declaration, name, 'Record type')
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name))
      fail(declaration, `Record type ${name} must be PascalCase.`)
    const record = { name, declaration, fields: [] }
    records.set(name, record)
    for (const property of checker.getPropertiesOfType(type)) {
      const field = property.valueDeclaration ?? property.declarations?.[0]
      checkName(field, property.name, 'Field')
      const fieldType = mapType(checker.getTypeOfSymbolAtLocation(property, field), field, {
        nullish,
      })
      if (fieldType.k === 'function' || fieldType.k === 'void')
        fail(field, 'Record fields hold data, not functions.')
      record.fields.push({ name: property.name, type: fieldType })
    }
  }

  function builtInRecord(name) {
    if (!records.has(name)) {
      const declaration = sourceFile(preludePath).statements.find(
        (statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === name,
      )
      registerRecord(name, checker.getTypeAtLocation(declaration.name), declaration, false)
    }
    return T.record(name)
  }

  function hasControl(node) {
    // A slot shows whatever the parent passes.
    if (node.v === 'component' || node.v === 'slot') return true
    if (node.v === 'element') {
      if (primitives[node.tag].control) return true
      if (node.props.onClick || node.props.onKeyDown) return true
    }
    return [
      ...(node.children ?? []),
      ...(node.then ?? []),
      ...(node.else ?? []),
      ...(node.body ? [node.body] : []),
    ].some(hasControl)
  }

  // A screen is the root of its component's view, as the page it is on the Web and NativeScript.
  function placeScreen(name, ctx, node) {
    if (ctx.parent?.tag === name)
      fail(node, `${name} cannot sit inside another ${name}: a view is one screen.`)
    if (ctx.parent)
      fail(
        node,
        `${name} is a whole screen: make it the root of the component's view, not content of ${ctx.parent.tag}.`,
      )
    if (ctx.inSlot)
      fail(
        node,
        `${name} cannot be content for a slot: a screen is the root of its own component's view.`,
      )
    if (ctx.inShow || ctx.inFor)
      fail(
        node,
        `${name} is the root of the component's view; show or repeat what is inside it instead.`,
      )
  }

  // A component whose view is a screen is a page of its own on NativeScript: the app opens it.
  function useComponent(target, owner, node) {
    deferred.push({
      node,
      check() {
        if (isScreen(target.view))
          fail(
            node,
            `${target.name} is a screen (its view is an ${target.view.tag}), so ${owner.name} cannot show it: the app opens a screen. Move what both share into a component without ${target.view.tag}.`,
          )
      },
    })
  }

  // Content that shows no control, also inside the components it shows; checked once every
  // view is read.
  function withoutControls(body, owner, node, message) {
    const controlled = (nodes, from, find, seen) =>
      nodes.some((item) => {
        if (
          item.v === 'element' &&
          (primitives[item.tag].control || item.props.onClick || item.props.onKeyDown)
        )
          return true
        if (item.v === 'component') {
          const path = from.imports.get(item.name)
          const target = !seen.has(path) && find(path).component
          if (target && controlled([target.view], target, find, new Set([...seen, path])))
            return true
        }
        return controlled(children(item), from, find, seen)
      })
    deferred.push({
      node,
      check(find) {
        if (controlled(body, owner, find, new Set())) fail(node, message)
      },
    })
  }

  function checkName(node, name, what) {
    const problem = nameProblem(name)
    if (problem) fail(node, `${what} ${name} ${problem}`)
  }

  const typeOf = (node, options) => mapType(checker.getTypeAtLocation(node), node, options)

  /**
   * The type a member was declared with. TypeScript narrows a member after a check
   * (count === undefined ? … : count), but the member itself stays optional in every target.
   */
  function declaredType(node) {
    const symbol = checker.getSymbolAtLocation(
      ts.isPropertyAccessExpression(node) ? node.name : node,
    )
    return symbol ? mapType(checker.getTypeOfSymbol(symbol), node) : typeOf(node)
  }

  // How a property's value is read, by the kind its component declares for it.
  const kinds = {
    space({ key, attribute, value, ctx }) {
      if (ts.isStringLiteral(value)) return { lit: value.text }
      if (typeOf(value).k !== 'number')
        fail(attribute, `${key} takes a spacing token name or a number, for example ${key}="md".`)
      return { expr: amount(value, attribute, key, ctx) }
    },
    radius({ key, attribute, value, ctx }) {
      if (ts.isStringLiteral(value)) return { lit: value.text }
      if (typeOf(value).k !== 'number')
        fail(attribute, `${key} takes a radius token name or a number, for example ${key}="md".`)
      return { expr: amount(value, attribute, key, ctx) }
    },
    // A share of the container is a literal: the Mac resolves it when the screen is compiled.
    dimension({ key, attribute, value, ctx }) {
      if (!ts.isStringLiteral(value)) {
        if (typeOf(value).k !== 'number')
          fail(attribute, `${key} takes a number, or a literal such as "50%" or "auto".`)
        return { expr: amount(value, attribute, key, ctx) }
      }
      if (value.text !== 'auto' && !/^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(value.text))
        fail(attribute, `${key} takes a number, or a literal such as "50%" or "auto".`)
      return { lit: value.text }
    },
    factor: ({ key, attribute, value, ctx }) => ({ expr: amount(value, attribute, key, ctx) }),
    color({ key, attribute, value, ctx }) {
      if (!ts.isStringLiteral(value)) return { expr: expr(value, ctx, T.string) }
      if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.text))
        fail(attribute, `${key} takes a hex color every target reads, for example "#F4E9FF".`)
      return { lit: value.text }
    },
    string: ({ value, ctx }) =>
      ts.isStringLiteral(value) ? { lit: value.text } : { expr: expr(value, ctx, T.string) },
    boolean: ({ value, ctx }) => ({ expr: expr(value, ctx, T.boolean) }),
    number: ({ value, ctx }) => ({ expr: expr(value, ctx, T.number) }),
    'optional-string': ({ value, ctx }) => ({ expr: expr(value, ctx, T.optional(T.string)) }),
    handler: ({ value, ctx }) => handler(value, [], ctx),
    'string-handler': ({ value, ctx }) => handler(value, [T.string], ctx),
    key: ({ value, ctx }) => handler(value, [T.string], ctx),
    'boolean-handler': ({ value, ctx }) => handler(value, [T.boolean], ctx),
    'number-handler': ({ value, ctx }) => handler(value, [T.number], ctx),
  }
  /** What an event of each handler kind passes to its listener. */
  const handlerParams = {
    handler: [],
    'string-handler': [T.string],
    key: [T.string],
    'boolean-handler': [T.boolean],
    'number-handler': [T.number],
  }
  // The events a component declares itself (handlers), each read when a source listens to it.
  for (const definition of Object.values(primitives))
    for (const [kind, params] of Object.entries(definition.handlers ?? {})) {
      Object.defineProperty(handlerParams, kind, {
        get: () => params({ T, record: builtInRecord }),
      })
      kinds[kind] = ({ value, ctx }) => handler(value, handlerParams[kind], ctx)
    }

  // A size, spacing or share: never negative. The Web and NativeScript reject it while running.
  function amount(value, attribute, key, ctx) {
    const number = expr(value, ctx, T.number)
    if (number.e === 'lit' && number.value < 0) fail(attribute, `${key} cannot be negative.`)
    return number
  }

  /** A type file: exported type declarations only. */
  function readTypesFile(file) {
    for (const statement of file.statements) {
      if (
        (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
        statement.modifiers?.every((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
      )
        continue
      fail(
        statement,
        'Type files contain only exported type declarations. Modules with values (stores, services) do not reach the Mac yet.',
      )
    }
  }

  function scope(component, members, mode, dialect) {
    return { component, members, mode, dialect, locals: new Map() }
  }
  function child(ctx, mode = ctx.mode) {
    return { ...ctx, mode, locals: new Map(ctx.locals) }
  }

  function local(statement, ctx) {
    if (!ts.isVariableStatement(statement))
      fail(statement, 'Only const declarations are supported here.')
    const list = statement.declarationList
    const [declaration] = list.declarations
    if (
      list.flags !== ts.NodeFlags.Const ||
      list.declarations.length !== 1 ||
      !ts.isIdentifier(declaration.name) ||
      !declaration.initializer
    )
      fail(statement, 'Declare one const name = value at a time.')
    const name = declaration.name.text
    checkName(declaration, name, 'Local')
    const type = typeOf(declaration.name)
    const value = expr(declaration.initializer, ctx, type)
    ctx.locals.set(name, type)
    return { name, type, value }
  }

  function block(node, ctx) {
    if (!ts.isBlock(node))
      return ts.isExpressionStatement(node) ||
        ts.isIfStatement(node) ||
        ts.isReturnStatement(node) ||
        ts.isThrowStatement(node) ||
        ts.isVariableStatement(node)
        ? stmt(node, ctx)
        : [effect(node, ctx)]
    const statements = node.statements
    const out = []
    for (const statement of statements) out.push(...stmt(statement, ctx))
    return out
  }

  function stmt(node, ctx) {
    if (ts.isVariableStatement(node)) return [{ s: 'const', ...local(node, ctx) }]
    if (ts.isReturnStatement(node)) {
      if (node.expression) fail(node, 'Actions and handlers return without a value.')
      return [{ s: 'return' }]
    }
    if (ts.isIfStatement(node)) {
      // Narrow a local optional like TypeScript does: guard-style early return or a checked branch.
      const narrow = narrowing(node.expression, ctx)
      if (narrow?.op === '===' && !node.elseStatement && returnsOnly(node.thenStatement)) {
        ctx.locals.set(narrow.name, narrow.inner)
        return [{ s: 'guard', name: narrow.name }]
      }
      if (narrow?.op === '!==') {
        const inner = child(ctx)
        inner.locals.set(narrow.name, narrow.inner)
        return [
          {
            s: 'iflet',
            name: narrow.name,
            then: block(node.thenStatement, inner),
            else: node.elseStatement ? block(node.elseStatement, child(ctx)) : [],
          },
        ]
      }
      const test = expr(node.expression, ctx, T.boolean)
      const otherwise = () =>
        node.elseStatement
          ? ts.isIfStatement(node.elseStatement)
            ? stmt(node.elseStatement, child(ctx))
            : block(node.elseStatement, child(ctx))
          : []
      // A condition known while generating keeps only the branch that runs.
      if (fixed(test)) return test.value ? block(node.thenStatement, child(ctx)) : otherwise()
      return [{ s: 'if', test, then: block(node.thenStatement, child(ctx)), else: otherwise() }]
    }
    if (ts.isBlock(node)) return block(node, child(ctx))
    if (ts.isExpressionStatement(node)) return [effect(node.expression, ctx)]
    if (ts.isThrowStatement(node)) {
      const made = node.expression
      const args = ts.isNewExpression(made) ? (made.arguments ?? []) : []
      if (!ts.isNewExpression(made) || made.expression.getText() !== 'Error' || args.length > 1)
        fail(node, "A function fails with throw new Error('why').")
      if (!ctx.failing)
        fail(
          node,
          "Only a function of the component can fail: write throw in one and pass it to MRefreshControl's refresh, which shows the failure.",
        )
      return [
        {
          s: 'throw',
          message: args.length
            ? expr(args[0], ctx, T.string)
            : { e: 'lit', value: '', type: T.string },
        },
      ]
    }
    fail(node, 'Supported statements: const, if/else, return, state assignments and calls.')
  }

  // An action can fail when it throws or calls one that does. Only a property that shows the
  // failure, such as MRefreshControl's refresh, takes a handler that can.
  const nested = (statements) =>
    statements.flatMap((statement) => [
      statement,
      ...nested(statement.then ?? []),
      ...nested(statement.else ?? []),
    ])
  function failing(component, statements, seen = new Set()) {
    for (const statement of nested(statements)) {
      if (statement.s === 'throw') return statement
      if (statement.s !== 'action' || seen.has(statement.name)) continue
      seen.add(statement.name)
      const called = component.actions.find((action) => action.name === statement.name)
      if (called && failing(component, called.body, seen)) return statement
    }
    return null
  }
  function cannotFail(handled, component, node, what) {
    const call = handled?.body && failing(component, handled.body)
    if (call)
      fail(
        node,
        `${call.name} can fail, and ${what} has no way to show it. Pass it to MRefreshControl's refresh, or check before calling it.`,
      )
  }
  /** Marks the actions that can fail, for the outputs that must say so. */
  function markFailing(component) {
    for (const action of component.actions)
      if (failing(component, action.body, new Set([action.name]))) action.throws = true
  }

  function narrowing(test, ctx) {
    if (!ts.isBinaryExpression(test)) return null
    const kind = test.operatorToken.kind
    const op =
      kind === ts.SyntaxKind.EqualsEqualsEqualsToken
        ? '==='
        : kind === ts.SyntaxKind.ExclamationEqualsEqualsToken
          ? '!=='
          : null
    const sides = [test.left, test.right]
    const missing = (side) => isUndefined(side) || (ctx.dialect.nullish && isNull(side))
    const named = sides.find((side) => ts.isIdentifier(side) && side.text !== 'undefined')
    const other = sides.find((side) => side !== named)
    if (!op || !named || !missing(other)) return null
    const type = ctx.locals.get(named.text)
    if (type?.k !== 'optional') return null
    return { op, name: named.text, inner: type.of }
  }

  function returnsOnly(node) {
    if (ts.isReturnStatement(node)) return !node.expression
    return ts.isBlock(node) && node.statements.length === 1 && returnsOnly(node.statements[0])
  }

  function effect(node, ctx) {
    if (ctx.mode !== 'action') fail(node, 'Changes are only allowed in actions and event handlers.')
    if (ts.isParenthesizedExpression(node)) return effect(node.expression, ctx)
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind
      const ops = {
        [ts.SyntaxKind.EqualsToken]: '=',
        [ts.SyntaxKind.PlusEqualsToken]: '+=',
        [ts.SyntaxKind.MinusEqualsToken]: '-=',
      }
      if (!ops[op]) fail(node, 'Use =, += or -= to change state.')
      const target = ctx.dialect.target(node.left, ctx)
      if (ops[op] === '-=' && target.type.k !== 'number') fail(node, '-= needs a number.')
      if (ops[op] === '+=' && !['number', 'string'].includes(target.type.k))
        fail(node, '+= needs a number or a string.')
      const value = expr(node.right, ctx, ops[op] === '=' ? target.type : undefined)
      if (ops[op] === '+=' && target.type.k === 'number' && value.type.k !== 'number')
        fail(node.right, 'Adding to a number needs a number.')
      if (ops[op] === '+=' && target.type.k === 'string' && !primitive(value.type))
        fail(node.right, 'Only strings, numbers and booleans can be appended to text.')
      return { s: 'assign', target, op: ops[op], value }
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      const op =
        node.operator === ts.SyntaxKind.PlusPlusToken
          ? '+='
          : node.operator === ts.SyntaxKind.MinusMinusToken
            ? '-='
            : null
      if (!op) fail(node, 'Unsupported statement.')
      const target = ctx.dialect.target(node.operand, ctx)
      if (target.type.k !== 'number') fail(node, '++ and -- need a number.')
      return { s: 'assign', target, op, value: { e: 'lit', value: 1, type: T.number } }
    }
    if (ts.isCallExpression(node)) {
      const own = ctx.dialect.effect(node, ctx)
      if (own) return own
      const callee = node.expression
      if (ts.isPropertyAccessExpression(callee) && !callee.questionDotToken) {
        const owner = callee.expression
        const method = callee.name.text
        if (['push', 'unshift', 'splice'].includes(method)) {
          const target = ctx.dialect.target(owner, ctx)
          if (target.type.k !== 'array') fail(owner, `${method} needs a state array.`)
          if (method === 'splice') {
            if (node.arguments.length < 2 || node.arguments.length > 3)
              fail(node, 'Use splice(start, deleteCount) or splice(start, 0, item).')
            return {
              s: 'splice',
              target,
              start: expr(node.arguments[0], ctx, T.number),
              deleteCount: expr(node.arguments[1], ctx, T.number),
              items: node.arguments.slice(2).map((arg) => expr(arg, ctx, target.type.of)),
            }
          }
          if (node.arguments.length !== 1) fail(node, `${method} takes one item.`)
          return { s: method, target, value: expr(node.arguments[0], ctx, target.type.of) }
        }
      }
      ctx.dialect.unknownEffect(node, ctx)
    }
    fail(node, 'Supported statements: const, if/else, return, state assignments and calls.')
  }

  /** The arguments of a call, each read as the type its parameter declares. */
  function args(node, values, types, ctx) {
    if (values.length !== types.length) fail(node, `Expected ${types.length} argument(s).`)
    return values.map((arg, i) => expr(arg, ctx, types[i]))
  }

  function expect(node, actual, expected) {
    if (!expected) return
    if (sameType(actual, expected)) return
    if (expected.k === 'optional' && sameType(actual, expected.of)) return
    fail(node, `Expected ${describe(expected)}, found ${describe(actual)}.`)
  }

  function expr(node, ctx, expected) {
    let result = build(node, ctx, expected)
    if (ctx.dialect.truthy && expected?.k === 'boolean') result = condition(result, node)
    expect(node, result.type, expected)
    return result
  }

  // JavaScript reads text, a missing value and a length as conditions; say the same comparison.
  function condition(value, node) {
    const differs = (right) => ({ e: 'binary', op: '!==', left: value, right, type: T.boolean })
    const { type } = value
    const empty = { e: 'lit', value: '', type: T.string }
    if (type.k === 'string') return differs(empty)
    if (type.k === 'optional' && ['record', 'array'].includes(type.of.k))
      return differs({ e: 'undefined', type })
    if (type.k === 'optional' && type.of.k === 'string')
      return {
        ...differs(empty),
        left: { e: 'logical', op: '??', left: value, right: empty, type: T.string },
      }
    if (type.k === 'optional' && type.of.k === 'boolean')
      return {
        e: 'logical',
        op: '??',
        left: value,
        right: { e: 'lit', value: false, type: T.boolean },
        type: T.boolean,
      }
    if (value.e === 'length') return differs({ e: 'lit', value: 0, type: T.number })
    if (type.k === 'number')
      fail(node, 'A number is not a condition on every target; compare it, for example count > 0.')
    return value
  }

  function build(node, ctx, expected) {
    if (ts.isParenthesizedExpression(node)) return build(node.expression, ctx, expected)
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      if (ctx.mode !== 'initializer')
        fail(node, 'Type assertions are only allowed in initial state values.')
      return build(node.expression, ctx, typeOf(node))
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return { e: 'lit', value: node.text, type: T.string }
    if (ts.isNumericLiteral(node)) {
      const value = Number(node.text)
      if (!Number.isFinite(value)) fail(node, 'Numbers must be finite.')
      return { e: 'lit', value, type: T.number }
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) return { e: 'lit', value: true, type: T.boolean }
    if (node.kind === ts.SyntaxKind.FalseKeyword) return { e: 'lit', value: false, type: T.boolean }
    if (ctx.dialect.nullish && isNull(node)) {
      if (expected?.k !== 'optional') fail(node, 'null is only allowed where a value is optional.')
      return { e: 'undefined', type: expected }
    }
    if (ts.isIdentifier(node)) {
      if (node.text === 'undefined') {
        if (expected?.k !== 'optional')
          fail(node, 'undefined is only allowed where a value is optional.')
        return { e: 'undefined', type: expected }
      }
      if (ctx.locals.has(node.text))
        return {
          e: 'local',
          name: ctx.renamed?.get(node.text) ?? node.text,
          type: ctx.locals.get(node.text),
        }
      return ctx.dialect.name(node, ctx)
    }
    if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text]
      for (const span of node.templateSpans) {
        const value = expr(span.expression, ctx)
        if (value.type.k === 'optional' && primitive(value.type.of))
          fail(
            span.expression,
            "This value may be missing in every target, whatever was checked before; give it a fallback, for example value ?? ''.",
          )
        if (!primitive(value.type))
          fail(span.expression, 'Only strings, numbers and booleans can be placed in text.')
        parts.push(value, span.literal.text)
      }
      return { e: 'template', parts: parts.filter((part) => part !== ''), type: T.string }
    }
    if (ts.isPropertyAccessExpression(node)) return access(node, ctx)
    if (ts.isElementAccessExpression(node)) {
      if (node.questionDotToken) fail(node, 'Use list[index] and check the result for undefined.')
      const object = expr(node.expression, ctx)
      if (object.type.k !== 'array') fail(node.expression, 'Index access works on arrays.')
      const index = expr(node.argumentExpression, ctx, T.number)
      return { e: 'index', object, index, type: T.optional(object.type.of) }
    }
    if (ts.isCallExpression(node)) return call(node, ctx)
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.ExclamationToken) {
        const arg = expr(node.operand, ctx, T.boolean)
        if (fixed(arg)) return constant(!arg.value)
        return { e: 'unary', op: '!', arg, type: T.boolean }
      }
      if (node.operator === ts.SyntaxKind.MinusToken) {
        const arg = expr(node.operand, ctx, T.number)
        if (arg.e === 'lit') return { e: 'lit', value: -arg.value, type: T.number }
        return { e: 'unary', op: '-', arg, type: T.number }
      }
      fail(node, 'Only ! and - are supported as prefix operators.')
    }
    if (ts.isBinaryExpression(node)) return binary(node, ctx, expected)
    if (ts.isConditionalExpression(node)) {
      const test = expr(node.condition, ctx, T.boolean)
      const type = expected ?? typeOf(node)
      // x === undefined ? a : b narrows x in b, and !== narrows it in a, like TypeScript.
      const narrow = narrowing(node.condition, ctx)
      const branch = (side, narrowed) => {
        if (!narrowed) return expr(side, ctx, type)
        const inner = child(ctx)
        inner.locals.set(narrow.name, narrow.inner)
        return expr(side, inner, type)
      }
      const then = branch(node.whenTrue, narrow?.op === '!==')
      const otherwise = branch(node.whenFalse, narrow?.op === '===')
      if (fixed(test)) return test.value ? then : otherwise
      return {
        e: 'cond',
        test,
        then,
        else: otherwise,
        type,
        ...(narrow ? { narrow: { name: narrow.name, op: narrow.op } } : {}),
      }
    }
    if (ts.isObjectLiteralExpression(node)) return record(node, ctx, expected)
    if (ts.isArrayLiteralExpression(node)) {
      const type = expected?.k === 'array' ? expected : typeOf(node)
      if (type.k !== 'array') fail(node, 'Give this array an element type.')
      return {
        e: 'array',
        items: node.elements.map((element) => {
          if (ts.isSpreadElement(element)) fail(element, 'Array spread is not supported.')
          return expr(element, ctx, type.of)
        }),
        type,
      }
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node))
      fail(node, 'JSX is only allowed in the returned screen, Show and For.')
    fail(node, 'This expression is not part of the portable subset yet.')
  }

  function access(node, ctx) {
    const own = ctx.dialect.member(node, ctx)
    if (own) return own
    const owner = node.expression
    const name = node.name.text
    const object = expr(owner, ctx)
    const base = node.questionDotToken
      ? object.type.k === 'optional'
        ? object.type.of
        : fail(node, '?. needs an optional value.')
      : object.type
    if (!node.questionDotToken && object.type.k === 'optional')
      fail(node, `This value may be undefined; use ?. or check it first.`)
    if (name === 'length' && (base.k === 'string' || base.k === 'array')) {
      if (node.questionDotToken) fail(node, 'Use ?? with length, or check the value first.')
      return { e: 'length', object, type: T.number }
    }
    if (base.k === 'record') {
      const field = records.get(base.name).fields.find((f) => f.name === name)
      if (!field) fail(node, `${base.name} has no field ${name}.`)
      const type =
        node.questionDotToken && field.type.k !== 'optional' ? T.optional(field.type) : field.type
      return { e: 'field', object, name, optional: Boolean(node.questionDotToken), type }
    }
    fail(node, `${name} is not available on ${describe(base)}.`)
  }

  function call(node, ctx) {
    ctx.dialect.call?.(node, ctx)
    const callee = node.expression
    if (!ts.isPropertyAccessExpression(callee) || callee.questionDotToken)
      fail(node, 'Only listed string, array and Math methods can be called in expressions.')
    const method = callee.name.text
    if (ts.isIdentifier(callee.expression) && callee.expression.text === 'Math') {
      if (!(method in mathFunctions)) fail(callee, `Math.${method} is not supported.`)
      if (node.arguments.length !== mathFunctions[method])
        fail(node, `Math.${method} takes ${mathFunctions[method]} argument(s).`)
      return {
        e: 'math',
        fn: method,
        args: node.arguments.map((arg) => expr(arg, ctx, T.number)),
        type: T.number,
      }
    }
    const object = expr(callee.expression, ctx)
    if (object.type.k === 'optional') fail(callee, 'This value may be undefined; check it first.')
    if (object.type.k === 'string') {
      const signature = stringMethods[method]
      if (!signature) fail(callee, `String method ${method} is not supported.`)
      return {
        e: 'call',
        method,
        object,
        args: args(node, node.arguments, signature[0], ctx),
        type: signature[1],
      }
    }
    if (object.type.k === 'array') {
      const element = object.type.of
      const callback = (returns) => {
        if (node.arguments.length !== 1) fail(node, `${method} takes one callback.`)
        return arrow(node.arguments[0], [element], returns, ctx)
      }
      switch (method) {
        case 'filter':
          return { e: 'call', method, object, args: [callback(T.boolean)], type: object.type }
        case 'some':
        case 'every':
          return { e: 'call', method, object, args: [callback(T.boolean)], type: T.boolean }
        case 'find':
          return {
            e: 'call',
            method,
            object,
            args: [callback(T.boolean)],
            type: T.optional(element),
          }
        case 'findIndex':
          return { e: 'call', method, object, args: [callback(T.boolean)], type: T.number }
        case 'map': {
          const fn = callback(undefined)
          if (fn.body.type.k === 'optional' || fn.body.type.k === 'void')
            fail(node.arguments[0], 'map must return a value.')
          return { e: 'call', method, object, args: [fn], type: T.array(fn.body.type) }
        }
        case 'includes':
          if (!primitive(element))
            fail(callee, 'includes works on arrays of strings, numbers or booleans.')
          return {
            e: 'call',
            method,
            object,
            args: args(node, node.arguments, [element], ctx),
            type: T.boolean,
          }
        case 'slice': {
          if (node.arguments.length < 1 || node.arguments.length > 2)
            fail(node, 'Use slice(start) or slice(start, end).')
          return {
            e: 'call',
            method,
            object,
            args: node.arguments.map((arg) => expr(arg, ctx, T.number)),
            type: object.type,
          }
        }
        case 'toSorted': {
          if (node.arguments.length !== 1) fail(node, 'toSorted takes a compare function.')
          const compare = arrow(node.arguments[0], [element, element], T.number, ctx)
          return { e: 'call', method, object, args: [compare], type: object.type }
        }
        case 'join':
          if (element.k !== 'string') fail(callee, 'join works on arrays of strings.')
          return {
            e: 'call',
            method,
            object,
            args: args(node, node.arguments, [T.string], ctx),
            type: T.string,
          }
        default:
          fail(callee, `Array method ${method} is not supported in expressions.`)
      }
    }
    fail(callee, `${method} is not available on ${describe(object.type)}.`)
  }

  function arrow(node, types, returns, ctx) {
    if (
      !ts.isArrowFunction(node) ||
      node.parameters.length !== types.length ||
      ts.isBlock(node.body)
    )
      fail(
        node,
        types.length === 1
          ? 'Use a one-parameter arrow with an expression body, for example (task) => task.done.'
          : 'Use a two-parameter arrow with an expression body, for example (a, b) => a.rank - b.rank.',
      )
    const inner = child(ctx)
    const params = node.parameters.map((parameter, i) => {
      if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken)
        fail(parameter, 'Use a simple parameter name.')
      checkName(parameter, parameter.name.text, 'Parameter')
      inner.locals.set(parameter.name.text, types[i])
      return parameter.name.text
    })
    const body = expr(node.body, inner, returns)
    return { e: 'arrow', params, types, body, type: types[0] }
  }

  // && and || where the format lets them pick a value rather than combine conditions.
  function chosen(node, op, ctx) {
    const left = expr(node.left, ctx)
    const right = expr(node.right, ctx)
    if (left.type.k === 'boolean' && right.type.k === 'boolean')
      return fixed(left) || fixed(right)
        ? combined(op, left, right)
        : { e: 'logical', op, left, right, type: T.boolean }
    if (op === '||' && left.type.k === 'string' && right.type.k === 'string')
      return {
        e: 'cond',
        test: condition(left, node.left),
        then: left,
        else: right,
        type: T.string,
      }
    fail(
      node,
      `${op} picks one of two values here; write the choice as a condition, for example a ? b : c.`,
    )
  }

  // One side is known while generating: what is left of the condition.
  function combined(op, left, right) {
    const [known, other] = fixed(left) ? [left, right] : [right, left]
    return known.value === (op === '||') ? known : other
  }

  function binary(node, ctx, expected) {
    const kind = node.operatorToken.kind
    const K = ts.SyntaxKind
    if (kind === K.AmpersandAmpersandToken || kind === K.BarBarToken) {
      const op = kind === K.AmpersandAmpersandToken ? '&&' : '||'
      if (ctx.dialect.truthy && expected?.k !== 'boolean') return chosen(node, op, ctx)
      const left = expr(node.left, ctx, T.boolean)
      const right = expr(node.right, ctx, T.boolean)
      if (fixed(left) || fixed(right)) return combined(op, left, right)
      return { e: 'logical', op, left, right, type: T.boolean }
    }
    if (kind === K.QuestionQuestionToken) {
      const left = expr(node.left, ctx)
      if (left.type.k !== 'optional') fail(node.left, '?? needs an optional value on the left.')
      const right = expr(node.right, ctx, expected?.k === 'optional' ? expected : left.type.of)
      return { e: 'logical', op: '??', left, right, type: right.type }
    }
    if (kind === K.EqualsEqualsToken || kind === K.ExclamationEqualsToken)
      fail(node, 'Use === and !==.')
    if (kind === K.EqualsEqualsEqualsToken || kind === K.ExclamationEqualsEqualsToken) {
      const op = kind === K.EqualsEqualsEqualsToken ? '===' : '!=='
      const missing = (side) => isUndefined(side) || (ctx.dialect.nullish && isNull(side))
      const leftUndefined = missing(node.left)
      const rightUndefined = missing(node.right)
      if (leftUndefined || rightUndefined) {
        const [absent, present] = leftUndefined ? [node.left, node.right] : [node.right, node.left]
        const value = expr(present, ctx)
        if (value.type.k !== 'optional')
          fail(node, 'Only optional values can be compared with undefined.')
        if (ctx.dialect.nullish) sameAbsence(absent, present, node)
        return {
          e: 'binary',
          op,
          left: value,
          right: { e: 'undefined', type: value.type },
          type: T.boolean,
        }
      }
      const left = expr(node.left, ctx)
      const right = expr(node.right, ctx)
      const base = (type) => (type.k === 'optional' ? type.of : type)
      if (!primitive(base(left.type)) || !sameType(base(left.type), base(right.type)))
        fail(
          node,
          'Compare strings, numbers or booleans of the same type. Records and arrays are compared by identity in JavaScript and by value in Swift.',
        )
      if (left.e === 'lit' && right.e === 'lit' && (left.fixed || right.fixed))
        return constant((left.value === right.value) === (op === '==='))
      return { e: 'binary', op, left, right, type: T.boolean }
    }
    const arithmetic = {
      [K.MinusToken]: '-',
      [K.AsteriskToken]: '*',
      [K.SlashToken]: '/',
      [K.PercentToken]: '%',
    }
    const comparison = {
      [K.LessThanToken]: '<',
      [K.LessThanEqualsToken]: '<=',
      [K.GreaterThanToken]: '>',
      [K.GreaterThanEqualsToken]: '>=',
    }
    if (kind === K.PlusToken) {
      const left = expr(node.left, ctx)
      const right = expr(node.right, ctx)
      if (left.type.k === 'number' && right.type.k === 'number')
        return { e: 'binary', op: '+', left, right, type: T.number }
      if (
        (left.type.k === 'string' || right.type.k === 'string') &&
        primitive(left.type) &&
        primitive(right.type)
      )
        return { e: 'binary', op: 'concat', left, right, type: T.string }
      fail(node, '+ adds two numbers or joins text with strings, numbers or booleans.')
    }
    if (arithmetic[kind])
      return {
        e: 'binary',
        op: arithmetic[kind],
        left: expr(node.left, ctx, T.number),
        right: expr(node.right, ctx, T.number),
        type: T.number,
      }
    if (comparison[kind]) {
      const left = expr(node.left, ctx)
      const right = expr(node.right, ctx)
      if (left.type.k === 'string' && right.type.k === 'string')
        return { e: 'binary', op: comparison[kind], strings: true, left, right, type: T.boolean }
      if (left.type.k !== 'number' || right.type.k !== 'number')
        fail(node, `${comparison[kind]} compares two numbers or two strings.`)
      return { e: 'binary', op: comparison[kind], left, right, type: T.boolean }
    }
    fail(node, `Operator ${node.operatorToken.getText()} is not supported.`)
  }

  // null and undefined both become "missing" in the model; the source may only test the one
  // its value can really hold, or the targets would answer differently.
  function sameAbsence(absent, present, node) {
    const type = checker.getTypeAtLocation(present)
    const parts = type.flags & ts.TypeFlags.Union ? type.types : [type]
    const wanted = isNull(absent) ? ts.TypeFlags.Null : ts.TypeFlags.Undefined
    if (!parts.some((part) => part.flags & wanted))
      fail(
        node,
        isNull(absent)
          ? 'This value is never null; compare it with undefined.'
          : 'This value is never undefined; compare it with null.',
      )
  }

  function record(node, ctx, expected) {
    const [first] = node.properties
    // { ...task, done } copies task's record type.
    const copied =
      first && ts.isSpreadAssignment(first) ? expr(first.expression, ctx).type : undefined
    const type =
      expected?.k === 'record'
        ? expected
        : expected?.k === 'optional' && expected.of.k === 'record'
          ? expected.of
          : copied?.k === 'record'
            ? copied
            : typeOf(node)
    if (type.k !== 'record')
      fail(node, 'Object literals create records; give them a named record type.')
    const definition = records.get(type.name)
    let spread
    const fields = new Map()
    node.properties.forEach((property, index) => {
      if (ts.isSpreadAssignment(property)) {
        if (index !== 0) fail(property, 'Put ...spread first.')
        spread = expr(property.expression, ctx, type)
        return
      }
      let name, value
      if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        name = property.name.text
        value = property.initializer
      } else if (ts.isShorthandPropertyAssignment(property)) {
        name = property.name.text
        value = property.name
      } else fail(property, 'Use name: value fields.')
      const field = definition.fields.find((f) => f.name === name)
      if (!field) fail(property, `${type.name} has no field ${name}.`)
      if (fields.has(name)) fail(property, `${name} is set twice.`)
      fields.set(name, expr(value, ctx, field.type))
    })
    if (!spread)
      for (const field of definition.fields)
        if (!fields.has(field.name)) {
          if (field.type.k !== 'optional') fail(node, `${type.name} needs ${field.name}.`)
          fields.set(field.name, { e: 'undefined', type: field.type })
        }
    return {
      e: 'record',
      name: type.name,
      spread,
      fields: [...fields].map(([name, value]) => ({ name, value })),
      type,
    }
  }

  function handler(node, params, ctx) {
    if (!ts.isArrowFunction(node)) fail(node, 'Event handlers are arrow functions.')
    // Like JavaScript, a handler may ignore trailing arguments.
    if (node.parameters.length > params.length)
      fail(node, `This handler receives ${params.length} argument(s).`)
    const inner = child(ctx, 'action')
    const names = node.parameters.map((parameter, i) => {
      if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken)
        fail(parameter, 'Use simple parameter names.')
      const name = parameter.name.text
      checkName(parameter, name, 'Parameter')
      inner.locals.set(name, params[i])
      return { name, type: params[i] }
    })
    for (const type of params.slice(names.length)) names.push({ name: '_', type, unused: true })
    return { params: names, body: block(node.body, inner) }
  }

  // Slots: content a parent passes to a component. Each front end finds them in its format and
  // reads them with these, so both formats produce the same model and the same checks.

  /** A slot's properties, from the type of the object it hands its content. */
  function slotParams(type, node) {
    if (!type) return []
    return checker.getPropertiesOfType(type).map((property) => {
      const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? node
      checkName(declaration, property.name, 'Slot property')
      // <slot :name> and <slot :key> are the slot's own name and key in Vue.
      if (['name', 'key'].includes(property.name))
        fail(
          declaration,
          `A slot cannot hand its content a property called ${property.name}: Vue reads :${property.name} on <slot> as the slot's own ${property.name}. Call it something else.`,
        )
      if (property.flags & ts.SymbolFlags.Optional)
        fail(declaration, "A slot always hands its content every property; drop the '?'.")
      const type = mapType(checker.getTypeOfSymbolAtLocation(property, node), declaration)
      if (type.k === 'function' || type.k === 'void')
        fail(declaration, 'A slot hands its content data, not functions.')
      return { name: property.name, type }
    })
  }

  /**
   * A component's slots, in the order given (where its view shows them first), the default slot
   * last. entries: [{ name, params, node }].
   */
  function declareSlots(component, entries) {
    const slots = []
    for (const { name, params, node } of entries) {
      if (slots.some((slot) => slot.name === name)) continue
      const problem = slotProblem(name)
      if (problem) fail(node, `The slot ${name} ${problem}`)
      slots.push({ name, params })
    }
    component.slots = [
      ...slots.filter((slot) => slot.name !== 'default'),
      ...slots.filter((slot) => slot.name === 'default'),
    ]
  }

  /**
   * Where a component shows a slot. given maps each property the source passes to its value's
   * expression; fallback is the view shown when the parent passed nothing.
   */
  function slotSite(component, name, given, fallback, node, ctx) {
    const slot = component.slots.find((item) => item.name === name)
    if (!slot) fail(node, `${name} is not a slot of ${component.name}.`)
    for (const [key, value] of given)
      if (!slot.params.some((param) => param.name === key))
        fail(
          value,
          slot.params.length
            ? `The slot ${name} hands its content ${slot.params.map((param) => param.name).join(', ')}, not ${key}.`
            : `The slot ${name} hands its content nothing; declare ${key} with the slot first.`,
        )
    const args = slot.params.map((param) => {
      if (!given.has(param.name))
        fail(node, `Give the slot ${name} its property ${param.name}: every target hands it over.`)
      return { name: param.name, value: expr(given.get(param.name), ctx, param.type) }
    })
    return { v: 'slot', name, args, fallback }
  }

  /**
   * Content a parent passes to target's slot. parameter is the function that receives a scoped
   * slot's properties, taken apart by name; build reads the content in the scope it makes.
   */
  function slotContent(target, name, parameter, node, ctx, build) {
    const slot = target.slots.find((item) => item.name === name)
    if (!slot)
      fail(
        node,
        `${target.name} has no slot ${name}; ${target.slots.length ? `its slots are ${target.slots.map((item) => item.name).join(', ')}` : 'it shows no slots'}.`,
      )
    const taken = new Map()
    if (parameter) {
      if (!ts.isObjectBindingPattern(parameter.name))
        fail(parameter, "Take the slot's properties apart by name, for example { item }.")
      for (const element of parameter.name.elements) {
        const property = (element.propertyName ?? element.name).getText()
        if (element.initializer || element.dotDotDotToken || !ts.isIdentifier(element.name))
          fail(element, 'Take each property of the slot by its name, without a default.')
        if (!slot.params.some((param) => param.name === property))
          fail(
            element,
            slot.params.length
              ? `The slot ${name} of ${target.name} hands its content ${slot.params.map((param) => param.name).join(', ')}, not ${property}.`
              : `The slot ${name} of ${target.name} hands its content nothing.`,
          )
        checkName(element, element.name.text, 'Parameter')
        taken.set(property, element.name.text)
      }
    }
    const inner = { ...child(ctx), parent: undefined, keyed: false, inSlot: true }
    const params = slot.params.map((param) =>
      taken.has(param.name)
        ? { param: param.name, name: taken.get(param.name), type: param.type }
        : { param: param.name, name: '_', type: param.type, unused: true },
    )
    for (const param of params) if (!param.unused) inner.locals.set(param.name, param.type)
    const body = build(inner)
    deferred.push({
      node,
      check: (find) => fillable(target, name, body, ctx.component, find, node),
    })
    return { name, params, body }
  }

  /**
   * Content for a primitive's slot that hands its content properties, such as MMasonry's item:
   * params are what the slot hands, as { name, type }; parameter is the function that receives
   * them, taken apart by name. The content repeats, like a list's rows.
   */
  function elementSlot(tag, name, params, parameter, node, ctx, build) {
    const taken = new Map()
    if (!parameter)
      fail(
        node,
        `The ${name} slot of ${tag} hands its content ${params.map((param) => param.name).join(', ')}: take what you need, as ({ ${params[0].name} }) => <…/>.`,
      )
    if (!ts.isObjectBindingPattern(parameter.name))
      fail(
        parameter,
        `Take the slot's properties apart by name, for example { ${params[0].name} }.`,
      )
    for (const element of parameter.name.elements) {
      const property = (element.propertyName ?? element.name).getText()
      if (element.initializer || element.dotDotDotToken || !ts.isIdentifier(element.name))
        fail(element, 'Take each property of the slot by its name, without a default.')
      if (!params.some((param) => param.name === property))
        fail(
          element,
          `The ${name} slot of ${tag} hands its content ${params.map((param) => param.name).join(', ')}, not ${property}.`,
        )
      checkName(element, element.name.text, 'Parameter')
      taken.set(property, element.name.text)
    }
    const inner = { ...child(ctx), parent: { tag }, keyed: false, inSlot: true, inFor: true }
    const handed = params.map((param) =>
      taken.has(param.name)
        ? { param: param.name, name: taken.get(param.name), type: param.type }
        : { param: param.name, name: '_', type: param.type, unused: true },
    )
    for (const param of handed) if (!param.unused) inner.locals.set(param.name, param.type)
    return { name, params: handed, body: build(inner) }
  }

  /** listRef.scrollToIndex(index): what an action asks of an MVirtualList. */
  function scrollToIndex(node, ref, ctx) {
    if (node.expression.name.text !== 'scrollToIndex' || node.arguments.length !== 1)
      fail(node.expression, 'List references support scrollToIndex(index).')
    return { s: 'scroll', ref, index: expr(node.arguments[0], ctx, T.number) }
  }

  // Checks on content that need the view of the component it goes to, once every view is read.
  const deferred = []

  function fillable(target, name, body, owner, find, node) {
    let shown = 0
    let repeated = false
    let fallback = false
    // Content passed on to another component may be shown any number of times there.
    const visit = (view, inList) => {
      if (view.v === 'slot' && view.name === name) {
        shown++
        repeated ||= inList
        fallback ||= view.fallback.length > 0
      }
      for (const item of children(view))
        visit(item, inList || view.v === 'for' || view.v === 'component')
    }
    visit(target.view, false)
    if (fallback && !always(body, owner, find, new Set()))
      fail(
        node,
        `${target.name} shows its own content for ${name} when it gets none, and the Web and NativeScript show it as well when the content passed renders nothing, which the Mac cannot tell. Make this content always show something, or leave ${name} out.`,
      )
    // Each copy of a field would take the same focus on the Mac.
    let field = false
    for (const view of body) walk(view, (item) => (field ||= item.tag === 'MInput'))
    if (field && (shown > 1 || repeated))
      fail(
        node,
        `${target.name} shows ${name} more than once, so an MInput in this content would be repeated, and on the Mac the copies would share one focus. Move it out of the content.`,
      )
  }

  // Whether content shows something whatever the state: then a slot's fallback never applies.
  function always(nodes, owner, find, seen) {
    return nodes.some((node) => {
      if (node.v === 'element' || node.v === 'text') return true
      if (node.v === 'show')
        return always(node.then, owner, find, seen) && always(node.else, owner, find, seen)
      if (node.v !== 'component') return false
      const path = owner.imports.get(node.name)
      if (seen.has(path)) return false
      const target = find(path).component
      return always([target.view], target, find, new Set([...seen, path]))
    })
  }

  /**
   * The properties of a Mavis primitive. `attrs` maps each property the source sets to the node
   * that sets it; `source.value(node)` is its value's expression, or undefined when the
   * property is written alone, and `source.isLiteral(node)` whether that value is a literal.
   * A format whose listeners are not arrow functions reads them itself with `source.read`.
   */
  function properties(name, attrs, tag, ctx, source) {
    const spec = primitives[name]
    const props = {}
    for (const [key, attribute] of attrs) {
      if (key === 'key') continue
      const kind = spec.props[key]
      if (!kind) fail(attribute, `${name} supports ${Object.keys(spec.props).join(', ')}.`)
      const own = source.read?.(key, attribute, kind)
      if (own) {
        props[key] = own
        continue
      }
      const value = settled(source.value(attribute), ctx)
      if (value === undefined) {
        if (kind !== 'boolean') fail(attribute, `${key} needs a value.`)
        props[key] = { expr: { e: 'lit', value: true, type: T.boolean } }
        continue
      }
      const read = typeof kind === 'function' ? kind : kinds[kind]
      props[key] = read({
        key,
        attribute,
        value,
        ctx,
        fail,
        expr,
        handler,
        arrow,
        record: builtInRecord,
        fields: (name) => records.get(name)?.fields ?? [],
        checker,
        T,
        ts,
      })
    }
    for (const [key, attribute] of attrs)
      if (!spec.failing?.includes(key))
        cannotFail(props[key], ctx.component, attribute, `${key} of ${name}`)
    for (const required of spec.required ?? [])
      if (!props[required]) fail(tag, `${name} needs ${required}.`)
    spec.check?.({
      tag,
      props,
      attrs,
      fail,
      isLiteral: source.isLiteral,
      fields: (name) => records.get(name)?.fields ?? [],
    })
    return props
  }

  // a ? b : c where a is known while generating is b or c itself, so a token written per
  // platform is still a literal.
  function settled(node, ctx) {
    while (node && ctx.dialect.constants) {
      if (ts.isParenthesizedExpression(node)) node = node.expression
      else if (ts.isConditionalExpression(node)) {
        const test = expr(node.condition, ctx, T.boolean)
        if (!fixed(test)) break
        node = test.value ? node.whenTrue : node.whenFalse
      } else break
    }
    return node
  }

  /** One value shown inside a text: literals and templates join the text around them. */
  function shown(parts, value, node) {
    if (!primitive(value.type)) fail(node, 'MText shows strings, numbers and booleans.')
    if (value.e === 'lit' && value.type.k === 'string') parts.push(value.value)
    else if (value.e === 'template') parts.push(...value.parts)
    else parts.push(value)
  }

  /** Text parts with neighbouring strings joined, however the source split them. */
  function joinText(parts) {
    const out = []
    for (const part of parts)
      if (typeof part === 'string' && typeof out.at(-1) === 'string') out[out.length - 1] += part
      else out.push(part)
    return out
  }

  /** The field that identifies a repeated item, or null when the item is its own key. */
  function listKey(keyNode, itemName, each, example = `key={${itemName}.id}`) {
    if (ts.isIdentifier(keyNode) && keyNode.text === itemName && primitive(each.type.of))
      return null
    if (
      ts.isPropertyAccessExpression(keyNode) &&
      ts.isIdentifier(keyNode.expression) &&
      keyNode.expression.text === itemName &&
      each.type.of.k === 'record'
    ) {
      const field = records.get(each.type.of.name).fields.find((f) => f.name === keyNode.name.text)
      if (!field || !['string', 'number'].includes(field.type.k))
        fail(keyNode, 'The key must be a string or number field of the item.')
      return field.name
    }
    fail(
      keyNode,
      `Use a field of ${itemName} as key, for example ${example}, or the item itself for a list of strings or numbers.`,
    )
  }

  return {
    checker,
    lenient,
    fail,
    mapType,
    typeOf,
    declaredType,
    checkName,
    hasControl,
    placeScreen,
    useComponent,
    withoutControls,
    readTypesFile,
    scope,
    child,
    local,
    block,
    statement: stmt,
    expr,
    args,
    expect,
    handler,
    handlerParams,
    properties,
    shown,
    joinText,
    listKey,
    constant,
    slotParams,
    declareSlots,
    slotSite,
    slotContent,
    elementSlot,
    cannotFail,
    markFailing,
    scrollToIndex,
    record: builtInRecord,
    fields: (name) => records.get(name)?.fields ?? [],
    deferred,
    /** The record types every component named, in the order they were first used. */
    finish: () => [...records.values()].map(({ declaration, ...record }) => record),
  }
}
